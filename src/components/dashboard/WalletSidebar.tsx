/**
 * ZERØ WATCH — WalletSidebar v17
 * ================================
 * REDESIGN:
 * - Card border radius 14px, consistent
 * - Selected state: gradient bg sesuai status warna
 * - Hover: translate + border glow smooth
 * - Balance font lebih besar & lebih bold
 * - Tag badge lebih kontras
 * - Active dot lebih mencolok
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Wallet, WalletTag, filterTags } from '@/data/mockData'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useCallback as _ucb } from 'react'

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

const tagCfg: Record<WalletTag, { bg: string; text: string; border: string }> = {
  'CEX Whale':    { bg: 'rgba(245,158,11,0.10)',  text: 'rgba(252,196,60,1)',   border: 'rgba(245,158,11,0.25)' },
  'DeFi Insider': { bg: 'rgba(59,130,246,0.10)',  text: 'rgba(147,197,253,1)',  border: 'rgba(59,130,246,0.25)' },
  'Smart Money':  { bg: 'rgba(0,255,148,0.08)',   text: 'rgba(0,255,148,0.9)',  border: 'rgba(0,255,148,0.22)' },
  'DAO Treasury': { bg: 'rgba(139,92,246,0.10)',  text: 'rgba(167,139,250,1)',  border: 'rgba(139,92,246,0.25)' },
  'MEV Bot':      { bg: 'rgba(239,68,68,0.10)',   text: 'rgba(252,129,129,1)',  border: 'rgba(239,68,68,0.25)' },
}

const chainCfg: Record<string, { text: string; bg: string; border: string }> = {
  ETH:  { text: 'rgba(147,197,253,1)', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.22)' },
  ARB:  { text: 'rgba(125,211,252,1)', bg: 'rgba(14,165,233,0.10)',  border: 'rgba(14,165,233,0.22)' },
  BASE: { text: 'rgba(165,180,252,1)', bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.22)' },
  OP:   { text: 'rgba(252,129,129,1)', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.22)'  },
  SOL:  { text: 'rgba(200,150,255,1)', bg: 'rgba(153,69,255,0.10)',  border: 'rgba(153,69,255,0.22)' },
}

function derivePnl(sparkData: number[]): { pct: number; positive: boolean } {
  if (!sparkData || sparkData.length < 2) return { pct: 0, positive: true }
  const first = sparkData[0]
  const last  = sparkData[sparkData.length - 1]
  if (first <= 0) return { pct: 0, positive: true }
  const pct = ((last - first) / first) * 100
  return { pct: Math.abs(pct), positive: pct >= 0 }
}

function hexToRgb(hex: string): string {
  const clean  = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`
}

// ── Mini spark ────────────────────────────────────────────────────────────────
const Spark = memo(({ data, positive }: { data: number[]; positive: boolean }) => {
  const max   = Math.max(...data, 0.001)
  const color = positive ? 'rgba(52,211,153,0.65)' : 'rgba(239,68,68,0.6)'
  return (
    <div className="flex items-end gap-px flex-shrink-0" style={{ height: '16px', width: '32px' }}>
      {data.slice(0, 8).map((v, i) => (
        <div
          key={i}
          style={{
            flex:         '1',
            height:       `${Math.max(20, (v / max) * 100)}%`,
            background:   color,
            borderRadius: '1.5px',
          }}
        />
      ))}
    </div>
  )
})
Spark.displayName = 'Spark'

// ── Single wallet card ────────────────────────────────────────────────────────
const WalletCard = memo(({
  wallet, isSelected, dot, onSelect, index, notes, onNotesChange
}: {
  wallet:        Wallet
  isSelected:    boolean
  dot:           string
  onSelect:      (id: string) => void
  index:         number
  notes?:        string
  onNotesChange: (id: string, notes: string) => void
}) => {
  const tag   = tagCfg[wallet.tag]  ?? { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' }
  const chain = chainCfg[wallet.chain] ?? { text: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' }
  const { pct, positive } = derivePnl(wallet.sparkData)
  const pnlColor = positive ? 'rgba(52,211,153,1)' : 'rgba(239,68,68,1)'
  const dotRgb   = hexToRgb(dot)

  const handleClick = useCallback(() => onSelect(wallet.id), [wallet.id, onSelect])

  return (
    <button
      onClick={handleClick}
      className="w-full text-left rounded-2xl px-3 py-3 transition-all animate-fade-up"
      style={{
        animationDelay: `${(index + 4) * 0.04}s`,
        borderRadius:   '14px',
        background: isSelected
          ? `rgba(${dotRgb}, 0.07)`
          : 'rgba(255,255,255,0.025)',
        border: isSelected
          ? `1px solid rgba(${dotRgb}, 0.30)`
          : '1px solid rgba(255,255,255,0.058)',
        boxShadow: isSelected
          ? `inset 3px 0 0 ${dot}, 0 0 20px rgba(${dotRgb}, 0.08)`
          : 'inset 3px 0 0 rgba(255,255,255,0.07)',
        transform:  'translateX(0px)',
        transition: 'all 0.16s ease',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.background   = 'rgba(255,255,255,0.038)'
          e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.09)'
          e.currentTarget.style.boxShadow    = 'inset 3px 0 0 rgba(255,255,255,0.12)'
        }
        e.currentTarget.style.transform = 'translateX(2px)'
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.background   = 'rgba(255,255,255,0.025)'
          e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.058)'
          e.currentTarget.style.boxShadow    = 'inset 3px 0 0 rgba(255,255,255,0.07)'
        }
        e.currentTarget.style.transform = 'translateX(0px)'
      }}
    >
      {/* Row 1: active dot + name + pnl */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: wallet.active ? dot : 'rgba(255,255,255,0.14)',
              boxShadow:  wallet.active ? `0 0 8px ${dot}90` : 'none',
              animation:  wallet.active ? 'pulse-glow 2s ease-in-out infinite' : 'none',
            }}
          />
          <span
            className="font-mono font-semibold truncate"
            style={{
              fontSize: '13px',
              color:    isSelected ? dot : 'rgba(255,255,255,0.90)',
              maxWidth: '130px',
            }}
          >
            {wallet.label}
          </span>
          {wallet.txNew > 0 && (
            <span
              className="font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse"
              style={{
                fontSize:   '8px',
                background: 'rgba(0,255,148,0.10)',
                color:      'rgba(0,255,148,1)',
                border:     '1px solid rgba(0,255,148,0.22)',
              }}
            >
              {wallet.txNew}
            </span>
          )}
        </div>
        <span
          className="font-mono font-semibold flex-shrink-0 ml-2"
          style={{ fontSize: '11px', color: pct === 0 ? 'rgba(255,255,255,0.2)' : pnlColor }}
        >
          {pct === 0 ? '—' : `${positive ? '+' : '−'}${pct.toFixed(1)}%`}
        </span>
      </div>

      {/* Row 2: address + chain */}
      <div className="flex items-center justify-between gap-1.5 pl-4 mb-2">
        <span className="font-mono truncate" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.24)' }}>
          {wallet.address}
        </span>
        <span
          className="font-mono flex-shrink-0 px-1.5 py-0.5 rounded-md"
          style={{
            fontSize:   '8px',
            fontWeight: 600,
            background: chain.bg,
            color:      chain.text,
            border:     `1px solid ${chain.border}`,
            letterSpacing: '0.04em',
          }}
        >
          {wallet.chain}
        </span>
      </div>

      {/* Row 3: balance + tag + spark */}
      <div className="flex items-center justify-between pl-4">
        <span
          className="font-mono font-bold tabular-nums"
          style={{ fontSize: '15px', color: 'rgba(255,255,255,0.90)' }}
        >
          {wallet.balance}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="font-mono px-1.5 py-0.5 rounded-md"
            style={{
              fontSize:   '8px',
              fontWeight: 600,
              background: tag.bg,
              color:      tag.text,
              border:     `1px solid ${tag.border}`,
              letterSpacing: '0.04em',
            }}
          >
            {wallet.tag.split(' ')[0].toUpperCase()}
          </span>
          <Spark data={wallet.sparkData} positive={positive} />
        </div>
      </div>

      {/* Notes row — only show when selected */}
      {isSelected && (
        <div className="mt-2 pl-4" onClick={e => e.stopPropagation()}>
          <textarea
            placeholder="Add notes… (insider, fund, thesis)"
            value={notes ?? ''}
            onChange={e => onNotesChange(wallet.id, e.target.value)}
            rows={2}
            style={{
              width:       '100%',
              background:  'rgba(255,255,255,0.03)',
              border:      '1px solid rgba(255,255,255,0.08)',
              borderRadius:'8px',
              color:       'rgba(255,255,255,0.65)',
              fontSize:    '9px',
              fontFamily:  "'IBM Plex Mono', monospace",
              padding:     '6px 8px',
              outline:     'none',
              resize:      'none',
              lineHeight:  1.5,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,255,148,0.25)' }}
            onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </div>
      )}
    </button>
  )
})
WalletCard.displayName = 'WalletCard'

