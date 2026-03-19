/**
 * ZERØ WATCH — WalletIntelPanel v22
 * ===================================
 * v22: Default empty state → LiveDashboard (real live feed, no "Select a wallet")
 *      - INTEL tab kosong → auto-show LiveDashboard: ARKHAM + FLOWS + PATTERN combined
 *      - LiveDashboard: real data dari IntelAlertFeed + CrossFlowPanel + PatternPanel
 *      - Header: "INTELLIGENCE" when no wallet, wallet label when selected
 *      - Tab ARKHAM/FLOWS/PATTERN always work (no wallet needed)
 *      - Improved tab icons + live pulse dot on header
 * REDESIGN v17 — premium intelligence panel:
 * - Conviction gauge BESAR & mencolok
 * - Whale status card dengan gradient background sesuai status
 * - Big moves: bold alert card, bukan list kecil
 * - Stats grid lebih readable (font lebih besar)
 * - Tabs lebih clean, indicator jelas
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Tooltip, { TOOLTIPS } from '@/components/Tooltip'
import BalanceChart from '@/components/dashboard/BalanceChart'
import ConvictionBreakdown from '@/components/dashboard/ConvictionBreakdown'
import { useSmartHistory } from '@/hooks/useSmartHistory'
import {
  Brain, Copy, BarChart2, Trophy,
  Zap, Clock, Activity, ArrowUpRight, AlertTriangle,
  ArrowDownLeft, Flame, GitMerge, ScanLine,
  Globe, ExternalLink, LucideIcon,
} from 'lucide-react'
import type { Wallet, ActivityEvent, ActionType } from '@/data/mockData'
import type { TokenHolding } from '@/services/api'
import type { WalletIntelligence, LeaderboardEntry, WhaleStatus } from '@/services/whaleAnalytics'
import MarketTab from './MarketTab'
import { usePatternRecognition } from '@/hooks/usePatternRecognition'
import type { PatternEvent, PatternSeverity } from '@/hooks/usePatternRecognition'
import CrossFlowPanel from './CrossFlowPanel'
import IntelAlertFeed from './IntelAlertFeed'
import PatternPanel from './PatternPanel'

type Tab = 'INTEL' | 'SIGNALS' | 'TOKENS' | 'BOARD' | 'MARKET' | 'FLOWS' | 'ARKHAM' | 'PATTERN' | 'RADAR'

interface WalletIntelPanelProps {
  events:               ActivityEvent[]
  selectedWallet:       Wallet | null
  selectedWalletTokens: TokenHolding[]
  selectedWalletIntel:  WalletIntelligence | null
  leaderboard:          LeaderboardEntry[]
  clusters:             Record<string, string[]>
  defaultTab?:          Tab   // optional — force initial tab (e.g. 'RADAR' from mobile nav)
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(1)}K`
  if (n > 0)              return `$${n.toFixed(0)}`
  return '$0'
}

const fmtEth = (n: number) =>
  n < 0.0001 ? '~0 ETH' : `${n.toFixed(4)} ETH`

const tsAgo = (ts: number) => {
  const secs = Math.floor(Date.now() / 1000) - ts
  if (secs < 120)   return `${secs}s ago`
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

// Status colors
const STATUS_CFG: Record<WhaleStatus, {
  label: string; bg: string; border: string; text: string;
  dot: string; gradFrom: string; gradTo: string
}> = {
  ACCUMULATING: {
    label:    'ACCUMULATING',
    bg:       'rgba(52,211,153,0.10)',
    border:   'rgba(52,211,153,0.28)',
    text:     'rgba(52,211,153,1)',
    dot:      'rgba(52,211,153,1)',
    gradFrom: 'rgba(52,211,153,0.12)',
    gradTo:   'rgba(52,211,153,0.02)',
  },
  DISTRIBUTING: {
    label:    'DISTRIBUTING',
    bg:       'rgba(239,68,68,0.10)',
    border:   'rgba(239,68,68,0.28)',
    text:     'rgba(239,68,68,1)',
    dot:      'rgba(239,68,68,1)',
    gradFrom: 'rgba(239,68,68,0.12)',
    gradTo:   'rgba(239,68,68,0.02)',
  },
  HUNTING: {
    label:    'HUNTING',
    bg:       'rgba(251,191,36,0.10)',
    border:   'rgba(251,191,36,0.25)',
    text:     'rgba(251,191,36,1)',
    dot:      'rgba(251,191,36,1)',
    gradFrom: 'rgba(251,191,36,0.10)',
    gradTo:   'rgba(251,191,36,0.02)',
  },
  DORMANT: {
    label:    'DORMANT',
    bg:       'rgba(255,255,255,0.04)',
    border:   'rgba(255,255,255,0.08)',
    text:     'rgba(255,255,255,0.35)',
    dot:      'rgba(255,255,255,0.20)',
    gradFrom: 'rgba(255,255,255,0.04)',
    gradTo:   'transparent',
  },
}

const actionColors: Record<ActionType, { bg: string; text: string }> = {
  SWAP:     { bg: 'rgba(59,130,246,0.15)',  text: 'rgba(147,197,253,1)' },
  DEPOSIT:  { bg: 'rgba(0, 212, 255, 0.12)',   text: 'rgba(0, 212, 255, 0.9)' },
  TRANSFER: { bg: 'rgba(251,191,36,0.12)',  text: 'rgba(251,191,36,1)'  },
  BORROW:   { bg: 'rgba(167,139,250,0.12)', text: 'rgba(167,139,250,1)' },
  UNKNOWN:  { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.35)' },
}

// ── Conviction Gauge ───────────────────────────────────────────────────────────

const ConvictionGauge = memo(({ score, status }: { score: number; status: WhaleStatus }) => {
  const cfg = STATUS_CFG[status]
  const isDormant = status === 'DORMANT'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Tooltip content={TOOLTIPS.conviction} position="top">
          <span className="font-mono text-[9px] tracking-widest uppercase cursor-help" style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.15)' }}>
            Conviction
          </span>
        </Tooltip>
        <span
          className="font-mono font-bold tabular-nums"
          style={{ fontSize: '20px', color: isDormant ? 'rgba(255,255,255,0.25)' : cfg.text }}
        >
          {score}<span className="text-[11px] font-normal opacity-50">/100</span>
        </span>
      </div>

      {/* Track */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{ height: '8px', background: 'rgba(255,255,255,0.07)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width:      `${Math.max(2, score)}%`,
            background: isDormant
              ? 'rgba(255,255,255,0.15)'
              : `linear-gradient(90deg, ${cfg.text}, ${cfg.text.replace(',1)', ',0.5)')})`,
            boxShadow:  isDormant ? 'none' : `0 0 10px ${cfg.text.replace(',1)', ',0.5)')}`,
          }}
        />
      </div>

      {/* Tick marks */}
      <div className="flex justify-between">
        {[0, 25, 50, 75, 100].map(v => (
          <span
            key={v}
            className="font-mono"
            style={{ fontSize: '8px', color: 'rgba(255,255,255,0.15)' }}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  )
})
ConvictionGauge.displayName = 'ConvictionGauge'

