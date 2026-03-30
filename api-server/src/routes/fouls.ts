import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, foulsTable, playerProfilesTable, usersTable } from "@workspace/db";
import { AddFoulBody, ListFoulsQueryParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const PENALTY_MINOR = 5;
const PENALTY_MAJOR = 15;

const router: IRouter = Router();

router.get("/fouls", async (req, res): Promise<void> => {
  const query = ListFoulsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  let rows = await db.select().from(foulsTable).orderBy(foulsTable.createdAt);
  if (query.data.playerId) {
    rows = rows.filter(f => f.playerProfileId === query.data.playerId);
  }
  const result = await Promise.all(rows.map(async (f) => {
    const [p] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.id, f.playerProfileId));
    const [u] = p ? await db.select().from(usersTable).where(eq(usersTable.id, p.userId)) : [null];
    return {
      id: f.id,
      playerId: f.playerProfileId,
      playerName: u?.username ?? "",
      type: f.type,
      reason: f.reason,
      penaltyPoints: f.penaltyPoints,
      createdAt: f.createdAt,
    };
  }));
  res.json(result);
});

router.post("/fouls", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = AddFoulBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const penalty = parsed.data.type === "major" ? PENALTY_MAJOR : PENALTY_MINOR;
  const [foul] = await db.insert(foulsTable).values({
    playerProfileId: parsed.data.playerId,
    type: parsed.data.type,
    reason: parsed.data.reason,
    penaltyPoints: penalty,
  }).returning();
  const [p] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.id, foul.playerProfileId));
  if (p) {
    const newDisc = Math.max(0, Number(p.disciplineScore) - penalty);
    await db.update(playerProfilesTable).set({ disciplineScore: String(newDisc) }).where(eq(playerProfilesTable.id, p.id));
  }
  const [u] = p ? await db.select().from(usersTable).where(eq(usersTable.id, p.userId)) : [null];
  res.status(201).json({
    id: foul.id,
    playerId: foul.playerProfileId,
    playerName: u?.username ?? "",
    type: foul.type,
    reason: foul.reason,
    penaltyPoints: foul.penaltyPoints,
    createdAt: foul.createdAt,
  });
});

export default router;
