// Drizzle ORM table definitions will be defined here per feature
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  branch: text("branch").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  contactIds: text("contact_ids").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  senderEmail: text("sender_email").notNull(),
  type: text("type").notNull().default("EMAIL"),
  groupIds: text("group_ids").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull(),
  scheduledAt: text("scheduled_at"),
  sentAt: text("sent_at"),
  sentCount: integer("sent_count").notNull().default(0),
  openRate: real("open_rate").notNull().default(0),
  clickRate: real("click_rate").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
