import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Inbox, Search, Filter, FolderX, Database, AlertCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  describe('Default Rendering', () => {
    it('should render with default props', () => {
      render(<EmptyState />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or create a new item')).toBeInTheDocument();
    });

    it('should render the default Inbox icon', () => {
      const { container } = render(<EmptyState />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-20', 'w-20', 'text-gray-600', 'mb-4');
    });

    it('should have proper role for accessibility', () => {
      render(<EmptyState />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should mark icon as decorative with aria-hidden', () => {
      const { container } = render(<EmptyState />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom Icon', () => {
    it('should render custom icon component', () => {
      render(<EmptyState icon={Search} />);

      const container = screen.getByRole('status');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Search icon', () => {
      const { container } = render(<EmptyState icon={Search} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render Filter icon', () => {
      const { container } = render(<EmptyState icon={Filter} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render FolderX icon', () => {
      const { container } = render(<EmptyState icon={FolderX} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render Database icon', () => {
      const { container } = render(<EmptyState icon={Database} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render AlertCircle icon', () => {
      const { container } = render(<EmptyState icon={AlertCircle} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Title', () => {
    it('should render custom title', () => {
      render(<EmptyState title="No results found" />);

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should apply correct styling to title', () => {
      render(<EmptyState title="Custom Title" />);

      const title = screen.getByText('Custom Title');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-xl', 'font-semibold', 'text-white', 'mb-2');
    });

    it('should render long title', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      render(<EmptyState title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should render title with special characters', () => {
      render(<EmptyState title="No items found (0)" />);

      expect(screen.getByText('No items found (0)')).toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('should render custom description', () => {
      render(<EmptyState description="Please try a different search" />);

      expect(screen.getByText('Please try a different search')).toBeInTheDocument();
    });

    it('should apply correct styling to description', () => {
      render(<EmptyState description="Test description" />);

      const description = screen.getByText('Test description');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-gray-400', 'mb-6', 'max-w-md');
    });

    it('should render long description', () => {
      const longDescription = 'This is a very long description that provides detailed information about the empty state and what users can do to see content here';
      render(<EmptyState description={longDescription} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should render description with HTML entities', () => {
      render(<EmptyState description="No items & no results" />);

      expect(screen.getByText('No items & no results')).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('should not render button when actionLabel is not provided', () => {
      render(<EmptyState onAction={() => {}} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render button when onAction is not provided', () => {
      render(<EmptyState actionLabel="Create Item" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render button when both actionLabel and onAction are provided', () => {
      render(<EmptyState actionLabel="Create Item" onAction={() => {}} />);

      expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument();
    });

    it('should display correct button text', () => {
      render(<EmptyState actionLabel="Add New" onAction={() => {}} />);

      expect(screen.getByText('Add New')).toBeInTheDocument();
    });

    it('should call onAction when button is clicked', () => {
      const mockAction = jest.fn();
      render(<EmptyState actionLabel="Click Me" onAction={mockAction} />);

      const button = screen.getByRole('button', { name: 'Click Me' });
      fireEvent.click(button);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should call onAction multiple times when clicked multiple times', () => {
      const mockAction = jest.fn();
      render(<EmptyState actionLabel="Click Me" onAction={mockAction} />);

      const button = screen.getByRole('button', { name: 'Click Me' });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockAction).toHaveBeenCalledTimes(3);
    });

    it('should apply correct styling to button', () => {
      render(<EmptyState actionLabel="Create" onAction={() => {}} />);

      const button = screen.getByRole('button', { name: 'Create' });
      expect(button).toHaveClass('px-6', 'py-3', 'bg-blue-500', 'hover:bg-blue-600', 'rounded-lg', 'font-medium', 'transition-colors');
    });

    it('should have proper aria-label on button', () => {
      render(<EmptyState actionLabel="Create New Item" onAction={() => {}} />);

      const button = screen.getByRole('button', { name: 'Create New Item' });
      expect(button).toHaveAttribute('aria-label', 'Create New Item');
    });
  });

  describe('Complete Empty State Scenarios', () => {
    it('should render complete no data scenario', () => {
      const mockAction = jest.fn();
      render(
        <EmptyState
          icon={Database}
          title="No data available"
          description="Start by importing your first dataset"
          actionLabel="Import Data"
          onAction={mockAction}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByText('Start by importing your first dataset')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Import Data' })).toBeInTheDocument();
    });

    it('should render complete search empty state', () => {
      const mockAction = jest.fn();
      render(
        <EmptyState
          icon={Search}
          title="No search results"
          description="We couldn't find any matches for your search"
          actionLabel="Clear Search"
          onAction={mockAction}
        />
      );

      expect(screen.getByText('No search results')).toBeInTheDocument();
      expect(screen.getByText("We couldn't find any matches for your search")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear Search' })).toBeInTheDocument();
    });

    it('should render complete filter empty state', () => {
      const mockAction = jest.fn();
      render(
        <EmptyState
          icon={Filter}
          title="No filtered results"
          description="Try adjusting your filters to see more results"
          actionLabel="Reset Filters"
          onAction={mockAction}
        />
      );

      expect(screen.getByText('No filtered results')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters to see more results')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset Filters' })).toBeInTheDocument();
    });

    it('should render empty state without action button', () => {
      render(
        <EmptyState
          icon={AlertCircle}
          title="Nothing here yet"
          description="Content will appear here once available"
        />
      );

      expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
      expect(screen.getByText('Content will appear here once available')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Container Styling', () => {
    it('should apply correct layout classes to container', () => {
      render(<EmptyState />);

      const container = screen.getByRole('status');
      expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'p-12', 'text-center');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible when button is present', () => {
      const mockAction = jest.fn();
      render(<EmptyState actionLabel="Create" onAction={mockAction} />);

      const button = screen.getByRole('button', { name: 'Create' });
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have semantic heading for title', () => {
      render(<EmptyState title="Test Title" />);

      const heading = screen.getByText('Test Title');
      expect(heading.tagName).toBe('H3');
    });

    it('should have proper status role for screen readers', () => {
      render(<EmptyState />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string title', () => {
      render(<EmptyState title="" />);

      const heading = screen.getByRole('status').querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('');
    });

    it('should handle empty string description', () => {
      render(<EmptyState description="" />);

      const description = screen.getByRole('status').querySelector('p');
      expect(description).toBeInTheDocument();
      expect(description.textContent).toBe('');
    });

    it('should handle empty string actionLabel', () => {
      render(<EmptyState actionLabel="" onAction={() => {}} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle null title gracefully', () => {
      render(<EmptyState title={null} />);

      const heading = screen.getByRole('status').querySelector('h3');
      expect(heading).toBeInTheDocument();
    });

    it('should handle null description gracefully', () => {
      render(<EmptyState description={null} />);

      const description = screen.getByRole('status').querySelector('p');
      expect(description).toBeInTheDocument();
    });
  });
});

export default svg
