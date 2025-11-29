import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormField } from '../FormField';

describe('FormField', () => {
  const defaultProps = {
    id: 'test-field',
    name: 'testField',
    label: 'Test Field',
    value: '',
    onChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<FormField {...defaultProps} placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with value', () => {
      render(<FormField {...defaultProps} value="test value" />);
      expect(screen.getByLabelText('Test Field')).toHaveValue('test value');
    });

    it('renders required asterisk', () => {
      const { container } = render(<FormField {...defaultProps} required />);
      const label = container.querySelector('label');
      expect(label).toHaveClass("after:content-['*']");
    });
  });

  describe('Field Types', () => {
    it('renders text input by default', () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('type', 'text');
    });

    it('renders email input', () => {
      render(<FormField {...defaultProps} type="email" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('type', 'email');
    });

    it('renders textarea', () => {
      render(<FormField {...defaultProps} type="textarea" rows={5} />);
      const textarea = screen.getByLabelText('Test Field');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('renders select dropdown', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' }
      ];
      render(<FormField {...defaultProps} type="select" options={options} />);
      const select = screen.getByLabelText('Test Field');
      expect(select.tagName).toBe('SELECT');
    });
  });

  describe('States', () => {
    it('can be disabled', () => {
      render(<FormField {...defaultProps} disabled />);
      expect(screen.getByLabelText('Test Field')).toBeDisabled();
    });

    it('shows error state', () => {
      render(<FormField {...defaultProps} error="Field is required" />);
      expect(screen.getByText('Field is required')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Field')).toHaveClass('border-error');
    });

    it('shows success state', () => {
      render(<FormField {...defaultProps} success />);
      expect(screen.getByLabelText('Test Field')).toHaveClass('border-success');
    });

    it('shows help text', () => {
      render(<FormField {...defaultProps} helpText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles onChange events', async () => {
      const handleChange = jest.fn();
      render(<FormField {...defaultProps} onChange={handleChange} />);

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
    });

    it('handles onBlur events', () => {
      const handleBlur = jest.fn();
      render(<FormField {...defaultProps} onBlur={handleBlur} />);

      const input = screen.getByLabelText('Test Field');
      input.focus();
      input.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('tracks focus state', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByLabelText('Test Field');

      input.focus();
      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus:ring-2');

      input.blur();
      expect(input).not.toHaveFocus();
    });
  });

  describe('Character Count', () => {
    it('shows character count when enabled', () => {
      render(<FormField {...defaultProps} value="test" maxLength={100} showCharCount />);
      expect(screen.getByText(/4.*100/)).toBeInTheDocument();
    });

    it('does not show character count by default', () => {
      render(<FormField {...defaultProps} value="test" maxLength={100} />);
      expect(screen.queryByText(/4.*100/)).not.toBeInTheDocument();
    });

    it('changes color when approaching limit', () => {
      const lowValue = 'a'.repeat(50);
      const warningValue = 'a'.repeat(75);
      const errorValue = 'a'.repeat(95);
      const { container, rerender } = render(
        <FormField {...defaultProps} value={lowValue} maxLength={100} showCharCount />
      );

      rerender(<FormField {...defaultProps} value={warningValue} maxLength={100} showCharCount />);
      expect(container.querySelector('.text-warning')).toBeInTheDocument();

      rerender(<FormField {...defaultProps} value={errorValue} maxLength={100} showCharCount />);
      expect(container.querySelector('.text-error')).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('renders password toggle for password fields', () => {
      render(<FormField {...defaultProps} type="password" />);
      expect(screen.getByLabelText(/show password/i)).toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
      render(<FormField {...defaultProps} type="password" value="secret" />);

      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByLabelText(/show password/i);
      await userEvent.click(toggleButton);

      expect(input).toHaveAttribute('type', 'text');

      await userEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('Validation', () => {
    it('validates on change when enabled', async () => {
      const validation = jest.fn(() => 'Invalid input');
      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnChange
        />
      );

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'test');

      expect(validation).toHaveBeenCalled();
    });

    it('validates on blur when enabled', () => {
      const validation = jest.fn(() => 'Invalid input');
      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnBlur
        />
      );

      const input = screen.getByLabelText('Test Field');
      input.focus();
      fireEvent.change(input, { target: { value: 'test' } });
      input.blur();

      expect(validation).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveAttribute('id', 'test-field');
    });

    it('sets required attribute when required', () => {
      render(<FormField {...defaultProps} required />);
      expect(screen.getByLabelText('Test Field')).toBeRequired();
    });

    it('sets aria-invalid when error', () => {
      render(<FormField {...defaultProps} error="Error" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports autoFocus', () => {
      render(<FormField {...defaultProps} autoFocus />);
      expect(screen.getByLabelText('Test Field')).toHaveFocus();
    });
  });

  describe('Select Options', () => {
    it('renders select options', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
        { value: '3', label: 'Option 3' }
      ];

      render(<FormField {...defaultProps} type="select" options={options} />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('handles select change', async () => {
      const handleChange = jest.fn();
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' }
      ];

      render(<FormField {...defaultProps} type="select" options={options} onChange={handleChange} />);

      const select = screen.getByLabelText('Test Field');
      await userEvent.selectOptions(select, '2');

      expect(handleChange).toHaveBeenCalled();
    });
  });
});

export default defaultProps
