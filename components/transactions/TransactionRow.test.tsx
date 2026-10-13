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
})
