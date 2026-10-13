'use client';

import { useState, useEffect } from 'react';
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
  const [savedOffline, setSavedOffline] = useState(false);

  // Auto-cache card into localStorage for offline availability
  useEffect(() => {
    if (typeof window !== 'undefined' && card) {
      try {
        localStorage.setItem('sinet_cached_member_card', JSON.stringify(card));
      } catch {
        /* storage disabled or quota full */
      }
    }
  }, [card]);

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

  const handleSaveOfflinePass = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SINet Digital Pass — ${card.memberId}</title>
  <style>
    body { margin: 0; padding: 24px 16px; background: #071026; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
    .card { width: 100%; max-width: 380px; border-radius: 20px; border: 1px solid rgba(245, 158, 11, 0.35); background: linear-gradient(135deg, #071026, #0d1a4a, #14235e); padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 10px; margin-bottom: 14px; }
    .logo { font-size: 11px; font-weight: 800; color: #fbbf24; letter-spacing: 1px; }
    .badge { font-size: 9px; font-weight: 800; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(16, 185, 129, 0.4); }
    .profile { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
    .avatar { width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #d97706, #fbbf24); color: #071026; font-size: 20px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .info h2 { margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; }
    .info p { margin: 2px 0 0; font-size: 11px; color: #cbd5e1; }
    .tag { display: inline-block; font-size: 9px; background: rgba(255,255,255,0.1); color: #fde68a; padding: 2px 6px; border-radius: 4px; margin-top: 4px; font-weight: 600; }
    .qr-box { background: #ffffff; border-radius: 12px; padding: 8px; display: flex; align-items: center; justify-content: center; margin: 12px 0; }
    .qr-box img { width: 140px; height: 140px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 10px; margin-top: 10px; }
    .label { font-size: 8px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin: 0; }
    .val { font-family: monospace; font-size: 12px; font-weight: 700; color: #fbbf24; margin: 2px 0 0; }
    .seal { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">STUDENT INVESTMENT NETWORK</div>
      <div class="badge">OFFLINE PASS</div>
    </div>
    <div class="profile">
      <div class="avatar">${card.fullName.slice(0, 2).toUpperCase()}</div>
      <div class="info">
        <h2>${card.fullName}</h2>
        <p>${card.programme || 'Undergraduate'} • ${card.campusCode}</p>
        <div class="tag">${divisionInfo?.name || 'Student Network'}</div>
      </div>
    </div>
    <div class="qr-box">
      <img src="${card.qrDataUrl}" alt="Verification QR Code">
    </div>
    <div class="footer">
      <div>
        <p class="label">MEMBER ID</p>
        <p class="val">${card.memberId}</p>
      </div>
      <div style="text-align: right;">
        <p class="label">ISSUED</p>
        <p class="val" style="color: #cbd5e1; font-size: 10px;">${formattedDate}</p>
      </div>
    </div>
    <div class="seal">Official Offline Credential • Cryptographically Verified</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SINet-Pass-${card.memberId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSavedOffline(true);
    setTimeout(() => setSavedOffline(false), 2500);
  };

  return (
    <div className="flex w-full flex-col items-center">
      {/* 3D Perspective Card Wrapper: tuned for 360px budget Android phones */}
      <div
        className="relative h-[245px] w-full max-w-[380px] cursor-pointer sm:h-[260px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative h-full w-full rounded-2xl p-4 text-white shadow-2xl transition-all duration-500 [transform-style:preserve-3d] sm:p-6 ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* FRONT FACE */}
          <div
            className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#071026] via-[#0d1a4a] to-[#14235e] p-4.5 shadow-2xl [backface-visibility:hidden] sm:p-5 ${
              isFlipped ? 'invisible' : 'visible'
            }`}
          >
            {/* Holographic Watermark Background */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-sky-500/10 blur-2xl" />

            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 font-black text-[#071026] text-xs shadow-md">
                  SI
                </div>
                <div>
                  <p className="text-[9px] font-extrabold tracking-wider text-amber-400 sm:text-[10px]">
                    STUDENT INVESTMENT NETWORK
                  </p>
                  <p className="text-[8px] font-medium tracking-tight text-slate-300 sm:text-[9px]">
                    Digital Student Membership Card
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-300 ring-1 ring-emerald-500/40 sm:text-[9px]">
                ACTIVE
              </span>
            </div>

            {/* Middle Section: Photo & Identity */}
            <div className="flex items-center gap-3.5 py-1.5 sm:gap-4 sm:py-2">
              <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-lg font-black text-[#071026] shadow-md ring-2 ring-white/20 sm:h-16 sm:w-16 sm:text-xl">
                {card.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-white sm:text-base">{card.fullName}</h3>
                <p className="truncate text-[10px] font-medium text-slate-300 sm:text-[11px]">
                  {card.programme || 'Undergraduate'} {card.level ? `(${card.level}L)` : ''}
                </p>
                <div className="mt-1 flex items-center gap-1.5 sm:gap-2">
                  <span className="inline-block truncate rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-semibold text-amber-300 sm:text-[9px]">
                    {divisionInfo?.name.replace(' Division', '') || 'Student Network'}
                  </span>
                  <span className="truncate text-[9px] text-slate-400 sm:text-[10px]">
                    {card.campusCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Monospace Member ID & Chip */}
            <div className="flex items-end justify-between border-t border-white/10 pt-2 sm:pt-2.5">
              <div>
                <p className="text-[8px] uppercase tracking-widest text-slate-400">MEMBER ID</p>
                <p className="font-mono text-xs font-bold tracking-wider text-amber-400 sm:text-sm">
                  {card.memberId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-widest text-slate-400">ISSUED</p>
                <p className="font-mono text-[9px] font-medium text-slate-300 sm:text-[10px]">
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>

          {/* BACK FACE: QR Code Verification */}
          <div
            className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#0d1a4a] via-[#071026] to-[#040817] p-4.5 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-5 ${
              isFlipped ? 'visible' : 'invisible'
            }`}
          >
            {/* Header Stripe */}
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <p className="text-[9px] font-bold text-amber-400 sm:text-[10px]">SCAN TO VERIFY CREDENTIAL</p>
              <span className="text-[8px] text-slate-400 sm:text-[9px]">sinet.africa/verify</span>
            </div>

            {/* QR Code & Verification Instructions */}
            <div className="flex items-center justify-center gap-3.5 py-1">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-md sm:h-24 sm:w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.qrDataUrl}
                  alt={`QR Code for ${card.memberId}`}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="text-left text-[10px] leading-relaxed text-slate-300 sm:text-[11px]">
                <p className="font-semibold text-white">Official Verification QR</p>
                <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">
                  Scan with any phone camera to verify student identity and chapter membership.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="border-t border-white/10 pt-1.5 text-center text-[8px] text-slate-400 sm:text-[9px]">
              Cryptographically signed by Student Investment Network Authority.
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons Grid: 2 columns on mobile, 4 columns on desktop */}
      <div className="mt-3.5 grid w-full max-w-[380px] grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="truncate">{isFlipped ? 'Show Front' : 'Flip to QR'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <span className="truncate">{copied ? '✓ Copied' : 'Copy Link'}</span>
        </button>

        <button
          type="button"
          onClick={handleSaveOfflinePass}
          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-amber-600/30 bg-amber-50 px-2.5 py-1.5 font-medium text-amber-900 shadow-sm transition hover:bg-amber-100"
        >
          <svg className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="truncate">{savedOffline ? '✓ Saved!' : 'Save Pass'}</span>
        </button>

        <Link
          href={`/verify/${card.memberId}${card.signature ? `?sig=${card.signature}` : ''}`}
          target="_blank"
          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-[#071026] px-2.5 py-1.5 font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <span className="truncate">Verify Online →</span>
        </Link>
      </div>
    </div>
  );
}
