'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHero } from '@/components/ui/PageHero';

/* ── Contact constants ── */
const WA_URL = 'https://wa.me/2349028239706';
const WA_DISPLAY = '0902 823 9706';
const CALL_URL = 'tel:+2349164107049';
const CALL_DISPLAY = '0916 410 7049';
const EMAIL = 'sinetworkinggobal@gmail.com';
const ADDRESS = 'Kogi State, Nigeria';

const investmentOptions = [
  { value: '50000',   label: '₦50,000 – Seed (Just starting)' },
  { value: '250000',  label: '₦250,000 – Growth (Ready to accelerate)' },
  { value: '1000000', label: '₦1M+ – Legacy (Institutional participation)' },
  { value: 'learning',label: 'Just learning for now (Academy interest)' },
];

const contactCards = [
  {
    id: 'whatsapp',
    icon: (
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    bg: 'bg-green-500',
    label: 'WhatsApp',
    value: WA_DISPLAY,
    href: WA_URL,
    cta: 'Chat Now →',
    target: '_blank',
    note: 'Fastest response — typically within 1 hour',
  },
  {
    id: 'call',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
      </svg>
    ),
    bg: 'bg-[#0A2342]',
    label: 'Call Us',
    value: CALL_DISPLAY,
    href: CALL_URL,
    cta: 'Call Now →',
    target: '_self',
    note: 'Monday – Friday, 9am – 6pm WAT',
  },
  {
    id: 'email',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
    bg: 'bg-[#D4AF37]',
    label: 'Email',
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    cta: 'Send Email →',
    target: '_self',
    note: 'Response within 24 hours',
  },
];

const socials = [
  { label: 'LinkedIn', href: 'https://linkedin.com/company/sinet-africa', icon: 'In', bg: 'bg-blue-700' },
  { label: 'X / Twitter', href: 'https://twitter.com/SINet_Africa', icon: 'X', bg: 'bg-black' },
  { label: 'Instagram', href: 'https://instagram.com/sinet.africa', icon: 'IG', bg: 'bg-gradient-to-br from-pink-500 to-purple-600' },
  { label: 'Facebook', href: 'https://facebook.com/sinet.africa', icon: 'Fb', bg: 'bg-blue-600' },
];

