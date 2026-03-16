/**
 * ZERØ WATCH — bnbApi.ts v1
 * ==========================
 * BNB Smart Chain (BSC) data via CF Worker proxy → Etherscan V2
 * chainid = 56 (BSC mainnet)
 *
 * BNB address format = same as ETH (0x, 42 chars, EVM-compatible)
 * Native token: BNB (not ETH)
 * No Alchemy support for BSC — Etherscan V2 only
 *
 * rgba() only ✓  AbortController ✓
 */

const PROXY = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const BNB_CHAIN_ID = 56

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BnbBalance {
  address:    string
  bnbBalance: string   // human-readable BNB
  usdValue:   number
}

export interface BnbTransaction {
  hash:         string
  from:         string
  to:           string
  valueBnb:     number
  valueUsd:     number
  timeStamp:    string   // unix seconds string
  isError:      string
  functionName: string
  gasUsed:      string
  type:         'SWAP' | 'TRANSFER' | 'DEPOSIT' | 'BORROW' | 'UNKNOWN'
}

export interface BnbWalletData {
  address:      string
  balance:      BnbBalance
  transactions: BnbTransaction[]
  lastUpdated:  number
}

// ── BNB price ─────────────────────────────────────────────────────────────────

let _bnbPriceCache: { price: number; ts: number } | null = null
const PRICE_TTL = 60_000
const BNB_PRICE_FALLBACK = 600

export async function getBnbPrice(signal?: AbortSignal): Promise<number> {
  if (_bnbPriceCache && Date.now() - _bnbPriceCache.ts < PRICE_TTL) {
    return _bnbPriceCache.price
  }
  try {
    const url = PROXY
      ? `${PROXY}/coingecko/price?ids=binancecoin&vs_currencies=usd`
      : 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd'

    const res  = await fetch(url, { signal })
    const data = await res.json()
    const price = data?.binancecoin?.usd ?? BNB_PRICE_FALLBACK

    _bnbPriceCache = { price, ts: Date.now() }
    return price
  } catch {
    return _bnbPriceCache?.price ?? BNB_PRICE_FALLBACK
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function classifyBnbTx(fn: string): BnbTransaction['type'] {
  const f = fn.toLowerCase()
  if (f.includes('swap'))                              return 'SWAP'
  if (f.includes('deposit') || f.includes('supply'))   return 'DEPOSIT'
  if (f.includes('borrow'))                            return 'BORROW'
  return 'TRANSFER'
}

async function etherscanV2<T>(
  params: Record<string, string | number>,
  signal?: AbortSignal
): Promise<T> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString()
  const res = await fetch(`${PROXY}/etherscan?${qs}`, { signal })
  if (!res.ok) throw new Error(`Etherscan BSC proxy ${res.status}`)
  return res.json() as Promise<T>
}

// ── Balance ───────────────────────────────────────────────────────────────────

export async function fetchBnbBalance(
  address: string,
  signal?: AbortSignal
): Promise<BnbBalance> {
  const [balData, bnbPrice] = await Promise.all([
    etherscanV2<{ status: string; result: string }>({
      chainid: BNB_CHAIN_ID,
      module:  'account',
      action:  'balance',
      address,
      tag:     'latest',
    }, signal),
    getBnbPrice(signal),
  ])

  const bnbBalance = balData.status === '1'
    ? (Number(BigInt(balData.result)) / 1e18).toFixed(4)
    : '0'

  return {
    address,
    bnbBalance,
    usdValue: parseFloat(bnbBalance) * bnbPrice,
  }
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function fetchBnbTransactions(
  address: string,
  limit   = 25,
  signal?: AbortSignal
): Promise<BnbTransaction[]> {
  const [data, bnbPrice] = await Promise.all([
    etherscanV2<{
      status: string
      result: Array<{
        hash: string; from: string; to: string; value: string
        timeStamp: string; isError: string; functionName: string; gasUsed: string
      }>
    }>({
      chainid:    BNB_CHAIN_ID,
      module:     'account',
      action:     'txlist',
      address,
      startblock: 0,
      endblock:   99999999,
      page:       1,
      offset:     limit,
      sort:       'desc',
    }, signal),
    getBnbPrice(signal),
  ])

  if (data.status !== '1' || !Array.isArray(data.result)) return []

  return data.result.map(tx => {
    const valueBnb = Number(tx.value) / 1e18
    return {
      hash:         tx.hash,
      from:         tx.from,
      to:           tx.to ?? '',
      valueBnb,
      valueUsd:     valueBnb * bnbPrice,
      timeStamp:    tx.timeStamp,
      isError:      tx.isError,
      functionName: tx.functionName,
      gasUsed:      tx.gasUsed,
      type:         classifyBnbTx(tx.functionName),
    }
  })
}

// ── Full wallet data ──────────────────────────────────────────────────────────

export async function fetchBnbWalletData(
  address: string,
  signal?: AbortSignal
): Promise<BnbWalletData> {
  const [balance, transactions] = await Promise.all([
    fetchBnbBalance(address, signal),
    fetchBnbTransactions(address, 25, signal),
  ])

  return {
    address,
    balance,
    transactions,
    lastUpdated: Date.now(),
  }
}
