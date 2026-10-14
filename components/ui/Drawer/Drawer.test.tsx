import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Drawer } from './Drawer'

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Drawer
        open={open}
        title="Transaction details"
        onClose={() => {
          onClose()
          setOpen(false)
        }}
      >
        <button type="button">Inside</button>
      </Drawer>
    </>
  )
}

describe('Drawer', () => {
  it('is a labelled modal dialog', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByText('Open'))
    const dialog = screen.getByRole('dialog', { name: 'Transaction details' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()
  })

  it('does not close when clicking inside the panel', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByText('Open'))
    await userEvent.click(screen.getByText('Inside'))
    await userEvent.click(screen.getByRole('heading', { name: 'Transaction details' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes from the close button, Escape and the backdrop', async () => {
    render(<Harness />)
    const open = screen.getByText('Open')

    await userEvent.click(open)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(open)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(open)
    await userEvent.click(screen.getByRole('dialog').parentElement!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('traps Tab inside, locks body scroll, and restores both on close', async () => {
    render(<Harness />)
    const open = screen.getByText('Open')
    await userEvent.click(open)
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByText('Inside')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByText('Inside')).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    expect(document.body.style.overflow).toBe('')
    expect(open).toHaveFocus()
  })
})
