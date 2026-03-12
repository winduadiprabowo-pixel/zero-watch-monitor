import type { WatchedWallet } from '@/store/walletStore'
import type { WalletData } from '@/services/api'

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

function toCsvRows(headers: string[], rows: (string | number)[][]): string {
  return [
    headers.map(esc).join(','),
    ...rows.map(r => r.map(esc).join(',')),
  ].join('\n')
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportWalletSummary(
  storeWallets: WatchedWallet[],
  apiDataArr: WalletData[] | undefined
) {
  const headers = ['Label', 'Address', 'Chain', 'ETH Balance', 'USD Value', 'Token Count', 'Added At']
  const rows = storeWallets.map((w, i) => {
    const api = apiDataArr?.[i]
    return [
      w.label,
      w.address,
      w.chain,
      api?.balance.ethBalance ?? '0',
      api?.balance.usdValue?.toFixed(2) ?? '0',
      api?.balance.tokens.length ?? 0,
      new Date(w.addedAt).toISOString(),
    ]
  })
  const ts = new Date().toISOString().slice(0, 10)
  downloadCsv(`zero-watch-wallets-${ts}.csv`, toCsvRows(headers, rows))
}

export function exportTransactions(
  storeWallets: WatchedWallet[],
  apiDataArr: WalletData[] | undefined
) {
  const headers = ['Wallet Label', 'Wallet Address', 'Chain', 'TX Hash', 'From', 'To', 'Value ETH', 'Type', 'Gas Used', 'Timestamp', 'Date']
  const rows: (string | number)[][] = []
  storeWallets.forEach((w, i) => {
    const txs = apiDataArr?.[i]?.transactions ?? []
    txs.forEach(tx => {
      rows.push([
        w.label, w.address, w.chain,
        tx.hash, tx.from, tx.to, tx.value, tx.type, tx.gasUsed,
        tx.timeStamp,
        new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      ])
    })
  })
  const ts = new Date().toISOString().slice(0, 10)
  downloadCsv(`zero-watch-transactions-${ts}.csv`, toCsvRows(headers, rows))
}

export function exportTokenHoldings(
  storeWallets: WatchedWallet[],
  apiDataArr: WalletData[] | undefined
) {
  const headers = ['Wallet Label', 'Wallet Address', 'Chain', 'Token Symbol', 'Token Name', 'Balance', 'Contract']
  const rows: (string | number)[][] = []
  storeWallets.forEach((w, i) => {
    const tokens = apiDataArr?.[i]?.balance.tokens ?? []
    if (tokens.length === 0) {
      rows.push([w.label, w.address, w.chain, '—', '—', '—', '—'])
    } else {
      tokens.forEach(t => {
        rows.push([w.label, w.address, w.chain, t.symbol, t.name, t.balance, t.contractAddress])
      })
    }
  })
  const ts = new Date().toISOString().slice(0, 10)
  downloadCsv(`zero-watch-tokens-${ts}.csv`, toCsvRows(headers, rows))
}
