import { Metadata } from 'next';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { AuditLogClient } from './AuditLogClient';

/**
 * Security Audit Log page.
 *
 * Route guard: handled entirely by middleware.ts which checks the admin JWT
 * (sinet_admin_session) and redirects to /admin/login?next=... when absent.
 * We must NOT call getSession() here — that reads the MEMBER cookie and would
 * incorrectly redirect authenticated admins to the public /sign-in page.
 */
export const metadata: Metadata = {
  title: 'Security Audit Log — Admin',
  description: 'Immutable record of administrative actions and review decisions.',
};

export default async function AdminAuditPage() {
  const rawLogs = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(100);

  const formattedLogs = rawLogs.map((log) => ({
    id: log.id,
    actorId: log.actorId,
    actorEmail: log.actorEmail,
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    metadata: (log.metadata as Record<string, unknown>) || null,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
  }));

  return <AuditLogClient initialLogs={formattedLogs} />;
}
