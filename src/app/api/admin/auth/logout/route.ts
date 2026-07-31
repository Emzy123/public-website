import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@admin/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(clearSessionCookie());
  return response;
}
