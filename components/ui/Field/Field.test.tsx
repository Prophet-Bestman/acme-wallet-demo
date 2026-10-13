import { render, screen } from '@testing-library/react'
import { Input } from '../Input'
import { Select } from '../Select'

describe('Field labelling', () => {
  it('gives Input an accessible name and description', () => {
    render(<Input label="Amount" hint="Balance: $10.00" />)
    const input = screen.getByLabelText('Amount')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAccessibleDescription('Balance: $10.00')
  })

  it('describes Input by its error instead of its hint', () => {
    render(<Input label="Amount" hint="Balance" error="Too small" />)
    expect(screen.getByLabelText('Amount')).toHaveAccessibleDescription('Too small')
  })

  it('gives Select an accessible name', () => {
    render(<Select label="Currency" options={[{ value: 'NGN', label: 'NGN' }]} />)
    expect(screen.getByLabelText('Currency').tagName).toBe('SELECT')
  })

  it('gives each field its own id', () => {
    render(
      <>
        <Input label="From" />
        <Input label="To" />
      </>
    )
    expect(screen.getByLabelText('From')).not.toBe(screen.getByLabelText('To'))
  })

  it('keeps an id passed by the caller', () => {
    render(<Input label="Search" id="search" />)
    expect(screen.getByLabelText('Search')).toHaveAttribute('id', 'search')
  })
})
