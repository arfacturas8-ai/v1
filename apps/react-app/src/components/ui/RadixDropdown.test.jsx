import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './RadixDropdown';

// Mock @radix-ui/react-dropdown-menu
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children, open, onOpenChange, ...props }) => (
    <div data-testid="dropdown-root" data-open={open} {...props}>
      {children}
    </div>
  ),
  Trigger: React.forwardRef(({ children, ...props }, ref) => (
    <button ref={ref} data-testid="dropdown-trigger" {...props}>
      {children}
    </button>
  )),
  Portal: ({ children }) => <div data-testid="dropdown-portal">{children}</div>,
  Content: React.forwardRef(({ children, sideOffset, ...props }, ref) => (
    <div
      ref={ref}
      data-testid="dropdown-content"
      data-side-offset={sideOffset}
      data-state="open"
      {...props}
    >
      {children}
    </div>
  )),
  Item: React.forwardRef(({ children, onSelect, disabled, ...props }, ref) => (
    <div
      ref={ref}
      role="menuitem"
      data-testid="dropdown-item"
      data-disabled={disabled}
      onClick={disabled ? undefined : onSelect}
      {...props}
    >
      {children}
    </div>
  )),
  CheckboxItem: React.forwardRef(({ children, checked, onCheckedChange, disabled, ...props }, ref) => (
    <div
      ref={ref}
      role="menuitemcheckbox"
      data-testid="dropdown-checkbox-item"
      aria-checked={checked}
      data-disabled={disabled}
      onClick={disabled ? undefined : () => onCheckedChange?.(!checked)}
      {...props}
    >
      {children}
    </div>
  )),
  RadioItem: React.forwardRef(({ children, value, disabled, ...props }, ref) => (
    <div
      ref={ref}
      role="menuitemradio"
      data-testid="dropdown-radio-item"
      data-value={value}
      data-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  )),
  Label: React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-label" {...props}>
      {children}
    </div>
  )),
  Separator: React.forwardRef((props, ref) => (
    <hr ref={ref} data-testid="dropdown-separator" {...props} />
  )),
  Group: ({ children, ...props }) => (
    <div data-testid="dropdown-group" {...props}>
      {children}
    </div>
  ),
  Sub: ({ children, open, ...props }) => (
    <div data-testid="dropdown-sub" data-open={open} {...props}>
      {children}
    </div>
  ),
  SubTrigger: React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-sub-trigger" data-state="closed" {...props}>
      {children}
    </div>
  )),
  SubContent: React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-sub-content" data-state="open" {...props}>
      {children}
    </div>
  )),
  RadioGroup: ({ children, value, onValueChange, ...props }) => (
    <div
      data-testid="dropdown-radio-group"
      data-value={value}
      onClick={() => onValueChange?.('test-value')}
      {...props}
    >
      {children}
    </div>
  ),
  ItemIndicator: ({ children }) => (
    <span data-testid="item-indicator">{children}</span>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: (props) => <svg data-testid="check-icon" {...props} />,
  ChevronRight: (props) => <svg data-testid="chevron-right-icon" {...props} />,
  Circle: (props) => <svg data-testid="circle-icon" {...props} />,
}));

