import { InstitutionalHome } from '@/components/home/InstitutionalHome';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata() {
  return {
    title: {
      absolute: 'SINet — One Community. Three Pillars.',
    },
    description: 'A business ecosystem built on Agriculture, Trade & Goods Distribution, and Real Estate — with community at the centre.',
  };
}

export default function Home() {
  return <InstitutionalHome />;
}
