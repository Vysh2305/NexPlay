import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playerProfilesTable } from "./players";

export const foulTypeEnum = pgEnum("foul_type", ["minor", "major"]);

export const foulsTable = pgTable("fouls", {
  id: serial("id").primaryKey(),
  playerProfileId: integer("player_profile_id").notNull().references(() => playerProfilesTable.id),
  type: foulTypeEnum("type").notNull(),
  reason: text("reason").notNull(),
  penaltyPoints: integer("penalty_points").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFoulSchema = createInsertSchema(foulsTable).omit({ id: true, createdAt: true });
export type InsertFoul = z.infer<typeof insertFoulSchema>;
export type Foul = typeof foulsTable.$inferSelect;
