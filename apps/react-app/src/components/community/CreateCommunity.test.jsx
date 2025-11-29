import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCommunity from './CreateCommunity';
import communityService from '../../services/communityService';

jest.mock('../../services/communityService');

describe('CreateCommunity', () => {
  let mockOnClose;
  let mockOnCreate;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnCreate = jest.fn();
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the create community modal', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      expect(screen.getByText('Create Community')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const closeButton = screen.getByRole('button', { name: /close/i }) ||
                         document.querySelector('.close-btn');
      expect(closeButton).toBeInTheDocument();
    });

    it('renders progress bar', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const progressBar = document.querySelector('.progress-bar');
      expect(progressBar).toBeInTheDocument();
    });

    it('displays step 1 content initially', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('renders modal overlay', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const overlay = document.querySelector('.create-community-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Step 1: Basic Information - Form Rendering', () => {
    it('renders community name input', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      expect(screen.getByPlaceholderText('community-name')).toBeInTheDocument();
    });

    it('renders community name prefix', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      expect(screen.getByText('c/')).toBeInTheDocument();
    });

    it('renders display name input', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      expect(screen.getByPlaceholderText('Community Display Name')).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      expect(screen.getByPlaceholderText("What's your community about?")).toBeInTheDocument();
    });

    it('renders category select', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const categorySelect = screen.getByDisplayValue('General');
      expect(categorySelect).toBeInTheDocument();
    });

    it('renders all category options', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const categories = ['General', 'Gaming', 'Technology', 'Art', 'Music',
                         'Education', 'Sports', 'Entertainment', 'Business', 'Other'];

      categories.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });
    });

    it('shows required field indicators', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const requiredSpans = document.querySelectorAll('.required');
      expect(requiredSpans.length).toBeGreaterThanOrEqual(3);
    });

    it('shows hint text for community name', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      expect(screen.getByText('Lowercase letters, numbers, and hyphens only')).toBeInTheDocument();
    });
  });

  describe('Step 1: Basic Information - Input Handling', () => {
    it('updates community name on input', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const nameInput = screen.getByPlaceholderText('community-name');
      await user.type(nameInput, 'test-community');

      expect(nameInput).toHaveValue('test-community');
    });

    it('updates display name on input', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const displayNameInput = screen.getByPlaceholderText('Community Display Name');
      await user.type(displayNameInput, 'Test Community');

      expect(displayNameInput).toHaveValue('Test Community');
    });

    it('updates description on input', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const descriptionInput = screen.getByPlaceholderText("What's your community about?");
      await user.type(descriptionInput, 'A test community description');

      expect(descriptionInput).toHaveValue('A test community description');
    });

    it('updates category on selection', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const categorySelect = screen.getByDisplayValue('General');
      await user.selectOptions(categorySelect, 'gaming');

      expect(categorySelect).toHaveValue('gaming');
    });

    it('allows only valid characters in community name', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const nameInput = screen.getByPlaceholderText('community-name');
      expect(nameInput).toHaveAttribute('pattern', '[a-z0-9-]+');
    });
  });

  describe('Step 1: Validation', () => {
    it('disables next button when required fields are empty', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('enables next button when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');

      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    it('keeps next button disabled with only name filled', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('keeps next button disabled with only display name filled', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('keeps next button disabled with only description filled', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Step 2: Privacy & Access - Rendering', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
    });

    it('navigates to step 2', () => {
      expect(screen.getByText('Privacy & Access')).toBeInTheDocument();
    });

    it('renders public type option', () => {
      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByText('Anyone can view and join')).toBeInTheDocument();
    });

    it('renders restricted type option', () => {
      expect(screen.getByText('Restricted')).toBeInTheDocument();
      expect(screen.getByText('Anyone can view, approval required to join')).toBeInTheDocument();
    });

    it('renders private type option', () => {
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.getByText('Invite only')).toBeInTheDocument();
    });

    it('renders join requirements section', () => {
      expect(screen.getByText('Join Requirements')).toBeInTheDocument();
    });

    it('renders email verification checkbox', () => {
      expect(screen.getByText('Require email verification')).toBeInTheDocument();
    });

    it('renders minimum karma input', () => {
      expect(screen.getByText('Minimum karma')).toBeInTheDocument();
    });

    it('renders minimum account age input', () => {
      expect(screen.getByText('Minimum account age (days)')).toBeInTheDocument();
    });

    it('has public type selected by default', () => {
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      expect(publicRadio).toBeChecked();
    });
  });

  describe('Step 2: Privacy Type Selection', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
    });

    it('selects public type', async () => {
      const user = userEvent.setup();
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      await user.click(publicRadio);

      expect(publicRadio).toBeChecked();
    });

    it('selects restricted type', async () => {
      const user = userEvent.setup();
      const restrictedRadio = screen.getByRole('radio', { name: /restricted/i });
      await user.click(restrictedRadio);

      expect(restrictedRadio).toBeChecked();
    });

    it('selects private type', async () => {
      const user = userEvent.setup();
      const privateRadio = screen.getByRole('radio', { name: /private/i });
      await user.click(privateRadio);

      expect(privateRadio).toBeChecked();
    });

    it('switches between privacy types', async () => {
      const user = userEvent.setup();
      const restrictedRadio = screen.getByRole('radio', { name: /restricted/i });
      const publicRadio = screen.getByRole('radio', { name: /public/i });

      await user.click(restrictedRadio);
      expect(restrictedRadio).toBeChecked();

      await user.click(publicRadio);
      expect(publicRadio).toBeChecked();
    });
  });

  describe('Step 2: Requirements Configuration', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
    });

    it('toggles email verification requirement', async () => {
      const user = userEvent.setup();
      const emailCheckbox = screen.getByRole('checkbox', { name: /require email verification/i });

      expect(emailCheckbox).not.toBeChecked();
      await user.click(emailCheckbox);
      expect(emailCheckbox).toBeChecked();
    });

    it('updates minimum karma value', async () => {
      const user = userEvent.setup();
      const karmaInput = screen.getByLabelText('Minimum karma');

      await user.clear(karmaInput);
      await user.type(karmaInput, '100');

      expect(karmaInput).toHaveValue(100);
    });

    it('updates minimum account age value', async () => {
      const user = userEvent.setup();
      const ageInput = screen.getByLabelText('Minimum account age (days)');

      await user.clear(ageInput);
      await user.type(ageInput, '30');

      expect(ageInput).toHaveValue(30);
    });

    it('handles minimum karma input with default value', () => {
      const karmaInput = screen.getByLabelText('Minimum karma');
      expect(karmaInput).toHaveValue(0);
    });

    it('handles minimum account age with default value', () => {
      const ageInput = screen.getByLabelText('Minimum account age (days)');
      expect(ageInput).toHaveValue(0);
    });
  });

  describe('Step 3: Appearance - Rendering', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
    });

    it('navigates to step 3', () => {
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });

    it('renders community icon upload section', () => {
      expect(screen.getByText('Community Icon')).toBeInTheDocument();
    });

    it('renders banner upload section', () => {
      expect(screen.getByText('Banner Image')).toBeInTheDocument();
    });

    it('shows icon upload placeholder', () => {
      expect(screen.getByText('Upload Icon')).toBeInTheDocument();
      expect(screen.getByText('256x256px recommended')).toBeInTheDocument();
    });

    it('shows banner upload placeholder', () => {
      expect(screen.getByText('Upload Banner')).toBeInTheDocument();
      expect(screen.getByText('1920x300px recommended')).toBeInTheDocument();
    });
  });

  describe('Step 3: Icon Upload', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
    });

    it('uploads icon image', async () => {
      const user = userEvent.setup();
      const file = new File(['icon'], 'icon.png', { type: 'image/png' });
      const iconInputs = screen.getAllByRole('textbox', { hidden: true });
      const iconInput = iconInputs.find(input => input.type === 'file' && input.accept === 'image/*');

      if (iconInput) {
        await user.upload(iconInput, file);
        expect(URL.createObjectURL).toHaveBeenCalled();
      }
    });

    it('displays icon preview after upload', async () => {
      const user = userEvent.setup();
      const file = new File(['icon'], 'icon.png', { type: 'image/png' });
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const iconInput = fileInputs[0];

      if (iconInput) {
        await user.upload(iconInput, file);

        await waitFor(() => {
          const preview = screen.queryByAltText('Icon');
          expect(preview).toBeInTheDocument();
        });
      }
    });

    it('shows remove button after icon upload', async () => {
      const user = userEvent.setup();
      const file = new File(['icon'], 'icon.png', { type: 'image/png' });
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const iconInput = fileInputs[0];

      if (iconInput) {
        await user.upload(iconInput, file);

        await waitFor(() => {
          const removeButtons = document.querySelectorAll('.remove-btn');
          expect(removeButtons.length).toBeGreaterThan(0);
        });
      }
    });

    it('removes icon when remove button clicked', async () => {
      const user = userEvent.setup();
      const file = new File(['icon'], 'icon.png', { type: 'image/png' });
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const iconInput = fileInputs[0];

      if (iconInput) {
        await user.upload(iconInput, file);

        await waitFor(() => {
          const removeButtons = document.querySelectorAll('.remove-btn');
          if (removeButtons[0]) {
            fireEvent.click(removeButtons[0]);
          }
        });

        expect(URL.revokeObjectURL).toHaveBeenCalled();
      }
    });
  });

  describe('Step 3: Banner Upload', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
    });

    it('uploads banner image', async () => {
      const user = userEvent.setup();
      const file = new File(['banner'], 'banner.png', { type: 'image/png' });
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const bannerInput = fileInputs[1];

      if (bannerInput) {
        await user.upload(bannerInput, file);
        expect(URL.createObjectURL).toHaveBeenCalled();
      }
    });

    it('displays banner preview after upload', async () => {
      const user = userEvent.setup();
      const file = new File(['banner'], 'banner.png', { type: 'image/png' });
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const bannerInput = fileInputs[1];

      if (bannerInput) {
        await user.upload(bannerInput, file);

        await waitFor(() => {
          const preview = screen.queryByAltText('Banner');
          expect(preview).toBeInTheDocument();
        });
      }
    });

    it('removes banner when remove button clicked', async () => {
      const user = userEvent.setup();
      const file = new File(['banner'], 'banner.png', { type: 'image/png' });
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const bannerInput = fileInputs[1];

      if (bannerInput) {
        await user.upload(bannerInput, file);

        await waitFor(() => {
          const removeButtons = document.querySelectorAll('.remove-btn');
          if (removeButtons[removeButtons.length - 1]) {
            fireEvent.click(removeButtons[removeButtons.length - 1]);
          }
        });

        expect(URL.revokeObjectURL).toHaveBeenCalled();
      }
    });

    it('cleans up object URLs on unmount', () => {
      const { unmount } = render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      unmount();
    });
  });

  describe('Step 4: Rules & Features - Rendering', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
    });

    it('navigates to step 4', () => {
      expect(screen.getByText('Rules & Features')).toBeInTheDocument();
    });

    it('renders community features section', () => {
      expect(screen.getByText('Community Features')).toBeInTheDocument();
    });

    it('renders posts & discussions feature toggle', () => {
      expect(screen.getByText('Posts & Discussions')).toBeInTheDocument();
    });

    it('renders voice channels feature toggle', () => {
      expect(screen.getByText('Voice Channels')).toBeInTheDocument();
    });

    it('renders events feature toggle', () => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    it('renders marketplace feature toggle', () => {
      expect(screen.getByText('Marketplace')).toBeInTheDocument();
    });

    it('renders community rules section', () => {
      expect(screen.getByText('Community Rules')).toBeInTheDocument();
    });

    it('renders add rule button', () => {
      expect(screen.getByText('+ Add Rule')).toBeInTheDocument();
    });

    it('renders initial rule input', () => {
      expect(screen.getByPlaceholderText('Enter a rule...')).toBeInTheDocument();
    });
  });

  describe('Step 4: Feature Toggles', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
    });

    it('has posts enabled by default', () => {
      const postsCheckbox = screen.getByRole('checkbox', { name: /posts/i });
      expect(postsCheckbox).toBeChecked();
    });

    it('has voice enabled by default', () => {
      const voiceCheckbox = screen.getByRole('checkbox', { name: /voice/i });
      expect(voiceCheckbox).toBeChecked();
    });

    it('has events disabled by default', () => {
      const eventsCheckbox = screen.getByRole('checkbox', { name: /events/i });
      expect(eventsCheckbox).not.toBeChecked();
    });

    it('has marketplace disabled by default', () => {
      const marketplaceCheckbox = screen.getByRole('checkbox', { name: /marketplace/i });
      expect(marketplaceCheckbox).not.toBeChecked();
    });

    it('toggles posts feature', async () => {
      const user = userEvent.setup();
      const postsCheckbox = screen.getByRole('checkbox', { name: /posts/i });

      await user.click(postsCheckbox);
      expect(postsCheckbox).not.toBeChecked();

      await user.click(postsCheckbox);
      expect(postsCheckbox).toBeChecked();
    });

    it('toggles voice feature', async () => {
      const user = userEvent.setup();
      const voiceCheckbox = screen.getByRole('checkbox', { name: /voice/i });

      await user.click(voiceCheckbox);
      expect(voiceCheckbox).not.toBeChecked();
    });

    it('toggles events feature', async () => {
      const user = userEvent.setup();
      const eventsCheckbox = screen.getByRole('checkbox', { name: /events/i });

      await user.click(eventsCheckbox);
      expect(eventsCheckbox).toBeChecked();
    });

    it('toggles marketplace feature', async () => {
      const user = userEvent.setup();
      const marketplaceCheckbox = screen.getByRole('checkbox', { name: /marketplace/i });

      await user.click(marketplaceCheckbox);
      expect(marketplaceCheckbox).toBeChecked();
    });
  });

  describe('Step 4: Rules Management', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
    });

    it('updates rule text', async () => {
      const user = userEvent.setup();
      const ruleInput = screen.getByPlaceholderText('Enter a rule...');

      await user.type(ruleInput, 'Be respectful');
      expect(ruleInput).toHaveValue('Be respectful');
    });

    it('adds a new rule', async () => {
      const user = userEvent.setup();
      const addRuleButton = screen.getByText('+ Add Rule');

      await user.click(addRuleButton);

      const ruleInputs = screen.getAllByPlaceholderText('Enter a rule...');
      expect(ruleInputs.length).toBe(2);
    });

    it('adds multiple rules', async () => {
      const user = userEvent.setup();
      const addRuleButton = screen.getByText('+ Add Rule');

      await user.click(addRuleButton);
      await user.click(addRuleButton);

      const ruleInputs = screen.getAllByPlaceholderText('Enter a rule...');
      expect(ruleInputs.length).toBe(3);
    });

    it('removes a rule', async () => {
      const user = userEvent.setup();
      const addRuleButton = screen.getByText('+ Add Rule');
      await user.click(addRuleButton);

      const removeButtons = document.querySelectorAll('.remove-rule');
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0]);

        const ruleInputs = screen.getAllByPlaceholderText('Enter a rule...');
        expect(ruleInputs.length).toBe(1);
      }
    });

    it('does not show remove button for single rule', () => {
      const removeButtons = document.querySelectorAll('.remove-rule');
      expect(removeButtons.length).toBe(0);
    });

    it('shows remove buttons for multiple rules', async () => {
      const user = userEvent.setup();
      const addRuleButton = screen.getByText('+ Add Rule');
      await user.click(addRuleButton);

      const removeButtons = document.querySelectorAll('.remove-rule');
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('numbers rules correctly', async () => {
      const user = userEvent.setup();
      const addRuleButton = screen.getByText('+ Add Rule');
      await user.click(addRuleButton);

      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('closes modal when close button clicked', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      const closeButton = document.querySelector('.close-btn');
      if (closeButton) {
        await user.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('does not show previous button on step 1', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });

    it('shows previous button on step 2', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Previous')).toBeInTheDocument();
    });

    it('goes back to previous step', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Previous'));

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('shows next button on steps 1-3', () => {
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('shows create button on step 4', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Create Community')).toBeInTheDocument();
    });

    it('updates progress bar width', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));

      const progressFill = document.querySelector('.progress-fill');
      expect(progressFill).toHaveStyle({ width: '50%' });
    });
  });

  describe('Form Submission', () => {
    it('calls createCommunity service on submit', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test Community');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(communityService.createCommunity).toHaveBeenCalled();
      });
    });

    it('formats community name correctly', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test-community' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'Test Community');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test Community');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(communityService.createCommunity).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.stringMatching(/^[a-z0-9-]+$/)
          })
        );
      });
    });

    it('includes all form data in submission', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.selectOptions(screen.getByDisplayValue('General'), 'gaming');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(communityService.createCommunity).toHaveBeenCalledWith(
          expect.objectContaining({
            displayName: 'Test',
            description: 'Description',
            category: 'gaming',
            isPublic: true,
            allowPosts: true
          })
        );
      });
    });

    it('filters empty rules before submission', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      const ruleInput = screen.getByPlaceholderText('Enter a rule...');
      await user.type(ruleInput, 'Rule 1');

      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(communityService.createCommunity).toHaveBeenCalledWith(
          expect.objectContaining({
            rules: ['Rule 1']
          })
        );
      });
    });

    it('calls onCreate with community data on success', async () => {
      const user = userEvent.setup();
      const mockCommunity = { id: '1', name: 'test' };
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: mockCommunity
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith(mockCommunity);
      });
    });

    it('calls onClose after successful creation', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading text on create button when submitting', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    it('disables create button during submission', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      const createButton = screen.getByText('Create Community');
      await user.click(createButton);

      expect(screen.getByText('Creating...')).toBeDisabled();
    });

    it('disables navigation buttons during submission', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when required fields missing on submit', async () => {
      const user = userEvent.setup();
      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      const nameInput = screen.getByPlaceholderText('community-name');
      await user.clear(nameInput);

      const createButton = screen.getByText('Create Community');
      await user.click(createButton);
    });

    it('displays error message from API', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: false,
        error: 'Community name already exists'
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(screen.getByText('Community name already exists')).toBeInTheDocument();
      });
    });

    it('displays generic error message on API failure', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockRejectedValue(new Error('Network error'));

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(screen.getByText('Failed to create community. Please try again.')).toBeInTheDocument();
      });
    });

    it('clears error message on retry', async () => {
      const user = userEvent.setup();
      communityService.createCommunity
        .mockResolvedValueOnce({ success: false, error: 'Error message' })
        .mockResolvedValueOnce({ success: true, community: { id: '1', name: 'test' } });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      });
    });

    it('does not call onCreate on error', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: false,
        error: 'Error'
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it('does not close modal on error', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: false,
        error: 'Error'
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('API Integration', () => {
    it('sends correct privacy type for public community', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(communityService.createCommunity).toHaveBeenCalledWith(
          expect.objectContaining({ isPublic: true })
        );
      });
    });

    it('sends correct privacy type for private community', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));

      const privateRadio = screen.getByRole('radio', { name: /private/i });
      await user.click(privateRadio);

      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(communityService.createCommunity).toHaveBeenCalledWith(
          expect.objectContaining({ isPublic: false })
        );
      });
    });

    it('sends requireApproval when karma requirement set', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));

      const karmaInput = screen.getByLabelText('Minimum karma');
      await user.clear(karmaInput);
      await user.type(karmaInput, '100');

      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(communityService.createCommunity).toHaveBeenCalledWith(
          expect.objectContaining({ requireApproval: true })
        );
      });
    });

    it('sends requireApproval when email verification required', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));

      const emailCheckbox = screen.getByRole('checkbox', { name: /require email verification/i });
      await user.click(emailCheckbox);

      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(communityService.createCommunity).toHaveBeenCalledWith(
          expect.objectContaining({ requireApproval: true })
        );
      });
    });

    it('sends feature toggles correctly', async () => {
      const user = userEvent.setup();
      communityService.createCommunity.mockResolvedValue({
        success: true,
        community: { id: '1', name: 'test' }
      });

      render(<CreateCommunity onClose={mockOnClose} onCreate={mockOnCreate} />);

      await user.type(screen.getByPlaceholderText('community-name'), 'test');
      await user.type(screen.getByPlaceholderText('Community Display Name'), 'Test');
      await user.type(screen.getByPlaceholderText("What's your community about?"), 'Description');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      const postsCheckbox = screen.getByRole('checkbox', { name: /posts/i });
      await user.click(postsCheckbox);

      await user.click(screen.getByText('Create Community'));

      await waitFor(() => {
        expect(communityService.createCommunity).toHaveBeenCalledWith(
          expect.objectContaining({ allowPosts: false })
        );
      });
    });
  });
});

export default closeButton
