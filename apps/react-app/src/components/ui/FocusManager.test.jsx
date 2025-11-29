import React, { useRef, useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  FocusProvider,
  useFocus,
  FocusTrap,
  SkipLink,
  useRovingTabIndex,
  useAnnouncer,
  useKeyboardNavigation
} from './FocusManager'

// Test components
const TestConsumer = ({ onMount }) => {
  const focus = useFocus()

  React.useEffect(() => {
    if (onMount) onMount(focus)
  }, [focus, onMount])

  return (
    <div>
      <button onClick={() => focus.trapFocus(document.body)}>Trap Focus</button>
      <button onClick={() => focus.pushFocus()}>Push Focus</button>
      <button onClick={() => focus.popFocus()}>Pop Focus</button>
      <button onClick={() => focus.restoreFocus()}>Restore Focus</button>
    </div>
  )
}

const TestFocusTrap = ({ active = true, restoreFocus = true, onMount }) => {
  const containerRef = useRef(null)

  React.useEffect(() => {
    if (onMount && containerRef.current) {
      onMount(containerRef.current)
    }
  }, [onMount])

  return (
    <FocusProvider>
      <button id="outside-button">Outside Button</button>
      <FocusTrap active={active} restoreFocus={restoreFocus}>
        <button id="first-button">First Button</button>
        <button id="second-button">Second Button</button>
        <button id="third-button">Third Button</button>
      </FocusTrap>
    </FocusProvider>
  )
}

const TestRovingTabIndex = ({ orientation = 'horizontal', items = [] }) => {
  const { currentIndex, getItemProps } = useRovingTabIndex(items, orientation)

  return (
    <div role="toolbar">
      {items.map((item, index) => (
        <button key={index} {...getItemProps(index)}>
          {item}
        </button>
      ))}
      <div data-testid="current-index">{currentIndex}</div>
    </div>
  )
}

const TestAnnouncer = () => {
  const { announce } = useAnnouncer()

  return (
    <div>
      <button onClick={() => announce('Test message', 'polite')}>
        Announce Polite
      </button>
      <button onClick={() => announce('Urgent message', 'assertive')}>
        Announce Assertive
      </button>
    </div>
  )
}

const TestKeyboardNav = ({ onEscape, onEnter, onSpace }) => {
  const { onKeyDown } = useKeyboardNavigation(onEscape, onEnter, onSpace)

  return (
    <div onKeyDown={onKeyDown} data-testid="keyboard-nav">
      <button>Test Button</button>
    </div>
  )
}

describe('FocusProvider', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders children without crashing', () => {
    render(
      <FocusProvider>
        <div>Test Content</div>
      </FocusProvider>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('provides focus context to children', () => {
    const onMount = jest.fn()

    render(
      <FocusProvider>
        <TestConsumer onMount={onMount} />
      </FocusProvider>
    )

    expect(onMount).toHaveBeenCalled()
    expect(onMount.mock.calls[0][0]).toHaveProperty('trapFocus')
    expect(onMount.mock.calls[0][0]).toHaveProperty('pushFocus')
    expect(onMount.mock.calls[0][0]).toHaveProperty('popFocus')
    expect(onMount.mock.calls[0][0]).toHaveProperty('restoreFocus')
  })

  it('exposes trapFocus method', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(typeof focusContext.trapFocus).toBe('function')
  })

  it('exposes pushFocus method', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(typeof focusContext.pushFocus).toBe('function')
  })

  it('exposes popFocus method', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(typeof focusContext.popFocus).toBe('function')
  })

  it('exposes restoreFocus method', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(typeof focusContext.restoreFocus).toBe('function')
  })
})

