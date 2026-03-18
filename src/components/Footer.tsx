/**
 * ZERØ WATCH — Footer v1
 * ========================
 * Data sources + branding + privacy policy link + Twitter
 * - Sticky di bottom content (bukan fixed — flow normal)
 * - Mobile responsive
 * rgba() only ✓  IBM Plex Mono ✓  React.memo + displayName ✓
 */

import React, { memo } from 'react'
import { ExternalLink, Twitter, Shield, Database, Github } from 'lucide-react'

const Footer = memo(() => {
  return (
    <footer
      className="w-full border-t mt-auto"
      style={{
        borderColor: 'rgba(255,255,255,0.05)',
        background:  'rgba(4,4,10,0.8)',
      }}
    >
      <div className="px-4 py-4 space-y-3">

        {/* Data Sources */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Database className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <span className="text-[8px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Data Sources
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {[
              { label: 'Etherscan V2',    href: 'https://etherscan.io' },
              { label: 'Alchemy RPC',     href: 'https://alchemy.com' },
              { label: 'Solana Public',   href: 'https://solana.com' },
              { label: 'Binance Perp',    href: 'https://binance.com' },
              { label: 'CoinGecko',       href: 'https://coingecko.com' },
              { label: 'alternative.me',  href: 'https://alternative.me/crypto/fear-and-greed-index/' },
            ].map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 transition-colors"
                style={{ color: 'rgba(255,255,255,0.22)', fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0, 212, 255, 0.7)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.22)' }}
              >
                {s.label}
                <ExternalLink className="w-2 h-2 ml-0.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

        {/* Bottom row: brand + links */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="font-bold"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}
            >
              ZER
              <span style={{ color: 'rgba(0, 212, 255, 0.6)' }}>Ø</span>
              {' '}BUILD LAB
            </span>
            <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.14)' }}>·</span>
            <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.14)' }}>
              Read-only · No wallet connect
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Privacy */}
            <span
              className="flex items-center gap-1 text-[9px] font-mono cursor-default"
              style={{ color: 'rgba(255,255,255,0.18)' }}
              title="ZERØ WATCH never stores your data. All wallet monitoring is read-only via public blockchain APIs."
            >
              <Shield className="w-2.5 h-2.5" />
              Privacy
            </span>

            {/* Twitter */}
            <a
              href="https://twitter.com/ZerobuildLab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-mono transition-colors"
              style={{ color: 'rgba(255,255,255,0.22)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0, 212, 255, 0.7)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.22)' }}
            >
              <Twitter className="w-2.5 h-2.5" />
              @ZerobuildLab
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/winduadiprabowo-pixel/zero-watch-monitor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-mono transition-colors"
              style={{ color: 'rgba(255,255,255,0.22)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0, 212, 255, 0.7)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.22)' }}
            >
              <Github className="w-2.5 h-2.5" />
              Source
            </a>
          </div>
        </div>

        {/* DYOR note */}
        <div
          className="text-center text-[8px] font-mono"
          style={{ color: 'rgba(255,255,255,0.10)' }}
        >
          Not financial advice · Data may be delayed · DYOR
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'
export default Footer
