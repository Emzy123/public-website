import { MongoClient } from 'mongodb';
import type { Empire, Rep, TeamMember } from '../src/types/index.ts';
import 'dotenv/config';
import { appendFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resolver } from 'node:dns';

function agentLog(payload: Record<string, unknown>) {
  try {
    appendFileSync('debug-cf60a3.log', `${JSON.stringify(payload)}\n`);
  } catch {
    // ignore
  }
}

// #region agent log
const _p0 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'A', location: 'scripts/seed.ts:3', message: 'seed script starting', data: { node: process.version, cwd: process.cwd() }, timestamp: Date.now() };
agentLog(_p0);
fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p0) }).catch(() => {});
// #endregion

async function loadDefaults() {
  const empiresPath = new URL('../src/lib/data/empires.ts', import.meta.url);
  const repsPath = new URL('../src/lib/data/reps.ts', import.meta.url);
  const teamPath = new URL('../src/lib/data/team.ts', import.meta.url);

  // #region agent log
  const _p1 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'A', location: 'scripts/seed.ts:11', message: 'seed import URLs built', data: { empires: empiresPath.href, reps: repsPath.href, team: teamPath.href }, timestamp: Date.now() };
  agentLog(_p1);
  fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p1) }).catch(() => {});
  // #endregion

  const empiresMod = (await import(empiresPath.href)) as { empires: Empire[] };
  const repsMod = (await import(repsPath.href)) as { reps: Rep[] };
  const teamMod = (await import(teamPath.href)) as { teamMembers: TeamMember[] };

  // #region agent log
  const _p2 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'A', location: 'scripts/seed.ts:23', message: 'seed modules imported', data: { hasEmpires: Array.isArray(empiresMod?.empires), hasReps: Array.isArray(repsMod?.reps), hasTeam: Array.isArray(teamMod?.teamMembers) }, timestamp: Date.now() };
  agentLog(_p2);
  fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p2) }).catch(() => {});
  // #endregion

  return {
    defaultEmpires: empiresMod.empires,
    defaultReps: repsMod.reps,
    defaultTeamMembers: teamMod.teamMembers,
  };
}

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getTeamPhotoUrlByTitle(): Map<string, string> {
  const teamImagesDir = fileURLToPath(new URL('../public/images/team', import.meta.url));
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
}

function getTeamPhotoUrls(): string[] {
  const teamImagesDir = fileURLToPath(new URL('../public/images/team', import.meta.url));
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
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildTeamMembersFromPublicImages(): TeamMember[] {
  // Generate team docs from the local `public/images/team` filenames.
  // This ensures About renders every team image that exists in the repo.
  const teamImagesDir = fileURLToPath(new URL('../public/images/team', import.meta.url));
  const files = readdirSync(teamImagesDir, { withFileTypes: true });

  const members: TeamMember[] = [];

  for (const file of files) {
    if (!file.isFile()) continue;
    const extension = extname(file.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) continue;

    const stem = file.name.slice(0, -extension.length).trim();
    const title = stem.replace(/\s+/g, ' ');

    // If the filename has an abbreviation like "(CGPO)", use that for `name`.
    const match = title.match(/\(([^)]+)\)\s*$/);
    const name = match?.[1]?.trim() ? match[1].trim() : title;
    const cleanedTitle = match?.[1] ? title.replace(/\(([^)]+)\)\s*$/, '').trim() : title;

    const id = slugify(cleanedTitle) || slugify(title) || String(members.length + 1);
    const photoUrl = `/images/team/${encodeURIComponent(file.name)}`;

    members.push({ id, name, title: cleanedTitle || title, photoUrl });
  }

  return members.sort((a, b) => a.title.localeCompare(b.title));
}

function convertMongoSrvToDirectUri(srvUri: string): string | null {
  // When SRV lookups are blocked, we can often connect by directly targeting the
  // Atlas host on the default MongoDB port (27017).
  try {
    const u = new URL(srvUri);
    if (u.protocol !== 'mongodb+srv:') return null;

    const hostname = u.hostname;
    const username = u.username ? encodeURIComponent(u.username) : '';
    const password = u.password ? encodeURIComponent(u.password) : '';
    const credentials = u.username ? `${username}:${password}@` : '';

    // Preserve pathname + query string (e.g. "/?appName=...").
    const pathname = u.pathname || '/';
    const params = new URLSearchParams(u.search);
    // Atlas typically requires TLS for both SRV and direct URIs.
    if (!params.has('tls')) params.set('tls', 'true');
    // Direct connection avoids replica-set discovery relying on SRV.
    if (!params.has('directConnection')) params.set('directConnection', 'true');
    if (!params.has('authSource')) params.set('authSource', 'admin');

    return `mongodb://${credentials}${hostname}:27017${pathname}?${params.toString()}`;
  } catch {
    return null;
  }
}

