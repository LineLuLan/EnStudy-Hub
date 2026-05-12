import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { clientEnv } from '@/lib/env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIXES = ['/dashboard', '/review', '/decks', '/stats', '/settings'];
const AUTH_PATHS = ['/login', '/auth'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // If Supabase not configured yet (Phase 0), skip session logic.
  if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL || !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Middleware uses getSession() (local — reads cookie + verifies JWT signature)
  // rather than getUser() (network — round-trip to Supabase Auth, ~150-300ms).
  // The page-level getCurrentUserId() still runs getUser() for an authoritative
  // check before any data access; middleware is just the lightweight gate.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
