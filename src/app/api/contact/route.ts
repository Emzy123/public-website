import { NextRequest, NextResponse } from 'next/server';
import { ContactSchema } from '@/lib/schemas/contact.schema';
import { getMongoDb } from '@/lib/db/mongodb';
import { sendContactNotification } from '@/lib/email/contact-mail';
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
    routeKey: 'contact',
    rateLimitPrefix: 'contact',
    maxRequests: 8,
    windowSeconds: 15 * 60,
  });
  if (blocked) {
    // Preserve legacy envelope for contact clients where possible
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

    const validated = ContactSchema.parse(body);
    const db = await getMongoDb();
    const isTest =
      validated.email.toLowerCase() === 'test@example.com' ||
      validated.email.toLowerCase().endsWith('@example.com') ||
      validated.message.toLowerCase().includes('production smoke test');

    const result = await db.collection('contactMessages').insertOne({
      name: validated.name,
      email: validated.email,
      topic: validated.topic || 'General',
      subject: validated.subject,
      message: validated.message,
      isTest,
      createdAt: new Date(),
    });

    const referenceId = `SNT-${String(result.insertedId).slice(-6).toUpperCase()}`;

    try {
      await sendContactNotification({
        name: validated.name,
        email: validated.email,
        subject: `[${validated.topic}] ${validated.subject}`,
        message: validated.message,
      });
    } catch (error) {
      console.warn('Contact email send failed:', error);
    }

    try {
      await sendAdminSubmissionAlert({
        type: 'contact',
        name: validated.name,
        email: validated.email,
        subject: `[${validated.topic}] ${validated.subject}`,
      });
    } catch (error) {
      console.warn('Admin submission alert failed:', error);
    }

    return NextResponse.json({ success: true, referenceId });
  } catch (error: unknown) {
    console.error('Contact API error:', error);
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Please review the highlighted fields.', errors: mapZodFieldErrors(error as import('zod').ZodError) },
        { status: 400 }
      );
    }
    const details = isDevelopmentMode() && error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { success: false, ...publicFormError('Unable to send your message. Please try again.', details) },
      { status: 502 }
    );
  }
}
