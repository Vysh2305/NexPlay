import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, auctionsTable, bidsTable, franchisesTable, playerProfilesTable, teamPlayersTable, usersTable, gamesTable } from "@workspace/db";
import { createNotificationForUsers } from "./notifications";
import {
  CreateAuctionBody,
  GetAuctionParams,
  StartAuctionParams,
  CloseAuctionParams,
  ListBidsParams,
  PlaceBidBody,
  ListAuctionsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

async function buildAuction(a: typeof auctionsTable.$inferSelect) {
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, a.gameId));
  const bids = await db.select().from(bidsTable).where(eq(bidsTable.auctionId, a.id));
  const players = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.gameId, a.gameId));
  return {
    id: a.id,
    gameId: a.gameId,
    gameName: game?.name ?? "",
    status: a.status,
    startTime: a.startTime,
    endTime: a.endTime,
    playerCount: players.length,
    bidCount: bids.length,
    createdAt: a.createdAt,
  };
}

router.get("/auctions", async (req, res): Promise<void> => {
  const query = ListAuctionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  let rows = await db.select().from(auctionsTable).orderBy(auctionsTable.createdAt);
  if (query.data.gameId) {
    rows = rows.filter(a => a.gameId === query.data.gameId);
  }
  const result = await Promise.all(rows.map(buildAuction));
  res.json(result);
});

router.post("/auctions", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateAuctionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [a] = await db.insert(auctionsTable).values({
    gameId: parsed.data.gameId,
    endTime: new Date(parsed.data.endTime),
    status: "pending",
  }).returning();
  res.status(201).json(await buildAuction(a));
});

router.get("/auctions/:auctionId", async (req, res): Promise<void> => {
  const params = GetAuctionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [a] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, params.data.auctionId));
  if (!a) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }
  res.json(await buildAuction(a));
});

