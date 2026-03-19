/**
 * ZERØ WATCH — Solana API Service v2
 * =====================================
 * v2 fixes:
 * - Proxy 404/500 → auto-fallback ke public Solana RPC langsung
 * - SOL price 429 → fallback ke cached value lalu hardcoded default
 * - Aggressive caching 5 menit untuk harga
 *
 * AbortController ✓  mountedRef compatible ✓
 */

const PROXY      = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const SOL_PUBLIC = 'https://api.mainnet-beta.solana.com'

function getSolRpcUrls(): string[] {
  return PROXY ? [`${PROXY}/solana`, SOL_PUBLIC] : [SOL_PUBLIC]
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SolTokenHolding {
  symbol:      string
  name:        string
  balance:     string
  usdValue:    number
  mintAddress: string
}

export interface SolWalletBalance {
  address:    string
  solBalance: string
  usdValue:   number
  tokens:     SolTokenHolding[]
}

export interface SolTransaction {
  signature: string
  blockTime: number
  type:      'TRANSFER' | 'SWAP' | 'UNKNOWN'
  valueSOL:  number
  from:      string
  to:        string
  err:       boolean
}

export interface SolWalletData {
  address:      string
  balance:      SolWalletBalance
  transactions: SolTransaction[]
  lastUpdated:  number
}

export function isValidSolAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim())
}

// ── RPC helper — proxy first, auto-fallback ke public RPC ────────────────────

async function rpcPost<T>(
  method: string,
  params: unknown[],
  signal?: AbortSignal
): Promise<T | null> {
  for (const url of getSolRpcUrls()) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal,
      })
      if (!res.ok) continue
      const json = await res.json() as { result?: T; error?: unknown }
      if (json.error) continue
      return json.result ?? null
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw e
      continue  // CORS / network error → coba URL berikutnya
    }
  }
  return null
}

// ── SOL Price — aggressive caching 5 menit ───────────────────────────────────

let _cachedSolPrice    = 150
let _solPriceCacheTime = 0
const SOL_PRICE_TTL    = 5 * 60_000

export async function getSolPrice(signal?: AbortSignal): Promise<number> {
  if (Date.now() - _solPriceCacheTime < SOL_PRICE_TTL) return _cachedSolPrice

  const urls = [
    PROXY ? `${PROXY}/coingecko/price?ids=solana&vs_currencies=usd` : null,
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
  ].filter(Boolean) as string[]

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal })
      if (!res.ok) continue
      const data  = await res.json() as { solana?: { usd?: number } }
      const price = data?.solana?.usd ?? 0
      if (price > 0) {
        _cachedSolPrice    = price
        _solPriceCacheTime = Date.now()
        return price
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw e
      continue
    }
  }

  return _cachedSolPrice
}

// ── SOL Balance ───────────────────────────────────────────────────────────────

export async function getSolBalance(
  address: string,
  signal?: AbortSignal
): Promise<string> {
  const result = await rpcPost<number>(
    'getBalance',
    [address, { commitment: 'confirmed' }],
    signal
  )
  if (result === null) return '0'
  return ((result as unknown as number) / 1e9).toFixed(4)
}

// ── SPL Token Accounts ────────────────────────────────────────────────────────

interface TokenAccountResult {
  account: {
    data: {
      parsed: {
        info: {
          mint:        string
          tokenAmount: { uiAmountString: string }
        }
      }
    }
  }
}

const KNOWN_SPL: Record<string, { symbol: string; name: string; isStable?: boolean; isSOL?: boolean }> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC',   name: 'USD Coin',    isStable: true  },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT',   name: 'Tether',       isStable: true  },
  'So11111111111111111111111111111111111111112':    { symbol: 'wSOL',   name: 'Wrapped SOL',  isSOL:    true  },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL',   name: 'Marinade SOL', isSOL:    true  },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK',   name: 'Bonk'                          },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF',    name: 'dogwifhat'                     },
  'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM':  { symbol: 'USDCet', name: 'USDC (Portal)',isStable: true  },
}

