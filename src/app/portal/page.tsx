import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isPostgresConfigured, db } from '@/lib/db';
import { getMongoDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { memberProfiles, memberIds, chapters, universities, userBadges, badges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  createMemberVerificationSignature,
  generateMemberQrDataUrl,
} from '@/lib/members/member-id';
import { getMemberBadgesShowcase } from '@/lib/members/gamification';
import { getWeeklyPulseFeed } from '@/lib/pulse/pulse';
import { SITE_URL } from '@/lib/site-config';
import { PortalClient } from './PortalClient';

export const metadata = {
  title: 'Member Portal — SINet',
  description: 'Manage your membership, view your digital Member ID Card, and explore campus chapter activities.',
};

export default async function PortalPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }

  // 1. Fetch profile from PostgreSQL if configured
  let profile: any = null;
  let memberIdRecord: any = null;
  let chapter: any = null;
  let university: any = null;

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
    } catch (pgErr) {
      console.warn('[Portal] PostgreSQL queries skipped/offline:', pgErr);
    }
  }

  // 2. Fall back to MongoDB if profile not found in Postgres
  if (!profile) {
    try {
      const mongo = await getMongoDb();
      if (mongo) {
        const mongoQuery: Record<string, unknown> = {
          $or: [{ email: session.email }],
        };
        if (ObjectId.isValid(session.userId)) {
          (mongoQuery.$or as Array<Record<string, unknown>>).push({ _id: new ObjectId(session.userId) });
        }

        const mDoc = await mongo.collection('members').findOne(mongoQuery);
        if (mDoc) {
          profile = {
            id: String(mDoc._id),
            userId: session.userId,
            fullName: (mDoc.fullName as string) || session.email.split('@')[0],
            avatarUrl: (mDoc.avatarUrl as string) || null,
            bio: (mDoc.bio as string) || 'Student member of SINet higher education network.',
            programme: (mDoc.course as string) || (mDoc.programme as string) || 'Undergraduate Member',
            level: (mDoc.level as string) || 'Active',
            division: (mDoc.pathway as any) || 'student_finance',
            status: 'active' as const,
            referralCode: `SIN${String(mDoc._id).slice(-6).toUpperCase()}`,
            profileCompletenessPct: 85,
          };
        }
      }
    } catch (mongoErr) {
      console.warn('[Portal] MongoDB member fallback warning:', mongoErr);
    }
  }

  // 3. Fallback default profile if new user
  if (!profile) {
    profile = {
      id: session.userId,
      userId: session.userId,
      fullName: session.email.split('@')[0],
      avatarUrl: null,
      bio: 'Verified student member of SINet higher education network.',
      programme: 'Student Enterprise & Finance',
      level: 'Undergraduate',
      division: 'student_finance' as const,
      status: 'active' as const,
      referralCode: `SIN${session.userId.slice(-6).toUpperCase()}`,
      profileCompletenessPct: 80,
    };
  }

  // Fetch gamified badge showcase and weekly pulse feed
  const [badgesShowcase, pulseFeed] = await Promise.all([
    getMemberBadgesShowcase(session.userId),
    getWeeklyPulseFeed(chapter?.id),
  ]);

  // Build digital card
  let memberCard = null;
  const effectiveMemberId = memberIdRecord?.memberId || (profile?.referralCode ? `SIN-${profile.referralCode}` : `SIN-MBR-${String(session.userId).slice(-6).toUpperCase()}`);
  const issuedDate = memberIdRecord?.issuedAt || new Date();
  const signature = createMemberVerificationSignature(
    effectiveMemberId,
    session.userId,
    issuedDate
  );
  const verificationUrl = `${SITE_URL}/verify/${effectiveMemberId}?sig=${signature}`;
  const qrDataUrl = await generateMemberQrDataUrl(verificationUrl);

  memberCard = {
    fullName: profile?.fullName || session.email.split('@')[0],
    avatarUrl: profile?.avatarUrl || null,
    memberId: effectiveMemberId,
    campusCode: memberIdRecord?.campusCode || 'KOGI',
    chapterName: chapter?.name || 'Kogi State Student Chapter',
    universityName: university?.name || 'Federal University Lokoja (FULOKOJA)',
    division: profile?.division || 'student_finance',
    programme: profile?.programme || 'Undergraduate Member',
    level: profile?.level || 'Active',
    issuedAt: issuedDate.toISOString(),
    verificationUrl,
    qrDataUrl,
    signature,
  };

  const userData = {
    id: session.userId,
    email: session.email,
    phone: session.phone || null,
    roles: session.roles,
    is2faAuthenticated: session.is2faAuthenticated,
    profile: profile || null,
    memberId: memberIdRecord?.memberId || null,
    memberCard,
    chapter: chapter
      ? {
          id: chapter.id,
          name: chapter.name,
          slug: chapter.slug,
          universityName: university?.name,
          universityShortName: university?.shortName,
        }
      : null,
    badges: badgesShowcase.map((b) => ({
      id: b.badge.id,
      name: b.badge.name,
      description: b.badge.description,
      iconName: b.badge.iconName,
      isUnlocked: b.isUnlocked,
      awardedAt: b.awardedAt ? b.awardedAt.toISOString() : null,
    })),
  };

  return <PortalClient user={userData} pulseFeed={pulseFeed} />;
}
