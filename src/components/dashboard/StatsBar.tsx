/**
 * ZERØ WATCH — StatsBar v17
 * ==========================
 * REDESIGN — premium bento dengan visual hierarchy kuat:
 * - Portfolio card: angka BESAR, gradient text, glow
 * - ETH Price card: live feed indicator
 * - Active & TX card: clear dan readable
 * - Animasi masuk smooth
 *
 * rgba() only ✓  React.memo + displayName ✓  useMemo ✓
 */

import React, { useMemo, memo } from 'react'
import { Activity, Wallet, TrendingUp } from 'lucide-react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useAllWalletData, useEthPrice } from '@/hooks/useWalletData'

interface StatsBarProps { mobile?: boolean }

const fmtPortfolio = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

// ── LIVE Badge ────────────────────────────────────────────────────────────────
const LiveBadge = memo(({ syncing }: { syncing?: boolean }) => (
  <div
    className="flex items-center gap-1.5 px-2 py-1 rounded-full"
    style={{
      background: 'rgba(0,255,148,0.08)',
      border:     '1px solid rgba(0,255,148,0.20)',
    }}
  >
    <span
      className="w-1.5 h-1.5 rounded-full"
      style={{
        background: syncing ? 'rgba(251,191,36,1)' : 'rgba(0,255,148,1)',
        boxShadow:  syncing ? '0 0 4px rgba(251,191,36,0.8)' : '0 0 6px rgba(0,255,148,0.8)',
        animation:  'pulse-glow 2s ease-in-out infinite',
      }}
    />
    <span
      className="font-mono font-semibold"
      style={{
        fontSize:      '8px',
        letterSpacing: '0.12em',
        color:         syncing ? 'rgba(251,191,36,0.9)' : 'rgba(0,255,148,0.85)',
      }}
    >
      {syncing ? 'SYNC' : 'LIVE'}
    </span>
  </div>
))
LiveBadge.displayName = 'LiveBadge'

// ── Mini sparkline SVG ────────────────────────────────────────────────────────
const MiniSparkline = memo(({ data, color = 'rgba(0,255,148,0.6)', width = 72, height = 22 }: {
  data: number[]; color?: string; width?: number; height?: number
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
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  )
})
MiniSparkline.displayName = 'MiniSparkline'

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label:     string
  value:     string
  sub?:      string
  subColor?: string
  live?:     boolean
  icon?:     React.ReactNode
  accent?:   boolean
}

