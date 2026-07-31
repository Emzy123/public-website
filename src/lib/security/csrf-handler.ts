import { NextRequest, NextResponse } from 'next/server';
import { csrfProtect } from '@/lib/csrf';
import { isDevelopmentMode } from '@/lib/runtime/envMode';

export async function issueCsrfToken(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  await csrfProtect(request, response);
  return response;
}

export async function verifyCsrfToken(
  request: NextRequest
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const response = NextResponse.next();
  try {
    await csrfProtect(request, response);
    return { ok: true };
  } catch {
    const message = isDevelopmentMode()
      ? 'Invalid CSRF token. Fetch a fresh token via GET before submitting.'
      : 'Invalid CSRF token.';
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 403 }),
    };
  }
}
