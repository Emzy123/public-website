/** @jest-environment node */

import fs from 'fs';
import path from 'path';
import manifest from '@/app/manifest';

describe('Offline PWA & Budget Android Optimizations', () => {
  const rootDir = process.cwd();

  test('PWA manifest returns valid standalone metadata and branding for Nigerian students', () => {
    const data = manifest();
    expect(data.name).toBe('SINet');
    expect(data.short_name).toBe('SINet');
    expect(data.start_url).toBe('/portal');
    expect(data.display).toBe('standalone');
    expect(data.background_color).toBe('#071026');
    expect(data.theme_color).toBe('#052e16');
    expect(data.orientation).toBe('portrait');
    expect(Array.isArray(data.icons)).toBe(true);
    expect(data.icons!.length).toBeGreaterThanOrEqual(1);
  });

  test('Service worker public/sw.js exists and defines precaching, offline fallback and cache name', () => {
    const swPath = path.join(rootDir, 'public', 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain("const CACHE_NAME = 'sinet-cache-v1'");
    expect(swContent).toContain("const OFFLINE_URL = '/offline'");
    expect(swContent).toContain("addEventListener('install'");
    expect(swContent).toContain("addEventListener('activate'");
    expect(swContent).toContain("addEventListener('fetch'");
    expect(swContent).toContain("request.mode === 'navigate'");
    expect(swContent).toContain('/api/verify/');
  });

  test('middleware.ts includes worker-src and manifest-src in CSP', () => {
    const middlewarePath = path.join(rootDir, 'src', 'middleware.ts');
    const content = fs.readFileSync(middlewarePath, 'utf-8');

    expect(content).toContain("worker-src 'self';");
    expect(content).toContain("manifest-src 'self';");
    expect(content).toContain('sw');
    expect(content).toContain('webmanifest');
  });

  test('offline fallback page component exists and handles local storage pass recovery', () => {
    const offlinePagePath = path.join(rootDir, 'src', 'app', 'offline', 'page.tsx');
    expect(fs.existsSync(offlinePagePath)).toBe(true);

    const content = fs.readFileSync(offlinePagePath, 'utf-8');
    expect(content).toContain('sinet_cached_member_card');
    expect(content).toContain('DigitalMemberIdCard');
    expect(content).toContain('Offline Digital Member ID');
  });

  test('DigitalMemberIdCard persists credentials to localStorage and provides offline pass generation', () => {
    const cardPath = path.join(rootDir, 'src', 'components', 'members', 'DigitalMemberIdCard.tsx');
    const content = fs.readFileSync(cardPath, 'utf-8');

    expect(content).toContain("localStorage.setItem('sinet_cached_member_card'");
    expect(content).toContain('handleSaveOfflinePass');
    expect(content).toContain('SINet-Pass-');
    expect(content).toContain('grid-cols-2');
  });
});
