'use client'
import { useEffect, useEffectEvent, useRef, type ReactNode } from 'react'
import type { Transaction } from '@/types/api'
import { Button, Card, Drawer, Icon, Pagination, type IconName } from '@/components/ui'
import { ApiError } from '@/lib/api/client'
import { cx } from '@/lib/cx'
import { useTransaction, useTransactions } from '@/lib/query/hooks'
import { groupByDay } from '@/lib/transactions/group'
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
  const listRef = useRef<HTMLDivElement>(null)

  const rows = data?.data
  const meta = data?.meta

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
    content = groupByDay(rows).map((group) => (
      <section key={group.key}>
        <h2 className={styles.groupLabel}>{group.label}</h2>
        {group.rows.map((tx) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            timeOnly
            onSelect={() => table.openTransaction(tx.id)}
          />
        ))}
      </section>
    ))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.summary} aria-live="polite">
          {meta ? summaryText(meta.total, table.filtersActive) : '\u00a0'}
          {isUpdating && <span className={styles.updating}>Updating…</span>}
        </p>
      </header>

      <TransactionFilters
        search={table.searchInput}
        onSearchChange={table.setSearchInput}
        type={table.state.type}
        status={table.state.status}
        onTypeChange={(value) => table.setFilter('type', value)}
        onStatusChange={(value) => table.setFilter('status', value)}
        onClear={table.filtersActive ? table.resetFilters : undefined}
      />

      <div ref={listRef} className={styles.listAnchor}>
        <Card padding="none" className={cx(styles.list, isPlaceholderData && styles.stale)}>
          <div aria-busy={isPending || isPlaceholderData}>{content}</div>
        </Card>
      </div>

      {meta && rows && rows.length > 0 && (
        <Pagination page={table.state.page} totalPages={meta.totalPages} onPageChange={goToPage} />
      )}

      <TransactionDetailsDrawer
        id={table.state.tx ?? null}
        placeholder={rows?.find((tx) => tx.id === table.state.tx)}
        onClose={table.closeTransaction}
      />
    </div>
  )
}

/** "237 transactions", or "0 results" / "12 results" while searching or filtering. */
function summaryText(total: number, filtered: boolean) {
  const count = total.toLocaleString('en-NG')
  if (filtered) return `${count} ${total === 1 ? 'result' : 'results'}`
  return `${count} ${total === 1 ? 'transaction' : 'transactions'}`
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
