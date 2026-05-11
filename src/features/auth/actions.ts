'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { clientEnv } from '@/lib/env';

type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const emailSchema = z.string().email().max(254);

/**
 * Send a magic-link sign-in email. Idempotent — Supabase debounces if called rapidly.
 */
export async function signInWithMagicLink(formData: FormData): Promise<ActionResult> {
  const raw = formData.get('email');
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: 'Email không hợp lệ.' };
  }

  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL || !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      ok: false,
      error: 'Supabase chưa được cấu hình. Xem docs/API_KEYS.md.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const reqHeaders = await headers();
  const origin =
    clientEnv.NEXT_PUBLIC_SITE_URL ??
    `${reqHeaders.get('x-forwarded-proto') ?? 'http'}://${reqHeaders.get('host') ?? 'localhost:3000'}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Start Google OAuth flow. Returns redirect URL to be opened on client.
 */
export async function signInWithGoogle(): Promise<ActionResult<{ url: string }>> {
  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: 'Supabase chưa được cấu hình.' };
  }
  const supabase = await createSupabaseServerClient();
  const reqHeaders = await headers();
  const origin =
    clientEnv.NEXT_PUBLIC_SITE_URL ??
    `${reqHeaders.get('x-forwarded-proto') ?? 'http'}://${reqHeaders.get('host') ?? 'localhost:3000'}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error || !data.url) {
    return { ok: false, error: error?.message ?? 'OAuth init failed.' };
  }
  return { ok: true, data: { url: data.url } };
}

export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
