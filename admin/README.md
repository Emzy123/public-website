# SINet Admin Dashboard

Content management system for the SINet public website.

## Access

- URL: `/admin`
- Login: `/admin/login`

Set credentials in `.env.local`:

```bash
ADMIN_EMAIL=admin@sinet.africa
ADMIN_PASSWORD_HASH=<output of npx tsx scripts/hash-admin-password.ts "your-secure-password">
ADMIN_SESSION_SECRET=random-32-char-secret
```

`ADMIN_SESSION_SECRET` can reuse `CSRF_SECRET` if not set separately.

## Structure

```
admin/
├── types/          # CMS content TypeScript types
├── lib/
│   ├── auth.ts     # JWT session management
│   └── cms/
│       ├── defaults.ts    # Fallback content (from original hardcoded values)
│       ├── keys.ts        # CMS content keys
│       └── repository.ts  # MongoDB read/write
├── components/     # Admin UI (editors, layout)
└── hooks/          # Client-side CMS editor hook

src/app/admin/      # Next.js routes (login, dashboard, editors)
src/app/api/admin/  # Auth + content API
```

## Editable content

| Key | Admin page | Public usage |
|-----|------------|--------------|
| `hero-slides` | Hero Carousel | Homepage hero |
| `home` | Home Sections | All homepage sections below hero |
| `empires-page` | Empires Page | `/empires` deep-dive |
| `about` | About Page | `/about` (origin, founder, team, timeline, CTA) |
| `blueprint` | Blueprint Page | `/blueprint` cycle steps |
| `transparency` | Transparency | `/transparency` FAQ + commitments |
| `impact` | Impact Page | `/impact` student movement + roles |
| `investor-journey` | Investor Journey | `/investor-journey` tiers, timeline, compounding |
| `returns` | Returns Page | `/returns` metrics + track record |
| `academy` | Academy Page | `/academy` curriculum + learning path |
| `connect` | Connect Page | `/connect` inquiry form options |
| `site-settings` | Site Settings | Contact, social, navigation, footer |

## Seed content

Populate MongoDB with current site defaults:

```bash
npm run seed:cms
```

Safe to re-run — only seeds keys that don't exist yet.

## Image uploads

CMS editors (hero carousel, empires, about team/founder) support direct image upload.

- Uploads are stored in MongoDB GridFS (`cms_media` bucket)
- Served publicly at `/api/media/{id}`
- Max file size: 4MB
- Allowed types: JPEG, PNG, WebP, GIF, SVG
- Requires `MONGODB_URI` and `MONGODB_DB` (same as contact/academy forms)

You can still paste external URLs (e.g. Unsplash) or existing `/images/…` paths manually.

## Drafts and publishing

CMS edits use a **draft → publish** workflow:

1. **Save Draft** — stores changes without affecting the live site
2. **Preview** — opens the public page in a new tab with draft content (1-hour preview session)
3. **Publish** — promotes the draft to live content

The public site always reads published content unless preview mode is active.

## Data storage

All CMS content is stored in MongoDB collection `cms_content`:

```json
{ "key": "hero-slides", "data": [...], "updatedAt": "...", "updatedBy": "admin@..." }
```

Public pages read via `getCmsContent()` with automatic fallback to `admin/lib/cms/defaults.ts` when MongoDB is unavailable.
