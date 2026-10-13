import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/client'

const MAX_RETRIES = 2

/**
 * Only retry failures that might succeed on a second attempt: network errors,
 * timeouts, rate limits and server errors. Other 4xx responses (and 501) give
 * the same answer every time, and non-ApiErrors are bugs in our own code.
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false
  const { status } = error
  if (status === 0 || status === 408 || status === 429) return true
  return status >= 500 && status !== 501
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryable(error),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Never replay a POST: a retried /convert could move money twice.
        retry: false,
      },
    },
  })
}
