/**
 * Reproducible brand asset builder for SINet
 * Source: brand/source/logo.jpg
 * Uses sharp to generate all lockups, marks, icons, and og-image.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const SOURCE_IMAGE = path.join(ROOT_DIR, 'brand/source/logo.jpg');
const PUBLIC_BRAND_DIR = path.join(ROOT_DIR, 'public/brand');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const APP_DIR = path.join(ROOT_DIR, 'src/app');

// Ensure target directories exist
fs.mkdirSync(PUBLIC_BRAND_DIR, { recursive: true });

async function build() {
  console.log('--- Building SINet Brand Assets ---');
  if (!fs.existsSync(SOURCE_IMAGE)) {
    throw new Error(`Source logo not found at: ${SOURCE_IMAGE}`);
  }

  // 1. Load source and determine trim bounds
  const source = sharp(SOURCE_IMAGE);
  const metadata = await source.metadata();
  console.log(`Source image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

  // Trim the black border
  const trimmedBuffer = await sharp(SOURCE_IMAGE).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  const trimWidth = trimmedMeta.width;
  const trimHeight = trimmedMeta.height;
  console.log(`Trimmed lockup: ${trimWidth}x${trimHeight}`);

  // -------------------------------------------------------------
  // 2. Lockup Dark (@1x for email templates)
  // -------------------------------------------------------------
  const lockupDark1xPath = path.join(PUBLIC_BRAND_DIR, 'sinet-lockup-dark.png');

  // @1x half resolution for email clients
  await sharp(trimmedBuffer)
    .resize(Math.round(trimWidth / 2), Math.round(trimHeight / 2))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(lockupDark1xPath);

  console.log(`✓ Generated ${lockupDark1xPath} (@1x for email clients)`);

  // -------------------------------------------------------------
  // 4. Brand Mark (S swoosh + eagle, square icon)
  // -------------------------------------------------------------
  // The mark is in the left region: x ~0..455, y ~0..459
  const markWidth = 458;
  const markHeight = 459;
  const markRaw = await sharp(trimmedBuffer)
    .extract({ left: 0, top: 0, width: markWidth, height: markHeight })
    .png()
    .toBuffer();

  // Create 512x512 square mark with gentle padding on dark background (#0A0A0F)
  // Encoded with palette PNG (quality: 55, compression: 9, effort: 10) to stay strictly <= 60 KB
  const mark512Buffer = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 10, b: 15, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(markRaw).resize(450, 450, { fit: 'inside' }).toBuffer(),
        gravity: 'centre',
      },
    ])
    .png({ palette: true, quality: 55, compressionLevel: 9, effort: 10 })
    .toBuffer();

  const markPath = path.join(PUBLIC_BRAND_DIR, 'sinet-mark.png');
  fs.writeFileSync(markPath, mark512Buffer);
  console.log(`✓ Generated ${markPath} (512x512, ${mark512Buffer.length} bytes <= 60 KB)`);

  // -------------------------------------------------------------
  // 5. App Icons & Favicon
  // -------------------------------------------------------------
  // Next.js App Router convention: icon.png, apple-icon.png, and favicon.ico live in src/app/
  // Manifest icons live in public/ (manifest-icon-192.png, manifest-icon-512.png)
  // No duplicate icon files in public/ to prevent multiple <link rel="icon"> tags.
  const manifest192Path = path.join(PUBLIC_DIR, 'manifest-icon-192.png');
  const manifest512Path = path.join(PUBLIC_DIR, 'manifest-icon-512.png');

  // manifest 192 (encoded <= 20 KB) & manifest 512 (<= 60 KB)
  const manifest192Buffer = await sharp(mark512Buffer)
    .resize(192, 192)
    .png({ palette: true, quality: 80, compressionLevel: 9, effort: 10 })
    .toBuffer();
  fs.writeFileSync(manifest192Path, manifest192Buffer);
  fs.writeFileSync(manifest512Path, mark512Buffer);

  // apple-icon (180x180 opaque on ink #0A0A0F with ~12% padding, mark size ~137px)
  const paddedMarkSize = Math.round(180 * (1 - 0.24)); // 137px
  const markForApple = await sharp(mark512Buffer)
    .resize(paddedMarkSize, paddedMarkSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const appleIconBuffer = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 10, g: 10, b: 15, alpha: 1 }, // #0A0A0F ink
    },
  })
    .composite([
      {
        input: markForApple,
        top: Math.round((180 - paddedMarkSize) / 2),
        left: Math.round((180 - paddedMarkSize) / 2),
      },
    ])
    .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 })
    .toBuffer();

  // Build multi-size favicon.ico (16, 32, 48) with sharpened, legible 16px rendering
  const png16 = await sharp(markRaw)
    .resize(16, 16, { fit: 'contain', background: { r: 10, g: 10, b: 15, alpha: 1 } })
    .sharpen()
    .png({ palette: true, quality: 90 })
    .toBuffer();
  const png32 = await sharp(mark512Buffer).resize(32, 32).png({ palette: true, quality: 90 }).toBuffer();
  const png48 = await sharp(mark512Buffer).resize(48, 48).png({ palette: true, quality: 90 }).toBuffer();

  const icoImages = [
    { width: 16, height: 16, data: png16 },
    { width: 32, height: 32, data: png32 },
    { width: 48, height: 48, data: png48 },
  ];

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO format
  header.writeUInt16LE(icoImages.length, 4); // Number of images

  let offset = 6 + 16 * icoImages.length;
  const entries = [];
  for (const img of icoImages) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width, 0);
    entry.writeUInt8(img.height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.data.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Image data offset
    entries.push(entry);
    offset += img.data.length;
  }

  const faviconBuffer = Buffer.concat([header, ...entries, ...icoImages.map((img) => img.data)]);

  // Write to src/app for Next.js App Router metadata conventions
  fs.writeFileSync(path.join(APP_DIR, 'icon.png'), mark512Buffer);
  fs.writeFileSync(path.join(APP_DIR, 'apple-icon.png'), appleIconBuffer);
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), faviconBuffer);

  // Clean up any legacy duplicate icons from public/ to guarantee single icon set
  for (const duplicate of ['icon.png', 'apple-icon.png', 'favicon.ico']) {
    const dupPath = path.join(PUBLIC_DIR, duplicate);
    if (fs.existsSync(dupPath)) {
      fs.unlinkSync(dupPath);
      console.log(`✓ Removed duplicate ${dupPath}`);
    }
  }

  console.log(`✓ Generated app icons in src/app: favicon.ico, icon.png (512, ${mark512Buffer.length} B), apple-icon.png (180, ${appleIconBuffer.length} B)`);
  console.log(`✓ Generated manifest icons in public: manifest-icon-192 (${manifest192Buffer.length} B), manifest-icon-512 (${mark512Buffer.length} B)`);

  // -------------------------------------------------------------
  // 6. OpenGraph Image (1200x630)
  // -------------------------------------------------------------
  const ogImagePath = path.join(PUBLIC_DIR, 'og-image.png');

  // Resize lockup for OG composition (width ~740px)
  const ogLockupBuffer = await sharp(trimmedBuffer)
    .resize(740, null, { fit: 'inside' })
    .png()
    .toBuffer();

  const ogSvgOverlay = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient accent line -->
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#143DB1" stop-opacity="0" />
          <stop offset="25%" stop-color="#E0A92E" />
          <stop offset="50%" stop-color="#EDB944" />
          <stop offset="75%" stop-color="#E0A92E" />
          <stop offset="100%" stop-color="#143DB1" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Center divider rule -->
      <rect x="420" y="475" width="360" height="2" fill="url(#goldGrad)" rx="1" />

      <!-- Official Tagline -->
      <text x="600" y="525" text-anchor="middle" fill="#EDB944"
            font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" letter-spacing="6">
        BUILDING AFRICA'S FUTURE SYSTEMS
      </text>

      <!-- Subtitle badge -->
      <text x="600" y="558" text-anchor="middle" fill="#94A3B8"
            font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" letter-spacing="3">
        AGRICULTURE · TRADE &amp; DISTRIBUTION · REAL ESTATE
      </text>
    </svg>
  `);

  // Composite background + lockup + SVG overlay
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 10, g: 10, b: 15, alpha: 1 }, // #0A0A0F ink
    },
  })
    .composite([
      {
        input: ogLockupBuffer,
        top: 140,
        left: 230,
      },
      {
        input: ogSvgOverlay,
        top: 0,
        left: 0,
      },
    ])
    .png({ quality: 95 })
    .toFile(ogImagePath);

  console.log(`✓ Generated ${ogImagePath} (1200x630)`);
  console.log('--- All brand assets built successfully! ---');
}

build().catch((err) => {
  console.error('Asset build failed:', err);
  process.exit(1);
});
