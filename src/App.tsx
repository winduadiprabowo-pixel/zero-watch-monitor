import { useState, useCallback } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import SplashScreen from './components/SplashScreen'
import { AuthProvider } from './components/AuthProvider'

const CACHE_KEY = 'zw-qcache-v1'
const CACHE_TTL = 1000 * 60 * 60 * 24  // 24 jam

// Restore cache dari localStorage sebelum QueryClient dipakai
function restoreCache(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return {} }
    return data
  } catch { return {} }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime:     CACHE_TTL,
      staleTime:  1000 * 60 * 5,
      retry:      2,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 8_000),
      initialData: undefined,
    },
  },
})

// Hydrate cache dari localStorage
const savedCache = restoreCache()
Object.entries(savedCache).forEach(([key, data]) => {
  try {
    const parsed = JSON.parse(key) as unknown[]
    queryClient.setQueryData(parsed, data)
  } catch { /* skip invalid keys */ }
})

// Save cache ke localStorage setiap ada update — throttled 5s
let saveTimer: ReturnType<typeof setTimeout> | null = null
queryClient.getQueryCache().subscribe(() => {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      const queries = queryClient.getQueryCache().getAll()
      const data: Record<string, unknown> = {}
      queries.forEach(q => {
        if (q.state.data && (q.queryKey[0] === 'wallet-lazy' || q.queryKey[0] === 'eth-price')) {
          data[JSON.stringify(q.queryKey)] = q.state.data
        }
      })
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
    } catch { /* storage full — silently fail */ }
  }, 5_000)
})

const App = () => {
  const [splashDone, setSplashDone] = useState(false)
  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  )
}

export default App
