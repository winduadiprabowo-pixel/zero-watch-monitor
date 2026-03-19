/**
 * ZERØ WATCH — WalletTable v26
 * ==============================
 * ENTITY TABLE — differentiator vs Nansen/Arkham
 * - 1 row per ENTITY (Wintermute, Justin Sun, FTX Estate, etc.)
 * - Expand ▼ → see individual wallet breakdown per chain
 * - Pinned entities: Satoshi-Era 🌋 | Mt.Gox ⚠ | FTX Estate 💀 — always top
 * - Active chain indicator: TRX ACTIVE ● per entity
 * - Conviction max across wallets, total USD per group
 * - Fallback: flat wallet list if no entityGroups provided
 *
 * rgba() only ✓  React.memo + displayName ✓  useCallback + useMemo ✓
 */

import React, { memo, useCallback, useMemo, useState } from 'react'
import { ChevronRight, ChevronDown, Zap, ExternalLink, Copy, Check, Pin } from 'lucide-react'
import type { Wallet } from '@/data/mockData'
import type { WalletIntelligence } from '@/services/whaleAnalytics'

// ── EntityGroup type (computed in Index.tsx, passed in) ───────────────────────

export interface EntityGroup {
  entity:       string
  wallets:      Wallet[]
  totalUsd:     number
  chains:       string[]
  activeChains: string[]
  topSignal:    'ACCUMULATING' | 'DISTRIBUTING' | 'HUNTING' | 'DORMANT'
  conviction:   number
  lastMove:     string
  pinned:       boolean
  logo?:        string
}

interface WalletTableProps {
  wallets:          Wallet[]
  selectedWalletId: string | null
  onSelectWallet:   (id: string) => void
  walletIntelMap:   Record<string, WalletIntelligence>
  loadingIds?:      Set<string>
  compact?:         boolean
  entityGroups?:    EntityGroup[]   // NEW v26 — entity-grouped view
}

// ── Config ────────────────────────────────────────────────────────────────────

const SIGNAL = {
  ACCUMULATING: { short: 'ACCUM', color: 'rgba(52,211,153,1)',    bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.28)' },
  DISTRIBUTING: { short: 'DISTR', color: 'rgba(239,68,68,1)',     bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)'  },
  HUNTING:      { short: 'HUNT',  color: 'rgba(251,191,36,1)',    bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.22)' },
  DORMANT:      { short: 'DORM',  color: 'rgba(255,255,255,0.22)',bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
} as const

const CHAIN_COLOR: Record<string, string> = {
  ETH:  'rgba(147,197,253,1)',
  ARB:  'rgba(125,211,252,1)',
  BASE: 'rgba(165,180,252,1)',
  OP:   'rgba(252,129,129,1)',
  SOL:  'rgba(167,139,250,1)',
  BTC:  'rgba(251,191,36,1)',
  TRX:  'rgba(239,68,68,0.85)',
  BNB:  'rgba(252,211,77,1)',
}

// Pinned entity special config
const PINNED_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  'Satoshi-Era':   { icon: '🌋', color: 'rgba(239,68,68,1)',    bg: 'rgba(239,68,68,0.06)',    border: 'rgba(239,68,68,0.22)'    },
  'Mt.Gox Trustee':{ icon: '⚠',  color: 'rgba(251,191,36,1)',  bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.22)'  },
  'FTX Estate':    { icon: '💀', color: 'rgba(239,68,68,0.85)', bg: 'rgba(239,68,68,0.05)',   border: 'rgba(239,68,68,0.18)'   },
}

