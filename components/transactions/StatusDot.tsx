import { cx } from '@/lib/cx'
import { transactionStatusDisplay } from '@/lib/transactions/display'
import styles from './StatusDot.module.css'

export function StatusDot({ status }: { status: string }) {
  const { label, tone } = transactionStatusDisplay(status)
  return <span className={cx(styles.dot, styles[tone])} role="img" aria-label={label} title={label} />
}
