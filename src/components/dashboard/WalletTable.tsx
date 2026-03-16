/**
 * ZERØ WATCH — WalletTable v24
 * ==============================
 * FULL REDESIGN — dense Nansen/Arkham style table
 * - 1 row per wallet, ~44px height
 * - Columns: status | name | chain | balance | signal | conv | last move | big move
 * - 44 wallets visible tanpa scroll banyak
 * - Sorted by balance (handled by parent)
 * - 0 balance rows dimmed — gak ganggu visual
 * - Click row = select wallet for intel panel
 *
 * rgba() only ✓  React.memo + displayName ✓  useCallback ✓
 */

import React, { memo, useCallback, useState } from 'react'
import { Zap, ExternalLink, Copy, Check } from 'lucide-react'
import type { Wallet } from '@/data/mockData'
import type { WalletIntelligence } from '@/services/whaleAnalytics'

interface WalletTableProps {
  wallets:          Wallet[]
  selectedWalletId: string | null
  onSelectWallet:   (id: string) => void
  walletIntelMap:   Record<string, WalletIntelligence>
  compact?:         boolean
}

// ── Config ────────────────────────────────────────────────────────────────────

const SIGNAL = {
  ACCUMULATING: { short: 'ACCUM', color: 'rgba(52,211,153,1)',   bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.28)' },
  DISTRIBUTING: { short: 'DISTR', color: 'rgba(239,68,68,1)',    bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)'  },
  HUNTING:      { short: 'HUNT',  color: 'rgba(251,191,36,1)',   bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.22)' },
  DORMANT:      { short: 'DORM',  color: 'rgba(255,255,255,0.22)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
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

const fmtVal = (v: number) => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

const SkeletonRow = memo(({ i }: { i: number }) => (
  <div
    className="flex items-center gap-3 px-4"
    style={{
      height:         '44px',
      borderBottom:   '1px solid rgba(255,255,255,0.04)',
      animationDelay: `${i * 0.03}s`,
    }}
  >
    <div className="w-2 h-2 rounded-full shimmer flex-shrink-0" />
    <div className="h-3 w-28 rounded shimmer flex-1" />
    <div className="h-3 w-16 rounded shimmer" />
    <div className="h-3 w-20 rounded shimmer" />
    <div className="h-4 w-14 rounded-lg shimmer" />
  </div>
))
SkeletonRow.displayName = 'SkeletonRow'

// ── Copy button ───────────────────────────────────────────────────────────────

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
      style={{ color: copied ? 'rgba(230,161,71,0.7)' : 'rgba(255,255,255,0.18)', flexShrink: 0 }}
    >
      {copied ? <Check style={{ width: '11px', height: '11px' }} /> : <Copy style={{ width: '11px', height: '11px' }} />}
    </button>
  )
})
CopyBtn.displayName = 'CopyBtn'

// ── Conviction mini bar ───────────────────────────────────────────────────────

const ConvBar = memo(({ value, color }: { value: number; color: string }) => (
  <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', flexShrink: 0 }}>
    <div style={{
      height:     '100%',
      width:      `${Math.max(2, value)}%`,
      background: color,
      borderRadius: '99px',
      transition: 'width 0.5s ease',
    }} />
  </div>
))
ConvBar.displayName = 'ConvBar'

// ── Wallet Row ─────────────────────────────────────────────────────────────────

interface RowProps {
  wallet:     Wallet
  intel:      WalletIntelligence | null
  isSelected: boolean
  onSelect:   (id: string) => void
  index:      number
}

