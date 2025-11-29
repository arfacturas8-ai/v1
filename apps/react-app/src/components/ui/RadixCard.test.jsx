import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './RadixCard';

describe('Card', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Card>Content</Card>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <Card>
          <span>Child 1</span>
          <span>Child 2</span>
        </Card>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('renders as div element by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('applies base classes', () => {
      const { container } = render(<Card>Content</Card>);
      const element = container.firstChild;
      expect(element).toHaveClass('rounded-xl');
      expect(element).toHaveClass('border');
      expect(element).toHaveClass('transition-all');
      expect(element).toHaveClass('duration-200');
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-class');
      expect(container.firstChild).toHaveClass('rounded-xl');
    });

    it('renders with empty content', () => {
      const { container } = render(<Card></Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with null children', () => {
      const { container } = render(<Card>{null}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with undefined children', () => {
      const { container } = render(<Card>{undefined}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with string content', () => {
      render(<Card>Simple text</Card>);
      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('renders with number content', () => {
      render(<Card>{42}</Card>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with complex JSX children', () => {
      render(
        <Card>
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button>Action</button>
          </div>
        </Card>
      );
      expect(screen.getByRole('heading')).toHaveTextContent('Title');
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Action');
    });

    it('has correct display name', () => {
      expect(Card.displayName).toBe('Card');
    });
  });

  describe('Variants', () => {
    it('applies default variant by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('bg-gray-1');
      expect(container.firstChild).toHaveClass('border-gray-6');
      expect(container.firstChild).toHaveClass('shadow-sm');
    });

    it('applies default variant explicitly', () => {
      const { container } = render(<Card variant="default">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-gray-1');
      expect(container.firstChild).toHaveClass('border-gray-6');
      expect(container.firstChild).toHaveClass('shadow-sm');
    });

    it('applies default variant hover effect', () => {
      const { container } = render(<Card variant="default">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-md');
    });

    it('applies glass variant', () => {
      const { container } = render(<Card variant="glass">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-white/5');
      expect(container.firstChild).toHaveClass('backdrop-blur-md');
      expect(container.firstChild).toHaveClass('border-white/10');
      expect(container.firstChild).toHaveClass('shadow-lg');
    });

    it('applies glass variant hover effects', () => {
      const { container } = render(<Card variant="glass">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:bg-white/10');
      expect(container.firstChild).toHaveClass('hover:border-white/20');
    });

    it('applies elevated variant', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-gray-1');
      expect(container.firstChild).toHaveClass('border-gray-6');
      expect(container.firstChild).toHaveClass('shadow-lg');
    });

    it('applies elevated variant hover effects', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-xl');
      expect(container.firstChild).toHaveClass('hover:-translate-y-0.5');
    });

    it('applies outline variant', () => {
      const { container } = render(<Card variant="outline">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-transparent');
      expect(container.firstChild).toHaveClass('border-gray-7');
    });

    it('applies outline variant hover effects', () => {
      const { container } = render(<Card variant="outline">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:bg-gray-2');
      expect(container.firstChild).toHaveClass('hover:border-gray-8');
    });

    it('applies gradient variant', () => {
      const { container } = render(<Card variant="gradient">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-gradient-to-br');
      expect(container.firstChild).toHaveClass('from-blue-1');
      expect(container.firstChild).toHaveClass('to-violet-1');
      expect(container.firstChild).toHaveClass('border-blue-6');
      expect(container.firstChild).toHaveClass('shadow-lg');
    });

    it('applies gradient variant hover effects', () => {
      const { container } = render(<Card variant="gradient">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-xl');
    });

    it('handles undefined variant gracefully', () => {
      const { container } = render(<Card variant={undefined}>Content</Card>);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('bg-gray-1');
    });

    it('handles invalid variant gracefully', () => {
      const { container } = render(<Card variant="invalid">Content</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles null variant', () => {
      const { container } = render(<Card variant={null}>Content</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles empty string variant', () => {
      const { container } = render(<Card variant="">Content</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards data attributes', () => {
      const { container } = render(
        <Card data-testid="test-card" data-custom="value">Content</Card>
      );
      expect(container.firstChild).toHaveAttribute('data-testid', 'test-card');
      expect(container.firstChild).toHaveAttribute('data-custom', 'value');
    });

    it('forwards aria attributes', () => {
      const { container } = render(
        <Card aria-label="Card label" aria-describedby="desc">Content</Card>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Card label');
      expect(container.firstChild).toHaveAttribute('aria-describedby', 'desc');
    });

    it('forwards role attribute', () => {
      const { container } = render(<Card role="region">Content</Card>);
      expect(container.firstChild).toHaveAttribute('role', 'region');
    });

    it('forwards id attribute', () => {
      const { container } = render(<Card id="card-id">Content</Card>);
      expect(container.firstChild).toHaveAttribute('id', 'card-id');
    });

    it('forwards style prop', () => {
      const { container } = render(
        <Card style={{ backgroundColor: 'red' }}>Content</Card>
      );
      expect(container.firstChild).toHaveStyle({ backgroundColor: 'red' });
    });

    it('forwards title attribute', () => {
      const { container } = render(<Card title="Card title">Content</Card>);
      expect(container.firstChild).toHaveAttribute('title', 'Card title');
    });

    it('forwards tabIndex', () => {
      const { container } = render(<Card tabIndex={0}>Content</Card>);
      expect(container.firstChild).toHaveAttribute('tabIndex', '0');
    });

    it('forwards multiple props simultaneously', () => {
      const { container } = render(
        <Card
          id="test-id"
          className="custom"
          data-test="value"
          aria-label="label"
          role="article"
          tabIndex={0}
        >
          Content
        </Card>
      );
      const element = container.firstChild;
      expect(element).toHaveAttribute('id', 'test-id');
      expect(element).toHaveClass('custom');
      expect(element).toHaveAttribute('data-test', 'value');
      expect(element).toHaveAttribute('aria-label', 'label');
      expect(element).toHaveAttribute('role', 'article');
      expect(element).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('ref can access DOM methods', () => {
      const ref = React.createRef();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current.getBoundingClientRect).toBeDefined();
      expect(ref.current.focus).toBeDefined();
    });

    it('multiple refs work independently', () => {
      const ref1 = React.createRef();
      const ref2 = React.createRef();
      render(
        <>
          <Card ref={ref1}>Card 1</Card>
          <Card ref={ref2}>Card 2</Card>
        </>
      );
      expect(ref1.current).not.toBe(ref2.current);
      expect(ref1.current).toBeInstanceOf(HTMLDivElement);
      expect(ref2.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Interaction Handling', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      await userEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles double click events', () => {
      const handleDoubleClick = jest.fn();
      const { container } = render(<Card onDoubleClick={handleDoubleClick}>Content</Card>);
      fireEvent.doubleClick(container.firstChild);
      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('handles mouse enter events', () => {
      const handleMouseEnter = jest.fn();
      const { container } = render(<Card onMouseEnter={handleMouseEnter}>Content</Card>);
      fireEvent.mouseEnter(container.firstChild);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('handles mouse leave events', () => {
      const handleMouseLeave = jest.fn();
      const { container } = render(<Card onMouseLeave={handleMouseLeave}>Content</Card>);
      fireEvent.mouseLeave(container.firstChild);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('handles mouse enter and leave sequence', () => {
      const handleMouseEnter = jest.fn();
      const handleMouseLeave = jest.fn();
      const { container } = render(
        <Card onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          Content
        </Card>
      );
      fireEvent.mouseEnter(container.firstChild);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
      fireEvent.mouseLeave(container.firstChild);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('handles focus events', () => {
      const handleFocus = jest.fn();
      const { container } = render(<Card onFocus={handleFocus} tabIndex={0}>Content</Card>);
      fireEvent.focus(container.firstChild);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles blur events', () => {
      const handleBlur = jest.fn();
      const { container } = render(<Card onBlur={handleBlur} tabIndex={0}>Content</Card>);
      const element = container.firstChild;
      element.focus();
      fireEvent.blur(element);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', () => {
      const handleKeyDown = jest.fn();
      const { container } = render(<Card onKeyDown={handleKeyDown} tabIndex={0}>Content</Card>);
      fireEvent.keyDown(container.firstChild, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('handles touch events', () => {
      const handleTouchStart = jest.fn();
      const handleTouchEnd = jest.fn();
      const { container } = render(
        <Card onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          Content
        </Card>
      );
      fireEvent.touchStart(container.firstChild);
      expect(handleTouchStart).toHaveBeenCalledTimes(1);
      fireEvent.touchEnd(container.firstChild);
      expect(handleTouchEnd).toHaveBeenCalledTimes(1);
    });

    it('handles context menu events', () => {
      const handleContextMenu = jest.fn();
      const { container } = render(<Card onContextMenu={handleContextMenu}>Content</Card>);
      fireEvent.contextMenu(container.firstChild);
      expect(handleContextMenu).toHaveBeenCalledTimes(1);
    });

    it('receives event object in handlers', () => {
      const handleClick = jest.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      fireEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });
});

describe('CardHeader', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <CardHeader>
          <div>Header Child 1</div>
          <div>Header Child 2</div>
        </CardHeader>
      );
      expect(screen.getByText('Header Child 1')).toBeInTheDocument();
      expect(screen.getByText('Header Child 2')).toBeInTheDocument();
    });

    it('renders as div element', () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('applies base classes', () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('flex-col');
      expect(container.firstChild).toHaveClass('space-y-1.5');
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('applies custom className', () => {
      const { container } = render(<CardHeader className="custom-header">Content</CardHeader>);
      expect(container.firstChild).toHaveClass('custom-header');
      expect(container.firstChild).toHaveClass('flex');
    });

    it('has correct display name', () => {
      expect(CardHeader.displayName).toBe('CardHeader');
    });

    it('renders with empty content', () => {
      const { container } = render(<CardHeader></CardHeader>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with null children', () => {
      const { container } = render(<CardHeader>{null}</CardHeader>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with string content', () => {
      render(<CardHeader>Header text</CardHeader>);
      expect(screen.getByText('Header text')).toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards data attributes', () => {
      const { container } = render(
        <CardHeader data-testid="header" data-custom="value">Content</CardHeader>
      );
      expect(container.firstChild).toHaveAttribute('data-testid', 'header');
      expect(container.firstChild).toHaveAttribute('data-custom', 'value');
    });

    it('forwards aria attributes', () => {
      const { container } = render(
        <CardHeader aria-label="Header">Content</CardHeader>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Header');
    });

    it('forwards id attribute', () => {
      const { container } = render(<CardHeader id="header-id">Content</CardHeader>);
      expect(container.firstChild).toHaveAttribute('id', 'header-id');
    });

    it('forwards onClick handler', () => {
      const handleClick = jest.fn();
      const { container } = render(<CardHeader onClick={handleClick}>Content</CardHeader>);
      fireEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardHeader ref={ref}>Content</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Integration', () => {
    it('works inside Card component', () => {
      render(
        <Card>
          <CardHeader>Header Content</CardHeader>
        </Card>
      );
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('maintains spacing in flex column layout', () => {
      const { container } = render(
        <CardHeader>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </CardHeader>
      );
      expect(container.firstChild).toHaveClass('space-y-1.5');
    });
  });
});

describe('CardTitle', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('renders as h3 element by default', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
    });

    it('applies base classes', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      expect(container.firstChild).toHaveClass('font-semibold');
      expect(container.firstChild).toHaveClass('leading-none');
      expect(container.firstChild).toHaveClass('tracking-tight');
      expect(container.firstChild).toHaveClass('text-gray-12');
    });

    it('applies custom className', () => {
      const { container } = render(<CardTitle className="custom-title">Title</CardTitle>);
      expect(container.firstChild).toHaveClass('custom-title');
      expect(container.firstChild).toHaveClass('font-semibold');
    });

    it('has correct display name', () => {
      expect(CardTitle.displayName).toBe('CardTitle');
    });

    it('renders with string content', () => {
      render(<CardTitle>Card Title Text</CardTitle>);
      expect(screen.getByText('Card Title Text')).toBeInTheDocument();
    });

    it('renders with number content', () => {
      render(<CardTitle>{100}</CardTitle>);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders with complex children', () => {
      render(
        <CardTitle>
          <span>Complex</span> <strong>Title</strong>
        </CardTitle>
      );
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards data attributes', () => {
      const { container } = render(
        <CardTitle data-testid="title">Title</CardTitle>
      );
      expect(container.firstChild).toHaveAttribute('data-testid', 'title');
    });

    it('forwards aria attributes', () => {
      const { container } = render(
        <CardTitle aria-label="Title label">Title</CardTitle>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Title label');
    });

    it('forwards id attribute', () => {
      const { container } = render(<CardTitle id="title-id">Title</CardTitle>);
      expect(container.firstChild).toHaveAttribute('id', 'title-id');
    });

    it('forwards onClick handler', () => {
      const handleClick = jest.fn();
      const { container } = render(<CardTitle onClick={handleClick}>Title</CardTitle>);
      fireEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    it('ref points to h3 element', () => {
      const ref = React.createRef();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current.tagName).toBe('H3');
    });
  });

  describe('Accessibility', () => {
    it('is accessible as heading', () => {
      render(<CardTitle>Accessible Title</CardTitle>);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it('maintains heading hierarchy', () => {
      render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <CardTitle>Card Title</CardTitle>
        </div>
      );
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Card Title');
    });
  });

  describe('Integration', () => {
    it('works inside CardHeader', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title in Header</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title in Header');
    });

    it('works with CardDescription', () => {
      render(
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      );
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });
});

describe('CardDescription', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<CardDescription>Description</CardDescription>);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders as paragraph element', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      expect(container.firstChild.tagName).toBe('P');
    });

    it('applies base classes', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      expect(container.firstChild).toHaveClass('text-sm');
      expect(container.firstChild).toHaveClass('text-gray-11');
    });

    it('applies custom className', () => {
      const { container } = render(
        <CardDescription className="custom-desc">Description</CardDescription>
      );
      expect(container.firstChild).toHaveClass('custom-desc');
      expect(container.firstChild).toHaveClass('text-sm');
    });

    it('has correct display name', () => {
      expect(CardDescription.displayName).toBe('CardDescription');
    });

    it('renders with string content', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('renders with long text', () => {
      const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
      render(<CardDescription>{longText}</CardDescription>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('renders with complex children', () => {
      render(
        <CardDescription>
          This is a <strong>description</strong> with <em>formatting</em>.
        </CardDescription>
      );
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('formatting')).toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards data attributes', () => {
      const { container } = render(
        <CardDescription data-testid="desc">Description</CardDescription>
      );
      expect(container.firstChild).toHaveAttribute('data-testid', 'desc');
    });

    it('forwards aria attributes', () => {
      const { container } = render(
        <CardDescription aria-label="Description label">Description</CardDescription>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Description label');
    });

    it('forwards id attribute', () => {
      const { container } = render(<CardDescription id="desc-id">Description</CardDescription>);
      expect(container.firstChild).toHaveAttribute('id', 'desc-id');
    });

    it('forwards onClick handler', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <CardDescription onClick={handleClick}>Description</CardDescription>
      );
      fireEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });

    it('ref points to paragraph element', () => {
      const ref = React.createRef();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref.current.tagName).toBe('P');
    });
  });

  describe('Integration', () => {
    it('works inside CardHeader', () => {
      render(
        <CardHeader>
          <CardDescription>Header Description</CardDescription>
        </CardHeader>
      );
      expect(screen.getByText('Header Description')).toBeInTheDocument();
    });

    it('works with CardTitle', () => {
      render(
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description below title</CardDescription>
        </CardHeader>
      );
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByText('Description below title')).toBeInTheDocument();
    });

    it('maintains proper spacing in CardHeader', () => {
      render(
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      );
      const header = screen.getByText('Title').parentElement;
      expect(header).toHaveClass('space-y-1.5');
    });
  });
});

describe('CardContent', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <CardContent>
          <div>Content Child 1</div>
          <div>Content Child 2</div>
        </CardContent>
      );
      expect(screen.getByText('Content Child 1')).toBeInTheDocument();
      expect(screen.getByText('Content Child 2')).toBeInTheDocument();
    });

    it('renders as div element', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('applies base classes', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      expect(container.firstChild).toHaveClass('p-6');
      expect(container.firstChild).toHaveClass('pt-0');
    });

    it('applies custom className', () => {
      const { container } = render(
        <CardContent className="custom-content">Content</CardContent>
      );
      expect(container.firstChild).toHaveClass('custom-content');
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('has correct display name', () => {
      expect(CardContent.displayName).toBe('CardContent');
    });

    it('renders with empty content', () => {
      const { container } = render(<CardContent></CardContent>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with complex children', () => {
      render(
        <CardContent>
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
            <button>Button</button>
          </div>
        </CardContent>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards data attributes', () => {
      const { container } = render(
        <CardContent data-testid="content">Content</CardContent>
      );
      expect(container.firstChild).toHaveAttribute('data-testid', 'content');
    });

    it('forwards aria attributes', () => {
      const { container } = render(
        <CardContent aria-label="Content label">Content</CardContent>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Content label');
    });

    it('forwards id attribute', () => {
      const { container } = render(<CardContent id="content-id">Content</CardContent>);
      expect(container.firstChild).toHaveAttribute('id', 'content-id');
    });

    it('forwards onClick handler', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <CardContent onClick={handleClick}>Content</CardContent>
      );
      fireEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Integration', () => {
    it('works inside Card component', () => {
      render(
        <Card>
          <CardContent>Main Content</CardContent>
        </Card>
      );
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('works after CardHeader', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content after header</CardContent>
        </Card>
      );
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByText('Content after header')).toBeInTheDocument();
    });

    it('pt-0 removes top padding when following CardHeader', () => {
      const { container } = render(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('pt-0');
    });
  });
});

describe('CardFooter', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <CardFooter>
          <button>Action 1</button>
          <button>Action 2</button>
        </CardFooter>
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('Action 1');
      expect(buttons[1]).toHaveTextContent('Action 2');
    });

    it('renders as div element', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('applies base classes', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('items-center');
      expect(container.firstChild).toHaveClass('p-6');
      expect(container.firstChild).toHaveClass('pt-0');
    });

    it('applies custom className', () => {
      const { container } = render(
        <CardFooter className="custom-footer">Footer</CardFooter>
      );
      expect(container.firstChild).toHaveClass('custom-footer');
      expect(container.firstChild).toHaveClass('flex');
    });

    it('has correct display name', () => {
      expect(CardFooter.displayName).toBe('CardFooter');
    });

    it('renders with empty content', () => {
      const { container } = render(<CardFooter></CardFooter>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with multiple action buttons', () => {
      render(
        <CardFooter>
          <button>Cancel</button>
          <button>Save</button>
          <button>Submit</button>
        </CardFooter>
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });

  describe('Props Forwarding', () => {
    it('forwards data attributes', () => {
      const { container } = render(
        <CardFooter data-testid="footer">Footer</CardFooter>
      );
      expect(container.firstChild).toHaveAttribute('data-testid', 'footer');
    });

    it('forwards aria attributes', () => {
      const { container } = render(
        <CardFooter aria-label="Footer label">Footer</CardFooter>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Footer label');
    });

    it('forwards id attribute', () => {
      const { container } = render(<CardFooter id="footer-id">Footer</CardFooter>);
      expect(container.firstChild).toHaveAttribute('id', 'footer-id');
    });

    it('forwards onClick handler', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <CardFooter onClick={handleClick}>Footer</CardFooter>
      );
      fireEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Integration', () => {
    it('works inside Card component', () => {
      render(
        <Card>
          <CardFooter>Footer Content</CardFooter>
        </Card>
      );
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('works after CardContent', () => {
      render(
        <Card>
          <CardContent>Content</CardContent>
          <CardFooter>Footer after content</CardFooter>
        </Card>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer after content')).toBeInTheDocument();
    });

    it('pt-0 removes top padding when following CardContent', () => {
      const { container } = render(
        <Card>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );
      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('pt-0');
    });

    it('aligns items horizontally with flex', () => {
      render(
        <CardFooter>
          <button>Action 1</button>
          <button>Action 2</button>
        </CardFooter>
      );
      const footer = screen.getByText('Action 1').parentElement;
      expect(footer).toHaveClass('flex', 'items-center');
    });
  });
});

describe('Component Integration', () => {
  describe('Complete Card Compositions', () => {
    it('renders complete card with all subcomponents', () => {
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

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Card');
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Action');
    });

    it('renders card with header only', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Header Only Card</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByRole('heading')).toHaveTextContent('Header Only Card');
    });

    it('renders card with content only', () => {
      render(
        <Card>
          <CardContent>Content Only</CardContent>
        </Card>
      );
      expect(screen.getByText('Content Only')).toBeInTheDocument();
    });

    it('renders card with footer only', () => {
      render(
        <Card>
          <CardFooter>Footer Only</CardFooter>
        </Card>
      );
      expect(screen.getByText('Footer Only')).toBeInTheDocument();
    });

    it('renders card without subcomponents', () => {
      render(<Card>Simple card content</Card>);
      expect(screen.getByText('Simple card content')).toBeInTheDocument();
    });

    it('renders multiple cards', () => {
      render(
        <>
          <Card>
            <CardTitle>Card 1</CardTitle>
          </Card>
          <Card>
            <CardTitle>Card 2</CardTitle>
          </Card>
          <Card>
            <CardTitle>Card 3</CardTitle>
          </Card>
        </>
      );
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(3);
    });

    it('renders nested cards', () => {
      render(
        <Card variant="default">
          <CardHeader>
            <CardTitle>Parent Card</CardTitle>
          </CardHeader>
          <CardContent>
            <Card variant="outline">
              <CardTitle>Nested Card</CardTitle>
            </Card>
          </CardContent>
        </Card>
      );
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('Parent Card');
      expect(headings[1]).toHaveTextContent('Nested Card');
    });
  });

  describe('Variant Combinations', () => {
    it('renders default variant with all subcomponents', () => {
      const { container } = render(
        <Card variant="default">
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );
      expect(container.firstChild).toHaveClass('bg-gray-1', 'border-gray-6');
    });

    it('renders glass variant with all subcomponents', () => {
      const { container } = render(
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Glass Card</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      expect(container.firstChild).toHaveClass('bg-white/5', 'backdrop-blur-md');
    });

    it('renders elevated variant with all subcomponents', () => {
      const { container } = render(
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Elevated Card</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      expect(container.firstChild).toHaveClass('shadow-lg');
    });

    it('renders outline variant with all subcomponents', () => {
      const { container } = render(
        <Card variant="outline">
          <CardHeader>
            <CardTitle>Outline Card</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      expect(container.firstChild).toHaveClass('bg-transparent', 'border-gray-7');
    });

    it('renders gradient variant with all subcomponents', () => {
      const { container } = render(
        <Card variant="gradient">
          <CardHeader>
            <CardTitle>Gradient Card</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      expect(container.firstChild).toHaveClass('bg-gradient-to-br');
    });
  });

  describe('Complex Use Cases', () => {
    it('renders card with multiple action buttons in footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Action Card</CardTitle>
          </CardHeader>
          <CardContent>Choose an action</CardContent>
          <CardFooter>
            <button>Cancel</button>
            <button>Save Draft</button>
            <button>Publish</button>
          </CardFooter>
        </Card>
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('renders card with form elements', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Form Card</CardTitle>
          </CardHeader>
          <CardContent>
            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
          </CardContent>
          <CardFooter>
            <button type="submit">Submit</button>
          </CardFooter>
        </Card>
      );
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders card with list items', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>List Card</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </CardContent>
        </Card>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('renders card with custom content structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Custom Card</CardTitle>
            <CardDescription>With custom structure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2">
              <div>Column 1</div>
              <div>Column 2</div>
            </div>
          </CardContent>
          <CardFooter>
            <span>Status: Active</span>
            <button>Edit</button>
          </CardFooter>
        </Card>
      );
      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Column 2')).toBeInTheDocument();
      expect(screen.getByText('Status: Active')).toBeInTheDocument();
    });
  });
});

describe('Edge Cases', () => {
  describe('Empty and Null Values', () => {
    it('handles empty className', () => {
      const { container } = render(<Card className="">Content</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles null className', () => {
      const { container } = render(<Card className={null}>Content</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles undefined className', () => {
      const { container } = render(<Card className={undefined}>Content</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<Card>{true}{false}</Card>);
      expect(screen.queryByText('true')).not.toBeInTheDocument();
      expect(screen.queryByText('false')).not.toBeInTheDocument();
    });

    it('handles array of children', () => {
      const children = [
        <div key="1">Item 1</div>,
        <div key="2">Item 2</div>,
        <div key="3">Item 3</div>
      ];
      render(<Card>{children}</Card>);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('handles fragments in children', () => {
      render(
        <Card>
          <>
            <div>Fragment 1</div>
            <div>Fragment 2</div>
          </>
        </Card>
      );
      expect(screen.getByText('Fragment 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment 2')).toBeInTheDocument();
    });
  });

  describe('Special Characters and Content', () => {
    it('handles very long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<Card>{longText}</Card>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      render(<Card>Special: @#$%^&*()_+-={}[]|:";'&lt;&gt;?,./</Card>);
      expect(screen.getByText(/Special:/)).toBeInTheDocument();
    });

    it('handles emoji in content', () => {
      render(<Card>Card with emoji 🎉🎊✨</Card>);
      expect(screen.getByText(/Card with emoji/)).toBeInTheDocument();
    });

    it('handles HTML entities', () => {
      render(<Card>&lt;div&gt;Test&lt;/div&gt;</Card>);
      expect(screen.getByText(/Test/)).toBeInTheDocument();
    });

    it('handles unicode characters', () => {
      render(<Card>Unicode: 你好世界 مرحبا العالم Привет мир</Card>);
      expect(screen.getByText(/Unicode:/)).toBeInTheDocument();
    });
  });

  describe('Multiple ClassName Handling', () => {
    it('handles multiple className strings', () => {
      const { container } = render(<Card className="class1 class2 class3">Content</Card>);
      expect(container.firstChild).toHaveClass('class1', 'class2', 'class3');
    });

    it('merges base classes with custom classes', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      expect(container.firstChild).toHaveClass('rounded-xl', 'border', 'custom-class');
    });

    it('handles className with special characters', () => {
      const { container } = render(<Card className="bg-gray-1/50">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-gray-1/50');
    });
  });

  describe('Conditional Rendering', () => {
    it('conditionally renders subcomponents', () => {
      const showFooter = false;
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
          {showFooter && <CardFooter>Footer</CardFooter>}
        </Card>
      );
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.queryByText('Footer')).not.toBeInTheDocument();
    });

    it('conditionally renders with ternary', () => {
      const hasDescription = true;
      render(
        <CardHeader>
          <CardTitle>Title</CardTitle>
          {hasDescription ? (
            <CardDescription>Description</CardDescription>
          ) : null}
        </CardHeader>
      );
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });
});

describe('Accessibility', () => {
  describe('ARIA Attributes', () => {
    it('supports aria-label on Card', () => {
      const { container } = render(<Card aria-label="Product card">Content</Card>);
      expect(container.firstChild).toHaveAttribute('aria-label', 'Product card');
    });

    it('supports aria-labelledby on Card', () => {
      render(
        <Card aria-labelledby="card-title">
          <CardTitle id="card-title">Title</CardTitle>
          <CardContent>Content</CardContent>
        </Card>
      );
      const card = screen.getByText('Content').closest('div').parentElement;
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
    });

    it('supports aria-describedby', () => {
      render(
        <Card aria-describedby="card-desc">
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription id="card-desc">Description</CardDescription>
          </CardHeader>
        </Card>
      );
      const card = screen.getByText('Description').closest('div').parentElement.parentElement;
      expect(card).toHaveAttribute('aria-describedby', 'card-desc');
    });

    it('supports role attribute', () => {
      const { container } = render(<Card role="article">Content</Card>);
      expect(container.firstChild).toHaveAttribute('role', 'article');
    });

    it('supports aria-hidden for decorative cards', () => {
      const { container } = render(<Card aria-hidden="true">Decorative</Card>);
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('can be made focusable with tabIndex', () => {
      const { container } = render(<Card tabIndex={0}>Content</Card>);
      expect(container.firstChild).toHaveAttribute('tabIndex', '0');
    });

    it('supports keyboard focus', () => {
      const { container } = render(<Card tabIndex={0}>Content</Card>);
      const element = container.firstChild;
      element.focus();
      expect(document.activeElement).toBe(element);
    });

    it('handles keyboard events on focusable card', () => {
      const handleKeyDown = jest.fn();
      const { container } = render(
        <Card tabIndex={0} onKeyDown={handleKeyDown}>Content</Card>
      );
      fireEvent.keyDown(container.firstChild, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('supports Space key press', () => {
      const handleKeyDown = jest.fn();
      const { container } = render(
        <Card tabIndex={0} onKeyDown={handleKeyDown}>Content</Card>
      );
      fireEvent.keyDown(container.firstChild, { key: ' ' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Semantic HTML', () => {
    it('CardTitle uses proper heading element', () => {
      render(<CardTitle>Accessible Title</CardTitle>);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Accessible Title');
    });

    it('CardDescription uses paragraph element', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      expect(container.firstChild.tagName).toBe('P');
    });

    it('maintains proper heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides accessible name via aria-label', () => {
      const { container } = render(
        <Card aria-label="Product information card">
          <CardContent>Product details</CardContent>
        </Card>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Product information card');
    });

    it('associates title with card via aria-labelledby', () => {
      render(
        <Card aria-labelledby="title-1">
          <CardHeader>
            <CardTitle id="title-1">Product Name</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByRole('heading')).toHaveAttribute('id', 'title-1');
    });

    it('associates description with card via aria-describedby', () => {
      render(
        <Card aria-describedby="desc-1">
          <CardHeader>
            <CardDescription id="desc-1">Product description</CardDescription>
          </CardHeader>
        </Card>
      );
      const description = screen.getByText('Product description');
      expect(description).toHaveAttribute('id', 'desc-1');
    });
  });

  describe('Focus Management', () => {
    it('maintains focus when interacting with card', () => {
      const { container } = render(<Card tabIndex={0}>Content</Card>);
      const card = container.firstChild;
      card.focus();
      expect(document.activeElement).toBe(card);
    });

    it('focuses on card content when tabbing', () => {
      render(
        <Card tabIndex={0}>
          <CardContent>
            <button>Button 1</button>
            <button>Button 2</button>
          </CardContent>
        </Card>
      );
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);
    });
  });
});

describe('Snapshot Tests', () => {
  it('matches snapshot for default variant', () => {
    const { container } = render(
      <Card variant="default">
        <CardHeader>
          <CardTitle>Default Card</CardTitle>
          <CardDescription>Default variant card</CardDescription>
        </CardHeader>
        <CardContent>Content here</CardContent>
        <CardFooter>Footer here</CardFooter>
      </Card>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for glass variant', () => {
    const { container } = render(<Card variant="glass">Glass Card</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for elevated variant', () => {
    const { container } = render(<Card variant="elevated">Elevated Card</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for outline variant', () => {
    const { container } = render(<Card variant="outline">Outline Card</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for gradient variant', () => {
    const { container } = render(<Card variant="gradient">Gradient Card</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with all subcomponents', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>With all subcomponents</CardDescription>
        </CardHeader>
        <CardContent>Main content area</CardContent>
        <CardFooter>
          <button>Cancel</button>
          <button>Save</button>
        </CardFooter>
      </Card>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for CardHeader', () => {
    const { container } = render(
      <CardHeader>
        <CardTitle>Header Title</CardTitle>
        <CardDescription>Header Description</CardDescription>
      </CardHeader>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for CardTitle', () => {
    const { container } = render(<CardTitle>Card Title</CardTitle>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for CardDescription', () => {
    const { container } = render(<CardDescription>Card Description</CardDescription>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for CardContent', () => {
    const { container } = render(<CardContent>Card Content</CardContent>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for CardFooter', () => {
    const { container } = render(
      <CardFooter>
        <button>Action</button>
      </CardFooter>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Performance and Re-rendering', () => {
  it('renders without unnecessary re-renders', () => {
    const { rerender } = render(<Card>Content 1</Card>);
    rerender(<Card>Content 1</Card>);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('handles rapid prop changes', () => {
    const { rerender, container } = render(<Card variant="default">Content</Card>);
    rerender(<Card variant="glass">Content</Card>);
    rerender(<Card variant="elevated">Content</Card>);
    rerender(<Card variant="outline">Content</Card>);
    rerender(<Card variant="gradient">Content</Card>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles rapid className changes', () => {
    const { rerender, container } = render(<Card className="class1">Content</Card>);
    rerender(<Card className="class2">Content</Card>);
    rerender(<Card className="class3">Content</Card>);
    expect(container.firstChild).toHaveClass('class3');
  });

  it('updates content efficiently', () => {
    const { rerender } = render(<Card>Content 1</Card>);
    rerender(<Card>Content 2</Card>);
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });
});

export default element
