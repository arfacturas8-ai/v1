import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModernCard from './ModernCard';

describe('ModernCard', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<ModernCard>Content</ModernCard>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <ModernCard>
          <span>Child 1</span>
          <span>Child 2</span>
        </ModernCard>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('applies default variant (glass)', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('glass-card');
    });

    it('applies default padding (lg)', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-8');
    });

    it('applies default hover effect', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('hover:translate-y-[-2px]');
    });

    it('applies custom className', () => {
      const { container } = render(<ModernCard className="custom-class">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies base classes', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      const element = container.firstChild;
      expect(element).toHaveClass('relative');
      expect(element).toHaveClass('transition-all');
      expect(element).toHaveClass('duration-300');
      expect(element).toHaveClass('ease-out');
    });

    it('applies transform-gpu for performance', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('transform-gpu');
    });

    it('applies will-change-transform for optimization', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('will-change-transform');
    });

    it('renders with empty content', () => {
      const { container } = render(<ModernCard></ModernCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with null children', () => {
      const { container } = render(<ModernCard>{null}</ModernCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with undefined children', () => {
      const { container } = render(<ModernCard>{undefined}</ModernCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with string content', () => {
      render(<ModernCard>Simple text</ModernCard>);
      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('renders with number content', () => {
      render(<ModernCard>{42}</ModernCard>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with complex JSX children', () => {
      render(
        <ModernCard>
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button>Action</button>
          </div>
        </ModernCard>
      );
      expect(screen.getByRole('heading')).toHaveTextContent('Title');
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Action');
    });
  });

  describe('Variants', () => {
    it('applies glass variant', () => {
      const { container } = render(<ModernCard variant="glass">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('glass-card');
    });

    it('applies glass variant hover effects', () => {
      const { container } = render(<ModernCard variant="glass">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('hover:translate-y-[-2px]');
      expect(container.firstChild).toHaveClass('hover:shadow-glow-strong');
    });

    it('applies solid variant', () => {
      const { container } = render(<ModernCard variant="solid">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('bg-bg-secondary');
      expect(container.firstChild).toHaveClass('border');
      expect(container.firstChild).toHaveClass('border-border-primary');
    });

    it('applies solid variant hover effects', () => {
      const { container } = render(<ModernCard variant="solid">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('hover:bg-bg-tertiary');
      expect(container.firstChild).toHaveClass('hover:border-border-accent');
      expect(container.firstChild).toHaveClass('hover:translate-y-[-1px]');
    });

    it('applies elevated variant', () => {
      const { container } = render(<ModernCard variant="elevated">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('bg-bg-secondary');
      expect(container.firstChild).toHaveClass('border');
      expect(container.firstChild).toHaveClass('border-border-primary');
      expect(container.firstChild).toHaveClass('shadow-xl');
    });

    it('applies elevated variant hover effects', () => {
      const { container } = render(<ModernCard variant="elevated">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('hover:shadow-2xl');
      expect(container.firstChild).toHaveClass('hover:translate-y-[-3px]');
    });

    it('applies gradient variant', () => {
      const { container } = render(<ModernCard variant="gradient">Content</ModernCard>);
      const gradientWrapper = container.querySelector('.gradient-border');
      expect(gradientWrapper).toBeInTheDocument();
    });

    it('gradient variant renders gradient-border-content', () => {
      const { container } = render(<ModernCard variant="gradient">Content</ModernCard>);
      const gradientContent = container.querySelector('.gradient-border-content');
      expect(gradientContent).toBeInTheDocument();
    });

    it('gradient variant does not apply hover effects to parent', () => {
      const { container } = render(<ModernCard variant="gradient">Content</ModernCard>);
      const wrapper = container.firstChild;
      expect(wrapper).not.toHaveClass('hover:translate-y-[-2px]');
    });

    it('gradient variant renders children correctly', () => {
      render(<ModernCard variant="gradient">Gradient Content</ModernCard>);
      expect(screen.getByText('Gradient Content')).toBeInTheDocument();
    });
  });

  describe('Padding Variants', () => {
    it('applies none padding', () => {
      const { container } = render(<ModernCard padding="none">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-0');
    });

    it('applies small padding', () => {
      const { container } = render(<ModernCard padding="sm">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('applies medium padding', () => {
      const { container } = render(<ModernCard padding="md">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('applies large padding (default)', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-8');
    });

    it('applies large padding explicitly', () => {
      const { container } = render(<ModernCard padding="lg">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-8');
    });

    it('applies extra large padding', () => {
      const { container } = render(<ModernCard padding="xl">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-10');
    });

    it('padding works with glass variant', () => {
      const { container } = render(<ModernCard variant="glass" padding="sm">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-4');
      expect(container.firstChild).toHaveClass('glass-card');
    });

    it('padding works with solid variant', () => {
      const { container } = render(<ModernCard variant="solid" padding="xl">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-10');
      expect(container.firstChild).toHaveClass('bg-bg-secondary');
    });

    it('padding works with elevated variant', () => {
      const { container } = render(<ModernCard variant="elevated" padding="none">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('p-0');
      expect(container.firstChild).toHaveClass('shadow-xl');
    });
  });

  describe('Hover Effects', () => {
    it('applies hover effect by default', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('hover:translate-y-[-2px]');
    });

    it('applies hover effect when hover is true', () => {
      const { container } = render(<ModernCard hover={true}>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('hover:translate-y-[-2px]');
    });

    it('removes hover effect when hover is false', () => {
      const { container } = render(<ModernCard hover={false}>Content</ModernCard>);
      expect(container.firstChild).not.toHaveClass('hover:translate-y-[-2px]');
      expect(container.firstChild).not.toHaveClass('hover:shadow-glow-strong');
    });

    it('glass variant without hover', () => {
      const { container } = render(<ModernCard variant="glass" hover={false}>Content</ModernCard>);
      expect(container.firstChild).not.toHaveClass('hover:translate-y-[-2px]');
      expect(container.firstChild).not.toHaveClass('hover:shadow-glow-strong');
    });

    it('solid variant without hover', () => {
      const { container } = render(<ModernCard variant="solid" hover={false}>Content</ModernCard>);
      expect(container.firstChild).not.toHaveClass('hover:bg-bg-tertiary');
      expect(container.firstChild).not.toHaveClass('hover:border-border-accent');
      expect(container.firstChild).not.toHaveClass('hover:translate-y-[-1px]');
    });

    it('elevated variant without hover', () => {
      const { container } = render(<ModernCard variant="elevated" hover={false}>Content</ModernCard>);
      expect(container.firstChild).not.toHaveClass('hover:shadow-2xl');
      expect(container.firstChild).not.toHaveClass('hover:translate-y-[-3px]');
    });

    it('gradient variant without hover', () => {
      const { container } = render(<ModernCard variant="gradient" hover={false}>Content</ModernCard>);
      const wrapper = container.firstChild;
      expect(wrapper).not.toHaveClass('hover:translate-y-[-2px]');
      expect(wrapper).not.toHaveClass('hover:shadow-xl');
    });
  });

  describe('Gradient Overlay', () => {
    it('does not render gradient overlay by default', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).not.toBeInTheDocument();
    });

    it('renders gradient overlay when gradient is true', () => {
      const { container } = render(<ModernCard gradient={true}>Content</ModernCard>);
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toBeInTheDocument();
    });

    it('gradient overlay has correct classes', () => {
      const { container } = render(<ModernCard gradient={true}>Content</ModernCard>);
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toHaveClass('absolute');
      expect(gradient).toHaveClass('inset-0');
      expect(gradient).toHaveClass('rounded-xl');
      expect(gradient).toHaveClass('pointer-events-none');
    });

    it('gradient overlay applies gradient colors', () => {
      const { container } = render(<ModernCard gradient={true}>Content</ModernCard>);
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toHaveClass('from-accent-primary/10');
      expect(gradient).toHaveClass('via-transparent');
      expect(gradient).toHaveClass('to-accent-secondary/10');
    });

    it('content is above gradient overlay', () => {
      const { container } = render(<ModernCard gradient={true}>Content</ModernCard>);
      const contentWrapper = container.querySelector('.relative.z-10');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('gradient works with glass variant', () => {
      const { container } = render(<ModernCard variant="glass" gradient={true}>Content</ModernCard>);
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('glass-card');
    });

    it('gradient works with solid variant', () => {
      const { container } = render(<ModernCard variant="solid" gradient={true}>Content</ModernCard>);
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('bg-bg-secondary');
    });

    it('gradient does not apply to gradient variant', () => {
      const { container } = render(<ModernCard variant="gradient" gradient={true}>Content</ModernCard>);
      const bgGradient = container.querySelector('.bg-gradient-to-br');
      expect(bgGradient).not.toBeInTheDocument();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards data attributes', () => {
      const { container } = render(
        <ModernCard data-testid="test-card" data-custom="value">Content</ModernCard>
      );
      expect(container.firstChild).toHaveAttribute('data-testid', 'test-card');
      expect(container.firstChild).toHaveAttribute('data-custom', 'value');
    });

    it('forwards aria attributes', () => {
      const { container } = render(
        <ModernCard aria-label="Card label" aria-describedby="desc">Content</ModernCard>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', 'Card label');
      expect(container.firstChild).toHaveAttribute('aria-describedby', 'desc');
    });

    it('forwards role attribute', () => {
      const { container } = render(<ModernCard role="region">Content</ModernCard>);
      expect(container.firstChild).toHaveAttribute('role', 'region');
    });

    it('forwards id attribute', () => {
      const { container } = render(<ModernCard id="card-id">Content</ModernCard>);
      expect(container.firstChild).toHaveAttribute('id', 'card-id');
    });

    it('forwards style prop', () => {
      const { container } = render(
        <ModernCard style={{ backgroundColor: 'red' }}>Content</ModernCard>
      );
      expect(container.firstChild).toHaveStyle({ backgroundColor: 'red' });
    });

    it('forwards onClick handler', () => {
      const handleClick = jest.fn();
      const { container } = render(<ModernCard onClick={handleClick}>Content</ModernCard>);
      fireEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('forwards onMouseEnter handler', () => {
      const handleMouseEnter = jest.fn();
      const { container } = render(<ModernCard onMouseEnter={handleMouseEnter}>Content</ModernCard>);
      fireEvent.mouseEnter(container.firstChild);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('forwards onMouseLeave handler', () => {
      const handleMouseLeave = jest.fn();
      const { container } = render(<ModernCard onMouseLeave={handleMouseLeave}>Content</ModernCard>);
      fireEvent.mouseLeave(container.firstChild);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('forwards onFocus handler', () => {
      const handleFocus = jest.fn();
      const { container } = render(<ModernCard onFocus={handleFocus} tabIndex={0}>Content</ModernCard>);
      fireEvent.focus(container.firstChild);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('forwards onBlur handler', () => {
      const handleBlur = jest.fn();
      const { container } = render(<ModernCard onBlur={handleBlur} tabIndex={0}>Content</ModernCard>);
      const element = container.firstChild;
      element.focus();
      fireEvent.blur(element);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('ModernCard.Header', () => {
    it('renders header component', () => {
      render(<ModernCard.Header>Header Content</ModernCard.Header>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies default margin bottom', () => {
      const { container } = render(<ModernCard.Header>Header</ModernCard.Header>);
      expect(container.firstChild).toHaveClass('mb-6');
    });

    it('applies custom className', () => {
      const { container } = render(<ModernCard.Header className="custom-header">Header</ModernCard.Header>);
      expect(container.firstChild).toHaveClass('custom-header');
      expect(container.firstChild).toHaveClass('mb-6');
    });

    it('renders children correctly', () => {
      render(
        <ModernCard.Header>
          <h1>Title</h1>
          <p>Subtitle</p>
        </ModernCard.Header>
      );
      expect(screen.getByRole('heading')).toHaveTextContent('Title');
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });

    it('works inside ModernCard', () => {
      render(
        <ModernCard>
          <ModernCard.Header>Header</ModernCard.Header>
          <div>Content</div>
        </ModernCard>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('ModernCard.Title', () => {
    it('renders title component', () => {
      render(<ModernCard.Title>Card Title</ModernCard.Title>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('renders as h3 by default', () => {
      render(<ModernCard.Title>Title</ModernCard.Title>);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
    });

    it('applies title styles', () => {
      const { container } = render(<ModernCard.Title>Title</ModernCard.Title>);
      expect(container.firstChild).toHaveClass('text-xl');
      expect(container.firstChild).toHaveClass('font-semibold');
      expect(container.firstChild).toHaveClass('text-text-primary');
      expect(container.firstChild).toHaveClass('mb-2');
    });

    it('applies custom className', () => {
      const { container } = render(<ModernCard.Title className="custom-title">Title</ModernCard.Title>);
      expect(container.firstChild).toHaveClass('custom-title');
      expect(container.firstChild).toHaveClass('text-xl');
    });

    it('works inside ModernCard.Header', () => {
      render(
        <ModernCard>
          <ModernCard.Header>
            <ModernCard.Title>Title</ModernCard.Title>
          </ModernCard.Header>
        </ModernCard>
      );
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
    });
  });

  describe('ModernCard.Description', () => {
    it('renders description component', () => {
      render(<ModernCard.Description>Description text</ModernCard.Description>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('applies description styles', () => {
      const { container } = render(<ModernCard.Description>Description</ModernCard.Description>);
      expect(container.firstChild).toHaveClass('text-text-tertiary');
      expect(container.firstChild).toHaveClass('leading-relaxed');
    });

    it('renders as paragraph element', () => {
      const { container } = render(<ModernCard.Description>Description</ModernCard.Description>);
      expect(container.firstChild.tagName).toBe('P');
    });

    it('applies custom className', () => {
      const { container } = render(<ModernCard.Description className="custom-desc">Description</ModernCard.Description>);
      expect(container.firstChild).toHaveClass('custom-desc');
      expect(container.firstChild).toHaveClass('text-text-tertiary');
    });

    it('works inside ModernCard.Header', () => {
      render(
        <ModernCard>
          <ModernCard.Header>
            <ModernCard.Title>Title</ModernCard.Title>
            <ModernCard.Description>Description</ModernCard.Description>
          </ModernCard.Header>
        </ModernCard>
      );
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders long text correctly', () => {
      const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
      render(<ModernCard.Description>{longText}</ModernCard.Description>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe('ModernCard.Footer', () => {
    it('renders footer component', () => {
      render(<ModernCard.Footer>Footer Content</ModernCard.Footer>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('applies footer styles', () => {
      const { container } = render(<ModernCard.Footer>Footer</ModernCard.Footer>);
      expect(container.firstChild).toHaveClass('mt-6');
      expect(container.firstChild).toHaveClass('pt-4');
      expect(container.firstChild).toHaveClass('border-t');
      expect(container.firstChild).toHaveClass('border-border-primary');
    });

    it('applies custom className', () => {
      const { container } = render(<ModernCard.Footer className="custom-footer">Footer</ModernCard.Footer>);
      expect(container.firstChild).toHaveClass('custom-footer');
      expect(container.firstChild).toHaveClass('mt-6');
    });

    it('renders children correctly', () => {
      render(
        <ModernCard.Footer>
          <button>Action 1</button>
          <button>Action 2</button>
        </ModernCard.Footer>
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('Action 1');
      expect(buttons[1]).toHaveTextContent('Action 2');
    });

    it('works inside ModernCard', () => {
      render(
        <ModernCard>
          <div>Content</div>
          <ModernCard.Footer>Footer</ModernCard.Footer>
        </ModernCard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders complete card with all subcomponents', () => {
      render(
        <ModernCard>
          <ModernCard.Header>
            <ModernCard.Title>Test Card</ModernCard.Title>
            <ModernCard.Description>Test Description</ModernCard.Description>
          </ModernCard.Header>
          <div>Main Content</div>
          <ModernCard.Footer>
            <button>Action</button>
          </ModernCard.Footer>
        </ModernCard>
      );

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Card');
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Action');
    });

    it('renders card with glass variant and all subcomponents', () => {
      const { container } = render(
        <ModernCard variant="glass">
          <ModernCard.Header>
            <ModernCard.Title>Glass Card</ModernCard.Title>
          </ModernCard.Header>
          <div>Content</div>
        </ModernCard>
      );

      expect(container.firstChild).toHaveClass('glass-card');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Glass Card');
    });

    it('renders card with solid variant and all subcomponents', () => {
      const { container } = render(
        <ModernCard variant="solid">
          <ModernCard.Header>
            <ModernCard.Title>Solid Card</ModernCard.Title>
          </ModernCard.Header>
          <div>Content</div>
        </ModernCard>
      );

      expect(container.firstChild).toHaveClass('bg-bg-secondary');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Solid Card');
    });

    it('renders card with gradient overlay and subcomponents', () => {
      const { container } = render(
        <ModernCard gradient={true}>
          <ModernCard.Header>
            <ModernCard.Title>Gradient Card</ModernCard.Title>
          </ModernCard.Header>
          <div>Content</div>
        </ModernCard>
      );

      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Gradient Card');
    });

    it('renders nested cards', () => {
      render(
        <ModernCard>
          <ModernCard.Title>Parent Card</ModernCard.Title>
          <ModernCard variant="solid" padding="sm">
            <ModernCard.Title>Child Card</ModernCard.Title>
          </ModernCard>
        </ModernCard>
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('Parent Card');
      expect(headings[1]).toHaveTextContent('Child Card');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined variant gracefully', () => {
      const { container } = render(<ModernCard variant={undefined}>Content</ModernCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles invalid variant gracefully', () => {
      const { container } = render(<ModernCard variant="invalid">Content</ModernCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles invalid padding gracefully', () => {
      const { container } = render(<ModernCard padding="invalid">Content</ModernCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles empty className', () => {
      const { container } = render(<ModernCard className="">Content</ModernCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles multiple className strings', () => {
      const { container } = render(<ModernCard className="class1 class2 class3">Content</ModernCard>);
      expect(container.firstChild).toHaveClass('class1', 'class2', 'class3');
    });

    it('handles hover prop with non-boolean value', () => {
      const { container } = render(<ModernCard hover={null}>Content</ModernCard>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles gradient prop with non-boolean value', () => {
      const { container } = render(<ModernCard gradient={null}>Content</ModernCard>);
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).not.toBeInTheDocument();
    });

    it('handles very long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<ModernCard>{longText}</ModernCard>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      render(<ModernCard>Special: @#$%^&*()_+-={}[]|:";'<>?,./</ModernCard>);
      expect(screen.getByText(/Special:/)).toBeInTheDocument();
    });

    it('handles emoji in content', () => {
      render(<ModernCard>Card with emoji 🎉🎊✨</ModernCard>);
      expect(screen.getByText(/Card with emoji/)).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<ModernCard>{true}{false}</ModernCard>);
      expect(screen.queryByText('true')).not.toBeInTheDocument();
      expect(screen.queryByText('false')).not.toBeInTheDocument();
    });

    it('handles array of children', () => {
      const children = [
        <div key="1">Item 1</div>,
        <div key="2">Item 2</div>,
        <div key="3">Item 3</div>
      ];
      render(<ModernCard>{children}</ModernCard>);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('handles fragments in children', () => {
      render(
        <ModernCard>
          <>
            <div>Fragment 1</div>
            <div>Fragment 2</div>
          </>
        </ModernCard>
      );
      expect(screen.getByText('Fragment 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment 2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('applies aria-label when provided', () => {
      const { container } = render(<ModernCard aria-label="Card label">Content</ModernCard>);
      expect(container.firstChild).toHaveAttribute('aria-label', 'Card label');
    });

    it('applies aria-describedby when provided', () => {
      const { container } = render(
        <ModernCard aria-describedby="description-id">Content</ModernCard>
      );
      expect(container.firstChild).toHaveAttribute('aria-describedby', 'description-id');
    });

    it('applies role when provided', () => {
      const { container } = render(<ModernCard role="article">Content</ModernCard>);
      expect(container.firstChild).toHaveAttribute('role', 'article');
    });

    it('can be made focusable with tabIndex', () => {
      const { container } = render(<ModernCard tabIndex={0}>Content</ModernCard>);
      expect(container.firstChild).toHaveAttribute('tabIndex', '0');
    });

    it('supports keyboard navigation with tabIndex', () => {
      const { container } = render(<ModernCard tabIndex={0}>Content</ModernCard>);
      const element = container.firstChild;
      element.focus();
      expect(document.activeElement).toBe(element);
    });

    it('Title uses proper heading hierarchy', () => {
      render(<ModernCard.Title>Accessible Title</ModernCard.Title>);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Accessible Title');
    });

    it('Description has appropriate text styling for readability', () => {
      const { container } = render(<ModernCard.Description>Readable text</ModernCard.Description>);
      expect(container.firstChild).toHaveClass('leading-relaxed');
    });

    it('Footer border provides visual separation', () => {
      const { container } = render(<ModernCard.Footer>Footer</ModernCard.Footer>);
      expect(container.firstChild).toHaveClass('border-t');
    });

    it('gradient overlay does not block pointer events', () => {
      const { container } = render(<ModernCard gradient={true}>Content</ModernCard>);
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toHaveClass('pointer-events-none');
    });

    it('supports aria-hidden for decorative elements', () => {
      const { container } = render(
        <ModernCard>
          <div aria-hidden="true">Decorative</div>
          <div>Content</div>
        </ModernCard>
      );
      const decorative = container.querySelector('[aria-hidden="true"]');
      expect(decorative).toBeInTheDocument();
    });
  });

  describe('Interaction Handling', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      const { container } = render(<ModernCard onClick={handleClick}>Content</ModernCard>);

      await userEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles double click events', () => {
      const handleDoubleClick = jest.fn();
      const { container } = render(<ModernCard onDoubleClick={handleDoubleClick}>Content</ModernCard>);

      fireEvent.doubleClick(container.firstChild);
      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('handles mouse enter and leave', () => {
      const handleMouseEnter = jest.fn();
      const handleMouseLeave = jest.fn();
      const { container } = render(
        <ModernCard onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          Content
        </ModernCard>
      );

      fireEvent.mouseEnter(container.firstChild);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);

      fireEvent.mouseLeave(container.firstChild);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', () => {
      const handleKeyDown = jest.fn();
      const { container } = render(<ModernCard onKeyDown={handleKeyDown} tabIndex={0}>Content</ModernCard>);

      fireEvent.keyDown(container.firstChild, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('handles focus and blur events', () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const { container } = render(
        <ModernCard onFocus={handleFocus} onBlur={handleBlur} tabIndex={0}>
          Content
        </ModernCard>
      );

      const element = container.firstChild;
      fireEvent.focus(element);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(element);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles touch events', () => {
      const handleTouchStart = jest.fn();
      const handleTouchEnd = jest.fn();
      const { container } = render(
        <ModernCard onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          Content
        </ModernCard>
      );

      fireEvent.touchStart(container.firstChild);
      expect(handleTouchStart).toHaveBeenCalledTimes(1);

      fireEvent.touchEnd(container.firstChild);
      expect(handleTouchEnd).toHaveBeenCalledTimes(1);
    });

    it('handles context menu events', () => {
      const handleContextMenu = jest.fn();
      const { container } = render(<ModernCard onContextMenu={handleContextMenu}>Content</ModernCard>);

      fireEvent.contextMenu(container.firstChild);
      expect(handleContextMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('Combination Tests', () => {
    it('glass variant with small padding and no hover', () => {
      const { container } = render(
        <ModernCard variant="glass" padding="sm" hover={false}>Content</ModernCard>
      );
      expect(container.firstChild).toHaveClass('glass-card', 'p-4');
      expect(container.firstChild).not.toHaveClass('hover:translate-y-[-2px]');
    });

    it('solid variant with extra large padding and gradient overlay', () => {
      const { container } = render(
        <ModernCard variant="solid" padding="xl" gradient={true}>Content</ModernCard>
      );
      expect(container.firstChild).toHaveClass('bg-bg-secondary', 'p-10');
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toBeInTheDocument();
    });

    it('elevated variant with no padding and custom className', () => {
      const { container } = render(
        <ModernCard variant="elevated" padding="none" className="custom">Content</ModernCard>
      );
      expect(container.firstChild).toHaveClass('shadow-xl', 'p-0', 'custom');
    });

    it('gradient variant does not use padding prop', () => {
      const { container } = render(
        <ModernCard variant="gradient" padding="xl">Content</ModernCard>
      );
      const wrapper = container.querySelector('.gradient-border');
      expect(wrapper).toBeInTheDocument();
    });

    it('all variants with all padding sizes', () => {
      const variants = ['glass', 'solid', 'elevated'];
      const paddings = ['none', 'sm', 'md', 'lg', 'xl'];

      variants.forEach(variant => {
        paddings.forEach(padding => {
          const { container } = render(
            <ModernCard variant={variant} padding={padding}>Content</ModernCard>
          );
          expect(container.firstChild).toBeInTheDocument();
        });
      });
    });

    it('complex nested structure with all features', () => {
      const { container } = render(
        <ModernCard variant="glass" padding="lg" gradient={true} hover={true} className="custom">
          <ModernCard.Header className="header-custom">
            <ModernCard.Title className="title-custom">Title</ModernCard.Title>
            <ModernCard.Description className="desc-custom">Description</ModernCard.Description>
          </ModernCard.Header>
          <div>Main content area</div>
          <ModernCard.Footer className="footer-custom">
            <button>Action</button>
          </ModernCard.Footer>
        </ModernCard>
      );

      expect(container.firstChild).toHaveClass('glass-card', 'p-8', 'custom');
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Main content area')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Action');
    });
  });

  describe('Performance', () => {
    it('applies performance optimization classes', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('transform-gpu');
      expect(container.firstChild).toHaveClass('will-change-transform');
    });

    it('uses CSS transitions instead of JavaScript animations', () => {
      const { container } = render(<ModernCard>Content</ModernCard>);
      expect(container.firstChild).toHaveClass('transition-all');
      expect(container.firstChild).toHaveClass('duration-300');
      expect(container.firstChild).toHaveClass('ease-out');
    });

    it('renders without unnecessary re-renders', () => {
      const { rerender } = render(<ModernCard>Content 1</ModernCard>);
      rerender(<ModernCard>Content 1</ModernCard>);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('handles rapid prop changes', () => {
      const { rerender, container } = render(<ModernCard variant="glass">Content</ModernCard>);
      rerender(<ModernCard variant="solid">Content</ModernCard>);
      rerender(<ModernCard variant="elevated">Content</ModernCard>);
      rerender(<ModernCard variant="gradient">Content</ModernCard>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for glass variant', () => {
      const { container } = render(<ModernCard variant="glass">Glass Card</ModernCard>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for solid variant', () => {
      const { container } = render(<ModernCard variant="solid">Solid Card</ModernCard>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for elevated variant', () => {
      const { container } = render(<ModernCard variant="elevated">Elevated Card</ModernCard>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for gradient variant', () => {
      const { container } = render(<ModernCard variant="gradient">Gradient Card</ModernCard>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with all subcomponents', () => {
      const { container } = render(
        <ModernCard>
          <ModernCard.Header>
            <ModernCard.Title>Title</ModernCard.Title>
            <ModernCard.Description>Description</ModernCard.Description>
          </ModernCard.Header>
          <div>Content</div>
          <ModernCard.Footer>Footer</ModernCard.Footer>
        </ModernCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with gradient overlay', () => {
      const { container } = render(<ModernCard gradient={true}>Gradient Overlay</ModernCard>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default element
