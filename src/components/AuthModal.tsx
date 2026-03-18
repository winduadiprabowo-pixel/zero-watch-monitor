/**
 * ZERØ WATCH — AuthModal v1
 * ==========================
 * Modal Login / Register / Reset Password
 * Dipanggil dari LicenseModal setelah PRO aktif (opsional — "simpan akun")
 * atau dari UpgradeModal ("udah punya akun? login")
 * rgba() only ✓  React.memo + displayName ✓
 */

import { memo, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, UserPlus, LogIn, KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useWalletStore } from '@/store/walletStore'

interface Props {
  open:       boolean
  onClose:    () => void
  /** Mode awal yang ditampilkan */
  defaultTab?: 'login' | 'register' | 'reset'
  /** License key dari LicenseModal — kalau ada, langsung link setelah register/login */
  licenseKey?: string
}

type Tab = 'login' | 'register' | 'reset'

export const AuthModal = memo(({ open, onClose, defaultTab = 'register', licenseKey }: Props) => {
  const { status, error, register, login, linkLicense, resetRequest, resetStatus } = useAuth()
  const activatePro = useWalletStore(s => s.activatePro)

  const [tab,          setTab]          = useState<Tab>(defaultTab)
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [resetSent,    setResetSent]    = useState(false)
  const [done,         setDone]         = useState(false)

  const handleTabChange = useCallback((t: Tab) => {
    setTab(t); setEmail(''); setPassword(''); setResetSent(false); resetStatus()
  }, [resetStatus])

  const handleClose = useCallback(() => {
    setEmail(''); setPassword(''); setResetSent(false); setDone(false); resetStatus(); onClose()
  }, [onClose, resetStatus])

  const handleSubmit = useCallback(async () => {
    if (tab === 'reset') {
      const ok = await resetRequest(email)
      if (ok) setResetSent(true)
      return
    }

    let ok = false
    if (tab === 'register') ok = await register(email, password)
    else ok = await login(email, password)

    if (ok) {
      // Kalau ada license key, link ke akun
      if (licenseKey) await linkLicense(licenseKey)
      // Pastikan PRO tetap aktif di store
      activatePro(null)
      setDone(true)
      setTimeout(handleClose, 1400)
    }
  }, [tab, email, password, register, login, resetRequest, linkLicense, licenseKey, activatePro, handleClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleSubmit()
  }, [handleSubmit])

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.04)',
    border: error ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontFamily: 'inherit',
    outline: 'none', caretColor: 'rgba(0,212,255,0.8)',
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '7px 0', borderRadius: '8px', fontSize: '10px',
    fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.08em',
    cursor: 'pointer', transition: 'all 0.15s',
    background: active ? 'rgba(0,212,255,0.12)' : 'transparent',
    border: active ? '1px solid rgba(0,212,255,0.25)' : '1px solid transparent',
    color: active ? 'rgba(0,212,255,0.9)' : 'rgba(255,255,255,0.3)',
  })

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="font-mono border-0 p-0 overflow-hidden"
        style={{
          background: 'rgba(6,6,14,1)', maxWidth: '340px', borderRadius: '20px',
          boxShadow: '0 0 0 1px rgba(0,212,255,0.12), 0 0 60px rgba(0,212,255,0.08), 0 32px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.5),transparent)' }} />
        <div className="absolute pointer-events-none" style={{ top: '-20px', left: '50%', transform: 'translateX(-50%)', width: '260px', height: '120px', background: 'radial-gradient(ellipse at center,rgba(0,212,255,0.07) 0%,transparent 70%)' }} />

        <div className="relative px-6 pt-6 pb-7 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(0,212,255,0.7)' }}>
              {licenseKey ? 'SIMPAN AKUN PRO LO' : 'ZERØ WATCH ACCOUNT'}
            </DialogTitle>
            {licenseKey && (
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Biar PRO lo tersimpan — login di device mana aja tanpa input license key lagi.
              </p>
            )}
          </DialogHeader>

          {/* Done state */}
          {done ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-8 h-8" style={{ color: 'rgba(0,212,255,0.8)' }} />
              <p className="text-sm font-bold" style={{ color: 'rgba(0,212,255,0.9)' }}>
                {tab === 'register' ? 'Akun berhasil dibuat! 🔥' : 'Login berhasil! 🔥'}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>PRO lo tersimpan di akun ini.</p>
            </div>
          ) : resetSent ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-8 h-8" style={{ color: 'rgba(0,212,255,0.8)' }} />
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>Email reset dikirim!</p>
              <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Cek inbox lo. Link expired dalam 1 jam.
              </p>
              <button onClick={() => handleTabChange('login')} style={{ color: 'rgba(0,212,255,0.7)', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Balik ke Login
              </button>
            </div>
          ) : (
            <>
              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button style={tabBtn(tab === 'register')} onClick={() => handleTabChange('register')}>
                  <UserPlus style={{ display: 'inline', width: '10px', height: '10px', marginRight: '4px' }} />
                  DAFTAR
                </button>
                <button style={tabBtn(tab === 'login')} onClick={() => handleTabChange('login')}>
                  <LogIn style={{ display: 'inline', width: '10px', height: '10px', marginRight: '4px' }} />
                  LOGIN
                </button>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>EMAIL</label>
                <input
                  type="email" value={email} placeholder="email@lo.com"
                  onChange={e => { setEmail(e.target.value); resetStatus() }}
                  onKeyDown={handleKeyDown}
                  disabled={status === 'loading'}
                  style={inputBase}
                />
              </div>

              {/* Password (hidden in reset tab) */}
              {tab !== 'reset' && (
                <div className="space-y-2">
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} value={password} placeholder="Min. 8 karakter"
                      onChange={e => { setPassword(e.target.value); resetStatus() }}
                      onKeyDown={handleKeyDown}
                      disabled={status === 'loading'}
                      style={{ ...inputBase, paddingRight: '40px' }}
                    />
                    <button
                      onClick={() => setShowPass(p => !p)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}
                    >
                      {showPass ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle style={{ width: '12px', height: '12px', color: 'rgba(239,68,68,0.7)', flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', color: 'rgba(239,68,68,0.7)' }}>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={() => void handleSubmit()}
                disabled={status === 'loading' || !email || (tab !== 'reset' && !password)}
                style={{
                  width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg,rgba(0,212,255,1) 0%,rgba(0,200,120,1) 100%)',
                  color: 'rgba(2,10,6,1)', fontSize: '13px', fontFamily: 'inherit',
                  fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer',
                  opacity: (status === 'loading' || !email || (tab !== 'reset' && !password)) ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {status === 'loading' ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    {tab === 'register' ? 'MENDAFTAR...' : tab === 'login' ? 'LOGIN...' : 'MENGIRIM...'}
                  </span>
                ) : (
                  tab === 'register' ? 'BUAT AKUN →' : tab === 'login' ? 'LOGIN →' : 'KIRIM LINK RESET →'
                )}
              </button>

              {/* Lupa password / reset link */}
              {tab === 'login' && (
                <button
                  onClick={() => handleTabChange('reset')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px', color: 'rgba(255,255,255,0.2)', padding: '4px 0' }}
                >
                  <KeyRound style={{ display: 'inline', width: '10px', height: '10px', marginRight: '4px' }} />
                  Lupa password?
                </button>
              )}

              {/* Skip (opsional, hanya kalau ada licenseKey) */}
              {licenseKey && (
                <button
                  onClick={handleClose}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px', color: 'rgba(255,255,255,0.15)', padding: '2px 0' }}
                >
                  Skip — simpan license key manual aja
                </button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})

AuthModal.displayName = 'AuthModal'
