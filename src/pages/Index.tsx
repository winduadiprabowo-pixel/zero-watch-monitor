/**
 * ZERØ WATCH — Index v28
 * ========================
 * v28: Arkham-style desktop layout
 *      - Desktop: 64px icon-only navbar kiri + full-width table + intel panel di bawah table
 *      - DesktopIconNav: icon-only vertical navbar, wallet list sebagai slide-over overlay
 *      - WalletIntelPanel: expand di bawah table saat wallet dipilih (bukan fixed kanan)
 *      - Tablet: tetap 2-panel (sidebar 240px | main) + intel bottom sheet
 *      - Mobile: unchanged
 * v27: Cross-Chain Correlation — useCrossChainCorrelation hook
 * v25: WhaleTicker — live scrolling alert banner
 *
 * rgba() only ✓  React.memo ✓  useCallback/useMemo ✓
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import React, { memo }             from 'react'
import Logo                        from '@/components/dashboard/Logo'
import WalletSidebar               from '@/components/dashboard/WalletSidebar'
import StatsBar                    from '@/components/dashboard/StatsBar'
import WalletTable, { EntityGroup } from '@/components/dashboard/WalletTable'
import ActivityFeed                from '@/components/dashboard/ActivityFeed'
import WalletIntelPanel            from '@/components/dashboard/WalletIntelPanel'
import LiveFeedView                from '@/components/dashboard/LiveFeedView'
import MobileBottomNav             from '@/components/dashboard/MobileBottomNav'
import MobileMenuOverlay           from '@/components/dashboard/MobileMenuOverlay'
import WhaleTicker                from '@/components/dashboard/WhaleTicker'
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
import { Download, Zap, Eye, TrendingUp, TrendingDown, Activity, Shield, Search, Bell, Users, BarChart2, Plus, ChevronDown, ChevronUp, X, Menu } from 'lucide-react'
import { useWhaleAlerts }          from '@/hooks/useWhaleAlerts'
import WhaleAlertToggle            from '@/components/WhaleAlertToggle'
import { TelegramSetupModal }      from '@/components/TelegramSetupModal'
import { useTelegramAlert }        from '@/hooks/useTelegramAlert'
import { usePriceAlert }           from '@/hooks/usePriceAlert'
import { useCrossChainCorrelation } from '@/hooks/useCrossChainCorrelation'
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
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000)         return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    if (n > 0)              return `$${n.toFixed(2)}`
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
    logo:     (storeWallet as typeof storeWallet & { logo?: string }).logo,
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
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.010) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.010) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      {/* Top bloom */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '280px', background: 'radial-gradient(ellipse at top, rgba(0, 212, 255, 0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="animate-fade-up" style={{ zIndex: 1 }}>
        <Logo compact />
      </div>

      <div className="animate-fade-up" style={{ textAlign: 'center', zIndex: 1, animationDelay: '0.08s' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '99px', background: 'rgba(0, 212, 255, 0.06)', border: '1px solid rgba(0, 212, 255, 0.18)', marginBottom: '12px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(0, 212, 255, 1)', boxShadow: '0 0 6px rgba(0, 212, 255, 0.8)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(0, 212, 255, 0.8)' }}>LIVE SURVEILLANCE ACTIVE</span>
        </div>

        <h1 style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 'clamp(20px,5vw,32px)', color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, marginBottom: '12px' }}>
          They move first.<br />
          <span style={{ color: 'rgba(0, 212, 255, 1)' }}>You watch.</span>
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
          style={{ width: '100%', padding: '14px', borderRadius: '14px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', background: 'rgba(0, 212, 255, 1)', color: 'rgba(2,10,6,1)', boxShadow: '0 0 28px rgba(0, 212, 255, 0.25), 0 4px 16px rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 36px rgba(0, 212, 255, 0.35), 0 6px 20px rgba(0,0,0,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(0, 212, 255, 0.25), 0 4px 16px rgba(0,0,0,0.4)' }}
        >
          START WATCHING WHALES
        </button>
        <button
          onClick={onUpgrade}
          style={{ width: '100%', padding: '12px', borderRadius: '14px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', letterSpacing: '0.06em', background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.2)', color: 'rgba(0, 212, 255, 0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)'; e.currentTarget.style.color = 'rgba(0, 212, 255, 1)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'; e.currentTarget.style.color = 'rgba(0, 212, 255, 0.7)' }}
        >
          <Zap style={{ width: '14px', height: '14px' }} />
          UNLOCK PRO — $12/mo
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
  onMenu:      () => void
  alerts:      import('@/hooks/useWhaleAlerts').WhaleAlertsState
}

