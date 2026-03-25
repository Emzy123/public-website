'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AcademyInterestSchema, AcademyInterestFormData } from '@/lib/schemas/academy.schema';
import { Button } from '../ui/Button';
import { trackEvent } from '@/lib/analytics';

export function AcademyInterestForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AcademyInterestFormData>({
    resolver: zodResolver(AcademyInterestSchema)
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
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 text-green-800 p-6 rounded-xl border border-green-200 shadow-sm text-center">
        <h3 className="text-xl font-bold mb-2">Registration Successful!</h3>
        <p>Thank you for your interest in the SINet Academy. We'll notify you as soon as we launch.</p>
        <Button variant="ghost" className="mt-4 border border-green-300" onClick={() => setStatus('idle')}>Register another</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-100">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Register Your Interest</h3>
        <p className="text-slate-600">Be the first to know when the Academy curriculum goes live.</p>
      </div>

      <div className="space-y-4 mb-6">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          {...register('website')}
        />
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
          <input
            id="fullName"
            type="text"
            className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
            aria-invalid={errors.fullName ? 'true' : 'false'}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            disabled={status === 'loading'}
            {...register('fullName')}
          />
          {errors.fullName && <p id="fullName-error" className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
          <input
            id="email"
            type="email"
            className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            disabled={status === 'loading'}
            {...register('email')}
          />
          {errors.email && <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={status === 'loading'}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
      >
        {status === 'loading' ? 'Submitting...' : 'Join Academy Waitlist'}
      </Button>
    </form>
  );
}
