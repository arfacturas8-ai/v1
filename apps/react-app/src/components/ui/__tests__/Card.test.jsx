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
  CardImage,
  CardBadge,
  CardSkeleton,
  NFTCard,
} from '../Card';

describe('Card', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Card>Content</Card>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('applies default variant styles', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('bg-bg-secondary');
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders as different element with "as" prop', () => {
      const { container } = render(<Card as="section">Content</Card>);
      expect(container.firstChild.tagName).toBe('SECTION');
    });
  });

  describe('Variants', () => {
    it('applies elevated variant', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-md');
    });

    it('applies interactive variant', () => {
      const { container } = render(<Card variant="interactive">Content</Card>);
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('applies glass variant', () => {
      const { container } = render(<Card variant="glass">Content</Card>);
      expect(container.firstChild).toHaveClass('glass');
    });

    it('applies outline variant', () => {
      const { container } = render(<Card variant="outline">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-transparent', 'border-2');
    });

    it('applies flat variant', () => {
      const { container } = render(<Card variant="flat">Content</Card>);
      expect(container.firstChild).toHaveClass('bg-bg-tertiary', 'border-none');
    });
  });

  describe('Padding', () => {
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

    it('applies large padding', () => {
      const { container } = render(<Card padding="lg">Content</Card>);
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('applies extra large padding', () => {
      const { container } = render(<Card padding="xl">Content</Card>);
      expect(container.firstChild).toHaveClass('p-8');
    });
  });

  describe('Hover Effects', () => {
    it('applies no hover effect by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).not.toHaveClass('hover:shadow-sm');
    });

    it('applies subtle hover effect', () => {
      const { container } = render(<Card hoverEffect="subtle">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-sm');
    });

    it('applies strong hover effect', () => {
      const { container } = render(<Card hoverEffect="strong">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
    });

    it('applies glow hover effect', () => {
      const { container } = render(<Card hoverEffect="glow">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-glow-primary');
    });
  });

  describe('Interactivity', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Clickable</Card>);

      await userEvent.click(screen.getByText('Clickable'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('auto-applies interactive variant when onClick is provided', () => {
      const { container } = render(<Card onClick={() => {}}>Content</Card>);
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('respects variant even with onClick', () => {
      const { container } = render(<Card variant="elevated" onClick={() => {}}>Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-md');
      expect(container.firstChild).not.toHaveClass('cursor-pointer');
    });

    it('has button role when onClick is provided', () => {
      const { container } = render(<Card onClick={() => {}}>Content</Card>);
      expect(container.firstChild).toHaveAttribute('role', 'button');
    });

    it('is keyboard accessible with onClick', async () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Content</Card>);

      const card = screen.getByRole('button');
      card.focus();

      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(card, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('has tabIndex when onClick is provided', () => {
      const { container } = render(<Card onClick={() => {}}>Content</Card>);
      expect(container.firstChild).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader><div>Header Content</div></CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies flex layout', () => {
    const { container } = render(<CardHeader>Content</CardHeader>);
    expect(container.firstChild).toHaveClass('flex', 'flex-col', 'space-y-1.5');
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<CardHeader ref={ref}>Content</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardTitle', () => {
  it('renders as h3 by default', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
  });

  it('renders as custom element', () => {
    render(<CardTitle as="h1">Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
  });

  it('applies title styles', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    expect(container.firstChild).toHaveClass('text-xl', 'font-semibold');
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<CardTitle ref={ref}>Title</CardTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('CardDescription', () => {
  it('renders description text', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('applies description styles', () => {
    const { container } = render(<CardDescription>Desc</CardDescription>);
    expect(container.firstChild).toHaveClass('text-sm', 'text-text-secondary');
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<CardDescription ref={ref}>Desc</CardDescription>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies content styles', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    expect(container.firstChild).toHaveClass('pt-0');
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<CardContent ref={ref}>Content</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies footer styles', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-2', 'pt-4');
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<CardFooter ref={ref}>Footer</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardImage', () => {
  it('renders image with src', () => {
    render(<CardImage src="/test.jpg" alt="Test" />);
    const img = screen.getByAlt('Test');
    expect(img).toHaveAttribute('src', '/test.jpg');
  });

  it('applies lazy loading by default', () => {
    render(<CardImage src="/test.jpg" alt="Test" />);
    expect(screen.getByAlt('Test')).toHaveAttribute('loading', 'lazy');
  });

  it('applies custom aspect ratio', () => {
    const { container } = render(<CardImage src="/test.jpg" alt="Test" aspectRatio="16/9" />);
    expect(container.firstChild).toHaveStyle({ aspectRatio: '16/9' });
  });

  it('applies cover object fit by default', () => {
    render(<CardImage src="/test.jpg" alt="Test" />);
    expect(screen.getByAlt('Test')).toHaveClass('object-cover');
  });

  it('applies contain object fit', () => {
    render(<CardImage src="/test.jpg" alt="Test" objectFit="contain" />);
    expect(screen.getByAlt('Test')).toHaveClass('object-contain');
  });

  it('shows fallback when image errors', () => {
    render(<CardImage src="/invalid.jpg" alt="Test" fallback={<div>Fallback</div>} />);
    const img = screen.getByAlt('Test');
    fireEvent.error(img);
    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });

  it('shows default icon when no fallback provided', () => {
    const { container } = render(<CardImage src="" alt="Test" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<CardImage ref={ref} src="/test.jpg" alt="Test" />);
    expect(ref.current).toBeInstanceOf(HTMLImageElement);
  });
});

describe('CardBadge', () => {
  it('renders badge text', () => {
    render(<CardBadge>New</CardBadge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

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

  it('positions badge absolutely', () => {
    const { container } = render(<CardBadge>Badge</CardBadge>);
    expect(container.firstChild).toHaveClass('absolute', 'top-2', 'right-2');
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<CardBadge ref={ref}>Badge</CardBadge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

describe('CardSkeleton', () => {
  it('renders loading skeleton', () => {
    const { container } = render(<CardSkeleton />);
    const skeleton = container.querySelector('.shimmer');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies custom aspect ratio', () => {
    const { container } = render(<CardSkeleton aspectRatio="16/9" />);
    const shimmer = container.querySelector('.shimmer');
    expect(shimmer).toHaveStyle({ aspectRatio: '16/9' });
  });

  it('renders multiple shimmer elements', () => {
    const { container } = render(<CardSkeleton />);
    const shimmers = container.querySelectorAll('.shimmer');
    expect(shimmers.length).toBeGreaterThan(1);
  });
});

describe('NFTCard', () => {
  const defaultProps = {
    image: '/nft.jpg',
    title: 'Cool NFT #1234',
    description: 'Rare digital collectible',
    price: '0.5 ETH',
  };

  it('renders all NFT card elements', () => {
    render(<NFTCard {...defaultProps} />);
    expect(screen.getByText('Cool NFT #1234')).toBeInTheDocument();
    expect(screen.getByText('Rare digital collectible')).toBeInTheDocument();
    expect(screen.getByText('0.5 ETH')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('renders image', () => {
    render(<NFTCard {...defaultProps} />);
    const img = screen.getByAlt('Cool NFT #1234');
    expect(img).toHaveAttribute('src', '/nft.jpg');
  });

  it('renders badge when provided', () => {
    render(<NFTCard {...defaultProps} badge="Featured" />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<NFTCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button');
    await userEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders without price', () => {
    const { price, ...propsWithoutPrice } = defaultProps;
    render(<NFTCard {...propsWithoutPrice} />);
    expect(screen.queryByText('Price')).not.toBeInTheDocument();
  });

  it('renders without description', () => {
    const { description, ...propsWithoutDesc } = defaultProps;
    render(<NFTCard {...propsWithoutDesc} />);
    expect(screen.queryByText('Rare digital collectible')).not.toBeInTheDocument();
  });

  it('uses interactive variant', () => {
    const { container } = render(<NFTCard {...defaultProps} />);
    expect(container.querySelector('[role="button"]')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = React.createRef();
    render(<NFTCard {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Card Integration', () => {
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

  it('renders card with image', () => {
    render(
      <Card padding="none">
        <CardImage src="/test.jpg" alt="Test" />
        <CardContent>
          <CardTitle>Image Card</CardTitle>
        </CardContent>
      </Card>
    );

    expect(screen.getByAlt('Test')).toBeInTheDocument();
    expect(screen.getByText('Image Card')).toBeInTheDocument();
  });
});

export default handleClick
