import type { Transaction } from '@/types/api'
import { formatDate } from '@/lib/format'

export interface DayGroup {
  key: string
  /** "Today", "Yesterday" or "Mon, 5 Oct 2026". */
  label: string
  rows: Transaction[]
}

/** Local calendar day: the headings should match the times shown under them. */
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

/**
 * Splits a newest-first page into consecutive day groups. Grouping is per page, so a day
 * that spans two pages gets a heading on each.
 */
export function groupByDay(rows: Transaction[], now = new Date()): DayGroup[] {
  const today = dayKey(now)
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))

  const groups: DayGroup[] = []
  for (const tx of rows) {
    const date = new Date(tx.createdAt)
    const key = Number.isNaN(date.getTime()) ? 'unknown' : dayKey(date)
    let group = groups.at(-1)
    if (group?.key !== key) {
      const label =
        key === today
          ? 'Today'
          : key === yesterday
            ? 'Yesterday'
            : key === 'unknown'
              ? 'Date unknown'
              : formatDate(tx.createdAt)
      group = { key, label, rows: [] }
      groups.push(group)
    }
    group.rows.push(tx)
  }
  return groups
}
