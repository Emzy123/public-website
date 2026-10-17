/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from './route';
import * as campaignsModule from '@/lib/applications/campaigns';
import * as mongodbModule from '@/lib/db/mongodb';
import * as registrationLinksModule from '@/lib/registration-links';
import * as chaptersModule from '@/lib/chapters/chapters';

jest.mock('@/lib/security/public-form', () => ({
  enforcePublicFormGuards: jest.fn().mockResolvedValue(null),
  isHoneypotTriggered: jest.fn().mockReturnValue(false),
}));

jest.mock('@/lib/security/csrf-handler', () => ({
  issueCsrfToken: jest.fn(),
  verifyCsrfToken: jest.fn(),
}));

jest.mock('@/lib/email/application-mail', () => ({
  sendApplicationReceivedEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('POST /api/join/[slug]/apply server-side role enforcement', () => {
  const validStaffBody = {
    role: 'staff',
    fullName: 'David Okon',
    email: 'david@sinet.africa',
    phone: '+2348012345678',
    location: 'Lagos, Nigeria',
    education: 'M.Sc Supply Chain',
    experienceYears: '3–5 years',
    skills: ['Operations', 'Logistics'],
    availability: ['Flexible / on-call'],
    emergencyContact: 'Mrs. Okon, +2348087654321',
    motivation: 'I want to bring my operational background to scale agricultural supply chains with SINet across Nigeria.',
    hearAbout: 'SINet website',
    documents: {
      resume: '507f1f77bcf86cd799439011',
      coverLetter: '507f1f77bcf86cd799439022',
    },
    codeOfConductAccepted: true,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects role="staff" when submitted to a public link without staff in allowedRoles', async () => {
    jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

    const mockPublicLink = {
      _id: 'link-mongo-001',
      slug: 'lagos-public-drive',
      name: 'Lagos Public Drive',
      roles: ['volunteer', 'community-member'], // No staff!
      isOpen: true,
    };

    const mockCollection = {
      findOne: jest.fn().mockResolvedValue(mockPublicLink),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'app-001' }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/join/lagos-public-drive/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validStaffBody),
    });

    const res = await POST(req, { params: { slug: 'lagos-public-drive' } });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('This role is not accepted through this link.');
  });

  it('accepts role="staff" when submitted to an admin-created link with roles: ["staff"]', async () => {
    jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

    const mockStaffLink = {
      _id: 'link-mongo-staff-002',
      slug: 'hq-staff-invite-only',
      name: 'HQ Operations Staff Onboarding',
      roles: ['staff'], // explicitly includes staff
      isOpen: true,
    };

    const mockCollection = {
      findOne: jest.fn().mockResolvedValue(mockStaffLink),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'app-staff-001' }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any);

    jest.spyOn(registrationLinksModule, 'tryReserveApplicationSlot').mockResolvedValue(mockStaffLink as any);

    const req = new NextRequest('http://localhost:3000/api/join/hq-staff-invite-only/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validStaffBody),
    });

    const res = await POST(req, { params: { slug: 'hq-staff-invite-only' } });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'staff',
        pathway: 'staff',
        status: 'pending',
      })
    );
  });

  it('rejects role="staff" when submitted to a PostgreSQL student campaign link', async () => {
    const mockPostgresCampaign = {
      campaign: {
        id: 'camp-pg-001',
        slug: 'student-network',
        name: 'Student Network Cohort',
        description: 'University campus members',
        targetRole: 'member', // targetRole is member, not staff
        isAccepting: true,
        status: 'active',
        applicationCount: 10,
      },
      isAccepting: true,
      seatsRemaining: 50,
    };

    jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(mockPostgresCampaign as any);

    const req = new NextRequest('http://localhost:3000/api/join/student-network/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validStaffBody),
    });

    const res = await POST(req, { params: { slug: 'student-network' } });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('This role is not accepted through this campaign link.');
  });

  it('persists validated chapter and division on MongoDB application and member records', async () => {
    jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

    const mockStaffLink = {
      _id: 'link-mongo-staff-003',
      slug: 'hq-staff-kogi',
      name: 'HQ Operations Kogi Staff',
      roles: ['staff'],
      isOpen: true,
    };

    const mockCollection = {
      findOne: jest.fn().mockResolvedValue(mockStaffLink),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'app-staff-003' }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any);

    jest.spyOn(registrationLinksModule, 'tryReserveApplicationSlot').mockResolvedValue(mockStaffLink as any);

    const req = new NextRequest('http://localhost:3000/api/join/hq-staff-kogi/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validStaffBody,
        chapter: 'fulokoja',
        division: 'finance',
      }),
    });

    const res = await POST(req, { params: { slug: 'hq-staff-kogi' } });
    expect(res.status).toBe(201);

    expect(mockCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        chapter: 'fulokoja',
        division: 'finance',
      })
    );
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { email: 'david@sinet.africa' },
      expect.objectContaining({
        $set: expect.objectContaining({
          chapter: 'fulokoja',
          division: 'finance',
        }),
      }),
      { upsert: true }
    );
  });

  it('drops unknown chapter slug and invalid division on MongoDB path', async () => {
    jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

    const mockStaffLink = {
      _id: 'link-mongo-staff-004',
      slug: 'hq-staff-anywhere',
      name: 'HQ Operations Anywhere',
      roles: ['staff'],
      isOpen: true,
    };

    const mockCollection = {
      findOne: jest.fn().mockResolvedValue(mockStaffLink),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'app-staff-004' }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any);

    jest.spyOn(registrationLinksModule, 'tryReserveApplicationSlot').mockResolvedValue(mockStaffLink as any);

    const req = new NextRequest('http://localhost:3000/api/join/hq-staff-anywhere/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validStaffBody,
        chapter: 'unknown-fake-chapter',
        division: 'crypto_arbitrage',
      }),
    });

    const res = await POST(req, { params: { slug: 'hq-staff-anywhere' } });
    expect(res.status).toBe(201);

    expect(mockCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        chapter: null,
        division: null,
      })
    );
  });

  it('rejects with retryable 503 error when chapter verification data sources are unreachable and chapter is supplied', async () => {
    jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);
    jest.spyOn(chaptersModule, 'validateChapterSlug').mockResolvedValue({
      valid: false,
      status: 'unreachable',
    });

    const mockStaffLink = {
      _id: 'link-mongo-staff-005',
      slug: 'hq-staff-anywhere',
      name: 'HQ Operations Anywhere',
      roles: ['staff'],
      isOpen: true,
    };

    const mockCollection = {
      findOne: jest.fn().mockResolvedValue(mockStaffLink),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'app-staff-005' }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any);

    jest.spyOn(registrationLinksModule, 'tryReserveApplicationSlot').mockResolvedValue(mockStaffLink as any);
    const releaseSpy = jest.spyOn(registrationLinksModule, 'releaseApplicationSlot').mockResolvedValue(true);

    const req = new NextRequest('http://localhost:3000/api/join/hq-staff-anywhere/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validStaffBody,
        chapter: 'unilag-engineering-chapter',
        division: 'finance',
      }),
    });

    const res = await POST(req, { params: { slug: 'hq-staff-anywhere' } });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.retryable).toBe(true);
    expect(json.error).toContain('Campus chapter verification is temporarily unavailable');

    // Crucially: no application is inserted with chapter: null and slot is released
    expect(mockCollection.insertOne).not.toHaveBeenCalled();
    expect(releaseSpy).toHaveBeenCalledWith(expect.anything(), 'hq-staff-anywhere');
  });

  it('persists chapter and division to submitCampaignApplication on Postgres campaign link', async () => {
    const mockPostgresCampaign = {
      campaign: {
        id: 'camp-pg-002',
        slug: 'student-network',
        name: 'Student Network Cohort',
        description: 'University campus members',
        targetRole: 'member',
        isAccepting: true,
        status: 'active',
        applicationCount: 10,
      },
      isAccepting: true,
      seatsRemaining: 50,
    };

    jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(mockPostgresCampaign as any);
    const submitSpy = jest.spyOn(campaignsModule, 'submitCampaignApplication').mockResolvedValue({
      applicationId: 'app-pg-123',
      campaignName: 'Student Network Cohort',
    });

    const validStudentPayload = {
      fullName: 'Amina Sani',
      email: 'amina.sani@fulokoja.edu.ng',
      phone: '+2348011223344',
      universityId: '550e8400-e29b-41d4-a716-446655440000',
      programme: 'B.Sc Economics',
      level: '300',
      division: 'student_finance',
      contributionPitch: 'I want to build a campus student investment club at FULOKOJA.',
      codeOfConductAccepted: true,
      chapter: 'fulokoja',
    };

    const req = new NextRequest('http://localhost:3000/api/join/student-network/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validStudentPayload),
    });

    const res = await POST(req, { params: { slug: 'student-network' } });
    expect(res.status).toBe(201);
    expect(submitSpy).toHaveBeenCalledWith(
      'student-network',
      expect.objectContaining({
        chapter: 'fulokoja',
        division: 'student_finance',
      })
    );
  });

  describe('Server-side Link & Campaign status enforcement (closed, expired, full rejection)', () => {
    it('rejects Mongo registration link when closed with 403', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockClosedLink = {
        _id: 'link-mongo-closed-1',
        slug: 'closed-drive',
        name: 'Closed Drive',
        roles: ['staff'],
        isOpen: false,
        status: 'closed',
      };

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(mockClosedLink),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/join/closed-drive/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validStaffBody),
      });

      const res = await POST(req, { params: { slug: 'closed-drive' } });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('closed');
      expect(data.status).toBe('Closed');
    });

    it('rejects Mongo registration link when expired with 410', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockExpiredLink = {
        _id: 'link-mongo-expired-1',
        slug: 'expired-drive',
        name: 'Expired Drive',
        roles: ['staff'],
        isOpen: true,
        status: 'open',
        expiresAt: '2026-10-01T00:00:00Z',
        quota: 100,
        applicationCount: 5,
      };

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(mockExpiredLink),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/join/expired-drive/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validStaffBody),
      });

      const res = await POST(req, { params: { slug: 'expired-drive' } });
      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.error).toContain('passed');
      expect(data.status).toBe('Expired');
    });

    it('rejects Mongo registration link when capacity is full with 409', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockFullLink = {
        _id: 'link-mongo-full-1',
        slug: 'full-drive',
        name: 'Full Drive',
        roles: ['staff'],
        isOpen: true,
        status: 'open',
        quota: 50,
        applicationCount: 50,
      };

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(mockFullLink),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/join/full-drive/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validStaffBody),
      });

      const res = await POST(req, { params: { slug: 'full-drive' } });
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain('capacity');
      expect(data.status).toBe('Full');
    });

    it('rejects Postgres campaign when closed with 403', async () => {
      const mockClosedCampaign = {
        campaign: {
          id: 'camp-pg-closed',
          slug: 'closed-cohort',
          name: 'Closed Cohort',
          targetRole: 'member',
          status: 'closed',
          applicationCount: 10,
        },
        isAccepting: false,
      };

      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(mockClosedCampaign as any);

      const req = new NextRequest('http://localhost:3000/api/join/closed-cohort/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Amina Sani',
          email: 'amina.sani@fulokoja.edu.ng',
          phone: '+2348011223344',
          universityId: '550e8400-e29b-41d4-a716-446655440000',
          programme: 'B.Sc Economics',
          level: '300',
          division: 'student_finance',
          contributionPitch: 'Investment club pitch.',
          codeOfConductAccepted: true,
        }),
      });

      const res = await POST(req, { params: { slug: 'closed-cohort' } });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.status).toBe('Closed');
    });

    it('rejects Postgres campaign when expired with 410', async () => {
      const mockExpiredCampaign = {
        campaign: {
          id: 'camp-pg-expired',
          slug: 'expired-cohort',
          name: 'Expired Cohort',
          targetRole: 'member',
          status: 'active',
          endsAt: new Date('2026-10-01T00:00:00Z'),
          applicationCount: 10,
        },
        isAccepting: false,
      };

      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(mockExpiredCampaign as any);

      const req = new NextRequest('http://localhost:3000/api/join/expired-cohort/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Amina Sani',
          email: 'amina.sani@fulokoja.edu.ng',
          phone: '+2348011223344',
          universityId: '550e8400-e29b-41d4-a716-446655440000',
          programme: 'B.Sc Economics',
          level: '300',
          division: 'student_finance',
          contributionPitch: 'Investment club pitch.',
          codeOfConductAccepted: true,
        }),
      });

      const res = await POST(req, { params: { slug: 'expired-cohort' } });
      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.status).toBe('Expired');
    });

    it('rejects Postgres campaign when full with 409', async () => {
      const mockFullCampaign = {
        campaign: {
          id: 'camp-pg-full',
          slug: 'full-cohort',
          name: 'Full Cohort',
          targetRole: 'member',
          status: 'active',
          seatLimit: 100,
          applicationCount: 100,
        },
        isAccepting: false,
      };

      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(mockFullCampaign as any);

      const req = new NextRequest('http://localhost:3000/api/join/full-cohort/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Amina Sani',
          email: 'amina.sani@fulokoja.edu.ng',
          phone: '+2348011223344',
          universityId: '550e8400-e29b-41d4-a716-446655440000',
          programme: 'B.Sc Economics',
          level: '300',
          division: 'student_finance',
          contributionPitch: 'Investment club pitch.',
          codeOfConductAccepted: true,
        }),
      });

      const res = await POST(req, { params: { slug: 'full-cohort' } });
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.status).toBe('Full');
    });

    it('rejects with 409 when concurrent submit race exhausts remaining slot on Mongo', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockOpenAtReadTime = {
        _id: 'link-mongo-race-1',
        slug: 'race-link',
        name: 'Race Link',
        roles: ['staff'],
        isOpen: true,
        status: 'open',
        quota: 10,
        applicationCount: 9, // looked open at read time
      };

      const mockFullAfterRace = {
        ...mockOpenAtReadTime,
        applicationCount: 10,
      };

      const mockCollection = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(mockOpenAtReadTime) // initial read
          .mockResolvedValueOnce(mockFullAfterRace), // re-read after race failure
      };

      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any);

      // tryReserveApplicationSlot fails atomically due to race
      jest.spyOn(registrationLinksModule, 'tryReserveApplicationSlot').mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/join/race-link/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validStaffBody),
      });

      const res = await POST(req, { params: { slug: 'race-link' } });
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.status).toBe('Full');
    });

    it('releases reserved slot with compensating decrement if application insertion fails', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockLink = {
        _id: 'link-mongo-fail-insert',
        slug: 'fail-insert-link',
        name: 'Fail Insert Link',
        roles: ['staff'],
        isOpen: true,
        status: 'open',
      };

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(mockLink),
        insertOne: jest.fn().mockRejectedValue(new Error('MongoWriteException: disk full')),
      };

      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any);

      jest.spyOn(registrationLinksModule, 'tryReserveApplicationSlot').mockResolvedValue(mockLink as any);
      const releaseSpy = jest.spyOn(registrationLinksModule, 'releaseApplicationSlot').mockResolvedValue(true);

      const req = new NextRequest('http://localhost:3000/api/join/fail-insert-link/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validStaffBody),
      });

      const res = await POST(req, { params: { slug: 'fail-insert-link' } });
      expect(res.status).toBe(503);
      expect(releaseSpy).toHaveBeenCalledWith(expect.anything(), 'fail-insert-link');
    });
  });
});
