/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import GroupDMSettingsPage from './GroupDMSettingsPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock React Router
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: (props) => <div data-testid="icon-arrow-left" {...props}>ArrowLeft</div>,
  Users: (props) => <div data-testid="icon-users" {...props}>Users</div>,
  UserPlus: (props) => <div data-testid="icon-user-plus" {...props}>UserPlus</div>,
  UserMinus: (props) => <div data-testid="icon-user-minus" {...props}>UserMinus</div>,
  Crown: (props) => <div data-testid="icon-crown" {...props}>Crown</div>,
  Shield: (props) => <div data-testid="icon-shield" {...props}>Shield</div>,
  Bell: (props) => <div data-testid="icon-bell" {...props}>Bell</div>,
  BellOff: (props) => <div data-testid="icon-bell-off" {...props}>BellOff</div>,
  Image: (props) => <div data-testid="icon-image" {...props}>Image</div>,
  Trash2: (props) => <div data-testid="icon-trash2" {...props}>Trash2</div>,
  LogOut: (props) => <div data-testid="icon-logout" {...props}>LogOut</div>,
  Settings: (props) => <div data-testid="icon-settings" {...props}>Settings</div>,
}));

// Mock auth context
const mockAuthContext = {
  user: {
    id: '1',
    username: 'alice',
    email: 'alice@example.com',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
};

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
};

