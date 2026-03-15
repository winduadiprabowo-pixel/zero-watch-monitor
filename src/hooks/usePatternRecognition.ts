/**
 * ZERØ WATCH — usePatternRecognition v1
 * ========================================
 * Deteksi koordinasi multi-market-maker:
 * - 2+ MM → CEX dalam 30 menit = ⚠️ WARNING (confidence 72%)
 * - 3+ MM → CEX dalam 30 menit = 🚨 CRITICAL (confidence 85%)
 * - 2+ MM koordinasi antar sesama = 👀 COORDINATION (confidence 65%)
 * - Justin Sun + MM → CEX = 🚨 COMBINED DUMP (confidence 88%)
 *
 * Prevent Oct 10 2025 type event.
 *
 * rgba() only ✓  AbortController ✓  mountedRef ✓  useCallback ✓
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ENTITY_LABELS } from './useCrossWalletFlow'

const PROXY      = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const REFRESH_MS = 60_000
const WINDOW_MS  = 30 * 60 * 1000   // 30 menit window
const MIN_USD    = 1_000_000         // $1M minimum untuk pattern detection

// ── Market Maker addresses ────────────────────────────────────────────────────

const MARKET_MAKERS = new Set([
  '0xdbf5e9c5206d0db70a90108bf936da60221dc080', // Wintermute
  '0x0000006daea1723962647b7e189d311d757fb793', // Wintermute 2
  '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621', // Jump Trading
  '0x9507c04b10486547584c37bcbd931b2a4fee9a41', // Jump Trading 2
  '0xddacad3b1edee8e2f5b2e84f658202534fcb0374', // DWF Labs
  '0xd4b69e8d62c880e9dd55d419d5e07435c3538342', // DWF Labs 2
])

const JUSTIN_SUN = new Set([
  '0x3ddfa8ec3052539b6c9549f12cea2c295cff5296',
  '0x176f3dab24a159341c0509bb36b833e7fdd0a132',
])

const CEX_ADDRESSES = new Set([
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', // Binance Cold
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance Hot
  '0xf977814e90da44bfa03b6295a0616a897441acec', // Binance 8
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', // Binance 7
  '0xd551234ae421e3bcba99a0da6d736074f22192ff', // Binance 4
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43', // Coinbase Prime
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', // Coinbase Hot
  '0x503828976d22510aad0201ac7ec88293211d23da', // Coinbase 2
  '0xa7efae728d2936e78bda97dc267687568dd593f3', // Coinbase Cold
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', // Kraken
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2', // Kraken 2
  '0x46340b20830761efd32832a74d7169b29feb9758', // OKX
  '0x98ec059dc3adfbdd63429454aeb0c990fba4a128', // Bybit
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40', // Bybit 2
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe', // Gate.io
  '0xe0f30cb149faadc7247e953746be9bbbb6b5751f', // Crypto.com
])

// ── Types ─────────────────────────────────────────────────────────────────────

export type PatternType =
  | 'MM_TRIPLE_CEX'      // 3+ MM → CEX dalam 30 menit
  | 'MM_DOUBLE_CEX'      // 2 MM → CEX dalam 30 menit
  | 'MM_COORDINATION'    // 2+ MM → MM (antar sesama)
  | 'SUN_PLUS_MM'        // Justin Sun + MM → CEX bersamaan
  | 'SWEEP'              // 1 MM transfer sangat besar ($20M+)

export type PatternSeverity = 'CRITICAL' | 'WARNING' | 'INFO'

export interface PatternEvent {
  id:          string
  type:        PatternType
  severity:    PatternSeverity
  emoji:       string
  title:       string
  description: string
  confidence:  number
  actors:      string[]           // entity names involved
  totalUsd:    number
  firstSeen:   number             // unix ms
  lastSeen:    number             // unix ms
  txHashes:    string[]
}

interface RawMove {
  hash:      string
  from:      string
  to:        string
  entity:    string               // entity name dari ENTITY_LABELS
  valueUsd:  number
  timestamp: number               // unix ms
  isCexDest: boolean
  isMMDest:  boolean
  isSunFrom: boolean
}

// ── Pattern Engine ────────────────────────────────────────────────────────────

function detectPatterns(moves: RawMove[]): PatternEvent[] {
  const now     = Date.now()
  const patterns: PatternEvent[] = []
  const used    = new Set<string>()

  // Sort newest first
  const sorted = [...moves].sort((a, b) => b.timestamp - a.timestamp)

  // ── 1. MM → CEX dalam 30 menit window ───────────────────────────────────────
  const mmCexMoves = sorted.filter(m =>
    MARKET_MAKERS.has(m.from.toLowerCase()) &&
    CEX_ADDRESSES.has(m.to.toLowerCase()) &&
    (now - m.timestamp) < WINDOW_MS
  )

  // Group by unique MM entity
  const mmCexByEntity = new Map<string, RawMove[]>()
  for (const m of mmCexMoves) {
    const label = ENTITY_LABELS[m.from.toLowerCase()] ?? m.from
    if (!mmCexByEntity.has(label)) mmCexByEntity.set(label, [])
    mmCexByEntity.get(label)!.push(m)
  }
  const uniqueMMs = Array.from(mmCexByEntity.keys())

  if (uniqueMMs.length >= 3) {
    const allMoves = uniqueMMs.flatMap(k => mmCexByEntity.get(k)!)
    const totalUsd = allMoves.reduce((s, m) => s + m.valueUsd, 0)
    const hashes   = allMoves.map(m => m.hash)
    const id       = `mm3cex_${hashes.slice(0,3).join('_').slice(0,32)}`
    if (!used.has(id)) {
      used.add(id)
      patterns.push({
        id,
        type:        'MM_TRIPLE_CEX',
        severity:    'CRITICAL',
        emoji:       '🚨',
        title:       `${uniqueMMs.length} Market Makers → CEX Simultaneously`,
        description: `${uniqueMMs.join(' + ')} all moved funds to CEX within 30 minutes. Historical pattern: precedes major dump. Confidence 85%.`,
        confidence:  Math.min(85 + (uniqueMMs.length - 3) * 5, 97),
        actors:      uniqueMMs,
        totalUsd,
        firstSeen:   Math.min(...allMoves.map(m => m.timestamp)),
        lastSeen:    Math.max(...allMoves.map(m => m.timestamp)),
        txHashes:    hashes,
      })
    }
  } else if (uniqueMMs.length === 2) {
    const allMoves = uniqueMMs.flatMap(k => mmCexByEntity.get(k)!)
    const totalUsd = allMoves.reduce((s, m) => s + m.valueUsd, 0)
    const hashes   = allMoves.map(m => m.hash)
    const id       = `mm2cex_${hashes.slice(0,2).join('_').slice(0,32)}`
    if (!used.has(id)) {
      used.add(id)
      patterns.push({
        id,
        type:        'MM_DOUBLE_CEX',
        severity:    'WARNING',
        emoji:       '⚠️',
        title:       `2 Market Makers → CEX (30min window)`,
        description: `${uniqueMMs.join(' + ')} moved funds to CEX in same 30min window. Potential coordinated sell — watch for 3rd MM. Confidence 72%.`,
        confidence:  72,
        actors:      uniqueMMs,
        totalUsd,
        firstSeen:   Math.min(...allMoves.map(m => m.timestamp)),
        lastSeen:    Math.max(...allMoves.map(m => m.timestamp)),
        txHashes:    hashes,
      })
    }
  }

  // ── 2. Justin Sun + MM → CEX ─────────────────────────────────────────────────
  const sunMoves = sorted.filter(m =>
    JUSTIN_SUN.has(m.from.toLowerCase()) &&
    CEX_ADDRESSES.has(m.to.toLowerCase()) &&
    (now - m.timestamp) < WINDOW_MS
  )

  if (sunMoves.length > 0 && mmCexMoves.length > 0) {
    const allMoves = [...sunMoves, ...mmCexMoves.slice(0, 2)]
    const totalUsd = allMoves.reduce((s, m) => s + m.valueUsd, 0)
    const hashes   = allMoves.map(m => m.hash)
    const id       = `sun_mm_${hashes[0]?.slice(0, 16) ?? 'none'}`
    if (!used.has(id)) {
      used.add(id)
      patterns.push({
        id,
        type:        'SUN_PLUS_MM',
        severity:    'CRITICAL',
        emoji:       '🚨',
        title:       `Justin Sun + Market Maker → CEX`,
        description: `Justin Sun and ${mmCexMoves[0] ? ENTITY_LABELS[mmCexMoves[0].from.toLowerCase()] ?? 'MM' : 'MM'} simultaneously moving to CEX. Combined confidence 88%.`,
        confidence:  88,
        actors:      ['Justin Sun', ...uniqueMMs.slice(0, 2)],
        totalUsd,
        firstSeen:   Math.min(...allMoves.map(m => m.timestamp)),
        lastSeen:    Math.max(...allMoves.map(m => m.timestamp)),
        txHashes:    hashes,
      })
    }
  }

  // ── 3. MM ↔ MM coordination ───────────────────────────────────────────────────
  const mmMmMoves = sorted.filter(m =>
    MARKET_MAKERS.has(m.from.toLowerCase()) &&
    MARKET_MAKERS.has(m.to.toLowerCase()) &&
    m.from.toLowerCase() !== m.to.toLowerCase() &&
    (now - m.timestamp) < WINDOW_MS
  )

  if (mmMmMoves.length >= 2) {
    const totalUsd = mmMmMoves.reduce((s, m) => s + m.valueUsd, 0)
    const hashes   = mmMmMoves.map(m => m.hash)
    const actors   = [...new Set(mmMmMoves.map(m => ENTITY_LABELS[m.from.toLowerCase()] ?? m.from))]
    const id       = `mmcoord_${hashes[0]?.slice(0, 16) ?? 'none'}`
    if (!used.has(id)) {
      used.add(id)
      patterns.push({
        id,
        type:        'MM_COORDINATION',
        severity:    'WARNING',
        emoji:       '👀',
        title:       `Market Maker Coordination Detected`,
        description: `${actors.join(' ↔ ')} transferring between each other within 30 minutes. Possible position rebalancing or coordinated setup. Confidence 65%.`,
        confidence:  65,
        actors,
        totalUsd,
        firstSeen:   Math.min(...mmMmMoves.map(m => m.timestamp)),
        lastSeen:    Math.max(...mmMmMoves.map(m => m.timestamp)),
        txHashes:    hashes,
      })
    }
  }

  // ── 4. Sweep — single MM $20M+ single tx ─────────────────────────────────────
  const sweepMoves = sorted.filter(m =>
    MARKET_MAKERS.has(m.from.toLowerCase()) &&
    CEX_ADDRESSES.has(m.to.toLowerCase()) &&
    m.valueUsd >= 20_000_000 &&
    (now - m.timestamp) < WINDOW_MS
  )
  for (const m of sweepMoves) {
    const id = `sweep_${m.hash}`
    if (!used.has(id)) {
      used.add(id)
      patterns.push({
        id,
        type:        'SWEEP',
        severity:    'WARNING',
        emoji:       '🌊',
        title:       `Massive Sweep — ${ENTITY_LABELS[m.from.toLowerCase()] ?? 'MM'}`,
        description: `Single transfer of $${(m.valueUsd / 1e6).toFixed(1)}M to CEX. Large sweeps often precede significant price movement.`,
        confidence:  70,
        actors:      [ENTITY_LABELS[m.from.toLowerCase()] ?? m.from],
        totalUsd:    m.valueUsd,
        firstSeen:   m.timestamp,
        lastSeen:    m.timestamp,
        txHashes:    [m.hash],
      })
    }
  }

  // Sort: CRITICAL first, then WARNING, then by time desc
  return patterns.sort((a, b) => {
    const sevOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 }
    if (sevOrder[a.severity] !== sevOrder[b.severity])
      return sevOrder[a.severity] - sevOrder[b.severity]
    return b.lastSeen - a.lastSeen
  })
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePatternRecognition() {
  const [patterns,   setPatterns]   = useState<PatternEvent[]>([])
  const [moves,      setMoves]      = useState<RawMove[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [lastScan,   setLastScan]   = useState<number | null>(null)
  const mountedRef = useRef(true)
  const abortRef   = useRef<AbortController | null>(null)
  const seenRef    = useRef<Set<string>>(new Set())

  const ALL_TRACKED = useMemo(() => [
    ...Array.from(MARKET_MAKERS),
    ...Array.from(JUSTIN_SUN),
  ], [])

  const scan = useCallback(async () => {
    if (!PROXY || !mountedRef.current) {
      setLoading(false)
      return
    }
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    try {
      // Get ETH price first
      let ethPrice = 2000
      try {
        const priceRes = await fetch(
          `${PROXY}/etherscan?chainid=1&module=stats&action=ethprice`,
          { signal }
        )
        const pd = await priceRes.json()
        ethPrice = parseFloat(pd?.result?.ethusd ?? '2000')
      } catch { /* use default */ }

      const newMoves: RawMove[] = []

      for (const addr of ALL_TRACKED) {
        if (!mountedRef.current) break
        try {
          const res = await fetch(
            `${PROXY}/etherscan?chainid=1&module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc`,
            { signal }
          )
          const data = await res.json()
          if (data?.status !== '1') continue

          for (const tx of (data.result ?? [])) {
            if (seenRef.current.has(tx.hash)) continue
            if (tx.isError === '1') continue

            const valueEth = parseFloat(tx.value) / 1e18
            const valueUsd = valueEth * ethPrice
            if (valueUsd < MIN_USD) continue

            const from = tx.from.toLowerCase()
            const to   = (tx.to ?? '').toLowerCase()

            seenRef.current.add(tx.hash)
            newMoves.push({
              hash:      tx.hash,
              from,
              to,
              entity:    ENTITY_LABELS[from] ?? from,
              valueUsd,
              timestamp: parseInt(tx.timeStamp) * 1000,
              isCexDest: CEX_ADDRESSES.has(to),
              isMMDest:  MARKET_MAKERS.has(to),
              isSunFrom: JUSTIN_SUN.has(from),
            })
          }

          await new Promise(r => setTimeout(r, 250))
        } catch { continue }
      }

      if (!mountedRef.current) return

      setMoves(prev => {
        const combined = [...newMoves, ...prev]
        const unique   = Array.from(new Map(combined.map(m => [m.hash, m])).values())
        return unique.slice(0, 200).sort((a, b) => b.timestamp - a.timestamp)
      })

      setLastScan(Date.now())
      setError(null)
      setLoading(false)
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      if (mountedRef.current) {
        setError('Pattern scan unavailable')
        setLoading(false)
      }
    }
  }, [ALL_TRACKED])

  // Recompute patterns whenever moves change
  useEffect(() => {
    if (moves.length > 0) {
      const detected = detectPatterns(moves)
      setPatterns(detected)
    }
  }, [moves])

  useEffect(() => {
    mountedRef.current = true
    scan()
    const interval = setInterval(scan, REFRESH_MS)
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      clearInterval(interval)
    }
  }, [scan])

  const criticalPatterns = useMemo(
    () => patterns.filter(p => p.severity === 'CRITICAL'),
    [patterns]
  )
  const warningPatterns = useMemo(
    () => patterns.filter(p => p.severity === 'WARNING'),
    [patterns]
  )

  return {
    patterns,
    criticalPatterns,
    warningPatterns,
    moves,
    loading,
    error,
    lastScan,
    refetch: scan,
  }
}
