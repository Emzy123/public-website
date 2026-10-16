'use client';

import { useState } from 'react';
import Link from 'next/link';

import { type ApplicationRole, ROLE_LABELS } from '@/lib/types/membership';

export function RegistrationClosedView({
  role,
  inviteNotice,
  chapter,
}: {
  role?: ApplicationRole | null;
  inviteNotice?: string;
  chapter?: string | null;
}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleTitle = role ? ROLE_LABELS[role] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    const notifySource = role
      ? chapter
        ? `join-${role}-${chapter}`
        : `join-${role}`
      : chapter
        ? `join-${chapter}`
        : 'join';

    try {
      const res = await fetch('/api/applications/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: notifySource,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || 'Failed to join notification list. Please try again.');
      }
    } catch {
      // Offline fallback: store locally
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('sinet_offline_waitlist') || '[]');
        existing.push({ email: email.trim(), role: role || undefined, chapter: chapter || undefined, source: notifySource, date: new Date().toISOString() });
        localStorage.setItem('sinet_offline_waitlist', JSON.stringify(existing));
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f2e8] px-4 py-16 text-[#0d1a4a] sm:px-6 lg:py-24">
      <div className="mx-auto max-w-xl text-center">
        {inviteNotice && (
          <div
            data-testid="staff-invitation-notice"
            className="mb-6 rounded-xl border border-amber-500/30 bg-amber-50/80 p-4 text-center text-sm font-semibold text-amber-900 shadow-sm"
          >
            {inviteNotice}
          </div>
        )}

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#0d1a4a]/20 bg-white px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {roleTitle ? `${roleTitle} Admissions Closed` : 'Applications Closed'}
        </div>

        {/* Heading */}
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#0d1a4a] sm:text-4xl">
          {roleTitle ? `${roleTitle} Applications are Closed` : 'Registration is Closed at the Moment'}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#554e43] sm:text-base">
          {roleTitle
            ? `Cohort admissions for ${roleTitle} open periodically through admin-controlled application periods. Leave your email below to receive priority notification when the next ${roleTitle} cohort opens.`
            : 'SINet membership and cohort admissions open periodically through admin-controlled application periods. There is currently no active registration window open.'}
        </p>

        {/* Waitlist Form Card */}
        <div className="mt-8 rounded-2xl border border-[#0d1a4a]/15 bg-white p-6 shadow-sm sm:p-8">
          {submitted ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-bold text-emerald-950">You&apos;re on the Priority List</h3>
              <p className="mt-1 text-xs text-emerald-800">
                {roleTitle
                  ? `We have recorded your email. As soon as ${roleTitle} applications open, you will receive an invitation directly.`
                  : 'We have recorded your email. As soon as the next application cohort or link opens, you will receive an invitation directly.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-left">
                <label htmlFor="closed-email" className="block text-xs font-bold uppercase tracking-wider text-[#0d1a4a]">
                  {roleTitle ? `Get Notified for ${roleTitle}` : 'Get Notified for Next Cohort'}
                </label>
                <p className="mt-1 text-xs text-[#554e43]">
                  {roleTitle
                    ? `Leave your email to receive priority notice when ${roleTitle} positions open.`
                    : 'Leave your email address to receive priority notification when new roles or chapters open.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="closed-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu.ng"
                  className="flex-1 rounded-xl border border-[#0d1a4a]/20 bg-[#fbf9f4] px-4 py-2.5 text-sm text-[#0d1a4a] outline-none transition focus:border-[#0d1a4a] focus:ring-1 focus:ring-[#0d1a4a]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0d1a4a] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d9711b] disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Notify Me →'}
                </button>
              </div>

              {errorMessage && (
                <p className="text-left text-xs font-semibold text-rose-600">{errorMessage}</p>
              )}
            </form>
          )}
        </div>

        {/* Helpful Secondary Exploration Actions */}
        <div className="mt-10 border-t border-[#0d1a4a]/15 pt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#554e43]">In the meantime:</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
            <Link
              href="/chapters"
              className="inline-flex min-h-[40px] items-center rounded-xl border border-[#0d1a4a]/20 bg-white px-4 py-2 font-semibold text-[#0d1a4a] shadow-sm hover:border-[#0d1a4a] hover:bg-[#fbf9f4]"
            >
              🏛️ Explore Campus Chapters
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex min-h-[40px] items-center rounded-xl border border-[#0d1a4a]/20 bg-white px-4 py-2 font-semibold text-[#0d1a4a] shadow-sm hover:border-[#0d1a4a] hover:bg-[#fbf9f4]"
            >
              🔐 Existing Member Sign In
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[40px] items-center rounded-xl border border-[#0d1a4a]/20 bg-white px-4 py-2 font-semibold text-[#0d1a4a] shadow-sm hover:border-[#0d1a4a] hover:bg-[#fbf9f4]"
            >
              ✉️ Contact Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
