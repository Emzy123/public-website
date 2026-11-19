import { getMongoDb } from '@/lib/db/mongodb';

export type AuditAction =
  | 'admin.login'
  | 'admin.login_failed'
  | 'admin.logout'
  | 'admin.provision_super_admin'
  | 'cms.draft_save'
  | 'cms.publish'
  | 'media.upload'
  | 'application.status_update'
  | 'application.custom_email'
  | 'application.export'
  | 'submissions.export'
  | 'submissions.read_status_update'
  | 'submissions.mark_test'
  | 'registration_link.create'
  | 'registration_link.update'
  | 'auth.otp_failed'
  | 'cms.advert_legal_approval'
  | 'cms.advert_legal_approval_revoked';

export type AuditEntry = {
  action: AuditAction;
  actor: string;
  resource?: string;
  metadata?: Record<string, unknown>;
  previousValue?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
};

const SENSITIVE_METADATA_KEYS = new Set([
  'otp',
  'code',
  'token',
  'magic',
  'magicLink',
  'url',
  'password',
  'secret',
  'totp',
]);

function scrubAuditMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!metadata) return metadata;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_METADATA_KEYS.has(key) || /otp|token|secret|password/i.test(key)) {
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

export async function writeAuditLog(entry: Omit<AuditEntry, 'createdAt'>): Promise<void> {
  try {
    const db = await getMongoDb();
    await db.collection('auditLogs').insertOne({
      ...entry,
      metadata: scrubAuditMetadata(entry.metadata),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}
