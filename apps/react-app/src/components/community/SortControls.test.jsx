import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import SortControls from './SortControls'

describe('SortControls', () => {
  const mockOnSort = jest.fn()
  const mockOnTimeFilter = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders the sort button with default hot sort', () => {
      render(<SortControls onSort={mockOnSort} />)

      expect(screen.getByRole('button', { name: /sort posts/i })).toBeInTheDocument()
      expect(screen.getByText('Hot')).toBeInTheDocument()
    })

    it('renders with custom initial sort option', () => {
      render(<SortControls sortBy="new" onSort={mockOnSort} />)

      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('does not show sort menu by default', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      expect(sortButton).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText('Rising posts with high engagement')).not.toBeInTheDocument()
    })

    it('renders mobile sort indicator', () => {
      render(<SortControls sortBy="hot" onSort={mockOnSort} />)

      expect(screen.getByText('Sorted by hot')).toBeInTheDocument()
    })

    it('renders with compact styling when compact prop is true', () => {
      const { container } = render(<SortControls compact onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      expect(sortButton).toHaveClass('px-sm', 'py-xs', 'text-sm')
    })
  })

  describe('Sort Options Display', () => {
    it('displays all sort options when dropdown is opened', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      expect(screen.getByText('Hot')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Top')).toBeInTheDocument()
      expect(screen.getByText('Rising')).toBeInTheDocument()
      expect(screen.getByText('Controversial')).toBeInTheDocument()
    })

    it('displays sort option descriptions', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      expect(screen.getByText('Rising posts with high engagement')).toBeInTheDocument()
      expect(screen.getByText('Most recent posts')).toBeInTheDocument()
      expect(screen.getByText('Highest scoring posts')).toBeInTheDocument()
      expect(screen.getByText('Posts gaining momentum')).toBeInTheDocument()
      expect(screen.getByText('Posts with mixed reactions')).toBeInTheDocument()
    })

    it('renders SVG icons for each sort option', () => {
      const { container } = render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBeGreaterThan(5)
    })
  })

  describe('Sort Functionality', () => {
    it('calls onSort callback when hot is selected', () => {
      render(<SortControls sortBy="new" onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const hotOption = screen.getByText('Rising posts with high engagement').closest('button')
      fireEvent.click(hotOption)

      expect(mockOnSort).toHaveBeenCalledWith('hot')
      expect(mockOnSort).toHaveBeenCalledTimes(1)
    })

    it('calls onSort callback when new is selected', () => {
      render(<SortControls sortBy="hot" onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const newOption = screen.getByText('Most recent posts').closest('button')
      fireEvent.click(newOption)

      expect(mockOnSort).toHaveBeenCalledWith('new')
    })

    it('calls onSort callback when top is selected', () => {
      render(<SortControls sortBy="hot" onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const topOption = screen.getByText('Highest scoring posts').closest('button')
      fireEvent.click(topOption)

      expect(mockOnSort).toHaveBeenCalledWith('top')
    })

    it('calls onSort callback when controversial is selected', () => {
      render(<SortControls sortBy="hot" onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const controversialOption = screen.getByText('Posts with mixed reactions').closest('button')
      fireEvent.click(controversialOption)

      expect(mockOnSort).toHaveBeenCalledWith('controversial')
    })

    it('calls onSort callback when rising is selected', () => {
      render(<SortControls sortBy="hot" onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const risingOption = screen.getByText('Posts gaining momentum').closest('button')
      fireEvent.click(risingOption)

      expect(mockOnSort).toHaveBeenCalledWith('rising')
    })

    it('does not throw error when onSort is not provided', () => {
      render(<SortControls />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const newOption = screen.getByText('Most recent posts').closest('button')
      expect(() => fireEvent.click(newOption)).not.toThrow()
    })
  })

  describe('Active Sort Highlighting', () => {
    it('highlights the currently active sort option', () => {
      render(<SortControls sortBy="new" onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const newOption = screen.getByText('Most recent posts').closest('button')
      expect(newOption).toHaveClass('bg-accent/10', 'text-accent')
    })

    it('shows checkmark icon for active sort option', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const topOption = screen.getByText('Highest scoring posts').closest('button')
      const checkmarkSvg = topOption.querySelector('svg[width="12"][height="12"]')
      expect(checkmarkSvg).toBeInTheDocument()
    })

    it('does not highlight inactive sort options', () => {
      render(<SortControls sortBy="hot" onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const newOption = screen.getByText('Most recent posts').closest('button')
      expect(newOption).not.toHaveClass('bg-accent/10', 'text-accent')
    })

    it('updates mobile indicator with current sort', () => {
      render(<SortControls sortBy="controversial" onSort={mockOnSort} />)

      expect(screen.getByText('Sorted by controversial')).toBeInTheDocument()
    })
  })

  describe('Dropdown Behavior', () => {
    it('toggles sort menu visibility on button click', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })

      fireEvent.click(sortButton)
      expect(sortButton).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Rising posts with high engagement')).toBeInTheDocument()

      fireEvent.click(sortButton)
      expect(sortButton).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText('Rising posts with high engagement')).not.toBeInTheDocument()
    })

    it('closes sort menu after selecting an option', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const newOption = screen.getByText('Most recent posts').closest('button')
      fireEvent.click(newOption)

      expect(screen.queryByText('Most recent posts')).not.toBeInTheDocument()
    })

    it('closes sort menu when clicking outside overlay', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      const overlay = document.querySelector('.fixed.inset-0.z-40')
      fireEvent.click(overlay)

      expect(screen.queryByText('Rising posts with high engagement')).not.toBeInTheDocument()
    })

    it('rotates chevron icon when menu is open', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      const chevron = sortButton.querySelector('svg.text-muted')

      expect(chevron).not.toHaveClass('rotate-180')

      fireEvent.click(sortButton)
      expect(chevron).toHaveClass('rotate-180')
    })
  })

  describe('Time Range Filters', () => {
    it('shows time filter when sortBy is top', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      expect(screen.getByRole('button', { name: /time filter/i })).toBeInTheDocument()
    })

    it('shows time filter when sortBy is controversial', () => {
      render(<SortControls sortBy="controversial" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      expect(screen.getByRole('button', { name: /time filter/i })).toBeInTheDocument()
    })

    it('hides time filter when sortBy is hot', () => {
      render(<SortControls sortBy="hot" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      expect(screen.queryByRole('button', { name: /time filter/i })).not.toBeInTheDocument()
    })

    it('hides time filter when sortBy is new', () => {
      render(<SortControls sortBy="new" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      expect(screen.queryByRole('button', { name: /time filter/i })).not.toBeInTheDocument()
    })

    it('hides time filter when showTimeFilter is false', () => {
      render(<SortControls sortBy="top" showTimeFilter={false} onSort={mockOnSort} />)

      expect(screen.queryByRole('button', { name: /time filter/i })).not.toBeInTheDocument()
    })

    it('displays default time filter as Past 24 Hours', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      expect(screen.getByText('Past 24 Hours')).toBeInTheDocument()
    })

    it('displays custom initial time filter', () => {
      render(<SortControls sortBy="top" timeFilter="week" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      expect(screen.getByText('Past Week')).toBeInTheDocument()
    })
  })

  describe('Time Filter Dropdown', () => {
    it('displays all time filter options when opened', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      expect(screen.getByText('Past Hour')).toBeInTheDocument()
      expect(screen.getByText('Past 24 Hours')).toBeInTheDocument()
      expect(screen.getByText('Past Week')).toBeInTheDocument()
      expect(screen.getByText('Past Month')).toBeInTheDocument()
      expect(screen.getByText('Past Year')).toBeInTheDocument()
      expect(screen.getByText('All Time')).toBeInTheDocument()
    })

    it('calls onTimeFilter callback when hour is selected', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      const hourOption = screen.getByText('Past Hour').closest('button')
      fireEvent.click(hourOption)

      expect(mockOnTimeFilter).toHaveBeenCalledWith('hour')
    })

    it('calls onTimeFilter callback when week is selected', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      const weekOption = screen.getByText('Past Week').closest('button')
      fireEvent.click(weekOption)

      expect(mockOnTimeFilter).toHaveBeenCalledWith('week')
    })

    it('calls onTimeFilter callback when all time is selected', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      const allOption = screen.getByText('All Time').closest('button')
      fireEvent.click(allOption)

      expect(mockOnTimeFilter).toHaveBeenCalledWith('all')
    })

    it('highlights currently active time filter', () => {
      render(<SortControls sortBy="top" timeFilter="month" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      const monthOption = screen.getByText('Past Month').closest('button')
      expect(monthOption).toHaveClass('bg-accent/10', 'text-accent')
    })

    it('shows checkmark for active time filter', () => {
      render(<SortControls sortBy="top" timeFilter="year" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      const yearOption = screen.getByText('Past Year').closest('button')
      const checkmarkSvg = yearOption.querySelector('svg[width="12"][height="12"]')
      expect(checkmarkSvg).toBeInTheDocument()
    })

    it('closes time menu after selecting an option', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      const weekOption = screen.getByText('Past Week').closest('button')
      fireEvent.click(weekOption)

      expect(screen.queryByText('Past Hour')).not.toBeInTheDocument()
    })

    it('closes time menu when clicking outside overlay', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      const overlays = document.querySelectorAll('.fixed.inset-0.z-40')
      fireEvent.click(overlays[overlays.length - 1])

      expect(screen.queryByText('Past Hour')).not.toBeInTheDocument()
    })

    it('toggles time menu visibility on button click', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })

      fireEvent.click(timeButton)
      expect(timeButton).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Past Hour')).toBeInTheDocument()

      fireEvent.click(timeButton)
      expect(timeButton).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText('Past Hour')).not.toBeInTheDocument()
    })

    it('rotates chevron icon when time menu is open', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      const chevron = timeButton.querySelector('svg.text-muted')

      expect(chevron).not.toHaveClass('rotate-180')

      fireEvent.click(timeButton)
      expect(chevron).toHaveClass('rotate-180')
    })

    it('does not throw error when onTimeFilter is not provided', () => {
      render(<SortControls sortBy="top" />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      const weekOption = screen.getByText('Past Week').closest('button')
      expect(() => fireEvent.click(weekOption)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-label for sort button', () => {
      render(<SortControls onSort={mockOnSort} />)

      expect(screen.getByRole('button', { name: /sort posts/i })).toBeInTheDocument()
    })

    it('has proper aria-label for time filter button', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      expect(screen.getByRole('button', { name: /time filter/i })).toBeInTheDocument()
    })

    it('sets aria-expanded to true when sort menu is open', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      fireEvent.click(sortButton)

      expect(sortButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('sets aria-expanded to false when sort menu is closed', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      expect(sortButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('sets aria-expanded to true when time menu is open', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      fireEvent.click(timeButton)

      expect(timeButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('sets aria-expanded to false when time menu is closed', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const timeButton = screen.getByRole('button', { name: /time filter/i })
      expect(timeButton).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Edge Cases', () => {
    it('handles invalid sortBy prop gracefully', () => {
      render(<SortControls sortBy="invalid" onSort={mockOnSort} />)

      expect(screen.getByText('Hot')).toBeInTheDocument()
    })

    it('handles invalid timeFilter prop gracefully', () => {
      render(<SortControls sortBy="top" timeFilter="invalid" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      expect(screen.getByText('Past 24 Hours')).toBeInTheDocument()
    })

    it('renders correctly with all props omitted', () => {
      render(<SortControls />)

      expect(screen.getByRole('button', { name: /sort posts/i })).toBeInTheDocument()
      expect(screen.getByText('Hot')).toBeInTheDocument()
    })

    it('handles rapid menu toggling', () => {
      render(<SortControls onSort={mockOnSort} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })

      fireEvent.click(sortButton)
      fireEvent.click(sortButton)
      fireEvent.click(sortButton)

      expect(sortButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('handles both menus being open simultaneously', () => {
      render(<SortControls sortBy="top" onSort={mockOnSort} onTimeFilter={mockOnTimeFilter} />)

      const sortButton = screen.getByRole('button', { name: /sort posts/i })
      const timeButton = screen.getByRole('button', { name: /time filter/i })

      fireEvent.click(sortButton)
      fireEvent.click(timeButton)

      expect(screen.getByText('Rising posts with high engagement')).toBeInTheDocument()
      expect(screen.getByText('Past Hour')).toBeInTheDocument()
    })
  })
})

export default mockOnSort
