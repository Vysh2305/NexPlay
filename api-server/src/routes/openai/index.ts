import { Router } from "express";
import { db } from "@workspace/db";
import {
  conversations,
  messages,
  playerProfilesTable,
  franchisesTable,
  gamesTable,
  matchesTable,
  usersTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth, type JwtPayload } from "../../lib/auth.js";
import type { Request } from "express";

const router = Router();

type AuthReq = Request & { user?: JwtPayload };

router.post("/chat/conversations", requireAuth, async (req: AuthReq, res) => {
  try {
    const userId = req.user!.userId;
    const { title } = req.body;

    const [conv] = await db
      .insert(conversations)
      .values({
        userId,
        title: title || "League Assistant",
      })
      .returning();

    res.json(conv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/chat/conversations", requireAuth, async (req: AuthReq, res) => {
  try {
    const userId = req.user!.userId;
    const convs = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .limit(20);

    res.json(convs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.get("/chat/conversations/:id/messages", requireAuth, async (req: AuthReq, res) => {
  try {
    const convId = parseInt(req.params.id, 10);
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(messages.createdAt);

    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/chat/conversations/:id/messages", requireAuth, async (req: AuthReq, res) => {
  try {
    const convId = parseInt(req.params.id, 10);
    const { content } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Message content required" });
    }

    const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const allGames = await db.select().from(gamesTable).limit(20);
    const allFranchises = await db.select().from(franchisesTable).limit(20);
    const recentMatches = await db.select().from(matchesTable).orderBy(desc(matchesTable.startTime)).limit(10);

    let roleContext = "";
    if (userRole === "player") {
      const playerRows = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.userId, userId)).limit(5);
      if (playerRows.length > 0) {
        const p = playerRows[0];
        const score = (0.4 * (p.skillRating ?? 0) + 0.4 * (p.performanceScore ?? 0) + 0.2 * (p.disciplineScore ?? 0)).toFixed(1);
        roleContext = `\nThe user's player profile: Skill=${p.skillRating}/10, Performance=${p.performanceScore}/10, Discipline=${p.disciplineScore}/10, AI Score=${score}/10, Status=${p.status}.`;
      }
    }

    if (userRole === "franchise_owner") {
      const franchiseRows = await db.select().from(franchisesTable).where(eq(franchisesTable.ownerId, userId)).limit(5);
      if (franchiseRows.length > 0) {
        const f = franchiseRows[0];
        roleContext = `\nThe user owns franchise: "${f.name}" with remaining budget $${(f.budget ?? 0).toLocaleString()}.`;
      }
    }

    const systemPrompt = `You are the LEAGUE.PRO AI Assistant, an expert sports league advisor. Help admins, franchise owners, and players get the most from the platform.

Platform info:
- Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
- Active leagues: ${allGames.map(g => `${g.name} (budget $${(g.auctionBudget ?? 0).toLocaleString()}, team ${g.minTeamSize}-${g.maxTeamSize})`).join("; ")}
- Franchises: ${allFranchises.map(f => f.name).join(", ") || "None yet"}
- Matches on record: ${recentMatches.length}

Current user:
- Name: ${userRow?.name || "User"}
- Role: ${userRole === "admin" ? "Administrator" : userRole === "franchise_owner" ? "Franchise Owner" : "Player"}${roleContext}

Key rules:
- Auctions are silent-bid: highest bid wins when auction ends, no one sees other bids
- AI Score = 0.4 x Skill + 0.4 x Performance + 0.2 x Discipline (all 0-10)
- Minor foul: -5 discipline points. Major foul: -15 discipline points
- Leaderboard ranks players by AI score; franchises by match wins

Style: Be concise, direct, sports-enthusiastic. No markdown. Under 200 words unless detail is asked for. Tailor advice to the user's role.`;

    await db.insert(messages).values({
      conversationId: convId,
      role: "user",
      content,
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(messages.createdAt)
      .limit(20);

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: convId,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat error:", err);
    res.write(`data: ${JSON.stringify({ error: "Failed to get AI response" })}\n\n`);
    res.end();
  }
});

export default router;
