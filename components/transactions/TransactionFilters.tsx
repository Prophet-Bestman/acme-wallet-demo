'use client'
import type { Currency, TransactionStatus, TransactionType } from '@/types/api'
import { CURRENCIES } from '@/types/api'
import { Input, Select } from '@/components/ui'
import { cx } from '@/lib/cx'
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  type TransactionFilters as Filters,
} from '@/lib/transactions/url-state'
import styles from './TransactionFilters.module.css'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  ...TRANSACTION_TYPES.map((type) => ({ value: type, label: TRANSACTION_TYPE_LABELS[type] })),
]
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...TRANSACTION_STATUSES.map((status) => ({ value: status, label: TRANSACTION_STATUS_LABELS[status] })),
]
const CURRENCY_OPTIONS = [
  { value: '', label: 'All currencies' },
  ...CURRENCIES.map((currency) => ({ value: currency, label: currency })),
]

export interface TransactionFiltersProps {
  filters: Filters
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  dateRangeInvalid: boolean
  /** Stack vertically (mobile sheet) instead of a row. */
  layout?: 'row' | 'stack'
}

export function TransactionFilters({
  filters,
  onChange,
  dateRangeInvalid,
  layout = 'row',
}: TransactionFiltersProps) {
  return (
    <div className={cx(styles.filters, styles[layout])}>
      <Select
        label="Type"
        options={TYPE_OPTIONS}
        value={filters.type ?? ''}
        onChange={(e) => onChange('type', (e.target.value || undefined) as TransactionType | undefined)}
      />
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={filters.status ?? ''}
        onChange={(e) => onChange('status', (e.target.value || undefined) as TransactionStatus | undefined)}
      />
      <Select
        label="Currency"
        options={CURRENCY_OPTIONS}
        value={filters.currency ?? ''}
        onChange={(e) => onChange('currency', (e.target.value || undefined) as Currency | undefined)}
      />
      <Input
        label="From"
        type="date"
        value={filters.from ?? ''}
        max={filters.to}
        onChange={(e) => onChange('from', e.target.value || undefined)}
      />
      <Input
        label="To"
        type="date"
        value={filters.to ?? ''}
        min={filters.from}
        error={dateRangeInvalid ? 'Must be on or after the From date' : undefined}
        onChange={(e) => onChange('to', e.target.value || undefined)}
      />
    </div>
  )
}
