import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { memberProfiles, memberIds, chapters, universities, userBadges, badges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  createMemberVerificationSignature,
  generateMemberQrDataUrl,
} from '@/lib/members/member-id';
import { SITE_URL } from '@/lib/site-config';
import { PortalClient } from './PortalClient';

export const metadata = {
  title: 'Member Portal — Student Investment Network',
  description: 'Manage your student membership, view your digital Member ID Card, and explore campus chapter activities.',
};

export default async function PortalPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }

  // Fetch full profile
  const [profile] = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, session.userId))
    .limit(1);

  // Fetch Member ID record
  const [memberIdRecord] = await db
    .select()
    .from(memberIds)
    .where(eq(memberIds.userId, session.userId))
    .limit(1);

  // Fetch chapter and university
  let chapter = null;
  let university = null;
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

  // Fetch badges
  const earnedBadges = await db
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

  // Build digital card if member ID is minted
  let memberCard = null;
  if (memberIdRecord) {
    const signature = createMemberVerificationSignature(
      memberIdRecord.memberId,
      session.userId,
      memberIdRecord.issuedAt
    );
    const verificationUrl = `${SITE_URL}/verify/${memberIdRecord.memberId}?sig=${signature}`;
    const qrDataUrl = await generateMemberQrDataUrl(verificationUrl);

    memberCard = {
      fullName: profile?.fullName || session.email.split('@')[0],
      avatarUrl: profile?.avatarUrl || null,
      memberId: memberIdRecord.memberId,
      campusCode: memberIdRecord.campusCode,
      chapterName: chapter?.name || null,
      universityName: university?.name || null,
      division: profile?.division || null,
      programme: profile?.programme || null,
      level: profile?.level || null,
      issuedAt: memberIdRecord.issuedAt.toISOString(),
      verificationUrl,
      qrDataUrl,
      signature,
    };
  }

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
    badges: earnedBadges.map((b) => ({
      ...b,
      awardedAt: b.awardedAt.toISOString(),
    })),
  };

  return <PortalClient user={userData} />;
}
