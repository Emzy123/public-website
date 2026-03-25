import { createCsrfProtect } from '@edge-csrf/nextjs';

export const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
  token: {
    fieldName: 'csrfToken',
    responseHeader: 'x-csrf-token',
  },
});
