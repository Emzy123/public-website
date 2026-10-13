import { db, isPostgresConfigured } from '@/lib/db';
import {
  posts,
  postReports,
  type PostRecord,
  type PostPillar,
  type PostStatus,
  type ReportReason,
  type PostReportRecord,
} from '@/lib/db/schema/posts';
import { eq, and, sql, desc, inArray, ilike } from 'drizzle-orm';
import { sanitizePostHtml } from './sanitizer';
import { writeAdminAudit } from '@/lib/auth/guards';

export interface CreatePostInput {
  title: string;
  contentHtml: string;
  pillar: PostPillar;
  summary?: string;
  coverImageUrl?: string | null;
  tags?: string[];
  status?: 'draft' | 'in_review';
  authorId?: string | null;
  authorName: string;
  authorRole?: string;
  authorEmail?: string | null;
}

export interface UpdatePostInput {
  postId: string;
  title?: string;
  contentHtml?: string;
  pillar?: PostPillar;
  summary?: string;
  coverImageUrl?: string | null;
  tags?: string[];
  status?: 'draft' | 'in_review';
  editorUserId?: string;
  isEditorAdmin?: boolean;
}

export interface ModeratePostInput {
  postId: string;
  decision: 'approve' | 'reject';
  moderatorEmail: string;
  moderatorUserId?: string;
  rejectionReason?: string;
  clientIp?: string;
}

export interface ListPostsFilter {
  pillar?: PostPillar;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// In-memory fallback repository for local dev resilience when Postgres is offline
const fallbackPostsStore = new Map<string, PostRecord>();
const fallbackReportsStore = new Map<string, PostReportRecord>();

// Seed default published verified posts in fallback store
const INITIAL_DEMO_POSTS: Array<Omit<PostRecord, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    slug: 'kogi-state-campuses-pilot-launch',
    title: 'SINet Officially Launches Pilot Operations Across 6 Kogi State Campuses',
    summary:
      'SINet commences on-ground student enterprise, agricultural partnerships, and financial leadership across FULOKOJA, PAAU, CUSTECH, and sister institutions.',
    contentHtml: `<p>We are thrilled to announce the official commencement of <strong>SINet</strong> pilot chapters across six premier higher institutions in Kogi State.</p>
<p>The network is structured around three foundational divisions:</p>
<ul>
  <li><strong>Student Finance:</strong> Applied financial modeling, personal budgeting, and peer savings initiatives.</li>
  <li><strong>Student Enterprise:</strong> Incubation of campus ventures, trade links, and commerce opportunities.</li>
  <li><strong>Governance &amp; Records:</strong> Democratic student council leadership, transparent reporting, and chapter coordination.</li>
</ul>
<p>Students from Federal University Lokoja (FULOKOJA), Prince Abubakar Audu University (PAAU), and Confluence University of Science and Technology (CUSTECH) have already commenced chapter enrollment.</p>`,
    pillar: 'community',
    status: 'published',
    authorId: null,
    authorName: 'SINet Secretariat',
    authorRole: 'Council',
    authorEmail: 'hello@sinet.africa',
    coverImageUrl: '/images/gallery/hero-student-summit.jpg',
    tags: ['Kogi State', 'Admissions', 'Campuses', 'Pilot Launch'],
    readingTimeMinutes: 2,
    viewCount: 142,
    publishedAt: new Date('2026-09-15T10:00:00Z'),
    moderatedBy: 'admin@sinet.africa',
    moderatedAt: new Date('2026-09-15T09:30:00Z'),
    rejectionReason: null,
  },
  {
    slug: 'sustainable-cassava-value-chain-initiative',
    title: 'Student Enterprise: Youth Agro-Processing and Cassava Value Chain in Kogi',
    summary:
      'How student teams are bridging farm-gate harvesting with regional distribution corridors, creating practical agricultural entrepreneurship skills.',
    contentHtml: `<p>Agriculture remains the bedrock of sustainable economic growth across North-Central Nigeria. Under our <strong>Student Enterprise</strong> mandate, SINet student teams in Kogi State have initiated agro-processing pilots focusing on high-grade cassava flour and starch distribution.</p>
<p>By connecting student cooperative clusters with rural farmer networks in Osara and Ejiba, participants gain direct exposure to supply chain logistics, inventory risk management, and wholesale contracts.</p>`,
    pillar: 'agriculture',
    status: 'published',
    authorId: null,
    authorName: 'Agro Enterprise Lead',
    authorRole: 'Division Lead',
    authorEmail: 'enterprise@sinet.africa',
    coverImageUrl: '/images/gallery/agro-cassava-harvest.jpg',
    tags: ['Agriculture', 'Agro-processing', 'Enterprise', 'Value Chain'],
    readingTimeMinutes: 3,
    viewCount: 98,
    publishedAt: new Date('2026-09-22T14:00:00Z'),
    moderatedBy: 'admin@sinet.africa',
    moderatedAt: new Date('2026-09-22T13:45:00Z'),
    rejectionReason: null,
  },
  {
    slug: 'campus-trade-and-logistics-distribution',
    title: 'Modern Campus Commerce: Trade & Distribution Corridors for Student Producers',
    summary:
      'Developing structured distribution networks that empower student craftsmen and digital services to reach wider commercial buyers.',
    contentHtml: `<p>One of the greatest bottlenecks faced by student founders is market access beyond dorm rooms and hostel corridors. The <strong>Trade &amp; Distribution</strong> pillar is creating dedicated campus fulfillment hubs.</p>
<p>Through bulk procurement discounts, negotiated logistics corridors, and quality vetting, student producers are scaling their reach to commercial retail outlets in Lokoja and Abuja.</p>`,
    pillar: 'trade_distribution',
    status: 'published',
    authorId: null,
    authorName: 'Trade Coordinator',
    authorRole: 'Student Lead',
    authorEmail: 'trade@sinet.africa',
    coverImageUrl: '/images/gallery/logistics-distribution-hub.jpg',
    tags: ['Trade', 'Commerce', 'Logistics', 'Student Founders'],
    readingTimeMinutes: 2,
    viewCount: 76,
    publishedAt: new Date('2026-10-02T11:00:00Z'),
    moderatedBy: 'admin@sinet.africa',
    moderatedAt: new Date('2026-10-02T10:15:00Z'),
    rejectionReason: null,
  },
];

