/**
 * ZERØ WATCH — Logo v21
 * =======================
 * v21: Squirrel logo image — no text "ZERO WATCH"
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo } from 'react'

interface LogoProps {
  compact?: boolean
}

const Logo = memo(({ compact }: LogoProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 animate-fade-up px-3 py-3">
        <img
          src="/icon-192.png"
          alt="ZERØ WATCH"
          style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-5 animate-fade-up">
      <img
        src="/icon-192.png"
        alt="ZERØ WATCH"
        style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}
      />
      <div>
        <span
          className="block leading-none"
          style={{
            fontFamily:    "'IBM Plex Mono', monospace",
            fontSize:      '9px',
            color:         'rgba(255,255,255,0.22)',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            marginTop:     '2px',
          }}
        >
          Smart Money Tracker
        </span>
      </div>
    </div>
  )
})

Logo.displayName = 'Logo'

export default Logo
