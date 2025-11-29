/**
 * useToast Component Test Suite
 * Comprehensive tests for the useToast hook and compatibility wrapper
 * Tests both the re-exported context hook and the compatibility layer
 */

import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useToast, useToastCompat } from './useToast'
import { ToastProvider } from '../../contexts/ToastContext'

// Wrapper component for providing toast context
const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>

describe('useToast Hook Tests', () => {
  describe('Hook Initialization', () => {
    it('should initialize with empty toasts array', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      expect(result.current.toasts).toEqual([])
      expect(result.current.toasts).toHaveLength(0)
    })

    it('should provide showToast function', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      expect(result.current.showToast).toBeDefined()
      expect(typeof result.current.showToast).toBe('function')
    })

    it('should provide removeToast function', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      expect(result.current.removeToast).toBeDefined()
      expect(typeof result.current.removeToast).toBe('function')
    })

    it('should provide clearAllToasts function', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      expect(result.current.clearAllToasts).toBeDefined()
      expect(typeof result.current.clearAllToasts).toBe('function')
    })

    it('should provide convenience methods for all toast types', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      expect(result.current.showSuccess).toBeDefined()
      expect(result.current.showError).toBeDefined()
      expect(result.current.showWarning).toBeDefined()
      expect(result.current.showInfo).toBeDefined()
    })

    it('should throw error when used outside ToastProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      expect(() => {
        renderHook(() => useToast())
      }).toThrow('useToast must be used within a ToastProvider')

      console.error = originalError
    })
  })

  describe('Toast Creation', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should create a basic toast with showToast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test message')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('Test message')
      expect(result.current.toasts[0].type).toBe('info')
    })

    it('should create toast with default info type', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Info message')
      })

      expect(result.current.toasts[0].type).toBe('info')
    })

    it('should create toast with custom type', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Custom message', 'success')
      })

      expect(result.current.toasts[0].type).toBe('success')
    })

    it('should create toast with custom duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Message', 'info', 3000)
      })

      expect(result.current.toasts[0].duration).toBe(3000)
    })

    it('should create toast with default duration of 5000ms', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Message')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    it('should return unique toast ID', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let id1, id2
      act(() => {
        id1 = result.current.showToast('First message')
        id2 = result.current.showToast('Second message')
      })

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
    })

    it('should generate unique IDs for multiple toasts', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      const ids = []
      act(() => {
        for (let i = 0; i < 10; i++) {
          ids.push(result.current.showToast(`Message ${i}`))
        }
      })

      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10)
    })

    it('should include timestamp when creating toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const beforeTimestamp = Date.now()

      act(() => {
        result.current.showToast('Test message')
      })

      const afterTimestamp = Date.now()
      expect(result.current.toasts[0].timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(result.current.toasts[0].timestamp).toBeLessThanOrEqual(afterTimestamp)
    })

    it('should preserve toast order (FIFO)', () => {
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
  })

  describe('Success Toast Variant', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should create success toast with showSuccess', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showSuccess('Operation successful')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].type).toBe('success')
      expect(result.current.toasts[0].message).toBe('Operation successful')
    })

    it('should use default duration for success toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showSuccess('Success')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    it('should allow custom duration for success toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showSuccess('Success', 3000)
      })

      expect(result.current.toasts[0].duration).toBe(3000)
    })

    it('should return toast ID from showSuccess', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let toastId
      act(() => {
        toastId = result.current.showSuccess('Success')
      })

      expect(toastId).toBeDefined()
      expect(typeof toastId).toBe('string')
      expect(result.current.toasts[0].id).toBe(toastId)
    })
  })

  describe('Error Toast Variant', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should create error toast with showError', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showError('Something went wrong')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].type).toBe('error')
      expect(result.current.toasts[0].message).toBe('Something went wrong')
    })

    it('should use default duration for error toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showError('Error')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    it('should allow custom duration for error toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showError('Error', 8000)
      })

      expect(result.current.toasts[0].duration).toBe(8000)
    })

    it('should return toast ID from showError', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let toastId
      act(() => {
        toastId = result.current.showError('Error')
      })

      expect(toastId).toBeDefined()
      expect(typeof toastId).toBe('string')
    })
  })

  describe('Warning Toast Variant', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should create warning toast with showWarning', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showWarning('Warning message')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].type).toBe('warning')
      expect(result.current.toasts[0].message).toBe('Warning message')
    })

    it('should use default duration for warning toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showWarning('Warning')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    it('should allow custom duration for warning toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showWarning('Warning', 6000)
      })

      expect(result.current.toasts[0].duration).toBe(6000)
    })

    it('should return toast ID from showWarning', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let toastId
      act(() => {
        toastId = result.current.showWarning('Warning')
      })

      expect(toastId).toBeDefined()
      expect(typeof toastId).toBe('string')
    })
  })

  describe('Info Toast Variant', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should create info toast with showInfo', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showInfo('Information')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].type).toBe('info')
      expect(result.current.toasts[0].message).toBe('Information')
    })

    it('should use default duration for info toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showInfo('Info')
      })

      expect(result.current.toasts[0].duration).toBe(5000)
    })

    it('should allow custom duration for info toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showInfo('Info', 4000)
      })

      expect(result.current.toasts[0].duration).toBe(4000)
    })

    it('should return toast ID from showInfo', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let toastId
      act(() => {
        toastId = result.current.showInfo('Info')
      })

      expect(toastId).toBeDefined()
      expect(typeof toastId).toBe('string')
    })
  })

  describe('Toast Dismissal', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should remove toast by ID', () => {
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

    it('should remove only the specified toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let id1, id2, id3
      act(() => {
        id1 = result.current.showToast('First')
        id2 = result.current.showToast('Second')
        id3 = result.current.showToast('Third')
      })

      expect(result.current.toasts).toHaveLength(3)

      act(() => {
        result.current.removeToast(id2)
      })

      expect(result.current.toasts).toHaveLength(2)
      expect(result.current.toasts[0].id).toBe(id1)
      expect(result.current.toasts[1].id).toBe(id3)
    })

    it('should handle removing non-existent toast gracefully', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test')
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        result.current.removeToast('non-existent-id')
      })

      expect(result.current.toasts).toHaveLength(1)
    })

    it('should clear all toasts with clearAllToasts', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('First')
        result.current.showToast('Second')
        result.current.showToast('Third')
        result.current.showToast('Fourth')
      })

      expect(result.current.toasts).toHaveLength(4)

      act(() => {
        result.current.clearAllToasts()
      })

      expect(result.current.toasts).toHaveLength(0)
      expect(result.current.toasts).toEqual([])
    })

    it('should handle clearAllToasts when no toasts exist', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      expect(result.current.toasts).toHaveLength(0)

      act(() => {
        result.current.clearAllToasts()
      })

      expect(result.current.toasts).toHaveLength(0)
    })
  })

  describe('Auto Dismissal', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should auto-dismiss toast after default duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Auto dismiss test')
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    it('should auto-dismiss toast after custom duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Custom duration', 'info', 3000)
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(2999)
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(1)
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    it('should not auto-dismiss when duration is 0', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Persistent toast', 'info', 0)
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(10000)
      })

      expect(result.current.toasts).toHaveLength(1)
    })

    it('should not auto-dismiss when duration is negative', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Persistent toast', 'info', -1)
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(10000)
      })

      expect(result.current.toasts).toHaveLength(1)
    })

    it('should auto-dismiss multiple toasts independently', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('First', 'info', 2000)
        result.current.showToast('Second', 'info', 4000)
        result.current.showToast('Third', 'info', 6000)
      })

      expect(result.current.toasts).toHaveLength(3)

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current.toasts).toHaveLength(2)
      expect(result.current.toasts[0].message).toBe('Second')

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('Third')

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    it('should handle rapid toast creation and auto-dismissal', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.showToast(`Toast ${i}`, 'info', 1000)
        }
      })

      expect(result.current.toasts).toHaveLength(5)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.toasts).toHaveLength(0)
    })
  })

  describe('Queue Management', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should handle multiple toasts simultaneously', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showSuccess('Success')
        result.current.showError('Error')
        result.current.showWarning('Warning')
        result.current.showInfo('Info')
      })

      expect(result.current.toasts).toHaveLength(4)
    })

    it('should maintain toast order in queue', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('First', 'success')
        result.current.showToast('Second', 'error')
        result.current.showToast('Third', 'warning')
      })

      expect(result.current.toasts[0].message).toBe('First')
      expect(result.current.toasts[1].message).toBe('Second')
      expect(result.current.toasts[2].message).toBe('Third')
    })

    it('should allow unlimited toasts by default', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.showToast(`Toast ${i}`)
        }
      })

      expect(result.current.toasts).toHaveLength(20)
    })

    it('should handle mixed variant toasts in queue', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showSuccess('Success 1')
        result.current.showError('Error 1')
        result.current.showSuccess('Success 2')
        result.current.showWarning('Warning 1')
      })

      expect(result.current.toasts).toHaveLength(4)
      expect(result.current.toasts[0].type).toBe('success')
      expect(result.current.toasts[1].type).toBe('error')
      expect(result.current.toasts[2].type).toBe('success')
      expect(result.current.toasts[3].type).toBe('warning')
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should handle empty message', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('')
    })

    it('should handle null message', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast(null)
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe(null)
    })

    it('should handle undefined message', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast(undefined)
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe(undefined)
    })

    it('should handle very long messages', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const longMessage = 'a'.repeat(1000)

      act(() => {
        result.current.showToast(longMessage)
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe(longMessage)
    })

    it('should handle special characters in message', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const specialMessage = '<script>alert("xss")</script>'

      act(() => {
        result.current.showToast(specialMessage)
      })

      expect(result.current.toasts[0].message).toBe(specialMessage)
    })

    it('should handle unicode characters', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const unicodeMessage = '✓ Success! 🎉'

      act(() => {
        result.current.showToast(unicodeMessage)
      })

      expect(result.current.toasts[0].message).toBe(unicodeMessage)
    })

    it('should handle multiline messages', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const multilineMessage = 'Line 1\nLine 2\nLine 3'

      act(() => {
        result.current.showToast(multilineMessage)
      })

      expect(result.current.toasts[0].message).toBe(multilineMessage)
    })

    it('should handle invalid toast type gracefully', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Message', 'invalid-type')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].type).toBe('invalid-type')
    })

    it('should handle very short duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Fast toast', 'info', 1)
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(1)
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    it('should handle very long duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Long toast', 'info', 999999)
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        jest.advanceTimersByTime(10000)
      })

      expect(result.current.toasts).toHaveLength(1)
    })

    it('should handle removing toast that is already auto-dismissed', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let toastId
      act(() => {
        toastId = result.current.showToast('Test', 'info', 1000)
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.toasts).toHaveLength(0)

      act(() => {
        result.current.removeToast(toastId)
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    it('should handle rapid add and remove operations', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      const ids = []
      act(() => {
        for (let i = 0; i < 10; i++) {
          ids.push(result.current.showToast(`Toast ${i}`))
        }
      })

      expect(result.current.toasts).toHaveLength(10)

      act(() => {
        ids.forEach(id => result.current.removeToast(id))
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    it('should handle clearAllToasts during auto-dismiss', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('First', 'info', 2000)
        result.current.showToast('Second', 'info', 4000)
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      act(() => {
        result.current.clearAllToasts()
      })

      expect(result.current.toasts).toHaveLength(0)

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current.toasts).toHaveLength(0)
    })
  })

  describe('Memory and Cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should cleanup timers on unmount', () => {
      const { result, unmount } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test', 'info', 5000)
      })

      unmount()

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // Should not throw error
    })

    it('should not update state after unmount', () => {
      const { result, unmount } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('Test', 'info', 1000)
      })

      unmount()

      // This should not cause any errors
      act(() => {
        jest.advanceTimersByTime(1000)
      })
    })

    it('should handle multiple unmounts gracefully', () => {
      const { unmount } = renderHook(() => useToast(), { wrapper })

      unmount()
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should handle simultaneous show and remove operations', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let id1
      act(() => {
        id1 = result.current.showToast('First')
        result.current.showToast('Second')
        result.current.removeToast(id1)
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('Second')
    })

    it('should handle show operations with clearAll', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('First')
        result.current.showToast('Second')
        result.current.clearAllToasts()
        result.current.showToast('Third')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('Third')
    })

    it('should handle all variant methods called together', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showSuccess('Success')
        result.current.showError('Error')
        result.current.showWarning('Warning')
        result.current.showInfo('Info')
      })

      expect(result.current.toasts).toHaveLength(4)
      expect(result.current.toasts.map(t => t.type)).toEqual([
        'success',
        'error',
        'warning',
        'info'
      ])
    })
  })

  describe('State Consistency', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should maintain consistent state across operations', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      act(() => {
        result.current.showToast('First')
      })
      const firstCount = result.current.toasts.length

      act(() => {
        result.current.showToast('Second')
      })
      const secondCount = result.current.toasts.length

      expect(secondCount).toBe(firstCount + 1)
    })

    it('should provide stable function references', () => {
      const { result, rerender } = renderHook(() => useToast(), { wrapper })

      const initialShowToast = result.current.showToast
      const initialRemoveToast = result.current.removeToast
      const initialClearAll = result.current.clearAllToasts

      rerender()

      expect(result.current.showToast).toBe(initialShowToast)
      expect(result.current.removeToast).toBe(initialRemoveToast)
      expect(result.current.clearAllToasts).toBe(initialClearAll)
    })

    it('should maintain toast integrity after operations', () => {
      const { result } = renderHook(() => useToast(), { wrapper })

      let id
      act(() => {
        id = result.current.showToast('Test message', 'success', 3000)
      })

      const toast = result.current.toasts[0]
      expect(toast.id).toBe(id)
      expect(toast.message).toBe('Test message')
      expect(toast.type).toBe('success')
      expect(toast.duration).toBe(3000)
      expect(toast.timestamp).toBeDefined()
    })
  })
})