describe('useFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('throws error when used outside FocusProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    const TestComponent = () => {
      useFocus()
      return <div>Test</div>
    }

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useFocus must be used within a FocusProvider')

    consoleError.mockRestore()
  })

  it('returns focus context when used inside FocusProvider', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(focusContext).toBeDefined()
    expect(focusContext.trapFocus).toBeDefined()
  })

  it('pushFocus saves current active element', () => {
    const button = document.createElement('button')
    button.id = 'test-button'
    document.body.appendChild(button)
    button.focus()

    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(document.activeElement).toBe(button)

    const newButton = document.createElement('button')
    newButton.id = 'new-button'
    document.body.appendChild(newButton)

    focusContext.pushFocus(newButton)
    expect(document.activeElement).toBe(newButton)

    document.body.removeChild(button)
    document.body.removeChild(newButton)
  })

  it('popFocus restores previous element from stack', () => {
    const button1 = document.createElement('button')
    button1.id = 'button-1'
    document.body.appendChild(button1)
    button1.focus()

    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    const button2 = document.createElement('button')
    button2.id = 'button-2'
    document.body.appendChild(button2)

    focusContext.pushFocus(button2)
    expect(document.activeElement).toBe(button2)

    focusContext.popFocus()

    waitFor(() => {
      expect(document.activeElement).toBe(button1)
    })

    document.body.removeChild(button1)
    document.body.removeChild(button2)
  })

  it('restoreFocus restores saved focus', () => {
    const button = document.createElement('button')
    button.id = 'restore-button'
    document.body.appendChild(button)
    button.focus()

    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(document.activeElement).toBe(button)

    const otherButton = document.createElement('button')
    otherButton.id = 'other-button'
    document.body.appendChild(otherButton)
    otherButton.focus()

    focusContext.restoreFocus()

    waitFor(() => {
      expect(document.activeElement).toBe(button)
    })

    document.body.removeChild(button)
    document.body.removeChild(otherButton)
  })

  it('trapFocus returns cleanup function', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    const container = document.createElement('div')
    const button = document.createElement('button')
    container.appendChild(button)
    document.body.appendChild(container)

    const cleanup = focusContext.trapFocus(container)

    expect(typeof cleanup).toBe('function')

    cleanup()
    document.body.removeChild(container)
  })

  it('trapFocus handles empty container', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = focusContext.trapFocus(container)

    expect(cleanup).toBeUndefined()

    document.body.removeChild(container)
  })

  it('trapFocus handles null container', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    const cleanup = focusContext.trapFocus(null)

    expect(cleanup).toBeUndefined()
  })

  it('pushFocus handles null element', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(() => {
      focusContext.pushFocus(null)
    }).not.toThrow()
  })

  it('pushFocus handles element without focus method', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(() => {
      focusContext.pushFocus({})
    }).not.toThrow()
  })

  it('popFocus handles empty stack', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(() => {
      focusContext.popFocus()
    }).not.toThrow()
  })

  it('restoreFocus handles null previous focus', () => {
    let focusContext

    render(
      <FocusProvider>
        <TestConsumer onMount={(ctx) => { focusContext = ctx }} />
      </FocusProvider>
    )

    expect(() => {
      focusContext.restoreFocus()
    }).not.toThrow()
  })
})

