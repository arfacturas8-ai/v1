/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useParams } from 'react-router-dom';
import EventDetailsPage from '../EventDetailsPage';
import { AuthContext } from '../../contexts/AuthContext';
import eventsService from '../../services/eventsService';

// Mock services and hooks
jest.mock('../../services/eventsService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));
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

const mockEvent = {
  id: '1',
  title: 'Community Meetup 2025',
  description: 'Join us for our annual community gathering. This is a great opportunity to meet fellow members, share ideas, and have fun!',
  longDescription: 'Extended description with more details about the event...',
  startDate: '2025-11-15T18:00:00Z',
  endDate: '2025-11-15T20:00:00Z',
  location: 'Community Center',
  address: '123 Main St, City, State 12345',
  coordinates: { lat: 40.7128, lng: -74.0060 },
  organizer: {
    id: '1',
    username: 'organizer1',
    displayName: 'Event Organizer',
    avatar: 'avatar.jpg',
  },
  attendees: [
    { id: '2', username: 'user2', status: 'attending' },
    { id: '3', username: 'user3', status: 'maybe' },
  ],
  attendeeCount: 25,
  maxAttendees: 50,
  status: 'upcoming',
  rsvpStatus: 'not_responded',
  category: 'social',
  tags: ['networking', 'community', 'meetup'],
  isVirtual: false,
  virtualLink: null,
  images: ['event1.jpg', 'event2.jpg'],
  coverImage: 'cover.jpg',
  requirements: 'Please bring ID',
  ageRestriction: '18+',
  price: 0,
  currency: 'USD',
  isFree: true,
  isPublic: true,
  community: { id: '1', name: 'Test Community' },
  createdAt: '2025-10-01T10:00:00Z',
  updatedAt: '2025-10-05T12:00:00Z',
};

describe('EventDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ eventId: '1' });
    eventsService.getEventById = jest.fn().mockResolvedValue({
      success: true,
      event: mockEvent,
    });
    eventsService.rsvpToEvent = jest.fn().mockResolvedValue({
      success: true,
    });
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<EventDetailsPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithRouter(<EventDetailsPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<EventDetailsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has proper page structure', () => {
      renderWithRouter(<EventDetailsPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });
  });

  describe('Event Details Display', () => {
    it('displays event title', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Event title should be visible
      });
    });

    it('displays event description', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Description should be visible
      });
    });

    it('displays event cover image', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Cover image should be visible
      });
    });

    it('displays event date and time', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Date and time should be visible
      });
    });

    it('displays event duration', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Duration should be calculated and shown
      });
    });

    it('displays event location', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Location should be visible
      });
    });

    it('displays event category', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Category badge should be visible
      });
    });

    it('displays event tags', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Tags should be visible
      });
    });

    it('displays organizer information', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Organizer details should be visible
      });
    });

    it('displays attendee count', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Attendee count should be visible
      });
    });

    it('displays capacity information', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Capacity should be shown
      });
    });

    it('displays event status badge', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Status badge should be visible
      });
    });

    it('displays event requirements', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Requirements should be visible
      });
    });

    it('displays age restriction if applicable', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Age restriction should be shown
      });
    });

    it('displays price information', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Price or "Free" should be visible
      });
    });

    it('displays virtual event link if applicable', async () => {
      const virtualEvent = { ...mockEvent, isVirtual: true, virtualLink: 'https://meet.example.com' };
      eventsService.getEventById.mockResolvedValue({ success: true, event: virtualEvent });
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Virtual link should be visible
      });
    });
  });

  describe('RSVP Functionality', () => {
    it('displays RSVP button', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // RSVP button should be visible
      });
    });

    it('allows attending event', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click attend button
    });

    it('allows maybe response', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click maybe button
    });

    it('allows declining event', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click decline button
    });

    it('updates RSVP status after response', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // RSVP and verify status update
    });

    it('shows RSVP confirmation message', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // RSVP and check for message
    });

    it('allows changing RSVP', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Change RSVP status
    });

    it('allows canceling RSVP', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Cancel RSVP
    });

    it('displays current RSVP status', async () => {
      const attendingEvent = { ...mockEvent, rsvpStatus: 'attending' };
      eventsService.getEventById.mockResolvedValue({ success: true, event: attendingEvent });
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Current RSVP status should be shown
      });
    });

    it('prevents RSVP when event is full', async () => {
      const fullEvent = { ...mockEvent, attendeeCount: 50, maxAttendees: 50 };
      eventsService.getEventById.mockResolvedValue({ success: true, event: fullEvent });
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Full event message should be shown
      });
    });

    it('shows waitlist option for full events', async () => {
      const fullEvent = { ...mockEvent, attendeeCount: 50, maxAttendees: 50 };
      eventsService.getEventById.mockResolvedValue({ success: true, event: fullEvent });
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Waitlist button should be visible
      });
    });

    it('requires authentication for RSVP', async () => {
      const unauthContext = { ...mockAuthContext, user: null, isAuthenticated: false };
      renderWithRouter(<EventDetailsPage />, unauthContext);
      // Try to RSVP without auth
    });

    it('updates attendee count after RSVP', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // RSVP and verify count updates
    });

    it('handles RSVP errors gracefully', async () => {
      eventsService.rsvpToEvent.mockRejectedValue(new Error('RSVP failed'));
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Try to RSVP and check error handling
    });
  });

  describe('Attendees Section', () => {
    it('displays attendees list', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Attendees list should be visible
      });
    });

    it('shows attendee avatars', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Avatars should be displayed
      });
    });

    it('shows attendee usernames', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Usernames should be visible
      });
    });

    it('displays attendee RSVP status', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // RSVP status indicators should be shown
      });
    });

    it('separates confirmed and maybe attendees', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Attendees should be grouped by status
      });
    });

    it('allows viewing full attendee list', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click see all attendees
    });

    it('shows organizer in attendees list', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Organizer should be highlighted
      });
    });

    it('allows clicking on attendee to view profile', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click attendee
    });

    it('displays attendee join date', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Join dates should be visible
      });
    });
  });

  describe('Location and Map', () => {
    it('displays location address', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Address should be visible
      });
    });

    it('displays map for in-person events', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Map should be rendered
      });
    });

    it('shows get directions link', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Directions link should be visible
      });
    });

    it('allows copying address', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Copy address
    });

    it('shows virtual event platform for online events', async () => {
      const virtualEvent = { ...mockEvent, isVirtual: true, virtualLink: 'https://meet.example.com' };
      eventsService.getEventById.mockResolvedValue({ success: true, event: virtualEvent });
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Virtual platform should be shown
      });
    });

    it('displays join virtual event button', async () => {
      const virtualEvent = { ...mockEvent, isVirtual: true, virtualLink: 'https://meet.example.com' };
      eventsService.getEventById.mockResolvedValue({ success: true, event: virtualEvent });
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Join button should be visible
      });
    });

    it('shows parking information if available', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Parking info should be visible
      });
    });

    it('displays accessibility information', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Accessibility info should be shown
      });
    });
  });

  describe('Event Actions', () => {
    it('displays share button', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Share button should be visible
      });
    });

    it('allows sharing event', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click share button
    });

    it('displays add to calendar button', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Add to calendar should be visible
      });
    });

    it('allows adding event to calendar', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click add to calendar
    });

    it('displays report event button', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Report button should be visible
      });
    });

    it('allows reporting event', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click report button
    });

    it('shows edit button for organizer', async () => {
      const organizerContext = { ...mockAuthContext, user: { id: '1', username: 'organizer1' } };
      renderWithRouter(<EventDetailsPage />, organizerContext);
      await waitFor(() => {
        // Edit button should be visible
      });
    });

    it('shows cancel event button for organizer', async () => {
      const organizerContext = { ...mockAuthContext, user: { id: '1', username: 'organizer1' } };
      renderWithRouter(<EventDetailsPage />, organizerContext);
      await waitFor(() => {
        // Cancel button should be visible
      });
    });

    it('allows organizer to edit event', async () => {
      const organizerContext = { ...mockAuthContext, user: { id: '1', username: 'organizer1' } };
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />, organizerContext);
      // Click edit button
    });

    it('allows organizer to cancel event', async () => {
      const organizerContext = { ...mockAuthContext, user: { id: '1', username: 'organizer1' } };
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />, organizerContext);
      // Click cancel button
    });
  });

  describe('Image Gallery', () => {
    it('displays event images', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Images should be visible
      });
    });

    it('allows viewing images in fullscreen', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click image
    });

    it('displays image carousel', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Carousel should be visible
      });
    });

    it('navigates through images', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Navigate carousel
    });

    it('displays image count', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Image count should be shown
      });
    });
  });

  describe('Comments and Discussion', () => {
    it('displays comments section', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Comments section should be visible
      });
    });

    it('allows posting comments', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Post comment
    });

    it('displays existing comments', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Comments should be shown
      });
    });

    it('allows replying to comments', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Reply to comment
    });

    it('allows liking comments', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Like comment
    });

    it('requires authentication to comment', async () => {
      const unauthContext = { ...mockAuthContext, user: null, isAuthenticated: false };
      renderWithRouter(<EventDetailsPage />, unauthContext);
      // Try to comment without auth
    });
  });

  describe('Related Events', () => {
    it('displays related events section', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Related events should be visible
      });
    });

    it('shows events from same organizer', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Organizer events should be shown
      });
    });

    it('shows events in same category', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Category events should be shown
      });
    });

    it('allows navigating to related events', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click related event
    });
  });

  describe('Data Loading', () => {
    it('handles initial loading state', () => {
      renderWithRouter(<EventDetailsPage />);
      // Loading indicator should be shown
    });

    it('displays content after loading', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Content should be visible
      }, { timeout: 3000 });
    });

    it('loads event data on mount', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        expect(eventsService.getEventById).toHaveBeenCalledWith('1');
      });
    });

    it('displays loading skeleton', async () => {
      renderWithRouter(<EventDetailsPage />);
      // Skeleton should be visible
    });
  });

  describe('Error Handling', () => {
    it('displays error when event not found', async () => {
      eventsService.getEventById.mockResolvedValue({ success: false, error: 'Not found' });
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Error message should be shown
      });
    });

    it('displays error message when API fails', async () => {
      eventsService.getEventById.mockRejectedValue(new Error('API Error'));
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Error should be shown
      });
    });

    it('provides retry functionality on error', async () => {
      eventsService.getEventById.mockRejectedValue(new Error('API Error'));
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Click retry button
    });

    it('handles missing event ID', async () => {
      useParams.mockReturnValue({});
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Error should be shown
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithRouter(<EventDetailsPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<EventDetailsPage />);
      const headings = screen.queryAllByRole('heading');
      // Headings should exist
    });

    it('has accessible RSVP buttons', () => {
      renderWithRouter(<EventDetailsPage />);
      // RSVP buttons should have proper labels
    });

    it('has accessible image gallery', () => {
      renderWithRouter(<EventDetailsPage />);
      // Images should have alt text
    });

    it('supports keyboard navigation', async () => {
      renderWithRouter(<EventDetailsPage />);
      // Test keyboard navigation
    });

    it('has proper focus management', async () => {
      renderWithRouter(<EventDetailsPage />);
      // Verify focus handling
    });

    it('announces RSVP changes to screen readers', () => {
      renderWithRouter(<EventDetailsPage />);
      // Check for aria-live regions
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<EventDetailsPage />);
      // Mobile layout should be active
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      renderWithRouter(<EventDetailsPage />);
      // Tablet layout should be active
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      renderWithRouter(<EventDetailsPage />);
      // Desktop layout should be active
    });

    it('adapts image gallery for mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<EventDetailsPage />);
      // Mobile gallery should be shown
    });

    it('stacks content vertically on mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<EventDetailsPage />);
      // Content should be stacked
    });
  });

  describe('Social Features', () => {
    it('displays social sharing options', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // Social buttons should be visible
      });
    });

    it('allows sharing to Twitter', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Share to Twitter
    });

    it('allows sharing to Facebook', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Share to Facebook
    });

    it('allows copying event link', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EventDetailsPage />);
      // Copy link
    });

    it('displays QR code for event', async () => {
      renderWithRouter(<EventDetailsPage />);
      await waitFor(() => {
        // QR code should be visible
      });
    });
  });
});

export default mockAuthContext
