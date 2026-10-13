'use client';

import { useState, useEffect } from 'react';

interface ApplyNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApplyNotifyModal({ isOpen, onClose }: ApplyNotifyModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setError(null);
      setWebsite('');
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/applications/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || undefined,
          email: email.trim(),
          source: 'apply-notify',
          website: website || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit notification request. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notify-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8 text-[#0d1a4a]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Close modal"
        >
          ✕
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 id="notify-modal-title" className="text-xl font-extrabold text-[#0d1a4a]">
              You&apos;re on the Priority List
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              We&apos;ve recorded your email. You will receive an invitation the moment the next application cohort opens.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-[#0d1a4a] py-3 text-xs font-bold text-white transition-colors hover:bg-[#d9711b]"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Cohort Priority Access
            </div>
            <h2 id="notify-modal-title" className="text-2xl font-extrabold text-[#0d1a4a]">
              Get Notified for Next Cohort
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Applications open periodically. Enter your details to get first access when the next cohort opens.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
              />
              <div>
                <label htmlFor="notify-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  id="notify-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-slate-200 bg-[#fbf9f4] px-4 py-2.5 text-sm text-[#0d1a4a] outline-none transition focus:border-[#0d1a4a] focus:ring-1 focus:ring-[#0d1a4a]"
                />
              </div>

              <div>
                <label htmlFor="notify-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="notify-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="w-full rounded-xl border border-slate-200 bg-[#fbf9f4] px-4 py-2.5 text-sm text-[#0d1a4a] outline-none transition focus:border-[#0d1a4a] focus:ring-1 focus:ring-[#0d1a4a]"
                />
              </div>

              {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#0d1a4a] py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#d9711b] disabled:opacity-50"
              >
                {submitting ? 'Adding to Priority List…' : 'Notify Me When Open →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