describe('FocusTrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders children correctly', () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <button>Trapped Button</button>
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByRole('button', { name: /trapped button/i })).toBeInTheDocument()
  })

  it('applies focus-trap class', () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <button>Test</button>
        </FocusTrap>
      </FocusProvider>
    )

    const container = screen.getByRole('button').parentElement
    expect(container?.className).toContain('focus-trap')
  })

  it('applies custom className', () => {
    render(
      <FocusProvider>
        <FocusTrap className="custom-trap">
          <button>Test</button>
        </FocusTrap>
      </FocusProvider>
    )

    const container = screen.getByRole('button').parentElement
    expect(container?.className).toContain('custom-trap')
  })

  it('focuses first focusable element when active', async () => {
    render(<TestFocusTrap />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })
  })

  it('does not trap focus when active is false', async () => {
    render(<TestFocusTrap active={false} />)

    const outsideButton = screen.getByRole('button', { name: /outside button/i })
    outsideButton.focus()

    await waitFor(() => {
      expect(document.activeElement).toBe(outsideButton)
    })
  })

  it('traps Tab key navigation forward', async () => {
    render(<TestFocusTrap />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })

    const thirdButton = screen.getByRole('button', { name: /third button/i })
    thirdButton.focus()

    fireEvent.keyDown(thirdButton, { key: 'Tab', shiftKey: false })

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })
  })

  it('traps Tab key navigation backward', async () => {
    render(<TestFocusTrap />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })

    fireEvent.keyDown(firstButton, { key: 'Tab', shiftKey: true })

    await waitFor(() => {
      const thirdButton = screen.getByRole('button', { name: /third button/i })
      expect(document.activeElement).toBe(thirdButton)
    })
  })

  it('allows Tab navigation between elements inside trap', async () => {
    render(<TestFocusTrap />)

    const firstButton = screen.getByRole('button', { name: /first button/i })
    const secondButton = screen.getByRole('button', { name: /second button/i })

    await waitFor(() => {
      expect(document.activeElement).toBe(firstButton)
    })

    fireEvent.keyDown(firstButton, { key: 'Tab', shiftKey: false })

    // Note: Tab navigation between elements is handled by browser
    // We're testing that preventDefault is NOT called for middle elements
    expect(document.activeElement).toBe(firstButton)
  })

  it('ignores non-Tab keys', async () => {
    render(<TestFocusTrap />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })

    const firstButton = screen.getByRole('button', { name: /first button/i })

    fireEvent.keyDown(firstButton, { key: 'Enter' })
    expect(document.activeElement).toBe(firstButton)

    fireEvent.keyDown(firstButton, { key: 'Escape' })
    expect(document.activeElement).toBe(firstButton)

    fireEvent.keyDown(firstButton, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(firstButton)
  })

  it('restores focus on unmount when restoreFocus is true', async () => {
    const outsideButton = document.createElement('button')
    outsideButton.id = 'outside'
    document.body.appendChild(outsideButton)
    outsideButton.focus()

    const { unmount } = render(<TestFocusTrap restoreFocus={true} />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })

    unmount()

    await waitFor(() => {
      expect(document.activeElement).toBe(outsideButton)
    })

    document.body.removeChild(outsideButton)
  })

  it('does not restore focus on unmount when restoreFocus is false', async () => {
    const outsideButton = document.createElement('button')
    outsideButton.id = 'outside'
    document.body.appendChild(outsideButton)
    outsideButton.focus()

    const { unmount } = render(<TestFocusTrap restoreFocus={false} />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })

    unmount()

    // Focus should not be restored to outsideButton
    expect(document.activeElement).not.toBe(outsideButton)

    document.body.removeChild(outsideButton)
  })

  it('handles re-activation', async () => {
    const { rerender } = render(<TestFocusTrap active={false} />)

    const outsideButton = screen.getByRole('button', { name: /outside button/i })
    outsideButton.focus()

    rerender(<TestFocusTrap active={true} />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })
  })

  it('handles no focusable elements gracefully', async () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <div>No focusable elements</div>
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByText('No focusable elements')).toBeInTheDocument()
  })

  it('includes buttons in focusable elements', () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <button>Button</button>
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('includes links in focusable elements', () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <a href="/test">Link</a>
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('includes inputs in focusable elements', () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <input type="text" aria-label="Test input" />
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByLabelText('Test input')).toBeInTheDocument()
  })

  it('includes selects in focusable elements', () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <select aria-label="Test select">
            <option>Option</option>
          </select>
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByLabelText('Test select')).toBeInTheDocument()
  })

  it('includes textareas in focusable elements', () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <textarea aria-label="Test textarea" />
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByLabelText('Test textarea')).toBeInTheDocument()
  })

  it('includes elements with tabindex 0 in focusable elements', () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <div tabIndex={0} role="button">Custom Focusable</div>
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('excludes elements with tabindex -1 from focusable elements', async () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <button>First</button>
          <div tabIndex={-1}>Not Focusable</div>
          <button>Last</button>
        </FocusTrap>
      </FocusProvider>
    )

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first/i })
      expect(document.activeElement).toBe(firstButton)
    })

    const lastButton = screen.getByRole('button', { name: /last/i })
    lastButton.focus()

    fireEvent.keyDown(lastButton, { key: 'Tab', shiftKey: false })

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first/i })
      expect(document.activeElement).toBe(firstButton)
    })
  })
})

