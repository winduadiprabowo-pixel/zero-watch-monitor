/**
 * ZERØ WATCH — tronApi.ts v1
 * ============================
 * TRON blockchain data via CF Worker proxy → TronGrid API
 * Endpoint: GET /v1/accounts/{address}/transactions
 *
 * Unit: SUN — 1 TRX = 1,000,000 SUN
 * No API key for basic usage (rate-limited by TronGrid free tier)
 *
 * rgba() only ✓  AbortController ✓
 */

const PROXY = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''

const TRX_PRICE_FALLBACK = 0.12  // fallback if CoinGecko fails

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TronBalance {
  address:    string
  trxBalance: string   // human-readable TRX (not SUN)
  usdValue:   number
}

export interface TronTransaction {
  txid:        string
  from:        string
  to:          string
  valueTrx:    number  // TRX amount
  valueUsd:    number
  blockTime:   number  // unix ms
  type:        'IN' | 'OUT' | 'INTERNAL'
  status:      'SUCCESS' | 'FAILED'
  fee:         number  // TRX
}

export interface TronWalletData {
  address:      string
  balance:      TronBalance
  transactions: TronTransaction[]
  lastUpdated:  number
}

// ── TRX price ─────────────────────────────────────────────────────────────────

let _trxPriceCache: { price: number; ts: number } | null = null
const PRICE_TTL = 60_000

export async function getTrxPrice(signal?: AbortSignal): Promise<number> {
  if (_trxPriceCache && Date.now() - _trxPriceCache.ts < PRICE_TTL) {
    return _trxPriceCache.price
  }

  try {
    const url = PROXY
      ? `${PROXY}/coingecko?ids=tron&vs_currencies=usd`
      : 'https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd'

    const res  = await fetch(url, { signal })
    const data = await res.json()
    const price = data?.tron?.usd ?? TRX_PRICE_FALLBACK

    _trxPriceCache = { price, ts: Date.now() }
    return price
  } catch {
    return _trxPriceCache?.price ?? TRX_PRICE_FALLBACK
  }
}

// ── Account balance ───────────────────────────────────────────────────────────

export async function fetchTronBalance(
  address: string,
  signal?: AbortSignal
): Promise<TronBalance> {
  // TronGrid: GET /v1/accounts/{address}
  const url = PROXY
    ? `${PROXY}/tron/v1/accounts/${address}`
    : `https://api.trongrid.io/v1/accounts/${address}`

  const res  = await fetch(url, { signal })
  if (!res.ok) throw new Error(`TronGrid balance error: ${res.status}`)

  const data  = await res.json()
  const account = data?.data?.[0]

  // balance in SUN → TRX
  const sunBalance = account?.balance ?? 0
  const trxBalance = sunBalance / 1_000_000

  const trxPrice   = await getTrxPrice(signal)
  const usdValue   = trxBalance * trxPrice

  return {
    address,
    trxBalance: trxBalance.toFixed(6),
    usdValue,
  }
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function fetchTronTransactions(
  address: string,
  limit  = 50,
  signal?: AbortSignal
): Promise<TronTransaction[]> {
  // TronGrid: GET /v1/accounts/{address}/transactions
  const params = new URLSearchParams({
    limit:     String(limit),
    only_from: 'false',
    order_by:  'block_timestamp,desc',
  })

  const url = PROXY
    ? `${PROXY}/tron/v1/accounts/${address}/transactions?${params}`
    : `https://api.trongrid.io/v1/accounts/${address}/transactions?${params}`

  const res  = await fetch(url, { signal })
  if (!res.ok) throw new Error(`TronGrid tx error: ${res.status}`)

  const data     = await res.json()
  const rawTxs   = data?.data ?? []
  const trxPrice = await getTrxPrice(signal)

  const txs: TronTransaction[] = []

  for (const tx of rawTxs) {
    try {
      const contract = tx?.raw_data?.contract?.[0]
      if (!contract) continue

      // Only TransferContract (TRX transfer, type 1)
      if (contract.type !== 'TransferContract') continue

      const value  = contract.parameter?.value ?? {}
      const amount = (value.amount ?? 0) / 1_000_000  // SUN → TRX

      const from  = value.owner_address ?? ''
      const to    = value.to_address    ?? ''

      const success = tx?.ret?.[0]?.contractRet === 'SUCCESS'
      const addrLow = address.toLowerCase()

      txs.push({
        txid:      tx.txID,
        from,
        to,
        valueTrx:  amount,
        valueUsd:  amount * trxPrice,
        blockTime: tx.block_timestamp ?? 0,
        type:      from.toLowerCase() === addrLow ? 'OUT' : 'IN',
        status:    success ? 'SUCCESS' : 'FAILED',
        fee:       (tx?.ret?.[0]?.fee ?? 0) / 1_000_000,
      })
    } catch {
      continue
    }
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

  return {
    address,
    balance,
    transactions,
    lastUpdated: Date.now(),
  }
}

// ── Address validation (used by AddWalletModal) ───────────────────────────────

/** TRON address: starts with T, exactly 34 chars, base58 */
export function isValidTronAddress(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address.trim())
}
