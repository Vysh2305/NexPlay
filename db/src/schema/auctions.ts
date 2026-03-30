import { pgTable, serial, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { gamesTable } from "./games";
import { franchisesTable } from "./franchises";
import { playerProfilesTable } from "./players";

export const auctionStatusEnum = pgEnum("auction_status", ["pending", "open", "closed"]);
export const bidStatusEnum = pgEnum("bid_status", ["pending", "won", "lost"]);

export const auctionsTable = pgTable("auctions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => gamesTable.id),
  status: auctionStatusEnum("status").notNull().default("pending"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bidsTable = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull().references(() => auctionsTable.id),
  franchiseId: integer("franchise_id").notNull().references(() => franchisesTable.id),
  playerProfileId: integer("player_profile_id").notNull().references(() => playerProfilesTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: bidStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuctionSchema = createInsertSchema(auctionsTable).omit({ id: true, createdAt: true });
export const insertBidSchema = createInsertSchema(bidsTable).omit({ id: true, createdAt: true });
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Auction = typeof auctionsTable.$inferSelect;
export type Bid = typeof bidsTable.$inferSelect;
