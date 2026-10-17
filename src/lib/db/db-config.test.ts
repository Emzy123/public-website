/** @jest-environment node */

describe('Postgres TLS verification configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    delete global.__postgresClient;
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    delete global.__postgresClient;
  });

  it('proves non-local connections enforce verified TLS without rejectUnauthorized: false', () => {
    process.env.DATABASE_URL = 'postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb?sslmode=require';

    const mockPostgres = jest.fn().mockReturnValue({});
    jest.doMock('postgres', () => mockPostgres);
    jest.doMock('drizzle-orm/postgres-js', () => ({
      drizzle: jest.fn().mockReturnValue({}),
    }));

    require('./index');

    expect(mockPostgres).toHaveBeenCalled();
    const options = mockPostgres.mock.calls[0][1];

    // Must NOT disable certificate verification
    if (typeof options.ssl === 'object' && options.ssl !== null) {
      expect(options.ssl.rejectUnauthorized).not.toBe(false);
    }
    // Must be verified TLS (e.g. 'require', true, or { rejectUnauthorized: true })
    const isVerifiedTls =
      options.ssl === 'require' ||
      options.ssl === 'verify-full' ||
      options.ssl === true ||
      (typeof options.ssl === 'object' && options.ssl?.rejectUnauthorized === true);

    expect(isVerifiedTls).toBe(true);
  });

  it('keeps local dev connections unencrypted (ssl: false)', () => {
    process.env.DATABASE_URL = 'postgresql://postgres@localhost:5432/sinet_dev';

    const mockPostgres = jest.fn().mockReturnValue({});
    jest.doMock('postgres', () => mockPostgres);
    jest.doMock('drizzle-orm/postgres-js', () => ({
      drizzle: jest.fn().mockReturnValue({}),
    }));

    require('./index');

    expect(mockPostgres).toHaveBeenCalled();
    const options = mockPostgres.mock.calls[0][1];
    expect(options.ssl).toBe(false);
  });
});
