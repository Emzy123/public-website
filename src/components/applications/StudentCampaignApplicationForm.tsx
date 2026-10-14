'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  STUDENT_DIVISIONS,
  STUDENT_DIVISION_INFO,
  type StudentDivision,
} from '@/lib/schemas/member-application.schema';

type UniversityOption = {
  id: string;
  name: string;
  shortName: string;
  campusCode: string;
  state: string;
};

type CampaignDetails = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  targetRole: string;
  isAccepting: boolean;
  statusReason?: string;
  seatsRemaining?: number | null;
};

export function StudentCampaignApplicationForm({
  campaign,
  slug,
}: {
  campaign: CampaignDetails;
  slug: string;
}) {
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [loadingUnis, setLoadingUnis] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [programme, setProgramme] = useState('');
  const [level, setLevel] = useState<'100' | '200' | '300' | '400' | '500'>('200');
  const [division, setDivision] = useState<StudentDivision>('student_finance');
  const [contributionPitch, setContributionPitch] = useState('');
  const [referredByCode, setReferredByCode] = useState('');
  const [codeOfConduct, setCodeOfConduct] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState<{
    applicationId: string;
    campaignName: string;
  } | null>(null);

  // Fetch CSRF token and universities on mount
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch(`/api/join/${slug}/apply`)
      .then((res) => {
        const token = res.headers.get('x-csrf-token');
        if (token) setCsrfToken(token);
      })
      .catch(() => undefined);

    fetch('/api/universities')
      .then((res) => res.json())
      .then((data) => {
        if (data.universities) {
          setUniversities(data.universities);
          const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const campusParam = params?.get('campus')?.trim().toUpperCase();
          const matched = campusParam
            ? data.universities.find(
                (u: UniversityOption) =>
                  u.campusCode === campusParam || u.shortName.toUpperCase() === campusParam
              )
            : null;

          if (matched) {
            setUniversityId(matched.id);
          } else if (data.universities.length > 0) {
            setUniversityId(data.universities[0].id);
          }
        }
      })
      .catch((err) => console.warn('Failed to load universities list:', err))
      .finally(() => setLoadingUnis(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please fill in your name, student email, and phone number.');
      return;
    }
    if (!universityId) {
      setErrorMessage('Please select your tertiary institution.');
      return;
    }
    if (!programme.trim()) {
      setErrorMessage('Please enter your course / degree programme.');
      return;
    }
    if (contributionPitch.trim().length < 15) {
      setErrorMessage('Please tell us in at least 15 characters why you wish to join.');
      return;
    }
    if (!codeOfConduct) {
      setErrorMessage('You must review and accept the SINet Community Code of Conduct.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        universityId,
        programme: programme.trim(),
        level,
        division,
        contributionPitch: contributionPitch.trim(),
        referredByCode: referredByCode.trim() || undefined,
        codeOfConductAccepted: true,
      };

      const res = await fetch(`/api/join/${slug}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSuccessResult({
        applicationId: data.applicationId,
        campaignName: data.campaignName || campaign.name,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] px-4 py-12 xs:px-6 md:py-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm xs:p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-emerald-800">
            Application Received
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#071026] sm:text-3xl">
            Welcome to the Network
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Thank you, <span className="font-semibold text-slate-900">{fullName}</span>. Your application for{' '}
            <span className="font-semibold text-slate-900">{successResult.campaignName}</span> has been
            safely recorded.
          </p>

          <div className="my-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-900">What happens next?</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Admissions committee reviews chapter applications continuously.</li>
              <li>You can sign in to check your approval status at any time.</li>
              <li>Once verified, your digital Member ID Card will be minted automatically.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/sign-in"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#071026] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Sign In to Member Portal →
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-canvas px-4 py-10 xs:px-6 md:py-16 text-brand-ink">
      <div className="mx-auto max-w-2xl">
        {/* Header Breadcrumb & Brand */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-brand-accent hover:text-brand-accent-hover"
            >
              ← SINet
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Your answers will not be saved. Are you sure you want to leave?')) {
                  window.location.href = '/';
                }
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline"
            >
              Leave application
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              Admissions Cohort Active
            </span>
            {campaign.seatsRemaining !== null && campaign.seatsRemaining !== undefined && (
              <span className="text-xs font-semibold text-slate-500">
                {campaign.seatsRemaining} seats available
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#071026] sm:text-4xl">
            {campaign.name}
          </h1>
          {campaign.description && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
        >
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {errorMessage}
            </div>
          )}

          {/* SECTION 1: Personal & Contact */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              1. Student Identity & Contact
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Full Name (Legal or Matriculation Name) *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Amina Ibrahim"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amina@university.edu.ng"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Phone Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 812 345 6789"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600"
                />
              </div>
            </div>
          </div>

          <hr className="my-6 border-slate-100" />

          {/* SECTION 2: Academic Campus Chapter */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              2. Campus Chapter & Academic Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Tertiary Institution (Kogi State) *
              </label>
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                disabled={loadingUnis}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600"
              >
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name} ({uni.shortName})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                You will be automatically affiliated with this campus chapter upon approval.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Course / Programme *
                </label>
                <input
                  type="text"
                  required
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  placeholder="e.g. B.Sc Accounting"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Current Study Level *
                </label>
                <select
                  value={level}
                  onChange={(e) =>
                    setLevel(e.target.value as '100' | '200' | '300' | '400' | '500')
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600"
                >
                  <option value="100">100 Level (Freshman)</option>
                  <option value="200">200 Level (Sophomore)</option>
                  <option value="300">300 Level (Penultimate)</option>
                  <option value="400">400 Level (Final Year)</option>
                  <option value="500">500 Level (Extended/Engineering)</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="my-6 border-slate-100" />

          {/* SECTION 3: Ecosystem Division Choice */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              3. Student Ecosystem Division *
            </h2>
            <p className="text-xs text-slate-600">
              Choose the primary student division you want to belong to:
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {STUDENT_DIVISIONS.map((divKey) => {
                const info = STUDENT_DIVISION_INFO[divKey];
                const isSelected = division === divKey;
                return (
                  <button
                    key={divKey}
                    type="button"
                    onClick={() => setDivision(divKey)}
                    className={`flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{info.name}</span>
                        <input
                          type="radio"
                          name="divisionRadio"
                          checked={isSelected}
                          onChange={() => setDivision(divKey)}
                          className="h-4 w-4 text-amber-600"
                        />
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                        {info.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Why do you want to join and what will you contribute? *
              </label>
              <textarea
                required
                rows={3}
                value={contributionPitch}
                onChange={(e) => setContributionPitch(e.target.value)}
                placeholder="Share your interests, skills, or what you hope to achieve with SINet..."
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 p-4 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={referredByCode}
                onChange={(e) => setReferredByCode(e.target.value.toUpperCase())}
                placeholder="e.g. SIN67AY7I"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm uppercase text-slate-900 outline-none transition focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          <hr className="my-6 border-slate-100" />

          {/* SECTION 4: Terms & Submission */}
          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs leading-relaxed text-slate-700">
              <input
                type="checkbox"
                required
                checked={codeOfConduct}
                onChange={(e) => setCodeOfConduct(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-600"
              />
              <span>
                I confirm that all information provided is accurate and agree to abide by the
                SINet Community Code of Conduct and leadership values.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-brand-ink px-6 text-sm font-bold text-white shadow-sm transition hover:bg-brand-ink-navy active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Submitting Application…
                </span>
              ) : (
                'Submit Application →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
