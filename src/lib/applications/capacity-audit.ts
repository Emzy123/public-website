/**
 * Shared Capacity & Drift Audit Service
 *
 * Scans MongoDB registration_links and PostgreSQL campaigns for:
 * 1. Count drift (recorded applicationCount vs actual applications documents/records)
 * 2. Zero limits (live links with maxApplications, quota, or seat_limit = 0, which are treated as unlimited)
 *
 * Privacy guarantee: Returns only IDs, slugs, names, counts, and limit metadata.
 * Contains NO personal data (no applicant names, emails, phones, or pitch contents).
 */

import { getMongoDb } from '@/lib/db/mongodb';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { normalizeStatus } from '@/lib/applications/link-status';

export interface CapacityDriftMismatch {
  store: 'MongoDB' | 'PostgreSQL';
  id: string;
  slug: string;
  name: string;
  recordedCount: number;
  actualCount: number;
  drift: number; // actual - recorded
}

export interface ZeroLimitEntry {
  store: 'MongoDB' | 'PostgreSQL';
  slug: string;
  name: string;
  status: string;
  field: string;
  value: number;
  note: string;
}

export interface CapacityAuditSummary {
  mongoLinksScanned: number;
  postgresCampaignsScanned: number;
  mismatchCount: number;
  zeroLimitCount: number;
  mongoConnected: boolean;
  postgresConnected: boolean;
  mongoError?: string;
  postgresError?: string;
}

export interface CapacityAuditResult {
  countDrift: CapacityDriftMismatch[];
  zeroLimits: ZeroLimitEntry[];
  summary: CapacityAuditSummary;
}

/**
 * Sanitizes raw database connection/query errors into safe, high-level diagnosis strings.
 * Security guarantee: NEVER exposes URLs, hosts, ports, IP addresses, users, or credentials.
 */
export function sanitizeDatabaseError(err: unknown): string {
  if (!err) return 'unknown error';
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string | number })?.code ? String((err as { code?: string | number }).code) : '';
  const combined = `${msg} ${code}`.toLowerCase();

  if (
    combined.includes('econnrefused') ||
    combined.includes('connection refused') ||
    combined.includes('connect refused')
  ) {
    return 'connection refused';
  }
  if (
    combined.includes('password authentication failed') ||
    combined.includes('authentication failed') ||
    combined.includes('auth failed') ||
    combined.includes('bad auth') ||
    combined.includes('28p01') ||
    combined.includes('28000')
  ) {
    return 'auth failed';
  }
  if (
    combined.includes('ssl') ||
    combined.includes('tls') ||
    combined.includes('encryption') ||
    combined.includes('certificate') ||
    combined.includes('no pg_hba.conf entry')
  ) {
    return 'SSL required';
  }
  if (
    combined.includes('etimedout') ||
    combined.includes('timeout') ||
    combined.includes('timed out') ||
    combined.includes('connect_timeout')
  ) {
    return 'timeout';
  }
  if (
    combined.includes('enotfound') ||
    combined.includes('getaddrinfo') ||
    combined.includes('dns')
  ) {
    return 'host not found (DNS lookup failed)';
  }
  if (combined.includes('database') && combined.includes('does not exist')) {
    return 'database does not exist';
  }
  if (combined.includes('relation') && combined.includes('does not exist')) {
    return 'relation or schema missing';
  }
  if (combined.includes('too many') || combined.includes('remaining connection slots')) {
    return 'connection pool exhausted';
  }
  return 'connection or query failed';
}

