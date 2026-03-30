import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows);
});

router.get("/notifications/unread-count", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, user.userId), eq(notificationsTable.isRead, false)));
  res.json({ count: rows.length });
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, user.userId)));
  res.json({ ok: true });
});

router.patch("/notifications/mark-all-read", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, user.userId), eq(notificationsTable.isRead, false)));
  res.json({ ok: true });
});

router.delete("/notifications/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  await db
    .delete(notificationsTable)
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, user.userId)));
  res.json({ ok: true });
});

export async function createNotificationForUsers(
  userIds: number[],
  type: "match_scheduled" | "match_cancelled" | "match_updated" | "match_completed" | "auction_started" | "auction_closed" | "bid_placed" | "team_joined" | "general",
  title: string,
  message: string
) {
  if (!userIds.length) return;
  await db.insert(notificationsTable).values(
    userIds.map(userId => ({ userId, type, title, message }))
  );
}

export async function getPlayerAndFranchiseUserIdsForGame(gameId: number): Promise<number[]> {
  const rows = await db
    .select({ userId: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, "player"));
  const fRows = await db
    .select({ userId: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, "franchise_owner"));
  return [...rows.map(r => r.userId), ...fRows.map(r => r.userId)];
}

export default router;
