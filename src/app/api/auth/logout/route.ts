import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';
import { validateOrigin } from '@/lib/security/origin';

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  clearSessionCookie(response);
  return response;
}
