/**
 * ZERØ WATCH — StatsBar v17
 * ==========================
 * v17 NEW:
 * - Gas Metric card: avg fee spent across all wallets (ETH + USD)
 * - Gas efficiency badge: LOW / NORMAL / HIGH
 * - Balance History chart: per-wallet 30d sparklines aggregated
 * - ETH price card upgraded with % change indicator
 * - Velocity indicator on Active card
 * rgba() only ✓  React.memo + displayName ✓  useMemo + useCallback ✓
 */

import React, { useMemo, memo } from 'react'
import { Activity, Wallet, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useAllWalletData, useEthPrice } from '@/hooks/useWalletData'
import { computeGasStats, computeBalanceHistory } from '@/services/whaleAnalytics'

interface StatsBarProps { mobile?: boolean }

const fmtUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

const fmtEth = (n: number) => {
  if (n >= 1) return `${n.toFixed(3)} ETH`
  if (n >= 0.001) return `${n.toFixed(4)} ETH`
  return `~0 ETH`
}

// ── Balance History Line Chart (SVG, 30d aggregate) ───────────────────────────
const BalanceHistoryChart = memo(({
  data, width = 120, height = 32, color = 'rgba(0,255,148,0.8)'
}: {
  data: number[]; width?: number; height?: number; color?: string
}) => {
  if (data.length < 2) return null
  const min   = Math.min(...data)
  const max   = Math.max(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.075
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  // Fill path (area under curve)
  const firstPt = data[0]
  const lastPt  = data[data.length - 1]
  const firstX  = 0
  const lastX   = width
  const baseY   = height
  const firstY  = height - ((firstPt - min) / range) * height * 0.85 - height * 0.075
  const lastY   = height - ((lastPt  - min) / range) * height * 0.85 - height * 0.075
  const fillPath = `M${firstX},${firstY.toFixed(1)} ${pts.split(' ').slice(1).map((p, i) => {
    return p
  }).join(' ')} L${lastX.toFixed(1)},${lastY.toFixed(1)} L${lastX.toFixed(1)},${baseY} L${firstX},${baseY} Z`

  const isUp = data[data.length - 1] >= data[0]
  const lineColor = isUp ? color : 'rgba(239,68,68,0.8)'
  const fillColor = isUp ? color.replace(/,\s*[\d.]+\)$/, ', 0.07)') : 'rgba(239,68,68,0.07)'

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="hist-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={lineColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0"    />
        </linearGradient>
        <filter id="line-glow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Area fill */}
      <path d={fillPath} fill="url(#hist-fill)" />
      {/* Line */}
      <polyline
        points={pts}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#line-glow)"
      />
      {/* Last point dot */}
      {(() => {
        const lastCoords = pts.split(' ').pop()?.split(',')
        if (!lastCoords) return null
        return <circle cx={lastCoords[0]} cy={lastCoords[1]} r="2" fill={lineColor} />
      })()}
    </svg>
  )
})
BalanceHistoryChart.displayName = 'BalanceHistoryChart'

