'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminField, AdminInput } from '@admin/components/ui/AdminField';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth/login')
      .then((res) => setCsrfToken(res.headers.get('x-csrf-token') ?? ''))
      .catch(() => setCsrfToken(''));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let res: Response;
    try {
      res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ email, password, totpCode: totpCode || undefined }),
      });
    } catch {
      setError('Unable to reach the sign-in service. Please try again shortly.');
      setLoading(false);
      return;
    }

    const json = await res.json().catch(() => ({} as { error?: string; mfaRequired?: boolean }));

    if (!res.ok) {
      if (json.mfaRequired) setMfaRequired(true);
      // Refresh CSRF after failed attempt
      fetch('/api/admin/auth/login')
        .then((r) => setCsrfToken(r.headers.get('x-csrf-token') ?? ''))
        .catch(() => undefined);
      setError(
        json.error ||
          (res.status === 503
            ? 'Admin sign-in is not configured on this deployment.'
            : res.status >= 500
              ? 'Sign-in service error. Check server logs and admin env vars.'
              : 'Login failed')
      );
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AdminField label="Email address">
        <AdminInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          placeholder="admin@sinet.africa"
        />
      </AdminField>
      <AdminField label="Password">
        <AdminInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </AdminField>
      {(mfaRequired || totpCode) && (
        <AdminField label="Authentication code" hint="6-digit code from your authenticator app">
          <AdminInput
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            required={mfaRequired}
            placeholder="123456"
            maxLength={6}
          />
        </AdminField>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !csrfToken}
        className="w-full rounded-lg bg-[#0d1a4a] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a2d66] disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#f6f2e8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0d1a4a]">
            <span className="text-xl font-bold text-[#d9a23c]">S</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#0d1a4a]">SINet Admin</h1>
          <p className="mt-1 text-sm text-[#7b7263]">Sign in to the staff console</p>
        </div>

        <div className="rounded-2xl border border-[#e4dcc9] bg-white p-8 shadow-sm">
          <Suspense fallback={<p className="text-sm text-[#7b7263]">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-[#b0a799]">
          SINet · Staff access only
        </p>
      </div>
    </div>
  );
}
