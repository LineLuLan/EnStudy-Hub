import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Get current authenticated user id, or null if not signed in.
 * Use inside Server Components / Server Actions / Route Handlers.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('UNAUTHORIZED');
  return userId;
}
