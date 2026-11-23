import type { Metadata } from 'next';
import { SignInClient } from './SignInClient';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: 'Sign in to SINet',
  description: 'Sign in to your SINet member account.',
};

export default function SignInPage() {
  return <SignInClient />;
}
