import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isPostgresConfigured } from '@/lib/db';
import { getMongoDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import {
  getMemberCredential,
  generateMemberQrDataUrl,
  formatMemberId,
  getMemberTierSummary,
  type MemberCredential,
} from '@/lib/members/member-id';
import { cleanFullName } from '@/lib/members/display';
import { getMemberBadgesShowcase } from '@/lib/members/gamification';
import { getWeeklyPulseFeed } from '@/lib/pulse/pulse';
import { PortalClient } from './PortalClient';

export const metadata = {
  title: 'Member Portal — SINet',
  description: 'Manage your membership, view your digital Member ID Card, and explore community chapter activities.',
};

export default async function PortalPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }

  // 1. Fetch credential from PostgreSQL via the single source of truth shared with /verify
  let credential: MemberCredential | null = null;
  let profile: any = null;
  let chapter: any = null;
  let university: any = null;

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
          const cleanName = cleanFullName(mDoc.fullName as string, session.email);
          profile = {
            id: String(mDoc._id),
            userId: session.userId,
            fullName: cleanName || '',
            avatarUrl: (mDoc.avatarUrl as string) || null,
            bio: (mDoc.bio as string) || 'Member of the SINetwork Global community network.',
            programme: (mDoc.course as string) || (mDoc.programme as string) || 'General Member',
            level: (mDoc.level as string) || null,
            division: (mDoc.pathway as any) || 'student_finance',
            status: 'active' as const,
            referralCode: formatMemberId(mDoc.referralCode as string || String(mDoc._id).slice(-6)),
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
      fullName: '',
      avatarUrl: null,
      bio: 'Verified student member of SINet higher education network.',
      programme: 'Student Enterprise & Finance',
      level: null,
      division: 'student_finance' as const,
      status: 'pending' as const,
      referralCode: formatMemberId(session.userId.slice(-6)),
      profileCompletenessPct: 80,
    };
  }

  // Sanitize fullName if loaded from Postgres
  if (profile && profile.fullName) {
    profile.fullName = cleanFullName(profile.fullName, session.email) || '';
  }

  // Fetch gamified badge showcase and weekly pulse feed
  const [badgesShowcase, pulseFeed] = await Promise.all([
    getMemberBadgesShowcase(session.userId),
    getWeeklyPulseFeed(chapter?.id),
  ]);

  // Build digital card from single-source-of-truth credential.
  // Never synthesize a verification signature with new Date(); non-active or non-Postgres members
  // receive no signed link or verification QR.
  const effectiveMemberId =
    credential?.memberId ||
    formatMemberId(profile?.referralCode || `MBR-${String(session.userId).slice(-6).toUpperCase()}`);
  const issuedDate = credential?.issuedAt || null;
  const isActiveVerifiedCredential = Boolean(
    credential &&
      credential.status === 'active' &&
      credential.verificationUrl &&
      credential.signature
  );
  const verificationUrl = isActiveVerifiedCredential ? credential!.verificationUrl! : null;
  const signature = isActiveVerifiedCredential ? credential!.signature! : null;
  const qrDataUrl = verificationUrl ? await generateMemberQrDataUrl(verificationUrl) : null;

  const tierSummary = getMemberTierSummary({
    roles: session.roles,
    programme: profile?.programme,
    division: profile?.division,
    chapterName: chapter?.name,
    universityName: university?.name,
    universityShortName: university?.shortName,
  });

  const memberDisplayName = cleanFullName(profile?.fullName, session.email) || '';

  const memberCard = {
    fullName: memberDisplayName,
    avatarUrl: profile?.avatarUrl || null,
    memberId: effectiveMemberId,
    campusCode: credential?.campusCode || 'KOGI',
    chapterName: chapter?.name || 'Kogi State Student Chapter',
    universityName: university?.name || 'Federal University Lokoja (FULOKOJA)',
    division: profile?.division || 'student_finance',
    programme: profile?.programme || 'Undergraduate Member',
    level: profile?.level || null,
    status: profile?.status || 'pending',
    tierSummaryLine: tierSummary.summaryLine,
    issuedAt: issuedDate ? issuedDate.toISOString() : new Date().toISOString(),
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
    memberId: credential?.isMinted ? credential.memberId : null,
    memberCard,
    tierSummary,
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
