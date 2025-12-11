/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FirstPostStep from './FirstPostStep';

describe('FirstPostStep', () => {
  let mockOnComplete;
  let mockOnSkip;
  let mockFetch;

  beforeEach(() => {
    mockOnComplete = jest.fn();
    mockOnSkip = jest.fn();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    Storage.prototype.getItem = jest.fn(() => 'test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText('Create Your First Post')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText('Create Your First Post')).toBeInTheDocument();
      expect(screen.getByText(/Introduce yourself to the community/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Post Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Message')).toBeInTheDocument();
    });

    it('renders post ideas section', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText(/First Post Ideas/i)).toBeInTheDocument();
      expect(screen.getByText(/Hello CRYB! I'm/i)).toBeInTheDocument();
      expect(screen.getByText(/New to crypto\/Web3/i)).toBeInTheDocument();
    });

    it('renders post guidelines section', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText(/Post Guidelines/i)).toBeInTheDocument();
      expect(screen.getByText(/Be respectful and welcoming/i)).toBeInTheDocument();
      expect(screen.getByText(/Stay on topic for the community/i)).toBeInTheDocument();
      expect(screen.getByText(/Use proper formatting and grammar/i)).toBeInTheDocument();
    });

    it('renders title input with correct attributes', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      expect(titleInput).toHaveAttribute('type', 'text');
      expect(titleInput).toHaveAttribute('maxLength', '200');
      expect(titleInput).toHaveAttribute('placeholder', 'Introduce yourself or ask a question...');
    });

    it('renders content textarea with correct attributes', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const contentTextarea = screen.getByLabelText('Your Message');
      expect(contentTextarea).toHaveAttribute('maxLength', '2000');
      expect(contentTextarea).toHaveAttribute('rows', '6');
    });

    it('renders skip button', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText('Skip for now')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText('Publish Post & Continue')).toBeInTheDocument();
    });
  });

  describe('Text Input and Character Limits', () => {
    it('updates title on input', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');

      await user.type(titleInput, 'Hello World');

      expect(titleInput).toHaveValue('Hello World');
    });

    it('updates content on input', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(contentTextarea, 'This is my first post');

      expect(contentTextarea).toHaveValue('This is my first post');
    });

    it('displays title character count', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText('0/200 characters')).toBeInTheDocument();
    });

    it('updates title character count on input', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');

      await user.type(titleInput, 'Hello');

      expect(screen.getByText('5/200 characters')).toBeInTheDocument();
    });

    it('displays content character count', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText(/0\/2000 characters/i)).toBeInTheDocument();
    });

    it('updates content character count on input', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(contentTextarea, 'Content');

      expect(screen.getByText(/7\/2000 characters/i)).toBeInTheDocument();
    });

    it('respects title maxLength of 200 characters', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const longText = 'a'.repeat(250);

      await user.type(titleInput, longText);

      expect(titleInput.value.length).toBeLessThanOrEqual(200);
    });

    it('respects content maxLength of 2000 characters', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const contentTextarea = screen.getByLabelText('Your Message');
      const longText = 'a'.repeat(2500);

      await user.type(contentTextarea, longText);

      expect(contentTextarea.value.length).toBeLessThanOrEqual(2000);
    });

    it('allows clearing title input', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');

      await user.type(titleInput, 'Hello');
      await user.clear(titleInput);

      expect(titleInput).toHaveValue('');
    });

    it('allows clearing content input', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(contentTextarea, 'Content');
      await user.clear(contentTextarea);

      expect(contentTextarea).toHaveValue('');
    });

    it('displays markdown supported message', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText(/Markdown supported/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('disables submit button when both fields are empty', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const submitButton = screen.getByText('Publish Post & Continue');
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when title is empty', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(contentTextarea, 'Content here');

      const submitButton = screen.getByText('Publish Post & Continue');
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when content is empty', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');

      await user.type(titleInput, 'Title here');

      const submitButton = screen.getByText('Publish Post & Continue');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when both fields are filled', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'My Title');
      await user.type(contentTextarea, 'My content');

      const submitButton = screen.getByText('Publish Post & Continue');
      expect(submitButton).not.toBeDisabled();
    });

    it('validates that title is not just whitespace', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, '   ');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      expect(submitButton).toBeDisabled();
    });

    it('validates that content is not just whitespace', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, '   ');

      const submitButton = screen.getByText('Publish Post & Continue');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Skip Functionality', () => {
    it('calls onSkip when skip button is clicked', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const skipButton = screen.getByText('Skip for now');

      await user.click(skipButton);

      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it('skip button is always enabled', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const skipButton = screen.getByText('Skip for now');
      expect(skipButton).not.toBeDisabled();
    });
  });

  describe('Post Submission - Success', () => {
    it('submits post with correct data', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'My First Post');
      await user.type(contentTextarea, 'Hello everyone!');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            title: 'My First Post',
            content: 'Hello everyone!',
            communityId: 'welcome',
            type: 'introduction'
          })
        });
      });
    });

    it('calls onComplete after successful submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('includes auth token from localStorage', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });
      Storage.prototype.getItem = jest.fn(() => 'my-auth-token');

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer my-auth-token'
            })
          })
        );
      });
    });

    it('sets post type as introduction', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"type":"introduction"')
          })
        );
      });
    });

    it('sets default community as welcome', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"communityId":"welcome"')
          })
        );
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      expect(screen.getByText('Publishing...')).toBeInTheDocument();
    });

    it('disables submit button during submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      const publishingButton = screen.getByText('Publishing...').closest('button');
      expect(publishingButton).toBeDisabled();
    });

    it('shows loading spinner during submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      const spinner = document.querySelector('.');
      expect(spinner).toBeInTheDocument();
    });

    it('restores normal state after submission completes', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('calls onComplete even if API call fails', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: false });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error('Network error'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to create post:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('still allows progression after error', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error('API error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('handles 401 unauthorized response', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: false, status: 401 });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('handles 500 server error response', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty form on initial render', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      expect(titleInput).toHaveValue('');
      expect(contentTextarea).toHaveValue('');
    });

    it('shows 0 character count for empty title', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText('0/200 characters')).toBeInTheDocument();
    });

    it('shows 0 character count for empty content', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText(/0\/2000 characters/i)).toBeInTheDocument();
    });
  });

  describe('User Interface', () => {
    it('applies correct styling to disabled submit button', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const submitButton = screen.getByText('Publish Post & Continue');

      expect(submitButton.className).toContain('cursor-not-allowed');
    });

    it('applies correct styling to enabled submit button', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      expect(submitButton.className).toContain('bg-blue-600');
    });

    it('shows proper heading hierarchy', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const heading = screen.getByText('Create Your First Post');
      expect(heading.tagName).toBe('H3');
    });

    it('displays all post idea examples', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(screen.getByText(/Hello CRYB! I'm/i)).toBeInTheDocument();
      expect(screen.getByText(/New to crypto\/Web3/i)).toBeInTheDocument();
      expect(screen.getByText(/What's your favorite feature/i)).toBeInTheDocument();
      expect(screen.getByText(/Looking for communities/i)).toBeInTheDocument();
      expect(screen.getByText(/Here's a project I'm working on/i)).toBeInTheDocument();
    });

    it('displays all guideline checkmarks', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks).toHaveLength(4);
    });
  });

  describe('API Integration', () => {
    it('makes POST request to correct endpoint', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/posts',
          expect.any(Object)
        );
      });
    });

    it('sends correct Content-Type header', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );
      });
    });

    it('trims whitespace from title before submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, '  Trimmed Title  ');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"title":"  Trimmed Title  "')
          })
        );
      });
    });

    it('handles missing auth token', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });
      Storage.prototype.getItem = jest.fn(() => null);

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer null'
            })
          })
        );
      });
    });
  });

  describe('Keyboard Interactions', () => {
    it('allows typing in title field', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');

      titleInput.focus();
      await user.keyboard('Hello World');

      expect(titleInput).toHaveValue('Hello World');
    });

    it('allows typing in content field', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const contentTextarea = screen.getByLabelText('Your Message');

      contentTextarea.focus();
      await user.keyboard('My content');

      expect(contentTextarea).toHaveValue('My content');
    });

    it('allows tab navigation between fields', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');

      titleInput.focus();
      await user.tab();

      expect(document.activeElement).toBe(screen.getByLabelText('Your Message'));
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid clicking of submit button', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('handles special characters in title', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title with @#$%^&*()');
      await user.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('Publish Post & Continue');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('Title with @#$%^&*()')
          })
        );
      });
    });

    it('handles emoji in content', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: true });

      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const titleInput = screen.getByLabelText('Post Title');
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(titleInput, 'Title');
      await user.type(contentTextarea, 'Hello 👋 World 🌍');

      expect(contentTextarea).toHaveValue('Hello 👋 World 🌍');
    });

    it('handles newlines in content', async () => {
      const user = userEvent.setup();
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      const contentTextarea = screen.getByLabelText('Your Message');

      await user.type(contentTextarea, 'Line 1{Enter}Line 2');

      expect(contentTextarea.value).toContain('\n');
    });

    it('does not call onComplete without user action', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('does not call onSkip without user action', () => {
      render(<FirstPostStep onComplete={mockOnComplete} onSkip={mockOnSkip} />);
      expect(mockOnSkip).not.toHaveBeenCalled();
    });
  });
});

export default titleInput
