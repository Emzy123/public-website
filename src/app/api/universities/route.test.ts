/** @jest-environment node */

import { GET, dynamic } from './route';
import { db } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
  },
}));

describe('GET /api/universities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports dynamic = 'force-dynamic' to prevent stale build-time static baking", () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns active university records from PostgreSQL when available', async () => {
    const mockUniversities = [
      {
        id: 'uni-1',
        name: 'Federal University Lokoja',
        shortName: 'FULOKOJA',
        campusCode: 'FULOKOJA',
        state: 'Kogi',
      },
      {
        id: 'uni-2',
        name: 'Prince Abubakar Audu University',
        shortName: 'PAAU',
        campusCode: 'PAAU',
        state: 'Kogi',
      },
    ];

    const mockOrderBy = jest.fn().mockResolvedValue(mockUniversities);
    const mockFrom = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.universities).toEqual(mockUniversities);
    expect(data.degraded).toBeUndefined();
  });

  it('resiliently falls back to built-in chapters catalog with degraded flag if database fails', async () => {
    const mockFrom = jest.fn().mockReturnValue({
      orderBy: jest.fn().mockRejectedValue(new Error('Connection terminated unexpectedly')),
    });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.degraded).toBe(true);
    expect(Array.isArray(data.universities)).toBe(true);
    expect(data.universities.length).toBeGreaterThan(0);
    expect(data.universities[0]).toHaveProperty('campusCode');

    warnSpy.mockRestore();
  });
});
