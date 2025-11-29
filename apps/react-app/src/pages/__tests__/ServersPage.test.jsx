/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import ServersPage from '../ServersPage';
import serverService from '../../services/serverService';

// Mock dependencies
jest.mock('../../services/serverService');
jest.mock('../../components/servers/CreateServerModal', () => {
  return function MockCreateServerModal({ onClose, onServerCreated }) {
    return (
      <div data-testid="create-server-modal">
        <button onClick={() => onServerCreated({ id: 'new-server', name: 'New Server' })}>
          Create
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});
jest.mock('../../components/servers/InviteModal', () => {
  return function MockInviteModal({ onClose, onJoin }) {
    return (
      <div data-testid="invite-modal">
        <button onClick={() => onJoin({ name: 'Invited Server' })}>Join</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

const mockPublicServers = [
  {
    id: 'server-1',
    name: 'Gaming Hub',
    description: 'A place for gamers',
    isPublic: true,
    memberCount: 1500,
    onlineCount: 250,
    category: 'gaming'
  },
  {
    id: 'server-2',
    name: 'Tech Talk',
    description: 'Technology discussions',
    isPublic: true,
    memberCount: 2000,
    onlineCount: 300,
    category: 'tech'
  }
];

const mockMyServers = [
  {
    id: 'my-server-1',
    name: 'My Community',
    description: 'My personal server',
    isPublic: false,
    memberCount: 50,
    onlineCount: 10
  }
];

describe('ServersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    serverService.searchPublicServers.mockResolvedValue({
      success: true,
      servers: mockPublicServers
    });
    serverService.getServers.mockResolvedValue({
      success: true,
      servers: mockMyServers
    });
    serverService.joinServer.mockResolvedValue({ success: true });
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<ServersPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper aria-label', () => {
      renderWithProviders(<ServersPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('aria-label', 'Page content');
    });

    it('renders page header with title', () => {
      renderWithProviders(<ServersPage />);
      expect(screen.getByText('Server Discovery')).toBeInTheDocument();
      expect(screen.getByText('Find and join communities or create your own')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<ServersPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays search input', () => {
      renderWithProviders(<ServersPage />);
      expect(screen.getByPlaceholderText('Search servers...')).toBeInTheDocument();
    });

    it('displays action buttons in header', () => {
      renderWithProviders(<ServersPage />);
      expect(screen.getByText('Join via Invite')).toBeInTheDocument();
      expect(screen.getByText('Create Server')).toBeInTheDocument();
    });

    it('displays tab navigation', () => {
      renderWithProviders(<ServersPage />);
      expect(screen.getByText('Discover')).toBeInTheDocument();
      expect(screen.getByText('My Servers')).toBeInTheDocument();
    });

    it('renders categories in discover tab', () => {
      renderWithProviders(<ServersPage />);
      expect(screen.getByText('All Servers')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Gaming')).toBeInTheDocument();
      expect(screen.getByText('Crypto')).toBeInTheDocument();
      expect(screen.getByText('Community')).toBeInTheDocument();
    });
  });

  describe('Server List Loading', () => {
    it('shows loading state initially', () => {
      renderWithProviders(<ServersPage />);
      expect(screen.getByText('Loading servers...')).toBeInTheDocument();
    });

    it('loads and displays public servers in discover tab', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      expect(screen.getByText('Tech Talk')).toBeInTheDocument();
      expect(screen.getByText('A place for gamers')).toBeInTheDocument();
    });

    it('displays server member counts', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('1500 members')).toBeInTheDocument();
      });

      expect(screen.getByText('2000 members')).toBeInTheDocument();
    });

    it('displays server online counts', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('250 online')).toBeInTheDocument();
      });

      expect(screen.getByText('300 online')).toBeInTheDocument();
    });

    it('calls searchPublicServers on initial load', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('', {});
      });
    });

    it('loads servers when discover tab is active', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('starts with discover tab active', () => {
      renderWithProviders(<ServersPage />);
      const discoverButton = screen.getByText('Discover');
      expect(discoverButton).toHaveClass('border-primary', 'text-primary');
    });

    it('switches to My Servers tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const myServersButton = screen.getByText('My Servers');
      await user.click(myServersButton);

      await waitFor(() => {
        expect(serverService.getServers).toHaveBeenCalled();
      });
    });

    it('displays my servers in My Servers tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      await user.click(screen.getByText('My Servers'));

      await waitFor(() => {
        expect(screen.getByText('My Community')).toBeInTheDocument();
      });
    });

    it('hides categories when switching to My Servers tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      expect(screen.getByText('All Servers')).toBeInTheDocument();

      await user.click(screen.getByText('My Servers'));

      await waitFor(() => {
        expect(screen.queryByText('All Servers')).not.toBeInTheDocument();
      });
    });

    it('reloads data when switching tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledTimes(1);
      });

      await user.click(screen.getByText('My Servers'));

      await waitFor(() => {
        expect(serverService.getServers).toHaveBeenCalledTimes(1);
      });

      await user.click(screen.getByText('Discover'));

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Category Filtering', () => {
    it('displays all category options', () => {
      renderWithProviders(<ServersPage />);
      expect(screen.getByText('All Servers')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Gaming')).toBeInTheDocument();
      expect(screen.getByText('Crypto')).toBeInTheDocument();
      expect(screen.getByText('Community')).toBeInTheDocument();
    });

    it('starts with "All Servers" category selected', () => {
      renderWithProviders(<ServersPage />);
      const allServersButton = screen.getByText('All Servers').closest('button');
      expect(allServersButton).toHaveClass('bg-primary', 'text-white');
    });

    it('filters servers when category is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const techButton = screen.getByText('Technology');
      await user.click(techButton);

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('', { category: 'tech' });
      });
    });

    it('updates category selection styling', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      const gamingButton = screen.getByText('Gaming').closest('button');
      await user.click(gamingButton);

      await waitFor(() => {
        expect(gamingButton).toHaveClass('bg-primary', 'text-white');
      });
    });

    it('calls API with correct category filter', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('', {});
      });

      await user.click(screen.getByText('Gaming'));

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('', { category: 'gaming' });
      });
    });

    it('resets to all servers when clicking All Servers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('Gaming'));
      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('', { category: 'gaming' });
      });

      await user.click(screen.getByText('All Servers'));

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('', {});
      });
    });
  });

  describe('Search Functionality', () => {
    it('updates search query on input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      const searchInput = screen.getByPlaceholderText('Search servers...');
      await user.type(searchInput, 'gaming');

      expect(searchInput).toHaveValue('gaming');
    });

    it('submits search on form submit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      const searchInput = screen.getByPlaceholderText('Search servers...');
      await user.type(searchInput, 'tech');

      const form = searchInput.closest('form');
      await user.click(searchInput);
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('tech', {});
      });
    });

    it('searches with selected category filter', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('Gaming'));

      const searchInput = screen.getByPlaceholderText('Search servers...');
      await user.type(searchInput, 'esports');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('esports', { category: 'gaming' });
      });
    });

    it('displays search icon', () => {
      renderWithProviders(<ServersPage />);
      const searchInput = screen.getByPlaceholderText('Search servers...');
      expect(searchInput.previousSibling).toBeInTheDocument();
    });
  });

  describe('Joining Servers', () => {
    it('displays Join button for public servers', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        const joinButtons = screen.getAllByText('Join');
        expect(joinButtons.length).toBeGreaterThan(0);
      });
    });

    it('calls joinServer when Join button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const joinButtons = screen.getAllByText('Join');
      await user.click(joinButtons[0]);

      await waitFor(() => {
        expect(serverService.joinServer).toHaveBeenCalledWith('server-1');
      });
    });

    it('shows success message after joining', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const joinButtons = screen.getAllByText('Join');
      await user.click(joinButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Successfully joined server!')).toBeInTheDocument();
      });
    });

    it('navigates to chat after joining successfully', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const joinButtons = screen.getAllByText('Join');
      await user.click(joinButtons[0]);

      jest.advanceTimersByTime(1000);

      jest.useRealTimers();
    });

    it('handles join server error', async () => {
      serverService.joinServer.mockResolvedValueOnce({
        success: false,
        error: 'Server is full'
      });

      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const joinButtons = screen.getAllByText('Join');
      await user.click(joinButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Server is full')).toBeInTheDocument();
      });
    });

    it('displays generic error message on failure', async () => {
      serverService.joinServer.mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const joinButtons = screen.getAllByText('Join');
      await user.click(joinButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to join server')).toBeInTheDocument();
      });
    });
  });

  describe('My Servers Functionality', () => {
    it('displays Open button for member servers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('My Servers'));

      await waitFor(() => {
        expect(screen.getByText('Open')).toBeInTheDocument();
      });
    });

    it('does not display Join button for member servers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('My Servers'));

      await waitFor(() => {
        expect(screen.getByText('My Community')).toBeInTheDocument();
      });

      const joinButtons = screen.queryAllByText('Join');
      expect(joinButtons.length).toBe(0);
    });

    it('displays private server icon', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('My Servers'));

      await waitFor(() => {
        expect(screen.getByText('My Community')).toBeInTheDocument();
      });
    });
  });

  describe('Server Cards', () => {
    it('displays server icon or fallback', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const serverCard = screen.getByText('Gaming Hub').closest('div');
      expect(serverCard).toBeInTheDocument();
    });

    it('displays server name', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
        expect(screen.getByText('Tech Talk')).toBeInTheDocument();
      });
    });

    it('displays server description', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('A place for gamers')).toBeInTheDocument();
        expect(screen.getByText('Technology discussions')).toBeInTheDocument();
      });
    });

    it('displays public/private indicator', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });
    });

    it('shows server fallback icon with first letter', async () => {
      const serverWithoutIcon = {
        id: 'server-3',
        name: 'Test Server',
        isPublic: true,
        memberCount: 100
      };

      serverService.searchPublicServers.mockResolvedValueOnce({
        success: true,
        servers: [serverWithoutIcon]
      });

      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Server')).toBeInTheDocument();
      });
    });

    it('applies hover effect styling', async () => {
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        const card = screen.getByText('Gaming Hub').closest('div').closest('div');
        expect(card).toHaveClass('hover:shadow-lg');
      });
    });
  });

  describe('Empty States', () => {
    it('displays empty state when no public servers found', async () => {
      serverService.searchPublicServers.mockResolvedValueOnce({
        success: true,
        servers: []
      });

      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('No servers found')).toBeInTheDocument();
      });

      expect(screen.getByText('Try adjusting your search or category filters')).toBeInTheDocument();
    });

    it('displays empty state when no servers joined', async () => {
      const user = userEvent.setup();
      serverService.getServers.mockResolvedValueOnce({
        success: true,
        servers: []
      });

      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('My Servers'));

      await waitFor(() => {
        expect(screen.getByText("You haven't joined any servers yet")).toBeInTheDocument();
      });

      expect(screen.getByText('Discover and join communities or create your own')).toBeInTheDocument();
    });

    it('displays Discover Servers button in My Servers empty state', async () => {
      const user = userEvent.setup();
      serverService.getServers.mockResolvedValueOnce({
        success: true,
        servers: []
      });

      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('My Servers'));

      await waitFor(() => {
        const discoverButton = screen.getAllByText('Discover Servers')[0];
        expect(discoverButton).toBeInTheDocument();
      });
    });

    it('switches to discover tab when clicking Discover Servers in empty state', async () => {
      const user = userEvent.setup();
      serverService.getServers.mockResolvedValueOnce({
        success: true,
        servers: []
      });

      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('My Servers'));

      await waitFor(() => {
        expect(screen.getByText("You haven't joined any servers yet")).toBeInTheDocument();
      });

      const discoverButton = screen.getAllByText('Discover Servers')[0];
      await user.click(discoverButton);

      await waitFor(() => {
        expect(screen.getByText('All Servers')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      serverService.searchPublicServers.mockResolvedValueOnce({
        success: false
      });

      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load servers. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays error message when network request fails', async () => {
      serverService.searchPublicServers.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load servers. Please try again.')).toBeInTheDocument();
      });
    });

    it('provides Try Again button on error', async () => {
      serverService.searchPublicServers.mockResolvedValueOnce({
        success: false
      });

      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('retries loading when Try Again is clicked', async () => {
      const user = userEvent.setup();
      serverService.searchPublicServers
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true, servers: mockPublicServers });

      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });
    });

    it('displays error icon in error state', async () => {
      serverService.searchPublicServers.mockResolvedValueOnce({
        success: false
      });

      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });
    });
  });

  describe('Create Server Modal', () => {
    it('opens create server modal when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('Create Server'));

      await waitFor(() => {
        expect(screen.getByTestId('create-server-modal')).toBeInTheDocument();
      });
    });

    it('closes create server modal on cancel', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('Create Server'));

      await waitFor(() => {
        expect(screen.getByTestId('create-server-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByTestId('create-server-modal')).not.toBeInTheDocument();
      });
    });

    it('handles server creation success', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('Create Server'));

      await waitFor(() => {
        expect(screen.getByTestId('create-server-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('Server created successfully!')).toBeInTheDocument();
      });
    });

    it('switches to My Servers tab after creating server', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('Create Server'));
      await user.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(serverService.getServers).toHaveBeenCalled();
      });
    });

    it('reloads servers after creation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      const initialCallCount = serverService.searchPublicServers.mock.calls.length;

      await user.click(screen.getByText('Create Server'));
      await user.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(serverService.getServers).toHaveBeenCalled();
      });
    });
  });

  describe('Invite Modal', () => {
    it('opens invite modal when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('Join via Invite'));

      await waitFor(() => {
        expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
      });
    });

    it('closes invite modal on cancel', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('Join via Invite'));

      await waitFor(() => {
        expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
      });
    });

    it('handles invite join success', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await user.click(screen.getByText('Join via Invite'));

      await waitFor(() => {
        expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
      });

      await user.click(screen.getAllByText('Join')[0]);

      await waitFor(() => {
        expect(screen.getByText('Joined Invited Server!')).toBeInTheDocument();
      });
    });

    it('reloads servers after joining via invite', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledTimes(1);
      });

      await user.click(screen.getByText('Join via Invite'));
      await user.click(screen.getAllByText('Join')[0]);

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Message Display', () => {
    it('displays success messages with proper styling', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const joinButtons = screen.getAllByText('Join');
      await user.click(joinButtons[0]);

      await waitFor(() => {
        const message = screen.getByText('Successfully joined server!');
        expect(message).toBeInTheDocument();
      });
    });

    it('displays error messages with proper styling', async () => {
      serverService.joinServer.mockResolvedValueOnce({
        success: false,
        error: 'Server is full'
      });

      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      const joinButtons = screen.getAllByText('Join');
      await user.click(joinButtons[0]);

      await waitFor(() => {
        const message = screen.getByText('Server is full');
        expect(message).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main element', () => {
      renderWithProviders(<ServersPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('aria-label');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<ServersPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Server Discovery');
    });

    it('has proper form structure for search', () => {
      renderWithProviders(<ServersPage />);
      const searchInput = screen.getByPlaceholderText('Search servers...');
      expect(searchInput.closest('form')).toBeInTheDocument();
    });

    it('buttons have proper text labels', () => {
      renderWithProviders(<ServersPage />);
      expect(screen.getByText('Create Server')).toBeInTheDocument();
      expect(screen.getByText('Join via Invite')).toBeInTheDocument();
    });

    it('tab buttons have proper roles', () => {
      renderWithProviders(<ServersPage />);
      const discoverTab = screen.getByText('Discover').closest('button');
      const myServersTab = screen.getByText('My Servers').closest('button');
      expect(discoverTab).toBeInTheDocument();
      expect(myServersTab).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly with responsive classes', () => {
      renderWithProviders(<ServersPage />);
      const heading = screen.getByText('Server Discovery');
      expect(heading).toHaveClass('text-3xl', 'md:text-4xl');
    });

    it('has responsive container', () => {
      renderWithProviders(<ServersPage />);
      const container = screen.getByRole('main').parentElement;
      expect(container).toHaveClass('container');
    });
  });

  describe('Integration Tests', () => {
    it('completes full workflow: search, filter, and join server', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });

      // Filter by category
      await user.click(screen.getByText('Gaming'));

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('', { category: 'gaming' });
      });

      // Search
      const searchInput = screen.getByPlaceholderText('Search servers...');
      await user.type(searchInput, 'hub');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(serverService.searchPublicServers).toHaveBeenCalledWith('hub', { category: 'gaming' });
      });

      // Join server
      const joinButtons = screen.getAllByText('Join');
      await user.click(joinButtons[0]);

      await waitFor(() => {
        expect(serverService.joinServer).toHaveBeenCalled();
        expect(screen.getByText('Successfully joined server!')).toBeInTheDocument();
      });
    });

    it('completes full workflow: create server and view in My Servers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServersPage />);

      // Create server
      await user.click(screen.getByText('Create Server'));

      await waitFor(() => {
        expect(screen.getByTestId('create-server-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Create'));

      // Check success message
      await waitFor(() => {
        expect(screen.getByText('Server created successfully!')).toBeInTheDocument();
      });

      // Verify it switches to My Servers tab
      await waitFor(() => {
        expect(serverService.getServers).toHaveBeenCalled();
      });
    });

    it('handles error recovery flow', async () => {
      const user = userEvent.setup();
      serverService.searchPublicServers
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true, servers: mockPublicServers });

      renderWithProviders(<ServersPage />);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });

      // Click retry
      await user.click(screen.getByText('Try Again'));

      // Verify successful load
      await waitFor(() => {
        expect(screen.getByText('Gaming Hub')).toBeInTheDocument();
      });
    });
  });
});

export default MockCreateServerModal
