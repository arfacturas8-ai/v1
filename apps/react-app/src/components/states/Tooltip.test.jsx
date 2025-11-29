import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Tooltip } from './Tooltip';

jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, role, initial, animate, exit, transition, ...props }, ref) => (
      <div ref={ref} className={className} role={role} {...props}>
        {children}
      </div>
    ))
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

describe('Tooltip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render children without tooltip initially', () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.getByText('Hover me')).toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should render tooltip content when visible', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Test tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Test tooltip');
      });
    });

    it('should render with custom content', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Custom message" delay={0}>
          <span>Trigger</span>
        </Tooltip>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Custom message');
      });
    });

    it('should render with complex children', () => {
      render(
        <Tooltip content="Tooltip">
          <div>
            <span>Complex</span>
            <button>Child</button>
          </div>
        </Tooltip>
      );

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
  });

  describe('Hover Trigger', () => {
    it('should show tooltip on mouse enter', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Hover tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Hover tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const button = screen.getByText('Hover me');
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      await user.unhover(button);

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should handle rapid hover on/off', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Tooltip" delay={100}>
          <button>Hover me</button>
        </Tooltip>
      );

      const button = screen.getByText('Hover me');

      await user.hover(button);
      act(() => {
        jest.advanceTimersByTime(50);
      });

      await user.unhover(button);
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should handle multiple hover cycles', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const button = screen.getByText('Hover me');

      for (let i = 0; i < 3; i++) {
        await user.hover(button);
        await waitFor(() => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        });

        await user.unhover(button);
        await waitFor(() => {
          expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Focus Trigger', () => {
    it('should show tooltip on focus', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Focus tooltip" delay={0}>
          <button>Focus me</button>
        </Tooltip>
      );

      await user.tab();

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on blur', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <>
          <Tooltip content="Focus tooltip" delay={0}>
            <button>Focus me</button>
          </Tooltip>
          <button>Other button</button>
        </>
      );

      await user.tab();

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      await user.tab();

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should show tooltip when focusing with keyboard', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Keyboard tooltip" delay={0}>
          <button>Focus me</button>
        </Tooltip>
      );

      const button = screen.getByText('Focus me');
      button.focus();

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should handle focus and blur events independently from hover', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Tooltip" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      const button = screen.getByText('Button');

      await user.hover(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      button.focus();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      await user.unhover(button);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      button.blur();
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Position Variants', () => {
    it('should apply top position classes by default', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Top tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('bottom-full');
        expect(tooltip).toHaveClass('left-1/2');
        expect(tooltip).toHaveClass('-translate-x-1/2');
        expect(tooltip).toHaveClass('mb-2');
      });
    });

    it('should apply bottom position classes', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Bottom tooltip" position="bottom" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('top-full');
        expect(tooltip).toHaveClass('left-1/2');
        expect(tooltip).toHaveClass('-translate-x-1/2');
        expect(tooltip).toHaveClass('mt-2');
      });
    });

    it('should apply left position classes', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Left tooltip" position="left" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('right-full');
        expect(tooltip).toHaveClass('top-1/2');
        expect(tooltip).toHaveClass('-translate-y-1/2');
        expect(tooltip).toHaveClass('mr-2');
      });
    });

    it('should apply right position classes', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Right tooltip" position="right" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('left-full');
        expect(tooltip).toHaveClass('top-1/2');
        expect(tooltip).toHaveClass('-translate-y-1/2');
        expect(tooltip).toHaveClass('ml-2');
      });
    });

    it('should maintain position when toggling visibility', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Positioned tooltip" position="left" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const button = screen.getByText('Hover me');

      await user.hover(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveClass('right-full');
      });

      await user.unhover(button);
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveClass('right-full');
      });
    });
  });

  describe('Delay Timing', () => {
    it('should respect default delay of 200ms', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Delayed tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(199);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should respect custom delay', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Custom delay" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should show immediately with zero delay', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Immediate tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should cancel delay timer on mouse leave before timeout', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Cancelled tooltip" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const button = screen.getByText('Hover me');
      await user.hover(button);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await user.unhover(button);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should cancel delay timer on blur before timeout', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <>
          <Tooltip content="Cancelled tooltip" delay={500}>
            <button>Focus me</button>
          </Tooltip>
          <button>Other</button>
        </>
      );

      await user.tab();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await user.tab();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Styling and Classes', () => {
    it('should apply base tooltip styles', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Styled tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveClass('absolute');
        expect(tooltip).toHaveClass('z-50');
        expect(tooltip).toHaveClass('px-3');
        expect(tooltip).toHaveClass('py-2');
        expect(tooltip).toHaveClass('text-sm');
        expect(tooltip).toHaveClass('text-white');
        expect(tooltip).toHaveClass('bg-gray-900');
        expect(tooltip).toHaveClass('rounded-lg');
        expect(tooltip).toHaveClass('shadow-lg');
        expect(tooltip).toHaveClass('whitespace-nowrap');
      });
    });

    it('should maintain wrapper classes', () => {
      const { container } = render(
        <Tooltip content="Tooltip">
          <button>Button</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.relative.inline-block');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have proper z-index for layering', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Layered tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveClass('z-50');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have tooltip role', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Accessible tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Keyboard accessible" delay={0}>
          <button>Focus me</button>
        </Tooltip>
      );

      await user.tab();

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should work with focusable elements', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Tooltip" delay={0}>
          <input type="text" placeholder="Input" />
        </Tooltip>
      );

      const input = screen.getByPlaceholderText('Input');
      input.focus();

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should work with non-focusable elements through hover', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Tooltip" delay={0}>
          <span>Non-focusable</span>
        </Tooltip>
      );

      await user.hover(screen.getByText('Non-focusable'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should maintain focus on trigger element', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Tooltip" delay={0}>
          <button>Focus target</button>
        </Tooltip>
      );

      const button = screen.getByText('Focus target');
      await user.tab();

      expect(button).toHaveFocus();

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      expect(button).toHaveFocus();
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should cleanup timeout on unmount', () => {
      const { unmount } = render(
        <Tooltip content="Tooltip" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      unmount();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should clear timeout when hiding tooltip before delay completes', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Tooltip" delay={1000}>
          <button>Hover me</button>
        </Tooltip>
      );

      const button = screen.getByText('Hover me');
      await user.hover(button);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await user.unhover(button);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should handle multiple rapid mount/unmount cycles', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <Tooltip content="Tooltip" delay={100}>
            <button>Button</button>
          </Tooltip>
        );

        act(() => {
          jest.advanceTimersByTime(50);
        });

        unmount();
      }

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        const tooltip = screen.queryByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('');
      });
    });

    it('should handle very long content', async () => {
      const longContent = 'This is a very long tooltip content that might wrap or be truncated';
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content={longContent} delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent(longContent);
      });
    });

    it('should handle special characters in content', async () => {
      const specialContent = '<script>alert("test")</script> & special chars';
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content={specialContent} delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent(specialContent);
      });
    });

    it('should handle numerical content', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content={12345} delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('12345');
      });
    });

    it('should handle whitespace-only content', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="   " delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should handle zero as delay value', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Immediate" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should handle disabled button as child', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Tooltip" delay={0}>
          <button disabled>Disabled button</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Disabled button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should handle nested interactive elements', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <Tooltip content="Nested tooltip" delay={0}>
          <div>
            <button>Nested button</button>
          </div>
        </Tooltip>
      );

      await user.hover(screen.getByText('Nested button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with multiple tooltips on the page', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <>
          <Tooltip content="First tooltip" delay={0}>
            <button>First</button>
          </Tooltip>
          <Tooltip content="Second tooltip" delay={0}>
            <button>Second</button>
          </Tooltip>
        </>
      );

      await user.hover(screen.getByText('First'));

      await waitFor(() => {
        expect(screen.getByText('First tooltip')).toBeInTheDocument();
        expect(screen.queryByText('Second tooltip')).not.toBeInTheDocument();
      });

      await user.hover(screen.getByText('Second'));

      await waitFor(() => {
        expect(screen.getByText('Second tooltip')).toBeInTheDocument();
      });
    });

    it('should work within a form', async () => {
      const user = userEvent.setup({ delay: null });
      const onSubmit = jest.fn(e => e.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <Tooltip content="Help text" delay={0}>
            <input type="text" placeholder="Username" />
          </Tooltip>
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByPlaceholderText('Username');
      input.focus();

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Help text');
      });
    });

    it('should not interfere with click events on children', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(
        <Tooltip content="Click tooltip" delay={0}>
          <button onClick={handleClick}>Click me</button>
        </Tooltip>
      );

      await user.click(screen.getByText('Click me'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should work with async content updates', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = render(
        <Tooltip content="Initial content" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Initial content');
      });

      rerender(
        <Tooltip content="Updated content" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Updated content');
      });
    });

    it('should work with conditional rendering', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = render(
        <Tooltip content="Tooltip" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      await user.hover(screen.getByText('Button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      rerender(<button>Button</button>);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
});

export default user
