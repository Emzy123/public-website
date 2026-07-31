import { getMongoDb } from '@/lib/db/mongodb';

export type AuditAction =
  | 'admin.login'
  | 'admin.login_failed'
  | 'admin.logout'
  | 'cms.draft_save'
  | 'cms.publish'
  | 'media.upload';

export type AuditEntry = {
  action: AuditAction;
  actor: string;
  resource?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
};

export async function writeAuditLog(entry: Omit<AuditEntry, 'createdAt'>): Promise<void> {
  try {
    const db = await getMongoDb();
    await db.collection('auditLogs').insertOne({
      ...entry,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}
