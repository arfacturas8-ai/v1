/**
 * CRYB Platform - Comprehensive Button Component Tests
 * Tests for the OpenSea-inspired Button component with all variants
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, ButtonGroup, IconButton } from './Button';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <svg data-testid="plus-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  X: () => <svg data-testid="x-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  Upload: () => <svg data-testid="upload-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  Trash: () => <svg data-testid="trash-icon" />,
}));

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with children text', () => {
      render(<Button>Submit Form</Button>);
      expect(screen.getByText('Submit Form')).toBeInTheDocument();
    });

    it('renders with complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('has correct display name', () => {
      expect(Button.displayName).toBe('Button');
    });

    it('renders as button element by default', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('has default type="button"', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });

  describe('Button Variants', () => {
    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-bg-secondary');
    });

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-2');
      expect(button.className).toContain('border-primary');
    });

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-transparent');
    });

    it('renders danger variant', () => {
      render(<Button variant="danger">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-error');
    });

    it('renders success variant', () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-success');
    });

    it('renders link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-text-link');
      expect(button.className).toContain('underline-offset-4');
    });

    it('renders glass variant', () => {
      render(<Button variant="glass">Glass</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('glass');
    });
  });

  describe('Button Sizes', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('px-4');
    });

    it('renders small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
      expect(button.className).toContain('px-3');
    });

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('px-6');
    });

    it('renders extra large size', () => {
      render(<Button size="xl">Extra Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-14');
      expect(button.className).toContain('px-8');
    });

    it('renders icon size', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('w-10');
    });

    it('renders small icon size', () => {
      render(<Button size="icon-sm">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
      expect(button.className).toContain('w-8');
    });

    it('renders large icon size', () => {
      render(<Button size="icon-lg">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('w-12');
    });
  });

  describe('User Interactions', () => {
    it('handles click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('handles click with event object', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('handles mouse enter events', () => {
      const handleMouseEnter = jest.fn();
      render(<Button onMouseEnter={handleMouseEnter}>Hover me</Button>);

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('handles mouse leave events', () => {
      const handleMouseLeave = jest.fn();
      render(<Button onMouseLeave={handleMouseLeave}>Hover me</Button>);

      const button = screen.getByRole('button');
      fireEvent.mouseLeave(button);

      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('handles focus events', () => {
      const handleFocus = jest.fn();
      render(<Button onFocus={handleFocus}>Focus me</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles blur events', () => {
      const handleBlur = jest.fn();
      render(<Button onBlur={handleBlur}>Blur me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      button.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not trigger onClick when disabled', () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('has aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('applies disabled opacity', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('opacity-50');
    });

    it('applies pointer-events-none when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('pointer-events-none');
    });

    it('applies cursor-not-allowed when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('cursor-not-allowed');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      const { container } = render(<Button loading>Loading</Button>);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('has aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not trigger onClick when loading', () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies cursor-wait when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('cursor-wait');
    });

    it('shows small spinner for small button', () => {
      const { container } = render(
        <Button loading size="sm">
          Loading
        </Button>
      );
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner.className).toContain('w-3');
      expect(spinner.className).toContain('h-3');
    });

    it('shows medium spinner for medium button', () => {
      const { container } = render(
        <Button loading size="md">
          Loading
        </Button>
      );
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner.className).toContain('w-4');
      expect(spinner.className).toContain('h-4');
    });

    it('shows large spinner for large button', () => {
      const { container } = render(
        <Button loading size="lg">
          Loading
        </Button>
      );
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner.className).toContain('w-5');
      expect(spinner.className).toContain('h-5');
    });

    it('shows extra large spinner for xl button', () => {
      const { container } = render(
        <Button loading size="xl">
          Loading
        </Button>
      );
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner.className).toContain('w-6');
      expect(spinner.className).toContain('h-6');
    });

    it('hides icons when loading', () => {
      const { queryByTestId } = render(
        <Button loading leftIcon={<svg data-testid="left-icon" />}>
          Loading
        </Button>
      );
      expect(queryByTestId('left-icon')).not.toBeInTheDocument();
    });

    it('still shows children text when loading', () => {
      render(<Button loading>Loading Text</Button>);
      expect(screen.getByText('Loading Text')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      const { container } = render(
        <Button leftIcon={<svg data-testid="left-icon" />}>With Icon</Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      const { container } = render(
        <Button rightIcon={<svg data-testid="right-icon" />}>With Icon</Button>
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renders with both left and right icons', () => {
      render(
        <Button
          leftIcon={<svg data-testid="left-icon" />}
          rightIcon={<svg data-testid="right-icon" />}
        >
          Both Icons
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('left icon has aria-hidden', () => {
      const { container } = render(
        <Button leftIcon={<svg data-testid="left-icon" />}>With Icon</Button>
      );
      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('right icon has aria-hidden', () => {
      const { container } = render(
        <Button rightIcon={<svg data-testid="right-icon" />}>With Icon</Button>
      );
      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies inline-flex to icon containers', () => {
      const { container } = render(
        <Button leftIcon={<svg data-testid="left-icon" />}>With Icon</Button>
      );
      const iconContainer = container.querySelector('.inline-flex');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies shrink-0 to icon containers', () => {
      const { container } = render(
        <Button leftIcon={<svg data-testid="left-icon" />}>With Icon</Button>
      );
      const iconContainer = container.querySelector('.shrink-0');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Full Width', () => {
    it('is not full width by default', () => {
      render(<Button>Not Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).not.toContain('w-full');
    });

    it('can be full width', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
    });

    it('works with fullWidth prop set to true', () => {
      render(<Button fullWidth={true}>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
    });

    it('is not full width when prop is false', () => {
      render(<Button fullWidth={false}>Not Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).not.toContain('w-full');
    });
  });

  describe('Custom Element Rendering', () => {
    it('renders as anchor tag with "as" prop', () => {
      render(
        <Button as="a" href="/test">
          Link Button
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });

    it('does not have type attribute when rendered as anchor', () => {
      render(
        <Button as="a" href="/test">
          Link
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('type');
    });

    it('renders as div with "as" prop', () => {
      const { container } = render(<Button as="div">Div Button</Button>);
      const div = container.querySelector('div');
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent('Div Button');
    });

    it('renders as span with "as" prop', () => {
      const { container } = render(<Button as="span">Span Button</Button>);
      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
    });

    it('preserves button styling when rendered as different element', () => {
      const { container } = render(
        <Button as="a" variant="primary" size="lg">
          Link
        </Button>
      );
      const link = container.querySelector('a');
      expect(link.className).toContain('bg-primary');
      expect(link.className).toContain('h-12');
    });
  });

  describe('Custom Type Attribute', () => {
    it('has type="button" by default', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('supports type="submit"', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('supports type="reset"', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button.className).toContain('inline-flex');
    });

    it('supports multiple custom classes', () => {
      render(<Button className="custom-1 custom-2 custom-3">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-1');
      expect(button).toHaveClass('custom-2');
      expect(button).toHaveClass('custom-3');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('can focus button via ref', () => {
      const ref = React.createRef();
      render(<Button ref={ref}>Button</Button>);
      ref.current.focus();
      expect(ref.current).toHaveFocus();
    });

    it('can click button via ref', () => {
      const handleClick = jest.fn();
      const ref = React.createRef();
      render(
        <Button ref={ref} onClick={handleClick}>
          Button
        </Button>
      );
      ref.current.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('forwards ref when rendered as anchor', () => {
      const ref = React.createRef();
      render(
        <Button as="a" ref={ref}>
          Link
        </Button>
      );
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe('Accessibility', () => {
    it('has focus-visible styles', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-visible:outline-none');
      expect(button.className).toContain('focus-visible:ring-2');
    });

    it('is keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Accessible</Button>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('has proper button role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has select-none to prevent text selection', () => {
      render(<Button>No Select</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('select-none');
    });

    it('sets aria-disabled correctly', () => {
      const { rerender } = render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'false');

      rerender(<Button disabled>Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('sets aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('does not have aria-busy when not loading', () => {
      render(<Button>Not Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('Text Truncation', () => {
    it('applies truncate class to children', () => {
      const { container } = render(<Button>Long text that might overflow</Button>);
      const textSpan = container.querySelector('.truncate');
      expect(textSpan).toBeInTheDocument();
    });

    it('handles long text gracefully', () => {
      const longText = 'This is a very long button text that should be truncated properly';
      render(<Button>{longText}</Button>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe('Button Combinations', () => {
    it('works with variant and size together', () => {
      render(
        <Button variant="secondary" size="lg">
          Large Secondary
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-bg-secondary');
      expect(button.className).toContain('h-12');
    });

    it('works with all props together', () => {
      const handleClick = jest.fn();
      render(
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleClick}
          leftIcon={<svg data-testid="icon" />}
          className="custom"
        >
          Complete Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('bg-primary');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('w-full');
      expect(button).toHaveClass('custom');
      expect(screen.getByTestId('icon')).toBeInTheDocument();

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it('disabled overrides loading', () => {
      render(
        <Button disabled loading>
          Disabled Loading
        </Button>
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      render(<Button>{null}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      render(<Button>{undefined}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles empty string children', () => {
      render(<Button>{''}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles number as children', () => {
      render(<Button>{42}</Button>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles boolean children gracefully', () => {
      render(<Button>{true}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles conditional rendering', () => {
      const showIcon = true;
      render(
        <Button leftIcon={showIcon && <svg data-testid="icon" />}>
          Conditional Icon
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('works without onClick handler', () => {
      render(<Button>No Handler</Button>);
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<Button name="submit-button">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('name', 'submit-button');
    });

    it('supports title attribute', () => {
      render(<Button title="Click to submit">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Click to submit');
    });

    it('supports data attributes', () => {
      render(<Button data-testid="custom-test-id">Button</Button>);
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
    });

    it('supports aria-describedby', () => {
      render(<Button aria-describedby="description">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-describedby',
        'description'
      );
    });

    it('supports form attribute', () => {
      render(<Button form="my-form">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('form', 'my-form');
    });

    it('supports autoFocus', () => {
      render(<Button autoFocus>Auto Focus</Button>);
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('supports tabIndex', () => {
      render(<Button tabIndex={-1}>No Tab</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestButton = () => {
        renderSpy();
        return <Button>Test</Button>;
      };

      const { rerender } = render(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles rapid clicks', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);

      const button = screen.getByRole('button');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      expect(handleClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('CSS Classes', () => {
    it('has inline-flex class', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('inline-flex');
    });

    it('has items-center class', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('items-center');
    });

    it('has justify-center class', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('justify-center');
    });

    it('has gap-2 class', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('gap-2');
    });

    it('has font-medium class', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('font-medium');
    });

    it('has transition classes', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('transition-all');
      expect(button.className).toContain('duration-200');
    });
  });
});

describe('ButtonGroup Component', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <ButtonGroup>
          <Button>One</Button>
          <Button>Two</Button>
        </ButtonGroup>
      );
      expect(container.querySelector('[role="group"]')).toBeInTheDocument();
    });

    it('renders children buttons', () => {
      render(
        <ButtonGroup>
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </ButtonGroup>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('has correct display name', () => {
      expect(ButtonGroup.displayName).toBe('ButtonGroup');
    });

    it('has role="group"', () => {
      const { container } = render(
        <ButtonGroup>
          <Button>Button</Button>
        </ButtonGroup>
      );
      expect(container.querySelector('[role="group"]')).toBeInTheDocument();
    });
  });

  describe('Orientation', () => {
    it('renders horizontal by default', () => {
      const { container } = render(
        <ButtonGroup>
          <Button>One</Button>
          <Button>Two</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group.className).toContain('flex-row');
    });

    it('renders vertical orientation', () => {
      const { container } = render(
        <ButtonGroup orientation="vertical">
          <Button>One</Button>
          <Button>Two</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group.className).toContain('flex-col');
    });

    it('applies inline-flex class', () => {
      const { container } = render(
        <ButtonGroup>
          <Button>One</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group.className).toContain('inline-flex');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ButtonGroup className="custom-group">
          <Button>Button</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group).toHaveClass('custom-group');
    });

    it('merges custom className with default classes', () => {
      const { container } = render(
        <ButtonGroup className="custom">
          <Button>Button</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group).toHaveClass('custom');
      expect(group.className).toContain('inline-flex');
    });
  });

  describe('Button Interactions in Group', () => {
    it('all buttons are clickable', () => {
      const handleClick1 = jest.fn();
      const handleClick2 = jest.fn();
      const handleClick3 = jest.fn();

      render(
        <ButtonGroup>
          <Button onClick={handleClick1}>First</Button>
          <Button onClick={handleClick2}>Second</Button>
          <Button onClick={handleClick3}>Third</Button>
        </ButtonGroup>
      );

      fireEvent.click(screen.getByText('First'));
      fireEvent.click(screen.getByText('Second'));
      fireEvent.click(screen.getByText('Third'));

      expect(handleClick1).toHaveBeenCalledTimes(1);
      expect(handleClick2).toHaveBeenCalledTimes(1);
      expect(handleClick3).toHaveBeenCalledTimes(1);
    });

    it('supports disabled buttons in group', () => {
      const handleClick = jest.fn();
      render(
        <ButtonGroup>
          <Button onClick={handleClick}>Enabled</Button>
          <Button onClick={handleClick} disabled>
            Disabled
          </Button>
        </ButtonGroup>
      );

      fireEvent.click(screen.getByText('Disabled'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      const { container } = render(
        <ButtonGroup>
          <Button>One</Button>
        </ButtonGroup>
      );
      expect(container.querySelector('[role="group"]')).toBeInTheDocument();
    });

    it('supports custom ARIA attributes', () => {
      const { container } = render(
        <ButtonGroup aria-label="Button group">
          <Button>One</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group).toHaveAttribute('aria-label', 'Button group');
    });
  });
});

describe('IconButton Component', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(
        <IconButton aria-label="Close">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders icon children', () => {
      render(
        <IconButton aria-label="Delete">
          <svg data-testid="delete-icon" />
        </IconButton>
      );
      expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
    });

    it('has correct display name', () => {
      expect(IconButton.displayName).toBe('IconButton');
    });
  });

  describe('Accessibility', () => {
    it('requires aria-label', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      render(
        <IconButton>
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'IconButton: aria-label or tooltip is required for accessibility'
      );
      consoleSpy.mockRestore();
    });

    it('accepts aria-label', () => {
      render(
        <IconButton aria-label="Close dialog">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('accepts tooltip instead of aria-label', () => {
      render(
        <IconButton tooltip="Close dialog">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('prefers aria-label over tooltip', () => {
      render(
        <IconButton aria-label="Aria Label" tooltip="Tooltip Text">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Aria Label');
    });

    it('does not warn when aria-label is provided', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      render(
        <IconButton aria-label="Close">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('does not warn when tooltip is provided', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      render(
        <IconButton tooltip="Close">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Size Handling', () => {
    it('converts md to icon-md', () => {
      render(
        <IconButton aria-label="Icon" size="md">
          <svg data-testid="icon" />
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('w-10');
    });

    it('converts sm to icon-sm', () => {
      render(
        <IconButton aria-label="Icon" size="sm">
          <svg data-testid="icon" />
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
      expect(button.className).toContain('w-8');
    });

    it('converts lg to icon-lg', () => {
      render(
        <IconButton aria-label="Icon" size="lg">
          <svg data-testid="icon" />
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('w-12');
    });

    it('preserves icon sizes as-is', () => {
      render(
        <IconButton aria-label="Icon" size="icon">
          <svg data-testid="icon" />
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
    });

    it('uses md size by default', () => {
      render(
        <IconButton aria-label="Icon">
          <svg data-testid="icon" />
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('w-10');
    });
  });

  describe('Tooltip', () => {
    it('sets title attribute from tooltip', () => {
      render(
        <IconButton tooltip="Close dialog">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Close dialog');
    });

    it('does not set title when no tooltip', () => {
      render(
        <IconButton aria-label="Close">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByRole('button')).not.toHaveAttribute('title');
    });
  });

  describe('Interactions', () => {
    it('handles click events', () => {
      const handleClick = jest.fn();
      render(
        <IconButton aria-label="Click me" onClick={handleClick}>
          <svg data-testid="icon" />
        </IconButton>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      const handleClick = jest.fn();
      render(
        <IconButton aria-label="Disabled" onClick={handleClick} disabled>
          <svg data-testid="icon" />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports loading state', () => {
      render(
        <IconButton aria-label="Loading" loading>
          <svg data-testid="icon" />
        </IconButton>
      );

      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Variants', () => {
    it('supports all button variants', () => {
      const { rerender } = render(
        <IconButton aria-label="Icon" variant="primary">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByRole('button').className).toContain('bg-primary');

      rerender(
        <IconButton aria-label="Icon" variant="danger">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByRole('button').className).toContain('bg-error');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <IconButton ref={ref} aria-label="Icon">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('can focus via ref', () => {
      const ref = React.createRef();
      render(
        <IconButton ref={ref} aria-label="Icon">
          <svg data-testid="icon" />
        </IconButton>
      );
      ref.current.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('passes through custom props to Button', () => {
      render(
        <IconButton aria-label="Custom" data-testid="custom-icon-button">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByTestId('custom-icon-button')).toBeInTheDocument();
    });

    it('supports custom className', () => {
      render(
        <IconButton aria-label="Custom" className="custom-class">
          <svg data-testid="icon" />
        </IconButton>
      );
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });
});

describe('Integration Tests', () => {
  describe('Form Integration', () => {
    it('works in a form with submit', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('works in a form with reset', () => {
      render(
        <form>
          <input type="text" defaultValue="test" />
          <Button type="reset">Reset</Button>
        </form>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('Multiple Buttons', () => {
    it('handles multiple buttons independently', () => {
      const handleClick1 = jest.fn();
      const handleClick2 = jest.fn();

      render(
        <>
          <Button onClick={handleClick1}>Button 1</Button>
          <Button onClick={handleClick2}>Button 2</Button>
        </>
      );

      fireEvent.click(screen.getByText('Button 1'));
      expect(handleClick1).toHaveBeenCalledTimes(1);
      expect(handleClick2).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText('Button 2'));
      expect(handleClick2).toHaveBeenCalledTimes(1);
      expect(handleClick1).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Composition', () => {
    it('works with ButtonGroup and multiple buttons', () => {
      const handleClick = jest.fn();
      render(
        <ButtonGroup>
          <Button onClick={handleClick}>One</Button>
          <Button onClick={handleClick}>Two</Button>
          <Button onClick={handleClick}>Three</Button>
        </ButtonGroup>
      );

      fireEvent.click(screen.getByText('One'));
      fireEvent.click(screen.getByText('Two'));
      fireEvent.click(screen.getByText('Three'));

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('works with mixed button types', () => {
      render(
        <>
          <Button variant="primary">Regular</Button>
          <IconButton aria-label="Icon button">
            <svg data-testid="icon" />
          </IconButton>
        </>
      );

      expect(screen.getByText('Regular')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });
});

export default button
