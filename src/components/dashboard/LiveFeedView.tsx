/**
 * ZERØ WATCH — LiveFeedView v2
 * ==============================
 * Arkham-style live TX feed — full redesign
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

const ACTION_CFG: Record<ActionType, { label: string; color: string; bg: string; border: string; Icon: typeof ArrowUpRight }> = {
  SWAP:     { label: 'SWAP',     color: 'rgba(96,165,250,1)',     bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.22)',  Icon: Repeat2       },
  DEPOSIT:  { label: 'DEPOSIT',  color: 'rgba(0,255,136,1)',      bg: 'rgba(0,255,136,0.08)',   border: 'rgba(0,255,136,0.20)',   Icon: ArrowDownLeft },
  TRANSFER: { label: 'TRANSFER', color: 'rgba(251,191,36,1)',     bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.20)',  Icon: ArrowUpRight  },
  BORROW:   { label: 'BORROW',   color: 'rgba(167,139,250,1)',    bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.20)', Icon: TrendingUp    },
  UNKNOWN:  { label: 'TX',       color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', Icon: HelpCircle    },
}

const fmtVal = (s: string) => {
  const n = parseFloat(s)
  if (isNaN(n)) return s
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)         return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (n > 0)              return `$${n.toFixed(2)}`
  return s
}

const COLS = '56px 80px 1fr 96px 100px 110px 28px'

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

  const logo = (wallet as (Wallet & { logo?: string }) | undefined)?.logo

  return (
    <div
      className="animate-fade-up"
      style={{
        display:             'grid',
        gridTemplateColumns: COLS,
        alignItems:          'center',
        padding:             '0 20px',
        height:              '46px',
        borderBottom:        '1px solid rgba(255,255,255,0.035)',
        gap:                 '12px',
        transition:          'background 0.1s',
        animationDelay:      `${index * 0.025}s`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.022)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      {/* TIME */}
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(0,255,136,0.7)', letterSpacing: '0.02em' }}>
        {event.timestamp}
      </span>

      {/* LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {logo ? (
          <img
            src={logo}
            alt={wallet?.label}
            style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
          }}>
            {(wallet?.label ?? '??').slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* WALLET NAME — clickable */}
      <button
        onClick={handleWalletClick}
        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, minWidth: 0 }}
      >
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.walletLabel}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.22)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {wallet?.address?.slice(0, 6)}…{wallet?.address?.slice(-4)}
        </div>
      </button>

      {/* ACTION badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', borderRadius: '5px',
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700,
        letterSpacing: '0.08em', color: cfg.color, width: 'fit-content',
      }}>
        <Icon style={{ width: '10px', height: '10px', flexShrink: 0 }} />
        {cfg.label}
      </span>

      {/* DETAIL */}
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {event.detail}
      </span>

      {/* VALUE */}
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.92)', textAlign: 'right', letterSpacing: '-0.02em' }}>
        {fmtVal(event.usdSize)}
      </span>

      {/* Etherscan */}
      <button
        onClick={handleEtherscan}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '5px', transition: 'color 0.1s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.14)' }}
        title="View on Etherscan"
      >
        <ExternalLink style={{ width: '12px', height: '12px' }} />
      </button>
    </div>
  )
})
FeedRow.displayName = 'FeedRow'

const LiveFeedView = memo(({ events, wallets, onSelectWallet }: LiveFeedViewProps) => {
  const walletMap = useMemo(() => {
    const m: Record<string, Wallet> = {}
    wallets.forEach(w => { m[w.id] = w })
    return m
  }, [wallets])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

      {/* ── Live status bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '7px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        background: 'rgba(4,4,10,0.6)',
        flexShrink: 0,
      }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(0,255,136,1)',
          animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block',
        }} />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(0,255,136,0.75)' }}>
          LIVE
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
          {events.length} TRANSFERS · CLICK WALLET TO INSPECT
        </span>
      </div>

      {/* ── Table header ── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: COLS,
        padding:             '7px 20px',
        gap:                 '12px',
        borderBottom:        '1px solid rgba(255,255,255,0.055)',
        background:          'rgba(4,4,10,0.8)',
        flexShrink:          0,
      }}>
        {['TIME', '', 'WALLET', 'TYPE', 'DETAIL', 'VALUE', ''].map((h, i) => (
          <span key={i} style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px',
            letterSpacing: '0.16em', color: 'rgba(255,255,255,0.2)',
            textAlign: i === 5 ? 'right' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* ── Rows ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {events.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}>
              <Repeat2 style={{ width: '16px', height: '16px', color: 'rgba(0,255,136,0.35)' }} />
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.12em' }}>
              SCANNING ON-CHAIN ACTIVITY...
            </span>
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
