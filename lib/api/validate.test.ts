import { ApiError } from './client'
import { parseTransaction, parseTransactionDetail, parseTransactionList } from './validate'

const valid = {
  id: 'txn_1',
  reference: 'ACM-1',
  type: 'deposit',
  status: 'successful',
  currency: 'NGN',
  amount: 150050,
  fee: 0,
  narration: 'Top-up',
  counterparty: null,
  createdAt: '2026-10-01T10:00:00.000Z',
}
const meta = { page: 1, limit: 20, total: 1, totalPages: 1 }

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseTransaction', () => {
  it('passes a valid transaction through unchanged', () => {
    expect(parseTransaction(valid)).toEqual(valid)
  })

  it.each([
    ['missing id', { ...valid, id: undefined }],
    ['empty id', { ...valid, id: '' }],
    ['string amount', { ...valid, amount: '1500.50' }],
    ['fractional amount', { ...valid, amount: 1500.5 }],
    ['negative amount', { ...valid, amount: -1 }],
    ['unknown currency', { ...valid, currency: 'EUR' }],
    ['not an object', 'txn_1'],
  ])('rejects %s', (_, raw) => {
    expect(parseTransaction(raw)).toBeNull()
  })

  it('keeps unknown type and status for the display layer to handle', () => {
    expect(parseTransaction({ ...valid, type: 'crypto_purchase', status: 'under_review' })).toMatchObject({
      type: 'crypto_purchase',
      status: 'under_review',
    })
  })

  it('defaults soft fields instead of failing', () => {
    expect(
      parseTransaction({
        ...valid,
        fee: 'n/a',
        narration: 42,
        counterparty: 7,
        reference: null,
        createdAt: undefined,
      })
    ).toMatchObject({ fee: 0, narration: '', counterparty: null, reference: '', createdAt: '' })
  })
})

describe('parseTransactionList', () => {
  it('drops and logs a malformed row but keeps the rest', () => {
    const result = parseTransactionList({ data: [valid, { ...valid, id: 'txn_2', amount: null }], meta })
    expect(result.data.map((tx) => tx.id)).toEqual(['txn_1'])
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('transactions.invalid_item'))
  })

  it.each([
    ['missing meta', undefined],
    ['missing totalPages', { ...meta, totalPages: undefined }],
    ['zero totalPages', { ...meta, totalPages: 0 }],
    ['string totalPages', { ...meta, totalPages: '3' }],
  ])('fails the response on %s', (_, badMeta) => {
    const parse = () => parseTransactionList({ data: [valid], meta: badMeta as never })
    expect(parse).toThrow(ApiError)
    expect(parse).toThrow(expect.objectContaining({ status: 502, code: 'INVALID_RESPONSE' }))
  })

  it('fails the response when data is not an array', () => {
    expect(() => parseTransactionList({ data: { rows: [] }, meta })).toThrow(ApiError)
  })

  it('defaults the non-critical meta fields', () => {
    expect(parseTransactionList({ data: [valid], meta: { totalPages: 1 } as never }).meta).toEqual({
      totalPages: 1,
      page: 1,
      limit: 1,
      total: 1,
    })
  })
})

describe('parseTransactionDetail', () => {
  it('fails a single transaction with a broken critical field', () => {
    expect(() => parseTransactionDetail({ data: { ...valid, currency: 'XYZ' } })).toThrow(ApiError)
  })
})
