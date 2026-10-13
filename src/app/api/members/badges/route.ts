import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { getMemberBadgesShowcase } from '@/lib/members/gamification';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const badgesShowcase = await getMemberBadgesShowcase(session.userId);

    return NextResponse.json({
      success: true,
      badges: badgesShowcase,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Failed to get badges showcase:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve badges showcase.' },
      { status: 500 }
    );
  }
}
