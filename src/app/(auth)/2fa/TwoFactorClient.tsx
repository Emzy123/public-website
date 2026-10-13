'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function TwoFactorClient() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.replace(/\D/g, '').slice(0, 6);
    if (cleanCode.length !== 6) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid 2FA code.');
        setLoading(false);
        return;
      }

      router.push('/admin');
    } catch {
      setErrorMessage('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (val.length === 6) {
      setTimeout(() => {
        handleSubmit();
      }, 50);
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
            Admin Security
          </p>
          <h1 className="mt-4 font-editorial text-2xl xs:text-3xl font-bold tracking-tight text-[#0d1a4a]">
            Two-Factor Authentication
          </h1>
          <p className="mt-2 text-sm text-[#5b554a]">
            Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.).
          </p>
        </div>

        <div className="bg-white border border-[#0d1a4a]/20 p-6 xs:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-xs text-red-800">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="totpCode" className="block text-center text-xs font-semibold uppercase tracking-wider text-[#0d1a4a] mb-3">
                Authenticator Code
              </label>
              <input
                ref={inputRef}
                id="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                required
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                className="w-full h-16 text-center text-3xl font-mono tracking-[0.4em] font-bold border border-[#0d1a4a]/30 bg-[#fbf9f4] text-[#0d1a4a] focus:outline-none focus:border-[#d9711b] focus:ring-2 focus:ring-[#d9711b]/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full min-h-[48px] bg-[#0d1a4a] hover:bg-[#d9711b] text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying 2FA…' : 'Authenticate & Open Console →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#0d1a4a]/10 text-center">
            <Link href="/sign-in" className="text-xs text-[#5b554a] hover:text-[#0d1a4a] underline">
              Return to sign-in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
