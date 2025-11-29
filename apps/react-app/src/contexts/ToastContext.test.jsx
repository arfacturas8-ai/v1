import React from 'react'
import { renderHook, act, waitFor, render, screen, fireEvent } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastContext'

// Wrapper for hooks
const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial State', () => {
    test('should provide initial empty toasts array', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      expect(result.current.toasts).toEqual([])
    })

    test('should provide all toast methods', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      expect(typeof result.current.showToast).toBe('function')
      expect(typeof result.current.showSuccess).toBe('function')
      expect(typeof result.current.showError).toBe('function')
      expect(typeof result.current.showWarning).toBe('function')
      expect(typeof result.current.showInfo).toBe('function')
      expect(typeof result.current.removeToast).toBe('function')
      expect(typeof result.current.clearAllToasts).toBe('function')
    })
  })

  describe('showToast', () => {
    test('should create a toast with message', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('Test message')
    })

    test('should create toast with default info type', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message')
      })

      expect(result.current.toasts[0].type).toBe('info')
    })

    test('should create toast with custom type', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message', 'success')
      })

      expect(result.current.toasts[0].type).toBe('success')
    })

    test('should create toast with default duration of 5000ms', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    test('should create toast with custom duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message', 'info', 3000)
      })

      expect(result.current.toasts[0].duration).toBe(3000)
    })

    test('should generate unique ID for each toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Toast 1')
        result.current.showToast('Toast 2')
      })

      expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id)
    })

    test('should add timestamp to toast', () => {
      const now = Date.now()
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message')
      })

      expect(result.current.toasts[0].timestamp).toBeGreaterThanOrEqual(now)
    })

    test('should return toast ID', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let toastId
      act(() => {
        toastId = result.current.showToast('Test message')
      })

      expect(toastId).toBeDefined()
      expect(typeof toastId).toBe('string')
      expect(result.current.toasts[0].id).toBe(toastId)
    })

    test('should auto-remove toast after duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message', 'info', 1000)
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    test('should not auto-remove toast when duration is 0', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message', 'info', 0)
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(10000)
      })

      expect(result.current.toasts).toHaveLength(1)
    })

    test('should not auto-remove toast when duration is negative', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message', 'info', -1)
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(10000)
      })

      expect(result.current.toasts).toHaveLength(1)
    })

    test('should add multiple toasts to queue', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Toast 1')
        result.current.showToast('Toast 2')
        result.current.showToast('Toast 3')
      })

      expect(result.current.toasts).toHaveLength(3)
    })
  })

  describe('showSuccess', () => {
    test('should create success toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showSuccess('Success message')
      })

      expect(result.current.toasts[0].type).toBe('success')
      expect(result.current.toasts[0].message).toBe('Success message')
    })

    test('should use default duration for success toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showSuccess('Success message')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    test('should accept custom duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showSuccess('Success message', 3000)
      })

      expect(result.current.toasts[0].duration).toBe(3000)
    })
  })

  describe('showError', () => {
    test('should create error toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showError('Error message')
      })

      expect(result.current.toasts[0].type).toBe('error')
      expect(result.current.toasts[0].message).toBe('Error message')
    })

    test('should use default duration for error toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showError('Error message')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    test('should accept custom duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showError('Error message', 8000)
      })

      expect(result.current.toasts[0].duration).toBe(8000)
    })
  })

  describe('showWarning', () => {
    test('should create warning toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showWarning('Warning message')
      })

      expect(result.current.toasts[0].type).toBe('warning')
      expect(result.current.toasts[0].message).toBe('Warning message')
    })

    test('should use default duration for warning toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showWarning('Warning message')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    test('should accept custom duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showWarning('Warning message', 6000)
      })

      expect(result.current.toasts[0].duration).toBe(6000)
    })
  })

  describe('showInfo', () => {
    test('should create info toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showInfo('Info message')
      })

      expect(result.current.toasts[0].type).toBe('info')
      expect(result.current.toasts[0].message).toBe('Info message')
    })

    test('should use default duration for info toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showInfo('Info message')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    test('should accept custom duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showInfo('Info message', 4000)
      })

      expect(result.current.toasts[0].duration).toBe(4000)
    })
  })

  describe('removeToast', () => {
    test('should remove specific toast by ID', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let toastId
      act(() => {
        toastId = result.current.showToast('Test message')
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        result.current.removeToast(toastId)
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    test('should only remove specified toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let toastId1, toastId2, toastId3
      act(() => {
        toastId1 = result.current.showToast('Toast 1')
        toastId2 = result.current.showToast('Toast 2')
        toastId3 = result.current.showToast('Toast 3')
      })

      expect(result.current.toasts).toHaveLength(3)

      act(() => {
        result.current.removeToast(toastId2)
      })

      expect(result.current.toasts).toHaveLength(2)
      expect(result.current.toasts[0].id).toBe(toastId1)
      expect(result.current.toasts[1].id).toBe(toastId3)
    })

    test('should do nothing when removing non-existent toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Toast 1')
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        result.current.removeToast('non-existent-id')
      })

      expect(result.current.toasts).toHaveLength(1)
    })
  })

  describe('clearAllToasts', () => {
    test('should remove all toasts', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Toast 1')
        result.current.showToast('Toast 2')
        result.current.showToast('Toast 3')
      })

      expect(result.current.toasts).toHaveLength(3)

      act(() => {
        result.current.clearAllToasts()
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    test('should do nothing when no toasts exist', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      expect(result.current.toasts).toHaveLength(0)

      act(() => {
        result.current.clearAllToasts()
      })

      expect(result.current.toasts).toHaveLength(0)
    })
  })

  describe('Toast Queue Management', () => {
    test('should maintain toast order', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('First')
        result.current.showToast('Second')
        result.current.showToast('Third')
      })

      expect(result.current.toasts[0].message).toBe('First')
      expect(result.current.toasts[1].message).toBe('Second')
      expect(result.current.toasts[2].message).toBe('Third')
    })

    test('should handle rapid toast creation', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.showToast(`Toast ${i}`)
        }
      })

      expect(result.current.toasts).toHaveLength(10)
    })

    test('should auto-remove toasts independently', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Toast 1', 'info', 1000)
        result.current.showToast('Toast 2', 'info', 2000)
        result.current.showToast('Toast 3', 'info', 3000)
      })

      expect(result.current.toasts).toHaveLength(3)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.toasts).toHaveLength(2)
      expect(result.current.toasts[0].message).toBe('Toast 2')

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('Toast 3')

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    test('should handle mixed manual and auto-dismiss', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let toastId2
      act(() => {
        result.current.showToast('Toast 1', 'info', 1000)
        toastId2 = result.current.showToast('Toast 2', 'info', 3000)
        result.current.showToast('Toast 3', 'info', 2000)
      })

      expect(result.current.toasts).toHaveLength(3)

      act(() => {
        jest.advanceTimersByTime(500)
        result.current.removeToast(toastId2)
      })

      expect(result.current.toasts).toHaveLength(2)

      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('Toast 3')
    })
  })

  describe('Toast Container', () => {
    test('should render ToastContainer with toasts', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      const button = screen.getByText('Show Toast')
      fireEvent.click(button)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    test('should not render ToastContainer when no toasts', () => {
      render(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>
      )

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    test('should render multiple toasts', () => {
      render(
        <ToastProvider>
          <MultiToastComponent />
        </ToastProvider>
      )

      const button = screen.getByText('Show 3 Toasts')
      fireEvent.click(button)

      const alerts = screen.getAllByRole('alert')
      expect(alerts).toHaveLength(3)
    })
  })

  describe('Toast Component', () => {
    test('should display toast message', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Toast'))

      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    test('should render success icon for success toast', () => {
      render(
        <ToastProvider>
          <SuccessToastComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Success'))

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-green-50')
    })

    test('should render error icon for error toast', () => {
      render(
        <ToastProvider>
          <ErrorToastComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Error'))

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-red-50')
    })

    test('should render warning icon for warning toast', () => {
      render(
        <ToastProvider>
          <WarningToastComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Warning'))

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-orange-50')
    })

    test('should render info icon for info toast', () => {
      render(
        <ToastProvider>
          <InfoToastComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Info'))

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-blue-50')
    })

    test('should have close button', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Toast'))

      expect(screen.getByLabelText('Close notification')).toBeInTheDocument()
    })

    test('should remove toast when close button clicked', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Toast'))

      expect(screen.getByText('Test message')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Close notification'))

      expect(screen.queryByText('Test message')).not.toBeInTheDocument()
    })

    test('should have proper ARIA attributes', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Toast'))

      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('useToast Hook', () => {
    test('should throw error when used outside ToastProvider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useToast())
      }).toThrow('useToast must be used within a ToastProvider')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty message', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('')
      })

      expect(result.current.toasts[0].message).toBe('')
    })

    test('should handle very long messages', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      const longMessage = 'a'.repeat(1000)

      act(() => {
        result.current.showToast(longMessage)
      })

      expect(result.current.toasts[0].message).toBe(longMessage)
    })

    test('should handle special characters in message', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      const specialMessage = '<script>alert("xss")</script>'

      act(() => {
        result.current.showToast(specialMessage)
      })

      expect(result.current.toasts[0].message).toBe(specialMessage)
    })

    test('should handle undefined type gracefully', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test', undefined)
      })

      expect(result.current.toasts[0].type).toBe('info')
    })

    test('should handle invalid toast type', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test', 'invalid-type')
      })

      expect(result.current.toasts[0].type).toBe('invalid-type')
    })
  })
})

// Test helper components
function TestComponent() {
  const { showToast } = useToast()

  return (
    <button onClick={() => showToast('Test message', 'info', 0)}>
      Show Toast
    </button>
  )
}

function MultiToastComponent() {
  const { showToast } = useToast()

  return (
    <button onClick={() => {
      showToast('Toast 1', 'info', 0)
      showToast('Toast 2', 'info', 0)
      showToast('Toast 3', 'info', 0)
    }}>
      Show 3 Toasts
    </button>
  )
}

function SuccessToastComponent() {
  const { showSuccess } = useToast()

  return (
    <button onClick={() => showSuccess('Success!', 0)}>
      Show Success
    </button>
  )
}

function ErrorToastComponent() {
  const { showError } = useToast()

  return (
    <button onClick={() => showError('Error!', 0)}>
      Show Error
    </button>
  )
}

function WarningToastComponent() {
  const { showWarning } = useToast()

  return (
    <button onClick={() => showWarning('Warning!', 0)}>
      Show Warning
    </button>
  )
}

function InfoToastComponent() {
  const { showInfo } = useToast()

  return (
    <button onClick={() => showInfo('Info!', 0)}>
      Show Info
    </button>
  )
}

export default wrapper
