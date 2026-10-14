'use client'
import { useState } from 'react'
import type { Currency, Wallet } from '@/types/api'
import { Button, Card, Money } from '@/components/ui'
import { useRates } from '@/lib/query/hooks'
import styles from './BalanceSummary.module.css'

const BASE: Currency = 'NGN'

/**
 * Wallets hold different currencies, so their balances can't simply be added. Each is
 * converted to NGN at today's rate (the same rate queries RatesWidget makes, so they come
 * from the React Query cache). Every currency uses 100 minor units per major, so
 * minor × rate is NGN minor units.
 */
function useTotalInBase(wallets: Wallet[]) {
  const foreign = wallets.filter((wallet) => wallet.currency !== BASE)
  const rates = useRates(foreign.map((wallet) => [wallet.currency, BASE] as const))

  if (rates.some((query) => query.isError)) return { status: 'error' as const }
  if (rates.some((query) => !query.data)) return { status: 'pending' as const }

  const total = wallets.reduce((sum, wallet) => {
    const index = foreign.indexOf(wallet)
    const rate = index === -1 ? 1 : rates[index].data!.rate
    return sum + Math.round(wallet.balance * rate)
  }, 0)
  return { status: 'success' as const, total, converted: foreign.length > 0 }
}

export function BalanceSummary({ wallets }: { wallets: Wallet[] }) {
  const [hidden, setHidden] = useState(false)
  const result = useTotalInBase(wallets)

  let value
  if (hidden) value = '••••••'
  else if (result.status === 'success') value = <Money amount={result.total} currency={BASE} />
  else if (result.status === 'pending') value = '…'
  else value = '—'

  return (
    <Card className={styles.card}>
      <div className={styles.main}>
        <p className={styles.label}>Total balance</p>
        <p className={styles.total} aria-live="polite">
          {result.status === 'success' && result.converted && !hidden && <span aria-hidden>≈ </span>}
          {value}
        </p>
        {result.status === 'error' ? (
          <p className={styles.note}>Couldn&apos;t load exchange rates to total your wallets.</p>
        ) : (
          result.status === 'success' &&
          result.converted && <p className={styles.note}>Estimated in NGN at today&apos;s rates</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        iconLeft={hidden ? 'eye' : 'eye-off'}
        onClick={() => setHidden(!hidden)}
      >
        {hidden ? 'Show' : 'Hide'}
      </Button>
    </Card>
  )
}
