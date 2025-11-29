/**
 * useToast Hook Test Suite
 * Tests for toast notification hook
 */
import { renderHook, act } from '@testing-library/react'
import { useToast } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('initializes with empty toasts', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('adds a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({ message: 'Test message' })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Test message')
  })

  it('removes a toast', () => {
    const { result } = renderHook(() => useToast())

    let toastId
    act(() => {
      toastId = result.current.addToast({ message: 'Test' })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.removeToast(toastId)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('removes all toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({ message: 'Toast 1' })
      result.current.addToast({ message: 'Toast 2' })
      result.current.addToast({ message: 'Toast 3' })
    })

    expect(result.current.toasts).toHaveLength(3)

    act(() => {
      result.current.removeAllToasts()
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('creates success toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Operation successful')
    })

    expect(result.current.toasts[0].type).toBe('success')
    expect(result.current.toasts[0].message).toBe('Operation successful')
  })

  it('creates error toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.error('Something went wrong')
    })

    expect(result.current.toasts[0].type).toBe('error')
    expect(result.current.toasts[0].message).toBe('Something went wrong')
  })

  it('creates warning toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.warning('Warning message')
    })

    expect(result.current.toasts[0].type).toBe('warning')
  })

  it('creates info toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.info('Information')
    })

    expect(result.current.toasts[0].type).toBe('info')
  })

  it('limits maximum number of toasts', () => {
    const { result } = renderHook(() => useToast({ maxToasts: 3 }))

    act(() => {
      result.current.addToast({ message: 'Toast 1' })
      result.current.addToast({ message: 'Toast 2' })
      result.current.addToast({ message: 'Toast 3' })
      result.current.addToast({ message: 'Toast 4' })
    })

    expect(result.current.toasts).toHaveLength(3)
    expect(result.current.toasts[0].message).toBe('Toast 2')
  })

  it('handles promise toast with success', async () => {
    const { result } = renderHook(() => useToast())

    const successPromise = Promise.resolve('Success!')

    await act(async () => {
      await result.current.promise(successPromise, {
        success: 'Operation completed',
      })
    })

    const successToast = result.current.toasts.find(t => t.type === 'success')
    expect(successToast).toBeDefined()
    expect(successToast.message).toBe('Operation completed')
  })

  it('handles promise toast with error', async () => {
    const { result } = renderHook(() => useToast())

    const errorPromise = Promise.reject(new Error('Failed'))

    try {
      await act(async () => {
        await result.current.promise(errorPromise, {
          error: 'Operation failed',
        })
      })
    } catch (e) {
      // Expected error
    }

    const errorToast = result.current.toasts.find(t => t.type === 'error')
    expect(errorToast).toBeDefined()
    expect(errorToast.message).toBe('Operation failed')
  })

  it('generates unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({ message: 'Toast 1' })
      result.current.addToast({ message: 'Toast 2' })
    })

    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id)
  })

  it('supports custom position', () => {
    const { result } = renderHook(() => useToast({ defaultPosition: 'bottom-left' }))

    act(() => {
      result.current.addToast({ message: 'Test' })
    })

    expect(result.current.toasts[0].position).toBe('bottom-left')
  })

  it('supports custom duration', () => {
    const { result } = renderHook(() => useToast({ defaultDuration: 3000 }))

    act(() => {
      result.current.addToast({ message: 'Test' })
    })

    expect(result.current.toasts[0].duration).toBe(3000)
  })

  it('allows overriding default options per toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({
        message: 'Test',
        duration: 10000,
        position: 'top-center',
      })
    })

    expect(result.current.toasts[0].duration).toBe(10000)
    expect(result.current.toasts[0].position).toBe('top-center')
  })
})
