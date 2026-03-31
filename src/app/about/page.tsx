import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About SINet',
  description:
    'From Student Dreams to Pan-African Movement. Founded in March 2025. Meet the founder, the leadership team, and learn how SINet is building 5 Mega Empires across Africa.',
  openGraph: {
    title: 'About SINet | From Student Dreams to Pan-African Movement',
    description:
      'Meet Adams Ochekwu and the SINet team. Founded March 2025. 280+ students. ₦11.8M cash flow. Building Africa\'s future.',
    images: ['/images/logo.jpg'],
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