async function convertMongoSrvToDirectUriViaIp(srvUri: string): Promise<string | null> {
  try {
    const u = new URL(srvUri);
    if (u.protocol !== 'mongodb+srv:') return null;

    const hostname = u.hostname;
    const username = u.username ? encodeURIComponent(u.username) : '';
    const password = u.password ? encodeURIComponent(u.password) : '';
    const credentials = u.username ? `${username}:${password}@` : '';

    const params = new URLSearchParams(u.search);
    if (!params.has('tls')) params.set('tls', 'true');
    if (!params.has('directConnection')) params.set('directConnection', 'true');
    if (!params.has('authSource')) params.set('authSource', 'admin');
    // TLS hostname won't match when connecting by IP; allow this hop.
    if (!params.has('tlsAllowInvalidHostnames')) params.set('tlsAllowInvalidHostnames', 'true');

    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    const ips = await new Promise<string[]>((resolve, reject) => {
      resolver.resolve4(hostname, (err, addresses) => {
        if (err) return reject(err);
        resolve(addresses);
      });
    }).catch((dnsErr) => {
      console.error('Atlas host IP resolution failed (public DNS).', {
        hostname,
        dnsErr: (dnsErr as any)?.code ?? dnsErr,
      });
      return [];
    });
    const ip = ips[0];
    if (!ip) return null;

    const pathname = u.pathname || '/';
    return `mongodb://${credentials}${ip}:27017${pathname}?${params.toString()}`;
  } catch {
    return null;
  }
}

async function convertMongoSrvToDirectUriViaSrvIps(srvUri: string): Promise<string | null> {
  try {
    const u = new URL(srvUri);
    if (u.protocol !== 'mongodb+srv:') return null;

    const hostname = u.hostname;
    const username = u.username ? encodeURIComponent(u.username) : '';
    const password = u.password ? encodeURIComponent(u.password) : '';
    const credentials = u.username ? `${username}:${password}@` : '';

    const params = new URLSearchParams(u.search);
    if (!params.has('tls')) params.set('tls', 'true');
    if (!params.has('authSource')) params.set('authSource', 'admin');
    if (!params.has('tlsAllowInvalidHostnames')) params.set('tlsAllowInvalidHostnames', 'true');

    const srvName = `_mongodb._tcp.${hostname}`;
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    const srvRecords = await new Promise<Array<{ name: string; port: number }>>((resolve, reject) => {
      resolver.resolveSrv(srvName, (err, addresses) => {
        if (err) return reject(err);
        resolve(addresses as any);
      });
    }).catch(() => []);

    const uniqueHostPorts = new Set<string>();

    for (const rec of srvRecords) {
      const target = String(rec.name).replace(/\.$/, '');
      const port = rec.port || 27017;
      const ips = await new Promise<string[]>((resolve, reject) => {
        resolver.resolve4(target, (err, addresses) => {
          if (err) return reject(err);
          resolve(addresses as any);
        });
      }).catch(() => []);

      for (const ip of ips) uniqueHostPorts.add(`${ip}:${port}`);
    }

    if (uniqueHostPorts.size === 0) return null;
    const hosts = Array.from(uniqueHostPorts).join(',');
    const pathname = u.pathname || '/';
    return `mongodb://${credentials}${hosts}${pathname}?${params.toString()}`;
  } catch {
    return null;
  }
}

async function convertMongoSrvToDirectUriViaSrvHosts(srvUri: string): Promise<string | null> {
  try {
    const u = new URL(srvUri);
    if (u.protocol !== 'mongodb+srv:') return null;

    const hostname = u.hostname;
    const username = u.username ? encodeURIComponent(u.username) : '';
    const password = u.password ? encodeURIComponent(u.password) : '';
    const credentials = u.username ? `${username}:${password}@` : '';

    const params = new URLSearchParams(u.search);
    if (!params.has('tls')) params.set('tls', 'true');
    if (!params.has('authSource')) params.set('authSource', 'admin');

    const srvName = `_mongodb._tcp.${hostname}`;
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    const srvRecords = await new Promise<Array<{ name: string; port: number }>>((resolve, reject) => {
      resolver.resolveSrv(srvName, (err, addresses) => {
        if (err) return reject(err);
        resolve(addresses as any);
      });
    }).catch(() => []);

    const uniqueHostPorts = new Set<string>();
    for (const rec of srvRecords) {
      const target = String(rec.name).replace(/\.$/, '');
      const port = rec.port || 27017;
      uniqueHostPorts.add(`${target}:${port}`);
    }

    if (uniqueHostPorts.size === 0) return null;
    const hosts = Array.from(uniqueHostPorts).join(',');
    const pathname = u.pathname || '/';
    return `mongodb://${credentials}${hosts}${pathname}?${params.toString()}`;
  } catch {
    return null;
  }
}

