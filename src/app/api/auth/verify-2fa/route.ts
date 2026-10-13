import { NextRequest, NextResponse } from 'next/server';
import { Verify2faSchema } from '@/lib/schemas/auth.schema';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { verifyTotpCode } from '@/lib/auth/totp';
import { writeAdminAudit } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { validateOrigin } from '@/lib/security/origin';

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const body = await request.json().catch(() => ({}));
  const parsed = Verify2faSchema.safeParse(body);

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid code format';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  const { code } = parsed.data;

  // Rate limit: 5 attempts per 5 minutes
  const limit = await enforceRateLimit(`${ip}:${session.email}`, 'member-2fa', 5, 300);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many 2FA attempts. Please wait a few minutes.' },
      { status: 429, headers: limit.headers }
    );
  }

  // Find user's secret or global ADMIN_TOTP_SECRET fallback
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const secret = user?.totpSecret || process.env.ADMIN_TOTP_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: '2FA is not configured for this account. Contact system administrator.' },
      { status: 400 }
    );
  }

  const isValid = verifyTotpCode(secret, code);
  if (!isValid) {
    await writeAdminAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: 'admin.2fa_failed',
      resource: 'auth',
      ipAddress: ip,
    });
    return NextResponse.json({ error: 'Invalid 2FA authentication code.' }, { status: 401 });
  }

  // 2FA successful: elevate session token
  const elevatedToken = await createSessionToken({
    ...session,
    is2faAuthenticated: true,
  });

  await writeAdminAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: 'admin.2fa_success',
    resource: 'auth',
    ipAddress: ip,
  });

  const response = NextResponse.json({
    success: true,
    message: 'Two-factor authentication successful.',
  });

  setSessionCookie(response, elevatedToken);
  return response;
}
