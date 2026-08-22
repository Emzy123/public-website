'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { APPLICATION_ROLES, ROLE_LABELS, type ApplicationRole } from '@/lib/types/membership';

type FormState = Record<string, string | string[] | boolean>;

const ROLE_DETAILS: Record<ApplicationRole, { tag: string; detail: string }> = {
  volunteer: { tag: 'FIELD', detail: 'Support outreach, events, and on-ground community programs.' },
  staff: { tag: 'INTERNAL', detail: 'Apply for an internal role with SINet.' },
  'community-member': { tag: 'COMMUNITY', detail: 'Join the SINet network, events, resources, and updates.' },
  ambassador: { tag: 'GROWTH', detail: 'Represent SINet on campus or in your region.' },
  'partnership-interest': { tag: 'PARTNERSHIP', detail: 'Express interest in a business partnership — our team will follow up directly.' },
};

const SKILLS = ['Community outreach', 'Event support', 'Social media', 'Sales & marketing', 'Design', 'Logistics'];
const AVAILABILITY = ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Flexible / on-call'];

function Button({ children, onClick, disabled, kind = 'primary' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; kind?: 'primary' | 'secondary' }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`min-h-[48px] w-full px-6 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${kind === 'primary' ? 'bg-[#d9711b] text-white hover:bg-[#b9560b]' : 'border border-[#0d1a4a]/35 text-[#0d1a4a] hover:border-[#0d1a4a]'}`}>
      {children}
    </button>
  );
}

