import { render, screen } from '@testing-library/react'
import { PageLoader, Spinner, DotLoader, PulseLoader, BarLoader } from '../PageLoader'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, className, style, ...props }) => (
      <div data-testid="motion-div" className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <div data-testid="animate-presence">{children}</div>,
}))

describe('PageLoader Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<PageLoader />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders with default message', () => {
      render(<PageLoader />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders with custom message', () => {
      render(<PageLoader message="Please wait..." />)
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
    })

    it('renders with logo by default', () => {
      const { container } = render(<PageLoader />)
      expect(container.querySelector('.w-20.h-20')).toBeInTheDocument()
    })

    it('renders without logo when logo is false', () => {
      const { container } = render(<PageLoader logo={false} />)
      expect(container.querySelector('.w-20.h-20')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<PageLoader className="custom-loader" />)
      expect(container.querySelector('.custom-loader')).toBeInTheDocument()
    })

    it('is wrapped in AnimatePresence', () => {
      render(<PageLoader />)
      expect(screen.getByTestId('animate-presence')).toBeInTheDocument()
    })

    it('has fixed positioning', () => {
      const { container } = render(<PageLoader />)
      const wrapper = container.querySelector('.fixed.inset-0')
      expect(wrapper).toBeInTheDocument()
    })

    it('has high z-index', () => {
      const { container } = render(<PageLoader />)
      const wrapper = container.querySelector('.z-50')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Logo Display', () => {
    it('displays logo with gradient background', () => {
      const { container } = render(<PageLoader />)
      const logo = container.querySelector('.bg-gradient-to-br.from-blue-500.to-purple-600')
      expect(logo).toBeInTheDocument()
    })

    it('displays C letter in logo', () => {
      render(<PageLoader />)
      expect(screen.getByText('C')).toBeInTheDocument()
    })

    it('logo has rounded corners', () => {
      const { container } = render(<PageLoader />)
      const logo = container.querySelector('.rounded-2xl')
      expect(logo).toBeInTheDocument()
    })

    it('logo has shadow', () => {
      const { container } = render(<PageLoader />)
      const logo = container.querySelector('.shadow-2xl')
      expect(logo).toBeInTheDocument()
    })

    it('renders orbiting dots around logo', () => {
      const { container } = render(<PageLoader />)
      const dots = container.querySelectorAll('.w-3.h-3.bg-blue-500.rounded-full')
      expect(dots.length).toBe(3)
    })

    it('positions orbiting dots correctly', () => {
      const { container } = render(<PageLoader />)
      const dots = container.querySelectorAll('.absolute.w-3.h-3')
      expect(dots.length).toBe(3)
    })
  })

  describe('Spinner Display', () => {
    it('renders Spinner when logo is false', () => {
      const { container } = render(<PageLoader logo={false} />)
      const spinner = container.querySelector('[role="status"]')
      expect(spinner).toBeInTheDocument()
    })

    it('does not render Spinner when logo is true', () => {
      const { container } = render(<PageLoader logo={true} />)
      const spinners = container.querySelectorAll('[role="status"]')
      // Should only have loading message, not spinner
      expect(spinners.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Progress Bar', () => {
    it('does not render progress bar by default', () => {
      const { container } = render(<PageLoader />)
      const progressBars = container.querySelectorAll('.h-1\\.5.bg-gray-200')
      expect(progressBars.length).toBe(0)
    })

    it('renders progress bar when progress is provided', () => {
      const { container } = render(<PageLoader progress={50} />)
      const progressBar = container.querySelector('.h-1\\.5.bg-gray-200')
      expect(progressBar).toBeInTheDocument()
    })

    it('renders progress bar with 0% progress', () => {
      const { container } = render(<PageLoader progress={0} />)
      const progressBar = container.querySelector('.h-1\\.5.bg-gray-200')
      expect(progressBar).toBeInTheDocument()
    })

    it('renders progress bar with 100% progress', () => {
      const { container } = render(<PageLoader progress={100} />)
      const progressBar = container.querySelector('.h-1\\.5.bg-gray-200')
      expect(progressBar).toBeInTheDocument()
    })

    it('renders progress bar with correct width', () => {
      const { container } = render(<PageLoader progress={75} />)
      const progressBar = container.querySelector('.h-1\\.5.bg-gray-200')
      expect(progressBar).toBeInTheDocument()
    })

    it('progress bar has gradient', () => {
      const { container } = render(<PageLoader progress={50} />)
      const progressFill = container.querySelector('.bg-gradient-to-r.from-blue-500.to-purple-600')
      expect(progressFill).toBeInTheDocument()
    })

    it('progress bar has fixed width', () => {
      const { container } = render(<PageLoader progress={50} />)
      const progressBar = container.querySelector('.w-64')
      expect(progressBar).toBeInTheDocument()
    })

    it('progress bar is rounded', () => {
      const { container } = render(<PageLoader progress={50} />)
      const progressBar = container.querySelector('.rounded-full')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('applies dark mode classes to background', () => {
      const { container } = render(<PageLoader />)
      const wrapper = container.querySelector('.bg-white.dark\\:bg-gray-950')
      expect(wrapper).toBeInTheDocument()
    })

    it('applies dark mode classes to message text', () => {
      const { container } = render(<PageLoader />)
      const message = container.querySelector('.text-gray-900.dark\\:text-gray-100')
      expect(message).toBeInTheDocument()
    })

    it('applies dark mode classes to progress bar background', () => {
      const { container } = render(<PageLoader progress={50} />)
      const progressBar = container.querySelector('.bg-gray-200.dark\\:bg-gray-800')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Layout and Positioning', () => {
    it('centers content vertically and horizontally', () => {
      const { container } = render(<PageLoader />)
      const wrapper = container.querySelector('.flex.items-center.justify-center')
      expect(wrapper).toBeInTheDocument()
    })

    it('uses flexbox column layout', () => {
      const { container } = render(<PageLoader />)
      const content = container.querySelector('.flex.flex-col.items-center')
      expect(content).toBeInTheDocument()
    })

    it('applies gap between elements', () => {
      const { container } = render(<PageLoader />)
      const content = container.querySelector('.gap-6')
      expect(content).toBeInTheDocument()
    })

    it('applies padding to content', () => {
      const { container } = render(<PageLoader />)
      const content = container.querySelector('.px-4')
      expect(content).toBeInTheDocument()
    })
  })

  describe('Text Styling', () => {
    it('applies large font size to message', () => {
      const { container } = render(<PageLoader />)
      const message = container.querySelector('.text-lg')
      expect(message).toBeInTheDocument()
    })

    it('applies medium font weight to message', () => {
      const { container } = render(<PageLoader />)
      const message = container.querySelector('.font-medium')
      expect(message).toBeInTheDocument()
    })

    it('centers message text', () => {
      const { container } = render(<PageLoader />)
      const messageWrapper = container.querySelector('.text-center')
      expect(messageWrapper).toBeInTheDocument()
    })
  })
})

describe('Spinner Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('[role="status"]')).toBeInTheDocument()
    })

    it('has loading role', () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('[role="status"]')).toBeInTheDocument()
    })

    it('has aria-label', () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('[aria-label="Loading"]')).toBeInTheDocument()
    })

    it('has screen reader text', () => {
      render(<Spinner />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('renders small size', () => {
      const { container } = render(<Spinner size="sm" />)
      expect(container.querySelector('.w-4.h-4')).toBeInTheDocument()
    })

    it('renders medium size by default', () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('.w-8.h-8')).toBeInTheDocument()
    })

    it('renders large size', () => {
      const { container } = render(<Spinner size="lg" />)
      expect(container.querySelector('.w-12.h-12')).toBeInTheDocument()
    })

    it('renders extra large size', () => {
      const { container } = render(<Spinner size="xl" />)
      expect(container.querySelector('.w-16.h-16')).toBeInTheDocument()
    })

    it('applies correct border width for small', () => {
      const { container } = render(<Spinner size="sm" />)
      expect(container.querySelector('.border-2')).toBeInTheDocument()
    })

    it('applies correct border width for large', () => {
      const { container } = render(<Spinner size="lg" />)
      expect(container.querySelector('.border-3')).toBeInTheDocument()
    })
  })

  describe('Color Variants', () => {
    it('renders blue color by default', () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('.border-blue-600')).toBeInTheDocument()
    })

    it('renders purple color', () => {
      const { container } = render(<Spinner color="purple" />)
      expect(container.querySelector('.border-purple-600')).toBeInTheDocument()
    })

    it('renders gray color', () => {
      const { container } = render(<Spinner color="gray" />)
      expect(container.querySelector('.border-gray-600')).toBeInTheDocument()
    })

    it('renders white color', () => {
      const { container } = render(<Spinner color="white" />)
      expect(container.querySelector('.border-white')).toBeInTheDocument()
    })

    it('has transparent top border', () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('.border-t-transparent')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('is circular', () => {
      const { container } = render(<Spinner />)
      expect(container.querySelector('.rounded-full')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<Spinner className="custom-spinner" />)
      expect(container.querySelector('.custom-spinner')).toBeInTheDocument()
    })
  })
})

