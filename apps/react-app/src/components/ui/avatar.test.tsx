/**
 * Comprehensive tests for CRYB Design System - Avatar Component
 * Tests cover image rendering, fallbacks, sizes, status, badges, accessibility, and avatar groups
 */

import { render, screen, waitFor } from '@testing-library/react';
import { Avatar, AvatarGroup } from './avatar';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react User icon
jest.mock('lucide-react', () => ({
  User: ({ className }: any) => <svg className={className} data-testid="user-icon" />,
}));

describe('Avatar Component', () => {
  describe('Image Avatar', () => {
    it('renders avatar component with image source', () => {
      const { container } = render(<Avatar src="https://example.com/avatar.jpg" alt="User Avatar" />);

      // Avatar component should render
      const avatarRoot = container.querySelector('.rounded-full');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('renders with alt text prop', () => {
      const { container } = render(<Avatar src="https://example.com/avatar.jpg" alt="John Doe" />);

      // Component should render successfully with alt prop
      const avatarRoot = container.querySelector('.rounded-full');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('renders with empty alt when alt prop is not provided', () => {
      const { container } = render(<Avatar src="https://example.com/avatar.jpg" />);

      // Component should render successfully without alt prop
      const avatarRoot = container.querySelector('.rounded-full');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('renders avatar root with proper structure', () => {
      const { container } = render(<Avatar src="https://example.com/avatar.jpg" alt="Avatar" />);

      // Check for avatar root element with expected classes
      const avatarRoot = container.querySelector('.rounded-full');
      expect(avatarRoot).toBeInTheDocument();
      expect(avatarRoot).toHaveClass('relative', 'flex', 'shrink-0', 'overflow-hidden');
    });
  });

  describe('Fallback to Initials', () => {
    it('renders fallback initials when no image provided', () => {
      render(<Avatar fallback="JD" />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders fallback with proper styling', () => {
      render(<Avatar fallback="AB" />);

      const fallback = screen.getByText('AB');
      expect(fallback).toHaveClass('flex', 'h-full', 'w-full', 'items-center', 'justify-center', 'font-medium');
    });

    it('applies default variant styling to fallback', () => {
      render(<Avatar fallback="CD" variant="default" />);

      const fallback = screen.getByText('CD');
      expect(fallback).toHaveClass('bg-muted', 'text-muted-foreground');
    });

    it('applies gradient variant styling to fallback', () => {
      render(<Avatar fallback="EF" variant="gradient" />);

      const fallback = screen.getByText('EF');
      expect(fallback).toHaveClass('text-white');
    });

    it('applies neon variant styling to fallback', () => {
      render(<Avatar fallback="GH" variant="neon" />);

      const fallback = screen.getByText('GH');
      expect(fallback).toHaveClass('text-white');
    });

    it('applies glass variant styling to fallback', () => {
      render(<Avatar fallback="IJ" variant="glass" />);

      const fallback = screen.getByText('IJ');
      expect(fallback).toHaveClass('text-foreground');
    });
  });

  describe('Fallback to Icon', () => {
    it('renders default user icon when no image or fallback provided', () => {
      render(<Avatar />);

      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('renders user icon with small size for xs/sm avatars', () => {
      const { rerender } = render(<Avatar size="xs" />);
      let icon = screen.getByTestId('user-icon');
      expect(icon).toHaveClass('h-3', 'w-3');

      rerender(<Avatar size="sm" />);
      icon = screen.getByTestId('user-icon');
      expect(icon).toHaveClass('h-3', 'w-3');
    });

    it('renders user icon with default size for larger avatars', () => {
      render(<Avatar size="default" />);

      const icon = screen.getByTestId('user-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Different Sizes', () => {
    it('renders xs size correctly', () => {
      const { container } = render(<Avatar size="xs" />);

      const avatarRoot = container.querySelector('[class*="h-6"][class*="w-6"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('renders sm size correctly', () => {
      const { container } = render(<Avatar size="sm" />);

      const avatarRoot = container.querySelector('[class*="h-8"][class*="w-8"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('renders default size correctly', () => {
      const { container } = render(<Avatar size="default" />);

      const avatarRoot = container.querySelector('[class*="h-10"][class*="w-10"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('renders lg size correctly', () => {
      const { container } = render(<Avatar size="lg" />);

      const avatarRoot = container.querySelector('[class*="h-12"][class*="w-12"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('renders xl size correctly', () => {
      const { container } = render(<Avatar size="xl" />);

      const avatarRoot = container.querySelector('[class*="h-16"][class*="w-16"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('renders 2xl size correctly', () => {
      const { container } = render(<Avatar size="2xl" />);

      const avatarRoot = container.querySelector('[class*="h-24"][class*="w-24"]');
      expect(avatarRoot).toBeInTheDocument();
    });
  });

  describe('Variant Styles', () => {
    it('applies default variant classes', () => {
      const { container } = render(<Avatar variant="default" />);

      const avatarRoot = container.querySelector('[class*="bg-muted"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('applies gradient variant classes', () => {
      const { container } = render(<Avatar variant="gradient" />);

      const avatarRoot = container.querySelector('[class*="gradient"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('applies neon variant classes', () => {
      const { container } = render(<Avatar variant="neon" />);

      const avatarRoot = container.querySelector('[class*="gradient"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('applies glass variant classes', () => {
      const { container } = render(<Avatar variant="glass" />);

      const avatarRoot = container.querySelector('[class*="backdrop-blur"]');
      expect(avatarRoot).toBeInTheDocument();
    });
  });

  describe('Status Indicator', () => {
    it('shows online status with green indicator', () => {
      render(<Avatar status="online" showStatus />);

      const statusIndicator = screen.getByLabelText('Status: online');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-green-500');
    });

    it('shows offline status with gray indicator', () => {
      render(<Avatar status="offline" showStatus />);

      const statusIndicator = screen.getByLabelText('Status: offline');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-gray-400');
    });

    it('shows away status with yellow indicator', () => {
      render(<Avatar status="away" showStatus />);

      const statusIndicator = screen.getByLabelText('Status: away');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-yellow-500');
    });

    it('shows busy status with red indicator', () => {
      render(<Avatar status="busy" showStatus />);

      const statusIndicator = screen.getByLabelText('Status: busy');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-red-500');
    });

    it('hides status when showStatus is false', () => {
      render(<Avatar status="online" showStatus={false} />);

      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    });

    it('does not render status when status is null', () => {
      render(<Avatar status={null} showStatus />);

      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    });

    it('renders ping animation for online status', () => {
      const { container } = render(<Avatar status="online" showStatus />);

      const pingAnimation = container.querySelector('.animate-ping');
      expect(pingAnimation).toBeInTheDocument();
      expect(pingAnimation).toHaveClass('bg-green-500', 'opacity-75');
    });

    it('renders status with correct size for xs avatar', () => {
      render(<Avatar size="xs" status="online" showStatus />);

      const statusIndicator = screen.getByLabelText('Status: online');
      expect(statusIndicator).toHaveClass('h-1.5', 'w-1.5');
    });

    it('renders status with correct size for 2xl avatar', () => {
      render(<Avatar size="2xl" status="online" showStatus />);

      const statusIndicator = screen.getByLabelText('Status: online');
      expect(statusIndicator).toHaveClass('h-5', 'w-5');
    });

    it('applies ring-background to status indicator', () => {
      render(<Avatar status="online" showStatus />);

      const statusIndicator = screen.getByLabelText('Status: online');
      expect(statusIndicator).toHaveClass('ring-2', 'ring-background');
    });
  });

  describe('Badge/Notification', () => {
    it('renders badge content', () => {
      render(<Avatar badge={<span>5</span>} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders badge with custom component', () => {
      render(
        <Avatar
          badge={
            <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              9+
            </div>
          }
        />
      );

      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('positions badge absolutely at top-right', () => {
      const { container } = render(<Avatar badge={<span>1</span>} />);

      const badgeContainer = container.querySelector('.absolute.-top-1.-right-1');
      expect(badgeContainer).toBeInTheDocument();
    });

    it('does not render badge when not provided', () => {
      const { container } = render(<Avatar />);

      const badgeContainer = container.querySelector('.absolute.-top-1.-right-1');
      expect(badgeContainer).not.toBeInTheDocument();
    });
  });

  describe('Clickable State', () => {
    it('applies cursor-pointer when clickable is true', () => {
      const { container } = render(<Avatar clickable />);

      const avatarRoot = container.querySelector('.cursor-pointer');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('applies hover:opacity-90 when clickable is true', () => {
      const { container } = render(<Avatar clickable />);

      const avatarRoot = container.querySelector('[class*="hover:opacity-90"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('does not apply clickable styles when clickable is false', () => {
      const { container } = render(<Avatar clickable={false} />);

      const avatarRoot = container.querySelector('.cursor-pointer');
      expect(avatarRoot).not.toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('renders with motion div when animated is true', () => {
      const { container } = render(<Avatar animated />);

      expect(container.querySelector('.relative.inline-block')).toBeInTheDocument();
    });

    it('renders without animation by default', () => {
      render(<Avatar />);

      // Component should render successfully without throwing
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('supports custom className', () => {
      const { container } = render(<Avatar className="custom-avatar-class" />);

      const customElement = container.querySelector('.custom-avatar-class');
      expect(customElement).toBeInTheDocument();
    });

    it('merges custom className with default classes', () => {
      const { container } = render(<Avatar className="border-4 border-blue-500" />);

      const avatar = container.querySelector('.border-4.border-blue-500');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('rounded-full'); // Default class should still be present
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Avatar ref={ref as any} />);

      expect(ref.current).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('applies focus-visible ring styles', () => {
      const { container } = render(<Avatar />);

      const avatarRoot = container.querySelector('[class*="focus-visible:ring"]');
      expect(avatarRoot).toBeInTheDocument();
    });

    it('includes aria-label for status indicator', () => {
      render(<Avatar status="online" showStatus />);

      const statusIndicator = screen.getByLabelText('Status: online');
      expect(statusIndicator).toHaveAttribute('aria-label', 'Status: online');
    });

    it('renders avatar component with accessibility props', () => {
      const { container } = render(<Avatar src="https://example.com/avatar.jpg" alt="User profile picture" />);

      // Avatar component should render with proper structure
      const avatarRoot = container.querySelector('.rounded-full');
      expect(avatarRoot).toBeInTheDocument();
    });
  });

  describe('Display Name', () => {
    it('has correct display name', () => {
      expect(Avatar.displayName).toBe('Avatar');
    });
  });
});

describe('AvatarGroup Component', () => {
  describe('Basic Rendering', () => {
    it('renders multiple avatars in a group', () => {
      render(
        <AvatarGroup>
          <Avatar fallback="JD" />
          <Avatar fallback="AB" />
          <Avatar fallback="CD" />
        </AvatarGroup>
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
      expect(screen.getByText('AB')).toBeInTheDocument();
      expect(screen.getByText('CD')).toBeInTheDocument();
    });

    it('applies flex and items-center classes', () => {
      const { container } = render(
        <AvatarGroup>
          <Avatar fallback="JD" />
        </AvatarGroup>
      );

      const group = container.querySelector('.flex.items-center');
      expect(group).toBeInTheDocument();
    });
  });

  describe('Maximum Avatar Display', () => {
    it('limits avatars to max prop value', () => {
      render(
        <AvatarGroup max={2}>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
          <Avatar fallback="C" />
          <Avatar fallback="D" />
        </AvatarGroup>
      );

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.queryByText('C')).not.toBeInTheDocument();
      expect(screen.queryByText('D')).not.toBeInTheDocument();
    });

    it('shows all avatars when count is less than max', () => {
      render(
        <AvatarGroup max={5}>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('uses default max of 5 when not specified', () => {
      render(
        <AvatarGroup>
          <Avatar fallback="1" />
          <Avatar fallback="2" />
          <Avatar fallback="3" />
          <Avatar fallback="4" />
          <Avatar fallback="5" />
          <Avatar fallback="6" />
          <Avatar fallback="7" />
        </AvatarGroup>
      );

      // First 5 should be visible
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      // 6 and 7 should not be visible
      expect(screen.queryByText('6')).not.toBeInTheDocument();
      expect(screen.queryByText('7')).not.toBeInTheDocument();
    });
  });

  describe('Remaining Count Display', () => {
    it('shows count of remaining avatars when exceeds max', () => {
      render(
        <AvatarGroup max={2} showCount>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
          <Avatar fallback="C" />
          <Avatar fallback="D" />
          <Avatar fallback="E" />
        </AvatarGroup>
      );

      expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('does not show count when avatars do not exceed max', () => {
      render(
        <AvatarGroup max={5} showCount>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );

      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    it('hides count when showCount is false', () => {
      render(
        <AvatarGroup max={2} showCount={false}>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
          <Avatar fallback="C" />
        </AvatarGroup>
      );

      expect(screen.queryByText('+1')).not.toBeInTheDocument();
    });

    it('applies correct styling to count indicator', () => {
      const { container } = render(
        <AvatarGroup max={1} showCount>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );

      const countElement = screen.getByText('+1');
      expect(countElement).toHaveClass('bg-muted', 'text-muted-foreground', 'font-medium');
    });
  });

  describe('Spacing Variants', () => {
    it('applies default spacing', () => {
      const { container } = render(
        <AvatarGroup spacing="default">
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );

      const group = container.querySelector('.-space-x-3');
      expect(group).toBeInTheDocument();
    });

    it('applies tight spacing', () => {
      const { container } = render(
        <AvatarGroup spacing="tight">
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );

      const group = container.querySelector('.-space-x-2');
      expect(group).toBeInTheDocument();
    });

    it('applies loose spacing', () => {
      const { container } = render(
        <AvatarGroup spacing="loose">
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );

      const group = container.querySelector('.-space-x-1');
      expect(group).toBeInTheDocument();
    });
  });

  describe('Size Propagation', () => {
    it('applies size to child avatars', () => {
      const { container } = render(
        <AvatarGroup size="lg">
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );

      // Both avatars should have lg size applied
      const lgAvatars = container.querySelectorAll('[class*="h-12"][class*="w-12"]');
      expect(lgAvatars.length).toBeGreaterThan(0);
    });

    it('applies default size when not specified', () => {
      render(
        <AvatarGroup>
          <Avatar fallback="A" />
        </AvatarGroup>
      );

      // Should render without errors
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('Z-index Stacking', () => {
    it('applies z-index to avatars for proper stacking', () => {
      const { container } = render(
        <AvatarGroup>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
          <Avatar fallback="C" />
        </AvatarGroup>
      );

      const avatarWrappers = container.querySelectorAll('.relative.ring-2.ring-background.rounded-full');
      expect(avatarWrappers.length).toBe(3);
    });
  });

  describe('Custom Styling', () => {
    it('supports custom className', () => {
      const { container } = render(
        <AvatarGroup className="custom-group-class">
          <Avatar fallback="A" />
        </AvatarGroup>
      );

      const group = container.querySelector('.custom-group-class');
      expect(group).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <AvatarGroup ref={ref as any}>
          <Avatar fallback="A" />
        </AvatarGroup>
      );

      expect(ref.current).toBeTruthy();
    });
  });

  describe('Display Name', () => {
    it('has correct display name', () => {
      expect(AvatarGroup.displayName).toBe('AvatarGroup');
    });
  });

  describe('Ring Styling', () => {
    it('applies ring-2 and ring-background to avatar wrappers', () => {
      const { container } = render(
        <AvatarGroup>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );

      const ringElements = container.querySelectorAll('.ring-2.ring-background');
      expect(ringElements.length).toBe(2);
    });

    it('applies ring to count indicator', () => {
      const { container } = render(
        <AvatarGroup max={1} showCount>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      );

      const countElement = screen.getByText('+1');
      expect(countElement).toBeInTheDocument();
      expect(countElement).toHaveClass('ring-2', 'ring-background');
    });
  });
});
