import { db } from '@/lib/db';
import {
  badges,
  userBadges,
  memberProfiles,
  memberIds,
  userRoles,
  notifications,
  type Badge,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export type UserBadgeProgress = {
  badge: Badge;
  isUnlocked: boolean;
  awardedAt?: Date | null;
};

/**
 * Awards a badge to a member if not already held, and creates an in-portal notification.
 */
export async function awardBadgeToUser(
  userId: string,
  badgeId: string
): Promise<{ awarded: boolean; badge?: Badge }> {
  const [badge] = await db
    .select()
    .from(badges)
    .where(eq(badges.id, badgeId));

  if (!badge) {
    return { awarded: false };
  }

  const [existing] = await db
    .select()
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));

  if (existing) {
    return { awarded: false, badge };
  }

  await db.insert(userBadges).values({
    userId,
    badgeId,
  });

  // Create notification
  await db.insert(notifications).values({
    userId,
    title: `Badge Unlocked: ${badge.name}`,
    message: `Congratulations! You have earned the '${badge.name}' badge: ${badge.description}`,
    linkUrl: '/portal',
  });

  return { awarded: true, badge };
}

/**
 * Calculates profile completeness percentage and updates member profile record.
 */
export async function recalculateProfileCompleteness(
  userId: string
): Promise<number> {
  const [profile] = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, userId));

  if (!profile) return 0;

  let score = 0;
  if (profile.fullName && profile.fullName.trim().length >= 2) score += 20;
  if (profile.division) score += 20;
  if (profile.programme && profile.level) score += 20;
  if (profile.bio && profile.bio.trim().length >= 10) score += 20;
  if (profile.avatarUrl && !profile.avatarUrl.includes('placeholder')) score += 20;

  await db
    .update(memberProfiles)
    .set({
      profileCompletenessPct: score,
      updatedAt: new Date(),
    })
    .where(eq(memberProfiles.userId, userId));

  return score;
}

/**
 * Evaluates triggers and awards earned badges automatically.
 */
export async function evaluateMemberBadges(userId: string): Promise<string[]> {
  const newlyAwarded: string[] = [];

  // Check 1: Verified Member (Has minted member ID)
  const [memberIdRecord] = await db
    .select()
    .from(memberIds)
    .where(eq(memberIds.userId, userId));

  if (memberIdRecord) {
    const res = await awardBadgeToUser(userId, 'verified_member');
    if (res.awarded) newlyAwarded.push('verified_member');
  }

  // Check 2: Profile Complete (Score >= 100%)
  const score = await recalculateProfileCompleteness(userId);
  if (score >= 100) {
    const res = await awardBadgeToUser(userId, 'profile_complete');
    if (res.awarded) newlyAwarded.push('profile_complete');
  }

  // Check 3: Chapter Lead (Holds chapter_lead role)
  const [leadRole] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, 'chapter_lead')));

  if (leadRole) {
    const res = await awardBadgeToUser(userId, 'chapter_lead');
    if (res.awarded) newlyAwarded.push('chapter_lead');
  }

  // Check 4: First Referral
  const [profile] = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, userId));

  if (profile?.referralCode) {
    const [referredStudent] = await db
      .select({ id: memberProfiles.id })
      .from(memberProfiles)
      .where(eq(memberProfiles.referredByCode, profile.referralCode))
      .limit(1);

    if (referredStudent) {
      const res = await awardBadgeToUser(userId, 'first_referral');
      if (res.awarded) newlyAwarded.push('first_referral');
    }
  }

  return newlyAwarded;
}

/**
 * Returns all badges in the ecosystem with their unlocked state for this user.
 */
export async function getMemberBadgesShowcase(
  userId: string
): Promise<UserBadgeProgress[]> {
  const allBadges = await db
    .select()
    .from(badges)
    .orderBy(badges.name);

  const earned = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.userId, userId));

  const earnedMap = new Map<string, Date>();
  for (const eb of earned) {
    earnedMap.set(eb.badgeId, eb.awardedAt);
  }

  return allBadges.map((badge) => {
    const awardedAt = earnedMap.get(badge.id) || null;
    return {
      badge,
      isUnlocked: Boolean(awardedAt),
      awardedAt,
    };
  });
}