router.post("/auctions/:auctionId/start", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = StartAuctionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [a] = await db.update(auctionsTable)
    .set({ status: "open", startTime: new Date() })
    .where(eq(auctionsTable.id, params.data.auctionId))
    .returning();
  if (!a) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, a.gameId));
  const allUsers = await db.select({ userId: usersTable.id }).from(usersTable)
    .where(eq(usersTable.role, "player"));
  const allFOwners = await db.select({ userId: usersTable.id }).from(usersTable)
    .where(eq(usersTable.role, "franchise_owner"));
  const notifyIds = [...allUsers.map(u => u.userId), ...allFOwners.map(u => u.userId)];
  const endStr = a.endTime ? ` Closes ${new Date(a.endTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : "";
  await createNotificationForUsers(notifyIds, "auction_started",
    "🔨 Auction Now Open",
    `The ${game?.name ?? "League"} silent bid auction is live! Place your bids before it closes.${endStr}`
  );
  res.json(await buildAuction(a));
});

router.post("/auctions/:auctionId/close", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = CloseAuctionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, params.data.auctionId));
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }
  const bids = await db.select().from(bidsTable).where(eq(bidsTable.auctionId, auction.id));
  const playerBidMap = new Map<number, typeof bidsTable.$inferSelect[]>();
  for (const bid of bids) {
    if (!playerBidMap.has(bid.playerProfileId)) playerBidMap.set(bid.playerProfileId, []);
    playerBidMap.get(bid.playerProfileId)!.push(bid);
  }
  for (const [playerId, playerBids] of playerBidMap) {
    const sorted = playerBids.sort((a, b) => Number(b.amount) - Number(a.amount));
    const winner = sorted[0];
    const [franchise] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, winner.franchiseId));
    if (franchise && Number(franchise.remainingBudget) >= Number(winner.amount)) {
      const existingTeam = await db.select().from(teamPlayersTable).where(eq(teamPlayersTable.playerProfileId, playerId));
      if (existingTeam.length === 0) {
        await db.insert(teamPlayersTable).values({ franchiseId: winner.franchiseId, playerProfileId: playerId });
        await db.update(franchisesTable)
          .set({ remainingBudget: String(Number(franchise.remainingBudget) - Number(winner.amount)) })
          .where(eq(franchisesTable.id, winner.franchiseId));
        await db.update(bidsTable).set({ status: "won" }).where(eq(bidsTable.id, winner.id));
        for (const loser of sorted.slice(1)) {
          await db.update(bidsTable).set({ status: "lost" }).where(eq(bidsTable.id, loser.id));
        }

        // Notify the signed player directly
        const [playerProfile] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.id, playerId));
        if (playerProfile?.userId) {
          await createNotificationForUsers([playerProfile.userId], "team_joined",
            "🎉 You've been signed!",
            `Congratulations! ${franchise.name} has signed you. Welcome to the team — check your profile for details.`
          );
        }

        // Notify the franchise owner
        const [fOwnerUser] = await db.select().from(usersTable).where(eq(usersTable.id, franchise.ownerId));
        if (fOwnerUser) {
          const [pp] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.id, playerId));
          const [pu] = await db.select().from(usersTable).where(eq(usersTable.id, pp?.userId ?? 0));
          await createNotificationForUsers([fOwnerUser.id], "bid_placed",
            "✅ Player Signed",
            `You successfully signed ${pu?.name || pu?.username || "a player"} to ${franchise.name} for ₹${Number(winner.amount).toLocaleString("en-IN")}.`
          );
        }
      }
    } else {
      for (const bid of playerBids) {
        await db.update(bidsTable).set({ status: "lost" }).where(eq(bidsTable.id, bid.id));
      }
      // Notify franchise owner their bid was outbid / insufficient budget
      const [franchise2] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, playerBids[0].franchiseId));
      const [fOwnerUser2] = franchise2 ? await db.select().from(usersTable).where(eq(usersTable.id, franchise2.ownerId)) : [null];
      if (fOwnerUser2) {
        await createNotificationForUsers([fOwnerUser2.id], "general",
          "❌ Bid Unsuccessful",
          `One of your bids was unsuccessful — either outbid or budget was insufficient. Top up your strategy for the next round!`
        );
      }
    }
  }
  const [closed] = await db.update(auctionsTable).set({ status: "closed" }).where(eq(auctionsTable.id, auction.id)).returning();
  const [aGame] = await db.select().from(gamesTable).where(eq(gamesTable.id, auction.gameId));
  const closedUsers = await db.select({ userId: usersTable.id }).from(usersTable)
    .where(eq(usersTable.role, "player"));
  const closedFOwners = await db.select({ userId: usersTable.id }).from(usersTable)
    .where(eq(usersTable.role, "franchise_owner"));
  const closedNotifyIds = [...closedUsers.map(u => u.userId), ...closedFOwners.map(u => u.userId)];
  const winCount = bids.filter(b => b.status === "won").length;
  await createNotificationForUsers(closedNotifyIds, "auction_closed",
    "🏁 Auction Closed",
    `The ${aGame?.name ?? "League"} auction has ended. ${winCount} player${winCount !== 1 ? "s" : ""} were signed. Check your roster!`
  );
  res.json(await buildAuction(closed));
});

router.get("/auctions/:auctionId/bids", async (req, res): Promise<void> => {
  const params = ListBidsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const bids = await db.select().from(bidsTable).where(eq(bidsTable.auctionId, params.data.auctionId));
  const result = await Promise.all(bids.map(async (b) => {
    const [f] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, b.franchiseId));
    const [p] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.id, b.playerProfileId));
    const [u] = p ? await db.select().from(usersTable).where(eq(usersTable.id, p.userId)) : [null];
    return {
      id: b.id,
      auctionId: b.auctionId,
      franchiseId: b.franchiseId,
      franchiseName: f?.name ?? "",
      playerId: b.playerProfileId,
      playerName: u?.username ?? "",
      amount: Number(b.amount),
      status: b.status,
      createdAt: b.createdAt,
    };
  }));
  res.json(result);
});

router.post("/auctions/:auctionId/bids", requireAuth, requireRole("franchise_owner"), async (req, res): Promise<void> => {
  const auctionId = parseInt(req.params.auctionId, 10);
  const parsed = PlaceBidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, auctionId));
  if (!auction || auction.status !== "open") {
    res.status(400).json({ error: "Auction is not open" });
    return;
  }
  const [franchise] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, parsed.data.franchiseId));
  if (!franchise) {
    res.status(404).json({ error: "Franchise not found" });
    return;
  }
  if (Number(franchise.remainingBudget) < parsed.data.amount) {
    res.status(400).json({ error: "Insufficient budget" });
    return;
  }
  const existingBid = await db.select().from(bidsTable)
    .where(and(eq(bidsTable.auctionId, auctionId), eq(bidsTable.franchiseId, parsed.data.franchiseId), eq(bidsTable.playerProfileId, parsed.data.playerId)));
  if (existingBid.length > 0) {
    const [updated] = await db.update(bidsTable).set({ amount: String(parsed.data.amount) }).where(eq(bidsTable.id, existingBid[0].id)).returning();
    const [f] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, updated.franchiseId));
    const [p] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.id, updated.playerProfileId));
    const [u] = p ? await db.select().from(usersTable).where(eq(usersTable.id, p.userId)) : [null];
    res.status(201).json({ id: updated.id, auctionId: updated.auctionId, franchiseId: updated.franchiseId, franchiseName: f?.name ?? "", playerId: updated.playerProfileId, playerName: u?.username ?? "", amount: Number(updated.amount), status: updated.status, createdAt: updated.createdAt });
    return;
  }
  const [bid] = await db.insert(bidsTable).values({
    auctionId,
    franchiseId: parsed.data.franchiseId,
    playerProfileId: parsed.data.playerId,
    amount: String(parsed.data.amount),
    status: "pending",
  }).returning();
  const [f] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, bid.franchiseId));
  const [p] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.id, bid.playerProfileId));
  const [u] = p ? await db.select().from(usersTable).where(eq(usersTable.id, p.userId)) : [null];
  res.status(201).json({ id: bid.id, auctionId: bid.auctionId, franchiseId: bid.franchiseId, franchiseName: f?.name ?? "", playerId: bid.playerProfileId, playerName: u?.username ?? "", amount: Number(bid.amount), status: bid.status, createdAt: bid.createdAt });
});

export default router;