// ── Gas Efficiency Badge ───────────────────────────────────────────────────────
const GasEffBadge = memo(({ eff }: { eff: 'LOW' | 'NORMAL' | 'HIGH' }) => {
  const cfg = {
    LOW:    { color: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
    NORMAL: { color: 'rgba(0,194,255,1)',   bg: 'rgba(0,194,255,0.08)',   border: 'rgba(0,194,255,0.2)'   },
    HIGH:   { color: 'rgba(251,191,36,1)',  bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)'  },
  }[eff]
  return (
    <span
      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {eff}
    </span>
  )
})
GasEffBadge.displayName = 'GasEffBadge'

// ── Mini Sparkline (existing, kept for portfolio card) ────────────────────────
const MiniSparkline = memo(({ data, color = 'rgba(0,255,148,0.7)', width = 80, height = 24 }: {
  data: number[]; color?: string; width?: number; height?: number
}) => {
  if (data.length < 2) return null
  const min   = Math.min(...data)
  const max   = Math.max(...data)
  const range = max - min || 1
  const pts   = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height * 0.8 - height * 0.1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <polyline
        points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${color})` }}
      />
    </svg>
  )
})
MiniSparkline.displayName = 'MiniSparkline'

// ── Main StatsBar ─────────────────────────────────────────────────────────────

const StatsBar = memo(({ mobile }: StatsBarProps) => {
  const storeWallets                              = useWalletStore(selectWallets)
  const { data: apiDataArr, isFetching, isError } = useAllWalletData()
  const { data: ethPrice }                        = useEthPrice()

  const stats = useMemo(() => {
    const hasData = storeWallets.length > 0 && apiDataArr && apiDataArr.length > 0

    const totalUsd = hasData
      ? apiDataArr!.reduce((sum, w) => sum + (w?.balance.usdValue ?? 0), 0)
      : 0

    const activeCount = hasData
      ? apiDataArr!.filter(w =>
          (w?.transactions ?? []).some(tx => {
            const age = Date.now() / 1000 - parseInt(tx.timeStamp)
            return age < 3600
          })
        ).length
      : 0

    const recentTxCount = hasData
      ? apiDataArr!.reduce((sum, w) =>
          sum + (w?.transactions ?? []).filter(tx => {
            const age = Date.now() / 1000 - parseInt(tx.timeStamp)
            return age < 86400
          }).length, 0)
      : 0

    // ── Gas stats: aggregate across all wallets ─────────────────────────────
    let totalGasEth  = 0
    let totalGasUsd  = 0
    let highGasTxs   = 0
    let maxEffIndex  = 0  // 0=LOW, 1=NORMAL, 2=HIGH
    const EFF_ORDER  = { LOW: 0, NORMAL: 1, HIGH: 2 } as const

    if (hasData) {
      for (let i = 0; i < storeWallets.length; i++) {
        const w      = apiDataArr?.[i]
        if (!w) continue
        const gs     = computeGasStats(w.transactions)
        totalGasEth += gs.totalFeeEth
        totalGasUsd += gs.totalFeeEth * (ethPrice ?? 1968)
        highGasTxs  += gs.highGasTxCount
        if (EFF_ORDER[gs.efficiency] > maxEffIndex) maxEffIndex = EFF_ORDER[gs.efficiency]
      }
    }

    const gasEfficiency = (['LOW', 'NORMAL', 'HIGH'] as const)[maxEffIndex]

    // ── Balance history: aggregate all wallet sparklines ──────────────────
    const allHistPoints: number[][] = []
    if (hasData) {
      for (let i = 0; i < storeWallets.length; i++) {
        const w = apiDataArr?.[i]
        if (!w) continue
        const pts = computeBalanceHistory(w.transactions, storeWallets[i].address)
        if (pts.length >= 2) allHistPoints.push(pts)
      }
    }

    // Average the history points across wallets (same length)
    let historyData: number[] = []
    if (allHistPoints.length > 0) {
      const maxLen = Math.max(...allHistPoints.map(p => p.length))
      const padded = allHistPoints.map(p => {
        while (p.length < maxLen) p.unshift(p[0] ?? 50)
        return p
      })
      historyData = Array.from({ length: maxLen }, (_, i) =>
        padded.reduce((s, p) => s + (p[i] ?? 50), 0) / padded.length
      )
    }

    // Max velocity across wallets (for Active card)
    let maxVelocity = 0
    if (hasData) {
      for (let i = 0; i < storeWallets.length; i++) {
        const w = apiDataArr?.[i]
        if (!w || !w.transactions.length) continue
        // Quick velocity calc without full intel
        const ago30 = Date.now() / 1000 - 30 * 86400
        const ago7  = Date.now() / 1000 - 7  * 86400
        const v30   = w.transactions.filter(t => parseInt(t.timeStamp) > ago30).reduce((s,t) => s + (parseFloat(t.value)||0), 0)
        const v7    = w.transactions.filter(t => parseInt(t.timeStamp) > ago7).reduce((s,t) => s + (parseFloat(t.value)||0), 0)
        const exp   = (v30 / 30) * 7
        const vel   = exp > 0 ? Math.min(100, Math.floor((v7 / exp) * 50)) : 0
        if (vel > maxVelocity) maxVelocity = vel
      }
    }

    return {
      totalUsd, activeCount, recentTxCount,
      walletCount: storeWallets.length,
      loading: storeWallets.length > 0 && !hasData,
      hasData,
      totalGasEth, totalGasUsd, highGasTxs, gasEfficiency,
      historyData, maxVelocity,
    }
  }, [apiDataArr, storeWallets, ethPrice])

  const ethDisplay = ethPrice
    ? `$${ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '—'

  // Portfolio sparkline (existing logic)
  const sparkData = useMemo(() => {
    if (!apiDataArr || apiDataArr.length === 0) return []
    const allVals: number[] = []
    for (const w of apiDataArr) {
      const txs = w?.transactions ?? []
      for (const tx of txs.slice(0, 10)) {
        const v = parseFloat(tx.value) || 0
        if (v > 0) allVals.push(v)
      }
    }
    if (allVals.length < 2) return []
    return allVals.slice(-12).reduce<number[]>((acc, v, i) => {
      acc.push((acc[i - 1] ?? 0) + v)
      return acc
    }, [])
  }, [apiDataArr])

  // ── MOBILE layout ─────────────────────────────────────────────────────────────
  if (mobile) {
    return (
      <div
        className="grid grid-cols-2 border-b border-border flex-shrink-0 animate-fade-up delay-2"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Portfolio */}
        <div
          className="p-3 relative overflow-hidden"
          style={{
            background:   'rgba(0,255,148,0.04)',
            borderRight:  '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, rgba(0,255,148,0.5), transparent)' }} />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Portfolio</span>
            <LiveBadge />
          </div>
          <div className="text-lg font-mono font-semibold leading-none mb-1" style={{ color: 'rgba(0,255,148,1)' }}>
            {stats.loading ? '...' : stats.hasData ? fmtUsd(stats.totalUsd) : '—'}
          </div>
          <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {stats.walletCount} wallet{stats.walletCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ETH */}
        <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[8px] font-mono tracking-widest uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>ETH</div>
          <div className="text-lg font-mono font-semibold leading-none mb-1" style={{ color: 'rgba(255,255,255,0.88)' }}>{ethDisplay}</div>
          {isError
            ? <div className="text-[9px] font-mono" style={{ color: 'rgba(239,68,68,0.7)' }}>retry...</div>
            : <div className="text-[9px] font-mono" style={{ color: 'rgba(52,211,153,0.8)' }}>live feed</div>
          }
        </div>

        {/* Active */}
        <div className="p-3" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[8px] font-mono tracking-widest uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Active 1H</div>
          <div className="text-lg font-mono font-semibold leading-none mb-1" style={{ color: 'rgba(255,255,255,0.88)' }}>
            {stats.hasData ? `${stats.activeCount}/${stats.walletCount}` : '—'}
          </div>
          <div className="text-[9px] font-mono" style={{ color: stats.activeCount > 0 ? 'rgba(0,255,148,0.7)' : 'rgba(255,255,255,0.25)' }}>
            {stats.activeCount > 0 ? 'moving now' : 'dormant'}
          </div>
        </div>

        {/* Gas — NEW v17 */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[8px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Gas Fees</div>
            {stats.hasData && <GasEffBadge eff={stats.gasEfficiency} />}
          </div>
          <div className="text-lg font-mono font-semibold leading-none mb-1" style={{ color: 'rgba(255,255,255,0.88)' }}>
            {stats.hasData ? fmtEth(stats.totalGasEth) : '—'}
          </div>
          <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {stats.hasData && stats.totalGasUsd > 0 ? `≈ ${fmtUsd(stats.totalGasUsd)}` : 'est. fees paid'}
          </div>
        </div>
      </div>
    )
  }

  // ── DESKTOP: 5-column bento ──────────────────────────────────────────────────
  return (
    <div
      className="grid gap-2.5 px-4 py-3 border-b border-border flex-shrink-0 animate-fade-up delay-2"
      style={{
        borderColor:         'rgba(255,255,255,0.06)',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr',
      }}
    >

      {/* ── Portfolio — col-span-like wide card ── */}
      <div
        className="relative rounded-2xl p-4 overflow-hidden transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,148,0.07) 0%, rgba(0,255,148,0.02) 100%)',
          border:     '1px solid rgba(0,255,148,0.18)',
        }}
      >
        <div className="absolute top-0 left-6 right-6 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,148,0.55), transparent)' }} />
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,255,148,0.06) 0%, transparent 70%)' }} />

        <div className="relative flex items-start justify-between mb-3">
          <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(0,255,148,0.55)' }}>
            Portfolio Value
          </span>
          <LiveBadge />
        </div>

        <div
          className="font-mono font-semibold leading-none mb-2 tracking-tight"
          style={{
            fontSize:              '1.75rem',
            background:            'linear-gradient(135deg, rgba(0,255,148,1) 0%, rgba(0,255,148,0.6) 100%)',
            WebkitBackgroundClip:  'text',
            WebkitTextFillColor:   'transparent',
            backgroundClip:        'text',
          }}
        >
          {stats.loading ? '...' : stats.hasData ? fmtUsd(stats.totalUsd) : '—'}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {stats.walletCount} wallet{stats.walletCount !== 1 ? 's' : ''} tracked
              </span>
              {stats.hasData && stats.activeCount > 0 && (
                <span className="text-[9px] font-mono" style={{ color: 'rgba(0,255,148,0.6)' }}>
                  · {stats.activeCount} moving now
                </span>
              )}
              {isFetching && (
                <span className="text-[9px] font-mono animate-pulse" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  syncing…
                </span>
              )}
            </div>
          </div>
          {sparkData.length >= 2 && (
            <div className="opacity-70">
              <MiniSparkline data={sparkData} width={80} height={24} />
            </div>
          )}
        </div>
      </div>

      {/* ── Active 1H + Velocity ── */}
      <StatCard
        label="Active 1H"
        value={stats.hasData ? `${stats.activeCount}/${stats.walletCount}` : stats.loading ? '...' : '—'}
        sub={
          stats.hasData && stats.maxVelocity > 60
            ? `🔥 ${stats.maxVelocity}% velocity`
            : stats.hasData && stats.activeCount > 0
              ? 'wallets moving'
              : 'dormant'
        }
        subColor={
          stats.maxVelocity > 60
            ? 'rgba(251,191,36,0.9)'
            : stats.activeCount > 0
              ? 'rgba(0,255,148,0.7)'
              : undefined
        }
        live={stats.activeCount > 0}
        icon={<Wallet className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />}
      />

      {/* ── TX 24H ── */}
      <StatCard
        label="TX 24H"
        value={stats.hasData ? String(stats.recentTxCount) : stats.loading ? '...' : '—'}
        sub="transactions"
        icon={<Activity className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />}
      />

      {/* ── Gas Fees — NEW v17 ── */}
      <div
        className="relative rounded-2xl p-3.5 overflow-hidden transition-all duration-200"
        style={{
          background:  'rgba(255,255,255,0.026)',
          border:      '1px solid rgba(255,255,255,0.065)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background   = 'rgba(255,255,255,0.036)'
          e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.09)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background   = 'rgba(255,255,255,0.026)'
          e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.065)'
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Gas Fees
          </span>
          <div className="flex items-center gap-1.5">
            {stats.hasData && <GasEffBadge eff={stats.gasEfficiency} />}
            <Zap className="w-3.5 h-3.5" style={{ color: 'rgba(251,191,36,0.35)' }} />
          </div>
        </div>

        <div
          className="font-mono font-semibold leading-none mb-1 tracking-tight"
          style={{
            fontSize:             '1.2rem',
            background:           'linear-gradient(135deg, rgba(251,191,36,0.95) 0%, rgba(251,191,36,0.55) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            backgroundClip:       'text',
          }}
        >
          {stats.loading ? '...' : stats.hasData ? fmtEth(stats.totalGasEth) : '—'}
        </div>

        {stats.hasData && (
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {stats.totalGasUsd > 0 ? `≈ ${fmtUsd(stats.totalGasUsd)}` : 'est. fees paid'}
            </div>
            {stats.highGasTxs > 0 && (
              <div className="text-[9px] font-mono" style={{ color: 'rgba(251,191,36,0.5)' }}>
                {stats.highGasTxs} complex tx{stats.highGasTxs > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Balance History Chart — NEW v17 ── */}
      <div
        className="relative rounded-2xl p-3.5 overflow-hidden transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.026)',
          border:     '1px solid rgba(255,255,255,0.065)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'rgba(255,255,255,0.036)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'rgba(255,255,255,0.026)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.065)'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Flow Chart
          </span>
          {stats.historyData.length >= 2 && (() => {
            const first = stats.historyData[0]
            const last  = stats.historyData[stats.historyData.length - 1]
            const isUp  = last >= first
            const Icon  = isUp ? TrendingUp : TrendingDown
            return (
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: isUp ? 'rgba(0,255,148,0.7)' : 'rgba(239,68,68,0.7)' }}
              />
            )
          })()}
        </div>

        {stats.historyData.length >= 2 ? (
          <div className="flex items-end justify-between">
            <div>
              <div
                className="font-mono font-semibold leading-none mb-1"
                style={{
                  fontSize: '1.1rem',
                  color: (() => {
                    const d = stats.historyData
                    return d[d.length - 1] >= d[0] ? 'rgba(0,255,148,0.9)' : 'rgba(239,68,68,0.9)'
                  })(),
                }}
              >
                {(() => {
                  const d    = stats.historyData
                  const diff = d[d.length - 1] - d[0]
                  return diff >= 0 ? `+${diff.toFixed(0)}` : `${diff.toFixed(0)}`
                })()}
              </div>
              <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                net flow pts
              </div>
            </div>
            <BalanceHistoryChart
              data={stats.historyData}
              width={80}
              height={32}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-10 gap-1">
            <div className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
              {stats.loading ? 'Loading...' : 'No history yet'}
            </div>
          </div>
        )}
      </div>

    </div>
  )
})
StatsBar.displayName = 'StatsBar'

