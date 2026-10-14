import type { Transaction } from '@/types/api'
import { Icon, Money } from '@/components/ui'
import { formatDateTime, formatMoney } from '@/lib/format'
import { transactionTypeDisplay } from '@/lib/transactions/display'
import { StatusDot } from './StatusDot'
import styles from './TransactionRow.module.css'

export interface TransactionRowProps {
  transaction: Transaction
  onSelect?: (transaction: Transaction) => void
}

export function TransactionRow({ transaction: tx, onSelect }: TransactionRowProps) {
  const display = transactionTypeDisplay(tx.type)
  const isCredit = display.direction === 'credit'

  return (
    <button type="button" className={styles.row} onClick={() => onSelect?.(tx)}>
      <span className={styles.icon}>
        <Icon name={display.icon} size={18} />
      </span>
      <span className={styles.main}>
        <span className={styles.title}>{display.label}</span>
        {/* Narration comes from upstream providers unsanitised: render as text, never as HTML. */}
        <span className={styles.narration}>{tx.narration}</span>
      </span>
      <StatusDot status={tx.status} />
      <span className={styles.end}>
        <Money
          amount={tx.amount}
          currency={tx.currency}
          sign={display.direction === 'neutral' ? undefined : display.direction}
          className={isCredit ? styles.credit : styles.amount}
        />
        <span className={styles.meta}>
          {formatDateTime(tx.createdAt)}
          {tx.fee > 0 && ` · Fee ${formatMoney(tx.fee, tx.currency)}`}
        </span>
      </span>
    </button>
  )
}
