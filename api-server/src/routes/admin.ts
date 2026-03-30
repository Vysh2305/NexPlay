import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, gamesTable, playerProfilesTable, franchisesTable, matchesTable, auctionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const games = await db.select().from(gamesTable);
  const players = await db.select().from(playerProfilesTable);
  const franchises = await db.select().from(franchisesTable);
  const matches = await db.select().from(matchesTable);
  const auctions = await db.select().from(auctionsTable);
  res.json({
    totalGames: games.length,
    totalPlayers: players.length,
    totalFranchises: franchises.length,
    totalMatches: matches.length,
    liveMatches: matches.filter(m => m.status === "live").length,
    activeAuctions: auctions.filter(a => a.status === "open").length,
  });
});

export default router;
