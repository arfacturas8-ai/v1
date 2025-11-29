/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommunitySettings from './CommunitySettings';
import communityService from '../../services/communityService';

jest.mock('../../services/communityService');

describe('CommunitySettings', () => {
  const mockCommunity = {
    id: 'community-1',
    displayName: 'Test Community',
    description: 'Test description',
    category: 'gaming',
    isPublic: true,
    requireApproval: false,
    allowPosts: true,
    showInDirectory: true,
    icon: '/test-icon.png',
    banner: '/test-banner.png',
    themeColor: '#0ea5e9',
    rules: ['Rule 1', 'Rule 2'],
    permissions: {
      createPosts: true,
      uploadMedia: true,
      createPolls: false,
      inviteMembers: true,
      createEvents: false
    },
    moderation: {
      autoModeratePosts: false,
      filterProfanity: true,
      requireEmailVerification: false,
      minAccountAge: 0
    }
  };

  const mockCurrentUser = {
    id: 'user-1',
    username: 'testuser'
  };

  const defaultProps = {
    communityId: 'community-1',
    currentUser: mockCurrentUser,
    canManageCommunity: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    communityService.getCommunity.mockResolvedValue({
      success: true,
      community: mockCommunity
    });
    communityService.updateCommunity.mockResolvedValue({
      success: true,
      community: mockCommunity
    });
  });

  describe('Initial Loading', () => {
    it('renders loading state initially', () => {
      render(<CommunitySettings {...defaultProps} />);
      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
    });

    it('loads community data on mount', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(communityService.getCommunity).toHaveBeenCalledWith('community-1');
      });
    });

    it('displays community data after loading', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Community')).toBeInTheDocument();
      });
    });

    it('handles loading error', async () => {
      communityService.getCommunity.mockResolvedValue({
        success: false,
        error: 'Failed to load community'
      });

      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load community')).toBeInTheDocument();
      });
    });

    it('handles loading exception', async () => {
      communityService.getCommunity.mockRejectedValue(new Error('Network error'));

      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load community settings')).toBeInTheDocument();
      });
    });
  });

  describe('Permission Handling', () => {
    it('shows access denied when user cannot manage community', async () => {
      render(<CommunitySettings {...defaultProps} canManageCommunity={false} />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText("You don't have permission to manage this community's settings.")).toBeInTheDocument();
      });
    });

    it('shows close button in access denied state', async () => {
      render(<CommunitySettings {...defaultProps} canManageCommunity={false} />);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('calls onClose when close button clicked in access denied state', async () => {
      const onClose = jest.fn();
      render(<CommunitySettings {...defaultProps} canManageCommunity={false} onClose={onClose} />);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Settings Tabs', () => {
    it('displays all settings tabs', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Privacy')).toBeInTheDocument();
        expect(screen.getByText('Appearance')).toBeInTheDocument();
        expect(screen.getByText('Permissions')).toBeInTheDocument();
        expect(screen.getByText('Moderation')).toBeInTheDocument();
      });
    });

    it('shows general tab by default', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('General Settings')).toBeInTheDocument();
      });
    });

    it('switches to privacy tab when clicked', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const privacyTab = screen.getByText('Privacy');
        fireEvent.click(privacyTab);
        expect(screen.getByText('Privacy & Access')).toBeInTheDocument();
      });
    });

    it('switches to appearance tab when clicked', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const appearanceTab = screen.getByText('Appearance');
        fireEvent.click(appearanceTab);
        expect(screen.getByText('Appearance & Branding')).toBeInTheDocument();
      });
    });

    it('switches to permissions tab when clicked', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const permissionsTab = screen.getByText('Permissions');
        fireEvent.click(permissionsTab);
        expect(screen.getByText('Member Permissions')).toBeInTheDocument();
      });
    });

    it('switches to moderation tab when clicked', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const moderationTab = screen.getByText('Moderation');
        fireEvent.click(moderationTab);
        expect(screen.getByText('Moderation Settings')).toBeInTheDocument();
      });
    });

    it('highlights active tab', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const generalTab = screen.getByText('General').closest('button');
        expect(generalTab).toHaveClass('active');
      });
    });
  });

  describe('General Settings', () => {
    it('displays community name input', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        expect(input).toHaveValue('Test Community');
      });
    });

    it('updates community name on input change', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Community' } });
        expect(input).toHaveValue('Updated Community');
      });
    });

    it('displays description textarea', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Describe what your community is about...');
        expect(textarea).toHaveValue('Test description');
      });
    });

    it('updates description on textarea change', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Describe what your community is about...');
        fireEvent.change(textarea, { target: { value: 'Updated description' } });
        expect(textarea).toHaveValue('Updated description');
      });
    });

    it('displays category select', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const select = screen.getByDisplayValue('Gaming');
        expect(select).toBeInTheDocument();
      });
    });

    it('updates category on select change', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const select = screen.getByDisplayValue('Gaming');
        fireEvent.change(select, { target: { value: 'technology' } });
        expect(select).toHaveValue('technology');
      });
    });

    it('displays all category options', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const optionValues = options.map(opt => opt.value);
        expect(optionValues).toContain('general');
        expect(optionValues).toContain('gaming');
        expect(optionValues).toContain('technology');
        expect(optionValues).toContain('art');
        expect(optionValues).toContain('music');
        expect(optionValues).toContain('education');
        expect(optionValues).toContain('sports');
        expect(optionValues).toContain('entertainment');
        expect(optionValues).toContain('business');
        expect(optionValues).toContain('other');
      });
    });
  });

  describe('Community Rules', () => {
    it('displays existing rules', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Rule 1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Rule 2')).toBeInTheDocument();
      });
    });

    it('displays add rule button', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Rule')).toBeInTheDocument();
      });
    });

    it('adds new rule when add button clicked', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const addButton = screen.getByText('Add Rule');
        fireEvent.click(addButton);
        const ruleInputs = screen.getAllByPlaceholderText('Enter a community rule...');
        expect(ruleInputs.length).toBe(1);
      });
    });

    it('updates rule text on input change', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const ruleInput = screen.getByDisplayValue('Rule 1');
        fireEvent.change(ruleInput, { target: { value: 'Updated Rule 1' } });
        expect(ruleInput).toHaveValue('Updated Rule 1');
      });
    });

    it('displays remove button for each rule', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const removeButtons = screen.getAllByRole('button');
        const trashButtons = removeButtons.filter(btn => btn.classList.contains('remove-rule'));
        expect(trashButtons.length).toBe(2);
      });
    });

    it('removes rule when remove button clicked', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(async () => {
        const removeButtons = screen.getAllByRole('button');
        const trashButtons = removeButtons.filter(btn => btn.classList.contains('remove-rule'));
        fireEvent.click(trashButtons[0]);

        await waitFor(() => {
          expect(screen.queryByDisplayValue('Rule 1')).not.toBeInTheDocument();
        });
      });
    });

    it('displays rule numbers', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1.')).toBeInTheDocument();
        expect(screen.getByText('2.')).toBeInTheDocument();
      });
    });
  });

  describe('Privacy Settings', () => {
    it('displays public/private radio options', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Privacy'));
      });

      await waitFor(() => {
        expect(screen.getByText('Public')).toBeInTheDocument();
        expect(screen.getByText('Private')).toBeInTheDocument();
      });
    });

    it('shows public option as selected by default', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Privacy'));
      });

      await waitFor(() => {
        const publicRadio = screen.getByRole('radio', { name: /Public/i });
        expect(publicRadio).toBeChecked();
      });
    });

    it('switches to private when private option clicked', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Privacy'));
      });

      await waitFor(() => {
        const privateRadio = screen.getByRole('radio', { name: /Private/i });
        fireEvent.click(privateRadio);
        expect(privateRadio).toBeChecked();
      });
    });

    it('displays require approval checkbox', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Privacy'));
      });

      await waitFor(() => {
        expect(screen.getByText('Require approval for new members')).toBeInTheDocument();
      });
    });

    it('toggles require approval checkbox', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Privacy'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Require approval for new members');
        expect(checkbox).not.toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
      });
    });

    it('displays allow posts checkbox', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Privacy'));
      });

      await waitFor(() => {
        expect(screen.getByText('Allow members to create posts')).toBeInTheDocument();
      });
    });

    it('toggles allow posts checkbox', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Privacy'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Allow members to create posts');
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
      });
    });

    it('displays show in directory checkbox', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Privacy'));
      });

      await waitFor(() => {
        expect(screen.getByText('Show in community directory')).toBeInTheDocument();
      });
    });

    it('toggles show in directory checkbox', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Privacy'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Show in community directory');
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Appearance Settings', () => {
    it('displays community icon', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Appearance'));
      });

      await waitFor(() => {
        const iconImg = screen.getByAltText('Community icon');
        expect(iconImg).toHaveAttribute('src', '/test-icon.png');
      });
    });

    it('displays upload icon button', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Appearance'));
      });

      await waitFor(() => {
        expect(screen.getByText('Upload New Icon')).toBeInTheDocument();
      });
    });

    it('displays community banner', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Appearance'));
      });

      await waitFor(() => {
        const bannerImg = screen.getByAltText('Community banner');
        expect(bannerImg).toHaveAttribute('src', '/test-banner.png');
      });
    });

    it('displays upload banner button', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Appearance'));
      });

      await waitFor(() => {
        expect(screen.getByText('Upload New Banner')).toBeInTheDocument();
      });
    });

    it('displays theme color picker', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Appearance'));
      });

      await waitFor(() => {
        const colorInputs = screen.getAllByDisplayValue('#0ea5e9');
        expect(colorInputs.length).toBeGreaterThan(0);
      });
    });

    it('updates theme color on color picker change', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Appearance'));
      });

      await waitFor(() => {
        const colorInput = screen.getAllByDisplayValue('#0ea5e9')[0];
        fireEvent.change(colorInput, { target: { value: '#ff0000' } });
        expect(colorInput).toHaveValue('#ff0000');
      });
    });

    it('handles icon upload', async () => {
      const file = new File(['icon'], 'icon.png', { type: 'image/png' });
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Appearance'));
      });

      await waitFor(() => {
        const fileInput = screen.getAllByRole('button').find(btn =>
          btn.textContent.includes('Upload New Icon')
        ).querySelector('input');
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(communityService.updateCommunity).toHaveBeenCalled();
      });
    });

    it('handles banner upload', async () => {
      const file = new File(['banner'], 'banner.png', { type: 'image/png' });
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Appearance'));
      });

      await waitFor(() => {
        const fileInput = screen.getAllByRole('button').find(btn =>
          btn.textContent.includes('Upload New Banner')
        ).querySelector('input');
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(communityService.updateCommunity).toHaveBeenCalled();
      });
    });

    it('handles image upload error', async () => {
      communityService.updateCommunity.mockResolvedValue({
        success: false,
        error: 'Failed to upload image'
      });

      const file = new File(['icon'], 'icon.png', { type: 'image/png' });
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Appearance'));
      });

      await waitFor(() => {
        const fileInput = screen.getAllByRole('button').find(btn =>
          btn.textContent.includes('Upload New Icon')
        ).querySelector('input');
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to upload image')).toBeInTheDocument();
      });
    });
  });

  describe('Permissions Settings', () => {
    it('displays post permissions section', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        expect(screen.getByText('Post Permissions')).toBeInTheDocument();
      });
    });

    it('displays create posts permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        expect(screen.getByText('Members can create posts')).toBeInTheDocument();
      });
    });

    it('toggles create posts permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Members can create posts');
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
      });
    });

    it('displays upload media permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        expect(screen.getByText('Members can upload images and media')).toBeInTheDocument();
      });
    });

    it('toggles upload media permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Members can upload images and media');
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
      });
    });

    it('displays create polls permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        expect(screen.getByText('Members can create polls')).toBeInTheDocument();
      });
    });

    it('toggles create polls permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Members can create polls');
        expect(checkbox).not.toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
      });
    });

    it('displays community permissions section', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        expect(screen.getByText('Community Permissions')).toBeInTheDocument();
      });
    });

    it('displays invite members permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        expect(screen.getByText('Members can invite others')).toBeInTheDocument();
      });
    });

    it('toggles invite members permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Members can invite others');
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
      });
    });

    it('displays create events permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        expect(screen.getByText('Members can create events')).toBeInTheDocument();
      });
    });

    it('toggles create events permission', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Members can create events');
        expect(checkbox).not.toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('Moderation Settings', () => {
    it('displays auto-moderate posts checkbox', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Auto-moderate new posts')).toBeInTheDocument();
      });
    });

    it('toggles auto-moderate posts', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Auto-moderate new posts');
        expect(checkbox).not.toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
      });
    });

    it('displays filter profanity checkbox', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Filter profanity')).toBeInTheDocument();
      });
    });

    it('toggles filter profanity', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Filter profanity');
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
      });
    });

    it('displays require email verification checkbox', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Require email verification for new members')).toBeInTheDocument();
      });
    });

    it('toggles require email verification', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Require email verification for new members');
        expect(checkbox).not.toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
      });
    });

    it('displays minimum account age input', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Minimum account age (days)')).toBeInTheDocument();
      });
    });

    it('updates minimum account age', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const input = screen.getByLabelText('Minimum account age (days)');
        fireEvent.change(input, { target: { value: '7' } });
        expect(input).toHaveValue(7);
      });
    });

    it('handles minimum account age with zero value', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const input = screen.getByLabelText('Minimum account age (days)');
        expect(input).toHaveValue(0);
      });
    });
  });

  describe('Save Changes', () => {
    it('does not show save button initially', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      });
    });

    it('shows save button after making changes', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Community' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });
    });

    it('saves changes when save button clicked', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Community' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(communityService.updateCommunity).toHaveBeenCalledWith('community-1', {
          displayName: 'Updated Community'
        });
      });
    });

    it('shows saving state while saving', async () => {
      communityService.updateCommunity.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, community: mockCommunity }), 100))
      );

      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Community' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('disables save button while saving', async () => {
      communityService.updateCommunity.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, community: mockCommunity }), 100))
      );

      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Community' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      const savingButton = screen.getByText('Saving...');
      expect(savingButton).toBeDisabled();
    });

    it('hides save button after successful save', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Community' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      });
    });

    it('shows error message on save failure', async () => {
      communityService.updateCommunity.mockResolvedValue({
        success: false,
        error: 'Failed to update community'
      });

      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Community' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to update community')).toBeInTheDocument();
      });
    });

    it('handles save exception', async () => {
      communityService.updateCommunity.mockRejectedValue(new Error('Network error'));

      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Community' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to save changes')).toBeInTheDocument();
      });
    });

    it('does not save when no changes made', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      });

      expect(communityService.updateCommunity).not.toHaveBeenCalled();
    });
  });

  describe('Header Actions', () => {
    it('displays close button', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button').filter(btn =>
          btn.querySelector('svg') && btn.classList.contains('close-btn')
        );
        expect(closeButtons.length).toBeGreaterThan(0);
      });
    });

    it('calls onClose when close button clicked', async () => {
      const onClose = jest.fn();
      render(<CommunitySettings {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button').filter(btn =>
          btn.classList.contains('close-btn')
        );
        fireEvent.click(closeButtons[0]);
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('displays community name in header', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const headerName = screen.getAllByText('Test Community');
        expect(headerName.length).toBeGreaterThan(0);
      });
    });

    it('displays settings title', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Community Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when present', async () => {
      communityService.updateCommunity.mockResolvedValue({
        success: false,
        error: 'Test error message'
      });

      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });
    });

    it('clears error on new save attempt', async () => {
      communityService.updateCommunity
        .mockResolvedValueOnce({ success: false, error: 'First error' })
        .mockResolvedValueOnce({ success: true, community: mockCommunity });

      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Again' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Updates', () => {
    it('tracks multiple field changes', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Community display name');
        const descInput = screen.getByPlaceholderText('Describe what your community is about...');

        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        fireEvent.change(descInput, { target: { value: 'New Description' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(communityService.updateCommunity).toHaveBeenCalledWith('community-1', {
          displayName: 'New Name',
          description: 'New Description'
        });
      });
    });

    it('handles nested permission changes', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Permissions'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Members can create posts');
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(communityService.updateCommunity).toHaveBeenCalledWith('community-1', {
          permissions: {
            createPosts: false
          }
        });
      });
    });

    it('handles nested moderation changes', async () => {
      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const checkbox = screen.getByLabelText('Auto-moderate new posts');
        fireEvent.click(checkbox);
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(communityService.updateCommunity).toHaveBeenCalledWith('community-1', {
          moderation: {
            autoModeratePosts: true
          }
        });
      });
    });

    it('updates community state after successful save', async () => {
      const updatedCommunity = { ...mockCommunity, displayName: 'Updated Name' };
      communityService.updateCommunity.mockResolvedValue({
        success: true,
        community: updatedCommunity
      });

      render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Community display name');
        fireEvent.change(input, { target: { value: 'Updated Name' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        const headerName = screen.getAllByText('Updated Name');
        expect(headerName.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Community Reload', () => {
    it('reloads community when communityId changes', async () => {
      const { rerender } = render(<CommunitySettings {...defaultProps} />);

      await waitFor(() => {
        expect(communityService.getCommunity).toHaveBeenCalledWith('community-1');
      });

      jest.clearAllMocks();

      rerender(<CommunitySettings {...defaultProps} communityId="community-2" />);

      await waitFor(() => {
        expect(communityService.getCommunity).toHaveBeenCalledWith('community-2');
      });
    });
  });
});

export default mockCommunity
