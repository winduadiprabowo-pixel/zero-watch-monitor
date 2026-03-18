/**
 * ZERØ WATCH — MobileMenuOverlay v1
 * ====================================
 * Arkham-style full-screen slide menu dari kiri
 * - PLATFORM section: Wallets, Intel, Stats, RADAR, Alerts, TG
 * - GENERAL section: Upgrade PRO, Export CSV
 * - HELP section: About, Source
 * - Footer copyright
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useCallback, useEffect } from 'react'
import {
  X, Wallet, Brain, BarChart3, ScanLine,
  Bell, Send, Zap, Download, Info, Github,
  ChevronRight,
} from 'lucide-react'

interface MobileMenuOverlayProps {
  open:          boolean
  onClose:       () => void
  isProActive:   boolean
  tgEnabled:     boolean
  onAddWallet:   () => void
  onUpgrade:     () => void
  onExport:      () => void
  onTgSetup:     () => void
  onTabChange:   (tab: 'wallets' | 'intel' | 'stats' | 'radar') => void
}

// ── Menu Item ─────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon:      React.ReactNode
  label:     string
  badge?:    string
  badgeColor?: string
  arrow?:    boolean
  onClick:   () => void
}

const MenuItem = memo(({ icon, label, badge, badgeColor, arrow, onClick }: MenuItemProps) => (
  <button
    onClick={onClick}
    style={{
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      width:           '100%',
      padding:         '13px 0',
      background:      'none',
      border:          'none',
      cursor:          'pointer',
      color:           'rgba(255,255,255,0.85)',
      transition:      'color 0.15s',
      WebkitTapHighlightColor: 'transparent',
    }}
    onTouchStart={e => { e.currentTarget.style.color = 'rgba(0, 212, 255, 1)' }}
    onTouchEnd={e   => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(0, 212, 255, 1)' }}
    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '14px', fontWeight: 400 }}>
        {label}
      </span>
      {badge && (
        <span style={{
          fontFamily:  "'IBM Plex Mono',monospace",
          fontSize:    '9px',
          fontWeight:  700,
          letterSpacing: '0.06em',
          padding:     '2px 6px',
          borderRadius: '4px',
          background:  badgeColor ?? 'rgba(52,211,153,0.15)',
          color:       badgeColor ? 'rgba(2,10,6,1)' : 'rgba(52,211,153,1)',
          border:      `1px solid ${badgeColor ? 'transparent' : 'rgba(52,211,153,0.3)'}`,
        }}>
          {badge}
        </span>
      )}
    </div>
    {arrow && (
      <ChevronRight style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.2)' }} />
    )}
  </button>
))
MenuItem.displayName = 'MenuItem'

// ── Section Label ─────────────────────────────────────────────────────────────

const SectionLabel = memo(({ label }: { label: string }) => (
  <div style={{
    fontFamily:    "'IBM Plex Mono',monospace",
    fontSize:      '9px',
    letterSpacing: '0.22em',
    color:         'rgba(255,255,255,0.25)',
    fontWeight:    500,
    paddingBottom: '4px',
    paddingTop:    '4px',
  }}>
    {label}
  </div>
))
SectionLabel.displayName = 'SectionLabel'

const Divider = () => (
  <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
)

// ── Main Component ────────────────────────────────────────────────────────────

const MobileMenuOverlay = memo(({
  open, onClose,
  isProActive, tgEnabled,
  onAddWallet, onUpgrade, onExport, onTgSetup, onTabChange,
}: MobileMenuOverlayProps) => {

  // Lock body scroll saat menu open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const go = useCallback((tab: 'wallets' | 'intel' | 'stats' | 'radar') => {
    onTabChange(tab)
    onClose()
  }, [onTabChange, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:      'absolute',
          top:           0,
          left:          0,
          bottom:        0,
          width:         '85%',
          maxWidth:      '320px',
          background:    'rgba(4,4,10,0.99)',
          display:       'flex',
          flexDirection: 'column',
          animation:     'slideInLeft 0.22s cubic-bezier(0.22,1,0.36,1) both',
          borderRight:   '1px solid rgba(255,255,255,0.07)',
          overflow:      'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px',
          borderBottom:   '1px solid rgba(255,255,255,0.07)',
          flexShrink:     0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/icon-192.png" alt="ZERØ WATCH" style={{ width: 32, height: 32, borderRadius: 9 }} />
            <div>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '16px', lineHeight: 1 }}>
                ZER<span style={{ color: 'rgba(0, 212, 255, 1)' }}>Ø</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.14em', marginLeft: '4px', fontWeight: 400 }}>WATCH</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <X style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

          {/* PLATFORM */}
          <div style={{ paddingTop: '16px' }}>
            <SectionLabel label="PLATFORM" />
            <MenuItem icon={<Wallet style={{ width: 16, height: 16 }} />}   label="Wallets"    onClick={() => go('wallets')} />
            <MenuItem icon={<Brain style={{ width: 16, height: 16 }} />}    label="Intel"      onClick={() => go('intel')} arrow />
            <MenuItem icon={<BarChart3 style={{ width: 16, height: 16 }} />} label="Stats"     onClick={() => go('stats')} />
            <MenuItem icon={<ScanLine style={{ width: 16, height: 16 }} />} label="RADAR"      badge="LIVE" onClick={() => go('radar')} />
            <MenuItem icon={<Bell style={{ width: 16, height: 16 }} />}     label="Alerts"     onClick={() => { onClose() }} arrow />
            <MenuItem
              icon={<Send style={{ width: 16, height: 16 }} />}
              label="Telegram"
              badge={tgEnabled ? 'ON' : undefined}
              badgeColor={tgEnabled ? 'rgba(52,211,153,1)' : undefined}
              onClick={() => { onTgSetup(); onClose() }}
              arrow
            />
            <MenuItem
              icon={<Wallet style={{ width: 16, height: 16 }} />}
              label="Add Wallet"
              onClick={() => { onAddWallet(); onClose() }}
            />
          </div>

          <Divider />

          {/* GENERAL */}
          <div style={{ paddingTop: '8px' }}>
            <SectionLabel label="GENERAL" />
            {isProActive ? (
              <MenuItem
                icon={<Download style={{ width: 16, height: 16 }} />}
                label="Export CSV"
                onClick={() => { onExport(); onClose() }}
              />
            ) : (
              <MenuItem
                icon={<Zap style={{ width: 16, height: 16 }} />}
                label="Upgrade to PRO"
                badge="$9"
                badgeColor="rgba(0, 212, 255, 1)"
                onClick={() => { onUpgrade(); onClose() }}
              />
            )}
          </div>

          <Divider />

          {/* HELP */}
          <div style={{ paddingTop: '8px', paddingBottom: '80px' }}>
            <SectionLabel label="HELP" />
            <MenuItem
              icon={<Info style={{ width: 16, height: 16 }} />}
              label="About ZERØ WATCH"
              onClick={onClose}
            />
            <MenuItem
              icon={<Github style={{ width: 16, height: 16 }} />}
              label="Source"
              onClick={() => { window.open('https://github.com/winduadiprabowo-pixel/zero-watch-monitor', '_blank'); onClose() }}
              arrow
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding:         '12px 20px',
          paddingBottom:   'max(16px, env(safe-area-inset-bottom, 16px))',
          borderTop:       '1px solid rgba(255,255,255,0.06)',
          flexShrink:      0,
          background:      'rgba(4,4,10,0.99)',
        }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.18)', lineHeight: 1.8 }}>
            ZERØ BUILD LAB © 2026<br />
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>Read-only · No wallet connect · @ZerobuildLab</span>
          </div>
        </div>
      </div>
    </div>
  )
})
MobileMenuOverlay.displayName = 'MobileMenuOverlay'

export default MobileMenuOverlay
