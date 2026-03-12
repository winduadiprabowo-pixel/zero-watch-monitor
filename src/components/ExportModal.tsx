/**
 * ZERØ WATCH — ExportModal v13
 * ==============================
 * PRO CSV export — 3 tipe: Wallet Summary · Transactions · Token Holdings
 * rgba() only ✓  IBM Plex Mono ✓  React.memo + displayName ✓
 */

import React, { useState, useCallback, memo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, FileText, Activity, Coins, CheckCircle2 } from 'lucide-react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useAllWalletData } from '@/hooks/useWalletData'
import {
  exportWalletSummary,
  exportTransactions,
  exportTokenHoldings,
} from '@/services/csvExport'

interface Props {
  open:    boolean
  onClose: () => void
}

const EXPORTS = [
  {
    id:    'wallets',
    label: 'Wallet Summary',
    desc:  'Label, address, chain, balance, USD value',
    icon:  FileText,
    fn:    exportWalletSummary,
  },
  {
    id:    'txs',
    label: 'All Transactions',
    desc:  'Full TX history across all tracked wallets',
    icon:  Activity,
    fn:    exportTransactions,
  },
  {
    id:    'tokens',
    label: 'Token Holdings',
    desc:  'All ERC-20 tokens per wallet',
    icon:  Coins,
    fn:    exportTokenHoldings,
  },
] as const

export const ExportModal = memo(({ open, onClose }: Props) => {
  const storeWallets         = useWalletStore(selectWallets)
  const { data: apiDataArr } = useAllWalletData()
  const [loading, setLoading] = useState<string | null>(null)
  const [done,    setDone]    = useState<string | null>(null)

  const totalTxs = apiDataArr
    ? apiDataArr.reduce((s, w) => s + (w?.transactions.length ?? 0), 0)
    : 0

  const handleExport = useCallback(async (
    id: string,
    fn: typeof EXPORTS[number]['fn']
  ) => {
    if (loading) return
    setLoading(id)
    setDone(null)
    // tiny delay so spinner renders before heavy CSV work
    await new Promise(r => setTimeout(r, 180))
    fn(storeWallets, apiDataArr)
    setLoading(null)
    setDone(id)
    setTimeout(() => setDone(null), 2200)
  }, [loading, storeWallets, apiDataArr])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="text-white font-mono max-w-sm border-0 p-0 overflow-hidden"
        style={{ background: 'rgba(6,6,14,1)' }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,148,0.4), transparent)' }}
        />

        <div className="relative px-6 pt-6 pb-7 space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" style={{ color: 'rgba(0,255,148,0.7)' }} />
              <DialogTitle
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: 'rgba(0,255,148,0.7)' }}
              >
                CSV Export
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Stats line */}
          <div
            className="text-[10px] font-mono px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border:     '1px solid rgba(255,255,255,0.055)',
              color:      'rgba(255,255,255,0.35)',
            }}
          >
            {storeWallets.length} wallet{storeWallets.length !== 1 ? 's' : ''} · {totalTxs} transactions loaded
          </div>

          {/* Export options */}
          <div className="space-y-2">
            {EXPORTS.map(({ id, label, desc, icon: Icon, fn }) => {
              const isLoading = loading === id
              const isDone    = done    === id

              return (
                <button
                  key={id}
                  onClick={() => handleExport(id, fn)}
                  disabled={loading !== null}
                  className="w-full text-left px-3 py-3 rounded-xl transition-all flex items-start gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                  style={{
                    background:  isDone
                      ? 'rgba(0,255,148,0.06)'
                      : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${isDone
                      ? 'rgba(0,255,148,0.25)'
                      : 'rgba(255,255,255,0.065)'}`,
                  }}
                  onMouseEnter={e => {
                    if (!loading && !isDone) {
                      e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.borderColor  = 'rgba(0,255,148,0.2)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isDone) {
                      e.currentTarget.style.background   = 'rgba(255,255,255,0.025)'
                      e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.065)'
                    }
                  }}
                >
                  {/* Icon */}
                  {isDone ? (
                    <CheckCircle2
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: 'rgba(0,255,148,0.8)' }}
                    />
                  ) : (
                    <Icon
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: isLoading ? 'rgba(0,255,148,0.6)' : 'rgba(255,255,255,0.3)' }}
                    />
                  )}

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium"
                        style={{ color: isDone ? 'rgba(0,255,148,0.9)' : 'rgba(255,255,255,0.8)' }}
                      >
                        {label}
                      </span>
                      {isLoading && (
                        <span
                          className="text-[9px] font-mono animate-pulse"
                          style={{ color: 'rgba(0,255,148,0.7)' }}
                        >
                          generating…
                        </span>
                      )}
                      {isDone && (
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: 'rgba(0,255,148,0.7)' }}
                        >
                          ✓ downloaded
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {desc}
                    </div>
                  </div>

                  {/* Arrow */}
                  <Download
                    className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-30 transition-opacity"
                    style={{ color: 'rgba(0,255,148,1)' }}
                  />
                </button>
              )
            })}
          </div>

          {/* Footer note */}
          <p
            className="text-[9px] font-mono text-center border-t pt-3"
            style={{
              color:       'rgba(255,255,255,0.18)',
              borderColor: 'rgba(255,255,255,0.05)',
            }}
          >
            Exports current session data · Add wallets to include them
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
})
ExportModal.displayName = 'ExportModal'
