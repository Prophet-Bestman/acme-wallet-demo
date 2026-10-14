import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserMenu } from './UserMenu'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              firstName: 'Amara',
              lastName: 'Obi',
              email: 'amara@example.com',
              tier: 'verified',
              avatarUrl: null,
              wallets: [],
            },
          })
        )
      )
    )
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderMenu() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <UserMenu />
      <button type="button">Elsewhere</button>
    </QueryClientProvider>
  )
}

describe('UserMenu', () => {
  it('closes on a click outside', async () => {
    renderMenu()
    const trigger = await screen.findByRole('button', { name: 'Amara, account menu' })
    await userEvent.click(trigger)
    expect(screen.getByText('amara@example.com')).toBeInTheDocument()

    await userEvent.click(screen.getByText('amara@example.com')) // inside: stays open
    expect(screen.getByText('amara@example.com')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(screen.queryByText('amara@example.com')).toBeNull()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    renderMenu()
    const trigger = await screen.findByRole('button', { name: 'Amara, account menu' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByText('amara@example.com')).toBeNull()
    expect(trigger).toHaveFocus()
  })
})
