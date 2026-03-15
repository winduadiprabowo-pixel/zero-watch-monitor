/**
 * ZERØ WATCH — Logo v20
 * =======================
 * v20 POLISH:
 * - ZBL monogram lebih sharp
 * - Neon glow effect pada Ø
 * - Subtitle "Smart Money Tracker" lebih prominent
 * - Compact mode: cleaner layout
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo } from 'react'

interface LogoProps {
  compact?: boolean
}

const Logo = memo(({ compact }: LogoProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 animate-fade-up">
        <ZBLMark size={22} />
        <span
          className="font-bold leading-none tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.92)' }}
        >
          ZER
          <span style={{ color: 'rgba(0,255,148,1)', textShadow: '0 0 12px rgba(0,255,148,0.5)' }}>Ø</span>
          <span
            style={{
              color:        'rgba(255,255,255,0.45)',
              fontSize:     '10px',
              fontFamily:   "'IBM Plex Mono', monospace",
              fontWeight:   400,
              marginLeft:   '6px',
              letterSpacing:'0.20em',
            }}
          >
            WATCH
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-5 animate-fade-up">
      <ZBLMark size={30} />
      <div>
        <h1
          className="leading-none tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}
        >
          ZER
          <span style={{ color: 'rgba(0,255,148,1)', textShadow: '0 0 16px rgba(0,255,148,0.55)' }}>Ø</span>
          {' '}
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>WATCH</span>
        </h1>
        <span
          className="block mt-0.5"
          style={{
            fontFamily:    "'IBM Plex Mono', monospace",
            fontSize:      '9px',
            color:         'rgba(255,255,255,0.22)',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
          }}
        >
          Smart Money Tracker
        </span>
      </div>
    </div>
  )
})

Logo.displayName = 'Logo'

// ── ZBL Monogram Mark ─────────────────────────────────────────────────────────

interface ZBLMarkProps { size?: number }

const ZBLMark = memo(({ size = 28 }: ZBLMarkProps) => {
  const s  = size
  const sw = Math.max(1.5, s * 0.07)
  const neon  = 'rgba(0,255,148,1)'
  const white = 'rgba(255,255,255,0.90)'

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
      {/* Glow filter */}
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Border frame */}
      <rect x="1" y="1" width="26" height="26" rx="4" stroke={neon} strokeWidth={sw} fill="rgba(0,255,148,0.05)" filter="url(#neon-glow)" />

      {/* Z */}
      <polyline points="5,7 13,7 5,14 13,14" stroke={white} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Vertical separator */}
      <line x1="15" y1="6" x2="15" y2="22" stroke={neon} strokeWidth={sw * 0.5} strokeLinecap="round" opacity={0.35} />

      {/* B spine */}
      <line x1="17" y1="7" x2="17" y2="21" stroke={white} strokeWidth={sw} strokeLinecap="round" />
      {/* B top bump */}
      <path d="M17,7 Q23,7 23,10.5 Q23,14 17,14" stroke={white} strokeWidth={sw} strokeLinecap="round" fill="none" />
      {/* B bottom bump — neon */}
      <path d="M17,14 Q24,14 24,17.5 Q24,21 17,21" stroke={neon} strokeWidth={sw} strokeLinecap="round" fill="none" filter="url(#neon-glow)" />

      {/* L */}
      <polyline points="5,16 5,22 12,22" stroke={neon} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#neon-glow)" />

      {/* Corner accent dot */}
      <circle cx="25" cy="25" r="1.2" fill={neon} opacity={0.85} />
    </svg>
  )
})

ZBLMark.displayName = 'ZBLMark'

export default Logo
