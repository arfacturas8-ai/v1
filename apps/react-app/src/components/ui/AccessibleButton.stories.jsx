/**
 * Storybook stories for AccessibleButton component
 * Demonstrates all accessibility features and variants
 */

import React from 'react'
import AccessibleButton from './AccessibleButton'
import { Search, Send, Plus, Download, Trash2 } from 'lucide-react'

export default {
  title: 'Components/AccessibleButton',
  component: AccessibleButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'destructive', 'ghost', 'link'],
      description: 'Button visual variant'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button'
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state'
    }
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'button-name',
            enabled: true
          }
        ]
      }
    }
  }
}

// Default button with text
export const Default = {
  args: {
    children: 'Click Me'
  }
}

// Primary button
export const Primary = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
}

// Icon-only button (requires aria-label)
export const IconOnly = {
  args: {
    icon: <Search className="w-4 h-4" />,
    ariaLabel: 'Search',
    variant: 'ghost'
  }
}

// Button with icon and text
export const WithIcon = {
  args: {
    icon: <Send className="w-4 h-4" />,
    children: 'Send Message',
    variant: 'primary'
  }
}

// Loading state
export const Loading = {
  args: {
    loading: true,
    children: 'Submitting...'
  }
}

// Disabled button
export const Disabled = {
  args: {
    disabled: true,
    children: 'Disabled Button'
  }
}

// Destructive action
export const Destructive = {
  args: {
    variant: 'destructive',
    icon: <Trash2 className="w-4 h-4" />,
    children: 'Delete',
    ariaLabel: 'Delete item'
  }
}

// Button with expanded state (for dropdowns)
export const WithExpandedState = {
  args: {
    children: 'Options',
    ariaHaspopup: 'menu',
    ariaExpanded: true,
    ariaControls: 'menu-123'
  }
}

// Button with toggle state
export const ToggleButton = {
  args: {
    icon: <Plus className="w-4 h-4" />,
    children: 'Follow',
    ariaPressed: false
  },
  play: async ({ canvasElement }) => {
    // Example interaction test
    const button = canvasElement.querySelector('button')
    if (button) {
      button.click()
    }
  }
}

// Accessibility test scenario
export const AccessibilityTest = () => (
  <div className="space-y-4 p-8">
    <h2 className="text-xl font-bold mb-4">Accessibility Testing</h2>

    <div className="space-y-2">
      <h3 className="font-semibold">Keyboard Navigation</h3>
      <div className="flex gap-2">
        <AccessibleButton>Tab to me</AccessibleButton>
        <AccessibleButton>Then to me</AccessibleButton>
        <AccessibleButton>Finally here</AccessibleButton>
      </div>
      <p className="text-sm text-gray-600">
        Press Tab to navigate between buttons
      </p>
    </div>

    <div className="space-y-2">
      <h3 className="font-semibold">Screen Reader Announcements</h3>
      <div className="flex gap-2">
        <AccessibleButton
          icon={<Download className="w-4 h-4" />}
          ariaLabel="Download report as PDF"
        />
        <AccessibleButton
          icon={<Trash2 className="w-4 h-4" />}
          ariaLabel="Delete selected items"
          variant="destructive"
        />
      </div>
      <p className="text-sm text-gray-600">
        Icon-only buttons have aria-labels for screen readers
      </p>
    </div>

    <div className="space-y-2">
      <h3 className="font-semibold">Loading States</h3>
      <div className="flex gap-2">
        <AccessibleButton loading>Processing...</AccessibleButton>
        <AccessibleButton disabled>Disabled</AccessibleButton>
      </div>
      <p className="text-sm text-gray-600">
        Loading and disabled states are announced to screen readers
      </p>
    </div>
  </div>
)