// ── INTEL Tab ─────────────────────────────────────────────────────────────────

const IntelTab = memo(({ intel, wallet, clusters }: {
  intel: WalletIntelligence; wallet: Wallet; clusters: Record<string, string[]>
}) => {
  const { whaleScore, bigMoves, gasSpentEth, walletAgeDays, txFrequency, avgTxValueEth, largestTxEth, totalVolume30dEth } = intel
  const { data: historyPoints = [], isLoading: histLoading } = useSmartHistory(wallet.address, wallet.chain)
  const cfg = STATUS_CFG[whaleScore.status]
  const clustermates = clusters[wallet.id] ?? []

  const inflowPct = (whaleScore.inflow + whaleScore.outflow) > 0
    ? (whaleScore.inflow / (whaleScore.inflow + whaleScore.outflow)) * 100
    : 50

  const stats: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: 'Wallet Age',  value: walletAgeDays > 0 ? `${walletAgeDays}d` : '< 1d', icon: Clock },
    { label: 'TX / Day',    value: txFrequency.toFixed(1),                             icon: Activity },
    { label: 'Avg TX',      value: fmtEth(avgTxValueEth),                              icon: BarChart2 },
    { label: 'Largest TX',  value: fmtEth(largestTxEth),                               icon: ArrowUpRight },
    { label: 'Vol 30d',     value: fmtEth(totalVolume30dEth),                          icon: Flame },
    { label: 'Gas ~',       value: fmtEth(gasSpentEth),                                icon: Zap },
  ]

  return (
    <div className="p-4 space-y-4">

      {/* ── Status hero card ── */}
      <div
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${cfg.gradFrom} 0%, ${cfg.gradTo} 100%)`,
          border:     `1px solid ${cfg.border}`,
        }}
      >
        {/* Ambient top line */}
        <div
          className="absolute top-0 left-6 right-6 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.text.replace(',1)', ',0.45)')}, transparent)` }}
        />

        {/* Status badge */}
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: cfg.dot,
                boxShadow:  `0 0 8px ${cfg.text.replace(',1)', ',0.7)')}`,
                animation:  whaleScore.status !== 'DORMANT' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
              }}
            />
            <Tooltip
              content={
                whaleScore.status === 'ACCUMULATING' ? TOOLTIPS.accumulating :
                whaleScore.status === 'DISTRIBUTING' ? TOOLTIPS.distributing :
                whaleScore.status === 'HUNTING'      ? TOOLTIPS.hunting :
                TOOLTIPS.dormant
              }
              position="bottom"
            >
              <span
                className="font-mono font-bold cursor-help"
                style={{ fontSize: '10px', letterSpacing: '0.10em', color: cfg.text, borderBottom: `1px dashed ${cfg.text.replace(',1)', ',0.35)')}` }}
              >
                {cfg.label}
              </span>
            </Tooltip>
          </div>

          <Brain className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Conviction gauge */}
        <ConvictionGauge score={whaleScore.conviction} status={whaleScore.status} />

        {/* Inflow/outflow bar */}
        <div className="mt-3 space-y-1.5">
          <div
            className="rounded-full overflow-hidden"
            style={{ height: '5px', background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:      `${inflowPct}%`,
                background: 'linear-gradient(90deg, rgba(52,211,153,0.8) 0%, rgba(52,211,153,0.4) 100%)',
              }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[9px]" style={{ color: 'rgba(52,211,153,0.8)' }}>
              ▲ IN {fmtEth(whaleScore.inflow)}
            </span>
            <span className="font-mono text-[9px]" style={{ color: 'rgba(239,68,68,0.8)' }}>
              OUT {fmtEth(whaleScore.outflow)} ▼
            </span>
          </div>
        </div>
      </div>

      {/* ── ACTIONABLE RECOMMENDATION (v28) ── */}
      {whaleScore.status !== 'DORMANT' && (() => {
        const s = whaleScore.status
        const c = whaleScore.conviction

        type Rec = { emoji: string; action: string; detail: string; color: string; bg: string; border: string }
        const rec: Rec =
          s === 'ACCUMULATING' && c >= 70 ? {
            emoji:  '🟢',
            action: 'CONSIDER FOLLOWING',
            detail: `${wallet.label} accumulating dengan conviction ${c}% — historically bullish signal. Mirror position dengan size lebih kecil.`,
            color:  'rgba(52,211,153,1)',
            bg:     'rgba(52,211,153,0.07)',
            border: 'rgba(52,211,153,0.25)',
          } : s === 'ACCUMULATING' ? {
            emoji:  '👀',
            action: 'WATCH CLOSELY',
            detail: `Accumulation terdeteksi tapi conviction belum kuat (${c}%). Tunggu konfirmasi 2-3 tx lagi sebelum follow.`,
            color:  'rgba(52,211,153,0.8)',
            bg:     'rgba(52,211,153,0.05)',
            border: 'rgba(52,211,153,0.18)',
          } : s === 'DISTRIBUTING' && c >= 70 ? {
            emoji:  '🔴',
            action: 'HIGH RISK — REDUCE',
            detail: `${wallet.label} distributing agresif (${c}% conviction). Smart money keluar — pertimbangkan reduce exposure ETH.`,
            color:  'rgba(239,68,68,1)',
            bg:     'rgba(239,68,68,0.08)',
            border: 'rgba(239,68,68,0.28)',
          } : s === 'DISTRIBUTING' ? {
            emoji:  '⚠️',
            action: 'CAUTION — MONITOR',
            detail: `Distribusi terdeteksi (${c}% conviction). Belum confirmed — set stop loss dan pantau 1-2 jam ke depan.`,
            color:  'rgba(239,68,68,0.8)',
            bg:     'rgba(239,68,68,0.05)',
            border: 'rgba(239,68,68,0.20)',
          } : s === 'HUNTING' ? {
            emoji:  '🎯',
            action: 'VOLATILITY INCOMING',
            detail: `${wallet.label} dalam mode HUNTING — siap-siap volatilitas. Ukur posisi dengan ketat, pasang alerts.`,
            color:  'rgba(251,191,36,1)',
            bg:     'rgba(251,191,36,0.07)',
            border: 'rgba(251,191,36,0.25)',
          } : {
            emoji:  '💤',
            action: 'NO ACTION',
            detail: 'Wallet dormant — tidak ada signal actionable saat ini.',
            color:  'rgba(255,255,255,0.3)',
            bg:     'rgba(255,255,255,0.03)',
            border: 'rgba(255,255,255,0.07)',
          }

        return (
          <div
            className="rounded-2xl p-4"
            style={{ background: rec.bg, border: `1px solid ${rec.border}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: '13px' }}>{rec.emoji}</span>
              <span
                className="font-mono font-bold"
                style={{ fontSize: '9px', letterSpacing: '0.14em', color: rec.color }}
              >
                {rec.action}
              </span>
            </div>
            <p
              className="font-mono leading-relaxed"
              style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}
            >
              {rec.detail}
            </p>
          </div>
        )
      })()}

      {/* ── Big move alerts ── */}
      {bigMoves.length > 0 && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: 'rgba(251,191,36,0.06)',
            border:     '1px solid rgba(251,191,36,0.22)',
          }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 animate-pulse" style={{ color: 'rgba(251,191,36,1)' }} />
            <span
              className="font-mono font-bold uppercase"
              style={{ fontSize: '10px', letterSpacing: '0.10em', color: 'rgba(251,191,36,1)' }}
            >
              Big Move{bigMoves.length > 1 ? 's' : ''} — Last 1H
            </span>
          </div>
          {bigMoves.map(m => (
            <div key={m.hash} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {m.type === 'IN'
                  ? <ArrowDownLeft className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(52,211,153,1)' }} />
                  : <ArrowUpRight  className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(239,68,68,1)' }} />
                }
                <div>
                  <div
                    className="font-mono font-bold"
                    style={{ fontSize: '13px', color: m.type === 'IN' ? 'rgba(52,211,153,1)' : 'rgba(239,68,68,1)' }}
                  >
                    {m.type === 'IN' ? '↓ INCOMING' : '↑ OUTGOING'} {fmtUsd(m.valueUsd)}
                  </div>
                  <div className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {tsAgo(m.timestamp)} · {m.txType}
                  </div>
                </div>
              </div>
              <a
                href={`https://etherscan.io/tx/${m.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View TX"
              >
                <ExternalLink className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* ── Balance History Chart ── */}
      <BalanceChart
        points={historyPoints}
        loading={histLoading}
        color={cfg.text}
      />

      {/* ── Conviction Breakdown ── */}
      <ConvictionBreakdown intel={intel} />

      {/* ── On-chain stats grid ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.065)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="px-4 pt-3 pb-2">
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            On-Chain Stats
          </span>
        </div>
        <div className="grid grid-cols-2">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="p-3"
              style={{
                borderRight:  i % 2 === 0 ? '1px solid rgba(255,255,255,0.055)' : 'none',
                borderBottom: i < 4        ? '1px solid rgba(255,255,255,0.055)' : 'none',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.22)' }} />
                <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {s.label}
                </span>
              </div>
              <div className="font-mono font-semibold" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.88)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
            * gas estimated at 20 gwei avg
          </span>
        </div>
      </div>

      {/* ── Cluster detection ── */}
      {clustermates.length > 0 && (
        <div
          className="rounded-2xl p-4 space-y-2"
          style={{
            background: 'rgba(139,92,246,0.06)',
            border:     '1px solid rgba(139,92,246,0.22)',
          }}
        >
          <div className="flex items-center gap-2">
            <GitMerge className="w-3.5 h-3.5" style={{ color: 'rgba(167,139,250,1)' }} />
            <span
              className="font-mono font-bold uppercase"
              style={{ fontSize: '10px', letterSpacing: '0.10em', color: 'rgba(167,139,250,1)' }}
            >
              Cluster Detected
            </span>
          </div>
          <div className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Moves in sync with:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {clustermates.map(label => (
              <span
                key={label}
                className="font-mono text-[10px] px-2 py-1 rounded-lg"
                style={{
                  background: 'rgba(139,92,246,0.10)',
                  border:     '1px solid rgba(139,92,246,0.22)',
                  color:      'rgba(167,139,250,1)',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Wallet detail ── */}
      <div
        className="rounded-2xl p-4 space-y-2"
        style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="font-mono text-[9px] tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Wallet Detail
        </div>
        {[
          { label: 'Address', value: wallet.address },
          { label: 'Chain',   value: wallet.chain },
          { label: 'Balance', value: wallet.balance },
          { label: 'Tag',     value: wallet.tag, accent: true },
        ].map(r => (
          <div key={r.label} className="flex justify-between items-center">
            <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.label}</span>
            <span
              className="font-mono text-[11px] font-semibold"
              style={{ color: r.accent ? 'rgba(0, 212, 255, 0.9)' : 'rgba(255,255,255,0.85)' }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
})
IntelTab.displayName = 'IntelTab'

// ── SIGNALS Tab ───────────────────────────────────────────────────────────────

const SignalsTab = memo(({ intel, events }: { intel: WalletIntelligence | null; events: ActivityEvent[] }) => {
  const sigActionCls: Record<string, { bg: string; text: string }> = {
    BUY:     { bg: 'rgba(52,211,153,0.15)',  text: 'rgba(52,211,153,1)'  },
    SELL:    { bg: 'rgba(239,68,68,0.15)',   text: 'rgba(239,68,68,1)'   },
    DEPOSIT: { bg: 'rgba(59,130,246,0.15)',  text: 'rgba(147,197,253,1)' },
    BORROW:  { bg: 'rgba(167,139,250,0.15)', text: 'rgba(167,139,250,1)' },
  }

  if (!intel) {
    return (
      <div className="p-4">
        <div className="font-mono text-[9px] tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Live Activity
        </div>
        {events.length === 0 ? (
          <div className="text-center py-12 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Select a wallet to see signals
          </div>
        ) : (
          <div className="space-y-1">
            {events.slice(0, 8).map(e => {
              const ac = actionColors[e.action] ?? actionColors.UNKNOWN
              return (
                <div
                  key={e.id}
                  className="rounded-xl px-3 py-3"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono font-bold px-2 py-0.5 rounded-lg"
                        style={{ fontSize: '9px', background: ac.bg, color: ac.text, letterSpacing: '0.06em' }}
                      >
                        {e.action}
                      </span>
                      <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {e.walletLabel}
                      </span>
                    </div>
                    <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      {e.timestamp}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] truncate max-w-[160px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {e.detail}
                    </span>
                    <span className="font-mono font-semibold text-[12px]" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {e.usdSize}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Copy Signals
          </div>
          <div className="font-mono text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>
            SWAP · DEPOSIT · BORROW
          </div>
        </div>
        <Copy className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
      </div>

      {intel.copySignals.length === 0 ? (
        <div className="text-center py-12 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          No SWAP/DEPOSIT signals in recent TXs
        </div>
      ) : (
        <div className="space-y-1">
          {intel.copySignals.map((s, i) => {
            const sc = sigActionCls[s.action] ?? { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)' }
            return (
              <div
                key={s.txHash + i}
                className="rounded-xl px-3 py-3 animate-fade-up"
                style={{
                  background:     'rgba(255,255,255,0.025)',
                  border:         '1px solid rgba(255,255,255,0.055)',
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono font-bold px-2 py-0.5 rounded-lg"
                      style={{ fontSize: '9px', background: sc.bg, color: sc.text, letterSpacing: '0.06em' }}
                    >
                      {s.action}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {s.fnName}
                    </span>
                  </div>
                  <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {tsAgo(s.timestamp)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] truncate max-w-[160px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    → {s.toAddress.slice(0, 10)}…
                  </span>
                  <span className="font-mono font-semibold text-[12px]" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {fmtEth(s.valueEth)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="pt-4 font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
        Mirror these signals to find alpha before the crowd
      </div>
    </div>
  )
})
SignalsTab.displayName = 'SignalsTab'

// ── TOKENS Tab ────────────────────────────────────────────────────────────────

const TokensTab = memo(({ wallet, tokens }: { wallet: Wallet | null; tokens: TokenHolding[] }) => {
  if (!wallet) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full gap-3 text-center">
        <BarChart2 className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.08)' }} />
        <div className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Select a wallet to see token holdings
        </div>
      </div>
    )
  }

  const sorted  = [...tokens].filter(t => t.usdValue > 0 || parseFloat(t.balance) > 0).sort((a, b) => b.usdValue - a.usdValue)
  const totalUsd = sorted.reduce((sum, t) => sum + t.usdValue, 0)
  const maxUsd   = sorted[0]?.usdValue || 1

  if (sorted.length === 0) {
    return (
      <div className="p-4">
        <div className="font-mono text-[9px] tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Token Holdings
        </div>
        <div className="text-center py-10 space-y-2">
          <div className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No verified ERC-20 tokens</div>
          <div className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.12)' }}>Dust & spam filtered automatically</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Token Holdings
          </div>
          <div className="font-mono text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>
            {sorted.length} verified tokens
          </div>
        </div>
        {totalUsd > 0 && (
          <div className="text-right">
            <div className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Total</div>
            <div className="font-mono font-bold text-[14px]" style={{ color: 'rgba(0, 212, 255, 0.9)' }}>
              {fmtUsd(totalUsd)}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {sorted.map((t, i) => {
          const usdPct = Math.max(3, (t.usdValue / maxUsd) * 100)
          return (
            <div
              key={t.contractAddress + i}
              className="rounded-xl px-3 py-3 animate-fade-up"
              style={{
                background:     'rgba(255,255,255,0.025)',
                border:         '1px solid rgba(255,255,255,0.055)',
                animationDelay: `${i * 0.04}s`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 font-mono font-bold"
                    style={{
                      background: 'rgba(0, 212, 255, 0.08)',
                      border:     '1px solid rgba(0, 212, 255, 0.15)',
                      fontSize:   '8px',
                      color:      'rgba(0, 212, 255, 0.8)',
                    }}
                  >
                    {t.symbol.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono font-semibold text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {t.symbol}
                    </div>
                    <div className="font-mono text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      {t.name}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-mono font-semibold text-[12px]" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {t.balance}
                  </div>
                  {t.usdValue > 0 && (
                    <div className="font-mono text-[10px]" style={{ color: 'rgba(0, 212, 255, 0.65)' }}>
                      {fmtUsd(t.usdValue)}
                    </div>
                  )}
                </div>
              </div>
              {t.usdValue > 0 && (
                <div className="rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${usdPct}%`, background: 'rgba(0, 212, 255, 0.4)' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="pt-4 font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
        Spam filtered · Prices via CoinGecko
      </div>
    </div>
  )
})
TokensTab.displayName = 'TokensTab'

// ── BOARD Tab ─────────────────────────────────────────────────────────────────

const rankEmoji = (r: number) => {
  if (r === 1) return '🥇'
  if (r === 2) return '🥈'
  if (r === 3) return '🥉'
  return `#${r}`
}

const BoardTab = memo(({ leaderboard }: { leaderboard: import('@/services/whaleAnalytics').LeaderboardEntry[] }) => {
  if (leaderboard.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full gap-3 text-center">
        <Trophy className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.08)' }} />
        <div className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Add wallets to build the leaderboard
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Smart Money Board
          </div>
          <div className="font-mono text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>
            balance · activity · whale pattern
          </div>
        </div>
        <Trophy className="w-3.5 h-3.5" style={{ color: 'rgba(251,191,36,0.7)' }} />
      </div>
      <div className="space-y-1">
        {leaderboard.map((e, i) => {
          const cfg = STATUS_CFG[e.status]
          return (
            <div
              key={e.id}
              className="rounded-xl px-3 py-3 animate-fade-up"
              style={{
                background:     i === 0 ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.022)',
                border:         i === 0 ? '1px solid rgba(251,191,36,0.18)' : '1px solid rgba(255,255,255,0.055)',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: i < 3 ? '14px' : '11px', color: 'rgba(255,255,255,0.4)', minWidth: '20px' }}>
                    {rankEmoji(e.rank)}
                  </span>
                  <span className="font-mono font-semibold text-[13px] truncate max-w-[110px]" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {e.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    <span className="font-mono font-bold" style={{ fontSize: '8px', color: cfg.text, letterSpacing: '0.06em' }}>
                      {e.status.slice(0, 4)}
                    </span>
                  </div>
                  <Tooltip content={TOOLTIPS.smartScore} position="left">
                    <span className="font-mono font-bold tabular-nums cursor-help" style={{ fontSize: '14px', color: 'rgba(0, 212, 255, 0.9)', borderBottom: '1px dashed rgba(0, 212, 255, 0.3)' }}>
                      {e.smartScore}
                    </span>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2 pl-[26px]">
                <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {fmtUsd(e.balanceUsd)} · {e.txCount30d}tx/30d
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {fmtEth(e.volume30dEth)}
                </span>
              </div>
              <div className="pl-[26px] rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:           `${e.smartScore}%`,
                    background:      'rgba(0, 212, 255, 0.45)',
                    transitionDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="pt-4 font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
        Smart Score = balance(35) + activity(35) + whale(30)
      </div>
    </div>
  )
})
BoardTab.displayName = 'BoardTab'

// ── LiveDashboard — default no-wallet state ───────────────────────────────────
// Shows real live data: recent whale activity + active flows + latest patterns
// Replaces the old "Select a wallet" empty state

const LiveDashboard = memo(({ events }: { events: ActivityEvent[] }) => {
  const { patterns } = usePatternRecognition()

  const critPatterns = patterns.filter(p =>
    p.severity === 'CRITICAL' || p.severity === 'BLACK_SWAN'
  ).slice(0, 2)

  const warnPatterns = patterns.filter(p => p.severity === 'WARNING').slice(0, 3)
  const topPatterns  = [...critPatterns, ...warnPatterns].slice(0, 4)

  const tsAgoShort = (ms: number) => {
    const s = Math.floor((Date.now() - ms) / 1000)
    if (s < 60)   return `${s}s`
    if (s < 3600) return `${Math.floor(s / 60)}m`
    return `${Math.floor(s / 3600)}h`
  }

  const fmtV = (n: number) => {
    if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`
    if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`
    if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`
    return `$${n.toFixed(0)}`
  }

  const recentEvents = events.slice(0, 6)

  return (
    <div className="p-4 space-y-4">

      {/* ── Header hint ── */}
      <div
        className="rounded-xl px-3 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.12)' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: 'rgba(0, 212, 255, 1)', boxShadow: '0 0 5px rgba(0, 212, 255, 0.8)', animation: 'pulse-glow 2s ease-in-out infinite' }}
        />
        <span className="font-mono text-[9px]" style={{ color: 'rgba(0, 212, 255, 0.7)', letterSpacing: '0.08em' }}>
          Click any wallet → see conviction gauge + whale score
        </span>
      </div>

      {/* ── RADAR: top patterns ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <ScanLine className="w-3 h-3" style={{ color: 'rgba(239,68,68,0.7)' }} />
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Live Anomalies
            </span>
          </div>
          {patterns.length > 0 && (
            <span
              className="font-mono text-[8px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(239,68,68,0.9)' }}
            >
              {patterns.filter(p => p.severity === 'CRITICAL' || p.severity === 'BLACK_SWAN').length} CRIT
            </span>
          )}
        </div>

        {topPatterns.length === 0 ? (
          <div
            className="rounded-xl px-3 py-4 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              No anomalies detected
            </div>
            <div className="font-mono text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.1)' }}>
              Monitoring Wintermute · Jump · DWF · Justin Sun · FTX
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {topPatterns.map(p => {
              const cfg = SEVERITY_CFG[p.severity]
              return (
                <div
                  key={p.id}
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span style={{ fontSize: '12px' }}>{p.emoji}</span>
                      <span className="font-mono font-bold text-[10px] truncate" style={{ color: cfg.text }}>
                        {p.title}
                      </span>
                    </div>
                    <span className="font-mono text-[8px] flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {tsAgoShort(p.detectedAt)}
                    </span>
                  </div>
                  <div className="font-mono text-[9px] mt-1 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {p.description}
                  </div>
                  {p.totalValue > 0 && (
                    <div className="font-mono text-[10px] font-semibold mt-0.5" style={{ color: cfg.text }}>
                      {fmtV(p.totalValue)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      {/* ── Recent whale activity ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Activity className="w-3 h-3" style={{ color: 'rgba(0,194,255,0.7)' }} />
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Recent Activity
          </span>
        </div>

        {recentEvents.length === 0 ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl px-3 py-3"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border:     '1px solid rgba(255,255,255,0.055)',
                }}
              >
                {/* Skeleton shimmer */}
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="h-2 rounded"
                    style={{
                      width:      `${60 + i * 10}px`,
                      background: 'rgba(255,255,255,0.06)',
                      animation:  'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                  <div
                    className="h-2 rounded"
                    style={{ width: '28px', background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s ease-in-out infinite' }}
                  />
                </div>
                <div className="flex justify-between">
                  <div className="h-1.5 rounded" style={{ width: '80px', background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div className="h-1.5 rounded" style={{ width: '40px', background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentEvents.map((e, i) => {
              const ac = actionColors[e.action] ?? actionColors.UNKNOWN
              return (
                <div
                  key={e.id}
                  className="rounded-xl px-3 py-2.5 animate-fade-up"
                  style={{
                    background:     'rgba(255,255,255,0.025)',
                    border:         '1px solid rgba(255,255,255,0.055)',
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ fontSize: '8px', background: ac.bg, color: ac.text, letterSpacing: '0.06em' }}
                      >
                        {e.action}
                      </span>
                      <span className="font-mono text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {e.walletLabel}
                      </span>
                    </div>
                    <span className="font-mono text-[8px] flex-shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {e.timestamp}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] truncate max-w-[140px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      {e.detail}
                    </span>
                    <span className="font-mono font-semibold text-[11px] flex-shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {e.usdSize}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Bottom hint ── */}
      <div
        className="rounded-xl px-3 py-2 flex items-center gap-2"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)' }}
      >
        <GitMerge className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(167,139,250,0.6)' }} />
        <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
          FLOWS tab → $5M+ cross-wallet detection · ARKHAM → live Intel alerts
        </span>
      </div>

    </div>
  )
})
LiveDashboard.displayName = 'LiveDashboard'

// ── RADAR Tab ─────────────────────────────────────────────────────────────────

const SEVERITY_CFG: Record<PatternSeverity, { bg: string; border: string; text: string; badge: string }> = {
  BLACK_SWAN: { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.35)', text: 'rgba(251,191,36,1)',    badge: 'rgba(251,191,36,0.20)' },
  CRITICAL:   { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.30)',  text: 'rgba(239,68,68,1)',     badge: 'rgba(239,68,68,0.18)'  },
  WARNING:    { bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.20)', text: 'rgba(251,191,36,0.9)',  badge: 'rgba(251,191,36,0.14)' },
  INFO:       { bg: 'rgba(255,255,255,0.03)',border: 'rgba(255,255,255,0.08)',text: 'rgba(255,255,255,0.5)', badge: 'rgba(255,255,255,0.08)' },
}

type RadarFilter = 'ALL' | 'CRITICAL' | 'WARNING'

const RadarTab = memo(() => {
  const { patterns, loading, error, lastScan, refetch } = usePatternRecognition()
  const [filter, setFilter] = useState<RadarFilter>('ALL')

  const filtered = useMemo(() => {
    if (filter === 'ALL')      return patterns
    if (filter === 'CRITICAL') return patterns.filter(p => p.severity === 'CRITICAL' || p.severity === 'BLACK_SWAN')
    return patterns.filter(p => p.severity === 'WARNING')
  }, [patterns, filter])

  const critCount = patterns.filter(p => p.severity === 'CRITICAL' || p.severity === 'BLACK_SWAN').length
  const warnCount = patterns.filter(p => p.severity === 'WARNING').length

  const tsAgoShort = (ms: number) => {
    const s = Math.floor((Date.now() - ms) / 1000)
    if (s < 60)   return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    return `${Math.floor(s / 3600)}h ago`
  }

  const fmtM = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
    return `$${n.toFixed(0)}`
  }

  const filterBtns: Array<{ id: RadarFilter; activeCol: string; activeBorder: string }> = [
    { id: 'ALL',      activeCol: 'rgba(0, 212, 255, 0.9)',  activeBorder: 'rgba(0, 212, 255, 0.2)'  },
    { id: 'CRITICAL', activeCol: 'rgba(239,68,68,1)',     activeBorder: 'rgba(239,68,68,0.35)'  },
    { id: 'WARNING',  activeCol: 'rgba(251,191,36,0.9)',  activeBorder: 'rgba(251,191,36,0.25)' },
  ]

  return (
    <div className="p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-3.5 h-3.5" style={{ color: 'rgba(0, 212, 255, 0.7)' }} />
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              RADAR — Anomaly Detection
            </span>
          </div>
          {lastScan && (
            <div className="font-mono text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Last scan: {tsAgoShort(lastScan)}
            </div>
          )}
        </div>
        <button
          onClick={refetch}
          className="font-mono text-[8px] px-2 py-1 rounded-lg transition-all active:scale-95"
          style={{ background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.2)', color: 'rgba(0, 212, 255, 0.7)' }}
        >
          SCAN
        </button>
      </div>

      {/* Filter row */}
      <div className="flex gap-2">
        {filterBtns.map(({ id, activeCol, activeBorder }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className="flex-1 py-1.5 rounded-lg text-[9px] font-mono font-medium transition-all"
            style={{
              background: filter === id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
              border:     `1px solid ${filter === id ? activeBorder : 'rgba(255,255,255,0.07)'}`,
              color:      filter === id ? activeCol : 'rgba(255,255,255,0.3)',
            }}
          >
            {id}
            {id === 'CRITICAL' && critCount > 0 && ` (${critCount})`}
            {id === 'WARNING'  && warnCount > 0 && ` (${warnCount})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 space-y-2">
          <div className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Scanning whale activity...
          </div>
          <div className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
            Wintermute · Jump · DWF · Justin Sun · FTX Estate
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          className="rounded-xl p-3 font-mono text-[10px]"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.7)' }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-10 space-y-2">
          <ScanLine className="w-8 h-8 mx-auto" style={{ color: 'rgba(255,255,255,0.07)' }} />
          <div className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            No anomalies detected
          </div>
          <div className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.1)' }}>
            Monitoring 3+ MM, Justin Sun, FTX Estate<br />Auto-refresh every 60s
          </div>
        </div>
      )}

      {/* Anomaly cards */}
      {!loading && filtered.map((p, i) => {
        const cfg = SEVERITY_CFG[p.severity]
        return (
          <div
            key={p.id}
            className="rounded-2xl p-4 space-y-2.5 animate-fade-up"
            style={{
              background:     cfg.bg,
              border:         `1px solid ${cfg.border}`,
              animationDelay: `${i * 0.06}s`,
            }}
          >
            {/* Title */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ fontSize: '14px' }}>{p.emoji}</span>
                <span className="font-mono font-bold text-[10px] leading-tight" style={{ color: cfg.text }}>
                  {p.title}
                </span>
              </div>
              <span
                className="font-mono text-[8px] px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: cfg.badge, color: cfg.text, border: `1px solid ${cfg.border}` }}
              >
                {p.severity}
              </span>
            </div>

            {/* Value */}
            {p.totalUsd > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[13px]" style={{ color: 'rgba(255,255,255,0.88)' }}>
                  {fmtM(p.totalUsd)}
                </span>
                {p.multiplier && p.multiplier > 1 && (
                  <span
                    className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.9)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    {p.multiplier.toFixed(1)}× avg
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <div className="font-mono text-[9px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {p.description}
            </div>

            {/* Historical ref */}
            {p.historicalRef && (
              <div
                className="font-mono text-[9px] px-2 py-1.5 rounded-lg leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
              >
                📚 {p.historicalRef}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span
                className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(52,211,153,0.08)', color: 'rgba(52,211,153,0.8)', border: '1px solid rgba(52,211,153,0.15)' }}
              >
                {p.confidence}% confidence
              </span>
              <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {tsAgoShort(p.lastSeen)}
              </span>
            </div>
          </div>
        )
      })}

      {!loading && filtered.length > 0 && (
        <div className="font-mono text-center text-[9px] pt-2" style={{ color: 'rgba(255,255,255,0.12)' }}>
          {filtered.length} anomal{filtered.length === 1 ? 'y' : 'ies'} · auto-refresh 60s · ZERØ WATCH
        </div>
      )}
    </div>
  )
})
RadarTab.displayName = 'RadarTab'


// ── Main Panel ─────────────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: 'INTEL',   label: 'INTEL',   icon: Brain         },
  { id: 'SIGNALS', label: 'SIGNALS', icon: Copy          },
  { id: 'TOKENS',  label: 'TOKENS',  icon: BarChart2     },
  { id: 'BOARD',   label: 'BOARD',   icon: Trophy        },
  { id: 'MARKET',  label: 'MARKET',  icon: Globe         },
  { id: 'FLOWS',   label: 'FLOWS',   icon: AlertTriangle },
  { id: 'ARKHAM',  label: 'ARKHAM',  icon: Flame         },
  { id: 'PATTERN', label: 'PATTERN', icon: GitMerge      },
  { id: 'RADAR',   label: 'RADAR',   icon: ScanLine     },
]

const WalletIntelPanel = memo(({
  events, selectedWallet, selectedWalletTokens,
  selectedWalletIntel, leaderboard, clusters,
  defaultTab,
}: WalletIntelPanelProps) => {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab ?? 'INTEL')
  const prevWalletId = useRef<string | null>(null)

  useEffect(() => {
    if (selectedWallet && selectedWallet.id !== prevWalletId.current) {
      setActiveTab('INTEL')
      prevWalletId.current = selectedWallet.id
    }
  }, [selectedWallet?.id])

  const hasBigMoves = Boolean(selectedWalletIntel && selectedWalletIntel.bigMoves.length > 0)
  const hasSignals  = Boolean(selectedWalletIntel && selectedWalletIntel.copySignals.length > 0)
  const hasTokens   = selectedWalletTokens.filter(t => t.usdValue > 0).length > 0

  const handleTab = useCallback((id: Tab) => () => setActiveTab(id), [])

  const logo = (selectedWallet as (typeof selectedWallet & { logo?: string }) | null)?.logo
  const totalValue = selectedWalletIntel?.totalValueUsd ?? 0
  const fmtHero = (n: number) => {
    if (n === 0) return '$0'
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`
    return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }

  const ARKHAM_TABS: Array<{ id: Tab; label: string }> = [
    { id: 'INTEL',   label: 'PORTFOLIO'  },
    { id: 'TOKENS',  label: 'HOLDINGS'   },
    { id: 'BOARD',   label: 'HISTORY'    },
    { id: 'FLOWS',   label: 'TRANSFERS'  },
    { id: 'SIGNALS', label: 'SIGNALS'    },
    { id: 'RADAR',   label: 'RADAR'      },
  ]

  return (
    <aside
      className="flex flex-col animate-fade-up delay-3"
      style={{
        flex:       1,
        minWidth:   0,
        background: 'rgba(6,6,14,1)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        overflow:   'hidden',
      }}
    >
      {selectedWallet ? (
        /* ── Arkham-style entity header ── */
        <div className="flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px 0' }}>

          {/* Row 1: avatar + name + balance + buttons */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '14px' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {logo ? (
                <img
                  src={logo}
                  alt={selectedWallet.label}
                  style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
                  background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 800,
                  color: 'rgba(0,212,255,0.8)',
                }}>
                  {selectedWallet.label.slice(0, 2).toUpperCase()}
                </div>
              )}
              {/* Verified dot */}
              <div style={{
                position: 'absolute', bottom: '-3px', right: '-3px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'rgba(52,211,153,1)', border: '2px solid rgba(6,6,14,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', color: 'rgba(0,0,0,1)', fontWeight: 700,
              }}>✓</div>
            </div>

            {/* Name + balance */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.02em', margin: 0 }}>
                  {selectedWallet.label}
                </h2>
                {hasBigMoves && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.28)' }}>
                    <Zap style={{ width: '10px', height: '10px', color: 'rgba(251,191,36,1)' }} />
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(251,191,36,1)' }}>ALERT</span>
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginBottom: '6px' }}>
                {selectedWallet.address.slice(0, 8)}...{selectedWallet.address.slice(-6)}
                <span style={{ marginLeft: '8px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>{selectedWallet.chain}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '24px', fontWeight: 700, color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.02em' }}>
                  {fmtHero(totalValue)}
                </span>
                {selectedWalletIntel && (
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', fontWeight: 700, color: selectedWalletIntel.netFlow24h >= 0 ? 'rgba(52,211,153,1)' : 'rgba(239,68,68,1)' }}>
                    {selectedWalletIntel.netFlow24h >= 0 ? '+' : ''}{fmtHero(Math.abs(selectedWalletIntel.netFlow24h))}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', cursor: 'pointer' }}
              >
                <Activity style={{ width: '11px', height: '11px' }} />
                Alert
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', cursor: 'pointer' }}
              >
                <Globe style={{ width: '11px', height: '11px' }} />
                Trace
              </button>
              <button
                onClick={() => window.open(`https://etherscan.io/address/${selectedWallet.address}`, '_blank')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '20px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.22)', color: 'rgba(0,212,255,0.9)', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', cursor: 'pointer' }}
              >
                <ExternalLink style={{ width: '11px', height: '11px' }} />
                Etherscan
              </button>
            </div>
          </div>

          {/* Tags row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {['Smart Money', selectedWallet.tag, selectedWallet.chain].filter(Boolean).map(tag => (
              <span key={tag} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)' }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderTop: '1px solid rgba(255,255,255,0.055)', marginLeft: '-24px', marginRight: '-24px', paddingLeft: '24px' }}>
            {ARKHAM_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={handleTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: '10px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  letterSpacing: '0.08em',
                  color: activeTab === tab.id ? 'rgba(0,212,255,1)' : 'rgba(255,255,255,0.30)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid rgba(0,212,255,0.8)' : '2px solid transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
                {tab.id === 'SIGNALS' && hasSignals && <span style={{ position: 'absolute', top: '6px', right: '8px', width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(0,212,255,1)' }} />}
                {tab.id === 'INTEL'   && hasBigMoves && <span style={{ position: 'absolute', top: '6px', right: '8px', width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(251,191,36,1)' }} />}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── No wallet: compact header ── */
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(0,212,255,1)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.88)', margin: 0, letterSpacing: '-0.01em' }}>Intelligence</h2>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginLeft: '4px' }}>44 wallets tracked</span>

          {/* Tabs for no-wallet state */}
          <div style={{ display: 'flex', gap: '0', marginLeft: 'auto' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={handleTab(tab.id)}
                style={{
                  padding: '4px 10px',
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? 'rgba(0,212,255,1)' : 'rgba(255,255,255,0.25)',
                  background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid rgba(0,212,255,0.8)' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'INTEL' ? (
          selectedWallet && selectedWalletIntel ? (
            <IntelTab intel={selectedWalletIntel} wallet={selectedWallet} clusters={clusters} />
          ) : (
            <LiveDashboard events={events} />
          )
        ) : activeTab === 'SIGNALS' ? (
          <SignalsTab intel={selectedWalletIntel} events={events} />
        ) : activeTab === 'TOKENS' ? (
          <TokensTab wallet={selectedWallet} tokens={selectedWalletTokens} />
        ) : activeTab === 'BOARD' ? (
          <BoardTab leaderboard={leaderboard} />
        ) : activeTab === 'FLOWS' ? (
          <CrossFlowPanel />
        ) : activeTab === 'ARKHAM' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <IntelAlertFeed />
          </div>
        ) : activeTab === 'PATTERN' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <PatternPanel />
          </div>
        ) : activeTab === 'RADAR' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <RadarTab />
          </div>
        ) : (
          <MarketTab />
        )}
      </div>

      {/* ── Recent activity footer ── */}
      {activeTab === 'INTEL' && events.length > 0 && (
        <div
          className="flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.065)', background: 'rgba(255,255,255,0.015)' }}
        >
          <div className="px-4 py-3">
            <div className="font-mono text-[9px] tracking-widest uppercase mb-2.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {selectedWallet ? 'Recent Activity' : 'All Activity'}
            </div>
            <div className="space-y-2 max-h-[96px] overflow-y-auto">
              {events.slice(0, 4).map(e => {
                const ac = actionColors[e.action] ?? actionColors.UNKNOWN
                return (
                  <div key={e.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ fontSize: '8px', letterSpacing: '0.06em', background: ac.bg, color: ac.text }}
                      >
                        {e.action}
                      </span>
                      <span className="font-mono text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {e.detail}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-semibold flex-shrink-0" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {e.usdSize}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
})
WalletIntelPanel.displayName = 'WalletIntelPanel'

export default WalletIntelPanel
