/**
 * ZERØ WATCH — useWhaleTracker v1
 * =================================
 * Live large ETH + ERC20 tx feed dari labeled exchange wallets.
 * Semua Etherscan calls via CF Worker proxy — API key tidak exposed di client.
 *
 * Proxy route: GET ${VITE_PROXY_URL}/etherscan?chainid=1&...
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'

// ── Config ─────────────────────────────────────────────────────────────────────

const PROXY      = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const REFRESH_MS = 30_000
const MIN_ETH    = 50
const MIN_USD    = 1_000_000
const MAX_TXS    = 60

// ── Known whale wallet labels — 40+ entries ───────────────────────────────────

export const WHALE_LABELS = Object.freeze<Record<string, string>>({
  // Binance
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': 'Binance Cold',
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': 'Binance Hot 1',
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance 14',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance 15',
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance 16',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': 'Binance 17',
  '0xf977814e90da44bfa03b6295a0616a897441acec': 'Binance 8',
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance 1',
  '0xd551234ae421e3bcba99a0da6d736074f22192ff': 'Binance 2',
  '0x564286362092d8e7936f0549571a803b203aaced': 'Binance 3',
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf': 'Binance 4',
  '0xfe9e8709d3215310075d67e3ed32a380ccf451c8': 'Binance 5',
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67': 'Binance 6',
  // Bitfinex
  '0x9696f59e4d72e237be84ffd425dcad154bf96976': 'Bitfinex Whale',
  '0x742d35cc6634c0532925a3b844bc454e4438f44e': 'Bitfinex Cold',
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec': 'Bitfinex 2',
  '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f': 'Bitfinex 3',
  // OKX
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': 'OKX Exchange',
  '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': 'OKX Cold',
  '0xa7efae728d2936e78bda97dc267687568dd593f3': 'OKX 2',
  // Coinbase
  '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase 2',
  '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740': 'Coinbase 3',
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': 'Coinbase 4',
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': 'Coinbase 5',
  // Kraken
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken 1',
  '0xc6cde7c39eb2f0f0095f41570af89efc2c1ea828': 'Kraken 2',
  '0xae2d4617c862309a3d75a0ffb358c7a5009c673f': 'Kraken 3',
  '0x43984d578803891dfa9706bdeee6078d80cfc79e': 'Kraken 4',
  '0x66c57bf505a85a74609d2c83e7f8b4c47d6b6a38': 'Kraken Cold',
  // Huobi
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': 'Huobi 1',
  '0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b': 'Huobi 2',
  '0xfdb16996831753d5331ff813c29a93c76834a0ad': 'Huobi 3',
  '0xeee28d484628d41a82d01e21d12e2e78d69920da': 'Huobi 10',
  // KuCoin
  '0xd6216fc19db775df9774a6e33526131da7d19a2c': 'KuCoin 1',
  '0x736d4a74e28d600ac21ee97a56e8c08f660f2dff': 'KuCoin Hot',
  // Gemini
  '0xd24400ae8bfebb18ca49be86258a3c749cf46853': 'Gemini 1',
  '0x07ee55aa48bb72dcc6e9d78256648910de513eca': 'Gemini 2',
  // Jump Trading
  '0x9b00043c37e24d5fc6a2481c8a36ed5a55a23a81': 'Jump Trading',
  // Cumberland
  '0x8c9b99d9adca22d934e3a756d75f031f12011867': 'Cumberland',
  // Wintermute
  '0x00000000ae347930bd1e7b0f35588b92280f9e75': 'Wintermute',
})

// ── ERC-20 tokens tracked ─────────────────────────────────────────────────────

const ERC20_TOKENS = Object.freeze([
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', decimals: 6  },
  { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', decimals: 6  },
  { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', decimals: 8  },
  { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', decimals: 18 },
  { address: '0x6b175474e89094c44da98b954eedeac495271d0f', symbol: 'DAI',  decimals: 18 },
] as const)

// ── Raw Etherscan types ───────────────────────────────────────────────────────

interface EthTx {
  hash: string; from: string; to: string; value: string
  timeStamp: string; blockNumber: string; isError?: string
}

interface Erc20Tx {
  hash: string; from: string; to: string; value: string
  timeStamp: string; blockNumber: string; tokenDecimal?: string
}

interface GasOracle {
  SafeGasPrice: string; ProposeGasPrice: string
  FastGasPrice: string; LastBlock: string
}

interface EsResponse<T> { status: string; result: T }

// ── Public types ──────────────────────────────────────────────────────────────

export interface WhaleTx {
  hash:         string
  from:         string
  fromLabel:    string | null
  to:           string
  toLabel:      string | null
  valueEth:     number
  valueUsd:     number
  timestamp:    number
  blockNumber:  number
  type:         'ETH' | 'ERC20'
  tokenSymbol?: string
  isWhale:      boolean   // > $1M
  isMega:       boolean   // > $10M
}

export interface GasInfo {
  safeGwei:    number
  proposeGwei: number
  fastGwei:    number
  lastBlock:   number
  congestion:  'low' | 'normal' | 'high' | 'critical'
}

export interface WhaleTrackerState {
  txs:         WhaleTx[]
  gas:         GasInfo | null
  ethPrice:    number
  loading:     boolean
  error:       string | null
  lastUpdated: number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function labelAddr(addr: string): string | null {
  return WHALE_LABELS[addr.toLowerCase()] ?? null
}

export function shortAddr(addr: string): string {
  if (addr.length < 12) return addr
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

function safeFloat(s: string, fallback = 0): number {
  const n = parseFloat(s)
  return isFinite(n) ? n : fallback
}

function safeInt(s: string, fallback = 0): number {
  const n = parseInt(s, 10)
  return isFinite(n) ? n : fallback
}

function classifyCongestion(fastGwei: number): GasInfo['congestion'] {
  if (fastGwei < 15)  return 'low'
  if (fastGwei < 50)  return 'normal'
  if (fastGwei < 120) return 'high'
  return 'critical'
}

async function proxyGet<T>(
  params: Record<string, string>,
  signal: AbortSignal
): Promise<EsResponse<T> | null> {
  if (!PROXY) return null
  const qs  = new URLSearchParams({ chainid: '1', ...params }).toString()
  const res = await fetch(`${PROXY}/etherscan?${qs}`, { signal })
  if (res.status === 429) throw new Error('Rate limited — retrying shortly')
  if (!res.ok) throw new Error('Proxy error ' + res.status)
  return res.json() as Promise<EsResponse<T>>
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchGas(signal: AbortSignal): Promise<GasInfo | null> {
  const json = await proxyGet<GasOracle>(
    { module: 'gastracker', action: 'gasoracle' },
    signal
  )
  if (!json || json.status !== '1') return null
  const d         = json.result
  const fastGwei  = safeFloat(d.FastGasPrice)
  return {
    safeGwei:    safeFloat(d.SafeGasPrice),
    proposeGwei: safeFloat(d.ProposeGasPrice),
    fastGwei,
    lastBlock:   safeInt(d.LastBlock),
    congestion:  classifyCongestion(fastGwei),
  }
}

async function fetchEthPrice(signal: AbortSignal): Promise<number> {
  const json = await proxyGet<{ ethusd: string }>(
    { module: 'stats', action: 'ethprice' },
    signal
  )
  return json ? safeFloat(json.result?.ethusd ?? '0') : 0
}

const TOP_WHALE_ADDRS = Object.freeze([
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', // Binance Cold
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance 14
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 15
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance 16
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2', // Kraken 1
] as const)

async function fetchEthTxsForAddr(
  addr: string,
  ethPrice: number,
  signal: AbortSignal
): Promise<WhaleTx[]> {
  const json = await proxyGet<EthTx[] | string>({
    module: 'account', action: 'txlist', address: addr,
    startblock: '0', endblock: '99999999',
    sort: 'desc', page: '1', offset: '25',
  }, signal)
  if (!json || json.status !== '1' || !Array.isArray(json.result)) return []

  return (json.result as EthTx[])
    .filter(tx => tx.isError !== '1')
    .map((tx): WhaleTx => {
      const valueEth = safeInt(tx.value) / 1e18
      const valueUsd = valueEth * ethPrice
      return {
        hash: tx.hash, from: tx.from, fromLabel: labelAddr(tx.from),
        to: tx.to, toLabel: labelAddr(tx.to),
        valueEth, valueUsd,
        timestamp:   safeInt(tx.timeStamp) * 1000,
        blockNumber: safeInt(tx.blockNumber),
        type: 'ETH',
        isWhale: valueUsd >= 1_000_000,
        isMega:  valueUsd >= 10_000_000,
      }
    })
    .filter(tx => tx.valueEth >= MIN_ETH)
}

async function fetchLargeEthTxs(ethPrice: number, signal: AbortSignal): Promise<WhaleTx[]> {
  const results = await Promise.allSettled(
    TOP_WHALE_ADDRS.map(addr => fetchEthTxsForAddr(addr, ethPrice, signal))
  )
  const all: WhaleTx[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }
  return all
}

async function fetchLargeErc20Txs(ethPrice: number, signal: AbortSignal): Promise<WhaleTx[]> {
  const all: WhaleTx[] = []
  for (const token of ERC20_TOKENS) {
    if (signal.aborted) break
    try {
      const json = await proxyGet<Erc20Tx[] | string>({
        module: 'account', action: 'tokentx',
        contractaddress: token.address,
        page: '1', offset: '50', sort: 'desc',
      }, signal)
      if (!json || json.status !== '1' || !Array.isArray(json.result)) continue

      const txs = (json.result as Erc20Tx[])
        .map((tx): WhaleTx => {
          const decimals = safeInt(tx.tokenDecimal ?? String(token.decimals))
          let valueUsd   = safeInt(tx.value) / (10 ** decimals)
          if (token.symbol === 'WETH') valueUsd = valueUsd * ethPrice
          if (token.symbol === 'WBTC') valueUsd = valueUsd * ethPrice * 15 // rough BTC ratio
          return {
            hash: tx.hash, from: tx.from, fromLabel: labelAddr(tx.from),
            to: tx.to, toLabel: labelAddr(tx.to),
            valueEth:    token.symbol === 'WETH' ? safeInt(tx.value) / 1e18 : 0,
            valueUsd,
            timestamp:   safeInt(tx.timeStamp) * 1000,
            blockNumber: safeInt(tx.blockNumber),
            type: 'ERC20', tokenSymbol: token.symbol,
            isWhale: valueUsd >= 1_000_000,
            isMega:  valueUsd >= 10_000_000,
          }
        })
        .filter(tx => tx.valueUsd >= MIN_USD)

      all.push(...txs)

      // Respek rate limit 5/s — 220ms delay antar token
      if (!signal.aborted) {
        await new Promise<void>(res => setTimeout(res, 220))
      }
    } catch {
      // skip token gagal, lanjut
    }
  }
  return all
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWhaleTracker() {
  const [state, setState] = useState<WhaleTrackerState>({
    txs: [], gas: null, ethPrice: 0,
    loading: true, error: null, lastUpdated: null,
  })

  const mountedRef = useRef(true)
  const abortRef   = useRef(new AbortController())
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!mountedRef.current) return
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) void fetchAll()
    }, REFRESH_MS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = useCallback(async () => {
    abortRef.current.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    if (!mountedRef.current) return

    if (!PROXY) {
      setState(prev => ({ ...prev, loading: false, error: 'VITE_PROXY_URL not configured' }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Parallel: gas + ETH price
      const [gas, ethPrice] = await Promise.all([
        fetchGas(signal),
        fetchEthPrice(signal),
      ])
      if (!mountedRef.current || signal.aborted) return

      // Sequential: ETH txs then ERC20 (respects rate limit)
      const ethTxs = await fetchLargeEthTxs(ethPrice, signal)
      if (!mountedRef.current || signal.aborted) return

      const erc20Txs = await fetchLargeErc20Txs(ethPrice, signal)
      if (!mountedRef.current || signal.aborted) return

      // Merge, dedupe by hash, sort by time, cap
      const seen  = new Set<string>()
      const allTxs = [...ethTxs, ...erc20Txs]
        .filter(tx => { if (seen.has(tx.hash)) return false; seen.add(tx.hash); return true })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_TXS)

      setState({ txs: allTxs, gas, ethPrice, loading: false, error: null, lastUpdated: Date.now() })
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      if (!mountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Failed to fetch whale data'
      setState(prev => ({ ...prev, loading: false, error: msg }))
    }

    scheduleNext()
  }, [scheduleNext])

  useEffect(() => {
    mountedRef.current = true
    void fetchAll()
    return () => {
      mountedRef.current = false
      abortRef.current.abort()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fetchAll])

  const refetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    void fetchAll()
  }, [fetchAll])

  const stats = useMemo(() => {
    const { txs, ethPrice } = state
    const totalUsd    = txs.reduce((s, t) => s + t.valueUsd, 0)
    const megaCount   = txs.filter(t => t.isMega).length
    const whaleCount  = txs.filter(t => t.isWhale).length
    const exchangeOut = txs
      .filter(t => t.fromLabel !== null && t.toLabel === null)
      .reduce((s, t) => s + t.valueUsd, 0)
    const exchangeIn  = txs
      .filter(t => t.fromLabel === null && t.toLabel !== null)
      .reduce((s, t) => s + t.valueUsd, 0)
    return { totalUsd, megaCount, whaleCount, exchangeOut, exchangeIn, ethPrice }
  }, [state])

  return useMemo(() => ({ ...state, stats, refetch }), [state, stats, refetch])
}
