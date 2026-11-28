/** @jest-environment node */

import { GET } from './route';
import { db } from '@/lib/db';
import { getMongoDb } from '@/lib/db/mongodb';
import * as sessionModule from '@/lib/auth/session';

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
  },
  isPostgresConfigured: jest.fn().mockReturnValue(true),
  sanitizeDatabaseError: jest.fn().mockReturnValue('connection refused'),
}));

jest.mock('@/lib/db/mongodb', () => ({
  getMongoDb: jest.fn(),
}));

describe('GET /api/auth/me resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not 500 when Postgres is down, falling back to verified JWT claims and Mongo with degraded: true', async () => {
    // Verified session from JWT
    jest.spyOn(sessionModule, 'getSession').mockResolvedValue({
      userId: 'user-123',
      email: 'member@sinet.africa',
      phone: '+2348012345678',
      roles: ['member'],
      chapterIds: ['fulokoja'],
      is2faAuthenticated: true,
      lastActive: Date.now(),
    });

    // Postgres is down
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    // Mongo has member profile
    const mockFindOne = jest.fn().mockResolvedValue({
      _id: 'mongo-id-123',
      fullName: 'Sinet Test Member',
      email: 'member@sinet.africa',
      pathway: 'student_finance',
      status: 'active',
    });
    (getMongoDb as jest.Mock).mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: mockFindOne,
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.user.id).toBe('user-123');
    expect(body.user.email).toBe('member@sinet.africa');
    expect(body.user.profile).not.toBeNull();
    expect(body.user.profile.fullName).toBe('Sinet Test Member');
  });

  it('ensures roles and chapterIds in degraded response come only from verified JWT, never from Mongo document', async () => {
    // Verified session from JWT carrying strictly member role and specific chapterId
    jest.spyOn(sessionModule, 'getSession').mockResolvedValue({
      userId: 'user-456',
      email: 'fallback-member@sinet.africa',
      phone: null,
      roles: ['member'],
      chapterIds: [],
      is2faAuthenticated: false,
      lastActive: Date.now(),
    });

    // Postgres is down
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    // Mongo document carries elevated admin role / pathway / permissions
    const mockFindOne = jest.fn().mockResolvedValue({
      _id: 'mongo-id-456',
      fullName: 'Elevated Mongo User',
      email: 'fallback-member@sinet.africa',
      role: 'super_admin',
      roles: ['super_admin', 'admin', 'chapter_lead'],
      chapterIds: ['unauthorized-chapter-access'],
      pathway: 'super_admin',
      status: 'active',
    });
    (getMongoDb as jest.Mock).mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: mockFindOne,
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.degraded).toBe(true);

    // Roles and chapterIds must reflect verified JWT ONLY
    expect(body.user.roles).toEqual(['member']);
    expect(body.user.roles).not.toContain('super_admin');
    expect(body.user.roles).not.toContain('admin');
    expect(body.user.roles).not.toContain('chapter_lead');
    expect(body.user.chapterIds).toEqual([]);
    expect(body.user.chapterIds).not.toContain('unauthorized-chapter-access');
  });

  it('includes NO signature, verificationUrl, or qrDataUrl when Postgres / getMemberCredential fails (degraded mode)', async () => {
    jest.spyOn(sessionModule, 'getSession').mockResolvedValue({
      userId: 'user-789',
      email: 'degraded-member@sinet.africa',
      phone: null,
      roles: ['member'],
      chapterIds: ['fulokoja'],
      is2faAuthenticated: true,
      lastActive: Date.now(),
    });

    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('ETIMEDOUT');
    });
    (getMongoDb as jest.Mock).mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
          _id: 'mongo-id-789',
          fullName: 'Degraded Active Mongo Member',
          email: 'degraded-member@sinet.africa',
          status: 'active',
        }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);

    const raw = await res.text();
    const body = JSON.parse(raw);

    expect(body.authenticated).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.user.roles).toEqual(['member']);
    expect(body.user.chapterIds).toEqual(['fulokoja']);
    expect(body.user.memberId).toBeNull();
    expect(body.user.memberCard).toBeNull();
    expect(raw).not.toContain('signature');
    expect(raw).not.toContain('verificationUrl');
    expect(raw).not.toContain('qrDataUrl');
  });
});
