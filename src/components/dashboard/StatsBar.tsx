/**
 * ZERØ WATCH — StatsBar v25
 * ===========================
 * Arkham-style full redesign
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useAllWalletData } from '@/hooks/useWalletData'

interface StatsBarProps { mobile?: boolean; alertCount?: number }

const fmtFull  = (n: number) => n === 0 ? '$0' : '$' + Math.round(n).toLocaleString('en-US')
const fmtShort = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

const LABEL: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px',
  letterSpacing: '0.16em', color: 'rgba(255,255,255,0.25)', marginBottom: '6px',
}
const VAL: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono',monospace", fontSize: '18px',
  fontWeight: 700, lineHeight: 1, color: 'rgba(255,255,255,0.95)',
}
const SUB: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px',
  color: 'rgba(255,255,255,0.25)', marginTop: '4px',
}

interface StatCardProps {
  label: string; value: string | number; sub?: string
  valueColor?: string; subColor?: string; loading?: boolean
}

const StatCard = memo(({ label, value, sub, valueColor = 'rgba(255,255,255,0.95)', subColor = 'rgba(255,255,255,0.25)', loading }: StatCardProps) => (
  <div style={{
    background: 'rgba(10,11,18,1)', border: '1px solid rgba(255,255,255,0.065)',
    borderRadius: '10px', padding: '12px 16px', flex: 1, minWidth: 0,
  }}>
    <div style={LABEL}>{label}</div>
    {loading
      ? <div className="shimmer" style={{ height: '22px', borderRadius: '5px' }} />
      : <>
          <div style={{ ...VAL, color: valueColor }}>{value}</div>
          {sub && <div style={{ ...SUB, color: subColor }}>{sub}</div>}
        </>
    }
  </div>
))
StatCard.displayName = 'StatCard'

const LiveDot = memo(({ syncing }: { syncing: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style={{
      width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block',
      background: syncing ? 'rgba(251,191,36,1)' : 'rgba(0,255,136,1)',
      animation: 'pulse-glow 1.8s ease-in-out infinite',
    }} />
    <span style={{
      fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.12em',
      color: syncing ? 'rgba(251,191,36,0.9)' : 'rgba(0,255,136,0.85)',
    }}>
      {syncing ? 'SYNC' : 'LIVE'}
    </span>
  </div>
))
LiveDot.displayName = 'LiveDot'

const StatsBar = memo(({ mobile, alertCount = 0 }: StatsBarProps) => {
  const storeWallets                     = useWalletStore(selectWallets)
  const { data: apiDataArr, isFetching } = useAllWalletData()

  const stats = useMemo(() => {
    const hasData     = storeWallets.length > 0 && apiDataArr && apiDataArr.length > 0
    const totalUsd    = hasData ? apiDataArr!.reduce((s, w) => {
      const v = w?.balance.usdValue ?? 0; return s + (isNaN(v) || !isFinite(v) ? 0 : v)
    }, 0) : 0
    const activeCount = hasData ? apiDataArr!.filter(w =>
      (w?.transactions ?? []).some(tx => (Date.now() / 1000 - parseInt(tx.timeStamp)) < 3600)
    ).length : 0
    const loadedCount = apiDataArr?.filter(Boolean).length ?? 0
    return { totalUsd, activeCount, walletCount: storeWallets.length, loading: storeWallets.length > 0 && !hasData, loadedCount }
  }, [apiDataArr, storeWallets])

  if (mobile) {
    return (
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(6,6,12,1)', flexShrink: 0 }}>
        <div style={{
          background: 'rgba(10,11,18,1)', border: '1px solid rgba(0,255,136,0.25)',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={LABEL}>TOTAL PORTFOLIO VALUE</div>
            {stats.loading
              ? <div className="shimmer" style={{ height: '26px', width: '160px', borderRadius: '5px' }} />
              : <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '22px', fontWeight: 700, color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmtShort(stats.totalUsd)}
                </div>
            }
            <div style={{ ...SUB }}>{stats.walletCount} wallets</div>
          </div>
          <LiveDot syncing={isFetching} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <StatCard label="ACTIVE 1H" value={`${stats.activeCount}/${stats.walletCount}`} sub={stats.activeCount > 0 ? 'moving' : 'dormant'} valueColor="rgba(0,255,136,1)" loading={stats.loading} />
          <StatCard label="ALERTS" value={alertCount} sub="last 1h" valueColor={alertCount > 0 ? 'rgba(239,68,68,1)' : 'rgba(255,255,255,0.95)'} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px',
      background: 'rgba(6,6,12,1)', borderBottom: '1px solid rgba(255,255,255,0.055)', flexShrink: 0,
    }}>
      {/* Hero total box */}
      <div style={{
        background: 'rgba(10,11,18,1)',
        border: '1px solid rgba(0,255,136,0.22)',
        borderRadius: '12px', padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={LABEL}>TOTAL PORTFOLIO VALUE — {stats.walletCount} WALLETS</div>
          {stats.loading
            ? <div className="shimmer" style={{ height: '36px', width: '260px', borderRadius: '7px' }} />
            : <div style={{
                fontFamily: "'IBM Plex Mono',monospace", fontSize: '32px', fontWeight: 700,
                color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.025em', lineHeight: 1,
              }}>
                {fmtFull(stats.totalUsd)}
              </div>
          }
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>
              {stats.loadedCount}/{stats.walletCount} loaded
            </span>
            {isFetching && stats.loadedCount < stats.walletCount && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(251,191,36,0.7)' }}>
                <RefreshCw style={{ width: '10px', height: '10px', animation: 'spin 1s linear infinite' }} />
                updating
              </span>
            )}
          </div>
        </div>
        <LiveDot syncing={isFetching} />
      </div>

      {/* 3 stat cards */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <StatCard
          label="ACTIVE 1H"
          value={`${stats.activeCount} / ${stats.walletCount}`}
          sub={stats.activeCount > 0 ? `${stats.walletCount - stats.activeCount} dormant` : 'all dormant'}
          valueColor="rgba(0,255,136,1)"
          loading={stats.loading}
        />
        <StatCard
          label="WHALE ALERTS"
          value={String(alertCount)}
          sub="last 1 hour"
          valueColor={alertCount > 0 ? 'rgba(239,68,68,1)' : 'rgba(255,255,255,0.92)'}
        />
        <StatCard
          label="WALLETS TRACKED"
          value={String(stats.walletCount)}
          sub={stats.loadedCount === stats.walletCount ? 'all loaded' : `${stats.loadedCount} loaded`}
          subColor={stats.loadedCount === stats.walletCount ? 'rgba(0,255,136,0.7)' : 'rgba(255,255,255,0.22)'}
        />
      </div>
    </div>
  )
})
StatsBar.displayName = 'StatsBar'
export default StatsBar
