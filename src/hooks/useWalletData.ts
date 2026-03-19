/**
 * ZERØ WATCH — useWalletData v24
 * ================================
 * v24 fixes:
 * - saveSnapshot: silent fail tanpa throw, tambah timeout 5s
 * - useSingleWallet: fix POLL undefined variable
 * - fetchAnyWalletData: error per-chain tidak crash semua
 * - Alchemy WebSocket: skip kalau proxy tidak tersedia
 *
 * rgba() only ✓  AbortController ✓  mountedRef ✓
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { fetchWalletData, getEthPrice } from '@/services/api'
import type { WalletData } from '@/services/api'
import { fetchSolWalletData } from '@/services/solanaApi'
import { fetchBtcWalletData } from '@/services/bitcoinApi'
import { fetchTronWalletData } from '@/services/tronApi'
import { fetchBnbWalletData } from '@/services/bnbApi'
import { useAlchemyWebSocket } from '@/hooks/useAlchemyWebSocket'
import type { AlchemyTx } from '@/hooks/useAlchemyWebSocket'

const POLL_EVM     = 300_000   // 300s — WS handles real-time
const POLL_NON_EVM = 120_000   // 120s — SOL/BTC/TRX/BNB
const POLL         = 120_000   // default untuk useSingleWallet
const STALE        = 290_000
const QUEUE_DELAY  = 400       // sedikit lebih lambat untuk hindari rate limit
const PRIORITY     = 5

const EVM_CHAINS = new Set(['ETH', 'ARB', 'BASE', 'OP', 'BNB'])

// ── saveSnapshot — throttled 1x/hour, silent fail ────────────────────────────

const _snapThrottle = new Map<string, number>()
const SNAP_TTL      = 60 * 60_000

async function saveSnapshot(
  address: string, chain: string, usdValue: number, ethBalance: string
): Promise<void> {
  const key  = `${chain}:${address}`
  const last = _snapThrottle.get(key) ?? 0
  if (Date.now() - last < SNAP_TTL) return
  _snapThrottle.set(key, Date.now())

  try {
    // AbortController dengan timeout 5s — jangan block lama
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5_000)

    await fetch('https://zero-watch-history.winduadiprabowo.workers.dev/history/snapshot', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ address, chain, usdValue, ethBalance }),
      signal:  ctrl.signal,
    })

    clearTimeout(timer)
  } catch {
    // Worker down / timeout → tidak masalah, silently ignore
    // Reset throttle supaya bisa retry nanti
    _snapThrottle.delete(key)
  }
}

// ── Unified fetch adapter ─────────────────────────────────────────────────────

async function fetchAnyWalletData(
  address: string,
  chain:   string,
  signal:  AbortSignal
): Promise<WalletData> {

  if (chain === 'BTC') {
    const btc = await fetchBtcWalletData(address, signal)
    return {
      address:      btc.address,
      balance: {
        address:    btc.address,
        ethBalance: btc.balance.btcBalance,
        usdValue:   btc.balance.usdValue,
        tokens:     [],
      },
      transactions: btc.transactions.map(tx => ({
        hash:         tx.txid,
        from:         tx.type === 'OUT' ? address : 'external',
        to:           tx.type === 'IN'  ? address : 'external',
        value:        tx.valueBtc.toFixed(8),
        timeStamp:    String(Math.floor(tx.blockTime / 1000)),
        isError:      '0',
        functionName: tx.type,
        gasUsed:      String(tx.fee),
        type:         'TRANSFER' as const,
      })),
      lastUpdated: btc.lastUpdated,
    }
  }

  if (chain === 'SOL') {
    const sol = await fetchSolWalletData(address, signal)
    return {
      address:      sol.address,
      balance: {
        address:    sol.address,
        ethBalance: sol.balance.solBalance,
        usdValue:   sol.balance.usdValue,
        tokens:     sol.balance.tokens.map(t => ({
          symbol:          t.symbol,
          name:            t.name,
          balance:         t.balance,
          usdValue:        t.usdValue,
          contractAddress: t.mintAddress,
        })),
      },
      transactions: sol.transactions.map(tx => ({
        hash:         tx.signature,
        from:         tx.from,
        to:           tx.to,
        value:        tx.valueSOL.toFixed(4),
        timeStamp:    String(tx.blockTime),
        isError:      tx.err ? '1' : '0',
        functionName: tx.type,
        gasUsed:      '5000',
        type:         tx.type as 'SWAP' | 'TRANSFER' | 'UNKNOWN',
      })),
      lastUpdated: sol.lastUpdated,
    }
  }

  if (chain === 'TRX') {
    const trx = await fetchTronWalletData(address, signal)
    return {
      address:      trx.address,
      balance: {
        address:    trx.address,
        ethBalance: trx.balance.trxBalance,
        usdValue:   trx.balance.usdValue,
        tokens:     [],
      },
      transactions: trx.transactions.map(tx => ({
        hash:         tx.txid,
        from:         tx.type === 'OUT' ? address : 'external',
        to:           tx.type === 'IN'  ? address : 'external',
        value:        tx.valueTrx.toFixed(6),
        timeStamp:    String(Math.floor(tx.blockTime / 1000)),
        isError:      tx.status === 'FAILED' ? '1' : '0',
        functionName: tx.type,
        gasUsed:      tx.fee.toFixed(6),
        type:         'TRANSFER' as const,
      })),
      lastUpdated: trx.lastUpdated,
    }
  }

  if (chain === 'BNB') {
    const bnb = await fetchBnbWalletData(address, signal)
    return {
      address:      bnb.address,
      balance: {
        address:    bnb.address,
        ethBalance: bnb.balance.bnbBalance,
        usdValue:   bnb.balance.usdValue,
        tokens:     [],
      },
      transactions: bnb.transactions.map(tx => ({
        hash:         tx.hash,
        from:         tx.from,
        to:           tx.to,
        value:        tx.valueBnb.toFixed(6),
        timeStamp:    tx.timeStamp,
        isError:      tx.isError,
        functionName: tx.functionName,
        gasUsed:      tx.gasUsed,
        type:         tx.type,
      })),
      lastUpdated: bnb.lastUpdated,
    }
  }

  // ETH / ARB / BASE / OP
  return fetchWalletData(address, chain as 'ETH' | 'ARB' | 'BASE' | 'OP', signal)
}

// ── Queue-based lazy loader ───────────────────────────────────────────────────

export const useAllWalletData = () => {
  const wallets     = useWalletStore(selectWallets)
  const queryClient = useQueryClient()
  const abortMap    = useRef<Map<string, AbortController>>(new Map())
  const queueRef    = useRef<ReturnType<typeof setTimeout>[]>([])
  const mountedRef  = useRef(true)

  const results = wallets.map(w =>
    queryClient.getQueryData<WalletData>(['wallet-lazy', w.address, w.chain])
  )

  const isFetching = wallets.some(w =>
    queryClient.isFetching({ queryKey: ['wallet-lazy', w.address, w.chain] }) > 0
  )

  const fetchOne = useCallback(async (address: string, chain: string) => {
    if (!mountedRef.current) return
    const existing = abortMap.current.get(address)
    existing?.abort()
    const ctrl = new AbortController()
    abortMap.current.set(address, ctrl)
    try {
      const data = await fetchAnyWalletData(address, chain, ctrl.signal)
      if (!mountedRef.current) return
      queryClient.setQueryData(['wallet-lazy', address, chain], data)
      // saveSnapshot tidak await — fire and forget
      saveSnapshot(address, chain, data.balance.usdValue, data.balance.ethBalance)
    } catch (e) {
      // Per-wallet error → tidak crash wallet lain
      if ((e as Error).name !== 'AbortError') {
        // silent — UI tetap jalan dengan data lama
      }
    }
  }, [queryClient])

  // ── Alchemy WebSocket — real-time untuk EVM wallets ──────────────────────
  const ethAddresses = wallets
    .filter(w => EVM_CHAINS.has(w.chain))
    .map(w => w.address)

  const handleNewTx = useCallback((tx: AlchemyTx) => {
    const wallet = wallets.find(w =>
      w.address.toLowerCase() === tx.address.toLowerCase()
    )
    if (wallet) {
      const current = queryClient.getQueryData<WalletData>(
        ['wallet-lazy', wallet.address, wallet.chain]
      )
      if (current) {
        const valueEth = (parseInt(tx.value, 16) / 1e18).toFixed(4)
        const newTx = {
          hash:         tx.hash,
          from:         tx.from,
          to:           tx.to ?? '',
          value:        valueEth,
          timeStamp:    String(Math.floor(Date.now() / 1000)),
          isError:      '0',
          functionName: '',
          gasUsed:      '21000',
          type:         'TRANSFER' as const,
        }
        queryClient.setQueryData(['wallet-lazy', wallet.address, wallet.chain], {
          ...current,
          transactions: [newTx, ...current.transactions].slice(0, 25),
          lastUpdated:  Date.now(),
        })
      }
      setTimeout(() => {
        if (mountedRef.current) fetchOne(wallet.address, wallet.chain)
      }, 2_000)
    }
  }, [wallets, queryClient, fetchOne])

  useAlchemyWebSocket({
    addresses: ethAddresses,
    onNewTx:   handleNewTx,
    enabled:   ethAddresses.length > 0,
  })

  // ── Initial load + HTTP poll fallback ────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    queueRef.current.forEach(t => clearTimeout(t))
    queueRef.current = []
    abortMap.current.forEach(c => c.abort())
    abortMap.current.clear()

    if (wallets.length === 0) return

    // Priority: 5 wallet pertama langsung, selebihnya queue
    wallets.slice(0, PRIORITY).forEach(w => {
      fetchOne(w.address, w.chain)
    })
    wallets.slice(PRIORITY).forEach((w, i) => {
      const t = setTimeout(() => {
        if (mountedRef.current) fetchOne(w.address, w.chain)
      }, (i + 1) * QUEUE_DELAY)
      queueRef.current.push(t)
    })

    // HTTP poll fallback
    const refetchInterval = setInterval(() => {
      if (!mountedRef.current) return
      wallets.forEach((w, i) => {
        const pollMs = EVM_CHAINS.has(w.chain) ? POLL_EVM : POLL_NON_EVM
        const cached = queryClient.getQueryData<WalletData>(['wallet-lazy', w.address, w.chain])
        if (cached && Date.now() - cached.lastUpdated < pollMs) return
        const t = setTimeout(() => {
          if (mountedRef.current) fetchOne(w.address, w.chain)
        }, i * QUEUE_DELAY)
        queueRef.current.push(t)
      })
    }, 30_000)

    return () => {
      mountedRef.current = false
      queueRef.current.forEach(t => clearTimeout(t))
      clearInterval(refetchInterval)
      abortMap.current.forEach(c => c.abort())
    }
  }, [wallets.map(w => `${w.address}:${w.chain}`).join(','), fetchOne, queryClient])

  return { data: results, isFetching, isError: false }
}

// ── Single wallet hook ────────────────────────────────────────────────────────

export const useSingleWallet = (
  address: string,
  chain:   'ETH' | 'ARB' | 'BASE' | 'OP' | 'SOL' | 'TRX' | 'BNB'
) => {
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  return useQuery<WalletData>({
    queryKey:        ['wallet', address, chain],
    queryFn:         async () => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      return fetchAnyWalletData(address, chain, abortRef.current.signal)
    },
    refetchInterval: POLL,
    staleTime:       STALE,
    enabled:         !!address,
    retry:           2,
    retryDelay:      (i) => Math.min(1000 * 2 ** i, 8_000),
  })
}

// ── ETH Price hook ────────────────────────────────────────────────────────────

export const useEthPrice = () =>
  useQuery<number>({
    queryKey:        ['eth-price'],
    queryFn:         getEthPrice,
    refetchInterval: 5 * 60_000,
    staleTime:       4 * 60_000,
    retry:           2,
  })
