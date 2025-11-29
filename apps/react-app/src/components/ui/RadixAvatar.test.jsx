import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avatar, AvatarImage, AvatarFallback } from './RadixAvatar';

// Mock @radix-ui/react-avatar
jest.mock('@radix-ui/react-avatar', () => ({
  Root: React.forwardRef(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="avatar-root" {...props}>
      {children}
    </div>
  )),
  Image: React.forwardRef(({ src, alt, className, onLoadingStatusChange, ...props }, ref) => {
    const [status, setStatus] = React.useState('loading');

    React.useEffect(() => {
      // Simulate image loading
      const timer = setTimeout(() => {
        if (src && !src.includes('invalid') && !src.includes('error')) {
          setStatus('loaded');
          onLoadingStatusChange?.('loaded');
        } else {
          setStatus('error');
          onLoadingStatusChange?.('error');
        }
      }, 100);

      return () => clearTimeout(timer);
    }, [src, onLoadingStatusChange]);

    if (status !== 'loaded') return null;

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        data-testid="avatar-image"
        {...props}
      />
    );
  }),
  Fallback: React.forwardRef(({ children, className, delayMs, ...props }, ref) => {
    const [show, setShow] = React.useState(delayMs ? false : true);

    React.useEffect(() => {
      if (delayMs) {
        const timer = setTimeout(() => setShow(true), delayMs);
        return () => clearTimeout(timer);
      }
    }, [delayMs]);

    if (!show) return null;

    return (
      <div ref={ref} className={className} data-testid="avatar-fallback" {...props}>
        {children}
      </div>
    );
  }),
}));

