import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../RadixBadge';

describe('Badge', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Badge>Test</Badge>);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(<Badge>Badge Text</Badge>);
      expect(screen.getByText('Badge Text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-class">Test</Badge>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('applies default variant', () => {
      const { container } = render(<Badge>Default</Badge>);
      expect(container.firstChild).toHaveClass('bg-blue-9', 'text-white');
    });

    it('applies secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      expect(container.firstChild).toHaveClass('bg-gray-3', 'text-gray-11');
    });

    it('applies destructive variant', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>);
      expect(container.firstChild).toHaveClass('bg-red-500', 'text-white');
    });

    it('applies outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      expect(container.firstChild).toHaveClass('border-gray-7', 'text-gray-11');
    });

    it('applies success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      expect(container.firstChild).toHaveClass('bg-green-500', 'text-white');
    });

    it('applies warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      expect(container.firstChild).toHaveClass('bg-yellow-500', 'text-white');
    });

    it('applies glass variant', () => {
      const { container } = render(<Badge variant="glass">Glass</Badge>);
      expect(container.firstChild).toHaveClass('backdrop-blur-md');
    });

    it('applies gradient variant', () => {
      const { container } = render(<Badge variant="gradient">Gradient</Badge>);
      expect(container.firstChild).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Sizes', () => {
    it('applies default size', () => {
      const { container } = render(<Badge>Default</Badge>);
      expect(container.firstChild).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
    });

    it('applies small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      expect(container.firstChild).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('applies large size', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      expect(container.firstChild).toHaveClass('px-3', 'py-1', 'text-sm');
    });
  });

  describe('Styling', () => {
    it('has rounded borders', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toHaveClass('rounded-full');
    });

    it('has inline-flex display', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toHaveClass('inline-flex', 'items-center');
    });

    it('has transition classes', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('HTML Attributes', () => {
    it('passes through data attributes', () => {
      const { container } = render(<Badge data-testid="badge">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('data-testid', 'badge');
    });

    it('passes through aria attributes', () => {
      const { container } = render(<Badge aria-label="status badge">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('aria-label', 'status badge');
    });

    it('passes through id attribute', () => {
      const { container } = render(<Badge id="my-badge">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('id', 'my-badge');
    });
  });

  describe('Content Types', () => {
    it('renders text content', () => {
      render(<Badge>Text Badge</Badge>);
      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('renders numeric content', () => {
      render(<Badge>{42}</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with icons', () => {
      const { container } = render(
        <Badge>
          <span className="icon">★</span>
          Premium
        </Badge>
      );
      expect(screen.getByText('★')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });
  });
});
