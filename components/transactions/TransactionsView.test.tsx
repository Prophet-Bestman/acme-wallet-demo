import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Transaction } from '@/types/api'
import { TransactionsView } from './TransactionsView'

// An in-memory URL that re-renders subscribers on navigation, like the Next router.
const nav = vi.hoisted(() => {
  const listeners = new Set<() => void>()
  const store = { search: new URLSearchParams() }
  const go = (href: string) => {
    store.search = new URLSearchParams(href.split('?')[1] ?? '')
    listeners.forEach((listener) => listener())
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
  return { store, subscribe, push: vi.fn(go), replace: vi.fn(go), back: vi.fn() }
})

vi.mock('next/navigation', async () => {
  const { useSyncExternalStore } = await import('react')
  return {
    useRouter: () => ({ push: nav.push, replace: nav.replace, back: nav.back }),
    usePathname: () => '/transactions',
    useSearchParams: () => useSyncExternalStore(nav.subscribe, () => nav.store.search),
  }
})

const tx = (id: string, overrides: Partial<Transaction> = {}): Transaction => ({
  id,
  reference: `REF-${id}`,
  type: 'deposit',
  status: 'successful',
  currency: 'NGN',
  amount: 150050,
  fee: 0,
  narration: `Narration ${id}`,
  counterparty: null,
  createdAt: '2026-10-01T10:00:00Z',
  ...overrides,
})

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
const page = (rows: Transaction[], meta: Partial<{ page: number; total: number; totalPages: number }> = {}) =>
  json(200, { data: rows, meta: { page: 1, limit: 20, total: rows.length, totalPages: 1, ...meta } })

const fetchMock = vi.fn()

function renderView(url = '') {
  nav.store.search = new URLSearchParams(url)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <TransactionsView />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  nav.push.mockClear()
  nav.replace.mockClear()
  nav.back.mockClear()
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('TransactionsView', () => {
  it('shows a skeleton, then the rows and total', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(page([tx('a'), tx('b')], { total: 42, totalPages: 3 }))
    )
    renderView()
    expect(screen.getByRole('status', { name: 'Loading transactions' })).toBeInTheDocument()

    expect(await screen.findByText('Narration a')).toBeInTheDocument()
    expect(screen.getByText('42 transactions')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })

  it('sends the URL state to the API', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(page([tx('a')])))
    renderView('status=failed&currency=USD&page=2')
    await screen.findByText('Narration a')
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('status=failed')
    expect(url).toContain('currency=USD')
    expect(url).toContain('page=2')
  })

  it('never sends a param that fails validation', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(page([tx('a')])))
    renderView('status=garbage&type=refund&page=-3')
    await screen.findByText('Narration a')
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).not.toContain('status=')
    expect(url).not.toContain('type=')
    expect(url).toContain('page=1')
  })

  it('does not claim the account is empty while correcting an out-of-range page', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(page([], { page: 12, total: 30, totalPages: 2 })))
    renderView('page=12')
    await vi.waitFor(() => expect(nav.replace).toHaveBeenCalled())
    expect(screen.queryByText('No transactions yet')).toBeNull()
    expect(screen.queryByText('No results')).toBeNull()
  })

  it('distinguishes "no transactions yet" from "no results"', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(page([])))
    const { unmount } = renderView()
    expect(await screen.findByText('No transactions yet')).toBeInTheDocument()
    unmount()

    renderView('q=zzz')
    expect(await screen.findByText('No results')).toBeInTheDocument()
    const state = screen.getByText('No results').parentElement!
    await userEvent.click(within(state).getByRole('button', { name: 'Clear filters' }))
    expect(nav.push).toHaveBeenLastCalledWith('/transactions', { scroll: false })
  })

  it('shows an error with a Retry that refetches', async () => {
    fetchMock.mockResolvedValueOnce(json(500, { error: { code: 'INTERNAL', message: 'Boom' } }))
    renderView()
    expect(await screen.findByText("We couldn't load your transactions")).toBeInTheDocument()

    fetchMock.mockResolvedValueOnce(page([tx('a')]))
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Narration a')).toBeInTheDocument()
  })

  it('clamps a page past the end', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(page([], { page: 12, total: 30, totalPages: 2 })))
    renderView('page=12')
    await vi.waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/transactions?page=2', { scroll: false })
    )
  })

  it('pushes filter changes', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(page([tx('a')])))
    renderView()
    await screen.findByText('Narration a')
    // The desktop and mobile-sheet filters share labels; the sheet is closed, so only one is rendered.
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'pending')
    expect(nav.push).toHaveBeenLastCalledWith('/transactions?status=pending', { scroll: false })
  })

  it('flags an inverted date range and never sends it', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(page([tx('a')])))
    renderView('from=2026-10-10&to=2026-01-01')
    expect(await screen.findByText('Must be on or after the From date')).toBeInTheDocument()
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).not.toContain('from=')
    expect(url).not.toContain('to=')
  })

  it('opens details from a row and shows them immediately', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.includes('/transactions/') ? json(200, { data: tx('a') }) : page([tx('a')]))
    )
    renderView()
    await userEvent.click(await screen.findByText('Narration a'))
    expect(nav.push).toHaveBeenLastCalledWith('/transactions?tx=a', { scroll: false })

    const dialog = await screen.findByRole('dialog', { name: 'Transaction details' })
    expect(within(dialog).getByText('REF-a')).toBeInTheDocument()
  })

  it('shows not found for an unknown ?tx=', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes('/transactions/')
          ? json(404, { error: { code: 'NOT_FOUND', message: 'Not found' } })
          : page([tx('a')])
      )
    )
    renderView('tx=txn_missing')
    const dialog = await screen.findByRole('dialog', { name: 'Transaction details' })
    expect(await within(dialog).findByText('Transaction not found')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Back to transactions' }))
    expect(nav.replace).toHaveBeenLastCalledWith('/transactions', { scroll: false })
  })
})
