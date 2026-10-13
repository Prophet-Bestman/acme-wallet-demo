import { render, screen } from '@testing-library/react'
import { Money } from './Money'

describe('Money', () => {
  it('always shows two decimals', () => {
    render(
      <>
        <Money amount={4590} currency="USD" />
        <Money amount={85020} currency="GHS" />
        <Money amount={150000} currency="NGN" />
      </>
    )
    expect(screen.getByText('$45.90')).toBeInTheDocument()
    expect(screen.getByText('GH₵850.20')).toBeInTheDocument()
    expect(screen.getByText('₦1,500.00')).toBeInTheDocument()
  })

  it('prefixes credits and debits', () => {
    render(
      <>
        <Money amount={4599} currency="USD" sign="credit" />
        <Money amount={4599} currency="USD" sign="debit" />
      </>
    )
    expect(screen.getByText('+$45.99')).toBeInTheDocument()
    expect(screen.getByText('-$45.99')).toBeInTheDocument()
  })
})
