/**
 * ZERØ WATCH — tronApi.ts v2
 * ============================
 * v2 fixes:
 * - Proxy 429 → fallback ke TronGrid langsung
 * - TRX price: aggressive caching 5 menit, multi-source
 * - fetchTronBalance + fetchTronTransactions: per-URL fallback
 *
 * Unit: SUN — 1 TRX = 1,000,000 SUN
 * AbortController ✓
 */

const PROXY            = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const TRONGRID_PUBLIC  = 'https://api.trongrid.io'
const TRX_PRICE_FALLBACK = 0.12

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TronBalance {
  address:    string
  trxBalance: string
  usdValue:   number
}

export interface TronTransaction {
  txid:      string
  from:      string
  to:        string
  valueTrx:  number
  valueUsd:  number
  blockTime: number
  type:      'IN' | 'OUT' | 'INTERNAL'
  status:    'SUCCESS' | 'FAILED'
  fee:       number
}

export interface TronWalletData {
  address:      string
  balance:      TronBalance
  transactions: TronTransaction[]
  lastUpdated:  number
}

export function isValidTronAddress(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address.trim())
}

// ── TRX Price — aggressive caching, multi-source ─────────────────────────────

let _trxPriceCache: { price: number; ts: number } | null = null
const TRX_PRICE_TTL = 5 * 60_000

export async function getTrxPrice(signal?: AbortSignal): Promise<number> {
  if (_trxPriceCache && Date.now() - _trxPriceCache.ts < TRX_PRICE_TTL) {
    return _trxPriceCache.price
  }

  const urls = [
    PROXY ? `${PROXY}/coingecko?ids=tron&vs_currencies=usd` : null,
    'https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd',
  ].filter(Boolean) as string[]

  for (const url of urls) {
    try {
      const res   = await fetch(url, { signal })
      if (!res.ok) continue
      const data  = await res.json()
      const price = data?.tron?.usd ?? 0
      if (price > 0) {
        _trxPriceCache = { price, ts: Date.now() }
        return price
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw e
      continue
    }
  }

  return _trxPriceCache?.price ?? TRX_PRICE_FALLBACK
}

// ── Tron API fetch helper — proxy first, fallback ke TronGrid public ──────────

async function tronFetch(
  path:    string,
  signal?: AbortSignal
): Promise<Response | null> {
  const urls = PROXY
    ? [`${PROXY}/tron${path}`, `${TRONGRID_PUBLIC}${path}`]
    : [`${TRONGRID_PUBLIC}${path}`]

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal })
      if (res.ok) return res
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw e
      continue
    }
  }
  return null
}

// ── Account balance ───────────────────────────────────────────────────────────

export async function fetchTronBalance(
  address: string,
  signal?: AbortSignal
): Promise<TronBalance> {
  const trxPrice = await getTrxPrice(signal)
  const res      = await tronFetch(`/v1/accounts/${address}`, signal)

  if (!res) {
    return { address, trxBalance: '0.000000', usdValue: 0 }
  }

  const data       = await res.json()
  const account    = data?.data?.[0]
  const sunBalance = account?.balance ?? 0
  const trxBalance = sunBalance / 1_000_000

  return {
    address,
    trxBalance: trxBalance.toFixed(6),
    usdValue:   trxBalance * trxPrice,
  }
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function fetchTronTransactions(
  address: string,
  limit    = 50,
  signal?: AbortSignal
): Promise<TronTransaction[]> {
  const params = new URLSearchParams({
    limit:     String(limit),
    only_from: 'false',
    order_by:  'block_timestamp,desc',
  })

  const trxPrice = await getTrxPrice(signal)
  const res      = await tronFetch(
    `/v1/accounts/${address}/transactions?${params}`,
    signal
  )

  if (!res) return []

  const data   = await res.json()
  const rawTxs = data?.data ?? []
  const txs: TronTransaction[] = []

  for (const tx of rawTxs) {
    try {
      const contract = tx?.raw_data?.contract?.[0]
      if (!contract || contract.type !== 'TransferContract') continue

      const value  = contract.parameter?.value ?? {}
      const amount = (value.amount ?? 0) / 1_000_000
      const from   = value.owner_address ?? ''
      const to     = value.to_address    ?? ''
      const success = tx?.ret?.[0]?.contractRet === 'SUCCESS'

      txs.push({
        txid:      tx.txID,
        from,
        to,
        valueTrx:  amount,
        valueUsd:  amount * trxPrice,
        blockTime: tx.block_timestamp ?? 0,
        type:      from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN',
        status:    success ? 'SUCCESS' : 'FAILED',
        fee:       (tx?.ret?.[0]?.fee ?? 0) / 1_000_000,
      })
    } catch { continue }
  }

  return txs
}

// ── Full wallet data ──────────────────────────────────────────────────────────

export async function fetchTronWalletData(
  address: string,
  signal?: AbortSignal
): Promise<TronWalletData> {
  const [balance, transactions] = await Promise.all([
    fetchTronBalance(address, signal),
    fetchTronTransactions(address, 50, signal),
  ])
  return { address, balance, transactions, lastUpdated: Date.now() }
}
