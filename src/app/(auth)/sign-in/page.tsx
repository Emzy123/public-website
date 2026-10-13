import type { Metadata } from 'next';
import { SignInClient } from './SignInClient';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Student Investment Network member account.',
};

export default function SignInPage() {
  return <SignInClient />;
}
