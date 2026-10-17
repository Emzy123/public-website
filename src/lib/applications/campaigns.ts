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
import { eq, and, sql, desc, count, or, isNull, lt } from 'drizzle-orm';
import { MemberApplicationInput } from '@/lib/schemas/member-application.schema';
import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site-config';
import { mintMemberId } from '@/lib/members/member-id';
import { isValidChapterSlug, validateChapterSlug } from '@/lib/chapters/chapters';
import {
  isCampaignLinkOpen,
  getCampaignLinkDisplayStatus,
  type LinkDisplayStatus,
} from '@/lib/applications/link-status';

export type CampaignStatusInfo = {
  campaign: Campaign;
  isAccepting: boolean;
  statusReason?: string;
  seatsRemaining?: number | null;
  displayStatus?: LinkDisplayStatus;
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
  const isOpen = isCampaignLinkOpen(
    {
      status: campaign.status,
      endsAt: campaign.endsAt,
      seatLimit: campaign.seatLimit,
      applicationCount: campaign.applicationCount,
    },
    now
  );
  const displayStatus = getCampaignLinkDisplayStatus(
    {
      status: campaign.status,
      endsAt: campaign.endsAt,
      seatLimit: campaign.seatLimit,
      applicationCount: campaign.applicationCount,
    },
    now
  );

  let isAccepting = isOpen;
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
  } else if (campaign.seatLimit !== null && campaign.seatLimit > 0 && campaign.applicationCount >= campaign.seatLimit) {
    isAccepting = false;
    statusReason = 'Capacity limit reached for this cohort.';
  }

  const seatsRemaining =
    campaign.seatLimit !== null && campaign.seatLimit > 0
      ? Math.max(0, campaign.seatLimit - campaign.applicationCount)
      : null;

  return {
    campaign,
    isAccepting,
    statusReason,
    seatsRemaining,
    displayStatus,
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

  if (!isCampaignLinkOpen(campaignInfo.campaign)) {
    const displayStatus = getCampaignLinkDisplayStatus(campaignInfo.campaign);
    if (displayStatus === 'Full') {
      throw new Error('Capacity limit reached for this cohort.');
    }
    if (displayStatus === 'Expired') {
      throw new Error('The application deadline for this cohort has passed.');
    }
    throw new Error(
      campaignInfo.statusReason || 'This campaign is not accepting new applications.'
    );
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  const result = await db.transaction(async (tx) => {
    // Self-healing: if campaign applicationCount is NULL, initialize it atomically with the real application count
    const [uninitialized] = await tx
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignInfo.campaign.id), isNull(campaigns.applicationCount)));

    if (uninitialized) {
      const [countRow] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(applications)
        .where(eq(applications.campaignId, campaignInfo.campaign.id));
      const realCount = countRow?.count ?? 0;

      await tx
        .update(campaigns)
        .set({ applicationCount: realCount, updatedAt: new Date() })
        .where(and(eq(campaigns.id, campaignInfo.campaign.id), isNull(campaigns.applicationCount)));
    }

    // Atomically increment campaign application count only if capacity remains and cohort is active
    const updatedCampaigns = await tx
      .update(campaigns)
      .set({
        applicationCount: sql`${campaigns.applicationCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaigns.id, campaignInfo.campaign.id),
          eq(campaigns.status, 'active'),
          or(
            isNull(campaigns.seatLimit),
            eq(campaigns.seatLimit, 0),
            lt(campaigns.applicationCount, campaigns.seatLimit)
          )
        )
      )
      .returning();

    if (!updatedCampaigns || updatedCampaigns.length === 0) {
      throw new Error('Capacity limit reached for this cohort.');
    }

    const [uni] = await tx
      .select()
      .from(universities)
      .where(eq(universities.id, input.universityId));

    if (!uni) {
      throw new Error('Selected university is not valid or accredited.');
    }

    // Find or create user
    let [user] = await tx
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (!user) {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          phone: input.phone,
        })
        .returning();
      user = newUser;

      // Assign applicant role
      await tx.insert(userRoles).values({
        userId: user.id,
        role: 'applicant',
      });
    } else {
      // Ensure applicant role exists if user does not have higher roles
      const existingRoles = await tx
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, user.id));

      if (existingRoles.length === 0) {
        await tx.insert(userRoles).values({
          userId: user.id,
          role: 'applicant',
        });
      }
    }

    // Insert application
    const [app] = await tx
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
    const [profile] = await tx
      .select()
      .from(memberProfiles)
      .where(eq(memberProfiles.userId, user.id));

    let resolvedChapterId: string | null = null;
    if (input.chapter && (await validateChapterSlug(input.chapter)).valid) {
      const [matchedChapter] = await tx
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.slug, input.chapter.toLowerCase().trim()));
      if (matchedChapter) resolvedChapterId = matchedChapter.id;
    }
    if (!resolvedChapterId && input.universityId) {
      const [uniChapter] = await tx
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.universityId, input.universityId));
      if (uniChapter) resolvedChapterId = uniChapter.id;
    }

    if (!profile) {
      await tx.insert(memberProfiles).values({
        userId: user.id,
        chapterId: resolvedChapterId,
        fullName: input.fullName.trim(),
        programme: input.programme.trim(),
        level: input.level,
        division: input.division,
        status: 'pending',
        referralCode: generateReferralCode(),
        referredByCode: input.referredByCode?.trim() || null,
        profileCompletenessPct: 50,
      });
    } else if (resolvedChapterId && !profile.chapterId) {
      await tx
        .update(memberProfiles)
        .set({ chapterId: resolvedChapterId, division: input.division, updatedAt: new Date() })
        .where(eq(memberProfiles.id, profile.id));
    }

    return {
      applicationId: app.id,
      campaignName: campaignInfo.campaign.name,
    };
  });

  // Send transactional email notice
  await sendApplicationNotice({
    email: normalizedEmail,
    fullName: input.fullName,
    campaignName: campaignInfo.campaign.name,
    division: input.division,
  });

  return result;
}

async function sendApplicationNotice(opts: {
  email: string;
  fullName: string;
  campaignName: string;
  division: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const subject = `Application Received: ${opts.campaignName} — SINet`;
  const text = `Hello ${opts.fullName},\n\nWe have received your application for '${opts.campaignName}' in the ${opts.division.replace('_', ' ')} division.\n\nOur admissions review committee reviews applications continuously. You can check your status anytime by signing in at ${SITE_URL}/sign-in.\n\nBest regards,\nSINet Team`;

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
