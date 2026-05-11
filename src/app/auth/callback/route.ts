import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Supabase OAuth / magic-link callback.
 * Exchanges `?code=...` for a session cookie, then redirects to `next` or /dashboard.
 *
 * Wired to `emailRedirectTo` and OAuth `redirectTo` in features/auth/actions.ts.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!code) {
    const errUrl = url.clone();
    errUrl.pathname = '/login';
    errUrl.search = '?error=missing_code';
    return NextResponse.redirect(errUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errUrl = url.clone();
    errUrl.pathname = '/login';
    errUrl.search = `?error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(errUrl);
  }

  const redirectUrl = url.clone();
  redirectUrl.pathname = next;
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}