// Initialize demo fallback items
INITIAL_DEMO_POSTS.forEach((item, idx) => {
  const id = `00000000-0000-0000-0000-00000000000${idx + 1}`;
  fallbackPostsStore.set(id, {
    ...item,
    id,
    createdAt: item.publishedAt || new Date(),
    updatedAt: item.publishedAt || new Date(),
  });
});

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const salt = Math.floor(1000 + Math.random() * 9000);
  return `${base || 'update'}-${salt}`;
}

export async function createPost(input: CreatePostInput): Promise<PostRecord> {
  const { cleanHtml, excerpt, readingTimeMinutes } = sanitizePostHtml(input.contentHtml);
  const slug = generateSlug(input.title);
  const summary = input.summary?.trim() || excerpt;
  const status: PostStatus = input.status || 'in_review';
  const tags = (input.tags || []).map((t) => t.trim()).filter(Boolean);

  if (isPostgresConfigured()) {
    try {
      const [inserted] = await db
        .insert(posts)
        .values({
          slug,
          title: input.title.trim(),
          summary,
          contentHtml: cleanHtml,
          pillar: input.pillar,
          status,
          authorId: input.authorId || null,
          authorName: input.authorName.trim(),
          authorRole: input.authorRole || 'Member',
          authorEmail: input.authorEmail?.trim() || null,
          coverImageUrl: input.coverImageUrl || null,
          tags,
          readingTimeMinutes,
          viewCount: 0,
        })
        .returning();

      return inserted;
    } catch (err) {
      console.warn('[Posts] Postgres insert failed, saving to fallback cache:', err);
    }
  }

  // Fallback in-memory insert
  const id = crypto.randomUUID();
  const record: PostRecord = {
    id,
    slug,
    title: input.title.trim(),
    summary,
    contentHtml: cleanHtml,
    pillar: input.pillar,
    status,
    authorId: input.authorId || null,
    authorName: input.authorName.trim(),
    authorRole: input.authorRole || 'Member',
    authorEmail: input.authorEmail?.trim() || null,
    coverImageUrl: input.coverImageUrl || null,
    tags,
    readingTimeMinutes,
    viewCount: 0,
    publishedAt: null,
    moderatedBy: null,
    moderatedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  fallbackPostsStore.set(id, record);
  return record;
}

export async function updatePost(input: UpdatePostInput): Promise<PostRecord | null> {
  const existing = await getPostById(input.postId);
  if (!existing) return null;

  let cleanHtml = existing.contentHtml;
  let summary = existing.summary;
  let readingTimeMinutes = existing.readingTimeMinutes;

  if (input.contentHtml !== undefined) {
    const sanitized = sanitizePostHtml(input.contentHtml);
    cleanHtml = sanitized.cleanHtml;
    summary = input.summary?.trim() || sanitized.excerpt;
    readingTimeMinutes = sanitized.readingTimeMinutes;
  }

  // If non-admin author edits, reset to in_review
  let newStatus: PostStatus = existing.status;
  if (!input.isEditorAdmin && existing.status !== 'draft') {
    newStatus = 'in_review';
  } else if (input.status) {
    newStatus = input.status;
  }

  const updatedTags = input.tags !== undefined ? input.tags.map((t) => t.trim()).filter(Boolean) : existing.tags;

  if (isPostgresConfigured()) {
    try {
      const [updated] = await db
        .update(posts)
        .set({
          title: input.title?.trim() ?? existing.title,
          summary,
          contentHtml: cleanHtml,
          pillar: input.pillar ?? existing.pillar,
          status: newStatus,
          coverImageUrl: input.coverImageUrl !== undefined ? input.coverImageUrl : existing.coverImageUrl,
          tags: updatedTags,
          readingTimeMinutes,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.postId))
        .returning();

      return updated || null;
    } catch (err) {
      console.warn('[Posts] Postgres update failed, using fallback:', err);
    }
  }

  const record: PostRecord = {
    ...existing,
    title: input.title?.trim() ?? existing.title,
    summary,
    contentHtml: cleanHtml,
    pillar: input.pillar ?? existing.pillar,
    status: newStatus,
    coverImageUrl: input.coverImageUrl !== undefined ? input.coverImageUrl : existing.coverImageUrl,
    tags: updatedTags,
    readingTimeMinutes,
    updatedAt: new Date(),
  };

  fallbackPostsStore.set(input.postId, record);
  return record;
}

export async function moderatePostDecision(input: ModeratePostInput): Promise<PostRecord | null> {
  const existing = await getPostById(input.postId);
  if (!existing) return null;

  const isApproval = input.decision === 'approve';
  const newStatus: PostStatus = isApproval ? 'published' : 'rejected';
  const now = new Date();

  if (isPostgresConfigured()) {
    try {
      const [updated] = await db
        .update(posts)
        .set({
          status: newStatus,
          publishedAt: isApproval ? now : existing.publishedAt,
          moderatedBy: input.moderatorEmail,
          moderatedAt: now,
          rejectionReason: !isApproval ? input.rejectionReason || 'Content did not meet editorial guidelines.' : null,
          updatedAt: now,
        })
        .where(eq(posts.id, input.postId))
        .returning();

      if (updated && input.moderatorUserId) {
        await writeAdminAudit({
          actorId: input.moderatorUserId,
          actorEmail: input.moderatorEmail,
          action: isApproval ? 'post.approved' : 'post.rejected',
          resource: 'post',
          resourceId: input.postId,
          metadata: {
            title: existing.title,
            authorName: existing.authorName,
            rejectionReason: input.rejectionReason,
          },
          ipAddress: input.clientIp || undefined,
        });
      }

      return updated || null;
    } catch (err) {
      console.warn('[Posts] Postgres moderate update failed, using fallback:', err);
    }
  }

  const record: PostRecord = {
    ...existing,
    status: newStatus,
    publishedAt: isApproval ? now : existing.publishedAt,
    moderatedBy: input.moderatorEmail,
    moderatedAt: now,
    rejectionReason: !isApproval ? input.rejectionReason || 'Content did not meet editorial guidelines.' : null,
    updatedAt: now,
  };

  fallbackPostsStore.set(input.postId, record);
  return record;
}

export async function getPostById(id: string): Promise<PostRecord | null> {
  if (isPostgresConfigured()) {
    try {
      const [found] = await db.select().from(posts).where(eq(posts.id, id));
      if (found) return found;
    } catch (err) {
      console.warn('[Posts] Postgres getById failed:', err);
    }
  }

  return fallbackPostsStore.get(id) || null;
}

export async function getPostBySlug(slug: string, options?: { allowUnpublished?: boolean }): Promise<PostRecord | null> {
  if (isPostgresConfigured()) {
    try {
      const [found] = await db.select().from(posts).where(eq(posts.slug, slug));
      if (found) {
        if (!options?.allowUnpublished && found.status !== 'published') {
          return null;
        }

        // Increment view count asynchronously
        db.update(posts)
          .set({ viewCount: sql`${posts.viewCount} + 1` })
          .where(eq(posts.id, found.id))
          .catch(() => {});

        return found;
      }
    } catch (err) {
      console.warn('[Posts] Postgres getBySlug failed:', err);
    }
  }

  for (const post of Array.from(fallbackPostsStore.values())) {
    if (post.slug === slug) {
      if (!options?.allowUnpublished && post.status !== 'published') {
        return null;
      }
      post.viewCount += 1;
      return post;
    }
  }

  return null;
}

export async function listPublishedPosts(filter?: ListPostsFilter): Promise<{
  posts: PostRecord[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, filter?.page || 1);
  const limit = Math.min(50, Math.max(1, filter?.limit || 10));
  const offset = (page - 1) * limit;

  if (isPostgresConfigured()) {
    try {
      const conditions = [eq(posts.status, 'published')];

      if (filter?.pillar) {
        conditions.push(eq(posts.pillar, filter.pillar));
      }

      if (filter?.search) {
        const query = `%${filter.search.trim().toLowerCase()}%`;
        conditions.push(
          sql`(${ilike(posts.title, query)} OR ${ilike(posts.summary, query)})`
        );
      }

      const whereClause = and(...conditions);

      const items = await db
        .select()
        .from(posts)
        .where(whereClause)
        .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(posts)
        .where(whereClause);

      const total = countResult[0]?.count || items.length;

      return {
        posts: items,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch (err) {
      console.warn('[Posts] Postgres listPublished failed, falling back to local memory:', err);
    }
  }

  // Fallback memory list
  let items = Array.from(fallbackPostsStore.values()).filter((p) => p.status === 'published');

  if (filter?.pillar) {
    items = items.filter((p) => p.pillar === filter.pillar);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter((p) => p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q));
  }

  items.sort((a, b) => {
    const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.createdAt).getTime();
    const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.createdAt).getTime();
    return timeB - timeA;
  });

  const total = items.length;
  const paginated = items.slice(offset, offset + limit);

  return {
    posts: paginated,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listModerationQueue(options?: {
  status?: PostStatus | 'all';
  pillar?: PostPillar;
  limit?: number;
  offset?: number;
}): Promise<{
  posts: PostRecord[];
  counts: {
    inReview: number;
    draft: number;
    published: number;
    rejected: number;
    total: number;
  };
}> {
  let all: PostRecord[] = [];

  if (isPostgresConfigured()) {
    try {
      all = await db
        .select()
        .from(posts)
        .orderBy(desc(posts.updatedAt), desc(posts.createdAt));
    } catch (err) {
      console.warn('[Posts] Postgres moderation queue query failed, using fallback:', err);
    }
  }

  if (all.length === 0) {
    all = Array.from(fallbackPostsStore.values());
  }

  const counts = {
    inReview: all.filter((p) => p.status === 'in_review').length,
    draft: all.filter((p) => p.status === 'draft').length,
    published: all.filter((p) => p.status === 'published').length,
    rejected: all.filter((p) => p.status === 'rejected').length,
    total: all.length,
  };

  let filtered = all;
  if (options?.status && options.status !== 'all') {
    filtered = filtered.filter((p) => p.status === options.status);
  }
  if (options?.pillar) {
    filtered = filtered.filter((p) => p.pillar === options.pillar);
  }

  const offset = options?.offset || 0;
  const limit = options?.limit || 100;

  return {
    posts: filtered.slice(offset, offset + limit),
    counts,
  };
}

export async function reportPost(input: {
  postId: string;
  reporterUserId?: string | null;
  reporterEmail: string;
  reason: ReportReason;
  details?: string;
}): Promise<PostReportRecord> {
  if (isPostgresConfigured()) {
    try {
      const [created] = await db
        .insert(postReports)
        .values({
          postId: input.postId,
          reporterUserId: input.reporterUserId || null,
          reporterEmail: input.reporterEmail.trim(),
          reason: input.reason,
          details: input.details?.trim() || null,
          status: 'pending',
        })
        .returning();

      return created;
    } catch (err) {
      console.warn('[Posts] Postgres insert report failed, using fallback:', err);
    }
  }

  const id = crypto.randomUUID();
  const record: PostReportRecord = {
    id,
    postId: input.postId,
    reporterUserId: input.reporterUserId || null,
    reporterEmail: input.reporterEmail.trim(),
    reason: input.reason,
    details: input.details?.trim() || null,
    status: 'pending',
    resolvedBy: null,
    resolvedAt: null,
    resolutionNotes: null,
    createdAt: new Date(),
  };

  fallbackReportsStore.set(id, record);
  return record;
}

export async function listPostReports(postId?: string): Promise<PostReportRecord[]> {
  if (isPostgresConfigured()) {
    try {
      if (postId) {
        return await db
          .select()
          .from(postReports)
          .where(eq(postReports.postId, postId))
          .orderBy(desc(postReports.createdAt));
      }
      return await db
        .select()
        .from(postReports)
        .orderBy(desc(postReports.createdAt));
    } catch (err) {
      console.warn('[Posts] Postgres reports fetch failed:', err);
    }
  }

  const all = Array.from(fallbackReportsStore.values());
  if (postId) return all.filter((r) => r.postId === postId);
  return all;
}
