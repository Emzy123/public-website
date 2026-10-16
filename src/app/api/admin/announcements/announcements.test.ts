/**
 * @jest-environment node
 *
 * Tests for the admin announcement write surfaces:
 *   POST /api/admin/announcements
 *   PATCH /api/admin/announcements/[id]
 *
 * Covers: 401 unauthenticated, bad Origin → 403, zod rejection, complianceRisk output.
 * No real DB or Postgres connection required — pulse.ts DB calls are mocked.
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/announcements/route';
import { PATCH } from '@/app/api/admin/announcements/[id]/route';
import * as adminAuth from '@admin/lib/auth';
import * as originModule from '@/lib/security/origin';

// Mock admin session (env-based login, not member roles)
jest.mock('@admin/lib/auth', () => ({
  getSession: jest.fn(),
}));

// Mock validateOrigin
jest.mock('@/lib/security/origin', () => ({
  validateOrigin: jest.fn(),
}));

// Mock pulse DB operations (announcements table via Drizzle)
jest.mock('@/lib/pulse/pulse', () => ({
  createPulseAnnouncement: jest.fn().mockResolvedValue({
    announcement: { id: 'ann-001', title: 'Test', body: 'Test body', isApproved: false },
    complianceRisk: { hasRisk: false, matchedTerms: [], matchedFields: [], imageRisk: false },
  }),
  updatePulseAnnouncement: jest.fn().mockResolvedValue({
    announcement: { id: 'ann-001', title: 'Updated', body: 'Updated body', isApproved: false },
    complianceRisk: { hasRisk: false, matchedTerms: [], matchedFields: [], imageRisk: false },
  }),
  checkAnnouncementRisk: jest.fn().mockReturnValue({
    hasRisk: false, matchedTerms: [], matchedFields: [], imageRisk: false,
  }),
}));

import * as pulseModule from '@/lib/pulse/pulse';

function postReq(body: unknown, origin = 'http://localhost:3000') {
  return new NextRequest('http://localhost:3000/api/admin/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

function patchReq(id: string, body: unknown, origin = 'http://localhost:3000') {
  return new NextRequest(`http://localhost:3000/api/admin/announcements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (originModule.validateOrigin as jest.Mock).mockReturnValue(true);
    (adminAuth.getSession as jest.Mock).mockResolvedValue({ email: 'admin@sinet.africa' });
  });

  it('returns 401 with no session', async () => {
    (adminAuth.getSession as jest.Mock).mockResolvedValue(null);

    const res = await POST(postReq({ title: 'Hello', body: 'World' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 403 for a bad Origin', async () => {
    (originModule.validateOrigin as jest.Mock).mockReturnValue(false);

    const res = await POST(postReq({ title: 'Hello', body: 'World' }, 'https://evil.com'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/forbidden/i);
  });

  it('returns 400 for zod-invalid body (missing title)', async () => {
    const res = await POST(postReq({ body: 'No title provided' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.issues).toBeDefined();
  });

  it('returns 400 for zod-invalid body (title too long)', async () => {
    const res = await POST(postReq({ title: 'x'.repeat(201), body: 'Some body' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.issues).toBeDefined();
  });

  it('returns 201 with complianceRisk for a clean announcement', async () => {
    const res = await POST(postReq({ title: 'Weekly Chapter Sync', body: 'See you Friday at 4pm.' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.complianceRisk).toBeDefined();
    expect(body.complianceRisk.hasRisk).toBe(false);
  });

  it('returns 201 and complianceRisk.hasRisk: true for risky copy', async () => {
    // Override mock to simulate risky announcement
    (pulseModule.createPulseAnnouncement as jest.Mock).mockResolvedValueOnce({
      announcement: { id: 'ann-risky', title: 'Earn 40% Return', body: 'Partner program', isApproved: false },
      complianceRisk: {
        hasRisk: true,
        matchedTerms: ['40%', 'Return'],
        matchedFields: ['title'],
        imageRisk: false,
      },
    });

    const res = await POST(postReq({ title: 'Earn 40% Return Partner Program', body: 'Join the cycle.' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.complianceRisk.hasRisk).toBe(true);
    expect(body.complianceRisk.matchedTerms).toContain('40%');
  });

  it('smoke: 401 without any session (second check)', async () => {
    (adminAuth.getSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(postReq({ title: 'x', body: 'y' }));
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/admin/announcements/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (originModule.validateOrigin as jest.Mock).mockReturnValue(true);
    (adminAuth.getSession as jest.Mock).mockResolvedValue({ email: 'admin@sinet.africa' });
  });

  it('returns 401 with no session', async () => {
    (adminAuth.getSession as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(patchReq('ann-001', { title: 'Updated' }), { params: { id: 'ann-001' } });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a bad Origin', async () => {
    (originModule.validateOrigin as jest.Mock).mockReturnValue(false);

    const res = await PATCH(
      patchReq('ann-001', { title: 'Updated' }, 'https://evil.com'),
      { params: { id: 'ann-001' } }
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/forbidden/i);
  });

  it('returns 400 for zod-invalid body (title too long)', async () => {
    const res = await PATCH(
      patchReq('ann-001', { title: 'x'.repeat(201) }),
      { params: { id: 'ann-001' } }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.issues).toBeDefined();
  });

  it('returns 200 with complianceRisk for a clean edit', async () => {
    const res = await PATCH(
      patchReq('ann-001', { title: 'Chapter Sync Update', body: 'Rescheduled to Monday.' }),
      { params: { id: 'ann-001' } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.complianceRisk).toBeDefined();
    expect(body.complianceRisk.hasRisk).toBe(false);
  });

  it('returns 200 and complianceRisk.hasRisk: true for risky edit copy', async () => {
    (pulseModule.updatePulseAnnouncement as jest.Mock).mockResolvedValueOnce({
      announcement: { id: 'ann-001', title: 'Guaranteed returns', body: 'Join cycle.', isApproved: false },
      complianceRisk: {
        hasRisk: true,
        matchedTerms: ['Guaranteed'],
        matchedFields: ['title'],
        imageRisk: false,
      },
    });

    const res = await PATCH(
      patchReq('ann-001', { title: 'Guaranteed returns from our trade program' }),
      { params: { id: 'ann-001' } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.complianceRisk.hasRisk).toBe(true);
    expect(body.complianceRisk.matchedTerms).toContain('Guaranteed');
  });

  it('smoke: 401 without any session (second check)', async () => {
    (adminAuth.getSession as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(
      patchReq('ann-001', { body: 'test' }),
      { params: { id: 'ann-001' } }
    );
    expect(res.status).toBe(401);
  });
});
