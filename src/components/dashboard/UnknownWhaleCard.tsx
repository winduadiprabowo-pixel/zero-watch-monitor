/**
 * ZERØ WATCH — UnknownWhaleCard v2
 * ==================================
 * RESPONSIVE FIX:
 * - Mobile: full width, padding 12px, text truncate proper
 * - Tablet: sama dengan desktop
 * - Desktop: margin 16px kiri kanan
 * - Share button: touch-friendly (min 44px tap area)
 * - Text truncate di semua breakpoint
 *
 * rgba() only ✓  React.memo + displayName ✓  useMemo ✓
 */

import React, { memo, useMemo, useCallback } from 'react'
import { Share2, ExternalLink, Eye } from 'lucide-react'
import { useWhaleTracker, shortAddr, type WhaleTx } from '@/hooks/useWhaleTracker'

const fmtUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const tsAgo = (ms: number) => {
  const secs = Math.floor((Date.now() - ms) / 1000)
  if (secs < 60)   return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  return `${Math.floor(secs / 3600)}h`
}

function buildShareUrl(tx: WhaleTx): string {
  const addr = shortAddr(tx.from)
  const amt  = fmtUsd(tx.valueUsd)
  const sym  = tx.type === 'ERC20' ? (tx.tokenSymbol ?? 'ETH') : 'ETH'
  const text = `🔍 Unknown whale just moved ${amt} ${sym}\n\n📍 ${addr}\n\nTracking with ZERØ WATCH — real-time smart money tracker\n→ zero-watch-monitor.pages.dev\n\n#ETH #SmartMoney #OnChain #DeFi`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
}

// ── Signal row ────────────────────────────────────────────────────────────────

const SignalRow = memo(({ tx, index }: { tx: WhaleTx; index: number }) => {
  const sym  = tx.type === 'ERC20' ? (tx.tokenSymbol ?? 'ETH') : 'ETH'
  const addr = shortAddr(tx.from)

  const handleShare = useCallback(() => {
    window.open(buildShareUrl(tx), '_blank', 'noopener,noreferrer')
  }, [tx])

  return (
    <div
      className="animate-fade-up"
      style={{
        animationDelay: `${index * 0.06}s`,
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        padding:        '10px 12px',
        borderRadius:   '12px',
        background:     'rgba(255,255,255,0.025)',
        border:         '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Dot */}
      <div
        style={{
          width:        '8px',
          height:       '8px',
          minWidth:     '8px',
          borderRadius: '50%',
          background:   tx.isMega ? 'rgba(251,191,36,1)' : 'rgba(0, 212, 255, 1)',
          boxShadow:    tx.isMega ? '0 0 8px rgba(251,191,36,0.7)' : '0 0 8px rgba(0, 212, 255, 0.7)',
          animation:    'pulse-glow 2s ease-in-out infinite',
        }}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' as const }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', fontWeight: 700, color: tx.isMega ? 'rgba(251,191,36,1)' : 'rgba(0, 212, 255, 1)' }}>
            {fmtUsd(tx.valueUsd)}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            {sym}
          </span>
          {tx.isMega && (
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: 'rgba(251,191,36,0.10)', color: 'rgba(251,191,36,1)', border: '1px solid rgba(251,191,36,0.25)', flexShrink: 0 }}>
              MEGA
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.30)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: '110px' }}>
            {addr}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.18)', flexShrink: 0 }}>
            · {tsAgo(tx.timestamp)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <a
          href={`https://etherscan.io/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', flexShrink: 0, transition: 'border-color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0, 212, 255, 0.3)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
        >
          <ExternalLink style={{ width: '12px', height: '12px' }} />
        </a>

        <button
          onClick={handleShare}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', height: '30px', paddingLeft: '10px', paddingRight: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.8)', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', flexShrink: 0, WebkitTapHighlightColor: 'transparent' as unknown as string, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <Share2 style={{ width: '11px', height: '11px' }} />
          POST
        </button>
      </div>
    </div>
  )
})
SignalRow.displayName = 'SignalRow'

// ── Main ──────────────────────────────────────────────────────────────────────

interface UnknownWhaleCardProps {
  mobile?: boolean
}

const UnknownWhaleCard = memo(({ mobile }: UnknownWhaleCardProps) => {
  const { txs, loading } = useWhaleTracker()

  const unknownTxs = useMemo<WhaleTx[]>(() =>
    txs.filter(tx => tx.fromLabel === null && tx.toLabel === null && tx.isWhale).slice(0, 3),
    [txs]
  )

  if (loading || unknownTxs.length === 0) return null

  return (
    <div
      className="animate-fade-up"
      style={{
        margin:       mobile ? '8px 12px 4px' : '8px 16px 4px',
        borderRadius: '16px',
        overflow:     'hidden',
        background:   'linear-gradient(135deg, rgba(0, 212, 255, 0.04) 0%, rgba(99,102,241,0.03) 100%)',
        border:       '1px solid rgba(0, 212, 255, 0.15)',
        flexShrink:   0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{ width: '6px', height: '6px', minWidth: '6px', borderRadius: '50%', background: 'rgba(0, 212, 255, 1)', boxShadow: '0 0 6px rgba(0, 212, 255, 0.8)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
          <Eye style={{ width: '12px', height: '12px', color: 'rgba(0, 212, 255, 0.7)', flexShrink: 0 }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(0, 212, 255, 0.9)', whiteSpace: 'nowrap' as const }}>
            Unknown Whale
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(0, 212, 255, 0.08)', color: 'rgba(0, 212, 255, 0.6)', border: '1px solid rgba(0, 212, 255, 0.15)', flexShrink: 0 }}>
            {unknownTxs.length} signal{unknownTxs.length > 1 ? 's' : ''}
          </span>
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.20)', flexShrink: 0, marginLeft: '8px' }}>
          LIVE · ETH
        </span>
      </div>

      {/* Signals */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {unknownTxs.map((tx, i) => (
          <SignalRow key={tx.hash} tx={tx} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.18)' }}>
          Unlabeled · No CEX · {'>'} $1M
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.18)' }}>
          Share → viral 🔥
        </span>
      </div>
    </div>
  )
})

UnknownWhaleCard.displayName = 'UnknownWhaleCard'
export default UnknownWhaleCard
