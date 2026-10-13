import { db } from '@/lib/db';
import {
  chapters,
  universities,
  memberProfiles,
  users,
  userRoles,
  type Chapter,
  type University,
} from '@/lib/db/schema';
import { eq, and, sql, ilike, desc, count } from 'drizzle-orm';

export type ChapterListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  isActive: boolean;
  universityId: string;
  universityName: string;
  universityShortName: string;
  campusCode: string;
  state: string;
};

export type ChapterDetails = ChapterListItem & {
  divisionCounts: {
    student_finance: number;
    student_enterprise: number;
    governance_records: number;
  };
  leads: Array<{
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  }>;
};

/**
 * Lists all university campus chapters with optional search and filtering.
 */
export async function listChapters(opts?: {
  state?: string;
  search?: string;
}): Promise<ChapterListItem[]> {
  const query = db
    .select({
      id: chapters.id,
      slug: chapters.slug,
      name: chapters.name,
      description: chapters.description,
      coverImageUrl: chapters.coverImageUrl,
      memberCount: chapters.memberCount,
      isActive: chapters.isActive,
      universityId: universities.id,
      universityName: universities.name,
      universityShortName: universities.shortName,
      campusCode: universities.campusCode,
      state: universities.state,
    })
    .from(chapters)
    .innerJoin(universities, eq(chapters.universityId, universities.id))
    .where(eq(chapters.isActive, true))
    .orderBy(desc(chapters.memberCount), universities.name);

  const results = await query;

  if (!opts?.search && !opts?.state) {
    return results;
  }

  let filtered = results;

  if (opts?.state) {
    const s = opts.state.trim().toLowerCase();
    filtered = filtered.filter((c) => c.state.toLowerCase() === s);
  }

  if (opts?.search) {
    const q = opts.search.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.universityName.toLowerCase().includes(q) ||
        c.universityShortName.toLowerCase().includes(q) ||
        c.campusCode.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    );
  }

  return filtered;
}

/**
 * Retrieves detailed information about a specific campus chapter by slug.
 */
export async function getChapterBySlug(slug: string): Promise<ChapterDetails | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  const [chapterRecord] = await db
    .select({
      id: chapters.id,
      slug: chapters.slug,
      name: chapters.name,
      description: chapters.description,
      coverImageUrl: chapters.coverImageUrl,
      memberCount: chapters.memberCount,
      isActive: chapters.isActive,
      universityId: universities.id,
      universityName: universities.name,
      universityShortName: universities.shortName,
      campusCode: universities.campusCode,
      state: universities.state,
    })
    .from(chapters)
    .innerJoin(universities, eq(chapters.universityId, universities.id))
    .where(eq(chapters.slug, normalizedSlug))
    .limit(1);

  if (!chapterRecord) {
    return null;
  }

  // Count active members by student division in this chapter
  const divisionRows = await db
    .select({
      division: memberProfiles.division,
      count: count(memberProfiles.id),
    })
    .from(memberProfiles)
    .where(
      and(
        eq(memberProfiles.chapterId, chapterRecord.id),
        eq(memberProfiles.status, 'active')
      )
    )
    .groupBy(memberProfiles.division);

  const divisionCounts = {
    student_finance: 0,
    student_enterprise: 0,
    governance_records: 0,
  };

  for (const row of divisionRows) {
    if (row.division && row.division in divisionCounts) {
      divisionCounts[row.division as keyof typeof divisionCounts] = Number(row.count);
    }
  }

  // Find chapter leads / ambassadors assigned to this chapter
  const leads = await db
    .select({
      id: users.id,
      fullName: memberProfiles.fullName,
      avatarUrl: memberProfiles.avatarUrl,
      role: userRoles.role,
    })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .innerJoin(memberProfiles, eq(users.id, memberProfiles.userId))
    .where(
      and(
        eq(userRoles.chapterId, chapterRecord.id),
        eq(userRoles.role, 'chapter_lead')
      )
    );

  return {
    ...chapterRecord,
    divisionCounts,
    leads,
  };
}

/**
 * Returns overall directory overview statistics.
 */
export async function getChaptersDirectoryStats() {
  const [totalChapters] = await db
    .select({ count: count(chapters.id) })
    .from(chapters)
    .where(eq(chapters.isActive, true));

  const [totalMembers] = await db
    .select({ sum: sql<number>`COALESCE(SUM(${chapters.memberCount}), 0)` })
    .from(chapters);

  const [totalUnis] = await db
    .select({ count: count(universities.id) })
    .from(universities)
    .where(eq(universities.isActive, true));

  return {
    chapterCount: Number(totalChapters?.count || 0),
    universityCount: Number(totalUnis?.count || 0),
    totalMembers: Number(totalMembers?.sum || 0),
    state: 'Kogi',
  };
}
