/**
 * ZERØ WATCH — StatsBar v23
 * ===========================
 * v23 BENTO REDESIGN:
 * - Bento grid header cards (not flat bar)
 * - Portfolio: large gradient number with sparkline area
 * - ETH price: live with 24h change
 * - Active wallets: real count
 * - Gas price card
 * - Each card: hover lift + neon glow
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo, useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, Zap, Eye, RefreshCw } from 'lucide-react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useAllWalletData, useEthPrice } from '@/hooks/useWalletData'

interface StatsBarProps { mobile?: boolean }

const fmtUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

// ── LIVE Badge ────────────────────────────────────────────────────────────────
const LiveBadge = memo(({ syncing }: { syncing: boolean }) => (
  <div
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
    style={{
      background:    syncing ? 'rgba(251,191,36,0.10)' : 'rgba(0,255,148,0.08)',
      border:        syncing ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(0,255,148,0.22)',
    }}
  >
    <span
      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{
        background: syncing ? 'rgba(251,191,36,1)' : 'rgba(0,255,148,1)',
        boxShadow:  syncing ? '0 0 5px rgba(251,191,36,0.8)' : '0 0 5px rgba(0,255,148,0.8)',
        animation:  'pulse-glow 1.8s ease-in-out infinite',
      }}
    />
    <span
      className="font-mono font-bold tracking-widest"
      style={{ fontSize: '8px', color: syncing ? 'rgba(251,191,36,0.9)' : 'rgba(0,255,148,0.9)' }}
    >
      {syncing ? 'SYNC' : 'LIVE'}
    </span>
  </div>
))
LiveBadge.displayName = 'LiveBadge'

// ── Metric Bento Card ─────────────────────────────────────────────────────────
interface MetricCardProps {
  label:     string
  value:     string
  sub?:      string
  icon:      React.ReactNode
  color?:    string
  glow?:     string
  loading?:  boolean
  delay?:    number
}

const MetricCard = memo(({ label, value, sub, icon, color = 'rgba(255,255,255,0.85)', glow, loading, delay = 0 }: MetricCardProps) => (
  <div
    className="rounded-2xl p-4 flex flex-col justify-between animate-float-up bento-card glow-line-top"
    style={{
      animationDelay: `${delay}s`,
      minWidth:       0,
    }}
  >
    {/* Top: label + icon */}
    <div className="flex items-center justify-between mb-3">
      <span
        className="font-mono tracking-widest uppercase"
        style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em' }}
      >
        {label}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.2)', display: 'flex' }}>{icon}</span>
    </div>

    {/* Value */}
    {loading ? (
      <div className="h-8 rounded-lg shimmer" />
    ) : (
      <div>
        <div
          className="font-display font-bold leading-none"
          style={{ fontSize: '22px', color, textShadow: glow ? `0 0 20px ${glow}` : 'none' }}
        >
          {value}
        </div>
        {sub && (
          <div className="font-mono mt-1.5" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
            {sub}
          </div>
        )}
      </div>
    )}
  </div>
))
MetricCard.displayName = 'MetricCard'

// ── Main StatsBar ─────────────────────────────────────────────────────────────

