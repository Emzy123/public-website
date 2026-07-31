import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAdminSessionSecret } from '@/lib/runtime/secrets';

const COOKIE_NAME = 'sinet_admin_session';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getAdminSessionSecret());
    return true;
  } catch {
    return false;
  }
}

function withPathname(response: NextResponse, pathname: string) {
  response.headers.set('x-pathname', pathname);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a random secure nonce (using UUID string directly to be Edge-safe)
  const nonce = crypto.randomUUID();
  const isDev = process.env.NODE_ENV !== 'production';
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google.com https://www.gstatic.com${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://www.google.com https://www.gstatic.com;
    connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.google.com https://*.upstash.io;
    frame-src 'self' https://www.google.com https://www.recaptcha.net;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  let response: NextResponse;

  if (pathname.startsWith('/admin/login')) {
    if (await isAuthenticated(request)) {
      response = NextResponse.redirect(new URL('/admin', request.url));
    } else {
      response = NextResponse.next();
    }
  } else if (pathname.startsWith('/admin')) {
    if (!(await isAuthenticated(request))) {
      const login = new URL('/admin/login', request.url);
      login.searchParams.set('next', pathname);
      response = NextResponse.redirect(login);
    } else {
      response = NextResponse.next();
    }
  } else if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth/login')) {
    if (!(await isAuthenticated(request))) {
      response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

  // Set standard robots header on admin routes to prevent indexing (V-10)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // Pass nonce and CSP header down to downstream components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // If the initial check did a redirect or error, return that response with headers
  if (response.status !== 200 || response.headers.get('Location')) {
    response.headers.set('Content-Security-Policy', cspHeader);
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return withPathname(response, pathname);
  }

  // Otherwise, construct a new response with the updated request headers
  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  finalResponse.headers.set('Content-Security-Policy', cspHeader);
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    finalResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return withPathname(finalResponse, pathname);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
