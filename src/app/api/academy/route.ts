import { NextRequest, NextResponse } from 'next/server';
import { AcademyInterestSchema } from '@/lib/schemas/academy.schema';
import { getMongoDb } from '@/lib/db/mongodb';
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
  const configCheck = validateRouteSecurityConfig('academy');
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
  const limited = await enforceRateLimit(ip, 'academy', 10, 15 * 60);
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
      return NextResponse.json({ success: false, errors: (error as unknown as { issues: unknown }).issues }, { status: 400 });
    }
    const details = isDevelopmentMode() && error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      errorPayload('Upstream error', details),
      { status: 502 }
    );
  }
}
