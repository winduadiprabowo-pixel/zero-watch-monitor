/**
 * ZERØ WATCH — LicenseModal v13
 * ================================
 * User input license key dari Gumroad setelah bayar.
 * Verify via CF Worker → POST /verify-license
 * rgba() only ✓  React.memo + displayName ✓  AbortController ✓
 */

import { memo, useState, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useWalletStore } from '@/store/walletStore'
import { Key, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  open:    boolean
  onClose: () => void
}

const PROXY = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''

type Status = 'idle' | 'loading' | 'success' | 'error'

export const LicenseModal = memo(({ open, onClose }: Props) => {
  const activatePro = useWalletStore(s => s.activatePro)
  const [key,    setKey]    = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const handleVerify = useCallback(async () => {
    const trimmed = key.trim().toUpperCase()
    if (!trimmed) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setStatus('loading')
    setErrMsg('')

    try {
      const resp = await fetch(`${PROXY}/verify-license`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ license_key: trimmed }),
        signal:  ctrl.signal,
      })

      const data = await resp.json() as { ok: boolean; expiresAt?: number; error?: string }

      if (data.ok) {
        activatePro(data.expiresAt ?? null)
        setStatus('success')
        setTimeout(() => {
          onClose()
          setKey('')
          setStatus('idle')
        }, 1400)
      } else {
        setStatus('error')
        setErrMsg(data.error || 'Invalid license key')
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setStatus('error')
      setErrMsg('Network error — try again')
    }
  }, [key, activatePro, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleVerify()
  }, [handleVerify])

  const handleClose = useCallback(() => {
    abortRef.current?.abort()
    setKey('')
    setStatus('idle')
    setErrMsg('')
    onClose()
  }, [onClose])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="text-white font-mono max-w-sm border-0 p-0 overflow-hidden"
        style={{ background: 'rgba(6, 6, 14, 1)' }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)' }}
        />

        {/* Ambient */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0, 212, 255, 0.07) 0%, transparent 70%)' }}
        />

        <div className="relative px-6 pt-6 pb-7 space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4" style={{ color: 'rgba(0, 212, 255, 0.8)' }} />
              <DialogTitle
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: 'rgba(0, 212, 255, 0.7)' }}
              >
                ACTIVATE LICENSE
              </DialogTitle>
            </div>
          </DialogHeader>

          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Enter your license key from the Gumroad purchase email.
          </p>

          {/* Input */}
          <div className="space-y-2">
            <input
              type="text"
              value={key}
              onChange={e => {
                setKey(e.target.value.toUpperCase())
                if (status === 'error') { setStatus('idle'); setErrMsg('') }
              }}
              onKeyDown={handleKeyDown}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              spellCheck={false}
              autoComplete="off"
              disabled={status === 'loading' || status === 'success'}
              className="w-full px-4 py-3 rounded-xl text-sm font-mono tracking-wider outline-none transition-all"
              style={{
                background:  'rgba(255,255,255,0.04)',
                border:      status === 'error'
                  ? '1px solid rgba(239,68,68,0.4)'
                  : status === 'success'
                  ? '1px solid rgba(0, 212, 255, 0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
                color:       'rgba(255,255,255,0.9)',
                caretColor:  'rgba(0, 212, 255, 0.8)',
              }}
            />

            {/* Error message */}
            {status === 'error' && errMsg && (
              <div className="flex items-center gap-1.5">
                <XCircle className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(239,68,68,0.7)' }} />
                <span className="text-[10px]" style={{ color: 'rgba(239,68,68,0.7)' }}>{errMsg}</span>
              </div>
            )}
          </div>

          {/* CTA button */}
          {status === 'success' ? (
            <div
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border:     '1px solid rgba(0, 212, 255, 0.3)',
                color:      'rgba(0, 212, 255, 0.9)',
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              PRO ACTIVATED
            </div>
          ) : (
            <button
              onClick={() => void handleVerify()}
              disabled={!key.trim() || status === 'loading'}
              className="w-full py-3 rounded-xl font-bold font-mono text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:    'linear-gradient(135deg, rgba(0, 212, 255, 1) 0%, rgba(0,200,120,1) 100%)',
                color:         'rgba(2,10,6,1)',
                boxShadow:     '0 0 20px rgba(0, 212, 255, 0.25), 0 4px 16px rgba(0,0,0,0.4)',
                letterSpacing: '0.06em',
              }}
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  VERIFYING...
                </span>
              ) : (
                'ACTIVATE →'
              )}
            </button>
          )}

          <p className="text-center text-[9px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
            Key from purchase email · One-time activation
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
})

LicenseModal.displayName = 'LicenseModal'
