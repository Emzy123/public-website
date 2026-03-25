'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/Button';

const captureSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type CaptureForm = z.infer<typeof captureSchema>;

export function EmailCapture() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CaptureForm>({
    resolver: zodResolver(captureSchema)
  });

  const onSubmit = async (data: CaptureForm) => {
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: data.email,
          fullName: 'Subscriber',
          country: 'Unknown',
          userType: 'investor',
          sectorInterest: 'General',
          investmentInterest: 'General',
          hearAbout: 'Website Inline',
          consent: true
        })
      });
      
      if (res.ok) {
        setStatus('success');
        reset();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to subscribe');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200">
        <p className="font-medium">Thanks for joining! We'll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-grow">
          <label htmlFor="inline-email" className="sr-only">Email address</label>
          <input
            id="inline-email"
            type="email"
            placeholder="Enter your email address"
            className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'inline-email-error' : undefined}
            disabled={status === 'loading'}
            {...register('email')}
          />
        </div>
        <Button 
          type="submit" 
          disabled={status === 'loading'}
          className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
        >
          {status === 'loading' ? 'Joining...' : 'Join Now'}
        </Button>
      </div>
      {errors.email && (
        <p id="inline-email-error" className="mt-2 text-sm text-red-600 text-left">
          {errors.email.message}
        </p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600 text-left">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
