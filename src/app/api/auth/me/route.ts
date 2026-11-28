import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db, isPostgresConfigured, sanitizeDatabaseError } from '@/lib/db';
import { getMongoDb } from '@/lib/db/mongodb';
import { userBadges, badges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getMemberCredential,
  generateMemberQrDataUrl,
  type MemberCredential,
} from '@/lib/members/member-id';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  let credential: MemberCredential | null = null;
  let profile: any = null;
  let chapter: any = null;
  let university: any = null;
  let earnedBadges: any[] = [];
  let memberCard: any = null;
  let isDegraded = false;

  // 1. Try PostgreSQL via single source of truth credential lookup
  if (isPostgresConfigured()) {
    try {
      credential = await getMemberCredential(session.userId);
      if (credential) {
        profile = {
          id: credential.id,
          userId: credential.userId,
          fullName: credential.fullName,
          avatarUrl: credential.avatarUrl,
          bio: credential.bio,
          programme: credential.programme,
          level: credential.level,
          division: credential.division,
          status: credential.status,
          referralCode: credential.referralCode,
          profileCompletenessPct: credential.profileCompletenessPct,
          createdAt: credential.issuedAt,
        };
        if (credential.chapterId) {
          chapter = {
            id: credential.chapterId,
            name: credential.chapterName,
            slug: credential.chapterSlug,
          };
        }
        if (credential.universityName || credential.universityShortName) {
          university = {
            name: credential.universityName,
            shortName: credential.universityShortName,
          };
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

  // Build digital Member ID card payload strictly when credential is active
  if (
    credential &&
    credential.status === 'active' &&
    credential.signature &&
    credential.verificationUrl
  ) {
    const qrDataUrl = await generateMemberQrDataUrl(credential.verificationUrl);

    memberCard = {
      memberId: credential.memberId,
      campusCode: credential.campusCode,
      issuedAt: credential.issuedAt,
      signature: credential.signature,
      verificationUrl: credential.verificationUrl,
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
      memberId: credential?.isMinted ? credential.memberId : null,
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
