import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError, ForbiddenError } from '@/lib/auth/guards';
import { isGlobalAdmin } from '@/lib/auth/roles';
import { listApplications } from '@/lib/applications/campaigns';
import { db } from '@/lib/db';
import { chapters } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Allows global admins and chapter leads (moderators)
    const session = await requireRole(
      ['super_admin', 'admin', 'chapter_lead'],
      request
    );

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as
      | 'submitted'
      | 'under_review'
      | 'approved'
      | 'rejected'
      | null;
    let universityId = searchParams.get('universityId') || undefined;
    const division = searchParams.get('division') as
      | 'student_finance'
      | 'student_enterprise'
      | 'governance_records'
      | null;

    // Enforce campus scoping for Chapter Leads
    const isGlobal = isGlobalAdmin(session.roles);
    if (!isGlobal) {
      if (session.chapterIds.length === 0) {
        return NextResponse.json({
          success: true,
          applications: [],
          moderator: { id: session.userId, email: session.email, scoped: true },
        });
      }

      // Resolve universityId for the chapter lead's assigned chapters
      const leadChapters = await db
        .select({ universityId: chapters.universityId })
        .from(chapters)
        .where(inArray(chapters.id, session.chapterIds));

      const allowedUniIds = leadChapters.map((c) => c.universityId);
      if (allowedUniIds.length === 0) {
        return NextResponse.json({
          success: true,
          applications: [],
          moderator: { id: session.userId, email: session.email, scoped: true },
        });
      }

      // If universityId requested is outside allowed scope, force to their university
      if (!universityId || !allowedUniIds.includes(universityId)) {
        universityId = allowedUniIds[0];
      }
    }

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const apps = await listApplications({
      status: status || undefined,
      universityId,
      division: division || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      applications: apps,
      moderator: {
        id: session.userId,
        email: session.email,
        roles: session.roles,
        isGlobal,
        scopedChapterIds: session.chapterIds,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Admin applications listing error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve applications list' },
      { status: 500 }
    );
  }
}
