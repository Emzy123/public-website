/**
 * Server-side member session revocation (A11).
 *
 * Logout must invalidate the JWT, not only clear the browser cookie.
 * Strategy:
 * 1. Every member JWT carries a unique `jti`.
 * 2. On logout, the jti is added to a denylist (process memory + optional Postgres `sessions` delete).
 * 3. verifySessionToken rejects denylisted jtis (fail closed for revoked tokens).
 *
 * Memory denylist is authoritative within a process (tests + single-instance).
 * Postgres `sessions` rows are best-effort registration for multi-instance ops;
 * when Postgres is unreachable, cookie clear + memory denylist still apply on this instance.
 */

import crypto from 'crypto';
import { db, isPostgresConfigured, sanitizeDatabaseError } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SESSION_MAX_AGE } from './session';

type DenylistEntry = { expiresAtMs: number };

/** Process-local denylist of revoked JWT ids. */
const revokedJtis = new Map<string, DenylistEntry>();

function pruneDenylist(now = Date.now()) {
  if (revokedJtis.size <= 500) return;
  Array.from(revokedJtis.entries()).forEach(([jti, entry]) => {
    if (entry.expiresAtMs <= now) revokedJtis.delete(jti);
  });
}

export function hashSessionToken(jti: string): string {
  return crypto.createHash('sha256').update(jti).digest('hex');
}

export function generateSessionJti(): string {
  return crypto.randomUUID();
}

export function revokeSessionJti(jti: string, expiresAtMs?: number): void {
  const exp = expiresAtMs ?? Date.now() + SESSION_MAX_AGE * 1000;
  revokedJtis.set(jti, { expiresAtMs: exp });
  pruneDenylist();
}

export function isSessionJtiRevoked(jti: string | undefined | null): boolean {
  if (!jti) return false;
  const entry = revokedJtis.get(jti);
  if (!entry) return false;
  if (entry.expiresAtMs <= Date.now()) {
    revokedJtis.delete(jti);
    return false;
  }
  return true;
}

/** Test helper — clears in-memory denylist. */
export function resetSessionRevocationForTests(): void {
  revokedJtis.clear();
}

export async function registerMemberSession(params: {
  userId: string;
  jti: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt?: Date;
}): Promise<void> {
  if (!isPostgresConfigured()) return;
  // Skip non-UUID user ids (Mongo fallback / degraded JWT subjects).
  if (!/^[0-9a-f-]{36}$/i.test(params.userId)) return;

  const expiresAt = params.expiresAt ?? new Date(Date.now() + SESSION_MAX_AGE * 1000);
  try {
    await db.insert(sessions).values({
      userId: params.userId,
      sessionTokenHash: hashSessionToken(params.jti),
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      expiresAt,
    });
  } catch (err) {
    console.warn('[Session] Failed to register session row:', sanitizeDatabaseError(err));
  }
}

export async function revokeMemberSession(params: {
  userId?: string | null;
  jti: string;
  expiresAtMs?: number;
}): Promise<void> {
  revokeSessionJti(params.jti, params.expiresAtMs);

  if (!isPostgresConfigured()) return;
  try {
    await db.delete(sessions).where(eq(sessions.sessionTokenHash, hashSessionToken(params.jti)));
  } catch (err) {
    console.warn('[Session] Failed to delete session row on logout:', sanitizeDatabaseError(err));
  }
}
