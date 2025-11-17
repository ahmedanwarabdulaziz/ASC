import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkbiqoajqxlvxjcwvhzv.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTUxMzksImV4cCI6MjA3ODc3MTEzOX0.-3yBJSlAv_iFkq1tAdHhp7linLuIajS_e95UZzdcheA',
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Skip middleware for static files (images, etc.)
  if (pathname.startsWith('/img/') || pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
    return response;
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/members', '/about', '/blog'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // If accessing a protected route without session, redirect to login
  if (!session && !isPublicRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing login page while authenticated, redirect to dashboard
  if (session && pathname === '/login') {
    // Check if user must change password using RPC function to avoid RLS recursion
    const { data: userDataArray, error: userError } = await supabase
      .rpc('get_user_data', { user_id: session.user.id });

    if (!userError && userDataArray && Array.isArray(userDataArray) && userDataArray.length > 0) {
      const userData = userDataArray[0];
      // userData should contain role and must_change_password
      if (userData.must_change_password) {
        return NextResponse.redirect(new URL('/change-password', req.url));
      }

      // Redirect based on role
      if (userData.role === 'team_leader') {
        return NextResponse.redirect(new URL('/dashboard/teams', req.url));
      }
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If authenticated and must change password, redirect to change password page
  if (session && pathname !== '/change-password' && !pathname.startsWith('/api')) {
    const { data: userDataArray, error: userError } = await supabase
      .rpc('get_user_data', { user_id: session.user.id });

    if (!userError && userDataArray && Array.isArray(userDataArray) && userDataArray.length > 0) {
      const userData = userDataArray[0];
      if (userData.must_change_password) {
        return NextResponse.redirect(new URL('/change-password', req.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - img/ (image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|img/).*)',
  ],
};

