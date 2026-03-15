/**
 * ZERØ WATCH — usePriceAlert v1
 * ================================
 * Alert kalau ETH/BTC price drop/pump melebihi threshold %.
 * Integrates dengan useTelegramAlert + Web Notifications.
 * rgba() only ✓  mountedRef ✓
 */

import { useEffect, useRef, useCallback, useState } from 'react'

export interface PriceAlertConfig {
  ethDropPct:   number   // e.g. 5 = alert if ETH drops 5%
  ethPumpPct:   number   // e.g. 10 = alert if ETH pumps 10%
  enabled:      boolean
}

const DEFAULT_CONFIG: PriceAlertConfig = {
  ethDropPct:  5,
  ethPumpPct:  10,
  enabled:     false,
}

const STORAGE_KEY = 'zw_price_alert_cfg'

export function usePriceAlert(
  currentEthPrice: number | null,
  onAlert: (msg: string) => void
) {
  const [config, setConfigState] = useState<PriceAlertConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG
    } catch { return DEFAULT_CONFIG }
  })

  const baselineRef  = useRef<number | null>(null)
  const lastAlertRef = useRef<number>(0)
  const mountedRef   = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Set baseline on first price load
  useEffect(() => {
    if (currentEthPrice && !baselineRef.current) {
      baselineRef.current = currentEthPrice
    }
  }, [currentEthPrice])

  // Check price change
  useEffect(() => {
    if (!config.enabled || !currentEthPrice || !baselineRef.current) return
    if (Date.now() - lastAlertRef.current < 5 * 60 * 1000) return  // 5 min cooldown

    const pctChange = ((currentEthPrice - baselineRef.current) / baselineRef.current) * 100

    if (pctChange <= -config.ethDropPct) {
      const msg = `📉 <b>ETH DROP ALERT</b>\n\nETH turun <b>${Math.abs(pctChange).toFixed(1)}%</b>\n$${baselineRef.current.toFixed(0)} → $${currentEthPrice.toFixed(0)}\n\n<i>ZERØ WATCH · @ZerobuildLab</i>`
      onAlert(msg)
      lastAlertRef.current = Date.now()
      baselineRef.current  = currentEthPrice
    } else if (pctChange >= config.ethPumpPct) {
      const msg = `📈 <b>ETH PUMP ALERT</b>\n\nETH naik <b>+${pctChange.toFixed(1)}%</b>\n$${baselineRef.current.toFixed(0)} → $${currentEthPrice.toFixed(0)}\n\n<i>ZERØ WATCH · @ZerobuildLab</i>`
      onAlert(msg)
      lastAlertRef.current = Date.now()
      baselineRef.current  = currentEthPrice
    }
  }, [currentEthPrice, config, onAlert])

  const setConfig = useCallback((cfg: Partial<PriceAlertConfig>) => {
    setConfigState(prev => {
      const next = { ...prev, ...cfg }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const resetBaseline = useCallback(() => {
    baselineRef.current = currentEthPrice
  }, [currentEthPrice])

  return { config, setConfig, resetBaseline }
}
