import { db } from '@/lib/db';
import {
  campaigns,
  campaignWaitlist,
  applications,
  universities,
  chapters,
  users,
  userRoles,
  memberProfiles,
  badges,
  userBadges,
  auditLog,
  type Campaign,
  type Application,
} from '@/lib/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { MemberApplicationInput } from '@/lib/schemas/member-application.schema';
import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site-config';
import { mintMemberId } from '@/lib/members/member-id';

export type CampaignStatusInfo = {
  campaign: Campaign;
  isAccepting: boolean;
  statusReason?: string;
  seatsRemaining?: number | null;
};

export async function getCampaignBySlug(slug: string): Promise<CampaignStatusInfo | null> {
  let campaign: Campaign | undefined;
  try {
    const [result] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.slug, slug.trim().toLowerCase()));
    campaign = result;
  } catch (err) {
    console.warn('[Campaigns] Database lookup failed for slug:', slug, err);
    return null;
  }

  if (!campaign) {
    return null;
  }

  const now = new Date();
  let isAccepting = campaign.status === 'active';
  let statusReason: string | undefined;

  if (campaign.status === 'closed') {
    isAccepting = false;
    statusReason = 'This campaign application window has officially closed.';
  } else if (campaign.status === 'draft' || campaign.status === 'archived') {
    isAccepting = false;
    statusReason = 'This campaign is not currently open for public applications.';
  } else if (campaign.startsAt && campaign.startsAt > now) {
    isAccepting = false;
    statusReason = `Applications open on ${campaign.startsAt.toLocaleDateString()}.`;
  } else if (campaign.endsAt && campaign.endsAt <= now) {
    isAccepting = false;
    statusReason = 'The application deadline for this cohort has passed.';
  } else if (campaign.seatLimit !== null && campaign.applicationCount >= campaign.seatLimit) {
    isAccepting = false;
    statusReason = 'Capacity limit reached for this cohort.';
  }

  const seatsRemaining =
    campaign.seatLimit !== null
      ? Math.max(0, campaign.seatLimit - campaign.applicationCount)
      : null;

  return {
    campaign,
    isAccepting,
    statusReason,
    seatsRemaining,
  };
}

export async function addCampaignWaitlist(
  campaignId: string,
  email: string
): Promise<{ success: boolean; isExisting: boolean }> {
  const normalized = email.trim().toLowerCase();

  const [existing] = await db
    .select()
    .from(campaignWaitlist)
    .where(
      and(
        eq(campaignWaitlist.campaignId, campaignId),
        eq(campaignWaitlist.email, normalized)
      )
    );

  if (existing) {
    return { success: true, isExisting: true };
  }

  await db.insert(campaignWaitlist).values({
    campaignId,
    email: normalized,
  });

  return { success: true, isExisting: false };
}

function generateReferralCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'SIN';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function submitCampaignApplication(
  campaignSlug: string,
  input: MemberApplicationInput
): Promise<{ applicationId: string; campaignName: string }> {
  const campaignInfo = await getCampaignBySlug(campaignSlug);
  if (!campaignInfo) {
    throw new Error(`Campaign '${campaignSlug}' not found.`);
  }

  if (!campaignInfo.isAccepting) {
    throw new Error(
      campaignInfo.statusReason || 'This campaign is not accepting new applications.'
    );
  }

  const [uni] = await db
    .select()
    .from(universities)
    .where(eq(universities.id, input.universityId));

  if (!uni) {
    throw new Error('Selected university is not valid or accredited.');
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  // Find or create user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail));

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        phone: input.phone,
      })
      .returning();
    user = newUser;

    // Assign applicant role
    await db.insert(userRoles).values({
      userId: user.id,
      role: 'applicant',
    });
  } else {
    // Ensure applicant role exists if user does not have higher roles
    const existingRoles = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, user.id));

    if (existingRoles.length === 0) {
      await db.insert(userRoles).values({
        userId: user.id,
        role: 'applicant',
      });
    }
  }

  // Atomically increment campaign application count
  await db
    .update(campaigns)
    .set({
      applicationCount: sql`${campaigns.applicationCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignInfo.campaign.id));

  // Insert application
  const [app] = await db
    .insert(applications)
    .values({
      campaignId: campaignInfo.campaign.id,
      userId: user.id,
      universityId: input.universityId,
      fullName: input.fullName.trim(),
      email: normalizedEmail,
      phone: input.phone.trim(),
      programme: input.programme.trim(),
      level: input.level,
      division: input.division,
      contributionPitch: input.contributionPitch.trim(),
      photoUrl: input.photoUrl || '/images/avatar-placeholder.png',
      status: 'submitted',
    })
    .returning();

  // Ensure member profile exists in pending state
  const [profile] = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, user.id));

  if (!profile) {
    await db.insert(memberProfiles).values({
      userId: user.id,
      fullName: input.fullName.trim(),
      programme: input.programme.trim(),
      level: input.level,
      division: input.division,
      status: 'pending',
      referralCode: generateReferralCode(),
      referredByCode: input.referredByCode?.trim() || null,
      profileCompletenessPct: 50,
    });
  }

  // Send transactional email notice
  await sendApplicationNotice({
    email: normalizedEmail,
    fullName: input.fullName,
    campaignName: campaignInfo.campaign.name,
    division: input.division,
  });

  return {
    applicationId: app.id,
    campaignName: campaignInfo.campaign.name,
  };
}

async function sendApplicationNotice(opts: {
  email: string;
  fullName: string;
  campaignName: string;
  division: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const subject = `Application Received: ${opts.campaignName} — Student Investment Network`;
  const text = `Hello ${opts.fullName},\n\nWe have received your application for '${opts.campaignName}' in the ${opts.division.replace('_', ' ')} division.\n\nOur admissions review committee reviews applications continuously. You can check your status anytime by signing in at ${SITE_URL}/sign-in.\n\nBest regards,\nStudent Investment Network Team`;

  if (apiKey && apiKey !== 're_placeholder_key') {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'SINet Admissions <admissions@sinet.africa>',
        to: opts.email,
        subject,
        text,
      });
      return;
    } catch (err) {
      console.warn('Failed to send application confirmation email via Resend:', err);
    }
  }

  console.log(`\n==================================================`);
  console.log(`[DEV APPLICATION NOTICE]`);
  console.log(`To: ${opts.email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: Application received for ${opts.campaignName}`);
  console.log(`==================================================\n`);
}

export async function listApplications(filter?: {
  status?: 'submitted' | 'under_review' | 'approved' | 'rejected';
  universityId?: string;
  division?: 'student_finance' | 'student_enterprise' | 'governance_records';
  limit?: number;
  offset?: number;
}) {
  const query = db
    .select({
      id: applications.id,
      campaignId: applications.campaignId,
      campaignName: campaigns.name,
      userId: applications.userId,
      universityId: applications.universityId,
      universityName: universities.name,
      universityShortName: universities.shortName,
      fullName: applications.fullName,
      email: applications.email,
      phone: applications.phone,
      programme: applications.programme,
      level: applications.level,
      division: applications.division,
      contributionPitch: applications.contributionPitch,
      photoUrl: applications.photoUrl,
      status: applications.status,
      reviewedBy: applications.reviewedBy,
      reviewedAt: applications.reviewedAt,
      reviewRemarks: applications.reviewRemarks,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .leftJoin(campaigns, eq(applications.campaignId, campaigns.id))
    .innerJoin(universities, eq(applications.universityId, universities.id))
    .orderBy(desc(applications.createdAt))
    .limit(filter?.limit || 50)
    .offset(filter?.offset || 0);

  return query;
}

export async function reviewApplicationDecision(opts: {
  applicationId: string;
  reviewerId: string;
  decision: 'approve' | 'reject';
  remarks?: string;
  ipAddress?: string;
}): Promise<{ success: boolean; application: Application }> {
  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, opts.applicationId));

  if (!app) {
    throw new Error('Application record not found.');
  }

  if (app.status === 'approved' || app.status === 'rejected') {
    throw new Error(`Application has already been reviewed (${app.status}).`);
  }

  const now = new Date();
  const newStatus = opts.decision === 'approve' ? 'approved' : 'rejected';

  // Update application record
  const [updatedApp] = await db
    .update(applications)
    .set({
      status: newStatus,
      reviewedBy: opts.reviewerId,
      reviewedAt: now,
      reviewRemarks: opts.remarks || null,
      updatedAt: now,
    })
    .where(eq(applications.id, opts.applicationId))
    .returning();

  if (opts.decision === 'approve') {
    // Find chapter for university
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.universityId, app.universityId));

    if (app.userId) {
      // Elevate role to member
      const [existingMemberRole] = await db
        .select()
        .from(userRoles)
        .where(
          and(eq(userRoles.userId, app.userId), eq(userRoles.role, 'member'))
        );

      if (!existingMemberRole) {
        await db.insert(userRoles).values({
          userId: app.userId,
          role: 'member',
          chapterId: chapter?.id || null,
        });
      }

      // Update member profile to active
      await db
        .update(memberProfiles)
        .set({
          status: 'active',
          chapterId: chapter?.id || null,
          division: app.division,
          programme: app.programme,
          level: app.level,
          profileCompletenessPct: 80,
          updatedAt: now,
        })
        .where(eq(memberProfiles.userId, app.userId));

      // Award verified_member badge
      const [hasBadge] = await db
        .select()
        .from(userBadges)
        .where(
          and(
            eq(userBadges.userId, app.userId),
            eq(userBadges.badgeId, 'verified_member')
          )
        );

      if (!hasBadge) {
        await db.insert(userBadges).values({
          userId: app.userId,
          badgeId: 'verified_member',
        });
      }

      // Mint unique Member ID
      const [uni] = await db
        .select({ campusCode: universities.campusCode })
        .from(universities)
        .where(eq(universities.id, app.universityId));

      if (uni) {
        await mintMemberId({
          userId: app.userId,
          campusCode: uni.campusCode,
          issuedById: opts.reviewerId,
        });
      }

      // Increment chapter member count if chapter exists
      if (chapter) {
        await db
          .update(chapters)
          .set({
            memberCount: sql`${chapters.memberCount} + 1`,
            updatedAt: now,
          })
          .where(eq(chapters.id, chapter.id));
      }
    }
  } else {
    // Rejection: update profile status
    if (app.userId) {
      await db
        .update(memberProfiles)
        .set({
          status: 'suspended',
          statusReason: opts.remarks || 'Application not accepted for this cohort',
          updatedAt: now,
        })
        .where(eq(memberProfiles.userId, app.userId));
    }
  }

  // Record audit log
  const [reviewer] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, opts.reviewerId));

  await db.insert(auditLog).values({
    actorId: opts.reviewerId,
    actorEmail: reviewer?.email || 'admin@sinet.africa',
    action: opts.decision === 'approve' ? 'application_approved' : 'application_rejected',
    resource: 'applications',
    resourceId: opts.applicationId,
    metadata: {
      applicantEmail: app.email,
      universityId: app.universityId,
      division: app.division,
      remarks: opts.remarks || null,
    },
    ipAddress: opts.ipAddress || null,
  });

  return { success: true, application: updatedApp };
}
