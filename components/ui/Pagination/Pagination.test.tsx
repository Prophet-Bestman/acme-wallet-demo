import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination, pageItems } from './Pagination'

describe('pageItems', () => {
  it.each([
    [1, 12, [1, 2, 3, 'gap', 12]],
    [3, 12, [1, 2, 3, 4, 'gap', 12]],
    [6, 12, [1, 'gap', 5, 6, 7, 'gap', 12]],
    [10, 12, [1, 'gap', 9, 10, 11, 12]],
    [12, 12, [1, 'gap', 10, 11, 12]],
    [2, 3, [1, 2, 3]],
    [1, 2, [1, 2]],
    [4, 5, [1, 2, 3, 4, 5]],
  ])('page %i of %i', (page, total, expected) => {
    expect(pageItems(page, total)).toEqual(expected)
  })
})

describe('Pagination', () => {
  const props = { totalPages: 12, total: 237, pageSize: 20, onPageChange: () => {} }

  it('shows the visible range', () => {
    render(<Pagination {...props} page={12} />)
    expect(screen.getByText('Showing 221–237 of 237')).toBeInTheDocument()
  })

  it('marks the current page and disables Previous on the first page', () => {
    render(<Pagination {...props} page={1} />)
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })

  it('navigates by number and by Next', async () => {
    const onPageChange = vi.fn()
    render(<Pagination {...props} page={1} onPageChange={onPageChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Page 12' }))
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange.mock.calls).toEqual([[12], [2]])
  })

  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination {...props} totalPages={1} page={1} />)
    expect(container).toBeEmptyDOMElement()
  })
})
