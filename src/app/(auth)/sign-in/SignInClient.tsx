'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FormField, Input, Button } from '@/components/ui';

export function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'otp' | 'magic_link'>('otp');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError ? decodeURIComponent(initialError) : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to send verification code.');
        setLoading(false);
        return;
      }

      if (mode === 'magic_link') {
        setSuccessMessage('Magic sign-in link sent! Check your inbox to sign in directly.');
        setLoading(false);
      } else {
        router.push(`/verify-code?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
    } catch {
      setErrorMessage('Network error. Please check your data connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-canvas text-brand-ink flex flex-col justify-center px-4 py-12 xs:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-editorial text-3xl font-bold tracking-tight text-brand-ink">
              SINet<span className="text-brand-accent">.</span>
            </span>
          </Link>
          <h1 className="mt-4 font-editorial text-2xl xs:text-3xl font-bold tracking-tight text-brand-ink">
            Sign in to SINet
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Passwordless &amp; secure. Receive a verification code directly to your email.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-6 xs:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-800">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField
              id="email"
              label="Email Address"
              required
            >
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                disabled={loading}
              />
            </FormField>

            <div className="pt-1">
              <label className="block text-xs font-bold text-brand-ink mb-2">
                Sign-In Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('otp')}
                  className={`h-11 rounded-xl px-3 text-xs font-bold border transition-all ${
                    mode === 'otp'
                      ? 'bg-brand-ink text-white border-brand-ink shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  6-Digit Code
                </button>
                <button
                  type="button"
                  onClick={() => setMode('magic_link')}
                  className={`h-11 rounded-xl px-3 text-xs font-bold border transition-all ${
                    mode === 'magic_link'
                      ? 'bg-brand-ink text-white border-brand-ink shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Magic Link
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              loading={loading}
              disabled={loading || !email.trim()}
              className="w-full text-xs font-bold uppercase tracking-wider"
            >
              {loading
                ? 'Sending code…'
                : mode === 'otp'
                ? 'Continue with 6-Digit Code →'
                : 'Send Magic Link →'}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-500">
              Need to submit an application?{' '}
              <Link href="/membership" className="font-bold text-brand-accent hover:underline">
                Explore Membership →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
