import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Transaction } from '@/types/api'
import { TransactionDetails } from './TransactionDetails'

const tx: Transaction = {
  id: 'txn_1',
  reference: 'ACM-48213377',
  type: 'transfer_out',
  status: 'successful',
  currency: 'GHS',
  amount: 120000,
  fee: 1200,
  narration: 'Transfer to Kwame Mensah',
  counterparty: 'Kwame Mensah',
  createdAt: '2026-10-05T10:15:00',
}

describe('TransactionDetails', () => {
  it('shows the headline, signed amount and status', () => {
    render(<TransactionDetails transaction={tx} />)
    expect(screen.getByText('Transfer out to Kwame Mensah')).toBeInTheDocument()
    expect(screen.getByText('-GH₵1,200.00')).toBeInTheDocument()
    expect(screen.getByText('Successful')).toBeInTheDocument()
    expect(screen.getByText('KM')).toBeInTheDocument()
  })

  it('says "from" for credits and falls back to the type without a counterparty', () => {
    const { rerender } = render(
      <TransactionDetails transaction={{ ...tx, type: 'transfer_in', counterparty: 'Ada Okafor' }} />
    )
    expect(screen.getByText('Transfer in from Ada Okafor')).toBeInTheDocument()
    rerender(<TransactionDetails transaction={{ ...tx, type: 'card_payment', counterparty: null }} />)
    expect(screen.getAllByText('Card payment')).toHaveLength(2) // headline + Type row
  })

  it('totals the fee on top of the amount', () => {
    render(<TransactionDetails transaction={tx} />)
    expect(screen.getByText('GH₵12.00')).toBeInTheDocument()
    expect(screen.getByText('GH₵1,212.00')).toBeInTheDocument()
  })

  it('renders the narration as text', () => {
    render(<TransactionDetails transaction={{ ...tx, narration: '<img src=x onerror=alert(1)>' }} />)
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })

  it('copies the reference and confirms it', async () => {
    const user = userEvent.setup()
    render(<TransactionDetails transaction={tx} />)
    await user.click(screen.getByRole('button', { name: 'Copy reference' }))
    await expect(navigator.clipboard.readText()).resolves.toBe('ACM-48213377')
    expect(screen.getByRole('status')).toHaveTextContent('Reference copied')
  })
})
