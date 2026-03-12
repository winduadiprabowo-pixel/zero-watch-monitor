/**
 * ZERØ WATCH — WalletIntelPanel v15 FINAL
 * ==========================================
 * KOMBINASI MAKSIMAL: Fixed ZIP v14 + gue v17 extras
 * ─────────────────────────────────────────────────────────────────────────────
 * FROM FIXED ZIP v14:
 *   ✓ Gas spent tampilkan USD value (gasSpentUsd real dari TX gasPrice)
 *   ✓ BigMoves 24h window + hoursAgo badge
 *   ✓ BigMoves slice(0,5) — tampilkan lebih banyak
 *   ✓ Signals tab: USD value per signal
 *   ✓ Tokens: loading state informatif (mention Alchemy requirement)
 *   ✓ Board subtitle: "balance · activity · whale · conviction"
 *   ✓ Gas footnote: "actual gasUsed × gasPrice from TX"
 *
 * FROM GUE v17:
 *   ✓ Velocity/100 + Consistency/100 di stats grid (8 stats total)
 *   ✓ Highlight color kuning kalau velocity > 70
 *   ✓ Leaderboard row: ⚡velocity% badge
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useState, useRef, useEffect } from 'react'
import {
  Brain, Copy, BarChart2, Trophy,
  Zap, Clock, Activity, ArrowUpRight,
  ArrowDownLeft, Flame, GitMerge, AlertTriangle,
  Globe, DollarSign,
  LucideIcon,
} from 'lucide-react'
import type { Wallet, ActivityEvent, ActionType } from '@/data/mockData'
import type { TokenHolding } from '@/services/api'
import type { WalletIntelligence, LeaderboardEntry } from '@/services/whaleAnalytics'
import WhaleScoreBadge from './WhaleScoreBadge'
import MarketTab from './MarketTab'

type Tab = 'INTEL' | 'SIGNALS' | 'TOKENS' | 'BOARD' | 'MARKET'

interface WalletIntelPanelProps {
  events:                ActivityEvent[]
  selectedWallet:        Wallet | null
  selectedWalletTokens:  TokenHolding[]
  selectedWalletIntel:   WalletIntelligence | null
  leaderboard:           LeaderboardEntry[]
  clusters:              Record<string, string[]>
}

const fmtUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  if (n > 0)          return `$${n.toFixed(0)}`
  return '$0'
}

const fmtEth = (n: number) =>
  n < 0.0001 ? '~0 ETH' : `${n.toFixed(4)} ETH`

const tsAgo = (ts: number) => {
  const secs = Math.floor(Date.now() / 1000) - ts
  if (secs < 120)   return `${secs}s ago`
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const actionColors: Record<ActionType, string> = {
  SWAP:     'bg-blue-500/20 text-blue-400',
  DEPOSIT:  'bg-neon/15 text-neon',
  TRANSFER: 'bg-amber-500/20 text-amber-400',
  BORROW:   'bg-purple-500/20 text-purple-400',
  UNKNOWN:  'bg-white/10 text-white/40',
}

// ── INTEL Tab ─────────────────────────────────────────────────────────────────

const IntelTab = memo(({ intel, wallet, clusters }: {
  intel: WalletIntelligence; wallet: Wallet; clusters: Record<string, string[]>
}) => {
  const {
    whaleScore, bigMoves,
    gasSpentEth, gasSpentUsd,
    walletAgeDays, txFrequency, avgTxValueEth, largestTxEth, totalVolume30dEth,
  } = intel
  const clustermates = clusters[wallet.id] ?? []
  const inflowPct = (whaleScore.inflow + whaleScore.outflow) > 0
    ? (whaleScore.inflow / (whaleScore.inflow + whaleScore.outflow)) * 100
    : 50

  // 8 stats: 6 base + 2 from gue (velocity + consistency)
  const stats: Array<{ label: string; value: string; icon: LucideIcon; highlight?: string }> = [
    { label: 'Wallet Age',   value: walletAgeDays > 0 ? `${walletAgeDays}d` : '< 1d',    icon: Clock },
    { label: 'TX / Day',     value: txFrequency.toFixed(1),                                icon: Activity },
    { label: 'Avg TX Size',  value: fmtEth(avgTxValueEth),                                icon: BarChart2 },
    { label: 'Largest TX',   value: fmtEth(largestTxEth),                                 icon: ArrowUpRight },
    { label: 'Vol 30d',      value: fmtEth(totalVolume30dEth),                            icon: Flame },
    // fixed zip: show USD value if available
    {
      label: 'Gas Spent',
      value: gasSpentUsd > 0 ? fmtUsd(gasSpentUsd) : fmtEth(gasSpentEth),
      icon:  Zap,
    },
    // gue extras: velocity + consistency
    {
      label:     'Velocity',
      value:     `${whaleScore.velocity}/100`,
      icon:      Activity,
      highlight: whaleScore.velocity > 70 ? 'rgba(251,191,36,0.9)'
               : whaleScore.velocity > 40 ? 'rgba(0,255,148,0.7)'
               : undefined,
    },
    {
      label:     'Consistency',
      value:     `${whaleScore.consistency}/100`,
      icon:      BarChart2,
      highlight: whaleScore.consistency > 70 ? 'rgba(0,255,148,0.9)' : undefined,
    },
  ]

  return (
    <div className="p-4 space-y-3">
      <div className="border border-border rounded-md p-3 bg-surface/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Whale Intelligence</span>
          <Brain className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between">
          <WhaleScoreBadge status={whaleScore.status} score={whaleScore.score} />
          <div className="text-right">
            <div className="text-[9px] text-muted-foreground">Conviction</div>
            <div className="text-xs font-mono text-foreground">{whaleScore.conviction}<span className="text-[9px] text-muted-foreground">/100</span></div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${inflowPct}%`, background: 'linear-gradient(90deg, rgba(0,255,148,0.7) 0%, rgba(0,255,148,0.4) 100%)' }} />
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-emerald-400">▲ IN {fmtEth(whaleScore.inflow)}</span>
            <span className="text-red-400">OUT {fmtEth(whaleScore.outflow)} ▼</span>
          </div>
        </div>
      </div>

      {/* fixed zip: BigMoves 24h + hoursAgo + slice(0,5) */}
      {bigMoves.length > 0 && (
        <div className="border border-amber-500/20 rounded-md p-3 bg-amber-500/5 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
              Big Move{bigMoves.length > 1 ? 's' : ''} (24h)
            </span>
          </div>
          {bigMoves.slice(0, 5).map(m => (
            <div key={m.hash} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {m.type === 'IN'
                  ? <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                  : <ArrowUpRight  className="w-3 h-3 text-red-400" />
                }
                <div>
                  <span className={`text-[9px] font-mono font-semibold ${m.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {m.type} · {m.txType}
                  </span>
                  {m.hoursAgo !== undefined && (
                    <span className="text-[8px] text-white/25 font-mono ml-1">
                      {m.hoursAgo === 0 ? 'just now' : `${m.hoursAgo}h ago`}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono text-foreground">{fmtUsd(m.valueUsd)}</div>
                <div className="text-[9px] text-muted-foreground">{tsAgo(m.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border border-border rounded-md overflow-hidden bg-surface/30">
        <div className="px-3 pt-2.5 pb-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">On-Chain Stats</span>
        </div>
        <div className="grid grid-cols-2">
          {stats.map((s, i) => (
            <div key={s.label} className={`p-2.5 ${i % 2 === 0 ? 'border-r' : ''} border-b border-border/50`}>
              <div className="flex items-center gap-1 mb-0.5">
                <s.icon className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                <span className="text-[9px] text-muted-foreground truncate">{s.label}</span>
              </div>
              {/* gue: highlight color untuk velocity/consistency */}
              <div className="text-[11px] font-mono" style={{ color: s.highlight ?? 'rgba(255,255,255,0.85)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-1 border-t border-border/30">
          {/* fixed zip footnote */}
          <span className="text-[8px] text-white/15 font-mono">
            * gas = actual gasUsed × gasPrice from TX · velocity = 7d vs 30d rate
          </span>
        </div>
      </div>

      {clustermates.length > 0 && (
        <div className="border border-purple-500/20 rounded-md p-3 bg-purple-500/5 space-y-2">
          <div className="flex items-center gap-1.5">
            <GitMerge className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">Cluster Detected</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Moves in sync with:</div>
          <div className="flex flex-wrap gap-1">
            {clustermates.map(label => (
              <span key={label} className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{label}</span>
            ))}
          </div>
        </div>
      )}

      <div className="border border-border rounded-md p-3 bg-surface/30 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Wallet Detail</div>
        {[
          { label: 'Address', value: wallet.address },
          { label: 'Chain',   value: wallet.chain },
          { label: 'Balance', value: wallet.balance },
          { label: 'Tag',     value: wallet.tag, highlight: true },
        ].map(r => (
          <div key={r.label} className="flex justify-between">
            <span className="text-[11px] text-muted-foreground">{r.label}</span>
            <span className={`text-[11px] font-mono ${r.highlight ? 'text-neon' : 'text-foreground'}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
})
IntelTab.displayName = 'IntelTab'

// ── SIGNALS Tab — fixed zip: USD value per signal ────────────────────────────

const SignalsTab = memo(({ intel, events }: { intel: WalletIntelligence | null; events: ActivityEvent[] }) => {
  const sigActionCls: Record<string, string> = {
    BUY:     'bg-emerald-500/20 text-emerald-400',
    SELL:    'bg-red-500/20 text-red-400',
    DEPOSIT: 'bg-blue-500/20 text-blue-400',
    BORROW:  'bg-purple-500/20 text-purple-400',
  }

  if (!intel) {
    return (
      <div className="p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Live Activity</div>
        {events.length === 0 ? (
          <div className="text-center py-10 text-white/20 text-xs font-mono">Select a wallet to see signals</div>
        ) : (
          <div className="space-y-0">
            {events.slice(0, 8).map(e => (
              <div key={e.id} className="py-2.5 border-b border-border/40">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0 rounded font-semibold ${actionColors[e.action] ?? actionColors.UNKNOWN}`}>{e.action}</span>
                    <span className="text-[10px] text-foreground">{e.walletLabel}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{e.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[160px]">{e.detail}</span>
                  <span className="text-[10px] font-mono text-foreground">{e.usdSize}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Copy Signals</div>
          <div className="text-[9px] text-white/20 mt-0.5">Recent SWAP · DEPOSIT · BORROW</div>
        </div>
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      {intel.copySignals.length === 0 ? (
        <div className="text-center py-10 text-white/20 text-xs font-mono">No SWAP/DEPOSIT signals in recent TXs</div>
      ) : (
        <div className="space-y-0">
          {intel.copySignals.map((s, i) => (
            <div key={s.txHash + i} className="py-2.5 border-b border-border/40 animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-semibold px-1.5 py-0 rounded ${sigActionCls[s.action] ?? 'bg-white/10 text-white/40'}`}>{s.action}</span>
                  <span className="text-[10px] text-foreground font-mono">{s.fnName}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">{tsAgo(s.timestamp)}</span>
              </div>
              {/* fixed zip: ETH + USD per signal */}
              <div className="flex justify-between">
                <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[140px]">→ {s.toAddress.slice(0, 10)}…</span>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-foreground">{fmtEth(s.valueEth)}</div>
                  {s.valueUsd > 0 && (
                    <div className="text-[8px] font-mono" style={{ color: 'rgba(0,255,148,0.55)' }}>{fmtUsd(s.valueUsd)}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="pt-3 text-[9px] text-white/15 font-mono">Mirror these signals to find similar opportunities</div>
    </div>
  )
})
SignalsTab.displayName = 'SignalsTab'

// ── TOKENS Tab ────────────────────────────────────────────────────────────────

const TokensTab = memo(({ wallet, tokens }: { wallet: Wallet | null; tokens: TokenHolding[] }) => {
  if (!wallet) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full gap-2 text-center">
        <BarChart2 className="w-8 h-8 text-white/10" />
        <div className="text-xs text-white/20 font-mono">Select a wallet to see token holdings</div>
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className="p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Token Holdings</div>
        {/* fixed zip: more informative loading state */}
        <div className="text-center py-8 space-y-2">
          <div className="text-white/20 text-xs font-mono">No verified ERC-20 tokens found</div>
          <div className="text-white/10 text-[10px] font-mono leading-relaxed">
            Dust &amp; airdrop spam filtered<br />
            Token data requires proxy (Alchemy)
          </div>
        </div>
      </div>
    )
  }

  const sorted   = [...tokens].filter(t => t.usdValue > 0 || parseFloat(t.balance) > 0).sort((a, b) => b.usdValue - a.usdValue)
  const totalUsd = sorted.reduce((sum, t) => sum + t.usdValue, 0)
  const maxUsd   = sorted[0]?.usdValue || 1

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Token Holdings</div>
          <div className="text-[9px] text-white/20 mt-0.5">{sorted.length} verified tokens</div>
        </div>
        {totalUsd > 0 && (
          <div className="text-right">
            <div className="text-[9px] text-muted-foreground">Total</div>
            <div className="text-[12px] font-mono font-semibold" style={{ color: 'rgba(0,255,148,0.9)' }}>{fmtUsd(totalUsd)}</div>
          </div>
        )}
      </div>

      <div className="space-y-0">
        {sorted.map((t, i) => {
          const usdPct = Math.max(2, (t.usdValue / maxUsd) * 100)
          return (
            <div key={t.contractAddress + i} className="py-2.5 border-b border-border/40 animate-fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-neon/80 bg-neon/10 px-1.5 py-0 rounded font-semibold">{t.symbol}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{t.name}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-[11px] font-mono text-foreground tabular-nums">{t.balance}</div>
                  {t.usdValue > 0 && (
                    <div className="text-[9px] font-mono" style={{ color: 'rgba(0,255,148,0.65)' }}>{fmtUsd(t.usdValue)}</div>
                  )}
                </div>
              </div>
              {t.usdValue > 0 && (
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${usdPct}%`, background: 'rgba(0, 255, 148, 0.35)' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="pt-3 text-[9px] text-white/15 font-mono">Spam filtered · min $5 USD · prices via CoinGecko</div>
    </div>
  )
})
TokensTab.displayName = 'TokensTab'

// ── BOARD Tab — fixed zip: conviction in formula + gue: velocity badge ─────────

const BoardTab = memo(({ leaderboard }: { leaderboard: LeaderboardEntry[] }) => {
  if (leaderboard.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full gap-2 text-center">
        <Trophy className="w-8 h-8 text-white/10" />
        <div className="text-xs text-white/20 font-mono">Add wallets to build the leaderboard</div>
      </div>
    )
  }

  const rankBadge = (r: number) => {
    if (r === 1) return <span className="text-base">🥇</span>
    if (r === 2) return <span className="text-base">🥈</span>
    if (r === 3) return <span className="text-base">🥉</span>
    return <span className="text-[11px] font-mono text-muted-foreground w-5 text-center">#{r}</span>
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Smart Money Board</div>
          {/* fixed zip subtitle */}
          <div className="text-[9px] text-white/20 mt-0.5">balance · activity · whale · velocity · conviction</div>
        </div>
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
      </div>
      <div className="space-y-0">
        {leaderboard.map((e, i) => (
          <div key={e.id} className="py-2.5 border-b border-border/40 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-5 flex items-center justify-center flex-shrink-0">{rankBadge(e.rank)}</div>
                <span className="text-xs text-foreground font-medium truncate max-w-[120px]">{e.label}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <WhaleScoreBadge status={e.status} compact />
                <span className="text-[11px] font-mono text-neon tabular-nums">{e.smartScore}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pl-7 mb-1">
              {/* gue: velocity badge kalau > 50 */}
              <span className="text-[9px] text-muted-foreground">
                {fmtUsd(e.balanceUsd)} · {e.txCount30d}tx/30d
                {e.velocity > 50 ? <span style={{ color: 'rgba(251,191,36,0.8)' }}> · ⚡{e.velocity}%</span> : null}
              </span>
              <span className="text-[9px] text-muted-foreground">{fmtEth(e.volume30dEth)}</span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden ml-7">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${e.smartScore}%`, background: 'rgba(0, 255, 148, 0.4)', transitionDelay: `${i * 0.08}s` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="pt-3 text-[9px] text-white/15 font-mono">Score = balance(25) + activity(25) + whale(20) + velocity(15) + conviction(15)</div>
    </div>
  )
})
BoardTab.displayName = 'BoardTab'

// ── Main Panel ─────────────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: 'INTEL',   label: 'INTEL',   icon: Brain },
  { id: 'SIGNALS', label: 'SIGNALS', icon: Copy },
  { id: 'TOKENS',  label: 'TOKENS',  icon: BarChart2 },
  { id: 'BOARD',   label: 'BOARD',   icon: Trophy },
  { id: 'MARKET',  label: 'MARKET',  icon: Globe },
]

const WalletIntelPanel = memo(({
  events, selectedWallet, selectedWalletTokens,
  selectedWalletIntel, leaderboard, clusters,
}: WalletIntelPanelProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('INTEL')
  const prevWalletId = useRef<string | null>(null)

  useEffect(() => {
    if (selectedWallet && selectedWallet.id !== prevWalletId.current) {
      setActiveTab('INTEL')
      prevWalletId.current = selectedWallet.id
    }
  }, [selectedWallet?.id])

  const hasBigMoves = Boolean(selectedWalletIntel && selectedWalletIntel.bigMoves.length > 0)
  const hasSignals  = Boolean(selectedWalletIntel && selectedWalletIntel.copySignals.length > 0)
  const hasTokens   = selectedWalletTokens.filter(t => t.usdValue > 0).length > 0

  return (
    <aside className="flex flex-col w-[340px] min-w-[340px] border-l border-border h-screen bg-card/30 animate-fade-up delay-3">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-foreground tracking-wide uppercase truncate">
            {selectedWallet?.label ?? 'Intelligence'}
          </h2>
          {hasBigMoves && (
            <span className="flex items-center gap-1 text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse flex-shrink-0 ml-2">
              <Zap className="w-2.5 h-2.5" />ALERT
            </span>
          )}
        </div>
        {selectedWallet && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-mono">{selectedWallet.address}</span>
            <span className="text-[9px] text-muted-foreground bg-white/5 px-1 rounded">{selectedWallet.chain}</span>
          </div>
        )}
      </div>

      <div className="flex border-b border-border flex-shrink-0 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-medium tracking-wider transition-colors relative min-w-0 ${
              activeTab === tab.id ? 'text-neon bg-neon/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/3'
            }`}
          >
            <tab.icon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{tab.label}</span>
            {tab.id === 'SIGNALS' && hasSignals  && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-neon rounded-full animate-pulse" />}
            {tab.id === 'INTEL'   && hasBigMoves  && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />}
            {tab.id === 'TOKENS'  && hasTokens    && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full" />}
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-px bg-neon" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'INTEL' ? (
          selectedWallet && selectedWalletIntel ? (
            <IntelTab intel={selectedWalletIntel} wallet={selectedWallet} clusters={clusters} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <Brain className="w-8 h-8 text-white/10" />
              <div className="text-xs text-white/20 font-mono">Select a wallet to see intelligence</div>
              <div className="text-[10px] text-white/10 leading-relaxed">
                Whale score · 24h big move alerts<br />on-chain stats · cluster detection
              </div>
            </div>
          )
        ) : activeTab === 'SIGNALS' ? (
          <SignalsTab intel={selectedWalletIntel} events={events} />
        ) : activeTab === 'TOKENS' ? (
          <TokensTab wallet={selectedWallet} tokens={selectedWalletTokens} />
        ) : activeTab === 'BOARD' ? (
          <BoardTab leaderboard={leaderboard} />
        ) : (
          <MarketTab />
        )}
      </div>

      {activeTab === 'INTEL' && events.length > 0 && (
        <div className="border-t border-border bg-surface/30 flex-shrink-0">
          <div className="px-4 py-2.5">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-2">
              {selectedWallet ? 'Recent Activity' : 'All Activity'}
            </div>
            <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
              {events.slice(0, 4).map(e => (
                <div key={e.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[8px] px-1 py-0 rounded font-semibold flex-shrink-0 ${actionColors[e.action] ?? actionColors.UNKNOWN}`}>{e.action}</span>
                    <span className="text-[9px] text-muted-foreground font-mono truncate">{e.detail}</span>
                  </div>
                  <span className="text-[9px] font-mono text-foreground flex-shrink-0 ml-2">{e.usdSize}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
})
WalletIntelPanel.displayName = 'WalletIntelPanel'

export default WalletIntelPanel
