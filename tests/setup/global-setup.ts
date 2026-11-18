import { ensurePostgresTestFixture } from '../../src/lib/test-utils/postgres-test-fixture';

export default async function globalSetup() {
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

