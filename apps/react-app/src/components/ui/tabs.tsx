/**
 * CRYB Design System - Tabs Component
 * Modern OpenSea-inspired tabbed interface with animations
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ===== TABS LIST VARIANTS =====
const tabsListVariants = cva(
  [
    'inline-flex items-center justify-center',
  ],
  {
    variants: {
      variant: {
        default: 'rounded-md bg-muted p-1',
        underline: 'border-b border-border',
        pills: 'gap-2',
        glass: 'rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 p-1',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      fullWidth: false,
    },
  }
);

// ===== TABS TRIGGER VARIANTS =====
const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5',
    'text-sm font-medium ring-offset-background transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'rounded-sm',
          'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
          'data-[state=inactive]:text-muted-foreground',
        ],
        underline: [
          'rounded-none border-b-2 border-transparent',
          'data-[state=active]:border-primary data-[state=active]:text-foreground',
          'data-[state=inactive]:text-muted-foreground',
          'hover:text-foreground hover:border-border',
        ],
        pills: [
          'rounded-full',
          'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md',
          'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted',
        ],
        glass: [
          'rounded-md',
          'data-[state=active]:bg-background/90 data-[state=active]:backdrop-blur-md data-[state=active]:text-foreground data-[state=active]:shadow-md',
          'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-background/50',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ===== TABS ROOT =====
const Tabs = TabsPrimitive.Root;

// ===== TABS LIST =====
export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, fullWidth, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant, fullWidth }), className)}
    {...props}
  />
));

TabsList.displayName = TabsPrimitive.List.displayName;

// ===== TABS TRIGGER =====
export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  /** Icon to display before text */
  icon?: React.ReactNode;
  /** Badge or count to display */
  badge?: React.ReactNode;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, icon, badge, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  >
    <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="shrink-0">{badge}</span>}
    </span>
  </TabsPrimitive.Trigger>
));

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// ===== TABS CONTENT =====
export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  /** Whether to animate content entrance */
  animated?: boolean;
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, animated = true, children, ...props }, ref) => {
  if (!animated) {
    return (
      <TabsPrimitive.Content
        ref={ref}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.Content>
    );
  }

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      asChild
      {...props}
    >
      <div>
        {children}
      </div>
    </TabsPrimitive.Content>
  );
});

TabsContent.displayName = TabsPrimitive.Content.displayName;

// ===== ANIMATED TABS (with indicator) =====
export interface AnimatedTabsProps {
  /** Default active tab */
  defaultValue: string;
  /** Controlled active tab */
  value?: string;
  /** Callback when tab changes */
  onValueChange?: (value: string) => void;
  /** Tab items */
  items: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
    content: React.ReactNode;
  }>;
  /** Tabs variant */
  variant?: VariantProps<typeof tabsListVariants>['variant'];
  /** Full width tabs */
  fullWidth?: boolean;
  /** Custom class for container */
  className?: string;
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  items,
  variant = 'default',
  fullWidth = false,
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue);
  const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 });
  const tabsListRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  React.useEffect(() => {
    if (!tabsListRef.current || variant === 'underline') return;

    const activeElement = tabsListRef.current.querySelector(
      `[data-state="active"]`
    ) as HTMLElement;

    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [activeTab, variant]);

  const handleValueChange = (newValue: string) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
  };

  const showIndicator = variant === 'default' || variant === 'glass';

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleValueChange}
      className={className}
    >
      <div style={{
  position: 'relative'
}}>
        <TabsList ref={tabsListRef} variant={variant} fullWidth={fullWidth}>
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              variant={variant}
              icon={item.icon}
              badge={item.badge}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {showIndicator && (
          <div
            className={cn(
              'absolute bottom-1 h-[calc(100%-8px)] rounded-sm bg-background shadow-sm',
              variant === 'glass' && 'bg-background/90 backdrop-blur-md'
            )}
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />
        )}
      </div>

      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} animated>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

AnimatedTabs.displayName = 'AnimatedTabs';

// ===== VERTICAL TABS =====
export interface VerticalTabsProps extends AnimatedTabsProps {
  /** Width of the tab list */
  tabListWidth?: string;
}

const VerticalTabs: React.FC<VerticalTabsProps> = ({
  tabListWidth = '200px',
  ...props
}) => {
  return (
    <Tabs
      value={props.value || props.defaultValue}
      onValueChange={props.onValueChange}
      className={cn('flex gap-4', props.className)}
      orientation="vertical"
    >
      <TabsList
        variant={props.variant}
        style={{
  flexDirection: 'column'
}}
        style={{ width: tabListWidth }}
      >
        {props.items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            variant={props.variant}
            icon={item.icon}
            badge={item.badge}
            style={{
  width: '100%',
  justifyContent: 'flex-start'
}}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div style={{
  flex: '1'
}}>
        {props.items.map((item) => (
          <TabsContent key={item.value} value={item.value} animated>
            {item.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};

VerticalTabs.displayName = 'VerticalTabs';

// ===== EXPORTS =====
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  AnimatedTabs,
  VerticalTabs,
  tabsListVariants,
  tabsTriggerVariants,
};

export type {
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
  AnimatedTabsProps,
  VerticalTabsProps,
};
