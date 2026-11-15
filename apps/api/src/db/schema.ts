import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import {
  users,
  usersRelations,
  sessionsRelations,
  accountsRelations,
} from "./auth-schema.js";

export * from "./auth-schema.js";

export const favoriteLinks = pgTable(
  "favorite_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    url: text("url").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("favorite_links_user_id_idx").on(table.userId)],
);

export const favoriteLinksRelations = relations(favoriteLinks, ({ one }) => ({
  user: one(users, {
    fields: [favoriteLinks.userId],
    references: [users.id],
  }),
}));
