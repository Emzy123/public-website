/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST as logoutPost } from './route';
import {
  MEMBER_SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
} from '@/lib/auth/session';
import { resetSessionRevocationForTests } from '@/lib/auth/session-revocation';

jest.mock('@/lib/security/origin', () => ({
  validateOrigin: () => true,
}));

function logoutRequest(token?: string) {
  const headers = new Headers({ origin: 'http://localhost:3000' });
  if (token) {
    headers.set('cookie', `${MEMBER_SESSION_COOKIE}=${token}`);
  }
  return new NextRequest('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    headers,
  });
}

describe('POST /api/auth/logout session revocation (A11)', () => {
  beforeEach(() => {
    resetSessionRevocationForTests();
  });

  it('clears the cookie and invalidates the JWT so subsequent verify fails', async () => {
    const token = await createSessionToken({
      userId: 'usr_logout_1',
      email: 'member@sinet.africa',
      roles: ['member'],
      chapterIds: [],
      is2faAuthenticated: false,
    });

    expect(await verifySessionToken(token)).not.toBeNull();

    const res = await logoutPost(logoutRequest(token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const setCookie = res.cookies.get(MEMBER_SESSION_COOKIE);
    expect(setCookie?.value).toBe('');

    expect(await verifySessionToken(token)).toBeNull();
  });

  it('succeeds when no session cookie is present', async () => {
    const res = await logoutPost(logoutRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
