import { NextRequest } from 'next/server';
import { getSession, AuthSession } from './session';
import { UserRole, hasAnyRole, isGlobalAdmin, canModerateChapter } from './roles';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class ForbiddenError extends Error {
  statusCode: number;
  constructor(message = 'Access forbidden: insufficient permissions', statusCode = 403) {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = statusCode;
  }
}

/**
 * Ensures user is authenticated via cookie session.
 */
export async function requireAuth(req?: NextRequest): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new AuthError('Authentication required. Please sign in.', 401);
  }
  return session;
}

/**
 * Ensures authenticated user holds at least one of the required roles.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  req?: NextRequest
): Promise<AuthSession> {
  const session = await requireAuth(req);
  if (!hasAnyRole(session.roles, allowedRoles)) {
    throw new ForbiddenError(
      `Forbidden: Requires one of [${allowedRoles.join(', ')}]. Current roles: [${session.roles.join(', ')}]`
    );
  }
  return session;
}

/**
 * Ensures user has admin role AND completed 2FA.
 */
export async function requireAdmin(req?: NextRequest): Promise<AuthSession> {
  const session = await requireAuth(req);
  if (!isGlobalAdmin(session.roles)) {
    throw new ForbiddenError('Administrator access required.');
  }

  if (!session.is2faAuthenticated) {
    throw new ForbiddenError('Two-factor authentication required for administrator access.');
  }

  return session;
}

/**
 * Ensures user is either a global admin or an appointed chapter lead for the specified chapter.
 */
export async function requireChapterLead(
  chapterId: string,
  req?: NextRequest
): Promise<AuthSession> {
  const session = await requireAuth(req);
  if (!canModerateChapter(session.roles, session.chapterIds, chapterId)) {
    throw new ForbiddenError('Chapter lead access required for this campus chapter.');
  }
  return session;
}

/**
 * Writes an administrative action into the PostgreSQL audit_log table.
 */
export async function writeAdminAudit(entry: {
  actorId?: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorId: entry.actorId || null,
      actorEmail: entry.actorEmail,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId || null,
      metadata: entry.metadata || null,
      ipAddress: entry.ipAddress || null,
    });
  } catch (error) {
    console.error('PostgreSQL audit log write error:', error);
  }
}
