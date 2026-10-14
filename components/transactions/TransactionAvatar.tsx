import type { Transaction } from '@/types/api'
import { Icon } from '@/components/ui'
import { cx } from '@/lib/cx'
import { initials, transactionTypeDisplay } from '@/lib/transactions/display'
import styles from './TransactionAvatar.module.css'

/** Counterparty initials when there is one (transfers), otherwise the type icon. */
export function TransactionAvatar({
  transaction: tx,
  size = 'md',
  className,
}: {
  transaction: Pick<Transaction, 'type' | 'counterparty'>
  size?: 'md' | 'lg'
  className?: string
}) {
  const letters = tx.counterparty ? initials(tx.counterparty) : ''
  return (
    <span className={cx(styles.avatar, styles[size], className)} aria-hidden>
      {letters || <Icon name={transactionTypeDisplay(tx.type).icon} size={size === 'lg' ? 20 : 16} />}
    </span>
  )
}
