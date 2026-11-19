import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db, isPostgresConfigured, sanitizeDatabaseError } from '@/lib/db';
import { getMongoDb } from '@/lib/db/mongodb';
import { memberProfiles, memberIds, chapters, universities, userBadges, badges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  createMemberVerificationSignature,
  generateMemberQrDataUrl,
} from '@/lib/members/member-id';
import { SITE_URL } from '@/lib/site-config';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  let profile: any = null;
  let memberIdRecord: any = null;
  let chapter: any = null;
  let university: any = null;
  let earnedBadges: any[] = [];
  let memberCard: any = null;
  let isDegraded = false;

  // 1. Try PostgreSQL if configured
  if (isPostgresConfigured()) {
    try {
      const [p] = await db
        .select()
        .from(memberProfiles)
        .where(eq(memberProfiles.userId, session.userId))
        .limit(1);
      profile = p || null;

      const [mId] = await db
        .select()
        .from(memberIds)
        .where(eq(memberIds.userId, session.userId))
        .limit(1);
      memberIdRecord = mId || null;

      if (profile?.chapterId) {
        const [ch] = await db
          .select()
          .from(chapters)
          .where(eq(chapters.id, profile.chapterId))
          .limit(1);
        chapter = ch || null;

        if (chapter?.universityId) {
          const [uni] = await db
            .select()
            .from(universities)
            .where(eq(universities.id, chapter.universityId))
            .limit(1);
          university = uni || null;
        }
      }

      earnedBadges = await db
        .select({
          id: badges.id,
          name: badges.name,
          description: badges.description,
          iconName: badges.iconName,
          awardedAt: userBadges.awardedAt,
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, session.userId));
    } catch (pgErr) {
      isDegraded = true;
      console.warn('[API/Auth/Me] Postgres query failed, falling back to Mongo/claims:', sanitizeDatabaseError(pgErr));
    }
  } else {
    isDegraded = true;
  }

  // 2. Fall back to MongoDB if Postgres was offline or returned no profile
  if (!profile) {
    try {
      const mongo = await getMongoDb();
      if (mongo) {
        const mDoc = await mongo.collection('members').findOne({
          $or: [{ email: session.email }, { userId: session.userId }],
        });
        if (mDoc) {
          profile = {
            id: String(mDoc._id),
            userId: session.userId,
            fullName: (mDoc.fullName as string) || session.email.split('@')[0],
            avatarUrl: (mDoc.avatarUrl as string) || null,
            bio: (mDoc.bio as string) || null,
            programme: (mDoc.course as string) || (mDoc.programme as string) || 'Member',
            level: (mDoc.level as string) || null,
            division: (mDoc.pathway as string) || 'student_finance',
            status: (mDoc.status as string) || 'active',
            referralCode: mDoc.referralCode || `SIN${String(mDoc._id).slice(-6).toUpperCase()}`,
            profileCompletenessPct: 80,
          };
        }
      }
    } catch (mongoErr) {
      console.warn('[API/Auth/Me] Mongo fallback failed:', mongoErr);
    }
  }

  // 3. Fall back to verified JWT claims if neither DB had a profile
  if (!profile) {
    profile = {
      id: session.userId,
      userId: session.userId,
      fullName: session.email.split('@')[0],
      avatarUrl: null,
      bio: null,
      programme: 'Member',
      level: null,
      division: 'student_finance',
      status: 'active',
      referralCode: `SIN${String(session.userId).slice(-6).toUpperCase()}`,
      profileCompletenessPct: 75,
    };
  }

  // Build digital Member ID card payload if minted
  if (memberIdRecord) {
    const signature = createMemberVerificationSignature(
      memberIdRecord.memberId,
      session.userId,
      memberIdRecord.issuedAt
    );
    const verificationUrl = `${SITE_URL}/verify/${memberIdRecord.memberId}?sig=${signature}`;
    const qrDataUrl = await generateMemberQrDataUrl(verificationUrl);

    memberCard = {
      memberId: memberIdRecord.memberId,
      campusCode: memberIdRecord.campusCode,
      issuedAt: memberIdRecord.issuedAt,
      signature,
      verificationUrl,
      qrDataUrl,
    };
  }

  return NextResponse.json({
    authenticated: true,
    ...(isDegraded ? { degraded: true } : {}),
    user: {
      id: session.userId,
      email: session.email,
      phone: session.phone,
      roles: session.roles,
      chapterIds: session.chapterIds,
      is2faAuthenticated: session.is2faAuthenticated,
      profile: profile || null,
      memberId: memberIdRecord?.memberId || null,
      memberCard,
      chapter: chapter
        ? {
            ...chapter,
            universityName: university?.name,
            universityShortName: university?.shortName,
          }
        : null,
      badges: earnedBadges,
    },
  });
}
