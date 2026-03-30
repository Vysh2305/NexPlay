import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword, signToken, requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const [row] = await db.select().from(usersTable).where(eq(usersTable.id, user.userId));
  if (!row) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, username, email, password, role } = parsed.data;
  const sponsorId = (parsed.data as any).sponsorId ?? null;
  const [byEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (byEmail) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }
  const [byUsername] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (byUsername) {
    res.status(400).json({ error: "PSID already taken. Choose a different one." });
    return;
  }
  try {
    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({ name, username, sponsorId, email, passwordHash, role }).returning();
    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({
      user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt },
      token,
    });
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(400).json({ error: "PSID or email already in use" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

router.put("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { username, email } = req.body;
  if (!username && !email) {
    res.status(400).json({ error: "At least one field required." });
    return;
  }
  const updates: Record<string, string> = {};
  if (username) updates.username = username;
  if (email) updates.email = email;
  try {
    const [row] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.userId)).returning();
    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ id: row.id, username: row.username, email: row.email, role: row.role, createdAt: row.createdAt });
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Username or email already in use." });
    } else {
      res.status(500).json({ error: "Failed to update profile." });
    }
  }
});

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const caller = (req as any).user;
  if (caller.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  const rows = await db.select().from(usersTable);
  res.json(rows.map(r => ({ id: r.id, username: r.username, email: r.email, role: r.role, createdAt: r.createdAt })));
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out" });
});

export default router;
