import type { Transaction } from '@/types/api'
import { Badge, Money } from '@/components/ui'
import { cx } from '@/lib/cx'
import { formatDateTime, formatMoney, formatTime } from '@/lib/format'
import { transactionStatusDisplay, transactionTypeDisplay } from '@/lib/transactions/display'
import { TransactionAvatar } from './TransactionAvatar'
import styles from './TransactionRow.module.css'

export interface TransactionRowProps {
  transaction: Transaction
  onSelect?: (transaction: Transaction) => void
  /** Inside a day group the date is in the heading, so show only the time (and no fee). */
  timeOnly?: boolean
}

export function TransactionRow({ transaction: tx, onSelect, timeOnly = false }: TransactionRowProps) {
  const type = transactionTypeDisplay(tx.type)
  const status = transactionStatusDisplay(tx.status)

  return (
    <button
      type="button"
      className={cx(styles.row, timeOnly && styles.timeOnly)}
      onClick={() => onSelect?.(tx)}
    >
      <TransactionAvatar transaction={tx} className={styles.avatar} />
      <span className={styles.main}>
        <span className={styles.title}>{type.label}</span>
        {/* Narration comes from upstream providers unsanitised: render as text, never as HTML. */}
        <span className={styles.narration}>{tx.narration}</span>
      </span>
      <Badge tone={status.tone} dot className={styles.status}>
        {status.label}
      </Badge>
      <Money
        amount={tx.amount}
        currency={tx.currency}
        sign={type.direction === 'neutral' ? undefined : type.direction}
        className={cx(styles.amount, type.direction === 'credit' && styles.credit)}
      />
      <span className={styles.meta}>
        {timeOnly ? formatTime(tx.createdAt) : formatDateTime(tx.createdAt)}
        {!timeOnly && tx.fee > 0 && ` · Fee ${formatMoney(tx.fee, tx.currency)}`}
      </span>
    </button>
  )
}
