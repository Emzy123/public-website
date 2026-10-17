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
});
