import { db, isLocalDatabaseHost, pingPostgres } from '../db';
import { seedMembersDatabase } from '../../../scripts/seed-members';

let seeded = false;

/**
 * Ensures the local PostgreSQL test database has the required seed fixtures
 * (universities, chapters, badges, campaigns).
 * Refuses to run against non-local databases.
 */
export async function ensurePostgresTestFixture(): Promise<{
  available: boolean;
  reason?: string;
}> {
  const url = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/sinet_dev';
  const host = (() => {
    try {
      return new URL(url).hostname || '<redacted>';
    } catch {
      return '<redacted>';
    }
  })();
  if (!isLocalDatabaseHost(url) || process.env.NODE_ENV === 'production') {
    throw new Error(
      `Refusing to seed test fixture: DATABASE_URL host (${host}) is not a recognized local development database or NODE_ENV is production.`
    );
  }

  // Ensure DATABASE_URL is set so client and isPostgresConfigured() know Postgres is configured
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url;
  }

  const status = await pingPostgres();
  if (status !== 'ok') {
    return {
      available: false,
      reason: `PostgreSQL is absent or unreachable on localhost:5432 (ping status: ${status}). Integration tests requiring Postgres will skip with this notice.`,
    };
  }

  if (!seeded) {
    await seedMembersDatabase();
    seeded = true;
  }

  return { available: true };
}
