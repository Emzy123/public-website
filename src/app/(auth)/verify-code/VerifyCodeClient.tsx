'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function VerifyCodeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.replace(/\D/g, '').slice(0, 6);
    if (cleanCode.length !== 6 || !email) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid or expired code.');
        setLoading(false);
        return;
      }

      if (data.requires2fa) {
        router.push('/2fa');
      } else if (data.user?.roles?.includes('super_admin') || data.user?.roles?.includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setErrorMessage('Network error. Please check your data connection.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    setResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mode: 'otp' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to resend code.');
      } else {
        setSuccessMessage('A fresh 6-digit code has been sent to your email.');
        setCountdown(30);
      }
    } catch {
      setErrorMessage('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (val.length === 6) {
      // Auto-submit when 6 digits are typed
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
            Verification
          </p>
          <h1 className="mt-4 font-editorial text-2xl xs:text-3xl font-bold tracking-tight text-[#0d1a4a]">
            Enter 6-Digit Code
          </h1>
          <p className="mt-2 text-sm text-[#5b554a]">
            Sent to <span className="font-semibold text-[#0d1a4a]">{email || 'your email'}</span>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-center text-xs font-semibold uppercase tracking-wider text-[#0d1a4a] mb-3">
                Security Code
              </label>
              <input
                ref={inputRef}
                id="code"
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
              {loading ? 'Verifying…' : 'Confirm & Access Account →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#0d1a4a]/10 flex flex-col xs:flex-row items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="font-bold text-[#d9711b] hover:underline disabled:text-[#9c9589] disabled:no-underline"
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : resending ? 'Resending…' : 'Resend code'}
            </button>

            <Link href="/sign-in" className="text-[#5b554a] hover:text-[#0d1a4a] underline">
              Change email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
