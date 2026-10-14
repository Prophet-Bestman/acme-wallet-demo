import type { ApiSuccess, PageMeta, Transaction } from '@/types/api'
import { CURRENCIES } from '@/types/api'
import { logger } from '@/lib/logger'
import { ApiError } from './client'

/**
 * Tolerant validation for transaction responses (eduspace's `parseResponse`/`soft` idea,
 * without adding zod for one resource).
 *
 * Only fields the app cannot work without are critical: `id` (keys, `?tx=`), `amount` and
 * `currency` (money formatting), and `meta.totalPages` (pagination). A broken critical
 * field fails the response as `ApiError(502, 'INVALID_RESPONSE')`, so the error state shows
 * instead of a crash. Everything else is soft: a bad value falls back to a safe default.
 * `type` and `status` stay open strings; lib/transactions/display.ts handles unknown ones.
 */

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null

const isMinorUnits = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)

function invalidResponse(event: string, context: Record<string, unknown>): never {
  logger.error(event, context)
  throw new ApiError(502, 'INVALID_RESPONSE', 'The server returned data in an unexpected format.')
}

/** Returns null when a critical field is unusable. */
export function parseTransaction(raw: unknown): Transaction | null {
  if (!isRecord(raw)) return null
  const { id, amount, currency } = raw
  if (typeof id !== 'string' || !id) return null
  if (!isMinorUnits(amount)) return null
  if (typeof currency !== 'string' || !(CURRENCIES as readonly string[]).includes(currency)) return null

  return {
    id,
    amount,
    currency: currency as Transaction['currency'],
    reference: str(raw.reference),
    type: str(raw.type),
    status: str(raw.status),
    fee: isMinorUnits(raw.fee) ? raw.fee : 0,
    narration: str(raw.narration),
    counterparty: typeof raw.counterparty === 'string' ? raw.counterparty : null,
    createdAt: str(raw.createdAt),
  }
}

function parseMeta(raw: unknown, rows: number): PageMeta {
  if (!isRecord(raw) || !Number.isSafeInteger(raw.totalPages) || (raw.totalPages as number) < 1) {
    invalidResponse('transactions.invalid_response', { field: 'meta.totalPages' })
  }
  const int = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fallback
  return {
    totalPages: raw.totalPages as number,
    page: int(raw.page, 1),
    limit: int(raw.limit, rows),
    total: int(raw.total, rows),
  }
}

/**
 * A list keeps its good rows: one malformed transaction is dropped (and logged) rather
 * than blanking the whole page. A missing array or `meta.totalPages` fails the response.
 */
export function parseTransactionList(body: ApiSuccess<unknown>): ApiSuccess<Transaction[]> {
  if (!Array.isArray(body.data)) invalidResponse('transactions.invalid_response', { field: 'data' })

  const data: Transaction[] = []
  body.data.forEach((item, index) => {
    const tx = parseTransaction(item)
    if (tx) data.push(tx)
    else logger.error('transactions.invalid_item', { index, id: isRecord(item) ? item.id : undefined })
  })

  return { data, meta: parseMeta(body.meta, body.data.length) }
}

/** A single transaction has nothing to fall back to, so a bad critical field fails it. */
export function parseTransactionDetail(body: ApiSuccess<unknown>): ApiSuccess<Transaction> {
  const tx = parseTransaction(body.data)
  if (!tx) invalidResponse('transactions.invalid_response', { field: 'data' })
  return { data: tx }
}
