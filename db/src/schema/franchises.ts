import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { gamesTable } from "./games";
import { playerProfilesTable } from "./players";

export const franchisesTable = pgTable("franchises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  gameId: integer("game_id").notNull().references(() => gamesTable.id),
  totalBudget: numeric("total_budget", { precision: 12, scale: 2 }).notNull(),
  remainingBudget: numeric("remaining_budget", { precision: 12, scale: 2 }).notNull(),
  maxPlayers: integer("max_players").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teamPlayersTable = pgTable("team_players", {
  id: serial("id").primaryKey(),
  franchiseId: integer("franchise_id").notNull().references(() => franchisesTable.id),
  playerProfileId: integer("player_profile_id").notNull().references(() => playerProfilesTable.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertFranchiseSchema = createInsertSchema(franchisesTable).omit({ id: true, createdAt: true });
export type InsertFranchise = z.infer<typeof insertFranchiseSchema>;
export type Franchise = typeof franchisesTable.$inferSelect;
