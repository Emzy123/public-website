import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { sendWaitlistContact } from '@/lib/email';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { waitlistSchema } from '@/lib/schemas/waitlist.schema';
import { issueCsrfToken, verifyCsrfToken } from '@/lib/security/csrf-handler';
import { validateOrigin } from '@/lib/security/origin';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { isDevelopmentMode } from '@/lib/runtime/envMode';
import { validateRouteSecurityConfig } from '@/lib/runtime/securityConfig';

import { getMongoDb } from '@/lib/db/mongodb';

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

export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(request: NextRequest) {
  const configCheck = validateRouteSecurityConfig('waitlist');
  if (!configCheck.ok) {
    return NextResponse.json(errorPayload(configCheck.message, configCheck.details), { status: configCheck.status });
  }

  let body: unknown;
  try {
    body = await request.clone().json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!validateOrigin(request)) {
    return NextResponse.json(
      errorPayload('Forbidden origin.', 'Request origin or referer is not in the allowed origins list.'),
      { status: 403 }
    );
  }

  const csrfCheck = await verifyCsrfToken(request);
  if (!csrfCheck.ok) return csrfCheck.response;

  const ip = getClientIp(request);
  const limited = await enforceRateLimit(ip, 'waitlist', 5, 60);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: limited.headers }
    );
  }

  try {
    const bodyObj = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
    if (bodyObj?.website) {
      return NextResponse.json({ success: true, message: 'Successfully joined waitlist' });
    }

    const parsed = waitlistSchema.parse(body);
    const captchaOk = await verifyRecaptchaToken(parsed.recaptchaToken);
    if (!captchaOk) {
      return NextResponse.json(
        errorPayload('reCAPTCHA verification failed.', 'Check NEXT_PUBLIC_RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY.'),
        { status: 400 }
      );
    }

    // Save to MongoDB
    const db = await getMongoDb();
    const email = parsed.email.toLowerCase();
    const insert = await db.collection('waitlistSubmissions').updateOne(
      { email },
      { $setOnInsert: { fullName: parsed.fullName, email, phoneNumber: parsed.phoneNumber || '', country: parsed.country, userType: parsed.userType, sectorInterest: parsed.sectorInterest, investmentInterest: parsed.investmentInterest || '', hearAbout: parsed.hearAbout || '', createdAt: new Date() } },
      { upsert: true }
    );
    if (!insert.upsertedCount) return NextResponse.json({ success: true, message: 'You are already on the waitlist.' });

    await sendWaitlistContact(parsed);
    return NextResponse.json({ success: true, message: 'Successfully joined waitlist' });
  } catch (error) {
    if (error instanceof ZodError || (error as { name?: string })?.name === 'ZodError') {
      return NextResponse.json({ errors: mapZodErrors(error as ZodError) }, { status: 400 });
    }

    console.error('Waitlist submission error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';

    const resendMisconfigured =
      errMessage.includes('RESEND_API_KEY') || errMessage.includes('RESEND_AUDIENCE_ID');
    const safeMessage = resendMisconfigured
      ? 'Email service is not configured. Please set RESEND_API_KEY and RESEND_AUDIENCE_ID.'
      : errMessage;

    return NextResponse.json(
      errorPayload(safeMessage, resendMisconfigured ? undefined : errMessage),
      { status: 500 }
    );
  }
}
