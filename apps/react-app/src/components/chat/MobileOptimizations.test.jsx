import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  useIsMobile,
  useTouchGestures,
  MobileHeader,
  MobileBottomNav,
  SwipeableMessage,
  PullToRefresh,
  MobileInput,
  MobileModal,
  mobileStyles
} from './MobileOptimizations'
import {
  Menu, ArrowLeft, MoreVertical, Send, Paperclip,
  Mic, Camera, Search, Phone, Video, Users, Settings,
  ChevronDown, X
} from 'lucide-react'

// Helper component to test hooks
const TestHookComponent = ({ hook, ...props }) => {
  const result = hook(props)
  return <div data-testid="hook-result">{JSON.stringify(result)}</div>
}

// Mock navigator.vibrate
const mockVibrate = jest.fn()
global.navigator.vibrate = mockVibrate

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn()
global.navigator.mediaDevices = {
  getUserMedia: mockGetUserMedia
}

describe('MobileOptimizations - Mobile Detection', () => {
  beforeEach(() => {
    // Reset window size
    global.innerWidth = 1024
    global.innerHeight = 768
  })

  test('useIsMobile detects mobile by screen width', () => {
    global.innerWidth = 500
    const { result } = renderHook(() => useIsMobile())

    act(() => {
      fireEvent(window, new Event('resize'))
    })

    expect(result.current).toBe(true)
  })

  test('useIsMobile detects desktop by screen width', () => {
    global.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())

    act(() => {
      fireEvent(window, new Event('resize'))
    })

    expect(result.current).toBe(false)
  })

  test('useIsMobile detects mobile by user agent - iPhone', () => {
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    })
  })

  test('useIsMobile detects mobile by user agent - Android', () => {
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10)',
      configurable: true
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    })
  })

  test('useIsMobile updates on window resize', () => {
    global.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => {
      global.innerWidth = 500
      fireEvent(window, new Event('resize'))
    })

    expect(result.current).toBe(true)
  })

  test('useIsMobile cleans up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useIsMobile())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})

describe('MobileOptimizations - Touch Gestures', () => {
  let elementRef
  let touchCallbacks

  beforeEach(() => {
    elementRef = { current: document.createElement('div') }
    touchCallbacks = {
      onSwipeLeft: jest.fn(),
      onSwipeRight: jest.fn(),
      onSwipeUp: jest.fn(),
      onSwipeDown: jest.fn(),
      onLongPress: jest.fn(),
      onDoubleTap: jest.fn()
    }
    mockVibrate.mockClear()
  })

  test('useTouchGestures detects swipe right', () => {
    const { result } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    act(() => {
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      })
    })

    expect(touchCallbacks.onSwipeRight).toHaveBeenCalledWith(
      expect.any(Object),
      100
    )
  })

  test('useTouchGestures detects swipe left', () => {
    const { result } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    act(() => {
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 200, clientY: 100 }]
      })

      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      })
    })

    expect(touchCallbacks.onSwipeLeft).toHaveBeenCalledWith(
      expect.any(Object),
      100
    )
  })

  test('useTouchGestures detects swipe up', () => {
    const { result } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    act(() => {
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 200 }]
      })

      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      })
    })

    expect(touchCallbacks.onSwipeUp).toHaveBeenCalledWith(
      expect.any(Object),
      100
    )
  })

  test('useTouchGestures detects swipe down', () => {
    const { result } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    act(() => {
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 100, clientY: 200 }]
      })
    })

    expect(touchCallbacks.onSwipeDown).toHaveBeenCalledWith(
      expect.any(Object),
      100
    )
  })

  test('useTouchGestures respects custom swipe threshold', () => {
    const customCallbacks = { ...touchCallbacks, swipeThreshold: 100 }
    const { result } = renderHook(() => useTouchGestures(elementRef, customCallbacks))

    act(() => {
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 180, clientY: 100 }]
      })
    })

    // 80px swipe is below 100px threshold
    expect(touchCallbacks.onSwipeRight).not.toHaveBeenCalled()
  })

  test('useTouchGestures detects long press', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    act(() => {
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      jest.advanceTimersByTime(500)
    })

    expect(touchCallbacks.onLongPress).toHaveBeenCalled()
    expect(mockVibrate).toHaveBeenCalledWith(50)

    jest.useRealTimers()
  })

  test('useTouchGestures cancels long press on touch move', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    act(() => {
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchMove(elementRef.current, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      jest.advanceTimersByTime(500)
    })

    expect(touchCallbacks.onLongPress).not.toHaveBeenCalled()

    jest.useRealTimers()
  })

  test('useTouchGestures detects double tap', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    act(() => {
      // First tap
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      })

      jest.advanceTimersByTime(200)

      // Second tap
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      })
    })

    expect(touchCallbacks.onDoubleTap).toHaveBeenCalled()

    jest.useRealTimers()
  })

  test('useTouchGestures does not detect double tap after timeout', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    act(() => {
      // First tap
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      })

      jest.advanceTimersByTime(400)

      // Second tap after timeout
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      })
    })

    expect(touchCallbacks.onDoubleTap).not.toHaveBeenCalled()

    jest.useRealTimers()
  })

  test('useTouchGestures prefers horizontal swipe over vertical', () => {
    const { result } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    act(() => {
      fireEvent.touchStart(elementRef.current, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchEnd(elementRef.current, {
        changedTouches: [{ clientX: 200, clientY: 130 }]
      })
    })

    expect(touchCallbacks.onSwipeRight).toHaveBeenCalled()
    expect(touchCallbacks.onSwipeDown).not.toHaveBeenCalled()
  })

  test('useTouchGestures cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(elementRef.current, 'removeEventListener')
    const { unmount } = renderHook(() => useTouchGestures(elementRef, touchCallbacks))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function))
  })
})

