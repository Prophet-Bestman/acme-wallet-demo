import {
  DEFAULT_LIMIT,
  hasActiveFilters,
  isIsoDate,
  parseTransactionUrlState,
  serializeTransactionUrlState,
  toTransactionQuery,
} from './url-state'

const parse = (qs: string) => parseTransactionUrlState(new URLSearchParams(qs))

describe('parseTransactionUrlState', () => {
  it('defaults an empty URL', () => {
    expect(parse('')).toEqual({ page: 1, limit: DEFAULT_LIMIT, q: '' })
  })

  it('reads valid values', () => {
    expect(
      parse(
        'q=netflix&type=card_payment&status=failed&currency=USD&from=2026-01-01&to=2026-01-31&page=3&limit=50&tx=txn_255s'
      )
    ).toEqual({
      q: 'netflix',
      type: 'card_payment',
      status: 'failed',
      currency: 'USD',
      from: '2026-01-01',
      to: '2026-01-31',
      page: 3,
      limit: 50,
      tx: 'txn_255s',
    })
  })

  it('drops values outside the allowed lists', () => {
    const state = parse('type=refund&status=garbage&currency=EUR')
    expect(state.type).toBeUndefined()
    expect(state.status).toBeUndefined()
    expect(state.currency).toBeUndefined()
  })

  it.each(['0', '-3', '2.5', 'abc', ''])('falls back to page 1 for page=%s', (page) => {
    expect(parse(`page=${page}`).page).toBe(1)
  })

  it.each(['0', '101', 'abc'])('falls back to the default limit for limit=%s', (limit) => {
    expect(parse(`limit=${limit}`).limit).toBe(DEFAULT_LIMIT)
  })

  it('trims and caps the search', () => {
    expect(parse('q=%20%20net%20%20').q).toBe('net')
    expect(parse(`q=${'a'.repeat(500)}`).q).toHaveLength(100)
  })

  it('rejects malformed tx ids', () => {
    expect(parse('tx=<script>').tx).toBeUndefined()
  })
})

describe('isIsoDate', () => {
  it.each(['2026-01-31', '2024-02-29'])('accepts %s', (value) => {
    expect(isIsoDate(value)).toBe(true)
  })

  it.each(['2026-02-31', '2025-02-29', '2026-13-01', '2026-1-1', 'yesterday', null])(
    'rejects %s',
    (value) => {
      expect(isIsoDate(value)).toBe(false)
    }
  )
})

describe('serializeTransactionUrlState', () => {
  it('leaves out defaults', () => {
    expect(serializeTransactionUrlState(parse(''))).toBe('')
  })

  it('round-trips through parse', () => {
    const qs =
      'q=net&type=deposit&status=pending&currency=NGN&from=2026-01-01&to=2026-02-01&page=2&limit=50&tx=txn_1'
    expect(parse(serializeTransactionUrlState(parse(qs)))).toEqual(parse(qs))
  })

  it('keeps params it does not own and replaces the ones it does', () => {
    const qs = serializeTransactionUrlState(
      { ...parse(''), status: 'failed' },
      new URLSearchParams('__scenario=slow&status=pending&page=4')
    )
    expect(new URLSearchParams(qs).get('__scenario')).toBe('slow')
    expect(new URLSearchParams(qs).get('status')).toBe('failed')
    expect(new URLSearchParams(qs).has('page')).toBe(false)
  })
})

describe('toTransactionQuery', () => {
  it('sends a valid date range', () => {
    expect(toTransactionQuery(parse('from=2026-01-01&to=2026-01-31'))).toMatchObject({
      from: '2026-01-01',
      to: '2026-01-31',
    })
  })

  it('never sends an inverted date range', () => {
    const query = toTransactionQuery(parse('from=2026-02-01&to=2026-01-01'))
    expect(query.from).toBeUndefined()
    expect(query.to).toBeUndefined()
  })

  it('omits an empty search', () => {
    expect(toTransactionQuery(parse('')).q).toBeUndefined()
  })
})

describe('hasActiveFilters', () => {
  it('ignores page, limit and tx', () => {
    expect(hasActiveFilters(parse('page=3&limit=50&tx=txn_1'))).toBe(false)
    expect(hasActiveFilters(parse('currency=GHS'))).toBe(true)
  })
})
