import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Get current authenticated user id, or null if not signed in.
 * Use inside Server Components / Server Actions / Route Handlers.
 *
 * Wrapped in React.cache so multiple Server Components within the same request
 * share one Supabase auth.getUser() round-trip. The underlying call is a
 * network request (~150-300ms), so deduping matters when layouts + pages both
 * need the user id.
 */
export const getCurrentUserId = cache(async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
});

export const requireUserId = cache(async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('UNAUTHORIZED');
  return userId;
});
