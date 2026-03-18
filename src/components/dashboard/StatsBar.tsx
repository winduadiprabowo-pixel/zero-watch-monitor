/**
 * ZERØ WATCH — StatsBar v24
 * ===========================
 * v24: Arkham-style hero layout
 * - Portfolio Value: full hero box, full number format $16,170,482,910
 * - 3 stat cards below: Active 1H, Whale Alerts, Wallets Tracked
 * - No ETH Price card
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useAllWalletData } from '@/hooks/useWalletData'
import { useWhaleAlerts } from '@/hooks/useWhaleAlerts'

interface StatsBarProps { mobile?: boolean }

const fmtFull = (n: number) => {
  if (n === 0) return '$0'
  return '$' + Math.round(n).toLocaleString('en-US')
}

const fmtShort = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

const LiveDot = memo(({ syncing }: { syncing: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style={{
      width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block', flexShrink: 0,
      background: syncing ? 'rgba(251,191,36,1)' : 'rgba(52,211,153,1)',
      boxShadow:  syncing ? '0 0 5px rgba(251,191,36,0.8)' : '0 0 5px rgba(52,211,153,0.8)',
      animation:  'pulse-glow 1.8s ease-in-out infinite',
    }} />
    <span style={{
      fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em',
      color: syncing ? 'rgba(251,191,36,0.9)' : 'rgba(52,211,153,0.9)',
    }}>
      {syncing ? 'SYNC' : 'LIVE'}
    </span>
  </div>
))
LiveDot.displayName = 'LiveDot'

interface StatCardProps {
  label:       string
  value:       string | number
  sub?:        string
  valueColor?: string
  subColor?:   string
  loading?:    boolean
}

const StatCard = memo(({ label, value, sub, valueColor = 'rgba(255,255,255,0.95)', subColor = 'rgba(255,255,255,0.28)', loading }: StatCardProps) => (
  <div style={{
    background: 'rgba(13,14,20,1)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px', padding: '12px 16px', flex: 1, minWidth: 0,
  }}>
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)', marginBottom: '6px' }}>
      {label}
    </div>
    {loading ? (
      <div className="shimmer" style={{ height: '22px', borderRadius: '6px' }} />
    ) : (
      <>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '20px', fontWeight: 700, color: valueColor, lineHeight: 1 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: subColor, marginTop: '4px' }}>
            {sub}
          </div>
        )}
      </>
    )}
  </div>
))
StatCard.displayName = 'StatCard'

const StatsBar = memo(({ mobile }: StatsBarProps) => {
  const storeWallets                     = useWalletStore(selectWallets)
  const { data: apiDataArr, isFetching } = useAllWalletData()
  const whaleAlerts                      = useWhaleAlerts()

  const stats = useMemo(() => {
    const hasData     = storeWallets.length > 0 && apiDataArr && apiDataArr.length > 0
    const totalUsd    = hasData
      ? apiDataArr!.reduce((s, w) => { const v = w?.balance.usdValue ?? 0; return s + (isNaN(v) || !isFinite(v) ? 0 : v) }, 0)
      : 0
    const activeCount = hasData
      ? apiDataArr!.filter(w => (w?.transactions ?? []).some(tx => (Date.now() / 1000 - parseInt(tx.timeStamp)) < 3600)).length
      : 0
    const loadedCount = apiDataArr?.filter(Boolean).length ?? 0
    return { totalUsd, activeCount, walletCount: storeWallets.length, loading: storeWallets.length > 0 && !hasData, loadedCount }
  }, [apiDataArr, storeWallets])

  const alertCount = whaleAlerts.alertCount ?? 0

  if (mobile) {
    return (
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(8,8,14,1)', flexShrink: 0 }}>
        <div style={{ background: 'rgba(10,12,22,1)', border: '1px solid rgba(0,212,255,0.35)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(0,212,255,0.6)', marginBottom: '6px' }}>TOTAL PORTFOLIO VALUE</div>
            {stats.loading ? <div className="shimmer" style={{ height: '26px', width: '160px', borderRadius: '6px' }} /> : (
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '22px', fontWeight: 700, color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.01em', lineHeight: 1 }}>{fmtShort(stats.totalUsd)}</div>
            )}
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '5px' }}>{stats.walletCount} wallets</div>
          </div>
          <LiveDot syncing={isFetching} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <StatCard label="ACTIVE 1H" value={`${stats.activeCount}/${stats.walletCount}`} sub={stats.activeCount > 0 ? 'moving' : 'dormant'} valueColor="rgba(0,212,255,1)" loading={stats.loading} />
          <StatCard label="ALERTS" value={alertCount} sub="last 1h" valueColor={alertCount > 0 ? 'rgba(239,68,68,1)' : 'rgba(255,255,255,0.95)'} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(8,8,14,1)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>

      {/* Hero Portfolio Box */}
      <div style={{ background: 'rgba(10,12,22,1)', border: '1px solid rgba(0,212,255,0.40)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 80% at 0% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.18em', color: 'rgba(0,212,255,0.65)', marginBottom: '8px' }}>
            TOTAL PORTFOLIO VALUE — {stats.walletCount} WALLETS
          </div>
          {stats.loading ? (
            <div className="shimmer" style={{ height: '36px', width: '280px', borderRadius: '8px' }} />
          ) : (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '34px', fontWeight: 700, color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtFull(stats.totalUsd)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{stats.loadedCount}/{stats.walletCount} loaded</span>
            {isFetching && stats.loadedCount < stats.walletCount && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(251,191,36,0.7)' }}>
                <RefreshCw style={{ width: '10px', height: '10px', animation: 'spin 1s linear infinite' }} />
                updating
              </span>
            )}
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <LiveDot syncing={isFetching} />
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <StatCard
          label="ACTIVE 1H"
          value={`${stats.activeCount} / ${stats.walletCount}`}
          sub={stats.activeCount > 0 ? `${stats.walletCount - stats.activeCount} dormant` : 'all dormant'}
          valueColor="rgba(0,212,255,1)"
          loading={stats.loading}
        />
        <StatCard
          label="WHALE ALERTS"
          value={String(alertCount)}
          sub="last 1 hour"
          valueColor={alertCount > 0 ? 'rgba(239,68,68,1)' : 'rgba(255,255,255,0.95)'}
        />
        <StatCard
          label="WALLETS TRACKED"
          value={String(stats.walletCount)}
          sub={stats.loadedCount === stats.walletCount ? 'all loaded' : `${stats.loadedCount} loaded`}
          subColor={stats.loadedCount === stats.walletCount ? 'rgba(52,211,153,0.8)' : 'rgba(255,255,255,0.28)'}
        />
      </div>

    </div>
  )
})

StatsBar.displayName = 'StatsBar'
export default StatsBar
