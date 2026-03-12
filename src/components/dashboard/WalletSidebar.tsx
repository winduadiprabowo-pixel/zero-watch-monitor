/**
 * ZERØ WATCH — WalletSidebar v14
 * ================================
 * 2026 redesign:
 * - border-radius 12px on cards
 * - hover translateX(2px) micro-interaction
 * - gradient left border (neon top → dim bottom)
 * - PnL% display (dari txs trend)
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Wallet, WalletTag, filterTags } from '@/data/mockData'
import { useWalletStore, selectWallets } from '@/store/walletStore'

interface WalletSidebarProps {
  wallets:          Wallet[]
  selectedWalletId: string | null
  activeFilter:     string
  searchQuery:      string
  onSelectWallet:   (id: string) => void
  onFilterChange:   (tag: string) => void
  onSearchChange:   (q: string) => void
  mobile?:          boolean
}

const tagColors: Record<WalletTag, { bg: string; text: string; border: string }> = {
  'CEX Whale':    { bg: 'rgba(245,158,11,0.10)',  text: 'rgba(252,196,60,1)',   border: 'rgba(245,158,11,0.22)' },
  'DeFi Insider': { bg: 'rgba(59,130,246,0.10)',  text: 'rgba(96,165,250,1)',   border: 'rgba(59,130,246,0.22)' },
  'Smart Money':  { bg: 'rgba(0,255,148,0.07)',   text: 'rgba(0,255,148,0.9)', border: 'rgba(0,255,148,0.18)' },
  'DAO Treasury': { bg: 'rgba(139,92,246,0.10)',  text: 'rgba(167,139,250,1)', border: 'rgba(139,92,246,0.22)' },
  'MEV Bot':      { bg: 'rgba(239,68,68,0.10)',   text: 'rgba(252,129,129,1)', border: 'rgba(239,68,68,0.22)' },
}

const chainColors: Record<string, { text: string; bg: string; border: string }> = {
  ETH:  { text: 'rgba(147,197,253,1)', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.20)' },
  ARB:  { text: 'rgba(125,211,252,1)', bg: 'rgba(14,165,233,0.08)',  border: 'rgba(14,165,233,0.20)' },
  BASE: { text: 'rgba(165,180,252,1)', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.20)' },
  OP:   { text: 'rgba(252,129,129,1)', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.20)' },
  SOL:  { text: 'rgba(200,150,255,1)', bg: 'rgba(153,69,255,0.08)',  border: 'rgba(153,69,255,0.20)' },
}

// Derive a simple PnL trend from sparkData — rising = positive, falling = negative
function derivePnlFromSpark(sparkData: number[]): { pct: number; positive: boolean } {
  if (!sparkData || sparkData.length < 2) return { pct: 0, positive: true }
  const first = sparkData[0]
  const last  = sparkData[sparkData.length - 1]
  if (first <= 0) return { pct: 0, positive: true }
  const pct = ((last - first) / first) * 100
  return { pct: Math.abs(pct), positive: pct >= 0 }
}

const WalletSidebar = memo(({
  wallets, selectedWalletId, activeFilter, searchQuery,
  onSelectWallet, onFilterChange, onSearchChange, mobile,
}: WalletSidebarProps) => {
  const storeWallets = useWalletStore(selectWallets)

  const colorMap: Record<string, string> = {}
  storeWallets.forEach(w => { colorMap[w.id] = w.color })

  return (
    <aside
      className={`flex flex-col h-full animate-fade-up ${
        mobile ? 'w-full' : 'w-[272px] min-w-[272px]'
      }`}
      style={{ background: 'rgba(4,4,10,0.7)' }}
    >
      {/* ── Search ── */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          />
          <input
            type="text"
            placeholder="Search wallet..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(0,255,148,0.25)'
              e.currentTarget.style.background   = 'rgba(255,255,255,0.05)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
            }}
          />
        </div>
      </div>

      {/* ── Filter tags ── */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {filterTags.map(tag => {
          const isActive = activeFilter === tag
          return (
            <button
              key={tag}
              onClick={() => onFilterChange(tag)}
              className="text-[9px] font-mono px-2 py-1 rounded-md transition-all whitespace-nowrap"
              style={{
                background:    isActive ? 'rgba(0,255,148,0.10)' : 'rgba(255,255,255,0.03)',
                border:        `1px solid ${isActive ? 'rgba(0,255,148,0.28)' : 'rgba(255,255,255,0.06)'}`,
                color:         isActive ? 'rgba(0,255,148,0.95)' : 'rgba(255,255,255,0.32)',
                letterSpacing: '0.06em',
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 mb-2 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Count ── */}
      <div className="px-3 pb-2">
        <span className="text-[9px] font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {wallets.length} WALLET{wallets.length !== 1 ? 'S' : ''}
        </span>
      </div>

      {/* ── Wallet list ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
        {wallets.length === 0 && (
          <div className="text-center py-10 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
            No wallets match filter
          </div>
        )}

        {wallets.map((wallet, i) => {
          const isSelected = selectedWalletId === wallet.id
          const dot        = colorMap[wallet.id] ?? '#00FF94'
          const tag        = tagColors[wallet.tag]
          const chain      = chainColors[wallet.chain] ?? { text: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' }
          const { pct, positive } = derivePnlFromSpark(wallet.sparkData)
          const pnlColor = positive ? 'rgba(52,211,153,0.9)' : 'rgba(239,68,68,0.9)'

          return (
            <button
              key={wallet.id}
              onClick={() => onSelectWallet(wallet.id)}
              className="w-full text-left rounded-xl px-3 py-3 transition-all animate-fade-up group"
              style={{
                animationDelay: `${(i + 4) * 0.04}s`,
                borderRadius:   '12px',
                background: isSelected
                  ? `rgba(${hexToRgb(dot)}, 0.06)`
                  : 'rgba(255,255,255,0.022)',
                border: `1px solid ${isSelected
                  ? `rgba(${hexToRgb(dot)}, 0.28)`
                  : 'rgba(255,255,255,0.055)'}`,
                // gradient left accent — 3px left border via box-shadow trick
                boxShadow: isSelected
                  ? `inset 3px 0 0 ${dot}`
                  : 'inset 3px 0 0 rgba(255,255,255,0.08)',
                transform: 'translateX(0px)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.035)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
                }
                e.currentTarget.style.transform = 'translateX(2px)'
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.022)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.055)'
                }
                e.currentTarget.style.transform = 'translateX(0px)'
              }}
            >
              {/* Row 1: active dot + name + PnL */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: wallet.active ? dot : 'rgba(255,255,255,0.12)',
                      boxShadow:  wallet.active ? `0 0 6px ${dot}90` : 'none',
                      animation:  wallet.active ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                    }}
                  />
                  <span
                    className="text-xs font-medium text-foreground truncate"
                    style={{ maxWidth: '130px', color: isSelected ? dot : 'rgba(255,255,255,0.88)' }}
                  >
                    {wallet.label}
                  </span>
                </div>
                {/* PnL — derived from spark trend */}
                <span
                  className="text-[10px] font-mono flex-shrink-0 ml-2 font-semibold"
                  style={{ color: pct === 0 ? 'rgba(255,255,255,0.2)' : pnlColor }}
                >
                  {pct === 0 ? '—' : `${positive ? '+' : '−'}${pct.toFixed(1)}%`}
                </span>
              </div>

              {/* Row 2: address + chain */}
              <div className="flex items-center justify-between gap-1.5 pl-3.5 mb-1.5">
                <span className="text-[9px] font-mono truncate" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  {wallet.address}
                </span>
                <span
                  className="text-[8px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: chain.bg, color: chain.text, border: `1px solid ${chain.border}` }}
                >
                  {wallet.chain}
                </span>
              </div>

              {/* Row 3: balance + tag + spark */}
              <div className="flex items-center justify-between pl-3.5">
                <span className="text-[12px] font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {wallet.balance}
                </span>
                <div className="flex items-center gap-2">
                  {wallet.txNew > 0 && (
                    <span
                      className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                      style={{
                        background: 'rgba(0,255,148,0.10)',
                        color:      'rgba(0,255,148,0.95)',
                        border:     '1px solid rgba(0,255,148,0.20)',
                      }}
                    >
                      {wallet.txNew} NEW
                    </span>
                  )}
                  <span
                    className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}
                  >
                    {wallet.tag.split(' ')[0].toUpperCase()}
                  </span>
                  {/* Color-coded spark */}
                  <ColoredSpark data={wallet.sparkData} positive={positive} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
})
WalletSidebar.displayName = 'WalletSidebar'

// ── Color-coded Spark ─────────────────────────────────────────────────────────

const ColoredSpark = memo(({ data, positive }: { data: number[]; positive: boolean }) => {
  const max = Math.max(...data, 0.001)
  const color = positive ? 'rgba(52,211,153,0.55)' : 'rgba(239,68,68,0.55)'
  return (
    <div className="flex items-end gap-px" style={{ height: '14px' }}>
      {data.slice(0, 8).map((v, i) => (
        <div
          key={i}
          style={{
            width: '2.5px',
            height: `${Math.max(15, (v / max) * 100)}%`,
            background: color,
            borderRadius: '1px',
            transition: 'height 0.3s ease',
          }}
        />
      ))}
    </div>
  )
})
ColoredSpark.displayName = 'ColoredSpark'

// ── hex helper ────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const clean   = hex.replace('#', '')
  const bigint  = parseInt(clean, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8)  & 255
  const b = bigint & 255
  return `${r}, ${g}, ${b}`
}

export default WalletSidebar
