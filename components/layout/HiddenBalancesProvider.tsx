'use client'
import type { ReactNode } from 'react'
import { MoneyMaskProvider } from '@/components/ui'
import { useBalancesHidden } from '@/lib/hooks'

/** Connects the app's "Hide balances" setting to the Money primitive's mask. */
export function HiddenBalancesProvider({ children }: { children: ReactNode }) {
  return <MoneyMaskProvider masked={useBalancesHidden()}>{children}</MoneyMaskProvider>
}
