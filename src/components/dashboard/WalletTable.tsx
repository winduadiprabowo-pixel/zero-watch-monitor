/**
 * ZERØ WATCH — WalletTable v17
 * ==============================
 * TOTAL REDESIGN — premium card rows.
 * - Tiap row = mini card dengan border, hover glow
 * - Signal badge BESAR & BOLD — no more tiny 8px text
 * - Balance prominent (20px), address secondary
 * - Big move banner ⚡ jelas & mencolok
 * - Whale score bar tebal & berwarna
 * - Shimmer skeleton saat loading
 *
 * rgba() only ✓  IBM Plex Mono ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo } from 'react'
import { ArrowUpRight, ArrowDownLeft, Zap, ExternalLink } from 'lucide-react'
import type { Wallet } from '@/data/mockData'
import type { WalletIntelligence } from '@/services/whaleAnalytics'

interface WalletTableProps {
  wallets:          Wallet[]
  selectedWalletId: string | null
  onSelectWallet:   (id: string) => void
  walletIntelMap:   Record<string, WalletIntelligence>
  compact?:         boolean
}

// ── Signal config — bold & high contrast ──────────────────────────────────────

const SIGNAL = {
  ACCUMULATING: {
    label: 'ACCUMULATING',
    short: 'ACCUM',
    bg:    'rgba(52,211,153,0.12)',
    border:'rgba(52,211,153,0.35)',
    text:  'rgba(52,211,153,1)',
    dot:   'rgba(52,211,153,1)',
    glow:  '0 0 12px rgba(52,211,153,0.3)',
    rowBg: 'rgba(52,211,153,0.03)',
  },
  DISTRIBUTING: {
    label: 'DISTRIBUTING',
    short: 'DISTR',
    bg:    'rgba(239,68,68,0.12)',
    border:'rgba(239,68,68,0.35)',
    text:  'rgba(239,68,68,1)',
    dot:   'rgba(239,68,68,1)',
    glow:  '0 0 12px rgba(239,68,68,0.3)',
    rowBg: 'rgba(239,68,68,0.03)',
  },
  HUNTING: {
    label: 'HUNTING',
    short: 'HUNT',
    bg:    'rgba(251,191,36,0.12)',
    border:'rgba(251,191,36,0.30)',
    text:  'rgba(251,191,36,1)',
    dot:   'rgba(251,191,36,1)',
    glow:  '0 0 12px rgba(251,191,36,0.3)',
    rowBg: 'rgba(251,191,36,0.02)',
  },
  DORMANT: {
    label: 'DORMANT',
    short: 'DORM',
    bg:    'rgba(255,255,255,0.05)',
    border:'rgba(255,255,255,0.10)',
    text:  'rgba(255,255,255,0.30)',
    dot:   'rgba(255,255,255,0.18)',
    glow:  'none',
    rowBg: 'transparent',
  },
} as const

const chainBadge: Record<string, { text: string; bg: string; border: string }> = {
  ETH:  { text: 'rgba(147,197,253,1)', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.22)' },
  ARB:  { text: 'rgba(125,211,252,1)', bg: 'rgba(14,165,233,0.10)',  border: 'rgba(14,165,233,0.22)' },
  BASE: { text: 'rgba(165,180,252,1)', bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.22)' },
  OP:   { text: 'rgba(252,129,129,1)', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.22)'  },
  SOL:  { text: 'rgba(200,150,255,1)', bg: 'rgba(153,69,255,0.10)',  border: 'rgba(153,69,255,0.22)' },
}

const fmtBigMove = (v: number) => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

// ── Skeleton shimmer row ───────────────────────────────────────────────────────

const SkeletonRow = memo(() => (
  <div
    className="rounded-2xl px-4 py-4 animate-pulse"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '6px' }}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-2.5 w-20 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-16 rounded-md" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-3.5 w-12 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
    <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
  </div>
))
SkeletonRow.displayName = 'SkeletonRow'

// ── Whale score bar ────────────────────────────────────────────────────────────

const ScoreBar = memo(({ score, status }: { score: number; status: keyof typeof SIGNAL }) => {
  const cfg = SIGNAL[status]
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: '4px', background: 'rgba(255,255,255,0.06)', minWidth: '48px' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width:     `${Math.max(4, score)}%`,
            background: status === 'DORMANT'
              ? 'rgba(255,255,255,0.12)'
              : `linear-gradient(90deg, ${cfg.text}, ${cfg.text.replace(',1)', ',0.5)')})`,
            boxShadow: status !== 'DORMANT' ? cfg.glow : 'none',
          }}
        />
      </div>
      <span
        className="font-mono tabular-nums flex-shrink-0"
        style={{ fontSize: '11px', color: status === 'DORMANT' ? 'rgba(255,255,255,0.25)' : cfg.text }}
      >
        {score}
      </span>
    </div>
  )
})
ScoreBar.displayName = 'ScoreBar'

// ── Mini activity sparkline ────────────────────────────────────────────────────

const MiniSpark = memo(({ data, positive }: { data: number[]; positive: boolean }) => {
  const pts = data.slice(0, 10)
  const max = Math.max(...pts, 0.001)
  const color = positive ? 'rgba(52,211,153,0.7)' : 'rgba(239,68,68,0.6)'

  return (
    <div className="flex items-end gap-px flex-shrink-0" style={{ height: '18px', width: '36px' }}>
      {pts.map((v, i) => (
        <div
          key={i}
          style={{
            flex:         1,
            height:       `${Math.max(15, (v / max) * 100)}%`,
            background:   color,
            borderRadius: '1.5px',
            transition:   'height 0.4s ease',
          }}
        />
      ))}
    </div>
  )
})
MiniSpark.displayName = 'MiniSpark'

// ── Main wallet row card ───────────────────────────────────────────────────────

interface WalletRowProps {
  wallet:      Wallet
  intel:       WalletIntelligence | undefined
  isSelected:  boolean
  onSelect:    (id: string) => void
  compact:     boolean
  index:       number
}

const WalletRow = memo(({ wallet, intel, isSelected, onSelect, compact, index }: WalletRowProps) => {
  const status  = intel?.whaleScore.status ?? 'DORMANT'
  const score   = intel?.whaleScore.score  ?? 0
  const conviction = intel?.whaleScore.conviction ?? 0
  const sig     = SIGNAL[status]
  const chain   = chainBadge[wallet.chain] ?? { text: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' }

  const bigMove  = intel?.bigMoves[0] ?? null
  const hasBig   = bigMove !== null

  const sparkPositive = wallet.sparkData.length >= 2
    ? wallet.sparkData[wallet.sparkData.length - 1] >= wallet.sparkData[0]
    : true

  // Etherscan link
  const explorerHref = wallet.chain === 'SOL'
    ? `https://solscan.io/account/${wallet.address.replace('...', '')}`
    : `https://etherscan.io/address/${wallet.address.replace('...', '')}`

  return (
    <div
      className="animate-fade-up"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <button
        onClick={() => onSelect(wallet.id)}
        className="w-full text-left group"
        style={{ marginBottom: '6px' }}
      >
        <div
          className="rounded-2xl px-4 py-3.5 transition-all duration-200"
          style={{
            background:  isSelected
              ? `linear-gradient(135deg, ${sig.bg}, rgba(255,255,255,0.015))`
              : hasBig
              ? `linear-gradient(135deg, rgba(251,191,36,0.06), rgba(255,255,255,0.015))`
              : 'rgba(255,255,255,0.025)',
            border: isSelected
              ? `1px solid ${sig.border}`
              : hasBig
              ? '1px solid rgba(251,191,36,0.22)'
              : '1px solid rgba(255,255,255,0.06)',
            boxShadow: isSelected ? sig.glow : 'none',
          }}
          onMouseEnter={e => {
            if (!isSelected) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.038)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
            }
          }}
          onMouseLeave={e => {
            if (!isSelected) {
              e.currentTarget.style.background = hasBig ? 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(255,255,255,0.015))' : 'rgba(255,255,255,0.025)'
              e.currentTarget.style.borderColor = hasBig ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.06)'
            }
          }}
        >

          {/* ── Big move banner ── */}
          {hasBig && (
            <div
              className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 rounded-xl"
              style={{
                background: 'rgba(251,191,36,0.08)',
                border:     '1px solid rgba(251,191,36,0.20)',
              }}
            >
              <Zap className="w-3 h-3 flex-shrink-0 animate-pulse" style={{ color: 'rgba(251,191,36,1)' }} />
              <span className="text-[10px] font-mono font-bold" style={{ color: 'rgba(251,191,36,1)' }}>
                {bigMove!.type === 'IN' ? '↓ INCOMING' : '↑ OUTGOING'} {fmtBigMove(bigMove!.valueUsd)} — LAST 1H
              </span>
            </div>
          )}

          {/* ── Main row ── */}
          <div className="flex items-center gap-3">

            {/* Active dot */}
            <div className="flex-shrink-0">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: wallet.active ? sig.dot : 'rgba(255,255,255,0.12)',
                  boxShadow:  wallet.active && status !== 'DORMANT' ? sig.glow : 'none',
                  animation:  wallet.active ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                }}
              />
            </div>

            {/* Name + address */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="font-mono font-semibold truncate"
                  style={{
                    fontSize: '14px',
                    color:    isSelected ? sig.text : 'rgba(255,255,255,0.92)',
                    maxWidth: compact ? '100px' : '140px',
                  }}
                >
                  {wallet.label}
                </span>
                {wallet.txNew > 0 && (
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse"
                    style={{
                      background: 'rgba(0,255,148,0.12)',
                      color:      'rgba(0,255,148,1)',
                      border:     '1px solid rgba(0,255,148,0.25)',
                    }}
                  >
                    {wallet.txNew} NEW
                  </span>
                )}
              </div>
              <span
                className="font-mono text-[10px] block"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                {wallet.address}
              </span>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3 flex-shrink-0">

              {/* Balance */}
              <div className="text-right">
                <div
                  className="font-mono font-bold tabular-nums"
                  style={{ fontSize: '15px', color: 'rgba(255,255,255,0.92)' }}
                >
                  {wallet.balance}
                </div>
                <div
                  className="text-[10px] font-mono"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                >
                  {wallet.lastMove}
                </div>
              </div>

              {/* Signal badge */}
              {!compact && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-shrink-0"
                  style={{
                    background:    sig.bg,
                    border:        `1px solid ${sig.border}`,
                    boxShadow:     status !== 'DORMANT' ? sig.glow : 'none',
                    minWidth:      '88px',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: sig.dot,
                      animation:  status !== 'DORMANT' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                    }}
                  />
                  <span
                    className="font-mono font-bold"
                    style={{ fontSize: '9px', letterSpacing: '0.06em', color: sig.text }}
                  >
                    {sig.short}
                  </span>
                </div>
              )}

              {/* Chain badge */}
              <span
                className="font-mono px-2 py-1 rounded-lg flex-shrink-0"
                style={{
                  fontSize:  '9px',
                  background: chain.bg,
                  color:      chain.text,
                  border:     `1px solid ${chain.border}`,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {wallet.chain}
              </span>

              {/* Spark */}
              <MiniSpark data={wallet.sparkData} positive={sparkPositive} />

            </div>
          </div>

          {/* ── Score bar ── */}
          <div className="mt-3 pl-6 pr-0 flex items-center gap-3">
            <div className="flex-1">
              <ScoreBar score={score} status={status} />
            </div>

            {conviction > 0 && (
              <span
                className="text-[9px] font-mono flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                conv {conviction}
              </span>
            )}

            {/* Compact signal */}
            {compact && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg flex-shrink-0"
                style={{
                  background: sig.bg,
                  border:     `1px solid ${sig.border}`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: sig.dot,
                    animation: status !== 'DORMANT' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                  }}
                />
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: '8px', letterSpacing: '0.06em', color: sig.text }}
                >
                  {sig.short}
                </span>
              </div>
            )}

            {/* Etherscan link — visible on hover */}
            <a
              href={explorerHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="View on explorer"
            >
              <ExternalLink
                className="w-3 h-3"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              />
            </a>
          </div>

        </div>
      </button>
    </div>
  )
})
WalletRow.displayName = 'WalletRow'

