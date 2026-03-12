/**
 * ZERØ WATCH — WalletTable v15
 * ==============================
 * v15 UPGRADE:
 * - Signal status ACCUMULATING / DISTRIBUTING / HUNTING lebih bold & visible
 * - Big move detection: row highlight + "⚡ $2.1M MOVED" banner
 * - Whale score lebih prominent
 * - Last move time + trend arrow in one cell
 * - Shimmer loading state selama fetch
 *
 * rgba() only ✓  IBM Plex Mono ✓  React.memo + displayName ✓
 * useMemo ✓  walletIntelMap prop ✓
 */

import React, { memo, useMemo } from 'react'
import { ArrowUpRight, ArrowDownLeft, Minus, Zap } from 'lucide-react'
import type { Wallet } from '@/data/mockData'
import type { WalletIntelligence } from '@/services/whaleAnalytics'
import SparkBar from './SparkBar'

// ── Types ──────────────────────────────────────────────────────────────────

interface WalletTableProps {
  wallets:          Wallet[]
  selectedWalletId: string | null
  onSelectWallet:   (id: string) => void
  walletIntelMap:   Record<string, WalletIntelligence>
  compact?:         boolean
}

// ── Constants ──────────────────────────────────────────────────────────────

const chainColors: Record<string, { text: string; bg: string }> = {
  ETH:  { text: 'rgba(147,197,253,1)', bg: 'rgba(59,130,246,0.12)'  },
  ARB:  { text: 'rgba(125,211,252,1)', bg: 'rgba(14,165,233,0.12)'  },
  BASE: { text: 'rgba(165,180,252,1)', bg: 'rgba(99,102,241,0.12)'  },
  OP:   { text: 'rgba(252,129,129,1)', bg: 'rgba(239,68,68,0.12)'   },
  SOL:  { text: 'rgba(200,150,255,1)', bg: 'rgba(153,69,255,0.12)'  },
}

// Signal config — bold & readable, surveillance aesthetic
const SIGNAL_CONFIG = {
  ACCUMULATING: {
    label:  'ACCUMULATING',
    short:  'ACCUM',
    bg:     'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.30)',
    text:   'rgba(52,211,153,1)',
    dot:    'rgba(52,211,153,1)',
    glow:   '0 0 8px rgba(52,211,153,0.35)',
  },
  DISTRIBUTING: {
    label:  'DISTRIBUTING',
    short:  'DISTR',
    bg:     'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.30)',
    text:   'rgba(239,68,68,1)',
    dot:    'rgba(239,68,68,1)',
    glow:   '0 0 8px rgba(239,68,68,0.35)',
  },
  HUNTING: {
    label:  'HUNTING',
    short:  'HUNT',
    bg:     'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.28)',
    text:   'rgba(251,191,36,1)',
    dot:    'rgba(251,191,36,1)',
    glow:   '0 0 8px rgba(251,191,36,0.35)',
  },
  DORMANT: {
    label:  'DORMANT',
    short:  'DORM',
    bg:     'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.08)',
    text:   'rgba(255,255,255,0.25)',
    dot:    'rgba(255,255,255,0.18)',
    glow:   'none',
  },
}

// fmtUsd helper
const fmtBigMove = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

// ── Signal Badge ───────────────────────────────────────────────────────────

const SignalBadge = memo(({ status, compact }: { status: keyof typeof SIGNAL_CONFIG; compact: boolean }) => {
  const cfg = SIGNAL_CONFIG[status]
  const isDormant = status === 'DORMANT'
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-bold"
      style={{
        background: cfg.bg,
        border:     `1px solid ${cfg.border}`,
        color:      cfg.text,
        fontSize:   '8px',
        letterSpacing: '0.06em',
        boxShadow:  cfg.glow,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: cfg.dot,
          animation:  isDormant ? 'none' : 'pulse 2s ease-in-out infinite',
        }}
      />
      {compact ? cfg.short : cfg.label}
    </span>
  )
})
SignalBadge.displayName = 'SignalBadge'

// ── Row ────────────────────────────────────────────────────────────────────

interface RowProps {
  wallet:     Wallet
  intel:      WalletIntelligence | undefined
  isSelected: boolean
  onSelect:   () => void
  index:      number
  compact:    boolean
}

