/**
 * ZERØ WATCH — BalanceChart v1
 * ==============================
 * Sparkline chart untuk wallet balance history.
 * - SVG sparkline — zero dependency
 * - Tooltip on hover: tanggal + USD value
 * - Trend indicator: % change dari first → last point
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo, useState, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { HistoryPoint } from '@/hooks/useWalletHistory'

interface BalanceChartProps {
  points:   HistoryPoint[]
  loading?: boolean
  height?:  number
  color?:   string
}

const fmtUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

const fmtDate = (ts: number) => {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const BalanceChart = memo(({ points, loading, height = 56, color = 'rgba(230,161,71,1)' }: BalanceChartProps) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const { path, dots, minV, maxV, pctChange, trend } = useMemo(() => {
    if (points.length < 2) return { path: '', dots: [], minV: 0, maxV: 0, pctChange: 0, trend: 'flat' as const }

    const W      = 300
    const H      = height
    const PAD    = 4
    const values = points.map(p => p.usd)
    const minV   = Math.min(...values)
    const maxV   = Math.max(...values)
    const range  = maxV - minV || 1

    const toX = (i: number)   => PAD + (i / (points.length - 1)) * (W - PAD * 2)
    const toY = (v: number)   => H - PAD - ((v - minV) / range) * (H - PAD * 2)

    const pathD = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.usd).toFixed(1)}`
    ).join(' ')

    const dots = points.map((p, i) => ({
      x: toX(i),
      y: toY(p.usd),
      usd: p.usd,
      ts:  p.ts,
    }))

    const first    = values[0]
    const last     = values[values.length - 1]
    const pctChange = first > 0 ? ((last - first) / first) * 100 : 0
    const trend     = pctChange > 0.5 ? 'up' : pctChange < -0.5 ? 'down' : 'flat'

    return { path: pathD, dots, minV, maxV, pctChange, trend }
  }, [points, height])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dots.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x    = ((e.clientX - rect.left) / rect.width) * 300
    let   closest = 0
    let   minDist  = Infinity
    dots.forEach((d, i) => {
      const dist = Math.abs(d.x - x)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setHoverIdx(closest)
  }, [dots])

  const trendColor = trend === 'up' ? 'rgba(52,211,153,1)' : trend === 'down' ? 'rgba(239,68,68,1)' : 'rgba(255,255,255,0.4)'
  const TrendIcon  = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  if (loading) {
    return (
      <div
        className="rounded-xl animate-pulse"
        style={{ height: `${height + 24}px`, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
      />
    )
  }

  if (points.length < 2) {
    return (
      <div
        className="rounded-xl flex items-center justify-center"
        style={{ height: `${height + 24}px`, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Collecting history…
        </span>
      </div>
    )
  }

  const hoveredPoint = hoverIdx !== null ? dots[hoverIdx] : null

  return (
    <div
      className="rounded-xl p-2 relative"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)' }}
    >
      {/* Header row: trend badge */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Balance History
        </span>
        <div className="flex items-center gap-1">
          <TrendIcon className="w-2.5 h-2.5" style={{ color: trendColor }} />
          <span className="text-[9px] font-mono font-bold" style={{ color: trendColor }}>
            {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* SVG sparkline */}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 300 ${height}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Area fill */}
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path
            d={`${path} L ${dots[dots.length - 1].x.toFixed(1)} ${height} L ${dots[0].x.toFixed(1)} ${height} Z`}
            fill="url(#chartFill)"
          />

          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover dot */}
          {hoveredPoint && (
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="3"
              fill={color}
              stroke="rgba(4,4,10,1)"
              strokeWidth="1.5"
            />
          )}
        </svg>

        {/* Hover tooltip */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none"
            style={{
              bottom:    `${height - hoveredPoint.y + 8}px`,
              left:      `${(hoveredPoint.x / 300) * 100}%`,
              transform: 'translateX(-50%)',
              zIndex:    10,
            }}
          >
            <div
              className="rounded-lg px-2 py-1.5 whitespace-nowrap"
              style={{
                background: 'rgba(6,6,14,0.97)',
                border:     `1px solid ${color.replace(',1)', ',0.3)')}`,
                boxShadow:  '0 4px 16px rgba(0,0,0,0.5)',
              }}
            >
              <div className="text-[9px] font-mono font-bold" style={{ color }}>
                {fmtUsd(hoveredPoint.usd)}
              </div>
              <div className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {fmtDate(hoveredPoint.ts)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Min/max labels */}
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[8px] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {fmtUsd(minV)}
        </span>
        <span className="text-[8px] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {fmtUsd(maxV)}
        </span>
      </div>
    </div>
  )
})

BalanceChart.displayName = 'BalanceChart'
export default BalanceChart
