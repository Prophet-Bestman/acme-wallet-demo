import styles from './TransactionListSkeleton.module.css'

export function TransactionListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading transactions">
      <div className={styles.groupBar} aria-hidden>
        <span className={styles.line} style={{ width: 48 }} />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.row} aria-hidden>
          <span className={styles.icon} />
          <span className={styles.main}>
            <span className={styles.line} style={{ width: '20%' }} />
            <span className={styles.line} style={{ width: '45%' }} />
          </span>
          <span className={styles.end}>
            <span className={styles.line} style={{ width: 64 }} />
            <span className={styles.line} style={{ width: 28 }} />
          </span>
        </div>
      ))}
    </div>
  )
}
