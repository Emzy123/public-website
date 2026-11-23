import type { Metadata } from 'next';
import { VerifyCodeClient } from './VerifyCodeClient';

export const metadata: Metadata = {
  title: 'Verify Code',
  description: 'Enter your 6-digit code to access your SINet member account.',
};

export default function VerifyCodePage() {
  return <VerifyCodeClient />;
}
