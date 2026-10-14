'use client'
import type { Currency } from '@/types/api'
import { Card, CardHeader } from '@/components/ui'
import { useRates } from '@/lib/query/hooks'
import { formatRate, formatTime } from '@/lib/format'
import styles from './RatesWidget.module.css'

const QUOTES: Currency[] = ['USD', 'GHS']

export function RatesWidget({ base }: { base: Currency }) {
  const rates = useRates(QUOTES.map((quote) => [quote, base] as const)).map((query) => query.data)
  const updatedAt = rates.find(Boolean)?.updatedAt

  return (
    <Card>
      <CardHeader title="Today's rates" />
      <dl className={styles.list}>
        {QUOTES.map((quote, i) => {
          const rate = rates[i]
          return (
            <div key={quote} className={styles.row}>
              <dt>1 {quote}</dt>
              <dd className={styles.value}>{rate ? `${formatRate(rate.rate)} ${base}` : '—'}</dd>
            </div>
          )
        })}
      </dl>
      {updatedAt && <p className={styles.updated}>Updated {formatTime(updatedAt)}</p>}
    </Card>
  )
}
