'use client';

import { useEffect, useState } from 'react';
import {
  CampaignApplicationWizard,
  ClosedLinkWaitlist,
} from '@/components/applications/CampaignApplicationWizard';
import { StudentCampaignApplicationForm } from '@/components/applications/StudentCampaignApplicationForm';
import type { ApplicationRole } from '@/lib/types/membership';

type CampaignInfo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  targetRole: string;
  isAccepting: boolean;
  statusReason?: string;
  seatsRemaining?: number | null;
};

type LinkInfo = {
  name: string;
  slug: string;
  roles: ApplicationRole[];
  accepting: boolean;
  status: string;
};

export default function JoinPage({ params }: { params: { slug: string } }) {
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [link, setLink] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/join/${params.slug}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await r.json();
        if (data.campaign) {
          setCampaign(data.campaign);
        }
        if (data.link) {
          setLink(data.link);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] text-sm text-slate-500">
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading application portal…
        </span>
      </div>
    );
  }

  if (notFound || (!campaign && !link)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f0] px-5 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Admissions Portal</p>
        <h1 className="mt-3 text-3xl font-extrabold text-[#071026]">Campaign Not Found</h1>
        <p className="mt-4 max-w-md text-sm text-slate-600">
          This registration or membership campaign link is invalid or has been archived.
        </p>
      </div>
    );
  }

  // 1. If campaign is from PostgreSQL
  if (campaign) {
    if (!campaign.isAccepting) {
      return <ClosedLinkWaitlist slug={params.slug} />;
    }
    return <StudentCampaignApplicationForm campaign={campaign} slug={params.slug} />;
  }

  // 2. Legacy fallback
  if (link && !link.accepting) {
    return <ClosedLinkWaitlist slug={params.slug} />;
  }

  return <CampaignApplicationWizard slug={params.slug} allowedRoles={link?.roles || []} />;
}
