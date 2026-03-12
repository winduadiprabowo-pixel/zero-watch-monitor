/**
 * ZERØ WATCH — Index v15
 * ========================
 * v15 TOTAL REWRITE:
 * - Auto-seed default whale wallets on mount
 * - Hero onboarding screen "SIGNAL DETECTED" — bukan generic empty state
 * - Desktop/Tablet/Mobile semua rapi
 * - rgba() only ✓  React.memo ✓  useCallback/useMemo ✓
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import React, { memo }             from 'react'
import Logo                        from '@/components/dashboard/Logo'
import WalletSidebar               from '@/components/dashboard/WalletSidebar'
import StatsBar                    from '@/components/dashboard/StatsBar'
import WalletTable                 from '@/components/dashboard/WalletTable'
import ActivityFeed                from '@/components/dashboard/ActivityFeed'
import WalletIntelPanel            from '@/components/dashboard/WalletIntelPanel'
import MobileBottomNav             from '@/components/dashboard/MobileBottomNav'
import { AddWalletModal }          from '@/components/AddWalletModal'
import { UpgradeModal }            from '@/components/UpgradeModal'
import { ExportModal }             from '@/components/ExportModal'
import { filterTags }              from '@/data/mockData'
import type { Wallet, ActivityEvent } from '@/data/mockData'
import { useIsMobile }             from '@/hooks/use-mobile'
import { useIsTablet }             from '@/hooks/use-tablet'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useWalletStore, selectWallets }   from '@/store/walletStore'
import { useAllWalletData, useEthPrice }   from '@/hooks/useWalletData'
import type { WalletData }         from '@/services/api'
import {
  computeWalletIntel,
  buildLeaderboard,
  detectClusters,
}                                  from '@/services/whaleAnalytics'
import type { WalletIntelligence } from '@/services/whaleAnalytics'
import type { Transaction }        from '@/services/api'
import { Download, Zap, Eye, TrendingUp, TrendingDown, Activity, Shield } from 'lucide-react'
import { useWhaleAlerts } from '@/hooks/useWhaleAlerts'
import WhaleAlertToggle from '@/components/WhaleAlertToggle'

type MobileTab = 'wallets' | 'intel' | 'stats'

// ── UI data mappers ─────────────────────────────────────────────────────────

function toUiWallet(
  storeWallet: ReturnType<typeof selectWallets>[number],
  apiData:     WalletData | undefined,
  index:       number
): Wallet {
  const ethBal = apiData?.balance.ethBalance ?? '0'
  const usd    = apiData?.balance.usdValue   ?? 0
  const txs    = apiData?.transactions       ?? []
  const latest = txs[0]

  const lastMove = latest
    ? (() => {
        const secs = Math.floor(Date.now() / 1000) - parseInt(latest.timeStamp)
        if (secs < 120)   return `${secs}s ago`
        if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
        if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
        return `${Math.floor(secs / 86400)}d ago`
      })()
    : '—'

  const sparkData = txs.length
    ? txs.slice(0, 10).reverse().map(t => Math.max(parseFloat(t.value) || 0.001, 0.001))
    : [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

  // Use tag from store (set during seed/add), fallback to index rotation only if missing
  const FALLBACK_TAGS = ['CEX Whale', 'DeFi Insider', 'Smart Money', 'DAO Treasury', 'MEV Bot'] as const
  const tag = (storeWallet as typeof storeWallet & { tag?: string }).tag as typeof FALLBACK_TAGS[number]
    ?? FALLBACK_TAGS[index % FALLBACK_TAGS.length]

  const fmtUsd = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
    if (n > 0)          return `$${n.toFixed(0)}`
    return `${ethBal} ETH`
  }

  return {
    id:       storeWallet.id,
    label:    storeWallet.label,
    address:  storeWallet.address.slice(0, 6) + '...' + storeWallet.address.slice(-4),
    tag,
    chain:    storeWallet.chain as 'ETH' | 'ARB' | 'BASE' | 'OP',
    balance:  usd > 0 ? fmtUsd(usd) : `${ethBal} ETH`,
    pnl:      0,
    active:   txs.length > 0,
    lastMove,
    txNew:    txs.filter(t => {
      const age = Date.now() / 1000 - parseInt(t.timeStamp)
      return age < 3600
    }).length,
    sparkData,
  }
}

function toUiEvents(
  storeWallet: ReturnType<typeof selectWallets>[number],
  apiData:     WalletData | undefined
): ActivityEvent[] {
  return (apiData?.transactions ?? []).slice(0, 5).map(tx => ({
    id:          tx.hash,
    walletId:    storeWallet.id,
    walletLabel: storeWallet.label,
    action:      tx.type === 'UNKNOWN' ? 'TRANSFER' : tx.type,
    detail:      `${tx.value} ETH → ${tx.to?.slice(0, 10)}…`,
    usdSize:     `${tx.value} ETH`,
    timestamp: (() => {
      const secs = Math.floor(Date.now() / 1000) - parseInt(tx.timeStamp)
      if (secs < 120)   return `${secs}s ago`
      if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
      if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
      return `${Math.floor(secs / 86400)}d ago`
    })(),
  }))
}

// ── Hero Onboarding Screen ─────────────────────────────────────────────────
// Muncul saat wallets kosong tapi belum seeded.
// Tidak akan pernah muncul di v15 karena auto-seed on mount.
// Kept as fallback.

const HeroScreen = memo(({ onAdd, onUpgrade }: { onAdd: () => void; onUpgrade: () => void }) => {
  const signals = [
    { label: 'ACCUMULATING', addr: '0xd8dA...6045', val: '$2.1M', color: 'rgba(52,211,153,1)', icon: TrendingUp },
    { label: 'DISTRIBUTING', addr: '0xBE0e...33E8', val: '$8.4M', color: 'rgba(239,68,68,1)',  icon: TrendingDown },
    { label: 'HUNTING',      addr: '0x28C6...d60', val: '$440K', color: 'rgba(251,191,36,1)',  icon: Activity },
  ]

  return (
    <div
      className="flex flex-col items-center justify-center gap-8 px-6"
      style={{
        height:     '100dvh',
        background: 'rgba(4,4,10,1)',
        paddingTop: 'env(safe-area-inset-top,0px)',
      }}
    >
      {/* Grid scan lines bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,255,148,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,148,0.012) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width:      '600px',
          height:     '280px',
          background: 'radial-gradient(ellipse at top, rgba(0,255,148,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div className="relative animate-fade-up">
        <Logo compact />
      </div>

      {/* Hero copy */}
      <div className="text-center space-y-3 relative animate-fade-up" style={{ animationDelay: '0.08s' }}>
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2"
          style={{
            background: 'rgba(0,255,148,0.06)',
            border:     '1px solid rgba(0,255,148,0.18)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(0,255,148,1)', boxShadow: '0 0 6px rgba(0,255,148,0.8)' }} />
          <span className="text-[9px] font-mono tracking-widest" style={{ color: 'rgba(0,255,148,0.8)' }}>LIVE SURVEILLANCE ACTIVE</span>
        </div>

        <h1
          className="font-mono font-bold leading-tight"
          style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.01em' }}
        >
          They move first.<br />
          <span style={{ color: 'rgba(0,255,148,1)' }}>You watch.</span>
        </h1>

        <p className="font-mono text-sm max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          Track whale wallets in real-time. See accumulation, distribution, and big moves before CT does.
        </p>
      </div>

      {/* Live signal preview cards */}
      <div className="w-full max-w-sm space-y-2 relative animate-fade-up" style={{ animationDelay: '0.14s' }}>
        <div className="text-[9px] font-mono tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.18)' }}>
          LIVE SIGNALS — SAMPLE DATA
        </div>
        {signals.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{
              background:     `rgba(${s.label === 'ACCUMULATING' ? '52,211,153' : s.label === 'DISTRIBUTING' ? '239,68,68' : '251,191,36'},0.04)`,
              border:         `1px solid ${s.color.replace(',1)', ',0.15)')}`,
              animationDelay: `${0.18 + i * 0.06}s`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
              <span className="text-[9px] font-mono font-bold tracking-wider" style={{ color: s.color }}>{s.label}</span>
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.addr}</span>
            </div>
            <span className="text-[11px] font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm space-y-3 relative animate-fade-up" style={{ animationDelay: '0.28s' }}>
        <button
          onClick={onAdd}
          className="w-full py-3.5 rounded-xl font-mono font-bold text-sm tracking-wider transition-all active:scale-[0.98]"
          style={{
            background:  'rgba(0,255,148,1)',
            color:       '#020a06',
            boxShadow:   '0 0 28px rgba(0,255,148,0.25), 0 4px 16px rgba(0,0,0,0.4)',
            letterSpacing: '0.06em',
          }}
        >
          <Eye className="w-4 h-4 inline mr-2 -mt-0.5" />
          START WATCHING WHALES
        </button>

        <button
          onClick={onUpgrade}
          className="w-full py-3 rounded-xl font-mono text-xs tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            background: 'rgba(0,255,148,0.05)',
            border:     '1px solid rgba(0,255,148,0.2)',
            color:      'rgba(0,255,148,0.7)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,148,0.4)'; e.currentTarget.style.color = 'rgba(0,255,148,1)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,148,0.2)'; e.currentTarget.style.color = 'rgba(0,255,148,0.7)' }}
        >
          <Zap className="w-3.5 h-3.5" />
          UNLOCK PRO — $9 lifetime · Whale Intel + Alerts
        </button>

        <div className="flex items-center justify-center gap-4 pt-1">
          {[
            { icon: Shield, text: 'Read-only. No wallet connect.' },
            { icon: Eye,    text: 'Anonymous. No signup.' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-1">
              <f.icon className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
HeroScreen.displayName = 'HeroScreen'

// ── Mobile Header ─────────────────────────────────────────────────────────

interface MobileHeaderProps {
  isProActive: boolean
  isFetching:  boolean
  isError:     boolean
  onExport:    () => void
  onUpgrade:   () => void
  onAdd:       () => void
  alerts:      import('@/hooks/useWhaleAlerts').WhaleAlertsState
}

const MobileHeader = memo(({
  isProActive, isFetching, isError, onExport, onUpgrade, onAdd, alerts,
}: MobileHeaderProps) => (
  <div
    className="flex-shrink-0 flex items-center justify-between px-4 relative"
    style={{
      paddingTop:    'calc(env(safe-area-inset-top, 0px) + 10px)',
      paddingBottom: '10px',
      background:    'rgba(4,4,10,0.96)',
      backdropFilter: 'blur(16px)',
    }}
  >
    <div
      className="absolute bottom-0 left-0 right-0 h-px"
      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,148,0.18) 40%, rgba(0,255,148,0.08) 70%, transparent 100%)' }}
    />

    <div className="flex items-center gap-2 animate-fade-up">
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <rect x="1" y="1" width="26" height="26" rx="3" stroke="rgba(0,255,148,1)" strokeWidth="2" fill="rgba(0,255,148,0.06)" />
        <polyline points="5,7 13,7 5,14 13,14" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="15" y1="6" x2="15" y2="22" stroke="rgba(0,255,148,1)" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
        <line x1="17" y1="7" x2="17" y2="21" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17,7 Q23,7 23,10.5 Q23,14 17,14" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M17,14 Q24,14 24,17.5 Q24,21 17,21" stroke="rgba(0,255,148,1)" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <polyline points="5,16 5,22 12,22" stroke="rgba(0,255,148,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <span className="font-mono font-bold text-base leading-none tracking-tight">
        ZER<span style={{ color: 'rgba(0,255,148,1)' }}>Ø</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.12em', marginLeft: '4px', fontWeight: 400 }}>
          WATCH
        </span>
      </span>
    </div>

    <div className="flex items-center gap-2">
      {/* LIVE dot */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: isFetching ? 'rgba(251,191,36,1)' : isError ? 'rgba(239,68,68,1)' : 'rgba(0,255,148,1)',
            boxShadow:  isFetching ? '0 0 4px rgba(251,191,36,0.8)' : isError ? '0 0 4px rgba(239,68,68,0.8)' : '0 0 4px rgba(0,255,148,0.8)',
            animation:  'pulse-glow 2s ease-in-out infinite',
          }}
        />
        <span
          className="text-[8px] font-mono tracking-widest"
          style={{
            color: isFetching ? 'rgba(251,191,36,0.8)' : isError ? 'rgba(239,68,68,0.7)' : 'rgba(0,255,148,0.75)',
          }}
        >
          {isFetching ? 'SYNC' : isError ? 'ERR' : 'LIVE'}
        </span>
      </div>

      {/* PRO CTA */}
      {isProActive ? (
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono transition-all active:scale-95"
          style={{ background: 'rgba(0,255,148,0.06)', border: '1px solid rgba(0,255,148,0.25)', color: 'rgba(0,255,148,0.9)', fontSize: '10px' }}
        >
          <Download className="w-3 h-3" />
          CSV
        </button>
      ) : (
        <button
          onClick={onUpgrade}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold transition-all active:scale-95"
          style={{
            background:    'rgba(0,255,148,0.12)',
            border:        '1px solid rgba(0,255,148,0.40)',
            color:         'rgba(0,255,148,1)',
            fontSize:      '10px',
            boxShadow:     '0 0 14px rgba(0,255,148,0.18)',
            letterSpacing: '0.04em',
          }}
        >
          <Zap className="w-3 h-3" />
          PRO $9
        </button>
      )}

      <WhaleAlertToggle alerts={alerts} compact />

      <button
        onClick={onAdd}
        className="px-3 py-1.5 rounded-full font-mono transition-all active:scale-95"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.65)', fontSize: '10px' }}
      >
        + ADD
      </button>
    </div>
  </div>
))
MobileHeader.displayName = 'MobileHeader'