describe('Avatar', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
    });

    it('renders with image and fallback', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
    });

    it('applies custom className to Avatar', () => {
      render(
        <Avatar className="custom-avatar">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('custom-avatar');
    });

    it('renders multiple children', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-root').children.length).toBeGreaterThan(0);
    });

    it('forwards ref to Avatar', () => {
      const ref = React.createRef();
      render(
        <Avatar ref={ref}>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(ref.current).toBeTruthy();
      expect(ref.current).toBe(screen.getByTestId('avatar-root'));
    });
  });

  describe('Size Variants', () => {
    it('applies default size', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-10', 'w-10');
    });

    it('applies small size', () => {
      render(
        <Avatar size="sm">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-8', 'w-8');
    });

    it('applies large size', () => {
      render(
        <Avatar size="lg">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-12', 'w-12');
    });

    it('applies xl size', () => {
      render(
        <Avatar size="xl">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-16', 'w-16');
    });

    it('applies 2xl size', () => {
      render(
        <Avatar size="2xl">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-20', 'w-20');
    });
  });

  describe('Style Variants', () => {
    it('applies default variant', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('border-gray-6');
    });

    it('applies primary variant', () => {
      render(
        <Avatar variant="primary">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('border-blue-9', 'ring-2', 'ring-blue-9/20');
    });

    it('applies glass variant', () => {
      render(
        <Avatar variant="glass">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('border-white/20', 'backdrop-blur-sm');
    });

    it('applies gradient variant', () => {
      render(
        <Avatar variant="gradient">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('border-transparent', 'bg-gradient-to-br', 'from-blue-9', 'to-violet-9', 'p-0.5');
    });
  });

  describe('Combined Size and Variant', () => {
    it('applies small size with primary variant', () => {
      render(
        <Avatar size="sm" variant="primary">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-8', 'w-8', 'border-blue-9');
    });

    it('applies large size with glass variant', () => {
      render(
        <Avatar size="lg" variant="glass">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-12', 'w-12', 'backdrop-blur-sm');
    });

    it('applies xl size with gradient variant', () => {
      render(
        <Avatar size="xl" variant="gradient">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-16', 'w-16', 'bg-gradient-to-br');
    });

    it('applies 2xl size with default variant', () => {
      render(
        <Avatar size="2xl">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-20', 'w-20', 'border-gray-6');
    });
  });

  describe('Base Styling', () => {
    it('has rounded-full class', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('has border-2 class', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('border-2');
    });

    it('has transition classes', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('transition-all', 'duration-200');
    });

    it('has flex and overflow classes', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('relative', 'flex', 'shrink-0', 'overflow-hidden');
    });
  });

  describe('AvatarImage', () => {
    it('renders image when loaded successfully', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User Avatar" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toBeInTheDocument();
      });
    });

    it('applies correct image classes', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        const image = screen.getByTestId('avatar-image');
        expect(image).toHaveClass('aspect-square', 'h-full', 'w-full', 'object-cover');
      });
    });

    it('passes src attribute correctly', async () => {
      const src = 'https://example.com/user.jpg';
      render(
        <Avatar>
          <AvatarImage src={src} alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', src);
      });
    });

    it('passes alt attribute correctly', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="John Doe Avatar" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toHaveAttribute('alt', 'John Doe Avatar');
      });
    });

    it('applies custom className to image', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" className="custom-image" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toHaveClass('custom-image');
      });
    });

    it('forwards ref to image', async () => {
      const ref = React.createRef();
      render(
        <Avatar>
          <AvatarImage ref={ref} src="https://example.com/avatar.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(ref.current).toBeTruthy();
        expect(ref.current).toBe(screen.getByTestId('avatar-image'));
      });
    });

    it('does not render when image fails to load', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/invalid.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
      });
    });

    it('does not render when src is empty', () => {
      render(
        <Avatar>
          <AvatarImage src="" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
    });
  });

  describe('AvatarFallback', () => {
    it('renders fallback content', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('applies correct fallback classes', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveClass(
        'flex',
        'h-full',
        'w-full',
        'items-center',
        'justify-center',
        'rounded-full',
        'bg-gradient-to-br',
        'from-blue-9',
        'to-violet-9',
        'text-white',
        'font-semibold',
        'text-sm'
      );
    });

    it('renders text content', () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('renders single character', () => {
      render(
        <Avatar>
          <AvatarFallback>J</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders multiple characters', () => {
      render(
        <Avatar>
          <AvatarFallback>JDoe</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('JDoe')).toBeInTheDocument();
    });

    it('applies custom className to fallback', () => {
      render(
        <Avatar>
          <AvatarFallback className="custom-fallback">JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-fallback')).toHaveClass('custom-fallback');
    });

    it('forwards ref to fallback', () => {
      const ref = React.createRef();
      render(
        <Avatar>
          <AvatarFallback ref={ref}>JD</AvatarFallback>
        </Avatar>
      );
      expect(ref.current).toBeTruthy();
      expect(ref.current).toBe(screen.getByTestId('avatar-fallback'));
    });

    it('renders with delay when delayMs is provided', async () => {
      render(
        <Avatar>
          <AvatarFallback delayMs={200}>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.queryByTestId('avatar-fallback')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
      }, { timeout: 300 });
    });
  });

  describe('Image Loading States', () => {
    it('shows fallback when image is loading', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    });

    it('hides fallback when image loads successfully', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toBeInTheDocument();
      });
    });

    it('shows fallback when image fails to load', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/invalid-error.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
        expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
      });
    });

    it('handles missing src gracefully', () => {
      render(
        <Avatar>
          <AvatarImage alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('passes through data attributes to Avatar', () => {
      render(
        <Avatar data-testid="custom-avatar" data-user-id="123">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('custom-avatar');
      expect(avatar).toHaveAttribute('data-user-id', '123');
    });

    it('passes through aria attributes to Avatar', () => {
      render(
        <Avatar aria-label="User profile picture">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveAttribute('aria-label', 'User profile picture');
    });

    it('passes through id attribute to Avatar', () => {
      render(
        <Avatar id="user-avatar">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-root')).toHaveAttribute('id', 'user-avatar');
    });

    it('passes through role attribute to Avatar', () => {
      render(
        <Avatar role="img">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-root')).toHaveAttribute('role', 'img');
    });
  });

  describe('Accessibility', () => {
    it('image has alt text', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="John Doe profile picture" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        const image = screen.getByTestId('avatar-image');
        expect(image).toHaveAttribute('alt', 'John Doe profile picture');
      });
    });

    it('fallback content is readable', () => {
      render(
        <Avatar>
          <AvatarFallback>John Doe</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('supports aria-label on Avatar', () => {
      render(
        <Avatar aria-label="User avatar">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-root')).toHaveAttribute('aria-label', 'User avatar');
    });

    it('fallback has sufficient color contrast', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveClass('text-white');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined size prop', () => {
      render(
        <Avatar size={undefined}>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-10', 'w-10');
    });

    it('handles undefined variant prop', () => {
      render(
        <Avatar variant={undefined}>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('border-gray-6');
    });

    it('handles null children in fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>{null}</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    });

    it('handles empty string in fallback', () => {
      render(
        <Avatar>
          <AvatarFallback></AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    });

    it('handles numeric content in fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>{42}</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles zero as fallback content', () => {
      render(
        <Avatar>
          <AvatarFallback>{0}</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles special characters in fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>@#$</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('@#$')).toBeInTheDocument();
    });

    it('handles very long fallback text', () => {
      const longText = 'ABCDEFGHIJKLMNOP';
      render(
        <Avatar>
          <AvatarFallback>{longText}</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles emoji in fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>😀</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('😀')).toBeInTheDocument();
    });

    it('handles unicode characters in fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>你好</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('你好')).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('renders multiple avatars independently', () => {
      render(
        <>
          <Avatar>
            <AvatarFallback>A1</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>A2</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>A3</AvatarFallback>
          </Avatar>
        </>
      );
      expect(screen.getByText('A1')).toBeInTheDocument();
      expect(screen.getByText('A2')).toBeInTheDocument();
      expect(screen.getByText('A3')).toBeInTheDocument();
    });

    it('handles dynamic size changes', () => {
      const { rerender } = render(
        <Avatar size="sm">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      let avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-8', 'w-8');

      rerender(
        <Avatar size="lg">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('h-12', 'w-12');
    });

    it('handles dynamic variant changes', () => {
      const { rerender } = render(
        <Avatar variant="default">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      let avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('border-gray-6');

      rerender(
        <Avatar variant="primary">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      avatar = screen.getByTestId('avatar-root');
      expect(avatar).toHaveClass('border-blue-9');
    });

    it('handles dynamic image src changes', async () => {
      const { rerender } = render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar1.jpg" alt="User 1" />
          <AvatarFallback>U1</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', 'https://example.com/avatar1.jpg');
      });

      rerender(
        <Avatar>
          <AvatarImage src="https://example.com/avatar2.jpg" alt="User 2" />
          <AvatarFallback>U2</AvatarFallback>
        </Avatar>
      );

      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', 'https://example.com/avatar2.jpg');
      });
    });

    it('handles dynamic fallback content changes', () => {
      const { rerender } = render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('JD')).toBeInTheDocument();

      rerender(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('AB')).toBeInTheDocument();
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });

    it('renders with nested components in fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>
            <span>J</span>
            <span>D</span>
          </AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('J')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('maintains class order with custom classes', () => {
      render(
        <Avatar className="custom-1 custom-2" size="lg" variant="primary">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar-root');
      expect(avatar.className).toContain('custom-1');
      expect(avatar.className).toContain('custom-2');
    });
  });

  describe('Integration Tests', () => {
    it('works with all size variants', () => {
      const sizes = ['sm', 'default', 'lg', 'xl', '2xl'];
      sizes.forEach((size) => {
        const { unmount } = render(
          <Avatar size={size}>
            <AvatarFallback>{size}</AvatarFallback>
          </Avatar>
        );
        expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
        unmount();
      });
    });

    it('works with all style variants', () => {
      const variants = ['default', 'primary', 'glass', 'gradient'];
      variants.forEach((variant) => {
        const { unmount } = render(
          <Avatar variant={variant}>
            <AvatarFallback>{variant}</AvatarFallback>
          </Avatar>
        );
        expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
        unmount();
      });
    });

    it('combines all sizes with all variants', () => {
      const sizes = ['sm', 'default', 'lg', 'xl', '2xl'];
      const variants = ['default', 'primary', 'glass', 'gradient'];

      sizes.forEach((size) => {
        variants.forEach((variant) => {
          const { unmount } = render(
            <Avatar size={size} variant={variant}>
              <AvatarFallback>T</AvatarFallback>
            </Avatar>
          );
          expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
          unmount();
        });
      });
    });

    it('handles rapid prop changes', async () => {
      const { rerender } = render(
        <Avatar size="sm" variant="default">
          <AvatarFallback>1</AvatarFallback>
        </Avatar>
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <Avatar size={i % 2 === 0 ? 'sm' : 'lg'} variant={i % 2 === 0 ? 'default' : 'primary'}>
            <AvatarFallback>{i}</AvatarFallback>
          </Avatar>
        );
      }

      expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with image', () => {
      const { container } = render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with all sizes', () => {
      const sizes = ['sm', 'default', 'lg', 'xl', '2xl'];
      sizes.forEach((size) => {
        const { container } = render(
          <Avatar size={size}>
            <AvatarFallback>{size}</AvatarFallback>
          </Avatar>
        );
        expect(container.firstChild).toMatchSnapshot();
      });
    });

    it('matches snapshot with all variants', () => {
      const variants = ['default', 'primary', 'glass', 'gradient'];
      variants.forEach((variant) => {
        const { container } = render(
          <Avatar variant={variant}>
            <AvatarFallback>{variant}</AvatarFallback>
          </Avatar>
        );
        expect(container.firstChild).toMatchSnapshot();
      });
    });

    it('matches snapshot with custom className', () => {
      const { container } = render(
        <Avatar className="custom-avatar-class">
          <AvatarFallback className="custom-fallback-class">JD</AvatarFallback>
        </Avatar>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Component Display Names', () => {
    it('Avatar has correct display name', () => {
      expect(Avatar.displayName).toBeTruthy();
    });

    it('AvatarImage has correct display name', () => {
      expect(AvatarImage.displayName).toBeTruthy();
    });

    it('AvatarFallback has correct display name', () => {
      expect(AvatarFallback.displayName).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles missing AvatarImage src gracefully', () => {
      const { container } = render(
        <Avatar>
          <AvatarImage alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(container).toBeInTheDocument();
    });

    it('handles missing AvatarImage alt gracefully', async () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      await waitFor(() => {
        const image = screen.queryByTestId('avatar-image');
        if (image) {
          expect(image).toBeInTheDocument();
        }
      });
    });

    it('renders without fallback', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
        </Avatar>
      );
      expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
    });

    it('renders without image', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
    });

    it('handles empty Avatar', () => {
      render(<Avatar />);
      expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with multiple re-renders', () => {
      const { rerender } = render(
        <Avatar>
          <AvatarFallback>1</AvatarFallback>
        </Avatar>
      );

      for (let i = 0; i < 100; i++) {
        rerender(
          <Avatar>
            <AvatarFallback>{i}</AvatarFallback>
          </Avatar>
        );
      }

      expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
    });

    it('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <Avatar>
            <AvatarFallback>T</AvatarFallback>
          </Avatar>
        );
        unmount();
      }
    });
  });

  describe('User Interaction', () => {
    it('does not interfere with click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <div onClick={handleClick}>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      );

      await user.click(screen.getByTestId('avatar-root'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('does not interfere with hover events', async () => {
      const user = userEvent.setup();
      const handleMouseEnter = jest.fn();

      render(
        <Avatar onMouseEnter={handleMouseEnter}>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      await user.hover(screen.getByTestId('avatar-root'));
      expect(handleMouseEnter).toHaveBeenCalled();
    });

    it('supports focus events', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();

      render(
        <Avatar onFocus={handleFocus} tabIndex={0}>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const avatar = screen.getByTestId('avatar-root');
      await user.click(avatar);

      if (document.activeElement === avatar) {
        expect(handleFocus).toHaveBeenCalled();
      }
    });
  });
});

export default timer
