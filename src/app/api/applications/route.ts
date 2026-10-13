import { NextRequest, NextResponse } from 'next/server';
import { getActiveMembershipApplication } from '@/lib/applications/active-link';

export const runtime = 'nodejs';

/** Registration is admin-controlled via campaign links — checks active campaign status. */
export async function GET(_request: NextRequest) {
  const target = await getActiveMembershipApplication();
  return NextResponse.json({
    active: target.status === 'open',
    url: target.status === 'open' ? target.url : null,
    slug: target.status === 'open' ? target.slug : null,
    name: target.status === 'open' ? target.name : null,
  });
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
