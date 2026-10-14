import type { Transaction } from '@/types/api'
import { groupByDay } from './group'

const tx = (id: string, createdAt: string) => ({ id, createdAt }) as Transaction
const now = new Date(2026, 9, 14, 12, 0)

describe('groupByDay', () => {
  it('labels today, yesterday and older days', () => {
    const groups = groupByDay(
      [
        tx('a', new Date(2026, 9, 14, 9).toISOString()),
        tx('b', new Date(2026, 9, 14, 1).toISOString()),
        tx('c', new Date(2026, 9, 13, 23).toISOString()),
        tx('d', new Date(2026, 9, 5, 10).toISOString()),
      ],
      now
    )
    expect(groups.map((g) => [g.label, g.rows.map((r) => r.id)])).toEqual([
      ['Today', ['a', 'b']],
      ['Yesterday', ['c']],
      ['Mon, 5 Oct 2026', ['d']],
    ])
  })

  it('groups by local day, not UTC', () => {
    // 00:30 local on the 14th is still "Today" even when UTC says the 13th.
    const groups = groupByDay([tx('a', new Date(2026, 9, 14, 0, 30).toISOString())], now)
    expect(groups[0].label).toBe('Today')
  })

  it('puts unparsable dates in their own group instead of crashing', () => {
    expect(groupByDay([tx('a', '')], now)[0].label).toBe('Date unknown')
  })

  it('returns no groups for no rows', () => {
    expect(groupByDay([], now)).toEqual([])
  })
})
