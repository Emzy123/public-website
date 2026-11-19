import { closePostgresClient } from '../../src/lib/db';
import { closeMongoConnection } from '../../src/lib/db/mongodb';

export default async function globalTeardown() {
  await Promise.allSettled([
    closePostgresClient(),
    closeMongoConnection(),
  ]);
}
