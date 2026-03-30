import { pgTable, serial, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameStatusEnum = pgEnum("game_status", ["active", "inactive"]);

export const gamesTable = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  rules: text("rules"),
  maxTeamSize: integer("max_team_size").notNull(),
  minTeamSize: integer("min_team_size").notNull(),
  auctionBudget: numeric("auction_budget", { precision: 12, scale: 2 }).notNull(),
  status: gameStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true, createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
