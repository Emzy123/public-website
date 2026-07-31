import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@admin/lib/auth';
import { previewCookieOptions } from '@admin/lib/preview';

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  cookies().set(previewCookieOptions(true));
  return NextResponse.json({ success: true });
}
