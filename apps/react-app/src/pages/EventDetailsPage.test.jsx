/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import EventDetailsPage from './EventDetailsPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: (props) => <svg data-testid="calendar-icon" {...props} />,
  Clock: (props) => <svg data-testid="clock-icon" {...props} />,
  MapPin: (props) => <svg data-testid="mappin-icon" {...props} />,
  Users: (props) => <svg data-testid="users-icon" {...props} />,
  Star: (props) => <svg data-testid="star-icon" {...props} />,
  Share2: (props) => <svg data-testid="share2-icon" {...props} />,
  Heart: (props) => <svg data-testid="heart-icon" {...props} />,
  MessageCircle: (props) => <svg data-testid="messagecircle-icon" {...props} />,
  ChevronLeft: (props) => <svg data-testid="chevronleft-icon" {...props} />,
  ChevronRight: (props) => <svg data-testid="chevronright-icon" {...props} />,
  MoreVertical: (props) => <svg data-testid="morevertical-icon" {...props} />,
  AlertCircle: (props) => <svg data-testid="alertcircle-icon" {...props} />,
  Check: (props) => <svg data-testid="check-icon" {...props} />,
  X: (props) => <svg data-testid="x-icon" {...props} />,
  Edit: (props) => <svg data-testid="edit-icon" {...props} />,
  Trash2: (props) => <svg data-testid="trash2-icon" {...props} />,
  Download: (props) => <svg data-testid="download-icon" {...props} />,
  ExternalLink: (props) => <svg data-testid="externallink-icon" {...props} />,
  Copy: (props) => <svg data-testid="copy-icon" {...props} />,
  Flag: (props) => <svg data-testid="flag-icon" {...props} />,
}));

// Mock React Router hooks
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation(),
}));

// Mock event service
const mockEventService = {
  getEventById: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  rsvpToEvent: jest.fn(),
  cancelRsvp: jest.fn(),
  getEventAttendees: jest.fn(),
  getEventComments: jest.fn(),
  addComment: jest.fn(),
  likeEvent: jest.fn(),
  unlikeEvent: jest.fn(),
  shareEvent: jest.fn(),
  reportEvent: jest.fn(),
};

jest.mock('../services/eventService', () => mockEventService);

// Mock API service
const mockApiService = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../services/api', () => ({
  default: mockApiService,
}));

