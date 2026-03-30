import { pgTable, serial, text, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { gamesTable } from "./games";

export const playerProfilesTable = pgTable("player_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  gameId: integer("game_id").notNull().references(() => gamesTable.id),
  skillRating: numeric("skill_rating", { precision: 4, scale: 2 }).notNull().default("5.0"),
  performanceScore: numeric("performance_score", { precision: 4, scale: 2 }).notNull().default("5.0"),
  disciplineScore: numeric("discipline_score", { precision: 4, scale: 2 }).notNull().default("10.0"),
  position: text("position"),
  isBanned: boolean("is_banned").notNull().default(false),
  banReason: text("ban_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlayerProfileSchema = createInsertSchema(playerProfilesTable).omit({ id: true, createdAt: true });
export type InsertPlayerProfile = z.infer<typeof insertPlayerProfileSchema>;
export type PlayerProfile = typeof playerProfilesTable.$inferSelect;
