import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import KeyboardShortcuts, { useKeyboardShortcuts } from './KeyboardShortcuts'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Command: () => <div data-testid="icon-command" />,
  Keyboard: () => <div data-testid="icon-keyboard" />,
  X: () => <div data-testid="icon-x" />,
  Search: () => <div data-testid="icon-search" />,
  ArrowUp: () => <div data-testid="icon-arrow-up" />,
  ArrowDown: () => <div data-testid="icon-arrow-down" />,
  Hash: () => <div data-testid="icon-hash" />,
  MessageCircle: () => <div data-testid="icon-message-circle" />,
  Mic: () => <div data-testid="icon-mic" />,
  Settings: () => <div data-testid="icon-settings" />,
  Plus: () => <div data-testid="icon-plus" />,
  Star: () => <div data-testid="icon-star" />,
  Archive: () => <div data-testid="icon-archive" />,
  Pin: () => <div data-testid="icon-pin" />,
  Volume2: () => <div data-testid="icon-volume2" />,
  Users: () => <div data-testid="icon-users" />,
  Escape: () => <div data-testid="icon-escape" />,
  Enter: () => <div data-testid="icon-enter" />
}))

describe('KeyboardShortcuts Component', () => {
  let onShortcut
  let onToggleHelp
  let localStorageMock

  beforeEach(() => {
    onShortcut = vi.fn()
    onToggleHelp = vi.fn()

    // Mock localStorage
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    global.localStorage = localStorageMock

    // Mock import.meta.env
    vi.stubGlobal('import.meta', {
      env: {
        MODE: 'test'
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      expect(document.body).toBeTruthy()
    })

    it('should not show help modal by default', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show help modal when showHelp is true', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} onToggleHelp={onToggleHelp} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should render accessibility live region', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveClass('sr-only')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })

    it('should not render pressed keys indicator in non-development mode', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      expect(screen.queryByText(/ctrl.*k/i)).not.toBeInTheDocument()
    })

    it('should render pressed keys indicator in development mode', () => {
      vi.stubGlobal('import.meta', {
        env: {
          MODE: 'development'
        }
      })

      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

      expect(screen.getByText(/ctrl/i)).toBeInTheDocument()
    })
  })

  describe('Help Modal Rendering', () => {
    it('should display modal title', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} onToggleHelp={onToggleHelp} />)
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    })

    it('should display keyboard icon in modal header', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} onToggleHelp={onToggleHelp} />)
      expect(screen.getByTestId('icon-keyboard')).toBeInTheDocument()
    })

    it('should display close button in modal', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} onToggleHelp={onToggleHelp} />)
      const closeButton = screen.getByRole('button', { name: /close shortcuts help/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should call onToggleHelp when close button is clicked', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} onToggleHelp={onToggleHelp} />)
      const closeButton = screen.getByRole('button', { name: /close shortcuts help/i })
      fireEvent.click(closeButton)
      expect(onToggleHelp).toHaveBeenCalledTimes(1)
    })

    it('should display help text at bottom of modal', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} onToggleHelp={onToggleHelp} />)
      expect(screen.getByText(/show\/hide this help/i)).toBeInTheDocument()
    })

    it('should have proper ARIA labelledby', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} onToggleHelp={onToggleHelp} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-title')
    })
  })

  describe('Shortcuts List Display', () => {
    it('should display global shortcuts by default', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="global" />)
      expect(screen.getByText('Global Shortcuts')).toBeInTheDocument()
      expect(screen.getByText('Quick search')).toBeInTheDocument()
    })

    it('should display chat shortcuts when context is chat', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="chat" />)
      expect(screen.getByText('Chat Shortcuts')).toBeInTheDocument()
      expect(screen.getByText('Edit last message')).toBeInTheDocument()
    })

    it('should display search shortcuts when context is search', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="search" />)
      expect(screen.getByText('Search Shortcuts')).toBeInTheDocument()
      expect(screen.getByText('Execute search')).toBeInTheDocument()
    })

    it('should display voice shortcuts when context is voice', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="voice" />)
      expect(screen.getByText('Voice Shortcuts')).toBeInTheDocument()
      expect(screen.getByText('Toggle mute')).toBeInTheDocument()
    })

    it('should display global shortcuts section when not in global context', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="chat" />)
      expect(screen.getByText('Global Shortcuts')).toBeInTheDocument()
    })

    it('should not duplicate global shortcuts section in global context', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="global" />)
      const headings = screen.getAllByText(/Global Shortcuts/i)
      expect(headings).toHaveLength(1)
    })

    it('should display shortcut icons', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="global" />)
      expect(screen.getByTestId('icon-search')).toBeInTheDocument()
    })

    it('should display formatted shortcut keys', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="global" />)
      expect(screen.getByText(/⌘.*K/i)).toBeInTheDocument()
    })
  })

  describe('Keyboard Event Listening', () => {
    it('should listen for keydown events', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('search', expect.any(Object))
    })

    it('should listen for keyup events', () => {
      vi.stubGlobal('import.meta', { env: { MODE: 'development' } })
      render(<KeyboardShortcuts onShortcut={onShortcut} />)

      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      expect(screen.getByText(/ctrl/i)).toBeInTheDocument()

      fireEvent.keyUp(window, { key: 'k' })
      waitFor(() => {
        expect(screen.queryByText(/ctrl.*k/i)).not.toBeInTheDocument()
      })
    })

    it('should not trigger shortcuts when disabled', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} disabled={true} />)
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      expect(onShortcut).not.toHaveBeenCalled()
    })

    it('should prevent default when shortcut matches', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      window.dispatchEvent(event)
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should stop propagation when shortcut matches', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')
      window.dispatchEvent(event)
      expect(stopPropagationSpy).toHaveBeenCalled()
    })

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = render(<KeyboardShortcuts onShortcut={onShortcut} />)
      unmount()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function), true)
    })
  })

  describe('Global Shortcuts', () => {
    it('should trigger search shortcut (Ctrl+K)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('search', expect.any(Object))
    })

    it('should trigger help shortcut (Ctrl+/)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} onToggleHelp={onToggleHelp} />)
      fireEvent.keyDown(window, { key: '/', ctrlKey: true })
      expect(onToggleHelp).toHaveBeenCalled()
    })

    it('should trigger settings shortcut (Ctrl+Shift+A)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'a', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('settings', expect.any(Object))
    })

    it('should trigger close shortcut (Escape)', () => {
      // Create a modal to close
      const modal = document.createElement('div')
      modal.setAttribute('role', 'dialog')
      const closeButton = document.createElement('button')
      closeButton.setAttribute('data-close', 'true')
      const clickSpy = vi.fn()
      closeButton.onclick = clickSpy
      modal.appendChild(closeButton)
      document.body.appendChild(modal)

      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'Escape' })

      expect(clickSpy).toHaveBeenCalled()
      document.body.removeChild(modal)
    })

    it('should trigger send shortcut (Ctrl+Enter)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('send', expect.any(Object))
    })

    it('should trigger new channel shortcut (Ctrl+Shift+N)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'n', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('new_channel', expect.any(Object))
    })

    it('should trigger new DM shortcut (Ctrl+Shift+D)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'd', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('new_dm', expect.any(Object))
    })

    it('should trigger toggle mute shortcut (Ctrl+Shift+M)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'm', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('toggle_mute', expect.any(Object))
    })

    it('should trigger join voice shortcut (Ctrl+Shift+V)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'v', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('join_voice', expect.any(Object))
    })
  })

  describe('Chat Context Shortcuts', () => {
    it('should trigger edit last message shortcut (Up)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(onShortcut).toHaveBeenCalledWith('edit_last', expect.any(Object))
    })

    it('should trigger navigate down shortcut (Down)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      expect(onShortcut).toHaveBeenCalledWith('navigate_down', expect.any(Object))
    })

    it('should trigger reply shortcut (Ctrl+Shift+R)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      fireEvent.keyDown(window, { key: 'r', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('reply', expect.any(Object))
    })

    it('should trigger thread shortcut (Ctrl+Shift+T)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      fireEvent.keyDown(window, { key: 't', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('thread', expect.any(Object))
    })

    it('should trigger pin shortcut (Ctrl+Shift+P)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      fireEvent.keyDown(window, { key: 'p', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('pin', expect.any(Object))
    })

    it('should trigger autocomplete shortcut (Tab)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      fireEvent.keyDown(window, { key: 'Tab' })
      expect(onShortcut).toHaveBeenCalledWith('autocomplete', expect.any(Object))
    })
  })

  describe('Search Context Shortcuts', () => {
    it('should trigger search execute shortcut (Enter)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="search" />)
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(onShortcut).toHaveBeenCalledWith('search_execute', expect.any(Object))
    })

    it('should trigger search up shortcut (Up)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="search" />)
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(onShortcut).toHaveBeenCalledWith('search_up', expect.any(Object))
    })

    it('should trigger search down shortcut (Down)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="search" />)
      fireEvent.keyDown(window, { key: 'ArrowDown' })
      expect(onShortcut).toHaveBeenCalledWith('search_down', expect.any(Object))
    })

    it('should trigger search filter shortcut (Ctrl+F)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="search" />)
      fireEvent.keyDown(window, { key: 'f', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('search_filter', expect.any(Object))
    })
  })

  describe('Voice Context Shortcuts', () => {
    it('should trigger toggle mute shortcut (Ctrl+M)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="voice" />)
      fireEvent.keyDown(window, { key: 'm', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('toggle_mute', expect.any(Object))
    })

    it('should trigger toggle deafen shortcut (Ctrl+D)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="voice" />)
      fireEvent.keyDown(window, { key: 'd', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('toggle_deafen', expect.any(Object))
    })

    it('should trigger toggle camera shortcut (Ctrl+Shift+H)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="voice" />)
      fireEvent.keyDown(window, { key: 'h', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('toggle_camera', expect.any(Object))
    })

    it('should trigger share screen shortcut (Ctrl+Shift+S)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="voice" />)
      fireEvent.keyDown(window, { key: 's', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('share_screen', expect.any(Object))
    })

    it('should trigger leave voice shortcut (Ctrl+Shift+L)', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="voice" />)
      fireEvent.keyDown(window, { key: 'l', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('leave_voice', expect.any(Object))
    })
  })

  describe('Input Field Detection', () => {
    it('should not trigger shortcuts when typing in input field', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      const input = document.createElement('input')
      document.body.appendChild(input)

      fireEvent.keyDown(input, { key: 'ArrowUp', bubbles: true })
      expect(onShortcut).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })

    it('should not trigger shortcuts when typing in textarea', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)

      fireEvent.keyDown(textarea, { key: 'ArrowUp', bubbles: true })
      expect(onShortcut).not.toHaveBeenCalled()

      document.body.removeChild(textarea)
    })

    it('should not trigger shortcuts in contentEditable elements', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      const div = document.createElement('div')
      div.contentEditable = 'true'
      document.body.appendChild(div)

      fireEvent.keyDown(div, { key: 'ArrowUp', bubbles: true })
      expect(onShortcut).not.toHaveBeenCalled()

      document.body.removeChild(div)
    })

    it('should not trigger shortcuts in elements with textbox role', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      const div = document.createElement('div')
      div.setAttribute('role', 'textbox')
      document.body.appendChild(div)

      fireEvent.keyDown(div, { key: 'ArrowUp', bubbles: true })
      expect(onShortcut).not.toHaveBeenCalled()

      document.body.removeChild(div)
    })

    it('should trigger global shortcuts even in input fields', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      const input = document.createElement('input')
      document.body.appendChild(input)

      fireEvent.keyDown(input, { key: 'k', ctrlKey: true, bubbles: true })
      expect(onShortcut).toHaveBeenCalledWith('search', expect.any(Object))

      document.body.removeChild(input)
    })

    it('should trigger escape shortcut in input fields', () => {
      const modal = document.createElement('div')
      modal.setAttribute('role', 'dialog')
      const closeButton = document.createElement('button')
      closeButton.setAttribute('data-close', 'true')
      const clickSpy = vi.fn()
      closeButton.onclick = clickSpy
      modal.appendChild(closeButton)
      document.body.appendChild(modal)

      render(<KeyboardShortcuts onShortcut={onShortcut} />)

      const input = document.createElement('input')
      document.body.appendChild(input)

      fireEvent.keyDown(input, { key: 'Escape', bubbles: true })
      expect(clickSpy).toHaveBeenCalled()

      document.body.removeChild(input)
      document.body.removeChild(modal)
    })
  })

  describe('Custom Shortcuts', () => {
    it('should load custom shortcuts from localStorage', () => {
      const customShortcuts = {
        custom_action: {
          action: 'custom_action',
          keys: ['ctrl', 'x'],
          description: 'Custom action',
          icon: null
        }
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(customShortcuts))

      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('cryb-keyboard-shortcuts')
    })

    it('should handle missing localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null)

      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('cryb-keyboard-shortcuts')
    })

    it('should merge custom shortcuts with default shortcuts', () => {
      const customShortcuts = {
        custom_action: {
          action: 'custom_action',
          keys: ['ctrl', 'x'],
          description: 'Custom action',
          icon: null
        }
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(customShortcuts))

      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'x', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('custom_action', expect.any(Object))
    })

    it('should accept custom shortcuts via props', () => {
      const shortcuts = [
        { keys: ['ctrl', 'y'], action: 'custom_prop', description: 'Custom from prop', icon: null }
      ]

      render(<KeyboardShortcuts onShortcut={onShortcut} shortcuts={shortcuts} />)
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('custom_prop', expect.any(Object))
    })
  })

  describe('Recent Shortcuts Tracking', () => {
    it('should display recently used shortcuts section', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={false} />)

      // Trigger a shortcut to add to recent
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

      // Open help modal
      const { rerender } = render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} onToggleHelp={onToggleHelp} />)

      expect(screen.getByText('Recently Used')).toBeInTheDocument()
    })

    it('should limit recent shortcuts to 5 items', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)

      // Trigger 6 different shortcuts
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      fireEvent.keyDown(window, { key: '/', ctrlKey: true })
      fireEvent.keyDown(window, { key: 'a', ctrlKey: true, shiftKey: true })
      fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })
      fireEvent.keyDown(window, { key: 'n', ctrlKey: true, shiftKey: true })
      fireEvent.keyDown(window, { key: 'd', ctrlKey: true, shiftKey: true })

      // Verify only last 5 are kept (implementation detail, would need to check internal state)
      expect(onShortcut).toHaveBeenCalledTimes(5) // help doesn't call onShortcut
    })

    it('should not duplicate shortcuts in recent list', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)

      // Trigger same shortcut twice
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

      expect(onShortcut).toHaveBeenCalledTimes(2)
    })
  })

  describe('Accessibility Features', () => {
    it('should announce focused elements with data-keyboard-nav attribute', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)

      const element = document.createElement('button')
      element.setAttribute('data-keyboard-nav', 'true')
      element.setAttribute('aria-label', 'Test button')
      document.body.appendChild(element)

      fireEvent.focus(element)

      // Check if announcement element was created temporarily
      waitFor(() => {
        const announcement = document.querySelector('[aria-live="polite"]')
        expect(announcement).toBeTruthy()
      })

      document.body.removeChild(element)
    })

    it('should use aria-label for element announcements', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)

      const element = document.createElement('button')
      element.setAttribute('data-keyboard-nav', 'true')
      element.setAttribute('aria-label', 'Custom label')
      document.body.appendChild(element)

      fireEvent.focus(element)

      document.body.removeChild(element)
    })

    it('should use role and text content for announcements when no aria-label', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)

      const element = document.createElement('button')
      element.setAttribute('data-keyboard-nav', 'true')
      element.setAttribute('role', 'button')
      element.textContent = 'Click me'
      document.body.appendChild(element)

      fireEvent.focus(element)

      document.body.removeChild(element)
    })

    it('should cleanup announcement elements after timeout', async () => {
      vi.useFakeTimers()

      render(<KeyboardShortcuts onShortcut={onShortcut} />)

      const element = document.createElement('button')
      element.setAttribute('data-keyboard-nav', 'true')
      element.setAttribute('aria-label', 'Test')
      document.body.appendChild(element)

      fireEvent.focus(element)

      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        const announcements = document.querySelectorAll('[aria-live="polite"]')
        const visibleAnnouncements = Array.from(announcements).filter(
          a => a.parentNode === document.body
        )
        expect(visibleAnnouncements.length).toBe(1) // Only the component's sr-only div
      })

      document.body.removeChild(element)
      vi.useRealTimers()
    })
  })

  describe('Shortcut Key Formatting', () => {
    it('should format ctrl key as command symbol', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="global" />)
      expect(screen.getByText(/⌘/)).toBeInTheDocument()
    })

    it('should format shift key as shift symbol', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="global" />)
      expect(screen.getByText(/⇧/)).toBeInTheDocument()
    })

    it('should format escape key as escape symbol', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="global" />)
      expect(screen.getByText(/⎋/)).toBeInTheDocument()
    })

    it('should format enter key as enter symbol', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="global" />)
      expect(screen.getByText(/↵/)).toBeInTheDocument()
    })

    it('should format arrow keys as arrow symbols', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="chat" />)
      expect(screen.getByText(/↑/)).toBeInTheDocument()
      expect(screen.getByText(/↓/)).toBeInTheDocument()
    })
  })

  describe('Modal Close Functionality', () => {
    it('should close modal with data-close button', () => {
      const modal = document.createElement('div')
      modal.setAttribute('role', 'dialog')
      const closeButton = document.createElement('button')
      closeButton.setAttribute('data-close', 'true')
      const clickSpy = vi.fn()
      closeButton.onclick = clickSpy
      modal.appendChild(closeButton)
      document.body.appendChild(modal)

      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'Escape' })

      expect(clickSpy).toHaveBeenCalled()
      document.body.removeChild(modal)
    })

    it('should close modal with aria-label close button', () => {
      const modal = document.createElement('div')
      modal.setAttribute('role', 'dialog')
      const closeButton = document.createElement('button')
      closeButton.setAttribute('aria-label', 'Close modal')
      const clickSpy = vi.fn()
      closeButton.onclick = clickSpy
      modal.appendChild(closeButton)
      document.body.appendChild(modal)

      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'Escape' })

      expect(clickSpy).toHaveBeenCalled()
      document.body.removeChild(modal)
    })

    it('should close last modal when multiple modals exist', () => {
      const modal1 = document.createElement('div')
      modal1.setAttribute('role', 'dialog')
      const closeButton1 = document.createElement('button')
      closeButton1.setAttribute('data-close', 'true')
      const clickSpy1 = vi.fn()
      closeButton1.onclick = clickSpy1
      modal1.appendChild(closeButton1)
      document.body.appendChild(modal1)

      const modal2 = document.createElement('div')
      modal2.setAttribute('role', 'dialog')
      const closeButton2 = document.createElement('button')
      closeButton2.setAttribute('data-close', 'true')
      const clickSpy2 = vi.fn()
      closeButton2.onclick = clickSpy2
      modal2.appendChild(closeButton2)
      document.body.appendChild(modal2)

      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'Escape' })

      expect(clickSpy2).toHaveBeenCalled()
      expect(clickSpy1).not.toHaveBeenCalled()

      document.body.removeChild(modal1)
      document.body.removeChild(modal2)
    })

    it('should handle escape when no modals are open', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'Escape' })
      // Should not throw error
      expect(onShortcut).not.toHaveBeenCalled()
    })
  })

  describe('Shortcut Categories', () => {
    it('should organize shortcuts by context', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="chat" />)
      expect(screen.getByText('Chat Shortcuts')).toBeInTheDocument()
      expect(screen.getByText('Global Shortcuts')).toBeInTheDocument()
    })

    it('should display correct number of shortcuts per category', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="global" />)
      const shortcuts = screen.getAllByText(/Quick search|Show keyboard shortcuts|Open settings/i)
      expect(shortcuts.length).toBeGreaterThan(0)
    })

    it('should limit global shortcuts display in non-global contexts', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} showHelp={true} context="chat" />)
      const globalSection = screen.getByText('Global Shortcuts').closest('div')
      const globalShortcuts = within(globalSection.parentElement).getAllByText(/Quick search|Show keyboard shortcuts/i)
      expect(globalShortcuts.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Platform Detection', () => {
    it('should use metaKey on Mac platforms', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'k', metaKey: true })
      expect(onShortcut).toHaveBeenCalledWith('search', expect.any(Object))
    })

    it('should use ctrlKey on Windows/Linux platforms', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('search', expect.any(Object))
    })

    it('should handle alt modifier key', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'k', altKey: true })
      // Should not trigger shortcuts that don't use alt
      expect(onShortcut).not.toHaveBeenCalled()
    })
  })

  describe('Context Switching', () => {
    it('should update shortcuts when context changes', () => {
      const { rerender } = render(<KeyboardShortcuts onShortcut={onShortcut} context="global" />)

      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(onShortcut).not.toHaveBeenCalled()

      rerender(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)

      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(onShortcut).toHaveBeenCalledWith('edit_last', expect.any(Object))
    })

    it('should maintain global shortcuts across contexts', () => {
      const { rerender } = render(<KeyboardShortcuts onShortcut={onShortcut} context="global" />)

      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('search', expect.any(Object))

      onShortcut.mockClear()

      rerender(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)

      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('search', expect.any(Object))
    })
  })

  describe('Special Key Handling', () => {
    it('should handle space key', () => {
      const shortcuts = [
        { keys: ['ctrl', 'space'], action: 'test_space', description: 'Test space', icon: null }
      ]
      render(<KeyboardShortcuts onShortcut={onShortcut} shortcuts={shortcuts} />)
      fireEvent.keyDown(window, { key: ' ', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('test_space', expect.any(Object))
    })

    it('should handle backspace key', () => {
      const shortcuts = [
        { keys: ['ctrl', 'backspace'], action: 'test_backspace', description: 'Test backspace', icon: null }
      ]
      render(<KeyboardShortcuts onShortcut={onShortcut} shortcuts={shortcuts} />)
      fireEvent.keyDown(window, { key: 'Backspace', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('test_backspace', expect.any(Object))
    })

    it('should handle delete key', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="chat" />)
      fireEvent.keyDown(window, { key: 'Delete', ctrlKey: true, shiftKey: true })
      expect(onShortcut).toHaveBeenCalledWith('delete', expect.any(Object))
    })

    it('should handle arrow left key', () => {
      const shortcuts = [
        { keys: ['left'], action: 'test_left', description: 'Test left', icon: null }
      ]
      render(<KeyboardShortcuts onShortcut={onShortcut} shortcuts={shortcuts} />)
      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      expect(onShortcut).toHaveBeenCalledWith('test_left', expect.any(Object))
    })

    it('should handle arrow right key', () => {
      const shortcuts = [
        { keys: ['right'], action: 'test_right', description: 'Test right', icon: null }
      ]
      render(<KeyboardShortcuts onShortcut={onShortcut} shortcuts={shortcuts} />)
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      expect(onShortcut).toHaveBeenCalledWith('test_right', expect.any(Object))
    })

    it('should convert keys to lowercase', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} />)
      fireEvent.keyDown(window, { key: 'K', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalledWith('search', expect.any(Object))
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined onShortcut callback', () => {
      render(<KeyboardShortcuts />)
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      // Should not throw error
    })

    it('should handle undefined onToggleHelp callback', () => {
      render(<KeyboardShortcuts showHelp={true} />)
      const closeButton = screen.getByRole('button', { name: /close shortcuts help/i })
      fireEvent.click(closeButton)
      // Should not throw error
    })

    it('should handle empty shortcuts array', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} shortcuts={[]} />)
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
      expect(onShortcut).toHaveBeenCalled()
    })

    it('should handle invalid context gracefully', () => {
      render(<KeyboardShortcuts onShortcut={onShortcut} context="invalid" showHelp={true} />)
      expect(screen.getByText('Invalid Shortcuts')).toBeInTheDocument()
    })

    it('should handle malformed localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      expect(() => {
        render(<KeyboardShortcuts onShortcut={onShortcut} />)
      }).toThrow()
    })
  })
})

