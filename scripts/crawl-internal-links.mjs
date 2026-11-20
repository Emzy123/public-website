#!/usr/bin/env node
/**
 * Crawl internal links from sitemap, nav, and footer on a running local build.
 * Fails on any 404 or 500. Used by CI smoke (B7).
 *
 * Usage: node scripts/crawl-internal-links.mjs [BASE_URL]
 */
import { setTimeout as delay } from 'node:timers/promises';

const BASE = (process.argv[2] || process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const MAX_PAGES = 80;
const FETCH_TIMEOUT_MS = 15000;

const SEED_PATHS = [
  '/',
  '/about',
  '/sectors',
  '/chapters',
  '/student-network',
  '/membership',
  '/gallery',
  '/news',
  '/contact',
  '/academy',
  '/join',
  '/verify',
  '/privacy',
  '/terms',
  '/sign-in',
];

function toPath(href, currentPath) {
  if (!href) return null;
  let raw = href.trim();
  if (
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:') ||
    raw.startsWith('javascript:') ||
    raw.startsWith('#') ||
    raw.startsWith('data:')
  ) {
    return null;
  }
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const u = new URL(raw);
      const base = new URL(BASE);
      if (u.host !== base.host) return null;
      raw = u.pathname + u.search;
    } else if (raw.startsWith('//')) {
      return null;
    } else if (!raw.startsWith('/')) {
      const basePath = currentPath.endsWith('/') ? currentPath : currentPath.replace(/\/[^/]*$/, '/');
      raw = new URL(raw, `http://local${basePath}`).pathname;
    }
  } catch {
    return null;
  }
  // Drop hash
  raw = raw.split('#')[0];
  // Skip API and admin (auth walls) and static assets
  if (
    raw.startsWith('/api/') ||
    raw.startsWith('/admin') ||
    raw.startsWith('/_next') ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|xml|txt|webmanifest)$/i.test(raw)
  ) {
    return null;
  }
  return raw || '/';
}

function extractHrefs(html) {
  const hrefs = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    hrefs.push(m[1]);
  }
  return hrefs;
}

async function fetchStatus(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'GET',
      redirect: 'manual',
      signal: ctrl.signal,
      headers: { Accept: 'text/html,application/xhtml+xml,*/*' },
    });
    return { status: res.status, location: res.headers.get('location'), body: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const queue = [...SEED_PATHS];
  const seen = new Set();
  const failures = [];
  let ok = 0;

  // Seed from sitemap if present
  try {
    const sm = await fetch(`${BASE}/sitemap-0.xml`).then((r) => (r.ok ? r.text() : ''));
    const sm2 = sm || (await fetch(`${BASE}/sitemap.xml`).then((r) => (r.ok ? r.text() : '')));
    const locRe = /<loc>([^<]+)<\/loc>/gi;
    let m;
    while ((m = locRe.exec(sm2))) {
      const p = toPath(m[1], '/');
      if (p && !queue.includes(p)) queue.push(p);
    }
  } catch {
    /* sitemap optional */
  }

  while (queue.length > 0 && seen.size < MAX_PAGES) {
    const path = queue.shift();
    if (!path || seen.has(path)) continue;
    seen.add(path);

    let result;
    try {
      result = await fetchStatus(path);
    } catch (err) {
      failures.push({ path, status: 0, detail: String(err) });
      continue;
    }

    // Follow one hop of redirects (301/302/307/308) to public destinations
    if ([301, 302, 307, 308].includes(result.status) && result.location) {
      const next = toPath(result.location, path);
      if (next && !seen.has(next)) queue.push(next);
      ok += 1;
      process.stdout.write(`→ ${path} ${result.status}\n`);
      continue;
    }

    if (result.status === 404 || result.status >= 500) {
      failures.push({ path, status: result.status, detail: 'hard failure' });
      process.stdout.write(`✗ ${path} ${result.status}\n`);
      continue;
    }

    ok += 1;
    process.stdout.write(`✓ ${path} ${result.status}\n`);

    if (result.status === 200 && result.body) {
      for (const href of extractHrefs(result.body)) {
        const next = toPath(href, path);
        if (next && !seen.has(next) && !queue.includes(next)) queue.push(next);
      }
    }

    await delay(15);
  }

  console.log('');
  console.log(`Crawl complete: ${ok} ok, ${failures.length} failed, ${seen.size} visited (${BASE})`);
  if (failures.length) {
    for (const f of failures) {
      console.error(`FAIL ${f.path} → ${f.status} ${f.detail}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
