/**
 * ZERØ WATCH — SparkBar v13
 * ==========================
 * Mini bar chart untuk activity sparkline di WalletTable.
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo } from 'react'

interface SparkBarProps {
  data:   number[]
  color?: string
}

const SparkBar = memo(({ data, color = 'rgba(0, 212, 255, 0.45)' }: SparkBarProps) => {
  const max = useMemo(
    () => Math.max(...data, 0.001),
    [data]
  )

  if (!data || data.length === 0) {
    return <div className="flex items-end gap-px h-4 w-10" />
  }

  return (
    <div className="flex items-end gap-px h-4">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1 rounded-t-sm transition-all duration-300"
          style={{
            height:     `${Math.max(10, (v / max) * 100)}%`,
            background: color,
          }}
        />
      ))}
    </div>
  )
})
SparkBar.displayName = 'SparkBar'

export default SparkBar
