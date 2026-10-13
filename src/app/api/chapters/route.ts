import { NextRequest, NextResponse } from 'next/server';
import { listChapters, getChaptersDirectoryStats } from '@/lib/chapters/chapters';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const state = searchParams.get('state') || undefined;

    const [chapterList, stats] = await Promise.all([
      listChapters({ search, state }),
      getChaptersDirectoryStats(),
    ]);

    return NextResponse.json({
      success: true,
      chapters: chapterList,
      stats,
    });
  } catch (error) {
    console.error('Failed to list chapters:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chapters directory.' },
      { status: 500 }
    );
  }
}
