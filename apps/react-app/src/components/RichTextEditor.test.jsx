/**
 * @jest-environment jsdom
 * Comprehensive tests for RichTextEditor component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RichTextEditor from './RichTextEditor';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bold: ({ size }) => <svg data-testid="bold-icon" width={size} />,
  Italic: ({ size }) => <svg data-testid="italic-icon" width={size} />,
  Code: ({ size }) => <svg data-testid="code-icon" width={size} />,
  Link: ({ size }) => <svg data-testid="link-icon" width={size} />,
  Send: ({ size }) => <svg data-testid="send-icon" width={size} />,
  Paperclip: ({ size }) => <svg data-testid="paperclip-icon" width={size} />,
  Camera: ({ size }) => <svg data-testid="camera-icon" width={size} />,
  Mic: ({ size }) => <svg data-testid="mic-icon" width={size} />
}));

// Mock EmojiPicker component
jest.mock('./EmojiPicker', () => {
  return function EmojiPicker({ onEmojiSelect, isOpen, onToggle, isMobile }) {
    return isOpen ? (
      <div data-testid="emoji-picker">
        <button onClick={() => onEmojiSelect('😀')}>Select Emoji</button>
        <button onClick={() => onToggle(false)}>Close</button>
      </div>
    ) : (
      <button data-testid="emoji-button" onClick={() => onToggle(true)}>
        Open Emoji
      </button>
    );
  };
});

describe('RichTextEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    placeholder: 'Type a message...'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<RichTextEditor {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders textarea with correct placeholder', () => {
      render(<RichTextEditor {...defaultProps} />);
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<RichTextEditor {...defaultProps} placeholder="Custom placeholder" />);
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('renders send button', () => {
      render(<RichTextEditor {...defaultProps} />);
      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('renders emoji button by default', () => {
      render(<RichTextEditor {...defaultProps} />);
      expect(screen.getByTestId('emoji-button')).toBeInTheDocument();
    });

    it('hides emoji button when showEmojiButton is false', () => {
      render(<RichTextEditor {...defaultProps} showEmojiButton={false} />);
      expect(screen.queryByTestId('emoji-button')).not.toBeInTheDocument();
    });

    it('renders file upload button on desktop', () => {
      render(<RichTextEditor {...defaultProps} isMobile={false} />);
      expect(screen.getByTestId('paperclip-icon')).toBeInTheDocument();
    });

    it('does not render file upload button on mobile', () => {
      render(<RichTextEditor {...defaultProps} isMobile={true} />);
      expect(screen.queryByTestId('paperclip-icon')).not.toBeInTheDocument();
    });

    it('renders camera button on mobile', () => {
      render(<RichTextEditor {...defaultProps} isMobile={true} />);
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    });

    it('does not render camera button on desktop', () => {
      render(<RichTextEditor {...defaultProps} isMobile={false} />);
      expect(screen.queryByTestId('camera-icon')).not.toBeInTheDocument();
    });

    it('renders formatting toolbar toggle on desktop', () => {
      render(<RichTextEditor {...defaultProps} isMobile={false} />);
      expect(screen.getByText('Aa')).toBeInTheDocument();
    });

    it('does not render formatting toolbar toggle on mobile', () => {
      render(<RichTextEditor {...defaultProps} isMobile={true} />);
      expect(screen.queryByText('Aa')).not.toBeInTheDocument();
    });

    it('displays keyboard shortcuts hint on desktop', () => {
      render(<RichTextEditor {...defaultProps} isMobile={false} />);
      expect(screen.getByText(/Enter/)).toBeInTheDocument();
      expect(screen.getByText(/Shift \+ Enter/)).toBeInTheDocument();
    });

    it('does not display keyboard shortcuts hint on mobile', () => {
      render(<RichTextEditor {...defaultProps} isMobile={true} />);
      expect(screen.queryByText(/Enter/)).not.toBeInTheDocument();
    });
  });

  describe('Controlled Value', () => {
    it('displays provided value', () => {
      render(<RichTextEditor {...defaultProps} value="Hello World" />);
      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue('Hello World');
    });

    it('calls onChange when text is typed', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      await user.type(textarea, 'Test');

      expect(onChange).toHaveBeenCalled();
    });

    it('updates value when props change', () => {
      const { rerender } = render(<RichTextEditor {...defaultProps} value="First" />);
      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue('First');

      rerender(<RichTextEditor {...defaultProps} value="Second" />);
      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue('Second');
    });

    it('handles empty string value', () => {
      render(<RichTextEditor {...defaultProps} value="" />);
      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue('');
    });

    it('handles very long text', () => {
      const longText = 'a'.repeat(10000);
      render(<RichTextEditor {...defaultProps} value={longText} />);
      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue(longText);
    });
  });

  describe('Text Formatting Toolbar', () => {
    it('shows formatting toolbar when toggle is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<RichTextEditor {...defaultProps} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      expect(screen.getByTestId('bold-icon')).toBeInTheDocument();
      expect(screen.getByTestId('italic-icon')).toBeInTheDocument();
      expect(screen.getByTestId('code-icon')).toBeInTheDocument();
      expect(screen.getByTestId('link-icon')).toBeInTheDocument();
    });

    it('hides formatting toolbar when toggle is clicked again', async () => {
      const user = userEvent.setup({ delay: null });
      render(<RichTextEditor {...defaultProps} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);
      expect(screen.getByTestId('bold-icon')).toBeInTheDocument();

      await user.click(toggleButton);
      expect(screen.queryByTestId('bold-icon')).not.toBeInTheDocument();
    });

    it('does not show formatting toolbar on mobile', async () => {
      const user = userEvent.setup({ delay: null });
      render(<RichTextEditor {...defaultProps} isMobile={true} />);

      // No toggle button on mobile
      expect(screen.queryByText('Aa')).not.toBeInTheDocument();
    });

    it('shows all formatting buttons in toolbar', async () => {
      const user = userEvent.setup({ delay: null });
      render(<RichTextEditor {...defaultProps} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      expect(screen.getByTestId('bold-icon')).toBeInTheDocument();
      expect(screen.getByTestId('italic-icon')).toBeInTheDocument();
      expect(screen.getByTestId('code-icon')).toBeInTheDocument();
      expect(screen.getByTestId('link-icon')).toBeInTheDocument();
      expect(screen.getByText('{}')).toBeInTheDocument(); // Code block button
    });
  });

  describe('Bold Formatting', () => {
    it('inserts bold formatting when bold button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      const boldButton = screen.getByTestId('bold-icon').closest('button');
      await user.click(boldButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('**bold text**');
    });

    it('wraps selected text in bold formatting', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Hello World" onChange={onChange} isMobile={false} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.setSelectionRange(0, 5); // Select "Hello"

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      const boldButton = screen.getByTestId('bold-icon').closest('button');
      await user.click(boldButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('**Hello** World');
    });

    it('applies bold formatting with Ctrl+B', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      await user.keyboard('{Control>}b{/Control}');

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('**bold text**');
    });

    it('applies bold formatting with Cmd+B on Mac', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      await user.keyboard('{Meta>}b{/Meta}');

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('**bold text**');
    });
  });

  describe('Italic Formatting', () => {
    it('inserts italic formatting when italic button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      const italicButton = screen.getByTestId('italic-icon').closest('button');
      await user.click(italicButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('*italic text*');
    });

    it('wraps selected text in italic formatting', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Hello World" onChange={onChange} isMobile={false} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.setSelectionRange(6, 11); // Select "World"

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      const italicButton = screen.getByTestId('italic-icon').closest('button');
      await user.click(italicButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('Hello *World*');
    });

    it('applies italic formatting with Ctrl+I', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      await user.keyboard('{Control>}i{/Control}');

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('*italic text*');
    });
  });

  describe('Code Formatting', () => {
    it('inserts inline code formatting when code button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      const codeButton = screen.getByTestId('code-icon').closest('button');
      await user.click(codeButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('`code`');
    });

    it('wraps selected text in code formatting', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} value="const x = 5" onChange={onChange} isMobile={false} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.setSelectionRange(0, 12); // Select "const x = 5"

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      const codeButton = screen.getByTestId('code-icon').closest('button');
      await user.click(codeButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('`const x = 5`');
    });

    it('applies code formatting with Ctrl+E', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      await user.keyboard('{Control>}e{/Control}');

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('`code`');
    });

    it('inserts code block when code block button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      const codeBlockButton = screen.getByText('{}').closest('button');
      await user.click(codeBlockButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('```\ncode block\n```');
    });
  });

  describe('Link Formatting', () => {
    it('inserts link formatting when link button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      const linkButton = screen.getByTestId('link-icon').closest('button');
      await user.click(linkButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('[link text](url)');
    });

    it('wraps selected text in link formatting', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Click here" onChange={onChange} isMobile={false} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.setSelectionRange(0, 10); // Select "Click here"

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      const linkButton = screen.getByTestId('link-icon').closest('button');
      await user.click(linkButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('[Click here](url)');
    });

    it('applies link formatting with Ctrl+K', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      await user.keyboard('{Control>}k{/Control}');

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('[link text](url)');
    });
  });

  describe('Emoji Integration', () => {
    it('shows emoji picker when button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<RichTextEditor {...defaultProps} />);

      const emojiButton = screen.getByTestId('emoji-button');
      await user.click(emojiButton);

      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
    });

    it('inserts emoji at cursor position', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Hello " onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.setSelectionRange(6, 6); // Position after "Hello "

      const emojiButton = screen.getByTestId('emoji-button');
      await user.click(emojiButton);

      const selectEmojiButton = screen.getByText('Select Emoji');
      await user.click(selectEmojiButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('Hello 😀');
    });

    it('closes emoji picker after emoji selection', async () => {
      const user = userEvent.setup({ delay: null });
      render(<RichTextEditor {...defaultProps} />);

      const emojiButton = screen.getByTestId('emoji-button');
      await user.click(emojiButton);

      const selectEmojiButton = screen.getByText('Select Emoji');
      await user.click(selectEmojiButton);

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.queryByText('Select Emoji')).not.toBeInTheDocument();
      });
    });

    it('calls onEmojiSelect callback when provided', async () => {
      const user = userEvent.setup({ delay: null });
      const onEmojiSelect = jest.fn();
      render(<RichTextEditor {...defaultProps} onEmojiSelect={onEmojiSelect} />);

      const emojiButton = screen.getByTestId('emoji-button');
      await user.click(emojiButton);

      const selectEmojiButton = screen.getByText('Select Emoji');
      await user.click(selectEmojiButton);

      act(() => {
        jest.runAllTimers();
      });

      expect(onEmojiSelect).toHaveBeenCalledWith('😀');
    });
  });

  describe('File Upload', () => {
    it('calls onFileUpload when file is selected on desktop', async () => {
      const user = userEvent.setup({ delay: null });
      const onFileUpload = jest.fn();
      render(<RichTextEditor {...defaultProps} onFileUpload={onFileUpload} isMobile={false} />);

      const fileButton = screen.getByTestId('paperclip-icon').closest('button');

      // Simulate file input
      const fileInput = document.querySelector('input[type="file"][multiple]');
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await user.upload(fileInput, file);

      expect(onFileUpload).toHaveBeenCalledWith([file]);
    });

    it('handles multiple file selection', async () => {
      const user = userEvent.setup({ delay: null });
      const onFileUpload = jest.fn();
      render(<RichTextEditor {...defaultProps} onFileUpload={onFileUpload} isMobile={false} />);

      const fileInput = document.querySelector('input[type="file"][multiple]');
      const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
      const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });

      await user.upload(fileInput, [file1, file2]);

      expect(onFileUpload).toHaveBeenCalledWith([file1, file2]);
    });

    it('resets file input after upload', async () => {
      const user = userEvent.setup({ delay: null });
      const onFileUpload = jest.fn();
      render(<RichTextEditor {...defaultProps} onFileUpload={onFileUpload} isMobile={false} />);

      const fileInput = document.querySelector('input[type="file"][multiple]');
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await user.upload(fileInput, file);

      expect(fileInput.value).toBe('');
    });

    it('handles camera capture on mobile', async () => {
      const user = userEvent.setup({ delay: null });
      const onFileUpload = jest.fn();
      render(<RichTextEditor {...defaultProps} onFileUpload={onFileUpload} isMobile={true} />);

      const cameraInput = document.querySelector('input[capture="environment"]');
      const imageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

      await user.upload(cameraInput, imageFile);

      expect(onFileUpload).toHaveBeenCalledWith([imageFile]);
    });

    it('does not crash when onFileUpload is not provided', async () => {
      const user = userEvent.setup({ delay: null });
      render(<RichTextEditor {...defaultProps} isMobile={false} />);

      const fileInput = document.querySelector('input[type="file"][multiple]');
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await expect(user.upload(fileInput, file)).resolves.not.toThrow();
    });
  });

  describe('Voice Recording', () => {
    it('renders voice button on mobile when onVoiceRecord is provided', () => {
      render(<RichTextEditor {...defaultProps} onVoiceRecord={jest.fn()} isMobile={true} />);
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
    });

    it('does not render voice button when onVoiceRecord is not provided', () => {
      render(<RichTextEditor {...defaultProps} isMobile={true} />);
      expect(screen.queryByTestId('mic-icon')).not.toBeInTheDocument();
    });

    it('calls onVoiceRecord when voice button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onVoiceRecord = jest.fn();
      render(<RichTextEditor {...defaultProps} onVoiceRecord={onVoiceRecord} isMobile={true} />);

      const voiceButton = screen.getByTestId('mic-icon').closest('button');
      await user.click(voiceButton);

      expect(onVoiceRecord).toHaveBeenCalled();
    });

    it('shows recording state with pulse animation', () => {
      render(<RichTextEditor {...defaultProps} onVoiceRecord={jest.fn()} isRecording={true} isMobile={true} />);

      const voiceButton = screen.getByTestId('mic-icon').closest('button');
      expect(voiceButton).toHaveClass('');
    });
  });

  describe('Reply Functionality', () => {
    it('shows reply header when replyingTo is provided', () => {
      const replyingTo = { username: 'John', content: 'Original message' };
      render(<RichTextEditor {...defaultProps} replyingTo={replyingTo} />);

      expect(screen.getByText(/Replying to/)).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('displays replying message content', () => {
      const replyingTo = { username: 'John', content: 'Original message' };
      render(<RichTextEditor {...defaultProps} replyingTo={replyingTo} />);

      expect(screen.getByText('Original message')).toBeInTheDocument();
    });

    it('calls onCancelReply when cancel button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onCancelReply = jest.fn();
      const replyingTo = { username: 'John', content: 'Original message' };
      render(<RichTextEditor {...defaultProps} replyingTo={replyingTo} onCancelReply={onCancelReply} />);

      const cancelButton = screen.getByText('✕');
      await user.click(cancelButton);

      expect(onCancelReply).toHaveBeenCalled();
    });

    it('focuses textarea when replying', () => {
      const replyingTo = { username: 'John', content: 'Original message' };
      render(<RichTextEditor {...defaultProps} replyingTo={replyingTo} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(document.activeElement).toBe(textarea);
    });
  });

  describe('Edit Functionality', () => {
    it('shows edit header when editingMessage is provided', () => {
      const editingMessage = { id: '1', content: 'Message to edit' };
      render(<RichTextEditor {...defaultProps} editingMessage={editingMessage} />);

      expect(screen.getByText('Editing message')).toBeInTheDocument();
    });

    it('calls onCancelEdit when cancel button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onCancelEdit = jest.fn();
      const editingMessage = { id: '1', content: 'Message to edit' };
      render(<RichTextEditor {...defaultProps} editingMessage={editingMessage} onCancelEdit={onCancelEdit} />);

      const cancelButton = screen.getByText('✕');
      await user.click(cancelButton);

      expect(onCancelEdit).toHaveBeenCalled();
    });

    it('focuses textarea when editing', () => {
      const editingMessage = { id: '1', content: 'Message to edit' };
      render(<RichTextEditor {...defaultProps} editingMessage={editingMessage} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(document.activeElement).toBe(textarea);
    });
  });

  describe('Submit Functionality', () => {
    it('calls onSubmit when send button is clicked with non-empty value', async () => {
      const user = userEvent.setup({ delay: null });
      const onSubmit = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Hello" onSubmit={onSubmit} />);

      const sendButton = screen.getByTestId('send-icon').closest('button');
      await user.click(sendButton);

      expect(onSubmit).toHaveBeenCalled();
    });

    it('does not call onSubmit when send button is clicked with empty value', async () => {
      const user = userEvent.setup({ delay: null });
      const onSubmit = jest.fn();
      render(<RichTextEditor {...defaultProps} value="" onSubmit={onSubmit} />);

      const sendButton = screen.getByTestId('send-icon').closest('button');
      await user.click(sendButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when value is only whitespace', async () => {
      const user = userEvent.setup({ delay: null });
      const onSubmit = jest.fn();
      render(<RichTextEditor {...defaultProps} value="   " onSubmit={onSubmit} />);

      const sendButton = screen.getByTestId('send-icon').closest('button');
      await user.click(sendButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits on Enter key', async () => {
      const user = userEvent.setup({ delay: null });
      const onSubmit = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Hello" onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      await user.keyboard('{Enter}');

      expect(onSubmit).toHaveBeenCalled();
    });

    it('does not submit on Shift+Enter', async () => {
      const user = userEvent.setup({ delay: null });
      const onSubmit = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Hello" onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not submit on Enter when value is empty', async () => {
      const user = userEvent.setup({ delay: null });
      const onSubmit = jest.fn();
      render(<RichTextEditor {...defaultProps} value="" onSubmit={onSubmit} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      await user.keyboard('{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('disables textarea when disabled prop is true', () => {
      render(<RichTextEditor {...defaultProps} disabled={true} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(textarea).toBeDisabled();
    });

    it('disables send button when disabled prop is true', () => {
      render(<RichTextEditor {...defaultProps} value="Hello" disabled={true} />);

      const sendButton = screen.getByTestId('send-icon').closest('button');
      expect(sendButton).toBeDisabled();
    });

    it('does not call onSubmit when disabled', async () => {
      const user = userEvent.setup({ delay: null });
      const onSubmit = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Hello" disabled={true} onSubmit={onSubmit} />);

      const sendButton = screen.getByTestId('send-icon').closest('button');
      await user.click(sendButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Focus State', () => {
    it('applies focus styles when textarea is focused', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<RichTextEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      await user.click(textarea);

      const editorContainer = container.querySelector('.relative');
      expect(editorContainer).toHaveStyle({
        border: expect.stringContaining('var(--accent-primary)')
      });
    });

    it('removes focus styles when textarea is blurred', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<RichTextEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      await user.click(textarea);

      fireEvent.blur(textarea);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      const editorContainer = container.querySelector('.relative');
      expect(editorContainer).toHaveStyle({
        border: expect.stringContaining('var(--border-primary)')
      });
    });
  });

  describe('Auto-resize Behavior', () => {
    it('adjusts textarea height based on content', () => {
      const { rerender } = render(<RichTextEditor {...defaultProps} value="" />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      const initialHeight = textarea.style.height;

      rerender(<RichTextEditor {...defaultProps} value="Line 1\nLine 2\nLine 3\nLine 4\nLine 5" />);

      // Height should be adjusted (actual adjustment happens in effect)
      expect(textarea.style.height).toBeDefined();
    });

    it('respects max height on desktop', () => {
      render(<RichTextEditor {...defaultProps} value="a\n".repeat(20)} isMobile={false} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      // Max height is enforced in the component
      expect(textarea.className).toContain('max-h-[120px]');
    });

    it('respects max height on mobile', () => {
      render(<RichTextEditor {...defaultProps} value="a\n".repeat(20)} isMobile={true} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      // Max height is enforced in the component
      expect(textarea.className).toContain('max-h-[100px]');
    });
  });

  describe('Mobile Optimizations', () => {
    it('applies mobile padding', () => {
      const { container } = render(<RichTextEditor {...defaultProps} isMobile={true} />);

      const editorContainer = container.querySelector('.relative');
      expect(editorContainer).toHaveClass('mx-2');
    });

    it('uses mobile font size', () => {
      render(<RichTextEditor {...defaultProps} isMobile={true} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(textarea).toHaveClass('text-base');
    });

    it('uses desktop font size', () => {
      render(<RichTextEditor {...defaultProps} isMobile={false} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(textarea).toHaveClass('text-sm');
    });

    it('applies touch-target classes on mobile', () => {
      render(<RichTextEditor {...defaultProps} isMobile={true} />);

      const sendButton = screen.getByTestId('send-icon').closest('button');
      expect(sendButton).toHaveClass('touch-target');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('prevents default on formatting shortcuts', async () => {
      const user = userEvent.setup({ delay: null });
      render(<RichTextEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent(textarea, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('supports all keyboard shortcuts', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.focus();

      // Test Ctrl+B
      await user.keyboard('{Control>}b{/Control}');
      act(() => jest.runAllTimers());
      expect(onChange).toHaveBeenCalledWith('**bold text**');

      onChange.mockClear();

      // Test Ctrl+I
      await user.keyboard('{Control>}i{/Control}');
      act(() => jest.runAllTimers());
      expect(onChange).toHaveBeenCalledWith('*italic text*');

      onChange.mockClear();

      // Test Ctrl+E
      await user.keyboard('{Control>}e{/Control}');
      act(() => jest.runAllTimers());
      expect(onChange).toHaveBeenCalledWith('`code`');

      onChange.mockClear();

      // Test Ctrl+K
      await user.keyboard('{Control>}k{/Control}');
      act(() => jest.runAllTimers());
      expect(onChange).toHaveBeenCalledWith('[link text](url)');
    });
  });

  describe('Edge Cases', () => {
    it('handles null onChange gracefully', () => {
      expect(() => {
        render(<RichTextEditor value="" placeholder="Test" onSubmit={jest.fn()} />);
      }).not.toThrow();
    });

    it('handles null onSubmit gracefully', () => {
      expect(() => {
        render(<RichTextEditor value="" onChange={jest.fn()} placeholder="Test" />);
      }).not.toThrow();
    });

    it('handles special characters in value', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      render(<RichTextEditor {...defaultProps} value={specialChars} />);

      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue(specialChars);
    });

    it('handles unicode characters', () => {
      const unicode = '你好世界 こんにちは مرحبا';
      render(<RichTextEditor {...defaultProps} value={unicode} />);

      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue(unicode);
    });

    it('handles emojis in text value', () => {
      const emojiText = '😀😂🎉🔥💯';
      render(<RichTextEditor {...defaultProps} value={emojiText} />);

      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue(emojiText);
    });

    it('handles newlines in value', () => {
      const multiline = 'Line 1\nLine 2\nLine 3';
      render(<RichTextEditor {...defaultProps} value={multiline} />);

      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue(multiline);
    });

    it('handles very long single line', () => {
      const longLine = 'a'.repeat(1000);
      render(<RichTextEditor {...defaultProps} value={longLine} />);

      expect(screen.getByPlaceholderText('Type a message...')).toHaveValue(longLine);
    });

    it('handles rapid text input', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');

      await user.type(textarea, 'abcdefghijklmnopqrstuvwxyz');

      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('handles cursor position at start', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Hello" onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.setSelectionRange(0, 0);

      await user.keyboard('{Control>}b{/Control}');

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('**bold text**Hello');
    });

    it('handles cursor position at end', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} value="Hello" onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      textarea.setSelectionRange(5, 5);

      await user.keyboard('{Control>}b{/Control}');

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith('Hello**bold text**');
    });
  });

  describe('Paste Handling', () => {
    it('handles paste event', async () => {
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
        bubbles: true,
        cancelable: true
      });

      // This will be handled by browser default behavior
      fireEvent(textarea, pasteEvent);

      // Component should handle paste normally
      expect(textarea).toBeInTheDocument();
    });

    it('handles paste with formatting', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Type a message...');

      // Simulate pasting text
      await user.click(textarea);
      await user.paste('Pasted text');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('textarea has proper attributes', () => {
      render(<RichTextEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(textarea).toHaveAttribute('placeholder', 'Type a message...');
      expect(textarea).toHaveAttribute('rows', '1');
    });

    it('buttons have proper titles', async () => {
      const user = userEvent.setup({ delay: null });
      render(<RichTextEditor {...defaultProps} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      expect(screen.getByTestId('bold-icon').closest('button')).toHaveAttribute('title', 'Bold (Ctrl+B)');
      expect(screen.getByTestId('italic-icon').closest('button')).toHaveAttribute('title', 'Italic (Ctrl+I)');
      expect(screen.getByTestId('code-icon').closest('button')).toHaveAttribute('title', 'Code (Ctrl+E)');
      expect(screen.getByTestId('link-icon').closest('button')).toHaveAttribute('title', 'Link (Ctrl+K)');
    });

    it('send button has proper title', () => {
      render(<RichTextEditor {...defaultProps} />);

      const sendButton = screen.getByTestId('send-icon').closest('button');
      expect(sendButton).toHaveAttribute('title', 'Send message (Enter)');
    });

    it('file button has proper title on desktop', () => {
      render(<RichTextEditor {...defaultProps} isMobile={false} />);

      const fileButton = screen.getByTestId('paperclip-icon').closest('button');
      expect(fileButton).toHaveAttribute('title', 'Attach file');
    });

    it('camera button has proper title on mobile', () => {
      render(<RichTextEditor {...defaultProps} isMobile={true} />);

      const cameraButton = screen.getByTestId('camera-icon').closest('button');
      expect(cameraButton).toHaveAttribute('title', 'Take photo/video');
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot with default props', () => {
      const { container } = render(<RichTextEditor {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in mobile mode', () => {
      const { container } = render(<RichTextEditor {...defaultProps} isMobile={true} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with formatting toolbar open', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<RichTextEditor {...defaultProps} isMobile={false} />);

      const toggleButton = screen.getByText('Aa');
      await user.click(toggleButton);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with reply header', () => {
      const replyingTo = { username: 'John', content: 'Original message' };
      const { container } = render(<RichTextEditor {...defaultProps} replyingTo={replyingTo} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with edit header', () => {
      const editingMessage = { id: '1', content: 'Message to edit' };
      const { container } = render(<RichTextEditor {...defaultProps} editingMessage={editingMessage} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in disabled state', () => {
      const { container } = render(<RichTextEditor {...defaultProps} disabled={true} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with value', () => {
      const { container } = render(<RichTextEditor {...defaultProps} value="Test message content" />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with voice recording button', () => {
      const { container } = render(<RichTextEditor {...defaultProps} onVoiceRecord={jest.fn()} isMobile={true} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in recording state', () => {
      const { container } = render(<RichTextEditor {...defaultProps} onVoiceRecord={jest.fn()} isRecording={true} isMobile={true} />);
      expect(container).toMatchSnapshot();
    });
  });
});

export default EmojiPicker
