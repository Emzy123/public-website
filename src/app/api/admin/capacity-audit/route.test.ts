/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from './route';
import * as capacityAuditModule from '@/lib/applications/capacity-audit';

describe('GET /api/admin/capacity-audit route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      HEALTH_CHECK_TOKEN: 'valid-test-health-token-12345',
      ADMIN_EMAIL: 'admin@sinet.africa',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects with 401 when x-health-token header is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/capacity-audit', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('rejects with 401 when token is passed as query string ?token=... (query tokens disallowed)', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/admin/capacity-audit?token=valid-test-health-token-12345',
      {
        method: 'GET',
        headers: {
          'x-health-token': 'valid-test-health-token-12345', // Even if header is also passed
        },
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('rejects with 401 when x-health-token is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/capacity-audit', {
      method: 'GET',
      headers: {
        'x-health-token': 'wrong-token',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 with countDrift and zeroLimits when x-health-token is valid, containing no personal data', async () => {
    const mockAuditResult = {
      countDrift: [
        {
          store: 'MongoDB' as const,
          id: 'link-123',
          slug: 'test-link',
          name: 'Test Link',
          recordedCount: 10,
          actualCount: 12,
          drift: 2,
        },
      ],
      zeroLimits: [
        {
          store: 'PostgreSQL' as const,
          slug: 'zero-cohort',
          name: 'Zero Cohort',
          status: 'active',
          field: 'seat_limit',
          value: 0,
          note: 'Treated as unlimited',
        },
      ],
      summary: {
        mongoLinksScanned: 5,
        postgresCampaignsScanned: 2,
        mismatchCount: 1,
        zeroLimitCount: 1,
        mongoConnected: true,
        postgresConnected: true,
      },
    };

    const spy = jest
      .spyOn(capacityAuditModule, 'performCapacityAudit')
      .mockResolvedValue(mockAuditResult);

    const req = new NextRequest('http://localhost:3000/api/admin/capacity-audit', {
      method: 'GET',
      headers: {
        'x-health-token': 'valid-test-health-token-12345',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    const data = await res.json();
    expect(data.countDrift).toEqual(mockAuditResult.countDrift);
    expect(data.zeroLimits).toEqual(mockAuditResult.zeroLimits);
    expect(data.summary).toEqual(mockAuditResult.summary);

    // Guaranteed read-only: performCapacityAudit was called with apply: false
    expect(spy).toHaveBeenCalledWith({ apply: false });

    // Personal data safety check
    const rawString = JSON.stringify(data);
    expect(rawString).not.toContain('@test.edu.ng');
    expect(rawString).not.toContain('fullName');
    expect(rawString).not.toContain('phone');
    expect(rawString).not.toContain('pitch');
  });
});
