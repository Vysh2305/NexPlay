import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { gamesTable } from "./games";
import { franchisesTable } from "./franchises";

export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "completed"]);

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => gamesTable.id),
  homeTeamId: integer("home_team_id").notNull().references(() => franchisesTable.id),
  awayTeamId: integer("away_team_id").notNull().references(() => franchisesTable.id),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  status: matchStatusEnum("status").notNull().default("scheduled"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  venue: text("venue"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
