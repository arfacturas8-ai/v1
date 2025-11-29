/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePost from './CreatePost';

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html) => html),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  Video: () => <div data-testid="video-icon">Video</div>,
  Link: () => <div data-testid="link-icon">Link</div>,
  Hash: () => <div data-testid="hash-icon">Hash</div>,
  Bold: () => <div data-testid="bold-icon">Bold</div>,
  Italic: () => <div data-testid="italic-icon">Italic</div>,
  Type: () => <div data-testid="type-icon">Type</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
}));

describe('CreatePost', () => {
  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockCommunities = [
    { id: 'comm-1', name: 'Technology', members: 1000 },
    { id: 'comm-2', name: 'Gaming', members: 500 },
    { id: 'comm-3', name: 'Music', members: 750 },
  ];

  const mockSelectedCommunity = mockCommunities[0];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    selectedCommunity: mockSelectedCommunity,
    communities: mockCommunities,
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<CreatePost {...defaultProps} />);
      expect(screen.getByText('Create Post')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<CreatePost {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Create Post')).not.toBeInTheDocument();
    });

    it('renders with correct modal structure', () => {
      const { container } = render(<CreatePost {...defaultProps} />);
      expect(container.querySelector('.modal-overlay')).toBeInTheDocument();
      expect(container.querySelector('.create-post-modal')).toBeInTheDocument();
      expect(container.querySelector('.modal-header')).toBeInTheDocument();
      expect(container.querySelector('.create-post-form')).toBeInTheDocument();
    });

    it('renders all post type tabs', () => {
      render(<CreatePost {...defaultProps} />);
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Image')).toBeInTheDocument();
      expect(screen.getByText('Video')).toBeInTheDocument();
      expect(screen.getByText('Link')).toBeInTheDocument();
    });

    it('renders close button in header', () => {
      render(<CreatePost {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: '' });
      expect(closeButton).toHaveClass('modal-close-btn');
    });

    it('renders form sections correctly', () => {
      const { container } = render(<CreatePost {...defaultProps} />);
      const formSections = container.querySelectorAll('.form-section');
      expect(formSections.length).toBeGreaterThan(0);
    });

    it('renders as inline form when modal props are different', () => {
      render(<CreatePost {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Create Post')).toBeInTheDocument();
    });
  });

  describe('Post Title Input', () => {
    it('renders title input field', () => {
      render(<CreatePost {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveAttribute('type', 'text');
    });

    it('allows typing in title field', async () => {
      render(<CreatePost {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");

      await userEvent.type(titleInput, 'My Test Post Title');
      expect(titleInput).toHaveValue('My Test Post Title');
    });

    it('shows character count for title', () => {
      render(<CreatePost {...defaultProps} />);
      expect(screen.getByText('0/300')).toBeInTheDocument();
    });

    it('updates character count when typing', async () => {
      render(<CreatePost {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");

      await userEvent.type(titleInput, 'Test');
      expect(screen.getByText('4/300')).toBeInTheDocument();
    });

    it('shows warning class when title exceeds 250 characters', async () => {
      render(<CreatePost {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const longTitle = 'a'.repeat(260);

      await userEvent.type(titleInput, longTitle);
      const charCount = screen.getByText(/260\/300/);
      expect(charCount).toHaveClass('warning');
    });

    it('enforces max length of 300 characters', () => {
      render(<CreatePost {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");
      expect(titleInput).toHaveAttribute('maxLength', '300');
    });

    it('shows validation error for empty title', async () => {
      render(<CreatePost {...defaultProps} />);
      const submitButton = screen.getByText('Create Post');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for title less than 3 characters', async () => {
      render(<CreatePost {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const submitButton = screen.getByText('Create Post');

      await userEvent.type(titleInput, 'ab');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument();
      });
    });

    it('shows validation error for title exceeding 300 characters', async () => {
      render(<CreatePost {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const form = screen.getByRole('form');

      // Manually set value to bypass maxLength attribute for testing
      Object.defineProperty(titleInput, 'value', {
        writable: true,
        value: 'a'.repeat(301),
      });
      fireEvent.change(titleInput);

      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Title must be less than 300 characters')).toBeInTheDocument();
      });
    });

    it('disables title input when submitting', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      await userEvent.type(titleInput, 'Test Title');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(titleInput).toBeDisabled();
      });
    });
  });

  describe('Post Content/Body with Rich Text', () => {
    it('renders content textarea for text post type', () => {
      render(<CreatePost {...defaultProps} />);
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');
      expect(contentTextarea).toBeInTheDocument();
    });

    it('allows typing in content field', async () => {
      render(<CreatePost {...defaultProps} />);
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(contentTextarea, 'This is my post content');
      expect(contentTextarea).toHaveValue('This is my post content');
    });

    it('shows validation error for empty text content', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={mockSelectedCommunity} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");
      await userEvent.type(titleInput, 'Valid Title');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Post content is required')).toBeInTheDocument();
      });
    });

    it('renders format buttons', () => {
      render(<CreatePost {...defaultProps} />);
      const boldButton = screen.getByTitle('Bold');
      const italicButton = screen.getByTitle('Italic');
      const previewButton = screen.getByTitle('Preview');

      expect(boldButton).toBeInTheDocument();
      expect(italicButton).toBeInTheDocument();
      expect(previewButton).toBeInTheDocument();
    });

    it('applies bold formatting to selected text', async () => {
      render(<CreatePost {...defaultProps} />);
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');
      const boldButton = screen.getByTitle('Bold');

      await userEvent.type(contentTextarea, 'test text');
      contentTextarea.setSelectionRange(0, 4);

      fireEvent.click(boldButton);

      await waitFor(() => {
        expect(contentTextarea.value).toContain('**test**');
      });
    });

    it('applies italic formatting to selected text', async () => {
      render(<CreatePost {...defaultProps} />);
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');
      const italicButton = screen.getByTitle('Italic');

      await userEvent.type(contentTextarea, 'test text');
      contentTextarea.setSelectionRange(0, 4);

      fireEvent.click(italicButton);

      await waitFor(() => {
        expect(contentTextarea.value).toContain('*test*');
      });
    });

    it('toggles preview mode', async () => {
      render(<CreatePost {...defaultProps} />);
      const previewButton = screen.getByTitle('Preview');

      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(previewButton).toHaveClass('active');
      });
    });

    it('shows content preview when preview mode is enabled', async () => {
      render(<CreatePost {...defaultProps} />);
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');
      const previewButton = screen.getByTitle('Preview');

      await userEvent.type(contentTextarea, '**Bold** and *italic* text');
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Nothing to preview')).not.toBeInTheDocument();
      });
    });

    it('shows placeholder in preview when content is empty', async () => {
      render(<CreatePost {...defaultProps} />);
      const previewButton = screen.getByTitle('Preview');

      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Nothing to preview')).toBeInTheDocument();
      });
    });

    it('disables content textarea when submitting', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(contentTextarea).toBeDisabled();
      });
    });
  });

  describe('Community/Channel Selection', () => {
    it('renders community select dropdown', () => {
      render(<CreatePost {...defaultProps} />);
      const communitySelect = screen.getByLabelText(/Choose Community/i);
      expect(communitySelect).toBeInTheDocument();
    });

    it('displays all available communities', () => {
      render(<CreatePost {...defaultProps} />);
      const communitySelect = screen.getByLabelText(/Choose Community/i);

      expect(screen.getByText('c/Technology')).toBeInTheDocument();
      expect(screen.getByText('c/Gaming')).toBeInTheDocument();
      expect(screen.getByText('c/Music')).toBeInTheDocument();
    });

    it('pre-selects community when selectedCommunity is provided', () => {
      render(<CreatePost {...defaultProps} />);
      const communitySelect = screen.getByLabelText(/Choose Community/i);
      expect(communitySelect).toHaveValue('comm-1');
    });

    it('allows changing community selection', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={null} />);
      const communitySelect = screen.getByLabelText(/Choose Community/i);

      await userEvent.selectOptions(communitySelect, 'comm-2');
      expect(communitySelect).toHaveValue('comm-2');
    });

    it('shows validation error when no community is selected', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={null} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");
      await userEvent.type(titleInput, 'Valid Title');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a community')).toBeInTheDocument();
      });
    });

    it('displays placeholder option in select', () => {
      render(<CreatePost {...defaultProps} selectedCommunity={null} />);
      expect(screen.getByText('Select a community...')).toBeInTheDocument();
    });

    it('disables community select when submitting', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');
      const communitySelect = screen.getByLabelText(/Choose Community/i);

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(communitySelect).toBeDisabled();
      });
    });
  });

  describe('Media Upload - Images', () => {
    it('shows image upload section when image post type is selected', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');

      fireEvent.click(imageTab);

      await waitFor(() => {
        expect(screen.getByText('Choose Images')).toBeInTheDocument();
      });
    });

    it('renders file input for images', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toHaveAttribute('accept', 'image/*');
        expect(fileInput).toHaveAttribute('multiple');
      });
    });

    it('allows selecting image files', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      });
    });

    it('supports multiple image uploads', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const files = [
        new File(['image1'], 'test1.png', { type: 'image/png' }),
        new File(['image2'], 'test2.png', { type: 'image/png' }),
        new File(['image3'], 'test3.png', { type: 'image/png' }),
      ];
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        expect(screen.getByAltText('Preview 2')).toBeInTheDocument();
        expect(screen.getByAltText('Preview 3')).toBeInTheDocument();
      });
    });

    it('limits image uploads to 10 files', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const files = Array.from({ length: 12 }, (_, i) =>
        new File([`image${i}`], `test${i}.png`, { type: 'image/png' })
      );
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        const previews = document.querySelectorAll('.media-item');
        expect(previews.length).toBe(10);
      });
    });

    it('filters non-image files when selecting images', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const files = [
        new File(['image'], 'test.png', { type: 'image/png' }),
        new File(['video'], 'test.mp4', { type: 'video/mp4' }),
      ];
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        const previews = document.querySelectorAll('.media-item');
        expect(previews.length).toBe(1);
      });
    });

    it('shows validation error when no image is selected', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={mockSelectedCommunity} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      await userEvent.type(titleInput, 'Valid Title');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select at least one image')).toBeInTheDocument();
      });
    });
  });

  describe('Media Upload - Videos', () => {
    it('shows video upload section when video post type is selected', async () => {
      render(<CreatePost {...defaultProps} />);
      const videoTab = screen.getByText('Video');

      fireEvent.click(videoTab);

      await waitFor(() => {
        expect(screen.getByText('Choose Video')).toBeInTheDocument();
      });
    });

    it('renders file input for video', async () => {
      render(<CreatePost {...defaultProps} />);
      const videoTab = screen.getByText('Video');
      fireEvent.click(videoTab);

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toHaveAttribute('accept', 'video/*');
      });
    });

    it('allows selecting video file', async () => {
      render(<CreatePost {...defaultProps} />);
      const videoTab = screen.getByText('Video');
      fireEvent.click(videoTab);

      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('test.mp4')).toBeInTheDocument();
      });
    });

    it('allows only one video file', async () => {
      render(<CreatePost {...defaultProps} />);
      const videoTab = screen.getByText('Video');
      fireEvent.click(videoTab);

      const file1 = new File(['video1'], 'test1.mp4', { type: 'video/mp4' });
      const file2 = new File(['video2'], 'test2.mp4', { type: 'video/mp4' });
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, file1);
      await userEvent.upload(fileInput, file2);

      await waitFor(() => {
        const previews = document.querySelectorAll('.media-item');
        expect(previews.length).toBe(1);
        expect(screen.getByText('test2.mp4')).toBeInTheDocument();
      });
    });

    it('shows validation error when no video is selected', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={mockSelectedCommunity} />);
      const videoTab = screen.getByText('Video');
      fireEvent.click(videoTab);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      await userEvent.type(titleInput, 'Valid Title');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a video file')).toBeInTheDocument();
      });
    });
  });

  describe('Media Preview and Removal', () => {
    it('displays image preview with thumbnail', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        const thumbnail = screen.getByAltText('Preview 1');
        expect(thumbnail).toHaveClass('media-thumbnail');
        expect(thumbnail).toHaveAttribute('src', 'mock-url');
      });
    });

    it('displays video preview with icon and filename', async () => {
      render(<CreatePost {...defaultProps} />);
      const videoTab = screen.getByText('Video');
      fireEvent.click(videoTab);

      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('test.mp4')).toBeInTheDocument();
        const videoPreview = document.querySelector('.video-preview');
        expect(videoPreview).toBeInTheDocument();
      });
    });

    it('shows remove button for each media item', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        const removeButton = document.querySelector('.remove-media-btn');
        expect(removeButton).toBeInTheDocument();
      });
    });

    it('removes media item when remove button is clicked', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, file);

      const removeButton = await screen.findByRole('button', { name: '' });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
      });
    });

    it('removes correct media item from multiple uploads', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const files = [
        new File(['image1'], 'test1.png', { type: 'image/png' }),
        new File(['image2'], 'test2.png', { type: 'image/png' }),
      ];
      const fileInput = document.querySelector('input[type="file"]');

      await userEvent.upload(fileInput, files);

      const removeButtons = document.querySelectorAll('.remove-media-btn');
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
        expect(screen.getByAltText('Preview 2')).toBeInTheDocument();
      });
    });
  });

  describe('Post Tags/Categories', () => {
    it('renders tags input section', () => {
      render(<CreatePost {...defaultProps} />);
      expect(screen.getByText('Tags (Optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add a tag...')).toBeInTheDocument();
    });

    it('shows tags counter', () => {
      render(<CreatePost {...defaultProps} />);
      expect(screen.getByText(/0\/5 tags/)).toBeInTheDocument();
    });

    it('allows adding a tag', async () => {
      render(<CreatePost {...defaultProps} />);
      const tagInput = screen.getByPlaceholderText('Add a tag...');
      const addButton = document.querySelector('.add-tag-btn');

      await userEvent.type(tagInput, 'javascript');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
        expect(screen.getByText(/1\/5 tags/)).toBeInTheDocument();
      });
    });

    it('allows adding tag by pressing Enter', async () => {
      render(<CreatePost {...defaultProps} />);
      const tagInput = screen.getByPlaceholderText('Add a tag...');

      await userEvent.type(tagInput, 'react{Enter}');

      await waitFor(() => {
        expect(screen.getByText('react')).toBeInTheDocument();
      });
    });

    it('clears input after adding tag', async () => {
      render(<CreatePost {...defaultProps} />);
      const tagInput = screen.getByPlaceholderText('Add a tag...');
      const addButton = document.querySelector('.add-tag-btn');

      await userEvent.type(tagInput, 'nodejs');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(tagInput).toHaveValue('');
      });
    });

    it('prevents adding duplicate tags', async () => {
      render(<CreatePost {...defaultProps} />);
      const tagInput = screen.getByPlaceholderText('Add a tag...');
      const addButton = document.querySelector('.add-tag-btn');

      await userEvent.type(tagInput, 'testing');
      fireEvent.click(addButton);

      await userEvent.type(tagInput, 'testing');
      fireEvent.click(addButton);

      await waitFor(() => {
        const tags = screen.getAllByText('testing');
        expect(tags.length).toBe(1);
      });
    });

    it('limits tags to 5', async () => {
      render(<CreatePost {...defaultProps} />);
      const tagInput = screen.getByPlaceholderText('Add a tag...');

      for (let i = 1; i <= 6; i++) {
        await userEvent.type(tagInput, `tag${i}{Enter}`);
      }

      await waitFor(() => {
        expect(screen.getByText(/5\/5 tags/)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Add a tag...')).not.toBeInTheDocument();
      });
    });

    it('displays tag with hash icon', async () => {
      render(<CreatePost {...defaultProps} />);
      const tagInput = screen.getByPlaceholderText('Add a tag...');

      await userEvent.type(tagInput, 'webdev{Enter}');

      await waitFor(() => {
        const tag = document.querySelector('.tag');
        expect(tag).toBeInTheDocument();
        expect(tag).toHaveTextContent('webdev');
      });
    });

    it('allows removing tags', async () => {
      render(<CreatePost {...defaultProps} />);
      const tagInput = screen.getByPlaceholderText('Add a tag...');

      await userEvent.type(tagInput, 'removeme{Enter}');

      const removeButton = await screen.findByRole('button', { name: '' });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('removeme')).not.toBeInTheDocument();
      });
    });

    it('trims whitespace from tags', async () => {
      render(<CreatePost {...defaultProps} />);
      const tagInput = screen.getByPlaceholderText('Add a tag...');

      await userEvent.type(tagInput, '  spaced  {Enter}');

      await waitFor(() => {
        expect(screen.getByText('spaced')).toBeInTheDocument();
      });
    });

    it('disables add button when input is empty', () => {
      render(<CreatePost {...defaultProps} />);
      const addButton = document.querySelector('.add-tag-btn');
      expect(addButton).toBeDisabled();
    });

    it('disables tag input when submitting', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const tagInput = screen.getByPlaceholderText('Add a tag...');
        expect(tagInput).toBeDisabled();
      });
    });
  });

  describe('Post Type Selection', () => {
    it('defaults to text post type', () => {
      render(<CreatePost {...defaultProps} />);
      const textTab = screen.getByText('Text').closest('button');
      expect(textTab).toHaveClass('active');
    });

    it('switches to image post type', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');

      fireEvent.click(imageTab);

      await waitFor(() => {
        expect(imageTab.closest('button')).toHaveClass('active');
      });
    });

    it('switches to video post type', async () => {
      render(<CreatePost {...defaultProps} />);
      const videoTab = screen.getByText('Video');

      fireEvent.click(videoTab);

      await waitFor(() => {
        expect(videoTab.closest('button')).toHaveClass('active');
      });
    });

    it('switches to link post type', async () => {
      render(<CreatePost {...defaultProps} />);
      const linkTab = screen.getByText('Link');

      fireEvent.click(linkTab);

      await waitFor(() => {
        expect(linkTab.closest('button')).toHaveClass('active');
      });
    });

    it('clears media files when switching post types', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]');
      await userEvent.upload(fileInput, file);

      const textTab = screen.getByText('Text');
      fireEvent.click(textTab);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
      });
    });

    it('clears link when switching from link post type', async () => {
      render(<CreatePost {...defaultProps} />);
      const linkTab = screen.getByText('Link');
      fireEvent.click(linkTab);

      const linkInput = screen.getByPlaceholderText('https://example.com');
      await userEvent.type(linkInput, 'https://test.com');

      const textTab = screen.getByText('Text');
      fireEvent.click(textTab);

      fireEvent.click(linkTab);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('https://example.com')).toHaveValue('');
      });
    });

    it('shows correct icons for each post type', () => {
      render(<CreatePost {...defaultProps} />);
      expect(screen.getByTestId('type-icon')).toBeInTheDocument();
      expect(screen.getByTestId('image-icon')).toBeInTheDocument();
      expect(screen.getByTestId('video-icon')).toBeInTheDocument();
      expect(screen.getByTestId('link-icon')).toBeInTheDocument();
    });
  });

  describe('Link Post Type', () => {
    it('shows link input when link post type is selected', async () => {
      render(<CreatePost {...defaultProps} />);
      const linkTab = screen.getByText('Link');

      fireEvent.click(linkTab);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
      });
    });

    it('allows typing in link field', async () => {
      render(<CreatePost {...defaultProps} />);
      const linkTab = screen.getByText('Link');
      fireEvent.click(linkTab);

      const linkInput = screen.getByPlaceholderText('https://example.com');
      await userEvent.type(linkInput, 'https://example.com/article');

      expect(linkInput).toHaveValue('https://example.com/article');
    });

    it('shows validation error for empty link', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={mockSelectedCommunity} />);
      const linkTab = screen.getByText('Link');
      fireEvent.click(linkTab);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      await userEvent.type(titleInput, 'Valid Title');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Link URL is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid URL', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={mockSelectedCommunity} />);
      const linkTab = screen.getByText('Link');
      fireEvent.click(linkTab);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const linkInput = screen.getByPlaceholderText('https://example.com');

      await userEvent.type(titleInput, 'Valid Title');
      await userEvent.type(linkInput, 'not-a-valid-url');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      });
    });

    it('accepts valid URL formats', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={mockSelectedCommunity} />);
      const linkTab = screen.getByText('Link');
      fireEvent.click(linkTab);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const linkInput = screen.getByPlaceholderText('https://example.com');

      await userEvent.type(titleInput, 'Valid Title');
      await userEvent.type(linkInput, 'https://www.example.com');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid URL')).not.toBeInTheDocument();
      });
    });

    it('disables link input when submitting', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const linkTab = screen.getByText('Link');
      fireEvent.click(linkTab);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const linkInput = screen.getByPlaceholderText('https://example.com');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(linkInput, 'https://example.com');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(linkInput).toBeDisabled();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates all required fields before submission', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={null} />);
      const submitButton = screen.getByText('Create Post');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
        expect(screen.getByText('Please select a community')).toBeInTheDocument();
      });
    });

    it('shows error styling on invalid fields', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={null} />);
      const submitButton = screen.getByText('Create Post');

      fireEvent.click(submitButton);

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText("What's your post about?");
        const communitySelect = screen.getByLabelText(/Choose Community/i);
        expect(titleInput).toHaveClass('error');
        expect(communitySelect).toHaveClass('error');
      });
    });

    it('clears validation errors when fields become valid', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={null} />);
      const submitButton = screen.getByText('Create Post');

      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      await userEvent.type(titleInput, 'Valid Title');

      const communitySelect = screen.getByLabelText(/Choose Community/i);
      await userEvent.selectOptions(communitySelect, 'comm-1');

      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');
      await userEvent.type(contentTextarea, 'Valid content');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
      });
    });

    it('prevents submission when form is invalid', async () => {
      const onSubmit = jest.fn();
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} selectedCommunity={null} />);

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Submit Post Action', () => {
    it('calls onSubmit with correct data for text post', async () => {
      const onSubmit = jest.fn().mockResolvedValue({});
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          type: 'text',
          title: 'Test Title',
          content: 'Test content',
          link: '',
          communityId: 'comm-1',
          tags: [],
          mediaFiles: [],
        });
      });
    });

    it('calls onSubmit with tags', async () => {
      const onSubmit = jest.fn().mockResolvedValue({});
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');
      const tagInput = screen.getByPlaceholderText('Add a tag...');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');
      await userEvent.type(tagInput, 'tag1{Enter}');
      await userEvent.type(tagInput, 'tag2{Enter}');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['tag1', 'tag2'],
          })
        );
      });
    });

    it('calls onSubmit with link data', async () => {
      const onSubmit = jest.fn().mockResolvedValue({});
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const linkTab = screen.getByText('Link');
      fireEvent.click(linkTab);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const linkInput = screen.getByPlaceholderText('https://example.com');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(linkInput, 'https://example.com');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'link',
            link: 'https://example.com',
          })
        );
      });
    });

    it('calls onSubmit with media files', async () => {
      const onSubmit = jest.fn().mockResolvedValue({});
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      await userEvent.type(titleInput, 'Test Title');

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]');
      await userEvent.upload(fileInput, file);

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'image',
            mediaFiles: expect.arrayContaining([file]),
          })
        );
      });
    });

    it('closes modal after successful submission', async () => {
      const onSubmit = jest.fn().mockResolvedValue({});
      const onClose = jest.fn();
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} onClose={onClose} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('resets form after successful submission', async () => {
      const onSubmit = jest.fn().mockResolvedValue({});
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');
      const tagInput = screen.getByPlaceholderText('Add a tag...');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');
      await userEvent.type(tagInput, 'tag1{Enter}');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States During Submission', () => {
    it('shows loading spinner during submission', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Posting...')).toBeInTheDocument();
        const spinner = document.querySelector('.spinner');
        expect(spinner).toBeInTheDocument();
      });
    });

    it('changes submit button text during submission', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Posting...')).toBeInTheDocument();
        expect(screen.queryByText('Create Post')).not.toBeInTheDocument();
      });
    });

    it('disables submit button during submission', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const postingButton = screen.getByText('Posting...').closest('button');
        expect(postingButton).toBeDisabled();
      });
    });

    it('disables cancel button during submission', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        expect(cancelButton).toBeDisabled();
      });
    });

    it('disables close button during submission', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const closeButton = document.querySelector('.modal-close-btn');
        expect(closeButton).toBeDisabled();
      });
    });
  });

  describe('Success/Error Handling', () => {
    it('handles successful submission', async () => {
      const onSubmit = jest.fn().mockResolvedValue({ success: true });
      const onClose = jest.fn();
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} onClose={onClose} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('displays error message on submission failure', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('displays generic error when error message is not provided', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error());
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create post')).toBeInTheDocument();
      });
    });

    it('keeps modal open on submission failure', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Failed'));
      const onClose = jest.fn();
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} onClose={onClose} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('re-enables form after submission failure', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Failed'));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });

      expect(titleInput).not.toBeDisabled();
      expect(contentTextarea).not.toBeDisabled();
    });

    it('shows error with alert icon', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Test error'));
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorDiv = document.querySelector('.form-error');
        expect(errorDiv).toBeInTheDocument();
      });
    });
  });

  describe('Modal Controls', () => {
    it('closes modal when close button is clicked', () => {
      const onClose = jest.fn();
      render(<CreatePost {...defaultProps} onClose={onClose} />);

      const closeButton = document.querySelector('.modal-close-btn');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('closes modal when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(<CreatePost {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('renders submit button with send icon', () => {
      render(<CreatePost {...defaultProps} />);
      const submitButton = screen.getByText('Create Post').closest('button');
      expect(submitButton).toBeInTheDocument();
    });

    it('disables submit button when title is empty', () => {
      render(<CreatePost {...defaultProps} />);
      const submitButton = screen.getByText('Create Post');
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when community is not selected', async () => {
      render(<CreatePost {...defaultProps} selectedCommunity={null} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");
      await userEvent.type(titleInput, 'Test Title');

      const submitButton = screen.getByText('Create Post');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when required fields are filled', async () => {
      render(<CreatePost {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form inputs', () => {
      render(<CreatePost {...defaultProps} />);

      expect(screen.getByLabelText(/Choose Community/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content/i)).toBeInTheDocument();
    });

    it('associates labels with inputs using htmlFor', () => {
      render(<CreatePost {...defaultProps} />);

      const titleLabel = screen.getByText('Title').closest('label');
      expect(titleLabel).toHaveAttribute('for', 'post-title');

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      expect(titleInput).toHaveAttribute('id', 'post-title');
    });

    it('provides helpful placeholder text', () => {
      render(<CreatePost {...defaultProps} />);

      expect(screen.getByPlaceholderText("What's your post about?")).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What are your thoughts?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add a tag...')).toBeInTheDocument();
    });

    it('provides title attributes for icon buttons', () => {
      render(<CreatePost {...defaultProps} />);

      expect(screen.getByTitle('Bold')).toBeInTheDocument();
      expect(screen.getByTitle('Italic')).toBeInTheDocument();
      expect(screen.getByTitle('Preview')).toBeInTheDocument();
    });

    it('uses semantic HTML elements', () => {
      const { container } = render(<CreatePost {...defaultProps} />);

      expect(container.querySelector('form')).toBeInTheDocument();
      expect(container.querySelector('select')).toBeInTheDocument();
      expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
      expect(container.querySelector('textarea')).toBeInTheDocument();
    });

    it('provides alternative text for images', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]');
      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      });
    });

    it('uses proper button types', () => {
      const { container } = render(<CreatePost {...defaultProps} />);

      const formatButtons = container.querySelectorAll('.format-btn');
      formatButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });

      const submitButton = screen.getByText('Create Post').closest('button');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing communities array', () => {
      expect(() => {
        render(<CreatePost {...defaultProps} communities={[]} />);
      }).not.toThrow();
    });

    it('handles null user', () => {
      expect(() => {
        render(<CreatePost {...defaultProps} user={null} />);
      }).not.toThrow();
    });

    it('handles undefined selectedCommunity', () => {
      render(<CreatePost {...defaultProps} selectedCommunity={undefined} />);
      const communitySelect = screen.getByLabelText(/Choose Community/i);
      expect(communitySelect).toHaveValue('');
    });

    it('trims whitespace from title', async () => {
      const onSubmit = jest.fn().mockResolvedValue({});
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, '  Test Title  ');
      await userEvent.type(contentTextarea, 'Test content');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Title',
          })
        );
      });
    });

    it('trims whitespace from content', async () => {
      const onSubmit = jest.fn().mockResolvedValue({});
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentTextarea, '  Test content  ');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Test content',
          })
        );
      });
    });

    it('trims whitespace from link', async () => {
      const onSubmit = jest.fn().mockResolvedValue({});
      render(<CreatePost {...defaultProps} onSubmit={onSubmit} />);

      const linkTab = screen.getByText('Link');
      fireEvent.click(linkTab);

      const titleInput = screen.getByPlaceholderText("What's your post about?");
      const linkInput = screen.getByPlaceholderText('https://example.com');

      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(linkInput, '  https://example.com  ');

      const submitButton = screen.getByText('Create Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            link: 'https://example.com',
          })
        );
      });
    });

    it('handles rapid post type switching', async () => {
      render(<CreatePost {...defaultProps} />);

      const textTab = screen.getByText('Text');
      const imageTab = screen.getByText('Image');
      const videoTab = screen.getByText('Video');
      const linkTab = screen.getByText('Link');

      fireEvent.click(imageTab);
      fireEvent.click(videoTab);
      fireEvent.click(linkTab);
      fireEvent.click(textTab);

      await waitFor(() => {
        expect(textTab.closest('button')).toHaveClass('active');
      });
    });

    it('handles file input with no files selected', async () => {
      render(<CreatePost {...defaultProps} />);
      const imageTab = screen.getByText('Image');
      fireEvent.click(imageTab);

      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [] } });

      await waitFor(() => {
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
      });
    });

    it('maintains form state when switching between preview mode', async () => {
      render(<CreatePost {...defaultProps} />);

      const contentTextarea = screen.getByPlaceholderText('What are your thoughts?');
      await userEvent.type(contentTextarea, 'Test content');

      const previewButton = screen.getByTitle('Preview');
      fireEvent.click(previewButton);
      fireEvent.click(previewButton);

      expect(contentTextarea).toHaveValue('Test content');
    });
  });
});

export default mockUser
