import { render, screen } from '@testing-library/react'
import type { Transaction } from '@/types/api'
import { TransactionRow } from './TransactionRow'

const tx: Transaction = {
  id: 'txn_1',
  reference: 'REF-1',
  type: 'bill_payment',
  status: 'successful',
  currency: 'USD',
  amount: 4599,
  fee: 30,
  narration: `Bill payment - Spectranet <img src="x" onerror="alert(1)">`,
  counterparty: null,
  createdAt: '2026-01-01T10:00:00Z',
}

describe('TransactionRow', () => {
  it('renders narration as text, never as HTML', () => {
    const { container } = render(<TransactionRow transaction={tx} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText(tx.narration)).toBeInTheDocument()
  })

  it('formats the fee in the transaction currency', () => {
    render(<TransactionRow transaction={tx} />)
    expect(screen.getByText(/Fee \$0\.30/)).toBeInTheDocument()
    expect(screen.queryByText(/₦30/)).toBeNull()
  })

  it('renders an unknown type and status without breaking', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(
      <TransactionRow transaction={{ ...tx, type: 'crypto_purchase', status: 'under_review' }} />
    )
    expect(screen.getByText('Crypto purchase')).toBeInTheDocument()
    expect(screen.getByText('Under review')).toBeInTheDocument()
    expect(container.querySelector('svg path')).not.toBeNull()
    // Direction unknown: no + or - sign.
    expect(screen.getByText('$45.99')).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('shows the status as a badge', () => {
    render(<TransactionRow transaction={{ ...tx, status: 'pending' }} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows counterparty initials, or the type icon without one', () => {
    const { container, rerender } = render(
      <TransactionRow
        transaction={{ ...tx, type: 'transfer_in', counterparty: 'Okonkwo-Adeyemi Logistics' }}
      />
    )
    expect(screen.getByText('OA')).toBeInTheDocument()
    rerender(<TransactionRow transaction={tx} />)
    expect(screen.queryByText('OA')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('shows only the time, and no fee, inside a day group', () => {
    render(<TransactionRow transaction={{ ...tx, createdAt: '2026-01-01T10:05:00' }} timeOnly />)
    expect(screen.getByText('10:05')).toBeInTheDocument()
    expect(screen.queryByText(/Fee/)).toBeNull()
  })
})