export function ClosedLinkWaitlist({ slug }: { slug: string }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/join/${slug}/apply`)
      .then((r) => setCsrfToken(r.headers.get('x-csrf-token') || ''))
      .catch(() => undefined);
  }, [slug]);

  const submit = async () => {
    setError('');
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (!consent) { setError('Please confirm you agree to be contacted when applications reopen.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/join/${slug}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ waitlist: true, email, consent: true }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Unable to join waitlist.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join waitlist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f2e8] px-4 py-16 xs:px-5 md:py-24">
      <div className="mx-auto max-w-xl border border-[#0d1a4a]/20 bg-white p-6 text-center xs:p-10">
        <p className="font-data text-xs uppercase tracking-[.16em] text-[#d9711b]">Applications closed</p>
        <h1 className="mt-5 font-editorial text-4xl xs:text-5xl">This application period has closed.</h1>
        <p className="mx-auto mt-6 max-w-md leading-7 text-[#585146]">
          Leave your email and we will notify you when a relevant application period opens again.
        </p>
        {done ? (
          <p className="mt-8 text-sm font-semibold text-[#0d1a4a]">You&apos;re on the waitlist. We&apos;ll be in touch.</p>
        ) : (
          <div className="mt-8 space-y-4 text-left">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase">Email address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 outline-none focus:border-[#0d1a4a]" />
            </label>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span>I agree to be contacted by SINet when applications reopen for this campaign.</span>
            </label>
            {error && <p className="text-sm text-[#8b3e09]">{error}</p>}
            <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Join waitlist'}</Button>
          </div>
        )}
        <Link href="/membership" className="mt-9 inline-flex text-sm font-bold text-[#d9711b] hover:underline">Learn about membership →</Link>
      </div>
    </div>
  );
}

export function CampaignApplicationWizard({ slug, allowedRoles }: { slug: string; allowedRoles: ApplicationRole[] }) {
  const roles = APPLICATION_ROLES.filter((r) => allowedRoles.includes(r));
  const defaultRole = roles[0] || 'volunteer';
  const isPartnership = (role: string) => role === 'partnership-interest';
  const steps = ['Choose Role', 'Your Details', 'Verification', 'Review & Submit'];

  const initial: FormState = {
    role: defaultRole,
    fullName: '',
    email: '',
    phone: '',
    location: '',
    organization: '',
    interestDescription: '',
    skills: ['Community outreach'],
    availability: ['Weekday evenings'],
    motivation: '',
    codeOfConductAccepted: false,
  };

  const [form, setForm] = useState<FormState>(initial);
  const [step, setStep] = useState(0);
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    fetch(`/api/join/${slug}`)
      .then((r) => setCsrfToken(r.headers.get('x-csrf-token') || ''))
      .catch(() => undefined);
  }, [slug]);

  const role = String(form.role);
  const selectedRoleLabel = ROLE_LABELS[role as ApplicationRole] || role;
  const memberSummary = useMemo(() => {
    if (isPartnership(role)) {
      return [['Name', String(form.fullName || '—')], ['Role', selectedRoleLabel], ['Organization', String(form.organization || '—')]];
    }
    return [['Name', String(form.fullName || '—')], ['Role', selectedRoleLabel], ['Location', String(form.location || '—')]];
  }, [form, role, selectedRoleLabel]);

  const set = (key: string, value: FormState[string]) => setForm((c) => ({ ...c, [key]: value }));
  const toggleArray = (key: string, value: string) => {
    const values = (form[key] as string[]) || [];
    set(key, values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  const validateStep = () => {
    if (step === 1) {
      const required = isPartnership(role)
        ? ['fullName', 'email', 'phone', 'interestDescription']
        : ['fullName', 'email', 'phone', 'location', 'motivation'];
      if (required.some((key) => !String(form[key] ?? '').trim())) {
        setError('Complete all required details.');
        return false;
      }
      if (!String(form.email).includes('@')) { setError('Enter a valid email address.'); return false; }
    }
    if (step === 2 && !form.codeOfConductAccepted) {
      setError('Please confirm the verification and code-of-conduct statement.');
      return false;
    }
    setError('');
    return true;
  };

  const next = () => { if (validateStep()) setStep((c) => Math.min(c + 1, 3)); };
  const previous = () => { setError(''); setStep((c) => Math.max(c - 1, 0)); };

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/join/${slug}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify(form),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Unable to submit application.');
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (complete) {
    return (
      <div className="min-h-screen bg-[#f6f2e8] px-4 py-16 xs:px-5 md:py-24">
        <div className="mx-auto max-w-xl border border-[#0d1a4a]/20 bg-white p-6 text-center xs:p-10">
          <p className="font-data text-xs uppercase tracking-[.16em] text-[#d9711b]">Application received</p>
          <h1 className="mt-5 font-editorial text-4xl xs:text-5xl">Thank you.</h1>
          <p className="mx-auto mt-6 max-w-md leading-7 text-[#585146]">Your application has been recorded for review. We will contact you using the email address you provided.</p>
          <Link href="/" className="mt-9 inline-flex bg-[#0d1a4a] px-6 py-3 text-sm font-bold text-white">Back to SINet</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f2e8] pb-24 text-[#0d1a4a]">
      <header className="bg-[#0d1a4a] text-[#f6f2e8]">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-4 py-5 xs:px-5 xs:py-6 lg:px-8">
          <Link href="/" className="font-editorial text-xl font-semibold xs:text-2xl">SINet. — Join</Link>
          <Link href="/" className="flex min-h-[44px] items-center font-data text-[11px] uppercase tracking-[.12em] text-[#eccb7c]">Save & Exit</Link>
        </div>
        <div className="border-t-2 border-[#d9711b] bg-[#16296b]">
          <div className="mx-auto hidden max-w-[1160px] grid-cols-4 md:grid">
            {steps.map((label, index) => (
              <button key={label} type="button" onClick={() => index <= step && setStep(index)} className={`border-r border-white/15 px-2 py-4 text-center last:border-0 ${index === step ? 'border-b-2 border-b-[#d9711b] bg-[#0d1a4a]' : ''}`}>
                <span className={`block font-data text-[10px] ${index === step ? 'text-[#d9711b]' : 'text-[#9ea8d0]'}`}>0{index + 1}</span>
                <span className={`mt-1 block text-sm ${index === step ? 'text-white' : 'text-[#aeb5d2]'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1000px] space-y-10 px-4 pt-8 xs:px-5 md:pt-14 lg:px-8">
        <section className="border border-[#0d1a4a]/20 bg-white">
          <div className="border-b border-[#0d1a4a]/15 p-5 xs:p-7 sm:p-9">
            <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Step 0{step + 1}</p>
            <h1 className="mt-2 font-editorial text-2xl xs:text-3xl sm:text-4xl">{steps[step]}</h1>
          </div>
          <div className="p-5 xs:p-7 sm:p-9">
            {step === 0 && (
              <div className="grid gap-4 xs:grid-cols-2">
                {roles.map((r) => (
                  <button type="button" key={r} onClick={() => set('role', r)} className={`relative min-h-[130px] border p-5 text-left ${form.role === r ? 'border-[#0d1a4a] bg-[#f6f2e8]' : 'border-[#0d1a4a]/15 bg-white hover:border-[#0d1a4a]/55'}`}>
                    <p className="font-data text-[10px] uppercase tracking-[.14em] text-[#716959]">{ROLE_DETAILS[r].tag}</p>
                    <h2 className="mt-2 font-editorial text-2xl">{ROLE_LABELS[r]}</h2>
                    <p className="mt-2 text-sm leading-5 text-[#5b5448]">{ROLE_DETAILS[r].detail}</p>
                  </button>
                ))}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid gap-5 xs:grid-cols-2">
                  <Field label="Full name" value={form.fullName as string} onChange={(v) => set('fullName', v)} />
                  <Field label="Phone number" value={form.phone as string} onChange={(v) => set('phone', v)} type="tel" />
                  <Field label="Email address" value={form.email as string} onChange={(v) => set('email', v)} type="email" />
                  {!isPartnership(role) && <Field label="State / location" value={form.location as string} onChange={(v) => set('location', v)} />}
                  {isPartnership(role) && <Field label="Organization (optional)" value={form.organization as string} onChange={(v) => set('organization', v)} />}
                </div>
                {isPartnership(role) ? (
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase">Describe your interest</span>
                    <textarea value={form.interestDescription as string} onChange={(e) => set('interestDescription', e.target.value)} rows={4} className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 outline-none focus:border-[#0d1a4a]" />
                  </label>
                ) : (
                  <>
                    <ChipGroup label="Relevant skills" items={SKILLS} selected={(form.skills as string[]) || []} onToggle={(v) => toggleArray('skills', v)} />
                    <ChipGroup label="Weekly availability" items={AVAILABILITY} selected={(form.availability as string[]) || []} onToggle={(v) => toggleArray('availability', v)} dark />
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase">Why do you want to join SINet?</span>
                      <textarea value={form.motivation as string} onChange={(e) => set('motivation', e.target.value)} rows={4} className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 outline-none focus:border-[#0d1a4a]" />
                    </label>
                  </>
                )}
              </div>
            )}
            {step === 2 && (
              <label className="flex items-start gap-3 text-sm leading-6">
                <input type="checkbox" checked={Boolean(form.codeOfConductAccepted)} onChange={(e) => set('codeOfConductAccepted', e.target.checked)} className="mt-1" />
                <span>I confirm that my details are accurate and agree to represent SINet&apos;s community values. This registration is subject to review before role assignment is confirmed.</span>
              </label>
            )}
            {step === 3 && (
              <div className="space-y-2">
                {memberSummary.map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-[#f0eae0] py-2 text-sm">
                    <span className="text-[#7b7263]">{label}</span>
                    <span className="font-medium text-[#0d1a4a]">{value}</span>
                  </div>
                ))}
              </div>
            )}
            {error && <p className="mt-6 border-l-2 border-[#d9711b] bg-[#fbf4e9] px-4 py-3 text-sm text-[#8b3e09]">{error}</p>}
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-[#0d1a4a]/15 bg-[#eee6d0] p-4 xs:p-5 sm:flex-row sm:items-center sm:justify-between">
            <Button kind="secondary" onClick={previous} disabled={step === 0}>← Back</Button>
            {step < 3 ? <Button onClick={next}>Continue →</Button> : <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Application'}</Button>}
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 outline-none focus:border-[#0d1a4a]" />
    </label>
  );
}

function ChipGroup({ label, items, selected, onToggle, dark }: { label: string; items: string[]; selected: string[]; onToggle: (v: string) => void; dark?: boolean }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button type="button" key={item} onClick={() => onToggle(item)} className={`min-h-[44px] rounded-full border px-4 py-2 text-sm ${selected.includes(item) ? (dark ? 'border-[#0d1a4a] bg-[#0d1a4a] text-white' : 'border-[#d9a23c] bg-[#eccb7c] font-semibold text-[#0d1a4a]') : 'border-[#0d1a4a]/15 text-[#5b5448]'}`}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
