import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

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
    ssl: isLocal ? false : { rejectUnauthorized: false },
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
export { client, schema };
