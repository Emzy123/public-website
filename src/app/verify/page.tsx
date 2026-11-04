'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Public credential check entry (footer "Verify credential").
 * Submits a Member ID and navigates to /verify/<id> (QR-compatible).
 * Never collects or displays email/phone.
 */
export default function VerifyCredentialPage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const cleaned = memberId.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned || cleaned.length < 6 || cleaned.length > 50) {
      setError('Enter a valid Member ID (for example SIN-FULOKOJA-24-0001).');
      return;
    }
    if (!/^[A-Z0-9][A-Z0-9._-]*$/i.test(cleaned)) {
      setError('Member ID contains invalid characters.');
      return;
    }
    router.push(`/verify/${encodeURIComponent(cleaned)}`);
  }

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#071026] px-4 py-16 text-white">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
          Official Credential Verification
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Verify a SINet credential</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Enter a Member ID to see name, role, chapter, and whether the credential is valid or revoked.
          Email and phone are never shown.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Member ID
            <input
              type="text"
              name="memberId"
              autoComplete="off"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="SIN-CAMPUS-YY-0001"
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-rose-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-amber-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Verify credential
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="text-slate-300 underline-offset-2 hover:underline">
            Back to homepage
          </Link>
        </p>
      </div>
    </main>
  );
}
