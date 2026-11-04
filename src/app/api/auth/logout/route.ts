import { NextRequest, NextResponse } from 'next/server';
import {
  MEMBER_SESSION_COOKIE,
  clearSessionCookie,
  peekSessionClaims,
} from '@/lib/auth/session';
import { revokeMemberSession } from '@/lib/auth/session-revocation';
import { validateOrigin } from '@/lib/security/origin';

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const token = request.cookies.get(MEMBER_SESSION_COOKIE)?.value;
  if (token) {
    const claims = peekSessionClaims(token);
    if (claims.jti) {
      await revokeMemberSession({
        userId: claims.userId,
        jti: claims.jti,
        expiresAtMs: claims.expMs,
      });
    }
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  clearSessionCookie(response);
  return response;
}
