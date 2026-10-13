/** @jest-environment node */

import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { createSession } from '@admin/lib/auth';
import { createSessionToken } from '@/lib/auth/session';

describe('Admin Route Guards & Middleware Security', () => {
  beforeAll(() => {
    process.env.ADMIN_SESSION_SECRET = 'test-admin-secret-at-least-32-chars-long-12345';
    process.env.AUTH_SECRET = 'test-auth-secret-at-least-32-chars-long-12345';
  });
  it('Signed out: visiting /admin/audit redirects to /admin/login?next=%2Fadmin%2Faudit, never to /sign-in', async () => {
    const req = new NextRequest('http://localhost:3000/admin/audit');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location') || '';
    expect(location).toContain('/admin/login?next=%2Fadmin%2Faudit');
    expect(location).not.toContain('/sign-in');
  });

  it('Signed in as admin: access is granted (no redirect to login)', async () => {
    const adminToken = await createSession('admin@sinet.africa');
    const req = new NextRequest('http://localhost:3000/admin/audit', {
      headers: {
        cookie: `sinet_admin_session=${adminToken}`,
      },
    });

    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('Signed in as a member (not an admin): access is denied and redirected to /admin/login', async () => {
    const memberToken = await createSessionToken({
      userId: 'usr-12345',
      email: 'student@fulokoja.edu.ng',
      roles: ['member'],
      chapterIds: ['chapter-1'],
      is2faAuthenticated: false,
    });

    const req = new NextRequest('http://localhost:3000/admin/audit', {
      headers: {
        cookie: `sinet_member_session=${memberToken}`,
      },
    });

    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location') || '';
    expect(location).toContain('/admin/login?next=%2Fadmin%2Faudit');
    expect(location).not.toContain('/sign-in');
  });

  it('/api/admin/submissions/mark-test returns 401 Unauthorized without admin session', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/submissions/mark-test', {
      method: 'POST',
    });

    const res = await middleware(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });
});
