/**
 * ZERØ WATCH — useCrossWalletFlow v1
 * =====================================
 * Deteksi cross-wallet flows antar labeled whales.
 * Use case: Wintermute → Binance = SELL PRESSURE alert
 *           Coinbase Prime → BlackRock = ACCUMULATION
 *           Justin Sun → exchange = DUMP WARNING
 *
 * rgba() only ✓  AbortController ✓  mountedRef ✓
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ENTITY_LABELS } from '@/data/entityLabels'

// re-export for backward compat
export { ENTITY_LABELS } from '@/data/entityLabels'

const PROXY      = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const REFRESH_MS = 60_000
const MIN_USD    = 5_000_000  // $5M minimum untuk cross-wallet alert



// ── Signal interpretation ─────────────────────────────────────────────────────

export interface FlowSignal {
  type:      'SELL_PRESSURE' | 'ACCUMULATION' | 'MARKET_MAKER_EXIT' | 'WHALE_DUMP' | 'STABLECOIN_MINT' | 'SUSPICIOUS'
  label:     string
  color:     string
  bg:        string
  border:    string
  emoji:     string
  severity:  'HIGH' | 'MEDIUM' | 'LOW'
}

function interpretFlow(fromEntity: string, toEntity: string): FlowSignal {
  const from = fromEntity.toLowerCase()
  const to   = toEntity.toLowerCase()

  const isMarketMaker = (e: string) => ['wintermute', 'jump trading', 'dwf labs'].some(m => e.includes(m))
  const isCEX         = (e: string) => ['binance', 'coinbase', 'okx', 'bybit', 'kraken'].some(m => e.includes(m))
  const isJustinSun   = (e: string) => e.includes('justin sun')
  const isStablecoin  = (e: string) => ['tether', 'circle'].some(m => e.includes(m))

  // Market maker → CEX = sell pressure
  if (isMarketMaker(from) && isCEX(to)) return {
    type: 'SELL_PRESSURE', emoji: '⚠️',
    label: `${fromEntity} → ${toEntity}: SELL PRESSURE`,
    color: 'rgba(239,68,68,1)', bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.28)', severity: 'HIGH',
  }

  // Justin Sun → CEX = dump warning
  if (isJustinSun(from) && isCEX(to)) return {
    type: 'WHALE_DUMP', emoji: '🚨',
    label: `Justin Sun → ${toEntity}: DUMP WARNING`,
    color: 'rgba(239,68,68,1)', bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.35)', severity: 'HIGH',
  }

  // CEX → market maker = accumulation
  if (isCEX(from) && isMarketMaker(to)) return {
    type: 'ACCUMULATION', emoji: '🐂',
    label: `${fromEntity} → ${toEntity}: ACCUMULATION SIGNAL`,
    color: 'rgba(52,211,153,1)', bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.28)', severity: 'MEDIUM',
  }

  // Stablecoin mint = bullish
  if (isStablecoin(from)) return {
    type: 'STABLECOIN_MINT', emoji: '📈',
    label: `${fromEntity} minting: BULLISH SIGNAL`,
    color: 'rgba(52,211,153,1)', bg: 'rgba(52,211,153,0.06)',
    border: 'rgba(52,211,153,0.22)', severity: 'MEDIUM',
  }

  // Market maker → market maker = suspicious coordination
  if (isMarketMaker(from) && isMarketMaker(to)) return {
    type: 'SUSPICIOUS', emoji: '👀',
    label: `${fromEntity} → ${toEntity}: COORDINATION DETECTED`,
    color: 'rgba(251,191,36,1)', bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.28)', severity: 'HIGH',
  }

  return {
    type: 'SUSPICIOUS', emoji: '🔍',
    label: `${fromEntity} → ${toEntity}: CROSS-WHALE FLOW`,
    color: 'rgba(251,191,36,1)', bg: 'rgba(251,191,36,0.06)',
    border: 'rgba(251,191,36,0.22)', severity: 'LOW',
  }
}

// ── Cross-wallet flow event ───────────────────────────────────────────────────

export interface CrossFlow {
  id:          string
  hash:        string
  from:        string
  fromEntity:  string
  to:          string
  toEntity:    string
  valueEth:    number
  valueUsd:    number
  timestamp:   number
  signal:      FlowSignal
  tokenSymbol: string
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCrossWalletFlow() {
  const [flows,      setFlows]      = useState<CrossFlow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [ethPrice,   setEthPrice]   = useState(2000)
  const mountedRef   = useRef(true)
  const abortRef     = useRef<AbortController | null>(null)
  const seenRef      = useRef<Set<string>>(new Set())

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; abortRef.current?.abort() }
  }, [])

  const fetch30days = useCallback(async () => {
    if (!PROXY || !mountedRef.current) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    try {
      // Get ETH price
      const priceRes = await fetch(
        `${PROXY}/etherscan?chainid=1&module=stats&action=ethprice`,
        { signal }
      )
      const priceData = await priceRes.json()
      const ep = parseFloat(priceData?.result?.ethusd ?? '2000')
      if (mountedRef.current) setEthPrice(ep)

      // Fetch recent txs for top tracked wallets (sample 10 most active)
      const TRACKED = [
        '0xdbf5e9c5206d0db70a90108bf936da60221dc080', // Wintermute
        '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621', // Jump Trading
        '0xddacad3b1edee8e2f5b2e84f658202534fcb0374', // DWF Labs
        '0x3ddfa8ec3052539b6c9549f12cea2c295cff5296', // Justin Sun
        '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', // Binance Cold
        '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43', // Coinbase Prime
      ]

      const newFlows: CrossFlow[] = []

      for (const addr of TRACKED) {
        if (!mountedRef.current) break
        try {
          const res = await fetch(
            `${PROXY}/etherscan?chainid=1&module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`,
            { signal }
          )
          const data = await res.json()
          if (data?.status !== '1') continue

          for (const tx of (data.result ?? [])) {
            if (seenRef.current.has(tx.hash)) continue
            if (tx.isError === '1') continue

            const valueEth = parseFloat(tx.value) / 1e18
            const valueUsd = valueEth * ep

            if (valueUsd < MIN_USD) continue

            const fromAddr   = tx.from.toLowerCase()
            const toAddr     = tx.to?.toLowerCase() ?? ''
            const fromEntity = ENTITY_LABELS[fromAddr]
            const toEntity   = ENTITY_LABELS[toAddr]

            // Only care about labeled → labeled flows
            if (!fromEntity || !toEntity) continue
            if (fromEntity === toEntity) continue

            const signal = interpretFlow(fromEntity, toEntity)
            seenRef.current.add(tx.hash)

            newFlows.push({
              id:          tx.hash,
              hash:        tx.hash,
              from:        fromAddr,
              fromEntity,
              to:          toAddr,
              toEntity,
              valueEth,
              valueUsd,
              timestamp:   parseInt(tx.timeStamp) * 1000,
              signal,
              tokenSymbol: 'ETH',
            })
          }

          // Rate limit friendly
          await new Promise(r => setTimeout(r, 300))
        } catch { continue }
      }

      if (!mountedRef.current) return

      if (newFlows.length > 0) {
        setFlows(prev => {
          const combined = [...newFlows, ...prev]
          const unique = Array.from(new Map(combined.map(f => [f.id, f])).values())
          return unique.slice(0, 50).sort((a, b) => b.timestamp - a.timestamp)
        })
      }

      setLoading(false)
      setError(null)
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      if (mountedRef.current) setError('Flow detection unavailable')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch30days()
    const interval = setInterval(fetch30days, REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetch30days])

  const highSeverity = useMemo(() =>
    flows.filter(f => f.signal.severity === 'HIGH'),
    [flows]
  )

  const fmtUsd = (n: number) => {
    if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`
    if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`
    return `$${(n/1e3).toFixed(0)}K`
  }

  return { flows, highSeverity, loading, error, ethPrice, fmtUsd, refetch: fetch30days }
}
