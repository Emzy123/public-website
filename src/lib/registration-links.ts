import { randomBytes } from 'node:crypto';
import type { Document } from 'mongodb';
import { type ApplicationRole, type RegistrationLinkStatus, normalizeRoleSlug } from '@/lib/types/membership';
import { isValidChapterSlug } from '@/lib/chapters/chapters';

export const REGISTRATION_LINKS_COLLECTION = 'registration_links';
export const LINK_WAITLIST_COLLECTION = 'registration_link_waitlist';

export function generateLinkSlug(): string {
  return randomBytes(6).toString('hex');
}

export function registrationLinkUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinet.africa';
  return `${base}/join/${slug}`;
}

import {
  isCampaignLinkOpen,
  isLinkOpen,
  getCampaignLinkDisplayStatus,
  getLinkDisplayStatus,
  type LinkDisplayStatus,
} from '@/lib/applications/link-status';

export {
  isCampaignLinkOpen,
  isLinkOpen,
  getCampaignLinkDisplayStatus,
  getLinkDisplayStatus,
  type LinkDisplayStatus,
};

type LinkDoc = Document & {
  isOpen?: boolean;
  status?: RegistrationLinkStatus;
  expiresAt?: Date | string;
  quota?: number;
  applicationCount?: number;
};

export function resolveLinkStatus(link: LinkDoc): RegistrationLinkStatus {
  return getCampaignLinkDisplayStatus(link);
}

export function isLinkAcceptingApplications(link: LinkDoc): boolean {
  return isCampaignLinkOpen(link);
}

export async function maybeAutoCloseLink(
  db: Awaited<ReturnType<typeof import('@/lib/db/mongodb').getMongoDb>>,
  link: LinkDoc & { _id: import('mongodb').ObjectId },
): Promise<boolean> {
  const shouldClose = !isCampaignLinkOpen(link);

  if (!shouldClose || !link.isOpen) return false;

  await db.collection(REGISTRATION_LINKS_COLLECTION).updateOne(
    { _id: link._id },
    { $set: { isOpen: false, status: 'auto-closed', updatedAt: new Date() } },
  );
  return true;
}

/**
 * Atomically reserve one application slot on an open link.
 * Returns the updated link doc, or null if the link cannot accept applications
 * (closed, expired, or quota exhausted) — safe under concurrent submits.
 */
export async function tryReserveApplicationSlot(
  db: Awaited<ReturnType<typeof import('@/lib/db/mongodb').getMongoDb>>,
  slug: string,
  now: Date = new Date(),
): Promise<(LinkDoc & { _id: import('mongodb').ObjectId }) | null> {
  // Self-healing: if link has no applicationCount field, count actual applications and initialize it atomically
  const linkCollection = db.collection(REGISTRATION_LINKS_COLLECTION);
  if (typeof linkCollection.findOne === 'function') {
    const uninitialized = await linkCollection.findOne({
      slug,
      $or: [{ applicationCount: { $exists: false } }, { applicationCount: null }],
    });

    if (uninitialized) {
      const realCount = await db.collection('applications').countDocuments({
        $or: [
          { sourceLinkId: uninitialized._id },
          { sourceLinkId: String(uninitialized._id) },
          { sourceLinkSlug: slug },
        ],
      });

      // Guard with $exists: false (or null) so this atomic backfill only executes once across concurrent requests
      await linkCollection.updateOne(
        {
          slug,
          $or: [{ applicationCount: { $exists: false } }, { applicationCount: null }],
        },
        {
          $set: { applicationCount: realCount, updatedAt: now },
        }
      );
    }
  }

  const dateOnlyToday = now.toISOString().slice(0, 10);
  const filter: Record<string, unknown> = {
    slug,
    isOpen: { $ne: false },
    status: { $nin: ['closed', 'auto-closed', 'auto_closed', 'archived', 'draft'] },
    $and: [
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
          { expiresAt: { $gte: dateOnlyToday } },
        ],
      },
      {
        $or: [
          // Precedence: maxApplications > quota > seatLimit
          // Positive finite limits (must have capacity remaining):
          {
            maxApplications: { $gt: 0 },
            $expr: { $lt: [{ $ifNull: ['$applicationCount', 0] }, '$maxApplications'] },
          },
          {
            maxApplications: { $in: [null, undefined] },
            quota: { $gt: 0 },
            $expr: { $lt: [{ $ifNull: ['$applicationCount', 0] }, '$quota'] },
          },
          {
            maxApplications: { $in: [null, undefined] },
            quota: { $in: [null, undefined] },
            seatLimit: { $gt: 0 },
            $expr: { $lt: [{ $ifNull: ['$applicationCount', 0] }, '$seatLimit'] },
          },
          // Unlimited branches (0 or unspecified limit):
          // 1. maxApplications is explicitly 0 or negative (unlimited override)
          {
            maxApplications: { $lte: 0 },
          },
          // 2. maxApplications not set, quota explicitly 0 or negative
          {
            maxApplications: { $in: [null, undefined] },
            quota: { $lte: 0 },
          },
          // 3. maxApplications not set, quota not set, seatLimit explicitly 0 or negative
          {
            maxApplications: { $in: [null, undefined] },
            quota: { $in: [null, undefined] },
            seatLimit: { $lte: 0 },
          },
          // 4. No limit specified at all (all null/undefined/missing)
          {
            maxApplications: { $in: [null, undefined] },
            quota: { $in: [null, undefined] },
            seatLimit: { $in: [null, undefined] },
          },
        ],
      },
    ],
  };

  const updated = await db.collection(REGISTRATION_LINKS_COLLECTION).findOneAndUpdate(
    filter,
    { $inc: { applicationCount: 1 }, $set: { updatedAt: now } },
    { returnDocument: 'after' },
  );

  if (!updated) return null;

  const link = updated as LinkDoc & { _id: import('mongodb').ObjectId };
  await maybeAutoCloseLink(db, link);
  return link;
}

