# SINet Brand Foundation Specification

> Source of truth for brand tokens, visual assets, typography, and accessibility guidelines.  
> Established in phase `agent/brand-foundation` from the original master raster logo.

---

## 1. Master Source Logo
- **Path in repository:** `brand/source/logo.jpg` (tracked in git)
- **Format:** JPEG JFIF standard 1.01, progressive, 72 DPI, 3 channels (sRGB)
- **File size:** 61,901 bytes
- **Original Dimensions:** 1280 × 853 px
- **Trimmed Artwork Bounds:** 1196 × 459 px (offset: left 47 px, top 162 px)
- **Extracted Mark Bounds (S-Swoosh + Eagle):** ~455 × 458 px
- **Status:** Interim master raster (vector SVG trace scheduled for future phase).

---

## 2. Asset Set
All generated assets in `public/brand/` and `public/` are interim rasters derived reproducibly via `scripts/brand/build-assets.mjs` using `sharp`:

| Asset Path | Target Dimensions | Purpose | Notes |
|------------|-------------------|---------|-------|
| `public/brand/sinet-lockup.png` / `@2x` | 480 × 183 (@1x) / 960 × 367 (@2x) | Transparent full brand lockup with tagline | Used in hero and footer |
| `public/brand/sinet-lockup-compact.png` / `@2x` | 171 × 48 (@1x) / 342 × 96 (@2x) | Transparent compact lockup without tagline | Used in header, mobile menu, auth screens |
| `public/brand/sinet-mark.png` / `@2x` / `-512` | 96 × 95 / 192 × 190 / 512 × 512 | Transparent square brand icon (eagle + swoosh) | Admin shell, favicons, app icons |
| `public/brand/sinet-lockup-dark.png` | 598 × 230 (@1x) | Lockup on dark backgrounds for email clients | Preserved specifically for email tables |
| `src/app/favicon.ico` | 16 × 16, 32 × 32, 48 × 48 | Multi-resolution tab icon | Transparent mark |
| `src/app/icon.png` | 512 × 512 | App icon / PWA | Transparent mark |
| `src/app/apple-icon.png` | 180 × 180 | Apple touch icon for iOS Safari | Mark centered on ink `#0A0A0F` with ~12% padding |
| `public/manifest-icon-192.png` | 192 × 192 | PWA manifest icon | Standard density Web manifest |
| `public/manifest-icon-512.png` | 512 × 512 | PWA manifest icon | High density Web manifest |
| `public/og-image.png` | 1200 × 630 | OpenGraph & Twitter preview image | Lockup centered on `#0A0A0F` with tagline "BUILDING AFRICA'S FUTURE SYSTEMS" |

### Background Keying Assessment
- The original master logo is a lossy JPEG rendered on black (`#000000`).
- Simple luminance keying erodes the deep navy shading (`#1B234C`) in the eagle and leaves anti-aliased black halos around gold lettering.
- Using connected-component flood fill from the exterior preserves 10,750+ interior navy pixels and fine wing shadows.
- Transparent lockup is provided for light backgrounds; however, because of black matte edge pixels in the source JPEG, dark backgrounds remain preferred until the vector SVG asset is introduced.

---

## 3. Design Tokens