// ── Main sidebar ──────────────────────────────────────────────────────────────

const WalletSidebar = memo(({
  wallets, selectedWalletId, activeFilter, searchQuery,
  onSelectWallet, onFilterChange, onSearchChange, mobile,
}: WalletSidebarProps) => {
  const storeWallets = useWalletStore(selectWallets)
  const updateNotes  = useWalletStore(s => s.updateNotes)
  const notesMap     = Object.fromEntries(storeWallets.map(w => [w.id, w.notes ?? '']))
  const handleNotesChange = _ucb((id: string, notes: string) => {
    updateNotes(id, notes)
  }, [updateNotes])
  const colorMap = useMemo(() => {
    const m: Record<string, string> = {}
    storeWallets.forEach(w => { m[w.id] = w.color })
    return m
  }, [storeWallets])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value),
    [onSearchChange]
  )
  const handleClearSearch = useCallback(() => onSearchChange(''), [onSearchChange])

  return (
    <aside
      className={`flex flex-col h-full animate-fade-up ${mobile ? 'w-full' : 'w-[272px] min-w-[272px]'}`}
      style={{ background: 'rgba(4,4,10,0.7)' }}
    >
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.20)' }}
          />
          <input
            type="text"
            placeholder="Search wallet..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-xl pl-8 pr-8 py-2.5 font-mono outline-none transition-all"
            style={{
              fontSize:    '11px',
              background:  'rgba(255,255,255,0.04)',
              border:      '1px solid rgba(255,255,255,0.08)',
              color:       'rgba(255,255,255,0.85)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(0,255,148,0.28)'
              e.currentTarget.style.background  = 'rgba(255,255,255,0.055)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.background  = 'rgba(255,255,255,0.04)'
            }}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.30)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tags */}
      <div className="px-3 pb-2.5 flex flex-wrap gap-1">
        {filterTags.map(tag => {
          const isActive = activeFilter === tag
          return (
            <button
              key={tag}
              onClick={() => onFilterChange(tag)}
              className="font-mono px-2 py-1 rounded-lg transition-all"
              style={{
                fontSize:      '8px',
                letterSpacing: '0.06em',
                background:    isActive ? 'rgba(0,255,148,0.10)' : 'rgba(255,255,255,0.03)',
                border:        `1px solid ${isActive ? 'rgba(0,255,148,0.30)' : 'rgba(255,255,255,0.07)'}`,
                color:         isActive ? 'rgba(0,255,148,0.95)' : 'rgba(255,255,255,0.32)',
                fontWeight:    isActive ? 600 : 400,
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Divider + count */}
      <div className="mx-3 mb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }} />
      <div className="px-3 pb-2">
        <span
          className="font-mono uppercase"
          style={{ fontSize: '8px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)' }}
        >
          {wallets.length} Wallet{wallets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Wallet list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
        {wallets.length === 0 && (
          <div
            className="text-center py-12 font-mono"
            style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)' }}
          >
            No wallets match filter
          </div>
        )}
        {wallets.map((w, i) => (
          <WalletCard
            key={w.id}
            wallet={w}
            isSelected={selectedWalletId === w.id}
            dot={colorMap[w.id] ?? '#00FF94'}
            onSelect={onSelectWallet}
            index={i}
          />
        ))}
      </div>
    </aside>
  )
})
WalletSidebar.displayName = 'WalletSidebar'

export default WalletSidebar
