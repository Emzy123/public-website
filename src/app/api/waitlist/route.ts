import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { allowedOrigins } from '@/lib/constants';
import { csrfProtect } from '@/lib/csrf';
import { sendWaitlistContact } from '@/lib/email';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { waitlistLimiter } from '@/lib/rateLimit';
import { waitlistSchema } from '@/lib/validation';
import { isDevelopmentMode } from '@/lib/runtime/envMode';
import { validateRouteSecurityConfig } from '@/lib/runtime/securityConfig';

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  return xff?.split(',')[0]?.trim() ?? 'unknown';
}

function mapZodErrors(error: ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path.join('.') || 'form';
    acc[key] = issue.message;
    return acc;
  }, {});
}

function errorPayload(message: string, details?: string) {
  if (isDevelopmentMode()) {
    return { error: message, ...(details ? { details } : {}) };
  }
  return { error: message };
}

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (origin && allowedOrigins.includes(origin as (typeof allowedOrigins)[number])) return true;
  if (referer) {
    return allowedOrigins.some((allowed) => referer.startsWith(allowed));
  }
  return false;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  await csrfProtect(request, response);
  // csrfProtect sets the CSRF token on the response header (and the CSRF cookie on the response).
  // We return the same response object to preserve Set-Cookie for POST validation.
  return response;
}

export async function POST(request: NextRequest) {
  const configCheck = validateRouteSecurityConfig('waitlist');
  if (!configCheck.ok) {
    return NextResponse.json(errorPayload(configCheck.message, configCheck.details), { status: configCheck.status });
  }

  // Always validate request body shape early so invalid payloads return 400
  // rather than falling through to generic 500 handling.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if ((body as any)?.website) {
    return NextResponse.json({ success: true, message: 'Successfully joined waitlist' });
  }

  try {
    waitlistSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError || (error as any)?.name === 'ZodError') {
      return NextResponse.json({ errors: mapZodErrors(error as ZodError) }, { status: 400 });
    }
    return NextResponse.json(errorPayload('Invalid request body.'), { status: 400 });
  }

  if (!validateOrigin(request)) {
    return NextResponse.json(
      errorPayload('Forbidden origin.', 'Request origin or referer is not in the allowed origins list.'),
      { status: 403 }
    );
  }

  const response = NextResponse.next();
  try {
    await csrfProtect(request, response);
  } catch {
    return NextResponse.json(
      errorPayload('Invalid CSRF token.', 'Fetch a fresh CSRF token from GET /api/waitlist before submitting.'),
      { status: 403 }
    );
  }

  const ip = getClientIp(request);
  if (waitlistLimiter) {
    const { success } = await waitlistLimiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
  }

  try {
    const parsed = body as any;
    const captchaOk = await verifyRecaptchaToken(parsed.recaptchaToken);
    if (!captchaOk) {
      return NextResponse.json(
        errorPayload('reCAPTCHA verification failed.', 'Check NEXT_PUBLIC_RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY.'),
        { status: 400 }
      );
    }

    await sendWaitlistContact(parsed);
    return NextResponse.json({ success: true, message: 'Successfully joined waitlist' });
  } catch (error) {
    console.error('Waitlist submission error:', error);
    return NextResponse.json(
      errorPayload('Unable to submit waitlist request.', error instanceof Error ? error.message : 'Unknown server error'),
      { status: 500 }
    );
  }
}
