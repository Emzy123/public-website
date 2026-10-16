/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from './route';
import * as adminAuth from '@admin/lib/auth';
import * as auditModule from '@/lib/audit/log';
import * as csrfModule from '@/lib/security/csrf-handler';

jest.mock('@admin/lib/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/audit/log', () => ({
  writeAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/security/csrf-handler', () => ({
  verifyCsrfToken: jest.fn(),
}));

describe('Admin Advert Legal Approval API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (csrfModule.verifyCsrfToken as jest.Mock).mockResolvedValue({ ok: true });
  });

  it('rejects unauthenticated requests with 401', async () => {
    (adminAuth.getSession as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts/legal-approval', {
      method: 'POST',
      body: JSON.stringify({ advertId: 'adv-123', approved: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects requests missing advertId with 400', async () => {
    (adminAuth.getSession as jest.Mock).mockResolvedValue({ email: 'admin@sinet.africa' });

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts/legal-approval', {
      method: 'POST',
      body: JSON.stringify({ approved: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('records legal approval in audit log and returns 200', async () => {
    (adminAuth.getSession as jest.Mock).mockResolvedValue({ email: 'compliance@sinet.africa' });

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts/legal-approval', {
      method: 'POST',
      body: JSON.stringify({
        advertId: 'adv-40pct',
        title: 'Earn 40% Return in 3 Months',
        approved: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.advertId).toBe('adv-40pct');
    expect(body.legalApproval).toBe(true);
    expect(body.legalApprovedBy).toBe('compliance@sinet.africa');

    expect(auditModule.writeAuditLog).toHaveBeenCalledTimes(1);
    expect(auditModule.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'cms.advert_legal_approval',
        actor: 'compliance@sinet.africa',
        resource: 'adverts/adv-40pct',
        metadata: expect.objectContaining({
          advertId: 'adv-40pct',
          title: 'Earn 40% Return in 3 Months',
          legalApproval: true,
          approvedBy: 'compliance@sinet.africa',
          contentHash: expect.any(String),
        }),
      })
    );
  });

  it('strictly ignores client-supplied legalApprovedBy/legalApprovedAt and binds content hash', async () => {
    (adminAuth.getSession as jest.Mock).mockResolvedValue({ email: 'officer@sinet.africa' });

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts/legal-approval', {
      method: 'POST',
      body: JSON.stringify({
        advertId: 'adv-spoof-attempt',
        title: 'Agricultural Trade Opportunity',
        body: '15% returns on structured supply contracts.',
        ctaLabel: 'Invest now',
        ctaHref: '/sectors',
        imageAlt: 'Warehouse goods',
        approved: true,
        legalApprovedBy: 'attacker@evil.com',
        legalApprovedAt: '1999-01-01T00:00:00.000Z',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.legalApprovedBy).toBe('officer@sinet.africa');
    expect(body.legalApprovedAt).not.toBe('1999-01-01T00:00:00.000Z');
    expect(body.legalApprovalHash).toHaveLength(64);

    expect(auditModule.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'cms.advert_legal_approval',
        actor: 'officer@sinet.africa',
        metadata: expect.objectContaining({
          approvedBy: 'officer@sinet.africa',
          contentHash: body.legalApprovalHash,
        }),
      })
    );
  });

  it('records cms.advert_legal_approval_revoked when unapproving an advert', async () => {
    (adminAuth.getSession as jest.Mock).mockResolvedValue({ email: 'officer@sinet.africa' });

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts/legal-approval', {
      method: 'POST',
      body: JSON.stringify({
        advertId: 'adv-revoke',
        title: 'Deprecated Campaign',
        approved: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.legalApproval).toBe(false);
    expect(body.legalApprovedBy).toBeUndefined();
    expect(body.legalApprovalHash).toBeUndefined();

    expect(auditModule.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'cms.advert_legal_approval_revoked',
        actor: 'officer@sinet.africa',
        resource: 'adverts/adv-revoke',
      })
    );
  });
});
