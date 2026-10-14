import type { Currency, TransactionStatus, TransactionType } from '@/types/api'
import { CURRENCIES } from '@/types/api'
import type { TransactionQuery } from '@/lib/api/endpoints'

export const TRANSACTION_TYPES: readonly TransactionType[] = [
  'deposit',
  'withdrawal',
  'transfer_in',
  'transfer_out',
  'conversion',
  'card_payment',
  'bill_payment',
]
export const TRANSACTION_STATUSES: readonly TransactionStatus[] = ['successful', 'pending', 'failed']

export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100
const MAX_QUERY_LENGTH = 100

/** Everything about the /transactions view that lives in the URL. */
export interface TransactionUrlState {
  page: number
  limit: number
  q: string
  type?: TransactionType
  status?: TransactionStatus
  currency?: Currency
  /** YYYY-MM-DD */
  from?: string
  /** YYYY-MM-DD */
  to?: string
  /** Id of the transaction open in the details drawer. */
  tx?: string
}

export type TransactionFilters = Pick<TransactionUrlState, 'type' | 'status' | 'currency' | 'from' | 'to'>

const oneOf = <T extends string>(allowed: readonly T[], value: string | null): T | undefined =>
  value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined

const positiveInt = (value: string | null): number | undefined => {
  if (value === null || !/^\d+$/.test(value)) return undefined
  const n = Number(value)
  return n >= 1 ? n : undefined
}

/** A real calendar date in YYYY-MM-DD (rejects 2026-02-31). */
export const isIsoDate = (value: string | null): value is string => {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

/**
 * Read the view state from the URL. Anything invalid (`?status=garbage`, `?page=-3`,
 * `?from=yesterday`) falls back to its default instead of reaching the API.
 */
export function parseTransactionUrlState(params: Pick<URLSearchParams, 'get'>): TransactionUrlState {
  const limit = positiveInt(params.get('limit'))
  const tx = params.get('tx')
  const from = params.get('from')
  const to = params.get('to')
  return {
    page: positiveInt(params.get('page')) ?? 1,
    limit: limit !== undefined && limit <= MAX_LIMIT ? limit : DEFAULT_LIMIT,
    q: (params.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH),
    type: oneOf(TRANSACTION_TYPES, params.get('type')),
    status: oneOf(TRANSACTION_STATUSES, params.get('status')),
    currency: oneOf(CURRENCIES, params.get('currency')),
    from: isIsoDate(from) ? from : undefined,
    to: isIsoDate(to) ? to : undefined,
    tx: tx && /^[\w-]{1,64}$/.test(tx) ? tx : undefined,
  }
}

const URL_KEYS = ['q', 'type', 'status', 'currency', 'from', 'to', 'page', 'limit', 'tx'] as const

/**
 * Write the view state back to a query string, leaving out defaults so URLs stay short.
 * Params this view doesn't own (e.g. `__scenario`) are kept from `base`.
 */
export function serializeTransactionUrlState(
  state: TransactionUrlState,
  base?: Pick<URLSearchParams, 'toString'>
): string {
  const params = new URLSearchParams(base?.toString())
  for (const key of URL_KEYS) params.delete(key)
  if (state.q) params.set('q', state.q)
  if (state.type) params.set('type', state.type)
  if (state.status) params.set('status', state.status)
  if (state.currency) params.set('currency', state.currency)
  if (state.from) params.set('from', state.from)
  if (state.to) params.set('to', state.to)
  if (state.page !== 1) params.set('page', String(state.page))
  if (state.limit !== DEFAULT_LIMIT) params.set('limit', String(state.limit))
  if (state.tx) params.set('tx', state.tx)
  return params.toString()
}

/** ISO dates compare correctly as strings. */
export const isDateRangeInvalid = ({ from, to }: Pick<TransactionUrlState, 'from' | 'to'>) =>
  Boolean(from && to && from > to)

export const hasActiveFilters = (state: TransactionUrlState) =>
  Boolean(state.q || state.type || state.status || state.currency || state.from || state.to)

/**
 * The API query for this view. An inverted date range is left out rather than sent,
 * so the API never answers 400 INVALID_DATE; the page shows the error inline instead.
 */
export function toTransactionQuery(state: TransactionUrlState): TransactionQuery {
  const datesOk = !isDateRangeInvalid(state)
  return {
    page: state.page,
    limit: state.limit,
    q: state.q || undefined,
    type: state.type,
    status: state.status,
    currency: state.currency,
    from: datesOk ? state.from : undefined,
    to: datesOk ? state.to : undefined,
  }
}
