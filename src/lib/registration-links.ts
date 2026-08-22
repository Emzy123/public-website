import { randomBytes } from 'node:crypto';
import type { Document } from 'mongodb';
import type { ApplicationRole, RegistrationLinkStatus } from '@/lib/types/membership';

export const REGISTRATION_LINKS_COLLECTION = 'registration_links';
export const LINK_WAITLIST_COLLECTION = 'registration_link_waitlist';

export function generateLinkSlug(): string {
  return randomBytes(6).toString('hex');
}

export function registrationLinkUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinet.africa';
  return `${base}/join/${slug}`;
}

type LinkDoc = Document & {
  isOpen?: boolean;
  status?: RegistrationLinkStatus;
  expiresAt?: Date;
  quota?: number;
  applicationCount?: number;
};

export function resolveLinkStatus(link: LinkDoc): RegistrationLinkStatus {
  if (link.status === 'auto-closed') return 'auto-closed';
  if (!link.isOpen) return 'closed';
  return 'open';
}

export function isLinkAcceptingApplications(link: LinkDoc): boolean {
  const status = resolveLinkStatus(link);
  if (status !== 'open') return false;
  if (link.expiresAt && new Date(link.expiresAt) <= new Date()) return false;
  if (link.quota != null && (link.applicationCount ?? 0) >= link.quota) return false;
  return true;
}

export async function maybeAutoCloseLink(
  db: Awaited<ReturnType<typeof import('@/lib/db/mongodb').getMongoDb>>,
  link: LinkDoc & { _id: import('mongodb').ObjectId },
): Promise<boolean> {
  const shouldClose =
    (link.expiresAt && new Date(link.expiresAt) <= new Date()) ||
    (link.quota != null && (link.applicationCount ?? 0) >= link.quota);

  if (!shouldClose || !link.isOpen) return false;

  await db.collection(REGISTRATION_LINKS_COLLECTION).updateOne(
    { _id: link._id },
    { $set: { isOpen: false, status: 'auto-closed', updatedAt: new Date() } },
  );
  return true;
}

export function serialiseRegistrationLink(doc: Document) {
  const link = doc as LinkDoc & { _id: import('mongodb').ObjectId; name: string; slug: string; roles: ApplicationRole[]; createdBy: string; createdAt: Date; updatedAt: Date };
  return {
    _id: String(link._id),
    name: link.name,
    slug: link.slug,
    roles: link.roles,
    isOpen: Boolean(link.isOpen),
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
