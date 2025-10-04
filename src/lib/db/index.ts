import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Use PostgreSQL in production, SQLite in development
const isDevelopment = process.env.NODE_ENV !== 'production';

let db;

if (isDevelopment) {
  // Development: Use SQLite
  const Database = require('better-sqlite3');
  const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');

  // Allow DATABASE_URL to override default sqlite.db path
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './sqlite.db';
  const sqlite = new Database(dbPath);
  db = drizzleSqlite(sqlite, { schema });
} else {
  // Production: Use PostgreSQL
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required in production');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzle(pool, { schema });
}

export { db };
export * from './schema';