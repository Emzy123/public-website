import { NextRequest, NextResponse } from 'next/server';
import { issueCsrfToken } from '@/lib/security/csrf-handler';

export const runtime = 'nodejs';

/** Registration is admin-controlled via campaign links — no open walk-up submissions. */
export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Registration is currently closed. Applications are only accepted through an active campaign link shared by SINet.',
      redirect: '/membership',
    },
    { status: 403 },
  );
}
