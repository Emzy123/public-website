import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL?.trim() || 'postgresql://postgres@localhost:5432/sinet_dev';

// Singleton client to avoid connection leak in development hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __postgresClient: postgres.Sql | undefined;
}

const client =
  global.__postgresClient ||
  postgres(connectionString, {
    prepare: false,
    max: process.env.NODE_ENV === 'production' ? 10 : 5,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__postgresClient = client;
}

export const db = drizzle(client, { schema });
export { client, schema };
