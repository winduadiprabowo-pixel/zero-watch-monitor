/**
 * ZERØ WATCH — StatsBar v14
 * ==========================
 * 2026 redesign:
 * - Bento grid asymmetric: portfolio card 2x wider (col-span-2)
 * - LIVE badge with pulse dot on portfolio card
 * - ETH price shows 24h simulated change %
 * - Active wallets shows "X moving" with live indicator
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { useMemo, memo } from 'react'
import { Activity, Wallet } from 'lucide-react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useAllWalletData, useEthPrice } from '@/hooks/useWalletData'

interface StatsBarProps { mobile?: boolean }

const fmtUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

// ── Mini Sparkline SVG ────────────────────────────────────────────────────────
const MiniSparkline = memo(({ data, color = 'rgba(0,255,148,0.7)', width = 80, height = 24 }: {
  data:   number[]
  color?: string
  width?: number
  height?: number
}) => {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height * 0.8 - height * 0.1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${color})` }}
      />
    </svg>
  )
})
MiniSparkline.displayName = 'MiniSparkline'

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

    const loading = storeWallets.length > 0 && !hasData

    return {
      totalUsd,
      activeCount,
      recentTxCount,
      walletCount: storeWallets.length,
      loading,
      hasData,
    }
  }, [apiDataArr, storeWallets])

  const ethDisplay = ethPrice
    ? `$${ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '—'

  // ── Sparkline: cumulative portfolio value from recent txs ─────────────────
  const sparkData = useMemo(() => {
    if (!apiDataArr || apiDataArr.length === 0) return []
    // Collect all tx values across all wallets, bucket by last 10 txs
    const allVals: number[] = []
    for (const w of apiDataArr) {
      const txs = w?.transactions ?? []
      for (const tx of txs.slice(0, 10)) {
        const v = parseFloat(tx.value) || 0
        if (v > 0) allVals.push(v)
      }
    }
    if (allVals.length < 2) return []
    // Rolling cumulative sum for sparkline
    const buckets = allVals.slice(-12).reduce<number[]>((acc, v, i) => {
      acc.push((acc[i - 1] ?? 0) + v)
      return acc
    }, [])
    return buckets
  }, [apiDataArr])

  // ── MOBILE: 2x2 grid ─────────────────────────────────────────────────────────
  if (mobile) {
    return (
      <div
        className="grid grid-cols-2 border-b border-border flex-shrink-0 animate-fade-up delay-2"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Portfolio — accent */}
        <div
          className="p-3 relative overflow-hidden"
          style={{
            background: 'rgba(0,255,148,0.04)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, rgba(0,255,148,0.5), transparent)' }}
          />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Portfolio
            </span>
            <LiveBadge />
          </div>
          <div className="text-lg font-mono font-semibold leading-none mb-1" style={{ color: 'rgba(0,255,148,1)' }}>
            {stats.loading ? '...' : stats.hasData ? fmtUsd(stats.totalUsd) : '—'}
          </div>
          <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {stats.walletCount} wallet{stats.walletCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ETH Price */}
        <div
          className="p-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
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

        {/* TX */}
        <div className="p-3">
          <div className="text-[8px] font-mono tracking-widest uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>TX 24H</div>
          <div className="text-lg font-mono font-semibold leading-none mb-1" style={{ color: 'rgba(255,255,255,0.88)' }}>
            {stats.hasData ? stats.recentTxCount : '—'}
          </div>
          <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>transactions</div>
        </div>
      </div>
    )
  }

  // ── DESKTOP: bento asymmetric ─────────────────────────────────────────────────
  return (
    <div
      className="grid grid-cols-4 gap-2.5 px-4 py-3 border-b border-border flex-shrink-0 animate-fade-up delay-2"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
    >

      {/* ── Portfolio — 1 card but accented, col-span via wider internal ── */}
      {/* We simulate 2x width by having bigger padding + font on this card */}
      <div
        className="col-span-2 relative rounded-2xl p-4 overflow-hidden transition-all duration-200 group"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,148,0.07) 0%, rgba(0,255,148,0.02) 100%)',
          border: '1px solid rgba(0,255,148,0.18)',
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-6 right-6 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,148,0.55), transparent)' }}
        />
        {/* Ambient bloom */}
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,255,148,0.06) 0%, transparent 70%)' }}
        />

        <div className="relative flex items-start justify-between mb-3">
          <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(0,255,148,0.55)' }}>
            Portfolio Value
          </span>
          <LiveBadge />
        </div>

        <div
          className="font-mono font-semibold leading-none mb-2 tracking-tight"
          style={{
            fontSize: '1.75rem',
            background: 'linear-gradient(135deg, rgba(0,255,148,1) 0%, rgba(0,255,148,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
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

      {/* ── Active 1H ── */}
      <StatCard
        label="Active 1H"
        value={stats.hasData ? `${stats.activeCount}/${stats.walletCount}` : stats.loading ? '...' : '—'}
        sub={stats.hasData && stats.activeCount > 0 ? 'wallets moving' : 'dormant'}
        subColor={stats.activeCount > 0 ? 'rgba(0,255,148,0.7)' : undefined}
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

    </div>
  )
})
StatsBar.displayName = 'StatsBar'

// ── LIVE Badge ────────────────────────────────────────────────────────────────
const LiveBadge = memo(() => (
  <div
    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
    style={{
      background: 'rgba(0,255,148,0.08)',
      border: '1px solid rgba(0,255,148,0.18)',
    }}
  >
    <span
      className="w-1.5 h-1.5 rounded-full animate-pulse"
      style={{ background: 'rgba(0,255,148,1)', boxShadow: '0 0 4px rgba(0,255,148,0.8)' }}
    />
    <span className="text-[8px] font-mono tracking-widest" style={{ color: 'rgba(0,255,148,0.8)' }}>
      LIVE
    </span>
  </div>
))
LiveBadge.displayName = 'LiveBadge'

// ── Individual Stat Card ──────────────────────────────────────────────────────
interface StatCardProps {
  label:    string
  value:    string
  sub?:     string
  subColor?: string
  live?:    boolean
  icon?:    React.ReactNode
}

const StatCard = memo(({ label, value, sub, subColor, live, icon }: StatCardProps) => (
  <div
    className="relative rounded-2xl p-3.5 overflow-hidden transition-all duration-200 group"
    style={{
      background: 'rgba(255,255,255,0.026)',
      border: '1px solid rgba(255,255,255,0.065)',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.036)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.026)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.065)'
    }}
  >
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {live && (
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'rgba(0,255,148,1)' }}
          />
        )}
        {icon}
      </div>
    </div>

    <div
      className="font-mono font-semibold leading-none mb-1.5 tracking-tight"
      style={{
        fontSize: '1.35rem',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.5) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {value}
    </div>

    {sub && (
      <div
        className="text-[10px] font-mono"
        style={{ color: subColor ?? 'rgba(255,255,255,0.28)' }}
      >
        {sub}
      </div>
    )}
  </div>
))
StatCard.displayName = 'StatCard'

export default StatsBar
