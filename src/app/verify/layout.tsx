import type { Metadata } from 'next';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: 'Verify credential — SINet',
  description: 'Verify a SINet digital membership credential by Member ID. Shows name, role, chapter, and status only.',
  robots: { index: true, follow: true },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