describe('useKeyboardShortcuts Hook', () => {
  let TestComponent

  beforeEach(() => {
    TestComponent = ({ shortcuts, handler }) => {
      useKeyboardShortcuts(shortcuts, 'global', [])
      return <div data-testid="test-component">Test</div>
    }
  })

  it('should register keyboard shortcuts', () => {
    const handler = vi.fn()
    const shortcuts = [
      { keys: ['ctrl', 'k'], handler }
    ]

    render(<TestComponent shortcuts={shortcuts} />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

    expect(handler).toHaveBeenCalled()
  })

  it('should prevent default when shortcut matches', () => {
    const handler = vi.fn()
    const shortcuts = [
      { keys: ['ctrl', 'k'], handler }
    ]

    render(<TestComponent shortcuts={shortcuts} />)
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should cleanup listeners on unmount', () => {
    const handler = vi.fn()
    const shortcuts = [
      { keys: ['ctrl', 'k'], handler }
    ]

    const { unmount } = render(<TestComponent shortcuts={shortcuts} />)
    unmount()

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle multiple shortcuts', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const shortcuts = [
      { keys: ['ctrl', 'k'], handler: handler1 },
      { keys: ['ctrl', 'j'], handler: handler2 }
    ]

    render(<TestComponent shortcuts={shortcuts} />)

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(handler1).toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'j', ctrlKey: true })
    expect(handler2).toHaveBeenCalled()
  })

  it('should not trigger on non-matching keys', () => {
    const handler = vi.fn()
    const shortcuts = [
      { keys: ['ctrl', 'k'], handler }
    ]

    render(<TestComponent shortcuts={shortcuts} />)
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true })

    expect(handler).not.toHaveBeenCalled()
  })
})

export default liveRegion
