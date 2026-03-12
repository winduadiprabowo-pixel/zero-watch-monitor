/**
 * ZERØ WATCH — Whale Analytics Engine v11
 * =========================================
 * Whale Score · Big Move Detection · Copy Signals
 * Gas Spent · Wallet Age · Cluster Detection · Leaderboard
 *
 * All computed from on-chain Transaction[] data — zero extra API calls.
 */

import type { Transaction } from './api'

// ── Types ──────────────────────────────────────────────────────────────────────

export type WhaleStatus = 'ACCUMULATING' | 'DISTRIBUTING' | 'DORMANT' | 'HUNTING'

export interface WhaleScore {
  status:     WhaleStatus
  score:      number   // 0–100
  inflow:     number   // ETH received
  outflow:    number   // ETH sent
  conviction: number   // 0–100 (based on avg tx size in USD)
}

export interface BigMoveAlert {
  hash:      string
  type:      'IN' | 'OUT'
  valueEth:  number
  valueUsd:  number
  timestamp: number
  txType:    string
}

export interface CopySignal {
  action:    'BUY' | 'SELL' | 'DEPOSIT' | 'BORROW'
  valueEth:  number
  valueUsd:  number
  timestamp: number
  txHash:    string
  toAddress: string
  fnName:    string
}

export interface WalletIntelligence {
  whaleScore:        WhaleScore
  bigMoves:          BigMoveAlert[]
  copySignals:       CopySignal[]
  gasSpentEth:       number
  walletAgeDays:     number
  firstTxTimestamp:  number
  txFrequency:       number   // avg txs/day over 30d window
  avgTxValueEth:     number
  largestTxEth:      number
  totalVolume30dEth: number
}

