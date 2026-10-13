/**
 * @jest-environment node
 */
import {
  createSessionToken,
  verifySessionToken,
  IDLE_TIMEOUT,
  SESSION_MAX_AGE,
  type AuthSession,
} from './session';

describe('Auth Session Management (JOSE JWT)', () => {
  const mockUser: Omit<AuthSession, 'lastActive'> = {
    userId: 'usr_abc123',
    email: 'student@fulokoja.edu.ng',
    phone: '+2348012345678',
    roles: ['member'],
    chapterIds: ['fulokoja_chap'],
    is2faAuthenticated: false,
  };

  it('creates and verifies a valid JWT session token', async () => {
    const token = await createSessionToken(mockUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(mockUser.userId);
    expect(verified?.email).toBe(mockUser.email);
    expect(verified?.phone).toBe(mockUser.phone);
    expect(verified?.roles).toEqual(['member']);
    expect(verified?.chapterIds).toEqual(['fulokoja_chap']);
    expect(verified?.is2faAuthenticated).toBe(false);
    expect(verified?.lastActive).toBeGreaterThan(0);
  });

  it('preserves 2FA authentication state in the session', async () => {
    const adminUser: Omit<AuthSession, 'lastActive'> = {
      userId: 'admin_xyz',
      email: 'admin@sinet.africa',
      roles: ['admin'],
      chapterIds: [],
      is2faAuthenticated: true,
    };

    const token = await createSessionToken(adminUser);
    const verified = await verifySessionToken(token);
    expect(verified?.is2faAuthenticated).toBe(true);
    expect(verified?.roles).toEqual(['admin']);
  });

  it('returns null for an invalid or tampered token', async () => {
    const token = await createSessionToken(mockUser);
    const tampered = token.slice(0, -6) + 'abcdef';

    const result = await verifySessionToken(tampered);
    expect(result).toBeNull();
  });

  it('returns null for arbitrary malformed string', async () => {
    const result = await verifySessionToken('not-a-token');
    expect(result).toBeNull();
  });
});
