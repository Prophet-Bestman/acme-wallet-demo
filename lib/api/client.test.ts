import { api, ApiError } from './client'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  const err = await promise.catch((e: unknown) => e)
  expect(err).toBeInstanceOf(ApiError)
  return err as ApiError
}

describe('api client', () => {
  it('resolves with data and meta on success', async () => {
    fetchMock.mockResolvedValue(
      json(200, { data: [1], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } })
    )
    await expect(api.get('/transactions')).resolves.toEqual({
      data: [1],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    })
  })

  it('throws the API error code and message on 4xx without logging', async () => {
    fetchMock.mockResolvedValue(json(400, { error: { code: 'INVALID_DATE', message: 'Bad date' } }))
    const err = await caught(api.get('/transactions'))
    expect(err).toMatchObject({ status: 400, code: 'INVALID_DATE', message: 'Bad date' })
    expect(console.error).not.toHaveBeenCalled()
  })

  it('throws and logs on 5xx', async () => {
    fetchMock.mockResolvedValue(json(500, { error: { code: 'INTERNAL', message: 'Boom' } }))
    const err = await caught(api.get('/me'))
    expect(err).toMatchObject({ status: 500, code: 'INTERNAL' })
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('http.request_failed'))
  })

  it('falls back to HTTP_<status> when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' })
    )
    const err = await caught(api.get('/me'))
    expect(err).toMatchObject({ status: 502, code: 'HTTP_502', message: 'Bad Gateway' })
  })

  it('rejects a 2xx response whose body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('not json', { status: 200 }))
    const err = await caught(api.get('/me'))
    expect(err.code).toBe('INVALID_RESPONSE')
  })

  it('maps network failures to status 0 / NETWORK', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const err = await caught(api.get('/me'))
    expect(err).toMatchObject({ status: 0, code: 'NETWORK' })
  })

  it('lets aborts propagate untouched and passes the signal to fetch', async () => {
    const controller = new AbortController()
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    const err = await api.get('/me', { signal: controller.signal }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(DOMException)
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal)
  })
})
