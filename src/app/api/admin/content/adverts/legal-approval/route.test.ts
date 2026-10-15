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
        }),
      })
    );
  });
});
