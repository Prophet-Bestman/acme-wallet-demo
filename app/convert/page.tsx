'use client'
import { useState } from 'react'
import type { Currency } from '@/types/api'
import { CURRENCIES } from '@/types/api'
import { Button, Card, Input, Money, Select } from '@/components/ui'
import { ApiError } from '@/lib/api/client'
import { parseMoney } from '@/lib/format'
import { useConvert, useMe, useRate } from '@/lib/query/hooks'
import styles from './page.module.css'

const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({ value: c, label: c }))

export default function ConvertPage() {
  const [from, setFrom] = useState<Currency>('USD')
  const [to, setTo] = useState<Currency>('NGN')
  const [amount, setAmount] = useState('')

  const { data: user } = useMe()
  // Keyed by pair, so a slow response for an old pair can't overwrite the current rate.
  const { data: rate } = useRate(from, to)
  const conversion = useConvert()
  const submitting = conversion.isPending
  const result = conversion.data
  const error = conversion.error

  const value = parseMoney(amount, from) ?? 0
  const fee = Math.round(value * 0.015)
  const youGet = rate ? Math.floor(value * rate.rate) : 0
  const wallet = user?.wallets.find((w) => w.currency === from)
  const canSubmit = value > 0 && from !== to && !submitting

  const handleConvert = () => {
    if (!canSubmit) return
    conversion.mutate({ from, to, amount: value }, { onSuccess: () => setAmount('') })
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Convert currency</h1>

      <Card>
        <div className={styles.row}>
          <Select
            label="From"
            options={CURRENCY_OPTIONS}
            value={from}
            onValueChange={(value) => setFrom(value as Currency)}
            fieldClassName={styles.currency}
          />
          <Input
            label="Amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={
              wallet ? (
                <>
                  Balance: <Money amount={wallet.balance} currency={from} />
                </>
              ) : (
                'Balance: …'
              )
            }
            fieldClassName={styles.amount}
          />
        </div>

        <Select
          label="To"
          options={CURRENCY_OPTIONS}
          value={to}
          onValueChange={(value) => setTo(value as Currency)}
          fieldClassName={styles.to}
        />

        <dl className={styles.summary}>
          <div className={styles.summaryRow}>
            <dt>Rate</dt>
            <dd>{rate ? `1 ${from} = ${rate.rate} ${to}` : '…'}</dd>
          </div>
          <div className={styles.summaryRow}>
            <dt>Fee (1.5%)</dt>
            <dd>
              <Money amount={fee} currency={from} />
            </dd>
          </div>
          <div className={styles.summaryTotal}>
            <dt>You get</dt>
            <dd>
              <Money amount={youGet} currency={to} />
            </dd>
          </div>
        </dl>

        {error && (
          <p className={styles.error} role="alert">
            {error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'}
          </p>
        )}

        <Button fullWidth onClick={handleConvert} disabled={!canSubmit}>
          {submitting ? 'Converting…' : 'Convert'}
        </Button>
      </Card>

      {result && (
        <Card className={styles.success}>
          Conversion successful. You received <Money amount={result.received} currency={result.to} />.
        </Card>
      )}
    </div>
  )
}
