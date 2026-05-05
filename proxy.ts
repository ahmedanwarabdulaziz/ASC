import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy handles:
 * 1. Supabase session refresh on every request
 * 2. Route protection — unauthenticated users can't access /system/*
 *
 * Note: Next.js 16 renamed middleware.ts → proxy.ts and middleware() → proxy()
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not remove
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /system/* routes
  if (request.nextUrl.pathname.startsWith('/system') && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and visits login page, redirect to system
  if (request.nextUrl.pathname.startsWith('/auth/login') && user) {
    const systemUrl = request.nextUrl.clone();
    systemUrl.pathname = '/system';
    return NextResponse.redirect(systemUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|icons/|brand/).*)',
  ],
};
