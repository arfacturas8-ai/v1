import React, { useState, useEffect, useCallback } from 'react'
import {
  Command, Keyboard, X, Search, ArrowUp, ArrowDown,
  Hash, MessageCircle, Mic, Settings,
  Plus, Star, Archive, Pin, Volume2, Users
} from 'lucide-react'

/**
 * KeyboardShortcuts - Discord-style keyboard shortcuts and accessibility
 * Features: Global shortcuts, context-aware actions, accessibility navigation, shortcut help
 */
function KeyboardShortcuts({
  onShortcut,
  shortcuts = [],
  disabled = false,
  showHelp = false,
  onToggleHelp,
  context = 'global', // global, chat, search, voice
  className = ''
}) {
  // State
  const [pressedKeys, setPressedKeys] = useState(new Set())
  const [recentShortcuts, setRecentShortcuts] = useState([])
  const [customShortcuts, setCustomShortcuts] = useState({})
  
  // Default shortcuts
  const defaultShortcuts = {
    global: [
      { keys: ['ctrl', 'k'], action: 'search', description: 'Quick search', icon: Search },
      { keys: ['ctrl', '/'], action: 'help', description: 'Show keyboard shortcuts', icon: Keyboard },
      { keys: ['ctrl', 'shift', 'a'], action: 'settings', description: 'Open settings', icon: Settings },
      { keys: ['escape'], action: 'close', description: 'Close modal/panel', icon: Escape },
      { keys: ['ctrl', 'enter'], action: 'send', description: 'Send message', icon: Enter },
      { keys: ['ctrl', 'shift', 'n'], action: 'new_channel', description: 'Create new channel', icon: Hash },
      { keys: ['ctrl', 'shift', 'd'], action: 'new_dm', description: 'Start direct message', icon: MessageCircle },
      { keys: ['ctrl', 'shift', 'm'], action: 'toggle_mute', description: 'Toggle mute', icon: Mic },
      { keys: ['ctrl', 'shift', 'v'], action: 'join_voice', description: 'Join voice channel', icon: Volume2 }
    ],
    chat: [
      { keys: ['up'], action: 'edit_last', description: 'Edit last message', icon: ArrowUp },
      { keys: ['down'], action: 'navigate_down', description: 'Navigate down', icon: ArrowDown },
      { keys: ['ctrl', 'shift', 'r'], action: 'reply', description: 'Reply to message', icon: MessageCircle },
      { keys: ['ctrl', 'shift', 't'], action: 'thread', description: 'Start thread', icon: MessageCircle },
      { keys: ['ctrl', 'shift', 'p'], action: 'pin', description: 'Pin message', icon: Pin },
      { keys: ['ctrl', 'shift', 'star'], action: 'star', description: 'Star message', icon: Star },
      { keys: ['ctrl', 'shift', 'delete'], action: 'delete', description: 'Delete message', icon: X },
      { keys: ['tab'], action: 'autocomplete', description: 'Autocomplete mention/emoji', icon: Plus }
    ],
    search: [
      { keys: ['enter'], action: 'search_execute', description: 'Execute search', icon: Search },
      { keys: ['escape'], action: 'search_close', description: 'Close search', icon: Escape },
      { keys: ['up'], action: 'search_up', description: 'Previous result', icon: ArrowUp },
      { keys: ['down'], action: 'search_down', description: 'Next result', icon: ArrowDown },
      { keys: ['ctrl', 'f'], action: 'search_filter', description: 'Open filters', icon: Settings }
    ],
    voice: [
      { keys: ['ctrl', 'm'], action: 'toggle_mute', description: 'Toggle mute', icon: Mic },
      { keys: ['ctrl', 'd'], action: 'toggle_deafen', description: 'Toggle deafen', icon: Mic },
      { keys: ['ctrl', 'shift', 'h'], action: 'toggle_camera', description: 'Toggle camera', icon: Users },
      { keys: ['ctrl', 'shift', 's'], action: 'share_screen', description: 'Share screen', icon: Users },
      { keys: ['ctrl', 'shift', 'l'], action: 'leave_voice', description: 'Leave voice channel', icon: Volume2 }
    ]
  }

  // Load custom shortcuts
  useEffect(() => {
    const saved = localStorage.getItem('cryb-keyboard-shortcuts')
    if (saved) {
      setCustomShortcuts(JSON.parse(saved))
    }
  }, [])

  // Merge shortcuts
  const allShortcuts = [
    ...(defaultShortcuts[context] || []),
    ...(shortcuts || []),
    ...Object.values(customShortcuts)
  ]

  // Keyboard event handlers
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (event) => {
      // Don't capture shortcuts when typing in inputs (except specific cases)
      if (isTypingInInput(event.target) && !isGlobalShortcut(event)) {
        return
      }

      const key = getKeyString(event)
      setPressedKeys(prev => new Set([...prev, key]))

      // Check for shortcuts
      const shortcut = findMatchingShortcut(event)
      if (shortcut) {
        event.preventDefault()
        event.stopPropagation()
        
        executeShortcut(shortcut, event)
        addToRecentShortcuts(shortcut)
      }
    }

    const handleKeyUp = (event) => {
      const key = getKeyString(event)
      setPressedKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }

    // Add ARIA keyboard navigation
    const handleFocus = (event) => {
      const element = event.target
      if (element.hasAttribute('data-keyboard-nav')) {
        announceElement(element)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    window.addEventListener('focus', handleFocus, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
      window.removeEventListener('focus', handleFocus, true)
    }
  }, [allShortcuts, disabled, context])

  // Accessibility announcements
  const announceElement = useCallback((element) => {
    const announcement = getElementAnnouncement(element)
    if (announcement) {
      announceToScreenReader(announcement)
    }
  }, [])

  // Get key string from event
  const getKeyString = (event) => {
    const parts = []
    
    if (event.metaKey || event.ctrlKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    
    // Special keys
    const specialKeys = {
      ' ': 'space',
      'Enter': 'enter',
      'Escape': 'escape',
      'Tab': 'tab',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Backspace': 'backspace',
      'Delete': 'delete'
    }
    
    const key = specialKeys[event.key] || event.key.toLowerCase()
    parts.push(key)
    
    return parts.join('+')
  }

  // Check if user is typing in an input
  const isTypingInInput = (target) => {
    const inputTypes = ['input', 'textarea', 'select']
    const isInput = inputTypes.includes(target.tagName.toLowerCase())
    const isContentEditable = target.contentEditable === 'true'
    const hasRole = ['textbox', 'searchbox', 'combobox'].includes(target.getAttribute('role'))
    
    return isInput || isContentEditable || hasRole
  }

  // Check if it's a global shortcut that should work everywhere
  const isGlobalShortcut = (event) => {
    const globalKeys = [
      'ctrl+k', 'ctrl+/', 'ctrl+shift+a', 'escape',
      'ctrl+shift+m', 'ctrl+shift+d', 'ctrl+shift+v'
    ]
    
    const keyString = getKeyString(event)
    return globalKeys.includes(keyString)
  }

  // Find matching shortcut
  const findMatchingShortcut = (event) => {
    const keyString = getKeyString(event)
    
    return allShortcuts.find(shortcut => {
      const shortcutKey = shortcut.keys.join('+')
      return shortcutKey === keyString
    })
  }

  // Execute shortcut
  const executeShortcut = (shortcut, event) => {
    
    // Built-in actions
    switch (shortcut.action) {
      case 'help':
        onToggleHelp && onToggleHelp()
        break
      case 'close':
        // Close any open modals/panels
        const modals = document.querySelectorAll('[role="dialog"], [data-modal]')
        if (modals.length > 0) {
          const lastModal = modals[modals.length - 1]
          const closeButton = lastModal.querySelector('[data-close], [aria-label*="close"], [aria-label*="Close"]')
          if (closeButton) {
            closeButton.click()
          }
        }
        break
      default:
        // Custom action
        onShortcut && onShortcut(shortcut.action, event)
    }
  }

  // Add to recent shortcuts
  const addToRecentShortcuts = (shortcut) => {
    setRecentShortcuts(prev => {
      const filtered = prev.filter(s => s.action !== shortcut.action)
      return [shortcut, ...filtered].slice(0, 5)
    })
  }

  // Screen reader announcements
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    
    document.body.appendChild(announcement)
    announcement.textContent = message
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // Get element announcement
  const getElementAnnouncement = (element) => {
    const role = element.getAttribute('role')
    const label = element.getAttribute('aria-label')
    const text = element.textContent?.trim()
    
    if (label) return label
    if (text) return `${role || 'Element'}: ${text}`
    return role ? `${role} element` : null
  }

  // Format shortcut keys for display
  const formatShortcutKeys = (keys) => {
    const keyMap = {
      'ctrl': '⌘',
      'alt': '⌥',
      'shift': '⇧',
      'enter': '↵',
      'escape': '⎋',
      'up': '↑',
      'down': '↓',
      'left': '←',
      'right': '→',
      'space': '␣'
    }
    
    return keys.map(key => keyMap[key] || key.toUpperCase()).join(' + ')
  }

  // Save custom shortcut
  const saveCustomShortcut = (action, keys, description, icon) => {
    const newShortcuts = {
      ...customShortcuts,
      [action]: { action, keys, description, icon }
    }
    
    setCustomShortcuts(newShortcuts)
    localStorage.setItem('cryb-keyboard-shortcuts', JSON.stringify(newShortcuts))
  }

  // Help modal component
  const ShortcutHelp = () => (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}} role="dialog" aria-labelledby="shortcuts-title">
      <div style={{
  borderRadius: '12px',
  width: '100%',
  overflow: 'hidden'
}}>
        <div style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h2 id="shortcuts-title" style={{
  fontWeight: '600',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center'
}}>
              <Keyboard style={{
  width: '24px',
  height: '24px'
}} />
              <span>Keyboard Shortcuts</span>
            </h2>
            <button
              onClick={onToggleHelp}
              style={{
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
              aria-label="Close shortcuts help"
            >
              <X style={{
  width: '20px',
  height: '20px'
}} />
            </button>
          </div>
        </div>
        
        <div style={{
  padding: '24px'
}}>
          {/* Current context shortcuts */}
          <div className="mb-6">
            <h3 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
              {context} Shortcuts
            </h3>
            <div className="space-y-3">
              {(defaultShortcuts[context] || []).map((shortcut, index) => {
                const Icon = shortcut.icon
                return (
                  <div key={index} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <Icon style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />
                      <span style={{
  color: '#ffffff'
}}>
                        {shortcut.description}
                      </span>
                    </div>
                    <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                      {formatShortcutKeys(shortcut.keys)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Global shortcuts */}
          {context !== 'global' && (
            <div className="mb-6">
              <h3 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                Global Shortcuts
              </h3>
              <div className="space-y-3">
                {defaultShortcuts.global.slice(0, 5).map((shortcut, index) => {
                  const Icon = shortcut.icon
                  return (
                    <div key={index} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <Icon style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />
                        <span style={{
  color: '#ffffff'
}}>
                          {shortcut.description}
                        </span>
                      </div>
                      <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                        {formatShortcutKeys(shortcut.keys)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Recent shortcuts */}
          {recentShortcuts.length > 0 && (
            <div>
              <h3 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                Recently Used
              </h3>
              <div className="space-y-2">
                {recentShortcuts.map((shortcut, index) => {
                  const Icon = shortcut.icon
                  return (
                    <div key={index} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px',
  borderRadius: '4px'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <Icon style={{
  width: '16px',
  height: '16px'
}} />
                        <span style={{
  color: '#ffffff'
}}>
                          {shortcut.description}
                        </span>
                      </div>
                      <div style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                        {formatShortcutKeys(shortcut.keys)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
        <div style={{
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)',
  textAlign: 'center'
}}>
          <p style={{
  color: '#A0A0A0'
}}>
            Press <kbd style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}>Ctrl + /</kbd> to show/hide this help
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Visual indicator for pressed keys (development mode) */}
      {import.meta.env.MODE === 'development' && pressedKeys.size > 0 && (
        <div style={{
  position: 'fixed',
  color: '#ffffff',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '4px'
}}>
          <div className="text-sm font-mono">
            {Array.from(pressedKeys).join(' + ')}
          </div>
        </div>
      )}
      
      {/* Help modal */}
      {showHelp && <ShortcutHelp />}
      
      {/* Accessibility enhancements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {/* Screen reader announcements will be inserted here */}
      </div>
    </>
  )
}

// Hook for using keyboard shortcuts in components
export const useKeyboardShortcuts = (shortcuts, context = 'global', dependencies = []) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const keyString = getKeyString(event)
      const shortcut = shortcuts.find(s => s.keys.join('+') === keyString)
      
      if (shortcut && typeof shortcut.handler === 'function') {
        event.preventDefault()
        shortcut.handler(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, ...dependencies])
}

// Utility function to get key string (same as above)
const getKeyString = (event) => {
  const parts = []
  
  if (event.metaKey || event.ctrlKey) parts.push('ctrl')
  if (event.altKey) parts.push('alt')
  if (event.shiftKey) parts.push('shift')
  
  const specialKeys = {
    ' ': 'space',
    'Enter': 'enter',
    'Escape': 'escape',
    'Tab': 'tab',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'Backspace': 'backspace',
    'Delete': 'delete'
  }
  
  const key = specialKeys[event.key] || event.key.toLowerCase()
  parts.push(key)
  
  return parts.join('+')
}



export default KeyboardShortcuts