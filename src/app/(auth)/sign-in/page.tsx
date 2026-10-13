import type { Metadata } from 'next';
import { SignInClient } from './SignInClient';

export const metadata: Metadata = {
  title: 'Sign in to SINet',
  description: 'Sign in to your SINet member account.',
};

export default function SignInPage() {
  return <SignInClient />;
}
