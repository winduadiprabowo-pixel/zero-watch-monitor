/**
 * ZERØ WATCH — csvExport v2
 * ===========================
 * v2 FIXES (Grok + Windu combined):
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX #1: Include gas cost per TX dalam export (saran Grok)
 * FIX #2: Include wallet tag + chain dalam export
 * FIX #3: Proper CSV escaping — quotes di dalam nilai di-double
 * FIX #4: Timestamp human-readable (ISO 8601)
 * FIX #5: Summary row di akhir file
 */

import type { WalletData, Transaction } from './api'
import { calculateGasBreakdown } from './api'

interface ExportWallet {
  id:      string
  label:   string
  chain:   string
  tag?:    string
  address: string
}

function escapeCSV(val: string | number | undefined | null): string {
  const s = String(val ?? '')
  // FIX #3: proper escape — double any internal quotes, wrap in quotes if needed
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function tsToISO(ts: string): string {
  const n = parseInt(ts)
  if (!n || !isFinite(n)) return ''
  return new Date(n * 1000).toISOString()
}

// ── Export transactions to CSV ────────────────────────────────────────────────

export function exportTransactionsCSV(
  wallets:    ExportWallet[],
  apiDataArr: (WalletData | undefined)[],
  ethPrice:   number
): string {
  const rows: string[] = []

  // Header — FIX #1: add gas columns
  rows.push([
    'Wallet Label',
    'Chain',
    'Tag',
    'Address',
    'TX Hash',
    'Timestamp (ISO)',
    'Type',
    'From',
    'To',
    'Value (ETH)',
    'Value (USD)',
    'Gas Used',
    'Gas Price (Gwei)',  // FIX #1
    'Gas Cost (ETH)',    // FIX #1
    'Gas Cost (USD)',    // FIX #1
    'Is Error',
    'Function',
  ].map(escapeCSV).join(','))

  let totalVolEth = 0
  let totalGasUsd = 0
  let txCount     = 0

  for (let i = 0; i < wallets.length; i++) {
    const w    = wallets[i]
    const data = apiDataArr[i]
    if (!data) continue

    for (const tx of data.transactions) {
      const valueEth = parseFloat(tx.value) || 0
      const valueUsd = valueEth * ethPrice

      // FIX #1: gas breakdown
      const gas = calculateGasBreakdown(tx, ethPrice)

      totalVolEth += valueEth
      totalGasUsd += gas.totalFeeUsd
      txCount++

      rows.push([
        w.label,
        w.chain,
        w.tag ?? '',
        w.address,
        tx.hash,
        tsToISO(tx.timeStamp),          // FIX #4: ISO timestamp
        tx.type,
        tx.from,
        tx.to,
        valueEth.toFixed(6),
        valueUsd.toFixed(2),
        tx.gasUsed,
        gas.gasPriceGwei.toFixed(2),    // FIX #1
        gas.totalFeeEth.toFixed(8),      // FIX #1
        gas.totalFeeUsd.toFixed(4),      // FIX #1
        tx.isError === '1' ? 'error' : 'ok',
        tx.functionName || '',
      ].map(escapeCSV).join(','))
    }
  }

  // FIX #5: Summary rows di akhir
  rows.push('')
  rows.push(`# SUMMARY,,,,,,,,,,,,,,,,`)
  rows.push(`# Total TXs: ${txCount},,,,,,,,,,,,,,,,`)
  rows.push(`# Total Volume: ${totalVolEth.toFixed(4)} ETH,,,,,,,,,,,,,,,,`)
  rows.push(`# Total Gas Cost: $${totalGasUsd.toFixed(2)} USD,,,,,,,,,,,,,,,,`)
  rows.push(`# ETH Price at Export: $${ethPrice.toFixed(0)},,,,,,,,,,,,,,,,`)
  rows.push(`# Exported: ${new Date().toISOString()},,,,,,,,,,,,,,,,`)

  return rows.join('\n')
}

// ── Trigger browser download ──────────────────────────────────────────────────

export function downloadCSV(content: string, filename = 'zero-watch-export.csv'): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Export portfolio summary ──────────────────────────────────────────────────

export function exportPortfolioSummaryCSV(
  wallets:    ExportWallet[],
  apiDataArr: (WalletData | undefined)[],
  ethPrice:   number
): string {
  const rows: string[] = []

  rows.push([
    'Label', 'Chain', 'Tag', 'Address',
    'ETH Balance', 'USD Value',
    'Token Count', 'TX Count',
    'Last TX (ISO)',
  ].map(escapeCSV).join(','))

  for (let i = 0; i < wallets.length; i++) {
    const w    = wallets[i]
    const data = apiDataArr[i]

    const ethBal   = data?.balance.ethBalance ?? '0'
    const usdVal   = data?.balance.usdValue   ?? 0
    const tokens   = data?.balance.tokens.length ?? 0
    const txs      = data?.transactions ?? []
    const lastTx   = txs[0] ? tsToISO(txs[0].timeStamp) : ''

    rows.push([
      w.label, w.chain, w.tag ?? '', w.address,
      parseFloat(ethBal).toFixed(4),
      usdVal.toFixed(2),
      tokens,
      txs.length,
      lastTx,
    ].map(escapeCSV).join(','))
  }

  return rows.join('\n')
}
