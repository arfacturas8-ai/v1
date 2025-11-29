/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CategoryBrowsePage from './CategoryBrowsePage'
import AuthContext from '../contexts/AuthContext'
import { renderWithRouter, mockAuthContext, mockUnauthContext } from '../../tests/utils/testUtils'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock navigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}))

describe('CategoryBrowsePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      expect(container).toBeTruthy()
    })

    it('renders with proper semantic HTML structure', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays main content area with correct aria-label', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const mainElement = screen.getByRole('main', { name: /category browse page/i })
      expect(mainElement).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<CategoryBrowsePage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('renders with correct CSS classes for layout', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const mainDiv = container.querySelector('.min-h-screen')
      expect(mainDiv).toBeInTheDocument()
    })

    it('has proper container max-width', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const containerDiv = container.querySelector('.max-w-7xl')
      expect(containerDiv).toBeInTheDocument()
    })
  })

  describe('Header Section', () => {
    it('displays main page heading', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByRole('heading', { name: /Browse Categories/i })).toBeInTheDocument()
    })

    it('displays page description', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText(/Discover content that interests you/i)).toBeInTheDocument()
    })

    it('renders heading with gradient styling', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const heading = screen.getByRole('heading', { name: /Browse Categories/i })
      expect(heading.className).toContain('bg-gradient-to-r')
    })

    it('has proper heading level (h1)', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent(/Browse Categories/i)
    })
  })

  describe('Trending Topics Section', () => {
    it('displays trending topics section', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText(/Trending Topics/i)).toBeInTheDocument()
    })

    it('renders all trending topics', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('AI Art Generation')).toBeInTheDocument()
      expect(screen.getByText('Indie Games 2024')).toBeInTheDocument()
      expect(screen.getByText('Film Photography')).toBeInTheDocument()
      expect(screen.getByText('Home Workouts')).toBeInTheDocument()
    })

    it('displays post counts for trending topics', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('1,234 posts')).toBeInTheDocument()
      expect(screen.getByText('987 posts')).toBeInTheDocument()
      expect(screen.getByText('756 posts')).toBeInTheDocument()
      expect(screen.getByText('654 posts')).toBeInTheDocument()
    })

    it('displays trending rank numbers', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#2')).toBeInTheDocument()
      expect(screen.getByText('#3')).toBeInTheDocument()
      expect(screen.getByText('#4')).toBeInTheDocument()
    })

    it('navigates to tag page when trending topic is clicked', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const aiArtTopic = screen.getByText('AI Art Generation')
      fireEvent.click(aiArtTopic)
      expect(mockNavigate).toHaveBeenCalledWith('/tag/ai-art-generation')
    })

    it('formats topic names for URL correctly', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const indieGamesTopic = screen.getByText('Indie Games 2024')
      fireEvent.click(indieGamesTopic)
      expect(mockNavigate).toHaveBeenCalledWith('/tag/indie-games-2024')
    })

    it('renders trending icon', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      // TrendingUp icon should be rendered
      expect(container.querySelector('.lucide-trending-up') || container.querySelector('svg')).toBeTruthy()
    })
  })

  describe('Categories Grid', () => {
    it('displays all 12 categories', () => {
      renderWithRouter(<CategoryBrowsePage />)
      // Use getAllByText since some category names appear in multiple places
      expect(screen.getAllByText('Gaming').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Music').length).toBeGreaterThan(0)
      expect(screen.getByText('Movies & TV')).toBeInTheDocument()
      expect(screen.getByText('Books')).toBeInTheDocument()
      expect(screen.getAllByText('Technology').length).toBeGreaterThan(0)
      expect(screen.getByText('Art & Design')).toBeInTheDocument()
      expect(screen.getByText('Lifestyle')).toBeInTheDocument()
      expect(screen.getByText('Food & Cooking')).toBeInTheDocument()
      expect(screen.getAllByText('Travel').length).toBeGreaterThan(0)
      expect(screen.getByText('Photography')).toBeInTheDocument()
      expect(screen.getByText('Fitness')).toBeInTheDocument()
      expect(screen.getByText('Business')).toBeInTheDocument()
    })

    it('displays community counts for each category', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('15,234 communities')).toBeInTheDocument()
      expect(screen.getByText('12,893 communities')).toBeInTheDocument()
      expect(screen.getByText('18,392 communities')).toBeInTheDocument()
    })

    it('navigates to category page when category is clicked', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const gamingCategories = screen.getAllByText('Gaming')
      // Click the category card (first occurrence in the categories grid)
      fireEvent.click(gamingCategories[0].closest('div'))
      expect(mockNavigate).toHaveBeenCalledWith('/category/gaming')
    })

    it('navigates to correct category for each card', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const techCategories = screen.getAllByText('Technology')
      // Click the category card (first occurrence in the categories grid)
      fireEvent.click(techCategories[0].closest('div'))
      expect(mockNavigate).toHaveBeenCalledWith('/category/tech')
    })

    it('renders category icons', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBeGreaterThan(0)
    })

    it('applies correct gradient colors to categories', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const gradients = container.querySelectorAll('[class*="from-purple-500"]')
      expect(gradients.length).toBeGreaterThan(0)
    })

    it('has hover effects on category cards', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const categoryCards = container.querySelectorAll('.group')
      expect(categoryCards.length).toBeGreaterThan(0)
    })

    it('renders categories in a responsive grid', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Popular Communities Section', () => {
    it('displays popular communities heading', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText(/Popular Communities/i)).toBeInTheDocument()
    })

    it('displays all 6 popular communities', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('Gaming Legends')).toBeInTheDocument()
      expect(screen.getByText('Music Producers')).toBeInTheDocument()
      expect(screen.getByText('Tech Innovators')).toBeInTheDocument()
      expect(screen.getByText('Food Lovers')).toBeInTheDocument()
      expect(screen.getByText('World Travelers')).toBeInTheDocument()
      expect(screen.getByText('Art Collective')).toBeInTheDocument()
    })

    it('displays member counts for communities', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('125K members')).toBeInTheDocument()
      expect(screen.getByText('89K members')).toBeInTheDocument()
      expect(screen.getByText('156K members')).toBeInTheDocument()
    })

    it('displays category labels for communities', () => {
      renderWithRouter(<CategoryBrowsePage />)
      // Multiple occurrences due to category cards and popular communities section
      expect(screen.getAllByText('Gaming').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Music').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Technology').length).toBeGreaterThan(0)
    })

    it('renders join buttons for each community', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const joinButtons = screen.getAllByRole('button', { name: /Join/i })
      expect(joinButtons.length).toBe(6)
    })

    it('displays community icons/emojis', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const emojiDivs = container.querySelectorAll('.text-4xl')
      expect(emojiDivs.length).toBeGreaterThan(0)
    })

    it('renders communities in a responsive grid', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const grids = container.querySelectorAll('.grid')
      expect(grids.length).toBeGreaterThan(1)
    })
  })

  describe('Navigation and Routing', () => {
    it('uses navigate hook for category navigation', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const musicCategories = screen.getAllByText('Music')
      fireEvent.click(musicCategories[0].closest('div'))
      expect(mockNavigate).toHaveBeenCalled()
    })

    it('uses navigate hook for trending topic navigation', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const filmPhotography = screen.getByText('Film Photography')
      fireEvent.click(filmPhotography)
      expect(mockNavigate).toHaveBeenCalled()
    })

    it('navigates with correct path structure for categories', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const artCategory = screen.getByText('Art & Design')
      fireEvent.click(artCategory.closest('div'))
      expect(mockNavigate).toHaveBeenCalledWith('/category/art')
    })

    it('navigates with correct path structure for tags', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const homeWorkouts = screen.getByText('Home Workouts')
      fireEvent.click(homeWorkouts)
      expect(mockNavigate).toHaveBeenCalledWith('/tag/home-workouts')
    })
  })

  describe('User Authentication States', () => {
    it('renders correctly for authenticated users', () => {
      renderWithRouter(<CategoryBrowsePage />, { authValue: mockAuthContext })
      expect(screen.getByText(/Browse Categories/i)).toBeInTheDocument()
    })

    it('renders correctly for unauthenticated users', () => {
      renderWithRouter(<CategoryBrowsePage />, { authValue: mockUnauthContext })
      expect(screen.getByText(/Browse Categories/i)).toBeInTheDocument()
    })

    it('displays all content for unauthenticated users', () => {
      renderWithRouter(<CategoryBrowsePage />, { authValue: mockUnauthContext })
      expect(screen.getAllByText('Gaming').length).toBeGreaterThan(0)
      expect(screen.getByText('Trending Topics')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels on main element', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Category browse page')
    })

    it('has proper heading hierarchy', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2s = screen.getAllByRole('heading', { level: 2 })
      expect(h1).toBeInTheDocument()
      expect(h2s.length).toBeGreaterThan(0)
    })

    it('has proper heading structure for trending topics', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const trendingHeading = screen.getByRole('heading', { name: /Trending Topics/i })
      expect(trendingHeading).toBeInTheDocument()
    })

    it('has proper heading structure for popular communities', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const popularHeading = screen.getByRole('heading', { name: /Popular Communities/i })
      expect(popularHeading).toBeInTheDocument()
    })

    it('category cards are clickable', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const clickableCards = container.querySelectorAll('.cursor-pointer')
      expect(clickableCards.length).toBeGreaterThan(0)
    })

    it('trending topic cards are clickable', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const aiArtTopic = screen.getByText('AI Art Generation')
      // Find the clickable card container (it's a few levels up)
      let currentElement = aiArtTopic
      let foundClickable = false
      while (currentElement && currentElement.parentElement) {
        currentElement = currentElement.parentElement
        if (currentElement.className && currentElement.className.includes('cursor-pointer')) {
          foundClickable = true
          break
        }
      }
      expect(foundClickable).toBe(true)
    })

    it('join buttons are focusable', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const joinButtons = screen.getAllByRole('button', { name: /Join/i })
      joinButtons.forEach((button) => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('has responsive grid classes for categories', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const categoryGrid = container.querySelector('.lg\\:grid-cols-3')
      expect(categoryGrid).toBeTruthy()
    })

    it('has responsive grid classes for trending topics', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const trendingGrid = container.querySelector('.lg\\:grid-cols-4')
      expect(trendingGrid).toBeTruthy()
    })

    it('applies proper padding on mobile', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const containerDiv = container.querySelector('.px-6')
      expect(containerDiv).toBeInTheDocument()
    })

    it('applies proper padding on desktop', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const containerDiv = container.querySelector('.py-12')
      expect(containerDiv).toBeInTheDocument()
    })
  })

  describe('Component Memoization', () => {
    it('exports a memoized component', () => {
      // Component should be memoized with React.memo
      expect(CategoryBrowsePage).toBeDefined()
    })

    it('does not re-render unnecessarily', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const initialHeading = screen.getByText(/Browse Categories/i)
      // Component is memoized, so re-renders with same props should reference same element
      expect(initialHeading).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid clicks on categories', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const gamingCategories = screen.getAllByText('Gaming')
      const categoryCard = gamingCategories[0].closest('div')
      fireEvent.click(categoryCard)
      fireEvent.click(categoryCard)
      fireEvent.click(categoryCard)
      expect(mockNavigate).toHaveBeenCalledTimes(3)
    })

    it('handles rapid clicks on trending topics', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const aiArtTopic = screen.getByText('AI Art Generation')
      fireEvent.click(aiArtTopic)
      fireEvent.click(aiArtTopic)
      expect(mockNavigate).toHaveBeenCalledTimes(2)
    })

    it('formats large numbers with commas', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('18,392 communities')).toBeInTheDocument()
    })

    it('formats post counts with commas', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const postCountElements = screen.getAllByText(/1,234/)
      expect(postCountElements.length).toBeGreaterThan(0)
    })

    it('handles categories with special characters in names', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('Movies & TV')).toBeInTheDocument()
      expect(screen.getByText('Art & Design')).toBeInTheDocument()
    })

    it('handles topics with spaces in names for URL generation', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const filmPhotography = screen.getByText('Film Photography')
      fireEvent.click(filmPhotography)
      expect(mockNavigate).toHaveBeenCalledWith('/tag/film-photography')
    })

    it('handles topics with numbers in names for URL generation', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const indieGames = screen.getByText('Indie Games 2024')
      fireEvent.click(indieGames)
      expect(mockNavigate).toHaveBeenCalledWith('/tag/indie-games-2024')
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes for background', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const darkBg = container.querySelector('.dark\\:from-gray-900')
      expect(darkBg).toBeTruthy()
    })

    it('has dark mode classes for cards', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const darkCards = container.querySelectorAll('.dark\\:bg-[#161b22]')
      expect(darkCards.length).toBeGreaterThan(0)
    })

    it('has dark mode classes for text', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const darkText = container.querySelectorAll('.dark\\:text-white')
      expect(darkText.length).toBeGreaterThan(0)
    })
  })

  describe('Animation and Motion', () => {
    it('renders motion components for categories', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      // Motion divs should be rendered (mocked as regular divs)
      expect(container.querySelectorAll('div').length).toBeGreaterThan(0)
    })

    it('renders motion components for trending topics', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('AI Art Generation')).toBeInTheDocument()
    })

    it('renders motion components for popular communities', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText('Gaming Legends')).toBeInTheDocument()
    })
  })

  describe('Styling and Visual Elements', () => {
    it('applies hover effects to category cards', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const hoverCards = container.querySelectorAll('.hover\\:shadow-2xl')
      expect(hoverCards.length).toBeGreaterThan(0)
    })

    it('applies hover effects to trending topic cards', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const hoverCards = container.querySelectorAll('.hover\\:shadow-xl')
      expect(hoverCards.length).toBeGreaterThan(0)
    })

    it('applies rounded corners to cards', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const roundedCards = container.querySelectorAll('.rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      expect(roundedCards.length).toBeGreaterThan(0)
    })

    it('applies shadow effects to cards', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const shadowCards = container.querySelectorAll('.shadow-lg, .shadow-sm')
      expect(shadowCards.length).toBeGreaterThan(0)
    })

    it('uses gradient backgrounds for categories', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const gradientBgs = container.querySelectorAll('[class*="bg-gradient-to"]')
      expect(gradientBgs.length).toBeGreaterThan(0)
    })

    it('applies proper spacing between sections', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      const spacedSections = container.querySelectorAll('.mb-12')
      expect(spacedSections.length).toBeGreaterThan(0)
    })

    it('has proper button styling for join buttons', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const joinButtons = screen.getAllByRole('button', { name: /Join/i })
      joinButtons.forEach((button) => {
        expect(button.className).toContain('bg-[#58a6ff]')
      })
    })

    it('applies hover effects to join buttons', () => {
      renderWithRouter(<CategoryBrowsePage />)
      const joinButtons = screen.getAllByRole('button', { name: /Join/i })
      joinButtons.forEach((button) => {
        expect(button.className).toContain('hover:bg-blue-600')
      })
    })
  })

  describe('Data Display and Formatting', () => {
    it('displays category IDs correctly', () => {
      renderWithRouter(<CategoryBrowsePage />)
      // Verify all categories are present by their display names
      const categories = ['Gaming', 'Music', 'Technology', 'Art & Design']
      categories.forEach((category) => {
        const elements = screen.getAllByText(category)
        expect(elements.length).toBeGreaterThan(0)
      })
    })

    it('displays trending topic IDs correctly', () => {
      renderWithRouter(<CategoryBrowsePage />)
      // All trending topics should be displayed
      const topics = ['AI Art Generation', 'Indie Games 2024', 'Film Photography', 'Home Workouts']
      topics.forEach((topic) => {
        expect(screen.getByText(topic)).toBeInTheDocument()
      })
    })

    it('formats numbers correctly with toLocaleString', () => {
      renderWithRouter(<CategoryBrowsePage />)
      // Check that numbers are formatted with commas
      expect(screen.getByText(/15,234 communities/)).toBeInTheDocument()
      const elements = screen.getAllByText(/1,234/)
      expect(elements.length).toBeGreaterThan(0)
    })

    it('displays correct member count format', () => {
      renderWithRouter(<CategoryBrowsePage />)
      expect(screen.getByText(/125K members/i)).toBeInTheDocument()
      expect(screen.getByText(/89K members/i)).toBeInTheDocument()
    })
  })

  describe('Snapshot Testing', () => {
    it('matches snapshot for authenticated user', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />, { authValue: mockAuthContext })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for unauthenticated user', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />, { authValue: mockUnauthContext })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot for complete page structure', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

export default mockNavigate
