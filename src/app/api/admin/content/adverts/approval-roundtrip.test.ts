/**
 * @jest-environment node
 *
 * Integration-style test: full approval round-trip through the production read path.
 *
 * Scope: mock Mongo (getCmsContentForAdmin / saveCmsDraft), no real DB.
 *   1. Save an advert with risk terms and a flyer via the legal-approval endpoint.
 *   2. Read it back through: normalizeAdvertsContent → getActiveAdverts.
 *      The advert must be active.
 *   3. Edit the copy or swap the image → read again: must be inactive / excluded.
 *   4. Confirm legalApproval, legalApprovedBy, legalApprovedAt survive normalization
 *      (not only legalApprovalHash).
 */

import { NextRequest } from 'next/server';
import { POST as legalApprovalPOST } from '@/app/api/admin/content/adverts/legal-approval/route';
import { normalizeAdvertsContent } from '@admin/lib/cms/defaults';
import { getActiveAdverts } from '@/lib/adverts/active';
import { computeAdvertContentHash } from '@/lib/compliance/risk-check';
import * as adminAuth from '@admin/lib/auth';
import * as auditModule from '@/lib/audit/log';
import * as csrfModule from '@/lib/security/csrf-handler';

// --- Shared in-memory store so saveCmsDraft and getCmsContentForAdmin share state ---
let storedItems: unknown[] = [];

jest.mock('@admin/lib/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/audit/log', () => ({
  writeAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/security/csrf-handler', () => ({
  verifyCsrfToken: jest.fn(),
}));

jest.mock('@/lib/security/rate-limit-unified', () => ({
  enforceRateLimit: jest.fn().mockResolvedValue({ ok: true, headers: {} }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@admin/lib/cms/repository', () => ({
  getCmsContentForAdmin: jest.fn((_key: string) =>
    Promise.resolve({
      data: { items: storedItems },
      meta: { lastUpdated: new Date().toISOString() },
    })
  ),
  saveCmsDraft: jest.fn((_key: string, data: { items: unknown[] }) => {
    storedItems = data.items ?? [];
    return Promise.resolve(undefined);
  }),
}));

const BASE_ADVERT = {
  advertId: 'adv-roundtrip-001',
  title: 'Earn 40% Returns on Agricultural Cycles',
  body: 'Structured trade cycle participation with projected returns.',
  ctaLabel: 'Invest now',
  ctaHref: '/sectors#agriculture',
  imageUrl: '/images/adverts/harvest-cycle.jpg',
  flyerImage: '/images/flyers/harvest-poster.png',
  imageAlt: 'Crop warehouse at harvest season',
  eyebrow: 'Trade Opportunity',
  startsAt: '',
  endsAt: '',
  showModal: false,
};

function makeApprovalRequest(patch: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/admin/content/adverts/legal-approval', {
    method: 'POST',
    body: JSON.stringify({ ...BASE_ADVERT, ...patch }),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Legal approval integration — full read path (mock Mongo, no real DB)', () => {
  beforeEach(() => {
    storedItems = [];
    jest.clearAllMocks();
    (csrfModule.verifyCsrfToken as jest.Mock).mockResolvedValue({ ok: true });
    (adminAuth.getSession as jest.Mock).mockResolvedValue({ email: 'compliance@sinet.africa' });
  });

  it('1. approved advert survives normalizeAdvertsContent and appears in getActiveAdverts', async () => {
    // Step 1: Approve via the legal-approval endpoint
    const res = await legalApprovalPOST(makeApprovalRequest({ approved: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.legalApproval).toBe(true);
    expect(body.legalApprovalHash).toHaveLength(64);
    const approvedHash = body.legalApprovalHash as string;

    // Step 2: Read back via the production path
    //   storedItems was mutated by saveCmsDraft mock above
    const normalized = normalizeAdvertsContent({ items: storedItems as any[] });
    const item = normalized.items[0];

    // Confirm all approval fields survived normalization
    expect(item.legalApproval).toBe(true);
    expect(item.legalApprovedBy).toBe('compliance@sinet.africa');
    expect(item.legalApprovedAt).toBeTruthy();
    expect(item.legalApprovalHash).toBe(approvedHash);

    // Enable it and confirm getActiveAdverts returns it
    item.enabled = true;
    const active = getActiveAdverts({ items: [item] });
    expect(active.map((a) => a.id)).toContain('adv-roundtrip-001');
  });

  it('2. approved advert with content modified is excluded by getActiveAdverts', async () => {
    // Approve first
    await legalApprovalPOST(makeApprovalRequest({ approved: true }));

    const normalized = normalizeAdvertsContent({ items: storedItems as any[] });
    const item = normalized.items[0];
    item.enabled = true;

    // Mutate: change the body copy → hash mismatch → approval revoked
    const tampered = { ...item, body: 'DIFFERENT BODY — no longer matches approved hash' };

    const active = getActiveAdverts({ items: [tampered] });
    expect(active.map((a) => a.id)).not.toContain('adv-roundtrip-001');
  });

  it('3. approved advert with image swapped is excluded by getActiveAdverts', async () => {
    // Approve first
    await legalApprovalPOST(makeApprovalRequest({ approved: true }));

    const normalized = normalizeAdvertsContent({ items: storedItems as any[] });
    const item = normalized.items[0];
    item.enabled = true;

    // Swap the flyerImage → hash changes → approval stale
    const imageSwapped = { ...item, flyerImage: '/images/flyers/different-poster.png' };

    const active = getActiveAdverts({ items: [imageSwapped] });
    expect(active.map((a) => a.id)).not.toContain('adv-roundtrip-001');
  });

  it('4. legalApproval, legalApprovedBy, legalApprovedAt all survive normalizeAdvertsContent', async () => {
    await legalApprovalPOST(makeApprovalRequest({ approved: true }));

    // Verify via normalizeAdvertsContent directly — this is the production Mongo read path
    const normalized = normalizeAdvertsContent({ items: storedItems as any[] });
    const item = normalized.items[0];

    expect(item.legalApproval).toBe(true);
    expect(typeof item.legalApprovedBy).toBe('string');
    expect(item.legalApprovedBy!.length).toBeGreaterThan(0);
    expect(typeof item.legalApprovedAt).toBe('string');
    expect(item.legalApprovedAt!.length).toBeGreaterThan(0);
    expect(item.legalApprovalHash).toHaveLength(64);

    // Cross-check: hash matches current content exactly
    const recomputed = computeAdvertContentHash(item);
    expect(recomputed).toBe(item.legalApprovalHash);
  });

  it('5. revoked advert (approved: false) is excluded by getActiveAdverts', async () => {
    // Approve then immediately revoke
    await legalApprovalPOST(makeApprovalRequest({ approved: true }));
    await legalApprovalPOST(makeApprovalRequest({ approved: false }));

    const normalized = normalizeAdvertsContent({ items: storedItems as any[] });
    const item = normalized.items[0];
    item.enabled = true;

    expect(item.legalApproval).toBe(false);
    const active = getActiveAdverts({ items: [item] });
    expect(active.map((a) => a.id)).not.toContain('adv-roundtrip-001');
  });
});