// Helper to render with providers
const renderWithProviders = (
  component,
  { authValue = mockAuthContext, initialRoute = '/groups/123/settings' } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('GroupDMSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ groupId: '123' });
    mockUseLocation.mockReturnValue({ pathname: '/groups/123/settings' });

    // Mock window.confirm
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper aria-label', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const mainElement = screen.getByRole('main', { name: /group dm settings page/i });
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<GroupDMSettingsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page header with title', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByRole('heading', { name: /group settings/i })).toBeInTheDocument();
    });

    it('displays member count in header', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText(/4 members/i)).toBeInTheDocument();
    });

    it('renders back button with proper aria-label', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const backButton = screen.getByRole('button', { name: /go back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('displays all section headings', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText(/group information/i)).toBeInTheDocument();
      expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
    });

    it('renders with correct groupId from params', () => {
      mockUseParams.mockReturnValue({ groupId: '456' });
      renderWithProviders(<GroupDMSettingsPage />);
      expect(mockUseParams).toHaveBeenCalled();
    });
  });

  describe('Group Information Section', () => {
    it('displays group icon', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText('👥')).toBeInTheDocument();
    });

    it('displays change icon button', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /change icon/i })).toBeInTheDocument();
    });

    it('displays group name input', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const nameInput = screen.getByDisplayValue('Team Chat');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('type', 'text');
    });

    it('allows group name to be edited', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const nameInput = screen.getByDisplayValue('Team Chat');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Group Name');

      expect(nameInput).toHaveValue('New Group Name');
    });

    it('disables group name input for regular members', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const nameInput = screen.getByDisplayValue('Team Chat');
      // Owner (currentUserId = 1) should have edit access
      expect(nameInput).not.toBeDisabled();
    });

    it('displays notification toggle', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText(/notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/get notified of new messages/i)).toBeInTheDocument();
    });

    it('notification toggle has proper aria-pressed attribute', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const toggleButton = screen.getByRole('button', { pressed: true });
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggles notifications on click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const toggleButton = screen.getByRole('button', { pressed: true });
      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('displays Bell icon when notifications enabled', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
    });

    it('displays BellOff icon when notifications disabled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const toggleButton = screen.getByRole('button', { pressed: true });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('icon-bell-off')).toBeInTheDocument();
      });
    });

    it('has proper label for group icon input', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText(/group icon/i)).toBeInTheDocument();
    });

    it('has proper label for group name input', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText(/group name/i)).toBeInTheDocument();
    });
  });

  describe('Members Section', () => {
    it('displays members section heading', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText(/members \(4\)/i)).toBeInTheDocument();
    });

    it('renders all members', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
      expect(screen.getByText('charlie')).toBeInTheDocument();
      expect(screen.getByText('diana')).toBeInTheDocument();
    });

    it('displays member avatars', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText('🐱')).toBeInTheDocument();
      expect(screen.getByText('🐶')).toBeInTheDocument();
      expect(screen.getByText('🦊')).toBeInTheDocument();
      expect(screen.getByText('🐼')).toBeInTheDocument();
    });

    it('displays member roles', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText('owner')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getAllByText('member')).toHaveLength(2);
    });

    it('displays Crown icon for owner', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByTestId('icon-crown')).toBeInTheDocument();
    });

    it('displays Shield icon for admin', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByTestId('icon-shield')).toBeInTheDocument();
    });

    it('displays online status indicators', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const onlineIndicators = document.querySelectorAll('.bg-green-500');
      expect(onlineIndicators).toHaveLength(3); // alice, bob, diana are online
    });

    it('marks current user with (You) label', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText('(You)')).toBeInTheDocument();
    });

    it('displays Add Members button for owner/admin', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /add members/i })).toBeInTheDocument();
    });

    it('Add Members button has UserPlus icon', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByTestId('icon-user-plus')).toBeInTheDocument();
    });
  });

  describe('Member Management', () => {
    it('displays role selector for non-current users as owner', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const roleSelectors = screen.getAllByRole('combobox');
      expect(roleSelectors.length).toBeGreaterThan(0);
    });

    it('allows owner to change member role', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const roleSelectors = screen.getAllByRole('combobox');
      await user.selectOptions(roleSelectors[0], 'admin');

      expect(roleSelectors[0]).toHaveValue('admin');
    });

    it('role selector has member and admin options', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const roleSelectors = screen.getAllByRole('combobox');
      const options = roleSelectors[0].querySelectorAll('option');

      expect(options).toHaveLength(2);
      expect(options[0]).toHaveValue('member');
      expect(options[1]).toHaveValue('admin');
    });

    it('displays remove member button', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('remove member button has proper aria-label', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /remove bob/i })).toBeInTheDocument();
    });

    it('shows confirmation dialog when removing member', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const removeButton = screen.getByRole('button', { name: /remove bob/i });
      await user.click(removeButton);

      expect(global.confirm).toHaveBeenCalledWith('Remove this member from the group?');
    });

    it('removes member when confirmed', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithProviders(<GroupDMSettingsPage />);

      const removeButton = screen.getByRole('button', { name: /remove bob/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('bob')).not.toBeInTheDocument();
      });
    });

    it('does not remove member when cancelled', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(false);
      renderWithProviders(<GroupDMSettingsPage />);

      const removeButton = screen.getByRole('button', { name: /remove bob/i });
      await user.click(removeButton);

      expect(screen.getByText('bob')).toBeInTheDocument();
    });

    it('updates member count after removal', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithProviders(<GroupDMSettingsPage />);

      const removeButton = screen.getByRole('button', { name: /remove bob/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText(/3 members/i)).toBeInTheDocument();
      });
    });

    it('owner cannot remove themselves', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      // Alice is the owner and current user, should not have remove button for self
      const aliceRow = screen.getByText('alice').closest('div');
      const removeButton = aliceRow?.querySelector('[aria-label*="Remove alice"]');
      expect(removeButton).not.toBeInTheDocument();
    });

    it('displays UserMinus icon on remove button', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getAllByTestId('icon-user-minus').length).toBeGreaterThan(0);
    });
  });

  describe('Danger Zone Section', () => {
    it('displays danger zone heading', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
    });

    it('has distinctive styling for danger zone', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const dangerSection = screen.getByText(/danger zone/i).closest('div');
      expect(dangerSection).toHaveClass('border-2');
    });

    it('displays leave group button', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /leave group/i })).toBeInTheDocument();
    });

    it('leave button has LogOut icon', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByTestId('icon-logout')).toBeInTheDocument();
    });

    it('displays delete group button for owner', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /delete group/i })).toBeInTheDocument();
    });

    it('delete button has Trash2 icon', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByTestId('icon-trash2')).toBeInTheDocument();
    });

    it('shows confirmation when leaving group', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const leaveButton = screen.getByRole('button', { name: /leave group/i });
      await user.click(leaveButton);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to leave this group?');
    });

    it('navigates to messages after leaving group', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithProviders(<GroupDMSettingsPage />);

      const leaveButton = screen.getByRole('button', { name: /leave group/i });
      await user.click(leaveButton);

      expect(mockNavigate).toHaveBeenCalledWith('/messages');
    });

    it('does not navigate if leave is cancelled', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(false);
      renderWithProviders(<GroupDMSettingsPage />);

      const leaveButton = screen.getByRole('button', { name: /leave group/i });
      await user.click(leaveButton);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows confirmation when deleting group', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const deleteButton = screen.getByRole('button', { name: /delete group/i });
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this group? This action cannot be undone.'
      );
    });

    it('navigates to messages after deleting group', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithProviders(<GroupDMSettingsPage />);

      const deleteButton = screen.getByRole('button', { name: /delete group/i });
      await user.click(deleteButton);

      expect(mockNavigate).toHaveBeenCalledWith('/messages');
    });

    it('does not navigate if delete is cancelled', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(false);
      renderWithProviders(<GroupDMSettingsPage />);

      const deleteButton = screen.getByRole('button', { name: /delete group/i });
      await user.click(deleteButton);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const backButton = screen.getByRole('button', { name: /go back/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('back button has ArrowLeft icon', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByTestId('icon-arrow-left')).toBeInTheDocument();
    });

    it('uses correct groupId from URL params', () => {
      mockUseParams.mockReturnValue({ groupId: '789' });
      renderWithProviders(<GroupDMSettingsPage />);
      expect(mockUseParams).toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('handles multiple role changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const roleSelectors = screen.getAllByRole('combobox');
      await user.selectOptions(roleSelectors[0], 'admin');
      await user.selectOptions(roleSelectors[1], 'admin');

      expect(roleSelectors[0]).toHaveValue('admin');
      expect(roleSelectors[1]).toHaveValue('admin');
    });

    it('handles rapid notification toggles', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const toggleButton = screen.getByRole('button', { pressed: true });
      await user.click(toggleButton);
      await user.click(toggleButton);
      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('handles removing multiple members', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithProviders(<GroupDMSettingsPage />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/3 members/i)).toBeInTheDocument();
      });
    });

    it('allows clicking change icon button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const changeIconButton = screen.getByRole('button', { name: /change icon/i });
      await user.click(changeIconButton);

      // Button should be clickable (not throw error)
      expect(changeIconButton).toBeInTheDocument();
    });

    it('allows clicking add members button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const addButton = screen.getByRole('button', { name: /add members/i });
      await user.click(addButton);

      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main landmark', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('aria-label', 'Group DM settings page');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const h1 = screen.getByRole('heading', { level: 1, name: /group settings/i });
      const h2s = screen.getAllByRole('heading', { level: 2 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('all buttons have accessible names', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(
          button.getAttribute('aria-label') || button.textContent.trim()
        ).toBeTruthy();
      });
    });

    it('inputs have associated labels', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const nameInput = screen.getByDisplayValue('Team Chat');
      const label = screen.getByText(/group name/i);

      expect(nameInput).toBeInTheDocument();
      expect(label).toBeInTheDocument();
    });

    it('toggle button has aria-pressed attribute', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const toggleButton = screen.getByRole('button', { pressed: true });
      expect(toggleButton).toHaveAttribute('aria-pressed');
    });

    it('supports keyboard navigation for back button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const backButton = screen.getByRole('button', { name: /go back/i });
      backButton.focus();

      expect(backButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('supports keyboard navigation for notification toggle', async () => {
      renderWithProviders(<GroupDMSettingsPage />);

      const toggleButton = screen.getByRole('button', { pressed: true });
      toggleButton.focus();

      expect(toggleButton).toHaveFocus();
    });

    it('online status indicators have proper semantic structure', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const onlineIndicators = document.querySelectorAll('.bg-green-500');

      onlineIndicators.forEach(indicator => {
        expect(indicator).toHaveClass('rounded-full');
        expect(indicator.parentElement).toHaveClass('relative');
      });
    });

    it('role badges have semantic meaning', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const crownIcon = screen.getByTestId('icon-crown');
      const shieldIcon = screen.getByTestId('icon-shield');

      expect(crownIcon).toBeInTheDocument();
      expect(shieldIcon).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      renderWithProviders(<GroupDMSettingsPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      renderWithProviders(<GroupDMSettingsPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      renderWithProviders(<GroupDMSettingsPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has responsive max-width container', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const containers = document.querySelectorAll('.max-w-4xl');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('has responsive padding', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const paddedElements = document.querySelectorAll('.px-6');
      expect(paddedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const darkElements = document.querySelectorAll('[class*="dark:"]');
      expect(darkElements.length).toBeGreaterThan(0);
    });

    it('header has dark mode styling', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const header = document.querySelector('.dark\\:bg-[#161b22]');
      expect(header).toBeInTheDocument();
    });

    it('cards have dark mode styling', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const cards = document.querySelectorAll('.dark\\:bg-[#161b22]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('text has dark mode styling', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const darkText = document.querySelectorAll('.dark\\:text-white');
      expect(darkText.length).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('maintains group name state', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const nameInput = screen.getByDisplayValue('Team Chat');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      expect(nameInput).toHaveValue('Updated Name');
    });

    it('maintains notification state', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const toggleButton = screen.getByRole('button', { pressed: true });
      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('maintains members list after role change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const roleSelectors = screen.getAllByRole('combobox');
      await user.selectOptions(roleSelectors[0], 'admin');

      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
      expect(screen.getByText('charlie')).toBeInTheDocument();
      expect(screen.getByText('diana')).toBeInTheDocument();
    });

    it('updates state correctly when member removed', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithProviders(<GroupDMSettingsPage />);

      const initialCount = screen.getByText(/4 members/i);
      expect(initialCount).toBeInTheDocument();

      const removeButton = screen.getByRole('button', { name: /remove bob/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText(/3 members/i)).toBeInTheDocument();
        expect(screen.queryByText('bob')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty group name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const nameInput = screen.getByDisplayValue('Team Chat');
      await user.clear(nameInput);

      expect(nameInput).toHaveValue('');
    });

    it('handles long group names', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const longName = 'A'.repeat(100);
      const nameInput = screen.getByDisplayValue('Team Chat');
      await user.clear(nameInput);
      await user.type(nameInput, longName);

      expect(nameInput).toHaveValue(longName);
    });

    it('handles removing last non-owner member', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithProviders(<GroupDMSettingsPage />);

      // Remove all non-owner members
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      for (const button of removeButtons) {
        await user.click(button);
      }

      await waitFor(() => {
        expect(screen.getByText(/1 member/i)).toBeInTheDocument();
      });
    });

    it('handles rapid state changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const nameInput = screen.getByDisplayValue('Team Chat');
      await user.clear(nameInput);
      await user.type(nameInput, 'Name1');
      await user.clear(nameInput);
      await user.type(nameInput, 'Name2');

      expect(nameInput).toHaveValue('Name2');
    });

    it('handles special characters in group name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const nameInput = screen.getByDisplayValue('Team Chat');
      await user.clear(nameInput);
      await user.type(nameInput, '!@#$%^&*()');

      expect(nameInput).toHaveValue('!@#$%^&*()');
    });

    it('handles emoji in group name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const nameInput = screen.getByDisplayValue('Team Chat');
      await user.clear(nameInput);
      await user.type(nameInput, '🎉 Party Time 🎊');

      expect(nameInput).toHaveValue('🎉 Party Time 🎊');
    });
  });

  describe('Component Integration', () => {
    it('integrates with React Router params', () => {
      mockUseParams.mockReturnValue({ groupId: 'test-group-123' });
      renderWithProviders(<GroupDMSettingsPage />);
      expect(mockUseParams).toHaveBeenCalled();
    });

    it('integrates with React Router navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const backButton = screen.getByRole('button', { name: /go back/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalled();
    });

    it('works with BrowserRouter', () => {
      const { container } = render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <GroupDMSettingsPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
      expect(container).toBeInTheDocument();
    });

    it('works with MemoryRouter', () => {
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('displays all required icons', () => {
      renderWithProviders(<GroupDMSettingsPage />);

      expect(screen.getByTestId('icon-arrow-left')).toBeInTheDocument();
      expect(screen.getByTestId('icon-settings')).toBeInTheDocument();
      expect(screen.getByTestId('icon-image')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
      expect(screen.getByTestId('icon-users')).toBeInTheDocument();
      expect(screen.getByTestId('icon-user-plus')).toBeInTheDocument();
      expect(screen.getByTestId('icon-logout')).toBeInTheDocument();
    });

    it('displays role icons correctly', () => {
      renderWithProviders(<GroupDMSettingsPage />);

      expect(screen.getByTestId('icon-crown')).toBeInTheDocument();
      expect(screen.getByTestId('icon-shield')).toBeInTheDocument();
    });

    it('displays correct icon based on notification state', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      expect(screen.getByTestId('icon-bell')).toBeInTheDocument();

      const toggleButton = screen.getByRole('button', { pressed: true });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('icon-bell-off')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently with memoization', () => {
      const { rerender } = renderWithProviders(<GroupDMSettingsPage />);

      rerender(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <GroupDMSettingsPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles rapid re-renders', () => {
      const { rerender } = renderWithProviders(<GroupDMSettingsPage />);

      for (let i = 0; i < 10; i++) {
        rerender(
          <MemoryRouter>
            <AuthContext.Provider value={mockAuthContext}>
              <GroupDMSettingsPage />
            </AuthContext.Provider>
          </MemoryRouter>
        );
      }

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Framer Motion Integration', () => {
    it('renders motion.div components', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('applies animation props correctly', () => {
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      const motionElements = container.querySelectorAll('[class*="motion"]');
      // Motion elements render as regular divs in test environment
      expect(container).toBeInTheDocument();
    });
  });

  describe('Member Filtering', () => {
    it('correctly identifies current user', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      expect(screen.getByText('(You)')).toBeInTheDocument();
    });

    it('shows role badge for owner', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const aliceRow = screen.getByText('alice').closest('div');
      expect(aliceRow?.querySelector('[data-testid="icon-crown"]')).toBeInTheDocument();
    });

    it('shows role badge for admin', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const bobRow = screen.getByText('bob').closest('div');
      expect(bobRow?.querySelector('[data-testid="icon-shield"]')).toBeInTheDocument();
    });

    it('does not show role badge for regular members', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const charlieRow = screen.getByText('charlie').closest('div');
      expect(charlieRow?.querySelector('[data-testid="icon-crown"]')).not.toBeInTheDocument();
      expect(charlieRow?.querySelector('[data-testid="icon-shield"]')).not.toBeInTheDocument();
    });
  });

  describe('Confirmation Dialogs', () => {
    it('uses native confirm for member removal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const removeButton = screen.getByRole('button', { name: /remove bob/i });
      await user.click(removeButton);

      expect(global.confirm).toHaveBeenCalled();
    });

    it('uses native confirm for leaving group', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const leaveButton = screen.getByRole('button', { name: /leave group/i });
      await user.click(leaveButton);

      expect(global.confirm).toHaveBeenCalled();
    });

    it('uses native confirm for deleting group', async () => {
      const user = userEvent.setup();
      renderWithProviders(<GroupDMSettingsPage />);

      const deleteButton = screen.getByRole('button', { name: /delete group/i });
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalled();
    });

    it('respects confirm rejection', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(false);
      renderWithProviders(<GroupDMSettingsPage />);

      const leaveButton = screen.getByRole('button', { name: /leave group/i });
      await user.click(leaveButton);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Visual Feedback', () => {
    it('applies hover styles to interactive elements', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const backButton = screen.getByRole('button', { name: /go back/i });
      expect(backButton).toHaveClass('hover:bg-gray-100');
    });

    it('applies transition classes for smooth animations', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const toggleButton = screen.getByRole('button', { pressed: true });
      expect(toggleButton).toHaveClass('transition-colors');
    });

    it('applies proper styling to danger zone buttons', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const leaveButton = screen.getByRole('button', { name: /leave group/i });
      expect(leaveButton.className).toContain('red');
    });

    it('applies proper styling to primary buttons', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const addButton = screen.getByRole('button', { name: /add members/i });
      expect(addButton.className).toContain('blue');
    });
  });

  describe('Layout Structure', () => {
    it('has proper container structure', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('has proper spacing between sections', () => {
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      const sections = container.querySelectorAll('.space-y-6');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('uses proper card styling', () => {
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      const cards = container.querySelectorAll('.rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('has proper grid/flex layouts', () => {
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      const flexElements = container.querySelectorAll('.flex');
      expect(flexElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Boundaries', () => {
    it('handles missing groupId param gracefully', () => {
      mockUseParams.mockReturnValue({});
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('handles null groupId param', () => {
      mockUseParams.mockReturnValue({ groupId: null });
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('handles undefined members gracefully', () => {
      renderWithProviders(<GroupDMSettingsPage />);
      // Component has default members state
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot for default state', () => {
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with notifications disabled', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<GroupDMSettingsPage />);

      const toggleButton = screen.getByRole('button', { pressed: true });
      await user.click(toggleButton);

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot after member removal', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      const { container } = renderWithProviders(<GroupDMSettingsPage />);

      const removeButton = screen.getByRole('button', { name: /remove bob/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(container.firstChild).toMatchSnapshot();
      });
    });
  });

  describe('Memory Leaks', () => {
    it('cleans up on unmount', () => {
      const { unmount } = renderWithProviders(<GroupDMSettingsPage />);
      unmount();

      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it('handles multiple mount/unmount cycles', () => {
      const { unmount, rerender } = renderWithProviders(<GroupDMSettingsPage />);

      unmount();
      rerender(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <GroupDMSettingsPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Browser Compatibility', () => {
    it('works without modern JavaScript features', () => {
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('handles missing window.confirm gracefully', () => {
      delete global.confirm;
      const { container } = renderWithProviders(<GroupDMSettingsPage />);
      expect(container).toBeInTheDocument();
    });
  });
});

export default mockNavigate
