'use client'
import { useEffect, useState } from 'react'
import type { Transaction } from '@/types/api'
import { Button, Money } from '@/components/ui'
import { formatDateTime, TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import styles from './TransactionDetails.module.css'

export interface TransactionDetailsProps {
  transaction: Transaction
}

/** Body of the transaction details drawer, shared by the dashboard and /transactions. */
export function TransactionDetails({ transaction: tx }: TransactionDetailsProps) {
  return (
    <dl className={styles.details}>
      <dt>Amount</dt>
      <dd>
        <Money amount={tx.amount} currency={tx.currency} className={styles.amount} />
      </dd>
      <dt>Fee</dt>
      <dd>
        <Money amount={tx.fee} currency={tx.currency} />
      </dd>
      <dt>Type</dt>
      <dd>{TRANSACTION_TYPE_LABELS[tx.type]}</dd>
      <dt>Status</dt>
      <dd>{TRANSACTION_STATUS_LABELS[tx.status]}</dd>
      <dt>Date</dt>
      <dd>{formatDateTime(tx.createdAt)}</dd>
      {tx.counterparty && (
        <>
          <dt>Counterparty</dt>
          <dd>{tx.counterparty}</dd>
        </>
      )}
      <dt>Description</dt>
      {/* Plain text: narration is unsanitised upstream data. */}
      <dd>{tx.narration}</dd>
      <dt>Reference</dt>
      <dd className={styles.reference}>
        <span className={styles.mono}>{tx.reference}</span>
        <CopyButton value={tx.reference} label="Copy reference" />
      </dd>
    </dl>
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
      <Button variant="ghost" size="sm" iconLeft="copy" onClick={copy} aria-label={label}>
        {state === 'copied' ? 'Copied' : 'Copy'}
      </Button>
      <span className="visually-hidden" role="status">
        {state === 'copied' ? 'Reference copied' : state === 'failed' ? 'Could not copy the reference' : ''}
      </span>
    </>
  )
}
