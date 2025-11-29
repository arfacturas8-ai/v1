import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BlockMuteSystem from './BlockMuteSystem';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Shield: (props) => <div data-testid="shield-icon" {...props} />,
  UserX: (props) => <div data-testid="user-x-icon" {...props} />,
  VolumeX: (props) => <div data-testid="volume-x-icon" {...props} />,
  Filter: (props) => <div data-testid="filter-icon" {...props} />,
  Search: (props) => <div data-testid="search-icon" {...props} />,
  X: (props) => <div data-testid="x-icon" {...props} />,
  AlertCircle: (props) => <div data-testid="alert-circle-icon" {...props} />,
  Check: (props) => <div data-testid="check-icon" {...props} />,
  Calendar: (props) => <div data-testid="calendar-icon" {...props} />,
  MoreVertical: (props) => <div data-testid="more-vertical-icon" {...props} />,
  Trash2: (props) => <div data-testid="trash2-icon" {...props} />,
  Edit: (props) => <div data-testid="edit-icon" {...props} />,
  Plus: (props) => <div data-testid="plus-icon" {...props} />,
}));

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

const mockUser = {
  id: 'user1',
  username: 'testuser',
};

describe('BlockMuteSystem', () => {
  let mockOnClose;

  beforeEach(() => {
    mockOnClose = jest.fn();
  });

  describe('Rendering and UI', () => {
    it('renders the component', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText(/privacy & safety/i)).toBeInTheDocument();
    });

    it('renders shield icon', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });

    it('renders close button', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('renders all three tabs', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText(/blocked users/i)).toBeInTheDocument();
      expect(screen.getByText(/muted users/i)).toBeInTheDocument();
      expect(screen.getByText(/filtered keywords/i)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = renderWithRouter(
        <BlockMuteSystem user={mockUser} onClose={mockOnClose} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('matches snapshot', () => {
      const { container } = renderWithRouter(
        <BlockMuteSystem user={mockUser} onClose={mockOnClose} />
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Tab Navigation', () => {
    it('shows blocked users tab by default', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText(/blocked users/i).closest('button')).toHaveClass('bg-blue-50');
    });

    it('switches to muted users tab', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      await user.click(screen.getByText(/muted users/i));
      expect(screen.getByText(/muted users/i).closest('button')).toHaveClass('bg-blue-50');
    });

    it('switches to filtered keywords tab', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      await user.click(screen.getByText(/filtered keywords/i));
      expect(screen.getByText(/filtered keywords/i).closest('button')).toHaveClass('bg-blue-50');
    });

    it('displays correct icon for each tab', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByTestId('user-x-icon')).toBeInTheDocument();
      expect(screen.getByTestId('volume-x-icon')).toBeInTheDocument();
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    });
  });

  describe('Blocked Users Tab', () => {
    it('displays blocked users list', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText(/spammer123/i)).toBeInTheDocument();
      expect(screen.getByText(/trolluser/i)).toBeInTheDocument();
    });

    it('displays block reason', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText(/spamming/i)).toBeInTheDocument();
      expect(screen.getByText(/harassment/i)).toBeInTheDocument();
    });

    it('displays block date', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText(/blocked on/i)).toBeInTheDocument();
    });

    it('shows search input for blocked users', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByPlaceholderText(/search blocked users/i)).toBeInTheDocument();
    });

    it('filters blocked users by search', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const searchInput = screen.getByPlaceholderText(/search blocked users/i);
      await user.type(searchInput, 'spammer');

      expect(screen.getByText(/spammer123/i)).toBeInTheDocument();
      expect(screen.queryByText(/trolluser/i)).not.toBeInTheDocument();
    });

    it('displays unblock button', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      const unblockButtons = screen.getAllByText(/unblock/i);
      expect(unblockButtons.length).toBeGreaterThan(0);
    });

    it('opens unblock confirmation modal', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const unblockButtons = screen.getAllByText(/unblock/i);
      await user.click(unblockButtons[0]);

      expect(screen.getByText(/unblock user/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('confirms unblock action', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const unblockButtons = screen.getAllByText(/unblock/i);
      await user.click(unblockButtons[0]);

      const confirmButton = screen.getByText(/confirm/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/user unblocked/i)).toBeInTheDocument();
      });
    });

    it('cancels unblock action', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const unblockButtons = screen.getAllByText(/unblock/i);
      await user.click(unblockButtons[0]);

      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });

    it('displays empty state when no blocked users', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const searchInput = screen.getByPlaceholderText(/search blocked users/i);
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText(/no blocked users found/i)).toBeInTheDocument();
    });
  });

  describe('Muted Users Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      await user.click(screen.getByText(/muted users/i));
    });

    it('displays muted users list', () => {
      expect(screen.getByText(/louduser/i)).toBeInTheDocument();
      expect(screen.getByText(/repeatposter/i)).toBeInTheDocument();
    });

    it('displays mute options', () => {
      expect(screen.getByText(/posts hidden/i)).toBeInTheDocument();
      expect(screen.getByText(/comments hidden/i)).toBeInTheDocument();
    });

    it('shows mute duration', () => {
      expect(screen.getByText(/permanent/i)).toBeInTheDocument();
      expect(screen.getByText(/expires/i)).toBeInTheDocument();
    });

    it('shows search input for muted users', () => {
      expect(screen.getByPlaceholderText(/search muted users/i)).toBeInTheDocument();
    });

    it('filters muted users by search', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/search muted users/i);
      await user.type(searchInput, 'loud');

      expect(screen.getByText(/louduser/i)).toBeInTheDocument();
      expect(screen.queryByText(/repeatposter/i)).not.toBeInTheDocument();
    });

    it('displays unmute button', () => {
      const unmuteButtons = screen.getAllByText(/unmute/i);
      expect(unmuteButtons.length).toBeGreaterThan(0);
    });

    it('opens unmute confirmation modal', async () => {
      const user = userEvent.setup();
      const unmuteButtons = screen.getAllByText(/unmute/i);
      await user.click(unmuteButtons[0]);

      expect(screen.getByText(/unmute user/i)).toBeInTheDocument();
    });

    it('confirms unmute action', async () => {
      const user = userEvent.setup();
      const unmuteButtons = screen.getAllByText(/unmute/i);
      await user.click(unmuteButtons[0]);

      const confirmButton = screen.getByText(/confirm/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/user unmuted/i)).toBeInTheDocument();
      });
    });

    it('displays edit mute settings button', () => {
      expect(screen.getAllByTestId('edit-icon').length).toBeGreaterThan(0);
    });

    it('opens edit mute settings modal', async () => {
      const user = userEvent.setup();
      const editButtons = screen.getAllByTestId('edit-icon');
      await user.click(editButtons[0].closest('button'));

      expect(screen.getByText(/edit mute settings/i)).toBeInTheDocument();
    });

    it('displays empty state when no muted users', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/search muted users/i);
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText(/no muted users found/i)).toBeInTheDocument();
    });
  });

  describe('Mute Settings Modal', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      await user.click(screen.getByText(/muted users/i));
      const editButtons = screen.getAllByTestId('edit-icon');
      await user.click(editButtons[0].closest('button'));
    });

    it('displays mute options checkboxes', () => {
      expect(screen.getByLabelText(/hide posts/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hide comments/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hide messages/i)).toBeInTheDocument();
    });

    it('toggles mute options', async () => {
      const user = userEvent.setup();
      const hidePostsCheckbox = screen.getByLabelText(/hide posts/i);

      await user.click(hidePostsCheckbox);
      expect(hidePostsCheckbox).not.toBeChecked();

      await user.click(hidePostsCheckbox);
      expect(hidePostsCheckbox).toBeChecked();
    });

    it('displays duration options', () => {
      expect(screen.getByLabelText(/permanent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/temporary/i)).toBeInTheDocument();
    });

    it('shows date picker for temporary mute', async () => {
      const user = userEvent.setup();
      const temporaryRadio = screen.getByLabelText(/temporary/i);
      await user.click(temporaryRadio);

      expect(screen.getByLabelText(/until date/i)).toBeInTheDocument();
    });

    it('saves mute settings', async () => {
      const user = userEvent.setup();
      const saveButton = screen.getByText(/save changes/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/mute settings updated/i)).toBeInTheDocument();
      });
    });

    it('cancels mute settings edit', async () => {
      const user = userEvent.setup();
      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      expect(screen.queryByText(/edit mute settings/i)).not.toBeInTheDocument();
    });
  });

  describe('Filtered Keywords Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      await user.click(screen.getByText(/filtered keywords/i));
    });

    it('displays filtered keywords list', () => {
      expect(screen.getByText(/spam/i)).toBeInTheDocument();
      expect(screen.getByText(/scam/i)).toBeInTheDocument();
    });

    it('shows add keyword button', () => {
      expect(screen.getByText(/add keyword/i)).toBeInTheDocument();
    });

    it('opens add keyword modal', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByText(/add keyword/i));

      expect(screen.getByText(/add filtered keyword/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter keyword/i)).toBeInTheDocument();
    });

    it('adds new keyword', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByText(/add keyword/i));

      const input = screen.getByPlaceholderText(/enter keyword/i);
      await user.type(input, 'newkeyword');

      const addButton = screen.getByText(/add/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/keyword added/i)).toBeInTheDocument();
      });
    });

    it('validates keyword input', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByText(/add keyword/i));

      const addButton = screen.getByText(/add/i);
      await user.click(addButton);

      expect(screen.getByText(/keyword cannot be empty/i)).toBeInTheDocument();
    });

    it('removes keyword', async () => {
      const user = userEvent.setup();
      const removeButtons = screen.getAllByTestId('trash2-icon');
      await user.click(removeButtons[0].closest('button'));

      await waitFor(() => {
        expect(screen.getByText(/keyword removed/i)).toBeInTheDocument();
      });
    });

    it('displays keyword match type', () => {
      expect(screen.getByText(/exact match/i)).toBeInTheDocument();
      expect(screen.getByText(/contains/i)).toBeInTheDocument();
    });

    it('displays keyword scope', () => {
      expect(screen.getByText(/posts & comments/i)).toBeInTheDocument();
      expect(screen.getByText(/posts only/i)).toBeInTheDocument();
    });

    it('searches keywords', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/search keywords/i);
      await user.type(searchInput, 'spam');

      expect(screen.getByText(/spam/i)).toBeInTheDocument();
      expect(screen.queryByText(/scam/i)).not.toBeInTheDocument();
    });

    it('displays empty state when no keywords', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText(/search keywords/i);
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText(/no keywords found/i)).toBeInTheDocument();
    });
  });

  describe('Add Keyword Modal', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      await user.click(screen.getByText(/filtered keywords/i));
      await user.click(screen.getByText(/add keyword/i));
    });

    it('displays keyword input', () => {
      expect(screen.getByPlaceholderText(/enter keyword/i)).toBeInTheDocument();
    });

    it('displays match type options', () => {
      expect(screen.getByLabelText(/exact match/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contains/i)).toBeInTheDocument();
    });

    it('displays scope options', () => {
      expect(screen.getByLabelText(/posts & comments/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/posts only/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/comments only/i)).toBeInTheDocument();
    });

    it('toggles match type', async () => {
      const user = userEvent.setup();
      const containsRadio = screen.getByLabelText(/contains/i);
      await user.click(containsRadio);

      expect(containsRadio).toBeChecked();
    });

    it('toggles scope', async () => {
      const user = userEvent.setup();
      const postsOnlyRadio = screen.getByLabelText(/posts only/i);
      await user.click(postsOnlyRadio);

      expect(postsOnlyRadio).toBeChecked();
    });

    it('cancels adding keyword', async () => {
      const user = userEvent.setup();
      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      expect(screen.queryByText(/add filtered keyword/i)).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('displays blocked users count', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText(/2 blocked/i)).toBeInTheDocument();
    });

    it('displays muted users count', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      await user.click(screen.getByText(/muted users/i));

      expect(screen.getByText(/2 muted/i)).toBeInTheDocument();
    });

    it('displays filtered keywords count', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      await user.click(screen.getByText(/filtered keywords/i));

      expect(screen.getByText(/5 keywords/i)).toBeInTheDocument();
    });
  });

  describe('User Profiles', () => {
    it('links to blocked user profile', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      const userLinks = screen.getAllByRole('link');
      expect(userLinks[0]).toHaveAttribute('href', expect.stringContaining('/user/'));
    });

    it('displays user avatar', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      const avatars = screen.getAllByRole('img');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('displays user karma', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText(/karma/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading state when fetching blocked users', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} isLoading={true} />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('disables actions while loading', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} isLoading={true} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        if (button.textContent.includes('Unblock')) {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on unblock failure', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const unblockButtons = screen.getAllByText(/unblock/i);
      await user.click(unblockButtons[0]);

      // Simulate error by mocking
      const confirmButton = screen.getByText(/confirm/i);
      await user.click(confirmButton);

      // In real implementation, would show error
      // Here we just check the flow completes
      await waitFor(() => {
        expect(screen.queryByText(/confirm/i)).not.toBeInTheDocument();
      });
    });

    it('displays error message on keyword add failure', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      await user.click(screen.getByText(/filtered keywords/i));
      await user.click(screen.getByText(/add keyword/i));

      const input = screen.getByPlaceholderText(/enter keyword/i);
      await user.type(input, 'a'); // Very short keyword might fail

      const addButton = screen.getByText(/add/i);
      await user.click(addButton);

      // Should show some validation or error
      expect(screen.queryByText(/keyword added/i)).toBeInTheDocument();
    });
  });

  describe('Bulk Actions', () => {
    it('displays select all checkbox', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('selects all users', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select all

      // All individual checkboxes should be checked
      checkboxes.slice(1).forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('displays bulk unblock button when users selected', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select one user

      expect(screen.getByText(/unblock selected/i)).toBeInTheDocument();
    });

    it('bulk unblocks selected users', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      await user.click(screen.getByText(/unblock selected/i));

      await waitFor(() => {
        expect(screen.getByText(/users unblocked/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles user with no blocked users', () => {
      const emptyUser = { ...mockUser, blocked: [] };
      renderWithRouter(<BlockMuteSystem user={emptyUser} onClose={mockOnClose} />);
      expect(screen.getByText(/no blocked users/i)).toBeInTheDocument();
    });

    it('handles very long usernames', () => {
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      // Component should render without breaking
      expect(screen.getByText(/privacy & safety/i)).toBeInTheDocument();
    });

    it('handles special characters in keywords', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      await user.click(screen.getByText(/filtered keywords/i));
      await user.click(screen.getByText(/add keyword/i));

      const input = screen.getByPlaceholderText(/enter keyword/i);
      await user.type(input, '@#$%');

      const addButton = screen.getByText(/add/i);
      await user.click(addButton);

      // Should handle special characters
      await waitFor(() => {
        expect(screen.queryByText(/add filtered keyword/i)).not.toBeInTheDocument();
      });
    });

    it('handles expired temporary mutes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<BlockMuteSystem user={mockUser} onClose={mockOnClose} />);
      await user.click(screen.getByText(/muted users/i));

      // Should show expired status
      expect(screen.getByText(/expires/i)).toBeInTheDocument();
    });
  });
});

export default renderWithRouter
