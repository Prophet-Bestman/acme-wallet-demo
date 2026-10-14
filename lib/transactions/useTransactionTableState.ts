import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useDebounce } from '@/lib/hooks'
import {
  hasActiveFilters,
  isDateRangeInvalid,
  normalizeQuery,
  parseTransactionUrlState,
  serializeTransactionUrlState,
  toTransactionQuery,
  type TransactionFilters,
  type TransactionUrlState,
} from './url-state'

const SEARCH_DEBOUNCE_MS = 300

/**
 * Search, filters, pagination and the open transaction for /transactions, with the URL as the
 * single source of truth: refresh, shared links and Back/Forward all restore the same view.
 *
 * Must render inside <Suspense> (it reads useSearchParams).
 */
export function useTransactionTableState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const state = useMemo(() => parseTransactionUrlState(searchParams), [searchParams])

  const navigate = (next: TransactionUrlState, mode: 'push' | 'replace') => {
    const qs = serializeTransactionUrlState(next, searchParams)
    router[mode](qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // ─── Search: live input, debounced into the URL ───────────────────────────
  const [searchInput, setSearchInput] = useState(state.q)
  const search = useDebounce(searchInput, SEARCH_DEBOUNCE_MS)

  // When q changes from outside (Back/Forward, a link), show it in the box. Skip the change
  // our own debounced write caused, or we'd overwrite whatever the user typed since.
  const [syncedQ, setSyncedQ] = useState(state.q)
  if (state.q !== syncedQ) {
    setSyncedQ(state.q)
    if (state.q !== normalizeQuery(search)) setSearchInput(state.q)
  }

  // Typing replaces the history entry so Back skips every keystroke.
  const commitSearch = useEffectEvent((value: string) => {
    const q = normalizeQuery(value)
    if (q !== state.q) navigate({ ...state, q, page: 1 }, 'replace')
  })
  useEffect(() => {
    commitSearch(search)
  }, [search])

  // ─── Filters and pagination: each change is its own history entry ─────────
  const setFilter = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) =>
    navigate({ ...state, [key]: value || undefined, page: 1 }, 'push')

  const resetFilters = () => {
    setSearchInput('')
    navigate({ page: 1, limit: state.limit, q: '' }, 'push')
  }

  const setPage = (page: number) => navigate({ ...state, page }, 'push')

  /** Call with meta.totalPages: `?page=12` after narrowing to 3 pages lands on page 3. */
  const clampPage = (totalPages: number) => {
    if (totalPages >= 1 && state.page > totalPages) navigate({ ...state, page: totalPages }, 'replace')
  }

  // ─── Details drawer (?tx=) ────────────────────────────────────────────────
  // If we pushed the entry, closing goes Back so history doesn't fill with open/close pairs.
  // A cold load (shared link, refresh) has nothing of ours to go back to, so it replaces.
  const openedInApp = useRef(false)

  const openTransaction = (id: string) => {
    openedInApp.current = true
    navigate({ ...state, tx: id }, 'push')
  }

  const closeTransaction = () => {
    if (openedInApp.current) {
      openedInApp.current = false
      router.back()
    } else {
      navigate({ ...state, tx: undefined }, 'replace')
    }
  }

  const queryParams = useMemo(() => toTransactionQuery(state), [state])

  return {
    state,
    searchInput,
    setSearchInput,
    setFilter,
    resetFilters,
    filtersActive: hasActiveFilters(state),
    dateRangeInvalid: isDateRangeInvalid(state),
    setPage,
    clampPage,
    openTransaction,
    closeTransaction,
    /** Pass straight to useTransactions; it is the query key too. */
    queryParams,
  }
}