const fmtVal = (v: number) => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`
  if (v > 0)              return `$${v.toFixed(0)}`
  return '—'
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const SkeletonRow = memo(({ i }: { i: number }) => (
  <div
    className="flex items-center gap-3 px-4"
    style={{ height: '44px', borderBottom: '1px solid rgba(255,255,255,0.04)', animationDelay: `${i * 0.03}s` }}
  >
    <div className="w-2 h-2 rounded-full shimmer flex-shrink-0" />
    <div className="h-3 w-28 rounded shimmer flex-1" />
    <div className="h-3 w-16 rounded shimmer" />
    <div className="h-3 w-20 rounded shimmer" />
    <div className="h-4 w-14 rounded-lg shimmer" />
  </div>
))
SkeletonRow.displayName = 'SkeletonRow'

const CopyBtn = memo(({ address }: { address: string }) => {
  const [copied, setCopied] = useState(false)
  const handle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }, [address])
  return (
    <button
      onClick={handle}
      style={{ color: copied ? 'rgba(0,255,136,0.7)' : 'rgba(255,255,255,0.18)', flexShrink: 0 }}
    >
      {copied
        ? <Check style={{ width: '11px', height: '11px' }} />
        : <Copy  style={{ width: '11px', height: '11px' }} />}
    </button>
  )
})
CopyBtn.displayName = 'CopyBtn'

const ConvBar = memo(({ value, color }: { value: number; color: string }) => {
  const R = 12
  const circumference = 2 * Math.PI * R
  const pct = Math.min(100, Math.max(0, value))
  const dash = (pct / 100) * circumference
  return (
    <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
      <svg width="32" height="32" viewBox="0 0 32 32" className="conviction-ring">
        <circle cx="16" cy="16" r={R} className="conviction-ring-track" />
        <circle
          cx="16" cy="16" r={R}
          className="conviction-ring-fill"
          stroke={color}
          strokeDasharray={`${dash} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: '9px', fontWeight: 700,
        color: pct > 50 ? color : 'rgba(255,255,255,0.4)',
      }}>
        {pct}
      </div>
    </div>
  )
})
ConvBar.displayName = 'ConvBar'

// ── Chain chips (compact multi-chain display) ─────────────────────────────────

const ChainChips = memo(({ chains, activeChains, maxShow = 2 }: {
  chains: string[]; activeChains: string[]; maxShow?: number
}) => {
  const shown  = chains.slice(0, maxShow)
  const hidden = chains.length - maxShow

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'nowrap' }}>
      {shown.map(c => {
        const color  = CHAIN_COLOR[c] ?? 'rgba(255,255,255,0.4)'
        const active = activeChains.includes(c)
        return (
          <span
            key={c}
            style={{
              fontFamily:   "'IBM Plex Mono',monospace",
              fontSize:     '8px',
              fontWeight:   700,
              color,
              background:   color.replace(/[\d.]+\)$/, '0.08)'),
              border:       `1px solid ${active ? color.replace(/[\d.]+\)$/, '0.45)') : color.replace(/[\d.]+\)$/, '0.18)')}`,
              borderRadius: '3px',
              padding:      '1px 4px',
              position:     'relative',
              boxShadow:    active ? `0 0 5px ${color.replace(/[\d.]+\)$/, '0.35)')}` : 'none',
            }}
          >
            {c}
            {active && (
              <span style={{
                position: 'absolute', top: '-3px', right: '-3px',
                width: '5px', height: '5px', borderRadius: '50%',
                background: color, boxShadow: `0 0 4px ${color}`,
                animation: 'pulse-glow 2s ease-in-out infinite',
              }} />
            )}
          </span>
        )
      })}
      {hidden > 0 && (
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px',
          color: 'rgba(255,255,255,0.30)', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)', borderRadius: '3px', padding: '1px 4px',
        }}>
          +{hidden}
        </span>
      )}
    </div>
  )
})
ChainChips.displayName = 'ChainChips'

// ── Entity Group Row ──────────────────────────────────────────────────────────

interface EntityGroupRowProps {
  group:      EntityGroup
  rank:       number
  isExpanded: boolean
  onToggle:   (entity: string) => void
  onSelect:   (id: string) => void
  hasSelectedChild: boolean
}