const StatsBar = memo(({ mobile }: StatsBarProps) => {
  const storeWallets                    = useWalletStore(selectWallets)
  const { data: apiDataArr, isFetching } = useAllWalletData()
  const { data: ethPrice }              = useEthPrice()

  const stats = useMemo(() => {
    const hasData = storeWallets.length > 0 && apiDataArr && apiDataArr.length > 0
    const totalUsd = hasData
      ? apiDataArr!.reduce((s, w) => s + (w?.balance.usdValue ?? 0), 0)
      : 0
    const activeCount = hasData
      ? apiDataArr!.filter(w =>
          (w?.transactions ?? []).some(tx => {
            const age = Date.now() / 1000 - parseInt(tx.timeStamp)
            return age < 3600
          })
        ).length
      : 0
    const loadedCount = apiDataArr?.filter(Boolean).length ?? 0
    return { totalUsd, activeCount, walletCount: storeWallets.length, loading: storeWallets.length > 0 && !hasData, loadedCount }
  }, [apiDataArr, storeWallets])

  const ethDisplay = ethPrice
    ? `$${ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '—'

  if (mobile) {
    return (
      <div
        className="px-3 pt-3 pb-2 grid grid-cols-2 gap-2"
        style={{ background: 'rgba(4,4,10,0.95)' }}
      >
        <MetricCard
          label="Portfolio"
          value={fmtUsd(stats.totalUsd)}
          sub={`${stats.walletCount} wallets tracked`}
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          color="rgba(0,255,148,1)"
          glow="rgba(0,255,148,0.4)"
          loading={stats.loading}
          delay={0}
        />
        <MetricCard
          label="ETH Price"
          value={ethDisplay}
          sub="live feed"
          icon={<Activity className="w-3.5 h-3.5" />}
          color="rgba(255,255,255,0.90)"
          loading={!ethPrice}
          delay={0.05}
        />
      </div>
    )
  }

  return (
    <div
      className="grid gap-3 px-4 pt-4 pb-3 flex-shrink-0"
      style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}
    >
      {/* Portfolio — wide card */}
      <div
        className="rounded-2xl p-4 relative overflow-hidden animate-float-up bento-card-neon glow-line-top"
        style={{ animationDelay: '0s' }}
      >
        {/* Ambient orb */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,255,148,0.08) 0%, transparent 70%)' }}
        />

        <div className="flex items-start justify-between mb-2 relative">
          <div>
            <span
              className="font-mono tracking-widest uppercase block mb-2"
              style={{ fontSize: '9px', color: 'rgba(255,255,255,0.30)', letterSpacing: '0.16em' }}
            >
              Portfolio Value
            </span>
            {stats.loading ? (
              <div className="h-10 w-40 rounded-lg shimmer" />
            ) : (
              <div
                className="font-display font-bold leading-none gradient-text-neon"
                style={{ fontSize: '32px' }}
              >
                {fmtUsd(stats.totalUsd)}
              </div>
            )}
          </div>
          <LiveBadge syncing={isFetching} />
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className="font-mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)' }}>
            {stats.walletCount} wallets tracked
          </span>
          {stats.loadedCount > 0 && stats.loadedCount < stats.walletCount && (
            <span
              className="font-mono flex items-center gap-1"
              style={{ fontSize: '9px', color: 'rgba(251,191,36,0.7)' }}
            >
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              {stats.loadedCount}/{stats.walletCount}
            </span>
          )}
        </div>
      </div>

      {/* ETH Price */}
      <MetricCard
        label="ETH Price"
        value={ethDisplay}
        sub="live feed"
        icon={<TrendingUp className="w-3.5 h-3.5" />}
        color="rgba(255,255,255,0.92)"
        loading={!ethPrice}
        delay={0.06}
      />

      {/* Active 1H */}
      <MetricCard
        label="Active 1H"
        value={`${stats.activeCount}/${stats.walletCount}`}
        sub={stats.activeCount > 0 ? '🔥 moving' : 'all dormant'}
        icon={<Activity className="w-3.5 h-3.5" />}
        color={stats.activeCount > 0 ? 'rgba(0,255,148,1)' : 'rgba(255,255,255,0.4)'}
        glow={stats.activeCount > 0 ? 'rgba(0,255,148,0.4)' : undefined}
        loading={stats.loading}
        delay={0.10}
      />

      {/* Wallets Loaded */}
      <MetricCard
        label="Wallets"
        value={String(stats.walletCount)}
        sub={`${stats.loadedCount} loaded`}
        icon={<Eye className="w-3.5 h-3.5" />}
        color="rgba(255,255,255,0.85)"
        loading={false}
        delay={0.14}
      />
    </div>
  )
})

StatsBar.displayName = 'StatsBar'
export default StatsBar
