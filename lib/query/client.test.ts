import { ApiError } from '@/lib/api/client'
import { isRetryable, makeQueryClient } from './client'

const apiError = (status: number) => new ApiError(status, `HTTP_${status}`, 'x')

describe('isRetryable', () => {
  it.each([0, 408, 429, 500, 502, 503, 504])('retries %i', (status) => {
    expect(isRetryable(apiError(status))).toBe(true)
  })

  it.each([200, 400, 401, 403, 404, 409, 410, 422, 501])('does not retry %i', (status) => {
    expect(isRetryable(apiError(status))).toBe(false)
  })

  it('does not retry an unreadable response, even with a 5xx status', () => {
    expect(isRetryable(new ApiError(502, 'INVALID_RESPONSE', 'x'))).toBe(false)
  })

  it('does not retry errors that are not ApiErrors', () => {
    expect(isRetryable(new TypeError('bug'))).toBe(false)
  })
})

describe('makeQueryClient', () => {
  const retry = makeQueryClient().getDefaultOptions().queries!.retry as (
    count: number,
    error: unknown
  ) => boolean

  it('retries a retryable error at most twice', () => {
    expect(retry(0, apiError(500))).toBe(true)
    expect(retry(1, apiError(500))).toBe(true)
    expect(retry(2, apiError(500))).toBe(false)
  })

  it('never retries mutations', () => {
    expect(makeQueryClient().getDefaultOptions().mutations!.retry).toBe(false)
  })
})
