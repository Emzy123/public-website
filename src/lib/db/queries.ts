import { unstable_noStore as noStore } from 'next/cache';
import type { Empire, Rep, TeamMember } from '@/types';
import { empires as defaultEmpires } from '@/lib/data/empires';
import { reps as defaultReps } from '@/lib/data/reps';
import { teamMembers as defaultTeamMembers } from '@/lib/data/team';
import { HowItWorksStep } from './types';
import { getMongoDb } from './mongodb';
import { readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { TeamMember as TeamMemberType } from '@/types';

function toPlain<T>(value: T): T {
  // Next.js Server->Client serialization requires plain objects.
  // Mongo driver returns BSON types (e.g. ObjectId/Decimal128) which can trigger warnings.
  return JSON.parse(JSON.stringify(value)) as T;
}

const DEFAULT_STEPS: HowItWorksStep[] = [
  {
    number: '01',
    title: 'Join',
    description: 'Create your profile and join the waitlist to reserve early access to Phase 1.',
    iconKey: 'join',
  },
  {
    number: '02',
    title: 'Verify',
    description: 'Complete secure onboarding and verification so every participant meets platform standards.',
    iconKey: 'verify',
  },
  {
    number: '03',
    title: 'Invest',
    description: 'Access curated empires and sectors—and build ownership across Africa’s growth engines.',
    iconKey: 'invest',
  },
];

function sortByNumberString(a: { number: string }, b: { number: string }) {
  const an = Number(a.number);
  const bn = Number(b.number);
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  return a.number.localeCompare(b.number);
}

export async function getEmpires(): Promise<Empire[]> {
  noStore();
  try {
    const db = await getMongoDb();
    const docs = await db.collection('empires').find({}).toArray();
    if (!docs.length) return defaultEmpires;
    return toPlain(docs) as unknown as Empire[];
  } catch {
    // If DB isn't configured yet, keep the UI usable in local dev.
    return defaultEmpires;
  }
}

export async function getReps(): Promise<Rep[]> {
  noStore();
  try {
    const db = await getMongoDb();
    const docs = await db.collection('reps').find({}).toArray();
    if (!docs.length) return defaultReps;
    return toPlain(docs) as unknown as Rep[];
  } catch {
    return defaultReps;
  }
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  noStore();
  try {
    const db = await getMongoDb();
    const docs = await db.collection('team').find({}).toArray();
    const team = docs.length ? (toPlain(docs) as unknown as TeamMember[]) : buildTeamMembersFromPublicImages();
    return sortTeamByHierarchy(filterInactiveTeamRoles(attachTeamPhotosFromPublic(team)));
  } catch {
    return sortTeamByHierarchy(
      filterInactiveTeamRoles(attachTeamPhotosFromPublic(buildTeamMembersFromPublicImages() ?? defaultTeamMembers))
    );
  }
}

function normalizeRoleText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function filterInactiveTeamRoles(team: TeamMember[]): TeamMember[] {
  const excludedRoles = [
    'crso',
    'csro',
    'chief financial officer',
    'cfo',
    'chief research and strategy officer',
  ];

  return team.filter((member) => {
    const title = normalizeRoleText(String(member.title ?? ''));
    return !excludedRoles.some((role) => title.includes(role));
  });
}

function getTeamHierarchyRank(title: string): number {
  const role = normalizeRoleText(title);

  if (role.includes('founder')) return 1;
  if (role.includes('chief executive officer') || role.includes('ceo')) return 2;
  if (role.includes('chief operating officer') || role.includes('coo')) return 3;
  if (role.includes('chief technology officer') || role.includes('cto')) return 4;
  if (role.includes('chief')) return 5;
  if (role.includes('director') || role.includes('head')) return 6;
  if (role.includes('manager') || role.includes('lead')) return 7;
  return 8;
}

function sortTeamByHierarchy(team: TeamMember[]): TeamMember[] {
  return [...team].sort((a, b) => {
    const rankDiff = getTeamHierarchyRank(a.title) - getTeamHierarchyRank(b.title);
    if (rankDiff !== 0) return rankDiff;
    return a.title.localeCompare(b.title);
  });
}

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getTeamPhotoUrlByTitle(): Map<string, string> {
  try {
    const teamImagesDir = join(process.cwd(), 'public/images/team');
    const files = readdirSync(teamImagesDir, { withFileTypes: true });
    const map = new Map<string, string>();

    for (const file of files) {
      if (!file.isFile()) continue;
      const extension = extname(file.name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) continue;

      const stem = file.name.slice(0, -extension.length);
      const normalizedStem = normalizeForMatch(stem);
      const urlPath = `/images/team/${encodeURIComponent(file.name)}`;
      map.set(normalizedStem, urlPath);
    }

    return map;
  } catch {
    return new Map();
  }
}

function getTeamPhotoUrls(): string[] {
  try {
    const teamImagesDir = join(process.cwd(), 'public/images/team');
    const files = readdirSync(teamImagesDir, { withFileTypes: true });

    return files
      .filter((file) => file.isFile())
      .map((file) => file.name)
      .filter((name) => {
        const extension = extname(name).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(extension);
      })
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `/images/team/${encodeURIComponent(name)}`);
  } catch {
    return [];
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildTeamMembersFromPublicImages(): TeamMemberType[] {
  try {
    const teamImagesDir = join(process.cwd(), 'public/images/team');
    const files = readdirSync(teamImagesDir, { withFileTypes: true });

    const members: TeamMemberType[] = [];

    for (const file of files) {
      if (!file.isFile()) continue;
      const extension = extname(file.name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) continue;

      const stem = file.name.slice(0, -extension.length).trim();
      const title = stem.replace(/\s+/g, ' ');

      const match = title.match(/\(([^)]+)\)\s*$/);
      const name = match?.[1]?.trim() ? match[1].trim() : title;
      const cleanedTitle = match?.[1] ? title.replace(/\(([^)]+)\)\s*$/, '').trim() : title;

      const id = slugify(cleanedTitle) || slugify(title) || String(members.length + 1);
      const photoUrl = `/images/team/${encodeURIComponent(file.name)}`;

      members.push({ id, name, title: cleanedTitle || title, photoUrl });
    }

    return members.sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}

function attachTeamPhotosFromPublic(team: TeamMember[]): TeamMember[] {
  // Assign photos based on local `public/images/team` so the site can render
  // even before DB seeding (and without hardcoded image URLs).
  try {
    const teamPhotoUrlByTitle = getTeamPhotoUrlByTitle();
    const teamPhotoUrls = getTeamPhotoUrls();
    const used = new Set<string>();

    return team.map((member) => {
      const matched = member.photoUrl ? null : teamPhotoUrlByTitle.get(normalizeForMatch(member.title));
      if (matched) used.add(matched);

      const fallback =
        member.photoUrl || matched
          ? null
          : teamPhotoUrls.find((url) => !used.has(url)) ?? null;

      if (fallback) used.add(fallback);

      return {
        ...member,
        photoUrl: member.photoUrl ?? matched ?? fallback ?? null,
      };
    });
  } catch {
    return team;
  }
}

export async function getHowItWorksSteps(): Promise<HowItWorksStep[]> {
  noStore();
  try {
    const db = await getMongoDb();
    const docs = await db.collection('howItWorksSteps').find({}).toArray();
    if (!docs.length) return DEFAULT_STEPS;

    const steps = toPlain(docs) as unknown as HowItWorksStep[];
    return [...steps].sort(sortByNumberString);
  } catch {
    return DEFAULT_STEPS;
  }
}

