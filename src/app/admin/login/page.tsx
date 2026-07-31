'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminField, AdminInput } from '@admin/components/ui/AdminField';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Login failed');
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AdminField label="Email">
        <AdminInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
      </AdminField>
      <AdminField label="Password">
        <AdminInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </AdminField>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-[#D4AF37] text-[#0A2342] font-bold hover:bg-[#F4D03F] disabled:opacity-50 transition-colors">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#0A1929] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#D4AF37]">SINet Admin</h1>
          <p className="text-sm text-slate-400 mt-2">Sign in to manage site content</p>
        </div>
        <Suspense fallback={<p className="text-slate-400 text-sm">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
