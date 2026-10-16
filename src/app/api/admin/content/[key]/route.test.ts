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

  it('blocks saving an image-only flyer when enabled without legal approval with 400', async () => {
    const imageFlyerEnabled = {
      id: 'adv-flyer-live-1',
      title: 'October Campus Meetup',
      flyerImage: '/posters/october.png',
      enabled: true,
      legalApproval: false,
    };

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts', {
      method: 'PUT',
      body: JSON.stringify({
        data: { items: [imageFlyerEnabled] },
      }),
    });

    const res = await PUT(req, { params: { key: 'adverts' } });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("Advert contains an image or modal that can't be auto-checked and cannot be enabled without legal approval.");
    expect(cmsRepo.saveCmsDraft).not.toHaveBeenCalled();
  });

  it('rejects publishing an image-only flyer if enabled without valid approval with 400', async () => {
    (cmsRepo.getCmsContentForAdmin as jest.Mock).mockResolvedValue({
      data: {
        items: [
          {
            id: 'adv-flyer-unapproved',
            title: 'October Campus Meetup',
            flyerImage: '/posters/october.png',
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
    expect(body.error).toContain("Advert contains an image or modal that can't be auto-checked and cannot be published live without valid legal approval bound to its content.");
  });

  it('revokes legal approval, re-locks Enabled, and writes audit entry when approved copy is edited', async () => {
    const originalAdvert = {
      id: 'adv-approved',
      title: 'Approved Agro Capital',
      body: 'Approved text.',
      ctaLabel: 'Learn more',
      ctaHref: '/contact',
      imageUrl: '',
      flyerImage: '',
      imageAlt: 'Original alt',
    };
    const approvedHash = computeAdvertContentHash(originalAdvert);

    const storedApprovedAdvert = {
      ...originalAdvert,
      enabled: true,
      legalApproval: true,
      legalApprovalHash: approvedHash,
      legalApprovedBy: 'legal@sinet.africa',
      legalApprovedAt: new Date().toISOString(),
    };

    (cmsRepo.getCmsContentForAdmin as jest.Mock).mockResolvedValue({
      data: { items: [storedApprovedAdvert] },
      meta: {},
    });

    // Editor modifies the title of the approved advert
    const modifiedAdvert = {
      ...originalAdvert,
      title: 'Tampered Title with 40% returns',
      enabled: true,
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

  it('revokes legal approval, re-locks Enabled, and logs audit entry when an advert image is swapped after approval', async () => {
    const originalAdvert = {
      id: 'adv-image-approved',
      title: 'Approved Launch Poster',
      body: 'Campus event announcement.',
      ctaLabel: 'Learn more',
      ctaHref: '/contact',
      imageUrl: '/images/poster-v1.jpg',
      flyerImage: '/images/flyer-v1.png',
      imageAlt: 'Approved poster artwork',
    };
    const approvedHash = computeAdvertContentHash(originalAdvert);

    const storedApprovedAdvert = {
      ...originalAdvert,
      enabled: true,
      legalApproval: true,
      legalApprovalHash: approvedHash,
      legalApprovedBy: 'counsel@sinet.africa',
      legalApprovedAt: new Date().toISOString(),
    };

    (cmsRepo.getCmsContentForAdmin as jest.Mock).mockResolvedValue({
      data: { items: [storedApprovedAdvert] },
      meta: {},
    });

    // Swapping the flyerImage
    const modifiedAdvert = {
      ...storedApprovedAdvert,
      flyerImage: '/images/poster-v2-swapped.png',
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
        resource: 'adverts/adv-image-approved',
        metadata: expect.objectContaining({
          reason: 'Content modified after legal approval',
        }),
      })
    );

    // Verify advert saved has legalApproval: false and enabled: false
    expect(cmsRepo.saveCmsDraft).toHaveBeenCalledWith(
      'adverts',
      expect.objectContaining({
        items: [
          expect.objectContaining({
            id: 'adv-image-approved',
            legalApproval: false,
            enabled: false,
          }),
        ],
      }),
      'editor@sinet.africa'
    );
  });

  it('strips client-supplied legalApproval and legalApprovalHash when sent directly via PUT without calling legal-approval endpoint', async () => {
    // Unapproved advert in server CMS storage
    const storedUnapprovedAdvert = {
      id: 'adv-spoof-1',
      title: 'Earn 40% Return',
      body: 'Invest in our project',
      ctaLabel: 'Learn more',
      ctaHref: '/contact',
      imageUrl: '',
      flyerImage: '',
      imageAlt: '',
      enabled: false,
      legalApproval: false,
    };
    (cmsRepo.getCmsContentForAdmin as jest.Mock).mockResolvedValue({
      data: { items: [storedUnapprovedAdvert] },
      meta: {},
    });

    const correctlyComputedHash = computeAdvertContentHash(storedUnapprovedAdvert);

    // Attacker crafts PUT payload with legalApproval: true and a correctly computed hash
    const spoofedAdvert = {
      ...storedUnapprovedAdvert,
      legalApproval: true,
      legalApprovalHash: correctlyComputedHash,
      legalApprovedBy: 'attacker@sinet.africa',
      legalApprovedAt: new Date().toISOString(),
    };

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts', {
      method: 'PUT',
      body: JSON.stringify({
        data: { items: [spoofedAdvert] },
      }),
    });

    const res = await PUT(req, { params: { key: 'adverts' } });
    expect(res.status).toBe(200);

    // Stored draft must strip client-supplied legalApproval and store it as unapproved
    expect(cmsRepo.saveCmsDraft).toHaveBeenCalledWith(
      'adverts',
      expect.objectContaining({
        items: [
          expect.objectContaining({
            id: 'adv-spoof-1',
            legalApproval: false,
            legalApprovalHash: undefined,
            legalApprovedBy: undefined,
            legalApprovedAt: undefined,
          }),
        ],
      }),
      'editor@sinet.africa'
    );
  });

  it('preserves legal approval on no-op save with whitespace variation due to normalized hash stability', async () => {
    const originalAdvert = {
      id: 'adv-stable-1',
      title: 'Stable Approved Program',
      body: 'Agricultural logistics partnership.',
      ctaLabel: 'Learn more',
      ctaHref: '/contact',
      imageUrl: '/images/adverts/agro.jpg',
      flyerImage: '/images/flyers/agro.png',
      imageAlt: 'Agro logistics',
    };
    const approvedHash = computeAdvertContentHash(originalAdvert);

    const storedApprovedAdvert = {
      ...originalAdvert,
      enabled: true,
      legalApproval: true,
      legalApprovalHash: approvedHash,
      legalApprovedBy: 'counsel@sinet.africa',
      legalApprovedAt: new Date().toISOString(),
    };

    (cmsRepo.getCmsContentForAdmin as jest.Mock).mockResolvedValue({
      data: { items: [storedApprovedAdvert] },
      meta: {},
    });

    // Client sends save with harmless whitespace differences (e.g. trailing space or CRLF)
    const noOpWithWhitespace = {
      ...storedApprovedAdvert,
      title: '  Stable Approved Program  ',
      body: 'Agricultural logistics partnership.\r\n',
    };

    const req = new NextRequest('http://localhost:3000/api/admin/content/adverts', {
      method: 'PUT',
      body: JSON.stringify({
        data: { items: [noOpWithWhitespace] },
      }),
    });

    const res = await PUT(req, { params: { key: 'adverts' } });
    expect(res.status).toBe(200);

    // Revocation audit log should NOT have been called
    expect(auditModule.writeAuditLog).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'cms.advert_legal_approval_revoked' })
    );

    // Preserved approval state
    expect(cmsRepo.saveCmsDraft).toHaveBeenCalledWith(
      'adverts',
      expect.objectContaining({
        items: [
          expect.objectContaining({
            id: 'adv-stable-1',
            legalApproval: true,
            legalApprovalHash: approvedHash,
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
