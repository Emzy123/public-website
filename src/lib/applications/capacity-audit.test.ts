/**
 * @jest-environment node
 */
import { performCapacityAudit, sanitizeDatabaseError } from './capacity-audit';
import { getMongoDb } from '@/lib/db/mongodb';
import { db } from '@/lib/db';

jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
}));

describe('Capacity & Drift Audit Service (src/lib/applications/capacity-audit.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      MONGODB_URI: 'mongodb://localhost:27017',
      MONGODB_DB: 'sinet_test',
      DATABASE_URL: '', // Mocked out for pure unit test
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects count drift on Mongo links and does NOT update in dry-run mode', async () => {
    const mockLinks = [
      {
        _id: 'link-1',
        slug: 'campus-drive',
        name: 'Campus Drive 2026',
        applicationCount: 5, // Recorded says 5
        isOpen: true,
        status: 'open',
      },
      {
        _id: 'link-2',
        slug: 'matching-link',
        name: 'Matching Link',
        applicationCount: 10,
        isOpen: true,
        status: 'open',
      },
    ];

    const mockUpdateOne = jest.fn();
    const mockCountDocuments = jest
      .fn()
      .mockImplementation(async (query: any) => {
        // link-1 actually has 8 applications (drift = +3)
        if (query.$or.some((c: any) => c.sourceLinkSlug === 'campus-drive')) return 8;
        // link-2 matches (10)
        return 10;
      });

    const mockCollection = jest.fn().mockImplementation((name: string) => {
      if (name === 'registration_links') {
        return {
          find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(mockLinks) }),
          updateOne: mockUpdateOne,
        };
      }
      if (name === 'applications') {
        return {
          countDocuments: mockCountDocuments,
        };
      }
      return {};
    });

    const mockDb = { collection: mockCollection };
    (getMongoDb as jest.Mock).mockResolvedValue(mockDb);

    const result = await performCapacityAudit({ apply: false });

    expect(result.countDrift).toHaveLength(1);
    expect(result.countDrift[0]).toEqual({
      store: 'MongoDB',
      id: 'link-1',
      slug: 'campus-drive',
      name: 'Campus Drive 2026',
      recordedCount: 5,
      actualCount: 8,
      drift: 3,
    });

    // In dry-run mode, updateOne must NOT be called
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it('applies count backfill when apply: true is passed', async () => {
    const mockLinks = [
      {
        _id: 'link-drift',
        slug: 'drift-slug',
        name: 'Drift Link',
        applicationCount: 2,
        isOpen: true,
      },
    ];

    const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const mockDb = {
      collection: jest.fn().mockImplementation((name: string) => {
        if (name === 'registration_links') {
          return {
            find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(mockLinks) }),
            updateOne: mockUpdateOne,
          };
        }
        return { countDocuments: jest.fn().mockResolvedValue(5) };
      }),
    };

    (getMongoDb as jest.Mock).mockResolvedValue(mockDb);

    const result = await performCapacityAudit({ apply: true });

    expect(result.countDrift).toHaveLength(1);
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'link-drift' },
      expect.objectContaining({
        $set: expect.objectContaining({ applicationCount: 5 }),
      })
    );
  });

  it('detects live links with capacity = 0 and flags them as unlimited', async () => {
    const mockLinks = [
      {
        _id: 'link-zero-max',
        slug: 'zero-max-link',
        name: 'Zero Max Applications Link',
        isOpen: true,
        status: 'open',
        maxApplications: 0,
        applicationCount: 10,
      },
      {
        _id: 'link-zero-quota',
        slug: 'zero-quota-link',
        name: 'Zero Quota Link',
        isOpen: true,
        status: 'open',
        quota: 0,
        applicationCount: 20,
      },
      {
        _id: 'link-closed-zero',
        slug: 'closed-zero-link',
        name: 'Closed Zero Link',
        isOpen: false, // Closed, so should NOT be flagged as live zero-limit
        status: 'closed',
        maxApplications: 0,
      },
    ];

    const mockDb = {
      collection: jest.fn().mockImplementation((name: string) => {
        if (name === 'registration_links') {
          return {
            find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(mockLinks) }),
          };
        }
        return {
          countDocuments: jest.fn().mockImplementation((q: any) => {
            if (q.$or.some((c: any) => c.sourceLinkSlug === 'zero-max-link')) return 10;
            return 20;
          }),
        };
      }),
    };

    (getMongoDb as jest.Mock).mockResolvedValue(mockDb);

    const result = await performCapacityAudit({ apply: false });

    expect(result.zeroLimits).toHaveLength(2);
    expect(result.zeroLimits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'zero-max-link',
          field: 'maxApplications',
          value: 0,
        }),
        expect.objectContaining({
          slug: 'zero-quota-link',
          field: 'quota',
          value: 0,
        }),
      ])
    );
    // Closed link must not be in zeroLimits
    expect(result.zeroLimits.find((z) => z.slug === 'closed-zero-link')).toBeUndefined();
  });

  describe('sanitizeDatabaseError', () => {
    it('sanitizes connection refused errors without exposing hosts or ports', () => {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:5432');
      expect(sanitizeDatabaseError(err)).toBe('connection refused');
    });

    it('sanitizes authentication failures without leaking user or password', () => {
      const err = new Error('password authentication failed for user "postgres" with password "supersecret"');
      expect(sanitizeDatabaseError(err)).toBe('auth failed');
      expect(sanitizeDatabaseError(err)).not.toContain('supersecret');
      expect(sanitizeDatabaseError(err)).not.toContain('postgres');
    });

    it('sanitizes SSL/TLS errors without leaking connection string', () => {
      const err = new Error('server does not support SSL, but SSL was required');
      expect(sanitizeDatabaseError(err)).toBe('SSL required');
    });

    it('sanitizes timeout errors without leaking connection parameters', () => {
      const err = new Error('Connection timeout exceeded after 15000ms');
      expect(sanitizeDatabaseError(err)).toBe('timeout');
    });

    it('sanitizes DNS/host not found errors', () => {
      const err = new Error('getaddrinfo ENOTFOUND ep-cool-database-1234.us-east-2.aws.neon.tech');
      expect(sanitizeDatabaseError(err)).toBe('host not found (DNS lookup failed)');
      expect(sanitizeDatabaseError(err)).not.toContain('neon.tech');
    });
  });

  describe('connection error reporting in summary', () => {
    it('reports postgresError: "DATABASE_URL not set" when DATABASE_URL is empty', async () => {
      process.env.DATABASE_URL = '';
      (getMongoDb as jest.Mock).mockResolvedValue({
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
        }),
      });

      const result = await performCapacityAudit({ apply: false });

      expect(result.summary.postgresConnected).toBe(false);
      expect(result.summary.postgresError).toBe('DATABASE_URL not set');
    });

    it('reports sanitized postgresError: "connection refused" when Postgres connection fails', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@remotehost:5432/sinet';
      (getMongoDb as jest.Mock).mockResolvedValue({
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
        }),
      });
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
      });

      const result = await performCapacityAudit({ apply: false });

      expect(result.summary.postgresConnected).toBe(false);
      expect(result.summary.postgresError).toBe('connection refused');
    });

    it('reports mongoError: "MONGODB_URI not set" when MONGODB_URI is empty', async () => {
      delete process.env.MONGODB_URI;
      delete process.env.MONGODB_URI_DIRECT;
      process.env.DATABASE_URL = '';

      const result = await performCapacityAudit({ apply: false });

      expect(result.summary.mongoConnected).toBe(false);
      expect(result.summary.mongoError).toBe('MONGODB_URI not set');
    });

    it('reports sanitized mongoError: "auth failed" when Mongo throws authentication failure', async () => {
      process.env.MONGODB_URI = 'mongodb://user:secret@mongohost:27017';
      process.env.DATABASE_URL = '';
      (getMongoDb as jest.Mock).mockRejectedValue(
        new Error('MongoServerError: Authentication failed for user admin')
      );

      const result = await performCapacityAudit({ apply: false });

      expect(result.summary.mongoConnected).toBe(false);
      expect(result.summary.mongoError).toBe('auth failed');
    });
  });
});
