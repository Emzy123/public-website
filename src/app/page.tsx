import { InstitutionalHome } from '@/components/home/InstitutionalHome';

export async function generateMetadata() {
  return {
    title: 'SINet | One Community. Three Pillars.',
    description: 'A business ecosystem built on Agriculture, Trade & Goods Distribution, and Real Estate — with community at the centre.',
  };
}

export default function Home() {
  return <InstitutionalHome />;
}
