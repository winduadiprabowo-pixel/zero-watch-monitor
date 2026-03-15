/**
 * ZERØ WATCH — UnknownWhaleCard v1
 * ==================================
 * Deteksi unlabeled whale dari live ETH tx feed (useWhaleTracker).
 * Filter: tx > $1M, from/to TIDAK ada label → unknown smart money.
 * Card muncul di atas WalletTable kalau ada sinyal.
 *
 * Share to X built-in — viral hook.
 * rgba() only ✓  React.memo + displayName ✓  useMemo ✓
 */

import React, { memo, useMemo, useCallback } from 'react'
import { ArrowUpRight, Share2, ExternalLink, Eye } from 'lucide-react'
import { useWhaleTracker, shortAddr, type WhaleTx } from '@/hooks/useWhaleTracker'

const fmtUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const tsAgo = (ms: number) => {
  const secs = Math.floor((Date.now() - ms) / 1000)
  if (secs < 60)   return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

// ── Share to X helper ─────────────────────────────────────────────────────────

function buildShareUrl(tx: WhaleTx): string {
  const addr  = shortAddr(tx.from)
  const amt   = fmtUsd(tx.valueUsd)
  const sym   = tx.type === 'ERC20' ? (tx.tokenSymbol ?? 'ETH') : 'ETH'
  const text  = `🔍 Unknown whale just moved ${amt} ${sym}\n\n📍 ${addr}\n\nTracking via ZERØ WATCH — real-time smart money tracker\n→ zero-watch-monitor.pages.dev\n\n#ETH #SmartMoney #OnChain`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
}

// ── Single unknown whale signal ───────────────────────────────────────────────

const UnknownSignalRow = memo(({ tx, index }: { tx: WhaleTx; index: number }) => {
  const addr = shortAddr(tx.from)
  const sym  = tx.type === 'ERC20' ? (tx.tokenSymbol ?? 'ETH') : 'ETH'

  const handleShare = useCallback(() => {
    window.open(buildShareUrl(tx), '_blank', 'noopener,noreferrer')
  }, [tx])

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl animate-fade-up"
      style={{
        animationDelay: `${index * 0.06}s`,
        background:     'rgba(255,255,255,0.025)',
        border:         '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left: indicator + info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
          style={{
            background: tx.isMega ? 'rgba(251,191,36,1)' : 'rgba(0,255,148,1)',
            boxShadow:  tx.isMega ? '0 0 8px rgba(251,191,36,0.7)' : '0 0 8px rgba(0,255,148,0.7)',
          }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="font-mono font-bold"
              style={{ fontSize: '11px', color: tx.isMega ? 'rgba(251,191,36,1)' : 'rgba(0,255,148,1)' }}
            >
              {fmtUsd(tx.valueUsd)}
            </span>
            <span
              className="font-mono px-1.5 py-0.5 rounded"
              style={{
                fontSize:   '8px',
                background: 'rgba(255,255,255,0.06)',
                color:      'rgba(255,255,255,0.5)',
                border:     '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {sym}
            </span>
            {tx.isMega && (
              <span
                className="font-mono font-bold px-1.5 py-0.5 rounded"
                style={{
                  fontSize:   '8px',
                  background: 'rgba(251,191,36,0.10)',
                  color:      'rgba(251,191,36,1)',
                  border:     '1px solid rgba(251,191,36,0.25)',
                  letterSpacing: '0.06em',
                }}
              >
                MEGA
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Unknown
            </span>
            <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
              {addr}
            </span>
            <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
              · {tsAgo(tx.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Etherscan */}
        <a
          href={`https://etherscan.io/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          title="View on Etherscan"
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,255,148,0.25)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
        >
          <ExternalLink className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
        </a>

        {/* Share to X */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono font-bold transition-all active:scale-95"
          style={{
            fontSize:   '9px',
            background: 'rgba(0,0,0,0.4)',
            border:     '1px solid rgba(255,255,255,0.15)',
            color:      'rgba(255,255,255,0.7)',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background   = 'rgba(0,0,0,0.7)'
            e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.30)'
            e.currentTarget.style.color        = 'rgba(255,255,255,1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background   = 'rgba(0,0,0,0.4)'
            e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.15)'
            e.currentTarget.style.color        = 'rgba(255,255,255,0.7)'
          }}
          title="Share to X"
        >
          <Share2 className="w-3 h-3" />
          POST
        </button>
      </div>
    </div>
  )
})
UnknownSignalRow.displayName = 'UnknownSignalRow'

// ── Main card ─────────────────────────────────────────────────────────────────

const UnknownWhaleCard = memo(() => {
  const { txs, loading } = useWhaleTracker()

  // Filter: unlabeled from + whale/mega txs only
  const unknownTxs = useMemo<WhaleTx[]>(() => {
    return txs
      .filter(tx =>
        tx.fromLabel === null &&  // bukan wallet labeled
        tx.toLabel   === null &&  // bukan ke exchange labeled
        tx.isWhale               // > $1M
      )
      .slice(0, 3)               // max 3 signals
  }, [txs])

  // Ga muncul kalau loading atau kosong
  if (loading || unknownTxs.length === 0) return null

  return (
    <div
      className="mx-4 mb-3 rounded-2xl overflow-hidden animate-fade-up"
      style={{
        background: 'linear-gradient(135deg, rgba(0,255,148,0.04) 0%, rgba(99,102,241,0.04) 100%)',
        border:     '1px solid rgba(0,255,148,0.15)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'rgba(0,255,148,1)', boxShadow: '0 0 6px rgba(0,255,148,0.8)' }}
          />
          <Eye className="w-3 h-3" style={{ color: 'rgba(0,255,148,0.7)' }} />
          <span
            className="font-mono font-bold uppercase"
            style={{ fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(0,255,148,0.9)' }}
          >
            Unknown Whale Detected
          </span>
          <span
            className="font-mono px-1.5 py-0.5 rounded-full"
            style={{
              fontSize:   '8px',
              background: 'rgba(0,255,148,0.08)',
              color:      'rgba(0,255,148,0.6)',
              border:     '1px solid rgba(0,255,148,0.15)',
            }}
          >
            {unknownTxs.length} signal{unknownTxs.length > 1 ? 's' : ''}
          </span>
        </div>
        <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.20)' }}>
          LIVE · ETH
        </span>
      </div>

      {/* Signals */}
      <div className="p-3 space-y-2">
        {unknownTxs.map((tx, i) => (
          <UnknownSignalRow key={tx.hash} tx={tx} index={i} />
        ))}
      </div>

      {/* Footer hint */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Unlabeled wallet · No exchange · {'>'} $1M move
        </span>
        <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Share → viral 🔥
        </span>
      </div>
    </div>
  )
})

UnknownWhaleCard.displayName = 'UnknownWhaleCard'
export default UnknownWhaleCard
