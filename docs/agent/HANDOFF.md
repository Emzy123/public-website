# Brand Foundation Handoff

## Overview
This document tracks the execution and handoff for the **Brand Foundation Phase** (`agent/brand-foundation`).
Created from `master` (`86c902a`).

## Objective
Establish the foundational brand assets, design tokens, typography, and contrast rules without full page restyles:
1. Source logo preserved at `brand/source/logo.jpg`.
2. Reproducible asset builder script at `scripts/brand/build-assets.mjs` producing all standard brand icons, lockups, and social preview assets.
3. Centralized `<Logo />` component (`src/components/brand/Logo.tsx`) acting as the single source of truth for logo file references across public layouts, admin, and emails.
4. Tailwind and CSS variable design tokens mapped to the SINet brand specification.
5. Google Fonts (Sora & Inter) self-hosted via `next/font/google`.
6. Contrast test verifying WCAG AA compliance and forbidding `gold-500` on white for body text.
7. Official tagline updated to "Building Africa's Future Systems".

## Key References
- Brand token and asset specs: `docs/agent/BRAND.md`
- Session progress: `docs/agent/PROGRESS.md`
- Blockers log: `docs/agent/BLOCKERS.md`
- Legal copy review: `docs/agent/COPY_REVIEW.md`

## 2026-11-24 09:27 WAT: Next 16 upgrade live (PR #9, a49ace8)
- Next 16.4.6, React 19.3.1, Node 22.x (.nvmrc 22), middleware.ts -> proxy.ts, build `next build --webpack`, @edge-csrf/nextjs override.
- Gates: tsc 0, lint 0 err/4 warn, 582/582 tests, smoke 81/0, crawl 62/0.
- Post-merge www check PASS (9 paths, verify graceful, /admin/audit redirect, header logo no box).
- Rollback: Vercel Instant Rollback, or `git revert a49ace8` via PR.
- Pre-existing, not regressions: /news thumbnails 404 (fallback seed posts, posts table missing); doubled SIN-SIN member ID; /about Key Achievement empty; duplicate "| SINet" titles.
- Follow-ups: /admin/audit DB query at build time; /gallery use unstable_rethrow; all routes dynamic (check TTFB R7); drop @edge-csrf override when upstream supports 16; handlebars dev override; 4 lint warnings.
