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
import { FormField, Input, Select, Textarea, Button } from '../ui';
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

        <FormField
          id="topic"
          label="Inquiry Topic"
          required
          error={errors.topic?.message}
        >
          <Select
            id="topic"
            disabled={status === 'loading'}
            error={Boolean(errors.topic)}
            {...register('topic')}
          >
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          id="name"
          label="Full Name"
          required
          error={errors.name?.message}
        >
          <Input
            id="name"
            type="text"
            disabled={status === 'loading'}
            error={Boolean(errors.name)}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
            placeholder="e.g. Samuel Adekunle"
            {...register('name')}
          />
        </FormField>

        <FormField
          id="email"
          label="Email Address"
          required
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            disabled={status === 'loading'}
            error={Boolean(errors.email)}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            placeholder="you@domain.com"
            {...register('email')}
          />
        </FormField>

        <FormField
          id="subject"
          label="Subject"
          required
          error={errors.subject?.message}
        >
          <Input
            id="subject"
            type="text"
            disabled={status === 'loading'}
            error={Boolean(errors.subject)}
            aria-invalid={errors.subject ? 'true' : 'false'}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            placeholder="Brief summary of inquiry"
            {...register('subject')}
          />
        </FormField>

        <FormField
          id="message"
          label="Message"
          required
          error={errors.message?.message}
        >
          <Textarea
            id="message"
            rows={5}
            disabled={status === 'loading'}
            error={Boolean(errors.message)}
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'message-error' : undefined}
            placeholder="Provide context, details, and how we can assist you..."
            {...register('message')}
          />
        </FormField>
      </div>

      {status === 'error' && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
          Failed to send message. Please verify your connection and try again.
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        loading={status === 'loading'}
        disabled={status === 'loading'}
        className="w-full uppercase tracking-wider text-xs"
      >
        {status === 'loading' ? 'Sending Message…' : 'Send Inquiry →'}
      </Button>
    </form>
  );
}
