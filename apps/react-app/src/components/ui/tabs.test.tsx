/**
 * Comprehensive Tests for CRYB Design System - Tabs Component
 */

import * as React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  AnimatedTabs,
  VerticalTabs,
} from './tabs';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Tabs Component', () => {
  describe('Basic Tabs (Uncontrolled)', () => {
    it('renders tabs with default active tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'inactive');
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveAttribute('data-state', 'inactive');
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('switches tabs on click', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      // Click on Tab 2
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
        expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'inactive');
        expect(screen.getByText('Content 2')).toBeInTheDocument();
      });

      // Click on Tab 3
      await user.click(screen.getByRole('tab', { name: 'Tab 3' }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveAttribute('data-state', 'active');
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'inactive');
        expect(screen.getByText('Content 3')).toBeInTheDocument();
      });
    });

    it('hides inactive tab panels', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeVisible();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      await waitFor(() => {
        expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
        expect(screen.getByText('Content 2')).toBeVisible();
      });
    });
  });

  describe('Controlled Tabs', () => {
    it('respects controlled value prop', () => {
      const { rerender } = render(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      // Change controlled value
      rerender(
        <Tabs value="tab3">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });

    it('calls onValueChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();

      render(
        <Tabs value="tab1" onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(onValueChange).toHaveBeenCalledWith('tab2');
      expect(onValueChange).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates tabs with arrow keys (horizontal)', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      tab1.focus();

      // Arrow right to tab 2
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();

      // Arrow right to tab 3
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveFocus();

      // Arrow left to tab 2
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
    });

    it('wraps around when using arrow keys', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      tab1.focus();

      // Arrow left should wrap to last tab
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveFocus();

      // Arrow right should wrap to first tab
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });

    it('activates tab with Space key', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      tab2.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
        expect(screen.getByText('Content 2')).toBeInTheDocument();
      });
    });

    it('activates tab with Enter key', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab3 = screen.getByRole('tab', { name: 'Tab 3' });
      tab3.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveAttribute('data-state', 'active');
        expect(screen.getByText('Content 3')).toBeInTheDocument();
      });
    });
  });

  describe('Disabled Tabs', () => {
    it('renders disabled tab trigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2 (Disabled)</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const disabledTab = screen.getByRole('tab', { name: 'Tab 2 (Disabled)' });
      expect(disabledTab).toBeDisabled();
      expect(disabledTab).toHaveAttribute('data-state', 'inactive');
    });

    it('cannot click disabled tab', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2 (Disabled)</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const disabledTab = screen.getByRole('tab', { name: 'Tab 2 (Disabled)' });
      await user.click(disabledTab);

      // Should still show Content 1, not Content 2
      expect(screen.getByText('Content 1')).toBeVisible();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');
    });

    it('skips disabled tabs with keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2 (Disabled)</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      tab1.focus();

      // Arrow right should skip disabled tab 2 and go to tab 3
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveFocus();
    });
  });

  describe('Tab Variants', () => {
    it('renders default variant', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="default">
            <TabsTrigger value="tab1" variant="default">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" variant="default">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('bg-muted');
    });

    it('renders underline variant', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="underline">
            <TabsTrigger value="tab1" variant="underline">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" variant="underline">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('border-b', 'border-border');
    });

    it('renders pills variant', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="pills">
            <TabsTrigger value="tab1" variant="pills">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" variant="pills">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('gap-2');
    });

    it('renders glass variant', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="glass">
            <TabsTrigger value="tab1" variant="glass">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" variant="glass">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('backdrop-blur-sm');
    });

    it('renders full width variant', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList fullWidth>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('w-full');
    });
  });

  describe('Tab Content Animation', () => {
    it('renders content without animation when animated=false', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" animated={false}>Content 1</TabsContent>
          <TabsContent value="tab2" animated={false}>Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('renders content with animation when animated=true (default)', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" animated>Content 1</TabsContent>
          <TabsContent value="tab2" animated>Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  describe('Tab with Icons and Badges', () => {
    it('renders tab with icon', () => {
      const icon = <span data-testid="test-icon">🏠</span>;

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" icon={icon}>Home</TabsTrigger>
            <TabsTrigger value="tab2">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Home Content</TabsContent>
          <TabsContent value="tab2">Settings Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Home/i })).toBeInTheDocument();
    });

    it('renders tab with badge', () => {
      const badge = <span data-testid="test-badge">3</span>;

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" badge={badge}>Messages</TabsTrigger>
            <TabsTrigger value="tab2">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Messages Content</TabsContent>
          <TabsContent value="tab2">Profile Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByTestId('test-badge')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Messages/i })).toBeInTheDocument();
    });

    it('renders tab with both icon and badge', () => {
      const icon = <span data-testid="test-icon">📧</span>;
      const badge = <span data-testid="test-badge">5</span>;

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" icon={icon} badge={badge}>
              Inbox
            </TabsTrigger>
            <TabsTrigger value="tab2">Sent</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Inbox Content</TabsContent>
          <TabsContent value="tab2">Sent Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByTestId('test-badge')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Inbox/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA roles', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(2);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('sets aria-selected correctly', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveAttribute('aria-selected', 'false');
    });

    it('updates aria-selected on tab change', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('has proper focus visible styles', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab1).toHaveClass('focus-visible:outline-none');
      expect(tab1).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('AnimatedTabs Component', () => {
    const testItems = [
      { value: 'tab1', label: 'Tab 1', content: 'Content 1' },
      { value: 'tab2', label: 'Tab 2', content: 'Content 2' },
      { value: 'tab3', label: 'Tab 3', content: 'Content 3' },
    ];

    it('renders animated tabs with default value', () => {
      render(<AnimatedTabs defaultValue="tab1" items={testItems} />);

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('switches animated tabs on click', async () => {
      const user = userEvent.setup();

      render(<AnimatedTabs defaultValue="tab1" items={testItems} />);

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
        expect(screen.getByText('Content 2')).toBeInTheDocument();
      });
    });

    it('calls onValueChange callback', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();

      render(
        <AnimatedTabs
          defaultValue="tab1"
          items={testItems}
          onValueChange={onValueChange}
        />
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(onValueChange).toHaveBeenCalledWith('tab2');
    });

    it('respects controlled value', async () => {
      const { rerender } = render(
        <AnimatedTabs value="tab1" items={testItems} />
      );

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');

      rerender(<AnimatedTabs value="tab3" items={testItems} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveAttribute('data-state', 'active');
        expect(screen.getByText('Content 3')).toBeInTheDocument();
      });
    });

    it('renders with different variants', () => {
      const { rerender } = render(
        <AnimatedTabs defaultValue="tab1" items={testItems} variant="default" />
      );

      let tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('bg-muted');

      rerender(
        <AnimatedTabs defaultValue="tab1" items={testItems} variant="underline" />
      );

      tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('border-b');

      rerender(
        <AnimatedTabs defaultValue="tab1" items={testItems} variant="pills" />
      );

      tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('gap-2');

      rerender(
        <AnimatedTabs defaultValue="tab1" items={testItems} variant="glass" />
      );

      tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('backdrop-blur-sm');
    });

    it('renders full width animated tabs', () => {
      render(
        <AnimatedTabs defaultValue="tab1" items={testItems} fullWidth />
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('w-full');
    });

    it('renders tabs with icons and badges', () => {
      const itemsWithIconsAndBadges = [
        {
          value: 'tab1',
          label: 'Tab 1',
          content: 'Content 1',
          icon: <span data-testid="icon-1">🏠</span>,
          badge: <span data-testid="badge-1">3</span>,
        },
        {
          value: 'tab2',
          label: 'Tab 2',
          content: 'Content 2',
          icon: <span data-testid="icon-2">⚙️</span>,
        },
      ];

      render(
        <AnimatedTabs defaultValue="tab1" items={itemsWithIconsAndBadges} />
      );

      expect(screen.getByTestId('icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('badge-1')).toBeInTheDocument();
      expect(screen.getByTestId('icon-2')).toBeInTheDocument();
    });
  });

  describe('VerticalTabs Component', () => {
    const testItems = [
      { value: 'tab1', label: 'Tab 1', content: 'Content 1' },
      { value: 'tab2', label: 'Tab 2', content: 'Content 2' },
      { value: 'tab3', label: 'Tab 3', content: 'Content 3' },
    ];

    it('renders vertical tabs', () => {
      render(<VerticalTabs defaultValue="tab1" items={testItems} />);

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('has vertical orientation', () => {
      const { container } = render(
        <VerticalTabs defaultValue="tab1" items={testItems} />
      );

      const tabsRoot = container.querySelector('[data-orientation="vertical"]');
      expect(tabsRoot).toBeInTheDocument();
    });

    it('switches vertical tabs on click', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();

      // VerticalTabs doesn't maintain internal state, so we need to manage it
      function ControlledVerticalTabs() {
        const [value, setValue] = React.useState('tab1');

        return (
          <VerticalTabs
            value={value}
            onValueChange={(newValue) => {
              setValue(newValue);
              onValueChange(newValue);
            }}
            items={testItems}
          />
        );
      }

      render(<ControlledVerticalTabs />);

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalledWith('tab2');
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
        expect(screen.getByText('Content 2')).toBeInTheDocument();
      });
    });

    it('navigates with arrow up/down keys in vertical mode', async () => {
      const user = userEvent.setup();

      function ControlledVerticalTabs() {
        const [value, setValue] = React.useState('tab1');
        return (
          <VerticalTabs
            value={value}
            onValueChange={setValue}
            items={testItems}
          />
        );
      }

      render(<ControlledVerticalTabs />);

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      tab1.focus();

      // Arrow down to tab 2
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();

      // Arrow down to tab 3
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveFocus();

      // Arrow up to tab 2
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
    });

    it('respects custom tabListWidth', () => {
      const { container } = render(
        <VerticalTabs
          defaultValue="tab1"
          items={testItems}
          tabListWidth="300px"
        />
      );

      const tabsList = container.querySelector('[role="tablist"]');
      expect(tabsList).toHaveStyle({ width: '300px' });
    });

    it('calls onValueChange callback', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();

      function ControlledVerticalTabs() {
        const [value, setValue] = React.useState('tab1');
        return (
          <VerticalTabs
            value={value}
            onValueChange={(newValue) => {
              setValue(newValue);
              onValueChange(newValue);
            }}
            items={testItems}
          />
        );
      }

      render(<ControlledVerticalTabs />);

      await user.click(screen.getByRole('tab', { name: 'Tab 3' }));

      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalledWith('tab3');
      });
    });

    it('renders vertical tabs with icons and badges', () => {
      const itemsWithIconsAndBadges = [
        {
          value: 'tab1',
          label: 'Tab 1',
          content: 'Content 1',
          icon: <span data-testid="v-icon-1">📧</span>,
          badge: <span data-testid="v-badge-1">5</span>,
        },
        {
          value: 'tab2',
          label: 'Tab 2',
          content: 'Content 2',
        },
      ];

      render(
        <VerticalTabs defaultValue="tab1" items={itemsWithIconsAndBadges} />
      );

      expect(screen.getByTestId('v-icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('v-badge-1')).toBeInTheDocument();
    });
  });

  describe('Custom Class Names', () => {
    it('applies custom className to TabsList', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('custom-tabs-list');
    });

    it('applies custom className to TabsTrigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab).toHaveClass('custom-trigger');
    });

    it('applies custom className to TabsContent', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content">
            Content 1
          </TabsContent>
        </Tabs>
      );

      const tabPanel = container.querySelector('[role="tabpanel"]');
      expect(tabPanel).toHaveClass('custom-content');
    });
  });

  describe('Edge Cases', () => {
    it('handles single tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Only Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Only Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: 'Only Tab' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Only Content')).toBeInTheDocument();
    });

    it('handles many tabs', () => {
      const manyTabs = Array.from({ length: 10 }, (_, i) => ({
        value: `tab${i + 1}`,
        label: `Tab ${i + 1}`,
      }));

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            {manyTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {manyTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              Content {tab.value}
            </TabsContent>
          ))}
        </Tabs>
      );

      expect(screen.getAllByRole('tab')).toHaveLength(10);
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');
    });

    it('handles tab with empty content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1"></TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('handles rapid tab switching', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      // Rapidly click through tabs
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      await user.click(screen.getByRole('tab', { name: 'Tab 3' }));
      await user.click(screen.getByRole('tab', { name: 'Tab 1' }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');
        expect(screen.getByText('Content 1')).toBeInTheDocument();
      });
    });
  });
});
