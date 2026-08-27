import { NextRequest, NextResponse } from 'next/server';
import { AcademyInterestSchema } from '@/lib/schemas/academy.schema';
import { getMongoDb } from '@/lib/db/mongodb';
import { sendAdminSubmissionAlert } from '@/lib/email/admin-notify';
import { issueCsrfToken } from '@/lib/security/csrf-handler';
import {
  enforcePublicFormGuards,
  isHoneypotTriggered,
  mapZodFieldErrors,
  publicFormError,
} from '@/lib/security/public-form';
import { isDevelopmentMode } from '@/lib/runtime/envMode';

export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(request: NextRequest) {
  const blocked = await enforcePublicFormGuards(request, {
    routeKey: 'academy',
    rateLimitPrefix: 'academy',
    maxRequests: 10,
    windowSeconds: 15 * 60,
  });
  if (blocked) {
    const payload = await blocked.json().catch(() => ({ error: 'Request blocked' }));
    return NextResponse.json(
      { success: false, message: payload.error || 'Request blocked', details: payload.details },
      { status: blocked.status, headers: blocked.headers }
    );
  }

  try {
    const body = await request.json();
    if (isHoneypotTriggered(body)) {
      return NextResponse.json({ success: true });
    }

    const validated = AcademyInterestSchema.parse(body);
    const db = await getMongoDb();

    await db.collection('academyInterests').insertOne({
      fullName: validated.fullName,
      email: validated.email,
      createdAt: new Date(),
    });

    try {
      await sendAdminSubmissionAlert({
        type: 'academy',
        name: validated.fullName,
        email: validated.email,
      });
    } catch (error) {
      console.warn('Admin submission alert failed:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Academy API error:', error);
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Please review the highlighted fields.', errors: mapZodFieldErrors(error as import('zod').ZodError) },
        { status: 400 }
      );
    }
    const details = isDevelopmentMode() && error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { success: false, ...publicFormError('Unable to save your interest. Please try again.', details) },
      { status: 502 }
    );
  }
}
