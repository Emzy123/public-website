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
): Promise<(LinkDoc & { _id: import('mongodb').ObjectId }) | null> {
  const now = new Date();
  const filter: Record<string, unknown> = {
    slug,
    isOpen: true,
    $and: [
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }] },
      {
        $or: [
          { quota: { $exists: false } },
          { quota: null },
          { $expr: { $lt: [{ $ifNull: ['$applicationCount', 0] }, '$quota'] } },
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