export interface LeaderboardEntry {
  id:            string
  label:         string
  rank:          number
  smartScore:    number  // composite 0–100
  status:        WhaleStatus
  balanceUsd:    number
  txCount30d:    number
  volume30dEth:  number
  conviction:    number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const now30dAgo = () => Date.now() / 1000 - 30 * 86400
const now1hAgo  = () => Date.now() / 1000 - 3600

// ── Whale Score ────────────────────────────────────────────────────────────────

export function computeWhaleScore(
  transactions: Transaction[],
  walletAddress: string,
  ethPrice: number
): WhaleScore {
  const ago30d = now30dAgo()
  const addr   = walletAddress.toLowerCase()
  const recent = transactions.filter(t => parseInt(t.timeStamp) > ago30d)

  if (recent.length === 0) {
    return { status: 'DORMANT', score: 0, inflow: 0, outflow: 0, conviction: 0 }
  }

  let inflow  = 0
  let outflow = 0

  for (const tx of recent) {
    const val = parseFloat(tx.value) || 0
    if (tx.to?.toLowerCase() === addr) inflow  += val
    else                                outflow += val
  }

  const total    = inflow + outflow
  const netRatio = total > 0 ? (inflow - outflow) / total : 0
  const score    = Math.min(100, Math.floor(Math.abs(netRatio) * 100))
  const avgUsd   = (total / recent.length) * ethPrice

  let status: WhaleStatus
  if (recent.length < 2) {
    status = 'DORMANT'
  } else if (netRatio > 0.25) {
    status = 'ACCUMULATING'
  } else if (netRatio < -0.25) {
    status = 'DISTRIBUTING'
  } else if (recent.length >= 8 && avgUsd > 3000) {
    status = 'HUNTING'
  } else {
    status = 'DORMANT'
  }

  // Conviction: log-scaled avg USD tx size → 0–100
  const conviction = Math.min(100, Math.max(0, Math.floor(Math.log10(Math.max(avgUsd, 1)) * 20)))

  return { status, score, inflow, outflow, conviction }
}

// ── Big Move Alerts ────────────────────────────────────────────────────────────

export function detectBigMoves(
  transactions: Transaction[],
  walletAddress: string,
  ethPrice:  number,
  thresholdUsd = 5000
): BigMoveAlert[] {
  const ago1h = now1hAgo()
  const addr  = walletAddress.toLowerCase()

  const alerts: BigMoveAlert[] = []

  for (const tx of transactions) {
    if (parseInt(tx.timeStamp) <= ago1h) continue
    const valueEth = parseFloat(tx.value) || 0
    const valueUsd = valueEth * ethPrice
    if (valueUsd < thresholdUsd) continue

    alerts.push({
      hash:      tx.hash,
      type:      tx.to?.toLowerCase() === addr ? 'IN' : 'OUT',
      valueEth,
      valueUsd,
      timestamp: parseInt(tx.timeStamp),
      txType:    tx.type,
    })
  }

  return alerts
}

// ── Copy Signals ───────────────────────────────────────────────────────────────

export function extractCopySignals(
  transactions: Transaction[],
  walletAddress: string,
  ethPrice: number
): CopySignal[] {
  const addr = walletAddress.toLowerCase()

  return transactions
    .filter(tx => ['SWAP', 'DEPOSIT', 'BORROW'].includes(tx.type))
    .slice(0, 10)
    .map(tx => {
      const valueEth = parseFloat(tx.value) || 0
      const isOut    = tx.from?.toLowerCase() === addr
      let action: CopySignal['action']
      if (tx.type === 'DEPOSIT') action = 'DEPOSIT'
      else if (tx.type === 'BORROW') action = 'BORROW'
      else action = isOut ? 'BUY' : 'SELL'

      return {
        action,
        valueEth,
        valueUsd:   valueEth * ethPrice,
        timestamp:  parseInt(tx.timeStamp),
        txHash:     tx.hash,
        toAddress:  tx.to ?? '',
        fnName:     tx.functionName?.split('(')[0]?.slice(0, 22) || tx.type,
      }
    })
}

// ── Gas Spent ─────────────────────────────────────────────────────────────────
// Approximated at 20 gwei since gasPrice isn't in the TX interface

export function computeGasSpentEth(transactions: Transaction[]): number {
  const GWEI_EST = 20
  return transactions.reduce((sum, tx) => {
    const gas = parseInt(tx.gasUsed || '0') || 0
    return sum + (gas * GWEI_EST) / 1e9
  }, 0)
}

// ── Wallet Age ────────────────────────────────────────────────────────────────

export function computeWalletAgeDays(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0
  const oldest = Math.min(...transactions.map(tx => parseInt(tx.timeStamp) || Infinity))
  if (!isFinite(oldest)) return 0
  return Math.floor((Date.now() / 1000 - oldest) / 86400)
}

// ── Full Intelligence Pack ─────────────────────────────────────────────────────

export function computeWalletIntel(
  transactions: Transaction[],
  walletAddress: string,
  ethPrice: number
): WalletIntelligence {
  const whaleScore  = computeWhaleScore(transactions, walletAddress, ethPrice)
  const bigMoves    = detectBigMoves(transactions, walletAddress, ethPrice)
  const copySignals = extractCopySignals(transactions, walletAddress, ethPrice)
  const gasSpentEth = computeGasSpentEth(transactions)
  const walletAgeDays = computeWalletAgeDays(transactions)

  const firstTxTimestamp = transactions.length > 0
    ? Math.min(...transactions.map(t => parseInt(t.timeStamp) || Infinity)) * 1000
    : Date.now()

  const ago30d   = now30dAgo()
  const recent30 = transactions.filter(t => parseInt(t.timeStamp) > ago30d)

  const txFrequency = recent30.length / 30

  const values       = transactions.map(t => parseFloat(t.value) || 0)
  const avgTxValueEth = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const largestTxEth  = values.length ? Math.max(...values) : 0
  const totalVolume30dEth = recent30.reduce((s, t) => s + (parseFloat(t.value) || 0), 0)

  return {
    whaleScore,
    bigMoves,
    copySignals,
    gasSpentEth,
    walletAgeDays,
    firstTxTimestamp,
    txFrequency,
    avgTxValueEth,
    largestTxEth,
    totalVolume30dEth,
  }
}

// ── Cluster Detection ──────────────────────────────────────────────────────────
// Detects wallets that moved funds within 5 minutes of each other (coordinated activity)

export function detectClusters(
  walletMap: Record<string, { transactions: Transaction[]; label: string }>
): Record<string, string[]> {
  const ids = Object.keys(walletMap)
  const clusters: Record<string, string[]> = {}

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const aTxs = walletMap[ids[i]].transactions
      const bTxs = walletMap[ids[j]].transactions

      let synced = 0
      for (const ta of aTxs) {
        for (const tb of bTxs) {
          if (Math.abs(parseInt(ta.timeStamp) - parseInt(tb.timeStamp)) < 300) {
            synced++
          }
        }
      }

      if (synced >= 2) {
        if (!clusters[ids[i]]) clusters[ids[i]] = []
        if (!clusters[ids[j]]) clusters[ids[j]] = []
        clusters[ids[i]].push(walletMap[ids[j]].label)
        clusters[ids[j]].push(walletMap[ids[i]].label)
      }
    }
  }

  return clusters
}

// ── Smart Money Leaderboard ───────────────────────────────────────────────────

export function buildLeaderboard(
  wallets:     Array<{ id: string; label: string; address: string }>,
  apiDataArr:  Array<{ transactions: Transaction[]; balance: { usdValue: number } } | undefined>,
  ethPrice:    number
): LeaderboardEntry[] {
  return wallets
    .map((w, i) => {
      const data       = apiDataArr?.[i]
      const txs        = data?.transactions ?? []
      const balanceUsd = data?.balance.usdValue ?? 0
      const intel      = computeWhaleScore(txs, w.address, ethPrice)

      const ago30d   = now30dAgo()
      const txs30d   = txs.filter(t => parseInt(t.timeStamp) > ago30d)
      const vol30d   = txs30d.reduce((s, t) => s + (parseFloat(t.value) || 0), 0)

      // Composite smart score (0–100)
      const balS       = Math.min(35, Math.log10(Math.max(balanceUsd, 1)) * 4.5)
      const actS       = Math.min(35, txs30d.length * 2)
      const whaleS     = intel.score * 0.3
      const smartScore = Math.min(100, Math.floor(balS + actS + whaleS))

      return {
        id:           w.id,
        label:        w.label,
        rank:         0,
        smartScore,
        status:       intel.status,
        balanceUsd,
        txCount30d:   txs30d.length,
        volume30dEth: vol30d,
        conviction:   intel.conviction,
      }
    })
    .sort((a, b) => b.smartScore - a.smartScore)
    .map((e, i) => ({ ...e, rank: i + 1 }))
}
