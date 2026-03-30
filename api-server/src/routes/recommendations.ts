import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playerProfilesTable, franchisesTable, teamPlayersTable, usersTable, gamesTable, foulsTable } from "@workspace/db";
import { GetRecommendationsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/recommendations", async (req, res): Promise<void> => {
  const query = GetRecommendationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { franchiseId, gameId, maxBudget } = query.data;
  const [franchise] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, franchiseId));
  if (!franchise) {
    res.status(404).json({ error: "Franchise not found" });
    return;
  }
  const allPlayers = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.gameId, gameId));
  const assignedRows = await db.select().from(teamPlayersTable);
  const assignedIds = new Set(assignedRows.map(t => t.playerProfileId));
  const available = allPlayers.filter(p => !assignedIds.has(p.id) && !p.isBanned);
  const budgetLimit = maxBudget ?? Number(franchise.remainingBudget);

  const scored = await Promise.all(available.map(async (p) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId));
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, p.gameId));
    const foulsRows = await db.select().from(foulsTable).where(eq(foulsTable.playerProfileId, p.id));
    const skill = Number(p.skillRating);
    const perf = Number(p.performanceScore);
    const disc = Number(p.disciplineScore);
    const score = 0.4 * skill + 0.4 * perf + 0.2 * (disc / 10) * 10;
    const suggestedBid = Math.round(score * 1000);
    const valueScore = suggestedBid > 0 ? score / (suggestedBid / 10000) : 0;
    const reasons: string[] = [];
    if (skill >= 8) reasons.push("High skill rating");
    if (perf >= 8) reasons.push("Strong performance record");
    if (disc >= 9) reasons.push("Excellent discipline");
    if (foulsRows.length === 0) reasons.push("No fouls on record");
    if (score >= 8) reasons.push("Elite overall score");
    const reason = reasons.length > 0 ? reasons.join(". ") + "." : "Solid balanced player.";
    return {
      player: {
        id: p.id,
        userId: p.userId,
        username: user?.username ?? "",
        email: user?.email ?? "",
        skillRating: skill,
        performanceScore: perf,
        disciplineScore: disc,
        overallScore: parseFloat(score.toFixed(2)),
        position: p.position,
        isBanned: p.isBanned,
        franchiseId: null,
        franchiseName: null,
        gameId: p.gameId,
        gameName: game?.name ?? "",
        foulCount: foulsRows.length,
        createdAt: p.createdAt,
      },
      score: parseFloat(score.toFixed(2)),
      valueScore: parseFloat(valueScore.toFixed(2)),
      reason,
      suggestedBid,
    };
  }));

  const filtered = scored
    .filter(r => r.suggestedBid <= budgetLimit)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(filtered);
});

export default router;
