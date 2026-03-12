import React, { memo } from 'react';

interface LogoProps {
  compact?: boolean;
}

/**
 * ZERØ WATCH Logo
 * Pakai ZBL monogram + wordmark "ZERØ WATCH"
 * Logo ZBL: Z + B + L dalam satu bentuk geometris sharp
 */
const Logo = memo(({ compact }: LogoProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 animate-fade-up">
        {/* ZBL monogram mini */}
        <ZBLMark size={22} />
        <span className="font-display text-base tracking-tight leading-none">
          ZER<span className="text-neon glow-neon">Ø</span>
          <span className="text-white/50 text-xs font-mono font-normal ml-1.5 tracking-widest">WATCH</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-5 animate-fade-up">
      {/* ZBL monogram */}
      <ZBLMark size={28} />
      <div>
        <h1 className="font-display text-xl tracking-tight leading-none">
          ZER<span className="text-neon glow-neon">Ø</span>{' '}
          <span className="text-white/70">WATCH</span>
        </h1>
        <span className="text-[9px] text-white/25 tracking-[0.22em] uppercase font-mono block mt-0.5">
          Smart Money Tracker
        </span>
      </div>
    </div>
  );
});

Logo.displayName = 'Logo';

// ── ZBL Monogram Mark ─────────────────────────────────────────────────────────

interface ZBLMarkProps {
  size?: number;
}

const ZBLMark = memo(({ size = 28 }: ZBLMarkProps) => {
  const s = size;
  // stroke width proportional
  const sw = Math.max(1.5, s * 0.07);
  // neon color
  const neon = 'rgba(0,255,148,1)';
  const white = 'rgba(255,255,255,0.90)';

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ZBL"
      style={{ flexShrink: 0 }}
    >
      {/* Border frame */}
      <rect
        x="1"
        y="1"
        width="26"
        height="26"
        rx="3"
        stroke={neon}
        strokeWidth={sw}
        fill="rgba(0,255,148,0.06)"
      />

      {/* Z — top-left to mid-left diagonal */}
      {/* Z shape: top line, diagonal down-right, bottom line */}
      <polyline
        points="5,7 13,7 5,14 13,14"
        stroke={white}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Vertical separator */}
      <line
        x1="15"
        y1="6"
        x2="15"
        y2="22"
        stroke={neon}
        strokeWidth={sw * 0.5}
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* B — two bumps on right side of separator */}
      {/* B spine */}
      <line
        x1="17"
        y1="7"
        x2="17"
        y2="21"
        stroke={white}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* B top bump */}
      <path
        d="M17,7 Q23,7 23,10.5 Q23,14 17,14"
        stroke={white}
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
      />
      {/* B bottom bump */}
      <path
        d="M17,14 Q24,14 24,17.5 Q24,21 17,21"
        stroke={neon}
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
      />

      {/* L — bottom-left area, below Z */}
      <polyline
        points="5,16 5,22 12,22"
        stroke={neon}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Neon corner accent — bottom right */}
      <circle cx="25" cy="25" r="1.2" fill={neon} opacity={0.8} />
    </svg>
  );
});

ZBLMark.displayName = 'ZBLMark';

export default Logo;
