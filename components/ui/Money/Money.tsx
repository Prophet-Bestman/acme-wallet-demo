'use client'
import { createContext, useContext, type ReactNode } from 'react'
import type { Currency } from '@/types/api'
import { cx } from '@/lib/cx'
import { formatMoney } from '@/lib/format'
import styles from './Money.module.css'

/**
 * Whether sensitive amounts are masked. Money only reads this flag; the app decides what sets it
 * (see HiddenBalancesProvider), so the primitive knows nothing about where the setting is stored.
 */
const MoneyMaskContext = createContext(false)

export function MoneyMaskProvider({ masked, children }: { masked: boolean; children: ReactNode }) {
  return <MoneyMaskContext.Provider value={masked}>{children}</MoneyMaskContext.Provider>
}

export interface MoneyProps {
  /** Minor units. */
  amount: number
  currency: Currency
  /** Prefix with + or -. */
  sign?: 'credit' | 'debit'
  /**
   * Masked when a MoneyMaskProvider above says so (the default). Pass false for figures that
   * aren't account data, e.g. a quote calculated from what the user is typing.
   */
  sensitive?: boolean
  className?: string
}

export function Money({ amount, currency, sign, sensitive = true, className }: MoneyProps) {
  const masked = useContext(MoneyMaskContext)

  if (sensitive && masked) {
    return (
      <span className={cx(styles.money, className)}>
        <span aria-hidden>••••••</span>
        <span className="visually-hidden">Amount hidden</span>
      </span>
    )
  }

  // formatMoney pins the locale and two decimals, so server and client render the same string.
  // 'exceptZero', not 'always': a zero debit is -0, which 'always' would print as "-$0.00".
  const text = sign
    ? formatMoney(sign === 'debit' ? -amount : amount, currency, {
        signDisplay: 'exceptZero',
      })
    : formatMoney(amount, currency)
  return <span className={cx(styles.money, className)}>{text}</span>
}
