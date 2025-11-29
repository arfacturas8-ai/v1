import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportingSystem from './ReportingSystem';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Flag: (props) => <div data-testid="flag-icon" {...props} />,
  AlertTriangle: (props) => <div data-testid="alert-triangle-icon" {...props} />,
  Shield: (props) => <div data-testid="shield-icon" {...props} />,
  X: (props) => <div data-testid="x-icon" {...props} />,
  Check: (props) => <div data-testid="check-icon" {...props} />,
  Send: (props) => <div data-testid="send-icon" {...props} />,
  MessageSquare: (props) => <div data-testid="message-square-icon" {...props} />,
  User: (props) => <div data-testid="user-icon" {...props} />,
  Image: (props) => <div data-testid="image-icon" {...props} />,
  Link: (props) => <div data-testid="link-icon" {...props} />,
  FileText: (props) => <div data-testid="file-text-icon" {...props} />,
  AlertCircle: (props) => <div data-testid="alert-circle-icon" {...props} />,
  Info: (props) => <div data-testid="info-icon" {...props} />,
  ChevronDown: (props) => <div data-testid="chevron-down-icon" {...props} />,
  ChevronRight: (props) => <div data-testid="chevron-right-icon" {...props} />
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

describe('ReportingSystem', () => {
  let mockOnClose;
  let mockOnSubmit;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSubmit = jest.fn();
    jest.clearAllMocks();
    global.fetch.mockClear();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const defaultProps = {
    contentType: 'post',
    contentId: 'post-123',
    onClose: mockOnClose,
    onSubmit: mockOnSubmit
  };

  describe('Rendering and UI', () => {
    it('renders the component', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/report post/i)).toBeInTheDocument();
    });

    it('renders flag icon in header', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByTestId('flag-icon')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('renders report form', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/why are you reporting this\?/i)).toBeInTheDocument();
    });

    it('renders required field indicators', () => {
      render(<ReportingSystem {...defaultProps} />);
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('renders optional field indicators', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/\(optional\)/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/submit report/i)).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    });

    it('matches snapshot', () => {
      const { container } = render(<ReportingSystem {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Report Categories', () => {
    it('displays all report categories', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText('Spam')).toBeInTheDocument();
      expect(screen.getByText('Harassment or Bullying')).toBeInTheDocument();
      expect(screen.getByText('Inappropriate Content')).toBeInTheDocument();
      expect(screen.getByText('Misinformation')).toBeInTheDocument();
      expect(screen.getByText('Copyright Violation')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('displays category icons', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByTestId('message-square-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('displays category descriptions', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/unsolicited or repetitive content/i)).toBeInTheDocument();
      expect(screen.getByText(/targeted harassment or abusive behavior/i)).toBeInTheDocument();
      expect(screen.getByText(/content that violates community guidelines/i)).toBeInTheDocument();
    });

    it('shows chevron-right icon when category not expanded', () => {
      render(<ReportingSystem {...defaultProps} />);
      const chevronRightIcons = screen.getAllByTestId('chevron-right-icon');
      expect(chevronRightIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Category Selection', () => {
    it('selects spam category', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      expect(spamButton).toHaveClass('selected');
    });

    it('selects harassment category', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const harassmentButton = screen.getByText('Harassment or Bullying').closest('button');
      await user.click(harassmentButton);

      expect(harassmentButton).toHaveClass('selected');
    });

    it('selects inappropriate content category', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const inappropriateButton = screen.getByText('Inappropriate Content').closest('button');
      await user.click(inappropriateButton);

      expect(inappropriateButton).toHaveClass('selected');
    });

    it('selects misinformation category', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const misinfoButton = screen.getByText('Misinformation').closest('button');
      await user.click(misinfoButton);

      expect(misinfoButton).toHaveClass('selected');
    });

    it('selects copyright violation category', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const copyrightButton = screen.getByText('Copyright Violation').closest('button');
      await user.click(copyrightButton);

      expect(copyrightButton).toHaveClass('selected');
    });

    it('selects other category', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const otherButton = screen.getByText('Other').closest('button');
      await user.click(otherButton);

      expect(otherButton).toHaveClass('selected');
    });

    it('expands category to show reasons', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      expect(screen.getByText(/excessive promotional content/i)).toBeInTheDocument();
    });

    it('shows chevron-down icon when category expanded', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const chevronDownIcons = screen.getAllByTestId('chevron-down-icon');
      expect(chevronDownIcons.length).toBeGreaterThan(0);
    });

    it('collapses category when clicked again', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);
      expect(screen.getByText(/excessive promotional content/i)).toBeInTheDocument();

      await user.click(spamButton);
      expect(screen.queryByText(/excessive promotional content/i)).not.toBeInTheDocument();
    });

    it('switches between categories', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);
      expect(spamButton).toHaveClass('selected');

      const harassmentButton = screen.getByText('Harassment or Bullying').closest('button');
      await user.click(harassmentButton);
      expect(harassmentButton).toHaveClass('selected');
    });

    it('clears selected reason when changing category', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);
      expect(reasonButton).toHaveClass('selected');

      const harassmentButton = screen.getByText('Harassment or Bullying').closest('button');
      await user.click(harassmentButton);

      expect(reasonButton).not.toHaveClass('selected');
    });
  });

  describe('Reason Selection - Spam Category', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);
      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);
    });

    it('displays spam reasons', () => {
      expect(screen.getByText(/excessive promotional content/i)).toBeInTheDocument();
      expect(screen.getByText(/repetitive posts\/comments/i)).toBeInTheDocument();
      expect(screen.getByText(/bot activity/i)).toBeInTheDocument();
      expect(screen.getByText(/link farming/i)).toBeInTheDocument();
      expect(screen.getByText(/misleading clickbait/i)).toBeInTheDocument();
    });

    it('selects a spam reason', async () => {
      const user = userEvent.setup({ delay: null });
      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      expect(reasonButton).toHaveClass('selected');
    });

    it('shows check icon when reason is selected', async () => {
      const user = userEvent.setup({ delay: null });
      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const checkIcons = screen.getAllByTestId('check-icon');
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('switches between reasons', async () => {
      const user = userEvent.setup({ delay: null });

      const reason1 = screen.getByText(/excessive promotional content/i);
      await user.click(reason1);
      expect(reason1).toHaveClass('selected');

      const reason2 = screen.getByText(/bot activity/i);
      await user.click(reason2);
      expect(reason2).toHaveClass('selected');
      expect(reason1).not.toHaveClass('selected');
    });
  });

  describe('Reason Selection - Harassment Category', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);
      const harassmentButton = screen.getByText('Harassment or Bullying').closest('button');
      await user.click(harassmentButton);
    });

    it('displays harassment reasons', () => {
      expect(screen.getByText(/personal attacks/i)).toBeInTheDocument();
      expect(screen.getByText(/threatening behavior/i)).toBeInTheDocument();
      expect(screen.getByText(/doxxing or sharing personal info/i)).toBeInTheDocument();
      expect(screen.getByText(/targeted harassment/i)).toBeInTheDocument();
      expect(screen.getByText(/hate speech/i)).toBeInTheDocument();
    });
  });

  describe('Reason Selection - Inappropriate Content Category', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);
      const inappropriateButton = screen.getByText('Inappropriate Content').closest('button');
      await user.click(inappropriateButton);
    });

    it('displays inappropriate content reasons', () => {
      expect(screen.getByText(/nsfw content without marking/i)).toBeInTheDocument();
      expect(screen.getByText(/graphic violence/i)).toBeInTheDocument();
      expect(screen.getByText(/sexually explicit material/i)).toBeInTheDocument();
      expect(screen.getByText(/illegal content/i)).toBeInTheDocument();
      expect(screen.getByText(/drug-related content/i)).toBeInTheDocument();
    });
  });

  describe('Reason Selection - Misinformation Category', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);
      const misinfoButton = screen.getByText('Misinformation').closest('button');
      await user.click(misinfoButton);
    });

    it('displays misinformation reasons', () => {
      expect(screen.getByText(/false claims/i)).toBeInTheDocument();
      expect(screen.getByText(/manipulated media/i)).toBeInTheDocument();
      expect(screen.getByText(/impersonation/i)).toBeInTheDocument();
      expect(screen.getByText(/scams or fraud/i)).toBeInTheDocument();
      expect(screen.getByText(/misleading financial advice/i)).toBeInTheDocument();
    });
  });

  describe('Reason Selection - Copyright Category', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);
      const copyrightButton = screen.getByText('Copyright Violation').closest('button');
      await user.click(copyrightButton);
    });

    it('displays copyright reasons', () => {
      expect(screen.getByText(/stolen content/i)).toBeInTheDocument();
      expect(screen.getByText(/unauthorized repost/i)).toBeInTheDocument();
      expect(screen.getByText(/copyright infringement/i)).toBeInTheDocument();
      expect(screen.getByText(/trademark violation/i)).toBeInTheDocument();
      expect(screen.getByText(/plagiarism/i)).toBeInTheDocument();
    });
  });

  describe('Reason Selection - Other Category', () => {
    beforeEach(async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);
      const otherButton = screen.getByText('Other').closest('button');
      await user.click(otherButton);
    });

    it('displays other reasons', () => {
      expect(screen.getByText(/breaks community rules/i)).toBeInTheDocument();
      expect(screen.getByText(/off-topic content/i)).toBeInTheDocument();
      expect(screen.getByText(/low quality content/i)).toBeInTheDocument();
      expect(screen.getByText(/other violation/i)).toBeInTheDocument();
    });
  });

  describe('Additional Details Field', () => {
    it('renders details textarea', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByPlaceholderText(/provide any additional context/i)).toBeInTheDocument();
    });

    it('allows typing in details field', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/provide any additional context/i);
      await user.type(textarea, 'Additional details here');

      expect(textarea).toHaveValue('Additional details here');
    });

    it('displays character count', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText('0/500')).toBeInTheDocument();
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/provide any additional context/i);
      await user.type(textarea, 'Test');

      expect(screen.getByText('4/500')).toBeInTheDocument();
    });

    it('enforces max length of 500 characters', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/provide any additional context/i);
      expect(textarea).toHaveAttribute('maxLength', '500');
    });

    it('allows clearing details', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/provide any additional context/i);
      await user.type(textarea, 'Test');
      await user.clear(textarea);

      expect(textarea).toHaveValue('');
    });
  });

  describe('File Attachments', () => {
    it('renders attachment section', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/attachments/i)).toBeInTheDocument();
      expect(screen.getByText(/\(optional, max 3\)/i)).toBeInTheDocument();
    });

    it('renders file upload button', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/add screenshot or evidence/i)).toBeInTheDocument();
    });

    it('renders link icon for upload', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByTestId('link-icon')).toBeInTheDocument();
    });

    it('handles file upload', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, file);

      expect(screen.getByText('test.png')).toBeInTheDocument();
    });

    it('displays attachment with file icon', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, file);

      expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
    });

    it('displays remove button for attachment', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, file);

      const removeButtons = screen.getAllByTestId('x-icon');
      expect(removeButtons.length).toBeGreaterThan(1); // One for close, one for attachment
    });

    it('removes attachment when remove button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, file);
      expect(screen.getByText('test.png')).toBeInTheDocument();

      const removeButton = screen.getByText('test.png').parentElement.querySelector('button');
      await user.click(removeButton);

      expect(screen.queryByText('test.png')).not.toBeInTheDocument();
    });

    it('allows uploading multiple files', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const file1 = new File(['test1'], 'test1.png', { type: 'image/png' });
      const file2 = new File(['test2'], 'test2.png', { type: 'image/png' });
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, [file1, file2]);

      expect(screen.getByText('test1.png')).toBeInTheDocument();
      expect(screen.getByText('test2.png')).toBeInTheDocument();
    });

    it('limits attachments to 3 files', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
        new File(['test3'], 'test3.png', { type: 'image/png' }),
        new File(['test4'], 'test4.png', { type: 'image/png' })
      ];
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, files);

      expect(screen.getByText('test1.png')).toBeInTheDocument();
      expect(screen.getByText('test2.png')).toBeInTheDocument();
      expect(screen.getByText('test3.png')).toBeInTheDocument();
      expect(screen.queryByText('test4.png')).not.toBeInTheDocument();
    });

    it('hides upload button when 3 files attached', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
        new File(['test3'], 'test3.png', { type: 'image/png' })
      ];
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, files);

      expect(screen.queryByText(/add screenshot or evidence/i)).not.toBeInTheDocument();
    });

    it('shows upload button again after removing attachment', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
        new File(['test3'], 'test3.png', { type: 'image/png' })
      ];
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, files);
      expect(screen.queryByText(/add screenshot or evidence/i)).not.toBeInTheDocument();

      const removeButton = screen.getByText('test1.png').parentElement.querySelector('button');
      await user.click(removeButton);

      expect(screen.getByText(/add screenshot or evidence/i)).toBeInTheDocument();
    });

    it('accepts image files', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;
      expect(input).toHaveAttribute('accept', 'image/*,.pdf,.txt');
    });
  });

  describe('Content Preview', () => {
    it('does not show preview when contentData is null', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.queryByText(/reporting:/i)).not.toBeInTheDocument();
    });

    it('displays content preview when contentData provided', () => {
      const contentData = {
        author: 'testuser',
        text: 'This is test content'
      };
      render(<ReportingSystem {...defaultProps} contentData={contentData} />);
      expect(screen.getByText(/reporting:/i)).toBeInTheDocument();
    });

    it('displays author in preview', () => {
      const contentData = {
        author: 'testuser',
        text: 'This is test content'
      };
      render(<ReportingSystem {...defaultProps} contentData={contentData} />);
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('displays text in preview', () => {
      const contentData = {
        author: 'testuser',
        text: 'This is test content'
      };
      render(<ReportingSystem {...defaultProps} contentData={contentData} />);
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('truncates long text in preview', () => {
      const longText = 'a'.repeat(250);
      const contentData = {
        author: 'testuser',
        text: longText
      };
      render(<ReportingSystem {...defaultProps} contentData={contentData} />);
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    });

    it('displays image indicator in preview', () => {
      const contentData = {
        author: 'testuser',
        text: 'Test',
        image: 'test.jpg'
      };
      render(<ReportingSystem {...defaultProps} contentData={contentData} />);
      expect(screen.getByText(/contains image/i)).toBeInTheDocument();
    });

    it('renders user icon in preview', () => {
      const contentData = {
        author: 'testuser',
        text: 'Test'
      };
      render(<ReportingSystem {...defaultProps} contentData={contentData} />);
      const userIcons = screen.getAllByTestId('user-icon');
      expect(userIcons.length).toBeGreaterThan(0);
    });

    it('renders image icon when image present', () => {
      const contentData = {
        author: 'testuser',
        text: 'Test',
        image: 'test.jpg'
      };
      render(<ReportingSystem {...defaultProps} contentData={contentData} />);
      const imageIcons = screen.getAllByTestId('image-icon');
      expect(imageIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Report Notice', () => {
    it('displays warning notice', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/false reports may result in action/i)).toBeInTheDocument();
    });

    it('displays info icon with notice', () => {
      render(<ReportingSystem {...defaultProps} />);
      const infoIcons = screen.getAllByTestId('info-icon');
      expect(infoIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Form Validation', () => {
    it('submit button is disabled when no category selected', () => {
      render(<ReportingSystem {...defaultProps} />);
      const submitButton = screen.getByText(/submit report/i);
      expect(submitButton).toBeDisabled();
    });

    it('submit button is disabled when category selected but no reason', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const submitButton = screen.getByText(/submit report/i);
      expect(submitButton).toBeDisabled();
    });

    it('submit button is enabled when category and reason selected', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      expect(submitButton).not.toBeDisabled();
    });

    it('shows alert when submitting without category', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const form = screen.getByText(/why are you reporting this\?/i).closest('form');
      fireEvent.submit(form);

      expect(window.alert).toHaveBeenCalledWith('Please select a category and reason for your report');
    });

    it('shows alert when submitting without reason', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const form = screen.getByText(/why are you reporting this\?/i).closest('form');
      fireEvent.submit(form);

      expect(window.alert).toHaveBeenCalledWith('Please select a category and reason for your report');
    });
  });

  describe('Submit Functionality', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
    });

    it('submits report with category and reason', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    it('includes contentType in submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      const callArgs = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callArgs.contentType).toBe('post');
    });

    it('includes contentId in submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      const callArgs = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callArgs.contentId).toBe('post-123');
    });

    it('includes category in submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      const callArgs = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callArgs.category).toBe('spam');
    });

    it('includes reason in submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      const callArgs = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callArgs.reason).toBe('Excessive promotional content');
    });

    it('includes additional details in submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const textarea = screen.getByPlaceholderText(/provide any additional context/i);
      await user.type(textarea, 'Additional details');

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      const callArgs = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callArgs.details).toBe('Additional details');
    });

    it('includes timestamp in submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      const callArgs = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callArgs.timestamp).toBeDefined();
    });

    it('shows submitting state', async () => {
      const user = userEvent.setup({ delay: null });
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      expect(screen.getByText(/submitting\.\.\./i)).toBeInTheDocument();
    });

    it('disables submit button while submitting', async () => {
      const user = userEvent.setup({ delay: null });
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('disables cancel button while submitting', async () => {
      const user = userEvent.setup({ delay: null });
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      const cancelButton = screen.getByText(/cancel/i);
      expect(cancelButton).toBeDisabled();
    });

    it('calls onSubmit callback on success', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
    });

    it('shows success message after submission', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/report submitted/i)).toBeInTheDocument();
      });
    });

    it('shows thank you message', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/thank you for helping keep our community safe/i)).toBeInTheDocument();
      });
    });

    it('shows moderation review message', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/our moderation team will review/i)).toBeInTheDocument();
      });
    });

    it('displays check icon on success', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        const checkIcons = screen.getAllByTestId('check-icon');
        expect(checkIcons.length).toBeGreaterThan(0);
      });
    });

    it('auto-closes after 3 seconds', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/report submitted/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('matches success snapshot', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/report submitted/i)).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });

  describe('Error Handling', () => {
    it('shows error alert on submission failure', async () => {
      const user = userEvent.setup({ delay: null });
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to submit report. Please try again.');
      });
    });

    it('shows error alert on network error', async () => {
      const user = userEvent.setup({ delay: null });
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('An error occurred. Please try again.');
      });
    });

    it('logs error to console on failure', async () => {
      const user = userEvent.setup({ delay: null });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error submitting report:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('re-enables submit button after error', async () => {
      const user = userEvent.setup({ delay: null });
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when cancel button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Content Type Variations', () => {
    it('displays correct header for post', () => {
      render(<ReportingSystem {...defaultProps} contentType="post" />);
      expect(screen.getByText(/report post/i)).toBeInTheDocument();
    });

    it('displays correct header for comment', () => {
      render(<ReportingSystem {...defaultProps} contentType="comment" />);
      expect(screen.getByText(/report comment/i)).toBeInTheDocument();
    });

    it('displays correct header for user', () => {
      render(<ReportingSystem {...defaultProps} contentType="user" />);
      expect(screen.getByText(/report user/i)).toBeInTheDocument();
    });

    it('displays correct header for message', () => {
      render(<ReportingSystem {...defaultProps} contentType="message" />);
      expect(screen.getByText(/report message/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long text input', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const longText = 'a'.repeat(500);
      const textarea = screen.getByPlaceholderText(/provide any additional context/i);
      await user.type(textarea, longText);

      expect(textarea.value.length).toBe(500);
    });

    it('handles empty form submission attempt', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const submitButton = screen.getByText(/submit report/i);

      // Should be disabled
      expect(submitButton).toBeDisabled();
    });

    it('handles rapid category switching', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      const harassmentButton = screen.getByText('Harassment or Bullying').closest('button');

      await user.click(spamButton);
      await user.click(harassmentButton);
      await user.click(spamButton);
      await user.click(harassmentButton);

      expect(harassmentButton).toHaveClass('selected');
    });

    it('handles missing onClose callback', () => {
      const props = { ...defaultProps, onClose: undefined };
      render(<ReportingSystem {...props} />);

      expect(screen.getByText(/report post/i)).toBeInTheDocument();
    });

    it('handles missing onSubmit callback', async () => {
      const user = userEvent.setup({ delay: null });
      global.fetch.mockResolvedValue({ ok: true });

      const props = { ...defaultProps, onSubmit: undefined };
      render(<ReportingSystem {...props} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const submitButton = screen.getByText(/submit report/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/report submitted/i)).toBeInTheDocument();
      });
    });

    it('handles special characters in details', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/provide any additional context/i);
      await user.type(textarea, '!@#$%^&*()_+{}[]|\\:";\'<>?,./');

      expect(textarea).toHaveValue('!@#$%^&*()_+{}[]|\\:";\'<>?,./');
    });

    it('handles file with long name', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const longFileName = 'a'.repeat(100) + '.png';
      const file = new File(['test'], longFileName, { type: 'image/png' });
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, file);

      expect(screen.getByText(longFileName)).toBeInTheDocument();
    });

    it('handles multiple file types', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ReportingSystem {...defaultProps} />);

      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.pdf', { type: 'application/pdf' }),
        new File(['test3'], 'test3.txt', { type: 'text/plain' })
      ];
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;

      await user.upload(input, files);

      expect(screen.getByText('test1.png')).toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
      expect(screen.getByText('test3.txt')).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = render(<ReportingSystem {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with content preview', () => {
      const contentData = {
        author: 'testuser',
        text: 'This is test content',
        image: 'test.jpg'
      };
      const { container } = render(<ReportingSystem {...defaultProps} contentData={contentData} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with selected category', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with selected reason', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with attachments', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<ReportingSystem {...defaultProps} />);

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = screen.getByText(/add screenshot or evidence/i).previousSibling;
      await user.upload(input, file);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with filled form', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<ReportingSystem {...defaultProps} />);

      const spamButton = screen.getByText('Spam').closest('button');
      await user.click(spamButton);

      const reasonButton = screen.getByText(/excessive promotional content/i);
      await user.click(reasonButton);

      const textarea = screen.getByPlaceholderText(/provide any additional context/i);
      await user.type(textarea, 'Additional details');

      expect(container).toMatchSnapshot();
    });
  });
});

export default localStorageMock
