import { formatRate } from './rate'

describe('formatRate', () => {
  it.each([
    [1523.4567, '1,523.46'],
    [15.5513, '15.55'],
    [1, '1.00'],
    [0.000652314, '0.0006523'],
    [0.30000000000000004, '0.3'],
  ])('%s → %s', (rate, expected) => {
    expect(formatRate(rate)).toBe(expected)
  })
})