### 3.1 Primitive Color Palette
| Token Name | Hex Value | Role |
|------------|-----------|------|
| `ink` | `#0A0A0F` | Deep brand ink base, near-black |
| `black` | `#000000` | True black |
| `navy` | `#1B234C` | Deep navy shadow / midnight |
| `blue-700` | `#022892` | Deep electric blue |
| `blue-600` | `#143DB1` | **Primary Brand Blue** |
| `blue-500` | `#2153D2` | Bright interactive blue |
| `blue-300` | `#8BB4F8` | Light interactive blue for text & links on dark surfaces |
| `gold-700` | `#946318` | Deep gold / amber (accessible on white & #F6F2E8) |
| `gold-500` | `#E0A92E` | **Brand Accent Gold** (primary accent) |
| `gold-300` | `#EDB944` | Highlight gold / warm sunshine |
| `cream` | `#DBD1A5` | Warm cream / light accent surface |

### 3.2 Semantic Aliases
| Alias | Value / Reference | Usage |
|-------|-------------------|-------|
| `bg` | `var(--color-bg)` (`#0A0A0F`) | Default canvas background |
| `surface` | `var(--color-surface)` (`#1B234C`) | Card, container, and sheet backgrounds |
| `surface-raised` | `var(--color-surface-raised)` (`#222B59`) | Modals, elevated cards, dropdowns |
| `text` | `var(--color-text)` (`#F6F2E8`) | High-contrast body & heading text on dark |
| `text-muted` | `var(--color-text-muted)` (`#94A3B8`) | Secondary / tertiary copy, captions |
| `primary` | `var(--color-primary)` (`#143DB1`) | Primary buttons, active tabs, core highlights |
| `primary-hover` | `var(--color-primary-hover)` (`#022892`) | Hover/active states for primary actions |
| `accent` | `var(--color-accent)` (`#E0A92E`) | Key accents, badge highlights, callouts |
| `accent-text-on-light`| `var(--color-accent-text-on-light)` (`#946318`) | Accessible gold text on white/light surfaces (>= 4.5:1) |
| `link-on-dark`| `var(--color-link-on-dark)` (`#8BB4F8`) | Accessible interactive link copy on dark surfaces (>= 4.5:1) |
| `border` | `var(--color-border)` (`rgba(255, 255, 255, 0.12)`) | Subtle dividers and card outlines |
| `focus-ring` | `var(--color-focus-ring)` (`#2153D2`) | High-visibility focus indicators (>= 3:1) |

### 3.3 Typography Scale
- `font-heading`: Sora (weights 600, 700; display: swap)
- `font-body`: Inter (weights 400, 500, 600; display: swap)
- Type scale:
  - `xs`: 0.75rem (12px), line-height 1rem
  - `sm`: 0.875rem (14px), line-height 1.25rem
  - `base`: 1rem (16px), line-height 1.5rem
  - `lg`: 1.125rem (18px), line-height 1.75rem
  - `xl`: 1.25rem (20px), line-height 1.75rem
  - `2xl`: 1.5rem (24px), line-height 2rem
  - `3xl`: 1.875rem (30px), line-height 2.25rem
  - `4xl`: 2.25rem (36px), line-height 2.5rem
  - `5xl`: 3rem (48px), line-height 1.1
  - `6xl`: 3.75rem (60px), line-height 1

### 3.4 Radii, Shadows & Spacing
- **Radii:**
  - `sm`: 0.25rem (4px)
  - `md`: 0.5rem (8px)
  - `lg`: 0.75rem (12px)
  - `xl`: 1rem (16px)
  - `2xl`: 1.5rem (24px)
  - `full`: 9999px
- **Shadows:**
  - `brand-sm`: `0 1px 2px 0 rgba(10, 10, 15, 0.05)`
  - `brand-md`: `0 4px 6px -1px rgba(10, 10, 15, 0.1)`
  - `brand-lg`: `0 10px 15px -3px rgba(10, 10, 15, 0.1)`
  - `brand-xl`: `0 20px 25px -5px rgba(10, 10, 15, 0.1)`
  - `gold-glow`: `0 0 24px -4px rgba(224, 169, 46, 0.35)`
  - `blue-glow`: `0 0 24px -4px rgba(20, 61, 177, 0.35)`
- **Spacing:**
  - `18`: 4.5rem (72px)
  - `22`: 5.5rem (88px)
  - `30`: 7.5rem (120px)

---

## 4. Accessibility & Contrast Guidelines (WCAG AA)

1. **`gold-500` (`#E0A92E`) on White (`#FFFFFF`) is STRICTLY PROHIBITED for body text.**
   - Contrast ratio is only ~2.12:1, severely violating WCAG AA minimums (4.5:1).
   - Use `accent-text-on-light` (`gold-700` `#946318`) for text on white or light surfaces (achieves 5.18:1 on `#FFFFFF`, 4.63:1 on `#F6F2E8`, passing WCAG AA for normal text).
2. **`gold-500` (`#E0A92E`) on `ink` (`#0A0A0F`) and `navy` (`#1B234C`):**
   - Contrast on ink is ~9.30:1 (passes WCAG AAA).
   - Contrast on navy is ~7.10:1 (passes WCAG AAA).
3. **`primary` (`#143DB1`) on White / White on `primary`:**
   - Contrast is ~9.00:1 (passes WCAG AAA).
4. **Dark-first Links:**
   - Primary blue (`#143DB1`) on ink is 2.19:1 (not allowed for text/links on dark).
   - Use `link-on-dark` (`blue-300` `#8BB4F8`): 9.39:1 on ink, 7.17:1 on navy (passes WCAG AAA).
5. **Text-Muted:**
   - `text-muted` (`#94A3B8`): 7.70:1 on ink, 5.89:1 on navy (passes WCAG AA/AAA).
6. **Focus Ring:**
   - `focus-ring` (`#2153D2`): 3.04:1 vs ink (passes non-text UI component WCAG AA ≥ 3:1).
7. **All assertions verified automatically in unit test `src/lib/brand/contrast.test.ts`.**

---

## 5. Tagline
Official brand tagline:
> **"Building Africa's Future Systems"**
(Replaces legacy footer tagline "Build Africa's future.")

---

## 6. Inventory of Hard-Coded Hexes & Old->New Mapping for R2/R5
The following legacy colors remain active on non-restyled pages and components, with their target brand token equivalents for systematic migration during R2/R5:

| Legacy Hex | Old Usage / Role | Target Token | New Hex | Notes |
|------------|------------------|--------------|---------|-------|
| `#16296b` | Legacy primary blue-light | `primary` / `blue-600` | `#143DB1` | Core interactive primary |
| `#0d1a4a` | Legacy navy / primary-dark | `surface` / `navy` | `#1B234C` | Container/card surface |
| `#071026` | Legacy dark ink / canvas | `bg` / `ink` | `#0A0A0F` | Canvas background |
| `#d9a23c` | Legacy gold-main | `accent` / `gold-500` | `#E0A92E` | Brand accent gold |
| `#eccb7c` | Legacy gold-light | `gold-300` | `#EDB944` | Warm sunshine highlight |
| `#b77d21` | Legacy gold-dark | `gold-700` / `accent-text-on-light` | `#946318` | Accessible gold on light (≥ 4.5:1) |
| `#d9711b` | Legacy terracotta | `accent` / `gold-500` | `#E0A92E` | Accent migration target |
| `#f6f2e8` | Legacy sand / light canvas | `text` / `cream` | `#F6F2E8` / `#DBD1A5` | Text on dark canvas / warm surface |
| `#fbf7ee` | Legacy canvas-subtle | `cream` | `#DBD1A5` | Warm cream tint |
| `#0b1222` | Admin sidebar background | `surface-raised` | `#222B59` | Raised surface |
