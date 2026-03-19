/**
 * ZERØ WATCH — MobileBottomNav v18
 * ==================================
 * v18: RADAR tab ke-4 — direct access ke anomaly detection
 *      hasRadarAlert prop — red pulse dot kalau ada CRITICAL/BLACK_SWAN
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useCallback } from 'react'
import { Wallet, Brain, BarChart3, ScanLine } from 'lucide-react'

export type MobileTab = 'wallets' | 'intel' | 'stats' | 'radar'

interface MobileBottomNavProps {
  activeTab:       MobileTab
  onTabChange:     (tab: MobileTab) => void
  hasAlert?:       boolean   // pulse dot on Intel (whale alerts)
  hasRadarAlert?:  boolean   // red pulse dot on RADAR (CRITICAL/BLACK_SWAN)
}

const TABS: {
  id:     MobileTab
  label:  string
  Icon:   typeof Wallet
  hasDot: 'alert' | 'radar' | false
}[] = [
  { id: 'wallets', label: 'Wallets', Icon: Wallet,   hasDot: false   },
  { id: 'intel',   label: 'Intel',   Icon: Brain,    hasDot: 'alert' },
  { id: 'stats',   label: 'Stats',   Icon: BarChart3, hasDot: false  },
  { id: 'radar',   label: 'RADAR',   Icon: ScanLine, hasDot: 'radar' },
]

const MobileBottomNav = memo(({
  activeTab, onTabChange,
  hasAlert = false, hasRadarAlert = false,
}: MobileBottomNavProps) => {
  const handleTab = useCallback(
    (id: MobileTab) => () => onTabChange(id),
    [onTabChange]
  )

  return (
    <nav
      style={{
        background:           'rgba(4,4,10,1)',
        borderTop:            '1px solid rgba(255,255,255,0.07)',
        backdropFilter:       'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingLeft:          '12px',
        paddingRight:         '12px',
        paddingTop:           '8px',
        paddingBottom:        'max(10px, env(safe-area-inset-bottom, 10px))',
      }}
    >
      {/* Pill container */}
      <div
        style={{
          display:      'flex',
          borderRadius: '18px',
          padding:      '4px',
          gap:          '4px',
          background:   'rgba(255,255,255,0.04)',
          border:       '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {TABS.map(tab => {
          const isActive   = activeTab === tab.id
          const showDot    = tab.hasDot === 'alert' && hasAlert && !isActive
          const showRadar  = tab.hasDot === 'radar' && hasRadarAlert && !isActive

          // RADAR tab gets red accent when active
          const isRadar    = tab.id === 'radar'
          const activeBg   = isRadar
            ? 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(0,255,136,0.09) 0%, rgba(0,255,136,0.05) 100%)'
          const activeBorder = isRadar
            ? 'rgba(239,68,68,0.25)'
            : 'rgba(0,255,136,0.18)'
          const activeColor = isRadar
            ? 'rgba(239,68,68,1)'
            : 'rgba(0,255,136,1)'
          const dotColor    = showRadar
            ? 'rgba(239,68,68,1)'
            : 'rgba(0,255,136,1)'
          const dotShadow   = showRadar
            ? '0 0 6px rgba(239,68,68,0.8)'
            : '0 0 6px rgba(0,255,136,0.8)'

          return (
            <button
              key={tab.id}
              onClick={handleTab(tab.id)}
              style={{
                flex:           1,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '4px',
                minHeight:      '44px',
                paddingTop:     '8px',
                paddingBottom:  '8px',
                borderRadius:   '14px',
                border:         `1px solid ${isActive ? activeBorder : 'transparent'}`,
                background:     isActive ? activeBg : 'transparent',
                boxShadow:      'none',
                color:          isActive ? activeColor : 'rgba(255,255,255,0.30)',
                transition:     'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                position:       'relative',
                cursor:         'pointer',
                WebkitTapHighlightColor: 'transparent',
                userSelect:     'none',
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.94)' }}
              onTouchEnd={e   => { e.currentTarget.style.transform = 'scale(1)' }}
              onMouseDown={e  => { e.currentTarget.style.transform = 'scale(0.94)' }}
              onMouseUp={e    => { e.currentTarget.style.transform = 'scale(1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {/* Pulse dot */}
              {(showDot || showRadar) && (
                <span
                  style={{
                    position:     'absolute',
                    top:          '6px',
                    right:        'calc(50% - 16px)',
                    width:        '6px',
                    height:       '6px',
                    borderRadius: '50%',
                    background:   dotColor,
                    boxShadow:    dotShadow,
                    animation:    'pulse-glow 2s ease-in-out infinite',
                  }}
                />
              )}

              <tab.Icon
                style={{
                  width:      '18px',
                  height:     '18px',
                  filter:     isActive
                    ? `drop-shadow(0 0 6px ${isRadar ? 'rgba(239,68,68,0.6)' : 'rgba(0,255,136,0.6)'})`
                    : 'none',
                  transition: 'filter 0.18s ease',
                }}
              />

              <span
                style={{
                  fontFamily:    "'IBM Plex Mono', monospace",
                  fontSize:      '9px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase' as const,
                  fontWeight:    isActive ? 600 : 400,
                  lineHeight:    1,
                }}
              >
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
