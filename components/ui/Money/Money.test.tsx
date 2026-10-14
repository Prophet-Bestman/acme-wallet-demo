import { render, screen } from '@testing-library/react'
import { Money, MoneyMaskProvider } from './Money'

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

  it('never signs zero, so a zero debit is not "-$0.00"', () => {
    render(
      <>
        <Money amount={0} currency="USD" sign="credit" />
        <Money amount={0} currency="NGN" sign="debit" />
      </>
    )
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(screen.getByText('₦0.00')).toBeInTheDocument()
  })

  it('shows amounts when no MoneyMaskProvider is present', () => {
    render(<Money amount={4599} currency="USD" />)
    expect(screen.getByText('$45.99')).toBeInTheDocument()
  })

  describe('inside a masking MoneyMaskProvider', () => {
    it('masks the amount but still says so to screen readers', () => {
      render(
        <MoneyMaskProvider masked>
          <Money amount={4599} currency="USD" sign="debit" />
        </MoneyMaskProvider>
      )
      expect(screen.queryByText(/45\.99/)).toBeNull()
      expect(screen.getByText('••••••')).toBeInTheDocument()
      expect(screen.getByText('Amount hidden')).toBeInTheDocument()
    })

    it('leaves non-sensitive figures visible', () => {
      render(
        <MoneyMaskProvider masked>
          <Money amount={4599} currency="USD" sensitive={false} />
        </MoneyMaskProvider>
      )
      expect(screen.getByText('$45.99')).toBeInTheDocument()
    })
  })
})
