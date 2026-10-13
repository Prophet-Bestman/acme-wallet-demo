'use client'
import { BalanceSummary, RatesWidget, RecentTransactions, WalletCard } from '@/components/dashboard'
import { Button } from '@/components/ui'
import { useMe } from '@/lib/query/hooks'
import styles from './page.module.css'

export default function DashboardPage() {
  const { data: user, isPending, isError, refetch } = useMe()

  if (isPending) return <p className={styles.loading}>Loading…</p>

  if (isError) {
    return (
      <div className={styles.error} role="alert">
        <p>We couldn&apos;t load your account.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Welcome back, {user.firstName}</h1>
        <p className={styles.subtitle}>Here&apos;s what&apos;s happening with your money today.</p>
      </header>

      <BalanceSummary wallets={user.wallets} />

      <div className={styles.wallets}>
        {user.wallets.map((wallet) => (
          <WalletCard key={wallet.currency} wallet={wallet} />
        ))}
      </div>

      <div className={styles.columns}>
        <RecentTransactions />
        <RatesWidget base="NGN" />
      </div>
    </div>
  )
}
