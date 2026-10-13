import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { universities } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

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
    console.error('Failed to fetch universities:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve universities list' },
      { status: 500 }
    );
  }
}