// ── Main Component ────────────────────────────────────────────────────────

const Index = () => {
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter]         = useState('ALL')
  const [searchQuery, setSearchQuery]           = useState('')
  const [mobileTab, setMobileTab]               = useState<MobileTab>('wallets')
  const [feedDrawerOpen, setFeedDrawerOpen]     = useState(false)
  const [addOpen, setAddOpen]                   = useState(false)
  const [upgradeOpen, setUpgradeOpen]           = useState(false)
  const [exportOpen, setExportOpen]             = useState(false)

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const storeWallets  = useWalletStore(selectWallets)
  const isProActive   = useWalletStore(s => s.isProActive())
  const seedDefaults  = useWalletStore(s => s.seedDefaultWallets)
  const seeded        = useWalletStore(s => s._seeded)

  // ── Auto-seed on first mount ────────────────────────────────────────────
  useEffect(() => {
    if (!seeded) seedDefaults()
  }, [seeded, seedDefaults])

  const { data: apiDataArr, isFetching, isError } = useAllWalletData()
  const { data: ethPrice }                        = useEthPrice()
  const ETH_PRICE = ethPrice ?? 1968

  const allWallets = useMemo<Wallet[]>(
    () => storeWallets.map((w, i) => toUiWallet(w, apiDataArr?.[i], i)),
    [storeWallets, apiDataArr]
  )
  const allEvents = useMemo<ActivityEvent[]>(
    () => storeWallets.flatMap((w, i) => toUiEvents(w, apiDataArr?.[i])),
    [storeWallets, apiDataArr]
  )
  const filteredWallets = useMemo(() =>
    allWallets.filter(w => {
      const matchesFilter = activeFilter === 'ALL' || w.tag === activeFilter
      const matchesSearch = !searchQuery
        || w.label.toLowerCase().includes(searchQuery.toLowerCase())
        || w.address.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    }),
    [allWallets, activeFilter, searchQuery]
  )

  const walletIntelMap = useMemo<Record<string, WalletIntelligence>>(() => {
    const map: Record<string, WalletIntelligence> = {}
    storeWallets.forEach((w, i) => {
      const data = apiDataArr?.[i]
      if (data) map[w.id] = computeWalletIntel(data.transactions, w.address, ETH_PRICE)
    })
    return map
  }, [storeWallets, apiDataArr, ETH_PRICE])

  const leaderboard = useMemo(
    () => buildLeaderboard(storeWallets, apiDataArr ?? [], ETH_PRICE),
    [storeWallets, apiDataArr, ETH_PRICE]
  )
  const clusters = useMemo(() => {
    const input: Record<string, { transactions: Transaction[]; label: string }> = {}
    storeWallets.forEach((w, i) => {
      const data = apiDataArr?.[i]
      if (data) input[w.id] = { transactions: data.transactions, label: w.label }
    })
    return detectClusters(input)
  }, [storeWallets, apiDataArr])

  // ── Whale Alerts ────────────────────────────────────────────────────────────
  const walletLabels = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    storeWallets.forEach(w => { m[w.id] = w.label })
    return m
  }, [storeWallets])

  const whaleAlerts = useWhaleAlerts(walletIntelMap, walletLabels)

  const selectedWallet       = allWallets.find(w => w.id === selectedWalletId) ?? null
  const selectedWalletIdx    = storeWallets.findIndex(w => w.id === selectedWalletId)
  const selectedWalletTokens = selectedWalletIdx >= 0 ? (apiDataArr?.[selectedWalletIdx]?.balance.tokens ?? []) : []
  const selectedWalletIntel  = selectedWalletId ? (walletIntelMap[selectedWalletId] ?? null) : null

  const filteredEvents = useMemo(() =>
    selectedWalletId ? allEvents.filter(e => e.walletId === selectedWalletId) : allEvents,
    [selectedWalletId, allEvents]
  )

  const handleSelectWallet = useCallback(
    (id: string) => setSelectedWalletId(prev => prev === id ? null : id),
    []
  )
  const handleExportClick = useCallback(() => {
    if (isProActive) setExportOpen(true)
    else setUpgradeOpen(true)
  }, [isProActive])

  const modals = (
    <>
      <AddWalletModal open={addOpen}     onClose={() => setAddOpen(false)}     onUpgrade={() => setUpgradeOpen(true)} />
      <UpgradeModal   open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ExportModal    open={exportOpen}  onClose={() => setExportOpen(false)} />
    </>
  )

  // Desktop sidebar AddBtn
  const AddBtn = () => (
    <div className="flex items-center gap-2 px-3 pb-2">
      <button
        onClick={() => setAddOpen(true)}
        className="flex-1 text-xs py-1.5 rounded-lg bg-neon/10 border border-neon/30 text-neon hover:bg-neon/20 transition-all font-mono"
      >
        + ADD WALLET
      </button>
      <WhaleAlertToggle alerts={whaleAlerts} compact />
      {isProActive ? (
        <button onClick={handleExportClick}
          className="text-xs py-1.5 px-2 rounded-lg border border-neon/30 text-neon hover:bg-neon/10 transition-all font-mono"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button onClick={() => setUpgradeOpen(true)}
          className="text-xs py-1.5 px-2 rounded-lg border border-white/10 text-white/40 hover:border-neon/30 hover:text-neon transition-all font-mono"
        >
          PRO
        </button>
      )}
      {isFetching && <span className="text-white/20 text-xs animate-pulse">⟳</span>}
      {isError    && <span className="text-red-400 text-xs" title="API error — retrying">!</span>}
    </div>
  )

  // Wallets belum seeded (flash pertama kali) — loading screen singkat
  if (!seeded) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: '100dvh', background: 'rgba(4,4,10,1)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'rgba(0,255,148,0.8)', boxShadow: '0 0 8px rgba(0,255,148,0.6)' }} />
          <span className="text-[10px] font-mono tracking-widest" style={{ color: 'rgba(0,255,148,0.5)' }}>INITIALIZING...</span>
        </div>
      </div>
    )
  }

  // Seeded tapi user hapus semua wallet → hero screen
  if (storeWallets.length === 0) {
    return (
      <>
        <HeroScreen onAdd={() => setAddOpen(true)} onUpgrade={() => setUpgradeOpen(true)} />
        {modals}
      </>
    )
  }

  // ── MOBILE ──────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="scanline-overlay noise-bg flex flex-col overflow-hidden bg-background"
        style={{ height: '100dvh' }}
      >
        <MobileHeader
          isProActive={isProActive}
          isFetching={isFetching}
          isError={!!isError}
          onExport={handleExportClick}
          onUpgrade={() => setUpgradeOpen(true)}
          onAdd={() => setAddOpen(true)}
          alerts={whaleAlerts}
        />

        <div className="flex-1 overflow-hidden min-h-0">
          {mobileTab === 'wallets' && (
            <div className="flex flex-col h-full animate-fade-up">
              <WalletSidebar
                wallets={filteredWallets} selectedWalletId={selectedWalletId}
                activeFilter={activeFilter} searchQuery={searchQuery}
                onSelectWallet={handleSelectWallet} onFilterChange={setActiveFilter}
                onSearchChange={setSearchQuery} mobile
              />
            </div>
          )}

          {mobileTab === 'intel' && (
            <div className="flex flex-col h-full overflow-hidden animate-fade-up">
              <WalletIntelPanel
                events={filteredEvents} selectedWallet={selectedWallet}
                selectedWalletTokens={selectedWalletTokens} selectedWalletIntel={selectedWalletIntel}
                leaderboard={leaderboard} clusters={clusters}
              />
            </div>
          )}

          {mobileTab === 'stats' && (
            <div
              className="flex flex-col h-full overflow-y-auto animate-fade-up"
              style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              <StatsBar mobile />
              {!isProActive && (
                <button
                  onClick={() => setUpgradeOpen(true)}
                  className="mx-3 my-2 py-3 px-4 rounded-xl flex items-center gap-3 transition-all active:scale-98 text-left"
                  style={{ background: 'rgba(0,255,148,0.05)', border: '1px solid rgba(0,255,148,0.22)' }}
                >
                  <Zap className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0,255,148,1)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-bold" style={{ color: 'rgba(0,255,148,1)' }}>
                      UNLOCK PRO — $9 lifetime
                    </div>
                    <div className="text-[10px] font-mono mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Unlimited wallets · Whale Intel · CSV Export
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: 'rgba(0,255,148,0.8)' }}>→</span>
                </button>
              )}
              <WalletTable
                wallets={filteredWallets} selectedWalletId={selectedWalletId}
                onSelectWallet={handleSelectWallet} compact walletIntelMap={walletIntelMap}
              />
              <div className="border-t mt-2 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <ActivityFeed
                  events={filteredEvents} selectedWallet={selectedWallet}
                  selectedWalletTokens={selectedWalletTokens} embedded
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="flex-shrink-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <MobileBottomNav activeTab={mobileTab} onTabChange={setMobileTab} />
        </div>

        {modals}
      </div>
    )
  }

  // ── TABLET ──────────────────────────────────────────────────────────────
  if (isTablet) {
    return (
      <div className="scanline-overlay noise-bg flex h-screen overflow-hidden bg-background">
        <div className="flex flex-col border-r border-border">
          <Logo />
          <AddBtn />
          <WalletSidebar
            wallets={filteredWallets} selectedWalletId={selectedWalletId}
            activeFilter={activeFilter} searchQuery={searchQuery}
            onSelectWallet={handleSelectWallet} onFilterChange={setActiveFilter}
            onSearchChange={setSearchQuery}
          />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <StatsBar />
          <WalletTable
            wallets={filteredWallets} selectedWalletId={selectedWalletId}
            onSelectWallet={handleSelectWallet} walletIntelMap={walletIntelMap}
          />
          <button
            onClick={() => setFeedDrawerOpen(true)}
            className="fixed bottom-4 right-4 z-40 bg-neon/15 border border-neon/40 text-neon text-xs px-4 py-2 rounded-full hover:bg-neon/25 transition-colors font-mono"
          >
            Intel ↑
          </button>
        </div>
        <Sheet open={feedDrawerOpen} onOpenChange={setFeedDrawerOpen}>
          <SheetContent side="bottom" className="h-[75vh] p-0 bg-card border-t border-border">
            <SheetTitle className="sr-only">Wallet Intelligence</SheetTitle>
            <WalletIntelPanel
              events={filteredEvents} selectedWallet={selectedWallet}
              selectedWalletTokens={selectedWalletTokens} selectedWalletIntel={selectedWalletIntel}
              leaderboard={leaderboard} clusters={clusters}
            />
          </SheetContent>
        </Sheet>
        {modals}
      </div>
    )
  }

  // ── DESKTOP ──────────────────────────────────────────────────────────────
  return (
    <div className="scanline-overlay noise-bg flex h-screen overflow-hidden bg-background">
      <div className="flex flex-col border-r border-border">
        <Logo />
        <AddBtn />
        <WalletSidebar
          wallets={filteredWallets} selectedWalletId={selectedWalletId}
          activeFilter={activeFilter} searchQuery={searchQuery}
          onSelectWallet={handleSelectWallet} onFilterChange={setActiveFilter}
          onSearchChange={setSearchQuery}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <StatsBar />
        <WalletTable
          wallets={filteredWallets} selectedWalletId={selectedWalletId}
          onSelectWallet={handleSelectWallet} walletIntelMap={walletIntelMap}
        />
      </div>
      <WalletIntelPanel
        events={filteredEvents} selectedWallet={selectedWallet}
        selectedWalletTokens={selectedWalletTokens} selectedWalletIntel={selectedWalletIntel}
        leaderboard={leaderboard} clusters={clusters}
      />
      {modals}
    </div>
  )
}

export default Index
