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

export const FALLBACK_KOGI_CHAPTERS: ChapterListItem[] = [
  {
    id: 'kogi-fulokoja',
    slug: 'fulokoja',
    name: 'Federal University Lokoja Chapter',
    description: 'Federal University Lokoja Chapter of SINet.',
    coverImageUrl: null,
    memberCount: 0,
    isActive: true,
    universityId: 'uni-fulokoja',
    universityName: 'Federal University, Lokoja',
    universityShortName: 'FULOKOJA',
    campusCode: 'FULOKOJA',
    state: 'Kogi',
  },
  {
    id: 'kogi-paau',
    slug: 'paau',
    name: 'Prince Abubakar Audu University Chapter',
    description: 'Prince Abubakar Audu University (Anyigba) Chapter of SINet.',
    coverImageUrl: null,
    memberCount: 0,
    isActive: true,
    universityId: 'uni-paau',
    universityName: 'Prince Abubakar Audu University, Anyigba',
    universityShortName: 'PAAU',
    campusCode: 'PAAU',
    state: 'Kogi',
  },
  {
    id: 'kogi-custech',
    slug: 'custech',
    name: 'Confluence University of Science & Technology Chapter',
    description: 'Confluence University of Science & Technology (Osara) Chapter.',
    coverImageUrl: null,
    memberCount: 0,
    isActive: true,
    universityId: 'uni-custech',
    universityName: 'Confluence University of Science and Technology, Osara',
    universityShortName: 'CUSTECH',
    campusCode: 'CUSTECH',
    state: 'Kogi',
  },
  {
    id: 'kogi-ksuk',
    slug: 'ksuk',
    name: 'Kogi State University Kabba Chapter',
    description: 'Kogi State University Kabba Chapter of SINet.',
    coverImageUrl: null,
    memberCount: 0,
    isActive: true,
    universityId: 'uni-ksuk',
    universityName: 'Kogi State University, Kabba',
    universityShortName: 'KSUK',
    campusCode: 'KSUK',
    state: 'Kogi',
  },
  {
    id: 'kogi-salem',
    slug: 'salem',
    name: 'Salem University Lokoja Chapter',
    description: 'Salem University Lokoja Chapter of SINet.',
    coverImageUrl: null,
    memberCount: 0,
    isActive: true,
    universityId: 'uni-salem',
    universityName: 'Salem University, Lokoja',
    universityShortName: 'SALEM',
    campusCode: 'SALEM',
    state: 'Kogi',
  },
  {
    id: 'kogi-albayan',
    slug: 'albayan',
    name: 'Al-Bayan University Ankpa Chapter',
    description: 'Al-Bayan University Ankpa Chapter of SINet.',
    coverImageUrl: null,
    memberCount: 0,
    isActive: true,
    universityId: 'uni-albayan',
    universityName: 'Al-Bayan University, Ankpa',
    universityShortName: 'ALBAYAN',
    campusCode: 'ALBAYAN',
    state: 'Kogi',
  },
];

function filterChaptersList(
  items: ChapterListItem[],
  opts?: { state?: string; search?: string }
): ChapterListItem[] {
  let filtered = items;

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
 * Lists all university campus chapters with optional search and filtering.
 * Resilient to database cold-starts or missing cloud connection.
 */
export async function listChapters(opts?: {
  state?: string;
  search?: string;
}): Promise<ChapterListItem[]> {
  try {
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
    if (results && results.length > 0) {
      return filterChaptersList(results, opts);
    }
  } catch (error) {
    console.warn('[Chapters] DB query failed, using built-in Kogi chapters catalog:', error);
  }

  return filterChaptersList(FALLBACK_KOGI_CHAPTERS, opts);
}

/**
 * Retrieves detailed information about a specific campus chapter by slug.
 */
export async function getChapterBySlug(slug: string): Promise<ChapterDetails | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  try {
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
      .where(and(eq(chapters.slug, normalizedSlug), eq(chapters.isActive, true)))
      .limit(1);

    if (chapterRecord) {
      const divisionCounts = {
        student_finance: 0,
        student_enterprise: 0,
        governance_records: 0,
      };

      const counts = await db
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

      for (const row of counts) {
        if (row.division && row.division in divisionCounts) {
          divisionCounts[row.division as keyof typeof divisionCounts] = Number(row.count);
        }
      }

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
  } catch (error) {
    console.warn(`[Chapters] Error querying chapter for slug "${slug}":`, error);
  }

  // Check fallback catalog
  const fallback = FALLBACK_KOGI_CHAPTERS.find((c) => c.slug === normalizedSlug);
  if (fallback) {
    return {
      ...fallback,
      divisionCounts: {
        student_finance: 0,
        student_enterprise: 0,
        governance_records: 0,
      },
      leads: [],
    };
  }

  return null;
}

/**
 * Returns overall directory overview statistics.
 */
export async function getChaptersDirectoryStats() {
  try {
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
      chapterCount: Number(totalChapters?.count || FALLBACK_KOGI_CHAPTERS.length),
      universityCount: Number(totalUnis?.count || FALLBACK_KOGI_CHAPTERS.length),
      totalMembers: Number(totalMembers?.sum || 0),
      state: 'Kogi',
    };
  } catch {
    return {
      chapterCount: FALLBACK_KOGI_CHAPTERS.length,
      universityCount: FALLBACK_KOGI_CHAPTERS.length,
      totalMembers: 0,
      state: 'Kogi',
    };
  }
}
