export type RuntimeMode = 'development' | 'production';

export function getRuntimeMode(): RuntimeMode {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function isProductionMode(): boolean {
  return getRuntimeMode() === 'production';
}

export function isDevelopmentMode(): boolean {
  return getRuntimeMode() === 'development';
}

