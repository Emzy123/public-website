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
  onError?: (message: string) => void;
}

export function ReCAPTCHA({ onToken, onError }: ReCAPTCHAProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

  useEffect(() => {
    if (!siteKey) {
      onError?.('reCAPTCHA site key is missing.');
      return;
    }

    const scriptId = 'google-recaptcha-v3';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => onError?.('Unable to load reCAPTCHA script. Check ad-block/privacy settings.');
      document.head.appendChild(script);
    }

    const executeToken = async () => {
      try {
        if (!window.grecaptcha) return;
        const token = await window.grecaptcha.execute(siteKey, { action: 'waitlist_submit' });
        if (token) {
          onToken(token);
          return;
        }
        onError?.('reCAPTCHA did not return a token. Please refresh and try again.');
      } catch {
        onError?.('reCAPTCHA failed to initialize. Please refresh and try again.');
      }
    };

    const timer = window.setInterval(() => {
      if (!window.grecaptcha) return;
      window.grecaptcha.ready(() => {
        executeToken().catch(() => {
          onError?.('reCAPTCHA failed to initialize. Please refresh and try again.');
        });
      });
      window.clearInterval(timer);
    }, 250);

    // Refresh token periodically to avoid token expiry on long form completion.
    const refreshTimer = window.setInterval(() => {
      if (!window.grecaptcha) return;
      window.grecaptcha.ready(() => {
        executeToken().catch(() => {
          onError?.('reCAPTCHA refresh failed. Please refresh and try again.');
        });
      });
    }, 90_000);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(refreshTimer);
    };
  }, [onError, onToken, siteKey]);

  return null;
}
