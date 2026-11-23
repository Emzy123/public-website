import type { Metadata } from 'next';
import { TwoFactorClient } from './TwoFactorClient';

export const metadata: Metadata = {
  title: 'Two-Factor Authentication',
  description: 'Enter your authenticator app code to access administrative console.',
};

export default function TwoFactorPage() {
  return <TwoFactorClient />;
}
