#!/usr/bin/env tsx
/**
 * scripts/check-capacity-counts.ts
 *
 * Production Data Audit & Drift Check
 *
 * 1. Count drift:
 *    - For every Mongo registration link, compares applicationCount (missing = 0)
 *      with the actual number of applications for that link.
 *    - For every Postgres campaign, compares application_count with the real
 *      count of its applications.
 *    - Prints mismatches ONLY.
 *    - If --apply is provided, updates recorded counts to match actual counts.
 *
 * 2. Zero limits:
 *    - Lists any live link or campaign where maxApplications, quota or seat_limit is 0,
 *      highlighting that 0 is now treated as unlimited.
 *
 * Usage:
 *   npx tsx scripts/check-capacity-counts.ts           # Dry run (read-only)
 *   npx tsx scripts/check-capacity-counts.ts --apply  # Backfill recorded counts
 */

import { MongoClient } from 'mongodb';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { normalizeStatus } from '../src/lib/applications/link-status';

// Load environment variables
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
  dotenv.config();
} catch {
  // ignore
}

const isApply = process.argv.includes('--apply');

export interface DriftRecord {
  store: 'MongoDB' | 'PostgreSQL';
  id: string;
  slug: string;
  name: string;
  recordedCount: number;
  actualCount: number;
  drift: number; // actual - recorded
}

export interface ZeroLimitRecord {
  store: 'MongoDB' | 'PostgreSQL';
  slug: string;
  name: string;
  status: string;
  field: string;
  value: number;
  note: string;
}

export async function runAudit(options: { apply?: boolean } = {}): Promise<{
  driftMismatches: DriftRecord[];
  zeroLimits: ZeroLimitRecord[];
}> {
  const apply = options.apply ?? isApply;
  console.log('===============================================================');
  console.log(`SINet Capacity & Drift Audit [Mode: ${apply ? 'APPLY (Backfill)' : 'DRY-RUN (Read-Only)'}]`);
  console.log('===============================================================\n');

  const driftMismatches: DriftRecord[] = [];
  const zeroLimits: ZeroLimitRecord[] = [];

  // --- 1. MongoDB Check ---
  const mongoUri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
  const mongoDbName = process.env.MONGODB_DB || 'sinet';

  if (!mongoUri) {
    console.warn('[MongoDB] MONGODB_URI not configured. Skipping MongoDB check.');
  } else {
    let mongoClient: MongoClient | null = null;
    try {
      mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
      await mongoClient.connect();
      const mongoDb = mongoClient.db(mongoDbName);

      const links = await mongoDb.collection('registration_links').find({}).toArray();
      console.log(`[MongoDB] Scanning ${links.length} registration links in db "${mongoDbName}"...`);

      for (const link of links) {
        const slug = link.slug || 'unknown-slug';
        const name = link.name || slug;
        const recordedCount = typeof link.applicationCount === 'number' ? link.applicationCount : 0;

        // Count actual applications associated with this link
        const actualCount = await mongoDb.collection('applications').countDocuments({
          $or: [
            { sourceLinkId: link._id },
            { sourceLinkId: String(link._id) },
            { sourceLinkSlug: slug },
          ],
        });

        if (recordedCount !== actualCount) {
          driftMismatches.push({
            store: 'MongoDB',
            id: String(link._id),
            slug,
            name,
            recordedCount,
            actualCount,
            drift: actualCount - recordedCount,
          });

          if (apply) {
            await mongoDb.collection('registration_links').updateOne(
              { _id: link._id },
              { $set: { applicationCount: actualCount, updatedAt: new Date() } }
            );
          }
        }

        // Check for 0 capacity limits on live links
        const rawStatus = link.status ?? (link.isOpen === false ? 'closed' : 'open');
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
      console.error('[MongoDB] Error querying registration links:', err instanceof Error ? err.message : err);
    } finally {
      if (mongoClient) {
        await mongoClient.close().catch(() => {});
      }
    }
  }

  // --- 2. PostgreSQL Check ---
  const pgConnectionString = process.env.DATABASE_URL?.trim();

  if (!pgConnectionString) {
    console.warn('[PostgreSQL] DATABASE_URL not configured. Skipping PostgreSQL check.');
  } else {
    let pgClient: postgres.Sql | null = null;
    try {
      const isLocal = pgConnectionString.includes('localhost') || pgConnectionString.includes('127.0.0.1');
      pgClient = postgres(pgConnectionString, {
        prepare: false,
        max: 2,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        connect_timeout: 5,
        idle_timeout: 10,
      });

      const db = drizzle(pgClient, { schema });
      const campaigns = await db.select().from(schema.campaigns);
      console.log(`[PostgreSQL] Scanning ${campaigns.length} campaigns in Postgres...`);

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
          driftMismatches.push({
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
      console.error('[PostgreSQL] Error querying campaigns:', err instanceof Error ? err.message : err);
    } finally {
      if (pgClient) {
        await pgClient.end().catch(() => {});
      }
    }
  }

  // --- Report Results ---
  console.log('\n---------------------------------------------------------------');
  console.log('CHECK 1: COUNT DRIFT (applicationCount vs actual applications)');
  console.log('---------------------------------------------------------------');
  if (driftMismatches.length === 0) {
    console.log('[OK] No count drift detected. All recorded counts match actual application counts.');
  } else {
    console.warn(`[MISMATCH] Found ${driftMismatches.length} item(s) with application count drift:`);
    console.table(
      driftMismatches.map((m) => ({
        Store: m.store,
        Slug: m.slug,
        Name: m.name.slice(0, 30),
        'Recorded Count': m.recordedCount,
        'Actual Count': m.actualCount,
        Drift: m.drift > 0 ? `+${m.drift}` : `${m.drift}`,
        Status: apply ? 'UPDATED (--apply)' : 'DRY-RUN (Run with --apply to backfill)',
      }))
    );
  }

  console.log('\n---------------------------------------------------------------');
  console.log('CHECK 2: ZERO LIMITS (maxApplications, quota, seat_limit = 0)');
  console.log('---------------------------------------------------------------');
  if (zeroLimits.length === 0) {
    console.log('[OK] No live links or campaigns found with a 0 limit.');
  } else {
    console.warn(`[NOTICE] Found ${zeroLimits.length} live item(s) with capacity = 0 (treated as unlimited):`);
    console.table(
      zeroLimits.map((z) => ({
        Store: z.store,
        Slug: z.slug,
        Name: z.name.slice(0, 30),
        Status: z.status,
        Field: z.field,
        Value: z.value,
        Behavior: z.note,
      }))
    );
  }

  console.log('===============================================================\n');

  return {
    driftMismatches,
    zeroLimits,
  };
}

if (require.main === module) {
  runAudit().catch((err) => {
    console.error('Fatal audit error:', err);
    process.exit(1);
  });
}
