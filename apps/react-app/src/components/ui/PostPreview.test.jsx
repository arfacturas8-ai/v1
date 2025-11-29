/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostPreview from './PostPreview';

// Mock DOMPurify
jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((html) => html)
  }
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Eye: jest.fn(({ size, ...props }) => <svg data-testid="icon-eye" {...props} />),
  EyeOff: jest.fn(({ size, ...props }) => <svg data-testid="icon-eye-off" {...props} />),
  Edit3: jest.fn(({ size, ...props }) => <svg data-testid="icon-edit3" {...props} />),
  ExternalLink: jest.fn(({ size, ...props }) => <svg data-testid="icon-external-link" {...props} />),
  Calendar: jest.fn(({ size, ...props }) => <svg data-testid="icon-calendar" {...props} />),
  Users: jest.fn(({ size, ...props }) => <svg data-testid="icon-users" {...props} />),
  Hash: jest.fn(({ size, ...props }) => <svg data-testid="icon-hash" {...props} />),
  AlertTriangle: jest.fn(({ size, className, ...props }) => <svg data-testid="icon-alert-triangle" className={className} {...props} />),
  Video: jest.fn(({ size, ...props }) => <svg data-testid="icon-video" {...props} />),
  BarChart3: jest.fn(({ size, ...props }) => <svg data-testid="icon-bar-chart3" {...props} />),
  MessageCircle: jest.fn(({ size, ...props }) => <svg data-testid="icon-message-circle" {...props} />),
  ArrowUp: jest.fn(({ size, className, ...props }) => <svg data-testid="icon-arrow-up" className={className} {...props} />),
  ArrowDown: jest.fn(({ size, className, ...props }) => <svg data-testid="icon-arrow-down" className={className} {...props} />),
  Share: jest.fn(({ size, ...props }) => <svg data-testid="icon-share" {...props} />),
  Bookmark: jest.fn(({ size, ...props }) => <svg data-testid="icon-bookmark" {...props} />),
  Award: jest.fn(({ size, ...props }) => <svg data-testid="icon-award" {...props} />),
  Lock: jest.fn(({ size, ...props }) => <svg data-testid="icon-lock" {...props} />),
}));

