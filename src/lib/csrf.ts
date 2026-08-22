import { createCsrfProtect } from '@edge-csrf/nextjs';
import { isProductionMode } from '@/lib/runtime/envMode';

export const csrfProtect = createCsrfProtect({
  cookie: {
    httpOnly: true,
    secure: isProductionMode(),
    sameSite: 'strict',
    path: '/',
  },
  token: {
    fieldName: 'csrfToken',
    responseHeader: 'x-csrf-token',
  },
});
