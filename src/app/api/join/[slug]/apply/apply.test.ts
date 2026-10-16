/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from './route';
import * as campaignsModule from '@/lib/applications/campaigns';
import * as mongodbModule from '@/lib/db/mongodb';
import * as registrationLinksModule from '@/lib/registration-links';

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
});
