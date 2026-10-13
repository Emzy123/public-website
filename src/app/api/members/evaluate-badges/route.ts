import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { evaluateMemberBadges, getMemberBadgesShowcase } from '@/lib/members/gamification';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const newlyAwarded = await evaluateMemberBadges(session.userId);
    const updatedBadges = await getMemberBadgesShowcase(session.userId);

    return NextResponse.json({
      success: true,
      newlyAwarded,
      badges: updatedBadges,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Failed to evaluate badges:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate badges.' },
      { status: 500 }
    );
  }
}
