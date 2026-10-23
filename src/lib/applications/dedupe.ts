export type DedupeableApplication = {
  email: string;
  source: 'mongo' | 'postgres';
  createdAt: string;
  campaignId?: string | null;
  campaignName?: string | null;
  division?: string | null;
  chapter?: string | null;
  universityName?: string | null;
};

const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

export function normalizeApplicationEmail(email: string): string {
  return email.trim().toLowerCase();
}

function campaignRoleKey(app: DedupeableApplication): string {
  const campaign = (app.campaignId || app.campaignName || '').trim().toLowerCase();
  const role = (app.division || '').trim().toLowerCase();
  return `${campaign}::${role}`;
}

function isNearDuplicate(
  a: DedupeableApplication,
  b: DedupeableApplication,
  windowMs: number
): boolean {
  const emailA = normalizeApplicationEmail(a.email);
  const emailB = normalizeApplicationEmail(b.email);
  if (!emailA || emailA !== emailB) return false;
  if (campaignRoleKey(a) !== campaignRoleKey(b)) return false;
  const delta = Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return Number.isFinite(delta) && delta <= windowMs;
}

function preferIncoming(existing: DedupeableApplication, incoming: DedupeableApplication): boolean {
  if (incoming.source === 'postgres' && existing.source !== 'postgres') return true;
  if (incoming.source === existing.source) {
    return new Date(incoming.createdAt).getTime() >= new Date(existing.createdAt).getTime();
  }
  return false;
}

function fillBlank<T extends string | null | undefined>(kept: T, dropped: T): T {
  if (kept && String(kept).trim()) return kept;
  return dropped;
}

/**
 * Display-only merge: when a Postgres row replaces a Mongo duplicate, keep
 * chapter/division/campus fields that only existed on the dropped Mongo row.
 * Never writes back to either database.
 */
export function mergeDroppedMongoFields<T extends DedupeableApplication>(kept: T, dropped: T): T {
  const mongoRow = dropped.source === 'mongo' ? dropped : kept.source === 'mongo' ? kept : null;
  const pgRow = kept.source === 'postgres' ? kept : dropped.source === 'postgres' ? dropped : null;
  if (!mongoRow || !pgRow) return kept;

  return {
    ...pgRow,
    chapter: fillBlank(pgRow.chapter, mongoRow.chapter),
    division: fillBlank(pgRow.division, mongoRow.division) as T['division'],
    universityName: fillBlank(pgRow.universityName, mongoRow.universityName),
  };
}

/**
 * Collapses dual-written applications for the admin inbox only.
 * Does not delete Mongo or Postgres records.
 */
export function dedupeUnifiedApplications<T extends DedupeableApplication>(
  apps: T[],
  windowMs: number = DEFAULT_WINDOW_MS
): T[] {
  const kept: T[] = [];

  for (const app of apps) {
    const matchIndex = kept.findIndex((existing) => isNearDuplicate(existing, app, windowMs));
    if (matchIndex === -1) {
      kept.push(app);
      continue;
    }
    const existing = kept[matchIndex];
    if (preferIncoming(existing, app)) {
      kept[matchIndex] = mergeDroppedMongoFields(app, existing);
    } else {
      kept[matchIndex] = mergeDroppedMongoFields(existing, app);
    }
  }

  return kept;
}
