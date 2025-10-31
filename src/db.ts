import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { pads } from './schema';

const sqlite = new Database('data.db');
export const db = drizzle(sqlite);

export const initializeDB = async (): Promise<void> => {
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS pads (
      path TEXT PRIMARY KEY,
      content TEXT NOT NULL DEFAULT '',
      password TEXT,
      last_updated INTEGER NOT NULL
    )
  `);
  console.log('Database initialized');
};

export { pads };
export default db;
