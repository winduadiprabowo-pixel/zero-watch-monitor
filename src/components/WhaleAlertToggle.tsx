/**
 * ZERØ WATCH — WhaleAlertToggle v21
 * ===================================
 * v21: Web Push subscription button
 *      - Satu tombol: enable browser notif + subscribe push
 *      - Status: idle / subscribed / denied / unsupported
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useCallback } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import type { WhaleAlertsState } from '@/hooks/useWhaleAlerts'
import { usePushSubscription } from '@/hooks/usePushSubscription'

interface Props {
  alerts:   WhaleAlertsState
  compact?: boolean
}

const WhaleAlertToggle = memo(({ alerts, compact }: Props) => {
  const { permission, enabled, alertCount, toggle, requestPermission } = alerts
  const push = usePushSubscription()

  const isDenied = permission === 'denied'

  // Combined action: enable browser notif + subscribe push
  const handleClick = useCallback(async () => {
    if (isDenied) return
    if (!enabled) {
      await requestPermission()
    } else {
      toggle()
    }
    // Subscribe push kalau belum
    if (push.status === 'idle' || push.status === 'error') {
      await push.subscribe()
    }
  }, [isDenied, enabled, toggle, requestPermission, push])

  if (permission === 'unsupported') return null

  const isPushActive = push.status === 'subscribed'

  const label = isDenied
    ? 'BLOCKED'
    : enabled
    ? `ALERTS${alertCount > 0 ? ` (${alertCount})` : ''}`
    : 'ALERTS'

  return (
    <button
      onClick={handleClick}
      title={
        isDenied
          ? 'Notifications blocked — enable in browser settings'
          : isPushActive
          ? `Push ON — background alerts aktif (${alertCount} fired)`
          : enabled
          ? 'Alerts ON (browser only) — click untuk enable background push'
          : 'Enable whale alerts — browser + background push'
      }
      disabled={isDenied}
      className="flex items-center gap-1.5 rounded-full font-mono transition-all active:scale-95"
      style={{
        padding:       compact ? '5px 10px' : '6px 12px',
        background:    isDenied
          ? 'rgba(239,68,68,0.05)'
          : isPushActive
          ? 'rgba(52,211,153,0.08)'
          : enabled
          ? 'rgba(0, 212, 255, 0.08)'
          : 'rgba(255,255,255,0.04)',
        border:        isDenied
          ? '1px solid rgba(239,68,68,0.20)'
          : isPushActive
          ? '1px solid rgba(52,211,153,0.35)'
          : enabled
          ? '1px solid rgba(0, 212, 255, 0.35)'
          : '1px solid rgba(255,255,255,0.09)',
        color:         isDenied
          ? 'rgba(252,129,129,0.65)'
          : isPushActive
          ? 'rgba(52,211,153,1)'
          : enabled
          ? 'rgba(0, 212, 255, 1)'
          : 'rgba(255,255,255,0.35)',
        fontSize:      '10px',
        opacity:       isDenied ? 0.6 : 1,
        cursor:        isDenied ? 'not-allowed' : 'pointer',
        boxShadow:     isPushActive
          ? '0 0 12px rgba(52,211,153,0.15)'
          : enabled
          ? '0 0 12px rgba(0, 212, 255, 0.12)'
          : 'none',
        letterSpacing: '0.04em',
      }}
    >
      {/* Pulsing dot */}
      {(enabled || isPushActive) && !isDenied && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: isPushActive ? 'rgba(52,211,153,1)' : 'rgba(0, 212, 255, 1)',
            boxShadow:  isPushActive ? '0 0 5px rgba(52,211,153,0.8)' : '0 0 5px rgba(0, 212, 255, 0.8)',
            animation:  'pulse-glow 1.8s ease-in-out infinite',
          }}
        />
      )}

      {isPushActive
        ? <BellRing className="w-3 h-3" />
        : enabled
        ? <Bell className="w-3 h-3" style={{ animation: alertCount > 0 ? 'pulse-glow 0.8s ease-in-out 3' : 'none' }} />
        : <BellOff className="w-3 h-3" />
      }

      {!compact && <span>{label}</span>}

      {/* Push badge */}
      {!compact && isPushActive && (
        <span style={{
          fontSize:    '7px',
          letterSpacing: '0.08em',
          color:       'rgba(52,211,153,0.7)',
          marginLeft:  '2px',
        }}>
          PUSH
        </span>
      )}
    </button>
  )
})
WhaleAlertToggle.displayName = 'WhaleAlertToggle'

export default WhaleAlertToggle
