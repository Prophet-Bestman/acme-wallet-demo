'use client'
import { useEffect, useEffectEvent, useRef, type ReactNode } from 'react'
import type { Transaction } from '@/types/api'
import { Button, Card, Drawer, Icon, Input, Pagination, type IconName } from '@/components/ui'
import { ApiError } from '@/lib/api/client'
import { cx } from '@/lib/cx'
import { useDisclosure } from '@/lib/hooks'
import { useTransaction, useTransactions } from '@/lib/query/hooks'
import { useTransactionTableState } from '@/lib/transactions/useTransactionTableState'
import { TransactionDetails } from './TransactionDetails'
import { TransactionFilters } from './TransactionFilters'
import { TransactionListSkeleton } from './TransactionListSkeleton'
import { TransactionRow } from './TransactionRow'
import styles from './TransactionsView.module.css'

export function TransactionsView() {
  const table = useTransactionTableState()
  const { data, isPending, isError, error, isFetching, isPlaceholderData, refetch } = useTransactions(
    table.queryParams
  )
  const filterSheet = useDisclosure()
  const listRef = useRef<HTMLDivElement>(null)

  const rows = data?.data
  const meta = data?.meta
  const { type, status, currency, from, to } = table.state
  const filters = { type, status, currency, from, to }
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // `?page=12` after a filter leaves 3 pages: move to the last real page.
  const clampPage = useEffectEvent((totalPages: number) => table.clampPage(totalPages))
  useEffect(() => {
    if (meta && !isPlaceholderData) clampPage(meta.totalPages)
  }, [meta, isPlaceholderData])

  const goToPage = (page: number) => {
    table.setPage(page)
    // Pagination sits under the list; bring the top of the new page into view.
    const list = listRef.current
    if (list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: 'start' })
  }

  const isUpdating = isFetching && !isPending

  let content
  if (isPending) {
    content = <TransactionListSkeleton />
  } else if (isError && !rows) {
    content = (
      <StateMessage
        icon="alert"
        title="We couldn't load your transactions"
        body={
          error instanceof ApiError && error.code === 'NETWORK'
            ? 'Check your connection and try again.'
            : 'Something went wrong on our side. Please try again.'
        }
        action={
          <Button variant="secondary" iconLeft="refresh" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Retrying…' : 'Retry'}
          </Button>
        }
        role="alert"
      />
    )
  } else if (meta?.total === 0) {
    content = table.filtersActive ? (
      <StateMessage
        icon="search"
        title="No results"
        body="No transactions match your search or filters."
        action={
          <Button variant="secondary" onClick={table.resetFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <StateMessage
        icon="inbox"
        title="No transactions yet"
        body="Deposits, transfers and payments will show up here."
      />
    )
  } else if (!rows?.length) {
    // An out-of-range page (e.g. ?page=12 of 2) is empty but the account isn't; clampPage is
    // already moving us, so don't flash an empty state that isn't true.
    content = <TransactionListSkeleton />
  } else {
    content = rows.map((tx) => (
      <TransactionRow key={tx.id} transaction={tx} onSelect={() => table.openTransaction(tx.id)} />
    ))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.summary} aria-live="polite">
          {meta && (
            <>
              {meta.total.toLocaleString('en-NG')} {meta.total === 1 ? 'transaction' : 'transactions'}
            </>
          )}
          {isUpdating && <span className={styles.updating}>Updating…</span>}
        </p>
      </header>

      <div className={styles.toolbar}>
        <Input
          label="Search transactions"
          hideLabel
          type="search"
          leadingIcon="search"
          placeholder="Search reference, name or description"
          value={table.searchInput}
          onChange={(e) => table.setSearchInput(e.target.value)}
          fieldClassName={styles.search}
        />
        <div className={styles.mobileOnly}>
          <Button variant="secondary" onClick={filterSheet.onOpen} aria-haspopup="dialog">
            Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </div>
        {table.filtersActive && (
          <Button variant="ghost" onClick={table.resetFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <div className={styles.desktopOnly}>
        <TransactionFilters
          filters={filters}
          onChange={table.setFilter}
          dateRangeInvalid={table.dateRangeInvalid}
        />
      </div>

      <div ref={listRef} className={styles.listAnchor}>
        <Card padding="none" className={cx(styles.list, isPlaceholderData && styles.stale)}>
          <div aria-busy={isPending || isPlaceholderData}>{content}</div>
        </Card>
      </div>

      {meta && rows && rows.length > 0 && (
        <Pagination page={table.state.page} totalPages={meta.totalPages} onPageChange={goToPage} />
      )}

      <Drawer
        open={filterSheet.isOpen}
        title="Filters"
        onClose={filterSheet.onClose}
        footer={
          <div className={styles.sheetFooter}>
            <Button variant="secondary" onClick={table.resetFilters} disabled={!table.filtersActive}>
              Clear
            </Button>
            <Button onClick={filterSheet.onClose} disabled={table.dateRangeInvalid}>
              Show results
            </Button>
          </div>
        }
      >
        <TransactionFilters
          filters={filters}
          onChange={table.setFilter}
          dateRangeInvalid={table.dateRangeInvalid}
          layout="stack"
        />
      </Drawer>

      <TransactionDetailsDrawer
        id={table.state.tx ?? null}
        placeholder={rows?.find((tx) => tx.id === table.state.tx)}
        onClose={table.closeTransaction}
      />
    </div>
  )
}

/** Suspense fallback while search params are read on the client. */
export function TransactionsViewFallback() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
      </header>
      <Card padding="none" className={styles.list}>
        <TransactionListSkeleton />
      </Card>
    </div>
  )
}

function TransactionDetailsDrawer({
  id,
  placeholder,
  onClose,
}: {
  id: string | null
  placeholder?: Transaction
  onClose: () => void
}) {
  const { data, isError, error, isFetching, refetch } = useTransaction(id, placeholder)

  let body
  if (data) {
    body = <TransactionDetails transaction={data} />
  } else if (isError && error instanceof ApiError && error.status === 404) {
    body = (
      <StateMessage
        icon="search"
        title="Transaction not found"
        body="It may have been removed, or the link is incorrect."
        action={
          <Button variant="secondary" onClick={onClose}>
            Back to transactions
          </Button>
        }
      />
    )
  } else if (isError) {
    body = (
      <StateMessage
        icon="alert"
        title="We couldn't load this transaction"
        body="Please try again."
        action={
          <Button variant="secondary" iconLeft="refresh" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Retrying…' : 'Retry'}
          </Button>
        }
        role="alert"
      />
    )
  } else {
    body = <p className={styles.drawerLoading}>Loading…</p>
  }

  return (
    <Drawer open={id !== null} title="Transaction details" onClose={onClose}>
      {body}
    </Drawer>
  )
}

function StateMessage({
  icon,
  title,
  body,
  action,
  role,
}: {
  icon: IconName
  title: string
  body: string
  action?: ReactNode
  role?: 'alert'
}) {
  return (
    <div className={styles.state} role={role}>
      <span className={styles.stateIcon}>
        <Icon name={icon} size={22} />
      </span>
      <h2 className={styles.stateTitle}>{title}</h2>
      <p className={styles.stateBody}>{body}</p>
      {action}
    </div>
  )
}
