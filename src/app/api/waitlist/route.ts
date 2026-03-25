import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { allowedOrigins } from '@/lib/constants';
import { csrfProtect } from '@/lib/csrf';
import { sendWaitlistContact } from '@/lib/email';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { waitlistLimiter } from '@/lib/rateLimit';
import { waitlistSchema } from '@/lib/validation';

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
  const csrfToken = response.headers.get('x-csrf-token');
  return NextResponse.json({ csrfToken });
}

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const response = NextResponse.next();
  try {
    await csrfProtect(request, response);
  } catch {
    return NextResponse.json({ error: 'Invalid CSRF token.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (waitlistLimiter) {
    const { success } = await waitlistLimiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
  }

  try {
    const body = await request.json();
    if (body?.website) {
      return NextResponse.json({ success: true, message: 'Successfully joined waitlist' });
    }

    const parsed = waitlistSchema.parse(body);
    const captchaOk = await verifyRecaptchaToken(parsed.recaptchaToken);
    if (!captchaOk) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed.' }, { status: 400 });
    }

    await sendWaitlistContact(parsed);
    return NextResponse.json({ success: true, message: 'Successfully joined waitlist' });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ errors: mapZodErrors(error) }, { status: 400 });
    }

    console.error('Waitlist submission error:', error);
    return NextResponse.json({ error: 'Unable to submit waitlist request.' }, { status: 500 });
  }
}
