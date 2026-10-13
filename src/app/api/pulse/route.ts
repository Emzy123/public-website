import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyPulseFeed } from '@/lib/pulse/pulse';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const chapterId = session?.chapterIds?.[0] || null;

    const feed = await getWeeklyPulseFeed(chapterId);

    return NextResponse.json({
      success: true,
      feed,
    });
  } catch (error) {
    console.error('Failed to get weekly pulse feed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve weekly pulse feed.' },
      { status: 500 }
    );
  }
}
