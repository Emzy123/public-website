'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ReCAPTCHAProps {
  onToken: (token: string) => void;
}

export function ReCAPTCHA({ onToken }: ReCAPTCHAProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

  useEffect(() => {
    if (!siteKey) return;

    const scriptId = 'google-recaptcha-v3';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const timer = window.setInterval(() => {
      if (!window.grecaptcha) return;
      window.grecaptcha.ready(async () => {
        const token = await window.grecaptcha?.execute(siteKey, { action: 'waitlist_submit' });
        if (token) onToken(token);
      });
      window.clearInterval(timer);
    }, 250);

    return () => window.clearInterval(timer);
  }, [onToken, siteKey]);

  return null;
}
