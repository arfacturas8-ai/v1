import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Awards from './Awards'

describe('Awards Component', () => {
  describe('Basic Rendering', () => {
    it('should render null when awards array is empty', () => {
      const { container } = render(<Awards awards={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render null when awards is undefined', () => {
      const { container } = render(<Awards />)
      expect(container.firstChild).toBeNull()
    })

    it('should render null when awards is null', () => {
      const { container } = render(<Awards awards={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render awards container when awards exist', () => {
      const awards = [{ type: 'gold', id: 1 }]
      const { container } = render(<Awards awards={awards} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render with proper container classes', () => {
      const awards = [{ type: 'gold', id: 1 }]
      const { container } = render(<Awards awards={awards} />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('flex', 'items-center', 'gap-1', 'flex-wrap')
    })
  })

  describe('Award Icons', () => {
    it('should render gold award icon', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('🥇')).toBeInTheDocument()
    })

    it('should render silver award icon', () => {
      const awards = [{ type: 'silver', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('🥈')).toBeInTheDocument()
    })

    it('should render platinum award icon', () => {
      const awards = [{ type: 'platinum', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('💎')).toBeInTheDocument()
    })

    it('should render helpful award icon', () => {
      const awards = [{ type: 'helpful', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('💙')).toBeInTheDocument()
    })

    it('should render wholesome award icon', () => {
      const awards = [{ type: 'wholesome', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('🤍')).toBeInTheDocument()
    })

    it('should render rocket award icon', () => {
      const awards = [{ type: 'rocket', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('🚀')).toBeInTheDocument()
    })

    it('should render fire award icon', () => {
      const awards = [{ type: 'fire', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    it('should render mind_blown award icon', () => {
      const awards = [{ type: 'mind_blown', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('🤯')).toBeInTheDocument()
    })

    it('should render laughing award icon', () => {
      const awards = [{ type: 'laughing', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('😆')).toBeInTheDocument()
    })

    it('should render crying award icon', () => {
      const awards = [{ type: 'crying', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('😢')).toBeInTheDocument()
    })

    it('should render star award icon', () => {
      const awards = [{ type: 'star', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('⭐')).toBeInTheDocument()
    })

    it('should render heart award icon', () => {
      const awards = [{ type: 'heart', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('❤️')).toBeInTheDocument()
    })

    it('should render thumbs_up award icon', () => {
      const awards = [{ type: 'thumbs_up', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('👍')).toBeInTheDocument()
    })

    it('should render clap award icon', () => {
      const awards = [{ type: 'clap', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('👏')).toBeInTheDocument()
    })

    it('should render brain award icon', () => {
      const awards = [{ type: 'brain', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('🧠')).toBeInTheDocument()
    })

    it('should render default icon for unknown award type', () => {
      const awards = [{ type: 'unknown', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('✨')).toBeInTheDocument()
    })
  })

  describe('Award Counts', () => {
    it('should not display count when single award', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} />)
      const awardElement = screen.getByTitle('1 Gold Award')
      expect(within(awardElement).queryByText('1')).not.toBeInTheDocument()
    })

    it('should display count when multiple awards of same type', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'gold', id: 2 }
      ]
      render(<Awards awards={awards} />)
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should group awards correctly and show correct count', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'gold', id: 2 },
        { type: 'gold', id: 3 }
      ]
      render(<Awards awards={awards} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should display separate counts for different award types', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'gold', id: 2 },
        { type: 'silver', id: 3 },
        { type: 'silver', id: 4 },
        { type: 'silver', id: 5 }
      ]
      render(<Awards awards={awards} />)
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Award Tooltips', () => {
    it('should display tooltip for single award', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 Gold Award')).toBeInTheDocument()
    })

    it('should display plural tooltip for multiple awards', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'gold', id: 2 }
      ]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('2 Gold Awards')).toBeInTheDocument()
    })

    it('should display correct tooltip for silver award', () => {
      const awards = [{ type: 'silver', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 Silver Award')).toBeInTheDocument()
    })

    it('should display correct tooltip for platinum award', () => {
      const awards = [{ type: 'platinum', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 Platinum Award')).toBeInTheDocument()
    })

    it('should display correct tooltip for helpful award', () => {
      const awards = [{ type: 'helpful', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 Helpful Award')).toBeInTheDocument()
    })

    it('should display correct tooltip for wholesome award', () => {
      const awards = [{ type: 'wholesome', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 Wholesome Award')).toBeInTheDocument()
    })

    it('should display correct tooltip for rocket award', () => {
      const awards = [{ type: 'rocket', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 Rocket Like')).toBeInTheDocument()
    })

    it('should display correct tooltip for fire award', () => {
      const awards = [{ type: 'fire', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 Fire Award')).toBeInTheDocument()
    })

    it('should display correct tooltip for mind_blown award', () => {
      const awards = [{ type: 'mind_blown', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 Mind Blown')).toBeInTheDocument()
    })

    it('should display generic tooltip for unknown award type', () => {
      const awards = [{ type: 'unknown', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 Award')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('should apply small size classes when size is sm', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} size="sm" />)
      const icon = screen.getByText('🥇')
      expect(icon).toHaveClass('w-3.5', 'h-3.5')
    })

    it('should apply medium size classes when size is md', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} size="md" />)
      const icon = screen.getByText('🥇')
      expect(icon).toHaveClass('w-4', 'h-4')
    })

    it('should apply large size classes when size is lg', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} size="lg" />)
      const icon = screen.getByText('🥇')
      expect(icon).toHaveClass('w-5', 'h-5')
    })

    it('should default to md size when no size prop provided', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} />)
      const icon = screen.getByText('🥇')
      expect(icon).toHaveClass('w-4', 'h-4')
    })

    it('should apply correct text size for count in small size', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'gold', id: 2 }
      ]
      render(<Awards awards={awards} size="sm" />)
      const count = screen.getByText('2')
      expect(count).toHaveClass('text-xs')
    })

    it('should apply correct text size for count in large size', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'gold', id: 2 }
      ]
      render(<Awards awards={awards} size="lg" />)
      const count = screen.getByText('2')
      expect(count).toHaveClass('text-sm')
    })
  })

  describe('Max Visible Awards', () => {
    it('should display all awards when count is less than maxVisible', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 }
      ]
      render(<Awards awards={awards} maxVisible={5} />)
      expect(screen.getByText('🥇')).toBeInTheDocument()
      expect(screen.getByText('🥈')).toBeInTheDocument()
      expect(screen.getByText('💎')).toBeInTheDocument()
    })

    it('should show hidden count indicator when awards exceed maxVisible', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 },
        { type: 'helpful', id: 4 },
        { type: 'wholesome', id: 5 },
        { type: 'rocket', id: 6 }
      ]
      render(<Awards awards={awards} maxVisible={3} />)
      expect(screen.getByTitle('3 more awards')).toBeInTheDocument()
    })

    it('should display correct hidden count number', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 },
        { type: 'helpful', id: 4 },
        { type: 'wholesome', id: 5 },
        { type: 'rocket', id: 6 },
        { type: 'fire', id: 7 }
      ]
      render(<Awards awards={awards} maxVisible={2} />)
      const hiddenIndicator = screen.getByTitle('5 more awards')
      expect(within(hiddenIndicator).getByText('5')).toBeInTheDocument()
    })

    it('should not show hidden count when awards equal maxVisible', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 }
      ]
      render(<Awards awards={awards} maxVisible={3} />)
      expect(screen.queryByTitle(/more award/)).not.toBeInTheDocument()
    })

    it('should default to maxVisible of 5', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 },
        { type: 'helpful', id: 4 },
        { type: 'wholesome', id: 5 },
        { type: 'rocket', id: 6 }
      ]
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('1 more award')).toBeInTheDocument()
    })

    it('should show singular form in tooltip when one hidden award', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 },
        { type: 'helpful', id: 4 }
      ]
      render(<Awards awards={awards} maxVisible={3} />)
      expect(screen.getByTitle('1 more award')).toBeInTheDocument()
    })
  })

  describe('Award Styling', () => {
    it('should apply proper award container styling', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} />)
      const awardElement = screen.getByTitle('1 Gold Award')
      expect(awardElement).toHaveClass(
        'group',
        'flex',
        'items-center',
        'gap-1',
        'px-2',
        'py-1',
        'rounded-md'
      )
    })

    it('should apply transition classes to award element', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} />)
      const awardElement = screen.getByTitle('1 Gold Award')
      expect(awardElement).toHaveClass('transition-all', 'duration-200')
    })

    it('should apply cursor pointer to award element', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} />)
      const awardElement = screen.getByTitle('1 Gold Award')
      expect(awardElement).toHaveClass('cursor-pointer')
    })

    it('should apply transition classes to icon', () => {
      const awards = [{ type: 'gold', id: 1 }]
      render(<Awards awards={awards} />)
      const icon = screen.getByText('🥇')
      expect(icon).toHaveClass('transition-transform', 'duration-200')
    })

    it('should apply transition classes to count', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'gold', id: 2 }
      ]
      render(<Awards awards={awards} />)
      const count = screen.getByText('2')
      expect(count).toHaveClass('transition-colors')
    })

    it('should apply proper styling to hidden count indicator', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 },
        { type: 'helpful', id: 4 },
        { type: 'wholesome', id: 5 },
        { type: 'rocket', id: 6 }
      ]
      render(<Awards awards={awards} maxVisible={3} />)
      const hiddenIndicator = screen.getByTitle('3 more awards')
      expect(hiddenIndicator).toHaveClass(
        'flex',
        'items-center',
        'gap-1',
        'px-2',
        'py-1',
        'rounded-md',
        'cursor-pointer'
      )
    })

    it('should render plus icon in hidden count indicator', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 },
        { type: 'helpful', id: 4 }
      ]
      render(<Awards awards={awards} maxVisible={2} />)
      const hiddenIndicator = screen.getByTitle('2 more awards')
      const svg = within(hiddenIndicator).getByRole('img', { hidden: true })
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Multiple Awards Interaction', () => {
    it('should render multiple different award types', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 },
        { type: 'helpful', id: 4 }
      ]
      render(<Awards awards={awards} />)
      expect(screen.getByText('🥇')).toBeInTheDocument()
      expect(screen.getByText('🥈')).toBeInTheDocument()
      expect(screen.getByText('💎')).toBeInTheDocument()
      expect(screen.getByText('💙')).toBeInTheDocument()
    })

    it('should group multiple awards of same type correctly', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'gold', id: 3 },
        { type: 'silver', id: 4 }
      ]
      render(<Awards awards={awards} />)
      expect(screen.getAllByText('2')).toHaveLength(2)
    })

    it('should render correct number of award containers', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'platinum', id: 3 }
      ]
      const { container } = render(<Awards awards={awards} />)
      const awardContainers = container.querySelectorAll('[title*="Award"]')
      expect(awardContainers).toHaveLength(3)
    })

    it('should handle large number of awards correctly', () => {
      const awards = Array.from({ length: 20 }, (_, i) => ({
        type: ['gold', 'silver', 'platinum', 'helpful', 'wholesome'][i % 5],
        id: i
      }))
      render(<Awards awards={awards} />)
      expect(screen.getByTitle('15 more awards')).toBeInTheDocument()
    })

    it('should maintain award order based on first occurrence', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 },
        { type: 'gold', id: 3 },
        { type: 'platinum', id: 4 }
      ]
      const { container } = render(<Awards awards={awards} />)
      const awardElements = container.querySelectorAll('[title*="Award"]')
      expect(awardElements[0]).toHaveAttribute('title', expect.stringContaining('Gold'))
      expect(awardElements[1]).toHaveAttribute('title', expect.stringContaining('Silver'))
      expect(awardElements[2]).toHaveAttribute('title', expect.stringContaining('Platinum'))
    })
  })

  describe('Edge Cases', () => {
    it('should handle awards with additional properties', () => {
      const awards = [
        { type: 'gold', id: 1, user: 'John', timestamp: '2024-01-01' }
      ]
      render(<Awards awards={awards} />)
      expect(screen.getByText('🥇')).toBeInTheDocument()
    })

    it('should handle maxVisible of 1', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 }
      ]
      render(<Awards awards={awards} maxVisible={1} />)
      expect(screen.getByTitle('1 more award')).toBeInTheDocument()
    })

    it('should handle maxVisible of 0 gracefully', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 }
      ]
      render(<Awards awards={awards} maxVisible={0} />)
      expect(screen.getByTitle('2 more awards')).toBeInTheDocument()
    })

    it('should handle very large maxVisible value', () => {
      const awards = [
        { type: 'gold', id: 1 },
        { type: 'silver', id: 2 }
      ]
      render(<Awards awards={awards} maxVisible={100} />)
      expect(screen.queryByTitle(/more award/)).not.toBeInTheDocument()
    })

    it('should handle award type with special characters', () => {
      const awards = [{ type: 'test-award_type', id: 1 }]
      render(<Awards awards={awards} />)
      expect(screen.getByText('✨')).toBeInTheDocument()
    })

    it('should handle single award type with very high count', () => {
      const awards = Array.from({ length: 100 }, (_, i) => ({
        type: 'gold',
        id: i
      }))
      render(<Awards awards={awards} />)
      expect(screen.getByText('100')).toBeInTheDocument()
    })
  })
})

export default awards