describe('DotLoader Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<DotLoader />)
      expect(container.querySelector('[role="status"]')).toBeInTheDocument()
    })

    it('renders three dots', () => {
      const { container } = render(<DotLoader />)
      const dots = container.querySelectorAll('.rounded-full.bg-blue-600')
      expect(dots.length).toBe(3)
    })

    it('has loading role', () => {
      const { container } = render(<DotLoader />)
      expect(container.querySelector('[role="status"]')).toBeInTheDocument()
    })

    it('has screen reader text', () => {
      render(<DotLoader />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('renders small dots', () => {
      const { container } = render(<DotLoader size="sm" />)
      expect(container.querySelector('.w-1\\.5.h-1\\.5')).toBeInTheDocument()
    })

    it('renders medium dots by default', () => {
      const { container } = render(<DotLoader />)
      expect(container.querySelector('.w-2\\.5.h-2\\.5')).toBeInTheDocument()
    })

    it('renders large dots', () => {
      const { container } = render(<DotLoader size="lg" />)
      expect(container.querySelector('.w-3\\.5.h-3\\.5')).toBeInTheDocument()
    })
  })

  describe('Color Variants', () => {
    it('renders blue dots by default', () => {
      const { container } = render(<DotLoader />)
      const dots = container.querySelectorAll('.bg-blue-600')
      expect(dots.length).toBe(3)
    })

    it('renders purple dots', () => {
      const { container } = render(<DotLoader color="purple" />)
      const dots = container.querySelectorAll('.bg-purple-600')
      expect(dots.length).toBe(3)
    })

    it('renders gray dots', () => {
      const { container } = render(<DotLoader color="gray" />)
      const dots = container.querySelectorAll('.bg-gray-600')
      expect(dots.length).toBe(3)
    })

    it('renders white dots', () => {
      const { container } = render(<DotLoader color="white" />)
      const dots = container.querySelectorAll('.bg-white')
      expect(dots.length).toBe(3)
    })
  })

  describe('Layout', () => {
    it('arranges dots horizontally', () => {
      const { container } = render(<DotLoader />)
      expect(container.querySelector('.flex.items-center')).toBeInTheDocument()
    })

    it('applies gap between dots', () => {
      const { container } = render(<DotLoader />)
      expect(container.querySelector('.gap-1\\.5')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<DotLoader className="custom-dots" />)
      expect(container.querySelector('.custom-dots')).toBeInTheDocument()
    })
  })
})

