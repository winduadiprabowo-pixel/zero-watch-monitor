/**
 * ZERØ WATCH — LicenseModal v14
 * ================================
 * v14: Setelah PRO aktif → prompt "Buat akun / Login" biar license tersimpan
 * rgba() only ✓  React.memo + displayName ✓  AbortController ✓
 */

import { memo, useState, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useWalletStore } from '@/store/walletStore'
import { Key, Loader2, CheckCircle2, XCircle, UserPlus } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  open:    boolean
  onClose: () => void
}

const PROXY = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''

type Status = 'idle' | 'loading' | 'success' | 'error'

export const LicenseModal = memo(({ open, onClose }: Props) => {
  const activatePro = useWalletStore(s => s.activatePro)
  const { isLoggedIn } = useAuth()

  const [key,         setKey]         = useState('')
  const [status,      setStatus]      = useState<Status>('idle')
  const [errMsg,      setErrMsg]      = useState('')
  const [showAuth,    setShowAuth]    = useState(false)
  const [savedKey,    setSavedKey]    = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const handleVerify = useCallback(async () => {
    const trimmed = key.trim().toUpperCase()
    if (!trimmed) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setStatus('loading'); setErrMsg('')

    try {
      const resp = await fetch(`${PROXY}/verify-license`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: trimmed }), signal: ctrl.signal,
      })
      const data = await resp.json() as { ok: boolean; expiresAt?: number; error?: string }

      if (data.ok) {
        activatePro(data.expiresAt ?? null)
        setSavedKey(trimmed)
        setStatus('success')
      } else {
        setStatus('error'); setErrMsg(data.error || 'Invalid license key')
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setStatus('error'); setErrMsg('Network error — try again')
    }
  }, [key, activatePro])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleVerify()
  }, [handleVerify])

  const handleClose = useCallback(() => {
    abortRef.current?.abort()
    setKey(''); setStatus('idle'); setErrMsg(''); setSavedKey(''); setShowAuth(false)
    onClose()
  }, [onClose])

  const handleAuthClose = useCallback(() => {
    setShowAuth(false)
    // Setelah daftar/login, tutup license modal juga
    setTimeout(handleClose, 300)
  }, [handleClose])

  return (
    <>
      <Dialog open={open && !showAuth} onOpenChange={handleClose}>
        <DialogContent
          className="text-white font-mono max-w-sm border-0 p-0 overflow-hidden"
          style={{ background: 'rgba(6, 6, 14, 1)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(0, 212, 255, 0.07) 0%, transparent 70%)' }} />

          <div className="relative px-6 pt-6 pb-7 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-4 h-4" style={{ color: 'rgba(0, 212, 255, 0.8)' }} />
                <DialogTitle className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(0, 212, 255, 0.7)' }}>
                  ACTIVATE LICENSE
                </DialogTitle>
              </div>
            </DialogHeader>

            {status === 'success' ? (
              /* ── PRO Aktif — prompt buat akun ── */
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-2">
                  <CheckCircle2 className="w-8 h-8" style={{ color: 'rgba(0,212,255,0.8)' }} />
                  <p className="text-sm font-bold" style={{ color: 'rgba(0,212,255,0.9)' }}>PRO ACTIVATED! 🔥</p>
                </div>

                {!isLoggedIn && (
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}
                  >
                    <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Simpan PRO lo ke akun
                    </p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Biar bisa login di device mana aja tanpa input license key lagi.
                    </p>
                    <button
                      onClick={() => setShowAuth(true)}
                      className="w-full py-2.5 rounded-xl font-bold font-mono text-[12px] transition-all active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg,rgba(0,212,255,1) 0%,rgba(0,200,120,1) 100%)',
                        color: 'rgba(2,10,6,1)', border: 'none', cursor: 'pointer',
                        letterSpacing: '0.06em',
                      }}
                    >
                      <UserPlus style={{ display: 'inline', width: '12px', height: '12px', marginRight: '6px' }} />
                      BUAT AKUN / LOGIN →
                    </button>
                    <button
                      onClick={handleClose}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px', color: 'rgba(255,255,255,0.2)', padding: '2px 0' }}
                    >
                      Skip — simpan license key manual aja
                    </button>
                  </div>
                )}

                {isLoggedIn && (
                  <button onClick={handleClose} className="w-full py-3 rounded-xl font-bold font-mono text-sm" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: 'rgba(0,212,255,0.8)', cursor: 'pointer' }}>
                    CLOSE
                  </button>
                )}
              </div>
            ) : (
              /* ── Input license key ── */
              <>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Enter your license key from the Gumroad purchase email.
                </p>

                <div className="space-y-2">
                  <input
                    type="text" value={key}
                    onChange={e => { setKey(e.target.value.toUpperCase()); if (status === 'error') { setStatus('idle'); setErrMsg('') } }}
                    onKeyDown={handleKeyDown}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    spellCheck={false} autoComplete="off"
                    disabled={status === 'loading'}
                    className="w-full px-4 py-3 rounded-xl text-sm font-mono tracking-wider outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: status === 'error' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.9)', caretColor: 'rgba(0, 212, 255, 0.8)',
                    }}
                  />
                  {status === 'error' && errMsg && (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(239,68,68,0.7)' }} />
                      <span className="text-[10px]" style={{ color: 'rgba(239,68,68,0.7)' }}>{errMsg}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => void handleVerify()}
                  disabled={!key.trim() || status === 'loading'}
                  className="w-full py-3 rounded-xl font-bold font-mono text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 1) 0%, rgba(0,200,120,1) 100%)',
                    color: 'rgba(2,10,6,1)', border: 'none', cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.25), 0 4px 16px rgba(0,0,0,0.4)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> VERIFYING...
                    </span>
                  ) : 'ACTIVATE →'}
                </button>

                <p className="text-center text-[9px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
                  Key from purchase email · One-time activation
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AuthModal muncul setelah PRO aktif */}
      <AuthModal
        open={showAuth}
        onClose={handleAuthClose}
        defaultTab="register"
        licenseKey={savedKey}
      />
    </>
  )
})

LicenseModal.displayName = 'LicenseModal'
