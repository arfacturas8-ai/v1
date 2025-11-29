import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComingSoonWrapper, { useWeb3FeatureFlag, withComingSoon } from './ComingSoonWrapper';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sparkles: () => <span data-testid="icon-sparkles">Sparkles</span>,
  ArrowRight: () => <span data-testid="icon-arrow-right">ArrowRight</span>,
  Clock: () => <span data-testid="icon-clock">Clock</span>,
  Zap: () => <span data-testid="icon-zap">Zap</span>,
}));

// Mock UI components
jest.mock('../ui/Card', () => {
  return function Card({ children, className, ...props }) {
    return (
      <div data-testid="card" className={className} {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('../ui/Button', () => {
  return function Button({ children, className, onClick, ...props }) {
    return (
      <button data-testid="button" className={className} onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

describe('ComingSoonWrapper', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables before each test
    import.meta.env.DEV = false;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';
  });

  afterEach(() => {
    // Restore original environment
    import.meta.env = originalEnv;
  });

  describe('Rendering', () => {
    it('renders without crashing when disabled', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders children directly when isEnabled is true', () => {
      render(
        <ComingSoonWrapper isEnabled={true}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Child Content')).toBeInTheDocument();
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });

    it('renders coming soon overlay when isEnabled is false', () => {
      render(
        <ComingSoonWrapper isEnabled={false}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument();
    });

    it('renders children directly in development mode with feature flag enabled', () => {
      import.meta.env.DEV = true;
      import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';

      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Child Content')).toBeInTheDocument();
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });

    it('renders coming soon overlay in development mode when feature flag is disabled', () => {
      import.meta.env.DEV = true;
      import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';

      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders coming soon overlay in production mode even with feature flag', () => {
      import.meta.env.DEV = false;
      import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';

      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Children Rendering', () => {
    it('renders single child element', () => {
      render(
        <ComingSoonWrapper isEnabled={true}>
          <div>Single Child</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Single Child')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ComingSoonWrapper isEnabled={true}>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
      expect(screen.getByText('Third Child')).toBeInTheDocument();
    });

    it('renders complex nested children', () => {
      render(
        <ComingSoonWrapper isEnabled={true}>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Action</button>
          </div>
        </ComingSoonWrapper>
      );
      expect(screen.getByRole('heading', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    it('renders children with props', () => {
      const ChildComponent = ({ text }) => <div>{text}</div>;
      render(
        <ComingSoonWrapper isEnabled={true}>
          <ChildComponent text="Props Test" />
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Props Test')).toBeInTheDocument();
    });

    it('renders React fragments as children', () => {
      render(
        <ComingSoonWrapper isEnabled={true}>
          <>
            <div>Fragment Child 1</div>
            <div>Fragment Child 2</div>
          </>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Fragment Child 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment Child 2')).toBeInTheDocument();
    });
  });

  describe('Feature Prop', () => {
    it('uses default feature name when not provided', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Web3 Feature Coming Soon')).toBeInTheDocument();
    });

    it('displays custom feature name in title', () => {
      render(
        <ComingSoonWrapper feature="NFT Marketplace">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('NFT Marketplace Coming Soon')).toBeInTheDocument();
    });

    it('uses custom feature name in description', () => {
      render(
        <ComingSoonWrapper feature="Token Staking">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/token staking functionality/i)).toBeInTheDocument();
    });

    it('lowercases feature name in description', () => {
      render(
        <ComingSoonWrapper feature="DAO GOVERNANCE">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/dao governance functionality/i)).toBeInTheDocument();
    });
  });

  describe('Title and Description Props', () => {
    it('displays default title when title prop not provided', () => {
      render(
        <ComingSoonWrapper feature="Web3">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Web3 Coming Soon')).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      render(
        <ComingSoonWrapper title="Revolutionary Feature Incoming">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Revolutionary Feature Incoming')).toBeInTheDocument();
      expect(screen.queryByText(/Coming Soon/i)).toBeInTheDocument();
    });

    it('displays default description when description prop not provided', () => {
      render(
        <ComingSoonWrapper feature="Crypto Wallet">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/building amazing crypto wallet functionality/i)).toBeInTheDocument();
    });

    it('displays custom description when provided', () => {
      render(
        <ComingSoonWrapper description="This is a custom description for the upcoming feature.">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('This is a custom description for the upcoming feature.')).toBeInTheDocument();
    });

    it('overrides default description with custom one', () => {
      render(
        <ComingSoonWrapper
          feature="Web3"
          description="Custom description only"
        >
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.queryByText(/building amazing web3 functionality/i)).not.toBeInTheDocument();
      expect(screen.getByText('Custom description only')).toBeInTheDocument();
    });

    it('uses both custom title and description', () => {
      render(
        <ComingSoonWrapper
          title="Amazing New Feature"
          description="Get ready for something special"
        >
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Amazing New Feature')).toBeInTheDocument();
      expect(screen.getByText('Get ready for something special')).toBeInTheDocument();
    });
  });

  describe('Expected Date', () => {
    it('displays default expected date', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/Expected Launch: Q2 2025/i)).toBeInTheDocument();
    });

    it('displays custom expected date', () => {
      render(
        <ComingSoonWrapper expectedDate="December 2025">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/Expected Launch: December 2025/i)).toBeInTheDocument();
    });

    it('displays quarter format dates', () => {
      render(
        <ComingSoonWrapper expectedDate="Q1 2026">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/Expected Launch: Q1 2026/i)).toBeInTheDocument();
    });

    it('displays specific date formats', () => {
      render(
        <ComingSoonWrapper expectedDate="January 15, 2026">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/Expected Launch: January 15, 2026/i)).toBeInTheDocument();
    });

    it('displays vague timeline', () => {
      render(
        <ComingSoonWrapper expectedDate="Coming Soon">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/Expected Launch: Coming Soon/i)).toBeInTheDocument();
    });
  });

  describe('Join Waitlist Button', () => {
    it('renders join waitlist button', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const joinButton = buttons.find(btn => btn.textContent.includes('Join Waitlist'));
      expect(joinButton).toBeInTheDocument();
    });

    it('calls onJoinWaitlist when button clicked', () => {
      const handleJoinWaitlist = jest.fn();
      render(
        <ComingSoonWrapper onJoinWaitlist={handleJoinWaitlist}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const joinButton = buttons.find(btn => btn.textContent.includes('Join Waitlist'));
      fireEvent.click(joinButton);
      expect(handleJoinWaitlist).toHaveBeenCalledTimes(1);
    });

    it('calls onJoinWaitlist multiple times when clicked multiple times', () => {
      const handleJoinWaitlist = jest.fn();
      render(
        <ComingSoonWrapper onJoinWaitlist={handleJoinWaitlist}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const joinButton = buttons.find(btn => btn.textContent.includes('Join Waitlist'));
      fireEvent.click(joinButton);
      fireEvent.click(joinButton);
      fireEvent.click(joinButton);
      expect(handleJoinWaitlist).toHaveBeenCalledTimes(3);
    });

    it('does not throw error when onJoinWaitlist is not provided', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const joinButton = buttons.find(btn => btn.textContent.includes('Join Waitlist'));
      expect(() => fireEvent.click(joinButton)).not.toThrow();
    });

    it('displays ArrowRight icon in join waitlist button', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('icon-arrow-right')).toBeInTheDocument();
    });
  });

  describe('Learn More Button', () => {
    it('renders learn more button', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const learnMoreButton = buttons.find(btn => btn.textContent.includes('Learn More'));
      expect(learnMoreButton).toBeInTheDocument();
    });

    it('applies secondary button class', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const learnMoreButton = buttons.find(btn => btn.textContent.includes('Learn More'));
      expect(learnMoreButton.className).toContain('btn-secondary');
    });
  });

  describe('Icons Display', () => {
    it('displays Sparkles icon', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument();
    });

    it('displays Clock icon in Soon badge', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
    });

    it('displays Zap icon in expected launch section', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('icon-zap')).toBeInTheDocument();
    });

    it('displays all required icons', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument();
      expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
      expect(screen.getByTestId('icon-zap')).toBeInTheDocument();
      expect(screen.getByTestId('icon-arrow-right')).toBeInTheDocument();
    });
  });

  describe('Preview Mode', () => {
    it('does not show preview when showPreview is false', () => {
      render(
        <ComingSoonWrapper showPreview={false}>
          <div data-testid="preview-content">Preview Content</div>
        </ComingSoonWrapper>
      );
      const previewElements = screen.queryAllByTestId('preview-content');
      expect(previewElements.length).toBe(0);
    });

    it('shows blurred preview when showPreview is true', () => {
      render(
        <ComingSoonWrapper showPreview={true}>
          <div data-testid="preview-content">Preview Content</div>
        </ComingSoonWrapper>
      );
      const previewElements = screen.queryAllByTestId('preview-content');
      expect(previewElements.length).toBeGreaterThan(0);
    });

    it('shows Feature Preview badge when showPreview is true', () => {
      render(
        <ComingSoonWrapper showPreview={true}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Feature Preview Available')).toBeInTheDocument();
    });

    it('does not show Feature Preview badge when showPreview is false', () => {
      render(
        <ComingSoonWrapper showPreview={false}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.queryByText('Feature Preview Available')).not.toBeInTheDocument();
    });

    it('applies blur class to preview content', () => {
      const { container } = render(
        <ComingSoonWrapper showPreview={true}>
          <div data-testid="preview-content">Preview Content</div>
        </ComingSoonWrapper>
      );
      const blurredElement = container.querySelector('.blur-sm');
      expect(blurredElement).toBeInTheDocument();
    });

    it('applies opacity to preview content', () => {
      const { container } = render(
        <ComingSoonWrapper showPreview={true}>
          <div data-testid="preview-content">Preview Content</div>
        </ComingSoonWrapper>
      );
      const opacityElement = container.querySelector('.opacity-30');
      expect(opacityElement).toBeInTheDocument();
    });

    it('makes preview content non-interactive', () => {
      const { container } = render(
        <ComingSoonWrapper showPreview={true}>
          <div data-testid="preview-content">Preview Content</div>
        </ComingSoonWrapper>
      );
      const nonInteractive = container.querySelector('.pointer-events-none');
      expect(nonInteractive).toBeInTheDocument();
    });
  });

  describe('Development Mode Notice', () => {
    it('shows development notice when in development mode', () => {
      import.meta.env.DEV = true;
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/Development Mode:/i)).toBeInTheDocument();
    });

    it('does not show development notice in production mode', () => {
      import.meta.env.DEV = false;
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.queryByText(/Development Mode:/i)).not.toBeInTheDocument();
    });

    it('shows environment variable instruction in development mode', () => {
      import.meta.env.DEV = true;
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/VITE_ENABLE_WEB3_FEATURES=true/i)).toBeInTheDocument();
    });

    it('displays code element for environment variable', () => {
      import.meta.env.DEV = true;
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const codeElement = container.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement.textContent).toContain('VITE_ENABLE_WEB3_FEATURES=true');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies gradient background to card', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card.className).toMatch(/bg-gradient-to-br/i);
    });

    it('applies primary accent color classes', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card.className).toMatch(/accent-primary/i);
    });

    it('applies secondary accent color classes', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card.className).toMatch(/accent-secondary/i);
    });

    it('applies border styling', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card.className).toMatch(/border/i);
    });

    it('applies padding to card', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const card = screen.getByTestId('card');
      expect(card.className).toMatch(/p-lg/i);
    });

    it('applies button primary class to join waitlist button', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const joinButton = buttons.find(btn => btn.textContent.includes('Join Waitlist'));
      expect(joinButton.className).toMatch(/btn-primary/i);
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined children gracefully', () => {
      render(<ComingSoonWrapper>{undefined}</ComingSoonWrapper>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('handles null children gracefully', () => {
      render(<ComingSoonWrapper>{null}</ComingSoonWrapper>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('handles empty string children', () => {
      render(<ComingSoonWrapper>{''}</ComingSoonWrapper>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<ComingSoonWrapper>{false}</ComingSoonWrapper>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('handles empty feature name', () => {
      render(
        <ComingSoonWrapper feature="">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(' Coming Soon')).toBeInTheDocument();
    });

    it('handles empty title', () => {
      render(
        <ComingSoonWrapper title="">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const headings = document.querySelectorAll('h3');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('handles empty description', () => {
      render(
        <ComingSoonWrapper description="">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('handles empty expectedDate', () => {
      render(
        <ComingSoonWrapper expectedDate="">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/Expected Launch:/i)).toBeInTheDocument();
    });

    it('handles very long feature names', () => {
      const longFeature = 'This is an extremely long feature name that might cause layout issues if not handled properly';
      render(
        <ComingSoonWrapper feature={longFeature}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(`${longFeature} Coming Soon`)).toBeInTheDocument();
    });

    it('handles very long descriptions', () => {
      const longDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
      render(
        <ComingSoonWrapper description={longDescription}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles special characters in feature name', () => {
      render(
        <ComingSoonWrapper feature="NFT's & Token's">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText("NFT's & Token's Coming Soon")).toBeInTheDocument();
    });

    it('handles HTML in description as text', () => {
      render(
        <ComingSoonWrapper description="<script>alert('test')</script>">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText("<script>alert('test')</script>")).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      const { container } = render(
        <ComingSoonWrapper title="Test Feature">
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toContain('Test Feature');
    });

    it('has text content for all icons via data-testid', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument();
      expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
      expect(screen.getByTestId('icon-zap')).toBeInTheDocument();
      expect(screen.getByTestId('icon-arrow-right')).toBeInTheDocument();
    });

    it('has descriptive text for Soon badge', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Soon')).toBeInTheDocument();
    });

    it('has descriptive button text', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      expect(buttons.some(btn => btn.textContent.includes('Join Waitlist'))).toBe(true);
      expect(buttons.some(btn => btn.textContent.includes('Learn More'))).toBe(true);
    });

    it('has semantic HTML structure', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(container.querySelector('h3')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    it('centers text for readability', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });

    it('limits description width for readability', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const maxWidth = container.querySelector('.max-w-md');
      expect(maxWidth).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('supports keyboard navigation on join waitlist button', async () => {
      const user = userEvent.setup();
      const handleJoinWaitlist = jest.fn();
      render(
        <ComingSoonWrapper onJoinWaitlist={handleJoinWaitlist}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const joinButton = buttons.find(btn => btn.textContent.includes('Join Waitlist'));

      joinButton.focus();
      await user.keyboard('{Enter}');
      expect(handleJoinWaitlist).toHaveBeenCalled();
    });

    it('join waitlist button receives focus', () => {
      render(
        <ComingSoonWrapper onJoinWaitlist={jest.fn()}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const joinButton = buttons.find(btn => btn.textContent.includes('Join Waitlist'));

      joinButton.focus();
      expect(document.activeElement).toBe(joinButton);
    });

    it('learn more button receives focus', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttons = screen.getAllByTestId('button');
      const learnMoreButton = buttons.find(btn => btn.textContent.includes('Learn More'));

      learnMoreButton.focus();
      expect(document.activeElement).toBe(learnMoreButton);
    });
  });

  describe('Component State', () => {
    it('maintains consistent state when props change', () => {
      const { rerender } = render(
        <ComingSoonWrapper feature="Feature 1">
          <div>Content 1</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Feature 1 Coming Soon')).toBeInTheDocument();

      rerender(
        <ComingSoonWrapper feature="Feature 2">
          <div>Content 2</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Feature 2 Coming Soon')).toBeInTheDocument();
      expect(screen.queryByText('Feature 1 Coming Soon')).not.toBeInTheDocument();
    });

    it('toggles between enabled and disabled states', () => {
      const { rerender } = render(
        <ComingSoonWrapper isEnabled={false}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();

      rerender(
        <ComingSoonWrapper isEnabled={true}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('updates children when changed', () => {
      const { rerender } = render(
        <ComingSoonWrapper isEnabled={true}>
          <div>Original Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Original Content')).toBeInTheDocument();

      rerender(
        <ComingSoonWrapper isEnabled={true}>
          <div>Updated Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Updated Content')).toBeInTheDocument();
      expect(screen.queryByText('Original Content')).not.toBeInTheDocument();
    });
  });

  describe('Soon Badge', () => {
    it('displays Soon badge', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText('Soon')).toBeInTheDocument();
    });

    it('Soon badge contains Clock icon', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const badge = screen.getByText('Soon').parentElement;
      expect(badge.querySelector('[data-testid="icon-clock"]')).toBeTruthy();
    });

    it('Soon badge has proper styling classes', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const badge = screen.getByText('Soon').parentElement;
      expect(badge.className).toMatch(/inline-flex/i);
      expect(badge.className).toMatch(/items-center/i);
    });
  });

  describe('Expected Launch Section', () => {
    it('displays expected launch section', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(screen.getByText(/Expected Launch:/i)).toBeInTheDocument();
    });

    it('expected launch section contains Zap icon', () => {
      render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const section = screen.getByText(/Expected Launch:/i).closest('div');
      expect(section.querySelector('[data-testid="icon-zap"]')).toBeTruthy();
    });

    it('applies gradient background to expected launch section', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const section = screen.getByText(/Expected Launch:/i).closest('div');
      expect(section.className).toMatch(/bg-gradient/i);
    });
  });

  describe('Layout and Structure', () => {
    it('uses relative positioning for wrapper', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const wrapper = container.firstChild;
      expect(wrapper.className).toContain('relative');
    });

    it('applies z-index to overlay', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const overlay = container.querySelector('.z-10');
      expect(overlay).toBeInTheDocument();
    });

    it('stacks elements correctly with preview', () => {
      const { container } = render(
        <ComingSoonWrapper showPreview={true}>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      expect(container.querySelector('.absolute.inset-0')).toBeInTheDocument();
      expect(container.querySelector('.relative.z-10')).toBeInTheDocument();
    });

    it('uses space-y for vertical spacing', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const spacedSection = container.querySelector('.space-y-lg');
      expect(spacedSection).toBeInTheDocument();
    });

    it('uses flexbox for button layout', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive flex direction classes', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttonContainer = container.querySelector('.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('uses gap for button spacing', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const buttonContainer = container.querySelector('.gap-md');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('centers content on mobile and desktop', () => {
      const { container } = render(
        <ComingSoonWrapper>
          <div>Child Content</div>
        </ComingSoonWrapper>
      );
      const centered = container.querySelector('.justify-center');
      expect(centered).toBeInTheDocument();
    });
  });
});

describe('useWeb3FeatureFlag', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';
  });

  afterEach(() => {
    import.meta.env = originalEnv;
  });

  it('returns isEnabled false when not in development', () => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';

    let hookResult;
    function TestComponent() {
      hookResult = useWeb3FeatureFlag();
      return null;
    }

    render(<TestComponent />);
    expect(hookResult.isEnabled).toBe(false);
  });

  it('returns isEnabled false when in development but feature flag disabled', () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';

    let hookResult;
    function TestComponent() {
      hookResult = useWeb3FeatureFlag();
      return null;
    }

    render(<TestComponent />);
    expect(hookResult.isEnabled).toBe(false);
  });

  it('returns isEnabled true when in development and feature flag enabled', () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';

    let hookResult;
    function TestComponent() {
      hookResult = useWeb3FeatureFlag();
      return null;
    }

    render(<TestComponent />);
    expect(hookResult.isEnabled).toBe(true);
  });

  it('returns isDevelopment flag', () => {
    import.meta.env.DEV = true;

    let hookResult;
    function TestComponent() {
      hookResult = useWeb3FeatureFlag();
      return null;
    }

    render(<TestComponent />);
    expect(hookResult.isDevelopment).toBe(true);
  });

  it('returns enableWeb3Features flag', () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';

    let hookResult;
    function TestComponent() {
      hookResult = useWeb3FeatureFlag();
      return null;
    }

    render(<TestComponent />);
    expect(hookResult.enableWeb3Features).toBe(true);
  });

  it('returns all three properties', () => {
    let hookResult;
    function TestComponent() {
      hookResult = useWeb3FeatureFlag();
      return null;
    }

    render(<TestComponent />);
    expect(hookResult).toHaveProperty('isEnabled');
    expect(hookResult).toHaveProperty('isDevelopment');
    expect(hookResult).toHaveProperty('enableWeb3Features');
  });

  it('handles feature flag as non-string value', () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = undefined;

    let hookResult;
    function TestComponent() {
      hookResult = useWeb3FeatureFlag();
      return null;
    }

    render(<TestComponent />);
    expect(hookResult.isEnabled).toBe(false);
  });

  it('is case sensitive for feature flag value', () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'True';

    let hookResult;
    function TestComponent() {
      hookResult = useWeb3FeatureFlag();
      return null;
    }

    render(<TestComponent />);
    expect(hookResult.isEnabled).toBe(false);
  });
});

describe('withComingSoon HOC', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';
  });

  afterEach(() => {
    import.meta.env = originalEnv;
  });

  it('wraps component with ComingSoonWrapper', () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withComingSoon(TestComponent);

    render(<WrappedComponent />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('passes props to wrapped component when enabled', () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';

    const TestComponent = ({ testProp }) => <div>{testProp}</div>;
    const WrappedComponent = withComingSoon(TestComponent);

    render(<WrappedComponent testProp="Test Value" />);
    expect(screen.getByText('Test Value')).toBeInTheDocument();
  });

  it('passes options to ComingSoonWrapper', () => {
    const TestComponent = () => <div>Test Component</div>;
    const options = {
      feature: 'Custom Feature',
      expectedDate: 'Q3 2025'
    };
    const WrappedComponent = withComingSoon(TestComponent, options);

    render(<WrappedComponent />);
    expect(screen.getByText('Custom Feature Coming Soon')).toBeInTheDocument();
    expect(screen.getByText(/Q3 2025/i)).toBeInTheDocument();
  });

  it('respects feature flag from hook', () => {
    import.meta.env.DEV = false;

    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withComingSoon(TestComponent);

    render(<WrappedComponent />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('shows wrapped component when feature enabled', () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';

    const TestComponent = () => <div>Actual Component</div>;
    const WrappedComponent = withComingSoon(TestComponent);

    render(<WrappedComponent />);
    expect(screen.getByText('Actual Component')).toBeInTheDocument();
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  it('preserves component display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';
    const WrappedComponent = withComingSoon(TestComponent);

    expect(WrappedComponent.name).toBe('ComingSoonHOC');
  });

  it('handles multiple HOC applications', () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedOnce = withComingSoon(TestComponent);
    const WrappedTwice = withComingSoon(WrappedOnce);

    render(<WrappedTwice />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('accepts all ComingSoonWrapper options', () => {
    const TestComponent = () => <div>Test</div>;
    const options = {
      feature: 'NFT',
      title: 'Custom Title',
      description: 'Custom Description',
      expectedDate: 'Soon',
      showPreview: true,
      onJoinWaitlist: jest.fn()
    };
    const WrappedComponent = withComingSoon(TestComponent, options);

    render(<WrappedComponent />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
    expect(screen.getByText(/Soon/i)).toBeInTheDocument();
  });

  it('calls onJoinWaitlist from options', () => {
    const handleJoinWaitlist = jest.fn();
    const TestComponent = () => <div>Test</div>;
    const options = { onJoinWaitlist: handleJoinWaitlist };
    const WrappedComponent = withComingSoon(TestComponent, options);

    render(<WrappedComponent />);
    const buttons = screen.getAllByTestId('button');
    const joinButton = buttons.find(btn => btn.textContent.includes('Join Waitlist'));
    fireEvent.click(joinButton);

    expect(handleJoinWaitlist).toHaveBeenCalled();
  });

  it('renders complex wrapped components', () => {
    const ComplexComponent = ({ title, items }) => (
      <div>
        <h1>{title}</h1>
        <ul>
          {items.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      </div>
    );

    import.meta.env.DEV = true;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';

    const WrappedComponent = withComingSoon(ComplexComponent);

    render(<WrappedComponent title="Test" items={['One', 'Two', 'Three']} />);
    expect(screen.getByRole('heading', { name: 'Test' })).toBeInTheDocument();
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';
  });

  afterEach(() => {
    import.meta.env = originalEnv;
  });

  it('shows complete coming soon experience', () => {
    const handleJoinWaitlist = jest.fn();
    render(
      <ComingSoonWrapper
        feature="NFT Marketplace"
        title="NFT Marketplace Coming Soon"
        description="Trade and collect unique digital assets"
        expectedDate="Q1 2026"
        onJoinWaitlist={handleJoinWaitlist}
        showPreview={true}
      >
        <div>Marketplace Content</div>
      </ComingSoonWrapper>
    );

    expect(screen.getByText('NFT Marketplace Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('Trade and collect unique digital assets')).toBeInTheDocument();
    expect(screen.getByText(/Q1 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Feature Preview Available')).toBeInTheDocument();

    const buttons = screen.getAllByTestId('button');
    const joinButton = buttons.find(btn => btn.textContent.includes('Join Waitlist'));
    fireEvent.click(joinButton);

    expect(handleJoinWaitlist).toHaveBeenCalled();
  });

  it('toggles between disabled and enabled states dynamically', () => {
    const { rerender } = render(
      <ComingSoonWrapper isEnabled={false} feature="Web3 Wallet">
        <div>Wallet Interface</div>
      </ComingSoonWrapper>
    );

    expect(screen.getByText('Web3 Wallet Coming Soon')).toBeInTheDocument();
    expect(screen.queryByText('Wallet Interface')).not.toBeInTheDocument();

    rerender(
      <ComingSoonWrapper isEnabled={true} feature="Web3 Wallet">
        <div>Wallet Interface</div>
      </ComingSoonWrapper>
    );

    expect(screen.queryByText('Web3 Wallet Coming Soon')).not.toBeInTheDocument();
    expect(screen.getByText('Wallet Interface')).toBeInTheDocument();
  });

  it('works with HOC and respects environment variables', () => {
    const TestComponent = ({ message }) => <div>{message}</div>;
    const WrappedComponent = withComingSoon(TestComponent, {
      feature: 'Token Staking',
      expectedDate: 'Q2 2026'
    });

    import.meta.env.DEV = false;
    const { rerender } = render(<WrappedComponent message="Staking Dashboard" />);

    expect(screen.getByText('Token Staking Coming Soon')).toBeInTheDocument();
    expect(screen.queryByText('Staking Dashboard')).not.toBeInTheDocument();

    import.meta.env.DEV = true;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';

    rerender(<WrappedComponent message="Staking Dashboard" />);
    expect(screen.getByText('Staking Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Token Staking Coming Soon')).not.toBeInTheDocument();
  });

  it('handles multiple instances with different configurations', () => {
    render(
      <div>
        <ComingSoonWrapper feature="Feature A" expectedDate="Q1 2026">
          <div>Content A</div>
        </ComingSoonWrapper>
        <ComingSoonWrapper feature="Feature B" expectedDate="Q2 2026">
          <div>Content B</div>
        </ComingSoonWrapper>
      </div>
    );

    expect(screen.getByText('Feature A Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('Feature B Coming Soon')).toBeInTheDocument();
    expect(screen.getByText(/Q1 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Q2 2026/i)).toBeInTheDocument();
  });

  it('maintains preview visibility across rerenders', () => {
    const { rerender } = render(
      <ComingSoonWrapper showPreview={true}>
        <div data-testid="preview-child">Preview Content</div>
      </ComingSoonWrapper>
    );

    expect(screen.getAllByTestId('preview-child').length).toBeGreaterThan(0);

    rerender(
      <ComingSoonWrapper showPreview={true}>
        <div data-testid="preview-child">Updated Preview Content</div>
      </ComingSoonWrapper>
    );

    expect(screen.getAllByTestId('preview-child').length).toBeGreaterThan(0);
  });
});

describe('Snapshot Tests', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';
  });

  afterEach(() => {
    import.meta.env = originalEnv;
  });

  it('matches snapshot for default state', () => {
    const { container } = render(
      <ComingSoonWrapper>
        <div>Child Content</div>
      </ComingSoonWrapper>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for enabled state', () => {
    const { container } = render(
      <ComingSoonWrapper isEnabled={true}>
        <div>Child Content</div>
      </ComingSoonWrapper>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with custom props', () => {
    const { container } = render(
      <ComingSoonWrapper
        feature="NFT Marketplace"
        title="Custom Title"
        description="Custom Description"
        expectedDate="Q3 2026"
        showPreview={true}
      >
        <div>Child Content</div>
      </ComingSoonWrapper>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot in development mode', () => {
    import.meta.env.DEV = true;
    const { container } = render(
      <ComingSoonWrapper>
        <div>Child Content</div>
      </ComingSoonWrapper>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with preview enabled', () => {
    const { container } = render(
      <ComingSoonWrapper showPreview={true}>
        <div>Child Content</div>
      </ComingSoonWrapper>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

export default Card
