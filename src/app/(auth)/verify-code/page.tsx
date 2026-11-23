import type { Metadata } from 'next';
import { VerifyCodeClient } from './VerifyCodeClient';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: 'Verify Code',
  description: 'Enter your 6-digit code to access your SINet member account.',
};

export default function VerifyCodePage() {
  return <VerifyCodeClient />;
}
