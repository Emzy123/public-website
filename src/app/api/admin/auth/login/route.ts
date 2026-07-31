import { NextRequest, NextResponse } from 'next/server';
import { createSession, sessionCookieOptions, validateCredentials } from '@admin/lib/auth';
import { isMfaEnabled, verifyTotp } from '@admin/lib/mfa';
import { writeAuditLog } from '@/lib/audit/log';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = await enforceRateLimit(ip, 'admin-login', 5, 15 * 60);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429, headers: limited.headers }
    );
  }

  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim();
    const password = String(body?.password ?? '');
    const totpCode = String(body?.totpCode ?? '').trim();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (isMfaEnabled() && !totpCode) {
      return NextResponse.json({ error: 'Authentication code is required', mfaRequired: true }, { status: 400 });
    }

    if (!validateCredentials(email, password)) {
      await writeAuditLog({
        action: 'admin.login_failed',
        actor: email,
        ip,
        metadata: { reason: 'invalid_credentials' },
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (isMfaEnabled() && !verifyTotp(totpCode)) {
      await writeAuditLog({
        action: 'admin.login_failed',
        actor: email,
        ip,
        metadata: { reason: 'invalid_totp' },
      });
      return NextResponse.json({ error: 'Invalid authentication code' }, { status: 401 });
    }

    const token = await createSession(email);
    await writeAuditLog({
      action: 'admin.login',
      actor: email,
      ip,
    });

    const response = NextResponse.json({ success: true, email, mfaRequired: isMfaEnabled() });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
