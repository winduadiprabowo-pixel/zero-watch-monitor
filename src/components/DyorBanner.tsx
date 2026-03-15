/**
 * ZERØ WATCH — DyorBanner v1
 * ============================
 * Sticky bottom banner — DYOR disclaimer + data sources.
 * Dismissable, persisted via localStorage.
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useState, useCallback, useEffect } from 'react'
import { Shield, X } from 'lucide-react'

const DISMISSED_KEY = 'zero-watch-dyor-dismissed-v1'

const DyorBanner = memo(() => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY)
      if (!dismissed) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* noop */ }
  }, [])

  if (!visible) return null

  return (
    <div
      className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 animate-fade-up"
      style={{
        background:  'rgba(4,4,10,0.98)',
        borderTop:   '1px solid rgba(255,255,255,0.055)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Shield className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(0,255,148,0.5)' }} />
        <span className="font-mono text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
          <span style={{ color: 'rgba(251,191,36,0.8)', fontWeight: 600 }}>DYOR</span>
          {' '}— Not financial advice. Public blockchain data only.
          {' '}Powered by{' '}
          <a
            href="https://etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(0,255,148,0.5)', textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0,255,148,0.9)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0,255,148,0.5)' }}
          >
            Etherscan
          </a>
          {' '}+{' '}
          <a
            href="https://www.alchemy.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(0,255,148,0.5)', textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0,255,148,0.9)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0,255,148,0.5)' }}
          >
            Alchemy
          </a>
          {' '}· High risk. Never connect wallet.
        </span>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 transition-opacity"
        style={{ color: 'rgba(255,255,255,0.2)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)' }}
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
})

DyorBanner.displayName = 'DyorBanner'
export default DyorBanner
