/**
 * ZERØ WATCH — MobileBottomNav v17
 * ==================================
 * REDESIGN TOTAL:
 * - Safe area inset bottom proper (iPhone notch support)
 * - Active state lebih kontras & jelas
 * - Haptic-like active scale animation
 * - Pulse dot Intel tab
 * - Touch target minimal 44px (Apple HIG)
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useCallback } from 'react'
import { Wallet, Brain, BarChart3 } from 'lucide-react'

type MobileTab = 'wallets' | 'intel' | 'stats'

interface MobileBottomNavProps {
  activeTab:   MobileTab
  onTabChange: (tab: MobileTab) => void
  hasAlert?:   boolean  // pulse dot on Intel
}

const TABS: {
  id:     MobileTab
  label:  string
  Icon:   typeof Wallet
  hasDot: boolean
}[] = [
  { id: 'wallets', label: 'Wallets', Icon: Wallet,  hasDot: false },
  { id: 'intel',   label: 'Intel',   Icon: Brain,   hasDot: true  },
  { id: 'stats',   label: 'Stats',   Icon: BarChart3, hasDot: false },
]

const MobileBottomNav = memo(({ activeTab, onTabChange, hasAlert = false }: MobileBottomNavProps) => {
  const handleTab = useCallback(
    (id: MobileTab) => () => onTabChange(id),
    [onTabChange]
  )

  return (
    <nav
      style={{
        background:          'rgba(4,4,10,0.97)',
        borderTop:           '1px solid rgba(255,255,255,0.07)',
        backdropFilter:      'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        paddingLeft:         '12px',
        paddingRight:        '12px',
        paddingTop:          '8px',
        paddingBottom:       'max(10px, env(safe-area-inset-bottom, 10px))',
      }}
    >
      {/* Pill container */}
      <div
        style={{
          display:       'flex',
          borderRadius:  '18px',
          padding:       '4px',
          gap:           '4px',
          background:    'rgba(255,255,255,0.04)',
          border:        '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          const showDot  = tab.hasDot && hasAlert && !isActive

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
                border:         `1px solid ${isActive ? 'rgba(230,161,71,0.25)' : 'transparent'}`,
                background:     isActive
                  ? 'linear-gradient(135deg, rgba(230,161,71,0.12) 0%, rgba(230,161,71,0.06) 100%)'
                  : 'transparent',
                boxShadow:      isActive ? '0 0 16px rgba(230,161,71,0.08) inset' : 'none',
                color:          isActive ? 'rgba(230,161,71,1)' : 'rgba(255,255,255,0.30)',
                transition:     'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                position:       'relative',
                cursor:         'pointer',
                WebkitTapHighlightColor: 'transparent',
                userSelect:     'none',
              }}
              onTouchStart={e => {
                e.currentTarget.style.transform = 'scale(0.94)'
              }}
              onTouchEnd={e => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'scale(0.94)'
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {/* Pulse dot */}
              {showDot && (
                <span
                  style={{
                    position:     'absolute',
                    top:          '6px',
                    right:        'calc(50% - 16px)',
                    width:        '6px',
                    height:       '6px',
                    borderRadius: '50%',
                    background:   'rgba(230,161,71,1)',
                    boxShadow:    '0 0 6px rgba(230,161,71,0.8)',
                    animation:    'pulse-glow 2s ease-in-out infinite',
                  }}
                />
              )}

              <tab.Icon
                style={{
                  width:  '18px',
                  height: '18px',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(230,161,71,0.6))' : 'none',
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
