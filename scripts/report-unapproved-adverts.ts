#!/usr/bin/env tsx
/**
 * Read-only script to inspect MongoDB CMS adverts and report any adverts that
 * getActiveAdverts() hides or will hide due to lacking valid legal approval.
 *
 * Usage:
 *   npx tsx scripts/report-unapproved-adverts.ts
 *
 * Against a remote or production database:
 *   MONGODB_URI="mongodb+srv://..." npx tsx scripts/report-unapproved-adverts.ts
 */

import { MongoClient } from 'mongodb';
import { normalizeAdvertsContent } from '../admin/lib/cms/defaults';
import { checkAdvertRisk, isAdvertApprovalValid, computeAdvertContentHash } from '../src/lib/compliance/risk-check';
import { getActiveAdverts } from '../src/lib/adverts/active';
import type { AdvertItem } from '../admin/types/content';

// Load .env.local if present
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
  dotenv.config();
} catch {
  // ignore if dotenv is not available
}

const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'sinet';

interface UnapprovedReport {
  id: string;
  title: string;
  scope: 'published' | 'draft';
  enabled: boolean;
  triggers: string[];
  hasImageUrl: boolean;
  hasFlyerImage: boolean;
  showModal: boolean;
  legalApproval: boolean;
  legalApprovedBy?: string;
  legalApprovedAt?: string;
  reason: string;
}

async function main() {
  console.log('===============================================================');
  console.log('SINet Compliance Audit: Unapproved Adverts & Visual Risks');
  console.log(`Connecting to: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')} [db: ${dbName}]`);
  console.log('===============================================================\n');

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
    await client.connect();
    const db = client.db(dbName);

    const doc = await db.collection('cms_content').findOne({ key: 'adverts' });

    if (!doc) {
      console.log('No "adverts" document found in collection "cms_content".');
      console.log('The CMS currently uses defaults (DEFAULT_ADVERTS: 0 items).');
      console.log('\nDeploy impact: 0 adverts will be hidden.');
      return;
    }

    const unapproved: UnapprovedReport[] = [];

    // Check published content
    const publishedContent = normalizeAdvertsContent(doc.data as any);
    for (const item of publishedContent.items) {
      evaluateItem(item, 'published', unapproved);
    }

    // Check draft content if distinct
    if (doc.draft) {
      const draftContent = normalizeAdvertsContent(doc.draft as any);
      for (const item of draftContent.items) {
        evaluateItem(item, 'draft', unapproved);
      }
    }

    if (unapproved.length === 0) {
      console.log('✓ All adverts in MongoDB are either approved or contain no visual/financial risks.');
      console.log('Deploy impact: 0 adverts will go inactive upon deployment.');
    } else {
      console.log(`Found ${unapproved.length} unapproved advert(s) that require legal approval:\n`);
      for (const a of unapproved) {
        console.log(`- [${a.scope.toUpperCase()}] ID: "${a.id}" | Title: "${a.title}"`);
        console.log(`  Enabled: ${a.enabled}`);
        console.log(`  Triggers: ${a.triggers.join(', ')}`);
        console.log(`  Reason: ${a.reason}`);
        console.log(`  Approval State: legalApproval=${a.legalApproval}`);
        console.log('');
      }
      console.log('Action for Legal: approve via POST /api/admin/content/adverts/legal-approval or via CMS Adverts editor.');
    }
  } catch (err: any) {
    console.error('Could not connect to MongoDB:', err.message || err);
    console.log('\nIf running against production or staging, execute:');
    console.log('  MONGODB_URI="<connection-string>" npx tsx scripts/report-unapproved-adverts.ts');
  } finally {
    if (client) await client.close();
  }
}

function evaluateItem(item: AdvertItem, scope: 'published' | 'draft', list: UnapprovedReport[]) {
  const risk = checkAdvertRisk(item);
  const isValid = isAdvertApprovalValid(item);
  const hasImageUrl = Boolean(item.imageUrl && item.imageUrl.trim().length > 0);
  const hasFlyerImage = Boolean(item.flyerImage && item.flyerImage.trim().length > 0);
  const showModal = Boolean(item.showModal);

  const triggers: string[] = [];
  if (hasImageUrl) triggers.push(`imageUrl ("${item.imageUrl}")`);
  if (hasFlyerImage) triggers.push(`flyerImage ("${item.flyerImage}")`);
  if (showModal) triggers.push('showModal: true');
  if (risk.matchedTerms.length > 0) triggers.push(`text claims (${risk.matchedTerms.join(', ')})`);

  // Check if getActiveAdverts would hide it because of risk without approval
  if (risk.hasRisk && !isValid) {
    let reason = 'Missing legal approval for visual risk / financial claims.';
    if (item.legalApproval && item.legalApprovalHash) {
      reason = 'Approval hash mismatch (content was edited after legal sign-off).';
    }
    list.push({
      id: item.id,
      title: item.title,
      scope,
      enabled: item.enabled,
      triggers,
      hasImageUrl,
      hasFlyerImage,
      showModal,
      legalApproval: Boolean(item.legalApproval),
      legalApprovedBy: item.legalApprovedBy,
      legalApprovedAt: item.legalApprovedAt,
      reason,
    });
  }
}

main().catch(console.error);
