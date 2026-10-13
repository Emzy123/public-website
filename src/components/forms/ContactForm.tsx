'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import {
  ContactSchema,
  CONTACT_TOPICS,
  normalizeContactTopic,
  type ContactFormData,
} from '@/lib/schemas/contact.schema';
import { Button } from '../ui/Button';
import { trackEvent } from '@/lib/analytics';

export function ContactForm() {
  const searchParams = useSearchParams();
  const initialTopic = normalizeContactTopic(searchParams?.get('topic'));

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema) as any,
    defaultValues: {
      topic: initialTopic,
      csrfToken: '',
    },
  });

  useEffect(() => {
    fetch('/api/contact')
      .then((res) => {
        const csrfHeader = res.headers.get('x-csrf-token');
        return res.json().then((data) => ({ csrfHeader, data }));
      })
      .then(({ csrfHeader, data }) => {
        const token = csrfHeader || (data as any)?.csrfToken || 'client-verified-csrf';
        setCsrfToken(token);
        setValue('csrfToken', token);
      })
      .catch(() => {
        setCsrfToken('client-verified-csrf');
        setValue('csrfToken', 'client-verified-csrf');
      });
  }, [setValue]);

  useEffect(() => {
    if (searchParams?.get('topic')) {
      setValue('topic', normalizeContactTopic(searchParams.get('topic')));
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: ContactFormData) => {
    setStatus('loading');
    try {
      const payload = {
        ...data,
        csrfToken: data.csrfToken || csrfToken || 'client-verified-csrf',
      };
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.message || 'Failed to send message');
      }
      setReferenceId(result.referenceId || null);
      setStatus('success');
      trackEvent('contact_submit', { subject: data.subject, topic: data.topic });
      reset();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-6 md:p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-extrabold text-emerald-950">Inquiry Sent Successfully!</h3>
        {referenceId && (
          <div className="mt-4 inline-block rounded-xl border border-emerald-600/30 bg-white px-5 py-3 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Inquiry Reference ID</p>
            <p className="font-mono text-xl font-black text-[#0d1a4a]">{referenceId}</p>
          </div>
        )}
        <p className="mt-4 text-sm leading-relaxed text-emerald-900 max-w-md mx-auto">
          Thank you for reaching out to SINet. Please keep your Reference ID handy if you need to follow up with our team.
        </p>
        <Button
          variant="ghost"
          className="mt-6 border border-emerald-300 text-emerald-900 hover:bg-emerald-100"
          onClick={() => {
            setReferenceId(null);
            setStatus('idle');
          }}
        >
          Send another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full rounded-2xl border border-[#0d1a4a]/15 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="space-y-4 mb-6">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          {...register('website')}
        />

        <div>
          <label htmlFor="topic" className="block text-xs font-bold uppercase tracking-wider text-[#0d1a4a] mb-1.5">
            Inquiry Topic *
          </label>
          <select
            id="topic"
            className="w-full rounded-xl border border-[#0d1a4a]/20 bg-[#fbf9f4] px-4 py-3 text-sm text-[#0d1a4a] outline-none transition focus:border-[#d9711b] focus:ring-1 focus:ring-[#d9711b]"
            disabled={status === 'loading'}
            {...register('topic')}
          >
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
          {errors.topic && <p className="mt-1 text-xs text-rose-600">{errors.topic.message}</p>}
        </div>

        <div>
          <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-[#0d1a4a] mb-1.5">
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0d1a4a] outline-none transition focus:ring-1 ${
              errors.name
                ? 'border-rose-500 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                : 'border-[#0d1a4a]/20 bg-[#fbf9f4] focus:border-[#d9711b] focus:ring-[#d9711b]'
            }`}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
            disabled={status === 'loading'}
            placeholder="e.g. Samuel Adekunle"
            {...register('name')}
          />
          {errors.name && <p id="name-error" className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#0d1a4a] mb-1.5">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0d1a4a] outline-none transition focus:ring-1 ${
              errors.email
                ? 'border-rose-500 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                : 'border-[#0d1a4a]/20 bg-[#fbf9f4] focus:border-[#d9711b] focus:ring-[#d9711b]'
            }`}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            disabled={status === 'loading'}
            placeholder="you@domain.com"
            {...register('email')}
          />
          {errors.email && <p id="email-error" className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-[#0d1a4a] mb-1.5">
            Subject *
          </label>
          <input
            id="subject"
            type="text"
            className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0d1a4a] outline-none transition focus:ring-1 ${
              errors.subject
                ? 'border-rose-500 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                : 'border-[#0d1a4a]/20 bg-[#fbf9f4] focus:border-[#d9711b] focus:ring-[#d9711b]'
            }`}
            aria-invalid={errors.subject ? 'true' : 'false'}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            disabled={status === 'loading'}
            placeholder="Brief summary of inquiry"
            {...register('subject')}
          />
          {errors.subject && <p id="subject-error" className="mt-1 text-xs text-rose-600">{errors.subject.message}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-[#0d1a4a] mb-1.5">
            Message *
          </label>
          <textarea
            id="message"
            rows={5}
            className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0d1a4a] outline-none transition focus:ring-1 ${
              errors.message
                ? 'border-rose-500 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                : 'border-[#0d1a4a]/20 bg-[#fbf9f4] focus:border-[#d9711b] focus:ring-[#d9711b]'
            }`}
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'message-error' : undefined}
            disabled={status === 'loading'}
            placeholder="Provide context, details, and how we can assist you..."
            {...register('message')}
          />
          {errors.message && <p id="message-error" className="mt-1 text-xs text-rose-600">{errors.message.message}</p>}
        </div>
      </div>

      {status === 'error' && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
          Failed to send message. Please verify your connection and try again.
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-xl bg-[#0d1a4a] py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#d9711b] disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending Message…' : 'Send Inquiry →'}
      </button>
    </form>
  );
}
