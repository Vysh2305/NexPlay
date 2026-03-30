import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, matchesTable, franchisesTable, gamesTable } from "@workspace/db";
import { createNotificationForUsers, getPlayerAndFranchiseUserIdsForGame } from "./notifications";
import {
  CreateMatchBody,
  GetMatchParams,
  UpdateMatchParams,
  UpdateMatchBody,
  ListMatchesQueryParams,
  GetLeaderboardQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

async function buildMatch(m: typeof matchesTable.$inferSelect) {
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, m.gameId));
  const [home] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, m.homeTeamId));
  const [away] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, m.awayTeamId));
  return {
    id: m.id,
    gameId: m.gameId,
    gameName: game?.name ?? "",
    homeTeamId: m.homeTeamId,
    homeTeamName: home?.name ?? "",
    awayTeamId: m.awayTeamId,
    awayTeamName: away?.name ?? "",
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    startTime: m.startTime,
    endTime: m.endTime,
    venue: m.venue,
    createdAt: m.createdAt,
  };
}

router.get("/matches", async (req, res): Promise<void> => {
  const query = ListMatchesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  let rows = await db.select().from(matchesTable).orderBy(matchesTable.startTime);
  if (query.data.gameId) rows = rows.filter(m => m.gameId === query.data.gameId);
  if (query.data.status) rows = rows.filter(m => m.status === query.data.status);
  const result = await Promise.all(rows.map(buildMatch));
  res.json(result);
});

router.post("/matches", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [m] = await db.insert(matchesTable).values({
    gameId: parsed.data.gameId,
    homeTeamId: parsed.data.homeTeamId,
    awayTeamId: parsed.data.awayTeamId,
    startTime: new Date(parsed.data.startTime),
    endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : null,
    venue: parsed.data.venue ?? null,
    status: "scheduled",
  }).returning();
  const built = await buildMatch(m);
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, m.gameId));
  const userIds = await getPlayerAndFranchiseUserIdsForGame(m.gameId);
  const venue = m.venue ? ` at ${m.venue}` : "";
  const startStr = new Date(m.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  await createNotificationForUsers(userIds, "match_scheduled",
    "🏟️ Match Scheduled",
    `${built.homeTeamName} vs ${built.awayTeamName} (${game?.name ?? "League"})${venue} — ${startStr}`
  );
  res.status(201).json(built);
});

router.get("/matches/:matchId", async (req, res): Promise<void> => {
  const params = GetMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [m] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.matchId));
  if (!m) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  res.json(await buildMatch(m));
});

router.put("/matches/:matchId", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.homeScore !== undefined) updates.homeScore = parsed.data.homeScore;
  if (parsed.data.awayScore !== undefined) updates.awayScore = parsed.data.awayScore;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.endTime !== undefined) updates.endTime = new Date(parsed.data.endTime);
  if (parsed.data.venue !== undefined) updates.venue = parsed.data.venue;

  const [m] = await db.update(matchesTable).set(updates).where(eq(matchesTable.id, params.data.matchId)).returning();
  if (!m) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const built = await buildMatch(m);
  const userIds = await getPlayerAndFranchiseUserIdsForGame(m.gameId);

  if (parsed.data.status === "cancelled") {
    const startStr = new Date(m.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    await createNotificationForUsers(userIds, "match_cancelled",
      "❌ Match Cancelled",
      `${built.homeTeamName} vs ${built.awayTeamName} scheduled on ${startStr} has been cancelled.`
    );
  } else if (parsed.data.status === "completed") {
    const [home] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, m.homeTeamId));
    const [away] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, m.awayTeamId));
    if (home && away) {
      if ((parsed.data.homeScore ?? m.homeScore) > (parsed.data.awayScore ?? m.awayScore)) {
        await db.update(franchisesTable).set({ wins: home.wins + 1 }).where(eq(franchisesTable.id, home.id));
        await db.update(franchisesTable).set({ losses: away.losses + 1 }).where(eq(franchisesTable.id, away.id));
      } else if ((parsed.data.homeScore ?? m.homeScore) < (parsed.data.awayScore ?? m.awayScore)) {
        await db.update(franchisesTable).set({ losses: home.losses + 1 }).where(eq(franchisesTable.id, home.id));
        await db.update(franchisesTable).set({ wins: away.wins + 1 }).where(eq(franchisesTable.id, away.id));
      }
    }
    const hScore = parsed.data.homeScore ?? m.homeScore ?? 0;
    const aScore = parsed.data.awayScore ?? m.awayScore ?? 0;
    await createNotificationForUsers(userIds, "match_completed",
      "🏆 Match Completed",
      `${built.homeTeamName} ${hScore} – ${aScore} ${built.awayTeamName}. Final result is in!`
    );
  } else if (parsed.data.status === "live") {
    await createNotificationForUsers(userIds, "match_updated",
      "🔴 Match Now Live",
      `${built.homeTeamName} vs ${built.awayTeamName} has kicked off! Follow live scores now.`
    );
  }

  res.json(built);
});

router.get("/leaderboard", async (req, res): Promise<void> => {
  const query = GetLeaderboardQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const franchises = await db.select().from(franchisesTable).where(eq(franchisesTable.gameId, query.data.gameId));
  const allMatches = await db.select().from(matchesTable).where(eq(matchesTable.gameId, query.data.gameId));
  const leaderboard = franchises.map(f => {
    const matches = allMatches.filter(m => m.homeTeamId === f.id || m.awayTeamId === f.id);
    const matchesPlayed = matches.filter(m => m.status === "completed").length;
    const points = f.wins * 3;
    return {
      franchiseId: f.id,
      franchiseName: f.name,
      wins: f.wins,
      losses: f.losses,
      points,
      matchesPlayed,
    };
  }).sort((a, b) => b.points - a.points || b.wins - a.wins);
  res.json(leaderboard.map((e, i) => ({ rank: i + 1, ...e })));
});

export default router;
