/** @jest-environment node */

import { NextRequest } from 'next/server';
import { PUT } from './route';
import { POST as publishPOST } from './publish/route';
import * as adminAuth from '@admin/lib/auth';
import * as cmsRepo from '@admin/lib/cms/repository';
import * as auditModule from '@/lib/audit/log';
import * as csrfModule from '@/lib/security/csrf-handler';
import { computeAdvertContentHash } from '@/lib/compliance/risk-check';

jest.mock('@admin/lib/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@admin/lib/cms/repository', () => ({
  getCmsContentForAdmin: jest.fn(),
  saveCmsDraft: jest.fn().mockResolvedValue(undefined),
  publishCmsContent: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/audit/log', () => ({
  writeAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/security/csrf-handler', () => ({
  verifyCsrfToken: jest.fn(),
}));

describe('Admin CMS Content Draft & Publish API — Compliance Gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (csrfModule.verifyCsrfToken as jest.Mock).mockResolvedValue({ ok: true });
    (adminAuth.getSession as jest.Mock).mockResolvedValue({ email: 'editor@sinet.africa' });
    (cmsRepo.getCmsContentForAdmin as jest.Mock).mockResolvedValue({
      data: { items: [] },
      meta: { lastUpdated: new Date().toISOString() },
    });
  });

  it('allows saving a draft with financial risk terms when disabled (enabled: false)', async () => {
    const advertWithRiskDraft = {
      id: 'adv-draft-1',
      title: 'Structured 15% Returns on Agribusiness',
      body: 'Review draft for compliance team.',
      ctaLabel: 'Learn more',
      ctaHref: '/contact',
      enabled: false, // Disabled draft!
      legalApproval: false,
    };

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts', {
      method: 'PUT',
      body: JSON.stringify({
        data: { items: [advertWithRiskDraft] },
      }),
    });

    const res = await PUT(req, { params: { key: 'adverts' } });
    expect(res.status).toBe(200);
    expect(cmsRepo.saveCmsDraft).toHaveBeenCalledWith(
      'adverts',
      expect.objectContaining({
        items: [expect.objectContaining({ id: 'adv-draft-1', enabled: false })],
      }),
      'editor@sinet.africa'
    );
  });

  it('blocks saving draft when enabled without legal approval with 400', async () => {
    const advertWithRiskEnabled = {
      id: 'adv-live-1',
      title: 'Earn 25% ROI Guaranteed',
      body: 'Cannot be enabled without approval.',
      ctaLabel: 'Invest now',
      ctaHref: '/contact',
      enabled: true, // Attempting to enable!
      legalApproval: false,
    };

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts', {
      method: 'PUT',
      body: JSON.stringify({
        data: { items: [advertWithRiskEnabled] },
      }),
    });

    const res = await PUT(req, { params: { key: 'adverts' } });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('contains financial/return terms and cannot be enabled without legal approval');
    expect(cmsRepo.saveCmsDraft).not.toHaveBeenCalled();
  });

  it('revokes legal approval, re-locks Enabled, and writes audit entry when approved copy is edited', async () => {
    const originalAdvert = {
      id: 'adv-approved',
      title: 'Approved Agro Capital',
      body: 'Approved text.',
      ctaLabel: 'Learn more',
      ctaHref: '/contact',
      imageAlt: 'Original alt',
    };
    const approvedHash = computeAdvertContentHash(originalAdvert);

    // Editor modifies the title of the approved advert
    const modifiedAdvert = {
      ...originalAdvert,
      title: 'Tampered Title with 40% returns',
      enabled: true,
      legalApproval: true,
      legalApprovalHash: approvedHash, // Old hash doesn't match new title!
    };

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts', {
      method: 'PUT',
      body: JSON.stringify({
        data: { items: [modifiedAdvert] },
      }),
    });

    const res = await PUT(req, { params: { key: 'adverts' } });
    expect(res.status).toBe(200);

    // Verify audit log for revocation
    expect(auditModule.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'cms.advert_legal_approval_revoked',
        actor: 'editor@sinet.africa',
        resource: 'adverts/adv-approved',
      })
    );

    // Verify advert saved has legalApproval: false and enabled: false
    expect(cmsRepo.saveCmsDraft).toHaveBeenCalledWith(
      'adverts',
      expect.objectContaining({
        items: [
          expect.objectContaining({
            id: 'adv-approved',
            legalApproval: false,
            enabled: false,
          }),
        ],
      }),
      'editor@sinet.africa'
    );
  });

  it('rejects publishing adverts with risk terms if enabled without valid approval', async () => {
    (cmsRepo.getCmsContentForAdmin as jest.Mock).mockResolvedValue({
      data: {
        items: [
          {
            id: 'adv-unapproved',
            title: 'Earn 30% yield',
            enabled: true,
            legalApproval: false,
          },
        ],
      },
      meta: {},
    });

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts/publish', {
      method: 'POST',
    });

    const res = await publishPOST(req, { params: { key: 'adverts' } });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('cannot be published live without valid legal approval');
  });
});