const WalletRow = memo(({ wallet, intel, isSelected, onSelect, index }: RowProps) => {
  const sig        = (intel?.whaleScore?.status ?? 'DORMANT') as keyof typeof SIGNAL
  const cfg        = SIGNAL[sig] ?? SIGNAL.DORMANT
  const hasBig     = (intel?.bigMoves?.length ?? 0) > 0
  const bigVal     = intel?.bigMoves?.[0]?.valueUsd ?? 0
  const conviction = intel?.whaleScore?.conviction ?? 0
  const chainColor = CHAIN_COLOR[wallet.chain] ?? 'rgba(255,255,255,0.4)'

  // Is balance zero/empty?
  const isEmpty = !wallet.balance || wallet.balance === '0' || wallet.balance === '$0'
    || wallet.balance.startsWith('0 ') || wallet.balance === '~0 ETH'

  const handleClick = useCallback(() => onSelect(wallet.id), [wallet.id, onSelect])

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-0 cursor-pointer group"
      style={{
        height:       '44px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background:   isSelected
          ? 'rgba(230,161,71,0.06)'
          : 'transparent',
        borderLeft:   isSelected
          ? '2px solid rgba(230,161,71,0.7)'
          : '2px solid transparent',
        opacity:      isEmpty && !isSelected ? 0.38 : 1,
        transition:   'all 0.12s ease',
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
      }}
    >
      {/* Index # */}
      <div style={{ width: '36px', textAlign: 'right', paddingRight: '10px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.16)' }}>
          {index + 1}
        </span>
      </div>

      {/* Status dot */}
      <div style={{ width: '16px', flexShrink: 0 }}>
        <span
          style={{
            display:      'inline-block',
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   wallet.active ? cfg.color : 'rgba(255,255,255,0.10)',
            boxShadow:    wallet.active && sig !== 'DORMANT' ? `0 0 6px ${cfg.color}` : 'none',
          }}
        />
      </div>

      {/* Name */}
      <div style={{ flex: '0 0 160px', minWidth: 0, paddingRight: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              fontFamily:   "'IBM Plex Mono',monospace",
              fontSize:     '12px',
              fontWeight:   isSelected ? 600 : 400,
              color:        isSelected ? 'rgba(230,161,71,1)' : 'rgba(255,255,255,0.85)',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              maxWidth:     '140px',
            }}
          >
            {wallet.label}
          </span>
          {wallet.txNew > 0 && (
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize:   '8px',
              fontWeight: 700,
              color:      'rgba(230,161,71,1)',
              background: 'rgba(230,161,71,0.10)',
              border:     '1px solid rgba(230,161,71,0.22)',
              borderRadius: '99px',
              padding:    '0 4px',
              lineHeight: '14px',
              flexShrink: 0,
            }}>
              {wallet.txNew}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.20)' }}>
            {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
          </span>
          <CopyBtn address={wallet.address} />
        </div>
      </div>

      {/* Chain */}
      <div style={{ flex: '0 0 44px', flexShrink: 0 }}>
        <span style={{
          fontFamily:   "'IBM Plex Mono',monospace",
          fontSize:     '9px',
          fontWeight:   600,
          color:        chainColor,
          background:   chainColor.replace(/[\d.]+\)$/, '0.08)'),
          border:       `1px solid ${chainColor.replace(/[\d.]+\)$/, '0.22)')}`,
          borderRadius: '4px',
          padding:      '1px 5px',
        }}>
          {wallet.chain}
        </span>
      </div>

      {/* Balance */}
      <div style={{ flex: '0 0 100px', flexShrink: 0, paddingRight: '8px' }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize:   '12px',
          fontWeight: 600,
          color:      isEmpty ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.92)',
          whiteSpace: 'nowrap',
        }}>
          {wallet.balance}
        </span>
      </div>

      {/* Signal badge */}
      <div style={{ flex: '0 0 68px', flexShrink: 0 }}>
        <span style={{
          fontFamily:   "'IBM Plex Mono',monospace",
          fontSize:     '8px',
          fontWeight:   700,
          letterSpacing:'0.06em',
          color:        cfg.color,
          background:   cfg.bg,
          border:       `1px solid ${cfg.border}`,
          borderRadius: '4px',
          padding:      '2px 6px',
        }}>
          {cfg.short}
        </span>
      </div>

      {/* Conviction bar + number */}
      <div style={{ flex: '0 0 72px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <ConvBar value={conviction} color={cfg.color} />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.35)', width: '20px' }}>
          {conviction}
        </span>
      </div>

      {/* Last move */}
      <div style={{ flex: '0 0 70px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
          {wallet.lastMove ?? '—'}
        </span>
      </div>

      {/* Big move alert / etherscan link */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '14px', gap: '6px' }}>
        {hasBig && (
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '3px',
            padding:    '2px 6px',
            background: 'rgba(251,191,36,0.06)',
            border:     '1px solid rgba(251,191,36,0.22)',
            borderRadius: '4px',
          }}>
            <Zap style={{ width: '9px', height: '9px', color: 'rgba(251,191,36,1)', flexShrink: 0 }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700, color: 'rgba(251,191,36,1)', whiteSpace: 'nowrap' }}>
              {fmtVal(bigVal)}
            </span>
          </div>
        )}
        <a
          href={`https://etherscan.io/address/${wallet.address}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: 'rgba(255,255,255,0.14)', flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(230,161,71,0.6)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.14)' }}
        >
          <ExternalLink style={{ width: '11px', height: '11px' }} />
        </a>
      </div>
    </div>
  )
})
WalletRow.displayName = 'WalletRow'

// ── Main WalletTable ──────────────────────────────────────────────────────────

const WalletTable = memo(({ wallets, selectedWalletId, onSelectWallet, walletIntelMap, compact }: WalletTableProps) => {
  const loading = wallets.length === 0

  if (loading) {
    return (
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* Header */}
        <div
          className="flex items-center gap-0 px-0"
          style={{
            height:       '32px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background:   'rgba(255,255,255,0.015)',
          }}
        >
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

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

      {/* Column headers */}
      <div
        className="flex items-center sticky top-0 z-10"
        style={{
          height:       '30px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background:   'rgba(4,4,10,0.96)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* # */}
        <div style={{ width: '36px', textAlign: 'right', paddingRight: '10px', flexShrink: 0 }} />
        {/* dot */}
        <div style={{ width: '16px', flexShrink: 0 }} />
        {/* name */}
        <div style={{ flex: '0 0 160px', paddingRight: '8px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Wallet
          </span>
        </div>
        {/* chain */}
        <div style={{ flex: '0 0 44px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Chain
          </span>
        </div>
        {/* balance */}
        <div style={{ flex: '0 0 100px', paddingRight: '8px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Balance
          </span>
        </div>
        {/* signal */}
        <div style={{ flex: '0 0 68px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Signal
          </span>
        </div>
        {/* conviction */}
        <div style={{ flex: '0 0 72px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Conv
          </span>
        </div>
        {/* last move */}
        <div style={{ flex: '0 0 70px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Last Move
          </span>
        </div>
        {/* alert */}
        <div style={{ flex: 1, paddingRight: '14px', textAlign: 'right' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Alert
          </span>
        </div>
      </div>

      {/* Rows */}
      {wallets.map((w, i) => (
        <WalletRow
          key={w.id}
          wallet={w}
          intel={walletIntelMap[w.id] ?? null}
          isSelected={w.id === selectedWalletId}
          onSelect={onSelectWallet}
          index={i}
        />
      ))}

      {/* Footer count */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.16)' }}>
          {wallets.length} wallets · sorted by balance
        </span>
      </div>
    </div>
  )
})
WalletTable.displayName = 'WalletTable'

export default WalletTable
