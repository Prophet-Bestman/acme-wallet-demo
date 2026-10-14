'use client'
import type { Currency } from '@/types/api'
import { cx } from '@/lib/cx'
import { formatMoney } from '@/lib/format'
import { useBalancesHidden } from '@/lib/hooks'
import styles from './Money.module.css'

export interface MoneyProps {
  /** Minor units. */
  amount: number
  currency: Currency
  /** Prefix with + or -. */
  sign?: 'credit' | 'debit'
  /**
   * Masked when the user hides balances (the default). Pass false for figures that aren't
   * account data, e.g. a quote calculated from what the user is typing.
   */
  sensitive?: boolean
  className?: string
}

export function Money({ amount, currency, sign, sensitive = true, className }: MoneyProps) {
  const hidden = useBalancesHidden()

  if (sensitive && hidden) {
    return (
      <span className={cx(styles.money, className)}>
        <span aria-hidden>••••••</span>
        <span className="visually-hidden">Amount hidden</span>
      </span>
    )
  }

  // formatMoney pins the locale and two decimals, so server and client render the same string.
  const text = sign
    ? formatMoney(sign === 'debit' ? -amount : amount, currency, {
        signDisplay: 'always',
      })
    : formatMoney(amount, currency)
  return <span className={cx(styles.money, className)}>{text}</span>
}