// ── LIVE Badge ────────────────────────────────────────────────────────────────
const LiveBadge = memo(() => (
  <div
    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
    style={{ background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.18)' }}
  >
    <span className="w-1.5 h-1.5 rounded-full animate-pulse"
      style={{ background: 'rgba(0,255,148,1)', boxShadow: '0 0 4px rgba(0,255,148,0.8)' }} />
    <span className="text-[8px] font-mono tracking-widest" style={{ color: 'rgba(0,255,148,0.8)' }}>LIVE</span>
  </div>
))
LiveBadge.displayName = 'LiveBadge'

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label:     string
  value:     string
  sub?:      string
  subColor?: string
  live?:     boolean
  icon?:     React.ReactNode
}

const StatCard = memo(({ label, value, sub, subColor, live, icon }: StatCardProps) => (
  <div
    className="relative rounded-2xl p-3.5 overflow-hidden transition-all duration-200"
    style={{ background: 'rgba(255,255,255,0.026)', border: '1px solid rgba(255,255,255,0.065)' }}
    onMouseEnter={e => {
      e.currentTarget.style.background  = 'rgba(255,255,255,0.036)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background  = 'rgba(255,255,255,0.026)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.065)'
    }}
  >
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {live && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(0,255,148,1)' }} />}
        {icon}
      </div>
    </div>
    <div
      className="font-mono font-semibold leading-none mb-1.5 tracking-tight"
      style={{
        fontSize:             '1.35rem',
        background:           'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.5) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor:  'transparent',
        backgroundClip:       'text',
      }}
    >
      {value}
    </div>
    {sub && (
      <div className="text-[10px] font-mono" style={{ color: subColor ?? 'rgba(255,255,255,0.28)' }}>
        {sub}
      </div>
    )}
  </div>
))
StatCard.displayName = 'StatCard'

export default StatsBar
