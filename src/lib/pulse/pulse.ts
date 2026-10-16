import { db } from '@/lib/db';
import {
  announcements,
  notifications,
  chapters,
  users,
  type Announcement,
} from '@/lib/db/schema';
import { eq, and, or, isNull, desc } from 'drizzle-orm';
import { checkAdvertRisk, type RiskCheckResult } from '@/lib/compliance/risk-check';

export type PulseTask = {
  id: string;
  category: 'finance_brief' | 'enterprise_sprint' | 'chapter_sync' | 'challenge';
  title: string;
  divisionTarget: 'student_finance' | 'student_enterprise' | 'governance_records' | 'all';
  summary: string;
  actionText: string;
  actionHref?: string;
  isCompleted?: boolean;
};

const DEFAULT_WEEKLY_PULSE_TASKS: PulseTask[] = [
  {
    id: 'pulse-fin-01',
    category: 'finance_brief',
    title: 'NGX Equities & CBN Inflation Briefing (Week 41)',
    divisionTarget: 'student_finance',
    summary:
      'Review the latest Nigerian Exchange (NGX) banking index performance against recent CBN interest rate directives. Understand cash reserve ratios and treasury bills yield curve.',
    actionText: 'Read Financial Briefing',
    actionHref: '/academy',
  },
  {
    id: 'pulse-ent-01',
    category: 'enterprise_sprint',
    title: 'Campus Food & Logistics Opportunity Mapping',
    divisionTarget: 'student_enterprise',
    summary:
      'Identify 3 student service bottlenecks around off-campus hostels and student centers in Kogi State tertiary institutions. Propose a lean student venture hypothesis.',
    actionText: 'Submit Venture Idea',
    actionHref: '/portal',
  },
  {
    id: 'pulse-gov-01',
    category: 'chapter_sync',
    title: 'Kogi Campuses Executive Chapter Sync',
    divisionTarget: 'governance_records',
    summary:
      'Bi-weekly coordination sync for chapter executives and ambassadors across FULOKOJA, PAAU, CUSTECH, KSUK, SALEM, and ALBAYAN campuses.',
    actionText: 'View Agenda',
    actionHref: '/chapters',
  },
];

/**
 * Returns this week's active pulse announcements and learning tasks.
 */
export async function getWeeklyPulseFeed(chapterId?: string | null) {
  let customTasks: PulseTask[] = [];
  try {
    const dbAnnouncements = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        body: announcements.body,
        imageUrl: announcements.imageUrl,
        createdAt: announcements.createdAt,
        chapterId: announcements.chapterId,
      })
      .from(announcements)
      .where(
        and(
          eq(announcements.isApproved, true),
          chapterId ? or(eq(announcements.chapterId, chapterId), isNull(announcements.chapterId)) : isNull(announcements.chapterId)
        )
      )
      .orderBy(desc(announcements.createdAt))
      .limit(5);

    customTasks = dbAnnouncements.map((a) => ({
      id: a.id,
      category: 'chapter_sync' as const,
      title: a.title,
      divisionTarget: 'all' as const,
      summary: a.body,
      actionText: 'Read Update',
      actionHref: '/portal',
    }));
  } catch (err) {
    console.warn('[Pulse] Announcements fetch skipped or database offline:', err);
  }

  return {
    weekNumber: getIsoWeekNumber(new Date()),
    year: new Date().getFullYear(),
    tasks: [...customTasks, ...DEFAULT_WEEKLY_PULSE_TASKS],
  };
}

/**
 * Records a weekly active member check-in.
 */
export async function recordMemberWeeklyCheckIn(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const weekNum = getIsoWeekNumber(new Date());

  // Create in-portal notification acknowledging check-in
  await db.insert(notifications).values({
    userId,
    title: `Weekly Pulse Check-In Confirmed (Week ${weekNum})`,
    message: `You have successfully checked in for Week ${weekNum}. Your active member participation streak is intact!`,
    linkUrl: '/portal',
  });

  return {
    success: true,
    message: `Weekly check-in recorded for Week ${weekNum}!`,
  };
}

function getIsoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export type CreateAnnouncementInput = {
  chapterId?: string | null;
  authorId: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  isApproved?: boolean;
};

export type UpdateAnnouncementInput = {
  title?: string;
  body?: string;
  imageUrl?: string | null;
  isApproved?: boolean;
};

/**
 * Checks compliance risk for a pulse announcement item.
 * Runs checkAdvertRisk() and emits a warning if financial risk terms or un-scanned images are detected.
 * Warning only: does not gate creation or editing.
 */
export function checkAnnouncementRisk(item: {
  title?: string;
  body?: string;
  imageUrl?: string | null;
}): RiskCheckResult {
  const result = checkAdvertRisk({
    title: item.title,
    body: item.body,
    imageUrl: item.imageUrl || undefined,
  });

  if (result.hasRisk) {
    console.warn(
      `[Compliance Warning] Pulse announcement "${item.title || 'untitled'}" triggered compliance warning: ${result.matchedTerms.join(
        ', '
      )} in field(s): ${result.matchedFields.join(', ')}`
    );
  }

  return result;
}

/**
 * Creates an announcement in the Postgres announcements table.
 * Runs checkAdvertRisk() to log a compliance warning without gating.
 */
export async function createPulseAnnouncement(input: CreateAnnouncementInput) {
  const complianceRisk = checkAnnouncementRisk({
    title: input.title,
    body: input.body,
    imageUrl: input.imageUrl,
  });

  const [created] = await db
    .insert(announcements)
    .values({
      chapterId: input.chapterId || null,
      authorId: input.authorId,
      title: input.title,
      body: input.body,
      imageUrl: input.imageUrl || null,
      isApproved: input.isApproved ?? false,
    })
    .returning();

  return {
    announcement: created,
    complianceRisk,
  };
}

/**
 * Updates an announcement in the Postgres announcements table.
 * Runs checkAdvertRisk() to log a compliance warning without gating.
 */
export async function updatePulseAnnouncement(id: string, input: UpdateAnnouncementInput) {
  const complianceRisk = checkAnnouncementRisk({
    title: input.title,
    body: input.body,
    imageUrl: input.imageUrl,
  });

  const updateValues: Partial<typeof announcements.$inferInsert> = {};
  if (input.title !== undefined) updateValues.title = input.title;
  if (input.body !== undefined) updateValues.body = input.body;
  if (input.imageUrl !== undefined) updateValues.imageUrl = input.imageUrl;
  if (input.isApproved !== undefined) updateValues.isApproved = input.isApproved;

  const [updated] = await db
    .update(announcements)
    .set(updateValues)
    .where(eq(announcements.id, id))
    .returning();

  return {
    announcement: updated,
    complianceRisk,
  };
}

