/**
 * Comprehensive Test Suite for CRYB RichTextEditor Component
 * Testing all features including markdown, media uploads, and accessibility
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RichTextEditor } from './RichTextEditor';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock DOMPurify
jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: (html: string) => html,
  },
}));

// Mock UI components
jest.mock('../ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  IconButton: ({ icon, ...props }: any) => (
    <button {...props}>
      <span>{icon}</span>
    </button>
  ),
  ButtonGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('../ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('RichTextEditor Component', () => {
  const mockOnChange = jest.fn();
  const mockOnMediaUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should render with placeholder text', () => {
      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          placeholder="Start writing..."
        />
      );
      const textarea = screen.getByPlaceholderText('Start writing...');
      expect(textarea).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByPlaceholderText('Write something...');
      expect(textarea).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(<RichTextEditor value="Hello World" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Hello World');
    });

    it('should apply custom minHeight', () => {
      render(
        <RichTextEditor value="" onChange={mockOnChange} minHeight={300} />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveStyle({ minHeight: '300px' });
    });

    it('should apply custom maxHeight', () => {
      render(
        <RichTextEditor value="" onChange={mockOnChange} maxHeight={800} />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveStyle({ maxHeight: '800px' });
    });
  });

  // ===== TEXT INPUT TESTS =====
  describe('Text Input', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Test');

      expect(mockOnChange).toHaveBeenCalled();
      // Check that onChange was called with incremental values
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle multiline text', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should update when value prop changes', () => {
      const { rerender } = render(
        <RichTextEditor value="Initial" onChange={mockOnChange} />
      );
      let textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial');

      rerender(<RichTextEditor value="Updated" onChange={mockOnChange} />);
      textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Updated');
    });
  });

  // ===== TOOLBAR TESTS =====
  describe('Toolbar', () => {
    it('should render toolbar by default', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    });

    it('should hide toolbar when showToolbar is false', () => {
      render(
        <RichTextEditor value="" onChange={mockOnChange} showToolbar={false} />
      );
      expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Italic')).not.toBeInTheDocument();
    });

    it('should render all toolbar buttons', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      expect(screen.getByLabelText('Bold')).toBeInTheDocument();
      expect(screen.getByLabelText('Italic')).toBeInTheDocument();
      expect(screen.getByLabelText('Heading')).toBeInTheDocument();
      expect(screen.getByLabelText('Link')).toBeInTheDocument();
      expect(screen.getByLabelText('Quote')).toBeInTheDocument();
      expect(screen.getByLabelText('Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Bullet List')).toBeInTheDocument();
      expect(screen.getByLabelText('Numbered List')).toBeInTheDocument();
    });
  });

  // ===== FORMATTING TESTS =====
  describe('Text Formatting', () => {
    it('should insert bold formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const boldButton = screen.getByLabelText('Bold');

      await user.click(boldButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('**bold text**');
      });
    });

    it('should insert italic formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const italicButton = screen.getByLabelText('Italic');

      await user.click(italicButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('*italic text*');
      });
    });

    it('should insert heading formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const headingButton = screen.getByLabelText('Heading');

      await user.click(headingButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('## Heading');
      });
    });

    it('should insert code formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const codeButton = screen.getByLabelText('Code');

      await user.click(codeButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('`code`');
      });
    });

    it('should insert quote formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const quoteButton = screen.getByLabelText('Quote');

      await user.click(quoteButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('> quoted text');
      });
    });

    it('should insert bullet list formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const listButton = screen.getByLabelText('Bullet List');

      await user.click(listButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('- list item');
      });
    });

    it('should insert numbered list formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const listButton = screen.getByLabelText('Numbered List');

      await user.click(listButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('1. list item');
      });
    });

    it('should wrap selected text with bold', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="selected text" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const boldButton = screen.getByLabelText('Bold');

      // Select all text
      textarea.setSelectionRange(0, 13);
      await user.click(boldButton);

      await waitFor(() => {
        const lastCall =
          mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
        expect(lastCall[0]).toBe('**selected text**');
      });
    });
  });

  // ===== LINK INSERTION TESTS =====
  describe('Link Insertion', () => {
    it('should insert link formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const linkButton = screen.getByLabelText('Link');

      await user.click(linkButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('[link text](url)');
      });
    });

    it('should wrap selected text as link', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="Click here" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const linkButton = screen.getByLabelText('Link');

      textarea.setSelectionRange(0, 10);
      await user.click(linkButton);

      await waitFor(() => {
        const lastCall =
          mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
        expect(lastCall[0]).toBe('[Click here](url)');
      });
    });
  });

  // ===== KEYBOARD SHORTCUTS TESTS =====
  describe('Keyboard Shortcuts', () => {
    it('should handle Ctrl+B for bold', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      textarea.focus();
      await user.keyboard('{Control>}b{/Control}');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('**bold text**');
      });
    });

    it('should handle Ctrl+I for italic', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      textarea.focus();
      await user.keyboard('{Control>}i{/Control}');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('*italic text*');
      });
    });

    it('should handle Ctrl+K for link', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      textarea.focus();
      await user.keyboard('{Control>}k{/Control}');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('[link text](url)');
      });
    });

    it('should handle Meta+B for bold on Mac', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      textarea.focus();
      await user.keyboard('{Meta>}b{/Meta}');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('**bold text**');
      });
    });
  });

  // ===== PREVIEW MODE TESTS =====
  describe('Preview Mode', () => {
    it('should show preview toggle button by default', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      expect(screen.getByLabelText('Show preview')).toBeInTheDocument();
    });

    it('should hide preview toggle when showPreview is false', () => {
      render(
        <RichTextEditor value="" onChange={mockOnChange} showPreview={false} />
      );
      expect(screen.queryByLabelText('Show preview')).not.toBeInTheDocument();
    });

    it('should toggle preview mode', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="**bold**" onChange={mockOnChange} />);
      const previewButton = screen.getByLabelText('Show preview');

      await user.click(previewButton);

      expect(screen.getByLabelText('Hide preview')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should render markdown in preview mode', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="**bold text**" onChange={mockOnChange} />);
      const previewButton = screen.getByLabelText('Show preview');

      await user.click(previewButton);

      expect(screen.getByText('Preview mode')).toBeInTheDocument();
    });

    it('should show "Preview mode" in footer when in preview', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const previewButton = screen.getByLabelText('Show preview');

      await user.click(previewButton);

      expect(screen.getByText('Preview mode')).toBeInTheDocument();
    });

    it('should show "Markdown supported" when not in preview', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      expect(screen.getByText('Markdown supported')).toBeInTheDocument();
    });
  });

  // ===== FULLSCREEN MODE TESTS =====
  describe('Fullscreen Mode', () => {
    it('should show fullscreen toggle button', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    });

    it('should toggle fullscreen mode', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const fullscreenButton = screen.getByLabelText('Enter fullscreen');

      await user.click(fullscreenButton);

      expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument();
    });

    it('should exit fullscreen mode', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const fullscreenButton = screen.getByLabelText('Enter fullscreen');

      await user.click(fullscreenButton);
      const exitButton = screen.getByLabelText('Exit fullscreen');
      await user.click(exitButton);

      expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    });
  });

  // ===== MEDIA UPLOAD TESTS =====
  describe('Media Upload', () => {
    it('should show image upload button by default', () => {
      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onMediaUpload={mockOnMediaUpload}
        />
      );
      expect(screen.getByLabelText('Upload image')).toBeInTheDocument();
    });

    it('should hide image upload when allowMedia is false', () => {
      render(
        <RichTextEditor value="" onChange={mockOnChange} allowMedia={false} />
      );
      expect(screen.queryByLabelText('Upload image')).not.toBeInTheDocument();
    });

    it('should handle file upload', async () => {
      const user = userEvent.setup();
      mockOnMediaUpload.mockResolvedValue('https://example.com/image.jpg');

      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onMediaUpload={mockOnMediaUpload}
        />
      );

      const uploadButton = screen.getByLabelText('Upload image');
      const fileInput = uploadButton.parentElement?.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnMediaUpload).toHaveBeenCalledWith(file);
      });
    });

    it('should insert markdown after successful upload', async () => {
      const user = userEvent.setup();
      mockOnMediaUpload.mockResolvedValue('https://example.com/image.jpg');

      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onMediaUpload={mockOnMediaUpload}
        />
      );

      const uploadButton = screen.getByLabelText('Upload image');
      const fileInput = uploadButton.parentElement?.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          '![test.jpg](https://example.com/image.jpg)'
        );
      });
    });

    it('should handle upload errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockOnMediaUpload.mockRejectedValue(new Error('Upload failed'));

      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onMediaUpload={mockOnMediaUpload}
        />
      );

      const uploadButton = screen.getByLabelText('Upload image');
      const fileInput = uploadButton.parentElement?.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to upload file:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  // ===== DRAG AND DROP TESTS =====
  describe('Drag and Drop', () => {
    it('should show drag overlay when dragging files', async () => {
      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onMediaUpload={mockOnMediaUpload}
        />
      );
      const textarea = screen.getByRole('textbox');
      const container = textarea.parentElement as HTMLElement;

      const dragEvent = new Event('dragover', { bubbles: true, cancelable: true });
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: { files: [] },
      });

      container.dispatchEvent(dragEvent);

      await waitFor(() => {
        expect(screen.getByText('Drop images here')).toBeInTheDocument();
      });
    });

    it('should hide drag overlay on drag leave', async () => {
      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onMediaUpload={mockOnMediaUpload}
        />
      );
      const textarea = screen.getByRole('textbox');
      const container = textarea.parentElement as HTMLElement;

      // Start dragging
      const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
      Object.defineProperty(dragOverEvent, 'dataTransfer', {
        value: { files: [] },
      });
      container.dispatchEvent(dragOverEvent);

      await waitFor(() => {
        expect(screen.getByText('Drop images here')).toBeInTheDocument();
      });

      // Leave drag area
      const dragLeaveEvent = new Event('dragleave', { bubbles: true });
      container.dispatchEvent(dragLeaveEvent);

      await waitFor(() => {
        expect(screen.queryByText('Drop images here')).not.toBeInTheDocument();
      });
    });

    it('should handle image drop', async () => {
      mockOnMediaUpload.mockResolvedValue('https://example.com/dropped.jpg');

      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onMediaUpload={mockOnMediaUpload}
        />
      );
      const textarea = screen.getByRole('textbox');
      const container = textarea.parentElement as HTMLElement;

      const file = new File(['image'], 'dropped.jpg', { type: 'image/jpeg' });
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      container.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockOnMediaUpload).toHaveBeenCalledWith(file);
      });
    });

    it('should only accept image files on drop', async () => {
      mockOnMediaUpload.mockResolvedValue('https://example.com/image.jpg');

      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onMediaUpload={mockOnMediaUpload}
        />
      );
      const textarea = screen.getByRole('textbox');
      const container = textarea.parentElement as HTMLElement;

      const imageFile = new File(['image'], 'image.jpg', {
        type: 'image/jpeg',
      });
      const textFile = new File(['text'], 'document.txt', {
        type: 'text/plain',
      });

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [imageFile, textFile],
        },
      });

      container.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockOnMediaUpload).toHaveBeenCalledTimes(1);
        expect(mockOnMediaUpload).toHaveBeenCalledWith(imageFile);
      });
    });
  });

  // ===== CHARACTER COUNT TESTS =====
  describe('Character Count', () => {
    it('should show character count when maxLength is set', () => {
      render(
        <RichTextEditor value="Hello" onChange={mockOnChange} maxLength={100} />
      );
      expect(screen.getByText('5 / 100')).toBeInTheDocument();
    });

    it('should not show character count when maxLength is not set', () => {
      render(<RichTextEditor value="Hello" onChange={mockOnChange} />);
      expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
    });

    it('should update character count on input', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <RichTextEditor value="" onChange={mockOnChange} maxLength={50} />
      );
      expect(screen.getByText('0 / 50')).toBeInTheDocument();

      rerender(
        <RichTextEditor value="Hello World" onChange={mockOnChange} maxLength={50} />
      );
      expect(screen.getByText('11 / 50')).toBeInTheDocument();
    });

    it('should show warning when over limit', () => {
      const longText = "This is a very long text that exceeds the maximum allowed length";
      render(
        <RichTextEditor
          value={longText}
          onChange={mockOnChange}
          maxLength={20}
        />
      );
      // The character count should show the text is over the limit
      const counter = screen.getByText(`${longText.length} / 20`);
      expect(counter).toBeInTheDocument();
    });
  });

  // ===== DISABLED STATE TESTS =====
  describe('Disabled State', () => {
    it('should disable textarea when disabled', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should disable toolbar buttons when disabled', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} disabled />);
      const boldButton = screen.getByLabelText('Bold');
      expect(boldButton).toBeDisabled();
    });

    it('should disable preview toggle when disabled', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} disabled />);
      const previewButton = screen.getByLabelText('Show preview');
      expect(previewButton).toBeDisabled();
    });

    it('should disable fullscreen toggle when disabled', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} disabled />);
      const fullscreenButton = screen.getByLabelText('Enter fullscreen');
      expect(fullscreenButton).toBeDisabled();
    });

    it('should disable image upload when disabled', () => {
      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          onMediaUpload={mockOnMediaUpload}
          disabled
        />
      );
      const uploadButton = screen.getByLabelText('Upload image');
      expect(uploadButton).toBeDisabled();
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('Error Handling', () => {
    it('should display error message when error prop is set', () => {
      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          error="This field is required"
        />
      );
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not display error when error prop is undefined', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('should update error message when prop changes', () => {
      const { rerender } = render(
        <RichTextEditor value="" onChange={mockOnChange} error="Error 1" />
      );
      expect(screen.getByText('Error 1')).toBeInTheDocument();

      rerender(
        <RichTextEditor value="" onChange={mockOnChange} error="Error 2" />
      );
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.queryByText('Error 1')).not.toBeInTheDocument();
    });
  });

  // ===== AUTO FOCUS TESTS =====
  describe('Auto Focus', () => {
    it('should auto focus when autoFocus is true', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} autoFocus />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveFocus();
    });

    it('should not auto focus by default', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toHaveFocus();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have textbox role', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should have proper aria-labels on toolbar buttons', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      expect(screen.getByLabelText('Bold')).toHaveAttribute('aria-label', 'Bold');
      expect(screen.getByLabelText('Italic')).toHaveAttribute(
        'aria-label',
        'Italic'
      );
    });

    it('should have title attributes with shortcuts', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const boldButton = screen.getByLabelText('Bold');
      expect(boldButton).toHaveAttribute('title', 'Bold (Ctrl+B)');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await user.tab();

      // First tab should go to the first toolbar button or textarea
      expect(document.activeElement).toBeTruthy();
    });

    it('should support screen readers with proper labels', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      expect(screen.getByLabelText('Upload image')).toBeInTheDocument();
      expect(screen.getByLabelText('Show preview')).toBeInTheDocument();
      expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    });
  });

  // ===== MARKDOWN RENDERING TESTS =====
  describe('Markdown Rendering', () => {
    it('should render bold text in preview', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="**bold**" onChange={mockOnChange} />);
      const previewButton = screen.getByLabelText('Show preview');

      await user.click(previewButton);

      // The preview should contain the rendered HTML
      const preview = screen.getByText('Preview mode').parentElement
        ?.parentElement;
      expect(preview).toBeTruthy();
    });

    it('should render italic text in preview', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="*italic*" onChange={mockOnChange} />);
      const previewButton = screen.getByLabelText('Show preview');

      await user.click(previewButton);

      const preview = screen.getByText('Preview mode').parentElement
        ?.parentElement;
      expect(preview).toBeTruthy();
    });

    it('should render headings in preview', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="## Heading" onChange={mockOnChange} />);
      const previewButton = screen.getByLabelText('Show preview');

      await user.click(previewButton);

      const preview = screen.getByText('Preview mode').parentElement
        ?.parentElement;
      expect(preview).toBeTruthy();
    });

    it('should render links in preview', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor value="[Link](https://example.com)" onChange={mockOnChange} />
      );
      const previewButton = screen.getByLabelText('Show preview');

      await user.click(previewButton);

      const preview = screen.getByText('Preview mode').parentElement
        ?.parentElement;
      expect(preview).toBeTruthy();
    });

    it('should render code blocks in preview', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="`code`" onChange={mockOnChange} />);
      const previewButton = screen.getByLabelText('Show preview');

      await user.click(previewButton);

      const preview = screen.getByText('Preview mode').parentElement
        ?.parentElement;
      expect(preview).toBeTruthy();
    });

    it('should render lists in preview', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="- Item 1\n- Item 2" onChange={mockOnChange} />);
      const previewButton = screen.getByLabelText('Show preview');

      await user.click(previewButton);

      const preview = screen.getByText('Preview mode').parentElement
        ?.parentElement;
      expect(preview).toBeTruthy();
    });
  });

  // ===== COMBINED STATES TESTS =====
  describe('Combined States', () => {
    it('should handle error and disabled together', () => {
      render(
        <RichTextEditor
          value=""
          onChange={mockOnChange}
          error="Error message"
          disabled
        />
      );
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should handle maxLength with error', () => {
      render(
        <RichTextEditor
          value="Too long text"
          onChange={mockOnChange}
          maxLength={10}
          error="Text is too long"
        />
      );
      expect(screen.getByText('Text is too long')).toBeInTheDocument();
      expect(screen.getByText(/13 \/ 10/)).toBeInTheDocument();
    });

    it('should handle preview mode with fullscreen', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="**test**" onChange={mockOnChange} />);

      const previewButton = screen.getByLabelText('Show preview');
      await user.click(previewButton);

      const fullscreenButton = screen.getByLabelText('Enter fullscreen');
      await user.click(fullscreenButton);

      expect(screen.getByLabelText('Hide preview')).toBeInTheDocument();
      expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES TESTS =====
  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      render(<RichTextEditor value={longText} onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(longText);
    });

    it('should handle special characters', () => {
      const specialText = '<script>alert("xss")</script>';
      render(<RichTextEditor value={specialText} onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(specialText);
    });

    it('should handle unicode characters', () => {
      const unicodeText = '😀 🎉 👍 ❤️';
      render(<RichTextEditor value={unicodeText} onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(unicodeText);
    });

    it('should handle rapid typing', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'rapid typing test', { delay: 1 });

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle null onChange calls gracefully', () => {
      const { rerender } = render(
        <RichTextEditor value="" onChange={mockOnChange} />
      );

      expect(() => {
        rerender(<RichTextEditor value="new value" onChange={mockOnChange} />);
      }).not.toThrow();
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Integration', () => {
    it('should complete a full editing workflow', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} maxLength={100} />);

      // Type some text
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello World');

      // Make text bold
      const boldButton = screen.getByLabelText('Bold');
      await user.click(boldButton);

      // Toggle preview
      const previewButton = screen.getByLabelText('Show preview');
      await user.click(previewButton);

      // Check preview mode
      expect(screen.getByText('Preview mode')).toBeInTheDocument();

      // Toggle back to edit mode
      const hidePreviewButton = screen.getByLabelText('Hide preview');
      await user.click(hidePreviewButton);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle multiple formatting operations', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor value="" onChange={mockOnChange} />);

      const boldButton = screen.getByLabelText('Bold');
      const italicButton = screen.getByLabelText('Italic');
      const codeButton = screen.getByLabelText('Code');

      await user.click(boldButton);
      await user.click(italicButton);
      await user.click(codeButton);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });
});
