'use client';
import React, { useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { waitlistSchema, WaitlistFormData } from '@/lib/validation';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { trackEvent } from '@/lib/analytics';
import { ReCAPTCHA } from '@/components/common/ReCAPTCHA';
import { sectors, userTypes, investmentInterests } from '@/lib/constants';

const waitlistClientSchema = waitlistSchema.omit({
  csrfToken: true,
  recaptchaToken: true,
});

type WaitlistClientFormData = Omit<WaitlistFormData, 'csrfToken' | 'recaptchaToken'>;

export function WaitlistForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<WaitlistClientFormData>({
    resolver: zodResolver(waitlistClientSchema),
    defaultValues: {
      consent: false,
      website: '',
    },
  });

  React.useEffect(() => {
    const loadToken = async () => {
      const response = await fetch('/api/waitlist', { method: 'GET' });
      const csrfHeader = response.headers.get('x-csrf-token') ?? '';
      const data = await response.json().catch(() => ({}));
      setCsrfToken(csrfHeader || (data as any)?.csrfToken || '');
    };
    loadToken().catch(() => setErrorMessage('Unable to initialize secure form.'));
  }, []);

  const onSubmit = async (data: WaitlistClientFormData) => {
    setErrorMessage('');
    if (!csrfToken) {
      setStatus('error');
      setErrorMessage('Security check is still initializing. Please wait a moment and try again.');
      return;
    }

    if (!recaptchaToken) {
      setStatus('error');
      setErrorMessage('reCAPTCHA was not initialized. Disable blockers/privacy extensions or refresh the page.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: window.location.origin,
        },
        body: JSON.stringify({ ...data, csrfToken, recaptchaToken, website: '' })
      });
      
      if (res.ok) {
        trackEvent('waitlist_submit', {
          user_type: data.userType,
          sector_interest: data.sectorInterest,
        });
        router.push('/waitlist/success');
      } else {
        const errData = await res.json();
        throw new Error(errData.error || errData.message || 'Failed to submit form');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  const onInvalid = (formErrors: FieldErrors<WaitlistClientFormData>) => {
    setStatus('error');
    setErrorMessage('Please complete all required fields before submitting.');

    // Bring the first invalid field into view so submit never feels unresponsive.
    const firstErrorField = Object.keys(formErrors)[0];
    if (!firstErrorField) return;
    const el = document.getElementById(firstErrorField);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if ('focus' in el && typeof (el as HTMLElement).focus === 'function') {
      (el as HTMLElement).focus();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="w-full bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-slate-100">
        <ReCAPTCHA
          onToken={setRecaptchaToken}
          onError={(message) => {
            setStatus('error');
            setErrorMessage(message);
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-1">Phone Number (Optional)</label>
            <input
              id="phoneNumber"
              type="tel"
              className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-300`}
              disabled={status === 'loading'}
              {...register('phoneNumber')}
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
            <select
              id="country"
              className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.country ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
              aria-invalid={errors.country ? 'true' : 'false'}
              aria-describedby={errors.country ? 'country-error' : undefined}
              disabled={status === 'loading'}
              {...register('country')}
            >
              <option value="">Select a country...</option>
              <option value="NG">Nigeria</option>
              <option value="KE">Kenya</option>
              <option value="ZA">South Africa</option>
              <option value="GH">Ghana</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
            </select>
            {errors.country && <p id="country-error" className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
          </div>

          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-slate-700 mb-1">I am a... *</label>
            <select
              id="userType"
              className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.userType ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
              aria-invalid={errors.userType ? 'true' : 'false'}
              aria-describedby={errors.userType ? 'userType-error' : undefined}
              disabled={status === 'loading'}
              {...register('userType')}
            >
              <option value="">Select type...</option>
              {userTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.userType && <p id="userType-error" className="mt-1 text-sm text-red-600">{errors.userType.message}</p>}
          </div>

          <div>
            <label htmlFor="sectorInterest" className="block text-sm font-medium text-slate-700 mb-1">Empire Interest *</label>
            <select
              id="sectorInterest"
              className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.sectorInterest ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
              aria-invalid={errors.sectorInterest ? 'true' : 'false'}
              aria-describedby={errors.sectorInterest ? 'sectorInterest-error' : undefined}
              disabled={status === 'loading'}
              {...register('sectorInterest')}
            >
              <option value="">Select empire...</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
            {errors.sectorInterest && <p id="sectorInterest-error" className="mt-1 text-sm text-red-600">{errors.sectorInterest.message}</p>}
          </div>

          <div>
            <label htmlFor="investmentInterest" className="block text-sm font-medium text-slate-700 mb-1">Investment Size Interest *</label>
            <select
              id="investmentInterest"
              className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.investmentInterest ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
              aria-invalid={errors.investmentInterest ? 'true' : 'false'}
              aria-describedby={errors.investmentInterest ? 'investmentInterest-error' : undefined}
              disabled={status === 'loading'}
              {...register('investmentInterest')}
            >
              <option value="">Select range...</option>
              {investmentInterests.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            {errors.investmentInterest && <p id="investmentInterest-error" className="mt-1 text-sm text-red-600">{errors.investmentInterest.message}</p>}
          </div>

          <div>
            <label htmlFor="hearAbout" className="block text-sm font-medium text-slate-700 mb-1">How did you hear about us? *</label>
            <input
              id="hearAbout"
              type="text"
              className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.hearAbout ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
              aria-invalid={errors.hearAbout ? 'true' : 'false'}
              aria-describedby={errors.hearAbout ? 'hearAbout-error' : undefined}
              disabled={status === 'loading'}
              {...register('hearAbout')}
            />
            {errors.hearAbout && <p id="hearAbout-error" className="mt-1 text-sm text-red-600">{errors.hearAbout.message}</p>}
          </div>
        </div>

        <div className="mb-8">
          <label className="flex items-start gap-3">
            <input
              id="consent"
              type="checkbox"
              className={`mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500`}
              disabled={status === 'loading'}
              {...register('consent')}
            />
            <span className="text-sm text-slate-600 leading-relaxed">
              I consent to SINet collecting my information for the purpose of the waitlist and future platform communications. *
            </span>
          </label>
          {errors.consent && <p className="mt-1 text-sm text-red-600 ml-8">{errors.consent.message as string}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={status === 'loading' || !csrfToken}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4 border-0"
        >
          {status === 'loading' ? 'Submitting...' : 'Join the Global Waitlist'}
        </Button>
        {(!csrfToken || !recaptchaToken) && status !== 'error' && (
          <p className="mt-3 text-sm text-slate-500">
            Initializing security check{!recaptchaToken ? ' (reCAPTCHA)...' : '...'}
          </p>
        )}
        {status === 'error' && errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
      </form>

      {status === 'error' && (
        <Toast 
          message={errorMessage} 
          type="error" 
          onClose={() => setStatus('idle')} 
        />
      )}
    </>
  );
}
