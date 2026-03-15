/**
 * ZERØ WATCH — MarketTab v20
 * ==========================
 * v20 POLISH:
 * - Fear & Greed card: angka lebih besar, gradient background sesuai nilai
 * - Funding rates: card style v17 (rounded-xl)
 * - Stats grid: card style matching dashboard
 * - Whale feed rows: card rows matching ActivityFeed v20
 * rgba() only ✓  IBM Plex Mono ✓  React.memo + displayName ✓
 */

import { memo, useMemo } from 'react'
import { TrendingUp, TrendingDown, Activity, ExternalLink, RefreshCw, Zap } from 'lucide-react'
import { useWhaleTracker, shortAddr, type WhaleTx } from '@/hooks/useWhaleTracker'
import { useSentiment, type FearGreedLabel } from '@/hooks/useSentiment'

const fmtUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const tsAgo = (ms: number) => {
  const secs = Math.floor((Date.now() - ms) / 1000)
  if (secs < 60)    return `${secs}s ago`
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function fgColor(v: number): string {
  if (v <= 20) return 'rgba(239,68,68,1)'
  if (v <= 40) return 'rgba(251,146,60,1)'
  if (v <= 60) return 'rgba(251,191,36,1)'
  if (v <= 80) return 'rgba(52,211,153,1)'
  return 'rgba(230,161,71,1)'
}

function fgGradFrom(v: number): string {
  if (v <= 20) return 'rgba(239,68,68,0.10)'
  if (v <= 40) return 'rgba(251,146,60,0.10)'
  if (v <= 60) return 'rgba(251,191,36,0.08)'
  if (v <= 80) return 'rgba(52,211,153,0.10)'
  return 'rgba(230,161,71,0.08)'
}

// ── Fear & Greed Card ─────────────────────────────────────────────────────────

interface FearGreedCardProps { index: number | null; label: FearGreedLabel | null; loading: boolean }

const FearGreedCard = memo(({ index, label, loading }: FearGreedCardProps) => {
  const color    = index !== null ? fgColor(index) : 'rgba(255,255,255,0.3)'
  const gradFrom = index !== null ? fgGradFrom(index) : 'rgba(255,255,255,0.02)'
  const pct      = index ?? 50

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${gradFrom} 0%, rgba(255,255,255,0.015) 100%)`,
        border:     `1px solid ${color.replace(',1)', ',0.20)')}`,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${color.replace(',1)', ',0.4)')}, transparent)` }}
      />

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Fear & Greed
        </span>
        <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>alternative.me</span>
      </div>

      {loading ? (
        <div className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
      ) : (
        <>
          <div className="flex items-end justify-between mb-3">
            <span className="font-mono font-bold leading-none" style={{ fontSize: '2.4rem', color }}>
              {index ?? '—'}
            </span>
            <span className="text-sm font-mono font-bold pb-1" style={{ color }}>{label ?? '—'}</span>
          </div>

          {/* Gauge bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:     `${pct}%`,
                background: color,
                boxShadow: `0 0 8px ${color.replace(',1)', ',0.4)')}`,
              }}
            />
          </div>

          <div className="flex justify-between mt-1.5">
            {['FEAR', 'NEUTRAL', 'GREED'].map(t => (
              <span key={t} className="font-mono" style={{ fontSize: '8px', color: 'rgba(255,255,255,0.18)' }}>{t}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
})
FearGreedCard.displayName = 'FearGreedCard'

// ── Funding Rate Row ──────────────────────────────────────────────────────────

interface FundingRowProps { symbol: string; rate: number | null }

const FundingRow = memo(({ symbol, rate }: FundingRowProps) => {
  if (rate === null) return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{symbol}</span>
      <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
    </div>
  )

  const positive = rate >= 0
  const pct      = (rate * 100).toFixed(4)
  const color    = positive ? 'rgba(52,211,153,1)' : 'rgba(239,68,68,1)'
  const Icon     = positive ? TrendingUp : TrendingDown
  const badge    = positive ? 'LONGS PAY' : 'SHORTS PAY'

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.75)' }}>{symbol}</span>
        <span
          className="text-[8px] font-mono px-1.5 rounded"
          style={{ background: positive ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${positive ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`, color }}
        >
          {badge}
        </span>
      </div>
      <span className="text-[11px] font-mono font-bold tabular-nums" style={{ color }}>
        {positive ? '+' : ''}{pct}%
      </span>
    </div>
  )
})
FundingRow.displayName = 'FundingRow'

// ── Whale Tx Card Row ─────────────────────────────────────────────────────────

const WhaleTxRow = memo(({ tx }: { tx: WhaleTx }) => {
  const from   = tx.fromLabel ?? shortAddr(tx.from)
  const to     = tx.toLabel   ?? shortAddr(tx.to)
  const isMega = tx.isMega
  const sym    = tx.type === 'ERC20' ? (tx.tokenSymbol ?? 'ERC20') : 'ETH'

  const tokenClr = tx.type === 'ETH'
    ? 'rgba(0,194,255,0.8)'
    : sym === 'USDT' || sym === 'USDC' || sym === 'DAI'
      ? 'rgba(230,161,71,0.7)'
      : 'rgba(251,146,60,0.8)'

  return (
    <div
      className="rounded-xl px-3 py-2.5 mb-1.5 transition-all"
      style={{
        background:  isMega ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.022)',
        border:      isMega ? '1px solid rgba(251,191,36,0.18)' : '1px solid rgba(255,255,255,0.055)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background  = isMega ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.035)'
        el.style.borderColor = isMega ? 'rgba(251,191,36,0.28)' : 'rgba(255,255,255,0.10)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background  = isMega ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.022)'
        el.style.borderColor = isMega ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.055)'
      }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {isMega && <span className="text-[10px] flex-shrink-0">🔥</span>}
          <span
            className="text-[8px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${tokenClr.replace(/,\s*[\d.]+\)$/, ', 0.18)')}`, color: tokenClr }}
          >
            {sym}
          </span>
          <span className="text-[9px] font-mono truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{from}</span>
          <span className="text-[8px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }}>→</span>
          <span className="text-[9px] font-mono truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{to}</span>
        </div>
        <a
          href={`https://etherscan.io/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 ml-1 transition-colors"
          style={{ color: 'rgba(255,255,255,0.15)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(230,161,71,0.7)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.15)' }}
        >
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>{tsAgo(tx.timestamp)}</span>
        <span className="text-[11px] font-mono font-bold tabular-nums" style={{ color: isMega ? 'rgba(251,191,36,1)' : 'rgba(255,255,255,0.85)' }}>
          {fmtUsd(tx.valueUsd)}
        </span>
      </div>
    </div>
  )
})
WhaleTxRow.displayName = 'WhaleTxRow'

// ── Main MarketTab ────────────────────────────────────────────────────────────

const MarketTab = memo(() => {
  const { txs, gas, loading: whaleLoading, error: whaleError, stats, refetch } = useWhaleTracker()
  const { fearGreedIndex, fearGreedLabel, fundingRateEth, fundingRateBtc, loading: sentLoading } = useSentiment()
  const recentTxs = useMemo(() => txs.slice(0, 20), [txs])

  const netFlowSignal = useMemo(() => {
    const net = stats.exchangeIn - stats.exchangeOut
    if (Math.abs(net) < 1_000) return null
    return {
      dir:   net > 0 ? 'INFLOW' : 'OUTFLOW',
      color: net > 0 ? 'rgba(239,68,68,0.9)' : 'rgba(52,211,153,0.9)',
      label: net > 0 ? '↑ Selling Pressure' : '↓ Accumulation Signal',
    }
  }, [stats.exchangeIn, stats.exchangeOut])

  return (
    <div className="p-4 space-y-3">

      {/* Fear & Greed */}
      <FearGreedCard index={fearGreedIndex} label={fearGreedLabel} loading={sentLoading} />

      {/* Funding Rates */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.065)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Perpetual Funding</span>
          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>Binance Perp</span>
        </div>
        <FundingRow symbol="ETH/USDT" rate={fundingRateEth} />
        <FundingRow symbol="BTC/USDT" rate={fundingRateBtc} />
      </div>

      {/* Exchange Flow Stats */}
      {!whaleLoading && (
        <div className="grid grid-cols-2 gap-2">
          {([
            { label: 'Total Volume', value: fmtUsd(stats.totalUsd),     color: 'rgba(255,255,255,0.88)' },
            { label: 'Whale TXs',   value: String(stats.whaleCount),     color: 'rgba(255,255,255,0.88)' },
            { label: 'CEX Inflow',  value: fmtUsd(stats.exchangeIn),    color: 'rgba(239,68,68,0.9)' },
            { label: 'CEX Outflow', value: fmtUsd(stats.exchangeOut),   color: 'rgba(52,211,153,0.9)' },
          ] as const).map(s => (
            <div key={s.label} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)' }}>
              <div className="text-[9px] font-mono mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
              <div className="text-[13px] font-mono font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Net flow signal badge */}
      {netFlowSignal && (
        <div
          className="rounded-xl px-3 py-2.5 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${netFlowSignal.color.replace(/,\s*[\d.]+\)$/, ', 0.15)')}` }}
        >
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>Exchange Signal</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: netFlowSignal.color }}>{netFlowSignal.label}</span>
        </div>
      )}

      {/* Live Whale Feed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" style={{ color: 'rgba(230,161,71,0.5)' }} />
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Live Whale Flows</span>
            {recentTxs.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(230,161,71,0.8)' }} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {gas && (
              <span
                className="text-[9px] font-mono"
                style={{ color: gas.fastGwei < 20 ? 'rgba(52,211,153,0.8)' : gas.fastGwei < 60 ? 'rgba(0,194,255,0.8)' : 'rgba(251,191,36,0.8)' }}
              >
                <Zap className="w-2.5 h-2.5 inline mr-0.5" style={{ verticalAlign: 'middle' }} />
                {gas.fastGwei.toFixed(0)} gwei
              </span>
            )}
            <button
              onClick={refetch}
              className="transition-colors"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(230,161,71,0.7)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)' }}
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {whaleLoading && recentTxs.length === 0 ? (
          <div className="space-y-1.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        ) : whaleError ? (
          <div className="text-center py-6 text-[10px] font-mono rounded-xl" style={{ color: 'rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
            {whaleError}
          </div>
        ) : recentTxs.length === 0 ? (
          <div className="text-center py-8 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Fetching whale transactions…
          </div>
        ) : (
          <div>{recentTxs.map(tx => <WhaleTxRow key={tx.hash} tx={tx} />)}</div>
        )}
      </div>

      <div className="text-[9px] font-mono text-center" style={{ color: 'rgba(255,255,255,0.12)' }}>
        ETH + ERC20 txs ≥$1M from 40+ labeled wallets · 30s refresh
      </div>
    </div>
  )
})
MarketTab.displayName = 'MarketTab'

export default MarketTab
