/**
 * ZERØ WATCH — useAuth v2
 * ========================
 * Auth hook: register, login, logout, link-license
 * JWT disimpan di localStorage key: "zw_token"
 * rgba() only ✓  useCallback + useMemo ✓  AbortController ✓  mountedRef ✓
 * v2: AuthContext + useAuthState exported for AuthProvider pattern
 */

import { useState, useCallback, useEffect, useRef, useMemo, createContext, useContext } from 'react'

const PROXY     = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const TOKEN_KEY = 'zw_token'

export interface AuthUser {
  id:    string
  email: string
  isPro: boolean
}

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AuthState {
  user:         AuthUser | null
  status:       AuthStatus
  error:        string
  isLoggedIn:   boolean
  register:     (email: string, password: string) => Promise<boolean>
  login:        (email: string, password: string) => Promise<boolean>
  logout:       () => void
  linkLicense:  (licenseKey: string) => Promise<boolean>
  resetRequest: (email: string) => Promise<boolean>
  resetStatus:  () => void
}

// Context — populated by AuthProvider in App.tsx
export const AuthContext = createContext<AuthState | null>(null)

// useAuth — context consumer. Falls back gracefully if used outside AuthProvider.
export function useAuth(): AuthState {
  return useContext(AuthContext) ?? _fallbackState
}

// Static fallback — used when useAuth is called outside AuthProvider (should not happen in prod)
const _fallbackState: AuthState = {
  user:         null,
  status:       'idle',
  error:        '',
  isLoggedIn:   false,
  register:     async () => false,
  login:        async () => false,
  logout:       () => {},
  linkLicense:  async () => false,
  resetRequest: async () => false,
  resetStatus:  () => {},
}

function decodeJWT(token: string): AuthUser | null {
  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null
    return { id: decoded.userId, email: decoded.email, isPro: !!decoded.isPro }
  } catch { return null }
}

// useAuthState — internal hook, ONLY used by AuthProvider
export function useAuthState(): AuthState {
  const mountedRef = useRef(true)
  const abortRef   = useRef<AbortController | null>(null)

  const [user,   setUser]   = useState<AuthUser | null>(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      return token ? decodeJWT(token) : null
    } catch { return null }
  })
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [error,  setError]  = useState('')

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const setToken = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    const decoded = decodeJWT(token)
    if (mountedRef.current) setUser(decoded)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    if (mountedRef.current) setUser(null)
  }, [])

  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    if (mountedRef.current) { setStatus('loading'); setError('') }
    try {
      const res  = await fetch(`${PROXY}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), signal: ctrl.signal,
      })
      const data = await res.json() as { ok: boolean; token?: string; error?: string }
      if (!mountedRef.current) return false
      if (data.ok && data.token) { setToken(data.token); setStatus('success'); return true }
      setStatus('error'); setError(data.error || 'Registrasi gagal'); return false
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return false
      if (mountedRef.current) { setStatus('error'); setError('Network error — coba lagi') }
      return false
    }
  }, [setToken])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    if (mountedRef.current) { setStatus('loading'); setError('') }
    try {
      const res  = await fetch(`${PROXY}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), signal: ctrl.signal,
      })
      const data = await res.json() as { ok: boolean; token?: string; user?: AuthUser; error?: string }
      if (!mountedRef.current) return false
      if (data.ok && data.token) { setToken(data.token); setStatus('success'); return true }
      setStatus('error'); setError(data.error || 'Login gagal'); return false
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return false
      if (mountedRef.current) { setStatus('error'); setError('Network error — coba lagi') }
      return false
    }
  }, [setToken])

  const linkLicense = useCallback(async (licenseKey: string): Promise<boolean> => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return false
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const res  = await fetch(`${PROXY}/auth/link-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ license_key: licenseKey }), signal: ctrl.signal,
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (!mountedRef.current) return false
      if (data.ok) {
        if (mountedRef.current) setUser(prev => prev ? { ...prev, isPro: true } : prev)
        return true
      }
      return false
    } catch { return false }
  }, [])

  const resetRequest = useCallback(async (email: string): Promise<boolean> => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    if (mountedRef.current) { setStatus('loading'); setError('') }
    try {
      const res  = await fetch(`${PROXY}/auth/reset-request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }), signal: ctrl.signal,
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (!mountedRef.current) return false
      if (data.ok) { setStatus('success'); return true }
      setStatus('error'); setError(data.error || 'Gagal kirim email'); return false
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return false
      if (mountedRef.current) { setStatus('error'); setError('Network error — coba lagi') }
      return false
    }
  }, [])

  const resetStatus = useCallback(() => {
    if (mountedRef.current) { setStatus('idle'); setError('') }
  }, [])

  const isLoggedIn = useMemo(() => !!user, [user])

  return { user, status, error, isLoggedIn, register, login, logout, linkLicense, resetRequest, resetStatus }
}
