/**
 * ZERØ WATCH — Index v23
 * ========================
 * v17 FULL RESPONSIVE:
 * - Desktop: 3-panel split (sidebar 272px | main flex | intel 340px)
 * - Tablet (768-1024px): 2-panel (sidebar | main) + intel bottom sheet
 * - Mobile (<768px): tabs (wallets | intel | stats) + bottom nav
 * - DyorBanner: sticky bottom semua device
 * - UnknownWhaleCard: di main content area semua device
 * - Safe area inset: iOS notch support
 *
 * rgba() only ✓  React.memo ✓  useCallback/useMemo ✓
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
import UnknownWhaleCard            from '@/components/dashboard/UnknownWhaleCard'
import { AddWalletModal }          from '@/components/AddWalletModal'
import { UpgradeModal }            from '@/components/UpgradeModal'
import { ExportModal }             from '@/components/ExportModal'
import DyorBanner                  from '@/components/DyorBanner'
import Footer                       from '@/components/Footer'
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
import { useWhaleAlerts }          from '@/hooks/useWhaleAlerts'
import WhaleAlertToggle            from '@/components/WhaleAlertToggle'
import { TelegramSetupModal }      from '@/components/TelegramSetupModal'
import { useTelegramAlert }        from '@/hooks/useTelegramAlert'
import { usePriceAlert }           from '@/hooks/usePriceAlert'
import { Send }                    from 'lucide-react'

type MobileTab = 'wallets' | 'intel' | 'stats' | 'radar'

// ── UI data mappers ──────────────────────────────────────────────────────────

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
    txNew:    txs.filter(t => (Date.now() / 1000 - parseInt(t.timeStamp)) < 3600).length,
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

// ── Hero Screen ───────────────────────────────────────────────────────────────

const HeroScreen = memo(({ onAdd, onUpgrade }: { onAdd: () => void; onUpgrade: () => void }) => {
  const signals = [
    { label: 'ACCUMULATING', addr: '0xd8dA...6045', val: '$2.1M', color: 'rgba(52,211,153,1)',  Icon: TrendingUp  },
    { label: 'DISTRIBUTING', addr: '0xBE0e...33E8', val: '$8.4M', color: 'rgba(239,68,68,1)',   Icon: TrendingDown },
    { label: 'HUNTING',      addr: '0x28C6...d60',  val: '$440K', color: 'rgba(251,191,36,1)',  Icon: Activity    },
  ]

  return (
    <div
      style={{
        height:          '100dvh',
        background:      'rgba(4,4,10,1)',
        paddingTop:      'env(safe-area-inset-top, 0px)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             '32px',
        padding:         '24px',
        position:        'relative',
        overflow:        'hidden',
      }}
    >
      {/* Grid bg */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(230,161,71,0.010) 1px, transparent 1px), linear-gradient(90deg, rgba(230,161,71,0.010) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      {/* Top bloom */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '280px', background: 'radial-gradient(ellipse at top, rgba(230,161,71,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="animate-fade-up" style={{ zIndex: 1 }}>
        <Logo compact />
      </div>

      <div className="animate-fade-up" style={{ textAlign: 'center', zIndex: 1, animationDelay: '0.08s' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '99px', background: 'rgba(230,161,71,0.06)', border: '1px solid rgba(230,161,71,0.18)', marginBottom: '12px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(230,161,71,1)', boxShadow: '0 0 6px rgba(230,161,71,0.8)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(230,161,71,0.8)' }}>LIVE SURVEILLANCE ACTIVE</span>
        </div>

        <h1 style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 'clamp(20px,5vw,32px)', color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, marginBottom: '12px' }}>
          They move first.<br />
          <span style={{ color: 'rgba(230,161,71,1)' }}>You watch.</span>
        </h1>

        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto' }}>
          Track whale wallets in real-time. See accumulation, distribution, and big moves before CT does.
        </p>
      </div>

      <div className="animate-fade-up" style={{ width: '100%', maxWidth: '360px', zIndex: 1, animationDelay: '0.14s' }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)', marginBottom: '10px' }}>
          LIVE SIGNALS — SAMPLE DATA
        </div>
        {signals.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', background: `rgba(${s.label === 'ACCUMULATING' ? '52,211,153' : s.label === 'DISTRIBUTING' ? '239,68,68' : '251,191,36'},0.05)`, border: `1px solid ${s.color.replace(',1)', ',0.18)')}`, marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, boxShadow: `0 0 5px ${s.color}`, animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: s.color }}>{s.label}</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{s.addr}</span>
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{s.val}</span>
          </div>
        ))}
      </div>

      <div className="animate-fade-up" style={{ width: '100%', maxWidth: '360px', zIndex: 1, animationDelay: '0.28s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onAdd}
          style={{ width: '100%', padding: '14px', borderRadius: '14px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', background: 'rgba(230,161,71,1)', color: 'rgba(2,10,6,1)', boxShadow: '0 0 28px rgba(230,161,71,0.25), 0 4px 16px rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 36px rgba(230,161,71,0.35), 0 6px 20px rgba(0,0,0,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(230,161,71,0.25), 0 4px 16px rgba(0,0,0,0.4)' }}
        >
          START WATCHING WHALES
        </button>
        <button
          onClick={onUpgrade}
          style={{ width: '100%', padding: '12px', borderRadius: '14px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', letterSpacing: '0.06em', background: 'rgba(230,161,71,0.05)', border: '1px solid rgba(230,161,71,0.2)', color: 'rgba(230,161,71,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(230,161,71,0.4)'; e.currentTarget.style.color = 'rgba(230,161,71,1)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(230,161,71,0.2)'; e.currentTarget.style.color = 'rgba(230,161,71,0.7)' }}
        >
          <Zap style={{ width: '14px', height: '14px' }} />
          UNLOCK PRO — $9 lifetime
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          {[
            { Icon: Shield, text: 'Read-only. No wallet connect.' },
            { Icon: Eye,    text: 'Anonymous. No signup.' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <f.Icon style={{ width: '11px', height: '11px', color: 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
HeroScreen.displayName = 'HeroScreen'

// ── Mobile Header ─────────────────────────────────────────────────────────────

interface MobileHeaderProps {
  isProActive: boolean
  isFetching:  boolean
  isError:     boolean
  onExport:    () => void
  onUpgrade:   () => void
  onAdd:       () => void
  alerts:      import('@/hooks/useWhaleAlerts').WhaleAlertsState
}

const MobileHeader = memo(({ isProActive, isFetching, isError, onExport, onUpgrade, onAdd, alerts }: MobileHeaderProps) => (
  <div
    className="flex-shrink-0"
    style={{
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      paddingTop:      'calc(env(safe-area-inset-top, 0px) + 10px)',
      paddingBottom:   '10px',
      paddingLeft:     '16px',
      paddingRight:    '16px',
      background:      'rgba(4,4,10,0.96)',
      backdropFilter:  'blur(16px)',
      position:        'relative',
    }}
  >
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(230,161,71,0.18) 40%, rgba(230,161,71,0.08) 70%, transparent)' }} />

    {/* Logo */}
    <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <rect x="1" y="1" width="26" height="26" rx="3" stroke="rgba(230,161,71,1)" strokeWidth="2" fill="rgba(230,161,71,0.06)" />
        <polyline points="5,7 13,7 5,14 13,14" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="15" y1="6" x2="15" y2="22" stroke="rgba(230,161,71,1)" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
        <line x1="17" y1="7" x2="17" y2="21" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17,7 Q23,7 23,10.5 Q23,14 17,14" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M17,14 Q24,14 24,17.5 Q24,21 17,21" stroke="rgba(230,161,71,1)" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <polyline points="5,16 5,22 12,22" stroke="rgba(230,161,71,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '15px', lineHeight: 1 }}>
        ZER<span style={{ color: 'rgba(230,161,71,1)' }}>Ø</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.14em', marginLeft: '4px', fontWeight: 400 }}>WATCH</span>
      </span>
    </div>

    {/* Right actions */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Live dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '99px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isFetching ? 'rgba(251,191,36,1)' : isError ? 'rgba(239,68,68,1)' : 'rgba(230,161,71,1)', boxShadow: isFetching ? '0 0 4px rgba(251,191,36,0.8)' : isError ? '0 0 4px rgba(239,68,68,0.8)' : '0 0 4px rgba(230,161,71,0.8)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', letterSpacing: '0.10em', color: isFetching ? 'rgba(251,191,36,0.8)' : isError ? 'rgba(239,68,68,0.7)' : 'rgba(230,161,71,0.75)' }}>
          {isFetching ? 'SYNC' : isError ? 'ERR' : 'LIVE'}
        </span>
      </div>

      {/* PRO / CSV */}
      {isProActive ? (
        <button onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', background: 'rgba(230,161,71,0.06)', border: '1px solid rgba(230,161,71,0.25)', color: 'rgba(230,161,71,0.9)', cursor: 'pointer' }}>
          <Download style={{ width: '12px', height: '12px' }} />
          CSV
        </button>
      ) : (
        <button onClick={onUpgrade} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '10px', background: 'rgba(230,161,71,0.12)', border: '1px solid rgba(230,161,71,0.40)', color: 'rgba(230,161,71,1)', cursor: 'pointer', letterSpacing: '0.04em', boxShadow: '0 0 14px rgba(230,161,71,0.18)' }}>
          <Zap style={{ width: '12px', height: '12px' }} />
          PRO $9
        </button>
      )}

      <WhaleAlertToggle alerts={alerts} compact />

      <button onClick={onAdd} style={{ padding: '6px 12px', borderRadius: '99px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer' }}>
        + ADD
      </button>
    </div>
  </div>
))
MobileHeader.displayName = 'MobileHeader'

// ── Desktop/Tablet AddBtn ─────────────────────────────────────────────────────

interface AddBtnProps {
  onAdd: () => void; onExport: () => void; onUpgrade: () => void; onTgSetup: () => void
  isProActive: boolean; isFetching: boolean; isError: boolean
  alerts: import('@/hooks/useWhaleAlerts').WhaleAlertsState
  tgEnabled: boolean
}

const AddBtn = memo(({ onAdd, onExport, onUpgrade, onTgSetup, isProActive, isFetching, isError, alerts, tgEnabled }: AddBtnProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px 12px' }}>
    <button
      onClick={onAdd}
      style={{ flex: 1, padding: '8px 0', borderRadius: '10px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, fontSize: '11px', letterSpacing: '0.06em', background: 'rgba(230,161,71,0.08)', border: '1px solid rgba(230,161,71,0.25)', color: 'rgba(230,161,71,0.9)', cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,161,71,0.14)'; e.currentTarget.style.borderColor = 'rgba(230,161,71,0.40)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(230,161,71,0.08)'; e.currentTarget.style.borderColor = 'rgba(230,161,71,0.25)' }}
    >
      + ADD WALLET
    </button>
    <WhaleAlertToggle alerts={alerts} compact />
    <button
      onClick={onTgSetup}
      title="Telegram Alerts"
      style={{ padding: '8px 10px', borderRadius: '10px', background: tgEnabled ? 'rgba(0,136,204,0.12)' : 'rgba(255,255,255,0.04)', border: tgEnabled ? '1px solid rgba(0,136,204,0.30)' : '1px solid rgba(255,255,255,0.08)', color: tgEnabled ? 'rgba(100,181,246,0.9)' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.15s', boxShadow: tgEnabled ? '0 0 10px rgba(0,136,204,0.15)' : 'none' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,136,204,0.40)'; e.currentTarget.style.color = 'rgba(100,181,246,1)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = tgEnabled ? 'rgba(0,136,204,0.30)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = tgEnabled ? 'rgba(100,181,246,0.9)' : 'rgba(255,255,255,0.35)' }}
    >
      <Send style={{ width: '14px', height: '14px' }} />
    </button>
    {isProActive ? (
      <button onClick={onExport} style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(230,161,71,0.7)', cursor: 'pointer', transition: 'border-color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(230,161,71,0.25)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
      >
        <Download style={{ width: '14px', height: '14px' }} />
      </button>
    ) : (
      <button onClick={onUpgrade} style={{ padding: '8px 10px', borderRadius: '10px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '11px', letterSpacing: '0.04em', background: 'rgba(230,161,71,0.06)', border: '1px solid rgba(230,161,71,0.20)', color: 'rgba(230,161,71,0.8)', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,161,71,0.12)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(230,161,71,0.06)' }}
      >
        PRO
      </button>
    )}
    {isFetching && <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.2)', animation: 'pulse-glow 1.5s ease-in-out infinite' }}>⟳</span>}
    {isError    && <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(239,68,68,0.7)' }} title="API error — retrying">!</span>}
  </div>
))
AddBtn.displayName = 'AddBtn'

// ── Main Index ────────────────────────────────────────────────────────────────

const Index = () => {
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter]         = useState('ALL')
  const [searchQuery, setSearchQuery]           = useState('')
  const [mobileTab, setMobileTab]               = useState<MobileTab>('wallets')
  const [feedDrawerOpen, setFeedDrawerOpen]     = useState(false)
  const [addOpen, setAddOpen]                   = useState(false)
  const [upgradeOpen, setUpgradeOpen]           = useState(false)
  const [exportOpen, setExportOpen]             = useState(false)
  const [tgOpen, setTgOpen]                     = useState(false)

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const storeWallets = useWalletStore(selectWallets)
  const isProActive  = useWalletStore(s => s.isProActive())
  const seedDefaults = useWalletStore(s => s.seedDefaultWallets)
  const seeded       = useWalletStore(s => s._seeded)

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
  // Parse balance string → number for sorting
  const parseBalanceNum = useCallback((balance: string): number => {
    if (!balance) return 0
    const s = balance.replace(/[$,]/g, '')
    if (s.includes('B')) return parseFloat(s) * 1_000_000_000
    if (s.includes('M')) return parseFloat(s) * 1_000_000
    if (s.includes('K')) return parseFloat(s) * 1_000
    const n = parseFloat(s)
    return isNaN(n) ? 0 : n
  }, [])

  // Hitung berapa wallet yang udah loaded (non-zero atau punya lastMove)
  const loadedCount = useMemo(
    () => allWallets.filter(w => parseBalanceNum(w.balance) > 0 || w.lastMove !== '—').length,
    [allWallets, parseBalanceNum]
  )
  // Lock: hanya sort kalau udah 80%+ loaded — hindari loncat-loncat
  const sortReady = loadedCount >= Math.floor(storeWallets.length * 0.8)

  const filteredWallets = useMemo(() => {
    const filtered = allWallets.filter(w => {
      const matchFilter = activeFilter === 'ALL' || w.tag === activeFilter
      const matchSearch = !searchQuery
        || w.label.toLowerCase().includes(searchQuery.toLowerCase())
        || w.address.toLowerCase().includes(searchQuery.toLowerCase())
      return matchFilter && matchSearch
    })
    // Kalau belum 80% loaded, jangan sort — biarkan urutan default
    if (!sortReady) return filtered
    return [...filtered].sort((a, b) => parseBalanceNum(b.balance) - parseBalanceNum(a.balance))
  }, [allWallets, activeFilter, searchQuery, parseBalanceNum, sortReady])

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

  const walletLabels = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    storeWallets.forEach(w => { m[w.id] = w.label })
    return m
  }, [storeWallets])

  const tgAlert      = useTelegramAlert()
  const whaleAlerts  = useWhaleAlerts(walletIntelMap, walletLabels, tgAlert.sendAlert)
  const { config: priceAlertCfg, setConfig: setPriceAlertCfg } = usePriceAlert(
    ethPrice ?? null,
    (msg) => {
      tgAlert.sendAlert(msg)
      // Also Web Notification
      if (whaleAlerts.permission === 'granted') {
        new Notification('ZERØ WATCH Price Alert', { body: msg.replace(/<[^>]+>/g,''), icon: '/icon-192.png' })
      }
    }
  )

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

  // Common modals
  const modals = (
    <>
      <AddWalletModal      open={addOpen}     onClose={() => setAddOpen(false)}     onUpgrade={() => setUpgradeOpen(true)} />
      <UpgradeModal        open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ExportModal         open={exportOpen}  onClose={() => setExportOpen(false)} />
      <TelegramSetupModal  open={tgOpen}      onClose={() => setTgOpen(false)} tg={tgAlert} />
    </>
  )

  // Loading
  if (!seeded) {
    return (
      <div style={{ height: '100dvh', background: 'rgba(4,4,10,1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(230,161,71,0.8)', boxShadow: '0 0 8px rgba(230,161,71,0.6)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(230,161,71,0.5)' }}>INITIALIZING...</span>
        </div>
      </div>
    )
  }

  // Hero
  if (storeWallets.length === 0) {
    return (
      <>
        <HeroScreen onAdd={() => setAddOpen(true)} onUpgrade={() => setUpgradeOpen(true)} />
        {modals}
      </>
    )
  }

  // ── MOBILE (<768px) ───────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div
        className="scanline-overlay noise-bg mesh-bg grid-overlay"
        style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(4,4,10,1)' }}
      >
        <MobileHeader
          isProActive={isProActive} isFetching={isFetching} isError={!!isError}
          onExport={handleExportClick} onUpgrade={() => setUpgradeOpen(true)}
          onAdd={() => setAddOpen(true)} alerts={whaleAlerts}
        />

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {mobileTab === 'wallets' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-up">
              <UnknownWhaleCard mobile />
              <WalletSidebar
                wallets={filteredWallets} selectedWalletId={selectedWalletId}
                activeFilter={activeFilter} searchQuery={searchQuery}
                onSelectWallet={handleSelectWallet} onFilterChange={setActiveFilter}
                onSearchChange={setSearchQuery} mobile
              />
            </div>
          )}

          {mobileTab === 'intel' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-up">
              <WalletIntelPanel
                events={filteredEvents} selectedWallet={selectedWallet}
                selectedWalletTokens={selectedWalletTokens} selectedWalletIntel={selectedWalletIntel}
                leaderboard={leaderboard} clusters={clusters}
              />
            </div>
          )}

          {mobileTab === 'radar' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="animate-fade-up">
              <WalletIntelPanel
                events={filteredEvents} selectedWallet={selectedWallet}
                selectedWalletTokens={selectedWalletTokens} selectedWalletIntel={selectedWalletIntel}
                leaderboard={leaderboard} clusters={clusters}
                defaultTab="RADAR"
              />
            </div>
          )}

          {mobileTab === 'stats' && (
            <div
              style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              className="animate-fade-up"
            >
              <StatsBar mobile />
              {!isProActive && (
                <button
                  onClick={() => setUpgradeOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: 'calc(100% - 24px)', margin: '8px 12px', padding: '12px 16px', borderRadius: '14px', background: 'rgba(230,161,71,0.05)', border: '1px solid rgba(230,161,71,0.22)', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}
                  onTouchStart={e => { e.currentTarget.style.background = 'rgba(230,161,71,0.08)' }}
                  onTouchEnd={e => { e.currentTarget.style.background = 'rgba(230,161,71,0.05)' }}
                >
                  <Zap style={{ width: '16px', height: '16px', color: 'rgba(230,161,71,1)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 700, color: 'rgba(230,161,71,1)' }}>
                      UNLOCK PRO — $9 lifetime
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', marginTop: '2px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      Unlimited wallets · Whale Intel · CSV Export
                    </div>
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 700, color: 'rgba(230,161,71,0.8)', flexShrink: 0 }}>→</span>
                </button>
              )}
              <WalletTable
                wallets={filteredWallets} selectedWalletId={selectedWalletId}
                onSelectWallet={handleSelectWallet} compact walletIntelMap={walletIntelMap}
              />
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px' }}>
                <ActivityFeed
                  events={filteredEvents} selectedWallet={selectedWallet}
                  selectedWalletTokens={selectedWalletTokens} embedded
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav + safe area */}
        <MobileBottomNav
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          hasAlert={whaleAlerts.alertCount > 0}
          hasRadarAlert={false}
        />

        <DyorBanner />
        {modals}
      </div>
    )
  }

  // ── TABLET (768-1024px) ───────────────────────────────────────────────────

  if (isTablet) {
    return (
      <div
        className="scanline-overlay noise-bg mesh-bg grid-overlay"
        style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(4,4,10,1)' }}
      >
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {/* Left sidebar — compressed for tablet */}
          <div
            style={{ width: '240px', minWidth: '240px', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.065)' }}
          >
            <Logo />
            <AddBtn
              onAdd={() => setAddOpen(true)} onExport={handleExportClick}
              onUpgrade={() => setUpgradeOpen(true)} isProActive={isProActive}
              isFetching={isFetching} isError={!!isError} alerts={whaleAlerts}
            />
            <WalletSidebar
              wallets={filteredWallets} selectedWalletId={selectedWalletId}
              activeFilter={activeFilter} searchQuery={searchQuery}
              onSelectWallet={handleSelectWallet} onFilterChange={setActiveFilter}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <StatsBar />
            <UnknownWhaleCard />
            <WalletTable
              wallets={filteredWallets} selectedWalletId={selectedWalletId}
              onSelectWallet={handleSelectWallet} walletIntelMap={walletIntelMap}
            />
          </div>
        </div>

        {/* Intel bottom sheet trigger */}
        <button
          onClick={() => setFeedDrawerOpen(true)}
          style={{ position: 'fixed', bottom: '56px', right: '16px', zIndex: 40, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '99px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, background: 'rgba(230,161,71,0.12)', border: '1px solid rgba(230,161,71,0.35)', color: 'rgba(230,161,71,1)', cursor: 'pointer', boxShadow: '0 0 16px rgba(230,161,71,0.15)', letterSpacing: '0.04em' }}
        >
          Intel ↑
        </button>

        <Sheet open={feedDrawerOpen} onOpenChange={setFeedDrawerOpen}>
          <SheetContent side="bottom" style={{ height: '75dvh', padding: 0, background: 'rgba(6,6,14,1)', borderTop: '1px solid rgba(255,255,255,0.065)' }}>
            <SheetTitle className="sr-only">Wallet Intelligence</SheetTitle>
            <WalletIntelPanel
              events={filteredEvents} selectedWallet={selectedWallet}
              selectedWalletTokens={selectedWalletTokens} selectedWalletIntel={selectedWalletIntel}
              leaderboard={leaderboard} clusters={clusters}
            />
          </SheetContent>
        </Sheet>

        <DyorBanner />
        {modals}
      </div>
    )
  }

  // ── DESKTOP (>1024px) ─────────────────────────────────────────────────────

  return (
    <div
      className="scanline-overlay noise-bg mesh-bg grid-overlay"
      style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(4,4,10,1)' }}
    >
      {/* Main 3-panel layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left sidebar — 272px fixed */}
        <div
          style={{ width: '256px', minWidth: '256px', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.065)' }}
        >
          <Logo />
          <AddBtn
            onAdd={() => setAddOpen(true)} onExport={handleExportClick}
            onUpgrade={() => setUpgradeOpen(true)} onTgSetup={() => setTgOpen(true)}
            isProActive={isProActive} tgEnabled={tgAlert.enabled}
            isFetching={isFetching} isError={!!isError} alerts={whaleAlerts}
          />
          <WalletSidebar
            wallets={filteredWallets} selectedWalletId={selectedWalletId}
            activeFilter={activeFilter} searchQuery={searchQuery}
            onSelectWallet={handleSelectWallet} onFilterChange={setActiveFilter}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Main content — flex 1 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <StatsBar />
          <UnknownWhaleCard />
          <WalletTable
            wallets={filteredWallets} selectedWalletId={selectedWalletId}
            onSelectWallet={handleSelectWallet} walletIntelMap={walletIntelMap}
          />
        </div>

        {/* Right intel panel — 340px fixed */}
        <WalletIntelPanel
          events={filteredEvents} selectedWallet={selectedWallet}
          selectedWalletTokens={selectedWalletTokens} selectedWalletIntel={selectedWalletIntel}
          leaderboard={leaderboard} clusters={clusters}
        />
      </div>

      {/* DYOR Banner — sticky bottom */}
      <Footer />
      <DyorBanner />
      {modals}
    </div>
  )
}

export default Index
