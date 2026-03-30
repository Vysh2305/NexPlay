import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, playerProfilesTable, franchisesTable, gamesTable, foulsTable, teamPlayersTable } from "@workspace/db";
import { GetPlayerParams, UpdatePlayerParams, UpdatePlayerBody, BanPlayerParams, BanPlayerBody, ListPlayersQueryParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

async function buildPlayerProfile(p: typeof playerProfilesTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId));
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, p.gameId));
  const foulsRows = await db.select().from(foulsTable).where(eq(foulsTable.playerProfileId, p.id));
  const teamRow = await db.select().from(teamPlayersTable).where(eq(teamPlayersTable.playerProfileId, p.id));
  let franchiseName: string | undefined;
  let franchiseId: number | undefined;
  if (teamRow.length > 0) {
    const [f] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, teamRow[0].franchiseId));
    franchiseId = f?.id;
    franchiseName = f?.name;
  }
  const skill = Number(p.skillRating);
  const perf = Number(p.performanceScore);
  const disc = Number(p.disciplineScore);
  const overall = 0.4 * skill + 0.4 * perf + 0.2 * (disc / 10) * 10;
  return {
    id: p.id,
    userId: p.userId,
    username: user?.username ?? "",
    email: user?.email ?? "",
    skillRating: skill,
    performanceScore: perf,
    disciplineScore: disc,
    overallScore: parseFloat(overall.toFixed(2)),
    position: p.position,
    isBanned: p.isBanned,
    franchiseId: franchiseId ?? null,
    franchiseName: franchiseName ?? null,
    gameId: p.gameId,
    gameName: game?.name ?? "",
    foulCount: foulsRows.length,
    createdAt: p.createdAt,
  };
}

// GET /players/me — full profile for the currently authenticated player
router.get("/players/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const rows = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.userId, user.userId));
  const profiles = await Promise.all(rows.map(buildPlayerProfile));

  // Attach full foul details to each profile
  const profilesWithFouls = await Promise.all(profiles.map(async profile => {
    const fouls = await db.select().from(foulsTable).where(eq(foulsTable.playerProfileId, profile.id));
    return { ...profile, fouls };
  }));

  res.json(profilesWithFouls);
});

router.get("/players", async (req, res): Promise<void> => {
  const query = ListPlayersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  let rows = await db.select().from(playerProfilesTable);
  if (query.data.gameId) {
    rows = rows.filter(p => p.gameId === query.data.gameId);
  }
  if (query.data.available === true) {
    const assigned = await db.select().from(teamPlayersTable);
    const assignedIds = new Set(assigned.map(t => t.playerProfileId));
    rows = rows.filter(p => !assignedIds.has(p.id));
  }
  const result = await Promise.all(rows.map(buildPlayerProfile));
  res.json(result);
});

router.get("/players/:playerId", async (req, res): Promise<void> => {
  const params = GetPlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [p] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.id, params.data.playerId));
  if (!p) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(await buildPlayerProfile(p));
});

router.put("/players/:playerId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdatePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.skillRating !== undefined) updates.skillRating = String(parsed.data.skillRating);
  if (parsed.data.position !== undefined) updates.position = parsed.data.position;
  if (parsed.data.performanceScore !== undefined) updates.performanceScore = String(parsed.data.performanceScore);
  const [p] = await db.update(playerProfilesTable).set(updates).where(eq(playerProfilesTable.id, params.data.playerId)).returning();
  if (!p) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(await buildPlayerProfile(p));
});

router.post("/players/:playerId/ban", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = BanPlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = BanPlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [p] = await db.update(playerProfilesTable)
    .set({ isBanned: true, banReason: parsed.data.reason })
    .where(eq(playerProfilesTable.id, params.data.playerId))
    .returning();
  if (!p) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json({ message: "Player banned" });
});

export default router;
