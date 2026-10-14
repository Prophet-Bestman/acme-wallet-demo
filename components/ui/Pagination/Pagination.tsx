import { cx } from '@/lib/cx'
import { Button } from '../Button'
import styles from './Pagination.module.css'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className={cx(styles.pagination, className)} aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        iconLeft="chevron-left"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <p className={styles.status}>
        Page {page} of {totalPages}
      </p>
      <Button
        variant="secondary"
        size="sm"
        iconRight="chevron-right"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  )
}
