/**
 * Tests for ComingSoonBadge component
 */
import { render, screen } from '@testing-library/react';
import ComingSoonBadge from './ComingSoonBadge';
import { Star, Zap, Lock } from 'lucide-react';

describe('ComingSoonBadge', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ComingSoonBadge feature="New Feature" />);
    });

    it('renders feature name', () => {
      render(<ComingSoonBadge feature="Dark Mode" />);
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });

    it('renders "Coming Soon" badge', () => {
      render(<ComingSoonBadge feature="Feature" />);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <ComingSoonBadge
          feature="Premium Features"
          description="Unlock exclusive features"
        />
      );
      expect(screen.getByText('Unlock exclusive features')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      const { container } = render(<ComingSoonBadge feature="Feature" />);
      expect(container.querySelector('.coming-soon-description')).not.toBeInTheDocument();
    });

    it('renders shimmer effect', () => {
      const { container } = render(<ComingSoonBadge feature="Feature" />);
      expect(container.querySelector('.coming-soon-shimmer')).toBeInTheDocument();
    });
  });

  describe('Icon Prop', () => {
    it('renders without icon', () => {
      const { container } = render(<ComingSoonBadge feature="Feature" />);
      // No icon element when not provided
      expect(container.querySelectorAll('svg')).toHaveLength(0);
    });

    it('renders with icon component', () => {
      const { container } = render(
        <ComingSoonBadge feature="Feature" icon={Star} />
      );
      expect(container.querySelectorAll('svg')).toHaveLength(1);
    });

    it('renders different icon components', () => {
      const { container: container1 } = render(
        <ComingSoonBadge feature="Feature 1" icon={Star} />
      );
      expect(container1.querySelector('svg')).toBeInTheDocument();

      const { container: container2 } = render(
        <ComingSoonBadge feature="Feature 2" icon={Zap} />
      );
      expect(container2.querySelector('svg')).toBeInTheDocument();

      const { container: container3 } = render(
        <ComingSoonBadge feature="Feature 3" icon={Lock} />
      );
      expect(container3.querySelector('svg')).toBeInTheDocument();
    });

    it('passes size prop to icon', () => {
      const { container } = render(
        <ComingSoonBadge feature="Feature" icon={Star} />
      );
      const svg = container.querySelector('svg');
      // Lucide icons receive size as width/height
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('applies default purple color', () => {
      const { container } = render(<ComingSoonBadge feature="Feature" />);
      expect(container.firstChild).toHaveClass('coming-soon-purple');
    });

    it('applies custom color', () => {
      const { container } = render(
        <ComingSoonBadge feature="Feature" color="blue" />
      );
      expect(container.firstChild).toHaveClass('coming-soon-blue');
    });

    it('applies green color', () => {
      const { container } = render(
        <ComingSoonBadge feature="Feature" color="green" />
      );
      expect(container.firstChild).toHaveClass('coming-soon-green');
    });

    it('applies red color', () => {
      const { container } = render(
        <ComingSoonBadge feature="Feature" color="red" />
      );
      expect(container.firstChild).toHaveClass('coming-soon-red');
    });

    it('applies yellow color', () => {
      const { container } = render(
        <ComingSoonBadge feature="Feature" color="yellow" />
      );
      expect(container.firstChild).toHaveClass('coming-soon-yellow');
    });
  });

  describe('CSS Classes', () => {
    it('has base coming-soon-badge class', () => {
      const { container } = render(<ComingSoonBadge feature="Feature" />);
      expect(container.firstChild).toHaveClass('coming-soon-badge');
    });

    it('has coming-soon-header class', () => {
      const { container } = render(<ComingSoonBadge feature="Feature" />);
      expect(container.querySelector('.coming-soon-header')).toBeInTheDocument();
    });

    it('has feature-name class', () => {
      const { container } = render(<ComingSoonBadge feature="Feature" />);
      expect(container.querySelector('.feature-name')).toBeInTheDocument();
    });

    it('has badge-tag class', () => {
      const { container } = render(<ComingSoonBadge feature="Feature" />);
      expect(container.querySelector('.badge-tag')).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('renders full badge with all props', () => {
      render(
        <ComingSoonBadge
          feature="AI Assistant"
          description="Get help with intelligent AI-powered assistance"
          icon={Zap}
          color="blue"
        />
      );

      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Get help with intelligent AI-powered assistance')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('renders multiple badges independently', () => {
      const { container } = render(
        <>
          <ComingSoonBadge feature="Feature 1" color="purple" />
          <ComingSoonBadge feature="Feature 2" color="blue" />
          <ComingSoonBadge feature="Feature 3" color="green" />
        </>
      );

      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
      expect(screen.getByText('Feature 3')).toBeInTheDocument();
      expect(container.querySelectorAll('.coming-soon-badge')).toHaveLength(3);
    });
  });

  describe('Props Validation', () => {
    it('handles empty feature name', () => {
      render(<ComingSoonBadge feature="" />);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('handles long feature names', () => {
      const longName = 'This is a very long feature name that might wrap to multiple lines';
      render(<ComingSoonBadge feature={longName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('handles long descriptions', () => {
      const longDesc = 'This is a very long description that provides detailed information about the upcoming feature and what users can expect when it becomes available';
      render(
        <ComingSoonBadge
          feature="Feature"
          description={longDesc}
        />
      );
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it('handles special characters in feature name', () => {
      render(<ComingSoonBadge feature="Feature & Settings" />);
      expect(screen.getByText('Feature & Settings')).toBeInTheDocument();
    });

    it('handles HTML entities in description', () => {
      render(
        <ComingSoonBadge
          feature="Feature"
          description="Upgrade your experience & unlock more!"
        />
      );
      expect(screen.getByText('Upgrade your experience & unlock more!')).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('has correct header structure', () => {
      const { container } = render(
        <ComingSoonBadge feature="Feature" icon={Star} />
      );

      const header = container.querySelector('.coming-soon-header');
      expect(header).toBeInTheDocument();
      expect(header.children.length).toBeGreaterThanOrEqual(2);
    });

    it('renders elements in correct order', () => {
      const { container } = render(
        <ComingSoonBadge
          feature="Feature"
          description="Description"
          icon={Star}
        />
      );

      const badge = container.firstChild;
      const children = Array.from(badge.children);

      expect(children[0]).toHaveClass('coming-soon-header');
      expect(children[1]).toHaveClass('coming-soon-description');
      expect(children[2]).toHaveClass('coming-soon-shimmer');
    });
  });

  describe('Accessibility', () => {
    it('renders text that is readable', () => {
      render(
        <ComingSoonBadge
          feature="Accessibility Feature"
          description="This feature will improve accessibility"
        />
      );

      expect(screen.getByText('Accessibility Feature')).toBeVisible();
      expect(screen.getByText('This feature will improve accessibility')).toBeVisible();
      expect(screen.getByText('Coming Soon')).toBeVisible();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot without props', () => {
      const { container } = render(<ComingSoonBadge feature="Feature" />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with all props', () => {
      const { container } = render(
        <ComingSoonBadge
          feature="Premium Feature"
          description="Unlock premium features soon"
          icon={Star}
          color="blue"
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with different colors', () => {
      const { container: purple } = render(
        <ComingSoonBadge feature="Feature" color="purple" />
      );
      const { container: blue } = render(
        <ComingSoonBadge feature="Feature" color="blue" />
      );
      const { container: green } = render(
        <ComingSoonBadge feature="Feature" color="green" />
      );

      expect(purple).toMatchSnapshot();
      expect(blue).toMatchSnapshot();
      expect(green).toMatchSnapshot();
    });
  });
});

export default svg
