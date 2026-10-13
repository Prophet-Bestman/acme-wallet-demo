import type { Transaction } from '@/types/api'
import { Money } from '@/components/ui'
import { formatDateTime, TRANSACTION_STATUS_LABELS } from '@/lib/format'
import styles from './TransactionDetails.module.css'

export interface TransactionDetailsProps {
  transaction: Transaction
}

/** Body of the transaction details drawer, shared by the dashboard and /transactions. */
export function TransactionDetails({ transaction: tx }: TransactionDetailsProps) {
  return (
    <dl className={styles.details}>
      <dt>Reference</dt>
      <dd>{tx.reference}</dd>
      <dt>Amount</dt>
      <dd>
        <Money amount={tx.amount} currency={tx.currency} />
      </dd>
      <dt>Status</dt>
      <dd>{TRANSACTION_STATUS_LABELS[tx.status]}</dd>
      <dt>Date</dt>
      <dd>{formatDateTime(tx.createdAt)}</dd>
    </dl>
  )
}
