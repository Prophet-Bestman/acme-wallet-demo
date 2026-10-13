import type { ApiErrorBody, ApiSuccess } from '@/types/api'
import { logger } from '@/lib/logger'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Builds an ApiError and logs the failures that are ours to fix (5xx, network), not expected 4xx. */
function toApiError(status: number, body: unknown, fallbackMessage: string): ApiError {
  const error = (body as Partial<ApiErrorBody> | undefined)?.error
  const code = error?.code ?? (status === 0 ? 'NETWORK' : `HTTP_${status}`)
  const message = error?.message ?? fallbackMessage
  if (status >= 500 || status === 0) {
    logger.error('http.request_failed', { status, code, message })
  }
  return new ApiError(status, code, message)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  } catch (err) {
    // Let cancellation propagate untouched so callers (and React Query) can ignore it.
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw toApiError(0, undefined, 'Network error. Check your connection and try again.')
  }

  // Proxies and gateways can answer with HTML or an empty body.
  const body: unknown = await res.json().catch(() => undefined)

  if (!res.ok) {
    throw toApiError(res.status, body, res.statusText || 'Something went wrong. Please try again.')
  }
  if (body === undefined) {
    logger.error('http.invalid_response', { status: res.status, path })
    throw new ApiError(res.status, 'INVALID_RESPONSE', 'The server sent an unreadable response.')
  }
  return body as ApiSuccess<T>
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),
}
