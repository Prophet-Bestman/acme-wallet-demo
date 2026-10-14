import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConvertPage from './page'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            url.includes('/rates')
              ? { data: { from: 'USD', to: 'NGN', rate: 1523.4567, updatedAt: '' } }
              : { data: { wallets: [{ currency: 'USD', balance: 500000 }] } }
          )
        )
      )
    )
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ConvertPage />
    </QueryClientProvider>
  )
}

describe('ConvertPage', () => {
  it('accepts an amount with thousands separators', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('Amount'), '1,500')
    // 1.5% of $1,500.00
    expect(await screen.findByText('$22.50')).toBeInTheDocument()
  })

  it('shows the rate formatted, not as a raw float', async () => {
    renderPage()
    expect(await screen.findByText('1 USD = 1,523.46 NGN')).toBeInTheDocument()
  })
})
