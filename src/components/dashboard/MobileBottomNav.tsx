/**
 * ZERØ WATCH — MobileBottomNav v14
 * ==================================
 * 2026 redesign:
 * - Pill container: semua tab dalam rounded container
 * - Active state = background card sendiri (bukan underline)
 * - Active terasa "ditekan masuk" bukan "digarisbawahi"
 * - Intel tab pulse dot when inactive
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useCallback } from 'react'
import { Wallet, Brain, BarChart3 } from 'lucide-react'

type MobileTab = 'wallets' | 'intel' | 'stats'

interface MobileBottomNavProps {
  activeTab:   MobileTab
  onTabChange: (tab: MobileTab) => void
}

const TABS: { id: MobileTab; label: string; icon: typeof Wallet; hasDot?: boolean }[] = [
  { id: 'wallets', label: 'Wallets', icon: Wallet              },
  { id: 'intel',   label: 'Intel',   icon: Brain,   hasDot: true },
  { id: 'stats',   label: 'Stats',   icon: BarChart3            },
]

const MobileBottomNav = memo(({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const handleTab = useCallback(
    (id: MobileTab) => () => onTabChange(id),
    [onTabChange]
  )

  return (
    <nav
      className="flex-shrink-0"
      style={{
        background:     'rgba(4,4,10,0.96)',
        borderTop:      '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        padding:        '8px 12px 10px',
      }}
    >
      {/* ── Pill container ── */}
      <div
        className="flex rounded-2xl p-1 gap-1"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border:     '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={handleTab(tab.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2 relative transition-all active:scale-95"
              style={{
                borderRadius: '14px',
                background:   isActive ? 'rgba(0,255,148,0.10)' : 'transparent',
                border:       isActive ? '1px solid rgba(0,255,148,0.22)' : '1px solid transparent',
                boxShadow:    isActive ? '0 0 16px rgba(0,255,148,0.08) inset' : 'none',
                color:        isActive ? 'rgba(0,255,148,1)' : 'rgba(255,255,255,0.28)',
                transition:   'all 0.18s ease',
              }}
            >
              {/* Pulse dot on Intel when inactive */}
              {tab.hasDot && !isActive && (
                <span
                  className="absolute animate-pulse"
                  style={{
                    top:          '5px',
                    right:        'calc(50% - 14px)',
                    width:        '5px',
                    height:       '5px',
                    borderRadius: '50%',
                    background:   'rgba(0,255,148,0.9)',
                    boxShadow:    '0 0 4px rgba(0,255,148,0.7)',
                  }}
                />
              )}

              <tab.icon
                className="w-4 h-4"
                style={{
                  filter: isActive ? 'drop-shadow(0 0 5px rgba(0,255,148,0.6))' : 'none',
                }}
              />

              <span
                className="font-mono"
                style={{
                  fontSize:      '9px',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  fontWeight:    isActive ? 600 : 400,
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
