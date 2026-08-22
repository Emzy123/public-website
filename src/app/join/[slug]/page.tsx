'use client';

import { useEffect, useState } from 'react';
import { CampaignApplicationWizard, ClosedLinkWaitlist } from '@/components/applications/CampaignApplicationWizard';
import type { ApplicationRole } from '@/lib/types/membership';

type LinkInfo = {
  name: string;
  slug: string;
  roles: ApplicationRole[];
  accepting: boolean;
  status: string;
};

export default function JoinPage({ params }: { params: { slug: string } }) {
  const [link, setLink] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/join/${params.slug}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return; }
        const data = await r.json();
        if (data.link) setLink(data.link);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f6f2e8] text-sm text-[#7b7263]">Loading…</div>;
  }

  if (notFound || !link) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f2e8] px-5 text-center">
        <h1 className="font-editorial text-4xl text-[#0d1a4a]">Link not found</h1>
        <p className="mt-4 max-w-md text-[#585146]">This registration link is invalid or has been removed.</p>
      </div>
    );
  }

  if (!link.accepting) {
    return <ClosedLinkWaitlist slug={params.slug} />;
  }

  return <CampaignApplicationWizard slug={params.slug} allowedRoles={link.roles} />;
}
