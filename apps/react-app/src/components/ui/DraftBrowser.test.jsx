/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DraftBrowser from './DraftBrowser';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Clock: ({ size, className, ...props }) => <div data-testid="icon-clock" {...props} />,
  FileText: ({ size, ...props }) => <div data-testid="icon-filetext" {...props} />,
  Image: ({ size, ...props }) => <div data-testid="icon-image" {...props} />,
  Video: ({ size, ...props }) => <div data-testid="icon-video" {...props} />,
  BarChart3: ({ size, ...props }) => <div data-testid="icon-barchart3" {...props} />,
  Users: ({ size, ...props }) => <div data-testid="icon-users" {...props} />,
  Calendar: ({ size, ...props }) => <div data-testid="icon-calendar" {...props} />,
  Trash2: ({ size, ...props }) => <div data-testid="icon-trash2" {...props} />,
  Edit3: ({ size, ...props }) => <div data-testid="icon-edit3" {...props} />,
  Send: ({ size, ...props }) => <div data-testid="icon-send" {...props} />,
  Search: ({ size, className, ...props }) => <div data-testid="icon-search" {...props} />,
  Filter: ({ size, ...props }) => <div data-testid="icon-filter" {...props} />,
  SortAsc: ({ size, ...props }) => <div data-testid="icon-sortasc" {...props} />,
  SortDesc: ({ size, ...props }) => <div data-testid="icon-sortdesc" {...props} />,
}));

// Mock the useDraftManager hook
const mockLoadDrafts = jest.fn();
const mockDeleteDraft = jest.fn();
const mockClearAllDrafts = jest.fn();
const mockPublishDraft = jest.fn();
const mockGetDraftSummary = jest.fn();

jest.mock('../../hooks/useDraftManager', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    drafts: [],
    loadDrafts: mockLoadDrafts,
    deleteDraft: mockDeleteDraft,
    clearAllDrafts: mockClearAllDrafts,
    publishDraft: mockPublishDraft,
    getDraftSummary: mockGetDraftSummary,
  })),
}));

// Mock the useAuth context
const mockUser = {
  id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
};

jest.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
  })),
}));

const useDraftManager = require('../../hooks/useDraftManager').default;

