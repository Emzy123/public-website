import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { sanitizeDatabaseError } from './sanitize-error';

const connectionString =
  process.env.DATABASE_URL?.trim() || 'postgresql://postgres@localhost:5432/sinet_dev';

/**
 * Determines whether a database connection string points to a local development instance.
 * Must match only localhost, 127.0.0.1, ::1, and (in non-production only) docker-compose service
 * hostnames ('postgres'/'sinet-postgres'), as an exact hostname.
 * Non-local hosts (e.g. localhost.example.com, Neon, Supabase) return false.
 */
export function isLocalDatabaseHost(urlStr?: string): boolean {
  if (!urlStr?.trim()) return true;
  try {
    const rawHostname = new URL(urlStr).hostname.replace(/^\[|\]$/g, '').toLowerCase();
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
    if (process.env.NODE_ENV !== 'production') {
      localHosts.add('postgres');
      localHosts.add('sinet-postgres');
    }
    return localHosts.has(rawHostname);
  } catch {
    return false;
  }
}

export function createPostgresClient(
  url: string = process.env.DATABASE_URL?.trim() || 'postgresql://postgres@localhost:5432/sinet_dev',
  caCert: string | undefined = process.env.DATABASE_CA_CERT
): postgres.Sql {
  const isLocal = isLocalDatabaseHost(url);
  return postgres(url, {
    prepare: false,
    max: process.env.NODE_ENV === 'production' ? 5 : 5,
    ssl: isLocal
      ? false
      : {
          rejectUnauthorized: true,
          ...(caCert ? { ca: caCert } : {}),
        },
    connect_timeout: 15,
    idle_timeout: 20,
  });
}

// Singleton client to avoid connection leak in development hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __postgresClient: postgres.Sql | undefined;
}

const client = global.__postgresClient || createPostgresClient(connectionString);

if (process.env.NODE_ENV !== 'production') {
  global.__postgresClient = client;
}

export const db = drizzle(client, { schema });
export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function closePostgresClient(): Promise<void> {
  if (global.__postgresClient) {
    await global.__postgresClient.end({ timeout: 1 }).catch(() => {});
    global.__postgresClient = undefined;
  }
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