const EntityGroupRow = memo(({ group, rank, isExpanded, onToggle, onSelect, hasSelectedChild }: EntityGroupRowProps) => {
  const cfg      = SIGNAL[group.topSignal] ?? SIGNAL.DORMANT
  const pinned   = PINNED_CONFIG[group.entity]
  const rowColor = pinned ? pinned.color : (hasSelectedChild ? 'rgba(0,255,136,0.05)' : 'transparent')
  const borderL  = pinned
    ? `2px solid ${pinned.border}`
    : hasSelectedChild ? '2px solid rgba(0,255,136,0.28)' : '2px solid transparent'

  const handleToggle = useCallback(() => {
    onToggle(group.entity)
    // Select first wallet in group so intel panel opens
    if (group.wallets.length > 0) onSelect(group.wallets[0].id)
  }, [group.entity, group.wallets, onToggle, onSelect])

  const walletCount = group.wallets.length

  return (
    <div
      onClick={handleToggle}
      className="flex items-center gap-0 cursor-pointer group"
      style={{
        height:       '48px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background:   pinned ? pinned.bg : (hasSelectedChild ? 'rgba(0,255,136,0.02)' : 'transparent'),
        borderLeft:   borderL,
        transition:   'all 0.12s ease',
      }}
      onMouseEnter={e => {
        if (!hasSelectedChild) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'
      }}
      onMouseLeave={e => {
        if (!hasSelectedChild) (e.currentTarget as HTMLDivElement).style.background = pinned ? pinned.bg : 'transparent'
      }}
    >
      {/* Rank # */}
      <div style={{ width: '36px', textAlign: 'right', paddingRight: '10px', flexShrink: 0 }}>
        {pinned ? (
          <Pin style={{ width: '10px', height: '10px', color: pinned.color, marginLeft: 'auto', marginRight: '10px', opacity: 0.8 }} />
        ) : (
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.16)' }}>
            {rank}
          </span>
        )}
      </div>

      {/* Expand arrow */}
      <div style={{ width: '16px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {isExpanded
          ? <ChevronDown style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.35)' }} />
          : <ChevronRight style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.20)' }} />
        }
      </div>

      {/* Entity name + logo */}
      <div style={{ flex: '0 0 180px', minWidth: 0, paddingRight: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Logo or fallback */}
        {group.logo ? (
          <img
            src={group.logo}
            alt={group.entity}
            style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, opacity: 0.92 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : pinned ? (
          <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: 1 }}>{pinned.icon}</span>
        ) : (
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
            background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700,
            color: 'rgba(0,255,136,0.7)',
          }}>
            {group.entity.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {pinned && group.logo && (
              <span style={{ fontSize: '10px', flexShrink: 0, lineHeight: 1 }}>{pinned.icon}</span>
            )}
            <span style={{
              fontFamily:   "'Syne',sans-serif",
              fontSize:     '12px',
              fontWeight:   700,
              letterSpacing:'0.01em',
              color:        pinned ? pinned.color : 'rgba(255,255,255,0.90)',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              maxWidth:     '130px',
            }}>
              {group.entity}
            </span>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.20)', marginTop: '1px' }}>
            {group.wallets.length} wallet{group.wallets.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Chain chips */}
      <div style={{ flex: '0 0 44px', flexShrink: 0 }}>
        <ChainChips chains={group.chains} activeChains={group.activeChains} maxShow={1} />
      </div>

      {/* Total USD */}
      <div style={{ flex: '0 0 100px', flexShrink: 0, paddingRight: '8px' }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize:   '12px',
          fontWeight: 600,
          color:      group.totalUsd > 0
            ? (pinned ? pinned.color : 'rgba(255,255,255,0.92)')
            : 'rgba(255,255,255,0.20)',
          whiteSpace: 'nowrap',
        }}>
          {fmtVal(group.totalUsd)}
        </span>
      </div>

      {/* Signal badge */}
      <div style={{ flex: '0 0 68px', flexShrink: 0 }}>
        <span style={{
          fontFamily:    "'IBM Plex Mono',monospace",
          fontSize:      '8px',
          fontWeight:    700,
          letterSpacing: '0.06em',
          color:         cfg.color,
          background:    cfg.bg,
          border:        `1px solid ${cfg.border}`,
          borderRadius:  '4px',
          padding:       '2px 6px',
        }}>
          {cfg.short}
        </span>
      </div>

      {/* Conviction bar + number */}
      <div style={{ flex: '0 0 72px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <ConvBar value={group.conviction} color={pinned ? pinned.color : cfg.color} />
      </div>

      {/* Last move */}
      <div style={{ flex: '0 0 70px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
          {group.lastMove}
        </span>
      </div>

      {/* Active chains + expand hint */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '14px', gap: '6px' }}>
        {group.activeChains.length > 0 && (
          <ChainChips chains={group.activeChains} activeChains={group.activeChains} maxShow={3} />
        )}
        {walletCount > 1 && (
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px',
            color: isExpanded ? 'rgba(0,255,136,0.7)' : 'rgba(255,255,255,0.16)',
            background: isExpanded ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.04)',
            border: isExpanded ? '1px solid rgba(0,255,136,0.14)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px',
            padding: '1px 5px',
            transition: 'all 0.15s',
          }}>
            {isExpanded ? 'COLLAPSE' : `×${walletCount}`}
          </span>
        )}
      </div>
    </div>
  )
})
EntityGroupRow.displayName = 'EntityGroupRow'