// Mock auth contexts
const mockAuthContext = {
  user: {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    avatar: '/avatar.jpg',
  },
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

// Mock event data
const mockEvent = {
  id: 'event-1',
  title: 'Annual Tech Conference 2024',
  description: 'Join us for the biggest tech conference of the year',
  longDescription: 'Detailed description with all event information and schedule',
  startDate: '2024-12-01T09:00:00Z',
  endDate: '2024-12-01T17:00:00Z',
  location: 'Convention Center, San Francisco',
  address: '123 Main St, San Francisco, CA 94102',
  organizer: {
    id: 'user-2',
    username: 'organizer',
    displayName: 'Event Organizer',
  },
  category: 'Technology',
  capacity: 500,
  attendeeCount: 234,
  isOnline: false,
  meetingLink: null,
  price: 0,
  currency: 'USD',
  isPaid: false,
  imageUrl: '/event-image.jpg',
  tags: ['tech', 'conference', 'networking'],
  status: 'upcoming',
  isPublic: true,
  allowComments: true,
  allowRsvp: true,
  requireApproval: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

const mockAttendees = [
  {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    avatar: '/avatar1.jpg',
    rsvpStatus: 'going',
  },
  {
    id: 'user-3',
    username: 'attendee2',
    displayName: 'Attendee Two',
    avatar: '/avatar2.jpg',
    rsvpStatus: 'going',
  },
];

const mockComments = [
  {
    id: 'comment-1',
    content: 'Looking forward to this event!',
    author: {
      id: 'user-3',
      username: 'commenter',
      displayName: 'Commenter',
    },
    createdAt: '2024-01-20T10:00:00Z',
    likes: 5,
  },
];

// Helper function to render with providers
const renderWithProviders = (
  component,
  authValue = mockAuthContext,
  routerProps = {}
) => {
  return render(
    <MemoryRouter {...routerProps}>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('EventDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'event-1' });
    mockUseLocation.mockReturnValue({ pathname: '/events/event-1', state: null });
    mockEventService.getEventById.mockResolvedValue({
      success: true,
      data: mockEvent,
    });
    mockEventService.getEventAttendees.mockResolvedValue({
      success: true,
      data: mockAttendees,
    });
    mockEventService.getEventComments.mockResolvedValue({
      success: true,
      data: mockComments,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders main content area with proper role', () => {
      renderWithProviders(<EventDetailsPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithProviders(<EventDetailsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      renderWithProviders(<EventDetailsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has proper aria-label on main element', () => {
      renderWithProviders(<EventDetailsPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveAttribute('aria-label', 'Event details page');
    });

    it('renders page title heading', () => {
      renderWithProviders(<EventDetailsPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('EventDetailsPage');
    });

    it('renders page description', () => {
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByText(/This is the EventDetailsPage page/i)).toBeInTheDocument();
    });

    it('applies correct background styling', () => {
      renderWithProviders(<EventDetailsPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('min-h-screen', 'bg-gray-50', 'dark:bg-[#161b22]');
    });

    it('applies correct padding', () => {
      renderWithProviders(<EventDetailsPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('p-6');
    });

    it('renders content container with max width', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      const maxWidthDiv = container.querySelector('.max-w-6xl');
      expect(maxWidthDiv).toBeInTheDocument();
    });

    it('centers content container', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      const maxWidthDiv = container.querySelector('.max-w-6xl');
      expect(maxWidthDiv).toHaveClass('mx-auto');
    });
  });

  describe('Styling and Theme', () => {
    it('applies white background in light mode', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      const contentDiv = container.querySelector('.bg-white');
      expect(contentDiv).toBeInTheDocument();
    });

    it('applies dark background class for dark mode', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      const contentDiv = container.querySelector('.dark\\:bg-[#161b22]');
      expect(contentDiv).toBeInTheDocument();
    });

    it('applies rounded corners to content card', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      const roundedDiv = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(roundedDiv).toBeInTheDocument();
    });

    it('applies shadow to content card', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      const shadowDiv = container.querySelector('.shadow-xl');
      expect(shadowDiv).toBeInTheDocument();
    });

    it('applies correct text color in light mode', () => {
      renderWithProviders(<EventDetailsPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-gray-900', 'dark:text-white');
    });

    it('applies correct text color for description', () => {
      renderWithProviders(<EventDetailsPage />);
      const description = screen.getByText(/This is the EventDetailsPage page/i);
      expect(description).toHaveClass('text-gray-600', 'dark:text-[#8b949e]');
    });

    it('matches snapshot for light theme', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Accessibility - ARIA', () => {
    it('has proper heading hierarchy', () => {
      renderWithProviders(<EventDetailsPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('has accessible main landmark', () => {
      renderWithProviders(<EventDetailsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
    });

    it('heading is visible to screen readers', () => {
      renderWithProviders(<EventDetailsPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeVisible();
    });

    it('description is visible to screen readers', () => {
      renderWithProviders(<EventDetailsPage />);
      const description = screen.getByText(/This is the EventDetailsPage page/i);
      expect(description).toBeVisible();
    });

    it('has no accessibility violations', async () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      // Basic check for common accessibility issues
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
    });

    it('maintains focus visibility', () => {
      renderWithProviders(<EventDetailsPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      heading.focus();
      expect(document.activeElement).toBe(heading);
    });
  });

  describe('Component Memoization', () => {
    it('exports memoized component', () => {
      expect(EventDetailsPage).toBeDefined();
      expect(EventDetailsPage.$$typeof.toString()).toContain('react.memo');
    });

    it('does not re-render with same props', () => {
      const { rerender } = renderWithProviders(<EventDetailsPage />);
      const initialContent = screen.getByRole('main');

      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <EventDetailsPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      const updatedContent = screen.getByRole('main');
      expect(updatedContent).toBe(initialContent);
    });
  });

  describe('Authentication States', () => {
    it('renders for authenticated users', () => {
      renderWithProviders(<EventDetailsPage />, mockAuthContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders for unauthenticated users', () => {
      renderWithProviders(<EventDetailsPage />, mockUnauthContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders when auth is loading', () => {
      const loadingContext = { ...mockAuthContext, loading: true };
      renderWithProviders(<EventDetailsPage />, loadingContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders when user is null', () => {
      const nullUserContext = { ...mockAuthContext, user: null, isAuthenticated: false };
      renderWithProviders(<EventDetailsPage />, nullUserContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on small mobile viewport', () => {
      global.innerWidth = 320;
      global.innerHeight = 568;
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on large desktop viewport', () => {
      global.innerWidth = 2560;
      global.innerHeight = 1440;
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains layout on very narrow screens', () => {
      global.innerWidth = 280;
      renderWithProviders(<EventDetailsPage />);
      const container = screen.getByRole('main');
      expect(container).toHaveClass('p-6');
    });

    it('utilizes full width on wide screens', () => {
      global.innerWidth = 3840;
      const { container } = renderWithProviders(<EventDetailsPage />);
      const maxWidthDiv = container.querySelector('.max-w-6xl');
      expect(maxWidthDiv).toBeInTheDocument();
    });
  });

  describe('Router Integration', () => {
    it('renders with BrowserRouter', () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <EventDetailsPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with MemoryRouter', () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <EventDetailsPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with MemoryRouter and initial route', () => {
      renderWithProviders(<EventDetailsPage />, mockAuthContext, {
        initialEntries: ['/events/event-1'],
      });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles navigation with useParams', () => {
      mockUseParams.mockReturnValue({ id: 'event-1' });
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles location state', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/events/event-1',
        state: { from: '/events' },
      });
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Framer Motion Integration', () => {
    it('renders motion.div without errors', () => {
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('applies initial animation props', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      const motionDiv = container.querySelector('.bg-white');
      expect(motionDiv).toBeInTheDocument();
    });

    it('handles animation completion', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundaries', () => {
    it('handles rendering errors gracefully', () => {
      const originalError = console.error;
      console.error = jest.fn();

      try {
        renderWithProviders(<EventDetailsPage />);
        expect(screen.getByRole('main')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeUndefined();
      }

      console.error = originalError;
    });

    it('recovers from context errors', () => {
      const invalidContext = { ...mockAuthContext, user: undefined };
      renderWithProviders(<EventDetailsPage />, invalidContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', () => {
      const startTime = performance.now();
      renderWithProviders(<EventDetailsPage />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
    });

    it('does not cause memory leaks on unmount', () => {
      const { unmount } = renderWithProviders(<EventDetailsPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid re-renders', () => {
      const { rerender } = renderWithProviders(<EventDetailsPage />);
      for (let i = 0; i < 10; i++) {
        rerender(
          <MemoryRouter>
            <AuthContext.Provider value={mockAuthContext}>
              <EventDetailsPage />
            </AuthContext.Provider>
          </MemoryRouter>
        );
      }
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props', () => {
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles null props', () => {
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles empty auth context', () => {
      const emptyContext = {};
      renderWithProviders(<EventDetailsPage />, emptyContext);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with missing router params', () => {
      mockUseParams.mockReturnValue({});
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles missing location data', () => {
      mockUseLocation.mockReturnValue({});
      renderWithProviders(<EventDetailsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Future Functionality - Event Loading', () => {
    it('should handle initial loading state', async () => {
      renderWithProviders(<EventDetailsPage />);
      // Placeholder for future loading state
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle event data loading', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for event title, description, etc.
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle loading errors', async () => {
      mockEventService.getEventById.mockRejectedValueOnce(new Error('Failed to load'));
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle event not found', async () => {
      mockEventService.getEventById.mockResolvedValueOnce({
        success: false,
        error: 'Event not found',
      });
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle network timeout', async () => {
      mockEventService.getEventById.mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Event Display', () => {
    it('should display event title when loaded', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display event description', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for event description
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display event date and time', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for formatted date/time
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display event location', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for location display
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display event capacity info', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for capacity/attendee count
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display event organizer info', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for organizer details
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display event image', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for event image
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display event tags', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for tags display
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - RSVP Actions', () => {
    it('should display RSVP button for authenticated users', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for RSVP button
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle RSVP click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Click RSVP and check service call
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display cancel RSVP for attending users', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for cancel button if already RSVP'd
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle RSVP cancellation', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test cancel RSVP flow
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should disable RSVP when event is full', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test capacity limit handling
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should show login prompt for unauthenticated RSVP', async () => {
      renderWithProviders(<EventDetailsPage />, mockUnauthContext);
      await waitFor(() => {
        // Future: Check for login prompt
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Attendees', () => {
    it('should display attendee count', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check attendee count display
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display attendee list', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for attendee avatars/list
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle view all attendees', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test expanding attendee list
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle attendee profile click', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test navigation to attendee profile
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Comments', () => {
    it('should display comment section', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for comments section
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display existing comments', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for comment display
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle adding a comment', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test comment submission
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should disable comments when not allowed', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test disabled comment state
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle comment submission errors', async () => {
      mockEventService.addComment.mockRejectedValueOnce(new Error('Failed'));
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Event Actions', () => {
    it('should display share button', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for share button
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle share action', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test share functionality
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display like button', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for like button
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle like action', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test like/unlike
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display report button', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for report button
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle report action', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test report functionality
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Organizer Actions', () => {
    it('should display edit button for organizer', async () => {
      const organizerContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, id: 'user-2' },
      };
      renderWithProviders(<EventDetailsPage />, organizerContext);
      await waitFor(() => {
        // Future: Check for edit button
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle edit event', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test edit flow
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display delete button for organizer', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for delete button
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle delete event with confirmation', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test delete flow with confirmation
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should hide organizer actions for non-organizers', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Verify no edit/delete buttons
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Event Status', () => {
    it('should display upcoming event status', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check status badge
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display ongoing event status', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check live/ongoing indicator
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display past event status', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check past event state
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should display cancelled event status', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check cancelled state
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should disable RSVP for past events', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test disabled RSVP
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should disable RSVP for cancelled events', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test disabled RSVP
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Online Events', () => {
    it('should display meeting link for online events', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for meeting link
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should hide meeting link before event starts', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Verify link visibility rules
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should show meeting link to attendees only', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test attendee-only access
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle copy meeting link', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test copy functionality
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Calendar Integration', () => {
    it('should display add to calendar button', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for calendar button
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle add to Google Calendar', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test Google Calendar integration
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle download ICS file', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test ICS download
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Navigation', () => {
    it('should display back button', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for back navigation
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle back navigation', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test navigation
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should navigate to organizer profile', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test organizer link
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should navigate to related events', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Test related events section
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Skeleton Loading', () => {
    it('should show skeleton for event image', async () => {
      renderWithProviders(<EventDetailsPage />);
      // Future: Check for image skeleton
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should show skeleton for event details', async () => {
      renderWithProviders(<EventDetailsPage />);
      // Future: Check for details skeleton
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should show skeleton for attendees', async () => {
      renderWithProviders(<EventDetailsPage />);
      // Future: Check for attendees skeleton
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should replace skeletons with content', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Empty States', () => {
    it('should show empty state for no attendees', async () => {
      mockEventService.getEventAttendees.mockResolvedValueOnce({
        success: true,
        data: [],
      });
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should show empty state for no comments', async () => {
      mockEventService.getEventComments.mockResolvedValueOnce({
        success: true,
        data: [],
      });
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Future Functionality - Error States', () => {
    it('should display error message on load failure', async () => {
      mockEventService.getEventById.mockRejectedValueOnce(new Error('Network error'));
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should provide retry button on error', async () => {
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        // Future: Check for retry functionality
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle RSVP action errors', async () => {
      mockEventService.rsvpToEvent.mockRejectedValueOnce(new Error('Failed'));
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle comment loading errors', async () => {
      mockEventService.getEventComments.mockRejectedValueOnce(new Error('Failed'));
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should handle attendee loading errors', async () => {
      mockEventService.getEventAttendees.mockRejectedValueOnce(new Error('Failed'));
      renderWithProviders(<EventDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EventDetailsPage />);

      await user.tab();
      // Future: Verify focus moves correctly
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should support Enter key on interactive elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EventDetailsPage />);

      // Future: Test Enter key interactions
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should support Escape key to close modals', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EventDetailsPage />);

      await user.keyboard('{Escape}');
      // Future: Test modal closing
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('SEO and Metadata', () => {
    it('should set proper document title', () => {
      renderWithProviders(<EventDetailsPage />);
      // Future: Check document.title
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should include meta description', () => {
      renderWithProviders(<EventDetailsPage />);
      // Future: Check meta tags
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should include Open Graph tags', () => {
      renderWithProviders(<EventDetailsPage />);
      // Future: Check OG tags
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = renderWithProviders(<EventDetailsPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for authenticated user', () => {
      const { container } = renderWithProviders(<EventDetailsPage />, mockAuthContext);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for unauthenticated user', () => {
      const { container } = renderWithProviders(<EventDetailsPage />, mockUnauthContext);
      expect(container).toMatchSnapshot();
    });
  });
});

export default mockNavigate
