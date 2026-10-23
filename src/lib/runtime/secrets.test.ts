import { assertProductionSecrets } from './secrets';

describe('assertProductionSecrets', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws Fatal when AUTH_SECRET is missing in production', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres@localhost:5432/sinet',
    };
    delete process.env.AUTH_SECRET;
    expect(() => assertProductionSecrets()).toThrow(/Fatal: AUTH_SECRET/);
  });

  it('throws Fatal when DATABASE_URL is missing in production', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      AUTH_SECRET: 'production-auth-secret-at-least-32-chars-long',
    };
    delete process.env.DATABASE_URL;
    expect(() => assertProductionSecrets()).toThrow(/Fatal: DATABASE_URL/);
  });
});
