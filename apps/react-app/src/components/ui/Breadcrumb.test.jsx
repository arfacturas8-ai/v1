import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Breadcrumb from './Breadcrumb'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronRight: ({ className, ...props }) => (
    <svg data-testid="chevron-right-icon" className={className} {...props} />
  ),
  Home: ({ className, ...props }) => (
    <svg data-testid="home-icon" className={className} {...props} />
  ),
}))

const renderWithRouter = (component, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  )
}

describe('Breadcrumb', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<Breadcrumb />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('renders with custom items', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Details')).toBeInTheDocument()
    })

    it('renders nav element with proper aria-label', () => {
      renderWithRouter(<Breadcrumb />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation')
    })

    it('renders ordered list', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
      expect(list.className).toContain('breadcrumb-list')
    })

    it('renders list items for each breadcrumb', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThanOrEqual(3)
    })

    it('applies custom className', () => {
      renderWithRouter(<Breadcrumb className="custom-breadcrumb" />)

      const nav = screen.getByRole('navigation')
      expect(nav.className).toContain('custom-breadcrumb')
    })

    it('applies base breadcrumb className', () => {
      renderWithRouter(<Breadcrumb />)

      const nav = screen.getByRole('navigation')
      expect(nav.className).toContain('breadcrumb')
    })

    it('forwards additional props to nav element', () => {
      renderWithRouter(<Breadcrumb data-testid="custom-breadcrumb" />)

      expect(screen.getByTestId('custom-breadcrumb')).toBeInTheDocument()
    })

    it('renders empty breadcrumb on root path', () => {
      renderWithRouter(<Breadcrumb />, '/')

      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })
  })

  describe('Home Icon', () => {
    it('renders home icon by default', () => {
      const items = [
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      expect(screen.getByTestId('home-icon')).toBeInTheDocument()
    })

    it('home icon links to root path', () => {
      const items = [
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      const homeLink = screen.getByLabelText('Home')
      expect(homeLink).toHaveAttribute('href', '/')
    })

    it('home icon has proper aria-label', () => {
      const items = [
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      expect(screen.getByLabelText('Home')).toBeInTheDocument()
    })

    it('does not render home icon when showHome is false', () => {
      const items = [
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.queryByTestId('home-icon')).not.toBeInTheDocument()
    })

    it('does not render home icon when first item is root', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      // Should only have one Home element (the first item), not the icon
      const homeElements = screen.getAllByText('Home')
      expect(homeElements.length).toBe(1)
    })

    it('home icon has proper CSS classes', () => {
      const items = [
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      const homeIcon = screen.getByTestId('home-icon')
      expect(homeIcon.className).toContain('w-4')
      expect(homeIcon.className).toContain('h-4')
    })

    it('home link has proper CSS classes', () => {
      const items = [
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      const homeLink = screen.getByLabelText('Home')
      expect(homeLink.className).toContain('breadcrumb-link')
      expect(homeLink.className).toContain('breadcrumb-home')
    })
  })

  describe('Separators', () => {
    it('renders default ChevronRight separator', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument()
    })

    it('renders custom separator', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(
        <Breadcrumb items={items} separator={<span data-testid="custom-sep">/</span>} showHome={false} />
      )

      expect(screen.getByTestId('custom-sep')).toBeInTheDocument()
    })

    it('separator has aria-hidden attribute', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const separators = document.querySelectorAll('.breadcrumb-separator')
      separators.forEach(sep => {
        expect(sep).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('does not render separator after last item', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const separators = document.querySelectorAll('.breadcrumb-separator')
      const listItems = screen.getAllByRole('listitem')

      // Should have one less separator than items
      expect(separators.length).toBe(listItems.length - 1)
    })

    it('separator has proper CSS class', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const separator = document.querySelector('.breadcrumb-separator')
      expect(separator).toBeInTheDocument()
    })

    it('renders multiple separators correctly', () => {
      const items = [
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const separators = document.querySelectorAll('.breadcrumb-separator')
      expect(separators.length).toBe(3)
    })
  })

  describe('Links and Navigation', () => {
    it('renders links for non-last items', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const homeLink = screen.getByRole('link', { name: 'Home' })
      const productsLink = screen.getByRole('link', { name: 'Products' })

      expect(homeLink).toHaveAttribute('href', '/')
      expect(productsLink).toHaveAttribute('href', '/products')
    })

    it('renders current page as span with aria-current', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const currentPage = screen.getByText('Details')
      expect(currentPage.tagName).toBe('SPAN')
      expect(currentPage).toHaveAttribute('aria-current', 'page')
    })

    it('current page has proper CSS class', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Current', href: '/current' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const currentPage = screen.getByText('Current')
      expect(currentPage.className).toContain('breadcrumb-current')
    })

    it('links have proper CSS class', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const link = screen.getByRole('link', { name: 'Home' })
      expect(link.className).toContain('breadcrumb-link')
    })

    it('links are keyboard accessible', async () => {
      const user = userEvent.setup()
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const homeLink = screen.getByRole('link', { name: 'Home' })
      await user.tab()

      expect(document.activeElement).toBe(homeLink)
    })

    it('supports clicking on links', async () => {
      const user = userEvent.setup()
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const homeLink = screen.getByRole('link', { name: 'Home' })
      await user.click(homeLink)

      // Link should be clickable (router will handle navigation)
      expect(homeLink).toBeInTheDocument()
    })
  })

  describe('Auto-generation from Routes', () => {
    it('generates breadcrumbs from simple path', () => {
      renderWithRouter(<Breadcrumb />, '/products')

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
    })

    it('generates breadcrumbs from nested path', () => {
      renderWithRouter(<Breadcrumb />, '/products/electronics/laptops')

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Electronics')).toBeInTheDocument()
      expect(screen.getByText('Laptops')).toBeInTheDocument()
    })

    it('converts kebab-case to Title Case', () => {
      renderWithRouter(<Breadcrumb />, '/my-awesome-page')

      expect(screen.getByText('My Awesome Page')).toBeInTheDocument()
    })

    it('converts camelCase to Title Case', () => {
      renderWithRouter(<Breadcrumb />, '/myAwesomePage')

      expect(screen.getByText('My Awesome Page')).toBeInTheDocument()
    })

    it('capitalizes first letter of each word', () => {
      renderWithRouter(<Breadcrumb />, '/products/new-arrivals')

      expect(screen.getByText('New Arrivals')).toBeInTheDocument()
    })

    it('generates correct hrefs for auto-generated breadcrumbs', () => {
      renderWithRouter(<Breadcrumb />, '/products/electronics/laptops')

      const productsLink = screen.getByRole('link', { name: 'Products' })
      const electronicsLink = screen.getByRole('link', { name: 'Electronics' })

      expect(productsLink).toHaveAttribute('href', '/products')
      expect(electronicsLink).toHaveAttribute('href', '/products/electronics')
    })

    it('handles root path correctly', () => {
      renderWithRouter(<Breadcrumb />, '/')

      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('handles paths with trailing slash', () => {
      renderWithRouter(<Breadcrumb />, '/products/')

      expect(screen.getByText('Products')).toBeInTheDocument()
    })

    it('handles paths with multiple slashes', () => {
      renderWithRouter(<Breadcrumb />, '//products//electronics//')

      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })

    it('handles single-level path', () => {
      renderWithRouter(<Breadcrumb />, '/about')

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
    })

    it('handles deep nested paths', () => {
      renderWithRouter(<Breadcrumb />, '/level1/level2/level3/level4/level5')

      expect(screen.getByText('Level1')).toBeInTheDocument()
      expect(screen.getByText('Level2')).toBeInTheDocument()
      expect(screen.getByText('Level3')).toBeInTheDocument()
      expect(screen.getByText('Level4')).toBeInTheDocument()
      expect(screen.getByText('Level5')).toBeInTheDocument()
    })
  })

  describe('Truncation with maxItems', () => {
    it('shows all items when under maxItems limit', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={4} showHome={false} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Details')).toBeInTheDocument()
    })

    it('truncates items when exceeding maxItems', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={4} showHome={false} />)

      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('shows first item when truncated', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={4} showHome={false} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('shows last two items when truncated', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={4} showHome={false} />)

      expect(screen.getByText('Level 3')).toBeInTheDocument()
      expect(screen.getByText('Level 4')).toBeInTheDocument()
    })

    it('ellipsis is disabled and not clickable', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={4} showHome={false} />)

      const ellipsis = screen.getByText('...')
      expect(ellipsis.tagName).toBe('SPAN')
    })

    it('ellipsis has proper CSS class', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={4} showHome={false} />)

      const ellipsis = screen.getByText('...')
      expect(ellipsis.className).toContain('breadcrumb-ellipsis')
    })

    it('respects default maxItems of 4', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('supports custom maxItems value', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={2} showHome={false} />)

      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('does not truncate when maxItems equals item count', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={3} showHome={false} />)

      expect(screen.queryByText('...')).not.toBeInTheDocument()
    })

    it('hides middle items when truncated', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={4} showHome={false} />)

      expect(screen.queryByText('Level 1')).not.toBeInTheDocument()
      expect(screen.queryByText('Level 2')).not.toBeInTheDocument()
    })
  })

  describe('Disabled Items', () => {
    it('renders disabled items as non-clickable spans', () => {
      const items = [
        { label: 'Home', href: '/', disabled: false },
        { label: 'Disabled', href: '/disabled', disabled: true },
        { label: 'Active', href: '/active', disabled: false },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const disabledItem = screen.getByText('Disabled')
      expect(disabledItem.tagName).toBe('SPAN')
    })

    it('disabled items do not have href', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Disabled', href: '/disabled', disabled: true },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const disabledItem = screen.getByText('Disabled')
      expect(disabledItem).not.toHaveAttribute('href')
    })

    it('disabled items have proper CSS class', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Disabled', href: '/disabled', disabled: true },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const disabledItem = screen.getByText('Disabled')
      expect(disabledItem.className).toContain('breadcrumb-ellipsis')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      renderWithRouter(<Breadcrumb items={[]} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })

    it('handles single item', () => {
      const items = [{ label: 'Home', href: '/' }]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('handles items without href', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'No Link', href: null },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.getByText('No Link')).toBeInTheDocument()
    })

    it('handles items with undefined href', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Undefined', href: undefined },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.getByText('Undefined')).toBeInTheDocument()
    })

    it('handles very long labels', () => {
      const items = [
        { label: 'Home', href: '/' },
        {
          label: 'This is a very long label that might cause layout issues if not handled properly',
          href: '/long'
        },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.getByText(/This is a very long label/)).toBeInTheDocument()
    })

    it('handles special characters in labels', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products & Services', href: '/products' },
        { label: '50% Off!', href: '/sale' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.getByText('Products & Services')).toBeInTheDocument()
      expect(screen.getByText('50% Off!')).toBeInTheDocument()
    })

    it('handles Unicode characters in labels', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Продукты', href: '/products' },
        { label: '产品', href: '/products/chinese' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.getByText('Продукты')).toBeInTheDocument()
      expect(screen.getByText('产品')).toBeInTheDocument()
    })

    it('handles numeric path segments', () => {
      renderWithRouter(<Breadcrumb />, '/products/123/details')

      expect(screen.getByText('123')).toBeInTheDocument()
    })

    it('handles mixed case path segments', () => {
      renderWithRouter(<Breadcrumb />, '/MyProducts/NewArrivals')

      expect(screen.getByText('My Products')).toBeInTheDocument()
      expect(screen.getByText('New Arrivals')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper navigation landmark', () => {
      renderWithRouter(<Breadcrumb />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('current page has aria-current="page"', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Current', href: '/current' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const current = screen.getByText('Current')
      expect(current).toHaveAttribute('aria-current', 'page')
    })

    it('separators are hidden from screen readers', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const separators = document.querySelectorAll('.breadcrumb-separator')
      separators.forEach(sep => {
        expect(sep).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('links are keyboard navigable', async () => {
      const user = userEvent.setup()
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const homeLink = screen.getByRole('link', { name: 'Home' })
      await user.tab()

      // First link should be focusable
      expect(document.activeElement).toBe(homeLink)
    })

    it('maintains proper heading hierarchy when used in page', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(
        <>
          <h1>Page Title</h1>
          <Breadcrumb items={items} />
        </>
      )

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })

    it('provides meaningful link text', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument()
    })

    it('uses semantic HTML list structure', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const list = screen.getByRole('list')
      expect(list.tagName).toBe('OL')
    })

    it('list items are properly structured', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const listItems = screen.getAllByRole('listitem')
      listItems.forEach(item => {
        expect(item.tagName).toBe('LI')
      })
    })

    it('home icon link is accessible', () => {
      const items = [
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} />)

      const homeLink = screen.getByLabelText('Home')
      expect(homeLink).toHaveAttribute('aria-label', 'Home')
    })
  })

  describe('Integration with React Router', () => {
    it('works with BrowserRouter', () => {
      render(
        <BrowserRouter>
          <Breadcrumb items={[{ label: 'Home', href: '/' }]} />
        </BrowserRouter>
      )

      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('uses Link component for navigation', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const link = screen.getByRole('link', { name: 'Home' })
      // React Router Link should not cause full page reload
      expect(link).not.toHaveAttribute('target')
    })

    it('updates when route changes', () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/products']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      expect(screen.getByText('Products')).toBeInTheDocument()

      rerender(
        <MemoryRouter initialEntries={['/about']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      expect(screen.getByText('About')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles large number of breadcrumbs efficiently', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        label: `Level ${i}`,
        href: `/level${i}`,
      }))

      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      // Should be truncated due to maxItems
      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('does not re-render unnecessarily', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      const { rerender } = renderWithRouter(<Breadcrumb items={items} />)

      const nav = screen.getByRole('navigation')
      const firstRender = nav.innerHTML

      rerender(
        <MemoryRouter initialEntries={['/']}>
          <Breadcrumb items={items} />
        </MemoryRouter>
      )

      expect(nav.innerHTML).toBe(firstRender)
    })
  })

  describe('Styling and CSS Classes', () => {
    it('applies breadcrumb class to nav', () => {
      renderWithRouter(<Breadcrumb />)

      const nav = screen.getByRole('navigation')
      expect(nav.className).toContain('breadcrumb')
    })

    it('applies breadcrumb-list class to ol', () => {
      renderWithRouter(<Breadcrumb items={[{ label: 'Home', href: '/' }]} />)

      const list = screen.getByRole('list')
      expect(list.className).toContain('breadcrumb-list')
    })

    it('applies breadcrumb-item class to li', () => {
      const items = [{ label: 'Home', href: '/' }]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const listItem = screen.getByRole('listitem')
      expect(listItem.className).toContain('breadcrumb-item')
    })

    it('applies breadcrumb-link class to links', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const link = screen.getByRole('link', { name: 'Home' })
      expect(link.className).toContain('breadcrumb-link')
    })

    it('applies breadcrumb-current class to current page', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Current', href: '/current' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const current = screen.getByText('Current')
      expect(current.className).toContain('breadcrumb-current')
    })

    it('applies breadcrumb-separator class to separators', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(<Breadcrumb items={items} showHome={false} />)

      const separator = document.querySelector('.breadcrumb-separator')
      expect(separator).toBeInTheDocument()
    })

    it('applies breadcrumb-ellipsis class to ellipsis', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={4} showHome={false} />)

      const ellipsis = screen.getByText('...')
      expect(ellipsis.className).toContain('breadcrumb-ellipsis')
    })

    it('combines custom className with default classes', () => {
      renderWithRouter(<Breadcrumb className="my-custom-class" />)

      const nav = screen.getByRole('navigation')
      expect(nav.className).toContain('breadcrumb')
      expect(nav.className).toContain('my-custom-class')
    })
  })

  describe('Component Props', () => {
    it('accepts items prop', () => {
      const items = [{ label: 'Test', href: '/test' }]
      renderWithRouter(<Breadcrumb items={items} />)

      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('accepts separator prop', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      renderWithRouter(
        <Breadcrumb items={items} separator={<span>|</span>} showHome={false} />
      )

      expect(screen.getByText('|')).toBeInTheDocument()
    })

    it('accepts showHome prop', () => {
      const items = [{ label: 'Products', href: '/products' }]
      renderWithRouter(<Breadcrumb items={items} showHome={true} />)

      expect(screen.getByTestId('home-icon')).toBeInTheDocument()
    })

    it('accepts className prop', () => {
      renderWithRouter(<Breadcrumb className="custom" />)

      const nav = screen.getByRole('navigation')
      expect(nav.className).toContain('custom')
    })

    it('accepts maxItems prop', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
      ]
      renderWithRouter(<Breadcrumb items={items} maxItems={2} showHome={false} />)

      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('forwards arbitrary props to nav element', () => {
      renderWithRouter(
        <Breadcrumb
          data-custom="value"
          role="navigation"
          id="my-breadcrumb"
        />
      )

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('data-custom', 'value')
      expect(nav).toHaveAttribute('id', 'my-breadcrumb')
    })

    it('handles boolean props correctly', () => {
      renderWithRouter(<Breadcrumb showHome={true} />)
      renderWithRouter(<Breadcrumb showHome={false} />)

      // Should not throw errors
      expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
    })

    it('uses default prop values when not provided', () => {
      renderWithRouter(<Breadcrumb />)

      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()

      // Should use defaults: showHome=true, maxItems=4, separator=ChevronRight
      expect(screen.getByTestId('home-icon')).toBeInTheDocument()
    })
  })

  describe('Component Behavior', () => {
    it('auto-generates when items not provided', () => {
      renderWithRouter(<Breadcrumb />, '/products/electronics')

      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })

    it('uses provided items over auto-generation', () => {
      const items = [{ label: 'Custom', href: '/custom' }]
      renderWithRouter(<Breadcrumb items={items} />, '/products')

      expect(screen.getByText('Custom')).toBeInTheDocument()
      expect(screen.queryByText('Products')).not.toBeInTheDocument()
    })

    it('updates when items prop changes', () => {
      const items1 = [{ label: 'First', href: '/first' }]
      const items2 = [{ label: 'Second', href: '/second' }]

      const { rerender } = renderWithRouter(<Breadcrumb items={items1} />)
      expect(screen.getByText('First')).toBeInTheDocument()

      rerender(
        <MemoryRouter>
          <Breadcrumb items={items2} />
        </MemoryRouter>
      )
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.queryByText('First')).not.toBeInTheDocument()
    })

    it('updates when showHome prop changes', () => {
      const items = [{ label: 'Products', href: '/products' }]
      const { rerender } = renderWithRouter(<Breadcrumb items={items} showHome={true} />)

      expect(screen.getByTestId('home-icon')).toBeInTheDocument()

      rerender(
        <MemoryRouter>
          <Breadcrumb items={items} showHome={false} />
        </MemoryRouter>
      )

      expect(screen.queryByTestId('home-icon')).not.toBeInTheDocument()
    })

    it('recalculates truncation when maxItems changes', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]

      const { rerender } = renderWithRouter(
        <Breadcrumb items={items} maxItems={10} showHome={false} />
      )

      expect(screen.queryByText('...')).not.toBeInTheDocument()

      rerender(
        <MemoryRouter>
          <Breadcrumb items={items} maxItems={3} showHome={false} />
        </MemoryRouter>
      )

      expect(screen.getByText('...')).toBeInTheDocument()
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = renderWithRouter(<Breadcrumb />, '/')
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with custom items', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      const { container } = renderWithRouter(<Breadcrumb items={items} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with truncation', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Level 1', href: '/level1' },
        { label: 'Level 2', href: '/level1/level2' },
        { label: 'Level 3', href: '/level1/level2/level3' },
        { label: 'Level 4', href: '/level1/level2/level3/level4' },
      ]
      const { container } = renderWithRouter(<Breadcrumb items={items} maxItems={4} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot without home icon', () => {
      const items = [
        { label: 'Products', href: '/products' },
        { label: 'Details', href: '/products/1' },
      ]
      const { container } = renderWithRouter(<Breadcrumb items={items} showHome={false} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with custom separator', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]
      const { container } = renderWithRouter(
        <Breadcrumb items={items} separator={<span>/</span>} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('matches snapshot with auto-generated breadcrumbs', () => {
      const { container } = renderWithRouter(<Breadcrumb />, '/products/electronics/laptops')
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

export default renderWithRouter
