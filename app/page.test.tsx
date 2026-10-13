import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from './page'

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

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>
  )
}

describe('DashboardPage', () => {
  it('shows a retryable error instead of crashing when /me fails', async () => {
    fetchMock.mockResolvedValue(json(500, { error: { code: 'INTERNAL', message: 'Boom' } }))
    renderPage()

    expect(await screen.findByText("We couldn't load your account.")).toBeInTheDocument()

    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.endsWith('/me')
          ? json(200, { data: { firstName: 'Ada', lastName: 'Obi', wallets: [] } })
          : json(200, { data: [] })
      )
    )
    await userEvent.click(screen.getByText('Retry'))

    expect(await screen.findByText('Welcome back, Ada')).toBeInTheDocument()
  })
})
