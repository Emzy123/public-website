import { isLocalDatabaseHost } from '../../src/lib/db';
import { ensurePostgresTestFixture } from '../../src/lib/test-utils/postgres-test-fixture';

export default async function globalSetup() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/sinet_dev';
  const host = (() => {
    try {
      return new URL(url).hostname || '<redacted>';
    } catch {
      return '<redacted>';
    }
  })();
  if (!isLocalDatabaseHost(url) || process.env.NODE_ENV === 'production') {
    console.warn(
      `\n[Jest globalSetup] Refusing to run test fixture setup: DATABASE_URL host (${host}) is not a recognized local development database or NODE_ENV is production.\n`
    );
    process.env.POSTGRES_TEST_DB_AVAILABLE = '0';
    return;
  }

  const result = await ensurePostgresTestFixture().catch((err) => ({
    available: false,
    reason: err instanceof Error ? err.message : String(err),
  }));

  if (!result.available) {
    console.warn(`\n[Jest globalSetup] ${result.reason}\n`);
    process.env.POSTGRES_TEST_DB_AVAILABLE = '0';
  } else {
    process.env.POSTGRES_TEST_DB_AVAILABLE = '1';
  }
}

