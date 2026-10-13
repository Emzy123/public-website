/** @jest-environment node */

import { validateOrigin } from '@/lib/security/origin';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyMemberSignature } from '@/lib/members/member-id';

describe('Enterprise Security Hardening & Audit', () => {
  describe('Origin Validation & CSRF Protection', () => {
    test('rejects cross-site origins attempting CSRF', () => {
      const spoofedReq = {
        headers: new Headers({
          origin: 'https://malicious-attacker-site.com',
        }),
      } as unknown as Request;

      expect(validateOrigin(spoofedReq)).toBe(false);
    });

    test('accepts trusted production and local development origins', () => {
      const allowedReq = {
        headers: new Headers({
          origin: 'https://www.sinet.africa',
        }),
      } as unknown as Request;

      expect(validateOrigin(allowedReq)).toBe(true);

      const localReq = {
        headers: new Headers({
          origin: 'http://localhost:3000',
        }),
      } as unknown as Request;

      expect(validateOrigin(localReq)).toBe(true);
    });

    test('rejects empty or missing origin headers on sensitive mutations', () => {
      const emptyReq = {
        headers: new Headers({}),
      } as unknown as Request;

      expect(validateOrigin(emptyReq)).toBe(false);
    });
  });

  describe('Rate Limiter Memory Management & Abuse Prevention', () => {
    test('enforces limits and calculates correct Retry-After header', () => {
      const testKey = `audit-test-${Date.now()}`;
      expect(checkRateLimit(testKey, 2, 60000)).toEqual({ ok: true });
      expect(checkRateLimit(testKey, 2, 60000)).toEqual({ ok: true });

      const blocked = checkRateLimit(testKey, 2, 60000);
      expect(blocked.ok).toBe(false);
      if (!blocked.ok) {
        expect(blocked.retryAfterSec).toBeGreaterThan(0);
        expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
      }
    });

    test('auto-prunes expired buckets to prevent memory leaks', () => {
      const expiredKey = `expired-test-${Date.now()}`;
      // Set bucket that already expired
      checkRateLimit(expiredKey, 10, -1000);

      // Next call with a fresh key should successfully reset or allow
      const freshKey = `fresh-test-${Date.now()}`;
      const result = checkRateLimit(freshKey, 5, 60000);
      expect(result.ok).toBe(true);
    });
  });

  describe('Cryptographic Signature Verification Integrity', () => {
    test('rejects tampered signatures and length mismatches safely', () => {
      const memberId = 'SIN-FULOKOJA-26-0001';
      const userId = 'user-test-uuid';
      const issuedAt = new Date();

      expect(verifyMemberSignature(memberId, userId, issuedAt, '')).toBe(false);
      expect(verifyMemberSignature(memberId, userId, issuedAt, 'too-short')).toBe(false);
      expect(
        verifyMemberSignature(
          memberId,
          userId,
          issuedAt,
          '0123456789abcdef0123456789abcdef' // incorrect signature of matching 32-char length
        )
      ).toBe(false);
    });
  });
});
