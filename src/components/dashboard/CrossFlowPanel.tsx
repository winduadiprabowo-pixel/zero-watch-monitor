/**
 * ZERØ WATCH — CrossFlowPanel v1
 * =================================
 * Live cross-wallet flow detector:
 * - Wintermute → Binance = ⚠️ SELL PRESSURE
 * - Justin Sun → CEX = 🚨 DUMP WARNING
 * - CEX → Market Maker = 🐂 ACCUMULATION
 * - Market Maker → Market Maker = 👀 COORDINATION
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo } from 'react'
import { ArrowRight, RefreshCw, Zap, AlertTriangle, TrendingUp, Eye } from 'lucide-react'
import { useCrossWalletFlow } from '@/hooks/useCrossWalletFlow'
import type { CrossFlow } from '@/hooks/useCrossWalletFlow'

const fmtAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

// ── Flow Card ─────────────────────────────────────────────────────────────────

const FlowCard = memo(({ flow }: { flow: CrossFlow }) => {
  const { signal } = flow
  const SeverityIcon = signal.severity === 'HIGH'
    ? AlertTriangle
    : signal.severity === 'MEDIUM'
      ? TrendingUp
      : Eye

  return (
    <div
      className="rounded-xl px-3 py-2.5 mb-2 transition-all"
      style={{
        background: signal.bg,
        border:     `1px solid ${signal.border}`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.15)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1)' }}
    >
      {/* Header: severity + time */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{signal.emoji}</span>
          <span
            className="font-mono font-bold"
            style={{ fontSize: '8px', color: signal.color, letterSpacing: '0.08em' }}
          >
            {signal.type.replace(/_/g, ' ')}
          </span>
          {signal.severity === 'HIGH' && (
            <span
              className="font-mono font-bold px-1.5 py-0.5 rounded animate-pulse"
              style={{ fontSize: '7px', background: 'rgba(239,68,68,0.15)', color: 'rgba(239,68,68,1)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              HIGH
            </span>
          )}
        </div>
        <span className="font-mono" style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)' }}>
          {fmtAgo(flow.timestamp)}
        </span>
      </div>

      {/* Flow: from → to */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="font-mono font-bold px-2 py-1 rounded-lg flex-shrink-0"
          style={{ fontSize: '9px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          {flow.fromEntity}
        </span>
        <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: signal.color }} />
        <span
          className="font-mono font-bold px-2 py-1 rounded-lg flex-shrink-0"
          style={{ fontSize: '9px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          {flow.toEntity}
        </span>
      </div>

      {/* Value + hash */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono font-bold tabular-nums"
          style={{ fontSize: '13px', color: signal.color }}
        >
          {flow.valueEth >= 1000
            ? `${(flow.valueEth/1000).toFixed(1)}K ETH`
            : `${flow.valueEth.toFixed(1)} ETH`
          }
          <span className="font-normal ml-1.5" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
            (${(flow.valueUsd/1e6).toFixed(1)}M)
          </span>
        </span>
        <a
          href={`https://etherscan.io/tx/${flow.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono transition-colors"
          style={{ fontSize: '8px', color: 'rgba(255,255,255,0.20)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(230,161,71,0.7)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.20)' }}
        >
          {flow.hash.slice(0, 8)}…
        </a>
      </div>
    </div>
  )
})
FlowCard.displayName = 'FlowCard'

// ── Main CrossFlowPanel ───────────────────────────────────────────────────────

const CrossFlowPanel = memo(() => {
  const { flows, highSeverity, loading, error, refetch } = useCrossWalletFlow()

  return (
    <div className="p-4 space-y-3">

      {/* Header stats */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}
        >
          <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: 'rgba(239,68,68,0.7)' }}>
            HIGH ALERTS
          </div>
          <div className="font-display font-bold text-[22px]" style={{ color: 'rgba(239,68,68,1)' }}>
            {highSeverity.length}
          </div>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(230,161,71,0.04)', border: '1px solid rgba(230,161,71,0.15)' }}
        >
          <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: 'rgba(230,161,71,0.6)' }}>
            TOTAL FLOWS
          </div>
          <div className="font-display font-bold text-[22px]" style={{ color: 'rgba(230,161,71,0.9)' }}>
            {flows.length}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        className="rounded-xl p-3 space-y-1.5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="font-mono text-[8px] tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
          SIGNAL GUIDE
        </div>
        {[
          { emoji: '🚨', label: 'Justin Sun → CEX',     signal: 'DUMP WARNING',       color: 'rgba(239,68,68,0.9)' },
          { emoji: '⚠️', label: 'Market Maker → CEX', signal: 'SELL PRESSURE',       color: 'rgba(239,68,68,0.9)' },
          { emoji: '👀', label: 'MM → MM',              signal: 'COORDINATION',        color: 'rgba(251,191,36,0.9)' },
          { emoji: '🐂', label: 'CEX → Market Maker',  signal: 'ACCUMULATION',        color: 'rgba(52,211,153,0.9)' },
          { emoji: '📈', label: 'Tether/Circle',        signal: 'STABLECOIN MINT',     color: 'rgba(52,211,153,0.9)' },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">{r.emoji}</span>
              <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{r.label}</span>
            </div>
            <span className="font-mono font-bold text-[8px]" style={{ color: r.color }}>{r.signal}</span>
          </div>
        ))}
      </div>

      {/* Flow list */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3" style={{ color: 'rgba(251,191,36,0.8)' }} />
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Live Cross-Wallet Flows
          </span>
          {flows.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(230,161,71,0.8)' }} />
          )}
        </div>
        <button
          onClick={refetch}
          className="transition-colors"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(230,161,71,0.7)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)' }}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* States */}
      {loading && flows.length === 0 ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 rounded-xl shimmer" style={{ animationDelay: `${i*0.1}s` }} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6 rounded-xl font-mono text-[10px]"
          style={{ color: 'rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
          {error}
        </div>
      ) : flows.length === 0 ? (
        <div className="text-center py-8">
          <div className="font-mono text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No significant cross-wallet flows detected
          </div>
          <div className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Monitoring $5M+ transfers between labeled whales
          </div>
        </div>
      ) : (
        <div>
          {flows.map(f => <FlowCard key={f.id} flow={f} />)}
        </div>
      )}

      <div className="font-mono text-[8px] text-center" style={{ color: 'rgba(255,255,255,0.12)' }}>
        Detects $5M+ flows between labeled whale wallets · 60s refresh
      </div>
    </div>
  )
})

CrossFlowPanel.displayName = 'CrossFlowPanel'
export default CrossFlowPanel