// ── Individual Wallet Row (sub-row under expanded entity) ─────────────────────

interface WalletSubRowProps {
  wallet:     Wallet
  intel:      WalletIntelligence | null
  isSelected: boolean
  onSelect:   (id: string) => void
  isLoading?: boolean
  isLast:     boolean
}

const WalletSubRow = memo(({ wallet, intel, isSelected, onSelect, isLoading, isLast }: WalletSubRowProps) => {
  const sig        = (intel?.whaleScore?.status ?? 'DORMANT') as keyof typeof SIGNAL
  const cfg        = SIGNAL[sig] ?? SIGNAL.DORMANT
  const hasBig     = (intel?.bigMoves?.length ?? 0) > 0
  const bigVal     = intel?.bigMoves?.[0]?.valueUsd ?? 0
  const conviction = intel?.whaleScore?.conviction ?? 0
  const chainColor = CHAIN_COLOR[wallet.chain] ?? 'rgba(255,255,255,0.4)'

  const isEmpty = !isLoading && (
    !wallet.balance || wallet.balance === '0' || wallet.balance === '$0'
    || wallet.balance.startsWith('0 ') || wallet.balance === '~0 ETH'
  )

  const handleClick = useCallback(() => onSelect(wallet.id), [wallet.id, onSelect])

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-0 cursor-pointer group"
      style={{
        height:       '40px',
        borderBottom: isLast ? '2px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.03)',
        background:   isSelected ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.012)',
        borderLeft:   isSelected ? '2px solid rgba(0,255,136,0.6)' : '2px solid transparent',
        opacity:      isEmpty && !isSelected ? 0.38 : 1,
        transition:   'all 0.12s ease',
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = isSelected ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.012)'
      }}
    >
      {/* Indent spacer (index col) */}
      <div style={{ width: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.10)' }}>└</span>
      </div>

      {/* Status dot */}
      <div style={{ width: '16px', flexShrink: 0 }}>
        <span style={{
          display:      'inline-block',
          width:        '5px',
          height:       '5px',
          borderRadius: '50%',
          background:   wallet.active ? cfg.color : 'rgba(255,255,255,0.10)',
          boxShadow:    wallet.active && sig !== 'DORMANT' ? `0 0 5px ${cfg.color}` : 'none',
        }} />
      </div>

      {/* Name */}
      <div style={{ flex: '0 0 160px', minWidth: 0, paddingRight: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            fontFamily:   "'IBM Plex Mono',monospace",
            fontSize:     '11px',
            fontWeight:   isSelected ? 600 : 400,
            color:        isSelected ? 'rgba(0,255,136,1)' : 'rgba(255,255,255,0.70)',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            maxWidth:     '130px',
          }}>
            {wallet.label}
          </span>
          {wallet.txNew > 0 && (
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700,
              color: 'rgba(0,255,136,1)', background: 'rgba(0,255,136,0.08)',
              border: '1px solid rgba(0,255,136,0.16)', borderRadius: '99px',
              padding: '0 4px', lineHeight: '14px', flexShrink: 0,
            }}>
              {wallet.txNew}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.18)' }}>
            {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
          </span>
          <CopyBtn address={wallet.address} />
        </div>
      </div>

      {/* Chain */}
      <div style={{ flex: '0 0 44px', flexShrink: 0 }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 600,
          color: chainColor, background: chainColor.replace(/[\d.]+\)$/, '0.08)'),
          border: `1px solid ${chainColor.replace(/[\d.]+\)$/, '0.22)')}`,
          borderRadius: '4px', padding: '1px 4px',
        }}>
          {wallet.chain}
        </span>
      </div>

      {/* Balance */}
      <div style={{ flex: '0 0 100px', flexShrink: 0, paddingRight: '8px' }}>
        {isLoading && isEmpty ? (
          <div className="shimmer rounded" style={{ height: '11px', width: '56px' }} />
        ) : (
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600,
            color: isEmpty ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)',
            whiteSpace: 'nowrap',
          }}>
            {wallet.balance}
          </span>
        )}
      </div>

      {/* Signal badge */}
      <div style={{ flex: '0 0 68px', flexShrink: 0 }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '7px', fontWeight: 700,
          letterSpacing: '0.06em', color: cfg.color, background: cfg.bg,
          border: `1px solid ${cfg.border}`, borderRadius: '4px', padding: '1px 5px',
        }}>
          {cfg.short}
        </span>
      </div>

      {/* Conviction */}
      <div style={{ flex: '0 0 72px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <ConvBar value={conviction} color={cfg.color} />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.28)', width: '20px' }}>
          {conviction}
        </span>
      </div>

      {/* Last move */}
      <div style={{ flex: '0 0 70px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.22)' }}>
          {wallet.lastMove ?? '—'}
        </span>
      </div>

      {/* Big move + etherscan */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '14px', gap: '6px' }}>
        {hasBig && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            padding: '1px 5px', background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.18)', borderRadius: '4px',
          }}>
            <Zap style={{ width: '8px', height: '8px', color: 'rgba(251,191,36,1)', flexShrink: 0 }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '7px', fontWeight: 700, color: 'rgba(251,191,36,1)', whiteSpace: 'nowrap' }}>
              {fmtVal(bigVal)}
            </span>
          </div>
        )}
        <a
          href={`https://etherscan.io/address/${wallet.address}`}
          target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: 'rgba(255,255,255,0.12)', flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0,255,136,0.5)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.12)' }}
        >
          <ExternalLink style={{ width: '10px', height: '10px' }} />
        </a>
      </div>
    </div>
  )
})
WalletSubRow.displayName = 'WalletSubRow'

