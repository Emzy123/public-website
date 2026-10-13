import { getMongoDb } from '@/lib/db/mongodb';
import {
  REGISTRATION_LINKS_COLLECTION,
  isLinkAcceptingApplications,
  maybeAutoCloseLink,
  serialiseRegistrationLink,
} from '@/lib/registration-links';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import type { ObjectId } from 'mongodb';

export type ActiveApplicationTarget =
  | {
      status: 'open';
      source: 'mongo' | 'postgres';
      name: string;
      slug: string;
      roles?: string[];
      url: string;
    }
  | {
      status: 'closed';
      message: string;
    };

/**
 * Resolves whether an admin-controlled application period is currently active and open.
 * Checks MongoDB registration links first (created via /admin/links), then PostgreSQL campaigns.
 * Returns 'closed' status if no link is open or accepting applicants.
 */
export async function getActiveMembershipApplication(): Promise<ActiveApplicationTarget> {
  // 1. Check MongoDB registration links (admin /admin/links)
  try {
    const mongo = await getMongoDb();
    const docs = await mongo
      .collection(REGISTRATION_LINKS_COLLECTION)
      .find({ isOpen: true })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();

    for (const doc of docs) {
      const linkDoc = doc as typeof doc & { _id: ObjectId };
      await maybeAutoCloseLink(mongo, linkDoc);
      if (isLinkAcceptingApplications(linkDoc)) {
        const link = serialiseRegistrationLink(linkDoc);
        return {
          status: 'open',
          source: 'mongo',
          name: link.name,
          slug: link.slug,
          roles: link.roles,
          url: `/join/${link.slug}`,
        };
      }
    }
  } catch (err) {
    console.warn('[ActiveLink] MongoDB lookup failed or collection empty:', err);
  }

  // 2. Check PostgreSQL campaigns (active cohorts)
  try {
    const now = new Date();
    const [pgCampaign] = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, 'active'),
          gt(campaigns.endsAt, now)
        )
      )
      .orderBy(sql`starts_at DESC`)
      .limit(1);

    if (pgCampaign) {
      return {
        status: 'open',
        source: 'postgres',
        name: pgCampaign.name,
        slug: pgCampaign.slug,
        url: `/join/${pgCampaign.slug}`,
      };
    }
  } catch (pgErr) {
    console.warn('[ActiveLink] Postgres campaigns lookup failed:', pgErr);
  }

  // 3. No active application link is currently open
  return {
    status: 'closed',
    message: 'Registration and membership applications are closed at the moment.',
  };
}
