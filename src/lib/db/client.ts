import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { getServerEnv } from '@/lib/env';

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const env = getServerEnv();
  if (!env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local (see docs/API_KEYS.md).'
    );
  }
  return postgres(env.DATABASE_URL, {
    prepare: false, // pgBouncer transaction-mode requires prepare=false
    max: 10,
  });
}

const sql = globalThis.__pgClient ?? createClient();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__pgClient = sql;
}

export const db = drizzle(sql, { schema });
export type DbClient = typeof db;
