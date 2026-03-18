/**
 * ZERØ WATCH — DyorBanner v2
 * ============================
 * RESPONSIVE: mobile short text, desktop full text
 * Dismissable + localStorage persist
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useState, useCallback, useEffect } from 'react'
import { Shield, X } from 'lucide-react'

const DISMISSED_KEY = 'zero-watch-dyor-v2'

const DyorBanner = memo(() => {
  const [visible, setVisible]   = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISSED_KEY)) setVisible(true)
    } catch { setVisible(true) }

    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* noop */ }
  }, [])

  if (!visible) return null

  return (
    <div
      className="flex-shrink-0 animate-fade-up"
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '8px',
        padding:        isMobile ? '8px 12px' : '8px 16px',
        background:     'rgba(4,4,10,0.98)',
        borderTop:      '1px solid rgba(255,255,255,0.055)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Shield style={{ width: '12px', height: '12px', color: 'rgba(0, 212, 255, 0.5)', flexShrink: 0 }} />

      <span style={{ flex: 1, fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.5, overflow: 'hidden' }}>
        <span style={{ color: 'rgba(251,191,36,0.9)', fontWeight: 600 }}>DYOR</span>
        {isMobile
          ? ' — Not financial advice. Public blockchain data. High risk.'
          : <> — Not financial advice · Public blockchain data ·{' '}
              Powered by{' '}
              <a href="https://etherscan.io" target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(0, 212, 255, 0.55)', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0, 212, 255, 0.9)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0, 212, 255, 0.55)' }}
              >Etherscan</a>
              {' '}+{' '}
              <a href="https://www.alchemy.com" target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(0, 212, 255, 0.55)', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0, 212, 255, 0.9)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0, 212, 255, 0.55)' }}
              >Alchemy</a>
              {' '}· Never connect wallet · High risk
            </>
        }
      </span>

      <button
        onClick={dismiss}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', minWidth: '32px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.22)', cursor: 'pointer', flexShrink: 0, transition: 'color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)' }}
        aria-label="Dismiss"
      >
        <X style={{ width: '13px', height: '13px' }} />
      </button>
    </div>
  )
})

DyorBanner.displayName = 'DyorBanner'
export default DyorBanner
