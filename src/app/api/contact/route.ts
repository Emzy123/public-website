import { NextRequest, NextResponse } from 'next/server';
import { ContactSchema } from '@/lib/schemas/contact.schema';
import { getMongoDb } from '@/lib/db/mongodb';
import { sendContactNotification } from '@/lib/email/contact-mail';
import { sendAdminSubmissionAlert } from '@/lib/email/admin-notify';
import { issueCsrfToken, verifyCsrfToken } from '@/lib/security/csrf-handler';
import { validateOrigin } from '@/lib/security/origin';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { isDevelopmentMode } from '@/lib/runtime/envMode';
import { validateRouteSecurityConfig } from '@/lib/runtime/securityConfig';

function errorPayload(message: string, details?: string) {
  if (isDevelopmentMode()) {
    return { success: false, message, ...(details ? { details } : {}) };
  }
  return { success: false, message };
}

export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(request: NextRequest) {
  const configCheck = validateRouteSecurityConfig('contact');
  if (!configCheck.ok) {
    return NextResponse.json(errorPayload(configCheck.message, configCheck.details), { status: configCheck.status });
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
  const limited = await enforceRateLimit(ip, 'contact', 8, 15 * 60);
  if (!limited.ok) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      { status: 429, headers: limited.headers }
    );
  }

  try {
    const body = await request.json();
    if (body?.website) {
      return NextResponse.json({ success: true });
    }
    const validated = ContactSchema.parse(body);
    const db = await getMongoDb();

    await db.collection('contactMessages').insertOne({
      name: validated.name,
      email: validated.email,
      subject: validated.subject,
      message: validated.message,
      createdAt: new Date(),
    });

    try {
      await sendContactNotification({
        name: validated.name,
        email: validated.email,
        subject: validated.subject,
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
        subject: validated.subject,
      });
    } catch (error) {
      console.warn('Admin submission alert failed:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Contact API error:', error);
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, errors: (error as unknown as { issues: unknown }).issues }, { status: 400 });
    }
    const details = isDevelopmentMode() && error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      errorPayload('Upstream error', details),
      { status: 502 }
    );
  }
}
