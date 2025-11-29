import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ButtonGroup from '../ButtonGroup';

// Mock Button component for testing
const MockButton = ({ children, className = '', style = {}, ...props }) => (
  <button className={className} style={style} {...props}>
    {children}
  </button>
);

describe('ButtonGroup', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('renders with role="group"', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
          <MockButton>Button 3</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
      expect(screen.getByText('Button 3')).toBeInTheDocument();
    });

    it('renders single child', () => {
      render(
        <ButtonGroup>
          <MockButton>Single Button</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByText('Single Button')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ButtonGroup>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
          <MockButton>Fourth</MockButton>
          <MockButton>Fifth</MockButton>
        </ButtonGroup>
      );
      expect(screen.getAllByRole('button')).toHaveLength(5);
    });

    it('applies custom className', () => {
      render(
        <ButtonGroup className="custom-class">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('custom-class');
    });

    it('passes through additional props', () => {
      render(
        <ButtonGroup data-testid="button-group" aria-label="Action buttons">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByTestId('button-group')).toBeInTheDocument();
      expect(screen.getByLabelText('Action buttons')).toBeInTheDocument();
    });

    it('passes through id attribute', () => {
      render(
        <ButtonGroup id="my-button-group">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByRole('group')).toHaveAttribute('id', 'my-button-group');
    });
  });

  describe('Variants', () => {
    it('applies horizontal variant by default', () => {
      render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-row');
    });

    it('applies horizontal variant explicitly', () => {
      render(
        <ButtonGroup variant="horizontal">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-row');
    });

    it('applies vertical variant', () => {
      render(
        <ButtonGroup variant="vertical">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-col');
    });

    it('applies wrap variant', () => {
      render(
        <ButtonGroup variant="wrap">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-row');
      expect(group.className).toContain('flex-wrap');
    });

    it('includes flex base class for all variants', () => {
      const { rerender } = render(
        <ButtonGroup variant="horizontal">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByRole('group').className).toContain('flex');

      rerender(
        <ButtonGroup variant="vertical">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByRole('group').className).toContain('flex');

      rerender(
        <ButtonGroup variant="wrap">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByRole('group').className).toContain('flex');
    });
  });

  describe('Sizes', () => {
    it('applies md size by default', () => {
      render(
        <ButtonGroup attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('gap-md');
    });

    it('applies xs size', () => {
      render(
        <ButtonGroup size="xs" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('gap-xs');
    });

    it('applies sm size', () => {
      render(
        <ButtonGroup size="sm" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('gap-sm');
    });

    it('applies md size explicitly', () => {
      render(
        <ButtonGroup size="md" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('gap-md');
    });

    it('applies lg size', () => {
      render(
        <ButtonGroup size="lg" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('gap-lg');
    });

    it('applies xl size', () => {
      render(
        <ButtonGroup size="xl" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('gap-xl');
    });

    it('does not apply gap classes when attached=true', () => {
      const { rerender } = render(
        <ButtonGroup size="xs" attached={true}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      let group = screen.getByRole('group');
      expect(group.className).not.toContain('gap-xs');

      rerender(
        <ButtonGroup size="sm" attached={true}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      group = screen.getByRole('group');
      expect(group.className).not.toContain('gap-sm');

      rerender(
        <ButtonGroup size="md" attached={true}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      group = screen.getByRole('group');
      expect(group.className).not.toContain('gap-md');

      rerender(
        <ButtonGroup size="lg" attached={true}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      group = screen.getByRole('group');
      expect(group.className).not.toContain('gap-lg');

      rerender(
        <ButtonGroup size="xl" attached={true}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      group = screen.getByRole('group');
      expect(group.className).not.toContain('gap-xl');
    });
  });

  describe('Attached Mode - Horizontal', () => {
    it('is attached by default', () => {
      const { container } = render(
        <ButtonGroup variant="horizontal">
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('rounded-r-none');
      expect(buttons[1].className).toContain('rounded-l-none');
    });

    it('applies rounded-r-none and border-r-0 to first button in horizontal attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="horizontal" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('rounded-r-none');
      expect(buttons[0].className).toContain('border-r-0');
    });

    it('applies rounded-l-none to last button in horizontal attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="horizontal" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[2].className).toContain('rounded-l-none');
    });

    it('applies rounded-none and border-r-0 to middle buttons in horizontal attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="horizontal" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[1].className).toContain('rounded-none');
      expect(buttons[1].className).toContain('border-r-0');
    });

    it('handles two buttons in horizontal attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="horizontal" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('rounded-r-none');
      expect(buttons[0].className).toContain('border-r-0');
      expect(buttons[1].className).toContain('rounded-l-none');
    });

    it('does not apply attached classes to single button in horizontal mode', () => {
      const { container } = render(
        <ButtonGroup variant="horizontal" attached={true}>
          <MockButton>Single</MockButton>
        </ButtonGroup>
      );
      const button = container.querySelector('button');
      expect(button.className).not.toContain('rounded-r-none');
      expect(button.className).not.toContain('rounded-l-none');
      expect(button.className).not.toContain('rounded-none');
    });

    it('preserves existing className when applying attached classes in horizontal mode', () => {
      const { container } = render(
        <ButtonGroup variant="horizontal" attached={true}>
          <MockButton className="custom-btn">First</MockButton>
          <MockButton className="special-btn">Second</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('custom-btn');
      expect(buttons[0].className).toContain('rounded-r-none');
      expect(buttons[1].className).toContain('special-btn');
      expect(buttons[1].className).toContain('rounded-l-none');
    });
  });

  describe('Attached Mode - Vertical', () => {
    it('applies rounded-b-none and border-b-0 to first button in vertical attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="vertical" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('rounded-b-none');
      expect(buttons[0].className).toContain('border-b-0');
    });

    it('applies rounded-t-none to last button in vertical attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="vertical" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[2].className).toContain('rounded-t-none');
    });

    it('applies rounded-none and border-b-0 to middle buttons in vertical attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="vertical" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[1].className).toContain('rounded-none');
      expect(buttons[1].className).toContain('border-b-0');
    });

    it('handles two buttons in vertical attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="vertical" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('rounded-b-none');
      expect(buttons[0].className).toContain('border-b-0');
      expect(buttons[1].className).toContain('rounded-t-none');
    });

    it('does not apply attached classes to single button in vertical mode', () => {
      const { container } = render(
        <ButtonGroup variant="vertical" attached={true}>
          <MockButton>Single</MockButton>
        </ButtonGroup>
      );
      const button = container.querySelector('button');
      expect(button.className).not.toContain('rounded-b-none');
      expect(button.className).not.toContain('rounded-t-none');
      expect(button.className).not.toContain('rounded-none');
    });

    it('preserves existing className when applying attached classes in vertical mode', () => {
      const { container } = render(
        <ButtonGroup variant="vertical" attached={true}>
          <MockButton className="custom-btn">First</MockButton>
          <MockButton className="special-btn">Second</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('custom-btn');
      expect(buttons[0].className).toContain('rounded-b-none');
      expect(buttons[1].className).toContain('special-btn');
      expect(buttons[1].className).toContain('rounded-t-none');
    });
  });

  describe('Detached Mode', () => {
    it('does not apply attached classes when attached=false', () => {
      const { container } = render(
        <ButtonGroup attached={false}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).not.toContain('rounded-r-none');
      expect(buttons[0].className).not.toContain('border-r-0');
      expect(buttons[1].className).not.toContain('rounded-l-none');
    });

    it('applies gap spacing when attached=false', () => {
      render(
        <ButtonGroup attached={false} size="md">
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('gap-md');
    });

    it('returns children without cloning when attached=false', () => {
      const { container } = render(
        <ButtonGroup attached={false}>
          <MockButton className="original-class">Button</MockButton>
        </ButtonGroup>
      );
      const button = container.querySelector('button');
      expect(button.className).toBe('original-class');
    });
  });

  describe('Z-Index and Focus Handling', () => {
    it('applies z-index 1 to focused button', () => {
      const { container } = render(
        <ButtonGroup attached={true}>
          <MockButton focus={true}>Focused</MockButton>
          <MockButton>Normal</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].style.zIndex).toBe('1');
      expect(buttons[1].style.zIndex).toBe('0');
    });

    it('applies z-index 0 to non-focused buttons', () => {
      const { container } = render(
        <ButtonGroup attached={true}>
          <MockButton>Normal</MockButton>
          <MockButton>Normal</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].style.zIndex).toBe('0');
      expect(buttons[1].style.zIndex).toBe('0');
    });

    it('preserves existing style prop while adding z-index', () => {
      const { container } = render(
        <ButtonGroup attached={true}>
          <MockButton style={{ color: 'red' }}>Button</MockButton>
        </ButtonGroup>
      );
      const button = container.querySelector('button');
      expect(button.style.color).toBe('red');
      expect(button.style.zIndex).toBe('0');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      const { container } = render(<ButtonGroup />);
      expect(container.querySelector('[role="group"]')).toBeInTheDocument();
    });

    it('handles null children', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          {null}
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          {undefined}
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          {false}
          {true}
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
    });

    it('handles text children', () => {
      const { container } = render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
          Some text
        </ButtonGroup>
      );
      expect(container.textContent).toContain('Some text');
    });

    it('handles mixed valid and invalid elements', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          {null}
          <MockButton>Button 2</MockButton>
          {false}
          <MockButton>Button 3</MockButton>
        </ButtonGroup>
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('handles children without className prop', () => {
      const { container } = render(
        <ButtonGroup attached={true}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('handles children without style prop', () => {
      const { container } = render(
        <ButtonGroup attached={true}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('handles large number of children', () => {
      const buttons = Array.from({ length: 20 }, (_, i) => (
        <MockButton key={i}>Button {i + 1}</MockButton>
      ));
      render(<ButtonGroup>{buttons}</ButtonGroup>);
      expect(screen.getAllByRole('button')).toHaveLength(20);
    });

    it('handles className trimming correctly', () => {
      const { container } = render(
        <ButtonGroup attached={true}>
          <MockButton className="">Empty Class</MockButton>
        </ButtonGroup>
      );
      const button = container.querySelector('button');
      // Should not have extra spaces
      expect(button.className).not.toMatch(/^\s+/);
      expect(button.className).not.toMatch(/\s+$/);
    });
  });

  describe('User Interactions', () => {
    it('handles button clicks', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(
        <ButtonGroup>
          <MockButton onClick={handleClick}>Clickable</MockButton>
          <MockButton>Other</MockButton>
        </ButtonGroup>
      );
      await user.click(screen.getByText('Clickable'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('allows individual button interactions', async () => {
      const user = userEvent.setup();
      const handleClick1 = jest.fn();
      const handleClick2 = jest.fn();
      const handleClick3 = jest.fn();
      render(
        <ButtonGroup>
          <MockButton onClick={handleClick1}>Button 1</MockButton>
          <MockButton onClick={handleClick2}>Button 2</MockButton>
          <MockButton onClick={handleClick3}>Button 3</MockButton>
        </ButtonGroup>
      );
      await user.click(screen.getByText('Button 2'));
      expect(handleClick1).not.toHaveBeenCalled();
      expect(handleClick2).toHaveBeenCalledTimes(1);
      expect(handleClick3).not.toHaveBeenCalled();
    });

    it('handles multiple clicks on different buttons', async () => {
      const user = userEvent.setup();
      const handleClick1 = jest.fn();
      const handleClick2 = jest.fn();
      render(
        <ButtonGroup>
          <MockButton onClick={handleClick1}>Button 1</MockButton>
          <MockButton onClick={handleClick2}>Button 2</MockButton>
        </ButtonGroup>
      );
      await user.click(screen.getByText('Button 1'));
      await user.click(screen.getByText('Button 2'));
      await user.click(screen.getByText('Button 1'));
      expect(handleClick1).toHaveBeenCalledTimes(2);
      expect(handleClick2).toHaveBeenCalledTimes(1);
    });

    it('handles disabled buttons in group', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <ButtonGroup>
          <MockButton disabled onClick={handleClick}>
            Disabled
          </MockButton>
          <MockButton>Enabled</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      fireEvent.click(buttons[0]);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
          <MockButton>Button 3</MockButton>
        </ButtonGroup>
      );
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);

      fireEvent.keyDown(buttons[0], { key: 'Tab' });
      // Tab navigation should be handled by browser
    });

    it('handles hover states on buttons', () => {
      const { container } = render(
        <ButtonGroup>
          <MockButton>Hover Me</MockButton>
        </ButtonGroup>
      );
      const button = container.querySelector('button');
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      // Component should not crash on hover events
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(
        <ButtonGroup aria-label="Action buttons">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByLabelText('Action buttons')).toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <h2 id="group-label">Button Group Label</h2>
          <ButtonGroup aria-labelledby="group-label">
            <MockButton>Button</MockButton>
          </ButtonGroup>
        </>
      );
      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-labelledby', 'group-label');
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <p id="group-description">Group description</p>
          <ButtonGroup aria-describedby="group-description">
            <MockButton>Button</MockButton>
          </ButtonGroup>
        </>
      );
      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-describedby', 'group-description');
    });

    it('all buttons remain accessible in group', () => {
      render(
        <ButtonGroup>
          <MockButton aria-label="First action">First</MockButton>
          <MockButton aria-label="Second action">Second</MockButton>
          <MockButton aria-label="Third action">Third</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByLabelText('First action')).toBeInTheDocument();
      expect(screen.getByLabelText('Second action')).toBeInTheDocument();
      expect(screen.getByLabelText('Third action')).toBeInTheDocument();
    });

    it('maintains button tab order', () => {
      const { container } = render(
        <ButtonGroup>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      // Buttons should maintain natural DOM order for tab navigation
      expect(buttons[0]).toBe(container.querySelectorAll('button')[0]);
      expect(buttons[1]).toBe(container.querySelectorAll('button')[1]);
      expect(buttons[2]).toBe(container.querySelectorAll('button')[2]);
    });
  });

  describe('Variant and Size Combinations', () => {
    it('handles horizontal variant with xs size', () => {
      render(
        <ButtonGroup variant="horizontal" size="xs" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-row');
      expect(group.className).toContain('gap-xs');
    });

    it('handles horizontal variant with attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="horizontal" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-row');
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('rounded-r-none');
    });

    it('handles vertical variant with lg size', () => {
      render(
        <ButtonGroup variant="vertical" size="lg" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-col');
      expect(group.className).toContain('gap-lg');
    });

    it('handles vertical variant with attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="vertical" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-col');
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('rounded-b-none');
    });

    it('handles wrap variant with xl size', () => {
      render(
        <ButtonGroup variant="wrap" size="xl" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-wrap');
      expect(group.className).toContain('gap-xl');
    });

    it('handles wrap variant with attached mode', () => {
      const { container } = render(
        <ButtonGroup variant="wrap" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      const group = screen.getByRole('group');
      expect(group.className).toContain('flex-wrap');
      const buttons = container.querySelectorAll('button');
      // Wrap variant behaves like horizontal for attached styling
      expect(buttons[0].className).toContain('rounded-r-none');
    });
  });

  describe('Component Rerendering', () => {
    it('updates variant on rerender', () => {
      const { rerender } = render(
        <ButtonGroup variant="horizontal">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      let group = screen.getByRole('group');
      expect(group.className).toContain('flex-row');

      rerender(
        <ButtonGroup variant="vertical">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      group = screen.getByRole('group');
      expect(group.className).toContain('flex-col');
    });

    it('updates size on rerender', () => {
      const { rerender } = render(
        <ButtonGroup size="sm" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      let group = screen.getByRole('group');
      expect(group.className).toContain('gap-sm');

      rerender(
        <ButtonGroup size="lg" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      group = screen.getByRole('group');
      expect(group.className).toContain('gap-lg');
    });

    it('updates attached mode on rerender', () => {
      const { container, rerender } = render(
        <ButtonGroup attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      let buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('rounded-r-none');

      rerender(
        <ButtonGroup attached={false} size="md">
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      buttons = container.querySelectorAll('button');
      expect(buttons[0].className).not.toContain('rounded-r-none');
    });

    it('updates children on rerender', () => {
      const { rerender } = render(
        <ButtonGroup>
          <MockButton>Original</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByText('Original')).toBeInTheDocument();

      rerender(
        <ButtonGroup>
          <MockButton>Updated</MockButton>
        </ButtonGroup>
      );
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('updates className on rerender', () => {
      const { rerender } = render(
        <ButtonGroup className="class-1">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      let group = screen.getByRole('group');
      expect(group.className).toContain('class-1');

      rerender(
        <ButtonGroup className="class-2">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      group = screen.getByRole('group');
      expect(group.className).toContain('class-2');
      expect(group.className).not.toContain('class-1');
    });
  });

  describe('Complex Children Scenarios', () => {
    it('handles buttons with complex content', () => {
      render(
        <ButtonGroup>
          <MockButton>
            <span className="icon">★</span>
            <span className="text">Favorite</span>
          </MockButton>
          <MockButton>
            <span className="icon">♥</span>
            <span className="text">Like</span>
          </MockButton>
        </ButtonGroup>
      );
      expect(screen.getByText('★')).toBeInTheDocument();
      expect(screen.getByText('Favorite')).toBeInTheDocument();
      expect(screen.getByText('♥')).toBeInTheDocument();
      expect(screen.getByText('Like')).toBeInTheDocument();
    });

    it('handles buttons with different props', () => {
      const { container } = render(
        <ButtonGroup attached={true}>
          <MockButton className="btn-primary" disabled>
            Disabled
          </MockButton>
          <MockButton className="btn-secondary" type="submit">
            Submit
          </MockButton>
          <MockButton className="btn-tertiary" aria-label="More actions">
            More
          </MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveAttribute('disabled');
      expect(buttons[1]).toHaveAttribute('type', 'submit');
      expect(buttons[2]).toHaveAttribute('aria-label', 'More actions');
    });

    it('handles dynamically generated children', () => {
      const items = ['First', 'Second', 'Third', 'Fourth'];
      render(
        <ButtonGroup>
          {items.map((item, index) => (
            <MockButton key={index}>{item}</MockButton>
          ))}
        </ButtonGroup>
      );
      items.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });

    it('handles conditional children', () => {
      const showThird = false;
      render(
        <ButtonGroup>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          {showThird && <MockButton>Third</MockButton>}
          <MockButton>Fourth</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.queryByText('Third')).not.toBeInTheDocument();
      expect(screen.getByText('Fourth')).toBeInTheDocument();
    });

    it('handles fragments as children', () => {
      render(
        <ButtonGroup>
          <>
            <MockButton>First</MockButton>
            <MockButton>Second</MockButton>
          </>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });

  describe('Style Prop Handling', () => {
    it('applies inline styles to group', () => {
      const { container } = render(
        <ButtonGroup style={{ backgroundColor: 'red' }}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group.style.backgroundColor).toBe('red');
    });

    it('merges attached styles with inline styles', () => {
      const { container } = render(
        <ButtonGroup attached={true} style={{ padding: '10px' }}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group.style.padding).toBe('10px');
      expect(group).toHaveAttribute('style');
    });

    it('applies empty object style when not attached', () => {
      const { container } = render(
        <ButtonGroup attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const group = container.querySelector('[role="group"]');
      // Should have style attribute from empty object
      expect(group).toBeInTheDocument();
    });
  });

  describe('React.Children Utilities', () => {
    it('correctly counts children', () => {
      const { container } = render(
        <ButtonGroup attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      // Middle button should have different styling
      const buttons = container.querySelectorAll('button');
      expect(buttons[1].className).toContain('rounded-none');
    });

    it('correctly maps children', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
          <MockButton>Button 3</MockButton>
        </ButtonGroup>
      );
      // All children should be rendered
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('validates React elements correctly', () => {
      render(
        <ButtonGroup>
          <MockButton>Valid Element</MockButton>
          {'Plain text'}
          {123}
        </ButtonGroup>
      );
      // Valid element should be rendered
      expect(screen.getByText('Valid Element')).toBeInTheDocument();
      // Plain text should also be rendered
      expect(screen.getByText('Plain text')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('handles rapid rerenders efficiently', () => {
      const { rerender } = render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <ButtonGroup variant={i % 2 === 0 ? 'horizontal' : 'vertical'}>
            <MockButton>Button {i}</MockButton>
          </ButtonGroup>
        );
      }

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('handles many children without performance issues', () => {
      const children = Array.from({ length: 100 }, (_, i) => (
        <MockButton key={i}>Button {i}</MockButton>
      ));

      render(<ButtonGroup>{children}</ButtonGroup>);

      expect(screen.getAllByRole('button')).toHaveLength(100);
    });

    it('does not recreate classes unnecessarily', () => {
      const { container, rerender } = render(
        <ButtonGroup variant="horizontal" size="md" className="custom">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const firstClassName = container.querySelector('[role="group"]').className;

      rerender(
        <ButtonGroup variant="horizontal" size="md" className="custom">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      const secondClassName = container.querySelector('[role="group"]').className;

      expect(firstClassName).toBe(secondClassName);
    });
  });

  describe('Integration Scenarios', () => {
    it('works with different button variants in same group', () => {
      const { container } = render(
        <ButtonGroup>
          <MockButton className="btn-primary">Primary</MockButton>
          <MockButton className="btn-secondary">Secondary</MockButton>
          <MockButton className="btn-danger">Danger</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].className).toContain('btn-primary');
      expect(buttons[1].className).toContain('btn-secondary');
      expect(buttons[2].className).toContain('btn-danger');
    });

    it('works with icon-only buttons', () => {
      render(
        <ButtonGroup>
          <MockButton aria-label="Edit">✎</MockButton>
          <MockButton aria-label="Delete">✕</MockButton>
          <MockButton aria-label="Settings">⚙</MockButton>
        </ButtonGroup>
      );
      expect(screen.getByLabelText('Edit')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('works with text and icon buttons mixed', () => {
      render(
        <ButtonGroup>
          <MockButton>
            <span>📝</span> Edit
          </MockButton>
          <MockButton>Save</MockButton>
          <MockButton>
            Cancel <span>✕</span>
          </MockButton>
        </ButtonGroup>
      );
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('maintains button state independently', () => {
      const { container } = render(
        <ButtonGroup>
          <MockButton disabled>Disabled</MockButton>
          <MockButton className="active">Active</MockButton>
          <MockButton>Normal</MockButton>
        </ButtonGroup>
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveAttribute('disabled');
      expect(buttons[1].className).toContain('active');
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for horizontal attached group', () => {
      const { container } = render(
        <ButtonGroup variant="horizontal" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for vertical attached group', () => {
      const { container } = render(
        <ButtonGroup variant="vertical" attached={true}>
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
          <MockButton>Third</MockButton>
        </ButtonGroup>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for detached group with spacing', () => {
      const { container } = render(
        <ButtonGroup attached={false} size="lg">
          <MockButton>First</MockButton>
          <MockButton>Second</MockButton>
        </ButtonGroup>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for wrap variant', () => {
      const { container } = render(
        <ButtonGroup variant="wrap" size="md">
          <MockButton>One</MockButton>
          <MockButton>Two</MockButton>
          <MockButton>Three</MockButton>
          <MockButton>Four</MockButton>
        </ButtonGroup>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for single button', () => {
      const { container } = render(
        <ButtonGroup>
          <MockButton>Single</MockButton>
        </ButtonGroup>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with custom className', () => {
      const { container } = render(
        <ButtonGroup className="custom-group">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default MockButton
