'use client'
import type { TransactionStatus, TransactionType } from '@/types/api'
import { Button, Input, Select } from '@/components/ui'
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from '@/lib/transactions/url-state'
import styles from './TransactionFilters.module.css'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  ...TRANSACTION_TYPES.map((type) => ({ value: type, label: TRANSACTION_TYPE_LABELS[type] })),
]
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...TRANSACTION_STATUSES.map((status) => ({ value: status, label: TRANSACTION_STATUS_LABELS[status] })),
]

export interface TransactionFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  type?: TransactionType
  status?: TransactionStatus
  onTypeChange: (value: TransactionType | undefined) => void
  onStatusChange: (value: TransactionStatus | undefined) => void
  /** Shows "Clear filters" whenever a search or any filter is set. */
  onClear?: () => void
}

export function TransactionFilters({
  search,
  onSearchChange,
  type,
  status,
  onTypeChange,
  onStatusChange,
  onClear,
}: TransactionFiltersProps) {
  return (
    <div className={styles.bar}>
      <Input
        label="Search"
        type="search"
        leadingIcon="search"
        placeholder="Search by reference, name or narration"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        fieldClassName={styles.search}
      />
      <Select
        label="Type"
        options={TYPE_OPTIONS}
        value={type ?? ''}
        onChange={(e) => onTypeChange((e.target.value || undefined) as TransactionType | undefined)}
      />
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={status ?? ''}
        onChange={(e) => onStatusChange((e.target.value || undefined) as TransactionStatus | undefined)}
      />
      {onClear && (
        <Button variant="ghost" onClick={onClear} className={styles.clear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
