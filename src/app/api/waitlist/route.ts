import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { sendWaitlistContact } from '@/lib/email';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { waitlistSchema } from '@/lib/schemas/waitlist.schema';
import { issueCsrfToken } from '@/lib/security/csrf-handler';
import {
  enforcePublicFormGuards,
  isHoneypotTriggered,
  mapZodFieldErrors,
  publicFormError,
} from '@/lib/security/public-form';
import { isDevelopmentMode } from '@/lib/runtime/envMode';
import { getMongoDb } from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(request: NextRequest) {
  const blocked = await enforcePublicFormGuards(request, {
    routeKey: 'waitlist',
    rateLimitPrefix: 'waitlist',
    maxRequests: 5,
    windowSeconds: 60,
  });
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.clone().json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (isHoneypotTriggered(body)) {
    return NextResponse.json({ success: true, message: 'Successfully joined waitlist' });
  }

  try {
    const parsed = waitlistSchema.parse(body);
    const captchaOk = await verifyRecaptchaToken(parsed.recaptchaToken);
    if (!captchaOk) {
      return NextResponse.json(
        publicFormError('reCAPTCHA verification failed.', 'Check NEXT_PUBLIC_RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY.'),
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const email = parsed.email.toLowerCase();
    const insert = await db.collection('waitlistSubmissions').updateOne(
      { email },
      {
        $setOnInsert: {
          fullName: parsed.fullName,
          email,
          phoneNumber: parsed.phoneNumber || '',
          country: parsed.country,
          userType: parsed.userType,
          sectorInterest: parsed.sectorInterest,
          investmentInterest: parsed.investmentInterest || '',
          hearAbout: parsed.hearAbout || '',
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    if (!insert.upsertedCount) {
      return NextResponse.json({ success: true, message: 'You are already on the waitlist.' });
    }

    await sendWaitlistContact(parsed);
    return NextResponse.json({ success: true, message: 'Successfully joined waitlist' });
  } catch (error) {
    if (error instanceof ZodError || (error as { name?: string })?.name === 'ZodError') {
      return NextResponse.json({ error: 'Please review the highlighted fields.', errors: mapZodFieldErrors(error as ZodError) }, { status: 400 });
    }

    console.error('Waitlist submission error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown server error';
    const resendMisconfigured =
      errMessage.includes('RESEND_API_KEY') || errMessage.includes('RESEND_AUDIENCE_ID');
    const safeMessage = resendMisconfigured
      ? 'Email service is temporarily unavailable. Please try again later.'
      : 'Unable to process your request. Please try again later.';

    return NextResponse.json(
      publicFormError(safeMessage, isDevelopmentMode() ? errMessage : undefined),
      { status: 500 }
    );
  }
}
