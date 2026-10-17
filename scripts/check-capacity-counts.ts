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

import { performCapacityAudit } from '../src/lib/applications/capacity-audit';

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

export async function runCliAudit(options: { apply?: boolean } = {}) {
  const apply = options.apply ?? isApply;
  console.log('===============================================================');
  console.log(`SINet Capacity & Drift Audit [Mode: ${apply ? 'APPLY (Backfill)' : 'DRY-RUN (Read-Only)'}]`);
  console.log('===============================================================\n');

  const result = await performCapacityAudit({ apply });

  console.log('\n---------------------------------------------------------------');
  console.log('CHECK 1: COUNT DRIFT (applicationCount vs actual applications)');
  console.log('---------------------------------------------------------------');
  if (result.countDrift.length === 0) {
    console.log('[OK] No count drift detected. All recorded counts match actual application counts.');
  } else {
    console.warn(`[MISMATCH] Found ${result.countDrift.length} item(s) with application count drift:`);
    console.table(
      result.countDrift.map((m) => ({
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
  if (result.zeroLimits.length === 0) {
    console.log('[OK] No live links or campaigns found with a 0 limit.');
  } else {
    console.warn(`[NOTICE] Found ${result.zeroLimits.length} live item(s) with capacity = 0 (treated as unlimited):`);
    console.table(
      result.zeroLimits.map((z) => ({
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
  return result;
}

if (require.main === module) {
  runCliAudit().catch((err) => {
    console.error('Fatal audit error:', err);
    process.exit(1);
  });
}
