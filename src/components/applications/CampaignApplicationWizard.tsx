'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { APPLICATION_ROLES, ROLE_LABELS, normalizeRoleSlug, type ApplicationRole } from '@/lib/types/membership';
import {
  ROLE_DEFINITIONS,
  WIZARD_STEP_LABELS,
  type RoleFieldDef,
  type RoleDocumentDef,
} from '@/lib/applications/role-definitions';

type FormState = Record<string, string | string[] | boolean | Record<string, string>>;

function Button({
  children,
  onClick,
  disabled,
  kind = 'primary',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: 'primary' | 'secondary';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] w-full px-6 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
        kind === 'primary'
          ? 'bg-[#d9711b] text-white hover:bg-[#b9560b]'
          : 'border border-[#0d1a4a]/35 text-[#0d1a4a] hover:border-[#0d1a4a]'
      }`}
    >
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
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!consent) {
      setError('Please confirm you agree to be contacted when applications reopen.');
      return;
    }
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
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 outline-none focus:border-[#0d1a4a]"
              />
            </label>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span>I agree to be contacted by SINet when applications reopen for this campaign.</span>
            </label>
            {error && <p className="text-sm text-[#8b3e09]">{error}</p>}
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Join waitlist'}
            </Button>
          </div>
        )}
        <Link href="/membership" className="mt-9 inline-flex text-sm font-bold text-[#d9711b] hover:underline">
          Learn about membership →
        </Link>
      </div>
    </div>
  );
}

function emptyDocuments(role: ApplicationRole): Record<string, string> {
  const docs: Record<string, string> = {};
  for (const d of ROLE_DEFINITIONS[role].documents) docs[d.key] = '';
  return docs;
}

function emptyRoleFields(role: ApplicationRole): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const f of ROLE_DEFINITIONS[role].fields) {
    out[f.key] = f.type === 'multiselect' ? [] : '';
  }
  return out;
}

export function CampaignApplicationWizard({ slug, allowedRoles }: { slug: string; allowedRoles: ApplicationRole[] }) {
  const searchParams = useSearchParams();
  const availableRoles =
    allowedRoles && allowedRoles.length > 0
      ? APPLICATION_ROLES.filter((r) => allowedRoles.includes(r))
      : [...APPLICATION_ROLES];
  const roles = availableRoles.length > 0 ? availableRoles : [...APPLICATION_ROLES];
  const queryRole = normalizeRoleSlug(searchParams?.get('role'));
  const isConflict = Boolean(queryRole && !roles.includes(queryRole));
  // Only preselect if the normalized query role is explicitly permitted for this campaign
  const effectiveRole: ApplicationRole | '' = queryRole && roles.includes(queryRole) ? queryRole : '';
  const conflictMessage = isConflict && queryRole
    ? `The requested role (${ROLE_LABELS[queryRole] || queryRole}) is not available for this campaign. Please select an open role below:`
    : null;
  const steps = [...WIZARD_STEP_LABELS];

  const [form, setForm] = useState<FormState>(() => ({
    role: effectiveRole,
    fullName: '',
    email: '',
    phone: '',
    website: '',
    codeOfConductAccepted: false,
    documents: effectiveRole ? emptyDocuments(effectiveRole) : {},
    documentNames: {},
    ...(effectiveRole ? emptyRoleFields(effectiveRole) : {}),
  }));
  const [step, setStep] = useState(0);
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    fetch(`/api/join/${slug}`)
      .then((r) => setCsrfToken(r.headers.get('x-csrf-token') || ''))
      .catch(() => undefined);
  }, [slug]);

  const role = (form.role ? String(form.role) : '') as ApplicationRole | '';
  const definition = role ? ROLE_DEFINITIONS[role] : null;
  const selectedRoleLabel = role ? ROLE_LABELS[role] || role : '';

  const set = (key: string, value: FormState[string]) => setForm((c) => ({ ...c, [key]: value }));

  const selectRole = (next: ApplicationRole) => {
    setError('');
    setForm({
      role: next,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      website: form.website,
      codeOfConductAccepted: form.codeOfConductAccepted,
      documents: emptyDocuments(next),
      documentNames: {},
      ...emptyRoleFields(next),
    });
  };

  useEffect(() => {
    if (queryRole && roles.includes(queryRole) && form.role !== queryRole && step === 0) {
      selectRole(queryRole);
    }
  }, [queryRole, roles, step]);

  const toggleArray = (key: string, value: string) => {
    const values = (form[key] as string[]) || [];
    set(key, values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  const documents = useMemo(
    () => (form.documents as Record<string, string>) || {},
    [form.documents]
  );
  const documentNames = useMemo(
    () => (form.documentNames as Record<string, string>) || {},
    [form.documentNames]
  );

  const validateStep = () => {
    if (step === 0) {
      if (!role || !roles.includes(role)) {
        setError('Please select a membership role to proceed.');
        return false;
      }
    }
    if (step === 1) {
      if (!String(form.fullName || '').trim() || !String(form.email || '').trim() || !String(form.phone || '').trim()) {
        setError('Complete all contact details.');
        return false;
      }
      if (!String(form.email).includes('@')) {
        setError('Enter a valid email address.');
        return false;
      }
    }
    if (step === 2 && definition) {
      for (const field of definition.fields) {
        if (field.required === false) continue;
        const val = form[field.key];
        if (field.type === 'multiselect') {
          if (!Array.isArray(val) || val.length < (field.minItems ?? 1)) {
            setError(`Please complete: ${field.label}`);
            return false;
          }
        } else if (!String(val ?? '').trim()) {
          setError(`Please complete: ${field.label}`);
          return false;
        } else if (field.minLength && String(val).trim().length < field.minLength) {
          setError(`${field.label} needs a bit more detail.`);
          return false;
        }
      }
    }
    if (step === 3 && definition) {
      for (const doc of definition.documents) {
        if (!doc.required) continue;
        if (!documents[doc.key]) {
          setError(`Please upload: ${doc.label}`);
          return false;
        }
      }
    }
    if (step === 4 && !form.codeOfConductAccepted) {
      setError('Please confirm the verification and code-of-conduct statement.');
      return false;
    }
    setError('');
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((c) => Math.min(c + 1, steps.length - 1));
  };
  const previous = () => {
    setError('');
    setStep((c) => Math.max(c - 1, 0));
  };

  const uploadDocument = async (doc: RoleDocumentDef, file: File) => {
    if (!role) return;
    setUploading(doc.key);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('role', role);
      body.append('docKey', doc.key);
      const res = await fetch(`/api/join/${slug}/documents`, {
        method: 'POST',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
        body,
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Upload failed.');
      setForm((c) => ({
        ...c,
        documents: { ...(c.documents as Record<string, string>), [doc.key]: result.id },
        documentNames: { ...(c.documentNames as Record<string, string>), [doc.key]: file.name },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    if (!role || !definition) {
      setError('Please select a membership role before submitting.');
      return;
    }
    if (!validateStep()) return;
    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        role,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        codeOfConductAccepted: true,
        documents: {},
      };
      for (const field of definition.fields) {
        payload[field.key] = form[field.key];
      }
      const docsPayload: Record<string, string> = {};
      for (const doc of definition.documents) {
        if (documents[doc.key]) docsPayload[doc.key] = documents[doc.key];
      }
      payload.documents = docsPayload;

      const res = await fetch(`/api/join/${slug}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify(payload),
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

  const reviewRows = useMemo(() => {
    const rows: [string, string][] = [
      ['Role', selectedRoleLabel],
      ['Name', String(form.fullName || '—')],
      ['Email', String(form.email || '—')],
      ['Phone', String(form.phone || '—')],
    ];
    if (definition) {
      for (const field of definition.fields) {
        const val = form[field.key];
        rows.push([field.label, Array.isArray(val) ? val.join(', ') : String(val || '—')]);
      }
      for (const doc of definition.documents) {
        rows.push([doc.label, documentNames[doc.key] || (documents[doc.key] ? 'Uploaded' : '—')]);
      }
    }
    return rows;
  }, [definition, form, selectedRoleLabel, documents, documentNames]);

  if (complete) {
    return (
      <div className="min-h-screen bg-[#f6f2e8] px-4 py-16 xs:px-5 md:py-24">
        <div className="mx-auto max-w-xl border border-[#0d1a4a]/20 bg-white p-6 text-center xs:p-10">
          <p className="font-data text-xs uppercase tracking-[.16em] text-[#d9711b]">Application received</p>
          <h1 className="mt-5 font-editorial text-4xl xs:text-5xl">Thank you.</h1>
          <p className="mx-auto mt-6 max-w-md leading-7 text-[#585146]">
            Your application has been recorded for review. We will contact you using the email address you provided.
          </p>
          <Link href="/" className="mt-9 inline-flex bg-[#0d1a4a] px-6 py-3 text-sm font-bold text-white">
            Back to SINet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f2e8] pb-24 text-[#0d1a4a]">
      {/* honeypot */}
      <input
        type="text"
        name="website"
        value={String(form.website || '')}
        onChange={(e) => set('website', e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />
      <header className="bg-[#0d1a4a] text-[#f6f2e8]">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-4 py-5 xs:px-5 xs:py-6 lg:px-8">
          <Link href="/" className="font-editorial text-xl font-semibold xs:text-2xl">
            SINet. — Join
          </Link>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Your answers will not be saved. Are you sure you want to leave?')) {
                window.location.href = '/';
              }
            }}
            className="flex min-h-[44px] items-center font-data text-[11px] uppercase tracking-[.12em] text-[#eccb7c] hover:underline"
          >
            Leave application
          </button>
        </div>
        <div className="border-t-2 border-[#d9711b] bg-[#16296b]">
          <div className="mx-auto hidden max-w-[1160px] grid-cols-6 md:grid">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => index <= step && setStep(index)}
                className={`border-r border-white/15 px-1 py-4 text-center last:border-0 ${
                  index === step ? 'border-b-2 border-b-[#d9711b] bg-[#0d1a4a]' : ''
                }`}
              >
                <span className={`block font-data text-[10px] ${index === step ? 'text-[#d9711b]' : 'text-[#9ea8d0]'}`}>
                  0{index + 1}
                </span>
                <span className={`mt-1 block text-xs ${index === step ? 'text-white' : 'text-[#aeb5d2]'}`}>{label}</span>
              </button>
            ))}
          </div>
          <p className="px-4 py-3 text-center text-sm text-[#aeb5d2] md:hidden">
            Step {step + 1} of {steps.length}: {steps[step]}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] space-y-10 px-4 pt-8 xs:px-5 md:pt-14 lg:px-8">
        <section className="border border-[#0d1a4a]/20 bg-white">
          <div className="border-b border-[#0d1a4a]/15 p-5 xs:p-7 sm:p-9">
            <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Step 0{step + 1}</p>
            <h1 className="mt-2 font-editorial text-2xl xs:text-3xl sm:text-4xl">{steps[step]}</h1>
            {step > 0 && (
              <p className="mt-2 text-sm text-[#716959]">
                Applying as <strong>{selectedRoleLabel}</strong>
              </p>
            )}
          </div>

          <div className="p-5 xs:p-7 sm:p-9">
            {step === 0 && (
              <div>
                {conflictMessage && (
                  <div
                    data-testid="role-conflict-notice"
                    className="mb-6 border-l-4 border-[#d9711b] bg-[#fbf4e9] p-4 text-sm text-[#8b3e09]"
                  >
                    <p className="font-semibold">{conflictMessage}</p>
                  </div>
                )}
                {!form.role && (
                  <p
                    data-testid="neutral-role-picker-prompt"
                    className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#716959]"
                  >
                    Choose an available role below:
                  </p>
                )}
                <div className="grid gap-4 xs:grid-cols-2">
                  {roles.map((r) => {
                    const d = ROLE_DEFINITIONS[r];
                    return (
                      <button
                        type="button"
                        key={r}
                        data-testid={`role-card-${r}`}
                        onClick={() => selectRole(r)}
                        className={`relative min-h-[130px] border p-5 text-left transition-all ${
                          form.role === r ? 'border-[#0d1a4a] bg-[#f6f2e8] shadow-xs' : 'border-[#0d1a4a]/15 bg-white hover:border-[#0d1a4a]/55'
                        }`}
                      >
                        <p className="font-data text-[10px] uppercase tracking-[.14em] text-[#716959]">{d.tag}</p>
                        <h2 className="mt-2 font-editorial text-2xl">{d.label}</h2>
                        <p className="mt-2 text-sm leading-5 text-[#5b5448]">{d.detail}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5 xs:grid-cols-2">
                <Field label="Full name" value={String(form.fullName || '')} onChange={(v) => set('fullName', v)} />
                <Field label="Phone number" value={String(form.phone || '')} onChange={(v) => set('phone', v)} type="tel" />
                <Field
                  label="Email address"
                  value={String(form.email || '')}
                  onChange={(v) => set('email', v)}
                  type="email"
                  className="xs:col-span-2"
                />
              </div>
            )}

            {step === 2 && definition && (
              <div className="space-y-6">
                {definition.fields.map((field) => (
                  <RoleFieldInput
                    key={field.key}
                    field={field}
                    value={form[field.key]}
                    onChange={(v) => set(field.key, v)}
                    onToggle={(v) => toggleArray(field.key, v)}
                  />
                ))}
              </div>
            )}

            {step === 3 && definition && (
              <div className="space-y-6">
                <p className="text-sm leading-6 text-[#5b5448]">
                  Upload the documents required for the <strong>{selectedRoleLabel}</strong> role. PDF is preferred where possible.
                </p>
                {definition.documents.map((doc) => (
                  <div key={doc.key} className="border border-[#0d1a4a]/15 p-4">
                    <p className="text-xs font-bold uppercase">
                      {doc.label}
                      {doc.required ? ' *' : ' (optional)'}
                    </p>
                    {doc.helpText && <p className="mt-1 text-sm text-[#716959]">{doc.helpText}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-flex min-h-[44px] cursor-pointer items-center bg-[#0d1a4a] px-4 text-sm font-semibold text-white">
                        {uploading === doc.key ? 'Uploading…' : documents[doc.key] ? 'Replace file' : 'Choose file'}
                        <input
                          type="file"
                          accept={doc.accept}
                          className="hidden"
                          disabled={uploading === doc.key}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadDocument(doc, file);
                          }}
                        />
                      </label>
                      {documentNames[doc.key] && (
                        <span className="text-sm text-[#0d1a4a]">{documentNames[doc.key]} ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <label className="flex items-start gap-3 text-sm leading-6">
                <input
                  type="checkbox"
                  checked={Boolean(form.codeOfConductAccepted)}
                  onChange={(e) => set('codeOfConductAccepted', e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I confirm that my details are accurate and agree to represent SINet&apos;s community values. This
                  registration is subject to review before role assignment is confirmed.
                </span>
              </label>
            )}

            {step === 5 && (
              <div className="space-y-2">
                {reviewRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-[#f0eae0] py-2 text-sm">
                    <span className="text-[#7b7263]">{label}</span>
                    <span className="max-w-[60%] text-right font-medium text-[#0d1a4a]">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-6 border-l-2 border-[#d9711b] bg-[#fbf4e9] px-4 py-3 text-sm text-[#8b3e09]">{error}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#0d1a4a]/15 bg-[#eee6d0] p-4 xs:p-5 sm:flex-row sm:items-center sm:justify-between">
            <Button kind="secondary" onClick={previous} disabled={step === 0}>
              ← Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={next} disabled={Boolean(uploading)}>
                Continue →
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Application'}
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-bold uppercase">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 outline-none focus:border-[#0d1a4a]"
      />
    </label>
  );
}

function RoleFieldInput({
  field,
  value,
  onChange,
  onToggle,
}: {
  field: RoleFieldDef;
  value: FormState[string] | undefined;
  onChange: (v: string | string[]) => void;
  onToggle: (v: string) => void;
}) {
  if (field.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div>
        <p className="mb-3 text-xs font-bold uppercase">
          {field.label}
          {field.required !== false ? ' *' : ''}
        </p>
        {field.helpText && <p className="mb-2 text-sm text-[#716959]">{field.helpText}</p>}
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => onToggle(item)}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm ${
                selected.includes(item)
                  ? 'border-[#0d1a4a] bg-[#0d1a4a] text-white'
                  : 'border-[#0d1a4a]/15 text-[#5b5448]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase">
          {field.label}
          {field.required !== false ? ' *' : ''}
        </span>
        {field.helpText && <span className="mb-2 block text-sm text-[#716959]">{field.helpText}</span>}
        <select
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 outline-none focus:border-[#0d1a4a]"
        >
          <option value="">Select…</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase">
          {field.label}
          {field.required !== false ? ' *' : ''}
        </span>
        {field.helpText && <span className="mb-2 block text-sm text-[#716959]">{field.helpText}</span>}
        <textarea
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 outline-none focus:border-[#0d1a4a]"
        />
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase">
        {field.label}
        {field.required !== false ? ' *' : ''}
      </span>
      {field.helpText && <span className="mb-2 block text-sm text-[#716959]">{field.helpText}</span>}
      <input
        type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'phone' ? 'tel' : 'text'}
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full border border-[#0d1a4a]/20 bg-[#f6f2e8] px-4 py-3.5 outline-none focus:border-[#0d1a4a]"
      />
    </label>
  );
}
