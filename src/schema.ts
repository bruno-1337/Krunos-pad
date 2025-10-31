import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const pads = sqliteTable('pads', {
  path: text('path').primaryKey(),
  content: text('content').notNull().default(''),
  password: text('password'),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull()
});

export type Pad = typeof pads.$inferSelect;
export type NewPad = typeof pads.$inferInsert;

