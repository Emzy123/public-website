import { dedupeUnifiedApplications } from './dedupe';

describe('dedupeUnifiedApplications', () => {
  it('keeps the Postgres record when Mongo and Postgres share email, campaign, role, and time', () => {
    const result = dedupeUnifiedApplications([
      {
        id: 'mongo-1',
        email: 'Ada@Sinet.africa',
        source: 'mongo' as const,
        createdAt: '2026-10-23T10:00:00.000Z',
        campaignName: 'Campus 2026',
        division: 'ambassador',
        chapter: 'fulokoja',
      },
      {
        id: 'pg-1',
        email: 'ada@sinet.africa',
        source: 'postgres' as const,
        createdAt: '2026-10-23T10:02:00.000Z',
        campaignName: 'Campus 2026',
        division: 'ambassador',
        chapter: null,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pg-1');
    expect(result[0].source).toBe('postgres');
    expect(result[0].chapter).toBe('fulokoja');
  });

  it('does not hide a genuine second application for a different role', () => {
    const result = dedupeUnifiedApplications([
      {
        id: 'ambassador',
        email: 'ada@sinet.africa',
        source: 'mongo' as const,
        createdAt: '2026-10-23T10:00:00.000Z',
        campaignName: 'Campus 2026',
        division: 'ambassador',
      },
      {
        id: 'volunteer',
        email: 'ada@sinet.africa',
        source: 'postgres' as const,
        createdAt: '2026-10-23T10:01:00.000Z',
        campaignName: 'Campus 2026',
        division: 'volunteer',
      },
    ]);

    expect(result.map((row) => row.id).sort()).toEqual(['ambassador', 'volunteer']);
  });

  it('does not merge distinct applications from the same email hours apart', () => {
    const result = dedupeUnifiedApplications([
      {
        id: 'a',
        email: 'ada@sinet.africa',
        source: 'mongo' as const,
        createdAt: '2026-10-01T10:00:00.000Z',
        campaignName: 'Campus 2026',
        division: 'ambassador',
      },
      {
        id: 'b',
        email: 'ada@sinet.africa',
        source: 'postgres' as const,
        createdAt: '2026-10-23T10:00:00.000Z',
        campaignName: 'Campus 2026',
        division: 'ambassador',
      },
    ]);

    expect(result).toHaveLength(2);
  });

  it('leaves blank-email records untouched', () => {
    const result = dedupeUnifiedApplications([
      { id: '1', email: '', source: 'mongo' as const, createdAt: '2026-10-23T10:00:00.000Z' },
      { id: '2', email: '  ', source: 'postgres' as const, createdAt: '2026-10-23T10:00:00.000Z' },
    ]);

    expect(result).toHaveLength(2);
  });
});
