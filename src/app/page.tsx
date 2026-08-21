import { InstitutionalHome } from '@/components/home/InstitutionalHome';

export async function generateMetadata() {
  return { title: 'SINet | Capital that moves openly', description: 'A pan-African community creating value through property, enterprise, participation, and transparent reporting.' };
}

export default function Home() { return <InstitutionalHome />; }
