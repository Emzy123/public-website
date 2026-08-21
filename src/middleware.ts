import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { getAdminSessionSecret } from '@/lib/runtime/secrets';

const COOKIE_NAME = 'sinet_admin_session';
const IDLE_TIMEOUT = 60 * 30;
const SESSION_MAX_AGE = 60 * 60 * 2;
const ROTATION_INTERVAL = 60 * 5;

async function getAuthenticatedEmail(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAdminSessionSecret(), { issuer: 'sinet-admin', audience: 'sinet-admin' });
    if (typeof payload.email !== 'string') return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.lastActivity !== 'number' || now - payload.lastActivity > IDLE_TIMEOUT) return null;
    return payload.email;
  } catch {
    return null;
  }
}

async function rotateSession(response: NextResponse, request: NextRequest, email: string | null) {
  if (!email) return;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return;
  try {
    const { payload } = await jwtVerify(token, getAdminSessionSecret());
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.lastActivity === 'number' && now - payload.lastActivity < ROTATION_INTERVAL) return;
    const refreshed = await new SignJWT({ email, lastActivity: now }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setIssuer('sinet-admin').setAudience('sinet-admin').setExpirationTime(`${SESSION_MAX_AGE}s`).sign(getAdminSessionSecret());
    response.cookies.set({ name: COOKIE_NAME, value: refreshed, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE, priority: 'high' });
  } catch { /* authentication already failed or token cannot be refreshed */ }
}

function withPathname(response: NextResponse, pathname: string) {
  response.headers.set('x-pathname', pathname);
  return response;
}

function applySecurityHeaders(response: NextResponse, pathname: string, csp: string) {
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a random secure nonce (using UUID string directly to be Edge-safe)
  const nonce = crypto.randomUUID();
  const isDev = process.env.NODE_ENV !== 'production';
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google.com https://www.gstatic.com${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""};
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
  let authenticatedEmail: string | null = null;

  if (pathname.startsWith('/admin/login')) {
    authenticatedEmail = await getAuthenticatedEmail(request);
    if (authenticatedEmail) {
      response = NextResponse.redirect(new URL('/admin', request.url));
    } else {
      response = NextResponse.next();
    }
  } else if (pathname.startsWith('/admin')) {
    authenticatedEmail = await getAuthenticatedEmail(request);
    if (!authenticatedEmail) {
      const login = new URL('/admin/login', request.url);
      login.searchParams.set('next', pathname);
      response = NextResponse.redirect(login);
    } else {
      response = NextResponse.next();
    }
  } else if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth/login')) {
    authenticatedEmail = await getAuthenticatedEmail(request);
    if (!authenticatedEmail) {
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
    applySecurityHeaders(response, pathname, cspHeader);
    return withPathname(response, pathname);
  }

  // Otherwise, construct a new response with the updated request headers
  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applySecurityHeaders(finalResponse, pathname, cspHeader);

  await rotateSession(finalResponse, request, authenticatedEmail);

  return withPathname(finalResponse, pathname);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