// ── Original flat WalletRow (fallback when no entityGroups) ───────────────────

interface RowProps {
  wallet:     Wallet
  intel:      WalletIntelligence | null
  isSelected: boolean
  onSelect:   (id: string) => void
  index:      number
  isLoading?: boolean
}

const WalletRow = memo(({ wallet, intel, isSelected, onSelect, index, isLoading }: RowProps) => {
  const sig        = (intel?.whaleScore?.status ?? 'DORMANT') as keyof typeof SIGNAL
  const cfg        = SIGNAL[sig] ?? SIGNAL.DORMANT
  const hasBig     = (intel?.bigMoves?.length ?? 0) > 0
  const bigVal     = intel?.bigMoves?.[0]?.valueUsd ?? 0
  const conviction = intel?.whaleScore?.conviction ?? 0
  const chainColor = CHAIN_COLOR[wallet.chain] ?? 'rgba(255,255,255,0.4)'
  const isEmpty    = !isLoading && (
    !wallet.balance || wallet.balance === '0' || wallet.balance === '$0'
    || wallet.balance.startsWith('0 ') || wallet.balance === '~0 ETH'
  )
  const handleClick = useCallback(() => onSelect(wallet.id), [wallet.id, onSelect])

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-0 cursor-pointer group"
      style={{
        height:       '44px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background:   isSelected ? 'rgba(0,255,136,0.05)' : 'transparent',
        borderLeft:   isSelected ? '2px solid rgba(0,255,136,0.7)' : '2px solid transparent',
        opacity:      isEmpty && !isSelected ? 0.38 : 1,
        transition:   'all 0.12s ease',
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)' }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      <div style={{ width: '36px', textAlign: 'right', paddingRight: '10px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.16)' }}>{index + 1}</span>
      </div>
      <div style={{ width: '16px', flexShrink: 0 }}>
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: wallet.active ? cfg.color : 'rgba(255,255,255,0.10)', boxShadow: wallet.active && sig !== 'DORMANT' ? `0 0 6px ${cfg.color}` : 'none' }} />
      </div>
      <div style={{ flex: '0 0 160px', minWidth: 0, paddingRight: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'rgba(0,255,136,1)' : 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{wallet.label}</span>
          {wallet.txNew > 0 && <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700, color: 'rgba(0,255,136,1)', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.16)', borderRadius: '99px', padding: '0 4px', lineHeight: '14px', flexShrink: 0 }}>{wallet.txNew}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.20)' }}>{wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}</span>
          <CopyBtn address={wallet.address} />
        </div>
      </div>
      <div style={{ flex: '0 0 44px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, color: chainColor, background: chainColor.replace(/[\d.]+\)$/, '0.08)'), border: `1px solid ${chainColor.replace(/[\d.]+\)$/, '0.22)')}`, borderRadius: '4px', padding: '1px 5px' }}>{wallet.chain}</span>
      </div>
      <div style={{ flex: '0 0 100px', flexShrink: 0, paddingRight: '8px' }}>
        {isLoading && isEmpty
          ? <div className="shimmer rounded" style={{ height: '12px', width: '60px' }} />
          : <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 600, color: isEmpty ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap' }}>{wallet.balance}</span>
        }
      </div>
      <div style={{ flex: '0 0 68px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700, letterSpacing: '0.06em', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '4px', padding: '2px 6px' }}>{cfg.short}</span>
      </div>
      <div style={{ flex: '0 0 72px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <ConvBar value={conviction} color={cfg.color} />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', width: '20px' }}>{conviction}</span>
      </div>
      <div style={{ flex: '0 0 70px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{wallet.lastMove ?? '—'}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '14px', gap: '6px' }}>
        {hasBig && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: '4px' }}>
            <Zap style={{ width: '9px', height: '9px', color: 'rgba(251,191,36,1)', flexShrink: 0 }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700, color: 'rgba(251,191,36,1)', whiteSpace: 'nowrap' }}>{fmtVal(bigVal)}</span>
          </div>
        )}
        <a href={`https://etherscan.io/address/${wallet.address}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'rgba(255,255,255,0.14)', flexShrink: 0 }} onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0,255,136,0.6)' }} onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.14)' }}>
          <ExternalLink style={{ width: '11px', height: '11px' }} />
        </a>
      </div>
    </div>
  )
})
WalletRow.displayName = 'WalletRow'

// ── Column headers ─────────────────────────────────────────────────────────────

const TableHeader = memo(() => (
  <div
    className="flex items-center sticky top-0 z-10"
    style={{
      height:         '30px',
      borderBottom:   '1px solid rgba(255,255,255,0.07)',
      background:     'rgba(4,4,10,0.96)',
      backdropFilter: 'blur(8px)',
    }}
  >
    <div style={{ width: '36px', flexShrink: 0 }} />
    <div style={{ width: '16px', flexShrink: 0 }} />
    <div style={{ flex: '0 0 160px', paddingRight: '8px' }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Entity</span>
    </div>
    <div style={{ flex: '0 0 44px' }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Chain</span>
    </div>
    <div style={{ flex: '0 0 100px', paddingRight: '8px' }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Total</span>
    </div>
    <div style={{ flex: '0 0 68px' }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Signal</span>
    </div>
    <div style={{ flex: '0 0 72px' }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Conv</span>
    </div>
    <div style={{ flex: '0 0 70px' }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Last Move</span>
    </div>
    <div style={{ flex: 1, paddingRight: '14px', textAlign: 'right' }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Active</span>
    </div>
  </div>
))
TableHeader.displayName = 'TableHeader'

// ── Main WalletTable ──────────────────────────────────────────────────────────

const WalletTable = memo(({
  wallets, selectedWalletId, onSelectWallet,
  walletIntelMap, loadingIds, compact, entityGroups,
}: WalletTableProps) => {

  // Expand state — entity names that are expanded
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const handleToggle = useCallback((entity: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(entity)) next.delete(entity)
      else next.add(entity)
      return next
    })
  }, [])

  // Which entity does the selected wallet belong to?
  const selectedEntity = useMemo(() => {
    if (!selectedWalletId || !entityGroups) return null
    return entityGroups.find(g => g.wallets.some(w => w.id === selectedWalletId))?.entity ?? null
  }, [selectedWalletId, entityGroups])

  const loading = wallets.length === 0

  if (loading) {
    return (
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div className="flex items-center gap-0 px-0" style={{ height: '32px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}>
          {[36, 16, 160, 44, 100, 68, 72, 70].map((w, i) => (
            <div key={i} style={{ flex: i === 7 ? 1 : `0 0 ${w}px`, paddingLeft: i === 0 ? '12px' : 0 }}>
              <div className="h-2 w-12 rounded shimmer" />
            </div>
          ))}
        </div>
        {[...Array(8)].map((_, i) => <SkeletonRow key={i} i={i} />)}
      </div>
    )
  }

  // ── Entity grouped view ────────────────────────────────────────────────────
  if (entityGroups && entityGroups.length > 0) {
    const totalEntities = entityGroups.length
    const totalWallets  = entityGroups.reduce((s, g) => s + g.wallets.length, 0)
    const activeCount   = entityGroups.filter(g => g.topSignal !== 'DORMANT').length

    return (
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <TableHeader />

        {entityGroups.map((group, i) => {
          const isExpanded       = expanded.has(group.entity)
          const hasSelectedChild = group.entity === selectedEntity

          return (
            <React.Fragment key={group.entity}>
              <EntityGroupRow
                group={group}
                rank={i + 1}
                isExpanded={isExpanded}
                onToggle={handleToggle}
                onSelect={onSelectWallet}
                hasSelectedChild={hasSelectedChild}
              />

              {/* Expanded sub-rows */}
              {isExpanded && group.wallets.map((w, wi) => (
                <WalletSubRow
                  key={w.id}
                  wallet={w}
                  intel={walletIntelMap[w.id] ?? null}
                  isSelected={w.id === selectedWalletId}
                  onSelect={onSelectWallet}
                  isLoading={loadingIds ? loadingIds.has(w.id) : false}
                  isLast={wi === group.wallets.length - 1}
                />
              ))}
            </React.Fragment>
          )
        })}

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.16)' }}>
            {totalEntities} entities · {totalWallets} wallets
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: activeCount > 0 ? 'rgba(52,211,153,0.6)' : 'rgba(255,255,255,0.12)' }}>
            {activeCount} active
          </span>
        </div>
      </div>
    )
  }

  // ── Fallback flat wallet view ──────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
      <div
        className="flex items-center sticky top-0 z-10"
        style={{ height: '30px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(4,4,10,0.96)', backdropFilter: 'blur(8px)' }}
      >
        <div style={{ width: '36px', flexShrink: 0 }} />
        <div style={{ width: '16px', flexShrink: 0 }} />
        <div style={{ flex: '0 0 160px', paddingRight: '8px' }}><span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Wallet</span></div>
        <div style={{ flex: '0 0 44px' }}><span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Chain</span></div>
        <div style={{ flex: '0 0 100px', paddingRight: '8px' }}><span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Balance</span></div>
        <div style={{ flex: '0 0 68px' }}><span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Signal</span></div>
        <div style={{ flex: '0 0 72px' }}><span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Conv</span></div>
        <div style={{ flex: '0 0 70px' }}><span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Last Move</span></div>
        <div style={{ flex: 1, paddingRight: '14px', textAlign: 'right' }}><span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Alert</span></div>
      </div>

      {wallets.map((w, i) => (
        <WalletRow
          key={w.id} wallet={w} intel={walletIntelMap[w.id] ?? null}
          isSelected={w.id === selectedWalletId} onSelect={onSelectWallet}
          index={i} isLoading={loadingIds ? loadingIds.has(w.id) : false}
        />
      ))}

      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.16)' }}>
          {wallets.length} wallets · sorted by activity
        </span>
      </div>
    </div>
  )
})
WalletTable.displayName = 'WalletTable'

export default WalletTable
