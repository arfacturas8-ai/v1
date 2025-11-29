/**
 * CRYB Design System - Dropdown Component
 * Modern OpenSea-inspired dropdown menus with animations
 */

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Check, ChevronRight, Circle } from 'lucide-react';

// ===== DROPDOWN CONTENT VARIANTS =====
const dropdownContentVariants = cva(
  [
    'z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-lg',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  ],
  {
    variants: {
      variant: {
        default: 'bg-popover border-border',
        glass: 'bg-background/80 backdrop-blur-xl border-border/50',
        gradient: 'bg-gradient-to-br from-background via-background to-primary/5 border-primary/20',
        neon: 'bg-background/90 backdrop-blur-md border-2 border-accent-cyan/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ===== DROPDOWN ROOT =====
const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// ===== DROPDOWN SUB TRIGGER =====
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight style={{
  height: '16px',
  width: '16px'
}} />
  </DropdownMenuPrimitive.SubTrigger>
));

DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

// ===== DROPDOWN SUB CONTENT =====
export interface DropdownMenuSubContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>,
    VariantProps<typeof dropdownContentVariants> {}

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  DropdownMenuSubContentProps
>(({ className, variant, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(dropdownContentVariants({ variant }), 'p-1', className)}
    {...props}
  />
));

DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

// ===== DROPDOWN CONTENT =====
export interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>,
    VariantProps<typeof dropdownContentVariants> {}

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ className, variant, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(dropdownContentVariants({ variant }), 'p-1', className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

// ===== DROPDOWN ITEM =====
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    icon?: React.ReactNode;
    shortcut?: string;
    destructive?: boolean;
  }
>(({ className, inset, icon, shortcut, destructive, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      destructive && 'text-destructive focus:bg-destructive/10 focus:text-destructive',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {icon && <span style={{
  height: '16px',
  width: '16px'
}}>{icon}</span>}
    <span style={{
  flex: '1'
}}>{children}</span>
    {shortcut && (
      <span className="ml-auto text-xs tracking-widest opacity-60">{shortcut}</span>
    )}
  </DropdownMenuPrimitive.Item>
));

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

// ===== DROPDOWN CHECKBOX ITEM =====
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
      <DropdownMenuPrimitive.ItemIndicator>
        <Check style={{
  height: '16px',
  width: '16px'
}} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));

DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

// ===== DROPDOWN RADIO ITEM =====
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle style={{
  height: '8px',
  width: '8px'
}} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));

DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

// ===== DROPDOWN LABEL =====
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));

DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

// ===== DROPDOWN SEPARATOR =====
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

// ===== DROPDOWN SHORTCUT =====
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    />
  );
};

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

// ===== DROPDOWN ARROW =====
const DropdownMenuArrow = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Arrow
    ref={ref}
    className={cn('fill-popover', className)}
    {...props}
  />
));

DropdownMenuArrow.displayName = DropdownMenuPrimitive.Arrow.displayName;

// ===== SIMPLE DROPDOWN (convenience component) =====
export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
  type?: 'item' | 'checkbox' | 'radio';
  checked?: boolean;
  value?: string;
}

export interface SimpleDropdownProps {
  /** Trigger element */
  trigger: React.ReactNode;
  /** Dropdown items */
  items: DropdownItem[];
  /** Dropdown variant */
  variant?: VariantProps<typeof dropdownContentVariants>['variant'];
  /** Alignment */
  align?: 'start' | 'center' | 'end';
  /** Side */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Custom class */
  className?: string;
  /** On value change for radio/checkbox */
  onValueChange?: (value: string) => void;
}

const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
  trigger,
  items,
  variant = 'default',
  align = 'end',
  side = 'bottom',
  className,
  onValueChange,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent variant={variant} align={align} side={side} className={className}>
        {items.map((item, index) => {
          if (item.separator) {
            return <DropdownMenuSeparator key={`separator-${index}`} />;
          }

          if (item.type === 'checkbox') {
            return (
              <DropdownMenuCheckboxItem
                key={index}
                checked={item.checked}
                onCheckedChange={() => item.onClick?.()}
                disabled={item.disabled}
              >
                {item.label}
              </DropdownMenuCheckboxItem>
            );
          }

          if (item.type === 'radio') {
            return (
              <DropdownMenuRadioItem
                key={index}
                value={item.value || item.label}
                disabled={item.disabled}
              >
                {item.label}
              </DropdownMenuRadioItem>
            );
          }

          return (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              disabled={item.disabled}
              destructive={item.destructive}
              icon={item.icon}
              shortcut={item.shortcut}
            >
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

SimpleDropdown.displayName = 'SimpleDropdown';

// ===== EXPORTS =====
export {
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
};

export type {
  DropdownMenuContentProps,
  DropdownMenuSubContentProps,
  DropdownItem,
  SimpleDropdownProps,
};
