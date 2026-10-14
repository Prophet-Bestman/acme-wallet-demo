'use client'
import { useEffect, useState } from 'react'
import type { Transaction } from '@/types/api'
import { Badge, Icon, Money } from '@/components/ui'
import { cx } from '@/lib/cx'
import { formatDateTime } from '@/lib/format'
import { transactionStatusDisplay, transactionTypeDisplay } from './display'
import { TransactionAvatar } from './TransactionAvatar'
import styles from './TransactionDetails.module.css'

export interface TransactionDetailsProps {
  transaction: Transaction
}

/** Body of the transaction details drawer, shared by the dashboard and /transactions. */
export function TransactionDetails({ transaction: tx }: TransactionDetailsProps) {
  const type = transactionTypeDisplay(tx.type)
  const status = transactionStatusDisplay(tx.status)
  // "Transfer out to Kwame Mensah"; without a counterparty, just the type.
  const headline = tx.counterparty
    ? `${type.label} ${type.direction === 'credit' ? 'from' : 'to'} ${tx.counterparty}`
    : type.label

  return (
    <div className={styles.details}>
      <div className={styles.hero}>
        <TransactionAvatar transaction={tx} size="lg" />
        <p className={styles.headline}>{headline}</p>
        <Money
          amount={tx.amount}
          currency={tx.currency}
          sign={type.direction === 'neutral' ? undefined : type.direction}
          className={cx(styles.amount, type.direction === 'credit' && styles.credit)}
        />
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </div>

      <section>
        <h3 className={styles.sectionLabel}>Details</h3>
        <dl className={styles.list}>
          <dt>Reference</dt>
          <dd className={styles.reference}>
            <span className={styles.mono}>{tx.reference}</span>
            <CopyButton value={tx.reference} label="Copy reference" />
          </dd>
          <dt>Date</dt>
          <dd>{formatDateTime(tx.createdAt)}</dd>
          <dt>Type</dt>
          <dd>{type.label}</dd>
          {tx.counterparty && (
            <>
              <dt>Counterparty</dt>
              <dd>{tx.counterparty}</dd>
            </>
          )}
          <dt>Narration</dt>
          {/* Plain text: narration is unsanitised upstream data. */}
          <dd>{tx.narration}</dd>
        </dl>
      </section>

      <section>
        <h3 className={styles.sectionLabel}>Summary</h3>
        <dl className={styles.list}>
          <dt>Amount</dt>
          <dd>
            <Money amount={tx.amount} currency={tx.currency} />
          </dd>
          <dt>Fee</dt>
          <dd>
            <Money amount={tx.fee} currency={tx.currency} />
          </dd>
          {/* API.md: the fee is charged on top of the amount. */}
          <dt className={styles.total}>Total</dt>
          <dd className={styles.total}>
            <Money amount={tx.amount + tx.fee} currency={tx.currency} />
          </dd>
        </dl>
      </section>
    </div>
  )
}

/** Mirrors the details layout while a transaction opened from a link loads. */
export function TransactionDetailsSkeleton() {
  return (
    <div className={styles.details} role="status" aria-label="Loading transaction">
      <div className={styles.hero} aria-hidden>
        <span className={cx(styles.bone, styles.boneAvatar)} />
        <span className={styles.bone} style={{ width: 120, height: 10 }} />
        <span className={styles.bone} style={{ width: 128, height: 20 }} />
        <span className={styles.bone} style={{ width: 72, height: 16, borderRadius: 999 }} />
      </div>
      <div className={styles.list} aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.boneRow}>
            <span className={styles.bone} style={{ width: 64 }} />
            <span className={styles.bone} style={{ width: 96 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const id = setTimeout(() => setState('idle'), 2000)
    return () => clearTimeout(id)
  }, [state])

  const copy = async () => {
    try {
      // Clipboard needs a secure context and can be denied; report that instead of failing silently.
      await navigator.clipboard.writeText(value)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <>
      <button type="button" className={styles.copy} onClick={copy} aria-label={label} title={label}>
        {state === 'copied' ? <span className={styles.copied}>Copied</span> : <Icon name="copy" size={14} />}
      </button>
      <span className="visually-hidden" role="status">
        {state === 'copied' ? 'Reference copied' : state === 'failed' ? 'Could not copy the reference' : ''}
      </span>
    </>
  )
}