export default function ConnectPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', interest: '', referral: '', message: '',
    consent: false, website: '', // website = honeypot
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: `Investment Inquiry – ${form.interest || 'General'}`,
          message: `Phone/WhatsApp: ${form.phone}\nInterest: ${form.interest}\nReferral: ${form.referral}\n\nMessage:\n${form.message}`,
          website: form.website,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const inputClass = `w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 
    placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 
    focus:border-[#D4AF37] transition-colors text-sm disabled:opacity-60 bg-white`;

  return (
    <div className="pt-20">
      <PageHero
        badge="Get In Touch"
        title="Connect with"
        titleAccent="SINet"
        subtitle="Ready to start your journey? Reach out — we respond within 24 hours. No pressure. Just clarity."
      />

      {/* Response time bar */}
      <div className="bg-[#D4AF37]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center justify-center gap-6 text-[#0A2342] text-sm font-semibold">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0A2342] animate-pulse" />
            We reply to every message within 24 hours
          </span>
          <span className="opacity-60 hidden sm:block">·</span>
          <span>Monday – Friday · 9am – 6pm WAT</span>
          <span className="opacity-60 hidden sm:block">·</span>
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80 transition-opacity">
            WhatsApp for fastest response
          </a>
        </div>
      </div>

      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-5 gap-12">

            {/* ── LEFT: Quick Contact ── */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0A2342] mb-1">Quick Contact</h2>
                <p className="text-slate-500 text-sm">Prefer to reach us directly? Choose your channel below.</p>
              </div>

              {/* Contact method cards */}
              {contactCards.map((card) => (
                <div key={card.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      {card.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-0.5">{card.label}</p>
                      <p className="font-bold text-[#0A2342] text-sm break-all">{card.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{card.note}</p>
                      <a
                        href={card.href}
                        target={card.target}
                        rel={card.target === '_blank' ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#D4AF37] hover:text-[#F4D03F] transition-colors"
                      >
                        {card.cta}
                      </a>
                    </div>
                  </div>
                </div>
              ))}

              {/* Address */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#0A2342]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Office</p>
                    <p className="font-bold text-[#0A2342] text-sm">{ADDRESS}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Operations active across Nigeria</p>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Follow Us</p>
                <div className="flex gap-3 flex-wrap">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-white text-xs font-bold hover:scale-110 hover:shadow-lg transition-all duration-200`}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Inquiry Form ── */}
            <div className="lg:col-span-3">
              {status === 'success' ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-extrabold text-green-800 mb-2">Message Sent!</h3>
                  <p className="text-green-700 mb-3">Thank you. A member of our team will respond within 24 hours.</p>
                  <p className="text-green-600 text-sm mb-6">Check your inbox for a confirmation email.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm">
                      💬 Chat for faster response
                    </a>
                    <button onClick={() => { setStatus('idle'); setForm({ name: '', email: '', phone: '', interest: '', referral: '', message: '', consent: false, website: '' }); }} className="px-5 py-3 border border-green-300 text-green-700 rounded-xl font-semibold hover:bg-green-100 transition-colors text-sm">
                      Send Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 shadow-sm">
                  <h2 className="text-xl font-extrabold text-[#0A2342] mb-1">Send an Inquiry</h2>
                  <p className="text-slate-400 text-sm mb-7">Fill in your details and we&apos;ll get back to you within 24 hours.</p>

                  {/* Honeypot – hidden from real users */}
                  <input
                    type="text" name="website" value={form.website}
                    onChange={handleChange} tabIndex={-1} autoComplete="off"
                    className="hidden" aria-hidden="true"
                  />

                  {/* Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label htmlFor="cn-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                      <input id="cn-name" name="name" type="text" required minLength={2} value={form.name} onChange={handleChange} disabled={status === 'loading'} className={inputClass} placeholder="Your full name" />
                    </div>
                    <div>
                      <label htmlFor="cn-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label>
                      <input id="cn-email" name="email" type="email" required value={form.email} onChange={handleChange} disabled={status === 'loading'} className={inputClass} placeholder="your@email.com" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="mb-5">
                    <label htmlFor="cn-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Phone Number <span className="text-slate-400 font-normal">(WhatsApp preferred)</span> *
                    </label>
                    <input id="cn-phone" name="phone" type="tel" required value={form.phone} onChange={handleChange} disabled={status === 'loading'} className={inputClass} placeholder="+234 XXX XXX XXXX" />
                  </div>

                  {/* Investment Interest */}
                  <div className="mb-5">
                    <label htmlFor="cn-interest" className="block text-sm font-semibold text-slate-700 mb-1.5">Investment Interest *</label>
                    <select id="cn-interest" name="interest" required value={form.interest} onChange={handleChange} disabled={status === 'loading'} className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">Select your investment interest…</option>
                      {investmentOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Referral */}
                  <div className="mb-5">
                    <label htmlFor="cn-referral" className="block text-sm font-semibold text-slate-700 mb-1.5">How did you hear about SINet?</label>
                    <input id="cn-referral" name="referral" type="text" value={form.referral} onChange={handleChange} disabled={status === 'loading'} className={inputClass} placeholder="Social media, friend, campus ambassador…" />
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <label htmlFor="cn-message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Message <span className="text-slate-400 font-normal">(optional · max 500 characters)</span>
                    </label>
                    <textarea id="cn-message" name="message" rows={4} maxLength={500} value={form.message} onChange={handleChange} disabled={status === 'loading'} className={`${inputClass} resize-none`} placeholder="Any specific questions or context for our team…" />
                    <p className="text-right text-xs text-slate-400 mt-1">{500 - form.message.length} characters remaining</p>
                  </div>

                  {/* Consent */}
                  <div className="mb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox" name="consent" checked={form.consent}
                        onChange={handleChange} required disabled={status === 'loading'}
                        className="w-5 h-5 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37] mt-0.5 flex-shrink-0 cursor-pointer"
                      />
                      <span className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors">
                        I agree to be contacted by SINet regarding investment opportunities and platform updates.
                      </span>
                    </label>
                  </div>

                  {/* Error */}
                  {status === 'error' && (
                    <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                      <span>⚠️</span>
                      Something went wrong. Please try WhatsApp instead:&nbsp;
                      <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="font-bold underline">{WA_DISPLAY}</a>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading' || !form.consent}
                    className="w-full py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all duration-200 text-base shadow-lg hover:shadow-[#D4AF37]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-3">
                    Response guaranteed within 24 hours · <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">Faster via WhatsApp</a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom links */}
      <section className="py-10 bg-[#0A2342]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm mb-4">Or explore before you commit</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/investor-journey" className="px-5 py-2.5 bg-[#D4AF37] text-[#0A2342] rounded-xl text-sm font-bold hover:bg-[#F4D03F] transition-colors">How Investing Works</Link>
            <Link href="/returns" className="px-5 py-2.5 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">See Returns</Link>
            <Link href="/transparency" className="px-5 py-2.5 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">Read FAQ</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
