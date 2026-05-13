import { z } from 'zod';

/**
 * Client-safe env. Inlined by Next.js at build time (NEXT_PUBLIC_*).
 * Optional in Phase 0; mark required from Tuần 1 once Supabase project provisioned.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

const rawClient = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

export const clientEnv = clientSchema.parse(rawClient);
export type ClientEnv = z.infer<typeof clientSchema>;

/**
 * Server-only env. Calling this in a client bundle throws at runtime.
 * Use only inside Server Actions, Route Handlers, Server Components, or scripts.
 */
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() must not be called in the browser');
  }
  if (!cachedServerEnv) {
    cachedServerEnv = serverSchema.parse(process.env);
  }
  return cachedServerEnv;
}

/**
 * Assert required keys exist (call from boot points that need them).
 * E.g. scripts/seed.ts → assertSupabaseConfigured('seed').
 */
export function assertSupabaseConfigured(context: string): void {
  const missing: string[] = [];
  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const srv = typeof window === 'undefined' ? getServerEnv() : null;
  if (srv && !srv.DATABASE_URL) missing.push('DATABASE_URL');
  if (missing.length) {
    throw new Error(`[${context}] Missing env vars: ${missing.join(', ')}. See docs/API_KEYS.md.`);
  }
}
