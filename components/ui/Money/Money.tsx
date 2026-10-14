import type { Currency } from '@/types/api'
import { cx } from '@/lib/cx'
import { formatMoney } from '@/lib/format'
import styles from './Money.module.css'

export interface MoneyProps {
  /** Minor units. */
  amount: number
  currency: Currency
  /** Prefix with + or -. */
  sign?: 'credit' | 'debit'
  className?: string
}

export function Money({ amount, currency, sign, className }: MoneyProps) {
  // formatMoney pins the locale and two decimals, so server and client render the same string.
  const text = sign
    ? formatMoney(sign === 'debit' ? -amount : amount, currency, {
        signDisplay: 'always',
      })
    : formatMoney(amount, currency)
  return <span className={cx(styles.money, className)}>{text}</span>
}
