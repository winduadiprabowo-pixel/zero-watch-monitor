/**
 * ZERØ WATCH — AuthProvider v1
 * ==============================
 * Single source of truth untuk auth state
 * Wrap di App.tsx — semua komponen pakai useAuth() dari context
 * rgba() only ✓  React.memo + displayName ✓
 */

import { memo } from 'react'
import { AuthContext, useAuthState } from '@/hooks/useAuth'

interface Props { children: React.ReactNode }

export const AuthProvider = memo(({ children }: Props) => {
  const auth = useAuthState()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
})

AuthProvider.displayName = 'AuthProvider'
