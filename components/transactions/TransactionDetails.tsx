'use client'
import { useEffect, useState } from 'react'
import type { Transaction } from '@/types/api'
import { Badge, Button, Money } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { transactionStatusDisplay, transactionTypeDisplay } from '@/lib/transactions/display'
import styles from './TransactionDetails.module.css'

export interface TransactionDetailsProps {
  transaction: Transaction
}

/** Body of the transaction details drawer, shared by the dashboard and /transactions. */
export function TransactionDetails({ transaction: tx }: TransactionDetailsProps) {
  const status = transactionStatusDisplay(tx.status)
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
      <dd>{transactionTypeDisplay(tx.type).label}</dd>
      <dt>Status</dt>
      <dd>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </dd>
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
