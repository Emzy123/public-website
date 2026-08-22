'use server';

/**
 * Server actions are intentionally disabled.
 * All public submissions must go through the secured API routes
 * (/api/waitlist, /api/contact, /api/join/..., etc.) which enforce
 * CSRF, origin checks, rate limits, and captcha where required.
 */
export async function submitWaitlistAction() {
  return {
    success: false as const,
    error: 'This endpoint is disabled. Use the waitlist form on the site.',
  };
}

export async function submitContactAction() {
  return {
    success: false as const,
    error: 'This endpoint is disabled. Use the contact form on the site.',
  };
}
