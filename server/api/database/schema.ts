import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  vector,
} from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }), // adjust to your embedding size
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
