import React, { memo } from 'react'
import type { WhaleStatus } from '@/services/whaleAnalytics'

interface WhaleScoreBadgeProps {
  status:   WhaleStatus
  score?:   number
  compact?: boolean
}

const CONFIG: Record<WhaleStatus, { label: string; cls: string; dotCls: string; pulse: boolean }> = {
  ACCUMULATING: {
    label:  'ACCUMULATING',
    cls:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotCls: 'bg-emerald-400',
    pulse:  true,
  },
  DISTRIBUTING: {
    label:  'DISTRIBUTING',
    cls:    'bg-red-500/15 text-red-400 border-red-500/30',
    dotCls: 'bg-red-400',
    pulse:  true,
  },
  HUNTING: {
    label:  'HUNTING',
    cls:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotCls: 'bg-amber-400',
    pulse:  true,
  },
  DORMANT: {
    label:  'DORMANT',
    cls:    'bg-white/5 text-white/30 border-white/10',
    dotCls: 'bg-white/20',
    pulse:  false,
  },
}

const WhaleScoreBadge = memo(({ status, score, compact }: WhaleScoreBadgeProps) => {
  const c = CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[9px] font-semibold tracking-wider ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dotCls} ${c.pulse ? 'animate-pulse' : ''}`} />
      {compact ? status.slice(0, 3) : c.label}
      {score !== undefined && !compact && (
        <span className="opacity-50 ml-0.5 tabular-nums">{score}</span>
      )}
    </span>
  )
})
WhaleScoreBadge.displayName = 'WhaleScoreBadge'

export default WhaleScoreBadge
