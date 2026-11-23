import type { Metadata } from 'next';
import { TwoFactorClient } from './TwoFactorClient';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: 'Two-Factor Authentication',
  description: 'Enter your authenticator app code to access administrative console.',
};

export default function TwoFactorPage() {
  return <TwoFactorClient />;
}
