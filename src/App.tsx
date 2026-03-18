/**
 * ZERØ WATCH — App.tsx v2
 * ========================
 * v2: TanStack Query persistence via localStorage
 *     → buka app = langsung keliatan nilai terakhir semua 44 wallet
 *     → data fresh load di background (stale-while-revalidate)
 *     gcTime 24 jam, max cache 4MB
 */

import { useState, useCallback } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import SplashScreen from './components/SplashScreen'
import { AuthProvider } from './components/AuthProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime:    1000 * 60 * 60 * 24,   // 24 jam — cache hidup selama ini
      staleTime: 1000 * 60 * 5,         // 5 menit — anggap fresh selama ini
      retry:     2,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 8_000),
    },
  },
})

// Persist ke localStorage — max 4MB, key 'zw-query-cache'
const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key:     'zw-query-cache',
  throttleTime: 2_000,  // write max sekali per 2s, biar gak spam write
  serialize:   JSON.stringify,
  deserialize: JSON.parse,
})

const App = () => {
  const [splashDone, setSplashDone] = useState(false)
  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge:              1000 * 60 * 60 * 24,  // 24 jam max umur cache
        buster:              'v1',                  // bump ini kalau mau clear cache semua user
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Hanya persist wallet data queries, bukan yang ephemeral
            const key = query.queryKey[0]
            return key === 'wallet-lazy' || key === 'eth-price'
          },
        },
      }}
    >
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!splashDone && <SplashScreen onDone={handleSplashDone} />}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  )
}

export default App
