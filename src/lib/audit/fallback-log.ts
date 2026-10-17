export type FallbackRecordType = 'user' | 'verification_token' | 'application' | 'post';

export interface FallbackAuditEvent {
  event: 'postgres_fallback_write';
  type: FallbackRecordType;
  id: string;
  timestamp: string;
}

/**
 * Emits a structured audit log event whenever a write falls back to MongoDB
 * while PostgreSQL is unreachable.
 *
 * Strict privacy rule: Never include PII (names, emails, phone numbers) or
 * secrets (passwords, tokens, OTP codes, connection strings) in the event payload.
 */
export async function logPostgresFallbackWrite(
  type: FallbackRecordType,
  id: string
): Promise<FallbackAuditEvent> {
  const event: FallbackAuditEvent = {
    event: 'postgres_fallback_write',
    type,
    id,
    timestamp: new Date().toISOString(),
  };

  // 1. Structured JSON output for centralized log aggregators (e.g. Datadog, CloudWatch, Vercel)
  console.info(JSON.stringify(event));

  // 2. Structured MongoDB persistence for queryable reconciliation batches
  try {
    const { getMongoDb } = await import('@/lib/db/mongodb');
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('fallbackAuditLogs').insertOne({
        ...event,
        createdAt: new Date(),
      });
    }
  } catch (err) {
    console.warn('[FallbackAudit] Failed to insert fallback audit event to MongoDB:', err);
  }

  return event;
}
