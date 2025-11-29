/**
 * Storybook stories for Accessibility Utilities
 * Demonstrates accessible patterns and components
 */

import React, { useState } from 'react'
import {
  AccessibleModal,
  AccessibleFormField,
  AccessibleTabs,
  SkipToContent,
  VisuallyHidden,
  announce
} from './accessibility'

export default {
  title: 'Utilities/Accessibility',
  parameters: {
    layout: 'padded',
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'aria-roles',
            enabled: true
          }
        ]
      }
    }
  }
}

// Accessible Modal
export const Modal = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Open Modal
      </button>

      <AccessibleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Modal"
        description="This modal is fully accessible with focus trapping and keyboard navigation."
      >
        <div className="space-y-4">
          <p>Try pressing Tab to navigate, or Escape to close.</p>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#21262d] rounded hover:bg-gray-300">
              Action 1
            </button>
            <button className="px-4 py-2 bg-[#21262d] rounded hover:bg-gray-300">
              Action 2
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </AccessibleModal>
    </div>
  )
}

// Accessible Form Field
export const FormField = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
    } else {
      setError('')
      announce('Form submitted successfully', 'polite')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <AccessibleFormField
        label="Email Address"
        error={error}
        required
        helpText="We'll never share your email with anyone."
        id="email-field"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-white/15 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </AccessibleFormField>

      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  )
}

// Accessible Tabs
export const Tabs = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'settings', label: 'Settings' }
  ]

  return (
    <div className="max-w-2xl">
      <AccessibleTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      >
        {(tab) => (
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-semibold mb-2">{tab.label} Content</h3>
            <p>
              This is the {tab.label} panel. Use arrow keys to navigate between tabs.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Press Right Arrow to move to next tab</li>
              <li>• Press Left Arrow to move to previous tab</li>
              <li>• Press Home to go to first tab</li>
              <li>• Press End to go to last tab</li>
            </ul>
          </div>
        )}
      </AccessibleTabs>
    </div>
  )
}

// Skip to Content Link
export const SkipLink = () => (
  <div className="min-h-screen">
    <SkipToContent targetId="main-content" />

    <header className="bg-gray-800 text-white p-4">
      <p className="text-sm text-gray-300 mb-2">
        Press Tab to reveal the "Skip to main content" link
      </p>
      <nav className="flex gap-4">
        <a href="#" className="hover:underline">Home</a>
        <a href="#" className="hover:underline">About</a>
        <a href="#" className="hover:underline">Contact</a>
      </nav>
    </header>

    <main id="main-content" className="p-8">
      <h1 className="text-2xl font-bold mb-4">Main Content</h1>
      <p>This is the main content area that the skip link points to.</p>
    </main>
  </div>
)

// Visually Hidden Text
export const VisuallyHiddenText = () => (
  <div className="space-y-4">
    <div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        <span aria-hidden="true">🔍</span>
        <VisuallyHidden>Search</VisuallyHidden>
      </button>
      <p className="mt-2 text-sm text-gray-600">
        This button has an emoji visible, but screen readers will announce "Search"
      </p>
    </div>

    <div>
      <a href="#" className="text-blue-600 hover:underline">
        Learn more
        <VisuallyHidden>about accessibility features</VisuallyHidden>
      </a>
      <p className="mt-2 text-sm text-gray-600">
        Screen readers will hear: "Learn more about accessibility features"
        <br />
        Visual users see: "Learn more"
      </p>
    </div>
  </div>
)

// Live Announcements
export const LiveAnnouncements = () => {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    const newCount = count + 1
    setCount(newCount)
    announce(`Count updated to ${newCount}`, 'polite')
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Click the button below. Screen readers will announce the count change.
      </p>

      <div>
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Increment Count
        </button>
        <p className="mt-2 text-2xl font-bold">Count: {count}</p>
      </div>

      <p className="text-sm text-gray-500">
        The announce() function creates a live region that screen readers monitor
        for updates.
      </p>
    </div>
  )
}

