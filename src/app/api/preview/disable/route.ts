import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { previewCookieOptions } from '@admin/lib/preview';

export async function POST() {
  cookies().set(previewCookieOptions(false));
  return NextResponse.json({ success: true });
}