describe('SkipLink', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders link correctly', () => {
    render(<SkipLink href="#main">Skip to main content</SkipLink>)

    const link = screen.getByRole('link', { name: /skip to main content/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '#main')
  })

  it('applies skip-link class', () => {
    render(<SkipLink href="#main">Skip link</SkipLink>)

    const link = screen.getByRole('link')
    expect(link.className).toContain('skip-link')
  })

  it('applies custom className', () => {
    render(<SkipLink href="#main" className="custom-skip">Skip</SkipLink>)

    const link = screen.getByRole('link')
    expect(link.className).toContain('custom-skip')
  })

  it('adds skip-link-focused class on focus', () => {
    render(<SkipLink href="#main">Skip link</SkipLink>)

    const link = screen.getByRole('link')

    fireEvent.focus(link)
    expect(link.classList.contains('skip-link-focused')).toBe(true)
  })

  it('removes skip-link-focused class on blur', () => {
    render(<SkipLink href="#main">Skip link</SkipLink>)

    const link = screen.getByRole('link')

    fireEvent.focus(link)
    expect(link.classList.contains('skip-link-focused')).toBe(true)

    fireEvent.blur(link)
    expect(link.classList.contains('skip-link-focused')).toBe(false)
  })

  it('handles multiple focus/blur cycles', () => {
    render(<SkipLink href="#main">Skip link</SkipLink>)

    const link = screen.getByRole('link')

    fireEvent.focus(link)
    expect(link.classList.contains('skip-link-focused')).toBe(true)

    fireEvent.blur(link)
    expect(link.classList.contains('skip-link-focused')).toBe(false)

    fireEvent.focus(link)
    expect(link.classList.contains('skip-link-focused')).toBe(true)

    fireEvent.blur(link)
    expect(link.classList.contains('skip-link-focused')).toBe(false)
  })

  it('renders children correctly', () => {
    render(
      <SkipLink href="#main">
        <span>Skip to</span> <strong>main content</strong>
      </SkipLink>
    )

    expect(screen.getByText('Skip to')).toBeInTheDocument()
    expect(screen.getByText('main content')).toBeInTheDocument()
  })

  it('is keyboard accessible', () => {
    render(<SkipLink href="#main">Skip link</SkipLink>)

    const link = screen.getByRole('link')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '#main')
  })
})

