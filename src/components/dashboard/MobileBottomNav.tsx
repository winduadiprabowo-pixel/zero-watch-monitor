/**
 * ZERØ WATCH — MobileBottomNav v19
 * ==================================
 * Redesign: green accent, cleaner pill style
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useCallback } from 'react'
import { Wallet, Brain, BarChart3, ScanLine } from 'lucide-react'

export type MobileTab = 'wallets' | 'intel' | 'stats' | 'radar'

interface MobileBottomNavProps {
  activeTab:       MobileTab
  onTabChange:     (tab: MobileTab) => void
  hasAlert?:       boolean
  hasRadarAlert?:  boolean
}

const TABS: { id: MobileTab; label: string; Icon: typeof Wallet; hasDot: 'alert' | 'radar' | false }[] = [
  { id: 'wallets', label: 'Wallets', Icon: Wallet,   hasDot: false   },
  { id: 'intel',   label: 'Intel',   Icon: Brain,    hasDot: 'alert' },
  { id: 'stats',   label: 'Stats',   Icon: BarChart3, hasDot: false  },
  { id: 'radar',   label: 'RADAR',   Icon: ScanLine, hasDot: 'radar' },
]

const MobileBottomNav = memo(({ activeTab, onTabChange, hasAlert = false, hasRadarAlert = false }: MobileBottomNavProps) => {
  const handleTab = useCallback((id: MobileTab) => () => onTabChange(id), [onTabChange])

  return (
    <nav style={{
      background:           'rgba(4,4,10,0.98)',
      borderTop:            '1px solid rgba(255,255,255,0.055)',
      backdropFilter:       'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      paddingLeft:          '10px',
      paddingRight:         '10px',
      paddingTop:           '6px',
      paddingBottom:        'max(10px, env(safe-area-inset-bottom, 10px))',
    }}>
      <div style={{
        display: 'flex', borderRadius: '16px', padding: '3px', gap: '3px',
        background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.055)',
      }}>
        {TABS.map(tab => {
          const isActive    = activeTab === tab.id
          const isRadar     = tab.id === 'radar'
          const showDot     = tab.hasDot === 'alert' && hasAlert && !isActive
          const showRadar   = tab.hasDot === 'radar' && hasRadarAlert && !isActive
          const activeColor = isRadar ? 'rgba(239,68,68,1)' : 'rgba(0,255,136,1)'
          const activeBg    = isRadar ? 'rgba(239,68,68,0.10)' : 'rgba(0,255,136,0.08)'
          const activeBorder= isRadar ? 'rgba(239,68,68,0.22)' : 'rgba(0,255,136,0.20)'

          return (
            <button
              key={tab.id}
              onClick={handleTab(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '4px', minHeight: '44px', paddingTop: '8px', paddingBottom: '8px',
                borderRadius: '13px',
                border:     `1px solid ${isActive ? activeBorder : 'transparent'}`,
                background: isActive ? activeBg : 'transparent',
                color:      isActive ? activeColor : 'rgba(255,255,255,0.28)',
                transition: 'all 0.16s cubic-bezier(0.22,1,0.36,1)',
                position:   'relative', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent', userSelect: 'none',
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.93)' }}
              onTouchEnd={e   => { e.currentTarget.style.transform = 'scale(1)' }}
              onMouseDown={e  => { e.currentTarget.style.transform = 'scale(0.93)' }}
              onMouseUp={e    => { e.currentTarget.style.transform = 'scale(1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {/* Alert dot */}
              {(showDot || showRadar) && (
                <span style={{
                  position: 'absolute', top: '6px', right: 'calc(50% - 14px)',
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: showRadar ? 'rgba(239,68,68,1)' : 'rgba(0,255,136,1)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }} />
              )}

              <tab.Icon style={{ width: '18px', height: '18px' }} />

              <span style={{
                fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px',
                letterSpacing: '0.10em', textTransform: 'uppercase' as const,
                fontWeight: isActive ? 600 : 400, lineHeight: 1,
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
})
MobileBottomNav.displayName = 'MobileBottomNav'

export default MobileBottomNav
