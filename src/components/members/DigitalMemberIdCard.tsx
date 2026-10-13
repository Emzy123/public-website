'use client';

import { useState } from 'react';
import Link from 'next/link';
import { STUDENT_DIVISION_INFO, type StudentDivision } from '@/lib/schemas/member-application.schema';

export type MemberCardData = {
  fullName: string;
  avatarUrl?: string | null;
  memberId: string;
  campusCode: string;
  chapterName?: string | null;
  universityName?: string | null;
  division?: string | null;
  programme?: string | null;
  level?: string | null;
  issuedAt: string | Date;
  verificationUrl: string;
  qrDataUrl: string;
  signature?: string;
};

export function DigitalMemberIdCard({ card }: { card: MemberCardData }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const divisionInfo = card.division
    ? STUDENT_DIVISION_INFO[card.division as StudentDivision]
    : null;

  const formattedDate = new Date(card.issuedAt).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(card.verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 3D Perspective Card Wrapper */}
      <div
        className="relative h-[250px] w-full max-w-[400px] cursor-pointer sm:h-[260px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative h-full w-full rounded-2xl p-6 text-white shadow-2xl transition-all duration-500 [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* FRONT FACE */}
          <div
            className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#071026] via-[#0d1a4a] to-[#14235e] p-5 shadow-2xl [backface-visibility:hidden] ${
              isFlipped ? 'invisible' : 'visible'
            }`}
          >
            {/* Holographic Watermark Background */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-sky-500/10 blur-2xl" />

            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 font-black text-[#071026] text-xs shadow-md">
                  SI
                </div>
                <div>
                  <p className="text-[10px] font-extrabold tracking-wider text-amber-400">
                    STUDENT INVESTMENT NETWORK
                  </p>
                  <p className="text-[9px] font-medium tracking-tight text-slate-300">
                    Digital Student Membership Card
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-500/40">
                ACTIVE
              </span>
            </div>

            {/* Middle Section: Photo & Identity */}
            <div className="flex items-center gap-4 py-2">
              <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-xl font-black text-[#071026] shadow-md ring-2 ring-white/20">
                {card.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-white">{card.fullName}</h3>
                <p className="truncate text-[11px] font-medium text-slate-300">
                  {card.programme || 'Undergraduate'} {card.level ? `(${card.level}L)` : ''}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-block rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                    {divisionInfo?.name.replace(' Division', '') || 'Student Network'}
                  </span>
                  <span className="truncate text-[10px] text-slate-400">
                    {card.campusCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Monospace Member ID & Chip */}
            <div className="flex items-end justify-between border-t border-white/10 pt-2.5">
              <div>
                <p className="text-[8px] uppercase tracking-widest text-slate-400">MEMBER ID</p>
                <p className="font-mono text-xs font-bold tracking-wider text-amber-400">
                  {card.memberId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-widest text-slate-400">ISSUED</p>
                <p className="font-mono text-[10px] font-medium text-slate-300">
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>

          {/* BACK FACE: QR Code Verification */}
          <div
            className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#0d1a4a] via-[#071026] to-[#040817] p-5 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] ${
              isFlipped ? 'visible' : 'invisible'
            }`}
          >
            {/* Magnetic Stripe / Banner */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <p className="text-[10px] font-bold text-amber-400">SCAN TO VERIFY CREDENTIAL</p>
              <span className="text-[9px] text-slate-400">sinet.africa/verify</span>
            </div>

            {/* QR Code & Verification Instructions */}
            <div className="flex items-center justify-center gap-4 py-1">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.qrDataUrl}
                  alt={`QR Code for ${card.memberId}`}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="text-left text-[11px] leading-relaxed text-slate-300">
                <p className="font-semibold text-white">Official Verification QR</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Scan this code with any camera to verify student membership status and chapter authority.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="border-t border-white/10 pt-2 text-center text-[9px] text-slate-400">
              Cryptographically signed by Student Investment Network Authority.
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mt-4 flex w-full max-w-[400px] items-center justify-between gap-2 px-1 text-xs">
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isFlipped ? 'Show Front' : 'Show QR Code'}
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {copied ? '✓ Copied!' : 'Copy Verify Link'}
        </button>

        <Link
          href={`/verify/${card.memberId}${card.signature ? `?sig=${card.signature}` : ''}`}
          target="_blank"
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#071026] px-3.5 py-1.5 font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Verify →
        </Link>
      </div>
    </div>
  );
}