const StatCard = memo(({ label, value, sub, subColor, live, icon, accent }: StatCardProps) => (
  <div
    className="relative rounded-2xl p-4 overflow-hidden transition-all duration-200"
    style={{
      background: accent
        ? 'linear-gradient(135deg, rgba(0,255,148,0.07) 0%, rgba(0,255,148,0.02) 100%)'
        : 'rgba(255,255,255,0.028)',
      border: accent
        ? '1px solid rgba(0,255,148,0.20)'
        : '1px solid rgba(255,255,255,0.065)',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = accent ? 'rgba(0,255,148,0.30)' : 'rgba(255,255,255,0.10)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = accent ? 'rgba(0,255,148,0.20)' : 'rgba(255,255,255,0.065)'
    }}
  >
    {accent && (
      <div
        className="absolute top-0 left-6 right-6 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,148,0.5), transparent)' }}
      />
    )}

    <div className="flex items-center justify-between mb-3">
      <span
        className="font-mono uppercase"
        style={{
          fontSize:      '9px',
          letterSpacing: '0.14em',
          color:         accent ? 'rgba(0,255,148,0.55)' : 'rgba(255,255,255,0.30)',
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {live && <LiveBadge />}
        {icon && !live && icon}
      </div>
    </div>

    <div
      className="font-mono font-bold leading-none mb-1.5 tabular-nums"
      style={{
        fontSize:   accent ? '1.9rem' : '1.5rem',
        background: accent
          ? 'linear-gradient(135deg, rgba(0,255,148,1) 0%, rgba(0,200,120,0.7) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor:  'transparent',
        backgroundClip:       'text',
      }}
    >
      {value}
    </div>

    {sub && (
      <div
        className="font-mono"
        style={{ fontSize: '10px', color: subColor ?? 'rgba(255,255,255,0.28)' }}
      >
        {sub}
      </div>
    )}
  </div>
))
StatCard.displayName = 'StatCard'

// ── Main StatsBar ─────────────────────────────────────────────────────────────
const StatsBar = memo(({ mobile }: StatsBarProps) => {
  const storeWallets = useWalletStore(selectWallets)
  const { data: apiDataArr, isFetching, isError } = useAllWalletData()
  const { data: ethPrice } = useEthPrice()

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

    return {
      totalUsd,
      activeCount,
      recentTxCount,
      walletCount: storeWallets.length,
      loading:     storeWallets.length > 0 && !hasData,
      hasData,
    }
  }, [apiDataArr, storeWallets])

  const ethDisplay = ethPrice
    ? `$${ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '—'

  const sparkData = useMemo(() => {
    if (!apiDataArr || apiDataArr.length === 0) return []
    const allVals: number[] = []
    for (const w of apiDataArr) {
      for (const tx of (w?.transactions ?? []).slice(0, 10)) {
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

  // ── MOBILE layout ─────────────────────────────────────────────────────────

  if (mobile) {
    return (
      <div
        className="grid grid-cols-2 animate-fade-up delay-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Portfolio */}
        <div
          className="p-3.5 relative overflow-hidden"
          style={{
            background:  'rgba(0,255,148,0.04)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            borderBottom:'1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, rgba(0,255,148,0.5), transparent)' }}
          />
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Portfolio
            </span>
            <LiveBadge syncing={isFetching} />
          </div>
          <div
            className="font-mono font-bold leading-none mb-1 tabular-nums"
            style={{
              fontSize:   '1.35rem',
              background: 'linear-gradient(135deg, rgba(0,255,148,1) 0%, rgba(0,200,120,0.65) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
              backgroundClip: 'text',
            }}
          >
            {stats.loading ? '···' : stats.hasData ? fmtPortfolio(stats.totalUsd) : '—'}
          </div>
          <div className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {stats.walletCount} wallet{stats.walletCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ETH Price */}
        <div className="p-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="font-mono text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>ETH</div>
          <div
            className="font-mono font-bold leading-none mb-1 tabular-nums"
            style={{
              fontSize: '1.35rem',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {ethDisplay}
          </div>
          <div className="font-mono text-[9px]" style={{ color: isError ? 'rgba(239,68,68,0.7)' : 'rgba(52,211,153,0.8)' }}>
            {isError ? 'retry...' : 'live price'}
          </div>
        </div>

        {/* Active */}
        <div className="p-3.5" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="font-mono text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Active 1H</div>
          <div
            className="font-mono font-bold leading-none mb-1 tabular-nums"
            style={{
              fontSize: '1.35rem',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {stats.hasData ? `${stats.activeCount}/${stats.walletCount}` : '—'}
          </div>
          <div
            className="font-mono text-[9px]"
            style={{ color: stats.activeCount > 0 ? 'rgba(0,255,148,0.7)' : 'rgba(255,255,255,0.25)' }}
          >
            {stats.activeCount > 0 ? 'moving now' : 'dormant'}
          </div>
        </div>

        {/* TX */}
        <div className="p-3.5">
          <div className="font-mono text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>TX 24H</div>
          <div
            className="font-mono font-bold leading-none mb-1 tabular-nums"
            style={{
              fontSize: '1.35rem',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {stats.hasData ? stats.recentTxCount : '—'}
          </div>
          <div className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>transactions</div>
        </div>
      </div>
    )
  }

  // ── DESKTOP layout ─────────────────────────────────────────────────────────

  return (
    <div
      className="grid grid-cols-4 gap-2.5 px-4 py-3 flex-shrink-0 animate-fade-up delay-2"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Portfolio — accent, col-span-2 */}
      <div
        className="col-span-2 relative rounded-2xl p-4 overflow-hidden transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,148,0.08) 0%, rgba(0,255,148,0.02) 100%)',
          border:     '1px solid rgba(0,255,148,0.20)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,148,0.32)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,148,0.20)' }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-8 right-8 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,148,0.6), transparent)' }}
        />
        {/* Ambient bloom */}
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,255,148,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative flex items-start justify-between mb-3">
          <span
            className="font-mono uppercase"
            style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(0,255,148,0.55)' }}
          >
            Portfolio Value
          </span>
          <LiveBadge syncing={isFetching} />
        </div>

        <div
          className="relative font-mono font-bold leading-none mb-2 tabular-nums"
          style={{
            fontSize:   '2.2rem',
            background: 'linear-gradient(135deg, rgba(0,255,148,1) 0%, rgba(0,200,120,0.65) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
          }}
        >
          {stats.loading ? '···' : stats.hasData ? fmtPortfolio(stats.totalUsd) : '—'}
        </div>

        <div className="relative flex items-end justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {stats.walletCount} wallet{stats.walletCount !== 1 ? 's' : ''} tracked
            </span>
            {stats.activeCount > 0 && (
              <span className="font-mono text-[10px]" style={{ color: 'rgba(0,255,148,0.6)' }}>
                · {stats.activeCount} moving now
              </span>
            )}
          </div>
          {sparkData.length >= 2 && (
            <div style={{ opacity: 0.65 }}>
              <MiniSparkline data={sparkData} width={72} height={22} />
            </div>
          )}
        </div>
      </div>

      {/* ETH Price */}
      <StatCard
        label="ETH Price"
        value={ethDisplay}
        sub={isError ? 'error — retrying' : 'live feed'}
        subColor={isError ? 'rgba(239,68,68,0.7)' : 'rgba(52,211,153,0.75)'}
        icon={<TrendingUp className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />}
      />

      {/* Active 1H */}
      <StatCard
        label="Active 1H"
        value={stats.hasData ? `${stats.activeCount}/${stats.walletCount}` : stats.loading ? '···' : '—'}
        sub={stats.hasData && stats.activeCount > 0 ? 'wallets moving' : 'all dormant'}
        subColor={stats.activeCount > 0 ? 'rgba(0,255,148,0.7)' : undefined}
        live={stats.activeCount > 0}
        icon={<Wallet className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />}
      />

    </div>
  )
})
StatsBar.displayName = 'StatsBar'

export default StatsBar
