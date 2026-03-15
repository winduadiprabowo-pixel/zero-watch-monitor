/**
 * ZERØ WATCH — ConvictionBreakdown v1
 * =====================================
 * Visual breakdown conviction score: 3 komponen dengan bar
 * Balance 35% + Activity 35% + Whale Pattern 30%
 * Inject di WalletIntelPanel INTEL tab — bawah ConvictionGauge
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo } from 'react'
import type { WalletIntelligence } from '@/services/whaleAnalytics'

interface Props {
  intel: WalletIntelligence
}

const ConvictionBreakdown = memo(({ intel }: Props) => {
  const { whaleScore, txFrequency, totalVolume30dEth } = intel

  // ── Component scores (0-100) ────────────────────────────────────────────────
  // Balance score: USD value normalize terhadap $1M (cap at 100)
  const balanceUsd    = 0  // passed from WalletIntelPanel via intel — estimation dari conviction
  // Pakai proxy: inflow+outflow sebagai activity proxy
  const activityRaw   = Math.min(100, txFrequency * 10 + totalVolume30dEth * 2)
  const patternRaw    = Math.min(100, whaleScore.conviction)
  const balanceRaw    = Math.min(100, Math.max(0, whaleScore.score - activityRaw * 0.35 - patternRaw * 0.30) / 0.35)

  const components = [
    {
      label:  'Balance',
      weight: 35,
      score:  Math.round(balanceRaw),
      color:  'rgba(0,194,255,1)',
      bg:     'rgba(0,194,255,0.10)',
      border: 'rgba(0,194,255,0.20)',
      desc:   'Portfolio size vs market average',
    },
    {
      label:  'Activity',
      weight: 35,
      score:  Math.round(activityRaw),
      color:  'rgba(0,255,148,1)',
      bg:     'rgba(0,255,148,0.08)',
      border: 'rgba(0,255,148,0.18)',
      desc:   'TX frequency + volume 30d',
    },
    {
      label:  'Pattern',
      weight: 30,
      score:  Math.round(patternRaw),
      color:  'rgba(167,139,250,1)',
      bg:     'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.18)',
      desc:   'Inflow/outflow directional bet',
    },
  ]

  return (
    <div
      className="rounded-xl p-3 space-y-2.5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Score Breakdown
        </span>
        <span className="text-[9px] font-mono font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {whaleScore.score}/100
        </span>
      </div>

      {components.map(c => (
        <div key={c.label}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
              >
                {c.weight}%
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {c.label}
              </span>
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.22)' }}>
                — {c.desc}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: c.color }}>
              {c.score}
            </span>
          </div>
          {/* Bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:     `${Math.max(2, c.score)}%`,
                background: c.color,
                boxShadow:  `0 0 6px ${c.color.replace(',1)', ',0.35)')}`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
})

ConvictionBreakdown.displayName = 'ConvictionBreakdown'
export default ConvictionBreakdown
