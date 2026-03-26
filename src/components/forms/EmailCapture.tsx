'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/Button';
import { ReCAPTCHA } from '@/components/common/ReCAPTCHA';

const captureSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type CaptureForm = z.infer<typeof captureSchema>;

export function EmailCapture() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CaptureForm>({
    resolver: zodResolver(captureSchema)
  });

  useEffect(() => {
    const loadToken = async () => {
      try {
        const response = await fetch('/api/waitlist', { method: 'GET' });
        const csrfHeader = response.headers.get('x-csrf-token') ?? '';
        const data = await response.json().catch(() => ({}));
        setCsrfToken(csrfHeader || (data as any)?.csrfToken || '');
      } catch {
        setErrorMessage('Unable to initialize secure form.');
      }
    };

    loadToken();
  }, []);

  const onSubmit = async (data: CaptureForm) => {
    setStatus('loading');
    try {
      if (!csrfToken || !recaptchaToken) {
        setStatus('error');
        setErrorMessage('Security check is still initializing. Please wait a moment and try again.');
        return;
      }

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: window.location.origin,
        },
        body: JSON.stringify({
          email: data.email,
          fullName: 'Subscriber',
          country: 'Unknown',
          userType: 'investor',
          sectorInterest: 'General',
          hearAbout: 'Website Inline',
          consent: true,
          website: '',
          csrfToken,
          recaptchaToken,
        }),
      });
      
      if (res.ok) {
        setStatus('success');
        reset();
      } else {
        const errData = await res.json().catch(() => null) as
          | { error?: string; message?: string; errors?: Record<string, string> }
          | null;

        const message =
          (errData?.error && String(errData.error)) ||
          (errData?.message && String(errData.message)) ||
          (errData?.errors ? Object.values(errData.errors).join(', ') : null) ||
          'Failed to subscribe';

        throw new Error(message);
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
          disabled={status === 'loading' || !csrfToken || !recaptchaToken}
          className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
        >
          {status === 'loading' ? 'Joining...' : 'Join Now'}
        </Button>
      </div>

      <ReCAPTCHA onToken={setRecaptchaToken} />

      {(!csrfToken || !recaptchaToken) && status !== 'error' && (
        <p className="mt-3 text-sm text-slate-500">
          Initializing security check...
        </p>
      )}

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
