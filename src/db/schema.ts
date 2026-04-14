import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const ccRecipients = pgTable("cc_recipients", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CCRecipient = typeof ccRecipients.$inferSelect;
export type NewCCRecipient = typeof ccRecipients.$inferInsert;
