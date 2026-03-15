/**
 * ZERØ WATCH — WalletTable v23
 * ==============================
 * v23 BENTO REDESIGN:
 * - Masonry-style bento grid (2-col responsive)
 * - Each card: hover lift + neon signal glow
 * - Balance LARGE + gradient text
 * - Mini sparkline built into card
 * - Signal badge bold with glow
 * - P&L chip (24h change)
 * - Copy address on click
 * rgba() only ✓  IBM Plex Mono ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo, useCallback, useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Zap, ExternalLink, Copy, Check } from 'lucide-react'
import type { Wallet } from '@/data/mockData'
import type { WalletIntelligence } from '@/services/whaleAnalytics'

interface WalletTableProps {
  wallets:          Wallet[]
  selectedWalletId: string | null
  onSelectWallet:   (id: string) => void
  walletIntelMap:   Record<string, WalletIntelligence>
  compact?:         boolean
}

const SIGNAL = {
  ACCUMULATING: {
    label: 'ACCUMULATING', short: 'ACCUM',
    bg:    'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.32)',
    text:  'rgba(52,211,153,1)',     dot:    'rgba(52,211,153,1)',
    glow:  '0 0 20px rgba(52,211,153,0.18)', cardBg: 'rgba(52,211,153,0.04)',
  },
  DISTRIBUTING: {
    label: 'DISTRIBUTING', short: 'DISTR',
    bg:    'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.32)',
    text:  'rgba(239,68,68,1)',      dot:    'rgba(239,68,68,1)',
    glow:  '0 0 20px rgba(239,68,68,0.18)',  cardBg: 'rgba(239,68,68,0.03)',
  },
  HUNTING: {
    label: 'HUNTING', short: 'HUNT',
    bg:    'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.28)',
    text:  'rgba(251,191,36,1)',     dot:    'rgba(251,191,36,1)',
    glow:  '0 0 20px rgba(251,191,36,0.15)', cardBg: 'rgba(251,191,36,0.02)',
  },
  DORMANT: {
    label: 'DORMANT', short: 'DORM',
    bg:    'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)',
    text:  'rgba(255,255,255,0.28)', dot:    'rgba(255,255,255,0.16)',
    glow:  'none',                   cardBg: 'transparent',
  },
} as const

const chainBadge: Record<string, { text: string; bg: string; border: string }> = {
  ETH:  { text: 'rgba(147,197,253,1)', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.25)' },
  ARB:  { text: 'rgba(125,211,252,1)', bg: 'rgba(14,165,233,0.10)',  border: 'rgba(14,165,233,0.25)' },
  BASE: { text: 'rgba(165,180,252,1)', bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.25)' },
  OP:   { text: 'rgba(252,129,129,1)', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)'  },
  SOL:  { text: 'rgba(200,150,255,1)', bg: 'rgba(153,69,255,0.10)',  border: 'rgba(153,69,255,0.25)' },
}

const fmtVal = (v: number) => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}

// ── Mini Spark SVG ─────────────────────────────────────────────────────────────
const MiniSpark = memo(({ data, positive }: { data: number[]; positive: boolean }) => {
  if (!data || data.length < 2) return null
  const W = 60; const H = 24; const PAD = 2
  const max = Math.max(...data, 0.001)
  const min = Math.min(...data)
  const range = max - min || 1
  const toX = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const toY = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2)
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ')
  const color = positive ? 'rgba(52,211,153,0.85)' : 'rgba(239,68,68,0.85)'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H, flexShrink: 0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
})
MiniSpark.displayName = 'MiniSpark'

// ── Skeleton Card ──────────────────────────────────────────────────────────────
const SkeletonCard = memo(({ delay = 0 }: { delay?: number }) => (
  <div
    className="rounded-2xl p-4 animate-float-up"
    style={{
      background:     'rgba(255,255,255,0.025)',
      border:         '1px solid rgba(255,255,255,0.06)',
      animationDelay: `${delay}s`,
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shimmer" />
        <div className="h-3.5 w-24 rounded shimmer" />
      </div>
      <div className="h-5 w-14 rounded-lg shimmer" />
    </div>
    <div className="h-7 w-28 rounded shimmer mb-2" />
    <div className="h-3 w-20 rounded shimmer" />
  </div>
))
SkeletonCard.displayName = 'SkeletonCard'

// ── Wallet Bento Card ──────────────────────────────────────────────────────────
interface WalletCardProps {
  wallet:     Wallet
  intel:      WalletIntelligence | null
  isSelected: boolean
  onSelect:   (id: string) => void
  index:      number
}

const WalletCard = memo(({ wallet, intel, isSelected, onSelect, index }: WalletCardProps) => {
  const [copied, setCopied] = useState(false)
  const sig    = (intel?.whaleScore?.status ?? 'DORMANT') as keyof typeof SIGNAL
  const cfg    = SIGNAL[sig] ?? SIGNAL.DORMANT
  const chain  = chainBadge[wallet.chain] ?? chainBadge.ETH
  const hasBig = (intel?.bigMoves?.length ?? 0) > 0
  const bigVal = intel?.bigMoves?.[0]?.valueUsd ?? 0
  const conviction = intel?.whaleScore?.conviction ?? 0

  // P&L from sparkData
  const sparkData = wallet.sparkData ?? []
  const pnlPct = sparkData.length >= 2
    ? ((sparkData[sparkData.length - 1] - sparkData[0]) / (sparkData[0] || 1)) * 100
    : 0
  const pnlPos = pnlPct >= 0

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(wallet.address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }, [wallet.address])

  const handleClick = useCallback(() => onSelect(wallet.id), [wallet.id, onSelect])

  return (
    <div
      onClick={handleClick}
      className="rounded-2xl p-4 cursor-pointer animate-float-up relative overflow-hidden"
      style={{
        background:     isSelected
          ? `linear-gradient(135deg, ${cfg.cardBg} 0%, rgba(255,255,255,0.02) 100%)`
          : 'rgba(255,255,255,0.025)',
        border:         isSelected
          ? `1px solid ${cfg.border}`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow:      isSelected ? cfg.glow : 'none',
        animationDelay: `${index * 0.04}s`,
        transition:     'all 0.18s ease',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          const el = e.currentTarget as HTMLDivElement
          el.style.background  = 'rgba(255,255,255,0.038)'
          el.style.borderColor = 'rgba(255,255,255,0.11)'
          el.style.transform   = 'translateY(-2px)'
          el.style.boxShadow   = '0 8px 32px rgba(0,0,0,0.25)'
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          const el = e.currentTarget as HTMLDivElement
          el.style.background  = 'rgba(255,255,255,0.025)'
          el.style.borderColor = 'rgba(255,255,255,0.07)'
          el.style.transform   = 'translateY(0)'
          el.style.boxShadow   = 'none'
        }
      }}
    >
      {/* Ambient neon orb when selected */}
      {isSelected && (
        <div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${cfg.text.replace(',1)', ',0.12)')} 0%, transparent 70%)` }}
        />
      )}

      {/* Top row: name + signal badge */}
      <div className="flex items-start justify-between mb-3 relative">
        <div className="flex items-center gap-2 min-w-0">
          {/* Active dot */}
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: wallet.active ? cfg.dot : 'rgba(255,255,255,0.14)',
              boxShadow:  wallet.active ? `0 0 8px ${cfg.text.replace(',1)', ',0.7)')}` : 'none',
              animation:  wallet.active ? 'pulse-glow 2s ease-in-out infinite' : 'none',
            }}
          />
          <span
            className="font-mono font-semibold truncate"
            style={{ fontSize: '13px', color: isSelected ? cfg.text : 'rgba(255,255,255,0.90)', maxWidth: '130px' }}
          >
            {wallet.label}
          </span>
          {wallet.txNew > 0 && (
            <span
              className="font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse"
              style={{ fontSize: '8px', background: 'rgba(0,255,148,0.10)', color: 'rgba(0,255,148,1)', border: '1px solid rgba(0,255,148,0.22)' }}
            >
              {wallet.txNew}
            </span>
          )}
        </div>

        {/* Signal badge */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0 ml-2"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
          <span className="font-mono font-bold" style={{ fontSize: '8px', color: cfg.text, letterSpacing: '0.08em' }}>
            {cfg.short}
          </span>
        </div>
      </div>

      {/* Balance + sparkline */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <div
            className="font-display font-bold tabular-nums leading-none"
            style={{ fontSize: '20px', color: 'rgba(255,255,255,0.92)' }}
          >
            {wallet.balance}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {/* Chain badge */}
            <span
              className="font-mono px-1.5 py-0.5 rounded"
              style={{ fontSize: '8px', fontWeight: 600, background: chain.bg, color: chain.text, border: `1px solid ${chain.border}` }}
            >
              {wallet.chain}
            </span>
            {/* P&L chip */}
            {pnlPct !== 0 && (
              <span
                className="font-mono flex items-center gap-0.5"
                style={{ fontSize: '9px', color: pnlPos ? 'rgba(52,211,153,0.9)' : 'rgba(239,68,68,0.9)' }}
              >
                {pnlPos ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownLeft className="w-2.5 h-2.5" />}
                {pnlPos ? '+' : ''}{pnlPct.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <MiniSpark data={sparkData} positive={pnlPos} />
      </div>

      {/* Address + conviction bar */}
      <div className="space-y-2">
        {/* Address row */}
        <div className="flex items-center justify-between">
          <span className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)' }}>
            {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 transition-colors"
              style={{ color: copied ? 'rgba(0,255,148,0.8)' : 'rgba(255,255,255,0.2)' }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            <a
              href={`https://etherscan.io/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: 'rgba(255,255,255,0.18)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0,255,148,0.7)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.18)' }}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Conviction bar */}
        <div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:      `${Math.max(2, conviction)}%`,
                background: sig === 'DORMANT'
                  ? 'rgba(255,255,255,0.12)'
                  : `linear-gradient(90deg, ${cfg.text}, ${cfg.text.replace(',1)', ',0.5)')})`,
                boxShadow:  sig !== 'DORMANT' ? `0 0 6px ${cfg.text.replace(',1)', ',0.4)')}` : 'none',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono" style={{ fontSize: '8px', color: 'rgba(255,255,255,0.18)' }}>conv</span>
            <span className="font-mono font-bold" style={{ fontSize: '8px', color: cfg.text }}>{conviction}</span>
          </div>
        </div>
      </div>

      {/* Big move banner */}
      {hasBig && (
        <div
          className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.20)' }}
        >
          <Zap className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(251,191,36,1)' }} />
          <span className="font-mono font-bold" style={{ fontSize: '9px', color: 'rgba(251,191,36,1)' }}>
            BIG MOVE — {fmtVal(bigVal)}
          </span>
        </div>
      )}
    </div>
  )
})
WalletCard.displayName = 'WalletCard'

// ── Main WalletTable ──────────────────────────────────────────────────────────

const WalletTable = memo(({ wallets, selectedWalletId, onSelectWallet, walletIntelMap, compact }: WalletTableProps) => {
  const loading = wallets.length === 0

  if (loading) {
    return (
      <div
        className="grid gap-3 p-4"
        style={{ gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} delay={i * 0.06} />)}
      </div>
    )
  }

  return (
    <div
      className="grid gap-3 p-4"
      style={{ gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))' }}
    >
      {wallets.map((w, i) => (
        <WalletCard
          key={w.id}
          wallet={w}
          intel={walletIntelMap[w.id] ?? null}
          isSelected={w.id === selectedWalletId}
          onSelect={onSelectWallet}
          index={i}
        />
      ))}
    </div>
  )
})
WalletTable.displayName = 'WalletTable'

export default WalletTable
