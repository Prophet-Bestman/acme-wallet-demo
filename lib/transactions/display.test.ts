import { humanize, transactionStatusDisplay, transactionTypeDisplay } from './display'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('transactionTypeDisplay', () => {
  it('maps known types', () => {
    expect(transactionTypeDisplay('card_payment')).toEqual({
      label: 'Card payment',
      icon: 'card',
      direction: 'debit',
    })
    expect(transactionTypeDisplay('deposit').direction).toBe('credit')
  })

  it('falls back to a humanized, neutral display for a new backend type', () => {
    expect(transactionTypeDisplay('crypto_purchase')).toEqual({
      label: 'Crypto purchase',
      icon: 'wallet',
      direction: 'neutral',
    })
  })

  it('logs an unknown type once, not on every render', () => {
    transactionTypeDisplay('loan_repayment')
    transactionTypeDisplay('loan_repayment')
    const calls = vi
      .mocked(console.warn)
      .mock.calls.filter(([entry]) => String(entry).includes('loan_repayment'))
    expect(calls).toHaveLength(1)
    expect(String(calls[0][0])).toContain('transactions.unknown_type')
  })

  it('does not treat Object.prototype keys as known types', () => {
    expect(transactionTypeDisplay('constructor').direction).toBe('neutral')
  })

  it('labels an empty type generically', () => {
    expect(transactionTypeDisplay('').label).toBe('Transaction')
  })
})

describe('transactionStatusDisplay', () => {
  it.each([
    ['successful', 'Successful', 'success'],
    ['pending', 'Pending', 'warning'],
    ['failed', 'Failed', 'danger'],
  ])('maps %s', (raw, label, tone) => {
    expect(transactionStatusDisplay(raw)).toEqual({ label, tone })
  })

  it('falls back to neutral for a new backend status', () => {
    expect(transactionStatusDisplay('under_review')).toEqual({ label: 'Under review', tone: 'neutral' })
  })
})

describe('humanize', () => {
  it.each([
    ['card_payment', 'Card payment'],
    ['PARTIALLY-REFUNDED', 'Partially refunded'],
    ['  spaced__out  ', 'Spaced out'],
  ])('%s → %s', (raw, expected) => {
    expect(humanize(raw)).toBe(expected)
  })
})
