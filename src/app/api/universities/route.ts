import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { universities } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { FALLBACK_KOGI_CHAPTERS } from '@/lib/chapters/chapters';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db
      .select({
        id: universities.id,
        name: universities.name,
        shortName: universities.shortName,
        campusCode: universities.campusCode,
        state: universities.state,
      })
      .from(universities)
      .orderBy(asc(universities.name));

    return NextResponse.json({
      success: true,
      universities: list,
    });
  } catch (error) {
    console.warn('[Universities] DB query failed, using built-in chapters catalog fallback:', error);
    const fallbackList = FALLBACK_KOGI_CHAPTERS.map((c) => ({
      id: c.universityId,
      name: c.universityName,
      shortName: c.universityShortName,
      campusCode: c.campusCode,
      state: c.state,
    }));

    return NextResponse.json({
      success: true,
      universities: fallbackList,
      degraded: true,
    });
  }
}
