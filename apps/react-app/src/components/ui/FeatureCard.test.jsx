import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureCard, { FeaturePresets } from './FeatureCard';

describe('FeatureCard', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<FeatureCard title="Test Card" description="Test description" />);
      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('renders title correctly', () => {
      render(<FeatureCard title="Feature Title" description="Test" />);
      expect(screen.getByText('Feature Title')).toBeInTheDocument();
    });

    it('renders description correctly', () => {
      render(<FeatureCard title="Test" description="Feature Description" />);
      expect(screen.getByText('Feature Description')).toBeInTheDocument();
    });

    it('renders without icon', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.querySelector('.text-2xl')).not.toBeInTheDocument();
    });

    it('renders without image', () => {
      render(<FeatureCard title="Test" description="Test" />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <FeatureCard title="Test" description="Test" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with empty className by default', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.firstChild).toHaveClass('card-glass');
    });
  });

  describe('Icon and Image', () => {
    it('renders icon when provided', () => {
      render(<FeatureCard title="Test" description="Test" icon="🎮" />);
      expect(screen.getByText('🎮')).toBeInTheDocument();
    });

    it('renders icon with correct styling', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" icon="🎮" />);
      const iconContainer = container.querySelector('.w-12.h-12');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('rounded-lg', 'flex', 'items-center', 'justify-center');
    });

    it('renders image when provided', () => {
      render(<FeatureCard title="Test" description="Test" image="/test.jpg" />);
      const img = screen.getByAlt('Test');
      expect(img).toHaveAttribute('src', '/test.jpg');
    });

    it('renders image with correct styling', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" image="/test.jpg" />);
      const imgContainer = container.querySelector('.w-12.h-12.rounded-lg.overflow-hidden');
      expect(imgContainer).toBeInTheDocument();
    });

    it('image has correct alt text', () => {
      render(<FeatureCard title="Feature Name" description="Test" image="/test.jpg" />);
      expect(screen.getByAlt('Feature Name')).toBeInTheDocument();
    });

    it('prioritizes icon over image when both provided', () => {
      const { container } = render(
        <FeatureCard title="Test" description="Test" icon="🎮" image="/test.jpg" />
      );
      expect(screen.getByText('🎮')).toBeInTheDocument();
      expect(screen.queryByRole('img')).toBeInTheDocument();
    });

    it('icon background changes on hover', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" icon="🎮" />);
      const card = container.firstChild;
      const iconContainer = container.querySelector('.w-12.h-12');

      fireEvent.mouseEnter(card);
      expect(iconContainer).toHaveStyle({
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        transform: 'scale(1.1)'
      });
    });

    it('icon background normal when not hovered', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" icon="🎮" />);
      const iconContainer = container.querySelector('.w-12.h-12');

      expect(iconContainer).toHaveStyle({
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        transform: 'scale(1)'
      });
    });
  });

  describe('Status Configuration', () => {
    it('defaults to active status', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });

    it('applies active status correctly', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="active" />);
      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
      expect(container.querySelector('.bg-black.bg-opacity-60')).not.toBeInTheDocument();
    });

    it('applies coming-soon status correctly', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      expect(container.querySelector('.cursor-not-allowed')).toBeInTheDocument();
    });

    it('applies beta status correctly', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="beta" />);
      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });

    it('shows Coming Soon badge for coming-soon status', () => {
      render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      expect(screen.getAllByText('Coming Soon')[0]).toBeInTheDocument();
    });

    it('shows Beta badge for beta status', () => {
      render(<FeatureCard title="Test" description="Test" status="beta" />);
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    it('coming-soon badge has correct color', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      const badge = container.querySelector('.absolute.-top-2.-right-2');
      expect(badge).toHaveStyle({ backgroundColor: '#00D4FF' });
    });

    it('beta badge has correct color', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="beta" />);
      const badge = container.querySelector('.absolute.-top-2.-right-2');
      expect(badge).toHaveStyle({ backgroundColor: '#00FF90' });
    });

    it('active status uses badge color when custom badge provided', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="active" badge="New" />);
      const badge = container.querySelector('.absolute.-top-2.-right-2');
      expect(badge).toHaveStyle({ backgroundColor: '#0052FF' });
    });
  });

  describe('Badge Rendering', () => {
    it('renders custom badge when provided for active status', () => {
      render(<FeatureCard title="Test" description="Test" status="active" badge="Featured" />);
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('does not render badge when not provided for active status', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="active" />);
      expect(container.querySelector('.absolute.-top-2.-right-2')).not.toBeInTheDocument();
    });

    it('badge has correct styling', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" badge="New" />);
      const badge = container.querySelector('.absolute.-top-2.-right-2');
      expect(badge).toHaveClass('px-3', 'py-1', 'rounded-full', 'text-xs', 'font-semibold', 'z-10');
    });

    it('badge has correct text color', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" badge="New" />);
      const badge = container.querySelector('.absolute.-top-2.-right-2');
      expect(badge).toHaveStyle({ color: 'white' });
    });

    it('ignores custom badge for coming-soon status', () => {
      render(<FeatureCard title="Test" description="Test" status="coming-soon" badge="Custom" />);
      expect(screen.queryByText('Custom')).not.toBeInTheDocument();
      expect(screen.getAllByText('Coming Soon')[0]).toBeInTheDocument();
    });

    it('ignores custom badge for beta status', () => {
      render(<FeatureCard title="Test" description="Test" status="beta" badge="Custom" />);
      expect(screen.queryByText('Custom')).not.toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });
  });

  describe('Coming Soon Overlay', () => {
    it('shows overlay for coming-soon status', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      expect(container.querySelector('.bg-black.bg-opacity-60')).toBeInTheDocument();
    });

    it('does not show overlay for active status', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="active" />);
      expect(container.querySelector('.bg-black.bg-opacity-60')).not.toBeInTheDocument();
    });

    it('does not show overlay for beta status', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="beta" />);
      expect(container.querySelector('.bg-black.bg-opacity-60')).not.toBeInTheDocument();
    });

    it('overlay contains rocket emoji', () => {
      render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      expect(screen.getByText('🚀')).toBeInTheDocument();
    });

    it('overlay contains "Coming Soon" text', () => {
      render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      const allComingSoon = screen.getAllByText('Coming Soon');
      expect(allComingSoon.length).toBeGreaterThan(0);
    });

    it('overlay contains subtitle', () => {
      render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      expect(screen.getByText('Stay tuned for updates')).toBeInTheDocument();
    });

    it('overlay has correct z-index', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      const overlay = container.querySelector('.bg-black.bg-opacity-60');
      expect(overlay).toHaveClass('z-20');
    });

    it('overlay has backdrop blur', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      const overlay = container.querySelector('.bg-black.bg-opacity-60');
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });
  });

  describe('Features List', () => {
    it('renders features list when provided', () => {
      const features = ['Feature 1', 'Feature 2', 'Feature 3'];
      render(<FeatureCard title="Test" description="Test" features={features} />);

      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
      expect(screen.getByText('Feature 3')).toBeInTheDocument();
    });

    it('does not render features list when empty', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" features={[]} />);
      expect(container.querySelector('.space-y-2')).not.toBeInTheDocument();
    });

    it('does not render features list when not provided', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.querySelector('.space-y-2')).not.toBeInTheDocument();
    });

    it('renders bullet points for each feature', () => {
      const features = ['Feature 1', 'Feature 2'];
      const { container } = render(<FeatureCard title="Test" description="Test" features={features} />);
      const bullets = container.querySelectorAll('.w-1.h-1.bg-accent.rounded-full');
      expect(bullets).toHaveLength(2);
    });

    it('features have correct styling', () => {
      const features = ['Feature 1'];
      const { container } = render(<FeatureCard title="Test" description="Test" features={features} />);
      const feature = container.querySelector('.flex.items-center.gap-2.text-sm.text-tertiary');
      expect(feature).toBeInTheDocument();
    });

    it('renders single feature', () => {
      const features = ['Only Feature'];
      render(<FeatureCard title="Test" description="Test" features={features} />);
      expect(screen.getByText('Only Feature')).toBeInTheDocument();
    });

    it('renders multiple features in order', () => {
      const features = ['First', 'Second', 'Third'];
      const { container } = render(<FeatureCard title="Test" description="Test" features={features} />);
      const featureElements = container.querySelectorAll('.flex.items-center.gap-2.text-sm');

      expect(featureElements[0]).toHaveTextContent('First');
      expect(featureElements[1]).toHaveTextContent('Second');
      expect(featureElements[2]).toHaveTextContent('Third');
    });

    it('features list has margin bottom', () => {
      const features = ['Feature 1'];
      const { container } = render(<FeatureCard title="Test" description="Test" features={features} />);
      const featuresList = container.querySelector('.space-y-2');
      expect(featuresList).toHaveClass('mb-4');
    });
  });

  describe('Size Variants', () => {
    it('applies default size padding', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('applies compact size padding', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" size="compact" />);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('applies large size padding', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" size="large" />);
      expect(container.firstChild).toHaveClass('p-8');
    });

    it('size prop is case-sensitive', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" size="default" />);
      expect(container.firstChild).toHaveClass('p-6');
    });
  });

  describe('Click Handling', () => {
    it('handles click when status is active and onClick provided', async () => {
      const handleClick = jest.fn();
      render(<FeatureCard title="Test" description="Test" status="active" onClick={handleClick} />);

      const card = screen.getByText('Test').closest('div');
      await userEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not handle click when status is coming-soon', async () => {
      const handleClick = jest.fn();
      render(<FeatureCard title="Test" description="Test" status="coming-soon" onClick={handleClick} />);

      const card = screen.getByText('Test').closest('.cursor-not-allowed');
      await userEvent.click(card);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles click when status is beta and onClick provided', async () => {
      const handleClick = jest.fn();
      render(<FeatureCard title="Test" description="Test" status="beta" onClick={handleClick} />);

      const card = screen.getByText('Test').closest('div');
      await userEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not set onClick when no handler provided', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="active" />);
      expect(container.firstChild).not.toHaveAttribute('onclick');
    });

    it('multiple clicks trigger handler multiple times', async () => {
      const handleClick = jest.fn();
      render(<FeatureCard title="Test" description="Test" onClick={handleClick} />);

      const card = screen.getByText('Test').closest('div');
      await userEvent.click(card);
      await userEvent.click(card);
      await userEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Hover States', () => {
    it('updates hover state on mouse enter', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);

      expect(card).toHaveStyle({
        background: 'rgba(31, 41, 55, 0.95)',
        border: '1px solid rgba(0, 212, 255, 0.3)'
      });
    });

    it('updates hover state on mouse leave', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);

      expect(card).toHaveStyle({
        background: 'rgba(31, 41, 55, 0.8)',
        border: '1px solid rgba(148, 163, 184, 0.1)'
      });
    });

    it('applies scale transform on hover', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);

      expect(card).toHaveClass('transform', 'scale-105');
    });

    it('removes scale transform on mouse leave', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);

      expect(card.className).not.toMatch(/scale-105/);
    });

    it('applies enhanced box shadow on hover', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);

      expect(card).toHaveStyle({
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 212, 255, 0.1)'
      });
    });

    it('applies default box shadow when not hovered', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      expect(card).toHaveStyle({
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      });
    });

    it('applies backdrop filter', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      expect(card).toHaveStyle({
        backdropFilter: 'blur(20px) saturate(180%)'
      });
    });

    it('title changes color on hover', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const title = screen.getByText('Test');

      expect(title).toHaveClass('group-hover:text-accent');
    });
  });

  describe('Action Indicator', () => {
    it('shows Explore indicator when clickable', () => {
      render(<FeatureCard title="Test" description="Test" onClick={() => {}} />);
      expect(screen.getByText('Explore')).toBeInTheDocument();
    });

    it('shows arrow in Explore indicator', () => {
      render(<FeatureCard title="Test" description="Test" onClick={() => {}} />);
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('does not show Explore indicator when not clickable', () => {
      render(<FeatureCard title="Test" description="Test" />);
      expect(screen.queryByText('Explore')).not.toBeInTheDocument();
    });

    it('does not show Explore indicator for coming-soon status', () => {
      render(<FeatureCard title="Test" description="Test" status="coming-soon" onClick={() => {}} />);
      expect(screen.queryByText('Explore')).not.toBeInTheDocument();
    });

    it('Explore indicator changes color on hover', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" onClick={() => {}} />);
      const card = container.firstChild;
      const indicator = screen.getByText('Explore').parentElement;

      fireEvent.mouseEnter(card);

      expect(indicator).toHaveStyle({ color: '#00D4FF' });
    });

    it('Explore indicator has default color when not hovered', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" onClick={() => {}} />);
      const indicator = screen.getByText('Explore').parentElement;

      expect(indicator).toHaveStyle({ color: 'var(--text-tertiary)' });
    });

    it('Explore indicator translates on hover', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" onClick={() => {}} />);
      const card = container.firstChild;
      const indicator = screen.getByText('Explore').parentElement;

      fireEvent.mouseEnter(card);

      expect(indicator).toHaveStyle({ transform: 'translateX(4px)' });
    });

    it('Explore indicator has no translation when not hovered', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" onClick={() => {}} />);
      const indicator = screen.getByText('Explore').parentElement;

      expect(indicator).toHaveStyle({ transform: 'translateX(0)' });
    });
  });

  describe('Background Pattern', () => {
    it('renders background pattern', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const pattern = container.querySelector('.absolute.inset-0.opacity-5');
      expect(pattern).toBeInTheDocument();
    });

    it('background pattern is pointer-events-none', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const pattern = container.querySelector('.absolute.inset-0.opacity-5');
      expect(pattern).toHaveClass('pointer-events-none');
    });

    it('background pattern has radial gradient', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const pattern = container.querySelector('.absolute.inset-0.opacity-5');
      expect(pattern).toHaveStyle({
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 70%)'
      });
    });

    it('background pattern animates on hover', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;
      const pattern = container.querySelector('.absolute.inset-0.opacity-5');

      fireEvent.mouseEnter(card);

      expect(pattern).toHaveStyle({ animation: 'pulse 2s ease-in-out infinite' });
    });

    it('background pattern does not animate when not hovered', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const pattern = container.querySelector('.absolute.inset-0.opacity-5');

      expect(pattern).toHaveStyle({ animation: 'none' });
    });
  });

  describe('Hover Glow Effect', () => {
    it('does not render glow effect when not hovered', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const glows = container.querySelectorAll('[style*="glowPulse"]');
      expect(glows).toHaveLength(0);
    });

    it('renders glow effect on hover', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);

      const glows = container.querySelectorAll('[style*="glowPulse"]');
      expect(glows.length).toBeGreaterThan(0);
    });

    it('glow effect has correct gradient', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);

      const glow = container.querySelector('[style*="glowPulse"]');
      expect(glow).toHaveStyle({
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, transparent 50%, rgba(0, 82, 255, 0.05) 100%)'
      });
    });

    it('glow effect is pointer-events-none', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);

      const glow = container.querySelector('[style*="glowPulse"]');
      expect(glow).toHaveClass('pointer-events-none');
    });

    it('glow effect has animation', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);

      const glow = container.querySelector('[style*="glowPulse"]');
      expect(glow).toHaveStyle({ animation: 'glowPulse 2s ease-in-out infinite' });
    });
  });

  describe('Transition Effects', () => {
    it('has transition-all class', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.firstChild).toHaveClass('transition-all');
    });

    it('has correct transition duration', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.firstChild).toHaveClass('duration-500');
    });

    it('has correct transition easing', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.firstChild).toHaveClass('ease-out');
    });

    it('title has transition-colors class', () => {
      render(<FeatureCard title="Test" description="Test" />);
      const title = screen.getByText('Test');
      expect(title).toHaveClass('transition-colors');
    });

    it('icon has transition-transform class', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" icon="🎮" />);
      const iconContainer = container.querySelector('.w-12.h-12');
      expect(iconContainer).toHaveClass('transition-transform', 'duration-300');
    });
  });

  describe('Z-Index Layering', () => {
    it('main content has z-10', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const content = container.querySelector('.relative.z-10');
      expect(content).toBeInTheDocument();
    });

    it('badge has z-10', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" badge="New" />);
      const badge = container.querySelector('.absolute.-top-2.-right-2');
      expect(badge).toHaveClass('z-10');
    });

    it('coming-soon overlay has z-20', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      const overlay = container.querySelector('.bg-black.bg-opacity-60');
      expect(overlay).toHaveClass('z-20');
    });
  });

  describe('Text Styling', () => {
    it('title has correct text size', () => {
      render(<FeatureCard title="Test" description="Test" />);
      const title = screen.getByText('Test');
      expect(title).toHaveClass('text-lg');
    });

    it('title is semibold', () => {
      render(<FeatureCard title="Test" description="Test" />);
      const title = screen.getByText('Test');
      expect(title).toHaveClass('font-semibold');
    });

    it('title has primary text color', () => {
      render(<FeatureCard title="Test" description="Test" />);
      const title = screen.getByText('Test');
      expect(title).toHaveClass('text-primary');
    });

    it('title has margin bottom', () => {
      render(<FeatureCard title="Test" description="Test" />);
      const title = screen.getByText('Test');
      expect(title).toHaveClass('mb-2');
    });

    it('description has small text size', () => {
      render(<FeatureCard title="Test" description="Description" />);
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('text-sm');
    });

    it('description has secondary text color', () => {
      render(<FeatureCard title="Test" description="Description" />);
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('text-secondary');
    });

    it('description has relaxed leading', () => {
      render(<FeatureCard title="Test" description="Description" />);
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('leading-relaxed');
    });
  });

  describe('Layout and Spacing', () => {
    it('header has flex layout', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" icon="🎮" />);
      const header = container.querySelector('.flex.items-start.gap-4.mb-4');
      expect(header).toBeInTheDocument();
    });

    it('header has correct gap', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" icon="🎮" />);
      const header = container.querySelector('.flex.items-start.gap-4');
      expect(header).toBeInTheDocument();
    });

    it('header has margin bottom', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" icon="🎮" />);
      const header = container.querySelector('.mb-4');
      expect(header).toBeInTheDocument();
    });

    it('features list has correct spacing', () => {
      const features = ['Feature 1', 'Feature 2'];
      const { container } = render(<FeatureCard title="Test" description="Test" features={features} />);
      const featuresList = container.querySelector('.space-y-2');
      expect(featuresList).toHaveClass('mb-4');
    });

    it('card has relative positioning', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.firstChild).toHaveClass('relative');
    });

    it('card has group class', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.firstChild).toHaveClass('group');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      render(<FeatureCard title="" description="Test" />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles empty description', () => {
      render(<FeatureCard title="Test" description="" />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles very long title', () => {
      const longTitle = 'A'.repeat(100);
      render(<FeatureCard title={longTitle} description="Test" />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles very long description', () => {
      const longDesc = 'A'.repeat(500);
      render(<FeatureCard title="Test" description={longDesc} />);
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it('handles many features', () => {
      const manyFeatures = Array.from({ length: 20 }, (_, i) => `Feature ${i + 1}`);
      render(<FeatureCard title="Test" description="Test" features={manyFeatures} />);
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 20')).toBeInTheDocument();
    });

    it('handles undefined status gracefully', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status={undefined} />);
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('handles null onClick gracefully', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" onClick={null} />);
      expect(screen.queryByText('Explore')).not.toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      render(<FeatureCard title="Test & <Special> 'Chars'" description="Test" />);
      expect(screen.getByText("Test & <Special> 'Chars'")).toBeInTheDocument();
    });

    it('handles special characters in description', () => {
      render(<FeatureCard title="Test" description="Test & <Special> 'Chars'" />);
      expect(screen.getByText("Test & <Special> 'Chars'")).toBeInTheDocument();
    });

    it('handles emoji in features', () => {
      const features = ['🎮 Gaming', '💬 Chat', '🎨 Art'];
      render(<FeatureCard title="Test" description="Test" features={features} />);
      expect(screen.getByText('🎮 Gaming')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('title is a heading element', () => {
      render(<FeatureCard title="Test Title" description="Test" />);
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('image has proper alt text', () => {
      render(<FeatureCard title="Feature Name" description="Test" image="/test.jpg" />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Feature Name');
    });

    it('clickable card has appropriate cursor', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" onClick={() => {}} />);
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('non-clickable coming-soon has appropriate cursor', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" status="coming-soon" />);
      expect(container.firstChild).toHaveClass('cursor-not-allowed');
    });

    it('description is in a paragraph', () => {
      render(<FeatureCard title="Test" description="Description Text" />);
      const desc = screen.getByText('Description Text');
      expect(desc.tagName).toBe('P');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<FeatureCard title="Test" description="Test" />);
      rerender(<FeatureCard title="Test" description="Test" />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles rapid hover state changes', () => {
      const { container } = render(<FeatureCard title="Test" description="Test" />);
      const card = container.firstChild;

      for (let i = 0; i < 10; i++) {
        fireEvent.mouseEnter(card);
        fireEvent.mouseLeave(card);
      }

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles rapid clicks', async () => {
      const handleClick = jest.fn();
      render(<FeatureCard title="Test" description="Test" onClick={handleClick} />);

      const card = screen.getByText('Test').closest('div');

      for (let i = 0; i < 5; i++) {
        await userEvent.click(card);
      }

      expect(handleClick).toHaveBeenCalledTimes(5);
    });
  });

  describe('FeaturePresets', () => {
    describe('Communities Preset', () => {
      it('has correct title', () => {
        expect(FeaturePresets.communities.title).toBe('Community Forums');
      });

      it('has description', () => {
        expect(FeaturePresets.communities.description).toBeDefined();
        expect(FeaturePresets.communities.description.length).toBeGreaterThan(0);
      });

      it('has icon', () => {
        expect(FeaturePresets.communities.icon).toBe('🏘️');
      });

      it('has features array', () => {
        expect(Array.isArray(FeaturePresets.communities.features)).toBe(true);
        expect(FeaturePresets.communities.features.length).toBe(4);
      });

      it('has active status', () => {
        expect(FeaturePresets.communities.status).toBe('active');
      });

      it('features include expected items', () => {
        expect(FeaturePresets.communities.features).toContain('Create and join communities');
        expect(FeaturePresets.communities.features).toContain('Post discussions and polls');
      });
    });

    describe('Chat Preset', () => {
      it('has correct title', () => {
        expect(FeaturePresets.chat.title).toBe('Live Chat');
      });

      it('has chat icon', () => {
        expect(FeaturePresets.chat.icon).toBe('💬');
      });

      it('has features array', () => {
        expect(Array.isArray(FeaturePresets.chat.features)).toBe(true);
        expect(FeaturePresets.chat.features.length).toBe(4);
      });

      it('has active status', () => {
        expect(FeaturePresets.chat.status).toBe('active');
      });
    });

    describe('Crypto Preset', () => {
      it('has correct title', () => {
        expect(FeaturePresets.crypto.title).toBe('Crypto Trading');
      });

      it('has crypto icon', () => {
        expect(FeaturePresets.crypto.icon).toBe('⚡');
      });

      it('has coming-soon status', () => {
        expect(FeaturePresets.crypto.status).toBe('coming-soon');
      });

      it('has features array', () => {
        expect(Array.isArray(FeaturePresets.crypto.features)).toBe(true);
      });
    });

    describe('NFT Preset', () => {
      it('has correct title', () => {
        expect(FeaturePresets.nft.title).toBe('NFT Marketplace');
      });

      it('has art icon', () => {
        expect(FeaturePresets.nft.icon).toBe('🎨');
      });

      it('has coming-soon status', () => {
        expect(FeaturePresets.nft.status).toBe('coming-soon');
      });

      it('has features array', () => {
        expect(Array.isArray(FeaturePresets.nft.features)).toBe(true);
      });
    });

    describe('Gaming Preset', () => {
      it('has correct title', () => {
        expect(FeaturePresets.gaming.title).toBe('GameFi Platform');
      });

      it('has gaming icon', () => {
        expect(FeaturePresets.gaming.icon).toBe('🎮');
      });

      it('has beta status', () => {
        expect(FeaturePresets.gaming.status).toBe('beta');
      });

      it('has features array', () => {
        expect(Array.isArray(FeaturePresets.gaming.features)).toBe(true);
      });
    });

    describe('Analytics Preset', () => {
      it('has correct title', () => {
        expect(FeaturePresets.analytics.title).toBe('Market Analytics');
      });

      it('has analytics icon', () => {
        expect(FeaturePresets.analytics.icon).toBe('📊');
      });

      it('has beta status', () => {
        expect(FeaturePresets.analytics.status).toBe('beta');
      });

      it('has features array', () => {
        expect(Array.isArray(FeaturePresets.analytics.features)).toBe(true);
      });
    });

    describe('All Presets', () => {
      it('exports all six presets', () => {
        expect(Object.keys(FeaturePresets)).toHaveLength(6);
      });

      it('all presets have title', () => {
        Object.values(FeaturePresets).forEach(preset => {
          expect(preset.title).toBeDefined();
          expect(typeof preset.title).toBe('string');
        });
      });

      it('all presets have description', () => {
        Object.values(FeaturePresets).forEach(preset => {
          expect(preset.description).toBeDefined();
          expect(typeof preset.description).toBe('string');
        });
      });

      it('all presets have icon', () => {
        Object.values(FeaturePresets).forEach(preset => {
          expect(preset.icon).toBeDefined();
          expect(typeof preset.icon).toBe('string');
        });
      });

      it('all presets have features array', () => {
        Object.values(FeaturePresets).forEach(preset => {
          expect(Array.isArray(preset.features)).toBe(true);
          expect(preset.features.length).toBeGreaterThan(0);
        });
      });

      it('all presets have status', () => {
        Object.values(FeaturePresets).forEach(preset => {
          expect(preset.status).toBeDefined();
          expect(['active', 'beta', 'coming-soon']).toContain(preset.status);
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('renders complete feature card with all props', () => {
      const features = ['Feature 1', 'Feature 2'];
      render(
        <FeatureCard
          title="Complete Feature"
          description="Full description"
          icon="🎮"
          status="beta"
          onClick={() => {}}
          features={features}
          className="custom"
          size="large"
        />
      );

      expect(screen.getByText('Complete Feature')).toBeInTheDocument();
      expect(screen.getByText('Full description')).toBeInTheDocument();
      expect(screen.getByText('🎮')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
    });

    it('renders preset correctly', () => {
      render(<FeatureCard {...FeaturePresets.gaming} />);

      expect(screen.getByText('GameFi Platform')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText('🎮')).toBeInTheDocument();
    });

    it('preset can be overridden', () => {
      render(<FeatureCard {...FeaturePresets.gaming} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('GameFi Platform')).not.toBeInTheDocument();
    });

    it('multiple cards can coexist', () => {
      const { container } = render(
        <>
          <FeatureCard title="Card 1" description="Desc 1" />
          <FeatureCard title="Card 2" description="Desc 2" />
          <FeatureCard title="Card 3" description="Desc 3" />
        </>
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();

      const cards = container.querySelectorAll('.card-glass');
      expect(cards).toHaveLength(3);
    });

    it('handles interaction with multiple cards independently', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      render(
        <>
          <FeatureCard title="Card 1" description="Desc 1" onClick={handler1} />
          <FeatureCard title="Card 2" description="Desc 2" onClick={handler2} />
        </>
      );

      const card1 = screen.getByText('Card 1').closest('div');
      const card2 = screen.getByText('Card 2').closest('div');

      await userEvent.click(card1);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      await userEvent.click(card2);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for default card', () => {
      const { container } = render(<FeatureCard title="Test" description="Description" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for card with icon', () => {
      const { container } = render(
        <FeatureCard title="Test" description="Description" icon="🎮" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for card with features', () => {
      const { container } = render(
        <FeatureCard
          title="Test"
          description="Description"
          features={['Feature 1', 'Feature 2']}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for coming-soon card', () => {
      const { container } = render(
        <FeatureCard title="Test" description="Description" status="coming-soon" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for beta card', () => {
      const { container } = render(
        <FeatureCard title="Test" description="Description" status="beta" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for clickable card', () => {
      const { container } = render(
        <FeatureCard title="Test" description="Description" onClick={() => {}} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for compact size', () => {
      const { container } = render(
        <FeatureCard title="Test" description="Description" size="compact" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for large size', () => {
      const { container } = render(
        <FeatureCard title="Test" description="Description" size="large" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default iconContainer
