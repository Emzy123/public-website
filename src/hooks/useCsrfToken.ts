'use client';

import { useEffect, useState } from 'react';

export function useCsrfToken(endpoint: string): {
  csrfToken: string;
  ready: boolean;
  error: string | null;
} {
  const [csrfToken, setCsrfToken] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchToken() {
      try {
        const response = await fetch(endpoint, { method: 'GET', credentials: 'same-origin' });
        if (!response.ok) throw new Error('Failed to load security token');
        const csrfHeader = response.headers.get('x-csrf-token') ?? '';
        const data = await response.json().catch(() => ({}));
        const token = csrfHeader || (data as { csrfToken?: string }).csrfToken || '';
        if (!cancelled) {
          setCsrfToken(token);
          setReady(Boolean(token));
          setError(token ? null : 'Security token unavailable');
        }
      } catch {
        if (!cancelled) {
          setError('Security token unavailable');
          setReady(false);
        }
      }
    }

    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return { csrfToken, ready, error };
}
