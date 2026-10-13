import { NextRequest, NextResponse } from 'next/server';
import { getChapterBySlug } from '@/lib/chapters/chapters';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const chapter = await getChapterBySlug(params.slug);
    if (!chapter) {
      return NextResponse.json(
        { error: `Chapter '${params.slug}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      chapter,
    });
  } catch (error) {
    console.error(`Failed to get chapter ${params.slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve chapter details.' },
      { status: 500 }
    );
  }
}
