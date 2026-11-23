import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: 'Not Found',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TransparencyPage() {
  notFound();
}
