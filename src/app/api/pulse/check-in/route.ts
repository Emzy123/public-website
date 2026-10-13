import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { recordMemberWeeklyCheckIn } from '@/lib/pulse/pulse';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const result = await recordMemberWeeklyCheckIn(session.userId);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Weekly check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to record check-in.' },
      { status: 500 }
    );
  }
}
