import { defineConfig } from 'drizzle-kit';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: isDevelopment ? 'sqlite' : 'postgresql',
  dbCredentials: isDevelopment
    ? {
        url: './sqlite.db',
      }
    : {
        url: process.env.DATABASE_URL!,
      },
  verbose: true,
  strict: true,
});