'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactSchema, ContactFormData } from '@/lib/schemas/contact.schema';
import { Button } from '../ui/Button';
import { trackEvent } from '@/lib/analytics';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema)
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, website: '' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message || 'Failed to send message');
      }
      setStatus('success');
      trackEvent('contact_submit', { subject: data.subject });
      reset();
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 text-green-800 p-6 rounded-xl border border-green-200 text-center shadow-sm">
        <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
        <p>Thank you for reaching out. A member of our team will get back to you shortly.</p>
        <Button variant="ghost" className="mt-4 border border-green-300" onClick={() => setStatus('idle')}>Send another message</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-100">
      <div className="space-y-4 mb-6">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          {...register('website')}
        />
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input
            id="name"
            type="text"
            className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
            disabled={status === 'loading'}
            {...register('name')}
          />
          {errors.name && <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
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
          <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
          <input
            id="subject"
            type="text"
            className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.subject ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
            aria-invalid={errors.subject ? 'true' : 'false'}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            disabled={status === 'loading'}
            {...register('subject')}
          />
          {errors.subject && <p id="subject-error" className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
          <textarea
            id="message"
            rows={5}
            className={`w-full px-4 py-3 rounded-md border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.message ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-300'}`}
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'message-error' : undefined}
            disabled={status === 'loading'}
            {...register('message')}
          />
          {errors.message && <p id="message-error" className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
        </div>
      </div>

      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          Failed to send message. Please try again later.
        </div>
      )}

      <Button 
        type="submit" 
        disabled={status === 'loading'}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 py-4"
      >
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
