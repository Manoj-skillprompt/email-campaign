import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

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
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const groupContacts = sqliteTable(
  "group_contacts",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id),
  },
  (table) => ({
    uniqueMembership: unique().on(table.groupId, table.contactId),
  })
);
