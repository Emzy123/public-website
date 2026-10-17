/**
 * @jest-environment node
 */
import { performCapacityAudit } from './capacity-audit';
import { getMongoDb } from '@/lib/db/mongodb';

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
});
