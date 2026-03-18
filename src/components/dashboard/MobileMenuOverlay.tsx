/**
 * ZERØ WATCH — MobileMenuOverlay v3
 * ====================================
 * Redesign: green accent, Arkham-style header
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useCallback, useEffect } from 'react'
import {
  X, Wallet, Brain, BarChart3, ScanLine,
  Bell, Send, Zap, Download, Info, Github,
  ChevronRight, LogIn, LogOut, User,
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
  isLoggedIn:    boolean
  userEmail?:    string
  onLogin:       () => void
  onLogout:      () => void
}

interface MenuItemProps {
  icon:        React.ReactNode
  label:       string
  badge?:      string
  badgeGreen?: boolean
  badgeBlue?:  boolean
  arrow?:      boolean
  dim?:        boolean
  danger?:     boolean
  onClick:     () => void
}

const MenuItem = memo(({ icon, label, badge, badgeGreen, badgeBlue, arrow, dim, danger, onClick }: MenuItemProps) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '12px 0', background: 'none', border: 'none',
      cursor: 'pointer',
      color: danger ? 'rgba(239,68,68,0.7)' : dim ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.80)',
      transition: 'color 0.12s', WebkitTapHighlightColor: 'transparent',
    }}
    onTouchStart={e => { e.currentTarget.style.color = danger ? 'rgba(239,68,68,1)' : 'rgba(0,255,136,1)' }}
    onTouchEnd={e   => { e.currentTarget.style.color = danger ? 'rgba(239,68,68,0.7)' : dim ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.80)' }}
    onMouseEnter={e => { e.currentTarget.style.color = danger ? 'rgba(239,68,68,1)' : 'rgba(0,255,136,1)' }}
    onMouseLeave={e => { e.currentTarget.style.color = danger ? 'rgba(239,68,68,0.7)' : dim ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.80)' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ color: 'rgba(255,255,255,0.30)', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', fontWeight: 400 }}>{label}</span>
      {badge && (
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700,
          letterSpacing: '0.08em', padding: '2px 6px', borderRadius: '4px',
          background: badgeGreen
            ? 'rgba(0,255,136,0.10)' : badgeBlue
            ? 'rgba(59,130,246,0.10)' : 'rgba(255,255,255,0.06)',
          color: badgeGreen
            ? 'rgba(0,255,136,1)' : badgeBlue
            ? 'rgba(147,197,253,1)' : 'rgba(255,255,255,0.45)',
          border: badgeGreen
            ? '1px solid rgba(0,255,136,0.22)' : badgeBlue
            ? '1px solid rgba(59,130,246,0.22)' : '1px solid rgba(255,255,255,0.08)',
        }}>{badge}</span>
      )}
    </div>
    {arrow && <ChevronRight style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.18)' }} />}
  </button>
))
MenuItem.displayName = 'MenuItem'

const SectionLabel = memo(({ label }: { label: string }) => (
  <div style={{
    fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px',
    letterSpacing: '0.20em', color: 'rgba(255,255,255,0.20)',
    fontWeight: 500, padding: '16px 0 6px',
  }}>
    {label}
  </div>
))
SectionLabel.displayName = 'SectionLabel'

const Divider = () => <div style={{ height: '1px', background: 'rgba(255,255,255,0.055)', margin: '4px 0' }} />

const MobileMenuOverlay = memo(({
  open, onClose, isProActive, tgEnabled,
  onAddWallet, onUpgrade, onExport, onTgSetup, onTabChange,
  isLoggedIn, userEmail, onLogin, onLogout,
}: MobileMenuOverlayProps) => {

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const go = useCallback((tab: 'wallets' | 'intel' | 'stats' | 'radar') => {
    onTabChange(tab); onClose()
  }, [onTabChange, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: '82%', maxWidth: '300px',
          background: 'rgba(6,6,12,1)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInLeft 0.2s cubic-bezier(0.22,1,0.36,1) both',
          borderRight: '1px solid rgba(255,255,255,0.055)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '11px', color: 'rgba(0,255,136,0.9)' }}>ZW</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em', lineHeight: 1 }}>
                ZER<span style={{ color: 'rgba(0,255,136,1)' }}>Ø</span> WATCH
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '2px', letterSpacing: '0.06em' }}>
                whale intelligence
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

          <SectionLabel label="PLATFORM" />
          <MenuItem icon={<Wallet style={{ width: 15, height: 15 }} />}   label="Wallets"      onClick={() => go('wallets')} />
          <MenuItem icon={<Brain style={{ width: 15, height: 15 }} />}    label="Intel"        onClick={() => go('intel')} arrow />
          <MenuItem icon={<BarChart3 style={{ width: 15, height: 15 }} />}label="Stats"        onClick={() => go('stats')} />
          <MenuItem icon={<ScanLine style={{ width: 15, height: 15 }} />} label="RADAR"        badge="LIVE" badgeGreen onClick={() => go('radar')} />
          <MenuItem icon={<Bell style={{ width: 15, height: 15 }} />}     label="Alerts"       onClick={onClose} arrow />
          <MenuItem
            icon={<Send style={{ width: 15, height: 15 }} />}
            label="Telegram"
            badge={tgEnabled ? 'ON' : undefined}
            badgeGreen={tgEnabled}
            onClick={() => { onTgSetup(); onClose() }}
            arrow
          />
          <MenuItem icon={<Wallet style={{ width: 15, height: 15 }} />}   label="Add Wallet"   onClick={() => { onAddWallet(); onClose() }} />

          <Divider />

          <SectionLabel label="ACCOUNT" />
          {isProActive ? (
            <MenuItem icon={<Download style={{ width: 15, height: 15 }} />} label="Export CSV" onClick={() => { onExport(); onClose() }} />
          ) : (
            <MenuItem
              icon={<Zap style={{ width: 15, height: 15 }} />}
              label="Upgrade to PRO"
              badge="$12/mo"
              badgeBlue
              onClick={() => { onUpgrade(); onClose() }}
            />
          )}

          {isLoggedIn ? (
            <>
              {userEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0 4px' }}>
                  <User style={{ width: '12px', height: '12px', color: 'rgba(0,255,136,0.5)' }} />
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.32)' }}>
                    {userEmail}
                  </span>
                </div>
              )}
              <MenuItem
                icon={<LogOut style={{ width: 15, height: 15 }} />}
                label="Logout"
                danger
                onClick={() => { onLogout(); onClose() }}
              />
            </>
          ) : (
            <MenuItem
              icon={<LogIn style={{ width: 15, height: 15 }} />}
              label="Login"
              onClick={() => { onLogin(); onClose() }}
              arrow
            />
          )}

          <Divider />

          <SectionLabel label="HELP" />
          <MenuItem icon={<Info style={{ width: 15, height: 15 }} />}   label="About ZERØ WATCH" onClick={onClose} />
          <MenuItem
            icon={<Github style={{ width: 15, height: 15 }} />}
            label="Source"
            onClick={() => { window.open('https://github.com/winduadiprabowo-pixel/zero-watch-monitor', '_blank'); onClose() }}
            arrow
          />

          <div style={{ paddingBottom: '80px' }} />
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          borderTop: '1px solid rgba(255,255,255,0.055)',
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.16)', lineHeight: 2 }}>
            ZERØ BUILD LAB © 2026
            <br />
            <span style={{ color: 'rgba(255,255,255,0.10)' }}>Read-only · No wallet connect · @ZerobuildLab</span>
          </div>
        </div>
      </div>
    </div>
  )
})
MobileMenuOverlay.displayName = 'MobileMenuOverlay'

export default MobileMenuOverlay
