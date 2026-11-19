/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from './[id]/route';
import { POST } from './[id]/review/route';
import { db } from '@/lib/db';
import * as guardsModule from '@/lib/auth/guards';

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
  },
  isPostgresConfigured: jest.fn().mockReturnValue(true),
  sanitizeDatabaseError: jest.fn().mockReturnValue('connection refused'),
}));

jest.mock('@/lib/db/mongodb', () => ({
  getMongoDb: jest.fn().mockResolvedValue({
    collection: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null),
    }),
  }),
}));

describe('Admin applications Postgres outage resilience', () => {
  const uuidId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(guardsModule, 'requireRole').mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@sinet.africa',
      roles: ['super_admin'],
      chapterIds: [],
      is2faAuthenticated: true,
      lastActive: Date.now(),
    });
  });

  it('GET /api/admin/applications/[id] returns 503 with database_unavailable when Postgres is down for UUID application', async () => {
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    const req = new NextRequest(`http://localhost:3000/api/admin/applications/${uuidId}`);
    const res = await GET(req, { params: { id: uuidId } });

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('database_unavailable');
  });

  it('POST /api/admin/applications/[id]/review returns 503 with database_unavailable when Postgres is down for UUID application', async () => {
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    const req = new NextRequest(`http://localhost:3000/api/admin/applications/${uuidId}/review`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        decision: 'approve',
        remarks: 'Approved for onboarding',
      }),
    });

    const res = await POST(req, { params: { id: uuidId } });

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('database_unavailable');
  });

  it('POST /api/admin/applications/[id]/review returns 503 with database_unavailable when Postgres is down for Mongo ObjectId application', async () => {
    const mongoId = '507f1f77bcf86cd799439011';
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    const req = new NextRequest(`http://localhost:3000/api/admin/applications/${mongoId}/review`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        decision: 'approve',
        remarks: 'Approved for onboarding',
      }),
    });

    const res = await POST(req, { params: { id: mongoId } });

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('database_unavailable');
  });
});
