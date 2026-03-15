/**
 * ZERØ WATCH — ActivityFeed v20
 * ================================
 * v20 REDESIGN — card rows style sesuai v17:
 * - Card rows per event dengan hover glow
 * - Action badge lebih prominent (border + glow)
 * - Empty state lebih polished dengan skeleton rows
 * - Token holdings section card style
 * rgba() only ✓  IBM Plex Mono ✓  React.memo + displayName ✓
 */

import React, { memo } from 'react'
import { ActivityEvent, Wallet, ActionType } from '@/data/mockData'
import type { TokenHolding } from '@/services/api'
import { Activity, Coins, ArrowUpRight, ArrowDownLeft, RefreshCw, Repeat2, TrendingUp, HelpCircle } from 'lucide-react'

interface ActivityFeedProps {
  events:                ActivityEvent[]
  selectedWallet:        Wallet | null
  selectedWalletTokens?: TokenHolding[]
  mobile?:               boolean
  embedded?:             boolean
}

const ACTION_CONFIG: Record<ActionType, {
  label: string; bg: string; text: string; border: string; glow: string; Icon: typeof Activity
}> = {
  SWAP:     { label: 'SWAP',     bg: 'rgba(59,130,246,0.12)',  text: 'rgba(96,165,250,1)',     border: 'rgba(59,130,246,0.30)',  glow: 'rgba(59,130,246,0.06)',  Icon: Repeat2 },
  DEPOSIT:  { label: 'DEPOSIT',  bg: 'rgba(0,255,148,0.10)',   text: 'rgba(0,255,148,1)',      border: 'rgba(0,255,148,0.30)',   glow: 'rgba(0,255,148,0.05)',   Icon: ArrowDownLeft },
  TRANSFER: { label: 'TRANSFER', bg: 'rgba(251,191,36,0.10)',  text: 'rgba(251,191,36,1)',     border: 'rgba(251,191,36,0.28)',  glow: 'rgba(251,191,36,0.05)',  Icon: ArrowUpRight },
  BORROW:   { label: 'BORROW',   bg: 'rgba(167,139,250,0.12)', text: 'rgba(167,139,250,1)',    border: 'rgba(167,139,250,0.30)', glow: 'rgba(167,139,250,0.05)', Icon: TrendingUp },
  UNKNOWN:  { label: 'TX',       bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.12)', glow: 'transparent',            Icon: HelpCircle },
}

const fmtTokenUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  if (n > 0)          return `$${n.toFixed(0)}`
  return '$0'
}

// ── Token Holdings Section ──────────────────────────────────────────────────

const TokensSection = memo(({ tokens }: { tokens: TokenHolding[] }) => {
  if (tokens.length === 0) return null
  const totalUsd = tokens.reduce((s, t) => s + t.usdValue, 0)
  return (
    <div className="border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3 h-3" style={{ color: 'rgba(0,255,148,0.5)' }} />
          <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Token Holdings</span>
        </div>
        <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: 'rgba(0,255,148,0.8)' }}>{fmtTokenUsd(totalUsd)}</span>
      </div>
      <div className="px-3 pb-3 space-y-1">
        {tokens.slice(0, 8).map((tok, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,255,148,0.03)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[8px] font-mono font-bold"
                style={{ background: 'rgba(0,255,148,0.06)', border: '1px solid rgba(0,255,148,0.15)', color: 'rgba(0,255,148,0.7)' }}
              >
                {tok.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-medium truncate block" style={{ color: 'rgba(255,255,255,0.80)' }}>{tok.symbol}</span>
                <span className="text-[8px] font-mono truncate block" style={{ color: 'rgba(255,255,255,0.22)' }}>{tok.balance}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono tabular-nums font-semibold flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.65)' }}>{fmtTokenUsd(tok.usdValue)}</span>
          </div>
        ))}
        {tokens.length > 8 && (
          <div className="text-center text-[9px] font-mono pt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>+{tokens.length - 8} more tokens</div>
        )}
      </div>
    </div>
  )
})
TokensSection.displayName = 'TokensSection'

// ── Event Card Row ──────────────────────────────────────────────────────────

const EventRow = memo(({ event, index }: { event: ActivityEvent; index: number }) => {
  const cfg  = ACTION_CONFIG[event.action] ?? ACTION_CONFIG.UNKNOWN
  const Icon = cfg.Icon
  return (
    <div
      className="mx-2 mb-1.5 rounded-xl px-3 py-2.5 transition-all animate-fade-up"
      style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.055)', animationDelay: `${(index + 2) * 0.05}s` }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background  = cfg.glow !== 'transparent' ? cfg.glow : 'rgba(255,255,255,0.03)'
        el.style.borderColor = cfg.border
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background  = 'rgba(255,255,255,0.022)'
        el.style.borderColor = 'rgba(255,255,255,0.055)'
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono font-bold flex-shrink-0"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text, fontSize: '8px', letterSpacing: '0.06em' }}
          >
            <Icon className="w-2.5 h-2.5 flex-shrink-0" />
            {cfg.label}
          </span>
          <span className="text-[10px] font-mono font-medium truncate" style={{ color: 'rgba(255,255,255,0.78)' }}>{event.walletLabel}</span>
        </div>
        <span className="text-[9px] font-mono flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.22)' }}>{event.timestamp}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono truncate max-w-[160px]" style={{ color: 'rgba(255,255,255,0.28)' }}>{event.detail}</span>
        <span className="text-[10px] font-mono tabular-nums font-semibold flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{event.usdSize}</span>
      </div>
    </div>
  )
})
EventRow.displayName = 'EventRow'

// ── Main ActivityFeed ───────────────────────────────────────────────────────

const ActivityFeed = memo(({ events, selectedWallet, selectedWalletTokens = [], mobile, embedded }: ActivityFeedProps) => {
  const hasEvents = events.length > 0
  const hasTokens = selectedWalletTokens.length > 0
  return (
    <aside
      className={`flex flex-col animate-fade-up delay-3 ${mobile ? 'w-full h-full' : embedded ? 'w-full h-full' : 'w-[340px] min-w-[340px] border-l h-screen'}`}
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,6,12,0.6)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" style={{ color: 'rgba(0,255,148,0.6)' }} />
          <h2 className="text-[9px] font-mono font-bold tracking-[0.18em] uppercase" style={{ color: 'rgba(255,255,255,0.6)' }}>LIVE SIGNAL FEED</h2>
          {hasEvents && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(0,255,148,1)', boxShadow: '0 0 5px rgba(0,255,148,0.8)', animation: 'pulse 2s ease-in-out infinite' }} />
          )}
        </div>
        {selectedWallet && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,148,0.07)', border: '1px solid rgba(0,255,148,0.18)', color: 'rgba(0,255,148,0.75)' }}>
            {selectedWallet.label}
          </span>
        )}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        {!hasEvents ? (
          <div className="px-4 py-8 text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,255,148,0.05)', border: '1px solid rgba(0,255,148,0.15)', animation: 'pulse 2.5s ease-in-out infinite' }}>
                <RefreshCw className="w-5 h-5" style={{ color: 'rgba(0,255,148,0.4)', animation: 'spin 3s linear infinite' }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>SCANNING ON-CHAIN ACTIVITY</div>
              <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>Signals will appear as wallets transact</div>
            </div>
            <div className="space-y-1.5 mt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="mx-0 h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div>{events.map((e, i) => <EventRow key={e.id} event={e} index={i} />)}</div>
        )}
      </div>

      {hasTokens && <TokensSection tokens={selectedWalletTokens} />}
    </aside>
  )
})
ActivityFeed.displayName = 'ActivityFeed'

export default ActivityFeed
