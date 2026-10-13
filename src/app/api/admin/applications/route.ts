import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireRole, AuthError, ForbiddenError } from '@/lib/auth/guards';
import { isGlobalAdmin } from '@/lib/auth/roles';
import { listApplications } from '@/lib/applications/campaigns';
import { getMongoDb } from '@/lib/db/mongodb';
import {
  REGISTRATION_LINKS_COLLECTION,
  serialiseRegistrationLink,
} from '@/lib/registration-links';
import { db } from '@/lib/db';
import { chapters } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export interface UnifiedApplication {
  id: string;
  campaignId: string | null;
  campaignName: string | null;
  userId: string | null;
  universityId: string;
  universityName: string;
  universityShortName: string;
  fullName: string;
  email: string;
  phone: string;
  programme: string;
  level: string;
  division: string;
  contributionPitch: string;
  photoUrl: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewRemarks: string | null;
  createdAt: string;
  source: 'mongo' | 'postgres';
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authorize admin session or chapter lead
    const session = await requireRole(
      ['super_admin', 'admin', 'chapter_lead'],
      request
    );

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'all';
    const linkIdParam = searchParams.get('linkId') || undefined;
    let universityId = searchParams.get('universityId') || undefined;
    const division = searchParams.get('division') || undefined;
    const searchQuery = searchParams.get('search')?.trim().toLowerCase() || undefined;

    const isGlobal = isGlobalAdmin(session.roles);
    if (!isGlobal && session.chapterIds.length > 0) {
      try {
        const leadChapters = await db
          .select({ universityId: chapters.universityId })
          .from(chapters)
          .where(inArray(chapters.id, session.chapterIds));
        const allowedUniIds = leadChapters.map((c) => c.universityId);
        if (allowedUniIds.length > 0 && (!universityId || !allowedUniIds.includes(universityId))) {
          universityId = allowedUniIds[0];
        }
      } catch {
        /* Postgres chapter lookup skipped */
      }
    }

    const allApps: UnifiedApplication[] = [];
    const linksList: ReturnType<typeof serialiseRegistrationLink>[] = [];

    // 2. Fetch from MongoDB applications collection (admin registration links)
    try {
      const mongo = await getMongoDb();

      // Load all campaign links for dashboard cards
      const linkDocs = await mongo
        .collection(REGISTRATION_LINKS_COLLECTION)
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      for (const lDoc of linkDocs) {
        linksList.push(serialiseRegistrationLink(lDoc as typeof lDoc & { _id: ObjectId }));
      }

      // Build MongoDB applications query
      const mongoQuery: Record<string, unknown> = {};

      if (linkIdParam) {
        if (ObjectId.isValid(linkIdParam)) {
          mongoQuery.$or = [
            { sourceLinkId: new ObjectId(linkIdParam) },
            { sourceLinkId: linkIdParam },
            { sourceLinkSlug: linkIdParam },
          ];
        } else {
          mongoQuery.$or = [
            { sourceLinkSlug: linkIdParam },
            { sourceLinkId: linkIdParam },
          ];
        }
      }

      if (statusParam !== 'all') {
        if (statusParam === 'submitted' || statusParam === 'under_review') {
          mongoQuery.status = { $in: ['pending', 'submitted', 'under_review'] };
        } else {
          mongoQuery.status = statusParam;
        }
      }

      const mongoDocs = await mongo
        .collection('applications')
        .find(mongoQuery)
        .sort({ submittedAt: -1, createdAt: -1 })
        .limit(200)
        .toArray();

      for (const doc of mongoDocs) {
        const data = (doc.data as Record<string, unknown>) || {};
        const rawStatus = String(doc.status || 'pending').toLowerCase();
        let appStatus: 'submitted' | 'under_review' | 'approved' | 'rejected' = 'submitted';
        if (rawStatus === 'approved') appStatus = 'approved';
        else if (rawStatus === 'rejected') appStatus = 'rejected';
        else if (rawStatus === 'under_review') appStatus = 'under_review';

        const fullName = String(data.fullName || doc.fullName || 'Anonymous Applicant');
        const email = String(data.email || doc.email || '');
        const phone = String(data.phone || doc.phone || '');
        const prog = String(data.programme || data.course || doc.role || 'Member');
        const level = String(data.level || 'Undergraduate');
        const div = String(data.division || doc.role || doc.pathway || 'community-member');
        const uni = String(data.institution || data.university || 'Kogi State Campuses');
        const pitch = String(data.pitch || data.statement || data.whyJoin || doc.contributionPitch || '');
        const photo = String(data.photoUrl || doc.photoUrl || '');

        // Search query filter
        if (searchQuery) {
          const match =
            fullName.toLowerCase().includes(searchQuery) ||
            email.toLowerCase().includes(searchQuery) ||
            phone.toLowerCase().includes(searchQuery) ||
            div.toLowerCase().includes(searchQuery);
          if (!match) continue;
        }

        allApps.push({
          id: String(doc._id),
          campaignId: doc.sourceLinkId ? String(doc.sourceLinkId) : null,
          campaignName: (doc.sourceLinkName as string) || (doc.sourceLinkSlug as string) || 'Admissions Drive',
          userId: null,
          universityId: (data.universityId as string) || 'kogi-state',
          universityName: uni,
          universityShortName: (data.universityShortName as string) || 'KOGI',
          fullName,
          email,
          phone,
          programme: prog,
          level,
          division: div,
          contributionPitch: pitch,
          photoUrl: photo,
          status: appStatus,
          reviewedBy: (doc.reviewedBy as string) || null,
          reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt as string | Date).toISOString() : null,
          reviewRemarks: (doc.reviewRemarks as string) || null,
          createdAt: doc.submittedAt
            ? new Date(doc.submittedAt as string | Date).toISOString()
            : doc.createdAt
            ? new Date(doc.createdAt as string | Date).toISOString()
            : new Date().toISOString(),
          source: 'mongo',
        });
      }
    } catch (mongoErr) {
      console.warn('[AdminApps] MongoDB query failed:', mongoErr);
    }

    // 3. Fetch from PostgreSQL applications (if not specifically filtering by Mongo linkId)
    if (!linkIdParam) {
      try {
        const pgStatus =
          statusParam === 'all'
            ? undefined
            : (statusParam as 'submitted' | 'under_review' | 'approved' | 'rejected');

        const pgApps = await listApplications({
          status: pgStatus,
          universityId,
          division: (division as 'student_finance' | 'student_enterprise' | 'governance_records') || undefined,
          limit: 100,
          offset: 0,
        });

        for (const app of pgApps) {
          if (searchQuery) {
            const match =
              app.fullName.toLowerCase().includes(searchQuery) ||
              app.email.toLowerCase().includes(searchQuery) ||
              app.phone.toLowerCase().includes(searchQuery);
            if (!match) continue;
          }

          allApps.push({
            ...app,
            createdAt:
              app.createdAt instanceof Date
                ? app.createdAt.toISOString()
                : String(app.createdAt),
            reviewedAt: app.reviewedAt
              ? app.reviewedAt instanceof Date
                ? app.reviewedAt.toISOString()
                : String(app.reviewedAt)
              : null,
            source: 'postgres',
          });
        }
      } catch (pgErr) {
        console.warn('[AdminApps] PostgreSQL query skipped/failed:', pgErr);
      }
    }

    // Sort all combined applications newest first
    allApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate aggregate metrics across both stores
    const pendingCount = allApps.filter(
      (a) => a.status === 'submitted' || a.status === 'under_review'
    ).length;
    const approvedCount = allApps.filter((a) => a.status === 'approved').length;
    const rejectedCount = allApps.filter((a) => a.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      applications: allApps,
      total: allApps.length,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: allApps.length,
      },
      links: linksList,
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
