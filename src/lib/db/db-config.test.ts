/** @jest-environment node */

import { createPostgresClient, isLocalDatabaseHost } from './index';
import type postgres from 'postgres';

describe('Postgres TLS verification configuration (Driver-Resolved)', () => {
  const activeClients: postgres.Sql[] = [];

  afterAll(async () => {
    for (const sql of activeClients) {
      await sql.end({ timeout: 0 }).catch(() => {});
    }
  });

  function trackClient(sql: postgres.Sql): postgres.Sql {
    activeClients.push(sql);
    return sql;
  }

  it.each([
    {
      description: 'sslmode=require',
      url: 'postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb?sslmode=require',
    },
    {
      description: 'sslmode=verify-full',
      url: 'postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb?sslmode=verify-full',
    },
    {
      description: 'no sslmode parameter',
      url: 'postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb',
    },
  ])('asserts sql.options.ssl.rejectUnauthorized === true on real client for $description', ({ url }) => {
    const sql = trackClient(createPostgresClient(url));
    const ssl = sql.options.ssl as { rejectUnauthorized?: boolean };

    expect(typeof ssl).toBe('object');
    expect(ssl).not.toBeNull();
    expect(ssl.rejectUnauthorized).toBe(true);
  });

  it.each([
    {
      description: 'sslmode=require with CA cert',
      url: 'postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb?sslmode=require',
    },
    {
      description: 'sslmode=verify-full with CA cert',
      url: 'postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb?sslmode=verify-full',
    },
    {
      description: 'no sslmode with CA cert',
      url: 'postgresql://user:secret@custom-host.internal:5432/neondb',
    },
  ])('attaches ca when DATABASE_CA_CERT is set for $description', ({ url }) => {
    const caCert = '-----BEGIN CERTIFICATE-----\nTEST_CA_DATA\n-----END CERTIFICATE-----';
    const sql = trackClient(createPostgresClient(url, caCert));
    const ssl = sql.options.ssl as { rejectUnauthorized?: boolean; ca?: string };

    expect(ssl).toEqual({
      rejectUnauthorized: true,
      ca: caCert,
    });
  });

  it('keeps local dev connections unencrypted (ssl: false)', () => {
    const sql = trackClient(createPostgresClient('postgresql://postgres@localhost:5432/sinet_dev'));
    expect(sql.options.ssl).toBe(false);
  });
});

describe('isLocalDatabaseHost exact hostname matching', () => {
  it.each([
    ['postgresql://postgres@localhost:5432/sinet_dev', true, 'localhost'],
    ['postgresql://postgres@127.0.0.1:5432/sinet_dev', true, '127.0.0.1'],
    ['postgresql://postgres@[::1]:5432/sinet_dev', true, '::1 (bracketed IPv6)'],
    ['postgresql://postgres@postgres:5432/sinet_dev', true, 'postgres (docker-compose service)'],
    ['postgresql://postgres@sinet-postgres:5432/sinet_dev', true, 'sinet-postgres (docker container)'],
    ['', true, 'empty / unset URL default'],
    [undefined, true, 'undefined default'],
  ])('matches local hostname for %s (%s)', (url, expected, _label) => {
    expect(isLocalDatabaseHost(url)).toBe(expected);
  });

  it.each([
    ['postgresql://user:secret@localhost.example.com:5432/db', 'localhost.example.com'],
    ['postgresql://user:secret@127.0.0.1.example:5432/db', '127.0.0.1.example'],
    ['postgresql://user:secret@127.0.0.1.nip.io:5432/db', '127.0.0.1.nip.io'],
    ['postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb?sslmode=require', 'Neon serverless Postgres host'],
    ['postgresql://user:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require', 'Supabase transaction pooler host'],
    ['postgresql://user:secret@remote-postgres-box.internal:5432/prod', 'remote internal host'],
  ])('asserts non-local host %s is NOT local (%s)', (url) => {
    expect(isLocalDatabaseHost(url)).toBe(false);
  });

  describe('production-safe host restrictions', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('treats postgres and sinet-postgres as non-local in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isLocalDatabaseHost('postgresql://postgres@postgres:5432/sinet_dev')).toBe(false);
      expect(isLocalDatabaseHost('postgresql://postgres@sinet-postgres:5432/sinet_dev')).toBe(false);
      // localhost and loopbacks remain local
      expect(isLocalDatabaseHost('postgresql://postgres@localhost:5432/sinet_dev')).toBe(true);
      expect(isLocalDatabaseHost('postgresql://postgres@127.0.0.1:5432/sinet_dev')).toBe(true);
      expect(isLocalDatabaseHost('postgresql://postgres@[::1]:5432/sinet_dev')).toBe(true);
    });

    it('treats postgres and sinet-postgres as local in non-production (development/test)', () => {
      process.env.NODE_ENV = 'development';
      expect(isLocalDatabaseHost('postgresql://postgres@postgres:5432/sinet_dev')).toBe(true);
      expect(isLocalDatabaseHost('postgresql://postgres@sinet-postgres:5432/sinet_dev')).toBe(true);

      process.env.NODE_ENV = 'test';
      expect(isLocalDatabaseHost('postgresql://postgres@postgres:5432/sinet_dev')).toBe(true);
      expect(isLocalDatabaseHost('postgresql://postgres@sinet-postgres:5432/sinet_dev')).toBe(true);
    });
  });
});
