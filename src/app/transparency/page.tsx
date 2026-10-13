import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

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
