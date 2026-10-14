import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Select } from './Select'

const OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
]

function Harness({ onValueChange = () => {} }: { onValueChange?: (value: string) => void }) {
  const [value, setValue] = useState('all')
  return (
    <Select
      label="Type"
      options={OPTIONS}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onValueChange(next)
      }}
    />
  )
}

describe('Select', () => {
  it('is a combobox named by its label and shows the current value', () => {
    render(<Harness />)
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveTextContent('All types')
  })

  it('opens a listbox with the selected option marked, and picks with the mouse', async () => {
    const onValueChange = vi.fn()
    render(<Harness onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Type' }))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'All types' })).toHaveAttribute('aria-selected', 'true')

    await userEvent.click(screen.getByRole('option', { name: 'Deposit' }))
    expect(onValueChange).toHaveBeenCalledWith('deposit')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveTextContent('Deposit')
  })

  it('works from the keyboard', async () => {
    const onValueChange = vi.fn()
    render(<Harness onValueChange={onValueChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('withdrawal')
  })

  it('closes on Escape without changing the value', async () => {
    const onValueChange = vi.fn()
    render(<Harness onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Type' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
