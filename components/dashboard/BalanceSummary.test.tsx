import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { Wallet } from '@/types/api'
import { BalanceSummary } from './BalanceSummary'

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

const RATES: Record<string, number> = { USD: 1500, GHS: 100 }
const rateResponse = (url: string) => {
  const from = new URL(url, 'http://x').searchParams.get('from')!
  return new Response(JSON.stringify({ data: { from, to: 'NGN', rate: RATES[from], updatedAt: '' } }))
}

const wallets: Wallet[] = [
  { currency: 'NGN', balance: 100000 }, // ₦1,000.00
  { currency: 'USD', balance: 1000 }, //   $10.00 → ₦15,000.00
  { currency: 'GHS', balance: 5000 }, //   GH₵50.00 → ₦5,000.00
]

function renderSummary(list: Wallet[] = wallets) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <BalanceSummary wallets={list} />
    </QueryClientProvider>
  )
}

describe('BalanceSummary', () => {
  it('converts every wallet to NGN instead of adding raw minor units', async () => {
    fetchMock.mockImplementation((url: string) => Promise.resolve(rateResponse(url)))
    renderSummary()
    // 1,000 + 15,000 + 5,000. The old code showed ₦1,060.00 (100000 + 1000 + 5000 kobo).
    expect(await screen.findByText('₦21,000.00')).toBeInTheDocument()
    expect(screen.getByText("Estimated in NGN at today's rates")).toBeInTheDocument()
  })

  it('needs no rates, and claims no estimate, for an NGN-only account', () => {
    renderSummary([{ currency: 'NGN', balance: 100000 }])
    expect(screen.getByText('₦1,000.00')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.queryByText(/Estimated/)).toBeNull()
  })

  it('says so when rates fail instead of showing a wrong total', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ error: { code: 'X', message: 'x' } }), { status: 500 }))
    )
    renderSummary()
    expect(await screen.findByText(/Couldn't load exchange rates/)).toBeInTheDocument()
    expect(screen.queryByText(/₦/)).toBeNull()
  })
})

describe('BalanceSummary hide toggle', () => {
  it('hides every amount on the page, not just the total, and remembers it', async () => {
    const { WalletCard } = await import('./WalletCard')
    renderSummary([{ currency: 'NGN', balance: 100000 }])
    render(<WalletCard wallet={{ currency: 'NGN', balance: 250000 }} />)
    expect(screen.getByText('₦2,500.00')).toBeInTheDocument()

    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.click(screen.getByRole('button', { name: 'Hide balances' }))
    expect(screen.queryByText('₦1,000.00')).toBeNull()
    expect(screen.queryByText('₦2,500.00')).toBeNull()
    expect(window.localStorage.getItem('acme.hideBalances')).toBe('1')

    await userEvent.click(screen.getByRole('button', { name: 'Show balances' }))
    expect(screen.getByText('₦2,500.00')).toBeInTheDocument()
  })
})
