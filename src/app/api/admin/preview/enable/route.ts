import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@admin/lib/auth';
import { previewCookieOptions } from '@admin/lib/preview';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;

  cookies().set(previewCookieOptions(true));
  return NextResponse.json({ success: true });
}
