/**
 * ZERØ WATCH — LiveFeedView v1
 * ==============================
 * Main content view — live transactions dari semua wallet
 * Arkham-style: TIME | FROM wallet | TX type | VALUE | USD
 * Klik wallet label → trigger onSelectWallet (buka full screen intel)
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useCallback, useMemo } from 'react'
import {
  ArrowUpRight, ArrowDownLeft, Repeat2, TrendingUp,
  HelpCircle, ExternalLink,
} from 'lucide-react'
import type { ActivityEvent, Wallet, ActionType } from '@/data/mockData'

interface LiveFeedViewProps {
  events:         ActivityEvent[]
  wallets:        Wallet[]
  onSelectWallet: (id: string) => void
}

// ── Config ────────────────────────────────────────────────────────────────────

const ACTION_CFG: Record<ActionType, { label: string; color: string; bg: string; border: string; Icon: typeof ArrowUpRight }> = {
  SWAP:     { label: 'SWAP',     color: 'rgba(96,165,250,1)',     bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.25)',  Icon: Repeat2       },
  DEPOSIT:  { label: 'DEPOSIT',  color: 'rgba(230,161,71,1)',      bg: 'rgba(230,161,71,0.08)',   border: 'rgba(230,161,71,0.25)',   Icon: ArrowDownLeft },
  TRANSFER: { label: 'TRANSFER', color: 'rgba(251,191,36,1)',     bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.22)',  Icon: ArrowUpRight  },
  BORROW:   { label: 'BORROW',   color: 'rgba(167,139,250,1)',    bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)', Icon: TrendingUp    },
  UNKNOWN:  { label: 'TX',       color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', Icon: HelpCircle    },
}

const fmtVal = (s: string) => {
  const n = parseFloat(s)
  if (isNaN(n)) return s
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (n > 0)          return `$${n.toFixed(2)}`
  return s
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  event:          ActivityEvent
  wallet:         Wallet | undefined
  onSelectWallet: (id: string) => void
  index:          number
}

const FeedRow = memo(({ event, wallet, onSelectWallet, index }: RowProps) => {
  const cfg  = ACTION_CFG[event.action] ?? ACTION_CFG.UNKNOWN
  const Icon = cfg.Icon

  const handleWalletClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (wallet) onSelectWallet(wallet.id)
  }, [wallet, onSelectWallet])

  const handleEtherscan = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://etherscan.io/tx/${event.id}`, '_blank')
  }, [event.id])

  return (
    <div
      className="animate-fade-up"
      style={{
        display:         'grid',
        gridTemplateColumns: '90px 1fr 100px 90px 110px 32px',
        alignItems:      'center',
        padding:         '10px 20px',
        borderBottom:    '1px solid rgba(255,255,255,0.04)',
        gap:             '12px',
        cursor:          'default',
        transition:      'background 0.12s',
        animationDelay:  `${index * 0.03}s`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      {/* TIME */}
      <span style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px',
        color: 'rgba(52,211,153,0.8)', letterSpacing: '0.02em',
      }}>
        {event.timestamp}
      </span>

      {/* WALLET — clickable */}
      <button
        onClick={handleWalletClick}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', padding: 0, minWidth: 0,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}
      >
        {/* Wallet dot */}
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
          background: wallet?.active ? 'rgba(52,211,153,1)' : 'rgba(255,255,255,0.2)',
          boxShadow:  wallet?.active ? '0 0 6px rgba(52,211,153,0.6)' : 'none',
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600,
            color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {event.walletLabel}
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px',
            color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {wallet?.address ?? ''}
          </div>
        </div>
      </button>

      {/* ACTION badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', borderRadius: '6px',
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700,
        letterSpacing: '0.08em', color: cfg.color,
        width: 'fit-content',
      }}>
        <Icon style={{ width: '10px', height: '10px' }} />
        {cfg.label}
      </span>

      {/* DETAIL */}
      <span style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px',
        color: 'rgba(255,255,255,0.28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {event.detail}
      </span>

      {/* VALUE */}
      <span style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 700,
        color: 'rgba(255,255,255,0.85)', textAlign: 'right',
        letterSpacing: '-0.02em',
      }}>
        {fmtVal(event.usdSize)}
      </span>

      {/* Etherscan link */}
      <button
        onClick={handleEtherscan}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center',
          padding: '4px', borderRadius: '6px', transition: 'color 0.12s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.15)' }}
        title="View on Etherscan"
      >
        <ExternalLink style={{ width: '12px', height: '12px' }} />
      </button>
    </div>
  )
})
FeedRow.displayName = 'FeedRow'

// ── Main ──────────────────────────────────────────────────────────────────────

const LiveFeedView = memo(({ events, wallets, onSelectWallet }: LiveFeedViewProps) => {
  const walletMap = useMemo(() => {
    const m: Record<string, Wallet> = {}
    wallets.forEach(w => { m[w.id] = w })
    return m
  }, [wallets])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

      {/* ── Table header ── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '90px 1fr 100px 90px 110px 32px',
        padding:             '8px 20px',
        gap:                 '12px',
        borderBottom:        '1px solid rgba(255,255,255,0.07)',
        background:          'rgba(4,4,10,0.8)',
        flexShrink:          0,
      }}>
        {['TIME', 'WALLET', 'TYPE', 'DETAIL', 'VALUE', ''].map((h, i) => (
          <span key={i} style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px',
            letterSpacing: '0.18em', color: 'rgba(255,255,255,0.22)',
            textAlign: i === 4 ? 'right' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* ── Live dot header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
        background: 'rgba(4,4,10,0.4)',
      }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'rgba(52,211,153,1)', boxShadow: '0 0 6px rgba(52,211,153,0.8)',
          animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block',
        }} />
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px',
          letterSpacing: '0.14em', color: 'rgba(52,211,153,0.7)',
        }}>
          TRANSFERS · {events.length} RECENT · CLICK WALLET TO INSPECT
        </span>
      </div>

      {/* ── Feed rows ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {events.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '200px', gap: '12px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}>
              <Repeat2 style={{ width: '18px', height: '18px', color: 'rgba(52,211,153,0.4)' }} />
            </div>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px',
              color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em',
            }}>
              SCANNING ON-CHAIN ACTIVITY...
            </span>
            {/* Skeleton rows */}
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                width: 'calc(100% - 40px)', height: '36px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                animation: 'shimmer 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        ) : (
          events.map((e, i) => (
            <FeedRow
              key={e.id}
              event={e}
              wallet={walletMap[e.walletId]}
              onSelectWallet={onSelectWallet}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  )
})
LiveFeedView.displayName = 'LiveFeedView'

export default LiveFeedView
