/**
 * Comprehensive Test Suite for CRYB Dropdown Component
 * Testing all dropdown features, variants, and accessibility
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
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
  DropdownMenuArrow,
  SimpleDropdown,
  dropdownContentVariants,
} from './dropdown';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => <svg data-testid="check-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  Circle: () => <svg data-testid="circle-icon" />,
}));

// Mock Radix UI Dropdown Menu
jest.mock('@radix-ui/react-dropdown-menu', () => {
  const React = require('react');

  const Root = ({ children, open, onOpenChange, ...props }: any) => {
    const [isOpen, setIsOpen] = React.useState(open || false);

    React.useEffect(() => {
      if (open !== undefined) {
        setIsOpen(open);
      }
    }, [open]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    };

    return (
      <div data-testid="dropdown-root" data-state={isOpen ? 'open' : 'closed'} {...props}>
        {React.Children.map(children, child =>
          React.isValidElement(child)
            ? React.cloneElement(child as any, { isOpen, onOpenChange: handleOpenChange })
            : child
        )}
      </div>
    );
  };

  const Trigger = React.forwardRef(({ children, asChild, isOpen, onOpenChange, ...props }: any, ref: any) => {
    const handleClick = () => {
      onOpenChange?.(!isOpen);
    };

    if (asChild) {
      const child = React.Children.only(children);
      return React.cloneElement(child, {
        ...props,
        ...child.props,
        ref,
        onClick: handleClick,
        'aria-expanded': isOpen,
        'aria-haspopup': 'menu',
      });
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        {...props}
      >
        {children}
      </button>
    );
  });

  const Portal = ({ children }: any) => <div data-testid="dropdown-portal">{children}</div>;

  const Content = React.forwardRef(({ children, isOpen, side, align, sideOffset, ...props }: any, ref: any) => {
    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        role="menu"
        data-testid="dropdown-content"
        data-state={isOpen ? 'open' : 'closed'}
        data-side={side}
        data-align={align}
        {...props}
      >
        {children}
      </div>
    );
  });

  const Item = React.forwardRef(({ children, disabled, onSelect, onClick, ...props }: any, ref: any) => {
    const handleClick = (e: any) => {
      if (!disabled) {
        onClick?.(e);
        onSelect?.(e);
      }
    };

    return (
      <div
        ref={ref}
        role="menuitem"
        aria-disabled={disabled}
        data-disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  });

  const CheckboxItem = React.forwardRef(({ children, checked, disabled, onCheckedChange, ...props }: any, ref: any) => {
    const handleClick = () => {
      if (!disabled) {
        onCheckedChange?.(!checked);
      }
    };

    return (
      <div
        ref={ref}
        role="menuitemcheckbox"
        aria-checked={checked}
        aria-disabled={disabled}
        data-disabled={disabled}
        data-state={checked ? 'checked' : 'unchecked'}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  });

  const RadioItem = React.forwardRef(({ children, value, disabled, ...props }: any, ref: any) => {
    return (
      <div
        ref={ref}
        role="menuitemradio"
        aria-disabled={disabled}
        data-disabled={disabled}
        data-value={value}
        {...props}
      >
        {children}
      </div>
    );
  });

  const ItemIndicator = ({ children }: any) => <span data-testid="item-indicator">{children}</span>;

  const Label = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} data-testid="dropdown-label" {...props}>
      {children}
    </div>
  ));

  const Separator = React.forwardRef(({ ...props }: any, ref: any) => (
    <div ref={ref} role="separator" data-testid="dropdown-separator" {...props} />
  ));

  const Group = ({ children, ...props }: any) => (
    <div data-testid="dropdown-group" {...props}>
      {children}
    </div>
  );

  const Sub = ({ children, open }: any) => {
    const [isOpen, setIsOpen] = React.useState(open || false);
    return (
      <div data-testid="dropdown-sub" data-state={isOpen ? 'open' : 'closed'}>
        {React.Children.map(children, child =>
          React.isValidElement(child)
            ? React.cloneElement(child as any, { isSubOpen: isOpen, onSubOpenChange: setIsOpen })
            : child
        )}
      </div>
    );
  };

  const SubTrigger = React.forwardRef(({ children, isSubOpen, onSubOpenChange, ...props }: any, ref: any) => {
    const handleClick = () => {
      onSubOpenChange?.(!isSubOpen);
    };

    return (
      <div
        ref={ref}
        role="menuitem"
        onClick={handleClick}
        data-state={isSubOpen ? 'open' : 'closed'}
        aria-expanded={isSubOpen}
        {...props}
      >
        {children}
      </div>
    );
  });

  const SubContent = React.forwardRef(({ children, isSubOpen, ...props }: any, ref: any) => {
    if (!isSubOpen) return null;

    return (
      <div
        ref={ref}
        role="menu"
        data-testid="dropdown-sub-content"
        data-state={isSubOpen ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </div>
    );
  });

  const RadioGroup = ({ children, value, onValueChange, ...props }: any) => {
    const handleItemClick = (itemValue: string) => {
      onValueChange?.(itemValue);
    };

    return (
      <div data-testid="dropdown-radio-group" role="group" {...props}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            const isChecked = value === child.props.value;
            return React.cloneElement(child as any, {
              onClick: () => handleItemClick(child.props.value),
              'aria-checked': isChecked ? 'true' : 'false',
              'data-state': isChecked ? 'checked' : 'unchecked',
            });
          }
          return child;
        })}
      </div>
    );
  };

  const Arrow = React.forwardRef(({ ...props }: any, ref: any) => (
    <div ref={ref} data-testid="dropdown-arrow" {...props} />
  ));

  return {
    Root,
    Trigger,
    Portal,
    Content,
    Item,
    CheckboxItem,
    RadioItem,
    ItemIndicator,
    Label,
    Separator,
    Group,
    Sub,
    SubTrigger,
    SubContent,
    RadioGroup,
    Arrow,
  };
});

describe('DropdownMenu Component', () => {
  // ===== BASIC RENDERING TESTS =====
  describe('Rendering', () => {
    it('should render dropdown trigger', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const trigger = screen.getByText('Open Menu');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('should not show content initially', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should render with custom trigger', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>Custom Trigger</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const trigger = screen.getByRole('button', { name: /custom trigger/i });
      expect(trigger).toBeInTheDocument();
    });
  });

  // ===== OPEN/CLOSE BEHAVIOR TESTS =====
  describe('Open/Close Behavior', () => {
    it('should open dropdown when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should show aria-expanded when open', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open Menu');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should close dropdown when trigger is clicked again', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Toggle Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Toggle Menu');

      // Open
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Close
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should support controlled state', () => {
      const { rerender } = render(
        <DropdownMenu open={false}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      rerender(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  // ===== ITEM SELECTION TESTS =====
  describe('Item Selection', () => {
    it('should call onClick when item is selected', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleClick}>
              Click Me
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitem', { name: /click me/i });
      await user.click(item);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render multiple items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('should render item with icon', () => {
      const Icon = () => <span data-testid="custom-icon">★</span>;

      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Icon />}>
              Item with Icon
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByText('Item with Icon')).toBeInTheDocument();
    });

    it('should render item with shortcut', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem shortcut="⌘K">
              Search
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });
  });

  // ===== DISABLED ITEMS TESTS =====
  describe('Disabled Items', () => {
    it('should render disabled item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitem', { name: /disabled item/i });
      expect(item).toHaveAttribute('aria-disabled', 'true');
      expect(item).toHaveAttribute('data-disabled', 'true');
    });

    it('should not call onClick when disabled item is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled onClick={handleClick}>
              Disabled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitem', { name: /disabled/i });
      await user.click(item);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should render disabled checkbox item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem disabled>
              Disabled Checkbox
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitemcheckbox');
      expect(item).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // ===== DESTRUCTIVE ITEMS TESTS =====
  describe('Destructive Items', () => {
    it('should render destructive item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem destructive>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should handle destructive item click', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem destructive onClick={handleClick}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(item);

      expect(handleClick).toHaveBeenCalled();
    });
  });

  // ===== CHECKBOX ITEMS TESTS =====
  describe('Checkbox Items', () => {
    it('should render checkbox item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>
              Checkbox Option
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitemcheckbox');
      expect(item).toBeInTheDocument();
      expect(screen.getByText('Checkbox Option')).toBeInTheDocument();
    });

    it('should show checked state', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Checked
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitemcheckbox');
      expect(item).toHaveAttribute('aria-checked', 'true');
      expect(item).toHaveAttribute('data-state', 'checked');
    });

    it('should show unchecked state', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false}>
              Unchecked
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitemcheckbox');
      expect(item).toHaveAttribute('aria-checked', 'false');
      expect(item).toHaveAttribute('data-state', 'unchecked');
    });

    it('should toggle checked state on click', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = jest.fn();

      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={handleCheckedChange}
            >
              Toggle Me
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitemcheckbox');
      await user.click(item);

      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should show check indicator when checked', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Checked
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId('item-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
  });

  // ===== RADIO ITEMS TESTS =====
  describe('Radio Items', () => {
    it('should render radio item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitemradio');
      expect(item).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should render radio group', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option3">Option 3</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const items = screen.getAllByRole('menuitemradio');
      expect(items).toHaveLength(3);
    });

    it('should show selected radio item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option2">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const items = screen.getAllByRole('menuitemradio');
      expect(items[0]).toHaveAttribute('aria-checked', 'false');
      expect(items[0]).toHaveAttribute('data-state', 'unchecked');
      expect(items[1]).toHaveAttribute('aria-checked', 'true');
      expect(items[1]).toHaveAttribute('data-state', 'checked');
    });

    it('should call onValueChange when radio item is selected', async () => {
      const user = userEvent.setup();
      const handleValueChange = jest.fn();

      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1" onValueChange={handleValueChange}>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const items = screen.getAllByRole('menuitemradio');
      await user.click(items[1]);

      expect(handleValueChange).toHaveBeenCalledWith('option2');
    });

    it('should show circle indicator when selected', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId('item-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('circle-icon')).toBeInTheDocument();
    });
  });

  // ===== GROUPS AND LABELS TESTS =====
  describe('Groups and Labels', () => {
    it('should render group', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
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

    it('should render label', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Section Title</DropdownMenuLabel>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-label')).toBeInTheDocument();
    });

    it('should render label with inset', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Inset Label')).toBeInTheDocument();
    });

    it('should render multiple groups with labels', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Group 1</DropdownMenuLabel>
              <DropdownMenuItem>Item 1</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Group 2</DropdownMenuLabel>
              <DropdownMenuItem>Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
    });
  });

  // ===== SEPARATOR TESTS =====
  describe('Separator', () => {
    it('should render separator', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('should render multiple separators', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const separators = screen.getAllByRole('separator');
      expect(separators).toHaveLength(2);
    });
  });

  // ===== SUBMENU TESTS =====
  describe('Submenu', () => {
    it('should render sub trigger', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('More Options')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    });

    it('should open submenu when sub trigger is clicked', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const subTrigger = screen.getByText('More Options');
      await user.click(subTrigger);

      await waitFor(() => {
        expect(screen.getByText('Sub Item')).toBeInTheDocument();
      });
    });

    it('should render sub trigger with inset', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>Inset Trigger</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Inset Trigger')).toBeInTheDocument();
    });
  });

  // ===== SHORTCUT TESTS =====
  describe('Shortcut', () => {
    it('should render shortcut component', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('⌘S')).toBeInTheDocument();
    });

    it('should render multiple shortcuts', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Copy
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('⌘S')).toBeInTheDocument();
      expect(screen.getByText('⌘C')).toBeInTheDocument();
    });
  });

  // ===== PORTAL TESTS =====
  describe('Portal', () => {
    it('should render content in portal', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId('dropdown-portal')).toBeInTheDocument();
    });
  });

  // ===== ARROW TESTS =====
  describe('Arrow', () => {
    it('should render arrow', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuArrow />
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId('dropdown-arrow')).toBeInTheDocument();
    });
  });

  // ===== POSITION/PLACEMENT TESTS =====
  describe('Position and Placement', () => {
    it('should support bottom side', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent side="bottom">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const content = screen.getByRole('menu');
      expect(content).toHaveAttribute('data-side', 'bottom');
    });

    it('should support top side', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent side="top">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const content = screen.getByRole('menu');
      expect(content).toHaveAttribute('data-side', 'top');
    });

    it('should support left side', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent side="left">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const content = screen.getByRole('menu');
      expect(content).toHaveAttribute('data-side', 'left');
    });

    it('should support right side', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent side="right">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const content = screen.getByRole('menu');
      expect(content).toHaveAttribute('data-side', 'right');
    });

    it('should support start alignment', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const content = screen.getByRole('menu');
      expect(content).toHaveAttribute('data-align', 'start');
    });

    it('should support center alignment', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const content = screen.getByRole('menu');
      expect(content).toHaveAttribute('data-align', 'center');
    });

    it('should support end alignment', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const content = screen.getByRole('menu');
      expect(content).toHaveAttribute('data-align', 'end');
    });

    it('should support custom sideOffset', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10}>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  // ===== VARIANT TESTS =====
  describe('Content Variants', () => {
    it('should render default variant', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent variant="default">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should render glass variant', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent variant="glass">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should render gradient variant', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent variant="gradient">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should render neon variant', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent variant="neon">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should apply variant to sub content', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub open={true}>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent variant="glass">
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId('dropdown-sub-content')).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem')).toBeInTheDocument();
    });

    it('should have aria-haspopup on trigger', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Menu');
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('should have aria-expanded on trigger', async () => {
      const user = userEvent.setup();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Menu');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have proper roles for checkbox items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>Checkbox</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
    });

    it('should have proper roles for radio items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Option</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByRole('menuitemradio')).toBeInTheDocument();
    });

    it('should have aria-disabled on disabled items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitem');
      expect(item).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-checked on checkbox items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>Checked</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitemcheckbox');
      expect(item).toHaveAttribute('aria-checked', 'true');
    });

    it('should have aria-checked on radio items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Selected</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByRole('menuitemradio');
      expect(item).toHaveAttribute('aria-checked', 'true');
    });
  });

  // ===== REF FORWARDING TESTS =====
  describe('Ref Forwarding', () => {
    it('should forward ref to trigger', () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger ref={ref}>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should forward ref to content', () => {
      const ref = React.createRef<HTMLDivElement>();

      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent ref={ref}>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should forward ref to item', () => {
      const ref = React.createRef<HTMLDivElement>();

      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem ref={ref}>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  // ===== INSET ITEMS TESTS =====
  describe('Inset Items', () => {
    it('should render item with inset', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Inset Item')).toBeInTheDocument();
    });

    it('should render label with inset', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Inset Label')).toBeInTheDocument();
    });

    it('should render sub trigger with inset', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>Inset Sub</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText('Inset Sub')).toBeInTheDocument();
    });
  });
});

// ===== SIMPLE DROPDOWN TESTS =====
describe('SimpleDropdown Component', () => {
  it('should render simple dropdown', () => {
    const items = [
      { label: 'Item 1', onClick: jest.fn() },
      { label: 'Item 2', onClick: jest.fn() },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('should render items when opened', async () => {
    const user = userEvent.setup();
    const items = [
      { label: 'Item 1', onClick: jest.fn() },
      { label: 'Item 2', onClick: jest.fn() },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByRole('button', { name: /menu/i }));

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  it('should handle item click', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    const items = [
      { label: 'Click Me', onClick: handleClick },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByRole('button', { name: /menu/i }));

    await waitFor(() => {
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('should render disabled items', async () => {
    const user = userEvent.setup();
    const items = [
      { label: 'Disabled Item', onClick: jest.fn(), disabled: true },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByRole('button', { name: /menu/i }));

    await waitFor(() => {
      const item = screen.getByRole('menuitem');
      expect(item).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('should render destructive items', async () => {
    const user = userEvent.setup();
    const items = [
      { label: 'Delete', onClick: jest.fn(), destructive: true },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByRole('button', { name: /menu/i }));

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('should render items with icons', async () => {
    const user = userEvent.setup();
    const Icon = () => <span data-testid="custom-icon">★</span>;
    const items = [
      { label: 'Item', icon: <Icon />, onClick: jest.fn() },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByRole('button', { name: /menu/i }));

    await waitFor(() => {
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  it('should render items with shortcuts', async () => {
    const user = userEvent.setup();
    const items = [
      { label: 'Save', shortcut: '⌘S', onClick: jest.fn() },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByRole('button', { name: /menu/i }));

    await waitFor(() => {
      expect(screen.getByText('⌘S')).toBeInTheDocument();
    });
  });

  it('should render separators', async () => {
    const user = userEvent.setup();
    const items = [
      { label: 'Item 1', onClick: jest.fn() },
      { separator: true } as any,
      { label: 'Item 2', onClick: jest.fn() },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByRole('button', { name: /menu/i }));

    await waitFor(() => {
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });
  });

  it('should render checkbox items', async () => {
    const user = userEvent.setup();
    const items = [
      { label: 'Checkbox', type: 'checkbox' as const, checked: false, onClick: jest.fn() },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByRole('button', { name: /menu/i }));

    await waitFor(() => {
      expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
    });
  });

  it('should render radio items', async () => {
    const user = userEvent.setup();
    const items = [
      { label: 'Option 1', type: 'radio' as const, value: 'option1' },
      { label: 'Option 2', type: 'radio' as const, value: 'option2' },
    ];

    render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByRole('button', { name: /menu/i }));

    await waitFor(() => {
      const radioItems = screen.getAllByRole('menuitemradio');
      expect(radioItems).toHaveLength(2);
    });
  });

  it('should support different variants', () => {
    const items = [{ label: 'Item', onClick: jest.fn() }];

    const { rerender } = render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} variant="default" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} variant="glass" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} variant="gradient" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} variant="neon" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should support different alignments', () => {
    const items = [{ label: 'Item', onClick: jest.fn() }];

    const { rerender } = render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} align="start" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} align="center" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} align="end" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should support different sides', () => {
    const items = [{ label: 'Item', onClick: jest.fn() }];

    const { rerender } = render(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} side="top" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} side="right" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} side="bottom" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <SimpleDropdown trigger={<button>Menu</button>} items={items} side="left" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should support custom className', () => {
    const items = [{ label: 'Item', onClick: jest.fn() }];

    render(
      <SimpleDropdown
        trigger={<button>Menu</button>}
        items={items}
        className="custom-class"
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

// ===== DROPDOWN CONTENT VARIANTS TESTS =====
describe('dropdownContentVariants', () => {
  it('should have default variant', () => {
    const className = dropdownContentVariants({ variant: 'default' });
    expect(typeof className).toBe('string');
  });

  it('should have glass variant', () => {
    const className = dropdownContentVariants({ variant: 'glass' });
    expect(typeof className).toBe('string');
  });

  it('should have gradient variant', () => {
    const className = dropdownContentVariants({ variant: 'gradient' });
    expect(typeof className).toBe('string');
  });

  it('should have neon variant', () => {
    const className = dropdownContentVariants({ variant: 'neon' });
    expect(typeof className).toBe('string');
  });

  it('should use default variant when not specified', () => {
    const className = dropdownContentVariants({});
    expect(typeof className).toBe('string');
  });
});
