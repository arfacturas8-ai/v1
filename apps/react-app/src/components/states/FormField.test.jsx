import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormField } from './FormField';
import { AlertCircle, Check } from 'lucide-react';

jest.mock('lucide-react', () => ({
  AlertCircle: jest.fn(() => <div data-testid="alert-circle-icon" />),
  Check: jest.fn(() => <div data-testid="check-icon" />)
}));

describe('FormField', () => {
  const defaultProps = {
    label: 'Test Label',
    name: 'testField',
    value: '',
    onChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Label Rendering', () => {
    test('renders label when provided', () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    test('does not render label when not provided', () => {
      render(<FormField {...defaultProps} label={undefined} />);
      expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
    });

    test('label has correct htmlFor attribute matching input id', () => {
      render(<FormField {...defaultProps} />);
      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('for', 'testField');
    });

    test('label has correct CSS classes', () => {
      render(<FormField {...defaultProps} />);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-300', 'mb-2');
    });
  });

  describe('Required Indicator', () => {
    test('displays asterisk when required is true', () => {
      render(<FormField {...defaultProps} required={true} />);
      const asterisk = screen.getByLabelText('required');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveTextContent('*');
    });

    test('does not display asterisk when required is false', () => {
      render(<FormField {...defaultProps} required={false} />);
      expect(screen.queryByLabelText('required')).not.toBeInTheDocument();
    });

    test('asterisk has correct CSS classes', () => {
      render(<FormField {...defaultProps} required={true} />);
      const asterisk = screen.getByLabelText('required');
      expect(asterisk).toHaveClass('text-red-500', 'ml-1');
    });

    test('asterisk has aria-label attribute', () => {
      render(<FormField {...defaultProps} required={true} />);
      const asterisk = screen.getByLabelText('required');
      expect(asterisk).toHaveAttribute('aria-label', 'required');
    });
  });

  describe('Input Field', () => {
    test('renders input field with correct id', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'testField');
    });

    test('renders input field with correct name', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'testField');
    });

    test('renders input with correct value', () => {
      render(<FormField {...defaultProps} value="test value" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test value');
    });

    test('calls onChange when input value changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<FormField {...defaultProps} onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    test('renders input with placeholder', () => {
      render(<FormField {...defaultProps} placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    test('input has correct base CSS classes', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full', 'px-4', 'py-2', 'bg-gray-800', 'border', 'rounded-lg', 'text-white', 'placeholder-gray-500');
    });

    test('sets required attribute on input when required is true', () => {
      render(<FormField {...defaultProps} required={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
    });
  });

  describe('Different Input Types', () => {
    test('renders text input by default', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    test('renders email input when type is email', () => {
      render(<FormField {...defaultProps} type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    test('renders password input when type is password', () => {
      render(<FormField {...defaultProps} type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    test('renders number input when type is number', () => {
      render(<FormField {...defaultProps} type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    test('renders tel input when type is tel', () => {
      render(<FormField {...defaultProps} type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    test('renders url input when type is url', () => {
      render(<FormField {...defaultProps} type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('Disabled State', () => {
    test('input is disabled when disabled prop is true', () => {
      render(<FormField {...defaultProps} disabled={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    test('input is not disabled when disabled prop is false', () => {
      render(<FormField {...defaultProps} disabled={false} />);
      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();
    });

    test('disabled input has correct CSS classes', () => {
      render(<FormField {...defaultProps} disabled={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    test('onChange is not called when disabled input is interacted with', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<FormField {...defaultProps} disabled={true} onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Error Message Display', () => {
    test('does not show error before input is touched', () => {
      render(<FormField {...defaultProps} error="Error message" />);
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });

    test('shows error after input is blurred', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    test('error message has correct id attribute', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      const errorMessage = screen.getByText('Error message');
      expect(errorMessage).toHaveAttribute('id', 'testField-error');
    });

    test('error message has role="alert"', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Error message');
    });

    test('error message has correct CSS classes', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      const errorMessage = screen.getByText('Error message');
      expect(errorMessage).toHaveClass('mt-2', 'text-sm', 'text-red-500');
    });

    test('input has error border when error is shown', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(input).toHaveClass('border-red-500', 'focus:ring-red-500');
    });
  });

  describe('Success State', () => {
    test('does not show success icon before input is touched', () => {
      render(<FormField {...defaultProps} success={true} />);
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });

    test('shows success icon after input is blurred', async () => {
      render(<FormField {...defaultProps} success={true} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    test('input has success border when success is shown', async () => {
      render(<FormField {...defaultProps} success={true} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(input).toHaveClass('border-green-500', 'focus:ring-green-500');
    });

    test('does not show success when error is present', async () => {
      render(<FormField {...defaultProps} success={true} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    test('Check icon is called with correct props', async () => {
      render(<FormField {...defaultProps} success={true} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(Check).toHaveBeenCalled();
    });
  });

  describe('Helper Text', () => {
    test('displays helper text when provided', () => {
      render(<FormField {...defaultProps} helperText="Helper text" />);
      expect(screen.getByText('Helper text')).toBeInTheDocument();
    });

    test('does not display helper text when not provided', () => {
      render(<FormField {...defaultProps} />);
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    test('helper text has correct id attribute', () => {
      render(<FormField {...defaultProps} helperText="Helper text" />);
      const helperText = screen.getByText('Helper text');
      expect(helperText).toHaveAttribute('id', 'testField-helper');
    });

    test('helper text has correct CSS classes', () => {
      render(<FormField {...defaultProps} helperText="Helper text" />);
      const helperText = screen.getByText('Helper text');
      expect(helperText).toHaveClass('mt-2', 'text-sm', 'text-gray-500');
    });

    test('helper text is hidden when error is shown', async () => {
      render(<FormField {...defaultProps} helperText="Helper text" error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Icon Support', () => {
    test('AlertCircle icon is rendered when error is shown', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    test('Check icon is rendered when success is shown', async () => {
      render(<FormField {...defaultProps} success={true} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    test('AlertCircle icon is called with correct props', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(AlertCircle).toHaveBeenCalled();
    });

    test('icons have aria-hidden="true"', async () => {
      render(<FormField {...defaultProps} success={true} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      const icon = screen.getByTestId('check-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('input has aria-invalid="false" when no error', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    test('input has aria-invalid="true" when error is shown', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('input has aria-describedby pointing to error when error is shown', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(input).toHaveAttribute('aria-describedby', 'testField-error');
    });

    test('input has aria-describedby pointing to helper text when no error', () => {
      render(<FormField {...defaultProps} helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'testField-helper');
    });

    test('input has no aria-describedby when no helper text or error', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('aria-describedby');
    });

    test('error takes precedence over helper text in aria-describedby', async () => {
      render(<FormField {...defaultProps} helperText="Helper text" error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(input).toHaveAttribute('aria-describedby', 'testField-error');
    });
  });

  describe('Touch State Management', () => {
    test('input starts in untouched state', () => {
      render(<FormField {...defaultProps} error="Error message" />);
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });

    test('input becomes touched after blur', () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    test('touched state persists after blur', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      fireEvent.focus(input);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    test('applies custom className to container', () => {
      const { container } = render(<FormField {...defaultProps} className="custom-class" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });

    test('maintains default classes with custom className', () => {
      const { container } = render(<FormField {...defaultProps} className="custom-class" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('w-full', 'custom-class');
    });

    test('works without custom className', () => {
      const { container } = render(<FormField {...defaultProps} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('w-full');
    });
  });

  describe('Validation States', () => {
    test('input has default border when no validation state', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-700', 'focus:ring-blue-500');
    });

    test('error state takes precedence over success', async () => {
      render(<FormField {...defaultProps} error="Error" success={true} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(input).toHaveClass('border-red-500', 'focus:ring-red-500');
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });

    test('transitions from default to error state on blur', async () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-700');
      fireEvent.blur(input);
      expect(input).toHaveClass('border-red-500');
    });

    test('transitions from default to success state on blur', async () => {
      render(<FormField {...defaultProps} success={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-700');
      fireEvent.blur(input);
      expect(input).toHaveClass('border-green-500');
    });
  });

  describe('Component Structure', () => {
    test('renders container with relative positioning for icons', () => {
      const { container } = render(<FormField {...defaultProps} />);
      const inputContainer = container.querySelector('.relative');
      expect(inputContainer).toBeInTheDocument();
    });

    test('wraps all content in main container', () => {
      const { container } = render(<FormField {...defaultProps} helperText="Helper" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('w-full');
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('Helper')).toBeInTheDocument();
    });
  });
});

export default defaultProps