const WalletRow = memo(({ wallet, intel, isSelected, onSelect, index, compact }: RowProps) => {
  const chain      = chainColors[wallet.chain] ?? { text: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' }
  const hasBigMove = Boolean(intel && intel.bigMoves.length > 0)
  const status     = intel?.whaleScore.status ?? null
  const score      = intel?.whaleScore.score  ?? null
  const bigMoveVal = intel?.bigMoves[0]?.valueUsd ?? 0

  const TrendIcon = useMemo(() => {
    if (!intel) return Minus
    const { inflow, outflow } = intel.whaleScore
    if (inflow > outflow * 1.1)  return ArrowDownLeft
    if (outflow > inflow * 1.1)  return ArrowUpRight
    return Minus
  }, [intel])

  const trendColor = useMemo(() => {
    if (!intel) return 'rgba(255,255,255,0.2)'
    const { inflow, outflow } = intel.whaleScore
    if (inflow > outflow * 1.1)  return 'rgba(52,211,153,0.9)'
    if (outflow > inflow * 1.1)  return 'rgba(239,68,68,0.9)'
    return 'rgba(255,255,255,0.2)'
  }, [intel])

  return (
    <tr
      onClick={onSelect}
      className="group transition-all cursor-pointer animate-fade-up"
      style={{
        animationDelay: `${index * 0.04}s`,
        background: isSelected
          ? 'rgba(0,255,148,0.06)'
          : hasBigMove
            ? 'rgba(251,191,36,0.03)'
            : 'transparent',
        borderBottom: `1px solid ${
          isSelected
            ? 'rgba(0,255,148,0.15)'
            : hasBigMove
              ? 'rgba(251,191,36,0.12)'
              : 'rgba(255,255,255,0.04)'
        }`,
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.025)'
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background =
          hasBigMove ? 'rgba(251,191,36,0.03)' : 'transparent'
      }}
    >
      {/* ── Label + address ── */}
      <td className="pl-4 pr-2 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: wallet.active ? 'rgba(0,255,148,1)' : 'rgba(255,255,255,0.12)',
              boxShadow:  wallet.active ? '0 0 6px rgba(0,255,148,0.7)' : 'none',
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-medium truncate"
                style={{
                  color:    isSelected ? 'rgba(0,255,148,1)' : 'rgba(255,255,255,0.88)',
                  maxWidth: compact ? '80px' : '130px',
                }}
              >
                {wallet.label}
              </span>
              {hasBigMove && (
                <span
                  className="text-[8px] font-mono font-bold px-1 py-0.5 rounded flex-shrink-0 animate-pulse"
                  style={{
                    background: 'rgba(251,191,36,0.12)',
                    border:     '1px solid rgba(251,191,36,0.25)',
                    color:      'rgba(251,191,36,1)',
                  }}
                >
                  ⚡ {fmtBigMove(bigMoveVal)}
                </span>
              )}
            </div>
            {!compact && (
              <span className="text-[9px] font-mono block" style={{ color: 'rgba(255,255,255,0.22)' }}>
                {wallet.address}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* ── Chain ── */}
      <td className="px-2 py-3">
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: chain.bg, color: chain.text }}
        >
          {wallet.chain}
        </span>
      </td>

      {/* ── Balance ── */}
      <td className="px-2 py-3">
        <span className="text-[11px] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.78)' }}>
          {wallet.balance}
        </span>
      </td>

      {/* ── Signal Status ── */}
      {!compact && (
        <td className="px-2 py-3">
          {status !== null ? (
            <SignalBadge status={status} compact={false} />
          ) : (
            // Loading shimmer
            <div
              className="h-4 w-20 rounded animate-pulse"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          )}
        </td>
      )}

      {/* ── Score ── */}
      {!compact && (
        <td className="px-2 py-3">
          {score !== null ? (
            <div className="flex items-center gap-1">
              {/* Score bar */}
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ width: '36px', background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${score}%`,
                    background: score >= 70
                      ? 'rgba(0,255,148,0.8)'
                      : score >= 40
                        ? 'rgba(251,191,36,0.8)'
                        : 'rgba(239,68,68,0.8)',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <span className="text-[9px] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {score}
              </span>
            </div>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '10px' }}>—</span>
          )}
        </td>
      )}

      {/* ── Last move ── */}
      {!compact && (
        <td className="px-2 py-3">
          <div className="flex items-center gap-1">
            <TrendIcon className="w-2.5 h-2.5 flex-shrink-0" style={{ color: trendColor }} />
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {wallet.lastMove}
            </span>
          </div>
        </td>
      )}

      {/* ── TX new ── */}
      <td className="px-2 py-3">
        {wallet.txNew > 0 ? (
          <span
            className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(0,255,148,0.10)',
              color:      'rgba(0,255,148,0.95)',
              border:     '1px solid rgba(0,255,148,0.22)',
            }}
          >
            {wallet.txNew}
          </span>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.10)', fontSize: '10px' }}>—</span>
        )}
      </td>

      {/* ── Spark ── */}
      {!compact && (
        <td className="pr-4 pl-2 py-3">
          <SparkBar data={wallet.sparkData} />
        </td>
      )}
    </tr>
  )
})
WalletRow.displayName = 'WalletRow'

// ── Shimmer Row ────────────────────────────────────────────────────────────

const ShimmerRow = memo(({ index }: { index: number }) => (
  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', animationDelay: `${index * 0.06}s` }}>
    {[140, 50, 80, 100, 60, 80, 40, 50].map((w, i) => (
      <td key={i} className="px-2 py-3" style={{ paddingLeft: i === 0 ? '16px' : undefined }}>
        <div
          className="h-3 rounded animate-pulse"
          style={{
            width:      `${w}px`,
            background: 'rgba(255,255,255,0.04)',
            animationDelay: `${index * 0.06 + i * 0.02}s`,
          }}
        />
      </td>
    ))}
  </tr>
))
ShimmerRow.displayName = 'ShimmerRow'

// ── Main Table ──────────────────────────────────────────────────────────────

const WalletTable = memo(({
  wallets,
  selectedWalletId,
  onSelectWallet,
  walletIntelMap,
  compact = false,
}: WalletTableProps) => {

  const bigMoveWallets = useMemo(() =>
    Object.entries(walletIntelMap)
      .filter(([, i]) => i.bigMoves.length > 0)
      .map(([id, i]) => ({ id, move: i.bigMoves[0] })),
    [walletIntelMap]
  )

  // Seberapa banyak wallets yang sedang loading intel (belum ada data)
  const loadingCount = useMemo(() =>
    wallets.filter(w => !walletIntelMap[w.id]).length,
    [wallets, walletIntelMap]
  )

  if (wallets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.15)' }}>
        <span className="text-xs font-mono">No wallets match filter</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto animate-fade-up delay-2">

      {/* Big move alert banner */}
      {bigMoveWallets.length > 0 && (
        <div
          className="px-4 py-2 flex items-center gap-2 border-b"
          style={{ background: 'rgba(251,191,36,0.05)', borderColor: 'rgba(251,191,36,0.14)' }}
        >
          <Zap className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(251,191,36,1)' }} />
          <span className="text-[10px] font-mono" style={{ color: 'rgba(251,191,36,0.85)' }}>
            {bigMoveWallets.length} wallet{bigMoveWallets.length > 1 ? 's' : ''} with big move detected in last 1h
          </span>
          <span
            className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded animate-pulse"
            style={{ background: 'rgba(251,191,36,0.1)', color: 'rgba(251,191,36,0.7)', border: '1px solid rgba(251,191,36,0.18)' }}
          >
            ALERT
          </span>
        </div>
      )}

      {/* Loading intel banner */}
      {loadingCount > 0 && (
        <div
          className="px-4 py-1.5 flex items-center gap-2 border-b"
          style={{ background: 'rgba(0,255,148,0.025)', borderColor: 'rgba(0,255,148,0.07)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'rgba(0,255,148,0.6)' }}
          />
          <span className="text-[9px] font-mono" style={{ color: 'rgba(0,255,148,0.4)' }}>
            Fetching on-chain data for {loadingCount} wallet{loadingCount > 1 ? 's' : ''}…
          </span>
        </div>
      )}

      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { label: 'Wallet',   pl: 'pl-4' },
              { label: 'Chain',    pl: 'px-2' },
              { label: 'Balance',  pl: 'px-2' },
              ...(!compact ? [
                { label: 'Signal',   pl: 'px-2' },
                { label: 'Score',    pl: 'px-2' },
                { label: 'Last Move',pl: 'px-2' },
              ] : []),
              { label: 'TX',       pl: 'px-2' },
              ...(!compact ? [{ label: 'Activity', pl: 'pr-4 pl-2' }] : []),
            ].map(h => (
              <th
                key={h.label}
                className={`${h.pl} py-2 text-left text-[9px] font-mono tracking-widest uppercase`}
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {wallets.map((wallet, i) => (
            <WalletRow
              key={wallet.id}
              wallet={wallet}
              intel={walletIntelMap[wallet.id]}
              isSelected={selectedWalletId === wallet.id}
              onSelect={() => onSelectWallet(wallet.id)}
              index={i}
              compact={compact}
            />
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.12)' }}>
          {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} · click row to inspect intel · 30s auto-refresh
        </span>
      </div>
    </div>
  )
})
WalletTable.displayName = 'WalletTable'

export default WalletTable
