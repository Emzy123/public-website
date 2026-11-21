import React from 'react';
import Image from 'next/image';

export type LogoVariant = 'full' | 'compact' | 'mark' | 'lockup';
export type LogoTheme = 'dark' | 'light';
export type LogoPresetSize = 'sm' | 'md' | 'lg' | 'xl';

export const BRAND_ASSETS = {
  // Transparent brand assets
  full: '/brand/sinet-lockup.png',
  full2x: '/brand/sinet-lockup@2x.png',
  compact: '/brand/sinet-lockup-compact.png',
  compact2x: '/brand/sinet-lockup-compact@2x.png',
  mark: '/brand/sinet-mark.png',
  mark2x: '/brand/sinet-mark@2x.png',
  mark512: '/brand/sinet-mark-512.png',

  // Preserved for email clients / dark header cells
  lockupDark: '/brand/sinet-lockup-dark.png',
  lockupDark2x: '/brand/sinet-lockup-dark.png',
  lockupTransparent: '/brand/sinet-lockup@2x.png',
} as const;

/**
 * Returns the canonical static asset URL for the given logo variant and theme.
 * All email templates and default configurations reference this helper.
 */
export function getLogoAssetUrl(
  variant: LogoVariant = 'full',
  theme: LogoTheme = 'dark',
  options?: { absolute?: boolean }
): string {
  let assetPath: string;
  if (variant === 'mark') {
    assetPath = BRAND_ASSETS.mark;
  } else if (variant === 'compact') {
    assetPath = BRAND_ASSETS.compact;
  } else if (variant === 'lockup' && theme === 'dark') {
    // Preserved for email templates (dark header cell)
    assetPath = BRAND_ASSETS.lockupDark;
  } else {
    assetPath = BRAND_ASSETS.full;
  }

  if (options?.absolute) {
    return `https://www.sinet.africa${assetPath}`;
  }
  return assetPath;
}

const NATIVE_ASPECT_RATIOS: Record<'full' | 'compact' | 'mark', number> = {
  full: 960 / 367, // ~2.6158
  compact: 342 / 96, // 3.5625
  mark: 192 / 190, // ~1.0105
};

export interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoPresetSize | number;
  width?: number;
  height?: number;
  priority?: boolean;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}

export function Logo({
  variant = 'full',
  size,
  width,
  height,
  priority = false,
  alt = 'SINet',
  className,
  style,
  onError,
}: LogoProps) {
  // Map 'lockup' to 'full'
  const normalizedVariant: 'full' | 'compact' | 'mark' =
    variant === 'lockup' ? 'full' : variant;

  const src =
    normalizedVariant === 'full'
      ? BRAND_ASSETS.full2x
      : normalizedVariant === 'compact'
      ? BRAND_ASSETS.compact2x
      : BRAND_ASSETS.mark2x;

  const ratio = NATIVE_ASPECT_RATIOS[normalizedVariant];

  let w: number;
  let h: number;

  if (width && height) {
    w = width;
    h = height;
  } else if (width && !height) {
    w = width;
    h = Math.round(width / ratio);
  } else if (!width && height) {
    h = height;
    w = Math.round(height * ratio);
  } else if (typeof size === 'number') {
    if (normalizedVariant === 'mark') {
      w = size;
      h = size;
    } else if (normalizedVariant === 'compact') {
      h = size;
      w = Math.round(size * ratio);
    } else {
      w = size;
      h = Math.round(size / ratio);
    }
  } else if (typeof size === 'string') {
    const presets: Record<
      'full' | 'compact' | 'mark',
      Record<LogoPresetSize, { width: number; height: number }>
    > = {
      full: {
        sm: { width: 160, height: 61 },
        md: { width: 200, height: 76 },
        lg: { width: 280, height: 107 },
        xl: { width: 560, height: 214 },
      },
      compact: {
        sm: { width: 114, height: 32 },
        md: { width: 143, height: 40 },
        lg: { width: 171, height: 48 },
        xl: { width: 228, height: 64 },
      },
      mark: {
        sm: { width: 28, height: 28 },
        md: { width: 36, height: 36 },
        lg: { width: 48, height: 48 },
        xl: { width: 64, height: 64 },
      },
    };
    const p = presets[normalizedVariant][size] || presets[normalizedVariant].md;
    w = p.width;
    h = p.height;
  } else {
    // Default fallback sizing
    if (normalizedVariant === 'full') {
      w = 200;
      h = 76;
    } else if (normalizedVariant === 'compact') {
      w = 143;
      h = 40;
    } else {
      w = 36;
      h = 36;
    }
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      priority={priority}
      className={className}
      style={style}
      onError={onError}
    />
  );
}

export default Logo;
