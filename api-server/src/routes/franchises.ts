import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, franchisesTable, usersTable, gamesTable, teamPlayersTable, playerProfilesTable } from "@workspace/db";
import {
  CreateFranchiseBody,
  GetFranchiseParams,
  ListFranchisesQueryParams,
  AddPlayerToFranchiseParams,
  AddPlayerToFranchiseBody,
  RemovePlayerFromFranchiseParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

async function buildFranchise(f: typeof franchisesTable.$inferSelect) {
  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, f.ownerId));
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, f.gameId));
  const players = await db.select().from(teamPlayersTable).where(eq(teamPlayersTable.franchiseId, f.id));
  return {
    id: f.id,
    name: f.name,
    ownerId: f.ownerId,
    ownerName: owner?.username ?? "",
    gameId: f.gameId,
    gameName: game?.name ?? "",
    totalBudget: Number(f.totalBudget),
    remainingBudget: Number(f.remainingBudget),
    maxPlayers: f.maxPlayers,
    playerCount: players.length,
    wins: f.wins,
    losses: f.losses,
    createdAt: f.createdAt,
  };
}

router.get("/franchises", async (req, res): Promise<void> => {
  const query = ListFranchisesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  let rows = await db.select().from(franchisesTable);
  if (query.data.gameId) {
    rows = rows.filter(f => f.gameId === query.data.gameId);
  }
  const result = await Promise.all(rows.map(buildFranchise));
  res.json(result);
});

router.post("/franchises", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateFranchiseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [f] = await db.insert(franchisesTable).values({
    name: parsed.data.name,
    ownerId: parsed.data.ownerId,
    gameId: parsed.data.gameId,
    totalBudget: String(parsed.data.totalBudget),
    remainingBudget: String(parsed.data.totalBudget),
    maxPlayers: parsed.data.maxPlayers,
  }).returning();
  res.status(201).json(await buildFranchise(f));
});

router.get("/franchises/:franchiseId", async (req, res): Promise<void> => {
  const params = GetFranchiseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [f] = await db.select().from(franchisesTable).where(eq(franchisesTable.id, params.data.franchiseId));
  if (!f) {
    res.status(404).json({ error: "Franchise not found" });
    return;
  }
  res.json(await buildFranchise(f));
});

router.get("/franchises/:franchiseId/players", async (req, res): Promise<void> => {
  const params = GetFranchiseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const teamRows = await db.select().from(teamPlayersTable).where(eq(teamPlayersTable.franchiseId, params.data.franchiseId));
  const result = await Promise.all(teamRows.map(async (t) => {
    const [p] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.id, t.playerProfileId));
    if (!p) return null;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId));
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, p.gameId));
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
      franchiseId: params.data.franchiseId,
      franchiseName: null,
      gameId: p.gameId,
      gameName: game?.name ?? "",
      foulCount: 0,
      createdAt: p.createdAt,
    };
  }));
  res.json(result.filter(Boolean));
});

router.post("/franchises/:franchiseId/players", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = AddPlayerToFranchiseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddPlayerToFranchiseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db.select().from(teamPlayersTable)
    .where(eq(teamPlayersTable.playerProfileId, parsed.data.playerId));
  if (existing.length > 0) {
    res.status(400).json({ error: "Player already in a team" });
    return;
  }
  await db.insert(teamPlayersTable).values({ franchiseId: params.data.franchiseId, playerProfileId: parsed.data.playerId });
  res.status(201).json({ message: "Player added" });
});

router.delete("/franchises/:franchiseId/players/:playerId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.franchiseId) ? req.params.franchiseId[0] : req.params.franchiseId;
  const rawP = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const franchiseId = parseInt(raw, 10);
  const playerId = parseInt(rawP, 10);
  await db.delete(teamPlayersTable)
    .where(and(eq(teamPlayersTable.franchiseId, franchiseId), eq(teamPlayersTable.playerProfileId, playerId)));
  res.json({ message: "Player removed" });
});

export default router;
