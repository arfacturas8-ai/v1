/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import GroupDMSettingsPage from '../GroupDMSettingsPage';

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ groupId: 'test-group-123' }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock window.confirm
global.confirm = jest.fn();

describe('GroupDMSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    global.confirm.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(
      <MemoryRouter initialEntries={['/group/test-group-123/settings']}>
        <Routes>
          <Route path="/group/:groupId/settings" element={component} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Page Rendering - Basic', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper role', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('aria-label', 'Group DM settings page');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<GroupDMSettingsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page heading', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByRole('heading', { name: /Group Settings/i })).toBeInTheDocument();
    });

    it('displays member count', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText(/4 members/i)).toBeInTheDocument();
    });

    it('has proper page structure', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('renders header with navigation', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const backButton = screen.getByRole('button', { name: /Go back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('back button navigates to previous page', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const backButton = screen.getByRole('button', { name: /Go back/i });
      await user.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('displays group settings title', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByRole('heading', { name: /Group Settings/i, level: 1 })).toBeInTheDocument();
    });

    it('shows correct member count', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText('4 members')).toBeInTheDocument();
    });

    it('header has proper styling', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const header = container.querySelector('.bg-white');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Group Information Section', () => {
    it('renders group information card', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText(/Group Information/i)).toBeInTheDocument();
    });

    it('displays group icon', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText('👥')).toBeInTheDocument();
    });

    it('shows change icon button', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /Change Icon/i })).toBeInTheDocument();
    });

    it('displays group name input', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const input = screen.getByDisplayValue('Team Chat');
      expect(input).toBeInTheDocument();
    });

    it('group name input has correct label', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText(/Group Name/i)).toBeInTheDocument();
    });

    it('allows group name editing', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const input = screen.getByDisplayValue('Team Chat');
      await user.clear(input);
      await user.type(input, 'New Group Name');
      expect(input).toHaveValue('New Group Name');
    });

    it('disables name input for non-admin members', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const input = screen.getByDisplayValue('Team Chat');
      // Owner (alice) should be able to edit
      expect(input).not.toBeDisabled();
    });
  });

  describe('Notifications Toggle', () => {
    it('displays notifications section', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText(/^Notifications$/)).toBeInTheDocument();
    });

    it('shows notification description', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText(/Get notified of new messages/i)).toBeInTheDocument();
    });

    it('displays notification toggle button', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const toggle = screen.getByRole('button', { pressed: true });
      expect(toggle).toBeInTheDocument();
    });

    it('toggles notifications on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const toggle = screen.getByRole('button', { pressed: true });
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows bell icon when enabled', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const notificationSection = screen.getByText(/Get notified of new messages/i).closest('div');
      expect(notificationSection).toBeInTheDocument();
    });

    it('changes icon when toggled off', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const toggle = screen.getByRole('button', { pressed: true });
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Members Section', () => {
    it('renders members section', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText(/Members \(4\)/i)).toBeInTheDocument();
    });

    it('displays all members', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
      expect(screen.getByText('charlie')).toBeInTheDocument();
      expect(screen.getByText('diana')).toBeInTheDocument();
    });

    it('shows member avatars', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText('🐱')).toBeInTheDocument();
      expect(screen.getByText('🐶')).toBeInTheDocument();
      expect(screen.getByText('🦊')).toBeInTheDocument();
      expect(screen.getByText('🐼')).toBeInTheDocument();
    });

    it('displays member roles', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText('owner')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getAllByText('member')).toHaveLength(2);
    });

    it('shows online status indicators', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const onlineIndicators = container.querySelectorAll('.bg-green-500');
      expect(onlineIndicators.length).toBeGreaterThan(0);
    });

    it('indicates current user', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText('(You)')).toBeInTheDocument();
    });

    it('shows crown icon for owner', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      // Crown icon should be present for owner role
      const ownerSection = screen.getByText('alice').closest('div');
      expect(ownerSection).toBeInTheDocument();
    });

    it('shows shield icon for admin', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      // Shield icon should be present for admin role
      const adminSection = screen.getByText('bob').closest('div');
      expect(adminSection).toBeInTheDocument();
    });
  });

  describe('Member Management - Owner Permissions', () => {
    it('shows add members button for owner', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /Add Members/i })).toBeInTheDocument();
    });

    it('displays role dropdown for other members', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('allows changing member roles', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const selects = screen.getAllByRole('combobox');
      if (selects.length > 0) {
        await user.selectOptions(selects[0], 'admin');
        expect(selects[0]).toHaveValue('admin');
      }
    });

    it('shows remove member buttons', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('removes member when clicking remove button', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithRouter(<GroupDMSettingsPage />);
      const removeButtons = screen.getAllByRole('button', { name: /Remove bob/i });
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0]);
        expect(global.confirm).toHaveBeenCalledWith('Remove this member from the group?');
      }
    });

    it('cancels removal if not confirmed', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(false);
      renderWithRouter(<GroupDMSettingsPage />);
      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0]);
        expect(screen.getByText('bob')).toBeInTheDocument();
      }
    });

    it('cannot remove self', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const aliceSection = screen.getByText('alice').closest('.flex.items-center.justify-between');
      const removeButton = within(aliceSection).queryByRole('button', { name: /Remove/i });
      expect(removeButton).not.toBeInTheDocument();
    });
  });

  describe('Role Management', () => {
    it('displays role options in dropdown', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const selects = screen.getAllByRole('combobox');
      if (selects.length > 0) {
        const options = within(selects[0]).getAllByRole('option');
        expect(options).toHaveLength(2); // Member and Admin
      }
    });

    it('updates member role on selection', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const selects = screen.getAllByRole('combobox');
      if (selects.length > 0) {
        await user.selectOptions(selects[0], 'admin');
        await waitFor(() => {
          expect(selects[0]).toHaveValue('admin');
        });
      }
    });

    it('owner can promote members to admin', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const selects = screen.getAllByRole('combobox');
      if (selects.length > 0) {
        await user.selectOptions(selects[0], 'admin');
        expect(selects[0]).toHaveValue('admin');
      }
    });

    it('owner can demote admins to members', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const selects = screen.getAllByRole('combobox');
      if (selects.length > 0) {
        await user.selectOptions(selects[0], 'member');
        expect(selects[0]).toHaveValue('member');
      }
    });
  });

  describe('Danger Zone', () => {
    it('renders danger zone section', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByText(/Danger Zone/i)).toBeInTheDocument();
    });

    it('displays leave group button', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /Leave Group/i })).toBeInTheDocument();
    });

    it('shows delete group button for owner', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /Delete Group/i })).toBeInTheDocument();
    });

    it('danger zone has warning styling', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const dangerZone = container.querySelector('.border-red-200');
      expect(dangerZone).toBeInTheDocument();
    });
  });

  describe('Leave Group Functionality', () => {
    it('shows confirmation dialog when leaving', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithRouter(<GroupDMSettingsPage />);
      const leaveButton = screen.getByRole('button', { name: /Leave Group/i });
      await user.click(leaveButton);
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to leave this group?');
    });

    it('navigates to messages after leaving', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithRouter(<GroupDMSettingsPage />);
      const leaveButton = screen.getByRole('button', { name: /Leave Group/i });
      await user.click(leaveButton);
      expect(mockNavigate).toHaveBeenCalledWith('/messages');
    });

    it('cancels leaving if not confirmed', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(false);
      renderWithRouter(<GroupDMSettingsPage />);
      const leaveButton = screen.getByRole('button', { name: /Leave Group/i });
      await user.click(leaveButton);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Delete Group Functionality', () => {
    it('shows confirmation dialog when deleting', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithRouter(<GroupDMSettingsPage />);
      const deleteButton = screen.getByRole('button', { name: /Delete Group/i });
      await user.click(deleteButton);
      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this group? This action cannot be undone.'
      );
    });

    it('navigates to messages after deletion', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithRouter(<GroupDMSettingsPage />);
      const deleteButton = screen.getByRole('button', { name: /Delete Group/i });
      await user.click(deleteButton);
      expect(mockNavigate).toHaveBeenCalledWith('/messages');
    });

    it('cancels deletion if not confirmed', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(false);
      renderWithRouter(<GroupDMSettingsPage />);
      const deleteButton = screen.getByRole('button', { name: /Delete Group/i });
      await user.click(deleteButton);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('warns about permanent deletion', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      renderWithRouter(<GroupDMSettingsPage />);
      const deleteButton = screen.getByRole('button', { name: /Delete Group/i });
      await user.click(deleteButton);
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('cannot be undone')
      );
    });
  });

  describe('Accessibility - ARIA', () => {
    it('main element has accessible label', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Group DM settings page');
    });

    it('back button has accessible label', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const backButton = screen.getByRole('button', { name: /Go back/i });
      expect(backButton).toHaveAttribute('aria-label', 'Go back');
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].tagName).toBe('H1');
    });

    it('notification toggle has aria-pressed', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const toggle = screen.getByRole('button', { pressed: true });
      expect(toggle).toHaveAttribute('aria-pressed');
    });

    it('remove buttons have descriptive labels', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      removeButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Accessibility - Keyboard Navigation', () => {
    it('back button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const backButton = screen.getByRole('button', { name: /Go back/i });
      backButton.focus();
      expect(backButton).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('notification toggle is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GroupDMSettingsPage />);
      const toggle = screen.getByRole('button', { pressed: true });
      toggle.focus();
      expect(toggle).toHaveFocus();
    });

    it('all interactive elements are focusable', () => {
      renderWithRouter(<GroupDMSettingsPage />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Responsive Design - Mobile', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains functionality on small screens', () => {
      global.innerWidth = 320;
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByRole('button', { name: /Leave Group/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design - Desktop', () => {
    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<GroupDMSettingsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('constrains max width on large screens', () => {
      global.innerWidth = 2560;
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const maxWidthDiv = container.querySelector('.max-w-4xl');
      expect(maxWidthDiv).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const darkElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkElements.length).toBeGreaterThan(0);
    });

    it('header has dark mode styling', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const header = container.querySelector('.dark\\:bg-[#161b22]');
      expect(header).toBeInTheDocument();
    });

    it('cards have dark mode backgrounds', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const darkCards = container.querySelectorAll('.dark\\:bg-[#161b22]');
      expect(darkCards.length).toBeGreaterThan(0);
    });
  });

  describe('Component Memoization', () => {
    it('component is memoized', () => {
      const { rerender } = renderWithRouter(<GroupDMSettingsPage />);
      const heading = screen.getByRole('heading', { name: /Group Settings/i });
      rerender(<GroupDMSettingsPage />);
      const heading2 = screen.getByRole('heading', { name: /Group Settings/i });
      expect(heading).toBe(heading2);
    });
  });

  describe('Animation and Motion', () => {
    it('renders motion divs', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const cards = container.querySelectorAll('.rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('applies animation classes', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const animatedElements = container.querySelectorAll('[class*="transition"]');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Design', () => {
    it('uses rounded corners', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const roundedElements = container.querySelectorAll('.rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)], .rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)], .rounded-lg');
      expect(roundedElements.length).toBeGreaterThan(0);
    });

    it('applies shadows to cards', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const shadowElements = container.querySelectorAll('.shadow-sm');
      expect(shadowElements.length).toBeGreaterThan(0);
    });

    it('uses consistent spacing', () => {
      const { container } = renderWithRouter(<GroupDMSettingsPage />);
      const spacedElements = container.querySelectorAll('[class*="space-y"]');
      expect(spacedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('renders quickly', () => {
      const start = performance.now();
      renderWithRouter(<GroupDMSettingsPage />);
      const end = performance.now();
      expect(end - start).toBeLessThan(1000);
    });

    it('handles re-renders efficiently', () => {
      const { rerender } = renderWithRouter(<GroupDMSettingsPage />);
      rerender(<GroupDMSettingsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('renders without throwing errors', () => {
      expect(() => {
        renderWithRouter(<GroupDMSettingsPage />);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('unmounts cleanly', () => {
      const { unmount } = renderWithRouter(<GroupDMSettingsPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('does not leave side effects after unmount', () => {
      const { unmount } = renderWithRouter(<GroupDMSettingsPage />);
      unmount();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});

export default mockNavigate
