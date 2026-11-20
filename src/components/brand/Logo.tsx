import React from 'react';
import Image from 'next/image';

export type LogoVariant = 'lockup' | 'mark';
export type LogoTheme = 'dark' | 'light';
export type LogoPresetSize = 'sm' | 'md' | 'lg' | 'xl';

export const BRAND_ASSETS = {
  lockupDark: '/brand/sinet-lockup-dark.png',
  lockupDark2x: '/brand/sinet-lockup-dark@2x.png',
  lockupTransparent: '/brand/sinet-lockup-transparent.png',
  mark: '/brand/sinet-mark.png',
} as const;

/**
 * Returns the canonical static asset URL for the given logo variant and theme.
 * All email templates and default configurations must reference this helper
 * rather than hard-coding static asset paths.
 */
export function getLogoAssetUrl(
  variant: LogoVariant = 'lockup',
  theme: LogoTheme = 'dark'
): string {
  if (variant === 'mark') {
    return BRAND_ASSETS.mark;
  }
  return theme === 'dark' ? BRAND_ASSETS.lockupDark : BRAND_ASSETS.lockupTransparent;
}

const PRESET_DIMS: Record<
  LogoVariant,
  Record<LogoPresetSize, { width: number; height: number }>
> = {
  mark: {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
  },
  lockup: {
    sm: { width: 120, height: 46 },
    md: { width: 160, height: 61 },
    lg: { width: 220, height: 84 },
    xl: { width: 280, height: 107 },
  },
};

export interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoPresetSize | number;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}

export function Logo({
  variant = 'lockup',
  theme = 'dark',
  size = 'md',
  width,
  height,
  priority = false,
  className,
  style,
  onError,
}: LogoProps) {
  // Determine dimensions
  let w: number;
  let h: number;

  if (typeof size === 'number') {
    if (variant === 'mark') {
      w = size;
      h = size;
    } else {
      w = size;
      h = Math.round(size / 2.6056);
    }
  } else if (width && height) {
    w = width;
    h = height;
  } else if (width && !height) {
    w = width;
    h = variant === 'mark' ? width : Math.round(width / 2.6056);
  } else if (!width && height) {
    h = height;
    w = variant === 'mark' ? height : Math.round(height * 2.6056);
  } else {
    const preset = PRESET_DIMS[variant][size] || PRESET_DIMS[variant].md;
    w = preset.width;
    h = preset.height;
  }

  const src = getLogoAssetUrl(variant, theme);

  return (
    <Image
      src={src}
      alt="SINet"
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
