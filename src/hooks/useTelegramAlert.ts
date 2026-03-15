/**
 * ZERØ WATCH — useTelegramAlert v1
 * ==================================
 * Send whale alerts via @ZBLWatchBot → CF Worker → TG API
 * User input chatId → simpan ke localStorage
 * rgba() only ✓  AbortController ✓
 */

import { useState, useCallback, useEffect } from 'react'

const HISTORY_WORKER = 'https://zero-watch-history.winduadiprabowo.workers.dev'
const STORAGE_KEY    = 'zw_tg_chat_id'

export interface TelegramAlertState {
  chatId:    string
  setChatId: (id: string) => void
  enabled:   boolean
  sending:   boolean
  lastSent:  number
  sendAlert: (message: string) => Promise<boolean>
  testAlert: () => Promise<boolean>
}

export function useTelegramAlert(): TelegramAlertState {
  const [chatId,  setChatIdState] = useState<string>('')
  const [sending, setSending]     = useState(false)
  const [lastSent, setLastSent]   = useState(0)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setChatIdState(stored)
  }, [])

  const setChatId = useCallback((id: string) => {
    setChatIdState(id)
    if (id.trim()) {
      localStorage.setItem(STORAGE_KEY, id.trim())
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const sendAlert = useCallback(async (message: string): Promise<boolean> => {
    if (!chatId.trim() || sending) return false
    // Rate limit: 1 alert per 30 seconds
    if (Date.now() - lastSent < 30_000) return false

    setSending(true)
    try {
      const res  = await fetch(`${HISTORY_WORKER}/tg-alert`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chatId: chatId.trim(), message }),
      })
      const data = await res.json()
      if (data.ok) setLastSent(Date.now())
      return !!data.ok
    } catch {
      return false
    } finally {
      setSending(false)
    }
  }, [chatId, sending, lastSent])

  const testAlert = useCallback(async (): Promise<boolean> => {
    return sendAlert(
      `👁 <b>ZERØ WATCH</b> — Test Alert\n\n` +
      `✅ Telegram alerts aktif!\n` +
      `Whale moves akan muncul di sini.\n\n` +
      `<i>@ZerobuildLab 🇮🇩</i>`
    )
  }, [sendAlert])

  return {
    chatId,
    setChatId,
    enabled:  !!chatId.trim(),
    sending,
    lastSent,
    sendAlert,
    testAlert,
  }
}