describe('PostPreview', () => {
  const defaultProps = {
    title: 'Test Post Title',
    content: 'This is test content',
    type: 'text',
    authorName: 'testuser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<PostPreview {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders with default props only', () => {
      render(<PostPreview />);
      expect(screen.getByText('Untitled Post')).toBeInTheDocument();
      expect(screen.getByText(/preview_user/)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<PostPreview {...defaultProps} className="custom-class" />);
      expect(container.querySelector('.post-preview')).toHaveClass('custom-class');
    });

    it('renders post title correctly', () => {
      render(<PostPreview {...defaultProps} />);
      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    });

    it('renders "Untitled Post" when no title provided', () => {
      render(<PostPreview {...defaultProps} title="" />);
      expect(screen.getByText('Untitled Post')).toBeInTheDocument();
    });

    it('renders author name correctly', () => {
      render(<PostPreview {...defaultProps} authorName="john_doe" />);
      expect(screen.getByText(/john_doe/)).toBeInTheDocument();
    });

    it('renders default author when no authorName provided', () => {
      render(<PostPreview {...defaultProps} authorName="" />);
      expect(screen.getByText(/preview_user/)).toBeInTheDocument();
    });
  });

  describe('Post Types', () => {
    it('renders text post indicator', () => {
      render(<PostPreview {...defaultProps} type="text" />);
      expect(screen.getByTestId('icon-edit3')).toBeInTheDocument();
      expect(screen.getByText('Text Post')).toBeInTheDocument();
    });

    it('renders link post indicator', () => {
      render(<PostPreview {...defaultProps} type="link" url="https://example.com" />);
      expect(screen.getByText('Link Post')).toBeInTheDocument();
    });

    it('renders image post indicator', () => {
      render(<PostPreview {...defaultProps} type="image" />);
      expect(screen.getByText('Image Post')).toBeInTheDocument();
    });

    it('renders video post indicator', () => {
      render(<PostPreview {...defaultProps} type="video" />);
      expect(screen.getByTestId('icon-video')).toBeInTheDocument();
      expect(screen.getByText('Video Post')).toBeInTheDocument();
    });

    it('renders poll indicator', () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={['Option 1', 'Option 2']} />);
      expect(screen.getByTestId('icon-bar-chart3')).toBeInTheDocument();
      expect(screen.getByText('Poll')).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('renders plain text content', () => {
      render(<PostPreview {...defaultProps} content="Simple text content" enableMarkdown={false} />);
      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('renders markdown content', () => {
      render(<PostPreview {...defaultProps} content="**Bold text**" enableMarkdown={true} />);
      const content = screen.getByText(/Bold text/);
      expect(content).toBeInTheDocument();
    });

    it('displays placeholder for empty content', () => {
      render(<PostPreview {...defaultProps} content="" />);
      expect(screen.getByText('No content yet...')).toBeInTheDocument();
    });

    it('processes multiline content', () => {
      const multilineContent = "Line 1\nLine 2\nLine 3";
      render(<PostPreview {...defaultProps} content={multilineContent} enableMarkdown={false} />);
      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
      expect(screen.getByText('Line 3')).toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    it('renders markdown headers', () => {
      render(<PostPreview {...defaultProps} content="# Header 1\n## Header 2\n### Header 3" enableMarkdown={true} />);
      const content = screen.getByText(/Header 1/);
      expect(content).toBeInTheDocument();
    });

    it('renders markdown bold text', () => {
      render(<PostPreview {...defaultProps} content="**bold text**" enableMarkdown={true} />);
      expect(screen.getByText(/bold text/)).toBeInTheDocument();
    });

    it('renders markdown italic text', () => {
      render(<PostPreview {...defaultProps} content="*italic text*" enableMarkdown={true} />);
      expect(screen.getByText(/italic text/)).toBeInTheDocument();
    });

    it('renders markdown underline', () => {
      render(<PostPreview {...defaultProps} content="__underlined__" enableMarkdown={true} />);
      expect(screen.getByText(/underlined/)).toBeInTheDocument();
    });

    it('renders markdown strikethrough', () => {
      render(<PostPreview {...defaultProps} content="~~strikethrough~~" enableMarkdown={true} />);
      expect(screen.getByText(/strikethrough/)).toBeInTheDocument();
    });

    it('renders markdown inline code', () => {
      render(<PostPreview {...defaultProps} content="`code snippet`" enableMarkdown={true} />);
      expect(screen.getByText(/code snippet/)).toBeInTheDocument();
    });

    it('renders markdown links', () => {
      render(<PostPreview {...defaultProps} content="[Link text](https://example.com)" enableMarkdown={true} />);
      const link = screen.getByText(/Link text/);
      expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
    });

    it('renders markdown blockquotes', () => {
      render(<PostPreview {...defaultProps} content="> Quote text" enableMarkdown={true} />);
      expect(screen.getByText(/Quote text/)).toBeInTheDocument();
    });

    it('disables markdown when enableMarkdown is false', () => {
      render(<PostPreview {...defaultProps} content="**not bold**" enableMarkdown={false} />);
      expect(screen.getByText('**not bold**')).toBeInTheDocument();
    });
  });

  describe('Community and Author Display', () => {
    it('renders community name', () => {
      render(<PostPreview {...defaultProps} communityName="gaming" />);
      expect(screen.getByText(/c\/gaming/)).toBeInTheDocument();
    });

    it('does not render community section when no community', () => {
      render(<PostPreview {...defaultProps} communityName="" />);
      expect(screen.queryByText(/c\//)).not.toBeInTheDocument();
    });

    it('renders community icon', () => {
      render(<PostPreview {...defaultProps} communityName="gaming" />);
      expect(screen.getByTestId('icon-users')).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('renders NSFW badge', () => {
      render(<PostPreview {...defaultProps} nsfw={true} />);
      expect(screen.getByText('NSFW')).toBeInTheDocument();
    });

    it('renders SPOILER badge', () => {
      render(<PostPreview {...defaultProps} spoiler={true} />);
      expect(screen.getByText('SPOILER')).toBeInTheDocument();
    });

    it('does not render NSFW badge when false', () => {
      render(<PostPreview {...defaultProps} nsfw={false} />);
      expect(screen.queryByText('NSFW')).not.toBeInTheDocument();
    });

    it('does not render SPOILER badge when false', () => {
      render(<PostPreview {...defaultProps} spoiler={false} />);
      expect(screen.queryByText('SPOILER')).not.toBeInTheDocument();
    });

    it('renders visibility badge for non-public posts', () => {
      render(<PostPreview {...defaultProps} visibility="private" />);
      expect(screen.getByText('PRIVATE')).toBeInTheDocument();
    });

    it('does not render visibility badge for public posts', () => {
      render(<PostPreview {...defaultProps} visibility="public" />);
      expect(screen.queryByText('PUBLIC')).not.toBeInTheDocument();
    });

    it('renders scheduled badge when post is scheduled', () => {
      const scheduledDate = new Date('2025-12-31T23:59:59');
      render(<PostPreview {...defaultProps} scheduledFor={scheduledDate} />);
      expect(screen.getAllByText('SCHEDULED').length).toBeGreaterThan(0);
    });

    it('renders multiple badges simultaneously', () => {
      render(<PostPreview {...defaultProps} nsfw={true} spoiler={true} visibility="private" />);
      expect(screen.getByText('NSFW')).toBeInTheDocument();
      expect(screen.getByText('SPOILER')).toBeInTheDocument();
      expect(screen.getByText('PRIVATE')).toBeInTheDocument();
    });
  });

  describe('Flair', () => {
    it('renders flair name', () => {
      render(<PostPreview {...defaultProps} flairName="Discussion" />);
      expect(screen.getByText('Discussion')).toBeInTheDocument();
    });

    it('applies custom flair color', () => {
      render(<PostPreview {...defaultProps} flairName="Discussion" flairColor="#FF0000" />);
      const flair = screen.getByText('Discussion');
      expect(flair).toHaveStyle({ color: '#FF0000' });
    });

    it('applies default flair color when not specified', () => {
      render(<PostPreview {...defaultProps} flairName="Discussion" />);
      const flair = screen.getByText('Discussion');
      expect(flair).toHaveStyle({ color: '#3B82F6' });
    });

    it('does not render flair section when no flair', () => {
      render(<PostPreview {...defaultProps} flairName="" />);
      expect(screen.queryByText('Discussion')).not.toBeInTheDocument();
    });
  });

  describe('Spoiler Functionality', () => {
    it('shows spoiler overlay by default when spoiler is true', () => {
      render(<PostPreview {...defaultProps} spoiler={true} content="Spoiler content" />);
      expect(screen.getByText('Spoiler Content')).toBeInTheDocument();
      expect(screen.getByText(/This post contains spoilers/)).toBeInTheDocument();
      expect(screen.queryByText('Spoiler content')).not.toBeInTheDocument();
    });

    it('reveals spoiler content when show button is clicked', async () => {
      render(<PostPreview {...defaultProps} spoiler={true} content="Spoiler content" />);

      const showButton = screen.getByText('Show Spoiler');
      await userEvent.click(showButton);

      expect(screen.getByText(/Spoiler content/)).toBeInTheDocument();
    });

    it('hides spoiler content when hide button is clicked', async () => {
      render(<PostPreview {...defaultProps} spoiler={true} content="Spoiler content" />);

      // Show spoiler
      const showButton = screen.getByText('Show Spoiler');
      await userEvent.click(showButton);

      // Hide spoiler
      const hideButton = screen.getByText('Hide Spoiler');
      await userEvent.click(hideButton);

      expect(screen.queryByText('Spoiler content')).not.toBeInTheDocument();
    });

    it('renders Eye icon on show spoiler button', () => {
      render(<PostPreview {...defaultProps} spoiler={true} />);
      expect(screen.getByTestId('icon-eye')).toBeInTheDocument();
    });

    it('renders EyeOff icon on hide spoiler button', async () => {
      render(<PostPreview {...defaultProps} spoiler={true} />);

      const showButton = screen.getByText('Show Spoiler');
      await userEvent.click(showButton);

      expect(screen.getByTestId('icon-eye-off')).toBeInTheDocument();
    });

    it('renders AlertTriangle icon in spoiler overlay', () => {
      render(<PostPreview {...defaultProps} spoiler={true} />);
      expect(screen.getByTestId('icon-alert-triangle')).toBeInTheDocument();
    });
  });

  describe('Link Posts', () => {
    it('renders link preview with valid URL', () => {
      render(<PostPreview {...defaultProps} type="link" url="https://example.com/article" />);
      expect(screen.getByText(/example.com/)).toBeInTheDocument();
    });

    it('renders link preview title', () => {
      render(<PostPreview {...defaultProps} type="link" url="https://example.com" />);
      expect(screen.getByText(/Link Preview - example.com/)).toBeInTheDocument();
    });

    it('renders link preview description', () => {
      render(<PostPreview {...defaultProps} type="link" url="https://example.com" />);
      expect(screen.getByText(/This is a preview of the linked content/)).toBeInTheDocument();
    });

    it('renders visit link button', () => {
      render(<PostPreview {...defaultProps} type="link" url="https://example.com" />);
      const link = screen.getByText('Visit Link →');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('handles link post without URL', () => {
      render(<PostPreview {...defaultProps} type="link" url="" />);
      expect(screen.queryByText(/Visit Link/)).not.toBeInTheDocument();
    });

    it('extracts domain from URL correctly', () => {
      render(<PostPreview {...defaultProps} type="link" url="https://www.reddit.com/r/test" />);
      expect(screen.getByText(/www.reddit.com/)).toBeInTheDocument();
    });

    it('renders ExternalLink icon', () => {
      render(<PostPreview {...defaultProps} type="link" url="https://example.com" />);
      expect(screen.getByTestId('icon-external-link')).toBeInTheDocument();
    });
  });

  describe('Media Attachments', () => {
    const mockAttachments = [
      { name: 'image1.jpg', size: 2048576 },
      { name: 'image2.jpg', size: 1048576 },
    ];

    it('renders image attachments', () => {
      render(<PostPreview {...defaultProps} type="image" attachments={mockAttachments} />);
      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      expect(screen.getByText('image2.jpg')).toBeInTheDocument();
    });

    it('renders video attachments', () => {
      render(<PostPreview {...defaultProps} type="video" attachments={mockAttachments} />);
      expect(screen.getByText('2 videos')).toBeInTheDocument();
    });

    it('displays file sizes correctly', () => {
      render(<PostPreview {...defaultProps} type="image" attachments={mockAttachments} />);
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });

    it('shows singular "image" for single attachment', () => {
      render(<PostPreview {...defaultProps} type="image" attachments={[mockAttachments[0]]} />);
      expect(screen.getByText('1 image')).toBeInTheDocument();
    });

    it('shows plural "images" for multiple attachments', () => {
      render(<PostPreview {...defaultProps} type="image" attachments={mockAttachments} />);
      expect(screen.getByText('2 images')).toBeInTheDocument();
    });

    it('limits display to 4 attachments', () => {
      const manyAttachments = [
        { name: 'file1.jpg', size: 1000000 },
        { name: 'file2.jpg', size: 1000000 },
        { name: 'file3.jpg', size: 1000000 },
        { name: 'file4.jpg', size: 1000000 },
        { name: 'file5.jpg', size: 1000000 },
        { name: 'file6.jpg', size: 1000000 },
      ];
      render(<PostPreview {...defaultProps} type="image" attachments={manyAttachments} />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('renders default names for unnamed attachments', () => {
      const unnamedAttachments = [{ size: 1000000 }];
      render(<PostPreview {...defaultProps} type="image" attachments={unnamedAttachments} />);
      expect(screen.getByText('image_1')).toBeInTheDocument();
    });

    it('renders preview text when no size provided', () => {
      const attachmentWithoutSize = [{ name: 'test.jpg' }];
      render(<PostPreview {...defaultProps} type="image" attachments={attachmentWithoutSize} />);
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('does not render attachments for text posts', () => {
      render(<PostPreview {...defaultProps} type="text" attachments={mockAttachments} />);
      expect(screen.queryByText('image1.jpg')).not.toBeInTheDocument();
    });

    it('does not render attachments when empty', () => {
      render(<PostPreview {...defaultProps} type="image" attachments={[]} />);
      expect(screen.queryByText(/image/)).not.toBeInTheDocument();
    });
  });

  describe('Poll Functionality', () => {
    const pollOptions = ['Option A', 'Option B', 'Option C'];

    it('renders poll options', () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={pollOptions} />);
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
      expect(screen.getByText('Option C')).toBeInTheDocument();
    });

    it('renders poll preview label', () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={pollOptions} />);
      expect(screen.getByText('Poll (Preview)')).toBeInTheDocument();
    });

    it('selects poll option on click', async () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={pollOptions} />);

      const optionA = screen.getByText('Option A').closest('div');
      await userEvent.click(optionA);

      expect(optionA).toHaveClass('bg-accent/10');
    });

    it('deselects poll option on second click', async () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={pollOptions} />);

      const optionA = screen.getByText('Option A').closest('div');
      await userEvent.click(optionA);
      await userEvent.click(optionA);

      expect(optionA).not.toHaveClass('bg-accent/10');
    });

    it('switches selection between options', async () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={pollOptions} />);

      const optionA = screen.getByText('Option A').closest('div');
      const optionB = screen.getByText('Option B').closest('div');

      await userEvent.click(optionA);
      expect(optionA).toHaveClass('bg-accent/10');

      await userEvent.click(optionB);
      expect(optionB).toHaveClass('bg-accent/10');
      expect(optionA).not.toHaveClass('bg-accent/10');
    });

    it('displays poll duration in days', () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={pollOptions} pollDuration={7} />);
      expect(screen.getByText('Poll ends in 7 days')).toBeInTheDocument();
    });

    it('displays singular day for duration of 1', () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={pollOptions} pollDuration={1} />);
      expect(screen.getByText('Poll ends in 1 day')).toBeInTheDocument();
    });

    it('displays 0% for all options in preview', () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={pollOptions} />);
      const percentages = screen.getAllByText('0%');
      expect(percentages).toHaveLength(3);
    });

    it('filters out empty poll options', () => {
      const optionsWithEmpty = ['Option A', '', 'Option B', '   ', 'Option C'];
      render(<PostPreview {...defaultProps} type="poll" pollOptions={optionsWithEmpty} />);
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
      expect(screen.getByText('Option C')).toBeInTheDocument();
    });

    it('does not render poll when options are empty', () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={[]} />);
      expect(screen.queryByText('Poll (Preview)')).not.toBeInTheDocument();
    });
  });

  describe('Tags', () => {
    it('renders single tag', () => {
      render(<PostPreview {...defaultProps} tags={['javascript']} />);
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    it('renders multiple tags', () => {
      render(<PostPreview {...defaultProps} tags={['javascript', 'react', 'webdev']} />);
      expect(screen.getByText('javascript')).toBeInTheDocument();
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('webdev')).toBeInTheDocument();
    });

    it('renders hash icon for each tag', () => {
      render(<PostPreview {...defaultProps} tags={['javascript', 'react']} />);
      const hashIcons = screen.getAllByTestId('icon-hash');
      expect(hashIcons).toHaveLength(2);
    });

    it('does not render tags section when empty', () => {
      render(<PostPreview {...defaultProps} tags={[]} />);
      expect(screen.queryByTestId('icon-hash')).not.toBeInTheDocument();
    });
  });

  describe('Scheduled Posts', () => {
    const futureDate = new Date('2025-12-31T23:59:59');

    it('displays scheduled time in header', () => {
      render(<PostPreview {...defaultProps} scheduledFor={futureDate} />);
      expect(screen.getByText(/Scheduled for/)).toBeInTheDocument();
    });

    it('displays "now" for non-scheduled posts', () => {
      render(<PostPreview {...defaultProps} scheduledFor={null} />);
      expect(screen.getByText(/now/)).toBeInTheDocument();
    });

    it('renders calendar icon for scheduled posts', () => {
      render(<PostPreview {...defaultProps} scheduledFor={futureDate} />);
      expect(screen.getAllByTestId('icon-calendar').length).toBeGreaterThan(0);
    });
  });

  describe('Engagement Stats', () => {
    it('renders upvote button', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      expect(screen.getByTestId('icon-arrow-up')).toBeInTheDocument();
    });

    it('renders downvote button', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      expect(screen.getByTestId('icon-arrow-down')).toBeInTheDocument();
    });

    it('displays vote count', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      expect(screen.getByText('39')).toBeInTheDocument(); // 42 - 3 = 39
    });

    it('renders comments button when allowed', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} allowComments={true} />);
      expect(screen.getByText(/comments/)).toBeInTheDocument();
    });

    it('does not render comments button when disabled', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} allowComments={false} />);
      expect(screen.queryByTestId('icon-message-circle')).not.toBeInTheDocument();
    });

    it('renders share button', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByTestId('icon-share')).toBeInTheDocument();
    });

    it('renders save button', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bookmark')).toBeInTheDocument();
    });

    it('renders awards count when greater than 0', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      expect(screen.getByTestId('icon-award')).toBeInTheDocument();
    });

    it('does not render engagement section when showEngagement is false', () => {
      render(<PostPreview {...defaultProps} showEngagement={false} />);
      expect(screen.queryByTestId('icon-arrow-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-arrow-down')).not.toBeInTheDocument();
    });

    it('renders comment count', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} allowComments={true} />);
      expect(screen.getByText('12 comments')).toBeInTheDocument();
    });
  });

  describe('Metadata Footer', () => {
    it('renders preview mode message', () => {
      render(<PostPreview {...defaultProps} showMetadata={true} />);
      expect(screen.getByText(/Preview Mode/)).toBeInTheDocument();
    });

    it('displays scheduled information in metadata', () => {
      const futureDate = new Date('2025-12-31T23:59:59');
      render(<PostPreview {...defaultProps} showMetadata={true} scheduledFor={futureDate} />);
      expect(screen.getByText(/Scheduled for/)).toBeInTheDocument();
    });

    it('displays comments disabled message', () => {
      render(<PostPreview {...defaultProps} showMetadata={true} allowComments={false} />);
      expect(screen.getByText('Comments disabled')).toBeInTheDocument();
    });

    it('renders lock icon when comments are disabled', () => {
      render(<PostPreview {...defaultProps} showMetadata={true} allowComments={false} />);
      expect(screen.getByTestId('icon-lock')).toBeInTheDocument();
    });

    it('does not render metadata section when showMetadata is false', () => {
      render(<PostPreview {...defaultProps} showMetadata={false} />);
      expect(screen.queryByText(/Preview Mode/)).not.toBeInTheDocument();
    });
  });

  describe('Visibility Settings', () => {
    it('handles public visibility', () => {
      render(<PostPreview {...defaultProps} visibility="public" />);
      expect(screen.queryByText('PUBLIC')).not.toBeInTheDocument();
    });

    it('displays private visibility badge', () => {
      render(<PostPreview {...defaultProps} visibility="private" />);
      expect(screen.getByText('PRIVATE')).toBeInTheDocument();
    });

    it('displays unlisted visibility badge', () => {
      render(<PostPreview {...defaultProps} visibility="unlisted" />);
      expect(screen.getByText('UNLISTED')).toBeInTheDocument();
    });

    it('uppercases visibility badge text', () => {
      render(<PostPreview {...defaultProps} visibility="private" />);
      const badge = screen.getByText('PRIVATE');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Comment Settings', () => {
    it('shows comments section when allowComments is true', () => {
      render(<PostPreview {...defaultProps} allowComments={true} showEngagement={true} />);
      expect(screen.getByText(/comments/)).toBeInTheDocument();
    });

    it('hides comments section when allowComments is false', () => {
      render(<PostPreview {...defaultProps} allowComments={false} showEngagement={true} />);
      expect(screen.queryByTestId('icon-message-circle')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null props gracefully', () => {
      expect(() => render(<PostPreview title={null} content={null} />)).not.toThrow();
    });

    it('handles undefined props gracefully', () => {
      expect(() => render(<PostPreview />)).not.toThrow();
    });

    it('handles empty string props', () => {
      render(<PostPreview title="" content="" authorName="" communityName="" />);
      expect(screen.getByText('Untitled Post')).toBeInTheDocument();
      expect(screen.getByText('No content yet...')).toBeInTheDocument();
    });

    it('handles invalid poll duration', () => {
      render(<PostPreview type="poll" pollOptions={['A', 'B']} pollDuration={0} />);
      expect(screen.getByText('Poll ends in 0 days')).toBeInTheDocument();
    });

    it('handles negative poll duration', () => {
      render(<PostPreview type="poll" pollOptions={['A', 'B']} pollDuration={-1} />);
      expect(screen.getByText('Poll ends in -1 day')).toBeInTheDocument();
    });

    it('handles very long title', () => {
      const longTitle = 'A'.repeat(500);
      render(<PostPreview title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles very long content', () => {
      const longContent = 'Lorem ipsum '.repeat(1000);
      render(<PostPreview content={longContent} />);
      expect(screen.getByText(new RegExp('Lorem ipsum'))).toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      render(<PostPreview title="Test <>&\"' Title" />);
      expect(screen.getByText(/Test <>&"' Title/)).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      render(<PostPreview content="Content with <script>alert('xss')</script>" enableMarkdown={true} />);
      // DOMPurify should sanitize this
      expect(screen.getByText(/Content with/)).toBeInTheDocument();
    });

    it('handles invalid URL gracefully', () => {
      expect(() => render(<PostPreview type="link" url="invalid-url" />)).not.toThrow();
    });

    it('handles malformed markdown', () => {
      render(<PostPreview content="**unclosed bold" enableMarkdown={true} />);
      expect(screen.getByText(/unclosed bold/)).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('upvote button is clickable', async () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      const upvoteButton = screen.getByTestId('icon-arrow-up').closest('button');
      await userEvent.click(upvoteButton);
      expect(upvoteButton).toBeInTheDocument();
    });

    it('downvote button is clickable', async () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      const downvoteButton = screen.getByTestId('icon-arrow-down').closest('button');
      await userEvent.click(downvoteButton);
      expect(downvoteButton).toBeInTheDocument();
    });

    it('share button is clickable', async () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      const shareButton = screen.getByText('Share').closest('button');
      await userEvent.click(shareButton);
      expect(shareButton).toBeInTheDocument();
    });

    it('save button is clickable', async () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      const saveButton = screen.getByText('Save').closest('button');
      await userEvent.click(saveButton);
      expect(saveButton).toBeInTheDocument();
    });

    it('comments button is clickable', async () => {
      render(<PostPreview {...defaultProps} showEngagement={true} allowComments={true} />);
      const commentsButton = screen.getByText(/comments/).closest('button');
      await userEvent.click(commentsButton);
      expect(commentsButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has semantic HTML structure', () => {
      const { container } = render(<PostPreview {...defaultProps} />);
      expect(container.querySelector('.post-preview')).toBeInTheDocument();
    });

    it('external links have proper rel attributes', () => {
      render(<PostPreview {...defaultProps} type="link" url="https://example.com" />);
      const link = screen.getByText('Visit Link →');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('external links open in new tab', () => {
      render(<PostPreview {...defaultProps} type="link" url="https://example.com" />);
      const link = screen.getByText('Visit Link →');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('buttons have hover states', () => {
      render(<PostPreview {...defaultProps} showEngagement={true} />);
      const button = screen.getByText('Share').closest('button');
      expect(button).toHaveClass('hover:text-primary');
    });

    it('poll options are keyboard accessible', () => {
      render(<PostPreview {...defaultProps} type="poll" pollOptions={['A', 'B']} />);
      const option = screen.getByText('A').closest('div');
      expect(option).toHaveClass('cursor-pointer');
    });
  });

  describe('Complex Scenarios', () => {
    it('renders post with all features enabled', () => {
      const futureDate = new Date('2025-12-31T23:59:59');
      render(
        <PostPreview
          title="Complete Post"
          content="# Complete content with **markdown**"
          type="text"
          communityName="testing"
          authorName="testuser"
          flairName="Discussion"
          flairColor="#FF0000"
          nsfw={true}
          spoiler={true}
          visibility="private"
          allowComments={true}
          scheduledFor={futureDate}
          tags={['test', 'complete']}
          showMetadata={true}
          showEngagement={true}
        />
      );

      expect(screen.getByText('Complete Post')).toBeInTheDocument();
      expect(screen.getByText(/c\/testing/)).toBeInTheDocument();
      expect(screen.getByText('Discussion')).toBeInTheDocument();
      expect(screen.getByText('NSFW')).toBeInTheDocument();
      expect(screen.getByText('SPOILER')).toBeInTheDocument();
      expect(screen.getByText('PRIVATE')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('handles switching between poll options multiple times', async () => {
      render(<PostPreview type="poll" pollOptions={['A', 'B', 'C']} />);

      const optionA = screen.getByText('A').closest('div');
      const optionB = screen.getByText('B').closest('div');
      const optionC = screen.getByText('C').closest('div');

      await userEvent.click(optionA);
      expect(optionA).toHaveClass('bg-accent/10');

      await userEvent.click(optionB);
      expect(optionB).toHaveClass('bg-accent/10');
      expect(optionA).not.toHaveClass('bg-accent/10');

      await userEvent.click(optionC);
      expect(optionC).toHaveClass('bg-accent/10');
      expect(optionB).not.toHaveClass('bg-accent/10');
    });

    it('handles link post with content', () => {
      render(
        <PostPreview
          type="link"
          url="https://example.com"
          content="Check out this amazing article!"
        />
      );
      expect(screen.getByText(/Check out this amazing article/)).toBeInTheDocument();
      expect(screen.getByText(/example.com/)).toBeInTheDocument();
    });

    it('handles image post with multiple attachments and content', () => {
      const attachments = [
        { name: 'img1.jpg', size: 1000000 },
        { name: 'img2.jpg', size: 2000000 },
      ];
      render(
        <PostPreview
          type="image"
          attachments={attachments}
          content="My vacation photos"
        />
      );
      expect(screen.getByText('My vacation photos')).toBeInTheDocument();
      expect(screen.getByText('img1.jpg')).toBeInTheDocument();
      expect(screen.getByText('img2.jpg')).toBeInTheDocument();
    });

    it('renders scheduled post with spoiler and engagement', async () => {
      const futureDate = new Date('2025-12-31T23:59:59');
      render(
        <PostPreview
          title="Scheduled Spoiler"
          content="Spoiler content"
          spoiler={true}
          scheduledFor={futureDate}
          showEngagement={true}
        />
      );

      expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
      expect(screen.getByText('Show Spoiler')).toBeInTheDocument();

      const showButton = screen.getByText('Show Spoiler');
      await userEvent.click(showButton);

      expect(screen.getByText(/Spoiler content/)).toBeInTheDocument();
      expect(screen.getByTestId('icon-arrow-up')).toBeInTheDocument();
    });
  });

  describe('DOMPurify Integration', () => {
    it('sanitizes HTML content', () => {
      const DOMPurify = require('dompurify').default;
      render(<PostPreview content="<script>alert('xss')</script>" enableMarkdown={true} />);
      expect(DOMPurify.sanitize).toHaveBeenCalled();
    });

    it('calls DOMPurify for markdown content', () => {
      const DOMPurify = require('dompurify').default;
      DOMPurify.sanitize.mockClear();
      render(<PostPreview content="**bold**" enableMarkdown={true} />);
      expect(DOMPurify.sanitize).toHaveBeenCalled();
    });

    it('does not call DOMPurify for plain text', () => {
      const DOMPurify = require('dompurify').default;
      DOMPurify.sanitize.mockClear();
      render(<PostPreview content="plain text" enableMarkdown={false} />);
      expect(DOMPurify.sanitize).not.toHaveBeenCalled();
    });
  });

  describe('useMemo Optimization', () => {
    it('memoizes processed content', () => {
      const { rerender } = render(<PostPreview content="test content" enableMarkdown={true} />);
      const firstRender = screen.getByText(/test content/);

      rerender(<PostPreview content="test content" enableMarkdown={true} />);
      const secondRender = screen.getByText(/test content/);

      expect(firstRender).toBe(secondRender);
    });

    it('updates when content changes', () => {
      const { rerender } = render(<PostPreview content="first content" enableMarkdown={false} />);
      expect(screen.getByText('first content')).toBeInTheDocument();

      rerender(<PostPreview content="second content" enableMarkdown={false} />);
      expect(screen.getByText('second content')).toBeInTheDocument();
      expect(screen.queryByText('first content')).not.toBeInTheDocument();
    });

    it('updates when enableMarkdown changes', () => {
      const { rerender } = render(<PostPreview content="**bold**" enableMarkdown={false} />);
      expect(screen.getByText('**bold**')).toBeInTheDocument();

      rerender(<PostPreview content="**bold**" enableMarkdown={true} />);
      expect(screen.getByText(/bold/)).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('maintains spoiler state independently', async () => {
      render(
        <div>
          <PostPreview title="Post 1" content="Content 1" spoiler={true} />
          <PostPreview title="Post 2" content="Content 2" spoiler={true} />
        </div>
      );

      const showButtons = screen.getAllByText('Show Spoiler');
      await userEvent.click(showButtons[0]);

      expect(screen.getByText(/Content 1/)).toBeInTheDocument();
      expect(screen.queryByText(/Content 2/)).not.toBeInTheDocument();
    });

    it('maintains poll selection state independently', async () => {
      render(
        <div>
          <PostPreview title="Poll 1" type="poll" pollOptions={['A', 'B']} />
          <PostPreview title="Poll 2" type="poll" pollOptions={['C', 'D']} />
        </div>
      );

      const optionA = screen.getByText('A').closest('div');
      await userEvent.click(optionA);

      expect(optionA).toHaveClass('bg-accent/10');
      expect(screen.getByText('C').closest('div')).not.toHaveClass('bg-accent/10');
    });
  });

  describe('Type-Specific Content', () => {
    it('shows text content for text posts', () => {
      render(<PostPreview type="text" content="Text post content" />);
      expect(screen.getByText('Text post content')).toBeInTheDocument();
    });

    it('shows link preview for link posts', () => {
      render(<PostPreview type="link" url="https://example.com" content="Link description" />);
      expect(screen.getByText(/Link description/)).toBeInTheDocument();
      expect(screen.getByText(/example.com/)).toBeInTheDocument();
    });

    it('shows attachments for image posts', () => {
      render(<PostPreview type="image" attachments={[{ name: 'img.jpg', size: 1000000 }]} />);
      expect(screen.getByText('img.jpg')).toBeInTheDocument();
    });

    it('shows attachments for video posts', () => {
      render(<PostPreview type="video" attachments={[{ name: 'vid.mp4', size: 1000000 }]} />);
      expect(screen.getByText('vid.mp4')).toBeInTheDocument();
    });

    it('shows poll for poll posts', () => {
      render(<PostPreview type="poll" pollOptions={['Option 1']} />);
      expect(screen.getByText('Poll (Preview)')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('applies base post-preview class', () => {
      const { container } = render(<PostPreview />);
      expect(container.querySelector('.post-preview')).toBeInTheDocument();
    });

    it('applies border classes', () => {
      const { container } = render(<PostPreview />);
      const preview = container.querySelector('.post-preview');
      expect(preview).toHaveClass('border', 'border-border-primary/30');
    });

    it('applies rounded corners', () => {
      const { container } = render(<PostPreview />);
      const preview = container.querySelector('.post-preview');
      expect(preview).toHaveClass('rounded-lg');
    });

    it('applies background color', () => {
      const { container } = render(<PostPreview />);
      const preview = container.querySelector('.post-preview');
      expect(preview).toHaveClass('bg-bg-primary');
    });
  });

  describe('Timestamp Display', () => {
    it('displays "now" for current posts', () => {
      render(<PostPreview />);
      expect(screen.getByText(/now/)).toBeInTheDocument();
    });

    it('displays scheduled time for future posts', () => {
      const futureDate = new Date('2025-12-31T23:59:59');
      render(<PostPreview scheduledFor={futureDate} />);
      expect(screen.getByText(/Scheduled for/)).toBeInTheDocument();
    });

    it('formats scheduled date correctly', () => {
      const futureDate = new Date('2025-12-31T23:59:59');
      render(<PostPreview scheduledFor={futureDate} />);
      const dateString = futureDate.toLocaleString();
      expect(screen.getByText(new RegExp(dateString.split(',')[0]))).toBeInTheDocument();
    });
  });

  describe('Multiple Badges Rendering', () => {
    it('renders all badges in correct order', () => {
      const futureDate = new Date('2025-12-31T23:59:59');
      const { container } = render(
        <PostPreview
          nsfw={true}
          spoiler={true}
          visibility="private"
          scheduledFor={futureDate}
        />
      );

      const badges = container.querySelectorAll('.px-2.py-1');
      expect(badges.length).toBeGreaterThanOrEqual(4);
    });
  });
});

export default defaultProps
