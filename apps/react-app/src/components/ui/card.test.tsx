/**
 * Comprehensive tests for Card component
 * Tests all variants, subcomponents, and interactive behaviors
 */

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, whileHover, whileTap, initial, animate, transition, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardImage,
} from './card';

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render with default variant styles', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('transition-all');
    });

    it('should pass through HTML attributes', () => {
      const { container } = render(
        <Card data-testid="card" aria-label="Test card">
          Content
        </Card>
      );
      expect(container.firstChild).toHaveAttribute('data-testid', 'card');
      expect(container.firstChild).toHaveAttribute('aria-label', 'Test card');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { container } = render(<Card variant="default">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('shadow-sm');
    });

    it('should render glass variant', () => {
      const { container } = render(<Card variant="glass">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('backdrop-blur-md');
      expect(card).toHaveClass('shadow-lg');
    });

    it('should render gradient variant', () => {
      const { container } = render(<Card variant="gradient">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-gradient-to-br');
      expect(card).toHaveClass('shadow-lg');
    });

    it('should render outline variant', () => {
      const { container } = render(<Card variant="outline">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-2');
      expect(card).toHaveClass('bg-transparent');
    });

    it('should render elevated variant', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('shadow-md');
    });

    it('should render interactive variant', () => {
      const { container } = render(<Card variant="interactive">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveClass('shadow-sm');
    });

    it('should render neon variant', () => {
      const { container } = render(<Card variant="neon">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('backdrop-blur-sm');
      expect(card).toHaveClass('border-2');
    });
  });

  describe('Size Variants', () => {
    it('should render with small size', () => {
      const { container } = render(<Card size="sm">Content</Card>);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('should render with default size', () => {
      const { container } = render(<Card size="default">Content</Card>);
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('should render with large size', () => {
      const { container } = render(<Card size="lg">Content</Card>);
      expect(container.firstChild).toHaveClass('p-8');
    });
  });

  describe('Hover Effects', () => {
    it('should render with no hover effect', () => {
      const { container } = render(<Card hover="none">Content</Card>);
      const card = container.firstChild as HTMLElement;
      // Should not have hover classes
      expect(card.className).not.toContain('hover:translate-y');
      expect(card.className).not.toContain('hover:scale');
    });

    it('should render with lift hover effect', () => {
      const { container } = render(<Card hover="lift">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:translate-y-[-4px]');
    });

    it('should render with glow hover effect', () => {
      const { container } = render(<Card hover="glow">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-xl');
    });

    it('should render with scale hover effect', () => {
      const { container } = render(<Card hover="scale">Content</Card>);
      expect(container.firstChild).toHaveClass('hover:scale-[1.02]');
    });
  });

  describe('Interactive Props', () => {
    it('should render as clickable', () => {
      const { container } = render(<Card clickable>Content</Card>);
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('should handle onClick event', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = screen.getByText('Clickable Card');

      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render with animated prop', () => {
      const { container } = render(<Card animated>Animated Content</Card>);
      expect(screen.getByText('Animated Content')).toBeInTheDocument();
    });

    it('should combine clickable and animated props', () => {
      const { container } = render(
        <Card clickable animated>
          Interactive Card
        </Card>
      );
      expect(container.firstChild).toHaveClass('cursor-pointer');
      expect(screen.getByText('Interactive Card')).toBeInTheDocument();
    });
  });

  describe('Combined Variants', () => {
    it('should combine variant, size, and hover', () => {
      const { container } = render(
        <Card variant="glass" size="lg" hover="lift">
          Content
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('backdrop-blur-md');
      expect(card).toHaveClass('p-8');
      expect(card).toHaveClass('hover:translate-y-[-4px]');
    });

    it('should work with all props combined', () => {
      const { container } = render(
        <Card
          variant="interactive"
          size="default"
          hover="scale"
          clickable
          animated
          className="custom-class"
        >
          Full Props Card
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('p-6');
    });
  });
});

describe('CardHeader Component', () => {
  it('should render with children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<CardHeader>Content</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('flex-col');
    expect(header).toHaveClass('space-y-1.5');
    expect(header).toHaveClass('p-6');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CardHeader className="custom-header">Content</CardHeader>
    );
    expect(container.firstChild).toHaveClass('custom-header');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardHeader ref={ref}>Content</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should pass through HTML attributes', () => {
    const { container } = render(
      <CardHeader data-testid="header" role="banner">
        Content
      </CardHeader>
    );
    expect(container.firstChild).toHaveAttribute('data-testid', 'header');
    expect(container.firstChild).toHaveAttribute('role', 'banner');
  });
});

describe('CardTitle Component', () => {
  it('should render with children', () => {
    render(<CardTitle>Title text</CardTitle>);
    expect(screen.getByText('Title text')).toBeInTheDocument();
  });

  it('should render as h3 element', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    expect(container.querySelector('h3')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    const title = container.firstChild as HTMLElement;
    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveClass('leading-none');
    expect(title).toHaveClass('tracking-tight');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CardTitle className="custom-title">Title</CardTitle>
    );
    expect(container.firstChild).toHaveClass('custom-title');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<CardTitle ref={ref}>Title</CardTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('CardDescription Component', () => {
  it('should render with children', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('should render as p element', () => {
    const { container } = render(<CardDescription>Description</CardDescription>);
    expect(container.querySelector('p')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<CardDescription>Description</CardDescription>);
    const description = container.firstChild as HTMLElement;
    expect(description).toHaveClass('text-sm');
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CardDescription className="custom-description">Description</CardDescription>
    );
    expect(container.firstChild).toHaveClass('custom-description');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<CardDescription ref={ref}>Description</CardDescription>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe('CardContent Component', () => {
  it('should render with children', () => {
    render(<CardContent>Content text</CardContent>);
    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass('p-6');
    expect(content).toHaveClass('pt-0');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CardContent className="custom-content">Content</CardContent>
    );
    expect(container.firstChild).toHaveClass('custom-content');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardContent ref={ref}>Content</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should render complex content', () => {
    render(
      <CardContent>
        <div>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </div>
      </CardContent>
    );
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });
});

describe('CardFooter Component', () => {
  it('should render with children', () => {
    render(<CardFooter>Footer text</CardFooter>);
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(footer).toHaveClass('p-6');
    expect(footer).toHaveClass('pt-0');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CardFooter className="custom-footer">Footer</CardFooter>
    );
    expect(container.firstChild).toHaveClass('custom-footer');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardFooter ref={ref}>Footer</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should render multiple footer items', () => {
    render(
      <CardFooter>
        <button>Action 1</button>
        <button>Action 2</button>
      </CardFooter>
    );
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });
});

describe('CardImage Component', () => {
  it('should render with src and alt', () => {
    render(<CardImage src="/test-image.jpg" alt="Test image" />);
    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('should apply default classes', () => {
    render(<CardImage src="/test.jpg" alt="Test" />);
    const image = screen.getByAltText('Test');
    expect(image).toHaveClass('w-full');
    expect(image).toHaveClass('object-cover');
  });

  it('should apply 16/9 aspect ratio', () => {
    render(<CardImage src="/test.jpg" alt="Test" aspectRatio="16/9" />);
    const image = screen.getByAltText('Test');
    expect(image).toHaveClass('aspect-video');
  });

  it('should apply 4/3 aspect ratio', () => {
    render(<CardImage src="/test.jpg" alt="Test" aspectRatio="4/3" />);
    const image = screen.getByAltText('Test');
    expect(image).toHaveClass('aspect-[4/3]');
  });

  it('should apply 1/1 aspect ratio', () => {
    render(<CardImage src="/test.jpg" alt="Test" aspectRatio="1/1" />);
    const image = screen.getByAltText('Test');
    expect(image).toHaveClass('aspect-square');
  });

  it('should apply auto aspect ratio (no class)', () => {
    render(<CardImage src="/test.jpg" alt="Test" aspectRatio="auto" />);
    const image = screen.getByAltText('Test');
    expect(image).not.toHaveClass('aspect-video');
    expect(image).not.toHaveClass('aspect-square');
  });

  it('should apply custom className', () => {
    render(
      <CardImage
        src="/test.jpg"
        alt="Test"
        className="custom-image"
      />
    );
    expect(screen.getByAltText('Test')).toHaveClass('custom-image');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLImageElement>();
    render(<CardImage ref={ref} src="/test.jpg" alt="Test" />);
    expect(ref.current).toBeInstanceOf(HTMLImageElement);
  });

  it('should pass through HTML image attributes', () => {
    render(
      <CardImage
        src="/test.jpg"
        alt="Test"
        loading="lazy"
        width={300}
        height={200}
      />
    );
    const image = screen.getByAltText('Test');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('width', '300');
    expect(image).toHaveAttribute('height', '200');
  });
});

describe('Complete Card Composition', () => {
  it('should render full card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content here</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Main content here')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should render card with image', () => {
    render(
      <Card>
        <CardImage src="/featured.jpg" alt="Featured" aspectRatio="16/9" />
        <CardHeader>
          <CardTitle>Image Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Content with image</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByAltText('Featured')).toBeInTheDocument();
    expect(screen.getByText('Image Card')).toBeInTheDocument();
    expect(screen.getByText('Content with image')).toBeInTheDocument();
  });

  it('should render interactive card with all features', () => {
    const handleClick = jest.fn();

    render(
      <Card
        variant="interactive"
        size="lg"
        hover="lift"
        clickable
        animated
        onClick={handleClick}
        data-testid="interactive-card"
      >
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
          <CardDescription>Click me!</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Interactive content</p>
        </CardContent>
        <CardFooter>
          <button>Learn More</button>
        </CardFooter>
      </Card>
    );

    const card = screen.getByTestId('interactive-card');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('p-8');
    expect(card).toHaveClass('hover:translate-y-[-4px]');

    expect(screen.getByText('Interactive Card')).toBeInTheDocument();
    expect(screen.getByText('Click me!')).toBeInTheDocument();
    expect(screen.getByText('Interactive content')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('should render minimal card with just content', () => {
    render(
      <Card>
        <CardContent>Just content, no header or footer</CardContent>
      </Card>
    );

    expect(screen.getByText('Just content, no header or footer')).toBeInTheDocument();
  });

  it('should render card without CardContent wrapper', () => {
    render(
      <Card>
        <div>Direct children without wrapper</div>
      </Card>
    );

    expect(screen.getByText('Direct children without wrapper')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('should support focus-visible styles', () => {
    const { container } = render(<Card>Accessible Card</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('focus-visible:outline-none');
    expect(card).toHaveClass('focus-visible:ring-2');
  });

  it('should support aria attributes on Card', () => {
    render(
      <Card aria-label="Product card" role="article">
        Content
      </Card>
    );
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', 'Product card');
  });

  it('should support semantic heading in CardTitle', () => {
    render(
      <CardHeader>
        <CardTitle>Semantic Title</CardTitle>
      </CardHeader>
    );
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toHaveTextContent('Semantic Title');
  });

  it('should allow custom heading levels via className', () => {
    const { container } = render(
      <CardTitle className="text-xl">Custom Size Title</CardTitle>
    );
    expect(container.firstChild).toHaveClass('text-xl');
  });
});

describe('Edge Cases', () => {
  it('should handle empty Card', () => {
    const { container } = render(<Card />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should handle empty subcomponents', () => {
    const { container } = render(
      <Card>
        <CardHeader />
        <CardContent />
        <CardFooter />
      </Card>
    );
    // Just check that the card renders without errors
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should handle null children', () => {
    render(
      <Card>
        {null}
        <CardContent>Visible content</CardContent>
      </Card>
    );
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('should handle conditional rendering', () => {
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
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('Footer')).not.toBeInTheDocument();
  });

  it('should handle very long text content', () => {
    const longText = 'Lorem ipsum '.repeat(100);
    render(
      <Card>
        <CardContent>{longText}</CardContent>
      </Card>
    );
    // Using a substring match for long text as full text may be broken across nodes
    expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument();
  });

  it('should handle multiple CardImages', () => {
    render(
      <Card>
        <CardImage src="/image1.jpg" alt="Image 1" />
        <CardImage src="/image2.jpg" alt="Image 2" />
        <CardContent>Gallery card</CardContent>
      </Card>
    );
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
  });
});

describe('Style Inheritance and Overrides', () => {
  it('should allow className override on Card', () => {
    const { container } = render(
      <Card className="bg-red-500 p-0">Custom styled</Card>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-red-500');
    expect(card).toHaveClass('p-0');
  });

  it('should merge multiple className values', () => {
    const { container } = render(
      <Card variant="glass" className="my-custom-class">
        Content
      </Card>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('backdrop-blur-md');
    expect(card).toHaveClass('my-custom-class');
  });

  it('should allow style overrides on subcomponents', () => {
    const { container } = render(
      <Card>
        <CardHeader className="p-2">
          <CardTitle className="text-sm">Small Title</CardTitle>
        </CardHeader>
        <CardContent className="p-2">Content</CardContent>
        <CardFooter className="p-2">Footer</CardFooter>
      </Card>
    );

    const header = container.querySelector('[class*="p-2"]');
    expect(header).toBeInTheDocument();
  });
});
