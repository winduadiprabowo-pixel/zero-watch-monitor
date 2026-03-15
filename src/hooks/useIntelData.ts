/**
 * ZERØ WATCH — useIntelData v1
 * ==============================
 * Fetch dari zero-watch-intel CF Worker
 * Endpoints: /intel/flows, /intel/entities, /intel/alerts
 *
 * useCallback + useMemo + mountedRef + AbortController ✓
 * rgba() only ✓
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

const INTEL_BASE = 'https://zero-watch-intel.winduadiprabowo.workers.dev'
const REFETCH_MS = 60_000 // 60s

// ── Types ─────────────────────────────────────────────────────────────────────

export type EntityBehavior =
  | 'DORMANT'
  | 'ACTIVE'
  | 'ACCUMULATING'
  | 'DISTRIBUTING'
  | 'HIGHLY_ACTIVE'

export interface IntelEntity {
  address:     string
  label:       string
  behavior:    EntityBehavior
  txCount:     number
  totalVolume: number        // USD
  lastSeen:    number        // unix ms
  confidence:  number        // 0-100
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export interface IntelAlert {
  id:          string
  severity:    AlertSeverity
  message:     string
  addresses:   string[]
  timestamp:   number        // unix ms
  confidence:  number
}

export interface IntelFlow {
  id:          string
  fromAddress: string
  fromLabel:   string
  toAddress:   string
  toLabel:     string
  valueUsd:    number
  txHash:      string
  timestamp:   number
  severity:    AlertSeverity
  signalType:  string
}

export interface IntelData {
  flows:    IntelFlow[]
  entities: Record<string, IntelEntity>
  alerts:   IntelAlert[]
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useIntelData() {
  const [data,       setData]       = useState<IntelData>({ flows: [], entities: {}, alerts: [] })
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const mountedRef = useRef(true)
  const abortRef   = useRef<AbortController | null>(null)

  const fetchAll = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const [flowsRes, entitiesRes, alertsRes] = await Promise.allSettled([
        fetch(`${INTEL_BASE}/intel/flows?limit=20`,     { signal: ctrl.signal }),
        fetch(`${INTEL_BASE}/intel/entities`,           { signal: ctrl.signal }),
        fetch(`${INTEL_BASE}/intel/alerts`,             { signal: ctrl.signal }),
      ])

      if (!mountedRef.current) return

      const flows: IntelFlow[]                      = []
      const entities: Record<string, IntelEntity>  = {}
      const alerts: IntelAlert[]                    = []

      if (flowsRes.status === 'fulfilled' && flowsRes.value.ok) {
        const j = await flowsRes.value.json()
        flows.push(...(j.flows ?? j ?? []))
      }
      if (entitiesRes.status === 'fulfilled' && entitiesRes.value.ok) {
        const j = await entitiesRes.value.json()
        Object.assign(entities, j.entities ?? j ?? {})
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const j = await alertsRes.value.json()
        alerts.push(...(j.alerts ?? j ?? []))
      }

      if (mountedRef.current) {
        setData({ flows, entities, alerts })
        setLastUpdate(Date.now())
        setError(null)
        setLoading(false)
      }
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') return
      if (mountedRef.current) {
        setError('Intel worker unreachable')
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchAll()
    const interval = setInterval(fetchAll, REFETCH_MS)
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      clearInterval(interval)
    }
  }, [fetchAll])

  const criticalAlerts = useMemo(
    () => data.alerts.filter(a => a.severity === 'CRITICAL'),
    [data.alerts]
  )
  const warningAlerts = useMemo(
    () => data.alerts.filter(a => a.severity === 'WARNING'),
    [data.alerts]
  )

  return {
    flows:          data.flows,
    entities:       data.entities,
    alerts:         data.alerts,
    criticalAlerts,
    warningAlerts,
    loading,
    error,
    lastUpdate,
    refetch: fetchAll,
  }
}