export async function performCapacityAudit(options: { apply?: boolean } = {}): Promise<CapacityAuditResult> {
  const apply = options.apply === true;
  const countDrift: CapacityDriftMismatch[] = [];
  const zeroLimits: ZeroLimitEntry[] = [];

  let mongoLinksScanned = 0;
  let postgresCampaignsScanned = 0;
  let mongoConnected = false;
  let postgresConnected = false;
  let mongoError: string | undefined;
  let postgresError: string | undefined;

  // 1. Scan MongoDB registration_links
  if (process.env.MONGODB_URI?.trim() || process.env.MONGODB_URI_DIRECT?.trim()) {
    try {
      const mongo = await getMongoDb();
      const links = await mongo.collection('registration_links').find({}).toArray();
      mongoConnected = true;
      mongoLinksScanned = links.length;

      for (const link of links) {
        const slug = (link.slug as string) || 'unknown-slug';
        const name = (link.name as string) || slug;
        const recordedCount = typeof link.applicationCount === 'number' ? link.applicationCount : 0;

        // Count actual applications associated with this link
        const actualCount = await mongo.collection('applications').countDocuments({
          $or: [
            { sourceLinkId: link._id },
            { sourceLinkId: String(link._id) },
            { sourceLinkSlug: slug },
          ],
        });

        if (recordedCount !== actualCount) {
          countDrift.push({
            store: 'MongoDB',
            id: String(link._id),
            slug,
            name,
            recordedCount,
            actualCount,
            drift: actualCount - recordedCount,
          });

          if (apply) {
            await mongo.collection('registration_links').updateOne(
              { _id: link._id },
              { $set: { applicationCount: actualCount, updatedAt: new Date() } }
            );
          }
        }

        // Check for 0 capacity limits on live links
        const rawStatus = (link.status as string) ?? (link.isOpen === false ? 'closed' : 'open');
        const normStatus = normalizeStatus(rawStatus);
        const isLive =
          link.isOpen !== false &&
          !['closed', 'auto-closed', 'auto_closed', 'archived', 'draft'].includes(normStatus);

        if (isLive) {
          if (link.maxApplications === 0) {
            zeroLimits.push({
              store: 'MongoDB',
              slug,
              name,
              status: rawStatus,
              field: 'maxApplications',
              value: 0,
              note: 'Treated as unlimited; link accepts submissions regardless of count',
            });
          }
          if (link.quota === 0) {
            zeroLimits.push({
              store: 'MongoDB',
              slug,
              name,
              status: rawStatus,
              field: 'quota',
              value: 0,
              note: 'Treated as unlimited; link accepts submissions regardless of count',
            });
          }
          if (link.seatLimit === 0) {
            zeroLimits.push({
              store: 'MongoDB',
              slug,
              name,
              status: rawStatus,
              field: 'seatLimit',
              value: 0,
              note: 'Treated as unlimited; link accepts submissions regardless of count',
            });
          }
        }
      }
    } catch (err) {
      mongoConnected = false;
      mongoError = sanitizeDatabaseError(err);
      console.warn('[CapacityAudit] MongoDB query failed:', mongoError);
    }
  } else {
    mongoError = 'MONGODB_URI not set';
  }

  // 2. Scan PostgreSQL campaigns
  if (process.env.DATABASE_URL?.trim()) {
    try {
      const campaigns = await db.select().from(schema.campaigns);
      postgresConnected = true;
      postgresCampaignsScanned = campaigns.length;

      for (const campaign of campaigns) {
        const slug = campaign.slug;
        const name = campaign.name;
        const recordedCount = typeof campaign.applicationCount === 'number' ? campaign.applicationCount : 0;

        const [countResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.applications)
          .where(eq(schema.applications.campaignId, campaign.id));

        const actualCount = countResult?.count ?? 0;

        if (recordedCount !== actualCount) {
          countDrift.push({
            store: 'PostgreSQL',
            id: campaign.id,
            slug,
            name,
            recordedCount,
            actualCount,
            drift: actualCount - recordedCount,
          });

          if (apply) {
            await db
              .update(schema.campaigns)
              .set({ applicationCount: actualCount, updatedAt: new Date() })
              .where(eq(schema.campaigns.id, campaign.id));
          }
        }

        // Check for 0 capacity limits on live campaigns
        if (campaign.status === 'active' && campaign.seatLimit === 0) {
          zeroLimits.push({
            store: 'PostgreSQL',
            slug,
            name,
            status: campaign.status,
            field: 'seat_limit',
            value: 0,
            note: 'Treated as unlimited; cohort accepts applications without seat cap',
          });
        }
      }
    } catch (err) {
      postgresConnected = false;
      postgresError = sanitizeDatabaseError(err);
      console.warn('[CapacityAudit] PostgreSQL query failed:', postgresError);
    }
  } else {
    postgresError = 'DATABASE_URL not set';
  }

  return {
    countDrift,
    zeroLimits,
    summary: {
      mongoLinksScanned,
      postgresCampaignsScanned,
      mismatchCount: countDrift.length,
      zeroLimitCount: zeroLimits.length,
      mongoConnected,
      postgresConnected,
      ...(mongoError ? { mongoError } : {}),
      ...(postgresError ? { postgresError } : {}),
    },
  };
}