// ── Main table ────────────────────────────────────────────────────────────────

const WalletTable = memo(({
  wallets, selectedWalletId, onSelectWallet, walletIntelMap, compact = false,
}: WalletTableProps) => {
  const isLoading = wallets.length === 0

  const sorted = useMemo(() => {
    // Sort: big moves first, then active, then by status priority
    const statusOrder = { ACCUMULATING: 0, HUNTING: 1, DISTRIBUTING: 2, DORMANT: 3 }
    return [...wallets].sort((a, b) => {
      const aHasBig = (walletIntelMap[a.id]?.bigMoves.length ?? 0) > 0
      const bHasBig = (walletIntelMap[b.id]?.bigMoves.length ?? 0) > 0
      if (aHasBig !== bHasBig) return aHasBig ? -1 : 1

      const aStatus = walletIntelMap[a.id]?.whaleScore.status ?? 'DORMANT'
      const bStatus = walletIntelMap[b.id]?.whaleScore.status ?? 'DORMANT'
      return (statusOrder[aStatus] ?? 3) - (statusOrder[bStatus] ?? 3)
    })
  }, [wallets, walletIntelMap])

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ padding: compact ? '8px 12px' : '12px 16px' }}
    >
      {isLoading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-2 text-center"
        >
          <div className="text-2xl">🔭</div>
          <div className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            No wallets match filter
          </div>
        </div>
      ) : (
        sorted.map((w, i) => (
          <WalletRow
            key={w.id}
            wallet={w}
            intel={walletIntelMap[w.id]}
            isSelected={selectedWalletId === w.id}
            onSelect={onSelectWallet}
            compact={compact}
            index={i}
          />
        ))
      )}
    </div>
  )
})
WalletTable.displayName = 'WalletTable'

export default WalletTable
