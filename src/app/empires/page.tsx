import type { Metadata } from 'next';
import EmpiresClient from './EmpiresClient';

export const metadata: Metadata = {
  title: 'The 5 Empires',
  description: 'Five sectors, one ecosystem. Food & Processing, Tech & Innovation, Fashion & Creative, Real Estate, Agriculture. Deep-dive into SINet\'s 5 Mega Empires.',
  openGraph: {
    title: 'The 5 Empires | SINet',
    description: 'Deep-dive into SINet\'s 5 sectors: Food, Tech, Fashion, Real Estate, and Agriculture.',
  },
};

export default function EmpiresPage() {
  return <EmpiresClient />;
}
