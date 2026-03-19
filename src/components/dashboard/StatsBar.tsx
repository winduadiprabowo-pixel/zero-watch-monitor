/**
 * ZERØ WATCH — StatsBar v25
 * ===========================
 * Lovable-style: satu baris compact
 * Kiri: $285B BESAR | Kanan: stat chips (Most Active, Largest TX, Chain Split)
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useAllWalletData } from '@/hooks/useWalletData'

interface StatsBarProps { mobile?: boolean; alertCount?: number }

const fmtBig = (n: number) => {
  if (n === 0) return '$0'
  return '$' + Math.round(n).toLocaleString('en-US')
}

const CHAIN_COLOR: Record<string, string> = {
  ETH: 'rgba(147,197,253,1)', BTC: 'rgba(251,191,36,1)',
  SOL: 'rgba(167,139,250,1)', TRX: 'rgba(239,68,68,0.9)',
  BNB: 'rgba(252,211,77,1)',  ARB: 'rgba(125,211,252,1)', BASE: 'rgba(165,180,252,1)',
}

const Chip = memo(({ label, value, valueColor = 'rgba(255,255,255,0.88)' }: {
  label: string; value: React.ReactNode; valueColor?: string
}) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: '2px',
    padding: '0 20px', borderLeft: '1px solid rgba(255,255,255,0.07)',
  }}>
    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)' }}>
      {label}
    </span>
    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '14px', fontWeight: 700, color: valueColor, lineHeight: 1 }}>
      {value}
    </span>
  </div>
))
Chip.displayName = 'Chip'

const StatsBar = memo(({ mobile, alertCount = 0 }: StatsBarProps) => {
  const storeWallets                     = useWalletStore(selectWallets)
  const { data: apiDataArr, isFetching } = useAllWalletData()

  const stats = useMemo(() => {
    const hasData  = storeWallets.length > 0 && apiDataArr && apiDataArr.length > 0
    const totalUsd = hasData
      ? apiDataArr!.reduce((s, w) => { const v = w?.balance.usdValue ?? 0; return s + (isNaN(v) || !isFinite(v) ? 0 : v) }, 0)
      : 0

    const loadedCount = apiDataArr?.filter(Boolean).length ?? 0
    const loading     = storeWallets.length > 0 && !hasData

    // Most active = wallet with most recent tx
    let mostActive = '—'
    if (hasData) {
      let bestTs = 0
      apiDataArr!.forEach((w, i) => {
        const ts = parseInt(w?.transactions?.[0]?.timeStamp ?? '0')
        if (ts > bestTs) { bestTs = ts; mostActive = storeWallets[i]?.label ?? '—' }
      })
    }

    // Largest TX in last hour
    let largestTx = 0
    if (hasData) {
      const cutoff = Date.now() / 1000 - 3600
      apiDataArr!.forEach(w => {
        w?.transactions?.forEach(tx => {
          if (parseInt(tx.timeStamp) > cutoff) {
            const v = parseFloat(tx.value) / 1e18
            if (v > largestTx) largestTx = v
          }
        })
      })
    }

    // Chain distribution
    const chainCount: Record<string, number> = {}
    storeWallets.forEach(w => { chainCount[w.chain] = (chainCount[w.chain] ?? 0) + 1 })
    const topChains = Object.entries(chainCount).sort((a, b) => b[1] - a[1]).slice(0, 4)
    const total     = storeWallets.length || 1

    return { totalUsd, loadedCount, loading, mostActive, largestTx, topChains, total, walletCount: storeWallets.length }
  }, [apiDataArr, storeWallets])

  if (mobile) {
    return (
      <div style={{ padding: '10px 14px', background: 'rgba(6,6,12,1)', borderBottom: '1px solid rgba(255,255,255,0.055)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)' }}>TOTAL PORTFOLIO</div>
          {stats.loading
            ? <div className="shimmer" style={{ height: '24px', width: '100px', borderRadius: '4px', marginTop: '2px' }} />
            : <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '22px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtBig(stats.totalUsd)}</div>
          }
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isFetching ? 'rgba(251,191,36,1)' : 'rgba(52,211,153,1)', animation: 'pulse-glow 1.8s ease-in-out infinite', display: 'inline-block' }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: isFetching ? 'rgba(251,191,36,0.9)' : 'rgba(52,211,153,0.9)', letterSpacing: '0.10em' }}>
            {isFetching ? 'SYNC' : 'LIVE'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '64px', flexShrink: 0,
      background: 'rgba(6,6,12,1)',
      borderBottom: '1px solid rgba(255,255,255,0.055)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: '0',
    }}>
      {/* LEFT: Total Portfolio — big number */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '20px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)' }}>
          TOTAL PORTFOLIO
        </span>
        {stats.loading ? (
          <div className="shimmer" style={{ height: '28px', width: '120px', borderRadius: '4px' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.025em', lineHeight: 1 }}>
              {fmtBig(stats.totalUsd)}
            </span>
            {isFetching && (
              <RefreshCw style={{ width: '10px', height: '10px', color: 'rgba(251,191,36,0.7)', animation: 'spin 1s linear infinite' }} />
            )}
          </div>
        )}
      </div>

      {/* MOST ACTIVE */}
      <Chip
        label="MOST ACTIVE"
        value={stats.mostActive}
        valueColor="rgba(255,255,255,0.88)"
      />

      {/* LARGEST TX */}
      <Chip
        label="LARGEST TX"
        value={stats.largestTx > 0 ? fmtBig(stats.largestTx * 2500) : '—'}
        valueColor="rgba(255,255,255,0.88)"
      />

      {/* CHAIN SPLIT */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '4px',
        padding: '0 20px', borderLeft: '1px solid rgba(255,255,255,0.07)',
      }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)' }}>
          CHAIN SPLIT
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '14px' }}>
          {stats.topChains.map(([chain, count]) => (
            <div
              key={chain}
              title={`${chain}: ${count} wallets`}
              style={{
                height: '6px',
                width:  `${Math.round((count / stats.total) * 80)}px`,
                minWidth: '6px',
                borderRadius: '3px',
                background: CHAIN_COLOR[chain] ?? 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>
            {stats.topChains.map(([c]) => c).join('·')}
          </span>
        </div>
      </div>

      {/* LIVE DOT — far right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block',
          background: isFetching ? 'rgba(251,191,36,1)' : 'rgba(52,211,153,1)',
          animation: 'pulse-glow 1.8s ease-in-out infinite',
        }} />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.12em', color: isFetching ? 'rgba(251,191,36,0.9)' : 'rgba(52,211,153,0.9)' }}>
          {isFetching ? 'SYNC' : 'LIVE'}
        </span>
      </div>
    </div>
  )
})

StatsBar.displayName = 'StatsBar'
export default StatsBar
