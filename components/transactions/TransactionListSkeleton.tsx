import styles from './TransactionListSkeleton.module.css'

export function TransactionListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading transactions">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.row} aria-hidden>
          <span className={styles.icon} />
          <span className={styles.main}>
            <span className={styles.line} style={{ width: '40%' }} />
            <span className={styles.line} style={{ width: '70%' }} />
          </span>
          <span className={styles.end}>
            <span className={styles.line} style={{ width: 72 }} />
            <span className={styles.line} style={{ width: 96 }} />
          </span>
        </div>
      ))}
    </div>
  )
}