describe('DraftBrowser', () => {
  const defaultProps = {
    onDraftSelect: jest.fn(),
    onDraftEdit: jest.fn(),
    onDraftPublish: jest.fn(),
    onClose: jest.fn(),
    showInModal: false,
  };

  const mockDrafts = [
    {
      id: 'draft1',
      title: 'Test Draft 1',
      content: 'This is the content of the first draft',
      type: 'text',
      lastModified: '2025-11-06T10:00:00Z',
      tags: ['javascript', 'testing'],
      communityId: null,
      attachments: [],
    },
    {
      id: 'draft2',
      title: 'Image Post Draft',
      content: 'A post with an image',
      type: 'image',
      lastModified: '2025-11-05T15:30:00Z',
      tags: ['photos'],
      communityId: 'community123',
      attachments: [{ id: 'img1', url: 'image.jpg' }],
    },
    {
      id: 'draft3',
      title: 'Video Draft',
      content: 'A video post with lots of content here to test truncation. '.repeat(10),
      type: 'video',
      lastModified: '2025-11-04T08:00:00Z',
      tags: [],
      communityId: null,
      attachments: [{ id: 'vid1', url: 'video.mp4' }],
    },
    {
      id: 'draft4',
      title: '',
      content: 'Untitled draft content',
      type: 'link',
      lastModified: '2025-11-03T12:00:00Z',
      tags: ['news', 'tech', 'web', 'programming'],
      communityId: null,
      attachments: [],
    },
    {
      id: 'draft5',
      title: 'Poll Draft',
      content: 'What is your favorite programming language?',
      type: 'poll',
      lastModified: '2025-11-02T09:00:00Z',
      tags: [],
      communityId: 'community456',
      attachments: [],
      scheduledDate: '2025-11-10T10:00:00Z',
    },
  ];

  const mockDraftSummary = {
    age: '2 hours ago',
    wordCount: 10,
    hasMedia: false,
    isScheduled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDraftSummary.mockReturnValue(mockDraftSummary);

    // Spy on window methods
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<DraftBrowser {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders with correct header structure', () => {
      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('Drafts')).toBeInTheDocument();
      expect(screen.getByText('0 drafts saved')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders filter button', () => {
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toBeInTheDocument();
    });

    it('renders empty state when no drafts', () => {
      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('No drafts yet')).toBeInTheDocument();
      expect(screen.getByText(/Start writing a post/i)).toBeInTheDocument();
    });

    it('displays correct draft count in header', () => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('5 drafts saved')).toBeInTheDocument();
    });

    it('displays singular "draft" when only one draft exists', () => {
      useDraftManager.mockReturnValue({
        drafts: [mockDrafts[0]],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('1 draft saved')).toBeInTheDocument();
    });

    it('does not render close button when not in modal', () => {
      render(<DraftBrowser {...defaultProps} showInModal={false} />);

      expect(screen.queryByText('✕')).not.toBeInTheDocument();
    });

    it('renders close button when in modal', () => {
      render(<DraftBrowser {...defaultProps} showInModal={true} />);

      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('applies correct container classes when in modal', () => {
      const { container } = render(<DraftBrowser {...defaultProps} showInModal={true} />);

      const mainDiv = container.firstChild;
      expect(mainDiv?.className).toContain('max-w-4xl');
      expect(mainDiv?.className).toContain('max-h-[80vh]');
    });

    it('applies correct container classes when not in modal', () => {
      const { container } = render(<DraftBrowser {...defaultProps} showInModal={false} />);

      const mainDiv = container.firstChild;
      expect(mainDiv?.className).toContain('border');
    });

    it('does not render footer when no drafts', () => {
      render(<DraftBrowser {...defaultProps} />);

      expect(screen.queryByText(/Showing/i)).not.toBeInTheDocument();
    });

    it('renders footer when drafts exist', () => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('Showing 5 of 5 drafts')).toBeInTheDocument();
      expect(screen.getByText('Clear All Drafts')).toBeInTheDocument();
    });
  });

  describe('Draft List Rendering', () => {
    beforeEach(() => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });
    });

    it('renders all drafts', () => {
      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('Test Draft 1')).toBeInTheDocument();
      expect(screen.getByText('Image Post Draft')).toBeInTheDocument();
      expect(screen.getByText('Video Draft')).toBeInTheDocument();
      expect(screen.getByText('Poll Draft')).toBeInTheDocument();
    });

    it('renders untitled draft with default title', () => {
      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('Untitled Draft')).toBeInTheDocument();
    });

    it('renders draft content with truncation', () => {
      render(<DraftBrowser {...defaultProps} />);

      const contentElements = screen.getAllByText(/This is the content/i);
      expect(contentElements.length).toBeGreaterThan(0);
    });

    it('truncates long content with ellipsis', () => {
      render(<DraftBrowser {...defaultProps} />);

      const videoContent = screen.getByText(/A video post with lots of content/i);
      expect(videoContent.textContent).toContain('...');
    });

    it('displays word count for drafts with content', () => {
      mockGetDraftSummary.mockReturnValue({
        ...mockDraftSummary,
        wordCount: 10,
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getAllByText('10 words').length).toBeGreaterThan(0);
    });

    it('displays draft age from summary', () => {
      mockGetDraftSummary.mockReturnValue({
        ...mockDraftSummary,
        age: '5 minutes ago',
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getAllByText('5 minutes ago').length).toBeGreaterThan(0);
    });

    it('displays media indicator when draft has attachments', () => {
      mockGetDraftSummary.mockReturnValue({
        ...mockDraftSummary,
        hasMedia: true,
      });

      render(<DraftBrowser {...defaultProps} />);

      const draft2 = screen.getByText('Image Post Draft').closest('div[class*="p-4"]');
      expect(within(draft2).getByText('1 file')).toBeInTheDocument();
    });

    it('displays correct file count for multiple attachments', () => {
      mockGetDraftSummary.mockReturnValue({
        ...mockDraftSummary,
        hasMedia: true,
      });

      const draftWithMultipleFiles = {
        ...mockDrafts[1],
        attachments: [
          { id: 'img1', url: 'image1.jpg' },
          { id: 'img2', url: 'image2.jpg' },
        ],
      };

      useDraftManager.mockReturnValue({
        drafts: [draftWithMultipleFiles],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('2 files')).toBeInTheDocument();
    });

    it('displays community indicator when draft has communityId', () => {
      render(<DraftBrowser {...defaultProps} />);

      const draft2 = screen.getByText('Image Post Draft').closest('div[class*="p-4"]');
      expect(within(draft2).getByText('Community')).toBeInTheDocument();
    });

    it('displays scheduled indicator when draft is scheduled', () => {
      mockGetDraftSummary.mockImplementation((draft) => ({
        ...mockDraftSummary,
        isScheduled: draft.id === 'draft5',
      }));

      render(<DraftBrowser {...defaultProps} />);

      const draft5 = screen.getByText('Poll Draft').closest('div[class*="p-4"]');
      expect(within(draft5).getByText('Scheduled')).toBeInTheDocument();
    });

    it('displays tags for drafts', () => {
      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('#javascript')).toBeInTheDocument();
      expect(screen.getByText('#testing')).toBeInTheDocument();
      expect(screen.getByText('#photos')).toBeInTheDocument();
    });

    it('limits displayed tags to 3 and shows "more" indicator', () => {
      render(<DraftBrowser {...defaultProps} />);

      const draft4 = screen.getByText('Untitled Draft').closest('div[class*="p-4"]');
      expect(within(draft4).getByText('#news')).toBeInTheDocument();
      expect(within(draft4).getByText('#tech')).toBeInTheDocument();
      expect(within(draft4).getByText('#web')).toBeInTheDocument();
      expect(within(draft4).getByText('+1 more')).toBeInTheDocument();
    });

    it('renders checkbox for each draft', () => {
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(5);
    });

    it('renders type icons for each draft', () => {
      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getAllByTestId('icon-filetext').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('icon-image').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('icon-video').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('icon-barchart3').length).toBeGreaterThan(0);
    });
  });

  describe('Lifecycle', () => {
    it('calls loadDrafts on mount', () => {
      render(<DraftBrowser {...defaultProps} />);

      expect(mockLoadDrafts).toHaveBeenCalledTimes(1);
    });

    it('calls getDraftSummary for each draft', () => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(mockGetDraftSummary).toHaveBeenCalledTimes(5);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });
    });

    it('filters drafts by title', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, 'Video');

      expect(screen.getByText('Video Draft')).toBeInTheDocument();
      expect(screen.queryByText('Test Draft 1')).not.toBeInTheDocument();
    });

    it('filters drafts by content', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, 'programming language');

      expect(screen.getByText('Poll Draft')).toBeInTheDocument();
      expect(screen.queryByText('Test Draft 1')).not.toBeInTheDocument();
    });

    it('filters drafts by tags', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, 'javascript');

      expect(screen.getByText('Test Draft 1')).toBeInTheDocument();
      expect(screen.queryByText('Poll Draft')).not.toBeInTheDocument();
    });

    it('is case insensitive', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, 'VIDEO');

      expect(screen.getByText('Video Draft')).toBeInTheDocument();
    });

    it('shows "no drafts found" message when search returns no results', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No drafts found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });

    it('updates footer count when search filters results', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, 'Draft 1');

      expect(screen.getByText('Showing 1 of 5 drafts')).toBeInTheDocument();
    });

    it('clears search when input is cleared', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, 'Video');

      expect(screen.queryByText('Test Draft 1')).not.toBeInTheDocument();

      await user.clear(searchInput);

      expect(screen.getByText('Test Draft 1')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });
    });

    it('toggles filter panel when filter button clicked', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });

      expect(screen.queryByText('All Types')).not.toBeInTheDocument();

      await user.click(filterButton);

      expect(screen.getByText('All Types')).toBeInTheDocument();
    });

    it('highlights filter button when panel is open', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });

      await user.click(filterButton);

      expect(filterButton.className).toContain('bg-rgb(var(--color-primary-500))/10');
    });

    it('filters by type - text', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'text');

      expect(screen.getByText('Test Draft 1')).toBeInTheDocument();
      expect(screen.queryByText('Video Draft')).not.toBeInTheDocument();
    });

    it('filters by type - image', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'image');

      expect(screen.getByText('Image Post Draft')).toBeInTheDocument();
      expect(screen.queryByText('Test Draft 1')).not.toBeInTheDocument();
    });

    it('filters by type - video', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'video');

      expect(screen.getByText('Video Draft')).toBeInTheDocument();
      expect(screen.queryByText('Test Draft 1')).not.toBeInTheDocument();
    });

    it('filters by type - link', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'link');

      expect(screen.getByText('Untitled Draft')).toBeInTheDocument();
      expect(screen.queryByText('Test Draft 1')).not.toBeInTheDocument();
    });

    it('filters by type - poll', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'poll');

      expect(screen.getByText('Poll Draft')).toBeInTheDocument();
      expect(screen.queryByText('Test Draft 1')).not.toBeInTheDocument();
    });

    it('combines search and type filter', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, 'Draft');

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'image');

      expect(screen.getByText('Image Post Draft')).toBeInTheDocument();
      expect(screen.queryByText('Test Draft 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Video Draft')).not.toBeInTheDocument();
    });

    it('shows no results when filter returns empty', async () => {
      useDraftManager.mockReturnValue({
        drafts: [mockDrafts[0]], // Only text draft
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'video');

      expect(screen.getByText('No drafts found')).toBeInTheDocument();
    });
  });

  describe('Sort Functionality', () => {
    beforeEach(() => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });
    });

    it('sorts by last modified by default (descending)', () => {
      render(<DraftBrowser {...defaultProps} />);

      const draftTitles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
      expect(draftTitles[0]).toBe('Test Draft 1'); // Most recent
    });

    it('sorts by title alphabetically', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const sortSelect = screen.getByDisplayValue('Last Modified');
      await user.selectOptions(sortSelect, 'title');

      const draftTitles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
      expect(draftTitles[0]).toBe('Image Post Draft');
    });

    it('sorts by type', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const sortSelect = screen.getByDisplayValue('Last Modified');
      await user.selectOptions(sortSelect, 'type');

      // Types should be sorted alphabetically: image, link, poll, text, video
      const draftContainers = screen.getAllByRole('heading', { level: 3 });
      expect(draftContainers.length).toBe(5);
    });

    it('sorts by word count', async () => {
      mockGetDraftSummary.mockImplementation((draft) => {
        const wordCounts = {
          draft1: { wordCount: 10 },
          draft2: { wordCount: 5 },
          draft3: { wordCount: 100 },
          draft4: { wordCount: 3 },
          draft5: { wordCount: 7 },
        };
        return {
          ...mockDraftSummary,
          ...wordCounts[draft.id],
        };
      });

      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const sortSelect = screen.getByDisplayValue('Last Modified');
      await user.selectOptions(sortSelect, 'wordCount');

      const draftTitles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
      expect(draftTitles[0]).toBe('Video Draft'); // Highest word count
    });

    it('toggles sort order to ascending', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const sortOrderButton = screen.getByRole('button', { name: /descending/i });
      await user.click(sortOrderButton);

      expect(screen.getByText('Ascending')).toBeInTheDocument();
    });

    it('toggles sort order back to descending', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const sortOrderButton = screen.getByRole('button', { name: /descending/i });
      await user.click(sortOrderButton);
      await user.click(sortOrderButton);

      expect(screen.getByText('Descending')).toBeInTheDocument();
    });

    it('displays sort ascending icon', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const sortOrderButton = screen.getByRole('button', { name: /descending/i });
      await user.click(sortOrderButton);

      expect(screen.getByTestId('icon-sortasc')).toBeInTheDocument();
    });

    it('displays sort descending icon', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      expect(screen.getByTestId('icon-sortdesc')).toBeInTheDocument();
    });

    it('applies ascending sort correctly', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const sortSelect = screen.getByDisplayValue('Last Modified');
      await user.selectOptions(sortSelect, 'title');

      const sortOrderButton = screen.getByRole('button', { name: /descending/i });
      await user.click(sortOrderButton);

      const draftTitles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
      expect(draftTitles[0]).toBe('Image Post Draft');
      expect(draftTitles[draftTitles.length - 1]).toBe('Video Draft');
    });
  });

  describe('Draft Selection', () => {
    beforeEach(() => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });
    });

    it('calls onDraftSelect when draft is clicked', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const draft = screen.getByText('Test Draft 1');
      await user.click(draft);

      expect(defaultProps.onDraftSelect).toHaveBeenCalledWith(mockDrafts[0]);
    });

    it('calls onClose when draft selected in modal', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} showInModal={true} />);

      const draft = screen.getByText('Test Draft 1');
      await user.click(draft);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('does not call onClose when draft selected outside modal', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} showInModal={false} />);

      const draft = screen.getByText('Test Draft 1');
      await user.click(draft);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('selects draft when checkbox is checked', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });

    it('deselects draft when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      expect(checkboxes[0]).toBeChecked();

      await user.click(checkboxes[0]);
      expect(checkboxes[0]).not.toBeChecked();
    });

    it('does not trigger draft select when clicking checkbox', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(defaultProps.onDraftSelect).not.toHaveBeenCalled();
    });

    it('highlights selected draft', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      const draftContainer = checkboxes[0].closest('div[class*="p-4"]');
      expect(draftContainer?.className).toContain('bg-accent/5');
    });

    it('shows bulk delete button when drafts are selected', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      expect(screen.queryByText(/Delete \(/)).not.toBeInTheDocument();

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(screen.getByText('Delete (1)')).toBeInTheDocument();
    });

    it('updates bulk delete count when multiple drafts selected', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      expect(screen.getByText('Delete (3)')).toBeInTheDocument();
    });

    it('allows selecting all drafts', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');

      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }

      expect(screen.getByText('Delete (5)')).toBeInTheDocument();
    });
  });

  describe('Bulk Delete', () => {
    beforeEach(() => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });
    });

    it('deletes selected drafts when bulk delete confirmed', async () => {
      mockDeleteDraft.mockResolvedValue(true);
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      const deleteButton = screen.getByText('Delete (2)');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteDraft).toHaveBeenCalledTimes(2);
        expect(mockDeleteDraft).toHaveBeenCalledWith('draft1');
        expect(mockDeleteDraft).toHaveBeenCalledWith('draft2');
      });
    });

    it('shows confirmation dialog for bulk delete', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      const deleteButton = screen.getByText('Delete (2)');
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete 2 drafts?'
      );
    });

    it('uses singular "draft" in confirmation for single selection', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      const deleteButton = screen.getByText('Delete (1)');
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete 1 draft?'
      );
    });

    it('does not delete when bulk delete cancelled', async () => {
      window.confirm.mockReturnValue(false);
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      const deleteButton = screen.getByText('Delete (1)');
      await user.click(deleteButton);

      expect(mockDeleteDraft).not.toHaveBeenCalled();
    });

    it('clears selection after successful bulk delete', async () => {
      mockDeleteDraft.mockResolvedValue(true);
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      const deleteButton = screen.getByText('Delete (2)');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByText(/Delete \(/)).not.toBeInTheDocument();
      });
    });

    it('disables bulk delete button while deleting', async () => {
      mockDeleteDraft.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      const deleteButton = screen.getByText('Delete (1)');
      await user.click(deleteButton);

      expect(deleteButton).toBeDisabled();

      await waitFor(() => {
        expect(deleteButton).not.toBeInTheDocument();
      });
    });

    it('handles bulk delete error gracefully', async () => {
      mockDeleteDraft.mockRejectedValue(new Error('Delete failed'));
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      const deleteButton = screen.getByText('Delete (1)');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error deleting drafts:', expect.any(Error));
      });
    });

    it('does nothing when bulk delete clicked with no selection', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(screen.getByText('Delete (1)')).toBeInTheDocument();

      await user.click(checkboxes[0]); // Uncheck

      expect(screen.queryByText(/Delete \(/)).not.toBeInTheDocument();
    });
  });

  describe('Single Draft Actions', () => {
    beforeEach(() => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });
    });

    it('calls onDraftEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const editButtons = screen.getAllByTestId('icon-edit3');
      await user.click(editButtons[0].closest('button'));

      expect(defaultProps.onDraftEdit).toHaveBeenCalledWith(mockDrafts[0]);
    });

    it('does not trigger draft select when edit button clicked', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const editButtons = screen.getAllByTestId('icon-edit3');
      await user.click(editButtons[0].closest('button'));

      expect(defaultProps.onDraftSelect).not.toHaveBeenCalled();
    });

    it('publishes draft when publish button clicked', async () => {
      const publishedPost = { id: 'post1', content: 'Published' };
      mockPublishDraft.mockResolvedValue(publishedPost);

      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const publishButtons = screen.getAllByTestId('icon-send');
      await user.click(publishButtons[0].closest('button'));

      await waitFor(() => {
        expect(mockPublishDraft).toHaveBeenCalledWith('draft1');
        expect(defaultProps.onDraftPublish).toHaveBeenCalledWith(publishedPost);
      });
    });

    it('does not trigger draft select when publish button clicked', async () => {
      mockPublishDraft.mockResolvedValue({ id: 'post1' });
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const publishButtons = screen.getAllByTestId('icon-send');
      await user.click(publishButtons[0].closest('button'));

      expect(defaultProps.onDraftSelect).not.toHaveBeenCalled();
    });

    it('deletes draft when delete button clicked and confirmed', async () => {
      mockDeleteDraft.mockResolvedValue(true);
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId('icon-trash2');
      await user.click(deleteButtons[0].closest('button'));

      await waitFor(() => {
        expect(mockDeleteDraft).toHaveBeenCalledWith('draft1');
      });
    });

    it('shows confirmation dialog for single draft delete', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId('icon-trash2');
      await user.click(deleteButtons[0].closest('button'));

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this draft?');
    });

    it('does not delete when single delete cancelled', async () => {
      window.confirm.mockReturnValue(false);
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId('icon-trash2');
      await user.click(deleteButtons[0].closest('button'));

      expect(mockDeleteDraft).not.toHaveBeenCalled();
    });

    it('does not trigger draft select when delete button clicked', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId('icon-trash2');
      await user.click(deleteButtons[0].closest('button'));

      expect(defaultProps.onDraftSelect).not.toHaveBeenCalled();
    });

    it('disables action buttons while loading', async () => {
      mockPublishDraft.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const publishButtons = screen.getAllByTestId('icon-send');
      const publishButton = publishButtons[0].closest('button');
      await user.click(publishButton);

      expect(publishButton).toBeDisabled();
    });

    it('handles publish error gracefully', async () => {
      mockPublishDraft.mockRejectedValue(new Error('Publish failed'));
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const publishButtons = screen.getAllByTestId('icon-send');
      await user.click(publishButtons[0].closest('button'));

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error publishing draft:', expect.any(Error));
      });
    });

    it('handles delete error gracefully', async () => {
      mockDeleteDraft.mockRejectedValue(new Error('Delete failed'));
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId('icon-trash2');
      await user.click(deleteButtons[0].closest('button'));

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error deleting draft:', expect.any(Error));
      });
    });
  });

  describe('Clear All Drafts', () => {
    beforeEach(() => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });
    });

    it('clears all drafts when confirmed', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const clearButton = screen.getByText('Clear All Drafts');
      await user.click(clearButton);

      expect(mockClearAllDrafts).toHaveBeenCalled();
    });

    it('shows confirmation dialog for clear all', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const clearButton = screen.getByText('Clear All Drafts');
      await user.click(clearButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete all drafts? This action cannot be undone.'
      );
    });

    it('does not clear when cancelled', async () => {
      window.confirm.mockReturnValue(false);
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const clearButton = screen.getByText('Clear All Drafts');
      await user.click(clearButton);

      expect(mockClearAllDrafts).not.toHaveBeenCalled();
    });

    it('disables clear button when no drafts', () => {
      useDraftManager.mockReturnValue({
        drafts: [],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(screen.queryByText('Clear All Drafts')).not.toBeInTheDocument();
    });

    it('disables clear button while loading', async () => {
      mockDeleteDraft.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId('icon-trash2');
      await user.click(deleteButtons[0].closest('button'));

      const clearButton = screen.getByText('Clear All Drafts');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Close Modal', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} showInModal={true} />);

      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles drafts with missing properties gracefully', () => {
      const incompleteDraft = {
        id: 'incomplete',
        type: 'text',
      };

      useDraftManager.mockReturnValue({
        drafts: [incompleteDraft],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      expect(() => render(<DraftBrowser {...defaultProps} />)).not.toThrow();
    });

    it('handles drafts without tags', () => {
      const draftNoTags = {
        ...mockDrafts[0],
        tags: undefined,
      };

      useDraftManager.mockReturnValue({
        drafts: [draftNoTags],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      expect(() => render(<DraftBrowser {...defaultProps} />)).not.toThrow();
    });

    it('handles empty string tags', async () => {
      const draftEmptyTag = {
        ...mockDrafts[0],
        tags: ['', 'valid-tag'],
      };

      useDraftManager.mockReturnValue({
        drafts: [draftEmptyTag],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('#valid-tag')).toBeInTheDocument();
    });

    it('handles drafts with empty content', () => {
      const draftEmptyContent = {
        ...mockDrafts[0],
        content: '',
      };

      useDraftManager.mockReturnValue({
        drafts: [draftEmptyContent],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      expect(screen.getByText('Test Draft 1')).toBeInTheDocument();
    });

    it('handles drafts with null content', () => {
      const draftNullContent = {
        ...mockDrafts[0],
        content: null,
      };

      useDraftManager.mockReturnValue({
        drafts: [draftNullContent],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      expect(() => render(<DraftBrowser {...defaultProps} />)).not.toThrow();
    });

    it('handles unknown draft type', () => {
      const unknownTypeDraft = {
        ...mockDrafts[0],
        type: 'unknown',
      };

      useDraftManager.mockReturnValue({
        drafts: [unknownTypeDraft],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      // Should render with default icon
      expect(screen.getAllByTestId('icon-filetext').length).toBeGreaterThan(0);
    });

    it('handles very long draft titles', () => {
      const longTitleDraft = {
        ...mockDrafts[0],
        title: 'A'.repeat(500),
      };

      useDraftManager.mockReturnValue({
        drafts: [longTitleDraft],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      expect(() => render(<DraftBrowser {...defaultProps} />)).not.toThrow();
    });

    it('handles very long search terms', async () => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, 'x'.repeat(1000));

      expect(screen.getByText('No drafts found')).toBeInTheDocument();
    });

    it('handles special characters in search', async () => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      await user.type(searchInput, '[]{}<>()');

      // Should not crash
      expect(screen.getByText('No drafts found')).toBeInTheDocument();
    });

    it('handles getDraftSummary returning null', () => {
      mockGetDraftSummary.mockReturnValue(null);

      useDraftManager.mockReturnValue({
        drafts: [mockDrafts[0]],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      expect(() => render(<DraftBrowser {...defaultProps} />)).not.toThrow();
    });

    it('handles zero word count', () => {
      mockGetDraftSummary.mockReturnValue({
        ...mockDraftSummary,
        wordCount: 0,
      });

      useDraftManager.mockReturnValue({
        drafts: [mockDrafts[0]],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      render(<DraftBrowser {...defaultProps} />);

      // Should not display word count
      expect(screen.queryByText(/words/)).not.toBeInTheDocument();
    });

    it('renders when callbacks are not provided', () => {
      expect(() => render(<DraftBrowser />)).not.toThrow();
    });

    it('handles undefined user context', () => {
      const { useAuth } = require('../../contexts/AuthContext.jsx');
      useAuth.mockReturnValue({ user: null });

      expect(() => render(<DraftBrowser {...defaultProps} />)).not.toThrow();
    });

    it('handles invalid date in lastModified', () => {
      const invalidDateDraft = {
        ...mockDrafts[0],
        lastModified: 'invalid-date',
      };

      useDraftManager.mockReturnValue({
        drafts: [invalidDateDraft],
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      expect(() => render(<DraftBrowser {...defaultProps} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });
    });

    it('has accessible search input', () => {
      render(<DraftBrowser {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search drafts...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('has accessible filter controls', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      const typeSelect = screen.getByDisplayValue('All Types');
      expect(typeSelect.tagName).toBe('SELECT');
    });

    it('has accessible buttons with proper titles', () => {
      render(<DraftBrowser {...defaultProps} />);

      const editButtons = screen.getAllByTitle('Edit draft');
      expect(editButtons.length).toBeGreaterThan(0);

      const publishButtons = screen.getAllByTitle('Publish draft');
      expect(publishButtons.length).toBeGreaterThan(0);

      const deleteButtons = screen.getAllByTitle('Delete draft');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('has accessible checkboxes', () => {
      render(<DraftBrowser {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });

    it('has keyboard accessible action buttons', async () => {
      const user = userEvent.setup();
      render(<DraftBrowser {...defaultProps} />);

      const editButtons = screen.getAllByTestId('icon-edit3');
      const editButton = editButtons[0].closest('button');

      editButton.focus();
      expect(document.activeElement).toBe(editButton);

      await user.keyboard('{Enter}');
      expect(defaultProps.onDraftEdit).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('memoizes processed drafts', () => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      const { rerender } = render(<DraftBrowser {...defaultProps} />);

      // Rerender with same props
      rerender(<DraftBrowser {...defaultProps} />);

      // Should not crash and render same content
      expect(screen.getByText('Test Draft 1')).toBeInTheDocument();
    });

    it('handles large number of drafts', () => {
      const manyDrafts = Array.from({ length: 100 }, (_, i) => ({
        id: `draft-${i}`,
        title: `Draft ${i}`,
        content: `Content ${i}`,
        type: 'text',
        lastModified: new Date(Date.now() - i * 1000).toISOString(),
        tags: [],
      }));

      useDraftManager.mockReturnValue({
        drafts: manyDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      const { container } = render(<DraftBrowser {...defaultProps} />);

      expect(container).toBeInTheDocument();
      expect(screen.getByText('100 drafts saved')).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot with no drafts', () => {
      const { container } = render(<DraftBrowser {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with drafts', () => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      const { container } = render(<DraftBrowser {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot in modal mode', () => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      const { container } = render(<DraftBrowser {...defaultProps} showInModal={true} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with filters open', async () => {
      useDraftManager.mockReturnValue({
        drafts: mockDrafts,
        loadDrafts: mockLoadDrafts,
        deleteDraft: mockDeleteDraft,
        clearAllDrafts: mockClearAllDrafts,
        publishDraft: mockPublishDraft,
        getDraftSummary: mockGetDraftSummary,
      });

      const user = userEvent.setup();
      const { container } = render(<DraftBrowser {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default mockLoadDrafts
