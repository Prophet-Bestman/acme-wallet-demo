import type { Currency } from '@/types/api'
import type { TransactionQuery } from '@/lib/api/endpoints'

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params: TransactionQuery) => [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

export const meKeys = {
  all: ['me'] as const,
}

export const rateKeys = {
  all: ['rates'] as const,
  pair: (from: Currency, to: Currency) => [...rateKeys.all, from, to] as const,
}
