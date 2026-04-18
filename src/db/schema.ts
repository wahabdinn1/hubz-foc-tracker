import { pgTable, serial, text, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const ccRecipients = pgTable("cc_recipients", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dropdownOptions = pgTable("dropdown_options", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'CAMPAIGN', 'REQUESTOR', 'DELIVERY_TYPE'
  value: text("value").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unq: unique("category_value_unq").on(t.category, t.value),
}));

export type CCRecipient = typeof ccRecipients.$inferSelect;
export type NewCCRecipient = typeof ccRecipients.$inferInsert;

export type DropdownOption = typeof dropdownOptions.$inferSelect;
export type NewDropdownOption = typeof dropdownOptions.$inferInsert;
