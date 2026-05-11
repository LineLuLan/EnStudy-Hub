import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// drizzle-kit doesn't follow Next.js's .env.local convention, so we load
// it explicitly here. `.env.local` takes precedence over `.env`.
config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
