'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { HiddenBalancesProvider } from '@/components/layout'
import { makeQueryClient } from '@/lib/query/client'

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session; a module-level client would be shared across server requests.
  const [queryClient] = useState(makeQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <HiddenBalancesProvider>{children}</HiddenBalancesProvider>
    </QueryClientProvider>
  )
}
