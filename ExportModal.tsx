/**
 * ZERØ WATCH — ExportModal v2
 * =============================
 * v2: Portfolio Summary export option + gas cost column info
 * rgba() only ✓  React.memo + displayName ✓
 */

import { memo, useCallback, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, FileText, Table, CheckCircle } from 'lucide-react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { useAllWalletData, useEthPrice } from '@/hooks/useWalletData'
import { exportTransactionsCSV, exportPortfolioSummaryCSV, downloadCSV } from '@/services/csvExport'

interface Props {
  open:    boolean
  onClose: () => void
}

export const ExportModal = memo(({ open, onClose }: Props) => {
  const [exported, setExported] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const storeWallets            = useWalletStore(selectWallets)
  const { data: apiDataArr }    = useAllWalletData()
  const { data: ethPrice }      = useEthPrice()
  const ETH_PRICE               = ethPrice ?? 2000

  const handleExport = useCallback(async (type: 'transactions' | 'summary') => {
    setLoading(true)
    try {
      const csvWallets = storeWallets.map(w => ({
        id:      w.id,
        label:   w.label,
        chain:   w.chain,
        tag:     w.tag,
        address: w.address,
      }))

      const content = type === 'transactions'
        ? exportTransactionsCSV(csvWallets, apiDataArr ?? [], ETH_PRICE)
        : exportPortfolioSummaryCSV(csvWallets, apiDataArr ?? [], ETH_PRICE)

      const ts  = new Date().toISOString().slice(0, 10)
      const name = type === 'transactions'
        ? `zero-watch-txs-${ts}.csv`
        : `zero-watch-portfolio-${ts}.csv`

      downloadCSV(content, name)
      setExported(type)
    } catch (e) {
      console.error('[ZERØ Export]', e)
    } finally {
      setLoading(false)
    }
  }, [storeWallets, apiDataArr, ETH_PRICE])

  const txCount = (apiDataArr ?? []).reduce((s, d) => s + (d?.transactions.length ?? 0), 0)
  const walletCount = storeWallets.length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="text-white font-mono max-w-sm border-0 p-0 overflow-hidden"
        style={{ background: 'rgba(6,6,14,1)', borderRadius: '16px' }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,148,0.4), transparent)' }}
        />

        <div className="relative px-6 pt-6 pb-7 space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" style={{ color: 'rgba(0,255,148,0.7)' }} />
              <DialogTitle className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(0,255,148,0.7)' }}>
                Export Data
              </DialogTitle>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {walletCount} wallets · {txCount} transactions cached
            </p>
          </DialogHeader>

          {/* Export options */}
          <div className="space-y-2">
            {/* Transactions CSV */}
            <button
              onClick={() => handleExport('transactions')}
              disabled={loading || txCount === 0}
              className="w-full text-left px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: exported === 'transactions' ? 'rgba(0,255,148,0.08)' : 'rgba(255,255,255,0.025)',
                border:     `1px solid ${exported === 'transactions' ? 'rgba(0,255,148,0.3)' : 'rgba(255,255,255,0.07)'}`,
              }}
              onMouseEnter={e => {
                if (exported !== 'transactions')
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,255,148,0.2)'
              }}
              onMouseLeave={e => {
                if (exported !== 'transactions')
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {exported === 'transactions'
                    ? <CheckCircle className="w-4 h-4" style={{ color: 'rgba(0,255,148,1)' }} />
                    : <Table className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  }
                  <span className="text-[11px] font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {exported === 'transactions' ? 'Downloaded!' : 'Transactions CSV'}
                  </span>
                </div>
                <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {txCount} rows
                </span>
              </div>
              <p className="text-[9px] font-mono pl-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
                Hash · Type · Value (ETH+USD) · Gas cost (ETH+USD) · Timestamp
              </p>
            </button>

            {/* Portfolio Summary CSV */}
            <button
              onClick={() => handleExport('summary')}
              disabled={loading || walletCount === 0}
              className="w-full text-left px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: exported === 'summary' ? 'rgba(0,255,148,0.08)' : 'rgba(255,255,255,0.025)',
                border:     `1px solid ${exported === 'summary' ? 'rgba(0,255,148,0.3)' : 'rgba(255,255,255,0.07)'}`,
              }}
              onMouseEnter={e => {
                if (exported !== 'summary')
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,255,148,0.2)'
              }}
              onMouseLeave={e => {
                if (exported !== 'summary')
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {exported === 'summary'
                    ? <CheckCircle className="w-4 h-4" style={{ color: 'rgba(0,255,148,1)' }} />
                    : <FileText className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  }
                  <span className="text-[11px] font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {exported === 'summary' ? 'Downloaded!' : 'Portfolio Summary CSV'}
                  </span>
                </div>
                <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {walletCount} rows
                </span>
              </div>
              <p className="text-[9px] font-mono pl-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
                Label · Chain · Balance · USD Value · Token count
              </p>
            </button>
          </div>

          <p className="text-center text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
            PRO feature · Data from cached on-chain fetch
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
})

ExportModal.displayName = 'ExportModal'
