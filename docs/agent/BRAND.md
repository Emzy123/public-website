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
| `public/brand/sinet-lockup-dark.png` | 1196 × 459 (@2x) / 598 × 230 (@1x) | Lockup on black/navy backgrounds | Pixel-faithful trimmed raster from source master |
| `public/brand/sinet-lockup-transparent.png` | 1196 × 459 | Lockup on transparent/light canvas | Outer black background keyed via boundary flood-fill |
| `public/brand/sinet-mark.png` | 512 × 512 | Standalone square brand icon (eagle + swoosh) | Center-cropped and padded |
| `public/favicon.ico` | 48 × 48 (multi-size ICO) | Browser tab favicon | Conforms to Next.js app conventions |
| `public/icon.png` | 512 × 512 | PWA / general app icon | High-resolution brand mark |
| `public/apple-icon.png` | 180 × 180 | Apple touch icon for iOS Safari | Square mark on dark brand background |
| `public/manifest-icon-192.png` | 192 × 192 | PWA manifest icon | Standard density Android / Web manifest |
| `public/manifest-icon-512.png` | 512 × 512 | PWA maskable manifest icon | High density Android / Web manifest |
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
| `gold-700` | `#A06E1B` | Deep gold / amber (accessible on light backgrounds) |
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
| `accent-text-on-light`| `var(--color-accent-text-on-light)` (`#A06E1B`) | Accessible gold text on white/light surfaces |
| `border` | `var(--color-border)` (`rgba(255, 255, 255, 0.12)`) | Subtle dividers and card outlines |
| `focus-ring` | `var(--color-focus-ring)` (`#2153D2`) | High-visibility focus indicators |

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
   - Contrast ratio is only ~2.13:1, severely violating WCAG AA minimums (4.5:1).
   - Use `accent-text-on-light` (`gold-700` `#A06E1B`) for text on white or light surfaces (achieves ≥ 4.5:1).
2. **`gold-500` (`#E0A92E`) on `ink` (`#0A0A0F`) and `navy` (`#1B234C`):**
   - Contrast on ink is ~9.28:1 (passes WCAG AAA).
   - Contrast on navy is ~7.23:1 (passes WCAG AAA).
3. **`primary` (`#143DB1`) on White:**
   - Contrast is ~8.99:1 (passes WCAG AAA).
4. **All assertions verified automatically in unit test `src/tests/brand/contrast.test.ts`.**

---

## 5. Tagline
Official brand tagline:
> **"Building Africa's Future Systems"**
(Replaces legacy footer tagline "Build Africa's future.")

---

## 6. Inventory of Hard-Coded Hexes for Future Refactoring (R2/R5)
The following legacy colors remain active on non-restyled pages and components, to be systematically migrated in R2/R5:
- `#071026`: Dark midnight surface used in `verify/page.tsx`, `AdminShell.tsx`, `manifest.ts`
- `#0d1a4a`: Legacy primary dark navy used across `Header.tsx`, `Footer.tsx`, email templates
- `#16296b`: Legacy primary main blue in `globals.css`
- `#d9a23c`: Legacy gold-main
- `#eccb7c`: Legacy gold-light
- `#b77d21`: Legacy gold-dark
- `#d9711b`: Legacy terracotta/orange accent
- `#f6f2e8`: Legacy sand/canvas background
- `#fbf7ee`: Legacy canvas-subtle
- `#0b1222`: Admin sidebar background in `AdminShell.tsx`
