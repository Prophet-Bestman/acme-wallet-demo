import { cx } from '@/lib/cx'
import { Button } from '../Button'
import styles from './Pagination.module.css'

export interface PaginationProps {
  page: number
  totalPages: number
  /** Total items and page size, for "Showing 1–20 of 237". */
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

/**
 * Page numbers to show: always the first and last, the current page with one on each side
 * (at least three at the edges), and 'gap' where pages are skipped.
 * 1 of 12 → 1 2 3 … 12 · 6 of 12 → 1 … 5 6 7 … 12
 */
export function pageItems(page: number, totalPages: number): (number | 'gap')[] {
  const start = Math.max(1, Math.min(page - 1, totalPages - 2))
  const end = Math.min(totalPages, Math.max(page + 1, 3))
  const items: (number | 'gap')[] = []
  if (start > 1) items.push(1)
  // A gap that would hide a single page shows that page instead.
  if (start === 3) items.push(2)
  else if (start > 3) items.push('gap')
  for (let p = start; p <= end; p++) items.push(p)
  if (end === totalPages - 2) items.push(totalPages - 1)
  else if (end < totalPages - 2) items.push('gap')
  if (end < totalPages) items.push(totalPages)
  return items
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <p className={styles.range}>
        Showing {first}–{last} of {total.toLocaleString('en-NG')}
      </p>
      <div className={styles.controls}>
        <Button
          variant="secondary"
          size="sm"
          iconLeft="chevron-left"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <span className={styles.wide}>Previous</span>
          <span className={styles.narrow}>Prev</span>
        </Button>

        <ol className={styles.pages}>
          {pageItems(page, totalPages).map((item, i) =>
            item === 'gap' ? (
              <li key={`gap-${i}`} className={styles.gap} aria-hidden>
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className={cx(styles.page, item === page && styles.current)}
                  aria-current={item === page ? 'page' : undefined}
                  aria-label={`Page ${item}`}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </button>
              </li>
            )
          )}
        </ol>
        <p className={styles.compact}>
          Page {page} of {totalPages}
        </p>

        <Button
          variant="secondary"
          size="sm"
          iconRight="chevron-right"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
