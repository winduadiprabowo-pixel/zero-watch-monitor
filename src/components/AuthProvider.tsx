/**
 * ZERØ WATCH — AuthProvider v3
 * ==============================
 * Simple passthrough — each component calls useAuth() directly
 * rgba() only ✓  React.memo + displayName ✓
 */

import { memo } from 'react'

interface Props { children: React.ReactNode }

export const AuthProvider = memo(({ children }: Props) => <>{children}</>)
AuthProvider.displayName = 'AuthProvider'