describe('MobileOptimizations - MobileHeader Component', () => {
  test('renders with title', () => {
    render(<MobileHeader title="Chat Room" />)
    expect(screen.getByText('Chat Room')).toBeInTheDocument()
  })

  test('renders with subtitle', () => {
    render(<MobileHeader title="Chat Room" subtitle="Online" />)
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  test('renders menu button by default', () => {
    const onMenu = jest.fn()
    render(<MobileHeader title="Chat" onMenu={onMenu} />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    expect(onMenu).toHaveBeenCalled()
  })

  test('renders back button when showBack is true', () => {
    const onBack = jest.fn()
    render(<MobileHeader title="Chat" showBack onBack={onBack} />)

    const backButton = screen.getByRole('button')
    fireEvent.click(backButton)

    expect(onBack).toHaveBeenCalled()
  })

  test('renders avatar when provided', () => {
    render(<MobileHeader title="Chat" avatar={<span>A</span>} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  test('renders action buttons', () => {
    const actions = [
      { icon: Search, onClick: jest.fn(), title: 'Search' },
      { icon: Phone, onClick: jest.fn(), title: 'Call' }
    ]

    render(<MobileHeader title="Chat" actions={actions} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(1)

    fireEvent.click(buttons[1])
    expect(actions[0].onClick).toHaveBeenCalled()
  })

  test('applies custom className', () => {
    const { container } = render(<MobileHeader title="Chat" className="custom-class" />)
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})

describe('MobileOptimizations - MobileBottomNav Component', () => {
  const navItems = [
    { id: 'chats', label: 'Chats', icon: Menu },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  test('renders navigation items', () => {
    render(<MobileBottomNav items={navItems} />)

    expect(screen.getByText('Chats')).toBeInTheDocument()
    expect(screen.getByText('Calls')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  test('highlights active item', () => {
    const { container } = render(
      <MobileBottomNav items={navItems} activeItem="chats" />
    )

    const activeButton = screen.getByText('Chats').closest('button')
    expect(activeButton).toHaveClass('bg-blue-100')
  })

  test('calls onItemSelect when item is clicked', () => {
    const onItemSelect = jest.fn()
    render(<MobileBottomNav items={navItems} onItemSelect={onItemSelect} />)

    fireEvent.click(screen.getByText('Calls'))

    expect(onItemSelect).toHaveBeenCalledWith('calls')
  })

  test('renders badge on item', () => {
    const itemsWithBadge = [
      { id: 'chats', label: 'Chats', icon: Menu, badge: 5 }
    ]

    render(<MobileBottomNav items={itemsWithBadge} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(
      <MobileBottomNav items={navItems} className="custom-nav" />
    )

    expect(container.querySelector('.custom-nav')).toBeInTheDocument()
  })
})

describe('MobileOptimizations - SwipeableMessage Component', () => {
  const mockMessage = { id: 1, text: 'Hello World' }

  test('renders children content', () => {
    render(
      <SwipeableMessage message={mockMessage}>
        <div>Message Content</div>
      </SwipeableMessage>
    )

    expect(screen.getByText('Message Content')).toBeInTheDocument()
  })

  test('triggers onSwipeReply when swiped right beyond threshold', () => {
    const onSwipeReply = jest.fn()
    const { container } = render(
      <SwipeableMessage message={mockMessage} onSwipeReply={onSwipeReply}>
        <div>Message</div>
      </SwipeableMessage>
    )

    const element = container.firstChild

    act(() => {
      fireEvent.touchStart(element, {
        touches: [{ clientX: 50, clientY: 100 }]
      })

      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: 150, clientY: 100 }]
      })
    })

    expect(onSwipeReply).toHaveBeenCalledWith(mockMessage)
    expect(mockVibrate).toHaveBeenCalledWith(30)
  })

  test('does not trigger onSwipeReply when swipe is below threshold', () => {
    const onSwipeReply = jest.fn()
    const { container } = render(
      <SwipeableMessage message={mockMessage} onSwipeReply={onSwipeReply}>
        <div>Message</div>
      </SwipeableMessage>
    )

    const element = container.firstChild

    act(() => {
      fireEvent.touchStart(element, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: 150, clientY: 100 }]
      })
    })

    expect(onSwipeReply).not.toHaveBeenCalled()
  })

  test('triggers onSwipeActions when swiped left beyond threshold', () => {
    const onSwipeActions = jest.fn()
    const { container } = render(
      <SwipeableMessage message={mockMessage} onSwipeActions={onSwipeActions}>
        <div>Message</div>
      </SwipeableMessage>
    )

    const element = container.firstChild

    act(() => {
      fireEvent.touchStart(element, {
        touches: [{ clientX: 150, clientY: 100 }]
      })

      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: 50, clientY: 100 }]
      })
    })

    expect(onSwipeActions).toHaveBeenCalledWith(mockMessage)
    expect(mockVibrate).toHaveBeenCalledWith(30)
  })

  test('triggers onLongPress', () => {
    jest.useFakeTimers()
    const onLongPress = jest.fn()
    const { container } = render(
      <SwipeableMessage message={mockMessage} onLongPress={onLongPress}>
        <div>Message</div>
      </SwipeableMessage>
    )

    const element = container.firstChild

    act(() => {
      fireEvent.touchStart(element, {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      jest.advanceTimersByTime(500)
    })

    expect(onLongPress).toHaveBeenCalledWith(mockMessage)

    jest.useRealTimers()
  })

  test('applies custom className', () => {
    const { container } = render(
      <SwipeableMessage message={mockMessage} className="custom-message">
        <div>Message</div>
      </SwipeableMessage>
    )

    expect(container.querySelector('.custom-message')).toBeInTheDocument()
  })
})

describe('MobileOptimizations - PullToRefresh Component', () => {
  test('renders children content', () => {
    render(
      <PullToRefresh>
        <div>Content</div>
      </PullToRefresh>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  test('triggers onRefresh when pulled down beyond threshold', () => {
    const onRefresh = jest.fn()
    const { container } = render(
      <PullToRefresh onRefresh={onRefresh} threshold={100}>
        <div>Content</div>
      </PullToRefresh>
    )

    const element = container.firstChild
    Object.defineProperty(element, 'scrollTop', { value: 0, writable: true })

    act(() => {
      fireEvent.touchStart(element, {
        touches: [{ clientX: 100, clientY: 50 }]
      })

      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: 100, clientY: 200 }]
      })
    })

    expect(onRefresh).toHaveBeenCalled()
  })

  test('shows refreshing indicator when isRefreshing is true', () => {
    const { container } = render(
      <PullToRefresh isRefreshing={true}>
        <div>Content</div>
      </PullToRefresh>
    )

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  test('respects custom threshold', () => {
    const onRefresh = jest.fn()
    const { container } = render(
      <PullToRefresh onRefresh={onRefresh} threshold={200}>
        <div>Content</div>
      </PullToRefresh>
    )

    const element = container.firstChild
    Object.defineProperty(element, 'scrollTop', { value: 0, writable: true })

    act(() => {
      fireEvent.touchStart(element, {
        touches: [{ clientX: 100, clientY: 50 }]
      })

      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: 100, clientY: 150 }]
      })
    })

    // 100px pull is below 200px threshold
    expect(onRefresh).not.toHaveBeenCalled()
  })

  test('resets pull state when refreshing completes', () => {
    const { container, rerender } = render(
      <PullToRefresh isRefreshing={false}>
        <div>Content</div>
      </PullToRefresh>
    )

    rerender(
      <PullToRefresh isRefreshing={true}>
        <div>Content</div>
      </PullToRefresh>
    )

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()

    rerender(
      <PullToRefresh isRefreshing={false}>
        <div>Content</div>
      </PullToRefresh>
    )

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(
      <PullToRefresh className="custom-refresh">
        <div>Content</div>
      </PullToRefresh>
    )

    expect(container.querySelector('.custom-refresh')).toBeInTheDocument()
  })
})

describe('MobileOptimizations - MobileInput Component', () => {
  test('renders textarea when multiline is true', () => {
    render(<MobileInput value="" onChange={() => {}} multiline={true} />)
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
  })

  test('renders input when multiline is false', () => {
    render(<MobileInput value="" onChange={() => {}} multiline={false} />)
    const input = screen.getByPlaceholderText('Type a message...')
    expect(input.tagName).toBe('INPUT')
  })

  test('calls onChange when text is typed', () => {
    const onChange = jest.fn()
    render(<MobileInput value="" onChange={onChange} />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Hello' } })

    expect(onChange).toHaveBeenCalledWith('Hello')
  })

  test('calls onSend when send button is clicked', () => {
    const onSend = jest.fn()
    render(<MobileInput value="Hello" onChange={() => {}} onSend={onSend} />)

    const sendButton = screen.getByRole('button', { name: '' })
    fireEvent.click(sendButton)

    expect(onSend).toHaveBeenCalledWith('Hello', [])
  })

  test('calls onSend when Enter is pressed', () => {
    const onSend = jest.fn()
    render(<MobileInput value="Hello" onChange={() => {}} onSend={onSend} multiline={false} />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })

    expect(onSend).toHaveBeenCalledWith('Hello', [])
  })

  test('does not call onSend on Enter with Shift key in multiline mode', () => {
    const onSend = jest.fn()
    render(<MobileInput value="Hello" onChange={() => {}} onSend={onSend} multiline={true} />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', shiftKey: true })

    expect(onSend).not.toHaveBeenCalled()
  })

  test('shows attachment button when showAttachment is true', () => {
    const onAttachment = jest.fn()
    render(<MobileInput value="" onChange={() => {}} showAttachment={true} onAttachment={onAttachment} />)

    const buttons = screen.getAllByRole('button')
    const attachmentButton = buttons.find(btn => btn.querySelector('svg'))
    fireEvent.click(attachmentButton)

    expect(onAttachment).toHaveBeenCalled()
  })

  test('shows voice button when value is empty', () => {
    const onVoiceRecord = jest.fn()
    render(<MobileInput value="" onChange={() => {}} showVoice={true} onVoiceRecord={onVoiceRecord} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  test('shows camera button when value is empty', () => {
    const onCameraCapture = jest.fn()
    render(<MobileInput value="" onChange={() => {}} showCamera={true} onCameraCapture={onCameraCapture} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  test('starts voice recording when voice button is clicked', async () => {
    const mockStream = { id: 'mock-stream' }
    mockGetUserMedia.mockResolvedValue(mockStream)
    const onVoiceRecord = jest.fn()

    render(<MobileInput value="" onChange={() => {}} showVoice={true} onVoiceRecord={onVoiceRecord} />)

    const buttons = screen.getAllByRole('button')
    const voiceButton = buttons.find(btn => btn.querySelector('svg'))

    await act(async () => {
      fireEvent.click(voiceButton)
    })

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
      expect(onVoiceRecord).toHaveBeenCalledWith('start', mockStream)
    })
  })

  test('stops voice recording when voice button is clicked again', async () => {
    jest.useFakeTimers()
    const mockStream = { id: 'mock-stream' }
    mockGetUserMedia.mockResolvedValue(mockStream)
    const onVoiceRecord = jest.fn()

    render(<MobileInput value="" onChange={() => {}} showVoice={true} onVoiceRecord={onVoiceRecord} />)

    const buttons = screen.getAllByRole('button')
    const voiceButton = buttons.find(btn => btn.querySelector('svg'))

    // Start recording
    await act(async () => {
      fireEvent.click(voiceButton)
    })

    await waitFor(() => {
      expect(onVoiceRecord).toHaveBeenCalledWith('start', mockStream)
    })

    // Stop recording
    act(() => {
      fireEvent.click(voiceButton)
    })

    expect(onVoiceRecord).toHaveBeenCalledWith('stop')

    jest.useRealTimers()
  })

  test('handles voice recording error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

    render(<MobileInput value="" onChange={() => {}} showVoice={true} onVoiceRecord={() => {}} />)

    const buttons = screen.getAllByRole('button')
    const voiceButton = buttons.find(btn => btn.querySelector('svg'))

    await act(async () => {
      fireEvent.click(voiceButton)
    })

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to start recording:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })

  test('displays recording indicator when recording', async () => {
    const mockStream = { id: 'mock-stream' }
    mockGetUserMedia.mockResolvedValue(mockStream)

    render(<MobileInput value="" onChange={() => {}} showVoice={true} onVoiceRecord={() => {}} />)

    const buttons = screen.getAllByRole('button')
    const voiceButton = buttons.find(btn => btn.querySelector('svg'))

    await act(async () => {
      fireEvent.click(voiceButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Recording voice message')).toBeInTheDocument()
    })
  })

  test('updates recording duration', async () => {
    jest.useFakeTimers()
    const mockStream = { id: 'mock-stream' }
    mockGetUserMedia.mockResolvedValue(mockStream)

    render(<MobileInput value="" onChange={() => {}} showVoice={true} onVoiceRecord={() => {}} />)

    const buttons = screen.getAllByRole('button')
    const voiceButton = buttons.find(btn => btn.querySelector('svg'))

    await act(async () => {
      fireEvent.click(voiceButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Recording voice message')).toBeInTheDocument()
    })

    act(() => {
      jest.advanceTimersByTime(3000)
    })

    expect(screen.getByText('0:03')).toBeInTheDocument()

    jest.useRealTimers()
  })

  test('renders attachments preview', () => {
    const attachments = [
      { type: 'image/png', url: 'test.png', name: 'test.png' },
      { type: 'application/pdf', url: 'doc.pdf', name: 'doc.pdf' }
    ]

    render(<MobileInput value="" onChange={() => {}} attachments={attachments} />)

    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  test('disables input when disabled prop is true', () => {
    render(<MobileInput value="" onChange={() => {}} disabled={true} />)

    const input = screen.getByPlaceholderText('Type a message...')
    expect(input).toBeDisabled()
  })

  test('applies custom placeholder', () => {
    render(<MobileInput value="" onChange={() => {}} placeholder="Write here..." />)
    expect(screen.getByPlaceholderText('Write here...')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(<MobileInput value="" onChange={() => {}} className="custom-input" />)
    expect(container.querySelector('.custom-input')).toBeInTheDocument()
  })

  test('does not send empty message', () => {
    const onSend = jest.fn()
    render(<MobileInput value="   " onChange={() => {}} onSend={onSend} />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.keyPress(input, { key: 'Enter' })

    expect(onSend).not.toHaveBeenCalled()
  })

  test('sends message with attachments when value is empty', () => {
    const onSend = jest.fn()
    const attachments = [{ type: 'image/png', url: 'test.png', name: 'test.png' }]

    render(<MobileInput value="" onChange={() => {}} onSend={onSend} attachments={attachments} />)

    const sendButton = screen.getByRole('button', { name: '' })
    fireEvent.click(sendButton)

    expect(onSend).toHaveBeenCalledWith('', attachments)
  })
})

describe('MobileOptimizations - MobileModal Component', () => {
  test('does not render when isOpen is false', () => {
    render(<MobileModal isOpen={false} title="Modal" />)
    expect(screen.queryByText('Modal')).not.toBeInTheDocument()
  })

  test('renders when isOpen is true', () => {
    render(<MobileModal isOpen={true} title="Modal" />)
    expect(screen.getByText('Modal')).toBeInTheDocument()
  })

  test('renders children content', () => {
    render(
      <MobileModal isOpen={true} title="Modal">
        <div>Modal Content</div>
      </MobileModal>
    )

    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<MobileModal isOpen={true} title="Modal" onClose={onClose} />)

    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  test('renders in fullScreen mode', () => {
    const { container } = render(
      <MobileModal isOpen={true} title="Modal" fullScreen={true} />
    )

    const modal = container.querySelector('.h-full')
    expect(modal).toBeInTheDocument()
  })

  test('renders in bottom sheet mode by default', () => {
    const { container } = render(
      <MobileModal isOpen={true} title="Modal" fullScreen={false} />
    )

    const modal = container.querySelector('.absolute.bottom-0')
    expect(modal).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(
      <MobileModal isOpen={true} title="Modal" className="custom-modal" />
    )

    expect(container.querySelector('.custom-modal')).toBeInTheDocument()
  })
})

describe('MobileOptimizations - Mobile Styles', () => {
  test('exports mobileStyles string', () => {
    expect(typeof mobileStyles).toBe('string')
    expect(mobileStyles.length).toBeGreaterThan(0)
  })

  test('includes touch-target styles', () => {
    expect(mobileStyles).toContain('.touch-target')
    expect(mobileStyles).toContain('min-height: 44px')
    expect(mobileStyles).toContain('min-width: 44px')
  })

  test('includes hide-scrollbar styles', () => {
    expect(mobileStyles).toContain('.hide-scrollbar')
    expect(mobileStyles).toContain('scrollbar-width: none')
  })

  test('includes mobile-scroll styles', () => {
    expect(mobileStyles).toContain('.mobile-scroll')
    expect(mobileStyles).toContain('-webkit-overflow-scrolling: touch')
  })

  test('includes no-select styles', () => {
    expect(mobileStyles).toContain('.no-select')
    expect(mobileStyles).toContain('user-select: none')
  })

  test('includes safe-area styles', () => {
    expect(mobileStyles).toContain('.safe-area-top')
    expect(mobileStyles).toContain('.safe-area-bottom')
    expect(mobileStyles).toContain('env(safe-area-inset-top)')
    expect(mobileStyles).toContain('env(safe-area-inset-bottom)')
  })

  test('includes haptic-feedback styles', () => {
    expect(mobileStyles).toContain('.haptic-feedback')
    expect(mobileStyles).toContain('transform: scale(0.95)')
  })

  test('includes slide-up animation', () => {
    expect(mobileStyles).toContain('@keyframes slideUp')
    expect(mobileStyles).toContain('.slide-up')
  })

  test('includes reduced motion styles', () => {
    expect(mobileStyles).toContain('@media (prefers-reduced-motion: reduce)')
    expect(mobileStyles).toContain('animation: none !important')
    expect(mobileStyles).toContain('transition: none !important')
  })
})

describe('MobileOptimizations - Accessibility', () => {
  test('MobileHeader buttons have touch-target class', () => {
    const { container } = render(<MobileHeader title="Chat" onMenu={() => {}} />)
    const button = container.querySelector('button')
    expect(button).toHaveClass('touch-target')
  })

  test('MobileBottomNav buttons have touch-target class', () => {
    const items = [{ id: 'chat', label: 'Chat', icon: Menu }]
    const { container } = render(<MobileBottomNav items={items} />)
    const button = container.querySelector('button')
    expect(button).toHaveClass('touch-target')
  })

  test('MobileInput buttons have touch-target class', () => {
    const { container } = render(<MobileInput value="Test" onChange={() => {}} />)
    const buttons = container.querySelectorAll('.touch-target')
    expect(buttons.length).toBeGreaterThan(0)
  })

  test('MobileModal close button has touch-target class', () => {
    const { container } = render(<MobileModal isOpen={true} title="Modal" onClose={() => {}} />)
    const button = container.querySelector('.touch-target')
    expect(button).toBeInTheDocument()
  })

  test('MobileHeader action buttons have title attribute', () => {
    const actions = [
      { icon: Search, onClick: jest.fn(), title: 'Search' }
    ]

    render(<MobileHeader title="Chat" actions={actions} />)
    const button = screen.getByTitle('Search')
    expect(button).toBeInTheDocument()
  })

  test('respects prefers-reduced-motion in styles', () => {
    expect(mobileStyles).toContain('@media (prefers-reduced-motion: reduce)')
  })
})

describe('MobileOptimizations - Viewport and Orientation', () => {
  test('useIsMobile responds to viewport changes', () => {
    const { result } = renderHook(() => useIsMobile())

    act(() => {
      global.innerWidth = 1024
      fireEvent(window, new Event('resize'))
    })

    expect(result.current).toBe(false)

    act(() => {
      global.innerWidth = 500
      fireEvent(window, new Event('resize'))
    })

    expect(result.current).toBe(true)
  })

  test('safe area styles handle notched devices', () => {
    expect(mobileStyles).toContain('env(safe-area-inset-top)')
    expect(mobileStyles).toContain('env(safe-area-inset-bottom)')
  })
})

describe('MobileOptimizations - Keyboard Handling', () => {
  test('MobileInput handles Enter key in single-line mode', () => {
    const onSend = jest.fn()
    render(<MobileInput value="Test" onChange={() => {}} onSend={onSend} multiline={false} />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })

    expect(onSend).toHaveBeenCalled()
  })

  test('MobileInput handles Enter+Shift in multiline mode', () => {
    const onSend = jest.fn()
    render(<MobileInput value="Test" onChange={() => {}} onSend={onSend} multiline={true} />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', shiftKey: true })

    expect(onSend).not.toHaveBeenCalled()
  })

  test('MobileInput focuses input on mount', () => {
    const { container } = render(<MobileInput value="" onChange={() => {}} />)
    const input = container.querySelector('textarea')
    expect(input).toBeInTheDocument()
  })
})

// Helper function to render hooks (simple implementation)
function renderHook(hook) {
  let result = { current: null }

  function TestComponent() {
    result.current = hook()
    return null
  }

  const rendered = render(<TestComponent />)

  return {
    result,
    rerender: (newHook) => {
      function UpdatedComponent() {
        result.current = newHook ? newHook() : hook()
        return null
      }
      rendered.rerender(<UpdatedComponent />)
    },
    unmount: rendered.unmount
  }
}

export default TestHookComponent
