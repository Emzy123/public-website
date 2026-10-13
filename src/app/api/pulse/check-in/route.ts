import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { recordMemberWeeklyCheckIn } from '@/lib/pulse/pulse';
import { validateOrigin } from '@/lib/security/origin';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
    const session = await requireAuth(request);

    // Limit check-in attempts to 10 per hour per user
    const limit = await enforceRateLimit(session.userId, 'pulse-check-in', 10, 3600);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many check-in attempts. Please try again later.' },
        { status: 429, headers: limit.headers }
      );
    }

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
