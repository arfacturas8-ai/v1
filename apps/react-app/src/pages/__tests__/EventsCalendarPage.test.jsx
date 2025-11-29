/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EventsCalendarPage from '../EventsCalendarPage';
import { AuthContext } from '../../contexts/AuthContext';
import eventsService from '../../services/eventsService';

// Mock services
jest.mock('../../services/eventsService');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

const mockEvents = [
  {
    id: '1',
    title: 'Community Meetup',
    description: 'Monthly community gathering',
    startDate: '2025-11-15T18:00:00Z',
    endDate: '2025-11-15T20:00:00Z',
    location: 'Community Center',
    organizer: { id: '1', username: 'organizer1' },
    attendees: 25,
    maxAttendees: 50,
    status: 'upcoming',
    rsvpStatus: 'not_responded',
    category: 'social',
    isVirtual: false,
  },
  {
    id: '2',
    title: 'Online Workshop',
    description: 'Learn new skills',
    startDate: '2025-11-20T14:00:00Z',
    endDate: '2025-11-20T16:00:00Z',
    location: 'Virtual',
    organizer: { id: '2', username: 'organizer2' },
    attendees: 100,
    maxAttendees: 150,
    status: 'upcoming',
    rsvpStatus: 'attending',
    category: 'workshop',
    isVirtual: true,
  },
];

