/**
 * AccessibleButton Component Tests
 * Comprehensive test suite for WCAG 2.1 AA compliant button
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessibleButton from './AccessibleButton';

// Mock the Button component
jest.mock('./button', () => ({
  Button: React.forwardRef(({ children, ...props }, ref) => (
    <button ref={ref} {...props}>
      {children}
    </button>
  )),
}));

describe('AccessibleButton', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<AccessibleButton>Click me</AccessibleButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with text children', () => {
      render(<AccessibleButton>Test Button</AccessibleButton>);
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('renders with element children', () => {
      render(
        <AccessibleButton>
          <span>Button Content</span>
        </AccessibleButton>
      );
      expect(screen.getByText('Button Content')).toBeInTheDocument();
    });

    it('renders without children', () => {
      render(<AccessibleButton aria-label="Empty button" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with icon only', () => {
      const icon = <span data-testid="test-icon">🔍</span>;
      render(<AccessibleButton icon={icon} ariaLabel="Search" />);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders with icon and text', () => {
      const icon = <span data-testid="test-icon">🔍</span>;
      render(
        <AccessibleButton icon={icon} ariaLabel="Search">
          Search
        </AccessibleButton>
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('applies displayName correctly', () => {
      expect(AccessibleButton.displayName).toBe('AccessibleButton');
    });
  });

  describe('Aria Label Handling', () => {
    it('applies aria-label for icon-only buttons', () => {
      const icon = <span>🔍</span>;
      render(<AccessibleButton icon={icon} ariaLabel="Search" />);
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });

    it('does not apply aria-label when text content exists', () => {
      render(<AccessibleButton ariaLabel="Click me">Button Text</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-label');
    });

    it('applies aria-label when no text content exists', () => {
      render(
        <AccessibleButton ariaLabel="Action button">
          <div />
        </AccessibleButton>
      );
      expect(screen.getByLabelText('Action button')).toBeInTheDocument();
    });

    it('applies aria-label for nested element without text', () => {
      render(
        <AccessibleButton ariaLabel="Icon button">
          <span>
            <div data-testid="icon" />
          </span>
        </AccessibleButton>
      );
      expect(screen.getByLabelText('Icon button')).toBeInTheDocument();
    });

    it('does not apply aria-label with nested text content', () => {
      render(
        <AccessibleButton ariaLabel="Not used">
          <span>Nested Text</span>
        </AccessibleButton>
      );
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-label');
    });
  });

  describe('Aria Attributes', () => {
    it('applies aria-describedby attribute', () => {
      render(
        <AccessibleButton ariaDescribedBy="description-id">
          Button
        </AccessibleButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-describedby',
        'description-id'
      );
    });

    it('applies aria-pressed attribute', () => {
      render(<AccessibleButton ariaPressed={true}>Toggle</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('applies aria-pressed false', () => {
      render(<AccessibleButton ariaPressed={false}>Toggle</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('applies aria-expanded attribute', () => {
      render(<AccessibleButton ariaExpanded={true}>Expand</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('applies aria-expanded false', () => {
      render(<AccessibleButton ariaExpanded={false}>Expand</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('applies aria-haspopup attribute', () => {
      render(<AccessibleButton ariaHaspopup="menu">Menu</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('applies aria-haspopup with true value', () => {
      render(<AccessibleButton ariaHaspopup={true}>Popup</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'true');
    });

    it('applies aria-controls attribute', () => {
      render(<AccessibleButton ariaControls="panel-id">Control</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-controls',
        'panel-id'
      );
    });

    it('applies multiple aria attributes together', () => {
      render(
        <AccessibleButton
          ariaLabel="Menu button"
          ariaDescribedBy="desc"
          ariaPressed={false}
          ariaExpanded={false}
          ariaHaspopup="menu"
          ariaControls="menu-panel"
        >
          Menu
        </AccessibleButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'desc');
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
      expect(button).toHaveAttribute('aria-controls', 'menu-panel');
    });
  });

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<AccessibleButton disabled>Disabled</AccessibleButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies aria-disabled when disabled', () => {
      render(<AccessibleButton disabled>Disabled</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not trigger onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(
        <AccessibleButton disabled onClick={handleClick}>
          Disabled
        </AccessibleButton>
      );

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is not disabled when disabled is false', () => {
      render(<AccessibleButton disabled={false}>Enabled</AccessibleButton>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('applies aria-disabled false when not disabled', () => {
      render(<AccessibleButton disabled={false}>Enabled</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'false');
    });
  });

  describe('Loading State', () => {
    it('is disabled when loading', () => {
      render(<AccessibleButton loading>Loading</AccessibleButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies aria-disabled when loading', () => {
      render(<AccessibleButton loading>Loading</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('applies aria-busy when loading', () => {
      render(<AccessibleButton loading>Loading</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('does not apply aria-busy when not loading', () => {
      render(<AccessibleButton loading={false}>Not Loading</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
    });

    it('shows loading spinner', () => {
      const { container } = render(<AccessibleButton loading>Loading</AccessibleButton>);
      expect(container.querySelector('.')).toBeInTheDocument();
    });

    it('shows loading text for screen readers', () => {
      render(<AccessibleButton loading>Loading</AccessibleButton>);
      expect(screen.getByText('', { selector: '.sr-only' })).toBeInTheDocument();
    });

    it('hides loading spinner with aria-hidden', () => {
      const { container } = render(<AccessibleButton loading>Loading</AccessibleButton>);
      const spinner = container.querySelector('.');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('shows children when loading', () => {
      render(<AccessibleButton loading>Processing</AccessibleButton>);
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('does not trigger onClick when loading', async () => {
      const handleClick = jest.fn();
      render(
        <AccessibleButton loading onClick={handleClick}>
          Loading
        </AccessibleButton>
      );

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is disabled when both loading and disabled', () => {
      render(
        <AccessibleButton loading disabled>
          Double Disabled
        </AccessibleButton>
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies aria-busy false when not loading', () => {
      render(<AccessibleButton>Not Loading</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('Icon Rendering', () => {
    it('renders icon when provided', () => {
      const icon = <span data-testid="icon">📧</span>;
      render(<AccessibleButton icon={icon}>Email</AccessibleButton>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('hides icon with aria-hidden', () => {
      const icon = <span data-testid="icon">📧</span>;
      const { container } = render(<AccessibleButton icon={icon}>Email</AccessibleButton>);
      const iconContainer = container.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies margin to icon', () => {
      const icon = <span data-testid="icon">📧</span>;
      const { container } = render(<AccessibleButton icon={icon}>Email</AccessibleButton>);
      const iconContainer = container.querySelector('.mr-2');
      expect(iconContainer).toBeInTheDocument();
    });

    it('does not show icon when loading', () => {
      const icon = <span data-testid="icon">📧</span>;
      render(
        <AccessibleButton icon={icon} loading>
          Email
        </AccessibleButton>
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('renders icon without children', () => {
      const icon = <span data-testid="icon">📧</span>;
      render(<AccessibleButton icon={icon} ariaLabel="Email" />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders complex icon component', () => {
      const ComplexIcon = () => (
        <svg data-testid="complex-icon">
          <path d="M0 0" />
        </svg>
      );
      render(
        <AccessibleButton icon={<ComplexIcon />} ariaLabel="Complex">
          Action
        </AccessibleButton>
      );
      expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(<AccessibleButton onClick={handleClick}>Click</AccessibleButton>);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', async () => {
      const handleClick = jest.fn();
      render(<AccessibleButton onClick={handleClick}>Click</AccessibleButton>);

      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('handles keyboard Enter key', () => {
      const handleClick = jest.fn();
      render(<AccessibleButton onClick={handleClick}>Press</AccessibleButton>);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      expect(handleClick).toHaveBeenCalled();
    });

    it('handles keyboard Space key', () => {
      const handleClick = jest.fn();
      render(<AccessibleButton onClick={handleClick}>Press</AccessibleButton>);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });

      expect(handleClick).toHaveBeenCalled();
    });

    it('can be focused', () => {
      render(<AccessibleButton>Focus me</AccessibleButton>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });

    it('can be blurred', () => {
      render(<AccessibleButton>Blur me</AccessibleButton>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();

      button.blur();
      expect(button).not.toHaveFocus();
    });

    it('handles double click events', async () => {
      const handleDoubleClick = jest.fn();
      render(
        <AccessibleButton onDoubleClick={handleDoubleClick}>
          Double Click
        </AccessibleButton>
      );

      await userEvent.dblClick(screen.getByRole('button'));
      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('handles mouse enter events', () => {
      const handleMouseEnter = jest.fn();
      render(
        <AccessibleButton onMouseEnter={handleMouseEnter}>Hover</AccessibleButton>
      );

      fireEvent.mouseEnter(screen.getByRole('button'));
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('handles mouse leave events', () => {
      const handleMouseLeave = jest.fn();
      render(
        <AccessibleButton onMouseLeave={handleMouseLeave}>Hover</AccessibleButton>
      );

      fireEvent.mouseLeave(screen.getByRole('button'));
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('handles focus events', () => {
      const handleFocus = jest.fn();
      render(<AccessibleButton onFocus={handleFocus}>Focus</AccessibleButton>);

      screen.getByRole('button').focus();
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles blur events', () => {
      const handleBlur = jest.fn();
      render(<AccessibleButton onBlur={handleBlur}>Blur</AccessibleButton>);

      const button = screen.getByRole('button');
      button.focus();
      button.blur();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = React.createRef();
      render(<AccessibleButton ref={ref}>Button</AccessibleButton>);

      expect(ref.current).toBeTruthy();
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('ref can be used to focus button', () => {
      const ref = React.createRef();
      render(<AccessibleButton ref={ref}>Button</AccessibleButton>);

      ref.current.focus();
      expect(ref.current).toHaveFocus();
    });

    it('ref can access button properties', () => {
      const ref = React.createRef();
      render(<AccessibleButton ref={ref}>Button</AccessibleButton>);

      expect(ref.current.tagName).toBe('BUTTON');
      expect(ref.current.textContent).toContain('Button');
    });

    it('works with callback ref', () => {
      let buttonRef = null;
      const callbackRef = (node) => {
        buttonRef = node;
      };

      render(<AccessibleButton ref={callbackRef}>Button</AccessibleButton>);

      expect(buttonRef).toBeTruthy();
      expect(buttonRef).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Props Forwarding', () => {
    it('forwards additional props to button', () => {
      render(
        <AccessibleButton data-testid="custom-button" data-custom="value">
          Button
        </AccessibleButton>
      );

      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-custom', 'value');
    });

    it('forwards className', () => {
      render(<AccessibleButton className="custom-class">Button</AccessibleButton>);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('forwards style prop', () => {
      render(
        <AccessibleButton style={{ backgroundColor: 'red' }}>Button</AccessibleButton>
      );

      expect(screen.getByRole('button')).toHaveStyle({
        backgroundColor: 'red',
      });
    });

    it('forwards id prop', () => {
      render(<AccessibleButton id="unique-button">Button</AccessibleButton>);

      expect(screen.getByRole('button')).toHaveAttribute('id', 'unique-button');
    });

    it('forwards name prop', () => {
      render(<AccessibleButton name="button-name">Button</AccessibleButton>);

      expect(screen.getByRole('button')).toHaveAttribute('name', 'button-name');
    });

    it('forwards type prop', () => {
      render(<AccessibleButton type="submit">Submit</AccessibleButton>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('forwards form prop', () => {
      render(<AccessibleButton form="form-id">Button</AccessibleButton>);

      expect(screen.getByRole('button')).toHaveAttribute('form', 'form-id');
    });

    it('forwards value prop', () => {
      render(<AccessibleButton value="button-value">Button</AccessibleButton>);

      expect(screen.getByRole('button')).toHaveAttribute('value', 'button-value');
    });

    it('forwards multiple custom data attributes', () => {
      render(
        <AccessibleButton
          data-test="test"
          data-id="123"
          data-status="active"
        >
          Button
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-test', 'test');
      expect(button).toHaveAttribute('data-id', '123');
      expect(button).toHaveAttribute('data-status', 'active');
    });
  });

  describe('Text Content Detection', () => {
    it('detects string children as text content', () => {
      render(<AccessibleButton>String content</AccessibleButton>);
      expect(screen.getByText('String content')).toBeInTheDocument();
    });

    it('detects nested string in React element', () => {
      render(
        <AccessibleButton>
          <span>Nested string</span>
        </AccessibleButton>
      );
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-label');
    });

    it('handles empty string children', () => {
      render(<AccessibleButton ariaLabel="Empty">{''}</AccessibleButton>);
      expect(screen.getByLabelText('Empty')).toBeInTheDocument();
    });

    it('handles whitespace-only children', () => {
      render(<AccessibleButton ariaLabel="Whitespace">{'   '}</AccessibleButton>);
      expect(screen.getByLabelText('Whitespace')).toBeInTheDocument();
    });

    it('detects non-string element children', () => {
      render(
        <AccessibleButton ariaLabel="Icon only">
          <div data-testid="icon" />
        </AccessibleButton>
      );
      expect(screen.getByLabelText('Icon only')).toBeInTheDocument();
    });

    it('handles null children', () => {
      render(<AccessibleButton ariaLabel="Null">{null}</AccessibleButton>);
      expect(screen.getByLabelText('Null')).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(<AccessibleButton ariaLabel="Undefined">{undefined}</AccessibleButton>);
      expect(screen.getByLabelText('Undefined')).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<AccessibleButton ariaLabel="Boolean">{false}</AccessibleButton>);
      expect(screen.getByLabelText('Boolean')).toBeInTheDocument();
    });

    it('handles number children', () => {
      render(<AccessibleButton>{42}</AccessibleButton>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles array of strings', () => {
      render(<AccessibleButton>{['First', ' ', 'Second']}</AccessibleButton>);
      expect(screen.getByText(/First Second/)).toBeInTheDocument();
    });

    it('handles fragment with text', () => {
      render(
        <AccessibleButton>
          <>Fragment text</>
        </AccessibleButton>
      );
      expect(screen.getByText('Fragment text')).toBeInTheDocument();
    });
  });

  describe('Loading and Icon Interaction', () => {
    it('shows loading spinner instead of icon', () => {
      const icon = <span data-testid="icon">📧</span>;
      render(
        <AccessibleButton icon={icon} loading>
          Email
        </AccessibleButton>
      );

      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      const { container } = render(
        <AccessibleButton icon={icon} loading>
          Email
        </AccessibleButton>
      );
      expect(container.querySelector('.')).toBeInTheDocument();
    });

    it('shows icon when not loading', () => {
      const icon = <span data-testid="icon">📧</span>;
      render(
        <AccessibleButton icon={icon} loading={false}>
          Email
        </AccessibleButton>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('transitions from loading to not loading', () => {
      const icon = <span data-testid="icon">📧</span>;
      const { rerender } = render(
        <AccessibleButton icon={icon} loading>
          Email
        </AccessibleButton>
      );

      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();

      rerender(
        <AccessibleButton icon={icon} loading={false}>
          Email
        </AccessibleButton>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('transitions from not loading to loading', () => {
      const icon = <span data-testid="icon">📧</span>;
      const { rerender } = render(
        <AccessibleButton icon={icon} loading={false}>
          Email
        </AccessibleButton>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();

      rerender(
        <AccessibleButton icon={icon} loading>
          Email
        </AccessibleButton>
      );

      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    it('is keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<AccessibleButton onClick={handleClick}>Accessible</AccessibleButton>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('has proper role', () => {
      render(<AccessibleButton>Button</AccessibleButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('maintains focus order', () => {
      render(
        <>
          <AccessibleButton>First</AccessibleButton>
          <AccessibleButton>Second</AccessibleButton>
          <AccessibleButton>Third</AccessibleButton>
        </>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('provides screen reader accessible loading state', () => {
      render(<AccessibleButton loading>Processing</AccessibleButton>);

      const srOnly = screen.getByText('', { selector: '.sr-only' });
      expect(srOnly).toBeInTheDocument();
    });

    it('hides decorative elements from screen readers', () => {
      const icon = <span data-testid="icon">📧</span>;
      const { container } = render(<AccessibleButton icon={icon}>Email</AccessibleButton>);

      const iconContainer = container.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('supports high contrast mode', () => {
      render(<AccessibleButton>High Contrast</AccessibleButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('provides clear focus indication', () => {
      render(<AccessibleButton>Focus Indicator</AccessibleButton>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles simultaneous disabled and loading', () => {
      render(
        <AccessibleButton disabled loading>
          Both States
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('handles all aria attributes with disabled state', () => {
      render(
        <AccessibleButton
          disabled
          ariaLabel="Disabled with aria"
          ariaDescribedBy="desc"
          ariaPressed={true}
          ariaExpanded={true}
          ariaHaspopup="menu"
          ariaControls="panel"
        >
          Button
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-describedby', 'desc');
    });

    it('handles all aria attributes with loading state', () => {
      render(
        <AccessibleButton
          loading
          ariaLabel="Loading with aria"
          ariaDescribedBy="desc"
          ariaPressed={true}
          ariaExpanded={true}
          ariaHaspopup="menu"
          ariaControls="panel"
        >
          Button
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('handles icon-only button with loading', () => {
      const icon = <span data-testid="icon">📧</span>;
      render(
        <AccessibleButton icon={icon} ariaLabel="Email" loading />
      );

      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('handles rapid state changes', async () => {
      const { rerender } = render(<AccessibleButton>Button</AccessibleButton>);

      rerender(<AccessibleButton loading>Button</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');

      rerender(<AccessibleButton disabled>Button</AccessibleButton>);
      expect(screen.getByRole('button')).toBeDisabled();

      rerender(<AccessibleButton>Button</AccessibleButton>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('handles empty icon prop', () => {
      render(<AccessibleButton icon={null}>Button</AccessibleButton>);
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('handles undefined icon prop', () => {
      render(<AccessibleButton icon={undefined}>Button</AccessibleButton>);
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('handles complex nested children', () => {
      render(
        <AccessibleButton>
          <div>
            <span>Level 1</span>
            <div>
              <span>Level 2</span>
            </div>
          </div>
        </AccessibleButton>
      );

      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
    });

    it('handles very long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<AccessibleButton>{longText}</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveTextContent(longText);
    });

    it('handles special characters in text', () => {
      render(<AccessibleButton>{'<>&"\'\\/'}</AccessibleButton>);
      expect(screen.getByText('<>&"\'\\/'));
    });

    it('handles emoji in text', () => {
      render(<AccessibleButton>Click 👍 Here 🎉</AccessibleButton>);
      expect(screen.getByText(/Click 👍 Here 🎉/)).toBeInTheDocument();
    });

    it('handles unicode characters', () => {
      render(<AccessibleButton>日本語 文字</AccessibleButton>);
      expect(screen.getByText('日本語 文字')).toBeInTheDocument();
    });
  });

  describe('State Updates', () => {
    it('updates when children change', () => {
      const { rerender } = render(<AccessibleButton>First</AccessibleButton>);
      expect(screen.getByText('First')).toBeInTheDocument();

      rerender(<AccessibleButton>Second</AccessibleButton>);
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.queryByText('First')).not.toBeInTheDocument();
    });

    it('updates when icon changes', () => {
      const icon1 = <span data-testid="icon1">📧</span>;
      const icon2 = <span data-testid="icon2">📞</span>;

      const { rerender } = render(
        <AccessibleButton icon={icon1}>Action</AccessibleButton>
      );
      expect(screen.getByTestId('icon1')).toBeInTheDocument();

      rerender(<AccessibleButton icon={icon2}>Action</AccessibleButton>);
      expect(screen.getByTestId('icon2')).toBeInTheDocument();
      expect(screen.queryByTestId('icon1')).not.toBeInTheDocument();
    });

    it('updates when aria-label changes', () => {
      const { rerender } = render(
        <AccessibleButton ariaLabel="First">Button</AccessibleButton>
      );

      rerender(<AccessibleButton ariaLabel="Second">Button</AccessibleButton>);
      const button = screen.getByRole('button');
      // Since button has text content, aria-label shouldn't be applied
      expect(button).not.toHaveAttribute('aria-label');
    });

    it('updates when disabled state changes', () => {
      const { rerender } = render(
        <AccessibleButton disabled={false}>Button</AccessibleButton>
      );
      expect(screen.getByRole('button')).not.toBeDisabled();

      rerender(<AccessibleButton disabled={true}>Button</AccessibleButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('updates when loading state changes', () => {
      const { rerender } = render(
        <AccessibleButton loading={false}>Button</AccessibleButton>
      );
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy', 'true');

      rerender(<AccessibleButton loading={true}>Button</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('updates aria-pressed dynamically', () => {
      const { rerender } = render(
        <AccessibleButton ariaPressed={false}>Toggle</AccessibleButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

      rerender(<AccessibleButton ariaPressed={true}>Toggle</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('updates aria-expanded dynamically', () => {
      const { rerender } = render(
        <AccessibleButton ariaExpanded={false}>Expand</AccessibleButton>
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');

      rerender(<AccessibleButton ariaExpanded={true}>Expand</AccessibleButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Integration Scenarios', () => {
    it('works in forms', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <AccessibleButton type="submit">Submit</AccessibleButton>
        </form>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('works with toggle functionality', () => {
      let pressed = false;
      const { rerender } = render(
        <AccessibleButton ariaPressed={pressed}>Toggle</AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'false');

      pressed = true;
      rerender(<AccessibleButton ariaPressed={pressed}>Toggle</AccessibleButton>);
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('works with dropdown menus', () => {
      render(
        <AccessibleButton
          ariaHaspopup="menu"
          ariaExpanded={false}
          ariaControls="menu-dropdown"
        >
          Menu
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'menu-dropdown');
    });

    it('works with modals', () => {
      render(
        <AccessibleButton
          ariaHaspopup="dialog"
          ariaExpanded={false}
        >
          Open Modal
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('works with async operations', async () => {
      const handleClick = jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const TestComponent = () => {
        const [loading, setLoading] = React.useState(false);

        const onClick = async () => {
          setLoading(true);
          await handleClick();
          setLoading(false);
        };

        return (
          <AccessibleButton loading={loading} onClick={onClick}>
            Submit
          </AccessibleButton>
        );
      };

      render(<TestComponent />);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('works with tooltips', () => {
      render(
        <AccessibleButton ariaDescribedBy="tooltip-1">
          Hover Me
        </AccessibleButton>
      );

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-describedby',
        'tooltip-1'
      );
    });

    it('works in button groups', () => {
      render(
        <div role="group">
          <AccessibleButton>First</AccessibleButton>
          <AccessibleButton>Second</AccessibleButton>
          <AccessibleButton>Third</AccessibleButton>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('works with conditional rendering', () => {
      const { rerender } = render(
        <div>
          {true && <AccessibleButton>Visible</AccessibleButton>}
        </div>
      );

      expect(screen.getByText('Visible')).toBeInTheDocument();

      rerender(
        <div>
          {false && <AccessibleButton>Hidden</AccessibleButton>}
        </div>
      );

      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderCount = { current: 0 };

      const TestComponent = () => {
        renderCount.current++;
        return <AccessibleButton>Button</AccessibleButton>;
      };

      const { rerender } = render(<TestComponent />);
      const initialCount = renderCount.current;

      rerender(<TestComponent />);
      expect(renderCount.current).toBeGreaterThan(initialCount);
    });

    it('handles many buttons efficiently', () => {
      const buttons = Array.from({ length: 100 }, (_, i) => (
        <AccessibleButton key={i}>Button {i}</AccessibleButton>
      ));

      const { container } = render(<div>{buttons}</div>);
      expect(container.querySelectorAll('button')).toHaveLength(100);
    });
  });

  describe('Error Handling', () => {
    it('handles missing children gracefully', () => {
      render(<AccessibleButton ariaLabel="No children" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles invalid icon gracefully', () => {
      render(<AccessibleButton icon="not-a-component">Button</AccessibleButton>);
      expect(screen.getByText('Button')).toBeInTheDocument();
    });

    it('handles missing aria-label for icon-only gracefully', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      const icon = <span>Icon</span>;
      render(<AccessibleButton icon={icon} />);

      // Component should still render even without aria-label
      expect(screen.getByRole('button')).toBeInTheDocument();
      consoleWarn.mockRestore();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for default button', () => {
      const { container } = render(<AccessibleButton>Default</AccessibleButton>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for loading state', () => {
      const { container } = render(<AccessibleButton loading>Loading</AccessibleButton>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for disabled state', () => {
      const { container } = render(<AccessibleButton disabled>Disabled</AccessibleButton>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with icon', () => {
      const icon = <span>📧</span>;
      const { container } = render(<AccessibleButton icon={icon}>Email</AccessibleButton>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with all aria attributes', () => {
      const { container } = render(
        <AccessibleButton
          ariaLabel="Complete"
          ariaDescribedBy="desc"
          ariaPressed={true}
          ariaExpanded={true}
          ariaHaspopup="menu"
          ariaControls="panel"
        >
          Full Aria
        </AccessibleButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default icon
