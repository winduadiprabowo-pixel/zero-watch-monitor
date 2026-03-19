/**
 * ZERØ WATCH — Bitcoin API Service v2
 * =======================================
 * v2 fixes:
 * - Proxy 400/404 → auto-fallback ke Blockstream langsung
 * - BTC price 429 → aggressive caching 5 menit
 * - Concurrent fetch balance+txs dengan fallback per-URL
 *
 * AbortController ✓  mountedRef compatible ✓
 */

const PROXY           = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const BLOCKSTREAM_API = 'https://blockstream.info/api'
const MEMPOOL_API     = 'https://mempool.space/api'

function getBtcApiUrls(): string[] {
  return PROXY
    ? [`${PROXY}/btc`, BLOCKSTREAM_API, MEMPOOL_API]
    : [BLOCKSTREAM_API, MEMPOOL_API]
}

function getBtcPriceUrls(): string[] {
  return [
    PROXY ? `${PROXY}/coingecko/price?ids=bitcoin&vs_currencies=usd` : null,
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    'https://mempool.space/api/v1/prices',
  ].filter(Boolean) as string[]
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BtcBalance {
  address:     string
  btcBalance:  string
  usdValue:    number
  confirmed:   number
  unconfirmed: number
}

export interface BtcTransaction {
  txid:      string
  blockTime: number
  valueIn:   number
  valueOut:  number
  fee:       number
  type:      'IN' | 'OUT'
  valueBtc:  number
  valueUsd:  number
}

export interface BtcWalletData {
  address:      string
  balance:      BtcBalance
  transactions: BtcTransaction[]
  lastUpdated:  number
}

export function isValidBtcAddress(addr: string): boolean {
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr) ||
         /^bc1[a-z0-9]{6,87}$/.test(addr)
}

// ── BTC Price — aggressive caching, multi-source fallback ────────────────────

let _btcPriceCache: { usd: number; ts: number } | null = null
const BTC_PRICE_TTL = 5 * 60_000

export async function getBtcPrice(signal?: AbortSignal): Promise<number> {
  if (_btcPriceCache && Date.now() - _btcPriceCache.ts < BTC_PRICE_TTL) {
    return _btcPriceCache.usd
  }

  for (const url of getBtcPriceUrls()) {
    try {
      const res  = await fetch(url, { signal })
      if (!res.ok) continue
      const data = await res.json()

      // CoinGecko format
      let usd = data?.bitcoin?.usd ?? 0
      // mempool.space format: { USD: number }
      if (!usd && data?.USD) usd = data.USD

      if (usd > 0) {
        _btcPriceCache = { usd, ts: Date.now() }
        return usd
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw e
      continue
    }
  }

  return _btcPriceCache?.usd ?? 65000
}

// ── Generic fetch with fallback ───────────────────────────────────────────────

async function btcFetch(
  path:    string,
  signal?: AbortSignal
): Promise<Response | null> {
  for (const base of getBtcApiUrls()) {
    try {
      const res = await fetch(`${base}${path}`, { signal })
      if (res.ok) return res
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw e
      continue
    }
  }
  return null
}

// ── Fetch BTC wallet ──────────────────────────────────────────────────────────

export async function fetchBtcWalletData(
  address: string,
  signal?: AbortSignal
): Promise<BtcWalletData> {
  const btcPrice = await getBtcPrice(signal)

  const [addrRes, txRes] = await Promise.all([
    btcFetch(`/address/${address}`, signal),
    btcFetch(`/address/${address}/txs`, signal),
  ])

  // Parse address / balance
  let confirmedBalance   = 0
  let unconfirmedBalance = 0

  if (addrRes) {
    try {
      const addrData       = await addrRes.json()
      confirmedBalance     = (addrData?.chain_stats?.funded_txo_sum   ?? 0)
                           - (addrData?.chain_stats?.spent_txo_sum    ?? 0)
      unconfirmedBalance   = (addrData?.mempool_stats?.funded_txo_sum ?? 0)
                           - (addrData?.mempool_stats?.spent_txo_sum  ?? 0)
    } catch { /* keep 0 */ }
  }

  const totalSats  = confirmedBalance + unconfirmedBalance
  const btcBalance = (totalSats / 1e8).toFixed(8)
  const usdValue   = (totalSats / 1e8) * btcPrice

  // Parse transactions
  type RawTx = {
    txid:   string
    status: { block_time?: number }
    vin:    Array<{ prevout?: { scriptpubkey_address?: string; value?: number } }>
    vout:   Array<{ scriptpubkey_address?: string; value?: number }>
    fee:    number
  }

  let transactions: BtcTransaction[] = []

  if (txRes) {
    try {
      const txData = await txRes.json() as RawTx[]
      transactions = (txData ?? []).slice(0, 20).map(tx => {
        const received = (tx.vout ?? [])
          .filter(o => o.scriptpubkey_address === address)
          .reduce((s, o) => s + (o.value ?? 0), 0)
        const sent = (tx.vin ?? [])
          .filter(i => i.prevout?.scriptpubkey_address === address)
          .reduce((s, i) => s + (i.prevout?.value ?? 0), 0)
        const net      = received - sent
        const valueBtc = Math.abs(net) / 1e8
        return {
          txid:      tx.txid,
          blockTime: (tx.status?.block_time ?? 0) * 1000,
          valueIn:   received,
          valueOut:  sent,
          fee:       tx.fee ?? 0,
          type:      net >= 0 ? ('IN' as const) : ('OUT' as const),
          valueBtc,
          valueUsd:  valueBtc * btcPrice,
        }
      })
    } catch { /* keep empty */ }
  }

  return {
    address,
    balance: { address, btcBalance, usdValue, confirmed: confirmedBalance, unconfirmed: unconfirmedBalance },
    transactions,
    lastUpdated: Date.now(),
  }
}