// Mock cn utility
jest.mock('../../lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

describe('RadixDropdown Components', () => {
  describe('DropdownMenu (Root)', () => {
    it('renders without crashing', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
    });

    it('passes props to root component', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-root')).toHaveAttribute('data-open', 'true');
    });

    it('handles onOpenChange callback', () => {
      const handleOpenChange = jest.fn();
      render(
        <DropdownMenu onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
    });

    it('can be controlled with open prop', () => {
      const { rerender } = render(
        <DropdownMenu open={false}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-root')).toHaveAttribute('data-open', 'false');

      rerender(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-root')).toHaveAttribute('data-open', 'true');
    });
  });

  describe('DropdownMenuTrigger', () => {
    it('renders trigger button', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Click Me</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('is clickable', () => {
      const handleClick = jest.fn();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger onClick={handleClick}>Click Me</DropdownMenuTrigger>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByTestId('dropdown-trigger'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger ref={ref}>Click Me</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('passes additional props', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-custom="test">Click Me</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-trigger')).toHaveAttribute('data-custom', 'test');
    });

    it('supports disabled state', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger disabled>Click Me</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-trigger')).toBeDisabled();
    });
  });

  describe('DropdownMenuContent', () => {
    it('renders content with portal', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-portal')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    });

    it('applies default sideOffset', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-content')).toHaveAttribute('data-side-offset', '4');
    });

    it('accepts custom sideOffset', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={8}>Content</DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-content')).toHaveAttribute('data-side-offset', '8');
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-class">Content</DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-content')).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent ref={ref}>Content</DropdownMenuContent>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
    });

    it('has open state styling', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-content')).toHaveAttribute('data-state', 'open');
    });

    it('contains menu items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuItem', () => {
    it('renders menu item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Menu Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitem')).toBeInTheDocument();
      expect(screen.getByText('Menu Item')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleSelect = jest.fn();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect}>Menu Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByRole('menuitem'));
      expect(handleSelect).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="custom-item">Menu Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitem')).toHaveClass('custom-item');
    });

    it('supports inset prop', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Menu Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitem')).toHaveClass('pl-8');
    });

    it('can be disabled', () => {
      const handleSelect = jest.fn();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled onSelect={handleSelect}>
              Disabled Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitem');
      expect(item).toHaveAttribute('data-disabled', 'true');
      fireEvent.click(item);
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem ref={ref}>Menu Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
    });

    it('renders with icon children', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Check />
              <span>With Icon</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('renders checkbox item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false}>
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
      expect(screen.getByText('Checkbox Item')).toBeInTheDocument();
    });

    it('displays check icon when checked', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Checked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('does not display check icon when unchecked', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false}>
              Unchecked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'false');
    });

    it('handles toggle on click', () => {
      const handleCheckedChange = jest.fn();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false} onCheckedChange={handleCheckedChange}>
              Toggle Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByRole('menuitemcheckbox'));
      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('can be disabled', () => {
      const handleCheckedChange = jest.fn();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={false}
              disabled
              onCheckedChange={handleCheckedChange}
            >
              Disabled Checkbox
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitemcheckbox');
      expect(item).toHaveAttribute('data-disabled', 'true');
      fireEvent.click(item);
      expect(handleCheckedChange).not.toHaveBeenCalled();
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem className="custom-checkbox" checked={false}>
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitemcheckbox')).toHaveClass('custom-checkbox');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem ref={ref} checked={false}>
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
    });

    it('shows ItemIndicator only when checked', () => {
      const { rerender } = render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false}>
              Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      rerender(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('item-indicator')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuRadioItem', () => {
    it('renders radio item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="option1">
                Radio Option 1
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitemradio')).toBeInTheDocument();
      expect(screen.getByText('Radio Option 1')).toBeInTheDocument();
    });

    it('displays circle indicator', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="option1">
                Radio Option 1
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('circle-icon')).toBeInTheDocument();
    });

    it('passes value prop', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="option1">
                Radio Option 1
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitemradio')).toHaveAttribute('data-value', 'option1');
    });

    it('can be disabled', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="option1" disabled>
                Disabled Radio
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitemradio')).toHaveAttribute('data-disabled', 'true');
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem className="custom-radio" value="option1">
                Radio Option 1
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitemradio')).toHaveClass('custom-radio');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem ref={ref} value="option1">
                Radio Option 1
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
    });
  });

  describe('DropdownMenuRadioGroup', () => {
    it('renders radio group', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-radio-group')).toBeInTheDocument();
    });

    it('manages selected value', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option2">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-radio-group')).toHaveAttribute('data-value', 'option2');
    });

    it('handles value change', () => {
      const handleValueChange = jest.fn();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1" onValueChange={handleValueChange}>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      fireEvent.click(screen.getByTestId('dropdown-radio-group'));
      expect(handleValueChange).toHaveBeenCalledWith('test-value');
    });

    it('contains multiple radio items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option3">Option 3</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuLabel', () => {
    it('renders label', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Menu Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-label')).toBeInTheDocument();
      expect(screen.getByText('Menu Label')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel className="custom-label">Menu Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-label')).toHaveClass('custom-label');
    });

    it('supports inset prop', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Menu Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-label')).toHaveClass('pl-8');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel ref={ref}>Menu Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
    });

    it('has semibold text styling', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Menu Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-label')).toHaveClass('font-semibold');
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('renders separator', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-separator')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator className="custom-separator" />
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-separator')).toHaveClass('custom-separator');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator ref={ref} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
    });

    it('has correct styling classes', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const separator = screen.getByTestId('dropdown-separator');
      expect(separator).toHaveClass('-mx-1');
      expect(separator).toHaveClass('my-1');
      expect(separator).toHaveClass('h-px');
    });
  });

  describe('DropdownMenuShortcut', () => {
    it('renders shortcut', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut className="custom-shortcut">Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Ctrl+S')).toHaveClass('custom-shortcut');
    });

    it('has correct styling', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const shortcut = screen.getByText('Ctrl+S');
      expect(shortcut).toHaveClass('ml-auto');
      expect(shortcut).toHaveClass('text-xs');
      expect(shortcut).toHaveClass('tracking-widest');
    });

    it('renders with different shortcut values', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Copy
              <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Paste
              <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Ctrl+C')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+V')).toBeInTheDocument();
    });

    it('is a span element', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const shortcut = screen.getByText('Ctrl+S');
      expect(shortcut.tagName).toBe('SPAN');
    });
  });

  describe('DropdownMenuGroup', () => {
    it('renders group', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Item 1</DropdownMenuItem>
              <DropdownMenuItem>Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-group')).toBeInTheDocument();
    });

    it('contains multiple items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Group Item 1</DropdownMenuItem>
              <DropdownMenuItem>Group Item 2</DropdownMenuItem>
              <DropdownMenuItem>Group Item 3</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Group Item 1')).toBeInTheDocument();
      expect(screen.getByText('Group Item 2')).toBeInTheDocument();
      expect(screen.getByText('Group Item 3')).toBeInTheDocument();
    });

    it('can have multiple groups separated', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Group 1 Item</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Group 2 Item</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const groups = screen.getAllByTestId('dropdown-group');
      expect(groups).toHaveLength(2);
    });
  });

  describe('DropdownMenuSub (Nested Menus)', () => {
    it('renders sub menu', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sub Menu</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-sub')).toBeInTheDocument();
    });

    it('can be opened', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub open={true}>
              <DropdownMenuSubTrigger>Sub Menu</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-sub')).toHaveAttribute('data-open', 'true');
    });
  });

  describe('DropdownMenuSubTrigger', () => {
    it('renders sub trigger', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-sub-trigger')).toBeInTheDocument();
      expect(screen.getByText('More Options')).toBeInTheDocument();
    });

    it('displays chevron right icon', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    });

    it('supports inset prop', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>More Options</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-sub-trigger')).toHaveClass('pl-8');
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="custom-sub-trigger">
                More Options
              </DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-sub-trigger')).toHaveClass('custom-sub-trigger');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger ref={ref}>More Options</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
    });

    it('has correct default state', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-sub-trigger')).toHaveAttribute('data-state', 'closed');
    });
  });

  describe('DropdownMenuSubContent', () => {
    it('renders sub content', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-sub-content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="custom-sub-content">
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-sub-content')).toHaveClass('custom-sub-content');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent ref={ref}>
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(ref.current).toBeTruthy();
    });

    it('has open state', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-sub-content')).toHaveAttribute('data-state', 'open');
    });

    it('contains nested menu items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Nested Item 1</DropdownMenuItem>
                <DropdownMenuItem>Nested Item 2</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Nested Item 1')).toBeInTheDocument();
      expect(screen.getByText('Nested Item 2')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuPortal', () => {
    it('renders portal', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuPortal>
            <div>Portal Content</div>
          </DropdownMenuPortal>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-portal')).toBeInTheDocument();
    });

    it('renders children inside portal', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuPortal>
            <div>Portal Content</div>
          </DropdownMenuPortal>
        </DropdownMenu>
      );
      expect(screen.getByText('Portal Content')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('renders complete dropdown menu with all components', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
    });

    it('handles complex menu with checkboxes and radio groups', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Preferences</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Display Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={true}>
              Show Toolbar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={false}>
              Show Sidebar
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup value="light">
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Display Settings')).toBeInTheDocument();
      expect(screen.getByText('Show Toolbar')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('handles nested sub menus', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>File</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>New File</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Recent Files</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>file1.txt</DropdownMenuItem>
                <DropdownMenuItem>file2.txt</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem>Save</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Recent Files')).toBeInTheDocument();
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
    });

    it('renders menu with shortcuts', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Edit</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <span>Copy</span>
              <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Paste</span>
              <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Cut</span>
              <DropdownMenuShortcut>Ctrl+X</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Ctrl+C')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+V')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+X')).toBeInTheDocument();
    });

    it('supports mixed content types', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Action 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={true}>
              Enable Feature
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Priority</DropdownMenuLabel>
            <DropdownMenuRadioGroup value="high">
              <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('menu items have proper role', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitem')).toBeInTheDocument();
    });

    it('checkbox items have proper role and aria-checked', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>Checkbox</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const checkbox = screen.getByRole('menuitemcheckbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('radio items have proper role', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="option">Radio</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitemradio')).toBeInTheDocument();
    });

    it('disabled items have proper data attribute', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitem')).toHaveAttribute('data-disabled', 'true');
    });

    it('trigger is keyboard accessible', () => {
      const handleClick = jest.fn();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger onClick={handleClick}>Open</DropdownMenuTrigger>
        </DropdownMenu>
      );
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.keyDown(trigger, { key: 'Enter' });
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Styling and Classes', () => {
    it('applies correct base classes to DropdownMenuContent', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );
      const content = screen.getByTestId('dropdown-content');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('min-w-[8rem]');
      expect(content).toHaveClass('rounded-xl');
    });

    it('applies correct classes to DropdownMenuItem', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const item = screen.getByRole('menuitem');
      expect(item).toHaveClass('relative');
      expect(item).toHaveClass('flex');
      expect(item).toHaveClass('rounded-lg');
    });

    it('applies correct classes to DropdownMenuLabel', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const label = screen.getByTestId('dropdown-label');
      expect(label).toHaveClass('px-2');
      expect(label).toHaveClass('py-1.5');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-semibold');
    });

    it('applies inset padding when inset prop is true', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Item</DropdownMenuItem>
            <DropdownMenuLabel inset>Label</DropdownMenuLabel>
            <DropdownMenuSubTrigger inset>Sub</DropdownMenuSubTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByRole('menuitem')).toHaveClass('pl-8');
      expect(screen.getByTestId('dropdown-label')).toHaveClass('pl-8');
      expect(screen.getByTestId('dropdown-sub-trigger')).toHaveClass('pl-8');
    });

    it('applies correct classes to DropdownMenuSeparator', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const separator = screen.getByTestId('dropdown-separator');
      expect(separator).toHaveClass('-mx-1');
      expect(separator).toHaveClass('my-1');
      expect(separator).toHaveClass('h-px');
      expect(separator).toHaveClass('bg-gray-6');
    });

    it('applies correct classes to DropdownMenuShortcut', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Item
              <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const shortcut = screen.getByText('Ctrl+S');
      expect(shortcut).toHaveClass('ml-auto');
      expect(shortcut).toHaveClass('text-xs');
      expect(shortcut).toHaveClass('tracking-widest');
      expect(shortcut).toHaveClass('text-gray-9');
    });

    it('applies correct classes to DropdownMenuSubTrigger', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const subTrigger = screen.getByTestId('dropdown-sub-trigger');
      expect(subTrigger).toHaveClass('flex');
      expect(subTrigger).toHaveClass('cursor-default');
      expect(subTrigger).toHaveClass('select-none');
      expect(subTrigger).toHaveClass('rounded-lg');
    });

    it('applies correct classes to DropdownMenuSubContent', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>Content</DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const subContent = screen.getByTestId('dropdown-sub-content');
      expect(subContent).toHaveClass('z-50');
      expect(subContent).toHaveClass('min-w-[8rem]');
      expect(subContent).toHaveClass('rounded-xl');
    });
  });

  describe('Display Names', () => {
    it('sets correct display name for DropdownMenuSubTrigger', () => {
      expect(DropdownMenuSubTrigger.displayName).toBe(
        DropdownMenuPrimitive.SubTrigger.displayName
      );
    });

    it('sets correct display name for DropdownMenuSubContent', () => {
      expect(DropdownMenuSubContent.displayName).toBe(
        DropdownMenuPrimitive.SubContent.displayName
      );
    });

    it('sets correct display name for DropdownMenuContent', () => {
      expect(DropdownMenuContent.displayName).toBe(
        DropdownMenuPrimitive.Content.displayName
      );
    });

    it('sets correct display name for DropdownMenuItem', () => {
      expect(DropdownMenuItem.displayName).toBe(
        DropdownMenuPrimitive.Item.displayName
      );
    });

    it('sets correct display name for DropdownMenuCheckboxItem', () => {
      expect(DropdownMenuCheckboxItem.displayName).toBe(
        DropdownMenuPrimitive.CheckboxItem.displayName
      );
    });

    it('sets correct display name for DropdownMenuRadioItem', () => {
      expect(DropdownMenuRadioItem.displayName).toBe(
        DropdownMenuPrimitive.RadioItem.displayName
      );
    });

    it('sets correct display name for DropdownMenuLabel', () => {
      expect(DropdownMenuLabel.displayName).toBe(
        DropdownMenuPrimitive.Label.displayName
      );
    });

    it('sets correct display name for DropdownMenuSeparator', () => {
      expect(DropdownMenuSeparator.displayName).toBe(
        DropdownMenuPrimitive.Separator.displayName
      );
    });

    it('sets correct display name for DropdownMenuShortcut', () => {
      expect(DropdownMenuShortcut.displayName).toBe('DropdownMenuShortcut');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent></DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    });

    it('handles single item menu', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Only Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Only Item')).toBeInTheDocument();
    });

    it('handles multiple separators', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const separators = screen.getAllByTestId('dropdown-separator');
      expect(separators).toHaveLength(3);
    });

    it('handles empty label', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel></DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-label')).toBeInTheDocument();
    });

    it('handles empty radio group', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup></DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByTestId('dropdown-radio-group')).toBeInTheDocument();
    });

    it('handles deeply nested submenus', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Level 1</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Level 2</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Level 2 Item</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
    });

    it('handles long text in menu items', () => {
      const longText = 'This is a very long menu item text that should be handled properly';
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>{longText}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters in text', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item &lt;&gt;&amp;</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText(/Item/)).toBeInTheDocument();
    });

    it('handles rapid state changes', () => {
      const { rerender } = render(
        <DropdownMenu open={false}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );

      rerender(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );

      rerender(
        <DropdownMenu open={false}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
    });

    it('handles checkbox toggling between states', () => {
      const { rerender } = render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false}>Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'false');

      rerender(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Icon Integration', () => {
    it('ChevronRight icon has correct classes', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const icon = screen.getByTestId('chevron-right-icon');
      expect(icon).toHaveClass('ml-auto');
      expect(icon).toHaveClass('h-4');
      expect(icon).toHaveClass('w-4');
    });

    it('Check icon has correct classes in CheckboxItem', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const icon = screen.getByTestId('check-icon');
      expect(icon).toHaveClass('h-4');
      expect(icon).toHaveClass('w-4');
    });

    it('Circle icon has correct classes in RadioItem', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="option">Item</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const icon = screen.getByTestId('circle-icon');
      expect(icon).toHaveClass('h-2');
      expect(icon).toHaveClass('w-2');
      expect(icon).toHaveClass('fill-current');
    });
  });
});

export default handleOpenChange