/**
 * Releases a previously reserved application slot by decrementing applicationCount.
 * Guards with { applicationCount: { $gt: 0 } } so it never decrements below 0
 * (compensating transaction for downstream application insert or validation failures).
 */
export async function releaseApplicationSlot(
  db: Awaited<ReturnType<typeof import('@/lib/db/mongodb').getMongoDb>>,
  slug: string,
): Promise<boolean> {
  const result = await db.collection(REGISTRATION_LINKS_COLLECTION).updateOne(
    { slug, applicationCount: { $gt: 0 } },
    { $inc: { applicationCount: -1 }, $set: { updatedAt: new Date() } },
  );
  return (result.modifiedCount ?? 0) > 0;
}

export function serialiseRegistrationLink(doc: Document) {
  const link = doc as LinkDoc & { _id: import('mongodb').ObjectId; name: string; slug: string; roles: ApplicationRole[]; createdBy: string; createdAt: Date; updatedAt: Date };
  return {
    _id: String(link._id),
    name: link.name,
    slug: link.slug,
    roles: link.roles,
    isOpen: isCampaignLinkOpen(link),
    status: resolveLinkStatus(link),
    expiresAt: link.expiresAt instanceof Date ? link.expiresAt.toISOString() : link.expiresAt,
    quota: link.quota,
    applicationCount: link.applicationCount ?? 0,
    createdBy: link.createdBy,
    createdAt: link.createdAt instanceof Date ? link.createdAt.toISOString() : link.createdAt,
    updatedAt: link.updatedAt instanceof Date ? link.updatedAt.toISOString() : link.updatedAt,
    url: registrationLinkUrl(link.slug),
  };
}

export const ALLOWED_UTM_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
]);

export const VALID_DIVISIONS = ['finance', 'enterprise', 'governance'] as const;
export type DivisionSlug = (typeof VALID_DIVISIONS)[number];

export function normalizeDivisionSlug(raw?: string | null): DivisionSlug | null {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().trim().replace(/[_ ]+/g, '-');
  if (cleaned === 'finance' || cleaned === 'student-finance') return 'finance';
  if (cleaned === 'enterprise' || cleaned === 'student-enterprise') return 'enterprise';
  if (cleaned === 'governance' || cleaned === 'governance-records') return 'governance';
  return null;
}

/**
 * Builds a secure sanitized redirect URL for /join routing.
 * Whitelists public canonical roles, validated chapter slug, division context, referral code, and utm parameters.
 * Staff is invite-only and stripped from public redirects.
 * Unknown chapter values are dropped.
 */
export function buildJoinRedirectUrl(
  targetUrl: string,
  searchParams?: Record<string, string | string[] | undefined>
): string {
  const rawRole =
    typeof searchParams?.role === 'string'
      ? searchParams.role
      : Array.isArray(searchParams?.role)
        ? searchParams.role[0]
        : undefined;
  const canonicalRole = normalizeRoleSlug(rawRole);
  const isStaffRequested = canonicalRole === 'staff';
  const publicRole = isStaffRequested ? null : canonicalRole;

  const rawChapter =
    typeof searchParams?.chapter === 'string'
      ? searchParams.chapter
      : Array.isArray(searchParams?.chapter)
        ? searchParams.chapter[0]
        : undefined;
  const validChapter =
    rawChapter && isValidChapterSlug(rawChapter)
      ? rawChapter.toLowerCase().trim()
      : undefined;

  const rawDivision =
    typeof searchParams?.division === 'string'
      ? searchParams.division
      : Array.isArray(searchParams?.division)
        ? searchParams.division[0]
        : undefined;
  const validDivision = normalizeDivisionSlug(rawDivision);

  const qs = new URLSearchParams();
  if (publicRole) {
    qs.set('role', publicRole);
  }
  if (validChapter) {
    qs.set('chapter', validChapter);
  }
  if (validDivision) {
    qs.set('division', validDivision);
  }

  if (searchParams) {
    for (const [key, rawValue] of Object.entries(searchParams)) {
      const val = typeof rawValue === 'string' ? rawValue : Array.isArray(rawValue) ? rawValue[0] : '';
      if (!val) continue;

      if (ALLOWED_UTM_PARAMS.has(key)) {
        if (/^[a-zA-Z0-9_\-\.]{1,100}$/.test(val)) {
          qs.set(key, val);
        }
      } else if (key === 'ref') {
        if (/^[a-zA-Z0-9_-]{1,32}$/.test(val)) {
          qs.set('ref', val);
        }
      }
    }
  }

  const queryStr = qs.toString();
  if (!queryStr) return targetUrl;
  const separator = targetUrl.includes('?') ? '&' : '?';
  return `${targetUrl}${separator}${queryStr}`;
}

