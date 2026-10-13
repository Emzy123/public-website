import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
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

  // Fetch full profile and associated data
  const [profile] = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, session.userId))
    .limit(1);

  // Fetch Member ID if approved
  const [memberIdRecord] = await db
    .select()
    .from(memberIds)
    .where(eq(memberIds.userId, session.userId))
    .limit(1);

  // Fetch chapter and university if assigned
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

  // Fetch user badges
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

  // Build digital Member ID card payload if minted
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
