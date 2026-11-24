/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from './route';
import * as campaignsModule from '@/lib/applications/campaigns';
import * as mongodbModule from '@/lib/db/mongodb';

jest.mock('@/lib/csrf', () => ({
  csrfProtect: jest.fn().mockResolvedValue(undefined),
}));

describe('GET /api/join/[slug] - Single Source of Truth for Link Status', () => {
  const baseNow = new Date('2026-10-16T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(baseNow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Direction 1: Closed / Inactive Links Return accepting: false', () => {
    it('returns accepting: false and status: "Closed" when link 3fac46517ba6 is closed in MongoDB (isOpen: false)', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockMongoLink = {
        _id: 'mongo-id-123',
        slug: '3fac46517ba6',
        name: 'Sinetworking Global Application 2026',
        roles: ['community-member'],
        isOpen: false,
        status: 'closed',
        quota: 100,
        applicationCount: 15,
        expiresAt: '2026-11-01T00:00:00Z',
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockMongoLink),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
        }),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue(mockDb as any);

      const req = new NextRequest('http://localhost:3000/api/join/3fac46517ba6');
      const res = await GET(req, { params: Promise.resolve({ slug: '3fac46517ba6' }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.link).toBeDefined();
      expect(json.link.slug).toBe('3fac46517ba6');
      expect(json.link.accepting).toBe(false);
      expect(json.link.status).toBe('Closed');
    });

    it('returns accepting: false and status: "Full" when MongoDB link quota is reached', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockMongoLink = {
        _id: 'mongo-id-full',
        slug: 'quota-full-slug',
        name: 'Limited Cohort',
        roles: ['volunteer'],
        isOpen: true,
        status: 'open',
        quota: 50,
        applicationCount: 50,
        expiresAt: '2026-11-01T00:00:00Z',
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockMongoLink),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        }),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue(mockDb as any);

      const req = new NextRequest('http://localhost:3000/api/join/quota-full-slug');
      const res = await GET(req, { params: Promise.resolve({ slug: 'quota-full-slug' }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.link.accepting).toBe(false);
      expect(json.link.status).toBe('Full');
    });

    it('returns accepting: false and status: "Expired" when MongoDB link deadline has passed', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockMongoLink = {
        _id: 'mongo-id-expired',
        slug: 'past-deadline',
        name: 'Summer Drive',
        roles: ['volunteer'],
        isOpen: true,
        status: 'open',
        quota: 100,
        applicationCount: 10,
        expiresAt: '2026-10-15T23:59:59.999+01:00', // expired yesterday
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockMongoLink),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        }),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue(mockDb as any);

      const req = new NextRequest('http://localhost:3000/api/join/past-deadline');
      const res = await GET(req, { params: Promise.resolve({ slug: 'past-deadline' }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.link.accepting).toBe(false);
      expect(json.link.status).toBe('Expired');
    });

    it('returns accepting: false and status: "Closed" when Postgres campaign is officially closed', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue({
        campaign: {
          id: 'pg-closed-id',
          name: 'Closed Finance Analysts',
          slug: 'finance-analysts-closed',
          description: 'Closed cohort',
          targetRole: 'member',
          startsAt: null,
          endsAt: null,
          seatLimit: 25,
          applicationCount: 10,
          status: 'closed',
          createdBy: 'admin-uuid',
          createdAt: baseNow,
          updatedAt: baseNow,
        },
        isAccepting: false,
        statusReason: 'This campaign application window has officially closed.',
        seatsRemaining: 15,
        displayStatus: 'Closed',
      });

      const req = new NextRequest('http://localhost:3000/api/join/finance-analysts-closed');
      const res = await GET(req, { params: Promise.resolve({ slug: 'finance-analysts-closed' }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.campaign.isAccepting).toBe(false);
      expect(json.link.accepting).toBe(false);
      expect(json.link.status).toBe('Closed');
    });

    it('returns accepting: false and status: "Full" when Postgres campaign seat limit is full', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue({
        campaign: {
          id: 'pg-full-id',
          name: 'Full Ambassadors',
          slug: 'ambassadors-full',
          description: null,
          targetRole: 'chapter_lead',
          startsAt: null,
          endsAt: null,
          seatLimit: 50,
          applicationCount: 50,
          status: 'active',
          createdBy: null,
          createdAt: baseNow,
          updatedAt: baseNow,
        },
        isAccepting: false,
        statusReason: 'Capacity limit reached for this cohort.',
        seatsRemaining: 0,
        displayStatus: 'Full',
      });

      const req = new NextRequest('http://localhost:3000/api/join/ambassadors-full');
      const res = await GET(req, { params: Promise.resolve({ slug: 'ambassadors-full' }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.campaign.isAccepting).toBe(false);
      expect(json.link.accepting).toBe(false);
      expect(json.link.status).toBe('Full');
    });
  });

  describe('Direction 2: Open / Active Links Return accepting: true', () => {
    it('returns accepting: true and status: "Open" when link 3fac46517ba6 is active in MongoDB', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockMongoLink = {
        _id: 'mongo-id-active',
        slug: '3fac46517ba6',
        name: 'Sinetworking Global Application 2026',
        roles: ['community-member', 'volunteer'],
        isOpen: true,
        status: 'open',
        quota: 200,
        applicationCount: 42,
        expiresAt: '2026-11-15T00:00:00Z',
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockMongoLink),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
        }),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue(mockDb as any);

      const req = new NextRequest('http://localhost:3000/api/join/3fac46517ba6');
      const res = await GET(req, { params: Promise.resolve({ slug: '3fac46517ba6' }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.link).toBeDefined();
      expect(json.link.slug).toBe('3fac46517ba6');
      expect(json.link.accepting).toBe(true);
      expect(json.link.status).toBe('Open');
      expect(json.link.roles).toEqual(['community-member', 'volunteer']);
    });

    it('returns accepting: true and status: "Open" for evergreen MongoDB links with no quota or deadline', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockEvergreen = {
        _id: 'mongo-id-evergreen',
        slug: 'evergreen-intake',
        name: 'General Member Intake',
        roles: ['community-member'],
        isOpen: true,
        status: 'open',
        quota: null,
        applicationCount: 1520,
        expiresAt: null,
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockEvergreen),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
        }),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue(mockDb as any);

      const req = new NextRequest('http://localhost:3000/api/join/evergreen-intake');
      const res = await GET(req, { params: Promise.resolve({ slug: 'evergreen-intake' }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.link.accepting).toBe(true);
      expect(json.link.status).toBe('Open');
    });

    it('returns accepting: true and status: "Open" for active Postgres campaign', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue({
        campaign: {
          id: 'pg-active-id',
          name: 'Student Enterprise Innovation Fellows',
          slug: 'student-enterprise-fellows',
          description: 'Fellowship cohort',
          targetRole: 'member',
          startsAt: null,
          endsAt: new Date('2026-12-01T00:00:00Z'),
          seatLimit: 30,
          applicationCount: 12,
          status: 'active',
          createdBy: 'creator-uuid',
          createdAt: baseNow,
          updatedAt: baseNow,
        },
        isAccepting: true,
        seatsRemaining: 18,
        displayStatus: 'Open',
      });

      const req = new NextRequest('http://localhost:3000/api/join/student-enterprise-fellows');
      const res = await GET(req, { params: Promise.resolve({ slug: 'student-enterprise-fellows' }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.campaign.isAccepting).toBe(true);
      expect(json.link.accepting).toBe(true);
      expect(json.link.status).toBe('Open');
      expect(json.campaign.seatsRemaining).toBe(18);
    });

    it('handles case-insensitivity on slug lookup seamlessly', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockLink = {
        _id: 'mongo-case-id',
        slug: '3fac46517ba6',
        name: 'Case Test',
        roles: ['community-member'],
        isOpen: true,
        status: 'open',
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation((query) => {
            // Validate the query allows case-insensitive match
            if (query.$or) {
              const matches = query.$or.some((clause: any) => {
                if (clause.slug === '3FAC46517BA6') return false;
                if (clause.slug?.$regex && clause.slug.$regex.test('3fac46517ba6')) return true;
                return false;
              });
              if (matches) return Promise.resolve(mockLink);
            }
            return Promise.resolve(null);
          }),
        }),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue(mockDb as any);

      const req = new NextRequest('http://localhost:3000/api/join/3FAC46517BA6');
      const res = await GET(req, { params: Promise.resolve({ slug: '3FAC46517BA6' }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.link.accepting).toBe(true);
      expect(json.link.status).toBe('Open');
    });

    it('returns 404 when slug does not exist in Postgres or Mongo', async () => {
      jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(null);

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };
      jest.spyOn(mongodbModule, 'getMongoDb').mockResolvedValue(mockDb as any);

      const req = new NextRequest('http://localhost:3000/api/join/non-existent-campaign');
      const res = await GET(req, { params: Promise.resolve({ slug: 'non-existent-campaign' }) });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Registration campaign not found');
    });
  });
});
