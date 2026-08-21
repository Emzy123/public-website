'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Flow = 'investment' | 'get-involved';
type FormState = Record<string, string | string[] | boolean | number>;

const TIERS = [
  { value: 'student', label: 'Student', minimum: '₦50,000', detail: 'Campus network access and learning support.' },
  { value: 'growth', label: 'Growth', minimum: '₦200,000', detail: 'Priority reporting and a dedicated relationship path.' },
  { value: 'strategic', label: 'Strategic', minimum: '₦1,000,000', detail: 'Direct leadership access and a tailored briefing.' },
];
const ROLES = [
  { value: 'community-member', tag: 'COMMUNITY', label: 'Community Member', detail: 'Join the SINet network, events, resources, and updates.' },
  { value: 'volunteer', tag: 'FIELD', label: 'Volunteer', detail: 'Support outreach, events, and on-ground community programs.' },
  { value: 'ambassador', tag: 'GROWTH', label: 'Ambassador', detail: 'Represent SINet on campus or in your region.' },
  { value: 'staff-partner', tag: 'FORMAL', label: 'Staff / Partner', detail: 'Apply for a formal role or propose a partnership.' },
];
const SKILLS = ['Community outreach', 'Event support', 'Social media', 'Sales & marketing', 'Design', 'Logistics'];
const AVAILABILITY = ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Flexible / on-call'];

function Button({ children, onClick, disabled, kind = 'primary' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; kind?: 'primary' | 'secondary' }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`min-h-[48px] w-full px-6 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${kind === 'primary' ? 'bg-[#d9711b] text-white hover:bg-[#b9560b]' : 'border border-[#0d1a4a]/35 text-[#0d1a4a] hover:border-[#0d1a4a]'}`}>{children}</button>;
}

