'use client';

import React from 'react';

export function AnimatedBg({
  className = '',
  variant = 'hero',
}: {
  className?: string;
  variant?: 'hero' | 'academy';
}) {
  // Soft/premium palette (muted accents, low opacity).
  const accentA = variant === 'academy' ? '#60A5FA' : '#38BDF8';
  const accentB = variant === 'academy' ? '#34D399' : '#22C55E';
  const accentC = variant === 'academy' ? '#FBBF24' : '#A78BFA';

  return (
    <svg
      className={className}
      viewBox="0 0 1440 600"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="bg-blur" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="40" result="blur" />
        </filter>
        <linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={variant === 'academy' ? '#0A1A2F' : '#071A2B'} />
          <stop offset="50%" stopColor={variant === 'academy' ? '#071A2B' : '#0A1A2F'} />
          <stop offset="100%" stopColor={variant === 'academy' ? '#061425' : '#061425'} />
        </linearGradient>
      </defs>

      <rect width="1440" height="600" fill="url(#bg-gradient)" />

      {/* Blobs are intentionally subtle & slow to look premium (not “busy”). */}
      <g filter="url(#bg-blur)" opacity="0.75">
        <circle cx="260" cy="230" r="190" fill={accentA} opacity="0.18">
          <animate attributeName="cx" dur="28s" repeatCount="indefinite" values="230;330;260;230" />
          <animate attributeName="cy" dur="34s" repeatCount="indefinite" values="250;220;300;250" />
          <animate attributeName="opacity" dur="24s" repeatCount="indefinite" values="0.12;0.22;0.12" />
        </circle>

        <circle cx="1120" cy="170" r="230" fill={accentC} opacity="0.14">
          <animate attributeName="cx" dur="32s" repeatCount="indefinite" values="1100;1220;1080;1120" />
          <animate attributeName="cy" dur="38s" repeatCount="indefinite" values="190;150;220;170" />
          <animate attributeName="opacity" dur="26s" repeatCount="indefinite" values="0.10;0.18;0.10" />
        </circle>

        <circle cx="740" cy="430" r="250" fill={accentB} opacity="0.12">
          <animate attributeName="cx" dur="30s" repeatCount="indefinite" values="710;820;660;740" />
          <animate attributeName="cy" dur="36s" repeatCount="indefinite" values="460;400;480;430" />
          <animate attributeName="opacity" dur="22s" repeatCount="indefinite" values="0.08;0.16;0.08" />
        </circle>
      </g>

      {/* subtle moving highlight */}
      <g opacity="0.10">
        <path
          d="M-40 420 C 260 340, 520 540, 860 420 C 1080 340, 1220 300, 1520 360 L 1520 640 L -40 640 Z"
          fill={variant === 'academy' ? '#60A5FA' : '#38BDF8'}
        >
          <animate attributeName="d"
            dur="22s"
            repeatCount="indefinite"
            values="
              M-40 420 C 260 340, 520 540, 860 420 C 1080 340, 1220 300, 1520 360 L 1520 640 L -40 640 Z;
              M-40 450 C 260 370, 520 520, 860 430 C 1080 360, 1220 330, 1520 390 L 1520 640 L -40 640 Z;
              M-40 420 C 260 340, 520 540, 860 420 C 1080 340, 1220 300, 1520 360 L 1520 640 L -40 640 Z
            "
          />
        </path>
      </g>
    </svg>
  );
}