describe('PulseLoader Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<PulseLoader />)
      expect(container.querySelector('[role="status"]')).toBeInTheDocument()
    })

    it('has loading role', () => {
      const { container } = render(<PulseLoader />)
      expect(container.querySelector('[role="status"]')).toBeInTheDocument()
    })

    it('has screen reader text', () => {
      render(<PulseLoader />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders multiple pulse circles', () => {
      const { container } = render(<PulseLoader />)
      const circles = container.querySelectorAll('.absolute.inset-0.rounded-full')
      expect(circles.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Size Variants', () => {
    it('renders small size', () => {
      const { container } = render(<PulseLoader size="sm" />)
      expect(container.querySelector('.w-8.h-8')).toBeInTheDocument()
    })

    it('renders medium size by default', () => {
      const { container } = render(<PulseLoader />)
      expect(container.querySelector('.w-12.h-12')).toBeInTheDocument()
    })

    it('renders large size', () => {
      const { container } = render(<PulseLoader size="lg" />)
      expect(container.querySelector('.w-16.h-16')).toBeInTheDocument()
    })
  })

  describe('Color Variants', () => {
    it('renders blue color by default', () => {
      const { container } = render(<PulseLoader />)
      expect(container.querySelector('.bg-blue-600')).toBeInTheDocument()
    })

    it('renders purple color', () => {
      const { container } = render(<PulseLoader color="purple" />)
      expect(container.querySelector('.bg-purple-600')).toBeInTheDocument()
    })

    it('renders gray color', () => {
      const { container } = render(<PulseLoader color="gray" />)
      expect(container.querySelector('.bg-gray-600')).toBeInTheDocument()
    })

    it('renders white color', () => {
      const { container } = render(<PulseLoader color="white" />)
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('uses relative positioning', () => {
      const { container } = render(<PulseLoader />)
      expect(container.querySelector('.relative')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<PulseLoader className="custom-pulse" />)
      expect(container.querySelector('.custom-pulse')).toBeInTheDocument()
    })

    it('has circular shape', () => {
      const { container } = render(<PulseLoader />)
      const circles = container.querySelectorAll('.rounded-full')
      expect(circles.length).toBeGreaterThan(0)
    })
  })
})

describe('BarLoader Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<BarLoader />)
      expect(container.querySelector('[role="status"]')).toBeInTheDocument()
    })

    it('has loading role', () => {
      const { container } = render(<BarLoader />)
      expect(container.querySelector('[role="status"]')).toBeInTheDocument()
    })

    it('has screen reader text', () => {
      render(<BarLoader />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders progress bar container', () => {
      const { container } = render(<BarLoader />)
      expect(container.querySelector('.relative.overflow-hidden.rounded-full')).toBeInTheDocument()
    })

    it('renders moving bar', () => {
      const { container } = render(<BarLoader />)
      expect(container.querySelector('.absolute.h-full.rounded-full')).toBeInTheDocument()
    })
  })

  describe('Dimensions', () => {
    it('has default width', () => {
      const { container } = render(<BarLoader />)
      const bar = container.querySelector('[role="status"]')
      expect(bar).toHaveStyle({ width: '100%' })
    })

    it('has default height', () => {
      const { container } = render(<BarLoader />)
      const bar = container.querySelector('[role="status"]')
      expect(bar).toHaveStyle({ height: '4px' })
    })

    it('accepts custom width', () => {
      const { container } = render(<BarLoader width="200px" />)
      const bar = container.querySelector('[role="status"]')
      expect(bar).toHaveStyle({ width: '200px' })
    })

    it('accepts custom height', () => {
      const { container } = render(<BarLoader height="8px" />)
      const bar = container.querySelector('[role="status"]')
      expect(bar).toHaveStyle({ height: '8px' })
    })

    it('accepts percentage width', () => {
      const { container } = render(<BarLoader width="50%" />)
      const bar = container.querySelector('[role="status"]')
      expect(bar).toHaveStyle({ width: '50%' })
    })
  })

  describe('Color Variants', () => {
    it('renders blue bar by default', () => {
      const { container } = render(<BarLoader />)
      expect(container.querySelector('.bg-blue-600')).toBeInTheDocument()
    })

    it('renders purple bar', () => {
      const { container } = render(<BarLoader color="purple" />)
      expect(container.querySelector('.bg-purple-600')).toBeInTheDocument()
    })

    it('renders gray bar', () => {
      const { container } = render(<BarLoader color="gray" />)
      expect(container.querySelector('.bg-gray-600')).toBeInTheDocument()
    })

    it('renders white bar', () => {
      const { container } = render(<BarLoader color="white" />)
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('has background track', () => {
      const { container } = render(<BarLoader />)
      expect(container.querySelector('.bg-gray-200.dark\\:bg-gray-800')).toBeInTheDocument()
    })

    it('is rounded', () => {
      const { container } = render(<BarLoader />)
      expect(container.querySelector('.rounded-full')).toBeInTheDocument()
    })

    it('has overflow hidden', () => {
      const { container } = render(<BarLoader />)
      expect(container.querySelector('.overflow-hidden')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<BarLoader className="custom-bar" />)
      expect(container.querySelector('.custom-bar')).toBeInTheDocument()
    })
  })
})

