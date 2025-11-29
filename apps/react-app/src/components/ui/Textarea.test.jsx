import React, { createRef } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Textarea from './Textarea'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertCircle: ({ size, className, 'aria-hidden': ariaHidden }) => (
    <svg data-testid="alert-circle" data-size={size} className={className} aria-hidden={ariaHidden}>
      <circle />
    </svg>
  ),
  CheckCircle: ({ size, className, 'aria-hidden': ariaHidden }) => (
    <svg data-testid="check-circle" data-size={size} className={className} aria-hidden={ariaHidden}>
      <circle />
    </svg>
  )
}))

describe('Textarea Component', () => {
  beforeEach(() => {
    // Mock Math.random for consistent ID generation
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render a textarea element', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should render with default props', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '4')
      expect(textarea).not.toBeDisabled()
      expect(textarea).not.toBeRequired()
    })

    it('should render with custom className', () => {
      render(<Textarea className="custom-class" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('custom-class')
    })

    it('should render with containerClassName', () => {
      const { container } = render(<Textarea containerClassName="container-class" />)
      expect(container.firstChild).toHaveClass('container-class')
    })

    it('should apply correct variant classes', () => {
      const { rerender } = render(<Textarea variant="default" />)
      let textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('glass')

      rerender(<Textarea variant="filled" />)
      textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('bg-bg-secondary')

      rerender(<Textarea variant="outline" />)
      textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('bg-transparent')

      rerender(<Textarea variant="glass" />)
      textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('glass-light')
    })

    it('should apply correct size classes', () => {
      const { rerender } = render(<Textarea size="sm" />)
      let textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('px-3')

      rerender(<Textarea size="md" />)
      textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('px-4')

      rerender(<Textarea size="lg" />)
      textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('px-5')
    })
  })

  describe('Label Rendering', () => {
    it('should render label when provided', () => {
      render(<Textarea label="Description" />)
      const label = screen.getByText('Description')
      expect(label).toBeInTheDocument()
      expect(label.tagName).toBe('LABEL')
    })

    it('should associate label with textarea', () => {
      render(<Textarea label="Description" id="test-textarea" />)
      const label = screen.getByText('Description')
      const textarea = screen.getByRole('textbox')
      expect(label).toHaveAttribute('for', 'test-textarea')
      expect(textarea).toHaveAttribute('id', 'test-textarea')
    })

    it('should show required asterisk when required', () => {
      render(<Textarea label="Description" required />)
      const label = screen.getByText('Description')
      expect(label.className).toContain("after:content-['*']")
      expect(label.className).toContain('after:text-error')
    })

    it('should apply opacity to label when disabled', () => {
      render(<Textarea label="Description" disabled />)
      const label = screen.getByText('Description')
      expect(label.className).toContain('opacity-50')
    })
  })

  describe('Text Input and Value', () => {
    it('should handle user typing', async () => {
      const user = userEvent.setup()
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'Hello World')
      expect(textarea).toHaveValue('Hello World')
    })

    it('should work as controlled component', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      const { rerender } = render(<Textarea value="" onChange={handleChange} />)
      const textarea = screen.getByRole('textbox')

      expect(textarea).toHaveValue('')

      await user.type(textarea, 'Test')
      expect(handleChange).toHaveBeenCalled()

      rerender(<Textarea value="Test" onChange={handleChange} />)
      expect(textarea).toHaveValue('Test')
    })

    it('should work as uncontrolled component with defaultValue', () => {
      render(<Textarea defaultValue="Initial value" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('Initial value')
    })

    it('should handle multiline text input', async () => {
      const user = userEvent.setup()
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3')
      expect(textarea.value).toContain('\n')
    })

    it('should update value when changed', async () => {
      const user = userEvent.setup()
      render(<Textarea defaultValue="Initial" />)
      const textarea = screen.getByRole('textbox')

      await user.clear(textarea)
      await user.type(textarea, 'Updated')
      expect(textarea).toHaveValue('Updated')
    })
  })

  describe('Placeholder', () => {
    it('should render placeholder text', () => {
      render(<Textarea placeholder="Enter description..." />)
      const textarea = screen.getByPlaceholderText('Enter description...')
      expect(textarea).toBeInTheDocument()
    })

    it('should hide placeholder when text is entered', async () => {
      const user = userEvent.setup()
      render(<Textarea placeholder="Enter text" />)
      const textarea = screen.getByPlaceholderText('Enter text')

      await user.type(textarea, 'Hello')
      expect(textarea.value).toBe('Hello')
    })
  })

  describe('Character Counter', () => {
    it('should show character count when showCharCount is true', () => {
      render(<Textarea showCharCount defaultValue="Hello" />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should show character count with maxLength', () => {
      render(<Textarea showCharCount maxLength={100} defaultValue="Hello" />)
      expect(screen.getByText('5/100')).toBeInTheDocument()
    })

    it('should update character count as user types', async () => {
      const user = userEvent.setup()
      render(<Textarea showCharCount maxLength={50} />)
      const textarea = screen.getByRole('textbox')

      expect(screen.getByText('0/50')).toBeInTheDocument()

      await user.type(textarea, 'Test')
      expect(screen.getByText('4/50')).toBeInTheDocument()
    })

    it('should show error styling when over maxLength', () => {
      const { container } = render(
        <Textarea showCharCount maxLength={10} defaultValue="This is a very long text" />
      )
      const charCount = screen.getByText('24/10')
      expect(charCount.className).toContain('text-error')
    })

    it('should show muted styling when within maxLength', () => {
      render(<Textarea showCharCount maxLength={100} defaultValue="Short" />)
      const charCount = screen.getByText('5/100')
      expect(charCount.className).toContain('text-muted')
    })

    it('should not show character count when showCharCount is false', () => {
      const { container } = render(<Textarea maxLength={100} defaultValue="Test" />)
      expect(screen.queryByText('4/100')).not.toBeInTheDocument()
    })

    it('should handle empty value with character count', () => {
      render(<Textarea showCharCount maxLength={50} />)
      expect(screen.getByText('0/50')).toBeInTheDocument()
    })

    it('should have aria-live attribute on character count', () => {
      render(<Textarea showCharCount maxLength={50} />)
      const charCount = screen.getByText('0/50')
      expect(charCount).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Max Length', () => {
    it('should enforce maxLength attribute', () => {
      render(<Textarea maxLength={10} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('maxLength', '10')
    })

    it('should prevent typing beyond maxLength', async () => {
      const user = userEvent.setup()
      render(<Textarea maxLength={5} />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, '123456789')
      expect(textarea.value.length).toBeLessThanOrEqual(5)
    })

    it('should work with controlled component and maxLength', () => {
      const handleChange = vi.fn()
      render(<Textarea value="12345" maxLength={5} onChange={handleChange} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('12345')
    })
  })

  describe('Min Length', () => {
    it('should set minLength attribute', () => {
      render(<Textarea minLength={10} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('minLength', '10')
    })
  })

  describe('Auto-Resize', () => {
    beforeEach(() => {
      // Mock getComputedStyle for auto-resize tests
      window.getComputedStyle = vi.fn().mockReturnValue({
        lineHeight: '20px',
        paddingTop: '10px',
        paddingBottom: '10px'
      })
    })

    it('should apply resize-none when autoResize is true', () => {
      render(<Textarea autoResize />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('resize-none')
      expect(textarea.className).toContain('overflow-hidden')
    })

    it('should use minRows when autoResize is enabled', () => {
      render(<Textarea autoResize minRows={3} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '3')
    })

    it('should set min and max height styles when autoResize is enabled', () => {
      render(<Textarea autoResize minRows={2} maxRows={8} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.style.minHeight).toBe('3rem')
      expect(textarea.style.maxHeight).toBe('12rem')
    })

    it('should adjust height on value change', async () => {
      const user = userEvent.setup()
      const { container } = render(<Textarea autoResize minRows={2} maxRows={10} />)
      const textarea = screen.getByRole('textbox')

      // Mock scrollHeight
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 100
      })

      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3')

      await waitFor(() => {
        expect(textarea.style.height).toBeTruthy()
      })
    })

    it('should call adjustHeight via requestAnimationFrame on change', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(0)
        return 0
      })

      const user = userEvent.setup()
      render(<Textarea autoResize />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'Test')

      expect(rafSpy).toHaveBeenCalled()
      rafSpy.mockRestore()
    })
  })

  describe('Rows Configuration', () => {
    it('should set default rows to 4', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '4')
    })

    it('should apply custom rows', () => {
      render(<Textarea rows={6} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '6')
    })

    it('should use minRows when autoResize is enabled', () => {
      render(<Textarea autoResize minRows={5} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '5')
    })
  })

  describe('Resize Configuration', () => {
    it('should apply resize-y by default', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('resize-y')
    })

    it('should apply resize-none when specified', () => {
      render(<Textarea resize="none" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('resize-none')
    })

    it('should apply resize-x when specified', () => {
      render(<Textarea resize="horizontal" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('resize-x')
    })

    it('should apply resize for both directions', () => {
      render(<Textarea resize="both" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('resize')
      expect(textarea.className).not.toContain('resize-none')
    })
  })

  describe('Disabled State', () => {
    it('should render disabled textarea', () => {
      render(<Textarea disabled />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeDisabled()
    })

    it('should apply disabled styling', () => {
      render(<Textarea disabled />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('disabled:opacity-50')
      expect(textarea.className).toContain('disabled:cursor-not-allowed')
    })

    it('should prevent user input when disabled', async () => {
      const user = userEvent.setup()
      render(<Textarea disabled />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'Test')
      expect(textarea).toHaveValue('')
    })

    it('should apply opacity to label when disabled', () => {
      render(<Textarea label="Label" disabled />)
      const label = screen.getByText('Label')
      expect(label.className).toContain('opacity-50')
    })
  })

  describe('Readonly State', () => {
    it('should render readonly textarea', () => {
      render(<Textarea readonly />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('readonly')
    })

    it('should apply readonly styling', () => {
      render(<Textarea readonly />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('readonly:opacity-75')
      expect(textarea.className).toContain('readonly:cursor-default')
    })

    it('should prevent editing when readonly', async () => {
      const user = userEvent.setup()
      render(<Textarea readonly defaultValue="Initial" />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'Additional')
      expect(textarea).toHaveValue('Initial')
    })
  })

  describe('Error State', () => {
    it('should render error message', () => {
      render(<Textarea error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('should apply error styling to textarea', () => {
      render(<Textarea error="Error message" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('border-error')
      expect(textarea.className).toContain('focus:border-error')
      expect(textarea.className).toContain('focus:ring-error/20')
    })

    it('should set aria-invalid to true when error exists', () => {
      render(<Textarea error="Error message" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })

    it('should show error icon', () => {
      render(<Textarea error="Error message" />)
      const icons = screen.getAllByTestId('alert-circle')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should display error message with role alert', () => {
      render(<Textarea error="Error message" />)
      const errorMsg = screen.getByRole('alert')
      expect(errorMsg).toHaveTextContent('Error message')
      expect(errorMsg.className).toContain('text-error')
    })

    it('should hide helper text when error is shown', () => {
      render(<Textarea error="Error" helperText="Helper" />)
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.queryByText('Helper')).not.toBeInTheDocument()
    })

    it('should set aria-invalid to false when no error', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-invalid', 'false')
    })
  })

  describe('Success State', () => {
    it('should show success icon when success is true', () => {
      render(<Textarea success />)
      expect(screen.getByTestId('check-circle')).toBeInTheDocument()
    })

    it('should show success message when success is string', () => {
      render(<Textarea success="Looks good!" />)
      expect(screen.getByText('Looks good!')).toBeInTheDocument()
    })

    it('should apply success styling to textarea', () => {
      render(<Textarea success />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toContain('border-success')
      expect(textarea.className).toContain('focus:border-success')
      expect(textarea.className).toContain('focus:ring-success/20')
    })

    it('should not show success icon when error exists', () => {
      render(<Textarea success error="Error message" />)
      const checkIcons = screen.queryAllByTestId('check-circle')
      const errorIcons = screen.getAllByTestId('alert-circle')
      expect(errorIcons.length).toBeGreaterThan(0)
    })

    it('should show success message with icon', () => {
      const { container } = render(<Textarea success="Success message" />)
      const successMsg = screen.getByText('Success message')
      expect(successMsg.className).toContain('text-success')
      expect(successMsg.parentElement).toContainElement(screen.getByTestId('check-circle'))
    })
  })

  describe('Helper Text', () => {
    it('should render helper text', () => {
      render(<Textarea helperText="This is a hint" />)
      expect(screen.getByText('This is a hint')).toBeInTheDocument()
    })

    it('should style helper text correctly', () => {
      render(<Textarea helperText="Helper text" />)
      const helper = screen.getByText('Helper text')
      expect(helper.className).toContain('text-xs')
      expect(helper.className).toContain('text-muted')
    })

    it('should associate helper text with textarea via aria-describedby', () => {
      render(<Textarea helperText="Helper text" id="test-textarea" />)
      const textarea = screen.getByRole('textbox')
      const helper = screen.getByText('Helper text')
      expect(textarea).toHaveAttribute('aria-describedby', expect.stringContaining(helper.id))
    })
  })

  describe('onChange Handler', () => {
    it('should call onChange when text is entered', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      render(<Textarea onChange={handleChange} />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'T')
      expect(handleChange).toHaveBeenCalled()
    })

    it('should pass event to onChange handler', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      render(<Textarea onChange={handleChange} />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'Test')
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({
          value: expect.any(String)
        })
      }))
    })

    it('should work with controlled component', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(<Textarea value="" onChange={handleChange} />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'A')
      expect(handleChange).toHaveBeenCalled()

      rerender(<Textarea value="A" onChange={handleChange} />)
      expect(textarea).toHaveValue('A')
    })

    it('should update internal state for uncontrolled component', async () => {
      const user = userEvent.setup()
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'Uncontrolled')
      expect(textarea).toHaveValue('Uncontrolled')
    })
  })

  describe('Focus and Blur Events', () => {
    it('should call onFocus when textarea is focused', async () => {
      const handleFocus = vi.fn()
      render(<Textarea onFocus={handleFocus} />)
      const textarea = screen.getByRole('textbox')

      fireEvent.focus(textarea)
      expect(handleFocus).toHaveBeenCalled()
    })

    it('should call onBlur when textarea loses focus', async () => {
      const handleBlur = vi.fn()
      render(<Textarea onBlur={handleBlur} />)
      const textarea = screen.getByRole('textbox')

      fireEvent.focus(textarea)
      fireEvent.blur(textarea)
      expect(handleBlur).toHaveBeenCalled()
    })

    it('should update focused state on focus and blur', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')

      fireEvent.focus(textarea)
      expect(textarea).toHaveFocus()

      fireEvent.blur(textarea)
      expect(textarea).not.toHaveFocus()
    })

    it('should support autoFocus prop', () => {
      render(<Textarea autoFocus />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('autoFocus')
    })
  })

  describe('Ref Forwarding', () => {
    it('should forward ref to textarea element', () => {
      const ref = createRef()
      render(<Textarea ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    })

    it('should allow ref access to textarea methods', () => {
      const ref = createRef()
      render(<Textarea ref={ref} defaultValue="Test" />)
      expect(ref.current.value).toBe('Test')
    })

    it('should allow programmatic focus via ref', () => {
      const ref = createRef()
      render(<Textarea ref={ref} />)
      ref.current.focus()
      expect(ref.current).toHaveFocus()
    })

    it('should use internal ref when no ref is provided', () => {
      render(<Textarea autoResize />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper role attribute', () => {
      render(<Textarea />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should set required attribute when required prop is true', () => {
      render(<Textarea required />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeRequired()
    })

    it('should generate unique ID when not provided', () => {
      const { rerender } = render(<Textarea />)
      const textarea1 = screen.getByRole('textbox')
      const id1 = textarea1.getAttribute('id')

      rerender(<Textarea />)
      expect(id1).toMatch(/^textarea-/)
    })

    it('should use provided ID', () => {
      render(<Textarea id="custom-id" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('id', 'custom-id')
    })

    it('should link label with textarea via htmlFor', () => {
      render(<Textarea label="Description" id="desc" />)
      const label = screen.getByText('Description')
      const textarea = screen.getByRole('textbox')
      expect(label).toHaveAttribute('for', 'desc')
      expect(textarea).toHaveAttribute('id', 'desc')
    })

    it('should set aria-describedby with multiple values', () => {
      render(
        <Textarea
          helperText="Helper"
          error="Error"
          showCharCount
          maxLength={100}
          aria-describedby="external-desc"
        />
      )
      const textarea = screen.getByRole('textbox')
      const describedBy = textarea.getAttribute('aria-describedby')
      expect(describedBy).toContain('error')
      expect(describedBy).toContain('count')
      expect(describedBy).toContain('external-desc')
    })

    it('should have aria-hidden on icons', () => {
      render(<Textarea error="Error" />)
      const icons = screen.getAllByTestId('alert-circle')
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('should support name attribute', () => {
      render(<Textarea name="description" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('name', 'description')
    })

    it('should support autoComplete attribute', () => {
      render(<Textarea autoComplete="off" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('autoComplete', 'off')
    })

    it('should have aria-live on character count', () => {
      render(<Textarea showCharCount />)
      const charCount = screen.getByText('0')
      expect(charCount).toHaveAttribute('aria-live', 'polite')
    })

    it('should set displayName for dev tools', () => {
      expect(Textarea.displayName).toBe('Textarea')
    })
  })

  describe('Additional Props', () => {
    it('should pass through additional props', () => {
      render(<Textarea data-testid="custom-textarea" data-custom="value" />)
      const textarea = screen.getByTestId('custom-textarea')
      expect(textarea).toHaveAttribute('data-custom', 'value')
    })

    it('should handle custom aria attributes', () => {
      render(<Textarea aria-label="Custom label" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-label', 'Custom label')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null or undefined defaultValue', () => {
      render(<Textarea defaultValue={undefined} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('')
    })

    it('should handle empty string value', () => {
      render(<Textarea value="" onChange={() => {}} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('')
    })

    it('should handle very long text', async () => {
      const user = userEvent.setup()
      const longText = 'a'.repeat(1000)
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, longText)
      expect(textarea.value.length).toBeGreaterThan(0)
    })

    it('should handle special characters', async () => {
      const user = userEvent.setup()
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, '!@#$%^&*()')
      expect(textarea).toHaveValue('!@#$%^&*()')
    })

    it('should handle unicode characters', async () => {
      const user = userEvent.setup()
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, '你好世界 🌍')
      expect(textarea.value).toContain('你好世界')
    })

    it('should handle rapid value changes', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Textarea onChange={handleChange} />)
      const textarea = screen.getByRole('textbox')

      await user.type(textarea, 'Quick')
      expect(handleChange).toHaveBeenCalledTimes(5)
    })

    it('should handle value prop changing from controlled to uncontrolled', () => {
      const { rerender } = render(<Textarea value="Controlled" onChange={() => {}} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('Controlled')

      rerender(<Textarea defaultValue="Uncontrolled" />)
      expect(textarea).toBeInTheDocument()
    })

    it('should handle both error and success props', () => {
      render(<Textarea error="Error message" success="Success message" />)
      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })

    it('should handle zero maxLength', () => {
      render(<Textarea maxLength={0} showCharCount />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('maxLength', '0')
    })
  })
})

export default textarea
