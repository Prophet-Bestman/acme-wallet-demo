import { act, renderHook } from '@testing-library/react'
import { useTransactionTableState } from './useTransactionTableState'

// A tiny in-memory URL standing in for the Next router.
const nav = vi.hoisted(() => {
  const store = { search: new URLSearchParams() }
  const go = (href: string) => {
    store.search = new URLSearchParams(href.split('?')[1] ?? '')
  }
  return {
    store,
    push: vi.fn(go),
    replace: vi.fn(go),
    back: vi.fn(),
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace, back: nav.back }),
  usePathname: () => '/transactions',
  useSearchParams: () => nav.store.search,
}))

function setup(initial = '') {
  nav.store.search = new URLSearchParams(initial)
  const hook = renderHook(() => useTransactionTableState())
  // Re-render after each navigation, as Next would.
  const act$ = (fn: () => void) => {
    act(fn)
    hook.rerender()
  }
  return { ...hook, act: act$ }
}

const lastHref = (fn: typeof nav.push) => fn.mock.lastCall?.[0] as string

beforeEach(() => {
  vi.useFakeTimers()
  nav.push.mockClear()
  nav.replace.mockClear()
  nav.back.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTransactionTableState', () => {
  it('reads validated state and query params from the URL', () => {
    const { result } = setup('status=garbage&currency=USD&page=2')
    expect(result.current.state.status).toBeUndefined()
    expect(result.current.queryParams).toMatchObject({ currency: 'USD', page: 2, limit: 20 })
  })

  it('pushes filter changes, resets to page 1 and keeps __scenario', () => {
    const { result, act } = setup('__scenario=slow&page=4')
    act(() => result.current.setFilter('status', 'failed'))
    expect(lastHref(nav.push)).toBe('/transactions?__scenario=slow&status=failed')
    expect(result.current.state.page).toBe(1)
  })

  it('clears a filter when set to an empty value', () => {
    const { result, act } = setup('status=failed')
    act(() => result.current.setFilter('status', undefined))
    expect(lastHref(nav.push)).toBe('/transactions')
  })

  it('debounces typing into a single history replace', () => {
    const { result, act } = setup('page=3')
    act(() => result.current.setSearchInput('n'))
    act(() => result.current.setSearchInput('net'))
    expect(result.current.searchInput).toBe('net')
    expect(nav.replace).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(300))
    expect(nav.replace).toHaveBeenCalledTimes(1)
    expect(lastHref(nav.replace)).toBe('/transactions?q=net')
    expect(nav.push).not.toHaveBeenCalled()
  })

  it('shows a search restored by Back without writing it again', () => {
    const { result, rerender } = setup('q=net')
    nav.store.search = new URLSearchParams('q=old')
    rerender()
    expect(result.current.searchInput).toBe('old')

    act(() => vi.advanceTimersByTime(300))
    rerender()
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('resets filters and search but keeps the page size', () => {
    const { result, act } = setup('q=net&status=failed&limit=50&page=2')
    act(() => result.current.resetFilters())
    expect(lastHref(nav.push)).toBe('/transactions?limit=50')
    expect(result.current.searchInput).toBe('')
    expect(result.current.filtersActive).toBe(false)
  })

  it('clamps an out-of-range page with a replace', () => {
    const { result, act } = setup('page=12')
    act(() => result.current.clampPage(3))
    expect(lastHref(nav.replace)).toBe('/transactions?page=3')
    nav.replace.mockClear()
    act(() => result.current.clampPage(3))
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('keeps an inverted date range from a shared link out of the query', () => {
    const { result } = setup('from=2026-02-01&to=2026-01-01')
    expect(result.current.queryParams.from).toBeUndefined()
    expect(result.current.queryParams.to).toBeUndefined()
  })

  it('opens details with a push and closes them with Back', () => {
    const { result, act } = setup('status=failed')
    act(() => result.current.openTransaction('txn_1'))
    expect(lastHref(nav.push)).toBe('/transactions?status=failed&tx=txn_1')
    expect(result.current.state.tx).toBe('txn_1')

    act(() => result.current.closeTransaction())
    expect(nav.back).toHaveBeenCalledTimes(1)
  })

  it('closes details from a shared link with a replace', () => {
    const { result, act } = setup('tx=txn_1')
    act(() => result.current.closeTransaction())
    expect(nav.back).not.toHaveBeenCalled()
    expect(lastHref(nav.replace)).toBe('/transactions')
  })
})
