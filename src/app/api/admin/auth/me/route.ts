import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@admin/lib/auth';
import { csrfProtect } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true, email: session.email });
  await csrfProtect(request, response);
  return response;
}
