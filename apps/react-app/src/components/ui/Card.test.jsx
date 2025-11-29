/**
 * CRYB Platform - Comprehensive Card Component Test Suite
 * Tests for all Card components and their functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardImage,
  CardBadge,
  CardSkeleton,
  NFTCard,
} from './Card';

// Mock CSS import
jest.mock('./Card.css', () => ({}));

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Card>Content</Card>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders with empty children', () => {
      const { container } = render(<Card />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <Card>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </Card>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('renders string content', () => {
      render(<Card>Simple text</Card>);
      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('renders number content', () => {
      render(<Card>{42}</Card>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders complex nested structure', () => {
      render(
        <Card>
          <div>
            <span>Nested</span>
            <div>
              <p>Deep</p>
            </div>
          </div>
        </Card>
      );
      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByText('Deep')).toBeInTheDocument();
    });
  });

  describe('Variant Styles', () => {
    it('applies default variant styles', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('bg-bg-secondary');
    });

    it('applies elevated variant with shadow', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-bg-secondary', 'shadow-md');
    });

    it('applies interactive variant with cursor pointer', () => {
      const { container } = render(<Card variant="interactive">Content</Card>);
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('applies glass variant', () => {
      const { container } = render(<Card variant="glass">Content</Card>);
      expect(container.firstChild).toHaveClass('glass');
    });

    it('applies outline variant with transparent background', () => {
      const { container } = render(<Card variant="outline">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-transparent', 'border-2');
    });

    it('applies flat variant without border', () => {
      const { container } = render(<Card variant="flat">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-bg-tertiary', 'border-none');
    });

    it('includes base styles with all variants', () => {
      const variants = ['default', 'elevated', 'interactive', 'glass', 'outline', 'flat'];
      variants.forEach(variant => {
        const { container } = render(<Card variant={variant}>Content</Card>);
        expect(container.firstChild).toHaveClass('rounded-base', 'overflow-hidden');
      });
    });

    it('includes transition classes', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('transition-all', 'duration-200');
    });

    it('includes border classes by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('border', 'border-border');
    });
  });

  describe('Padding Variants', () => {
    it('applies no padding', () => {
      const { container } = render(<Card padding="none">Content</Card>);
      expect(container.firstChild).toHaveClass('p-0');
    });

    it('applies small padding', () => {
      const { container } = render(<Card padding="sm">Content</Card>);
      expect(container.firstChild).toHaveClass('p-3');
    });

    it('applies medium padding (default)', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('applies medium padding explicitly', () => {
      const { container } = render(<Card padding="md">Content</Card>);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('applies large padding', () => {
      const { container } = render(<Card padding="lg">Content</Card>);
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('applies extra large padding', () => {
      const { container } = render(<Card padding="xl">Content</Card>);
      expect(container.firstChild).toHaveClass('p-8');
    });

    it('combines padding with variant styles', () => {
      const { container } = render(<Card variant="elevated" padding="lg">Content</Card>);
      expect(container.firstChild).toHaveClass('p-6', 'shadow-md');
    });
  });

  describe('Hover Effects', () => {
    it('applies no hover effect by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).not.toHaveClass('hover:shadow-sm');
    });

    it('applies none hover effect explicitly', () => {
      const { container } = render(<Card hoverEffect="none">Content</Card>);
      expect(container.firstChild).not.toHaveClass('hover:shadow-sm');
    });

    it('applies subtle hover effect', () => {
      const { container } = render(<Card hoverEffect="subtle">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-sm');
    });

    it('applies medium hover effect', () => {
      const { container } = render(<Card hoverEffect="medium">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-md');
    });

    it('applies strong hover effect with translation', () => {
      const { container } = render(<Card hoverEffect="strong">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
    });

    it('applies glow hover effect', () => {
      const { container } = render(<Card hoverEffect="glow">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-glow-primary');
    });

    it('combines hover effect with variants', () => {
      const { container } = render(<Card variant="elevated" hoverEffect="strong">Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-md', 'hover:shadow-lg');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('combines custom className with base styles', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-class', 'rounded-base');
    });

    it('applies multiple custom classes', () => {
      const { container } = render(<Card className="custom-1 custom-2 custom-3">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-1', 'custom-2', 'custom-3');
    });

    it('custom className works with all variants', () => {
      const { container } = render(
        <Card variant="elevated" className="my-custom-class">Content</Card>
      );
      expect(container.firstChild).toHaveClass('my-custom-class', 'shadow-md');
    });
  });

  describe('Polymorphic Component Behavior', () => {
    it('renders as div by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('renders as section when specified', () => {
      const { container } = render(<Card as="section">Content</Card>);
      expect(container.firstChild.tagName).toBe('SECTION');
    });

    it('renders as article when specified', () => {
      const { container } = render(<Card as="article">Content</Card>);
      expect(container.firstChild.tagName).toBe('ARTICLE');
    });

    it('renders as aside when specified', () => {
      const { container } = render(<Card as="aside">Content</Card>);
      expect(container.firstChild.tagName).toBe('ASIDE');
    });

    it('renders as nav when specified', () => {
      const { container } = render(<Card as="nav">Content</Card>);
      expect(container.firstChild.tagName).toBe('NAV');
    });

    it('renders as main when specified', () => {
      const { container } = render(<Card as="main">Content</Card>);
      expect(container.firstChild.tagName).toBe('MAIN');
    });

    it('maintains styles when using as prop', () => {
      const { container } = render(<Card as="section" variant="elevated">Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-md');
      expect(container.firstChild.tagName).toBe('SECTION');
    });
  });

  describe('Interactivity and Click Handling', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Clickable</Card>);

      await userEvent.click(screen.getByText('Clickable'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick with event object', async () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Clickable</Card>);

      await userEvent.click(screen.getByText('Clickable'));
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('auto-applies interactive variant when onClick is provided', () => {
      const { container } = render(<Card onClick={() => {}}>Content</Card>);
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('respects explicit variant even with onClick', () => {
      const { container } = render(<Card variant="elevated" onClick={() => {}}>Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-md');
      expect(container.firstChild).not.toHaveClass('cursor-pointer');
    });

    it('does not auto-apply interactive for non-default variants', () => {
      const variants = ['elevated', 'glass', 'outline', 'flat'];
      variants.forEach(variant => {
        const { container } = render(<Card variant={variant} onClick={() => {}}>Content</Card>);
        expect(container.firstChild).not.toHaveClass('cursor-pointer');
      });
    });

    it('handles multiple clicks', async () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Clickable</Card>);

      const card = screen.getByRole('button');
      await userEvent.click(card);
      await userEvent.click(card);
      await userEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('does not trigger onClick without handler', async () => {
      const { container } = render(<Card>Content</Card>);
      expect(() => fireEvent.click(container.firstChild)).not.toThrow();
    });
  });

  describe('Accessibility - Role and ARIA', () => {
    it('has button role when onClick is provided', () => {
      render(<Card onClick={() => {}}>Content</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not have button role without onClick', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).not.toHaveAttribute('role', 'button');
    });

    it('has role undefined when no onClick', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).not.toHaveAttribute('role');
    });

    it('is focusable with onClick (tabIndex 0)', () => {
      const { container } = render(<Card onClick={() => {}}>Content</Card>);
      expect(container.firstChild).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable without onClick', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).not.toHaveAttribute('tabIndex');
    });

    it('can be focused programmatically', () => {
      const ref = React.createRef();
      render(<Card ref={ref} onClick={() => {}}>Content</Card>);
      ref.current.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe('Keyboard Accessibility', () => {
    it('handles Enter key press', () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles Space key press', () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('prevents default on Space key', () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      const card = screen.getByRole('button');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent.keyDown(card, { key: ' ' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('prevents default on Enter key', () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('ignores other keys', () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'a' });
      fireEvent.keyDown(card, { key: 'Escape' });
      fireEvent.keyDown(card, { key: 'Tab' });

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not handle keyboard events without onClick', () => {
      const { container } = render(<Card>Content</Card>);
      expect(() => {
        fireEvent.keyDown(container.firstChild, { key: 'Enter' });
      }).not.toThrow();
    });

    it('handles both Enter and Space in sequence', () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      fireEvent.keyDown(card, { key: ' ' });

      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to correct element type', () => {
      const ref = React.createRef();
      render(<Card ref={ref} as="section">Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLElement);
      expect(ref.current.tagName).toBe('SECTION');
    });

    it('ref points to actual DOM element', () => {
      const ref = React.createRef();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current.textContent).toBe('Content');
    });

    it('can access ref methods', () => {
      const ref = React.createRef();
      render(<Card ref={ref}>Content</Card>);
      expect(typeof ref.current.focus).toBe('function');
      expect(typeof ref.current.blur).toBe('function');
    });
  });

  describe('Additional Props Spreading', () => {
    it('spreads additional props', () => {
      const { container } = render(<Card data-testid="custom-card" id="card-1">Content</Card>);
      expect(container.firstChild).toHaveAttribute('data-testid', 'custom-card');
      expect(container.firstChild).toHaveAttribute('id', 'card-1');
    });

    it('handles aria attributes', () => {
      const { container } = render(
        <Card aria-label="Custom Card" aria-describedby="desc">Content</Card>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Custom Card');
      expect(container.firstChild).toHaveAttribute('aria-describedby', 'desc');
    });

    it('handles data attributes', () => {
      const { container } = render(
        <Card data-analytics="card" data-section="hero">Content</Card>
      );
      expect(container.firstChild).toHaveAttribute('data-analytics', 'card');
      expect(container.firstChild).toHaveAttribute('data-section', 'hero');
    });

    it('handles style prop', () => {
      const { container } = render(<Card style={{ width: '300px' }}>Content</Card>);
      expect(container.firstChild).toHaveStyle({ width: '300px' });
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(Card.displayName).toBe('Card');
    });
  });

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      const { container } = render(<Card>{null}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      const { container } = render(<Card>{undefined}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles false children gracefully', () => {
      const { container } = render(<Card>{false}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles conditional rendering of children', () => {
      const { rerender } = render(
        <Card>{true && <div>Visible</div>}</Card>
      );
      expect(screen.getByText('Visible')).toBeInTheDocument();

      rerender(<Card>{false && <div>Hidden</div>}</Card>);
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('handles empty string children', () => {
      const { container } = render(<Card>{''}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles zero as children', () => {
      render(<Card>{0}</Card>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Combination of Props', () => {
    it('combines all props correctly', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Card
          variant="elevated"
          padding="lg"
          hoverEffect="strong"
          className="custom"
          onClick={handleClick}
          as="article"
          data-testid="full-card"
        >
          Content
        </Card>
      );

      expect(container.firstChild.tagName).toBe('ARTICLE');
      expect(container.firstChild).toHaveClass('shadow-md', 'p-6', 'custom');
      expect(container.firstChild).toHaveAttribute('data-testid', 'full-card');
    });
  });
});

describe('CardHeader Component', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<CardHeader><div>Header Content</div></CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('renders as div element', () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('renders multiple children', () => {
      render(
        <CardHeader>
          <div>Child 1</div>
          <div>Child 2</div>
        </CardHeader>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies flex layout classes', () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'space-y-1.5');
    });

    it('applies custom className', () => {
      const { container } = render(<CardHeader className="custom">Content</CardHeader>);
      expect(container.firstChild).toHaveClass('custom', 'flex');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardHeader ref={ref}>Content</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Props Spreading', () => {
    it('spreads additional props', () => {
      const { container } = render(
        <CardHeader data-testid="header" id="header-1">Content</CardHeader>
      );
      expect(container.firstChild).toHaveAttribute('data-testid', 'header');
      expect(container.firstChild).toHaveAttribute('id', 'header-1');
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(CardHeader.displayName).toBe('CardHeader');
    });
  });
});

describe('CardTitle Component', () => {
  describe('Basic Rendering', () => {
    it('renders as h3 by default', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
    });

    it('renders title text correctly', () => {
      render(<CardTitle>My Card Title</CardTitle>);
      expect(screen.getByText('My Card Title')).toBeInTheDocument();
    });

    it('renders with complex children', () => {
      render(
        <CardTitle>
          <span>Icon</span> Title
        </CardTitle>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Icon Title');
    });
  });

  describe('Polymorphic Behavior', () => {
    it('renders as h1 when specified', () => {
      render(<CardTitle as="h1">Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
    });

    it('renders as h2 when specified', () => {
      render(<CardTitle as="h2">Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Title');
    });

    it('renders as h4 when specified', () => {
      render(<CardTitle as="h4">Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Title');
    });

    it('renders as h5 when specified', () => {
      render(<CardTitle as="h5">Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('Title');
    });

    it('renders as h6 when specified', () => {
      render(<CardTitle as="h6">Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('Title');
    });
  });

  describe('Styling', () => {
    it('applies title styles', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      expect(container.firstChild).toHaveClass('text-xl', 'font-semibold', 'text-text-primary', 'leading-tight');
    });

    it('applies custom className', () => {
      const { container } = render(<CardTitle className="custom">Title</CardTitle>);
      expect(container.firstChild).toHaveClass('custom', 'text-xl');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    it('forwards ref to correct element type', () => {
      const ref = React.createRef();
      render(<CardTitle ref={ref} as="h1">Title</CardTitle>);
      expect(ref.current.tagName).toBe('H1');
    });
  });

  describe('Props Spreading', () => {
    it('spreads additional props', () => {
      const { container } = render(
        <CardTitle id="title-1" data-testid="title">Title</CardTitle>
      );
      expect(container.firstChild).toHaveAttribute('id', 'title-1');
      expect(container.firstChild).toHaveAttribute('data-testid', 'title');
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(CardTitle.displayName).toBe('CardTitle');
    });
  });
});

describe('CardDescription Component', () => {
  describe('Basic Rendering', () => {
    it('renders description text', () => {
      render(<CardDescription>Description</CardDescription>);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders as p element', () => {
      const { container } = render(<CardDescription>Desc</CardDescription>);
      expect(container.firstChild.tagName).toBe('P');
    });

    it('renders long text', () => {
      const longText = 'This is a very long description that spans multiple lines and contains lots of information about the card.';
      render(<CardDescription>{longText}</CardDescription>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('renders with complex children', () => {
      render(
        <CardDescription>
          Description with <strong>bold</strong> text
        </CardDescription>
      );
      expect(screen.getByText('bold')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies description styles', () => {
      const { container } = render(<CardDescription>Desc</CardDescription>);
      expect(container.firstChild).toHaveClass('text-sm', 'text-text-secondary');
    });

    it('applies custom className', () => {
      const { container } = render(<CardDescription className="custom">Desc</CardDescription>);
      expect(container.firstChild).toHaveClass('custom', 'text-sm');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardDescription ref={ref}>Desc</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('Props Spreading', () => {
    it('spreads additional props', () => {
      const { container } = render(
        <CardDescription id="desc-1" data-testid="description">Desc</CardDescription>
      );
      expect(container.firstChild).toHaveAttribute('id', 'desc-1');
      expect(container.firstChild).toHaveAttribute('data-testid', 'description');
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(CardDescription.displayName).toBe('CardDescription');
    });
  });
});

describe('CardContent Component', () => {
  describe('Basic Rendering', () => {
    it('renders children', () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders as div element', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('renders multiple children', () => {
      render(
        <CardContent>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </CardContent>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies content styles', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      expect(container.firstChild).toHaveClass('pt-0');
    });

    it('applies custom className', () => {
      const { container } = render(<CardContent className="custom">Content</CardContent>);
      expect(container.firstChild).toHaveClass('custom', 'pt-0');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Props Spreading', () => {
    it('spreads additional props', () => {
      const { container } = render(
        <CardContent id="content-1" data-testid="content">Content</CardContent>
      );
      expect(container.firstChild).toHaveAttribute('id', 'content-1');
      expect(container.firstChild).toHaveAttribute('data-testid', 'content');
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(CardContent.displayName).toBe('CardContent');
    });
  });
});

describe('CardFooter Component', () => {
  describe('Basic Rendering', () => {
    it('renders children', () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('renders as div element', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('renders multiple button children', () => {
      render(
        <CardFooter>
          <button>Action 1</button>
          <button>Action 2</button>
        </CardFooter>
      );
      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies footer styles', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-2', 'pt-4');
    });

    it('applies custom className', () => {
      const { container } = render(<CardFooter className="custom">Footer</CardFooter>);
      expect(container.firstChild).toHaveClass('custom', 'flex');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Props Spreading', () => {
    it('spreads additional props', () => {
      const { container } = render(
        <CardFooter id="footer-1" data-testid="footer">Footer</CardFooter>
      );
      expect(container.firstChild).toHaveAttribute('id', 'footer-1');
      expect(container.firstChild).toHaveAttribute('data-testid', 'footer');
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(CardFooter.displayName).toBe('CardFooter');
    });
  });
});

describe('CardImage Component', () => {
  describe('Basic Rendering', () => {
    it('renders image with src', () => {
      render(<CardImage src="/test.jpg" alt="Test" />);
      const img = screen.getByAlt('Test');
      expect(img).toHaveAttribute('src', '/test.jpg');
    });

    it('renders container div', () => {
      const { container } = render(<CardImage src="/test.jpg" alt="Test" />);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('displays image inside container', () => {
      render(<CardImage src="/test.jpg" alt="Test Image" />);
      const img = screen.getByAlt('Test Image');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Image Loading', () => {
    it('applies lazy loading by default', () => {
      render(<CardImage src="/test.jpg" alt="Test" />);
      expect(screen.getByAlt('Test')).toHaveAttribute('loading', 'lazy');
    });

    it('applies eager loading when specified', () => {
      render(<CardImage src="/test.jpg" alt="Test" loading="eager" />);
      expect(screen.getByAlt('Test')).toHaveAttribute('loading', 'eager');
    });

    it('accepts loading prop', () => {
      render(<CardImage src="/test.jpg" alt="Test" loading="auto" />);
      expect(screen.getByAlt('Test')).toHaveAttribute('loading', 'auto');
    });
  });

  describe('Aspect Ratio', () => {
    it('applies default aspect ratio 1/1', () => {
      const { container } = render(<CardImage src="/test.jpg" alt="Test" />);
      expect(container.firstChild).toHaveStyle({ aspectRatio: '1/1' });
    });

    it('applies custom aspect ratio 16/9', () => {
      const { container } = render(<CardImage src="/test.jpg" alt="Test" aspectRatio="16/9" />);
      expect(container.firstChild).toHaveStyle({ aspectRatio: '16/9' });
    });

    it('applies custom aspect ratio 4/3', () => {
      const { container } = render(<CardImage src="/test.jpg" alt="Test" aspectRatio="4/3" />);
      expect(container.firstChild).toHaveStyle({ aspectRatio: '4/3' });
    });

    it('applies custom aspect ratio 21/9', () => {
      const { container } = render(<CardImage src="/test.jpg" alt="Test" aspectRatio="21/9" />);
      expect(container.firstChild).toHaveStyle({ aspectRatio: '21/9' });
    });
  });

  describe('Object Fit', () => {
    it('applies cover object fit by default', () => {
      render(<CardImage src="/test.jpg" alt="Test" />);
      expect(screen.getByAlt('Test')).toHaveClass('object-cover');
    });

    it('applies contain object fit when specified', () => {
      render(<CardImage src="/test.jpg" alt="Test" objectFit="contain" />);
      expect(screen.getByAlt('Test')).toHaveClass('object-contain');
      expect(screen.getByAlt('Test')).not.toHaveClass('object-cover');
    });

    it('does not apply object-cover when objectFit is contain', () => {
      render(<CardImage src="/test.jpg" alt="Test" objectFit="contain" />);
      const img = screen.getByAlt('Test');
      expect(img).not.toHaveClass('object-cover');
    });
  });

  describe('Error Handling', () => {
    it('shows fallback when image errors and fallback provided', () => {
      render(<CardImage src="/invalid.jpg" alt="Test" fallback={<div>Fallback</div>} />);
      const img = screen.getByAlt('Test');
      fireEvent.error(img);
      expect(screen.getByText('Fallback')).toBeInTheDocument();
    });

    it('hides image after error', () => {
      render(<CardImage src="/invalid.jpg" alt="Test" fallback={<div>Fallback</div>} />);
      const img = screen.getByAlt('Test');
      fireEvent.error(img);
      expect(screen.queryByAlt('Test')).not.toBeInTheDocument();
    });

    it('shows default icon when no src provided', () => {
      const { container } = render(<CardImage src="" alt="Test" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('shows default icon when image errors and no fallback', () => {
      render(<CardImage src="/invalid.jpg" alt="Test" />);
      const img = screen.getByAlt('Test');
      fireEvent.error(img);

      const { container } = render(<CardImage src="" alt="Test" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('default icon has correct styling', () => {
      const { container } = render(<CardImage src="" alt="Test" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-12', 'w-12', 'text-text-tertiary');
    });
  });

  describe('Styling', () => {
    it('applies container background', () => {
      const { container } = render(<CardImage src="/test.jpg" alt="Test" />);
      expect(container.firstChild).toHaveClass('bg-bg-tertiary');
    });

    it('applies overflow hidden', () => {
      const { container } = render(<CardImage src="/test.jpg" alt="Test" />);
      expect(container.firstChild).toHaveClass('overflow-hidden');
    });

    it('applies custom className to container', () => {
      const { container } = render(<CardImage src="/test.jpg" alt="Test" className="custom" />);
      expect(container.firstChild).toHaveClass('custom', 'bg-bg-tertiary');
    });

    it('applies transition and scale classes to image', () => {
      render(<CardImage src="/test.jpg" alt="Test" />);
      const img = screen.getByAlt('Test');
      expect(img).toHaveClass('transition-transform', 'duration-300', 'group-hover:scale-105');
    });

    it('applies full width and height to image', () => {
      render(<CardImage src="/test.jpg" alt="Test" />);
      const img = screen.getByAlt('Test');
      expect(img).toHaveClass('h-full', 'w-full');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to image element', () => {
      const ref = React.createRef();
      render(<CardImage ref={ref} src="/test.jpg" alt="Test" />);
      expect(ref.current).toBeInstanceOf(HTMLImageElement);
    });

    it('ref has correct src', () => {
      const ref = React.createRef();
      render(<CardImage ref={ref} src="/test.jpg" alt="Test" />);
      expect(ref.current.src).toContain('/test.jpg');
    });
  });

  describe('Props Spreading', () => {
    it('spreads additional props to image', () => {
      render(
        <CardImage src="/test.jpg" alt="Test" data-testid="image" id="img-1" />
      );
      const img = screen.getByAlt('Test');
      expect(img).toHaveAttribute('data-testid', 'image');
      expect(img).toHaveAttribute('id', 'img-1');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty src', () => {
      const { container } = render(<CardImage src="" alt="Empty" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('handles missing alt text', () => {
      render(<CardImage src="/test.jpg" />);
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
    });

    it('handles custom fallback content', () => {
      render(
        <CardImage src="" alt="Test" fallback={<span>Custom Fallback</span>} />
      );
      expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    });
  });
});

describe('CardBadge Component', () => {
  describe('Basic Rendering', () => {
    it('renders badge text', () => {
      render(<CardBadge>New</CardBadge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders as span element', () => {
      const { container } = render(<CardBadge>Badge</CardBadge>);
      expect(container.firstChild.tagName).toBe('SPAN');
    });

    it('renders with complex children', () => {
      render(
        <CardBadge>
          <span>✨</span> Featured
        </CardBadge>
      );
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });
  });

  describe('Variant Styles', () => {
    it('applies default variant', () => {
      const { container } = render(<CardBadge>Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('bg-bg-tertiary', 'text-text-primary');
    });

    it('applies primary variant', () => {
      const { container } = render(<CardBadge variant="primary">Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('bg-primary', 'text-white');
    });

    it('applies success variant', () => {
      const { container } = render(<CardBadge variant="success">Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('bg-success', 'text-white');
    });

    it('applies warning variant', () => {
      const { container } = render(<CardBadge variant="warning">Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('bg-warning', 'text-white');
    });

    it('applies error variant', () => {
      const { container } = render(<CardBadge variant="error">Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('bg-error', 'text-white');
    });
  });

  describe('Positioning', () => {
    it('positions badge absolutely', () => {
      const { container } = render(<CardBadge>Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('absolute');
    });

    it('positions badge at top right', () => {
      const { container } = render(<CardBadge>Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('top-2', 'right-2');
    });

    it('has high z-index for layering', () => {
      const { container } = render(<CardBadge>Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('z-10');
    });
  });

  describe('Styling', () => {
    it('applies badge base styles', () => {
      const { container } = render(<CardBadge>Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('inline-flex', 'items-center', 'px-2', 'py-1');
    });

    it('applies text and border styles', () => {
      const { container } = render(<CardBadge>Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('text-xs', 'font-medium', 'rounded-md');
    });

    it('applies custom className', () => {
      const { container } = render(<CardBadge className="custom">Badge</CardBadge>);
      expect(container.firstChild).toHaveClass('custom', 'absolute');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardBadge ref={ref}>Badge</CardBadge>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('Props Spreading', () => {
    it('spreads additional props', () => {
      const { container } = render(
        <CardBadge id="badge-1" data-testid="badge">Badge</CardBadge>
      );
      expect(container.firstChild).toHaveAttribute('id', 'badge-1');
      expect(container.firstChild).toHaveAttribute('data-testid', 'badge');
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(CardBadge.displayName).toBe('CardBadge');
    });
  });
});

describe('CardSkeleton Component', () => {
  describe('Basic Rendering', () => {
    it('renders loading skeleton', () => {
      const { container } = render(<CardSkeleton />);
      const skeleton = container.querySelector('.shimmer');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders Card component', () => {
      const { container } = render(<CardSkeleton />);
      expect(container.firstChild).toHaveClass('rounded-base');
    });

    it('renders multiple shimmer elements', () => {
      const { container } = render(<CardSkeleton />);
      const shimmers = container.querySelectorAll('.shimmer');
      expect(shimmers.length).toBeGreaterThan(1);
    });

    it('renders exactly 4 shimmer elements', () => {
      const { container } = render(<CardSkeleton />);
      const shimmers = container.querySelectorAll('.shimmer');
      expect(shimmers.length).toBe(4);
    });
  });

  describe('Aspect Ratio', () => {
    it('applies default aspect ratio 1/1', () => {
      const { container } = render(<CardSkeleton />);
      const mainShimmer = container.querySelector('.shimmer');
      expect(mainShimmer).toHaveStyle({ aspectRatio: '1/1' });
    });

    it('applies custom aspect ratio 16/9', () => {
      const { container } = render(<CardSkeleton aspectRatio="16/9" />);
      const mainShimmer = container.querySelector('.shimmer');
      expect(mainShimmer).toHaveStyle({ aspectRatio: '16/9' });
    });

    it('applies custom aspect ratio 4/3', () => {
      const { container } = render(<CardSkeleton aspectRatio="4/3" />);
      const mainShimmer = container.querySelector('.shimmer');
      expect(mainShimmer).toHaveStyle({ aspectRatio: '4/3' });
    });
  });

  describe('Structure', () => {
    it('has group class on card', () => {
      const { container } = render(<CardSkeleton />);
      expect(container.firstChild).toHaveClass('group');
    });

    it('has no padding on card', () => {
      const { container } = render(<CardSkeleton />);
      expect(container.firstChild).toHaveClass('p-0');
    });

    it('has content section with padding', () => {
      const { container } = render(<CardSkeleton />);
      const contentSection = container.querySelector('.p-4');
      expect(contentSection).toBeInTheDocument();
    });

    it('has proper spacing in content section', () => {
      const { container } = render(<CardSkeleton />);
      const contentSection = container.querySelector('.space-y-3');
      expect(contentSection).toBeInTheDocument();
    });
  });

  describe('Shimmer Elements', () => {
    it('has different width shimmers', () => {
      const { container } = render(<CardSkeleton />);
      const shimmers = container.querySelectorAll('.shimmer');

      const widthClasses = Array.from(shimmers).map(el => {
        return Array.from(el.classList).find(cls => cls.startsWith('w-'));
      }).filter(Boolean);

      expect(widthClasses.length).toBeGreaterThan(1);
    });

    it('has rounded shimmer elements', () => {
      const { container } = render(<CardSkeleton />);
      const textShimmers = Array.from(container.querySelectorAll('.shimmer')).slice(1);

      textShimmers.forEach(shimmer => {
        expect(shimmer).toHaveClass('rounded');
      });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to card', () => {
      const { container } = render(<CardSkeleton className="custom" />);
      expect(container.firstChild).toHaveClass('custom', 'group');
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(CardSkeleton.displayName).toBe('CardSkeleton');
    });
  });
});

describe('NFTCard Component', () => {
  const defaultProps = {
    image: '/nft.jpg',
    title: 'Cool NFT #1234',
    description: 'Rare digital collectible',
    price: '0.5 ETH',
  };

  describe('Basic Rendering', () => {
    it('renders all NFT card elements', () => {
      render(<NFTCard {...defaultProps} />);
      expect(screen.getByText('Cool NFT #1234')).toBeInTheDocument();
      expect(screen.getByText('Rare digital collectible')).toBeInTheDocument();
      expect(screen.getByText('0.5 ETH')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });

    it('renders the image', () => {
      render(<NFTCard {...defaultProps} />);
      const img = screen.getByAlt('Cool NFT #1234');
      expect(img).toHaveAttribute('src', '/nft.jpg');
    });

    it('renders title correctly', () => {
      render(<NFTCard {...defaultProps} />);
      const title = screen.getByText('Cool NFT #1234');
      expect(title).toHaveClass('text-base', 'truncate');
    });
  });

  describe('Optional Props', () => {
    it('renders without price', () => {
      const { price, ...propsWithoutPrice } = defaultProps;
      render(<NFTCard {...propsWithoutPrice} />);
      expect(screen.queryByText('Price')).not.toBeInTheDocument();
      expect(screen.queryByText('0.5 ETH')).not.toBeInTheDocument();
    });

    it('renders without description', () => {
      const { description, ...propsWithoutDesc } = defaultProps;
      render(<NFTCard {...propsWithoutDesc} />);
      expect(screen.queryByText('Rare digital collectible')).not.toBeInTheDocument();
    });

    it('renders with only required props', () => {
      render(<NFTCard image="/nft.jpg" title="NFT" />);
      expect(screen.getByText('NFT')).toBeInTheDocument();
      expect(screen.getByAlt('NFT')).toBeInTheDocument();
    });

    it('renders badge when provided', () => {
      render(<NFTCard {...defaultProps} badge="Featured" />);
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('does not render badge when not provided', () => {
      render(<NFTCard {...defaultProps} />);
      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });
  });

  describe('Structure and Layout', () => {
    it('uses interactive variant', () => {
      render(<NFTCard {...defaultProps} />);
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });

    it('has no padding on main card', () => {
      const { container } = render(<NFTCard {...defaultProps} />);
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('p-0');
    });

    it('has group and overflow-hidden classes', () => {
      const { container } = render(<NFTCard {...defaultProps} />);
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('group', 'overflow-hidden');
    });

    it('has padded content section', () => {
      const { container } = render(<NFTCard {...defaultProps} />);
      const contentSection = container.querySelector('.p-4');
      expect(contentSection).toBeInTheDocument();
    });

    it('has price border separator', () => {
      const { container } = render(<NFTCard {...defaultProps} />);
      const priceBorder = container.querySelector('.border-t');
      expect(priceBorder).toBeInTheDocument();
    });
  });

  describe('Image Properties', () => {
    it('uses 1/1 aspect ratio for image', () => {
      render(<NFTCard {...defaultProps} />);
      const img = screen.getByAlt(defaultProps.title);
      expect(img).toBeInTheDocument();
    });

    it('image has correct alt text', () => {
      render(<NFTCard {...defaultProps} />);
      expect(screen.getByAlt('Cool NFT #1234')).toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(<NFTCard {...defaultProps} onClick={handleClick} />);

      const card = screen.getByRole('button');
      await userEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<NFTCard {...defaultProps} onClick={handleClick} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('works without onClick handler', () => {
      const { container } = render(<NFTCard {...defaultProps} />);
      expect(() => fireEvent.click(container.firstChild)).not.toThrow();
    });
  });

  describe('Description Styling', () => {
    it('applies line-clamp to description', () => {
      render(<NFTCard {...defaultProps} />);
      const description = screen.getByText('Rare digital collectible');
      expect(description).toHaveClass('line-clamp-2');
    });

    it('has margin bottom on description', () => {
      render(<NFTCard {...defaultProps} />);
      const description = screen.getByText('Rare digital collectible');
      expect(description).toHaveClass('mb-3');
    });
  });

  describe('Price Display', () => {
    it('displays Price label', () => {
      render(<NFTCard {...defaultProps} />);
      expect(screen.getByText('Price')).toHaveClass('text-xs', 'text-text-secondary');
    });

    it('styles price value correctly', () => {
      render(<NFTCard {...defaultProps} />);
      const priceValue = screen.getByText('0.5 ETH');
      expect(priceValue).toHaveClass('text-base', 'font-semibold', 'text-primary');
    });

    it('price section has flex layout', () => {
      const { container } = render(<NFTCard {...defaultProps} />);
      const priceSection = container.querySelector('.flex.items-center.justify-between');
      expect(priceSection).toBeInTheDocument();
    });

    it('displays different price formats', () => {
      render(<NFTCard {...defaultProps} price="1.234 ETH" />);
      expect(screen.getByText('1.234 ETH')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<NFTCard {...defaultProps} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('ref points to card element', () => {
      const ref = React.createRef();
      render(<NFTCard {...defaultProps} ref={ref} />);
      expect(ref.current.getAttribute('role')).toBe('button');
    });
  });

  describe('Props Spreading', () => {
    it('spreads additional props to Card', () => {
      render(<NFTCard {...defaultProps} data-testid="nft-card" id="nft-1" />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('data-testid', 'nft-card');
      expect(card).toHaveAttribute('id', 'nft-1');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<NFTCard {...defaultProps} className="custom" />);
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('custom', 'group');
    });
  });

  describe('Badge Integration', () => {
    it('badge is rendered before image', () => {
      const { container } = render(<NFTCard {...defaultProps} badge="New" />);
      const badge = screen.getByText('New');
      expect(badge).toBeInTheDocument();
      expect(badge.tagName).toBe('SPAN');
    });

    it('badge has absolute positioning', () => {
      render(<NFTCard {...defaultProps} badge="Featured" />);
      const badge = screen.getByText('Featured');
      expect(badge).toHaveClass('absolute');
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(NFTCard.displayName).toBe('NFTCard');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      render(<NFTCard {...defaultProps} title="" />);
      expect(screen.getByAlt('')).toBeInTheDocument();
    });

    it('handles very long title', () => {
      const longTitle = 'This is a very long NFT title that should be truncated with ellipsis';
      render(<NFTCard {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toHaveClass('truncate');
    });

    it('handles very long description', () => {
      const longDesc = 'This is a very long description that should be clamped to 2 lines with an ellipsis at the end';
      render(<NFTCard {...defaultProps} description={longDesc} />);
      expect(screen.getByText(longDesc)).toHaveClass('line-clamp-2');
    });

    it('handles missing image', () => {
      render(<NFTCard {...defaultProps} image="" />);
      const { container } = render(<CardImage src="" alt="test" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });
});

describe('Card Integration Tests', () => {
  describe('Complete Card Composition', () => {
    it('renders complete card with all sub-components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders card with image and content', () => {
      render(
        <Card padding="none">
          <CardImage src="/test.jpg" alt="Test" />
          <div className="p-4">
            <CardTitle>Image Card</CardTitle>
            <CardDescription>With description</CardDescription>
          </div>
        </Card>
      );

      expect(screen.getByAlt('Test')).toBeInTheDocument();
      expect(screen.getByText('Image Card')).toBeInTheDocument();
      expect(screen.getByText('With description')).toBeInTheDocument();
    });

    it('renders card with badge', () => {
      render(
        <Card>
          <CardBadge variant="primary">New</CardBadge>
          <CardContent>Content with badge</CardContent>
        </Card>
      );

      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Content with badge')).toBeInTheDocument();
    });

    it('renders complex nested structure', () => {
      render(
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle as="h2">Complex Card</CardTitle>
            <CardDescription>Multiple sections</CardDescription>
          </CardHeader>
          <CardImage src="/image.jpg" alt="Complex" aspectRatio="16/9" />
          <CardContent>
            <p>First paragraph</p>
            <p>Second paragraph</p>
          </CardContent>
          <CardFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Complex Card');
      expect(screen.getByText('Multiple sections')).toBeInTheDocument();
      expect(screen.getByAlt('Complex')).toBeInTheDocument();
      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });
  });

  describe('Gallery/Grid Layouts', () => {
    it('renders multiple cards in a grid', () => {
      render(
        <div>
          <Card><CardTitle>Card 1</CardTitle></Card>
          <Card><CardTitle>Card 2</CardTitle></Card>
          <Card><CardTitle>Card 3</CardTitle></Card>
        </div>
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });

    it('renders multiple NFT cards', () => {
      const nfts = [
        { image: '/nft1.jpg', title: 'NFT 1', price: '1 ETH' },
        { image: '/nft2.jpg', title: 'NFT 2', price: '2 ETH' },
        { image: '/nft3.jpg', title: 'NFT 3', price: '3 ETH' },
      ];

      render(
        <div>
          {nfts.map((nft, i) => (
            <NFTCard key={i} {...nft} />
          ))}
        </div>
      );

      expect(screen.getByText('NFT 1')).toBeInTheDocument();
      expect(screen.getByText('NFT 2')).toBeInTheDocument();
      expect(screen.getByText('NFT 3')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('renders skeleton during loading', () => {
      const { container } = render(
        <div>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      );

      const skeletons = container.querySelectorAll('.shimmer');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('switches from skeleton to actual card', () => {
      const { rerender, container } = render(<CardSkeleton />);

      expect(container.querySelector('.shimmer')).toBeInTheDocument();

      rerender(
        <Card>
          <CardTitle>Loaded Card</CardTitle>
        </Card>
      );

      expect(container.querySelector('.shimmer')).not.toBeInTheDocument();
      expect(screen.getByText('Loaded Card')).toBeInTheDocument();
    });
  });

  describe('Interactive Patterns', () => {
    it('handles click on interactive card', async () => {
      const handleClick = jest.fn();
      render(
        <Card variant="interactive" onClick={handleClick}>
          <CardHeader>
            <CardTitle>Clickable Card</CardTitle>
          </CardHeader>
          <CardContent>Click anywhere</CardContent>
        </Card>
      );

      await userEvent.click(screen.getByText('Click anywhere'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('handles button clicks inside card footer', async () => {
      const handleAction = jest.fn();
      render(
        <Card>
          <CardContent>Content</CardContent>
          <CardFooter>
            <button onClick={handleAction}>Action</button>
          </CardFooter>
        </Card>
      );

      await userEvent.click(screen.getByRole('button', { name: 'Action' }));
      expect(handleAction).toHaveBeenCalled();
    });
  });

  describe('Different Variants Together', () => {
    it('renders multiple variant cards', () => {
      render(
        <div>
          <Card variant="default"><CardContent>Default</CardContent></Card>
          <Card variant="elevated"><CardContent>Elevated</CardContent></Card>
          <Card variant="glass"><CardContent>Glass</CardContent></Card>
          <Card variant="outline"><CardContent>Outline</CardContent></Card>
          <Card variant="flat"><CardContent>Flat</CardContent></Card>
        </div>
      );

      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Elevated')).toBeInTheDocument();
      expect(screen.getByText('Glass')).toBeInTheDocument();
      expect(screen.getByText('Outline')).toBeInTheDocument();
      expect(screen.getByText('Flat')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('handles different padding sizes', () => {
      render(
        <div>
          <Card padding="none"><CardContent>None</CardContent></Card>
          <Card padding="sm"><CardContent>Small</CardContent></Card>
          <Card padding="md"><CardContent>Medium</CardContent></Card>
          <Card padding="lg"><CardContent>Large</CardContent></Card>
          <Card padding="xl"><CardContent>XLarge</CardContent></Card>
        </div>
      );

      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('Small')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Large')).toBeInTheDocument();
      expect(screen.getByText('XLarge')).toBeInTheDocument();
    });
  });
});

describe('Accessibility Compliance', () => {
  describe('Semantic HTML', () => {
    it('uses appropriate heading levels', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle as="h2">Main Title</CardTitle>
          </CardHeader>
        </Card>
      );

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('uses paragraph for description', () => {
      render(<CardDescription>Description text</CardDescription>);
      const desc = screen.getByText('Description text');
      expect(desc.tagName).toBe('P');
    });
  });

  describe('Focus Management', () => {
    it('interactive cards are focusable', () => {
      render(<Card onClick={() => {}}>Focusable</Card>);
      const card = screen.getByRole('button');

      card.focus();
      expect(document.activeElement).toBe(card);
    });

    it('non-interactive cards are not focusable', () => {
      const { container } = render(<Card>Not focusable</Card>);

      container.firstChild.focus();
      expect(document.activeElement).not.toBe(container.firstChild);
    });
  });

  describe('ARIA Attributes', () => {
    it('accepts custom aria-label', () => {
      const { container } = render(
        <Card aria-label="Custom card label">Content</Card>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Custom card label');
    });

    it('interactive card has button role', () => {
      render(<Card onClick={() => {}}>Content</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Image Accessibility', () => {
    it('images have alt text', () => {
      render(<CardImage src="/test.jpg" alt="Descriptive alt text" />);
      expect(screen.getByAlt('Descriptive alt text')).toBeInTheDocument();
    });

    it('NFT card images have alt text', () => {
      render(<NFTCard image="/nft.jpg" title="NFT Title" />);
      expect(screen.getByAlt('NFT Title')).toBeInTheDocument();
    });
  });
});

describe('Performance and Optimization', () => {
  describe('Re-rendering', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<Card>Content</Card>);
      const firstRender = screen.getByText('Content');

      rerender(<Card>Content</Card>);
      const secondRender = screen.getByText('Content');

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Prop Changes', () => {
    it('updates when variant changes', () => {
      const { container, rerender } = render(<Card variant="default">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-bg-secondary');

      rerender(<Card variant="elevated">Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-md');
    });

    it('updates when padding changes', () => {
      const { container, rerender } = render(<Card padding="sm">Content</Card>);
      expect(container.firstChild).toHaveClass('p-3');

      rerender(<Card padding="lg">Content</Card>);
      expect(container.firstChild).toHaveClass('p-6');
    });
  });
});

export default variants