describe('useToastCompat Compatibility Wrapper Tests', () => {
  describe('Compatibility Layer Initialization', () => {
    it('should provide all original methods', () => {
      const { result } = renderHook(() => useToastCompat(), { wrapper })

      expect(result.current.showToast).toBeDefined()
      expect(result.current.showSuccess).toBeDefined()
      expect(result.current.showError).toBeDefined()
      expect(result.current.showWarning).toBeDefined()
      expect(result.current.showInfo).toBeDefined()
      expect(result.current.removeToast).toBeDefined()
      expect(result.current.clearAllToasts).toBeDefined()
    })

    it('should provide alias methods', () => {
      const { result } = renderHook(() => useToastCompat(), { wrapper })

      expect(result.current.toast).toBeDefined()
      expect(result.current.success).toBeDefined()
      expect(result.current.error).toBeDefined()
      expect(result.current.warning).toBeDefined()
      expect(result.current.info).toBeDefined()
    })

    it('should have toast alias point to showToast', () => {
      const { result } = renderHook(() => useToastCompat(), { wrapper })

      expect(result.current.toast).toBe(result.current.showToast)
    })

    it('should have all alias methods be functions', () => {
      const { result } = renderHook(() => useToastCompat(), { wrapper })

      expect(typeof result.current.toast).toBe('function')
      expect(typeof result.current.success).toBe('function')
      expect(typeof result.current.error).toBe('function')
      expect(typeof result.current.warning).toBe('function')
      expect(typeof result.current.info).toBe('function')
    })
  })

  describe('Compatibility Wrapper Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should create toast using success alias', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        compatResult.current.success('Success via alias')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].type).toBe('success')
      expect(result.current.toasts[0].message).toBe('Success via alias')
    })

    it('should create toast using error alias', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        compatResult.current.error('Error via alias')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].type).toBe('error')
    })

    it('should create toast using warning alias', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        compatResult.current.warning('Warning via alias')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].type).toBe('warning')
    })

    it('should create toast using info alias', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        compatResult.current.info('Info via alias')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].type).toBe('info')
    })

    it('should create toast using toast alias', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        compatResult.current.toast('Toast via alias')
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('Toast via alias')
    })

    it('should support custom duration with alias methods', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        compatResult.current.success('Success', 3000)
      })

      expect(result.current.toasts[0].duration).toBe(3000)
    })

    it('should work with removeToast from compat wrapper', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      let toastId
      act(() => {
        toastId = compatResult.current.success('Success')
      })

      expect(result.current.toasts).toHaveLength(1)

      act(() => {
        compatResult.current.removeToast(toastId)
      })

      expect(result.current.toasts).toHaveLength(0)
    })

    it('should work with clearAllToasts from compat wrapper', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        compatResult.current.success('Success')
        compatResult.current.error('Error')
        compatResult.current.warning('Warning')
      })

      expect(result.current.toasts).toHaveLength(3)

      act(() => {
        compatResult.current.clearAllToasts()
      })

      expect(result.current.toasts).toHaveLength(0)
    })
  })

  describe('Mixed Usage Scenarios', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should work with both original and compat hook simultaneously', () => {
      const { result: originalResult } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        originalResult.current.showSuccess('From original')
        compatResult.current.success('From compat')
      })

      expect(originalResult.current.toasts).toHaveLength(2)
    })

    it('should share state between original and compat hooks', () => {
      const { result: originalResult } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        originalResult.current.showToast('Original toast')
      })

      act(() => {
        compatResult.current.toast('Compat toast')
      })

      expect(originalResult.current.toasts).toHaveLength(2)
    })

    it('should allow removal with either hook', () => {
      const { result: originalResult } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      let id1, id2
      act(() => {
        id1 = originalResult.current.showToast('First')
        id2 = compatResult.current.toast('Second')
      })

      act(() => {
        originalResult.current.removeToast(id1)
      })

      expect(originalResult.current.toasts).toHaveLength(1)

      act(() => {
        compatResult.current.removeToast(id2)
      })

      expect(originalResult.current.toasts).toHaveLength(0)
    })
  })

  describe('Backward Compatibility', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should maintain backward compatibility for old interface', () => {
      const { result } = renderHook(() => useToastCompat(), { wrapper })

      // Old interface style
      act(() => {
        result.current.toast('Message', 'success')
      })

      const { result: toastResult } = renderHook(() => useToast(), { wrapper })
      expect(toastResult.current.toasts[0].type).toBe('success')
    })

    it('should support chaining operations', () => {
      const { result: originalResult } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        const id = compatResult.current.success('Success')
        compatResult.current.removeToast(id)
      })

      expect(originalResult.current.toasts).toHaveLength(0)
    })

    it('should handle all variant methods with custom durations', () => {
      const { result } = renderHook(() => useToast(), { wrapper })
      const { result: compatResult } = renderHook(() => useToastCompat(), { wrapper })

      act(() => {
        compatResult.current.success('Success', 1000)
        compatResult.current.error('Error', 2000)
        compatResult.current.warning('Warning', 3000)
        compatResult.current.info('Info', 4000)
      })

      expect(result.current.toasts).toHaveLength(4)
      expect(result.current.toasts[0].duration).toBe(1000)
      expect(result.current.toasts[1].duration).toBe(2000)
      expect(result.current.toasts[2].duration).toBe(3000)
      expect(result.current.toasts[3].duration).toBe(4000)
    })
  })
})
