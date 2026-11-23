import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify credential — SINet',
  description: 'Verify a SINet digital membership credential by Member ID. Shows name, role, chapter, and status only.',
  robots: { index: true, follow: true },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
