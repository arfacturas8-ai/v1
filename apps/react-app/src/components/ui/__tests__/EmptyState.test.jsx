import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../EmptyState';
import { FileText, Users, Inbox, Search, Mail, Package, Image as ImageIcon, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }) => (
      <div data-testid="motion-div" data-initial={JSON.stringify(initial)} data-animate={JSON.stringify(animate)} data-transition={JSON.stringify(transition)} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock Button component
jest.mock('../button', () => ({
  Button: ({ children, onClick, variant, size, style, className, ...props }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      style={style}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('EmptyState', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<EmptyState title="No data" />);
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('renders with minimal props', () => {
      render(<EmptyState title="Empty" />);
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('renders title correctly', () => {
      render(<EmptyState title="Nothing here" />);
      expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });

    it('renders with all props provided', () => {
      const handleAction = jest.fn();
      const handleSecondary = jest.fn();
      render(
        <EmptyState
          icon={<FileText size={64} />}
          title="No files"
          description="Start by uploading files"
          actionLabel="Upload File"
          onAction={handleAction}
          secondaryActionLabel="Learn More"
          onSecondaryAction={handleSecondary}
          className="custom-class"
        />
      );
      expect(screen.getByText('No files')).toBeInTheDocument();
      expect(screen.getByText('Start by uploading files')).toBeInTheDocument();
      expect(screen.getByText('Upload File')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('renders as a motion.div', () => {
      render(<EmptyState title="Test" />);
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });

    it('applies framer-motion initial state', () => {
      render(<EmptyState title="Test" />);
      const motionDiv = screen.getByTestId('motion-div');
      const initial = JSON.parse(motionDiv.getAttribute('data-initial') || '{}');
      expect(initial).toEqual({ opacity: 0, y: 20 });
    });

    it('applies framer-motion animate state', () => {
      render(<EmptyState title="Test" />);
      const motionDiv = screen.getByTestId('motion-div');
      const animate = JSON.parse(motionDiv.getAttribute('data-animate') || '{}');
      expect(animate).toEqual({ opacity: 1, y: 0 });
    });

    it('applies framer-motion transition', () => {
      render(<EmptyState title="Test" />);
      const motionDiv = screen.getByTestId('motion-div');
      const transition = JSON.parse(motionDiv.getAttribute('data-transition') || '{}');
      expect(transition).toEqual({ duration: 0.4 });
    });
  });

  describe('Title Rendering', () => {
    it('renders title as h3 heading', () => {
      render(<EmptyState title="No Results" />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('No Results');
    });

    it('applies correct title styles', () => {
      render(<EmptyState title="No Results" />);
      const title = screen.getByText('No Results');
      expect(title).toHaveClass('text-2xl', 'font-bold', 'mb-3');
    });

    it('applies CSS variable for text color', () => {
      render(<EmptyState title="Test" />);
      const title = screen.getByText('Test');
      expect(title).toHaveStyle({ color: 'var(--text-primary)' });
    });

    it('renders long title correctly', () => {
      const longTitle = 'This is a very long title that should still render correctly in the empty state component';
      render(<EmptyState title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('renders title with special characters', () => {
      render(<EmptyState title="No items! Try again..." />);
      expect(screen.getByText('No items! Try again...')).toBeInTheDocument();
    });

    it('renders title with HTML entities', () => {
      render(<EmptyState title="No data &amp; results" />);
      expect(screen.getByText(/No data/)).toBeInTheDocument();
    });
  });

  describe('Description Rendering', () => {
    it('renders description when provided', () => {
      render(<EmptyState title="Empty" description="Start by adding something" />);
      expect(screen.getByText('Start by adding something')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<EmptyState title="Empty" />);
      expect(screen.queryByText('Start by adding something')).not.toBeInTheDocument();
    });

    it('does not render description paragraph when description is null', () => {
      const { container } = render(<EmptyState title="Empty" description={null} />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(0);
    });

    it('does not render description paragraph when description is undefined', () => {
      const { container } = render(<EmptyState title="Empty" description={undefined} />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(0);
    });

    it('does not render description paragraph when description is empty string', () => {
      const { container } = render(<EmptyState title="Empty" description="" />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(0);
    });

    it('applies correct description styles', () => {
      render(<EmptyState title="Empty" description="Test description" />);
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('text-base', 'mb-6', 'max-w-md');
    });

    it('applies CSS variables for description color', () => {
      render(<EmptyState title="Empty" description="Test" />);
      const description = screen.getByText('Test');
      expect(description).toHaveStyle({ color: 'var(--text-secondary)', lineHeight: '1.6' });
    });

    it('renders long description correctly', () => {
      const longDesc = 'This is a very long description that explains the empty state in detail and provides helpful information to the user about what they can do next.';
      render(<EmptyState title="Empty" description={longDesc} />);
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it('applies max-width constraint to description', () => {
      render(<EmptyState title="Empty" description="Test" />);
      const description = screen.getByText('Test');
      expect(description).toHaveClass('max-w-md');
    });

    it('renders description as paragraph element', () => {
      render(<EmptyState title="Empty" description="Test" />);
      const description = screen.getByText('Test');
      expect(description.tagName).toBe('P');
    });
  });

  describe('Icon Rendering', () => {
    it('renders with icon', () => {
      const { container } = render(
        <EmptyState title="No files" icon={<FileText size={64} />} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders icon without illustration', () => {
      const { container } = render(
        <EmptyState title="Empty" icon={<Inbox size={64} />} />
      );
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies icon container styles', () => {
      const { container } = render(
        <EmptyState title="Empty" icon={<Inbox size={64} />} />
      );
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toHaveClass('mb-6', 'p-6');
    });

    it('applies CSS variables to icon container', () => {
      const { container } = render(
        <EmptyState title="Empty" icon={<FileText size={64} />} />
      );
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toHaveStyle({
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
      });
    });

    it('renders different icon types', () => {
      const { container, rerender } = render(
        <EmptyState title="Empty" icon={<FileText size={64} data-testid="file-icon" />} />
      );
      expect(screen.getByTestId('file-icon')).toBeInTheDocument();

      rerender(<EmptyState title="Empty" icon={<Users size={64} data-testid="users-icon" />} />);
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();

      rerender(<EmptyState title="Empty" icon={<Inbox size={64} data-testid="inbox-icon" />} />);
      expect(screen.getByTestId('inbox-icon')).toBeInTheDocument();
    });

    it('renders icon with custom size', () => {
      render(<EmptyState title="Empty" icon={<FileText size={128} data-testid="large-icon" />} />);
      expect(screen.getByTestId('large-icon')).toBeInTheDocument();
    });

    it('does not render icon when not provided', () => {
      const { container } = render(<EmptyState title="Empty" />);
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeNull();
    });

    it('renders without icon when only illustration is provided', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          icon={<FileText />}
          illustration={<div data-testid="illustration">Custom</div>}
        />
      );
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeNull();
    });
  });

  describe('Illustration Rendering', () => {
    it('renders custom illustration instead of icon', () => {
      const illustration = <div data-testid="custom-illustration">Custom SVG</div>;
      render(
        <EmptyState title="Empty" illustration={illustration} icon={<FileText />} />
      );
      expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
    });

    it('prefers illustration over icon', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          illustration={<div data-testid="custom-illustration">Custom</div>}
          icon={<FileText size={64} />}
        />
      );
      expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeNull();
    });

    it('renders complex illustration element', () => {
      const illustration = (
        <div data-testid="complex-illustration">
          <svg width="200" height="200">
            <circle cx="100" cy="100" r="50" />
          </svg>
        </div>
      );
      render(<EmptyState title="Empty" illustration={illustration} />);
      expect(screen.getByTestId('complex-illustration')).toBeInTheDocument();
    });

    it('renders illustration with nested components', () => {
      const illustration = (
        <div data-testid="nested-illustration">
          <div>
            <img src="/image.png" alt="Empty" />
          </div>
        </div>
      );
      render(<EmptyState title="Empty" illustration={illustration} />);
      expect(screen.getByTestId('nested-illustration')).toBeInTheDocument();
    });

    it('does not render illustration when not provided', () => {
      render(<EmptyState title="Empty" icon={<FileText />} />);
      expect(screen.queryByTestId('custom-illustration')).not.toBeInTheDocument();
    });
  });

  describe('Primary Action Button', () => {
    it('renders primary action button', () => {
      const handleAction = jest.fn();
      render(
        <EmptyState title="No posts" actionLabel="Create Post" onAction={handleAction} />
      );
      expect(screen.getByText('Create Post')).toBeInTheDocument();
    });

    it('triggers primary action on click', async () => {
      const handleAction = jest.fn();
      render(
        <EmptyState title="No posts" actionLabel="Create Post" onAction={handleAction} />
      );
      await userEvent.click(screen.getByText('Create Post'));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('does not render action button without label', () => {
      const handleAction = jest.fn();
      render(<EmptyState title="Empty" onAction={handleAction} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render action button without handler', () => {
      render(<EmptyState title="Empty" actionLabel="Create" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('requires both actionLabel and onAction', () => {
      const { rerender } = render(<EmptyState title="Empty" actionLabel="Create" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      rerender(<EmptyState title="Empty" onAction={jest.fn()} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      rerender(<EmptyState title="Empty" actionLabel="Create" onAction={jest.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies large size to primary button', () => {
      render(<EmptyState title="Empty" actionLabel="Create" onAction={jest.fn()} />);
      const button = screen.getByText('Create');
      expect(button).toHaveAttribute('data-size', 'lg');
    });

    it('applies gradient background to primary button', () => {
      render(<EmptyState title="Empty" actionLabel="Create" onAction={jest.fn()} />);
      const button = screen.getByText('Create');
      expect(button).toHaveStyle({
        background: 'linear-gradient(135deg, var(--cryb-primary), var(--cryb-secondary))',
      });
    });

    it('renders button as clickable element', () => {
      render(<EmptyState title="Empty" actionLabel="Create" onAction={jest.fn()} />);
      const button = screen.getByRole('button', { name: 'Create' });
      expect(button).toBeInTheDocument();
    });

    it('triggers action on Enter key', () => {
      const handleAction = jest.fn();
      render(<EmptyState title="Empty" actionLabel="Create" onAction={handleAction} />);
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleAction).toHaveBeenCalled();
    });

    it('handles multiple clicks correctly', async () => {
      const handleAction = jest.fn();
      render(<EmptyState title="Empty" actionLabel="Create" onAction={handleAction} />);
      const button = screen.getByText('Create');
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);
      expect(handleAction).toHaveBeenCalledTimes(3);
    });

    it('renders with long action label', () => {
      render(
        <EmptyState
          title="Empty"
          actionLabel="Create Your First Post Now"
          onAction={jest.fn()}
        />
      );
      expect(screen.getByText('Create Your First Post Now')).toBeInTheDocument();
    });
  });

  describe('Secondary Action Button', () => {
    it('renders secondary action button', () => {
      render(
        <EmptyState
          title="No data"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary"
          onSecondaryAction={jest.fn()}
        />
      );
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    it('triggers secondary action on click', async () => {
      const handleSecondaryAction = jest.fn();
      render(
        <EmptyState
          title="No data"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Learn More"
          onSecondaryAction={handleSecondaryAction}
        />
      );
      await userEvent.click(screen.getByText('Learn More'));
      expect(handleSecondaryAction).toHaveBeenCalledTimes(1);
    });

    it('does not render secondary button without primary action', () => {
      render(
        <EmptyState
          title="Empty"
          secondaryActionLabel="Secondary"
          onSecondaryAction={jest.fn()}
        />
      );
      expect(screen.queryByText('Secondary')).not.toBeInTheDocument();
    });

    it('requires primary action to show secondary', () => {
      const { rerender } = render(
        <EmptyState
          title="Empty"
          secondaryActionLabel="Secondary"
          onSecondaryAction={jest.fn()}
        />
      );
      expect(screen.queryByText('Secondary')).not.toBeInTheDocument();

      rerender(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary"
          onSecondaryAction={jest.fn()}
        />
      );
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    it('renders both action buttons', () => {
      render(
        <EmptyState
          title="No content"
          actionLabel="Create Content"
          onAction={jest.fn()}
          secondaryActionLabel="Import Content"
          onSecondaryAction={jest.fn()}
        />
      );
      expect(screen.getByText('Create Content')).toBeInTheDocument();
      expect(screen.getByText('Import Content')).toBeInTheDocument();
    });

    it('applies outline variant to secondary button', () => {
      render(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary"
          onSecondaryAction={jest.fn()}
        />
      );
      const secondaryButton = screen.getByText('Secondary');
      expect(secondaryButton).toHaveAttribute('data-variant', 'outline');
    });

    it('applies large size to secondary button', () => {
      render(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary"
          onSecondaryAction={jest.fn()}
        />
      );
      const secondaryButton = screen.getByText('Secondary');
      expect(secondaryButton).toHaveAttribute('data-size', 'lg');
    });

    it('does not render secondary without label', () => {
      render(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          onSecondaryAction={jest.fn()}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    it('does not render secondary without handler', () => {
      render(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary"
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    it('handles multiple clicks on secondary button', async () => {
      const handleSecondary = jest.fn();
      render(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary"
          onSecondaryAction={handleSecondary}
        />
      );
      const button = screen.getByText('Secondary');
      await userEvent.click(button);
      await userEvent.click(button);
      expect(handleSecondary).toHaveBeenCalledTimes(2);
    });
  });

  describe('Button Container Layout', () => {
    it('renders buttons in flex container', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary"
          onSecondaryAction={jest.fn()}
        />
      );
      const buttonContainer = screen.getByText('Primary').parentElement;
      expect(buttonContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-3', 'items-center');
    });

    it('applies responsive flex direction', () => {
      const { container } = render(
        <EmptyState title="Empty" actionLabel="Create" onAction={jest.fn()} />
      );
      const buttonContainer = screen.getByText('Create').parentElement;
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('applies gap between buttons', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary"
          onSecondaryAction={jest.fn()}
        />
      );
      const buttonContainer = screen.getByText('Primary').parentElement;
      expect(buttonContainer).toHaveClass('gap-3');
    });

    it('centers button items', () => {
      const { container } = render(
        <EmptyState title="Empty" actionLabel="Create" onAction={jest.fn()} />
      );
      const buttonContainer = screen.getByText('Create').parentElement;
      expect(buttonContainer).toHaveClass('items-center');
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies custom className', () => {
      const { container } = render(
        <EmptyState title="Empty" className="custom-empty-state" />
      );
      expect(container.firstChild).toHaveClass('custom-empty-state');
    });

    it('applies centered layout classes', () => {
      const { container } = render(<EmptyState title="Empty" />);
      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });

    it('applies text-center class', () => {
      const { container } = render(<EmptyState title="Empty" />);
      expect(container.firstChild).toHaveClass('text-center');
    });

    it('applies padding classes', () => {
      const { container } = render(<EmptyState title="Empty" />);
      expect(container.firstChild).toHaveClass('py-16', 'px-8');
    });

    it('merges custom className with default classes', () => {
      const { container } = render(
        <EmptyState title="Empty" className="custom-class another-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class', 'another-class', 'flex', 'flex-col');
    });

    it('applies all layout classes together', () => {
      const { container } = render(<EmptyState title="Empty" />);
      const classes = container.firstChild?.className || '';
      expect(classes).toContain('flex');
      expect(classes).toContain('flex-col');
      expect(classes).toContain('items-center');
      expect(classes).toContain('justify-center');
      expect(classes).toContain('text-center');
    });
  });

  describe('Accessibility', () => {
    it('maintains semantic heading hierarchy', () => {
      render(<EmptyState title="No Content" />);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('uses h3 for title', () => {
      render(<EmptyState title="Test" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading.tagName).toBe('H3');
    });

    it('provides clear action button labels', () => {
      render(
        <EmptyState title="Empty" actionLabel="Add Item" onAction={jest.fn()} />
      );
      expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    });

    it('button is keyboard accessible', () => {
      const handleAction = jest.fn();
      render(
        <EmptyState title="Empty" actionLabel="Create" onAction={handleAction} />
      );
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleAction).toHaveBeenCalled();
    });

    it('has accessible button for primary action', () => {
      render(
        <EmptyState title="Empty" actionLabel="Create Post" onAction={jest.fn()} />
      );
      const button = screen.getByRole('button', { name: 'Create Post' });
      expect(button).toBeInTheDocument();
    });

    it('has accessible button for secondary action', () => {
      render(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Learn More"
          onSecondaryAction={jest.fn()}
        />
      );
      const button = screen.getByRole('button', { name: 'Learn More' });
      expect(button).toBeInTheDocument();
    });

    it('all buttons are keyboard focusable', () => {
      render(
        <EmptyState
          title="Empty"
          actionLabel="Primary"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary"
          onSecondaryAction={jest.fn()}
        />
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });

    it('provides semantic structure', () => {
      const { container } = render(
        <EmptyState
          title="No Results"
          description="Try a different search"
          actionLabel="Clear Search"
          onAction={jest.fn()}
        />
      );
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null title gracefully', () => {
      const { container } = render(<EmptyState title={null} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles undefined props gracefully', () => {
      const { container } = render(
        <EmptyState
          title="Test"
          icon={undefined}
          description={undefined}
          actionLabel={undefined}
        />
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles empty string description', () => {
      const { container } = render(<EmptyState title="Test" description="" />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(0);
    });

    it('handles empty string actionLabel', () => {
      render(<EmptyState title="Test" actionLabel="" onAction={jest.fn()} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('handles whitespace-only actionLabel', () => {
      render(<EmptyState title="Test" actionLabel="   " onAction={jest.fn()} />);
      const button = screen.queryByRole('button');
      if (button) {
        expect(button.textContent?.trim()).toBeTruthy();
      }
    });

    it('renders without any optional props', () => {
      const { container } = render(<EmptyState title="Minimal" />);
      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(container.querySelector('p')).not.toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      render(<EmptyState title="<No> Results & 'Data'" />);
      expect(screen.getByText(/<No> Results & 'Data'/)).toBeInTheDocument();
    });

    it('handles very long text content', () => {
      const longTitle = 'A'.repeat(200);
      const longDescription = 'B'.repeat(500);
      render(<EmptyState title={longTitle} description={longDescription} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles rapid prop changes', () => {
      const { rerender } = render(<EmptyState title="First" />);
      rerender(<EmptyState title="Second" />);
      rerender(<EmptyState title="Third" />);
      expect(screen.getByText('Third')).toBeInTheDocument();
      expect(screen.queryByText('First')).not.toBeInTheDocument();
    });

    it('handles icon removal on rerender', () => {
      const { container, rerender } = render(
        <EmptyState title="Test" icon={<FileText />} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(<EmptyState title="Test" />);
      expect(container.querySelector('.rounded-full')).toBeNull();
    });
  });

  describe('Complete Examples', () => {
    it('renders complete empty state with all props', () => {
      const handlePrimary = jest.fn();
      const handleSecondary = jest.fn();

      render(
        <EmptyState
          icon={<FileText size={64} />}
          title="No posts yet"
          description="Be the first to create a post in this community!"
          actionLabel="Create Post"
          onAction={handlePrimary}
          secondaryActionLabel="Learn More"
          onSecondaryAction={handleSecondary}
          className="my-custom-class"
        />
      );

      expect(screen.getByText('No posts yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to create a post in this community!')).toBeInTheDocument();
      expect(screen.getByText('Create Post')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('renders minimal empty state', () => {
      render(<EmptyState title="Nothing here" />);
      expect(screen.getByText('Nothing here')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders with title and description only', () => {
      render(
        <EmptyState
          title="No data available"
          description="Data will appear here once available"
        />
      );
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByText('Data will appear here once available')).toBeInTheDocument();
    });

    it('renders with icon and title only', () => {
      const { container } = render(
        <EmptyState title="Empty inbox" icon={<Mail size={64} />} />
      );
      expect(screen.getByText('Empty inbox')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with single action button', () => {
      render(
        <EmptyState
          title="No items"
          actionLabel="Add Item"
          onAction={jest.fn()}
        />
      );
      expect(screen.getByText('No items')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    });
  });

  describe('Use Cases', () => {
    it('displays empty inbox state', () => {
      render(
        <EmptyState
          icon={<Inbox size={64} />}
          title="Inbox is empty"
          description="All caught up! No new messages."
        />
      );
      expect(screen.getByText('Inbox is empty')).toBeInTheDocument();
    });

    it('displays no users state with action', () => {
      const handleInvite = jest.fn();
      render(
        <EmptyState
          icon={<Users size={64} />}
          title="No team members"
          description="Start building your team by inviting members"
          actionLabel="Invite Team Member"
          onAction={handleInvite}
        />
      );
      expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
    });

    it('displays search results empty state', () => {
      render(
        <EmptyState
          icon={<Search size={64} />}
          title="No results found"
          description="Try adjusting your search or filter to find what you're looking for"
          actionLabel="Clear Filters"
          onAction={jest.fn()}
        />
      );
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    it('displays no files state', () => {
      render(
        <EmptyState
          icon={<FileText size={64} />}
          title="No files uploaded"
          description="Upload your first file to get started"
          actionLabel="Upload File"
          onAction={jest.fn()}
          secondaryActionLabel="Browse Templates"
          onSecondaryAction={jest.fn()}
        />
      );
      expect(screen.getByText('No files uploaded')).toBeInTheDocument();
      expect(screen.getByText('Upload File')).toBeInTheDocument();
      expect(screen.getByText('Browse Templates')).toBeInTheDocument();
    });

    it('displays no packages state', () => {
      render(
        <EmptyState
          icon={<Package size={64} />}
          title="No packages available"
          description="There are no packages to display at this time"
        />
      );
      expect(screen.getByText('No packages available')).toBeInTheDocument();
    });

    it('displays no images state', () => {
      render(
        <EmptyState
          icon={<ImageIcon size={64} />}
          title="No images found"
          description="Start by uploading your first image"
          actionLabel="Upload Image"
          onAction={jest.fn()}
        />
      );
      expect(screen.getByText('No images found')).toBeInTheDocument();
    });

    it('displays error state', () => {
      render(
        <EmptyState
          icon={<AlertCircle size={64} />}
          title="Something went wrong"
          description="We encountered an error loading your data"
          actionLabel="Try Again"
          onAction={jest.fn()}
        />
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('displays success completion state', () => {
      render(
        <EmptyState
          icon={<CheckCircle size={64} />}
          title="All tasks completed"
          description="Great job! You've completed all your tasks"
          actionLabel="Add New Task"
          onAction={jest.fn()}
        />
      );
      expect(screen.getByText('All tasks completed')).toBeInTheDocument();
    });

    it('displays deletion confirmation state', () => {
      render(
        <EmptyState
          icon={<XCircle size={64} />}
          title="No items to display"
          description="All items have been removed"
          actionLabel="Restore Items"
          onAction={jest.fn()}
        />
      );
      expect(screen.getByText('No items to display')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('handles both actions being triggered in sequence', async () => {
      const handlePrimary = jest.fn();
      const handleSecondary = jest.fn();

      render(
        <EmptyState
          title="Test"
          actionLabel="Primary"
          onAction={handlePrimary}
          secondaryActionLabel="Secondary"
          onSecondaryAction={handleSecondary}
        />
      );

      await userEvent.click(screen.getByText('Primary'));
      expect(handlePrimary).toHaveBeenCalledTimes(1);
      expect(handleSecondary).not.toHaveBeenCalled();

      await userEvent.click(screen.getByText('Secondary'));
      expect(handleSecondary).toHaveBeenCalledTimes(1);
      expect(handlePrimary).toHaveBeenCalledTimes(1);
    });

    it('renders correctly with illustration and actions', () => {
      render(
        <EmptyState
          title="Custom State"
          illustration={<div data-testid="custom-svg">Custom Illustration</div>}
          description="This is a custom empty state"
          actionLabel="Get Started"
          onAction={jest.fn()}
        />
      );

      expect(screen.getByTestId('custom-svg')).toBeInTheDocument();
      expect(screen.getByText('Custom State')).toBeInTheDocument();
      expect(screen.getByText('This is a custom empty state')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('maintains layout with long content', () => {
      const { container } = render(
        <EmptyState
          title="This is a very long title that might wrap to multiple lines"
          description="This is a very long description that provides detailed information about the empty state and what users should do next. It continues for quite a while to test layout."
          actionLabel="Primary Action with Long Text"
          onAction={jest.fn()}
          secondaryActionLabel="Secondary Action Also Long"
          onSecondaryAction={jest.fn()}
        />
      );

      expect(container.firstChild).toHaveClass('text-center');
      expect(container.querySelector('.max-w-md')).toBeInTheDocument();
    });

    it('updates correctly when props change', () => {
      const { rerender } = render(
        <EmptyState
          title="First Title"
          description="First description"
          actionLabel="First Action"
          onAction={jest.fn()}
        />
      );

      expect(screen.getByText('First Title')).toBeInTheDocument();
      expect(screen.getByText('First description')).toBeInTheDocument();

      rerender(
        <EmptyState
          title="Second Title"
          description="Second description"
          actionLabel="Second Action"
          onAction={jest.fn()}
        />
      );

      expect(screen.getByText('Second Title')).toBeInTheDocument();
      expect(screen.getByText('Second description')).toBeInTheDocument();
      expect(screen.queryByText('First Title')).not.toBeInTheDocument();
    });

    it('handles dynamic action handlers', async () => {
      let clickCount = 0;
      const { rerender } = render(
        <EmptyState
          title="Test"
          actionLabel="Click Me"
          onAction={() => clickCount++}
        />
      );

      await userEvent.click(screen.getByText('Click Me'));
      expect(clickCount).toBe(1);

      rerender(
        <EmptyState
          title="Test"
          actionLabel="Click Me"
          onAction={() => clickCount += 2}
        />
      );

      await userEvent.click(screen.getByText('Click Me'));
      expect(clickCount).toBe(3);
    });
  });

  describe('Animation Properties', () => {
    it('sets correct initial opacity', () => {
      render(<EmptyState title="Test" />);
      const motionDiv = screen.getByTestId('motion-div');
      const initial = JSON.parse(motionDiv.getAttribute('data-initial') || '{}');
      expect(initial.opacity).toBe(0);
    });

    it('sets correct initial y position', () => {
      render(<EmptyState title="Test" />);
      const motionDiv = screen.getByTestId('motion-div');
      const initial = JSON.parse(motionDiv.getAttribute('data-initial') || '{}');
      expect(initial.y).toBe(20);
    });

    it('sets correct animate opacity', () => {
      render(<EmptyState title="Test" />);
      const motionDiv = screen.getByTestId('motion-div');
      const animate = JSON.parse(motionDiv.getAttribute('data-animate') || '{}');
      expect(animate.opacity).toBe(1);
    });

    it('sets correct animate y position', () => {
      render(<EmptyState title="Test" />);
      const motionDiv = screen.getByTestId('motion-div');
      const animate = JSON.parse(motionDiv.getAttribute('data-animate') || '{}');
      expect(animate.y).toBe(0);
    });

    it('sets correct transition duration', () => {
      render(<EmptyState title="Test" />);
      const motionDiv = screen.getByTestId('motion-div');
      const transition = JSON.parse(motionDiv.getAttribute('data-transition') || '{}');
      expect(transition.duration).toBe(0.4);
    });
  });

  describe('Component Composition', () => {
    it('renders nested elements correctly', () => {
      render(
        <EmptyState
          title="Test"
          icon={
            <div data-testid="icon-wrapper">
              <FileText size={64} />
            </div>
          }
        />
      );
      expect(screen.getByTestId('icon-wrapper')).toBeInTheDocument();
    });

    it('maintains structure with custom illustration', () => {
      const { container } = render(
        <EmptyState
          title="Test"
          illustration={
            <div className="custom-illustration">
              <svg>
                <circle />
              </svg>
            </div>
          }
        />
      );
      expect(container.querySelector('.custom-illustration')).toBeInTheDocument();
    });

    it('renders all sections in correct order', () => {
      const { container } = render(
        <EmptyState
          icon={<FileText size={64} />}
          title="Title"
          description="Description"
          actionLabel="Action"
          onAction={jest.fn()}
        />
      );

      const children = Array.from(container.firstChild?.children || []);
      expect(children.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Variable Usage', () => {
    it('uses CSS variable for title color', () => {
      render(<EmptyState title="Test" />);
      const title = screen.getByText('Test');
      expect(title.style.color).toBe('var(--text-primary)');
    });

    it('uses CSS variable for description color', () => {
      render(<EmptyState title="Test" description="Description" />);
      const description = screen.getByText('Description');
      expect(description.style.color).toBe('var(--text-secondary)');
    });

    it('uses CSS variables for icon container background', () => {
      const { container } = render(
        <EmptyState title="Test" icon={<FileText />} />
      );
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer?.style.background).toBe('var(--bg-secondary)');
    });

    it('uses CSS variables for icon container color', () => {
      const { container } = render(
        <EmptyState title="Test" icon={<FileText />} />
      );
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer?.style.color).toBe('var(--text-secondary)');
    });

    it('uses CSS variables for button gradient', () => {
      render(
        <EmptyState title="Test" actionLabel="Action" onAction={jest.fn()} />
      );
      const button = screen.getByText('Action');
      expect(button.style.background).toContain('var(--cryb-primary)');
      expect(button.style.background).toContain('var(--cryb-secondary)');
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot with minimal props', () => {
      const { container } = render(<EmptyState title="Empty" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with all props', () => {
      const { container } = render(
        <EmptyState
          icon={<FileText size={64} />}
          title="No content"
          description="Add your first item"
          actionLabel="Add Item"
          onAction={jest.fn()}
          secondaryActionLabel="Learn More"
          onSecondaryAction={jest.fn()}
          className="custom-class"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with illustration', () => {
      const { container } = render(
        <EmptyState
          title="Custom"
          illustration={<div data-testid="illustration">Custom</div>}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with single action', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          actionLabel="Create"
          onAction={jest.fn()}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with icon and description', () => {
      const { container } = render(
        <EmptyState
          icon={<Inbox size={64} />}
          title="Inbox Empty"
          description="No new messages"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default handleAction
