import { act, render, renderHook, screen } from '@testing-library/react'
import { setBalancesHidden, useBalancesHidden } from './useBalancesHidden'

afterEach(() => act(() => setBalancesHidden(false)))

describe('useBalancesHidden', () => {
  it('is visible by default', () => {
    expect(renderHook(() => useBalancesHidden()).result.current).toBe(false)
  })

  it('persists the choice in localStorage', () => {
    act(() => setBalancesHidden(true))
    expect(window.localStorage.getItem('acme.hideBalances')).toBe('1')
    act(() => setBalancesHidden(false))
    expect(window.localStorage.getItem('acme.hideBalances')).toBeNull()
  })

  it('restores the choice on a fresh mount (refresh / page change)', () => {
    window.localStorage.setItem('acme.hideBalances', '1')
    expect(renderHook(() => useBalancesHidden()).result.current).toBe(true)
  })

  it('updates every subscriber at once', () => {
    function Probe({ name }: { name: string }) {
      return <p>{`${name}: ${useBalancesHidden() ? 'hidden' : 'shown'}`}</p>
    }
    render(
      <>
        <Probe name="a" />
        <Probe name="b" />
      </>
    )
    act(() => setBalancesHidden(true))
    expect(screen.getByText('a: hidden')).toBeInTheDocument()
    expect(screen.getByText('b: hidden')).toBeInTheDocument()
  })

  it('follows a change made in another tab', () => {
    const { result } = renderHook(() => useBalancesHidden())
    act(() => {
      window.localStorage.setItem('acme.hideBalances', '1')
      window.dispatchEvent(new StorageEvent('storage', { key: 'acme.hideBalances' }))
    })
    expect(result.current).toBe(true)
  })
})
