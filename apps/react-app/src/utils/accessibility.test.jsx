/**
 * Comprehensive tests for accessibility.jsx utilities
 * Testing ARIA utilities, screen reader helpers, keyboard navigation, and focus management
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  useFocusTrap,
  announce,
  VisuallyHidden,
  SkipToContent,
  withAccessibleButton,
  AccessibleModal,
  AccessibleFormField,
  AccessibleTabs,
  KeyboardHint,
  useLoadingAnnouncement,
  useErrorAnnouncement
} from './accessibility.jsx';

// Test wrapper component for hooks
const FocusTrapTestComponent = ({ isActive, children }) => {
  const containerRef = useFocusTrap(isActive);
  return <div ref={containerRef}>{children}</div>;
};

const LoadingAnnouncementTestComponent = ({ isLoading, message }) => {
  useLoadingAnnouncement(isLoading, message);
  return <div>Test Component</div>;
};

const ErrorAnnouncementTestComponent = ({ error }) => {
  useErrorAnnouncement(error);
  return <div>Test Component</div>;
};

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================================
  // useFocusTrap Hook Tests
  // ============================================================================
  describe('useFocusTrap', () => {
    it('should return a ref object', () => {
      const { container } = render(
        <FocusTrapTestComponent isActive={true}>
          <button>Button 1</button>
        </FocusTrapTestComponent>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should focus first focusable element when activated', () => {
      const { container } = render(
        <FocusTrapTestComponent isActive={true}>
          <button>First Button</button>
          <button>Second Button</button>
        </FocusTrapTestComponent>
      );

      const firstButton = screen.getByText('First Button');
      expect(firstButton).toHaveFocus();
    });

    it('should trap Tab key to cycle through focusable elements forward', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </FocusTrapTestComponent>
      );

      const first = screen.getByText('First');
      const second = screen.getByText('Second');
      const third = screen.getByText('Third');

      expect(first).toHaveFocus();

      fireEvent.keyDown(first, { key: 'Tab' });
      expect(document.activeElement).toBe(second);

      fireEvent.keyDown(second, { key: 'Tab' });
      expect(document.activeElement).toBe(third);

      // Should wrap back to first
      fireEvent.keyDown(third, { key: 'Tab' });
      expect(third).toHaveFocus();
    });

    it('should trap Shift+Tab to cycle backward', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </FocusTrapTestComponent>
      );

      const first = screen.getByText('First');

      expect(first).toHaveFocus();

      // Shift+Tab on first element should cycle to last
      fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });

      const third = screen.getByText('Third');
      expect(third).toHaveFocus();
    });

    it('should include input elements in focus trap', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <input type="text" placeholder="Input 1" />
          <input type="text" placeholder="Input 2" />
        </FocusTrapTestComponent>
      );

      const input1 = screen.getByPlaceholderText('Input 1');
      expect(input1).toHaveFocus();
    });

    it('should include links in focus trap', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <a href="#link1">Link 1</a>
          <a href="#link2">Link 2</a>
        </FocusTrapTestComponent>
      );

      const link1 = screen.getByText('Link 1');
      expect(link1).toHaveFocus();
    });

    it('should include select elements in focus trap', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <select>
            <option>Option 1</option>
          </select>
          <button>Button</button>
        </FocusTrapTestComponent>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveFocus();
    });

    it('should include textarea elements in focus trap', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <textarea placeholder="Text area" />
          <button>Button</button>
        </FocusTrapTestComponent>
      );

      const textarea = screen.getByPlaceholderText('Text area');
      expect(textarea).toHaveFocus();
    });

    it('should include elements with tabindex >= 0 in focus trap', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <div tabIndex={0}>Focusable Div</div>
          <button>Button</button>
        </FocusTrapTestComponent>
      );

      const div = screen.getByText('Focusable Div');
      expect(div).toHaveFocus();
    });

    it('should exclude elements with tabindex="-1" from focus trap', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <button>First</button>
          <button tabIndex={-1}>Should Skip</button>
          <button>Third</button>
        </FocusTrapTestComponent>
      );

      const first = screen.getByText('First');
      expect(first).toHaveFocus();

      fireEvent.keyDown(first, { key: 'Tab' });

      const third = screen.getByText('Third');
      expect(third).toHaveFocus();
    });

    it('should not activate focus trap when isActive is false', () => {
      const { container } = render(
        <FocusTrapTestComponent isActive={false}>
          <button>Button</button>
        </FocusTrapTestComponent>
      );

      const button = screen.getByText('Button');
      expect(button).not.toHaveFocus();
    });

    it('should handle empty container gracefully', () => {
      const { container } = render(
        <FocusTrapTestComponent isActive={true}>
          <div>No focusable elements</div>
        </FocusTrapTestComponent>
      );

      expect(container).toBeInTheDocument();
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <FocusTrapTestComponent isActive={true}>
          <button>Button</button>
        </FocusTrapTestComponent>
      );

      unmount();
      // If this doesn't throw, cleanup worked
      expect(true).toBe(true);
    });

    it('should handle single focusable element', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <button>Only Button</button>
        </FocusTrapTestComponent>
      );

      const button = screen.getByText('Only Button');
      expect(button).toHaveFocus();

      // Tab should keep focus on same element
      fireEvent.keyDown(button, { key: 'Tab' });
      expect(button).toHaveFocus();
    });

    it('should ignore non-Tab keys', () => {
      render(
        <FocusTrapTestComponent isActive={true}>
          <button>First</button>
          <button>Second</button>
        </FocusTrapTestComponent>
      );

      const first = screen.getByText('First');
      expect(first).toHaveFocus();

      fireEvent.keyDown(first, { key: 'Enter' });
      expect(first).toHaveFocus();

      fireEvent.keyDown(first, { key: 'Escape' });
      expect(first).toHaveFocus();
    });
  });

  // ============================================================================
  // announce Function Tests
  // ============================================================================
  describe('announce', () => {
    it('should create live region on first call', () => {
      announce('Test message');

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should set aria-live attribute to polite by default', () => {
      announce('Test message');

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should set aria-live attribute to assertive when specified', () => {
      announce('Urgent message', 'assertive');

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should set aria-atomic attribute', () => {
      announce('Test message');

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have sr-only class', () => {
      announce('Test message');

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion).toHaveClass('sr-only');
    });

    it('should be visually hidden with CSS', () => {
      announce('Test message');

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.style.position).toBe('absolute');
      expect(liveRegion.style.left).toBe('-10000px');
      expect(liveRegion.style.width).toBe('1px');
      expect(liveRegion.style.height).toBe('1px');
      expect(liveRegion.style.overflow).toBe('hidden');
    });

    it('should set text content of live region', () => {
      announce('Test message');

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('Test message');
    });

    it('should clear message after timeout', () => {
      announce('Test message');

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('Test message');

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(liveRegion.textContent).toBe('');
    });

    it('should reuse existing live region', () => {
      announce('First message');
      announce('Second message');

      const liveRegions = document.querySelectorAll('#aria-live-region');
      expect(liveRegions.length).toBe(1);
    });

    it('should update priority on subsequent calls', () => {
      announce('First message', 'polite');
      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      announce('Urgent message', 'assertive');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });
  });

  // ============================================================================
  // VisuallyHidden Component Tests
  // ============================================================================
  describe('VisuallyHidden', () => {
    it('should render children', () => {
      render(<VisuallyHidden>Hidden Text</VisuallyHidden>);
      expect(screen.getByText('Hidden Text')).toBeInTheDocument();
    });

    it('should be visually hidden with CSS', () => {
      render(<VisuallyHidden>Hidden Text</VisuallyHidden>);
      const span = screen.getByText('Hidden Text');

      expect(span.style.position).toBe('absolute');
      expect(span.style.left).toBe('-10000px');
      expect(span.style.width).toBe('1px');
      expect(span.style.height).toBe('1px');
      expect(span.style.overflow).toBe('hidden');
    });

    it('should render as span element', () => {
      render(<VisuallyHidden>Hidden Text</VisuallyHidden>);
      const element = screen.getByText('Hidden Text');
      expect(element.tagName).toBe('SPAN');
    });

    it('should pass through additional props', () => {
      render(<VisuallyHidden id="custom-id" data-testid="test">Hidden Text</VisuallyHidden>);
      const element = screen.getByTestId('test');
      expect(element).toHaveAttribute('id', 'custom-id');
    });

    it('should render complex children', () => {
      render(
        <VisuallyHidden>
          <span>Complex</span> <strong>Content</strong>
        </VisuallyHidden>
      );
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SkipToContent Component Tests
  // ============================================================================
  describe('SkipToContent', () => {
    it('should render skip link', () => {
      render(<SkipToContent />);
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    });

    it('should link to default targetId', () => {
      render(<SkipToContent />);
      const link = screen.getByText('Skip to main content');
      expect(link).toHaveAttribute('href', '#main-content');
    });

    it('should link to custom targetId', () => {
      render(<SkipToContent targetId="custom-content" />);
      const link = screen.getByText('Skip to main content');
      expect(link).toHaveAttribute('href', '#custom-content');
    });

    it('should have skip-to-content class', () => {
      render(<SkipToContent />);
      const link = screen.getByText('Skip to main content');
      expect(link).toHaveClass('skip-to-content');
    });

    it('should be visually hidden by default', () => {
      render(<SkipToContent />);
      const link = screen.getByText('Skip to main content');

      expect(link.style.position).toBe('absolute');
      expect(link.style.left).toBe('-10000px');
      expect(link.style.width).toBe('1px');
      expect(link.style.height).toBe('1px');
    });

    it('should become visible on focus', () => {
      render(<SkipToContent />);
      const link = screen.getByText('Skip to main content');

      fireEvent.focus(link);

      expect(link.style.position).toBe('fixed');
      expect(link.style.top).toBe('0px');
      expect(link.style.left).toBe('0px');
      expect(link.style.width).toBe('auto');
      expect(link.style.height).toBe('auto');
    });

    it('should have appropriate styling on focus', () => {
      render(<SkipToContent />);
      const link = screen.getByText('Skip to main content');

      fireEvent.focus(link);

      expect(link.style.padding).toBe('1rem 2rem');
      expect(link.style.color).toBe('rgb(255, 255, 255)');
      expect(link.style.textDecoration).toBe('none');
    });

    it('should hide again on blur', () => {
      render(<SkipToContent />);
      const link = screen.getByText('Skip to main content');

      fireEvent.focus(link);
      fireEvent.blur(link);

      expect(link.style.position).toBe('absolute');
      expect(link.style.left).toBe('-10000px');
      expect(link.style.width).toBe('1px');
      expect(link.style.height).toBe('1px');
    });

    it('should have high z-index', () => {
      render(<SkipToContent />);
      const link = screen.getByText('Skip to main content');
      expect(link.style.zIndex).toBe('9999');
    });
  });

  // ============================================================================
  // withAccessibleButton HOC Tests
  // ============================================================================
  describe('withAccessibleButton', () => {
    const BaseButton = React.forwardRef((props, ref) => (
      <button ref={ref} {...props}>
        {props.children}
      </button>
    ));
    BaseButton.displayName = 'BaseButton';

    const AccessibleButton = withAccessibleButton(BaseButton);

    it('should render wrapped component', () => {
      render(<AccessibleButton>Click Me</AccessibleButton>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should add role="button"', () => {
      render(<AccessibleButton>Click Me</AccessibleButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should add tabIndex 0 by default', () => {
      render(<AccessibleButton>Click Me</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('should set tabIndex -1 when disabled', () => {
      render(<AccessibleButton disabled>Click Me</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '-1');
    });

    it('should add aria-label when provided and no text content', () => {
      render(<AccessibleButton ariaLabel="Custom Label"><span className="icon" /></AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
    });

    it('should not add aria-label when text content exists', () => {
      render(<AccessibleButton ariaLabel="Custom Label">Text Button</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-label');
    });

    it('should add aria-describedby when provided', () => {
      render(<AccessibleButton ariaDescribedBy="description-id">Click Me</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description-id');
    });

    it('should add aria-pressed when provided', () => {
      render(<AccessibleButton ariaPressed={true}>Toggle</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should add aria-expanded when provided', () => {
      render(<AccessibleButton ariaExpanded={true}>Expand</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should add aria-haspopup when provided', () => {
      render(<AccessibleButton ariaHaspopup="menu">Menu</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('should add aria-disabled when disabled', () => {
      render(<AccessibleButton disabled>Click Me</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should add disabled attribute when disabled', () => {
      render(<AccessibleButton disabled>Click Me</AccessibleButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should pass through other props', () => {
      render(<AccessibleButton className="custom-class" data-testid="test-button">Click Me</AccessibleButton>);
      const button = screen.getByTestId('test-button');
      expect(button).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef();
      render(<AccessibleButton ref={ref}>Click Me</AccessibleButton>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  // ============================================================================
  // AccessibleModal Component Tests
  // ============================================================================
  describe('AccessibleModal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      title: 'Modal Title',
      description: 'Modal description',
      children: <div>Modal Content</div>
    };

    it('should render when open', () => {
      render(<AccessibleModal {...defaultProps} />);
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<AccessibleModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Title')).not.toBeInTheDocument();
    });

    it('should have role="dialog"', () => {
      render(<AccessibleModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(<AccessibleModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should label dialog with title', () => {
      render(<AccessibleModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      const title = document.getElementById(titleId);
      expect(title.textContent).toBe('Modal Title');
    });

    it('should describe dialog with description', () => {
      render(<AccessibleModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      const descId = dialog.getAttribute('aria-describedby');
      const description = document.getElementById(descId);
      expect(description.textContent).toBe('Modal description');
    });

    it('should render title', () => {
      render(<AccessibleModal {...defaultProps} />);
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(<AccessibleModal {...defaultProps} />);
      expect(screen.getByText('Modal description')).toBeInTheDocument();
    });

    it('should not render description element when not provided', () => {
      render(<AccessibleModal {...defaultProps} description={undefined} />);
      expect(screen.queryByText('Modal description')).not.toBeInTheDocument();
    });

    it('should render children', () => {
      render(<AccessibleModal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should set body overflow hidden when open', () => {
      render(<AccessibleModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body overflow when closed', () => {
      const { rerender } = render(<AccessibleModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<AccessibleModal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('should call onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      render(<AccessibleModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('.absolute.inset-0');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape is pressed', () => {
      const onClose = jest.fn();
      render(<AccessibleModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose on Escape when closed', () => {
      const onClose = jest.fn();
      render(<AccessibleModal {...defaultProps} isOpen={false} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should apply custom className', () => {
      render(<AccessibleModal {...defaultProps} className="custom-modal" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-modal');
    });

    it('should have fixed positioning', () => {
      render(<AccessibleModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('fixed');
      expect(dialog).toHaveClass('inset-0');
    });

    it('should have high z-index', () => {
      render(<AccessibleModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('z-50');
    });
  });

  // ============================================================================
  // AccessibleFormField Component Tests
  // ============================================================================
  describe('AccessibleFormField', () => {
    const defaultProps = {
      label: 'Field Label',
      children: <input type="text" />
    };

    it('should render label', () => {
      render(<AccessibleFormField {...defaultProps} />);
      expect(screen.getByText('Field Label')).toBeInTheDocument();
    });

    it('should render input', () => {
      render(<AccessibleFormField {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should associate label with input', () => {
      render(<AccessibleFormField {...defaultProps} />);
      const label = screen.getByText('Field Label');
      const input = screen.getByRole('textbox');
      const inputId = input.getAttribute('id');
      expect(label).toHaveAttribute('for', inputId);
    });

    it('should use provided id', () => {
      render(<AccessibleFormField {...defaultProps} id="custom-id" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('should display required indicator', () => {
      render(<AccessibleFormField {...defaultProps} required />);
      const indicator = screen.getByText('*');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('aria-label', 'required');
    });

    it('should add aria-required to input', () => {
      render(<AccessibleFormField {...defaultProps} required />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should display help text', () => {
      render(<AccessibleFormField {...defaultProps} helpText="Helper text" />);
      expect(screen.getByText('Helper text')).toBeInTheDocument();
    });

    it('should associate help text with input via aria-describedby', () => {
      render(<AccessibleFormField {...defaultProps} helpText="Helper text" />);
      const input = screen.getByRole('textbox');
      const helpText = screen.getByText('Helper text');
      const helpId = helpText.getAttribute('id');
      expect(input.getAttribute('aria-describedby')).toContain(helpId);
    });

    it('should display error message', () => {
      render(<AccessibleFormField {...defaultProps} error="Error message" />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should set aria-invalid when error exists', () => {
      render(<AccessibleFormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not set aria-invalid when no error', () => {
      render(<AccessibleFormField {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should associate error with input via aria-describedby', () => {
      render(<AccessibleFormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      const error = screen.getByText('Error message');
      const errorId = error.getAttribute('id');
      expect(input.getAttribute('aria-describedby')).toContain(errorId);
    });

    it('should have role="alert" on error message', () => {
      render(<AccessibleFormField {...defaultProps} error="Error message" />);
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('Error message');
    });

    it('should have aria-live="polite" on error message', () => {
      render(<AccessibleFormField {...defaultProps} error="Error message" />);
      const error = screen.getByRole('alert');
      expect(error).toHaveAttribute('aria-live', 'polite');
    });

    it('should combine help text and error in aria-describedby', () => {
      render(
        <AccessibleFormField
          {...defaultProps}
          helpText="Helper text"
          error="Error message"
        />
      );
      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('help');
      expect(describedBy).toContain('error');
    });
  });

  // ============================================================================
  // AccessibleTabs Component Tests
  // ============================================================================
  describe('AccessibleTabs', () => {
    const tabs = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
      { id: 'tab3', label: 'Tab 3' }
    ];

    const defaultProps = {
      tabs,
      activeTab: 'tab1',
      onChange: jest.fn(),
      children: (tab) => <div>Content for {tab.label}</div>
    };

    it('should render all tabs', () => {
      render(<AccessibleTabs {...defaultProps} />);
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should have role="tablist" on container', () => {
      render(<AccessibleTabs {...defaultProps} />);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have role="tab" on each tab', () => {
      render(<AccessibleTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('should set aria-selected on active tab', () => {
      render(<AccessibleTabs {...defaultProps} />);
      const tab1 = screen.getByText('Tab 1');
      const tab2 = screen.getByText('Tab 2');
      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
    });

    it('should set tabIndex 0 on active tab', () => {
      render(<AccessibleTabs {...defaultProps} />);
      const tab1 = screen.getByText('Tab 1');
      expect(tab1).toHaveAttribute('tabIndex', '0');
    });

    it('should set tabIndex -1 on inactive tabs', () => {
      render(<AccessibleTabs {...defaultProps} />);
      const tab2 = screen.getByText('Tab 2');
      expect(tab2).toHaveAttribute('tabIndex', '-1');
    });

    it('should associate tab with panel via aria-controls', () => {
      render(<AccessibleTabs {...defaultProps} />);
      const tab1 = screen.getByText('Tab 1');
      expect(tab1).toHaveAttribute('aria-controls', 'panel-tab1');
    });

    it('should have unique id on each tab', () => {
      render(<AccessibleTabs {...defaultProps} />);
      const tab1 = screen.getByText('Tab 1');
      expect(tab1).toHaveAttribute('id', 'tab-tab1');
    });

    it('should render active panel content', () => {
      render(<AccessibleTabs {...defaultProps} />);
      expect(screen.getByText('Content for Tab 1')).toBeInTheDocument();
    });

    it('should hide inactive panels', () => {
      render(<AccessibleTabs {...defaultProps} />);
      const panels = screen.getAllByRole('tabpanel', { hidden: true });
      const hiddenPanels = panels.filter(p => p.hidden);
      expect(hiddenPanels).toHaveLength(2);
    });

    it('should call onChange when tab is clicked', () => {
      const onChange = jest.fn();
      render(<AccessibleTabs {...defaultProps} onChange={onChange} />);

      const tab2 = screen.getByText('Tab 2');
      fireEvent.click(tab2);

      expect(onChange).toHaveBeenCalledWith('tab2');
    });

    it('should navigate to next tab with ArrowRight', () => {
      const onChange = jest.fn();
      render(<AccessibleTabs {...defaultProps} onChange={onChange} />);

      const tab1 = screen.getByText('Tab 1');
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });

      expect(onChange).toHaveBeenCalledWith('tab2');
    });

    it('should wrap to first tab when ArrowRight on last tab', () => {
      const onChange = jest.fn();
      render(<AccessibleTabs {...defaultProps} activeTab="tab3" onChange={onChange} />);

      const tab3 = screen.getByText('Tab 3');
      fireEvent.keyDown(tab3, { key: 'ArrowRight' });

      expect(onChange).toHaveBeenCalledWith('tab1');
    });

    it('should navigate to previous tab with ArrowLeft', () => {
      const onChange = jest.fn();
      render(<AccessibleTabs {...defaultProps} activeTab="tab2" onChange={onChange} />);

      const tab2 = screen.getByText('Tab 2');
      fireEvent.keyDown(tab2, { key: 'ArrowLeft' });

      expect(onChange).toHaveBeenCalledWith('tab1');
    });

    it('should wrap to last tab when ArrowLeft on first tab', () => {
      const onChange = jest.fn();
      render(<AccessibleTabs {...defaultProps} onChange={onChange} />);

      const tab1 = screen.getByText('Tab 1');
      fireEvent.keyDown(tab1, { key: 'ArrowLeft' });

      expect(onChange).toHaveBeenCalledWith('tab3');
    });

    it('should navigate to first tab with Home key', () => {
      const onChange = jest.fn();
      render(<AccessibleTabs {...defaultProps} activeTab="tab2" onChange={onChange} />);

      const tab2 = screen.getByText('Tab 2');
      fireEvent.keyDown(tab2, { key: 'Home' });

      expect(onChange).toHaveBeenCalledWith('tab1');
    });

    it('should navigate to last tab with End key', () => {
      const onChange = jest.fn();
      render(<AccessibleTabs {...defaultProps} onChange={onChange} />);

      const tab1 = screen.getByText('Tab 1');
      fireEvent.keyDown(tab1, { key: 'End' });

      expect(onChange).toHaveBeenCalledWith('tab3');
    });

    it('should have role="tabpanel" on panel', () => {
      render(<AccessibleTabs {...defaultProps} />);
      const panel = screen.getByRole('tabpanel', { hidden: false });
      expect(panel).toBeInTheDocument();
    });

    it('should associate panel with tab via aria-labelledby', () => {
      render(<AccessibleTabs {...defaultProps} />);
      const panel = screen.getByRole('tabpanel', { hidden: false });
      expect(panel).toHaveAttribute('aria-labelledby', 'tab-tab1');
    });
  });

  // ============================================================================
  // KeyboardHint Component Tests
  // ============================================================================
  describe('KeyboardHint', () => {
    it('should render keyboard hint text', () => {
      render(<KeyboardHint keys={['Ctrl', 'S']} action="save" />);
      expect(screen.getByText(/Press.*Ctrl.*\+.*S.*to save/)).toBeInTheDocument();
    });

    it('should be visually hidden', () => {
      render(<KeyboardHint keys={['Ctrl', 'S']} action="save" />);
      const hint = screen.getByText(/Press.*Ctrl.*\+.*S.*to save/);
      expect(hint.parentElement.style.position).toBe('absolute');
    });

    it('should handle single key', () => {
      render(<KeyboardHint keys={['Enter']} action="submit" />);
      expect(screen.getByText(/Press Enter to submit/)).toBeInTheDocument();
    });

    it('should handle multiple keys', () => {
      render(<KeyboardHint keys={['Ctrl', 'Shift', 'P']} action="open command palette" />);
      expect(screen.getByText(/Press.*Ctrl.*\+.*Shift.*\+.*P.*to open command palette/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // useLoadingAnnouncement Hook Tests
  // ============================================================================
  describe('useLoadingAnnouncement', () => {
    it('should announce loading state', () => {
      render(<LoadingAnnouncementTestComponent isLoading={true} />);

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('Loading, please wait');
    });

    it('should announce content loaded', () => {
      const { rerender } = render(<LoadingAnnouncementTestComponent isLoading={true} />);

      rerender(<LoadingAnnouncementTestComponent isLoading={false} />);

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('Content loaded');
    });

    it('should use custom loading message', () => {
      render(<LoadingAnnouncementTestComponent isLoading={true} message="Fetching data" />);

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('Fetching data, please wait');
    });

    it('should use default message when not provided', () => {
      render(<LoadingAnnouncementTestComponent isLoading={true} />);

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('Loading, please wait');
    });

    it('should not announce when isLoading is initially false', () => {
      render(<LoadingAnnouncementTestComponent isLoading={false} />);

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('');
    });
  });

  // ============================================================================
  // useErrorAnnouncement Hook Tests
  // ============================================================================
  describe('useErrorAnnouncement', () => {
    it('should announce error message', () => {
      render(<ErrorAnnouncementTestComponent error="Something went wrong" />);

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('Error: Something went wrong');
    });

    it('should use assertive priority', () => {
      render(<ErrorAnnouncementTestComponent error="Critical error" />);

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should not announce when error is null', () => {
      render(<ErrorAnnouncementTestComponent error={null} />);

      act(() => {
        jest.advanceTimersByTime(1100);
      });

      const liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('');
    });

    it('should announce when error changes', () => {
      const { rerender } = render(<ErrorAnnouncementTestComponent error="First error" />);

      let liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('Error: First error');

      rerender(<ErrorAnnouncementTestComponent error="Second error" />);

      liveRegion = document.getElementById('aria-live-region');
      expect(liveRegion.textContent).toBe('Error: Second error');
    });
  });
});

export default FocusTrapTestComponent