export async function getSolTokens(
  address:  string,
  solPrice: number,
  signal?:  AbortSignal
): Promise<SolTokenHolding[]> {
  const result = await rpcPost<{ value: TokenAccountResult[] }>(
    'getTokenAccountsByOwner',
    [
      address,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding:  'jsonParsed' },
    ],
    signal
  )

  if (!result?.value) return []

  const holdings: SolTokenHolding[] = []
  for (const acct of result.value.slice(0, 20)) {
    try {
      const info = acct.account.data.parsed.info
      const bal  = parseFloat(info.tokenAmount.uiAmountString) || 0
      if (bal <= 0) continue
      const known = KNOWN_SPL[info.mint]
      if (!known) continue

      const usdValue = known.isStable ? bal : known.isSOL ? bal * solPrice : 0

      holdings.push({
        symbol:      known.symbol,
        name:        known.name,
        balance:     bal >= 1_000_000 ? `${(bal / 1_000_000).toFixed(2)}M`
                   : bal >= 1_000     ? `${(bal / 1_000).toFixed(1)}K`
                   : bal.toFixed(4),
        usdValue,
        mintAddress: info.mint,
      })
    } catch { continue }
  }

  return holdings.sort((a, b) => b.usdValue - a.usdValue)
}

// ── Transactions ──────────────────────────────────────────────────────────────

interface SignatureInfo { signature: string; blockTime: number | null; err: unknown }
interface ParsedTx {
  blockTime: number | null
  meta:      { err: unknown; preBalances: number[]; postBalances: number[] } | null
  transaction: {
    message: {
      accountKeys:  Array<{ pubkey: string }>
      instructions: Array<{ program?: string; programId?: string }>
    }
  }
}

export async function getSolTransactions(
  address: string,
  limit    = 20,
  signal?: AbortSignal
): Promise<SolTransaction[]> {
  const sigs = await rpcPost<SignatureInfo[]>(
    'getSignaturesForAddress',
    [address, { limit, commitment: 'confirmed' }],
    signal
  )
  if (!sigs || sigs.length === 0) return []

  const txSigs = sigs.slice(0, 10).map(s => s.signature)
  const parsed = await rpcPost<(ParsedTx | null)[]>(
    'getMultipleParsedTransactions' as string,
    [txSigs, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
    signal
  )

  if (!parsed) {
    return sigs.slice(0, limit).map(sig => ({
      signature: sig.signature,
      blockTime: sig.blockTime ?? Math.floor(Date.now() / 1000),
      type:      'UNKNOWN' as const,
      valueSOL:  0,
      from:      address,
      to:        '',
      err:       sig.err != null,
    }))
  }

  const results: SolTransaction[] = []
  for (let i = 0; i < txSigs.length; i++) {
    const tx  = (parsed as unknown as (ParsedTx | null)[])[i]
    const sig = sigs[i]
    if (!tx) continue

    const accts    = tx.transaction.message.accountKeys.map(k => k.pubkey)
    const preBals  = tx.meta?.preBalances  ?? []
    const postBals = tx.meta?.postBalances ?? []
    const addrIdx  = accts.indexOf(address)
    const balDelta = addrIdx >= 0
      ? Math.abs((postBals[addrIdx] ?? 0) - (preBals[addrIdx] ?? 0)) / 1e9
      : 0

    const hasSwap = tx.transaction.message.instructions.some(ix =>
      (ix.program ?? ix.programId ?? '').toLowerCase().includes('swap') ||
      (ix.programId ?? '') === 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB'
    )

    results.push({
      signature: sig.signature,
      blockTime: tx.blockTime ?? sig.blockTime ?? Math.floor(Date.now() / 1000),
      type:      hasSwap ? 'SWAP' : balDelta > 0 ? 'TRANSFER' : 'UNKNOWN',
      valueSOL:  balDelta,
      from:      accts[0] ?? address,
      to:        accts[1] ?? '',
      err:       tx.meta?.err != null,
    })
  }

  return results
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchSolWalletData(
  address: string,
  signal?: AbortSignal
): Promise<SolWalletData> {
  const [solPrice, solBalance, transactions] = await Promise.all([
    getSolPrice(signal),
    getSolBalance(address, signal),
    getSolTransactions(address, 20, signal),
  ])

  const tokens   = await getSolTokens(address, solPrice, signal)
  const solUsd   = parseFloat(solBalance) * solPrice
  const tokenUsd = tokens.reduce((s, t) => s + t.usdValue, 0)

  return {
    address,
    balance: { address, solBalance, usdValue: solUsd + tokenUsd, tokens },
    transactions,
    lastUpdated: Date.now(),
  }
}
