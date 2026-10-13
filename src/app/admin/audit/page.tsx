import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isGlobalAdmin } from '@/lib/auth/roles';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { AuditLogClient } from './AuditLogClient';

export const metadata: Metadata = {
  title: 'Institutional Audit Log — Admin Panel',
  description: 'Cryptographic immutable record of administrative actions and review decisions.',
};

export default async function AdminAuditPage() {
  const session = await getSession();
  if (!session || !isGlobalAdmin(session.roles)) {
    redirect('/sign-in');
  }

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
