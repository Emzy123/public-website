import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { sanitizeDatabaseError } from './sanitize-error';

const connectionString =
  process.env.DATABASE_URL?.trim() || 'postgresql://postgres@localhost:5432/sinet_dev';

const isLocal =
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1') ||
  !process.env.DATABASE_URL;

// Singleton client to avoid connection leak in development hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __postgresClient: postgres.Sql | undefined;
}

const client =
  global.__postgresClient ||
  postgres(connectionString, {
    prepare: false,
    max: process.env.NODE_ENV === 'production' ? 5 : 5,
    ssl: isLocal
      ? false
      : {
          rejectUnauthorized: true,
          ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT } : {}),
        },
    connect_timeout: 15,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__postgresClient = client;
}

export const db = drizzle(client, { schema });
export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

const POSTGRES_PING_TIMEOUT_MS = 2500;

export async function pingPostgres(): Promise<'ok' | 'degraded' | 'error'> {
  if (!isPostgresConfigured()) return 'degraded';
  try {
    await Promise.race([
      client`select 1`,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('postgres ping timeout')), POSTGRES_PING_TIMEOUT_MS);
      }),
    ]);
    return 'ok';
  } catch {
    // Never surface the driver message or connection string to callers.
    return 'error';
  }
}

export { client, schema, sanitizeDatabaseError };