export function ApplicationWizard({ flow }: { flow: Flow }) {
  const isInvestment = flow === 'investment';
  const steps = isInvestment ? ['Choose Plan', 'Your Details', 'Documentation', 'Review & Submit'] : ['Choose Role', 'Your Details', 'Verification', 'Review & Submit'];
  const initial: FormState = isInvestment
    ? { tier: 'growth', plan: 'annual', fullName: '', email: '', phone: '', residentialAddress: '', nextOfKinName: '', nextOfKinPhone: '', amount: 200000, agreementAccepted: false }
    : { role: 'volunteer', fullName: '', email: '', phone: '', location: '', skills: ['Community outreach'], availability: ['Weekday evenings'], motivation: '', codeOfConductAccepted: false };
  const [form, setForm] = useState<FormState>(initial);
  const [step, setStep] = useState(0);
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    fetch('/api/applications').then(async (res) => {
      const body = await res.json().catch(() => null);
      setCsrfToken(res.headers.get('x-csrf-token') || body?.csrfToken || '');
    }).catch(() => undefined);
  }, []);

  const selectedTier = TIERS.find((tier) => tier.value === form.tier);
  const selectedRole = ROLES.find((role) => role.value === form.role);
  const memberSummary = useMemo(() => isInvestment ? [['Investor name', String(form.fullName || '—')], ['Tier', selectedTier?.label || '—'], ['Plan', `${form.plan === 'annual' ? 'Annual' : 'Quarterly'} — ${form.plan === 'annual' ? '15%' : '5%'} target`], ['Amount', `₦${Number(form.amount || 0).toLocaleString()}`]] : [['Name', String(form.fullName || '—')], ['Role', selectedRole?.label || '—'], ['Location', String(form.location || '—')], ['Availability', (form.availability as string[]).join(', ') || '—']], [form, isInvestment, selectedRole?.label, selectedTier?.label]);

  const set = (key: string, value: FormState[string]) => setForm((current) => ({ ...current, [key]: value }));
  const toggleArray = (key: string, value: string) => {
    const values = (form[key] as string[]) || [];
    set(key, values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  const validateStep = () => {
    if (step === 1) {
      const required = isInvestment ? ['fullName', 'email', 'phone', 'residentialAddress', 'nextOfKinName', 'nextOfKinPhone', 'amount'] : ['fullName', 'email', 'phone', 'location', 'motivation'];
      if (required.some((key) => !String(form[key] ?? '').trim()) || (isInvestment && Number(form.amount) < (form.tier === 'student' ? 50000 : form.tier === 'growth' ? 200000 : 1000000))) { setError('Complete all required details and meet the selected tier minimum.'); return false; }
      if (!String(form.email).includes('@')) { setError('Enter a valid email address.'); return false; }
    }
    if (step === 2 && !(isInvestment ? form.agreementAccepted : form.codeOfConductAccepted)) { setError(isInvestment ? 'Please confirm that you have reviewed the participation terms.' : 'Please confirm the verification and code-of-conduct statement.'); return false; }
    setError(''); return true;
  };
  const next = () => { if (validateStep()) setStep((current) => Math.min(current + 1, 3)); };
  const previous = () => { setError(''); setStep((current) => Math.max(current - 1, 0)); };
  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true); setError('');
    const payload = isInvestment ? { pathway: 'investment', ...form } : { pathway: 'get-involved', ...form };
    try {
      const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) }, body: JSON.stringify(payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Unable to submit application.');
      setComplete(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to submit application.'); } finally { setSubmitting(false); }
  };

  if (complete) return <div className="min-h-screen bg-[#f6f2e8] px-4 py-16 xs:px-5 md:py-24"><div className="mx-auto max-w-xl border border-[#0d1a4a]/20 bg-white p-6 text-center xs:p-10"><p className="font-data text-xs uppercase tracking-[.16em] text-[#d9711b]">Application received</p><h1 className="mt-5 font-editorial text-4xl xs:text-5xl">Thank you.</h1><p className="mx-auto mt-6 max-w-md leading-7 text-[#585146]">Your {isInvestment ? 'investment application' : 'registration'} has been recorded for review. We will contact you using the email address you provided.</p><Link href="/" className="mt-9 inline-flex bg-[#0d1a4a] px-6 py-3 text-sm font-bold text-white">Back to SINet</Link></div></div>;

  return <div className="min-h-screen bg-[#f6f2e8] pb-24 text-[#0d1a4a]">
    <header className="bg-[#0d1a4a] text-[#f6f2e8]"><div className="mx-auto flex max-w-[1160px] items-center justify-between px-4 py-5 xs:px-5 xs:py-6 lg:px-8"><Link href="/" className="font-editorial text-xl font-semibold xs:text-2xl"><span className="hidden xs:inline">SINet. — </span><span className="xs:hidden">SINet. </span>{isInvestment ? 'Investment' : 'Get Involved'}</Link><Link href="/" className="flex min-h-[44px] items-center font-data text-[11px] uppercase tracking-[.12em] text-[#eccb7c]">Save & Exit</Link></div>
      <div className="border-t-2 border-[#d9711b] bg-[#16296b]">
        <div className="mx-auto max-w-[1160px] px-4 py-3 md:hidden">
          <div className="flex items-center justify-between text-xs text-[#aeb5d2]"><span className="font-data text-[#d9711b]">Step {step + 1} of {steps.length}</span><span>{steps[step]}</span></div>
          <div className="mt-2 flex h-1.5 gap-1">{steps.map((_, index) => <div key={index} className={`flex-1 rounded-full ${index <= step ? 'bg-[#d9711b]' : 'bg-white/20'}`} />)}</div>
        </div>
        <div className="mx-auto hidden max-w-[1160px] grid-cols-4 md:grid">{steps.map((label, index) => <button key={label} type="button" onClick={() => index <= step && setStep(index)} className={`border-r border-white/15 px-2 py-4 text-center last:border-0 ${index === step ? 'border-b-2 border-b-[#d9711b] bg-[#0d1a4a]' : ''}`}><span className={`block font-data text-[10px] ${index === step ? 'text-[#d9711b]' : 'text-[#9ea8d0]'}`}>0{index + 1}</span><span className={`mt-1 block text-sm ${index === step ? 'text-white' : 'text-[#aeb5d2]'}`}>{label}</span></button>)}</div>
      </div></header>
    <main className="mx-auto max-w-[1000px] space-y-10 px-4 pt-8 xs:px-5 md:pt-14 lg:px-8">
      <section className="border border-[#0d1a4a]/20 bg-white"><div className="flex items-start justify-between border-b border-[#0d1a4a]/15 p-5 xs:p-7 sm:p-9"><div><p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Step 0{step + 1}</p><h1 className="mt-2 font-editorial text-2xl xs:text-3xl sm:text-4xl">{steps[step]}</h1></div><span className="hidden font-editorial text-5xl text-[#eadfc5] xs:block sm:text-6xl">0{step + 1}</span></div>
        <div className="p-5 xs:p-7 sm:p-9">
          {step === 0 && (isInvestment ? <InvestmentOptions form={form} set={set} /> : <RoleOptions form={form} set={set} />)}
          {step === 1 && <DetailsForm isInvestment={isInvestment} form={form} set={set} toggleArray={toggleArray} />}
          {step === 2 && <Verification isInvestment={isInvestment} form={form} set={set} />}
          {step === 3 && <Review isInvestment={isInvestment} rows={memberSummary} />}
          {error && <p className="mt-6 border-l-2 border-[#d9711b] bg-[#fbf4e9] px-4 py-3 text-sm text-[#8b3e09]">{error}</p>}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-[#0d1a4a]/15 bg-[#eee6d0] p-4 xs:p-5 sm:flex-row sm:items-center sm:justify-between"><Button kind="secondary" onClick={previous} disabled={step === 0}>← Back</Button>{step < 3 ? <Button onClick={next}>Continue →</Button> : <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Application'}</Button>}</div>
      </section>
    </main>
  </div>;
}

function InvestmentOptions({ form, set }: { form: FormState; set: (key: string, value: FormState[string]) => void }) {
  return <><div className="grid gap-4 xs:grid-cols-2 md:grid-cols-3">{TIERS.map((tier) => <button type="button" key={tier.value} onClick={() => { set('tier', tier.value); set('amount', tier.value === 'student' ? 50000 : tier.value === 'growth' ? 200000 : 1000000); }} className={`relative min-h-[180px] border p-5 text-left transition-colors xs:p-6 md:min-h-[205px] ${form.tier === tier.value ? 'border-[#0d1a4a] bg-[#f6f2e8]' : 'border-[#0d1a4a]/15 bg-white hover:border-[#0d1a4a]/55'}`}>{form.tier === tier.value && <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#0d1a4a] text-xs text-white">✓</span>}<p className="font-data text-[10px] uppercase tracking-[.14em] text-[#716959]">{tier.value} tier</p><h2 className="mt-2 font-editorial text-2xl">{tier.label}</h2><p className="mt-2 font-editorial text-2xl text-[#d9711b]">{tier.minimum}</p><p className="mt-1 text-xs text-[#5d564b]">Minimum participation</p><p className="mt-5 text-sm leading-5 text-[#5d564b]">{tier.detail}</p></button>)}</div><div className="mt-8 grid gap-4 md:grid-cols-2">{[['quarterly', 'Declared every 3 months', '5%'], ['annual', 'Declared once a year', '15%']].map(([value, title, rate]) => <button type="button" key={value} onClick={() => set('plan', value)} className={`flex items-center justify-between border p-6 text-left ${form.plan === value ? 'border-[#0d1a4a] bg-[#f6f2e8]' : 'border-[#0d1a4a]/15'}`}><div><p className="font-data text-[10px] uppercase tracking-[.14em] text-[#716959]">{value} plan</p><p className="mt-2 text-lg font-bold">{title}</p></div><span className="font-editorial text-4xl text-[#d9711b]">{rate}</span></button>)}</div><p className="mt-6 text-xs leading-5 text-[#665e51]">Return figures are targets based on business performance and SINet&apos;s investment policy. They are not guarantees.</p></>;
}

function RoleOptions({ form, set }: { form: FormState; set: (key: string, value: FormState[string]) => void }) {
  return <><p className="max-w-2xl leading-7 text-[#5b5448]">Every community member, volunteer, ambassador, staff member, and partner registers through this portal — helping SINet stay accountable and connected.</p><div className="mt-7 grid gap-4 xs:grid-cols-2">{ROLES.map((role) => <button type="button" key={role.value} onClick={() => set('role', role.value)} className={`relative min-h-[130px] border p-5 text-left transition-colors xs:min-h-[145px] xs:p-6 ${form.role === role.value ? 'border-[#0d1a4a] bg-[#f6f2e8]' : 'border-[#0d1a4a]/15 bg-white hover:border-[#0d1a4a]/55'}`}>{form.role === role.value && <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#0d1a4a] text-xs text-white">✓</span>}<p className="font-data text-[10px] uppercase tracking-[.14em] text-[#716959]">{role.tag}</p><h2 className="mt-2 font-editorial text-2xl">{role.label}</h2><p className="mt-2 max-w-sm text-sm leading-5 text-[#5b5448]">{role.detail}</p></button>)}</div></>;
}

function Field({ label, value, onChange, type = 'text', placeholder, inputMode }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string; inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase text-[#0d1a4a]">{label}</span><input type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 text-base outline-none transition-colors focus:border-[#0d1a4a]" /></label>;
}

function DetailsForm({ isInvestment, form, set, toggleArray }: { isInvestment: boolean; form: FormState; set: (key: string, value: FormState[string]) => void; toggleArray: (key: string, value: string) => void }) {
  return <div className="space-y-6"><div className="grid gap-5 xs:grid-cols-2"><Field label="Full name" value={form.fullName as string} onChange={(value) => set('fullName', value)} /><Field label="Phone number" value={form.phone as string} onChange={(value) => set('phone', value)} type="tel" inputMode="tel" /><Field label="Email address" value={form.email as string} onChange={(value) => set('email', value)} type="email" inputMode="email" />{isInvestment ? <Field label="Residential address" value={form.residentialAddress as string} onChange={(value) => set('residentialAddress', value)} /> : <Field label="State / location" value={form.location as string} onChange={(value) => set('location', value)} />}{isInvestment && <><Field label="Next of kin — name" value={form.nextOfKinName as string} onChange={(value) => set('nextOfKinName', value)} /><Field label="Next of kin — phone" value={form.nextOfKinPhone as string} onChange={(value) => set('nextOfKinPhone', value)} type="tel" inputMode="tel" /></>}</div>{isInvestment ? <div><Field label="Investment amount (NGN)" value={form.amount as number} onChange={(value) => set('amount', Number(value))} type="number" inputMode="numeric" /><p className="mt-2 text-xs text-[#746b5c]">Minimum for {String(form.tier)} tier: {TIERS.find((t) => t.value === form.tier)?.minimum}</p></div> : <><div><p className="mb-3 text-xs font-bold uppercase">Relevant skills</p><div className="flex flex-wrap gap-2">{SKILLS.map((skill) => <button type="button" key={skill} onClick={() => toggleArray('skills', skill)} className={`min-h-[44px] rounded-full border px-4 py-2 text-sm ${((form.skills as string[]) || []).includes(skill) ? 'border-[#d9a23c] bg-[#eccb7c] text-[#0d1a4a] font-semibold' : 'border-[#0d1a4a]/15 text-[#5b5448]'}`}>{skill}</button>)}</div></div><div><p className="mb-3 text-xs font-bold uppercase">Weekly availability</p><div className="flex flex-wrap gap-2">{AVAILABILITY.map((item) => <button type="button" key={item} onClick={() => toggleArray('availability', item)} className={`min-h-[44px] rounded-full border px-4 py-2 text-sm ${((form.availability as string[]) || []).includes(item) ? 'border-[#0d1a4a] bg-[#0d1a4a] text-white' : 'border-[#0d1a4a]/15 text-[#5b5448]'}`}>{item}</button>)}</div></div><label className="block"><span className="mb-2 block text-xs font-bold uppercase">Why do you want to join SINet?</span><textarea value={form.motivation as string} onChange={(event) => set('motivation', event.target.value)} rows={4} className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 text-base outline-none focus:border-[#0d1a4a]" /></label></>}</div>;
}

function Verification({ isInvestment, form, set }: { isInvestment: boolean; form: FormState; set: (key: string, value: FormState[string]) => void }) {
  const checked = isInvestment ? Boolean(form.agreementAccepted) : Boolean(form.codeOfConductAccepted);
  const key = isInvestment ? 'agreementAccepted' : 'codeOfConductAccepted';
  const items = isInvestment ? [['Investor Registration Form', 'Auto-generated from your details'], ['Participation Agreement', 'Review the acknowledgement below'], ['Payment acknowledgement', 'Issued after application review']] : [['Member Registration Form', 'Auto-generated from your details'], ['Identity verification', 'Requested securely by the review team'], ['Code of Conduct', 'Review the acknowledgement below']];
  return <><div className="border border-[#0d1a4a]/20">{items.map(([title, description], index) => <div key={title} className={`flex items-center gap-4 p-5 ${index ? 'border-t border-[#0d1a4a]/15' : ''}`}><span className="flex h-6 w-6 items-center justify-center rounded bg-[#d9711b] text-sm text-white">✓</span><div><p className="font-bold">{title}</p><p className="font-data text-[10px] uppercase tracking-[.1em] text-[#71695d]">{description}</p></div></div>)}</div><label className="mt-7 flex cursor-pointer gap-4 border border-[#0d1a4a]/20 bg-[#f6f2e8] p-4 text-sm leading-6 xs:p-5"><input type="checkbox" checked={checked} onChange={(event) => set(key, event.target.checked)} className="mt-0.5 h-6 w-6 flex-shrink-0 accent-[#0d1a4a]" /><span>{isInvestment ? 'I have read and agree to the SINet Participation Agreement. I understand that returns are targets based on business performance, are not guaranteed, and are subject to SINet’s investment policy.' : 'I confirm that my details are accurate and agree to represent SINet’s community values. I understand that this registration is subject to review before role assignment is confirmed.'}</span></label></>;
}

function Review({ isInvestment, rows }: { isInvestment: boolean; rows: string[][] }) {
  return <><div className="grid gap-x-8 xs:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-[#0d1a4a]/15 py-4 text-sm"><span className="text-[#5e574b]">{label}</span><strong className="text-right">{value}</strong></div>)}</div><p className="mt-8 border-l-2 border-[#d9711b] bg-[#f6f2e8] px-5 py-4 text-sm leading-6 text-[#5c5549]">{isInvestment ? 'Returns shown are targets, not guarantees. Actual performance is determined by real business activity and is subject to SINet’s investment policy.' : 'Applications are reviewed by the relevant community team. You will be notified by email once your role is confirmed or if more information is needed.'}</p></>;
}
