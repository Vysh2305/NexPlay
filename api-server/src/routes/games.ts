import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, gamesTable, playerProfilesTable, franchisesTable } from "@workspace/db";
import { CreateGameBody, GetGameParams, UpdateGameBody, UpdateGameParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/games", async (_req, res): Promise<void> => {
  const games = await db.select().from(gamesTable).orderBy(gamesTable.createdAt);
  const result = await Promise.all(games.map(async (g) => {
    const [{ count: pCount }] = await db.select({ count: count() }).from(playerProfilesTable).where(eq(playerProfilesTable.gameId, g.id));
    const [{ count: fCount }] = await db.select({ count: count() }).from(franchisesTable).where(eq(franchisesTable.gameId, g.id));
    return {
      ...g,
      auctionBudget: Number(g.auctionBudget),
      playerCount: Number(pCount),
      franchiseCount: Number(fCount),
    };
  }));
  res.json(result);
});

router.post("/games", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [game] = await db.insert(gamesTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    rules: parsed.data.rules ?? null,
    maxTeamSize: parsed.data.maxTeamSize,
    minTeamSize: parsed.data.minTeamSize,
    auctionBudget: String(parsed.data.auctionBudget),
    status: parsed.data.status ?? "active",
  }).returning();
  res.status(201).json({ ...game, auctionBudget: Number(game.auctionBudget), playerCount: 0, franchiseCount: 0 });
});

router.get("/games/:gameId", async (req, res): Promise<void> => {
  const params = GetGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, params.data.gameId));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  const [{ count: pCount }] = await db.select({ count: count() }).from(playerProfilesTable).where(eq(playerProfilesTable.gameId, game.id));
  const [{ count: fCount }] = await db.select({ count: count() }).from(franchisesTable).where(eq(franchisesTable.gameId, game.id));
  res.json({ ...game, auctionBudget: Number(game.auctionBudget), playerCount: Number(pCount), franchiseCount: Number(fCount) });
});

router.put("/games/:gameId", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.rules !== undefined) updates.rules = parsed.data.rules;
  if (parsed.data.maxTeamSize !== undefined) updates.maxTeamSize = parsed.data.maxTeamSize;
  if (parsed.data.minTeamSize !== undefined) updates.minTeamSize = parsed.data.minTeamSize;
  if (parsed.data.auctionBudget !== undefined) updates.auctionBudget = String(parsed.data.auctionBudget);
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  const [game] = await db.update(gamesTable).set(updates).where(eq(gamesTable.id, params.data.gameId)).returning();
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json({ ...game, auctionBudget: Number(game.auctionBudget), playerCount: 0, franchiseCount: 0 });
});

router.delete("/games/:gameId", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.gameId);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid game id" }); return; }
  const [deleted] = await db.delete(gamesTable).where(eq(gamesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Game not found" }); return; }
  res.json({ ok: true });
});

router.post("/games/:gameId/enroll", requireAuth, requireRole("player"), async (req, res): Promise<void> => {
  const params = GetGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = (req as any).user;
  const { skillRating, position } = req.body;
  const existing = await db.select().from(playerProfilesTable)
    .where(eq(playerProfilesTable.userId, user.userId));
  const alreadyEnrolled = existing.find(p => p.gameId === params.data.gameId);
  if (alreadyEnrolled) {
    res.status(400).json({ error: "Already enrolled in this game" });
    return;
  }
  await db.insert(playerProfilesTable).values({
    userId: user.userId,
    gameId: params.data.gameId,
    skillRating: String(skillRating ?? 5),
    position: position ?? null,
  });
  res.status(201).json({ message: "Enrolled successfully" });
});

export default router;
