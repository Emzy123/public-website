'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
        // Forward to verify-code page with email in query
        router.push(`/verify-code?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
    } catch {
      setErrorMessage('Network error. Please check your data connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f2e8] text-[#0d1a4a] flex flex-col justify-center px-4 py-12 xs:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-editorial text-3xl font-bold tracking-tight text-[#0d1a4a]">
              SINet<span className="text-[#d9711b]">.</span>
            </span>
          </Link>
          <p className="mt-2 text-xs font-data uppercase tracking-[.18em] text-[#d9711b]">
            Student Investment Network
          </p>
          <h1 className="mt-4 font-editorial text-2xl xs:text-3xl font-bold tracking-tight text-[#0d1a4a]">
            Member Sign In
          </h1>
          <p className="mt-2 text-sm text-[#5b554a]">
            Passwordless &amp; secure. Receive a verification code directly to your email.
          </p>
        </div>

        <div className="bg-white border border-[#0d1a4a]/20 p-6 xs:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-xs text-red-800">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 text-xs text-emerald-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#0d1a4a] mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@fulokoja.edu.ng"
                className="w-full h-12 px-3.5 border border-[#0d1a4a]/30 bg-[#fbf9f4] text-sm text-[#0d1a4a] placeholder-[#9c9589] focus:outline-none focus:border-[#d9711b] focus:ring-1 focus:ring-[#d9711b]"
              />
            </div>

            <div className="pt-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0d1a4a] mb-2">
                Sign-in method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('otp')}
                  className={`h-11 px-3 text-xs font-bold border transition-colors ${
                    mode === 'otp'
                      ? 'bg-[#0d1a4a] text-white border-[#0d1a4a]'
                      : 'bg-white text-[#5b554a] border-[#0d1a4a]/20 hover:border-[#0d1a4a]'
                  }`}
                >
                  6-Digit Code
                </button>
                <button
                  type="button"
                  onClick={() => setMode('magic_link')}
                  className={`h-11 px-3 text-xs font-bold border transition-colors ${
                    mode === 'magic_link'
                      ? 'bg-[#0d1a4a] text-white border-[#0d1a4a]'
                      : 'bg-white text-[#5b554a] border-[#0d1a4a]/20 hover:border-[#0d1a4a]'
                  }`}
                >
                  Magic Link
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full min-h-[48px] bg-[#d9711b] hover:bg-[#0d1a4a] text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Sending code…' : mode === 'otp' ? 'Continue with 6-Digit Code →' : 'Send Magic Link →'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#0d1a4a]/10 text-center">
            <p className="text-xs text-[#5b554a]">
              Not a member yet?{' '}
              <Link href="/student-network" className="font-bold text-[#d9711b] hover:underline">
                Join the Student Network →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