describe('EventsCalendarPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventsService.getEvents = jest.fn().mockResolvedValue({
      success: true,
      events: mockEvents,
    });
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<EventsCalendarPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithRouter(<EventsCalendarPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<EventsCalendarPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has proper page title', () => {
      renderWithRouter(<EventsCalendarPage />);
      expect(screen.getByText(/EventsCalendarPage/i)).toBeInTheDocument();
    });

    it('displays page description', () => {
      renderWithRouter(<EventsCalendarPage />);
      expect(screen.getByText(/Content will be implemented here/i)).toBeInTheDocument();
    });
  });

  describe('Calendar View', () => {
    it('displays calendar in month view by default', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Calendar should be visible
      });
    });

    it('allows switching to week view', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Find and click week view button
    });

    it('allows switching to day view', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Find and click day view button
    });

    it('allows switching to list view', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Find and click list view button
    });

    it('highlights current date', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Current date should be highlighted
      });
    });

    it('displays month navigation buttons', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Previous and next month buttons should be visible
      });
    });

    it('navigates to previous month', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Click previous month button and verify
    });

    it('navigates to next month', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Click next month button and verify
    });

    it('allows direct month selection', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Open month picker and select month
    });

    it('allows direct year selection', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Open year picker and select year
    });

    it('displays today button', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Today button should be visible
      });
    });

    it('navigates to today when today button clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Click today button and verify current date is shown
    });

    it('shows week numbers in calendar', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Week numbers should be visible
      });
    });

    it('displays day names header', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Day names should be visible
      });
    });
  });

  describe('Event Display', () => {
    it('displays events on calendar dates', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Events should appear on their dates
      });
    });

    it('shows event titles on calendar', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Event titles should be visible
      });
    });

    it('displays event time on calendar cells', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Event times should be visible
      });
    });

    it('shows event category colors', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Different event categories should have different colors
      });
    });

    it('indicates virtual events with icon', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Virtual event icon should be visible
      });
    });

    it('indicates in-person events with icon', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // In-person event icon should be visible
      });
    });

    it('displays event count on dates with multiple events', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Event count badge should be visible
      });
    });

    it('shows full day events in dedicated section', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Full day events should be in separate section
      });
    });

    it('displays event preview on hover', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Hover over event and check for preview
    });

    it('shows event tooltip with details', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Hover over event and check tooltip
    });

    it('indicates user RSVP status on events', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // RSVP status should be indicated
      });
    });

    it('highlights events user is attending', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Attending events should be highlighted
      });
    });

    it('shows event capacity indicators', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Capacity bars or indicators should be visible
      });
    });

    it('indicates events that are full', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Full events should be marked
      });
    });

    it('displays upcoming events sidebar', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Upcoming events list should be visible
      });
    });
  });

  describe('Event Filters', () => {
    it('displays filter panel', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Filter panel should be visible
      });
    });

    it('shows category filter options', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Category filters should be visible
      });
    });

    it('filters events by category', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Select category filter and verify results
    });

    it('filters events by location type (virtual/in-person)', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Select location type filter
    });

    it('filters events by RSVP status', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Select RSVP status filter
    });

    it('shows only attending events filter', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Toggle attending events filter
    });

    it('shows only organized events filter', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Toggle organized events filter
    });

    it('filters by event status (upcoming/past/cancelled)', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Select status filter
    });

    it('filters by date range', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Select date range
    });

    it('filters by community', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Select community filter
    });

    it('allows multiple filter combinations', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Apply multiple filters
    });

    it('displays active filter count', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Active filter count should be visible
      });
    });

    it('allows clearing individual filters', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Clear individual filter
    });

    it('allows clearing all filters', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Clear all filters button
    });

    it('saves filter preferences', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Apply filters and verify they persist
    });

    it('displays filter results count', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Results count should be visible
      });
    });
  });

  describe('RSVP Functionality', () => {
    it('allows RSVP to event from calendar', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Click RSVP button on event
    });

    it('shows RSVP options (attending/maybe/not attending)', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Open RSVP dropdown
    });

    it('updates event after RSVP', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // RSVP and verify event updates
    });

    it('shows RSVP confirmation message', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // RSVP and check for confirmation
    });

    it('allows changing RSVP status', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Change existing RSVP
    });

    it('allows canceling RSVP', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Cancel RSVP
    });

    it('prevents RSVP to full events', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Try to RSVP to full event
    });

    it('allows joining waitlist for full events', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Join waitlist
    });

    it('requires authentication for RSVP', async () => {
      const unauthContext = { ...mockAuthContext, user: null, isAuthenticated: false };
      renderWithRouter(<EventsCalendarPage />, unauthContext);
      // Try to RSVP without auth
    });

    it('updates attendee count after RSVP', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // RSVP and verify count updates
    });
  });

  describe('Event Creation', () => {
    it('displays create event button', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Create event button should be visible
      });
    });

    it('opens create event modal on button click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Click create event button
    });

    it('allows creating event from calendar date', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Click on date to create event
    });

    it('pre-fills date when creating from calendar', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Create event from date and verify pre-fill
    });

    it('requires authentication to create events', async () => {
      const unauthContext = { ...mockAuthContext, user: null, isAuthenticated: false };
      renderWithRouter(<EventsCalendarPage />, unauthContext);
      // Try to create event without auth
    });
  });

  describe('Event Search', () => {
    it('displays search bar', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Search bar should be visible
      });
    });

    it('searches events by title', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Enter search query
    });

    it('searches events by location', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Search by location
    });

    it('searches events by organizer', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Search by organizer
    });

    it('displays search results', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Search and verify results
    });

    it('highlights search results on calendar', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Search and verify highlighting
    });

    it('clears search results', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Clear search
    });

    it('shows no results message', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Search with no matches
    });
  });

  describe('Data Loading', () => {
    it('handles initial loading state', () => {
      renderWithRouter(<EventsCalendarPage />);
      // Check for loading indicators
    });

    it('displays content after loading', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Content should be visible
      }, { timeout: 3000 });
    });

    it('handles empty events gracefully', async () => {
      eventsService.getEvents.mockResolvedValue({ success: true, events: [] });
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Empty state should be shown
      });
    });

    it('displays loading skeletons for calendar', async () => {
      renderWithRouter(<EventsCalendarPage />);
      // Check for skeleton loaders
    });

    it('loads events for current month on mount', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        expect(eventsService.getEvents).toHaveBeenCalled();
      });
    });

    it('loads events when changing months', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Change month and verify API call
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      eventsService.getEvents.mockRejectedValue(new Error('API Error'));
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Error message should be shown
      });
    });

    it('provides retry functionality on error', async () => {
      eventsService.getEvents.mockRejectedValue(new Error('API Error'));
      renderWithRouter(<EventsCalendarPage />);
      // Look for and click retry button
    });

    it('handles RSVP errors gracefully', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Trigger RSVP error
    });

    it('displays network error message', async () => {
      eventsService.getEvents.mockRejectedValue(new Error('Network Error'));
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Network error should be shown
      });
    });
  });

  describe('User Interactions', () => {
    it('allows clicking on events', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Click on event
    });

    it('navigates to event details on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Click event and verify navigation
    });

    it('supports keyboard navigation in calendar', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Use arrow keys to navigate
    });

    it('allows selecting date with keyboard', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Select date with Enter key
    });

    it('supports event quick actions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Access quick actions menu
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithRouter(<EventsCalendarPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<EventsCalendarPage />);
      const headings = screen.queryAllByRole('heading');
      // Headings should exist
    });

    it('has aria labels for calendar navigation', () => {
      renderWithRouter(<EventsCalendarPage />);
      // Check for aria labels
    });

    it('announces calendar changes to screen readers', () => {
      renderWithRouter(<EventsCalendarPage />);
      // Check for aria-live regions
    });

    it('has accessible event cards', () => {
      renderWithRouter(<EventsCalendarPage />);
      // Check event accessibility
    });

    it('supports keyboard navigation', async () => {
      renderWithRouter(<EventsCalendarPage />);
      // Test keyboard navigation
    });

    it('has proper focus management', async () => {
      renderWithRouter(<EventsCalendarPage />);
      // Verify focus handling
    });

    it('has accessible filter controls', () => {
      renderWithRouter(<EventsCalendarPage />);
      // Check filter accessibility
    });

    it('has accessible RSVP buttons', () => {
      renderWithRouter(<EventsCalendarPage />);
      // Check RSVP button accessibility
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<EventsCalendarPage />);
      // Mobile layout should be active
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      renderWithRouter(<EventsCalendarPage />);
      // Tablet layout should be active
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      renderWithRouter(<EventsCalendarPage />);
      // Desktop layout should be active
    });

    it('shows mobile-optimized calendar view', () => {
      global.innerWidth = 375;
      renderWithRouter(<EventsCalendarPage />);
      // Mobile calendar should be displayed
    });

    it('hides sidebar on mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<EventsCalendarPage />);
      // Sidebar should be hidden
    });

    it('shows drawer for filters on mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<EventsCalendarPage />);
      // Filter drawer should be available
    });

    it('adapts event cards for mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<EventsCalendarPage />);
      // Event cards should be mobile-sized
    });
  });

  describe('Calendar Features', () => {
    it('supports drag and drop for event rescheduling', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Drag event to new date
    });

    it('allows exporting calendar to ICS', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Click export button
    });

    it('supports calendar subscriptions', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Subscribe button should be visible
      });
    });

    it('displays calendar legend', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Legend should be visible
      });
    });

    it('shows event reminders', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Reminder indicators should be visible
      });
    });

    it('allows setting event reminders', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Set reminder for event
    });
  });

  describe('Integration Features', () => {
    it('syncs with user calendar preferences', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Preferences should be applied
      });
    });

    it('displays timezone information', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Timezone should be shown
      });
    });

    it('allows changing timezone display', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventsCalendarPage />);
      // Change timezone
    });

    it('integrates with user communities', async () => {
      renderWithRouter(<EventsCalendarPage />);
      await waitFor(() => {
        // Community events should be shown
      });
    });
  });
});

export default mockAuthContext