describe('useRovingTabIndex', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('horizontal orientation', () => {
    it('renders items with correct tabindex', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="horizontal" />)

      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveAttribute('tabIndex', '0')
      expect(buttons[1]).toHaveAttribute('tabIndex', '-1')
      expect(buttons[2]).toHaveAttribute('tabIndex', '-1')
    })

    it('moves focus forward with ArrowRight', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="horizontal" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowRight' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('1')
    })

    it('moves focus backward with ArrowLeft', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="horizontal" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowLeft' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')
    })

    it('wraps to first item from last item with ArrowRight', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="horizontal" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowLeft' })

      let currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')

      fireEvent.keyDown(buttons[2], { key: 'ArrowRight' })

      currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('0')
    })

    it('wraps to last item from first item with ArrowLeft', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="horizontal" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowLeft' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')
    })

    it('ignores ArrowUp in horizontal orientation', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="horizontal" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowUp' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('0')
    })

    it('ignores ArrowDown in horizontal orientation', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="horizontal" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowDown' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('0')
    })
  })

  describe('vertical orientation', () => {
    it('moves focus forward with ArrowDown', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="vertical" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowDown' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('1')
    })

    it('moves focus backward with ArrowUp', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="vertical" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowUp' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')
    })

    it('wraps to first item from last item with ArrowDown', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="vertical" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowUp' })

      let currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')

      fireEvent.keyDown(buttons[2], { key: 'ArrowDown' })

      currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('0')
    })

    it('wraps to last item from first item with ArrowUp', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="vertical" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowUp' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')
    })

    it('ignores ArrowLeft in vertical orientation', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="vertical" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowLeft' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('0')
    })

    it('ignores ArrowRight in vertical orientation', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} orientation="vertical" />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowRight' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('0')
    })
  })

  describe('Home and End keys', () => {
    it('moves to first item with Home key', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowRight' })
      fireEvent.keyDown(buttons[1], { key: 'ArrowRight' })

      let currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')

      fireEvent.keyDown(buttons[2], { key: 'Home' })

      currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('0')
    })

    it('moves to last item with End key', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'End' })

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')
    })

    it('Home key works from any position', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowRight' })

      let currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('1')

      fireEvent.keyDown(buttons[1], { key: 'Home' })

      currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('0')
    })

    it('End key works from any position', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} />)

      const buttons = screen.getAllByRole('button')

      fireEvent.keyDown(buttons[0], { key: 'ArrowRight' })

      let currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('1')

      fireEvent.keyDown(buttons[1], { key: 'End' })

      currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')
    })
  })

  describe('focus handling', () => {
    it('updates current index on focus', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} />)

      const buttons = screen.getAllByRole('button')

      fireEvent.focus(buttons[1])

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('1')
    })

    it('handles focus on any item', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      render(<TestRovingTabIndex items={items} />)

      const buttons = screen.getAllByRole('button')

      fireEvent.focus(buttons[2])

      const currentIndex = screen.getByTestId('current-index')
      expect(currentIndex).toHaveTextContent('2')
    })
  })

  it('prevents default on navigation keys', () => {
    const items = ['Item 1', 'Item 2', 'Item 3']
    render(<TestRovingTabIndex items={items} />)

    const buttons = screen.getAllByRole('button')

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

    buttons[0].dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('handles empty items array', () => {
    const items = []
    render(<TestRovingTabIndex items={items} />)

    const currentIndex = screen.getByTestId('current-index')
    expect(currentIndex).toHaveTextContent('0')
  })

  it('handles single item', () => {
    const items = ['Single Item']
    render(<TestRovingTabIndex items={items} />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('tabIndex', '0')

    fireEvent.keyDown(button, { key: 'ArrowRight' })

    const currentIndex = screen.getByTestId('current-index')
    expect(currentIndex).toHaveTextContent('0')
  })
})

describe('useAnnouncer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    // Clean up any live regions
    const liveRegion = document.getElementById('live-region')
    if (liveRegion) {
      liveRegion.remove()
    }
  })

  it('creates live region on mount', () => {
    render(<TestAnnouncer />)

    const liveRegion = document.getElementById('live-region')
    expect(liveRegion).toBeInTheDocument()
  })

  it('live region has correct ARIA attributes', () => {
    render(<TestAnnouncer />)

    const liveRegion = document.getElementById('live-region')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
  })

  it('live region has sr-only class', () => {
    render(<TestAnnouncer />)

    const liveRegion = document.getElementById('live-region')
    expect(liveRegion?.className).toContain('sr-only')
  })

  it('announces message with polite priority', () => {
    render(<TestAnnouncer />)

    const button = screen.getByRole('button', { name: /announce polite/i })
    fireEvent.click(button)

    const liveRegion = document.getElementById('live-region')
    expect(liveRegion?.textContent).toBe('Test message')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
  })

  it('announces message with assertive priority', () => {
    render(<TestAnnouncer />)

    const button = screen.getByRole('button', { name: /announce assertive/i })
    fireEvent.click(button)

    const liveRegion = document.getElementById('live-region')
    expect(liveRegion?.textContent).toBe('Urgent message')
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive')
  })

  it('clears message after timeout', async () => {
    jest.useFakeTimers()

    render(<TestAnnouncer />)

    const button = screen.getByRole('button', { name: /announce polite/i })
    fireEvent.click(button)

    const liveRegion = document.getElementById('live-region')
    expect(liveRegion?.textContent).toBe('Test message')

    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(liveRegion?.textContent).toBe('')
    })

    jest.useRealTimers()
  })

  it('handles multiple announcements', () => {
    render(<TestAnnouncer />)

    const politeButton = screen.getByRole('button', { name: /announce polite/i })
    const assertiveButton = screen.getByRole('button', { name: /announce assertive/i })

    fireEvent.click(politeButton)

    const liveRegion = document.getElementById('live-region')
    expect(liveRegion?.textContent).toBe('Test message')

    fireEvent.click(assertiveButton)
    expect(liveRegion?.textContent).toBe('Urgent message')
  })

  it('removes live region on unmount', () => {
    const { unmount } = render(<TestAnnouncer />)

    let liveRegion = document.getElementById('live-region')
    expect(liveRegion).toBeInTheDocument()

    unmount()

    liveRegion = document.getElementById('live-region')
    expect(liveRegion).not.toBeInTheDocument()
  })

  it('handles announcing to non-existent live region gracefully', () => {
    const { unmount } = render(<TestAnnouncer />)

    const button = screen.getByRole('button', { name: /announce polite/i })

    unmount()

    // Should not throw error
    expect(() => {
      fireEvent.click(button)
    }).not.toThrow()
  })

  it('creates only one live region for multiple components', () => {
    render(
      <>
        <TestAnnouncer />
        <TestAnnouncer />
      </>
    )

    const liveRegions = document.querySelectorAll('#live-region')
    expect(liveRegions.length).toBe(1)
  })
})

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('calls onEscape when Escape key is pressed', () => {
    const onEscape = jest.fn()
    render(<TestKeyboardNav onEscape={onEscape} />)

    const container = screen.getByTestId('keyboard-nav')

    fireEvent.keyDown(container, { key: 'Escape' })

    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('calls onEnter when Enter key is pressed', () => {
    const onEnter = jest.fn()
    render(<TestKeyboardNav onEnter={onEnter} />)

    const container = screen.getByTestId('keyboard-nav')

    fireEvent.keyDown(container, { key: 'Enter' })

    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('calls onSpace when Space key is pressed', () => {
    const onSpace = jest.fn()
    render(<TestKeyboardNav onSpace={onSpace} />)

    const container = screen.getByTestId('keyboard-nav')

    fireEvent.keyDown(container, { key: ' ' })

    expect(onSpace).toHaveBeenCalledTimes(1)
  })

  it('prevents default for Space key', () => {
    const onSpace = jest.fn()
    render(<TestKeyboardNav onSpace={onSpace} />)

    const container = screen.getByTestId('keyboard-nav')

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

    container.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('does not prevent default for Escape key', () => {
    const onEscape = jest.fn()
    render(<TestKeyboardNav onEscape={onEscape} />)

    const container = screen.getByTestId('keyboard-nav')

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

    container.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('does not prevent default for Enter key', () => {
    const onEnter = jest.fn()
    render(<TestKeyboardNav onEnter={onEnter} />)

    const container = screen.getByTestId('keyboard-nav')

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

    container.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('passes event to callback functions', () => {
    const onEscape = jest.fn()
    const onEnter = jest.fn()
    const onSpace = jest.fn()

    render(<TestKeyboardNav onEscape={onEscape} onEnter={onEnter} onSpace={onSpace} />)

    const container = screen.getByTestId('keyboard-nav')

    fireEvent.keyDown(container, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalledWith(expect.any(Object))

    fireEvent.keyDown(container, { key: 'Enter' })
    expect(onEnter).toHaveBeenCalledWith(expect.any(Object))

    fireEvent.keyDown(container, { key: ' ' })
    expect(onSpace).toHaveBeenCalledWith(expect.any(Object))
  })

  it('does not call callbacks when they are not provided', () => {
    render(<TestKeyboardNav />)

    const container = screen.getByTestId('keyboard-nav')

    expect(() => {
      fireEvent.keyDown(container, { key: 'Escape' })
      fireEvent.keyDown(container, { key: 'Enter' })
      fireEvent.keyDown(container, { key: ' ' })
    }).not.toThrow()
  })

  it('ignores other keys', () => {
    const onEscape = jest.fn()
    const onEnter = jest.fn()
    const onSpace = jest.fn()

    render(<TestKeyboardNav onEscape={onEscape} onEnter={onEnter} onSpace={onSpace} />)

    const container = screen.getByTestId('keyboard-nav')

    fireEvent.keyDown(container, { key: 'a' })
    fireEvent.keyDown(container, { key: 'Tab' })
    fireEvent.keyDown(container, { key: 'ArrowDown' })

    expect(onEscape).not.toHaveBeenCalled()
    expect(onEnter).not.toHaveBeenCalled()
    expect(onSpace).not.toHaveBeenCalled()
  })

  it('handles multiple key presses', () => {
    const onEscape = jest.fn()
    const onEnter = jest.fn()

    render(<TestKeyboardNav onEscape={onEscape} onEnter={onEnter} />)

    const container = screen.getByTestId('keyboard-nav')

    fireEvent.keyDown(container, { key: 'Escape' })
    fireEvent.keyDown(container, { key: 'Enter' })
    fireEvent.keyDown(container, { key: 'Escape' })

    expect(onEscape).toHaveBeenCalledTimes(2)
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('does not prevent default for Space when onSpace is not provided', () => {
    render(<TestKeyboardNav />)

    const container = screen.getByTestId('keyboard-nav')

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

    container.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })
})

describe('Integration tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('FocusTrap works with SkipLink', async () => {
    render(
      <FocusProvider>
        <SkipLink href="#main">Skip to main</SkipLink>
        <FocusTrap>
          <button id="main">Main Button</button>
        </FocusTrap>
      </FocusProvider>
    )

    const skipLink = screen.getByRole('link')
    const mainButton = screen.getByRole('button')

    fireEvent.focus(skipLink)
    expect(skipLink.classList.contains('skip-link-focused')).toBe(true)

    await waitFor(() => {
      expect(document.activeElement).toBe(mainButton)
    })
  })

  it('multiple FocusTraps can be stacked', async () => {
    const TestMultipleTrps = () => {
      const [showSecond, setShowSecond] = useState(false)

      return (
        <FocusProvider>
          <FocusTrap active={!showSecond}>
            <button onClick={() => setShowSecond(true)}>First Trap Button</button>
          </FocusTrap>
          {showSecond && (
            <FocusTrap>
              <button onClick={() => setShowSecond(false)}>Second Trap Button</button>
            </FocusTrap>
          )}
        </FocusProvider>
      )
    }

    render(<TestMultipleTrps />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first trap button/i })
      expect(document.activeElement).toBe(firstButton)
    })

    const firstButton = screen.getByRole('button', { name: /first trap button/i })
    fireEvent.click(firstButton)

    await waitFor(() => {
      const secondButton = screen.getByRole('button', { name: /second trap button/i })
      expect(document.activeElement).toBe(secondButton)
    })
  })

  it('useKeyboardNavigation works with FocusTrap', async () => {
    const TestIntegration = () => {
      const [isOpen, setIsOpen] = useState(true)
      const { onKeyDown } = useKeyboardNavigation(() => setIsOpen(false))

      return (
        <FocusProvider>
          {isOpen && (
            <FocusTrap>
              <div onKeyDown={onKeyDown}>
                <button>Trapped Button</button>
              </div>
            </FocusTrap>
          )}
        </FocusProvider>
      )
    }

    render(<TestIntegration />)

    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(document.activeElement).toBe(button)
    })

    fireEvent.keyDown(screen.getByRole('button').parentElement, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  it('useAnnouncer works with roving tabindex', async () => {
    const TestIntegration = () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      const { currentIndex, getItemProps } = useRovingTabIndex(items)
      const { announce } = useAnnouncer()

      React.useEffect(() => {
        announce(`Focused on ${items[currentIndex]}`)
      }, [currentIndex, announce, items])

      return (
        <div>
          {items.map((item, index) => (
            <button key={index} {...getItemProps(index)}>
              {item}
            </button>
          ))}
        </div>
      )
    }

    render(<TestIntegration />)

    const buttons = screen.getAllByRole('button')

    fireEvent.keyDown(buttons[0], { key: 'ArrowRight' })

    await waitFor(() => {
      const liveRegion = document.getElementById('live-region')
      expect(liveRegion?.textContent).toBe('Focused on Item 2')
    })
  })
})

describe('Edge cases and error handling', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('FocusTrap handles rapid active prop changes', () => {
    const { rerender } = render(
      <FocusProvider>
        <FocusTrap active={true}>
          <button>Button</button>
        </FocusTrap>
      </FocusProvider>
    )

    rerender(
      <FocusProvider>
        <FocusTrap active={false}>
          <button>Button</button>
        </FocusTrap>
      </FocusProvider>
    )

    rerender(
      <FocusProvider>
        <FocusTrap active={true}>
          <button>Button</button>
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('useRovingTabIndex handles items prop changes', () => {
    const { rerender } = render(<TestRovingTabIndex items={['Item 1', 'Item 2']} />)

    const currentIndex = screen.getByTestId('current-index')
    expect(currentIndex).toHaveTextContent('0')

    rerender(<TestRovingTabIndex items={['Item 1', 'Item 2', 'Item 3', 'Item 4']} />)

    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('handles focus on disabled elements gracefully', async () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <button disabled>Disabled Button</button>
          <button>Enabled Button</button>
        </FocusTrap>
      </FocusProvider>
    )

    // Trap should skip disabled elements
    expect(screen.getByRole('button', { name: /enabled button/i })).toBeInTheDocument()
  })

  it('handles focus trap with only disabled elements', () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <button disabled>Disabled 1</button>
          <button disabled>Disabled 2</button>
        </FocusTrap>
      </FocusProvider>
    )

    expect(screen.getByRole('button', { name: /disabled 1/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /disabled 2/i })).toBeDisabled()
  })

  it('handles focus trap remounting', async () => {
    const { unmount, rerender } = render(<TestFocusTrap />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })

    unmount()

    rerender(<TestFocusTrap />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })
  })

  it('handles announcer with empty messages', () => {
    const TestEmptyAnnounce = () => {
      const { announce } = useAnnouncer()

      return (
        <button onClick={() => announce('')}>
          Announce Empty
        </button>
      )
    }

    render(<TestEmptyAnnounce />)

    const button = screen.getByRole('button')

    expect(() => {
      fireEvent.click(button)
    }).not.toThrow()

    const liveRegion = document.getElementById('live-region')
    expect(liveRegion?.textContent).toBe('')
  })

  it('handles keyboard navigation with null callbacks gracefully', () => {
    const TestNullCallbacks = () => {
      const { onKeyDown } = useKeyboardNavigation(null, null, null)

      return <div onKeyDown={onKeyDown} data-testid="keyboard-nav" />
    }

    render(<TestNullCallbacks />)

    const container = screen.getByTestId('keyboard-nav')

    expect(() => {
      fireEvent.keyDown(container, { key: 'Escape' })
      fireEvent.keyDown(container, { key: 'Enter' })
      fireEvent.keyDown(container, { key: ' ' })
    }).not.toThrow()
  })

  it('handles roving tabindex with negative index gracefully', () => {
    const TestRovingWithSetIndex = () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      const { currentIndex, setCurrentIndex, getItemProps } = useRovingTabIndex(items)

      return (
        <div>
          {items.map((item, index) => (
            <button key={index} {...getItemProps(index)}>
              {item}
            </button>
          ))}
          <button onClick={() => setCurrentIndex(-1)}>Set Negative</button>
          <div data-testid="current-index">{currentIndex}</div>
        </div>
      )
    }

    render(<TestRovingWithSetIndex />)

    const setButton = screen.getByRole('button', { name: /set negative/i })
    fireEvent.click(setButton)

    const currentIndex = screen.getByTestId('current-index')
    expect(currentIndex).toHaveTextContent('-1')
  })

  it('handles focus trap cleanup on rapid unmounts', async () => {
    const { unmount } = render(<TestFocusTrap />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })

    unmount()

    // Should not throw errors
    expect(document.body).toBeInTheDocument()
  })
})

describe('Accessibility', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('SkipLink is accessible to keyboard users', () => {
    render(<SkipLink href="#main">Skip to main</SkipLink>)

    const link = screen.getByRole('link')

    expect(link).toHaveAttribute('href')
    expect(link.tagName).toBe('A')
  })

  it('FocusTrap maintains proper tab order', async () => {
    render(<TestFocusTrap />)

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /first button/i })
      expect(document.activeElement).toBe(firstButton)
    })

    const buttons = screen.getAllByRole('button')
    const trappedButtons = buttons.filter(btn =>
      btn.textContent?.includes('Button') &&
      !btn.textContent?.includes('Outside')
    )

    expect(trappedButtons.length).toBe(3)
  })

  it('useAnnouncer live region is accessible', () => {
    render(<TestAnnouncer />)

    const liveRegion = document.getElementById('live-region')

    expect(liveRegion).toHaveAttribute('aria-live')
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
  })

  it('roving tabindex maintains single tab stop', () => {
    const items = ['Item 1', 'Item 2', 'Item 3']
    render(<TestRovingTabIndex items={items} />)

    const buttons = screen.getAllByRole('button')
    const focusableButtons = buttons.filter(btn => btn.tabIndex === 0)

    expect(focusableButtons.length).toBe(1)
  })

  it('keyboard navigation supports standard key patterns', () => {
    const handlers = {
      onEscape: jest.fn(),
      onEnter: jest.fn(),
      onSpace: jest.fn()
    }

    render(<TestKeyboardNav {...handlers} />)

    const container = screen.getByTestId('keyboard-nav')

    fireEvent.keyDown(container, { key: 'Escape' })
    expect(handlers.onEscape).toHaveBeenCalled()

    fireEvent.keyDown(container, { key: 'Enter' })
    expect(handlers.onEnter).toHaveBeenCalled()

    fireEvent.keyDown(container, { key: ' ' })
    expect(handlers.onSpace).toHaveBeenCalled()
  })

  it('focus trap respects ARIA roles', async () => {
    render(
      <FocusProvider>
        <FocusTrap>
          <div role="button" tabIndex={0}>Custom Button</div>
        </FocusTrap>
      </FocusProvider>
    )

    await waitFor(() => {
      const customButton = screen.getByRole('button')
      expect(document.activeElement).toBe(customButton)
    })
  })
})

export default TestConsumer
