'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AcademyInterestSchema, AcademyInterestFormData } from '@/lib/schemas/academy.schema';
import { FormField, Input, Button } from '../ui';
import { trackEvent } from '@/lib/analytics';

export function AcademyInterestForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AcademyInterestFormData>({
    resolver: zodResolver(AcademyInterestSchema),
  });

  const onSubmit = async (data: AcademyInterestFormData) => {
    setStatus('loading');
    try {
      const res = await fetch('/api/academy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, website: '' }),
      });

      if (res.ok) {
        setStatus('success');
        trackEvent('academy_interest_submit', {});
        reset();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to register interest');
      }
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage((err as Error).message || 'Failed to register interest');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-emerald-50 text-emerald-900 p-6 rounded-2xl border border-emerald-200 shadow-sm text-center">
        <h3 className="text-xl font-bold mb-2">Registration Successful!</h3>
        <p className="text-xs leading-relaxed text-emerald-700">
          Thank you for your interest in the SINet Academy. We will notify you as soon as the curriculum launches.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setStatus('idle')}
        >
          Register another
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/90"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-brand-ink mb-1 font-editorial">Register Your Interest</h3>
        <p className="text-xs text-slate-500">Be the first to know when the Academy curriculum goes live.</p>
      </div>

      <div className="space-y-4 mb-6">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          {...register('website')}
        />

        <FormField
          id="fullName"
          label="Full Name"
          required
          error={errors.fullName?.message}
        >
          <Input
            id="fullName"
            type="text"
            disabled={status === 'loading'}
            error={Boolean(errors.fullName)}
            placeholder="e.g. Samuel Adekunle"
            {...register('fullName')}
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
            placeholder="you@domain.com"
            {...register('email')}
          />
        </FormField>
      </div>

      {status === 'error' && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        loading={status === 'loading'}
        disabled={status === 'loading'}
        className="w-full"
      >
        {status === 'loading' ? 'Submitting…' : 'Join Academy Waitlist →'}
      </Button>
    </form>
  );
}
