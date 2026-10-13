/**
 * @jest-environment node
 */
import {
  getCampaignBySlug,
  addCampaignWaitlist,
  submitCampaignApplication,
  reviewApplicationDecision,
} from './campaigns';
import { db } from '@/lib/db';
import { universities, users, userRoles, memberProfiles, userBadges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Campaigns & Applications Service Layer', () => {
  it('correctly resolves active evergreen campaign status', async () => {
    const info = await getCampaignBySlug('student-network');
    expect(info).not.toBeNull();
    expect(info?.campaign.slug).toBe('student-network');
    expect(info?.isAccepting).toBe(true);
    expect(info?.campaign.status).toBe('active');
  });

  it('correctly resolves closed campaign status and returns reason', async () => {
    const info = await getCampaignBySlug('finance-analysts-cohort-1');
    expect(info).not.toBeNull();
    expect(info?.campaign.slug).toBe('finance-analysts-cohort-1');
    expect(info?.isAccepting).toBe(false);
    expect(info?.statusReason).toContain('closed');
  });

  it('returns null for nonexistent campaign slug', async () => {
    const info = await getCampaignBySlug('non-existent-campaign-slug-999');
    expect(info).toBeNull();
  });

  it('adds an email to a closed campaign waitlist with deduplication', async () => {
    const campaignInfo = await getCampaignBySlug('finance-analysts-cohort-1');
    expect(campaignInfo).not.toBeNull();

    const email = 'waitlist-test@fulokoja.edu.ng';
    const firstRes = await addCampaignWaitlist(campaignInfo!.campaign.id, email);
    expect(firstRes.success).toBe(true);

    const secondRes = await addCampaignWaitlist(campaignInfo!.campaign.id, email);
    expect(secondRes.success).toBe(true);
    expect(secondRes.isExisting).toBe(true);
  });

  it('submits and approves an application end-to-end, promoting to active member with badges', async () => {
    const [testUni] = await db.select().from(universities).limit(1);
    expect(testUni).toBeDefined();

    const testEmail = `applicant-${Date.now()}@test.edu.ng`;
    const testPhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
    const appResult = await submitCampaignApplication('student-network', {
      fullName: 'Tariq Bello',
      email: testEmail,
      phone: testPhone,
      universityId: testUni.id,
      programme: 'B.Sc Computer Science',
      level: '200',
      division: 'student_enterprise',
      contributionPitch: 'I want to build software prototypes for campus enterprise incubation.',
      codeOfConductAccepted: true,
    });

    expect(appResult.applicationId).toBeDefined();
    expect(appResult.campaignName).toContain('Student Investment Network');

    // Create a mock reviewer admin
    const reviewerEmail = `admin-reviewer-${Date.now()}@sinet.africa`;
    const [reviewer] = await db
      .insert(users)
      .values({ email: reviewerEmail })
      .returning();

    // Review and approve
    const reviewResult = await reviewApplicationDecision({
      applicationId: appResult.applicationId,
      reviewerId: reviewer.id,
      decision: 'approve',
      remarks: 'Strong technical pitch and commitment.',
    });

    expect(reviewResult.success).toBe(true);
    expect(reviewResult.application.status).toBe('approved');

    // Check applicant user now holds 'member' role
    const [user] = await db.select().from(users).where(eq(users.email, testEmail));
    expect(user).toBeDefined();

    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));
    const roleNames = roles.map((r) => r.role);
    expect(roleNames).toContain('member');

    // Check member profile is active
    const [profile] = await db
      .select()
      .from(memberProfiles)
      .where(eq(memberProfiles.userId, user.id));
    expect(profile).toBeDefined();
    expect(profile.status).toBe('active');
    expect(profile.division).toBe('student_enterprise');
    expect(profile.chapterId).toBeDefined();

    // Check verified_member badge awarded
    const badges = await db.select().from(userBadges).where(eq(userBadges.userId, user.id));
    const badgeIds = badges.map((b) => b.badgeId);
    expect(badgeIds).toContain('verified_member');
  });
});
