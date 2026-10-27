/** @jest-environment node */

describe('Postgres TLS verification configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    delete global.__postgresClient;
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = { ...originalEnv };
    delete global.__postgresClient;
  });

  it('proves non-local connections enforce verified TLS with rejectUnauthorized: true', () => {
    process.env.DATABASE_URL = 'postgresql://user:secret@ep-cool-proj.us-east-2.aws.neon.tech/neondb?sslmode=verify-full';

    const mockPostgres = jest.fn().mockReturnValue({});
    jest.doMock('postgres', () => mockPostgres);
    jest.doMock('drizzle-orm/postgres-js', () => ({
      drizzle: jest.fn().mockReturnValue({}),
    }));

    require('./index');

    expect(mockPostgres).toHaveBeenCalled();
    const options = mockPostgres.mock.calls[0][1];

    // Certificate verification must be strictly ON ({ rejectUnauthorized: true })
    expect(typeof options.ssl).toBe('object');
    expect(options.ssl).not.toBeNull();
    expect(options.ssl.rejectUnauthorized).toBe(true);
    expect(options.ssl).not.toBe('require');
  });

  it('supports custom CA certificate via DATABASE_CA_CERT', () => {
    process.env.DATABASE_URL = 'postgresql://user:secret@custom-host.internal:5432/neondb';
    process.env.DATABASE_CA_CERT = '-----BEGIN CERTIFICATE-----\nTEST_CA_DATA\n-----END CERTIFICATE-----';

    const mockPostgres = jest.fn().mockReturnValue({});
    jest.doMock('postgres', () => mockPostgres);
    jest.doMock('drizzle-orm/postgres-js', () => ({
      drizzle: jest.fn().mockReturnValue({}),
    }));

    require('./index');

    expect(mockPostgres).toHaveBeenCalled();
    const options = mockPostgres.mock.calls[0][1];

    expect(options.ssl).toEqual({
      rejectUnauthorized: true,
      ca: '-----BEGIN CERTIFICATE-----\nTEST_CA_DATA\n-----END CERTIFICATE-----',
    });
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
