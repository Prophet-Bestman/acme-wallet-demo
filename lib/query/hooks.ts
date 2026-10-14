'use client'
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Currency, Transaction } from '@/types/api'
import {
  convert,
  getMe,
  getRate,
  getTransaction,
  getTransactions,
  type TransactionQuery,
} from '@/lib/api/endpoints'
import { meKeys, rateKeys, transactionKeys } from './keys'

/** One cached /me shared by the dashboard, the user menu and the convert page. */
export function useMe() {
  return useQuery({
    queryKey: meKeys.all,
    queryFn: ({ signal }) => getMe({ signal }).then((res) => res.data),
  })
}

/** Resolves to `{ data, meta }`; keeps the previous page on screen while the next one loads. */
export function useTransactions(params: TransactionQuery) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: ({ signal }) => getTransactions(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

/** `placeholder` (e.g. the row that was clicked) shows instantly while the full record loads. */
export function useTransaction(id: string | null, placeholder?: Transaction) {
  return useQuery({
    queryKey: transactionKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getTransaction(id!, { signal }).then((res) => res.data),
    enabled: id !== null,
    placeholderData: placeholder,
  })
}

export function useRate(from: Currency, to: Currency) {
  return useQuery({
    queryKey: rateKeys.pair(from, to),
    queryFn: ({ signal }) => getRate(from, to, { signal }).then((res) => res.data),
    enabled: from !== to,
  })
}

/** Each pair is its own query, so one failing rate doesn't blank the others. */
export function useRates(pairs: ReadonlyArray<readonly [Currency, Currency]>) {
  return useQueries({
    queries: pairs.map(([from, to]) => ({
      queryKey: rateKeys.pair(from, to),
      queryFn: ({ signal }: { signal: AbortSignal }) => getRate(from, to, { signal }).then((res) => res.data),
    })),
  })
}

export function useConvert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof convert>[0]) => convert(body).then((res) => res.data),
    onSuccess: () => {
      // Balances and the transaction list both change after a conversion.
      void queryClient.invalidateQueries({ queryKey: meKeys.all })
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}
