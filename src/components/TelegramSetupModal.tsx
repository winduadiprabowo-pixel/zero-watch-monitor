/**
 * ZERØ WATCH — TelegramSetupModal v1
 * =====================================
 * Setup @ZBLWatchBot Chat ID untuk TG alerts.
 * - Step 1: Open bot, ketik /start → dapat Chat ID
 * - Step 2: Paste Chat ID ke sini
 * - Step 3: Test alert
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Send, CheckCircle2, ExternalLink, Copy } from 'lucide-react'
import type { TelegramAlertState } from '@/hooks/useTelegramAlert'

interface Props {
  open:     boolean
  onClose:  () => void
  tg:       TelegramAlertState
}

export const TelegramSetupModal = memo(({ open, onClose, tg }: Props) => {
  const [input,    setInput]    = useState(tg.chatId)
  const [testDone, setTestDone] = useState(false)
  const [testFail, setTestFail] = useState(false)

  const handleSave = useCallback(() => {
    tg.setChatId(input.trim())
  }, [input, tg])

  const handleTest = useCallback(async () => {
    setTestDone(false)
    setTestFail(false)
    const ok = await tg.testAlert()
    if (ok) setTestDone(true)
    else    setTestFail(true)
    setTimeout(() => { setTestDone(false); setTestFail(false) }, 3000)
  }, [tg])

  const inputStyle: React.CSSProperties = {
    background:   'rgba(255,255,255,0.04)',
    border:       '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color:        'rgba(255,255,255,0.85)',
    padding:      '10px 14px',
    fontFamily:   "'IBM Plex Mono', monospace",
    fontSize:     '13px',
    width:        '100%',
    outline:      'none',
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="text-white font-mono max-w-sm border-0 p-0 overflow-hidden"
        style={{ background: 'rgba(6,6,14,1)', borderRadius: '18px' }}
      >
        {/* Top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(230,161,71,0.4), transparent)' }}
        />

        <div className="relative px-6 pt-6 pb-7 space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" style={{ color: 'rgba(230,161,71,0.7)' }} />
              <DialogTitle className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(230,161,71,0.7)' }}>
                Telegram Alerts
              </DialogTitle>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Terima whale alerts langsung di Telegram — bahkan saat tab tertutup.
            </p>
          </DialogHeader>

          {/* Steps */}
          <div className="space-y-3">
            {/* Step 1 */}
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(230,161,71,0.15)', color: 'rgba(230,161,71,0.9)', border: '1px solid rgba(230,161,71,0.25)' }}
                >
                  1
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Buka bot dan ketik <code style={{ color: 'rgba(230,161,71,0.8)' }}>/start</code>
                </span>
              </div>
              <a
                href="https://t.me/ZBLWatchBot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 rounded-lg transition-all"
                style={{
                  background: 'rgba(0,136,204,0.15)',
                  border:     '1px solid rgba(0,136,204,0.25)',
                  color:      'rgba(100,181,246,0.9)',
                  fontSize:   '11px',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,136,204,0.22)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,136,204,0.15)' }}
              >
                <Send className="w-3 h-3" />
                @ZBLWatchBot
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>

            {/* Step 2 */}
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(230,161,71,0.15)', color: 'rgba(230,161,71,0.9)', border: '1px solid rgba(230,161,71,0.25)' }}
                >
                  2
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Paste Chat ID dari bot
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. 123456789"
                value={input}
                onChange={e => setInput(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(230,161,71,0.3)' }}
                onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={handleSave}
                className="w-full py-2 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-[0.98]"
                style={{
                  background:    input.trim() ? 'linear-gradient(135deg, rgba(230,161,71,1), rgba(0,200,120,1))' : 'rgba(255,255,255,0.05)',
                  color:         input.trim() ? 'rgba(2,10,6,1)' : 'rgba(255,255,255,0.25)',
                  letterSpacing: '0.06em',
                }}
              >
                SAVE CHAT ID
              </button>
            </div>

            {/* Step 3 — only show if chatId saved */}
            {tg.enabled && (
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(230,161,71,0.04)', border: '1px solid rgba(230,161,71,0.15)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{ background: 'rgba(230,161,71,0.15)', color: 'rgba(230,161,71,0.9)', border: '1px solid rgba(230,161,71,0.25)' }}
                    >
                      3
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      Test koneksi
                    </span>
                  </div>
                  {testDone && <CheckCircle2 className="w-4 h-4" style={{ color: 'rgba(230,161,71,0.8)' }} />}
                  {testFail && <span className="text-[9px] font-mono" style={{ color: 'rgba(239,68,68,0.8)' }}>Gagal — cek Chat ID</span>}
                </div>
                <button
                  onClick={handleTest}
                  disabled={tg.sending}
                  className="w-full py-2 rounded-lg text-[11px] font-mono font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background:    'rgba(230,161,71,0.10)',
                    border:        '1px solid rgba(230,161,71,0.25)',
                    color:         'rgba(230,161,71,0.9)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {tg.sending ? 'SENDING…' : testDone ? '✓ SENT!' : 'SEND TEST ALERT'}
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Status
            </span>
            <span
              className="text-[9px] font-mono font-bold"
              style={{ color: tg.enabled ? 'rgba(230,161,71,0.9)' : 'rgba(255,255,255,0.25)' }}
            >
              {tg.enabled ? `✓ ACTIVE — ${tg.chatId}` : 'NOT CONFIGURED'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

TelegramSetupModal.displayName = 'TelegramSetupModal'
