import type { TransactionStatus, TransactionType } from '@/types/api'
import type { BadgeTone, IconName } from '@/components/ui'
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { logger } from '@/lib/logger'

/**
 * Display metadata for the `type` and `status` a transaction carries.
 *
 * Both are enums the backend owns, so a value it adds later can reach the UI before we
 * ship support for it. Every lookup falls back to a humanized label with neutral styling
 * (and logs once per value) instead of rendering `undefined` or breaking `<Icon>`.
 */

export type Direction = 'credit' | 'debit' | 'neutral'

export interface TypeDisplay {
  label: string
  icon: IconName
  /** Credits show "+" and green, debits "-", neutral (unknown) no sign. */
  direction: Direction
}

export interface StatusDisplay {
  label: string
  tone: BadgeTone
}

const TYPE_STYLE: Record<TransactionType, Omit<TypeDisplay, 'label'>> = {
  deposit: { icon: 'arrow-down-left', direction: 'credit' },
  transfer_in: { icon: 'arrow-down-left', direction: 'credit' },
  withdrawal: { icon: 'arrow-up-right', direction: 'debit' },
  transfer_out: { icon: 'arrow-up-right', direction: 'debit' },
  conversion: { icon: 'swap', direction: 'credit' },
  card_payment: { icon: 'card', direction: 'debit' },
  bill_payment: { icon: 'receipt', direction: 'debit' },
}

const STATUS_TONES: Record<TransactionStatus, BadgeTone> = {
  successful: 'success',
  pending: 'warning',
  failed: 'danger',
}

const isKnown = <T extends string>(map: Record<T, unknown>, raw: string): raw is T => Object.hasOwn(map, raw)

/** "card_payment" → "Card payment" */
export const humanize = (raw: string) => {
  const words = raw.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// A list re-renders often; warn once per unknown value, not once per row per render.
const warned = new Set<string>()
function warnUnknown(field: 'type' | 'status', raw: string) {
  const key = `${field}:${raw}`
  if (warned.has(key)) return
  warned.add(key)
  logger.warn(`transactions.unknown_${field}`, { value: raw })
}

export function transactionTypeDisplay(raw: string): TypeDisplay {
  if (isKnown(TYPE_STYLE, raw)) return { label: TRANSACTION_TYPE_LABELS[raw], ...TYPE_STYLE[raw] }
  warnUnknown('type', raw)
  return { label: raw.trim() ? humanize(raw) : 'Transaction', icon: 'wallet', direction: 'neutral' }
}

export function transactionStatusDisplay(raw: string): StatusDisplay {
  if (isKnown(STATUS_TONES, raw)) return { label: TRANSACTION_STATUS_LABELS[raw], tone: STATUS_TONES[raw] }
  warnUnknown('status', raw)
  return { label: raw.trim() ? humanize(raw) : 'Unknown', tone: 'neutral' }
}
