/**
 * @jest-environment node
 */
import {
  awardBadgeToUser,
  recalculateProfileCompleteness,
  evaluateMemberBadges,
  getMemberBadgesShowcase,
} from './gamification';
import { db } from '@/lib/db';
import { users, memberProfiles, memberIds, userRoles, userBadges, notifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Gamification & Badges Engine', () => {
  it('awards a badge to a member and creates an in-portal notification', async () => {
    const uniquePhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
    const [user] = await db
      .insert(users)
      .values({ email: `badge-test-${Date.now()}@fulokoja.edu.ng`, phone: uniquePhone })
      .returning();

    const res = await awardBadgeToUser(user.id, 'verified_member');
    expect(res.awarded).toBe(true);
    expect(res.badge?.name).toBe('Verified Member');

    // Deduplication check
    const secondRes = await awardBadgeToUser(user.id, 'verified_member');
    expect(secondRes.awarded).toBe(false);

    // Notification check
    const userNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id));
    expect(userNotifs.length).toBeGreaterThanOrEqual(1);
    expect(userNotifs[0].title).toContain('Badge Unlocked');
  });

  it('recalculates profile completeness percentage accurately', async () => {
    const uniquePhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
    const [user] = await db
      .insert(users)
      .values({ email: `score-test-${Date.now()}@fulokoja.edu.ng`, phone: uniquePhone })
      .returning();

    // Incomplete profile (only fullName and division = 40%)
    await db.insert(memberProfiles).values({
      userId: user.id,
      fullName: 'Amina Test',
      division: 'student_finance',
      referralCode: `SIN${Date.now().toString().slice(-6)}`,
    });

    const score1 = await recalculateProfileCompleteness(user.id);
    expect(score1).toBe(40);

    // Complete all fields (programme, level, bio, avatarUrl = 100%)
    await db
      .update(memberProfiles)
      .set({
        programme: 'B.Sc Economics',
        level: '300',
        bio: 'Aspiring capital markets research analyst at FULOKOJA.',
        avatarUrl: 'https://images.sinet.africa/members/amina.jpg',
      })
      .where(eq(memberProfiles.userId, user.id));

    const score2 = await recalculateProfileCompleteness(user.id);
    expect(score2).toBe(100);
  });

  it('automatically evaluates triggers and awards earned badges', async () => {
    const uniquePhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
    const [user] = await db
      .insert(users)
      .values({ email: `eval-test-${Date.now()}@fulokoja.edu.ng`, phone: uniquePhone })
      .returning();

    await db.insert(memberProfiles).values({
      userId: user.id,
      fullName: 'Bello Sani',
      division: 'student_enterprise',
      programme: 'B.Sc Business Admin',
      level: '400',
      bio: 'Student venture founder building campus enterprise sprints.',
      avatarUrl: 'https://images.sinet.africa/members/bello.jpg',
      referralCode: `SIN${Date.now().toString().slice(-6)}`,
    });

    // Add member ID record
    await db.insert(memberIds).values({
      userId: user.id,
      memberId: `SIN-FULOKOJA-26-${Date.now().toString().slice(-4)}`,
      campusCode: 'FULOKOJA',
      yearPrefix: '26',
      sequenceNumber: 99,
    });

    // Add chapter lead role
    await db.insert(userRoles).values({
      userId: user.id,
      role: 'chapter_lead',
    });

    const newlyAwarded = await evaluateMemberBadges(user.id);
    expect(newlyAwarded).toContain('verified_member');
    expect(newlyAwarded).toContain('profile_complete');
    expect(newlyAwarded).toContain('chapter_lead');

    // Showcase check: verify unlocked badges are returned with isUnlocked = true
    const showcase = await getMemberBadgesShowcase(user.id);
    expect(showcase.length).toBeGreaterThanOrEqual(4);

    const verifiedItem = showcase.find((b) => b.badge.id === 'verified_member');
    expect(verifiedItem?.isUnlocked).toBe(true);

    const profileCompleteItem = showcase.find((b) => b.badge.id === 'profile_complete');
    expect(profileCompleteItem?.isUnlocked).toBe(true);
  });
});
