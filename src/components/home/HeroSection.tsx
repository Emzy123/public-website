'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { trackEvent } from '@/lib/analytics';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-[#0A1A2F]">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-[#0A1A2F] z-10"></div>
        <div className="absolute inset-0 bg-blue-950 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-800 to-transparent"></div>
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "url('/images/bg-hero.svg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>
      
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center text-center md:text-left">
          <div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 animate-fade-in-up">
              Build Africa's Future. <br className="hidden md:block" />
              <span className="text-blue-400">Invest. Own. Grow.</span>
            </h1>
            <p className="max-w-2xl mx-auto md:mx-0 text-lg md:text-xl text-slate-300 mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Join the premier Pan-African investment ecosystem. Discover scalable opportunities across computing, agriculture, fashion, and beyond.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center md:justify-start justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/waitlist" className="w-full sm:w-auto" onClick={() => trackEvent('cta_click', { location: 'hero', target: 'waitlist' })}>
                <Button variant="primary" className="w-full sm:w-auto text-lg px-8 py-4 bg-blue-500 hover:bg-blue-600 border-0 text-white">
                  Join the Waitlist
                </Button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto" onClick={() => trackEvent('cta_click', { location: 'hero', target: 'about' })}>
                <Button variant="ghost" className="w-full sm:w-auto text-lg px-8 py-4 text-white hover:bg-white/10 hover:text-white border border-slate-700">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mt-4 md:mt-0 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.35),_transparent_60%)]"></div>
            <Image
              src="/images/hero-illustration.svg"
              alt="Pan-African investment network illustration"
              width={900}
              height={650}
              priority
              sizes="(max-width: 768px) 100vw, 36rem"
              className="w-full max-w-xl mx-auto md:mx-0 drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
