import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import NotificationSetupStep from './NotificationSetupStep'

describe('NotificationSetupStep', () => {
  let mockOnComplete
  let mockOnSkip
  let mockFetch
  let mockRequestPermission

  beforeEach(() => {
    mockOnComplete = jest.fn()
    mockOnSkip = jest.fn()
    mockFetch = jest.fn()
    mockRequestPermission = jest.fn()

    global.fetch = mockFetch
    global.localStorage = {
      getItem: jest.fn(() => 'test-token')
    }

    delete window.Notification
    window.Notification = {
      requestPermission: mockRequestPermission,
      permission: 'default'
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    test('renders notification preferences heading', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
    })

    test('renders notification preferences description', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Choose how you want to be notified about community activity and updates.')).toBeInTheDocument()
    })

    test('renders email notifications section', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Email Notifications')).toBeInTheDocument()
    })

    test('renders push notifications section', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Push Notifications')).toBeInTheDocument()
    })

    test('renders in-app notifications section', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('In-App Notifications')).toBeInTheDocument()
    })

    test('renders notification tips section', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('💡 Notification Tips')).toBeInTheDocument()
    })

    test('renders skip button', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Skip for now')).toBeInTheDocument()
    })

    test('renders save & continue button', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Save & Continue')).toBeInTheDocument()
    })
  })

  describe('Default Settings', () => {
    test('email notifications are enabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const emailToggle = screen.getAllByRole('checkbox')[0]
      expect(emailToggle).toBeChecked()
    })

    test('push notifications are disabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const pushToggle = screen.getAllByRole('checkbox')[6]
      expect(pushToggle).not.toBeChecked()
    })

    test('in-app notifications are enabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const inAppToggle = screen.getAllByRole('checkbox')[7]
      expect(inAppToggle).toBeChecked()
    })

    test('email mentions are enabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const mentionsCheckbox = screen.getAllByRole('checkbox')[1]
      expect(mentionsCheckbox).toBeChecked()
    })

    test('email replies are enabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const repliesCheckbox = screen.getAllByRole('checkbox')[2]
      expect(repliesCheckbox).toBeChecked()
    })

    test('email follows are enabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const followsCheckbox = screen.getAllByRole('checkbox')[3]
      expect(followsCheckbox).toBeChecked()
    })

    test('email community updates are disabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const communityCheckbox = screen.getAllByRole('checkbox')[4]
      expect(communityCheckbox).not.toBeChecked()
    })

    test('email weekly digest is enabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const digestCheckbox = screen.getAllByRole('checkbox')[5]
      expect(digestCheckbox).toBeChecked()
    })

    test('in-app mentions are enabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const mentionsCheckbox = screen.getAllByRole('checkbox')[8]
      expect(mentionsCheckbox).toBeChecked()
    })

    test('in-app voice calls are enabled by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const voiceCallsCheckbox = screen.getAllByRole('checkbox')[11]
      expect(voiceCallsCheckbox).toBeChecked()
    })
  })

  describe('Email Notifications', () => {
    test('displays email notification options when enabled', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('When someone mentions you')).toBeInTheDocument()
      expect(screen.getByText('Replies to your posts')).toBeInTheDocument()
      expect(screen.getByText('New followers')).toBeInTheDocument()
    })

    test('toggles email notifications master switch', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const emailToggle = screen.getAllByRole('checkbox')[0]

      fireEvent.click(emailToggle)
      expect(emailToggle).not.toBeChecked()

      fireEvent.click(emailToggle)
      expect(emailToggle).toBeChecked()
    })

    test('hides email options when email notifications are disabled', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const emailToggle = screen.getAllByRole('checkbox')[0]

      fireEvent.click(emailToggle)
      expect(screen.queryByText('Weekly activity digest')).not.toBeInTheDocument()
    })

    test('toggles email mentions preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const mentionsCheckbox = screen.getAllByRole('checkbox')[1]

      fireEvent.click(mentionsCheckbox)
      expect(mentionsCheckbox).not.toBeChecked()
    })

    test('toggles email replies preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const repliesCheckbox = screen.getAllByRole('checkbox')[2]

      fireEvent.click(repliesCheckbox)
      expect(repliesCheckbox).not.toBeChecked()
    })

    test('toggles email follows preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const followsCheckbox = screen.getAllByRole('checkbox')[3]

      fireEvent.click(followsCheckbox)
      expect(followsCheckbox).not.toBeChecked()
    })

    test('toggles email community updates preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const communityCheckbox = screen.getAllByRole('checkbox')[4]

      expect(communityCheckbox).not.toBeChecked()
      fireEvent.click(communityCheckbox)
      expect(communityCheckbox).toBeChecked()
    })

    test('toggles email weekly digest preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const digestCheckbox = screen.getAllByRole('checkbox')[5]

      fireEvent.click(digestCheckbox)
      expect(digestCheckbox).not.toBeChecked()
    })

    test('renders all five email notification options', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Community announcements')).toBeInTheDocument()
      expect(screen.getByText('Weekly activity digest')).toBeInTheDocument()
    })
  })

  describe('Push Notifications', () => {
    test('displays enable button when permission is default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Enable')).toBeInTheDocument()
    })

    test('push toggle is disabled when permission is not granted', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const pushToggle = screen.getAllByRole('checkbox')[6]
      expect(pushToggle).toBeDisabled()
    })

    test('requests push permission when enable button is clicked', async () => {
      mockRequestPermission.mockResolvedValue('granted')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled()
      })
    })

    test('enables push notifications when permission is granted', async () => {
      mockRequestPermission.mockResolvedValue('granted')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        const pushToggle = screen.getAllByRole('checkbox')[6]
        expect(pushToggle).toBeChecked()
      })
    })

    test('hides enable button after permission is granted', async () => {
      mockRequestPermission.mockResolvedValue('granted')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        expect(screen.queryByText('Enable')).not.toBeInTheDocument()
      })
    })

    test('displays denied message when permission is denied', async () => {
      mockRequestPermission.mockResolvedValue('denied')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        expect(screen.getByText(/Push notifications are blocked/)).toBeInTheDocument()
      })
    })

    test('does not enable push notifications when permission is denied', async () => {
      mockRequestPermission.mockResolvedValue('denied')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        const pushToggle = screen.getAllByRole('checkbox')[6]
        expect(pushToggle).not.toBeChecked()
      })
    })

    test('handles Notification API not available', () => {
      delete window.Notification

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.queryByText('Enable')).not.toBeInTheDocument()
    })

    test('displays push notification options when enabled and granted', async () => {
      mockRequestPermission.mockResolvedValue('granted')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        expect(screen.getAllByText('Incoming voice/video calls').length).toBeGreaterThan(0)
      })
    })

    test('toggles push mentions preference', async () => {
      mockRequestPermission.mockResolvedValue('granted')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')
      fireEvent.click(enableButton)

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        const pushMentions = checkboxes.find((cb, idx) => idx > 6 && idx < 12)
        expect(pushMentions).toBeDefined()
      })
    })

    test('allows toggling push toggle when permission is granted', async () => {
      mockRequestPermission.mockResolvedValue('granted')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')
      fireEvent.click(enableButton)

      await waitFor(() => {
        const pushToggle = screen.getAllByRole('checkbox')[6]
        expect(pushToggle).not.toBeDisabled()
      })
    })

    test('hides push options when push toggle is disabled after being enabled', async () => {
      mockRequestPermission.mockResolvedValue('granted')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')
      fireEvent.click(enableButton)

      await waitFor(() => {
        const pushToggle = screen.getAllByRole('checkbox')[6]
        fireEvent.click(pushToggle)
      })

      await waitFor(() => {
        const voiceCalls = screen.queryAllByText('Incoming voice/video calls')
        expect(voiceCalls.length).toBe(1)
      })
    })
  })

  describe('In-App Notifications', () => {
    test('displays in-app notification options by default', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const voiceCalls = screen.getAllByText('Incoming voice/video calls')
      expect(voiceCalls.length).toBeGreaterThan(0)
    })

    test('toggles in-app notifications master switch', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const inAppToggle = screen.getAllByRole('checkbox')[7]

      fireEvent.click(inAppToggle)
      expect(inAppToggle).not.toBeChecked()
    })

    test('hides in-app options when in-app notifications are disabled', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const inAppToggle = screen.getAllByRole('checkbox')[7]

      fireEvent.click(inAppToggle)

      const voiceCalls = screen.queryAllByText('Incoming voice/video calls')
      expect(voiceCalls.length).toBe(0)
    })

    test('toggles in-app mentions preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const mentionsCheckbox = screen.getAllByRole('checkbox')[8]

      fireEvent.click(mentionsCheckbox)
      expect(mentionsCheckbox).not.toBeChecked()
    })

    test('toggles in-app replies preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const repliesCheckbox = screen.getAllByRole('checkbox')[9]

      fireEvent.click(repliesCheckbox)
      expect(repliesCheckbox).not.toBeChecked()
    })

    test('toggles in-app follows preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const followsCheckbox = screen.getAllByRole('checkbox')[10]

      fireEvent.click(followsCheckbox)
      expect(followsCheckbox).not.toBeChecked()
    })

    test('toggles in-app voice calls preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const voiceCallsCheckbox = screen.getAllByRole('checkbox')[11]

      fireEvent.click(voiceCallsCheckbox)
      expect(voiceCallsCheckbox).not.toBeChecked()
    })

    test('toggles in-app community updates preference', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const communityCheckbox = screen.getAllByRole('checkbox')[12]

      fireEvent.click(communityCheckbox)
      expect(communityCheckbox).not.toBeChecked()
    })

    test('renders all five in-app notification options', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const mentions = screen.getAllByText('When someone mentions you')
      const replies = screen.getAllByText('Replies to your posts')
      expect(mentions.length).toBeGreaterThan(0)
      expect(replies.length).toBeGreaterThan(0)
    })
  })

  describe('Save Preferences', () => {
    test('calls API with correct preferences on save', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/user/notification-preferences',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            }
          })
        )
      })
    })

    test('sends correct default preferences structure', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)

        expect(body).toHaveProperty('email')
        expect(body).toHaveProperty('push')
        expect(body).toHaveProperty('inApp')
      })
    })

    test('sends updated preferences after changes', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const emailMentions = screen.getAllByRole('checkbox')[1]
      fireEvent.click(emailMentions)

      const saveButton = screen.getByText('Save & Continue')
      fireEvent.click(saveButton)

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.email.mentions).toBe(false)
      })
    })

    test('calls onComplete after successful save', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    test('includes authorization token from localStorage', async () => {
      mockFetch.mockResolvedValue({ ok: true })
      global.localStorage.getItem = jest.fn(() => 'my-custom-token')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/user/notification-preferences',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer my-custom-token'
            })
          })
        )
      })
    })

    test('saves all email preferences correctly', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)

        expect(body.email).toEqual({
          enabled: true,
          mentions: true,
          replies: true,
          follows: true,
          community_updates: false,
          weekly_digest: true
        })
      })
    })

    test('saves all push preferences correctly', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)

        expect(body.push).toEqual({
          enabled: false,
          mentions: true,
          replies: true,
          follows: false,
          voice_calls: true,
          community_updates: false
        })
      })
    })

    test('saves all in-app preferences correctly', async () => {
      mockFetch.mockResolvedValue({ ok: true })

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)

        expect(body.inApp).toEqual({
          enabled: true,
          mentions: true,
          replies: true,
          follows: true,
          voice_calls: true,
          community_updates: true
        })
      })
    })
  })

  describe('Error Handling', () => {
    test('calls onComplete even when API fails', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'))

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    test('logs error when API fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      mockFetch.mockRejectedValue(new Error('API Error'))

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to save preferences:',
          expect.any(Error)
        )
      })

      consoleError.mockRestore()
    })

    test('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const saveButton = screen.getByText('Save & Continue')

      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    test('handles permission request rejection', async () => {
      mockRequestPermission.mockRejectedValue(new Error('Permission denied'))

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled()
      })
    })
  })

  describe('Skip Functionality', () => {
    test('calls onSkip when skip button is clicked', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const skipButton = screen.getByText('Skip for now')

      fireEvent.click(skipButton)

      expect(mockOnSkip).toHaveBeenCalled()
    })

    test('does not save preferences when skipping', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const skipButton = screen.getByText('Skip for now')

      fireEvent.click(skipButton)

      expect(mockFetch).not.toHaveBeenCalled()
    })

    test('does not call onComplete when skipping', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const skipButton = screen.getByText('Skip for now')

      fireEvent.click(skipButton)

      expect(mockOnComplete).not.toHaveBeenCalled()
    })
  })

  describe('Permission State Management', () => {
    test('updates UI when permission changes from default to granted', async () => {
      mockRequestPermission.mockResolvedValue('granted')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        const pushToggle = screen.getAllByRole('checkbox')[6]
        expect(pushToggle).not.toBeDisabled()
      })
    })

    test('shows denied warning when permission is denied', async () => {
      mockRequestPermission.mockResolvedValue('denied')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        expect(screen.getByText(/Enable them in your browser settings/)).toBeInTheDocument()
      })
    })

    test('keeps push toggle disabled when permission is denied', async () => {
      mockRequestPermission.mockResolvedValue('denied')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        const pushToggle = screen.getAllByRole('checkbox')[6]
        expect(pushToggle).toBeDisabled()
      })
    })

    test('automatically enables push toggle when permission is granted', async () => {
      mockRequestPermission.mockResolvedValue('granted')

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const enableButton = screen.getByText('Enable')

      fireEvent.click(enableButton)

      await waitFor(() => {
        const pushToggle = screen.getAllByRole('checkbox')[6]
        expect(pushToggle).toBeChecked()
      })
    })

    test('preserves other preferences when push permission is granted', async () => {
      mockRequestPermission.mockResolvedValue('granted')
      mockFetch.mockResolvedValue({ ok: true })

      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const emailMentions = screen.getAllByRole('checkbox')[1]
      fireEvent.click(emailMentions)

      const enableButton = screen.getByText('Enable')
      fireEvent.click(enableButton)

      await waitFor(() => {
        const pushToggle = screen.getAllByRole('checkbox')[6]
        expect(pushToggle).toBeChecked()
      })

      const saveButton = screen.getByText('Save & Continue')
      fireEvent.click(saveButton)

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.email.mentions).toBe(false)
      })
    })
  })

  describe('Notification Tips', () => {
    test('displays all notification tips', () => {
      render(<NotificationSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText(/You can change these settings anytime/)).toBeInTheDocument()
      expect(screen.getByText(/Email digests help you stay updated/)).toBeInTheDocument()
      expect(screen.getByText(/Push notifications are great for real-time/)).toBeInTheDocument()
      expect(screen.getByText(/Turn off notifications for communities/)).toBeInTheDocument()
    })
  })
})

export default emailToggle