const DEFAULT_STEPS = [
  {
    number: '01',
    title: 'Join',
    description: 'Register your interest by joining our waitlist and creating your investor profile.',
    iconKey: 'join',
  },
  {
    number: '02',
    title: 'Verify',
    description: 'Complete our secure onboarding and KYC process to gain full access to the portal.',
    iconKey: 'verify',
  },
  {
    number: '03',
    title: 'Invest',
    description: 'Explore curated empires, select your preferred sectors, and build your portfolio.',
    iconKey: 'invest',
  },
];

async function main() {
  const { defaultEmpires, defaultReps, defaultTeamMembers } = await loadDefaults();
  const publicTeamMembers = buildTeamMembersFromPublicImages();

  const seededTeamMembers: TeamMember[] =
    publicTeamMembers.length > 0
      ? publicTeamMembers
      : defaultTeamMembers.map((member) => {
          const teamPhotoUrlByTitle = getTeamPhotoUrlByTitle();
          const teamPhotoUrls = getTeamPhotoUrls();
          const usedPhotoUrls = new Set<string>();

          const matchedPhotoUrl = teamPhotoUrlByTitle.get(normalizeForMatch(member.title));
          if (matchedPhotoUrl) usedPhotoUrls.add(matchedPhotoUrl);

          let fallbackPhotoUrl: string | undefined;
          if (!matchedPhotoUrl) {
            fallbackPhotoUrl = teamPhotoUrls.find((url) => !usedPhotoUrls.has(url));
            if (fallbackPhotoUrl) usedPhotoUrls.add(fallbackPhotoUrl);
          }

          return {
            ...member,
            photoUrl: matchedPhotoUrl ?? fallbackPhotoUrl ?? member.photoUrl ?? null,
          };
        });
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  const fallbackUri = process.env.MONGODB_URI_DIRECT;

  if (!uri) throw new Error('Missing MONGODB_URI');
  if (!dbName) throw new Error('Missing MONGODB_DB');

  // #region agent log
  const _p3 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'B', location: 'scripts/seed.ts:42', message: 'env present + default counts', data: { hasMongoUri: Boolean(uri), hasDbName: Boolean(dbName), hasMongoDirect: Boolean(fallbackUri), empires: defaultEmpires.length, reps: defaultReps.length, team: seededTeamMembers.length }, timestamp: Date.now() };
  agentLog(_p3);
  fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p3) }).catch(() => {});
  // #endregion

  let client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });
  // #region agent log
  let uriHost: string | null = null;
  let uriProtocol: string | null = null;
  try {
    const u = new URL(uri);
    uriHost = u.host || null;
    uriProtocol = u.protocol || null;
  } catch {
    // ignore parse errors; we don't want to block seeding
  }
  const _p4 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'C', location: 'scripts/seed.ts:56', message: 'about to connect mongo', data: { uriProtocol, uriHost, dbName }, timestamp: Date.now() };
  agentLog(_p4);
  fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p4) }).catch(() => {});
  // #endregion

  try {
    await client.connect();
    // #region agent log
    const _p5 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'C', location: 'scripts/seed.ts:83', message: 'mongo connect succeeded', data: {}, timestamp: Date.now() };
    agentLog(_p5);
    fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p5) }).catch(() => {});
    // #endregion
  } catch (e) {
    // #region agent log
    const _p6 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'C', location: 'scripts/seed.ts:64', message: 'mongo connect failed', data: { name: (e as any)?.name, code: (e as any)?.code, message: String((e as any)?.message ?? e) }, timestamp: Date.now() };
    agentLog(_p6);
    fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p6) }).catch(() => {});
    // #endregion

    const err = e as any;
    const isSrvLookupFailure =
      uriProtocol === 'mongodb+srv:' &&
      (String(err?.message ?? '').includes('querySrv') || err?.code === 'ECONNREFUSED');

    // If SRV lookups are blocked (common on restricted networks), allow a direct URI fallback.
    if (isSrvLookupFailure) {
      // 1) Prefer explicit direct connection string (set in .env as MONGODB_URI_DIRECT).
      if (fallbackUri) {
        // #region agent log
        let fbHost: string | null = null;
        let fbProtocol: string | null = null;
        try {
          const u = new URL(fallbackUri);
          fbHost = u.host || null;
          fbProtocol = u.protocol || null;
        } catch {
          // ignore
        }
        const _p7 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'D', location: 'scripts/seed.ts:75', message: 'trying fallback mongo uri', data: { fbProtocol, fbHost }, timestamp: Date.now() };
        agentLog(_p7);
        fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p7) }).catch(() => {});
        // #endregion

        try {
          await client.close().catch(() => {});
          client = new MongoClient(fallbackUri, {
            serverSelectionTimeoutMS: 10_000,
            connectTimeoutMS: 10_000,
          });
          await client.connect();
          // #region agent log
          const _p8 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'D', location: 'scripts/seed.ts:115', message: 'fallback mongo connect succeeded', data: {}, timestamp: Date.now() };
          agentLog(_p8);
          fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p8) }).catch(() => {});
          // #endregion
        } catch (e2) {
          // #region agent log
          const _p9 = { sessionId: 'cf60a3', runId: 'pre-fix', hypothesisId: 'D', location: 'scripts/seed.ts:84', message: 'fallback mongo connect failed', data: { name: (e2 as any)?.name, code: (e2 as any)?.code, message: String((e2 as any)?.message ?? e2) }, timestamp: Date.now() };
          agentLog(_p9);
          fetch('http://127.0.0.1:7643/ingest/60c6dabe-db12-4b92-b4c1-438460149105', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf60a3' }, body: JSON.stringify(_p9) }).catch(() => {});
          // #endregion
          throw e2;
        }
      } else {
        // 2) Try converting to a direct connection URI automatically.
        const converted = convertMongoSrvToDirectUri(uri);
        if (converted) {
          try {
            await client.close().catch(() => {});
            client = new MongoClient(converted, {
              serverSelectionTimeoutMS: 10_000,
              connectTimeoutMS: 10_000,
            });
            await client.connect();
          } catch (e2) {
            // include original failure guidance
            console.error(
              'SRV connection failed and direct conversion also failed. ' +
                'If you are on a restricted network, set `MONGODB_URI_DIRECT` in `.env` to a non-`mongodb+srv` connection string.'
            );
            const ipConverted = await convertMongoSrvToDirectUriViaIp(uri).catch(() => null);
            let finalConverted = ipConverted;
            if (!finalConverted) {
              const srvHostsConverted = await convertMongoSrvToDirectUriViaSrvHosts(uri).catch(() => null);
              finalConverted = srvHostsConverted;

              if (!finalConverted) {
                const srvIpConverted = await convertMongoSrvToDirectUriViaSrvIps(uri).catch(() => null);
                finalConverted = srvIpConverted;
              }
            }
            if (!finalConverted) throw e2;

            await client.close().catch(() => {});
            client = new MongoClient(finalConverted, {
              serverSelectionTimeoutMS: 10_000,
              connectTimeoutMS: 10_000,
            });
            await client.connect();
          }
        } else {
          console.error(
            'SRV connection failed. Set `MONGODB_URI_DIRECT` in `.env` to a non-`mongodb+srv` connection string.'
          );
          throw e;
        }
      }
    } else {
      throw e;
    }
  }

  const db = client.db(dbName);

  // Upsert by stable ids so repeated runs remain safe.
  for (const empire of defaultEmpires) {
    await db.collection('empires').updateOne(
      { id: empire.id },
      { $set: empire },
      { upsert: true }
    );
  }

  for (const rep of defaultReps) {
    await db.collection('reps').updateOne(
      { id: rep.id },
      { $set: rep },
      { upsert: true }
    );
  }

  // Replace team collection so the About page always reflects the full
  // contents of `public/images/team`.
  await db.collection('team').deleteMany({});

  for (const member of seededTeamMembers) {
    await db.collection('team').updateOne(
      { id: member.id },
      { $set: member },
      { upsert: true }
    );
  }

  for (const step of DEFAULT_STEPS) {
    await db.collection('howItWorksSteps').updateOne(
      { number: step.number },
      { $set: step },
      { upsert: true }
    );
  }

  await client.close();
  console.log('DB seed completed');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

