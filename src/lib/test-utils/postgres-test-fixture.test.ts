/** @jest-environment node */

import { ensurePostgresTestFixture } from './postgres-test-fixture';
import { seedMembersDatabase } from '../../../scripts/seed-members';

describe('Seed and Test Fixture Safety Guards', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('ensurePostgresTestFixture safety guard', () => {
    it('refuses to seed against Neon serverless Postgres URL', async () => {
      process.env.DATABASE_URL =
        'postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb?sslmode=require';
      (process.env as any).NODE_ENV = 'test';

      await expect(ensurePostgresTestFixture()).rejects.toThrow(
        /Refusing to seed test fixture: DATABASE_URL host \(ep-cool-proj\.us-east-2\.aws\.neon\.tech\) is not a recognized local development database/
      );
    });

    it('refuses to seed against URL with credentials and redacts user and password from refusal message', async () => {
      process.env.DATABASE_URL = 'postgresql://user:SECRETPW@ep-x.neon.tech/db?sslmode=require';
      (process.env as any).NODE_ENV = 'test';

      let caughtErr: Error | undefined;
      try {
        await ensurePostgresTestFixture();
      } catch (err) {
        caughtErr = err as Error;
      }

      expect(caughtErr).toBeDefined();
      expect(caughtErr!.message).toMatch(/ep-x\.neon\.tech/);
      expect(caughtErr!.message).not.toContain('SECRETPW');
      expect(caughtErr!.message).not.toContain('user:');
    });

    it('refuses to seed against Supabase connection pooler URL', async () => {
      process.env.DATABASE_URL =
        'postgresql://user:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';
      (process.env as any).NODE_ENV = 'test';

      await expect(ensurePostgresTestFixture()).rejects.toThrow(
        /Refusing to seed test fixture: DATABASE_URL host \(aws-0-us-east-1\.pooler\.supabase\.com\) is not a recognized local development database/
      );
    });

    it('refuses to seed when NODE_ENV is production, even with localhost', async () => {
      process.env.DATABASE_URL = 'postgresql://postgres@localhost:5432/sinet_dev';
      (process.env as any).NODE_ENV = 'production';

      await expect(ensurePostgresTestFixture()).rejects.toThrow(
        /Refusing to seed test fixture: DATABASE_URL host \(localhost\) is not a recognized local development database or NODE_ENV is production/
      );
    });
  });

  describe('seedMembersDatabase safety guard', () => {
    it('refuses to seed against Neon serverless Postgres URL', async () => {
      process.env.DATABASE_URL =
        'postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb?sslmode=require';
      (process.env as any).NODE_ENV = 'development';

      await expect(seedMembersDatabase()).rejects.toThrow(
        /Refusing to seed database: DATABASE_URL host \(ep-cool-proj\.us-east-2\.aws\.neon\.tech\) is not a recognized local development database/
      );
    });

    it('refuses to seed against URL with credentials and redacts user and password from refusal message', async () => {
      process.env.DATABASE_URL = 'postgresql://user:SECRETPW@ep-x.neon.tech/db?sslmode=require';
      (process.env as any).NODE_ENV = 'development';

      let caughtErr: Error | undefined;
      try {
        await seedMembersDatabase();
      } catch (err) {
        caughtErr = err as Error;
      }

      expect(caughtErr).toBeDefined();
      expect(caughtErr!.message).toMatch(/ep-x\.neon\.tech/);
      expect(caughtErr!.message).not.toContain('SECRETPW');
      expect(caughtErr!.message).not.toContain('user:');
    });

    it('refuses to seed against Supabase connection pooler URL', async () => {
      process.env.DATABASE_URL =
        'postgresql://user:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';
      (process.env as any).NODE_ENV = 'development';

      await expect(seedMembersDatabase()).rejects.toThrow(
        /Refusing to seed database: DATABASE_URL host \(aws-0-us-east-1\.pooler\.supabase\.com\) is not a recognized local development database/
      );
    });

    it('refuses to seed when NODE_ENV is production, even with localhost', async () => {
      process.env.DATABASE_URL = 'postgresql://postgres@localhost:5432/sinet_dev';
      (process.env as any).NODE_ENV = 'production';

      await expect(seedMembersDatabase()).rejects.toThrow(
        /Refusing to seed database: DATABASE_URL host \(localhost\) is not a recognized local development database or NODE_ENV is production/
      );
    });
  });
});