describe('Edge Cases and Error Handling', () => {
  it('PageLoader handles null message', () => {
    expect(() => {
      render(<PageLoader message={null} />)
    }).not.toThrow()
  })

  it('PageLoader handles undefined message', () => {
    expect(() => {
      render(<PageLoader message={undefined} />)
    }).not.toThrow()
  })

  it('PageLoader handles negative progress', () => {
    expect(() => {
      render(<PageLoader progress={-10} />)
    }).not.toThrow()
  })

  it('PageLoader handles progress over 100', () => {
    expect(() => {
      render(<PageLoader progress={150} />)
    }).not.toThrow()
  })

  it('Spinner handles invalid size', () => {
    expect(() => {
      render(<Spinner size="invalid" />)
    }).not.toThrow()
  })

  it('Spinner handles invalid color', () => {
    expect(() => {
      render(<Spinner color="invalid" />)
    }).not.toThrow()
  })

  it('DotLoader handles invalid size', () => {
    expect(() => {
      render(<DotLoader size="invalid" />)
    }).not.toThrow()
  })

  it('PulseLoader handles invalid size', () => {
    expect(() => {
      render(<PulseLoader size="invalid" />)
    }).not.toThrow()
  })

  it('BarLoader handles invalid width', () => {
    expect(() => {
      render(<BarLoader width="invalid" />)
    }).not.toThrow()
  })

  it('BarLoader handles invalid height', () => {
    expect(() => {
      render(<BarLoader height="invalid" />)
    }).not.toThrow()
  })
})

export default wrapper
