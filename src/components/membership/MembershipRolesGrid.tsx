'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ApplyNotifyModal } from '@/components/layout/ApplyNotifyModal';

export interface MembershipRoleItem {
  title: string;
  slug: string;
  description: string;
}

export const MEMBERSHIP_ROLES: MembershipRoleItem[] = [
  {
    title: 'Volunteer',
    slug: 'volunteer',
    description: 'Support outreach, campus events, and student community programs.',
  },
  {
    title: 'Community Member',
    slug: 'community-member',
    description: 'Join the network, local events, and student updates.',
  },
  {
    title: 'Campus Ambassador',
    slug: 'ambassador',
    description: 'Represent SINet on your university campus and drive student engagement.',
  },
  {
    title: 'Staff',
    slug: 'staff',
    description: 'Apply for an internal operational role within SINETWORK Global or Student Network.',
  },
  {
    title: 'Partnership & Enterprise',
    slug: 'partnership-interest',
    description: 'Express student enterprise, venture sprint, or corporate partnership interest.',
  },
];

export function MembershipRolesGrid({ isOpen }: { isOpen: boolean }) {
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MEMBERSHIP_ROLES.map((role) => (
          <div key={role.slug} className="flex flex-col justify-between border border-[#0d1a4a]/20 bg-white p-6 shadow-xs">
            <div>
              <span className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">Role Pathway</span>
              <h3 className="mt-1 font-editorial text-2xl text-[#0d1a4a]">{role.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5b554a]">{role.description}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#0d1a4a]/10">
              {isOpen ? (
                <Link
                  href={`/join?role=${role.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d9711b] hover:text-[#0d1a4a] transition-colors"
                >
                  Apply as {role.title} →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsNotifyOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d9711b] hover:text-[#0d1a4a] transition-colors"
                >
                  Get Notified ({role.title}) →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ApplyNotifyModal isOpen={isNotifyOpen} onClose={() => setIsNotifyOpen(false)} />
    </>
  );
}
