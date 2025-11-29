import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IconButton from '../IconButton';
import { Home, User, Settings, Search, ChevronRight, X, Check, AlertCircle, Plus, Minus, Edit, Trash2, Download, Upload, Heart, Star, Bell, Mail, Phone } from 'lucide-react';

// Mock lucide-react icons with data-testid attributes
jest.mock('lucide-react', () => {
  const originalModule = jest.requireActual('lucide-react');
  return {
    ...originalModule,
    Loader2: (props) => (
      <svg data-testid="loader-icon" className={props.className} {...props}>
        <circle data-testid="loader-circle" />
      </svg>
    ),
  };
});

describe('IconButton', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with provided icon', () => {
      const { container } = render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders without icon', () => {
      const { container } = render(<IconButton aria-label="Button" />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders with Home icon', () => {
      const { container } = render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with User icon', () => {
      const { container } = render(<IconButton icon={<User />} aria-label="User" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Settings icon', () => {
      const { container } = render(<IconButton icon={<Settings />} aria-label="Settings" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Search icon', () => {
      const { container } = render(<IconButton icon={<Search />} aria-label="Search" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with X icon', () => {
      const { container } = render(<IconButton icon={<X />} aria-label="Close" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('has button role', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders as HTMLButtonElement', () => {
      const { container } = render(<IconButton icon={<Home />} aria-label="Home" />);
      const button = container.querySelector('button');
      expect(button).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Size Variants', () => {
    it('renders extra small size', () => {
      render(<IconButton icon={<Home />} size="xs" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('w-6', 'h-6');
    });

    it('renders small size', () => {
      render(<IconButton icon={<Home />} size="sm" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('w-8', 'h-8');
    });

    it('renders medium size by default', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('w-10', 'h-10');
    });

    it('renders medium size explicitly', () => {
      render(<IconButton icon={<Home />} size="md" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('w-10', 'h-10');
    });

    it('renders large size', () => {
      render(<IconButton icon={<Home />} size="lg" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('w-12', 'h-12');
    });

    it('renders extra large size', () => {
      render(<IconButton icon={<Home />} size="xl" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('w-14', 'h-14');
    });

    it('applies xs padding', () => {
      render(<IconButton icon={<Home />} size="xs" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('p-1');
    });

    it('applies sm padding', () => {
      render(<IconButton icon={<Home />} size="sm" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('p-1.5');
    });

    it('applies md padding', () => {
      render(<IconButton icon={<Home />} size="md" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('p-2');
    });

    it('applies lg padding', () => {
      render(<IconButton icon={<Home />} size="lg" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('p-2.5');
    });

    it('applies xl padding', () => {
      render(<IconButton icon={<Home />} size="xl" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('p-3');
    });

    it('maintains square dimensions for xs', () => {
      render(<IconButton icon={<Home />} size="xs" aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-6', 'h-6');
    });

    it('maintains square dimensions for sm', () => {
      render(<IconButton icon={<Home />} size="sm" aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-8', 'h-8');
    });

    it('maintains square dimensions for md', () => {
      render(<IconButton icon={<Home />} size="md" aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-10', 'h-10');
    });

    it('maintains square dimensions for lg', () => {
      render(<IconButton icon={<Home />} size="lg" aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-12', 'h-12');
    });

    it('maintains square dimensions for xl', () => {
      render(<IconButton icon={<Home />} size="xl" aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-14', 'h-14');
    });
  });

  describe('Style Variants', () => {
    it('applies ghost variant by default', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    });

    it('applies primary variant', () => {
      render(<IconButton icon={<Home />} variant="primary" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('text-white');
    });

    it('applies secondary variant', () => {
      render(<IconButton icon={<Home />} variant="secondary" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('glass');
    });

    it('applies outline variant', () => {
      render(<IconButton icon={<Home />} variant="outline" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('border');
    });

    it('applies danger variant', () => {
      render(<IconButton icon={<Home />} variant="danger" aria-label="Delete" />);
      expect(screen.getByRole('button')).toHaveClass('text-error');
    });

    it('applies success variant', () => {
      render(<IconButton icon={<Home />} variant="success" aria-label="Success" />);
      expect(screen.getByRole('button')).toHaveClass('text-success');
    });

    it('applies warning variant', () => {
      render(<IconButton icon={<Home />} variant="warning" aria-label="Warning" />);
      expect(screen.getByRole('button')).toHaveClass('text-warning');
    });

    it('applies glass variant', () => {
      render(<IconButton icon={<Home />} variant="glass" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('glass-light');
    });

    it('primary variant has gradient background', () => {
      render(<IconButton icon={<Home />} variant="primary" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('bg-gradient-accent');
    });

    it('primary variant has shadow', () => {
      render(<IconButton icon={<Home />} variant="primary" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('shadow-glass');
    });

    it('secondary variant has glass effect', () => {
      render(<IconButton icon={<Home />} variant="secondary" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('glass', 'text-primary');
    });

    it('ghost variant is transparent', () => {
      render(<IconButton icon={<Home />} variant="ghost" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('bg-transparent', 'text-muted');
    });

    it('outline variant has border', () => {
      render(<IconButton icon={<Home />} variant="outline" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('border', 'border-accent-primary');
    });

    it('danger variant has error color', () => {
      render(<IconButton icon={<Trash2 />} variant="danger" aria-label="Delete" />);
      expect(screen.getByRole('button')).toHaveClass('text-error');
    });

    it('success variant has success color', () => {
      render(<IconButton icon={<Check />} variant="success" aria-label="Confirm" />);
      expect(screen.getByRole('button')).toHaveClass('text-success');
    });

    it('warning variant has warning color', () => {
      render(<IconButton icon={<AlertCircle />} variant="warning" aria-label="Warning" />);
      expect(screen.getByRole('button')).toHaveClass('text-warning');
    });

    it('glass variant has glass-light effect', () => {
      render(<IconButton icon={<Home />} variant="glass" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('glass-light', 'shadow-glass');
    });
  });

  describe('Loading State', () => {
    it('shows loader when loading', () => {
      const { container } = render(
        <IconButton icon={<Home />} loading aria-label="Home" />
      );
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('hides original icon when loading', () => {
      const TestIcon = () => <div data-testid="test-icon">Icon</div>;
      render(<IconButton icon={<TestIcon />} loading aria-label="Home" />);
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<IconButton icon={<Home />} loading aria-label="Home" />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('sets aria-busy when loading', () => {
      render(<IconButton icon={<Home />} loading aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('shows Loader2 icon when loading', () => {
      render(<IconButton icon={<Home />} loading aria-label="Loading" />);
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('loader has animate-spin class', () => {
      const { container } = render(
        <IconButton icon={<Home />} loading aria-label="Loading" />
      );
      const loader = container.querySelector('[data-testid="loader-icon"]');
      expect(loader).toHaveClass('animate-spin');
    });

    it('loader has aria-hidden attribute', () => {
      render(<IconButton icon={<Home />} loading aria-label="Loading" />);
      const loader = screen.getByTestId('loader-icon');
      expect(loader).toHaveAttribute('aria-hidden', 'true');
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} loading onClick={handleClick} aria-label="Loading" />);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('loading takes precedence over disabled', () => {
      render(<IconButton icon={<Home />} loading disabled aria-label="Loading" />);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('sets aria-busy to false when not loading', () => {
      render(<IconButton icon={<Home />} loading={false} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<IconButton icon={<Home />} disabled aria-label="Home" />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled classes', () => {
      render(<IconButton icon={<Home />} disabled aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('disabled:cursor-not-allowed');
    });

    it('does not trigger onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} disabled onClick={handleClick} aria-label="Home" />);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies pointer-events-none when disabled', () => {
      render(<IconButton icon={<Home />} disabled aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('disabled:pointer-events-none');
    });

    it('has opacity when disabled', () => {
      render(<IconButton icon={<Home />} disabled aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
    });

    it('is disabled when loading is true', () => {
      render(<IconButton icon={<Home />} loading aria-label="Home" />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disabled state with primary variant', () => {
      render(<IconButton icon={<Home />} variant="primary" disabled aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('disabled state with danger variant', () => {
      render(<IconButton icon={<Trash2 />} variant="danger" disabled aria-label="Delete" />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('prevents keyboard activation when disabled', () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} disabled onClick={handleClick} aria-label="Home" />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} onClick={handleClick} aria-label="Home" />);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', async () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} onClick={handleClick} aria-label="Home" />);

      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('handles keyboard events with Enter', () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} onClick={handleClick} aria-label="Home" />);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalled();
    });

    it('handles keyboard events with Space', () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} onClick={handleClick} aria-label="Home" />);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ' });

      expect(handleClick).toHaveBeenCalled();
    });

    it('does not propagate click when disabled', async () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} disabled onClick={handleClick} aria-label="Home" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('can be focused', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      const button = screen.getByRole('button');

      button.focus();

      expect(button).toHaveFocus();
    });

    it('can be blurred', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      const button = screen.getByRole('button');

      button.focus();
      button.blur();

      expect(button).not.toHaveFocus();
    });

    it('handles mouseEnter', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      const button = screen.getByRole('button');

      fireEvent.mouseEnter(button);

      expect(button).toBeInTheDocument();
    });

    it('handles mouseLeave', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      const button = screen.getByRole('button');

      fireEvent.mouseLeave(button);

      expect(button).toBeInTheDocument();
    });

    it('fires onClick with event object', async () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} onClick={handleClick} aria-label="Home" />);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({
        type: 'click'
      }));
    });
  });

  describe('Accessibility', () => {
    it('has accessible label', () => {
      render(<IconButton icon={<Home />} aria-label="Go to home" />);
      expect(screen.getByLabelText('Go to home')).toBeInTheDocument();
    });

    it('sets tooltip from aria-label', () => {
      render(<IconButton icon={<Home />} aria-label="Home button" />);
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Home button');
    });

    it('prefers tooltip over aria-label for title', () => {
      render(
        <IconButton
          icon={<Home />}
          aria-label="Home"
          tooltip="Navigate to home page"
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Navigate to home page');
    });

    it('icon has aria-hidden attribute', () => {
      const { container } = render(<IconButton icon={<Home />} aria-label="Home" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('is keyboard accessible', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      const button = screen.getByRole('button');

      button.focus();

      expect(button).toHaveFocus();
    });

    it('maintains focus ring styles', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('focus:ring-4');
    });

    it('has proper aria-label for screen readers', () => {
      render(<IconButton icon={<Search />} aria-label="Search the site" />);
      expect(screen.getByLabelText('Search the site')).toBeInTheDocument();
    });

    it('tooltip provides additional context', () => {
      render(
        <IconButton
          icon={<Settings />}
          aria-label="Settings"
          tooltip="Open application settings"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Open application settings');
    });

    it('sets aria-busy during loading', () => {
      render(<IconButton icon={<Home />} loading aria-label="Loading" />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('loader icon has aria-hidden', () => {
      render(<IconButton icon={<Home />} loading aria-label="Loading" />);
      const loader = screen.getByTestId('loader-icon');
      expect(loader).toHaveAttribute('aria-hidden', 'true');
    });

    it('supports custom aria attributes', () => {
      render(
        <IconButton
          icon={<Home />}
          aria-label="Home"
          aria-describedby="home-description"
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'home-description');
    });

    it('supports aria-pressed for toggle buttons', () => {
      render(
        <IconButton
          icon={<Star />}
          aria-label="Favorite"
          aria-pressed="true"
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('supports aria-expanded for expandable controls', () => {
      render(
        <IconButton
          icon={<ChevronRight />}
          aria-label="Expand menu"
          aria-expanded="false"
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Button Types', () => {
    it('defaults to button type', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('accepts submit type', () => {
      render(<IconButton icon={<Home />} type="submit" aria-label="Submit" />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('accepts reset type', () => {
      render(<IconButton icon={<Home />} type="reset" aria-label="Reset" />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });

    it('button type prevents form submission', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <IconButton icon={<Plus />} type="button" aria-label="Add" />
        </form>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('submit type can trigger form submission', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <IconButton icon={<Check />} type="submit" aria-label="Submit" />
        </form>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<IconButton icon={<Home />} className="custom-class" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('applies multiple custom classNames', () => {
      render(<IconButton icon={<Home />} className="custom-1 custom-2" aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-1');
      expect(button).toHaveClass('custom-2');
    });

    it('forwards additional props', () => {
      render(<IconButton icon={<Home />} data-testid="icon-button" aria-label="Home" />);
      expect(screen.getByTestId('icon-button')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = React.createRef();
      render(<IconButton icon={<Home />} ref={ref} aria-label="Home" />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('forwards data attributes', () => {
      render(<IconButton icon={<Home />} data-analytics="home-button" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveAttribute('data-analytics', 'home-button');
    });

    it('forwards id attribute', () => {
      render(<IconButton icon={<Home />} id="home-button" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveAttribute('id', 'home-button');
    });

    it('forwards role attribute', () => {
      render(<IconButton icon={<Home />} role="menuitem" aria-label="Home" />);
      expect(screen.getByRole('menuitem')).toBeInTheDocument();
    });

    it('forwards tabIndex attribute', () => {
      render(<IconButton icon={<Home />} tabIndex={-1} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '-1');
    });

    it('custom className does not override base classes', () => {
      render(<IconButton icon={<Home />} className="custom" aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom');
      expect(button).toHaveClass('inline-flex');
    });
  });

  describe('Icon Sizing', () => {
    it('scales icon with button size xs', () => {
      const { container } = render(<IconButton icon={<Home />} size="xs" aria-label="Home" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '12');
      expect(svg).toHaveAttribute('height', '12');
    });

    it('scales icon with button size sm', () => {
      const { container } = render(<IconButton icon={<Home />} size="sm" aria-label="Home" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '14');
      expect(svg).toHaveAttribute('height', '14');
    });

    it('scales icon with button size md', () => {
      const { container } = render(<IconButton icon={<Home />} size="md" aria-label="Home" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });

    it('scales icon with button size lg', () => {
      const { container } = render(<IconButton icon={<Home />} size="lg" aria-label="Home" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '18');
      expect(svg).toHaveAttribute('height', '18');
    });

    it('scales icon with button size xl', () => {
      const { container } = render(<IconButton icon={<Home />} size="xl" aria-label="Home" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
    });

    it('loader respects size xs', () => {
      const { container } = render(<IconButton icon={<Home />} size="xs" loading aria-label="Loading" />);
      const loader = container.querySelector('[data-testid="loader-icon"]');
      expect(loader).toHaveAttribute('width', '12');
      expect(loader).toHaveAttribute('height', '12');
    });

    it('loader respects size sm', () => {
      const { container } = render(<IconButton icon={<Home />} size="sm" loading aria-label="Loading" />);
      const loader = container.querySelector('[data-testid="loader-icon"]');
      expect(loader).toHaveAttribute('width', '14');
      expect(loader).toHaveAttribute('height', '14');
    });

    it('loader respects size md', () => {
      const { container } = render(<IconButton icon={<Home />} size="md" loading aria-label="Loading" />);
      const loader = container.querySelector('[data-testid="loader-icon"]');
      expect(loader).toHaveAttribute('width', '16');
      expect(loader).toHaveAttribute('height', '16');
    });

    it('loader respects size lg', () => {
      const { container } = render(<IconButton icon={<Home />} size="lg" loading aria-label="Loading" />);
      const loader = container.querySelector('[data-testid="loader-icon"]');
      expect(loader).toHaveAttribute('width', '18');
      expect(loader).toHaveAttribute('height', '18');
    });

    it('loader respects size xl', () => {
      const { container } = render(<IconButton icon={<Home />} size="xl" loading aria-label="Loading" />);
      const loader = container.querySelector('[data-testid="loader-icon"]');
      expect(loader).toHaveAttribute('width', '20');
      expect(loader).toHaveAttribute('height', '20');
    });
  });

  describe('Base Classes and Styling', () => {
    it('has inline-flex display', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('inline-flex');
    });

    it('centers items', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('items-center', 'justify-center');
    });

    it('has transition classes', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('transition-all', 'duration-200');
    });

    it('has rounded-full shape', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('rounded-full');
    });

    it('has overflow-hidden', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('overflow-hidden');
    });

    it('has relative positioning', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('relative');
    });

    it('has select-none', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('select-none');
    });

    it('has transform-gpu optimization', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('transform-gpu');
    });

    it('has will-change-transform', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('will-change-transform');
    });

    it('has font-medium weight', () => {
      render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('font-medium');
    });
  });

  describe('Variant-Specific Classes', () => {
    it('primary variant has focus ring', () => {
      render(<IconButton icon={<Home />} variant="primary" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('focus:ring-4', 'focus:ring-accent-primary/30');
    });

    it('secondary variant has shadow', () => {
      render(<IconButton icon={<Home />} variant="secondary" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('shadow-sm');
    });

    it('ghost variant has text-muted', () => {
      render(<IconButton icon={<Home />} variant="ghost" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('text-muted');
    });

    it('outline variant is transparent with border', () => {
      render(<IconButton icon={<Home />} variant="outline" aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'border', 'border-accent-primary');
    });

    it('danger variant has hover effects', () => {
      render(<IconButton icon={<Trash2 />} variant="danger" aria-label="Delete" />);
      expect(screen.getByRole('button')).toHaveClass('hover:bg-error', 'hover:text-white');
    });

    it('success variant has hover effects', () => {
      render(<IconButton icon={<Check />} variant="success" aria-label="Confirm" />);
      expect(screen.getByRole('button')).toHaveClass('hover:bg-success', 'hover:text-white');
    });

    it('warning variant has hover effects', () => {
      render(<IconButton icon={<AlertCircle />} variant="warning" aria-label="Warning" />);
      expect(screen.getByRole('button')).toHaveClass('hover:bg-warning', 'hover:text-text-inverse');
    });

    it('glass variant has shadow effects', () => {
      render(<IconButton icon={<Home />} variant="glass" aria-label="Home" />);
      expect(screen.getByRole('button')).toHaveClass('shadow-glass', 'hover:shadow-combined');
    });
  });

  describe('Edge Cases', () => {
    it('handles null icon gracefully', () => {
      const { container } = render(<IconButton icon={null} aria-label="Button" />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('handles undefined icon gracefully', () => {
      const { container } = render(<IconButton icon={undefined} aria-label="Button" />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('handles empty string className', () => {
      render(<IconButton icon={<Home />} className="" aria-label="Home" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles invalid size gracefully', () => {
      render(<IconButton icon={<Home />} size="invalid" aria-label="Home" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles invalid variant gracefully', () => {
      render(<IconButton icon={<Home />} variant="invalid" aria-label="Home" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles very long aria-label', () => {
      const longLabel = 'A'.repeat(200);
      render(<IconButton icon={<Home />} aria-label={longLabel} />);
      expect(screen.getByLabelText(longLabel)).toBeInTheDocument();
    });

    it('handles very long tooltip', () => {
      const longTooltip = 'B'.repeat(200);
      render(<IconButton icon={<Home />} aria-label="Home" tooltip={longTooltip} />);
      expect(screen.getByRole('button')).toHaveAttribute('title', longTooltip);
    });

    it('handles both loading and disabled', () => {
      render(<IconButton icon={<Home />} loading disabled aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('handles onClick without event parameter', async () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} onClick={handleClick} aria-label="Home" />);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalled();
    });

    it('handles rapid clicks', async () => {
      const handleClick = jest.fn();
      render(<IconButton icon={<Home />} onClick={handleClick} aria-label="Home" />);

      const button = screen.getByRole('button');
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(5);
    });
  });

  describe('Component Props Combinations', () => {
    it('small primary button', () => {
      render(<IconButton icon={<Home />} size="sm" variant="primary" aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-8', 'h-8', 'text-white');
    });

    it('large danger button', () => {
      render(<IconButton icon={<Trash2 />} size="lg" variant="danger" aria-label="Delete" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-12', 'h-12', 'text-error');
    });

    it('extra small ghost button', () => {
      render(<IconButton icon={<X />} size="xs" variant="ghost" aria-label="Close" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-6', 'h-6', 'bg-transparent');
    });

    it('extra large glass button', () => {
      render(<IconButton icon={<Star />} size="xl" variant="glass" aria-label="Favorite" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-14', 'h-14', 'glass-light');
    });

    it('medium success button with custom class', () => {
      render(<IconButton icon={<Check />} size="md" variant="success" className="custom" aria-label="Confirm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-10', 'h-10', 'text-success', 'custom');
    });

    it('disabled primary button', () => {
      render(<IconButton icon={<Home />} variant="primary" disabled aria-label="Home" />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('text-white');
    });

    it('loading secondary button', () => {
      render(<IconButton icon={<Home />} variant="secondary" loading aria-label="Loading" />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('glass');
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('outline button with tooltip', () => {
      render(
        <IconButton
          icon={<Settings />}
          variant="outline"
          tooltip="Configure settings"
          aria-label="Settings"
        />
      );
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Configure settings');
    });
  });

  describe('Multiple Icon Types', () => {
    it('renders with Plus icon', () => {
      const { container } = render(<IconButton icon={<Plus />} aria-label="Add" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Minus icon', () => {
      const { container } = render(<IconButton icon={<Minus />} aria-label="Remove" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Edit icon', () => {
      const { container } = render(<IconButton icon={<Edit />} aria-label="Edit" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Download icon', () => {
      const { container } = render(<IconButton icon={<Download />} aria-label="Download" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Upload icon', () => {
      const { container } = render(<IconButton icon={<Upload />} aria-label="Upload" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Heart icon', () => {
      const { container } = render(<IconButton icon={<Heart />} aria-label="Like" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Bell icon', () => {
      const { container } = render(<IconButton icon={<Bell />} aria-label="Notifications" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Mail icon', () => {
      const { container } = render(<IconButton icon={<Mail />} aria-label="Email" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with Phone icon', () => {
      const { container } = render(<IconButton icon={<Phone />} aria-label="Call" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<IconButton icon={<Home />} ref={ref} aria-label="Home" />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('can call focus on ref', () => {
      const ref = React.createRef();
      render(<IconButton icon={<Home />} ref={ref} aria-label="Home" />);

      ref.current.focus();

      expect(ref.current).toHaveFocus();
    });

    it('can call blur on ref', () => {
      const ref = React.createRef();
      render(<IconButton icon={<Home />} ref={ref} aria-label="Home" />);

      ref.current.focus();
      ref.current.blur();

      expect(ref.current).not.toHaveFocus();
    });

    it('can call click on ref', () => {
      const handleClick = jest.fn();
      const ref = React.createRef();
      render(<IconButton icon={<Home />} ref={ref} onClick={handleClick} aria-label="Home" />);

      ref.current.click();

      expect(handleClick).toHaveBeenCalled();
    });

    it('can access className via ref', () => {
      const ref = React.createRef();
      render(<IconButton icon={<Home />} ref={ref} aria-label="Home" />);

      expect(ref.current.className).toContain('inline-flex');
    });

    it('can access disabled state via ref', () => {
      const ref = React.createRef();
      render(<IconButton icon={<Home />} ref={ref} disabled aria-label="Home" />);

      expect(ref.current.disabled).toBe(true);
    });
  });

  describe('Display Name', () => {
    it('has correct display name', () => {
      expect(IconButton.displayName).toBe('IconButton');
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for default variant', () => {
      const { container } = render(<IconButton icon={<Home />} aria-label="Home" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for primary variant', () => {
      const { container } = render(<IconButton icon={<Home />} variant="primary" aria-label="Home" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for loading state', () => {
      const { container } = render(<IconButton icon={<Home />} loading aria-label="Loading" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for disabled state', () => {
      const { container } = render(<IconButton icon={<Home />} disabled aria-label="Home" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for all sizes', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
      sizes.forEach(size => {
        const { container } = render(<IconButton icon={<Home />} size={size} aria-label="Home" />);
        expect(container.firstChild).toMatchSnapshot(`size-${size}`);
      });
    });

    it('matches snapshot for all variants', () => {
      const variants = ['primary', 'secondary', 'ghost', 'outline', 'danger', 'success', 'warning', 'glass'];
      variants.forEach(variant => {
        const { container } = render(<IconButton icon={<Home />} variant={variant} aria-label="Home" />);
        expect(container.firstChild).toMatchSnapshot(`variant-${variant}`);
      });
    });
  });
});

export default originalModule