const MobileHeader = memo(({ isProActive, isFetching, isError, onExport, onUpgrade, onAdd, onMenu, alerts }: MobileHeaderProps) => (
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
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.18) 40%, rgba(0, 212, 255, 0.08) 70%, transparent)' }} />

    {/* Hamburger + Logo */}
    <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button
        onClick={onMenu}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
      >
        <Menu style={{ width: '20px', height: '20px' }} />
      </button>
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <rect x="1" y="1" width="26" height="26" rx="3" stroke="rgba(0, 212, 255, 1)" strokeWidth="2" fill="rgba(0, 212, 255, 0.06)" />
        <polyline points="5,7 13,7 5,14 13,14" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="15" y1="6" x2="15" y2="22" stroke="rgba(0, 212, 255, 1)" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
        <line x1="17" y1="7" x2="17" y2="21" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17,7 Q23,7 23,10.5 Q23,14 17,14" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M17,14 Q24,14 24,17.5 Q24,21 17,21" stroke="rgba(0, 212, 255, 1)" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <polyline points="5,16 5,22 12,22" stroke="rgba(0, 212, 255, 1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '15px', lineHeight: 1 }}>
        ZER<span style={{ color: 'rgba(0, 212, 255, 1)' }}>Ø</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.14em', marginLeft: '4px', fontWeight: 400 }}>WATCH</span>
      </span>
    </div>

    {/* Right actions */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Live dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '99px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isFetching ? 'rgba(251,191,36,1)' : isError ? 'rgba(239,68,68,1)' : 'rgba(0, 212, 255, 1)', boxShadow: isFetching ? '0 0 4px rgba(251,191,36,0.8)' : isError ? '0 0 4px rgba(239,68,68,0.8)' : '0 0 4px rgba(0, 212, 255, 0.8)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', letterSpacing: '0.10em', color: isFetching ? 'rgba(251,191,36,0.8)' : isError ? 'rgba(239,68,68,0.7)' : 'rgba(0, 212, 255, 0.75)' }}>
          {isFetching ? 'SYNC' : isError ? 'ERR' : 'LIVE'}
        </span>
      </div>

      {/* PRO / CSV */}
      {isProActive ? (
        <button onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', background: 'rgba(0, 212, 255, 0.06)', border: '1px solid rgba(0, 212, 255, 0.25)', color: 'rgba(0, 212, 255, 0.9)', cursor: 'pointer' }}>
          <Download style={{ width: '12px', height: '12px' }} />
          CSV
        </button>
      ) : (
        <button onClick={onUpgrade} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '10px', background: 'rgba(0, 212, 255, 0.12)', border: '1px solid rgba(0, 212, 255, 0.40)', color: 'rgba(0, 212, 255, 1)', cursor: 'pointer', letterSpacing: '0.04em', boxShadow: '0 0 14px rgba(0, 212, 255, 0.18)' }}>
          <Zap style={{ width: '12px', height: '12px' }} />
          PRO $12/mo
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
      style={{ flex: 1, padding: '8px 0', borderRadius: '10px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, fontSize: '11px', letterSpacing: '0.06em', background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.25)', color: 'rgba(0, 212, 255, 0.9)', cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.14)'; e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.40)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.25)' }}
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
      <button onClick={onExport} style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(0, 212, 255, 0.7)', cursor: 'pointer', transition: 'border-color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.25)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
      >
        <Download style={{ width: '14px', height: '14px' }} />
      </button>
    ) : (
      <button onClick={onUpgrade} style={{ padding: '8px 10px', borderRadius: '10px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '11px', letterSpacing: '0.04em', background: 'rgba(0, 212, 255, 0.06)', border: '1px solid rgba(0, 212, 255, 0.20)', color: 'rgba(0, 212, 255, 0.8)', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.12)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.06)' }}
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
  const [menuOpen, setMenuOpen]                 = useState(false)

  // ── Desktop states — must be declared before any early returns ──────────
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [intelOpen,    setIntelOpen]    = useState(false)
  const [desktopView,  setDesktopView]  = useState<'feed' | 'table'>('feed')

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
  // Hitung berapa wallet yang udah loaded (non-zero atau punya lastMove)
  const loadedCount = useMemo(
    () => allWallets.filter(w => w.lastMove !== '—').length,
    [allWallets]
  )

  // walletIntelMap MUST come before activityScore and filteredWallets (TDZ fix)
  const walletIntelMap = useMemo<Record<string, WalletIntelligence>>(() => {
    const map: Record<string, WalletIntelligence> = {}
    storeWallets.forEach((w, i) => {
      const data = apiDataArr?.[i]
      if (data) map[w.id] = computeWalletIntel(data.transactions, w.address, ETH_PRICE)
    })
    return map
  }, [storeWallets, apiDataArr, ETH_PRICE])

  // activityScore MUST come before filteredWallets (TDZ fix)
  const activityScore = useCallback((w: ReturnType<typeof selectWallets>[number], apiData: typeof apiDataArr[number]) => {
    const storeW = storeWallets.find(sw => sw.id === w.id)
    if ((storeW as typeof storeW & { entity?: string })?.entity === 'Satoshi-Era')    return 9999
    if ((storeW as typeof storeW & { entity?: string })?.entity === 'Mt.Gox Trustee') return 9998
    if ((storeW as typeof storeW & { entity?: string })?.entity === 'FTX Estate')     return 9997
    const txs    = apiData?.transactions ?? []
    const intel  = walletIntelMap[w.id]
    const status = intel?.whaleScore?.status ?? 'DORMANT'
    const sigWeight: Record<string, number> = { DISTRIBUTING: 500, ACCUMULATING: 400, HUNTING: 300, DORMANT: 0 }
    let score = sigWeight[status] ?? 0
    const lastTs  = txs[0] ? parseInt(txs[0].timeStamp) : 0
    const ageSecs = Date.now() / 1000 - lastTs
    if (ageSecs < 3600) score += 200
    else if (ageSecs < 21600) score += 100
    else if (ageSecs < 86400) score += 50
    const usd = apiData?.balance.usdValue ?? 0
    if (usd >= 10_000_000) score += 150
    else if (usd >= 1_000_000) score += 100
    else if (usd >= 100_000) score += 50
    score += (intel?.whaleScore?.conviction ?? 0) * 0.5
    return score
  }, [storeWallets, walletIntelMap])

  const filteredWallets = useMemo(() => {
    const filtered = allWallets.filter(w => {
      const matchFilter = activeFilter === 'ALL' || w.tag === activeFilter
      const matchSearch = !searchQuery
        || w.label.toLowerCase().includes(searchQuery.toLowerCase())
        || w.address.toLowerCase().includes(searchQuery.toLowerCase())
      return matchFilter && matchSearch
    })
    return [...filtered].sort((a, b) => {
      const idxA  = storeWallets.findIndex(w => w.id === a.id)
      const idxB  = storeWallets.findIndex(w => w.id === b.id)
      const scoreA = activityScore(storeWallets[idxA], apiDataArr?.[idxA])
      const scoreB = activityScore(storeWallets[idxB], apiDataArr?.[idxB])
      return scoreB - scoreA
    })
  }, [allWallets, activeFilter, searchQuery, storeWallets, apiDataArr, activityScore])

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

  // Wallets that haven't received data yet → show shimmer instead of "0 ETH"
  const loadingIds = useMemo<Set<string>>(() => {
    const s = new Set<string>()
    storeWallets.forEach((w, i) => {
      if (!apiDataArr?.[i]) s.add(w.id)
    })
    return s
  }, [storeWallets, apiDataArr])

  // ── Entity Groups (Push 32) ────────────────────────────────────────────────
  // Group filteredWallets by entity field from storeWallets
  const entityGroups = useMemo<EntityGroup[]>(() => {
    type GroupAcc = {
      wallets:  typeof filteredWallets
      pinned:   boolean
    }
    const map: Record<string, GroupAcc> = {}

    filteredWallets.forEach(w => {
      const sw     = storeWallets.find(s => s.id === w.id)
      const entity = (sw as typeof sw & { entity?: string })?.entity ?? w.label
      const pin    = (sw as typeof sw & { pinned?: boolean })?.pinned ?? false

      if (!map[entity]) map[entity] = { wallets: [], pinned: false }
      map[entity].wallets.push(w)
      if (pin) map[entity].pinned = true
    })

    const SIGNAL_PRI: Record<string, number> = {
      DISTRIBUTING: 4, ACCUMULATING: 3, HUNTING: 2, DORMANT: 1,
    }
    const MOVE_PRI = (s: string) => {
      if (s.endsWith('s ago')) return 1
      if (s.endsWith('m ago')) return 2
      if (s.endsWith('h ago')) return 3
      if (s.endsWith('d ago')) return 4
      return 5
    }
    const PINNED_ORDER: Record<string, number> = {
      'Satoshi-Era': 0, 'Mt.Gox Trustee': 1, 'FTX Estate': 2,
    }

    const groups: EntityGroup[] = Object.entries(map).map(([entity, { wallets: gw, pinned }]) => {
      // Total USD
      const totalUsd = gw.reduce((sum, w) => {
        const idx = storeWallets.findIndex(s => s.id === w.id)
        const val = apiDataArr?.[idx]?.balance.usdValue ?? 0
        return sum + (isNaN(val) || !isFinite(val) ? 0 : val)
      }, 0)

      // Unique chains
      const chains = [...new Set(gw.map(w => w.chain))]

      // Active chains — wallets with txNew > 0 in last hour
      const activeChains = [...new Set(
        gw.filter(w => w.txNew > 0).map(w => w.chain)
      )]

      // Top signal
      type Sig = 'ACCUMULATING' | 'DISTRIBUTING' | 'HUNTING' | 'DORMANT'
      const topSignal = gw.reduce<Sig>((best, w) => {
        const sig = (walletIntelMap[w.id]?.whaleScore?.status ?? 'DORMANT') as Sig
        return (SIGNAL_PRI[sig] ?? 1) > (SIGNAL_PRI[best] ?? 1) ? sig : best
      }, 'DORMANT')

      // Max conviction
      const conviction = Math.max(0, ...gw.map(w => walletIntelMap[w.id]?.whaleScore?.conviction ?? 0))

      // Most recent lastMove
      const lastMove = gw.reduce((best, w) =>
        MOVE_PRI(w.lastMove ?? '—') < MOVE_PRI(best) ? (w.lastMove ?? '—') : best,
        '—'
      )

      return { entity, wallets: gw, totalUsd, chains, activeChains, topSignal, conviction, lastMove, pinned }
    })

    // Sort: pinned first (Satoshi > MtGox > FTX), then by totalUsd desc
    return groups.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      if (a.pinned && b.pinned) {
        return (PINNED_ORDER[a.entity] ?? 99) - (PINNED_ORDER[b.entity] ?? 99)
      }
      return b.totalUsd - a.totalUsd
    })
  }, [filteredWallets, storeWallets, apiDataArr, walletIntelMap])


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

  // ── Cross-Chain Correlation (Push 35) ─────────────────────────────────────
  // Inject SUN_TRON_BRIDGE events as PatternEvents → picked up by WhaleTicker + IntelPanel
  // onPatternEvent is provided by WalletIntelPanel via injectAnomaly (passed through props)
  // For now: fire TG alert directly when cross-chain event detected
  const handleCrossChainEvent = useCallback((patternEvent: import('@/hooks/usePatternRecognition').PatternEvent) => {
    // Send TG alert for cross-chain events — always critical
    if (tgAlert.enabled) {
      const msg =
        `🔴 <b>CROSS-CHAIN ALERT — ${patternEvent.title}</b>\n\n` +
        `${patternEvent.description}\n\n` +
        `🎯 Confidence: <b>${patternEvent.confidence}%</b>\n` +
        (patternEvent.historicalRef ? `📚 Historical: <i>${patternEvent.historicalRef}</i>\n\n` : '\n') +
        `<i>ZERØ WATCH · @ZerobuildLab 🇮🇩</i>`
      tgAlert.sendAlert(msg)
    }
    // Web notification
    if (whaleAlerts.permission === 'granted') {
      try {
        new Notification('ZERØ WATCH — Cross-Chain Alert', {
          body: patternEvent.description.slice(0, 120),
          icon: '/favicon.ico',
        })
      } catch { /* skip */ }
    }
  }, [tgAlert, whaleAlerts.permission])

  const crossChain = useCrossChainCorrelation(handleCrossChainEvent)

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
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.8)', boxShadow: '0 0 8px rgba(0, 212, 255, 0.6)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(0, 212, 255, 0.5)' }}>INITIALIZING...</span>
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
          onAdd={() => setAddOpen(true)} onMenu={() => setMenuOpen(true)} alerts={whaleAlerts}
        />
        <WhaleTicker />

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
              <StatsBar mobile alertCount={whaleAlerts.alertCount ?? 0} />
              {!isProActive && (
                <button
                  onClick={() => setUpgradeOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: 'calc(100% - 24px)', margin: '8px 12px', padding: '12px 16px', borderRadius: '14px', background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.22)', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s' }}
                  onTouchStart={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.08)' }}
                  onTouchEnd={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)' }}
                >
                  <Zap style={{ width: '16px', height: '16px', color: 'rgba(0, 212, 255, 1)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 700, color: 'rgba(0, 212, 255, 1)' }}>
                      UNLOCK PRO — $12/mo
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', marginTop: '2px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      Unlimited wallets · Whale Intel · CSV Export
                    </div>
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 700, color: 'rgba(0, 212, 255, 0.8)', flexShrink: 0 }}>→</span>
                </button>
              )}
              <WalletTable
                wallets={filteredWallets} selectedWalletId={selectedWalletId}
                onSelectWallet={handleSelectWallet} compact walletIntelMap={walletIntelMap}
                loadingIds={loadingIds} entityGroups={entityGroups}
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
          hasRadarAlert={crossChain.activeAlerts.length > 0}
        />

        <DyorBanner />
        <MobileMenuOverlay
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          isProActive={isProActive}
          tgEnabled={tgAlert.enabled}
          onAddWallet={() => setAddOpen(true)}
          onUpgrade={() => setUpgradeOpen(true)}
          onExport={handleExportClick}
          onTgSetup={() => setTgOpen(true)}
          onTabChange={setMobileTab}
        />
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
        <WhaleTicker />
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
            <StatsBar alertCount={whaleAlerts.alertCount ?? 0} />
            <UnknownWhaleCard />
            <WalletTable
              wallets={filteredWallets} selectedWalletId={selectedWalletId}
              onSelectWallet={handleSelectWallet} walletIntelMap={walletIntelMap}
              loadingIds={loadingIds} entityGroups={entityGroups}
            />
          </div>
        </div>

        {/* Intel bottom sheet trigger */}
        <button
          onClick={() => setFeedDrawerOpen(true)}
          style={{ position: 'fixed', bottom: '56px', right: '16px', zIndex: 40, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '99px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, background: 'rgba(0, 212, 255, 0.12)', border: '1px solid rgba(0, 212, 255, 0.35)', color: 'rgba(0, 212, 255, 1)', cursor: 'pointer', boxShadow: '0 0 16px rgba(0, 212, 255, 0.15)', letterSpacing: '0.04em' }}
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

  // ── DESKTOP (>1024px) — Arkham-style layout ──────────────────────────────
  // 64px icon-only navbar kiri + full-width main + intel panel di bawah table

  // Auto-open intel panel saat wallet dipilih
  const handleSelectWalletDesktop = useCallback((id: string) => {
    handleSelectWallet(id)
    setIntelOpen(true)
  }, [handleSelectWallet])

  // Close intel jika deselect
  const handleCloseIntel = useCallback(() => {
    setIntelOpen(false)
    setSelectedWalletId(null)
  }, [])

  // ESC key closes intel overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && intelOpen) handleCloseIntel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [intelOpen, handleCloseIntel])

  // Nav items untuk icon navbar
  const navItems = [
    { icon: Users,    label: 'Wallets',   action: () => setSidebarOpen(o => !o) },
    { icon: Bell,     label: 'Alerts',    action: () => whaleAlerts.permission !== 'granted' && whaleAlerts.requestPermission?.() },
    { icon: Send,     label: 'Telegram',  action: () => setTgOpen(true) },
    { icon: BarChart2,label: 'Intel',     action: () => setIntelOpen(o => !o) },
  ]

  return (
    <div
      className="scanline-overlay noise-bg mesh-bg grid-overlay"
      style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(4,4,10,1)' }}
    >
      <WhaleTicker />

      {/* Body: icon nav + main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── 64px Icon Navbar ─────────────────────────────────────────── */}
        <nav
          style={{
            width:         '64px',
            minWidth:      '64px',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            borderRight:   '1px solid rgba(255,255,255,0.065)',
            background:    'rgba(4,4,10,0.98)',
            paddingTop:    '8px',
            paddingBottom: '12px',
            gap:           '2px',
            zIndex:        30,
          }}
        >
          {/* Logo icon */}
          <div style={{ padding: '10px 0 14px', width: '100%', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.055)', marginBottom: '6px' }}>
            <img src="/icon-192.png" alt="ZERØ WATCH" style={{ width: 32, height: 32, borderRadius: 9 }} />
          </div>

          {/* Add wallet button */}
          <button
            onClick={() => setAddOpen(true)}
            title="Add Wallet"
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0, 212, 255, 0.10)', border: '1px solid rgba(0, 212, 255, 0.28)',
              color: 'rgba(0, 212, 255, 1)', cursor: 'pointer', transition: 'all 0.15s',
              marginBottom: '6px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.18)'; e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.50)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.10)'; e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.28)' }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
          </button>

          {/* Nav icons */}
          {navItems.map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              style={{
                width: '44px', height: '44px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: (label === 'Wallets' && sidebarOpen) || (label === 'Intel' && intelOpen)
                  ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: '1px solid transparent',
                color: (label === 'Wallets' && sidebarOpen) || (label === 'Intel' && intelOpen)
                  ? 'rgba(0, 212, 255, 0.9)' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={e => {
                const isActive = (label === 'Wallets' && sidebarOpen) || (label === 'Intel' && intelOpen)
                e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.07)' : 'transparent'
                e.currentTarget.style.color = isActive ? 'rgba(0, 212, 255, 0.9)' : 'rgba(255,255,255,0.35)'
              }}
            >
              <Icon style={{ width: '18px', height: '18px' }} />
            </button>
          ))}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Live status dot */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '4px' }}>
            <span
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isFetching ? 'rgba(251,191,36,1)' : isError ? 'rgba(239,68,68,1)' : 'rgba(52,211,153,1)',
                boxShadow:  isFetching ? '0 0 6px rgba(251,191,36,0.8)' : isError ? '0 0 6px rgba(239,68,68,0.8)' : '0 0 6px rgba(52,211,153,0.8)',
                animation:  'pulse-glow 2s ease-in-out infinite', display: 'inline-block',
              }}
            />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '7px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.2)', writingMode: 'vertical-rl' as const }}>
              {isFetching ? 'SYNC' : isError ? 'ERR' : 'LIVE'}
            </span>
          </div>

          {/* PRO / Export */}
          {isProActive ? (
            <button
              onClick={handleExportClick}
              title="Export CSV"
              style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid transparent', color: 'rgba(0, 212, 255, 0.5)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(0, 212, 255, 1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(0, 212, 255, 0.5)' }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
            </button>
          ) : (
            <button
              onClick={() => setUpgradeOpen(true)}
              title="Upgrade to PRO"
              style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.22)', color: 'rgba(0, 212, 255, 0.8)', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 0 10px rgba(0, 212, 255, 0.12)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.16)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.08)' }}
            >
              <Zap style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </nav>

        {/* ── Wallet Sidebar Overlay (slide-in dari kiri) ──────────────── */}
        {sidebarOpen && (
          <div
            style={{
              width: '240px', minWidth: '240px',
              display: 'flex', flexDirection: 'column',
              borderRight: '1px solid rgba(255,255,255,0.065)',
              background: 'rgba(5,5,12,0.98)',
              backdropFilter: 'blur(12px)',
              animation: 'slideInLeft 0.18s ease-out',
              zIndex: 20,
            }}
          >
            {/* Sidebar header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.3)' }}>WALLETS</span>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
            <WalletSidebar
              wallets={filteredWallets} selectedWalletId={selectedWalletId}
              activeFilter={activeFilter} searchQuery={searchQuery}
              onSelectWallet={(id) => { handleSelectWalletDesktop(id); }}
              onFilterChange={setActiveFilter}
              onSearchChange={setSearchQuery}
            />
          </div>
        )}

        {/* ── Main Content — full width ─────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <StatsBar alertCount={whaleAlerts.alertCount ?? 0} />
          <UnknownWhaleCard />

          {/* View toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            background: 'rgba(4,4,10,0.6)',
          }}>
            {(['feed', 'table'] as const).map(v => (
              <button
                key={v}
                onClick={() => setDesktopView(v)}
                style={{
                  padding: '5px 14px', borderRadius: '8px', cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px',
                  letterSpacing: '0.12em', fontWeight: desktopView === v ? 700 : 400,
                  background: desktopView === v ? 'rgba(0, 212, 255, 0.10)' : 'transparent',
                  border: desktopView === v ? '1px solid rgba(0, 212, 255, 0.28)' : '1px solid transparent',
                  color: desktopView === v ? 'rgba(0, 212, 255, 1)' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.15s',
                }}
              >
                {v === 'feed' ? 'LIVE FEED' : 'WALLETS'}
              </button>
            ))}
          </div>

          {/* Scrollable area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {desktopView === 'feed' ? (
              <LiveFeedView
                events={allEvents}
                wallets={allWallets}
                onSelectWallet={handleSelectWalletDesktop}
              />
            ) : (
              <WalletTable
                wallets={filteredWallets} selectedWalletId={selectedWalletId}
                onSelectWallet={handleSelectWalletDesktop} walletIntelMap={walletIntelMap}
                loadingIds={loadingIds} entityGroups={entityGroups}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Intel Full Screen Overlay ─────────────────────────────────────── */}
      {intelOpen && (
        <div
          style={{
            position:   'fixed',
            inset:      0,
            zIndex:     100,
            background: 'rgba(2,2,8,0.92)',
            backdropFilter: 'blur(8px)',
            display:    'flex',
            flexDirection: 'column',
            animation:  'slideInUp 0.22s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {/* ── Header bar ── */}
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '14px 24px',
              borderBottom:   '1px solid rgba(255,255,255,0.07)',
              background:     'rgba(4,4,10,0.98)',
              flexShrink:     0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/icon-192.png" alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                  {selectedWallet ? selectedWallet.label : 'INTELLIGENCE'}
                </div>
                {selectedWallet && (
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    {selectedWallet.address} · {selectedWallet.chain} · {selectedWallet.tag}
                  </div>
                )}
              </div>
              {selectedWallet && (
                <div style={{
                  padding: '4px 10px', borderRadius: '8px',
                  background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.22)',
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 700,
                  color: 'rgba(0, 212, 255, 1)',
                }}>
                  {selectedWallet.balance}
                </div>
              )}
              {/* Live dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(52,211,153,1)', boxShadow: '0 0 5px rgba(52,211,153,0.8)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(52,211,153,0.8)' }}>LIVE</span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleCloseIntel}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <X style={{ width: '14px', height: '14px' }} />
              ESC
            </button>
          </div>

          {/* ── Intel Panel Content — full height ── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>
            <WalletIntelPanel
              events={filteredEvents} selectedWallet={selectedWallet}
              selectedWalletTokens={selectedWalletTokens} selectedWalletIntel={selectedWalletIntel}
              leaderboard={leaderboard} clusters={clusters}
            />
          </div>
        </div>
      )}

      <Footer />
      <DyorBanner />
      {modals}
    </div>
  )
}

export default Index
