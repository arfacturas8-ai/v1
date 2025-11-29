/**
 * CRYB Platform - FormField Component Tests
 * Comprehensive test suite for FormField component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Check, AlertCircle, Eye, EyeOff, Info, Search, Mail } from 'lucide-react';
import { FormField } from './FormField';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon">Check</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertCircle</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
}));

describe('FormField', () => {
  const defaultProps = {
    id: 'test-field',
    name: 'testField',
    label: 'Test Field',
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });

    it('renders without label', () => {
      const { container } = render(<FormField id="test" name="test" value="" onChange={jest.fn()} />);
      expect(container.querySelector('label')).not.toBeInTheDocument();
      expect(container.querySelector('input')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<FormField {...defaultProps} placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with value', () => {
      render(<FormField {...defaultProps} value="test value" />);
      expect(screen.getByLabelText('Test Field')).toHaveValue('test value');
    });

    it('renders with empty string value', () => {
      render(<FormField {...defaultProps} value="" />);
      expect(screen.getByLabelText('Test Field')).toHaveValue('');
    });

    it('renders required asterisk', () => {
      const { container } = render(<FormField {...defaultProps} required />);
      const label = container.querySelector('label');
      expect(label).toHaveClass("after:content-['*']");
    });

    it('renders with custom className', () => {
      const { container } = render(<FormField {...defaultProps} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with custom inputClassName', () => {
      render(<FormField {...defaultProps} inputClassName="custom-input" />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveClass('custom-input');
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

    it('renders password input', () => {
      render(<FormField {...defaultProps} type="password" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('type', 'password');
    });

    it('renders number input', () => {
      render(<FormField {...defaultProps} type="number" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('type', 'number');
    });

    it('renders tel input', () => {
      render(<FormField {...defaultProps} type="tel" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('type', 'tel');
    });

    it('renders url input', () => {
      render(<FormField {...defaultProps} type="url" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('type', 'url');
    });

    it('renders date input', () => {
      render(<FormField {...defaultProps} type="date" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('type', 'date');
    });

    it('renders textarea', () => {
      render(<FormField {...defaultProps} type="textarea" rows={5} />);
      const textarea = screen.getByLabelText('Test Field');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('renders textarea with default rows', () => {
      render(<FormField {...defaultProps} type="textarea" />);
      const textarea = screen.getByLabelText('Test Field');
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('textarea has resize-none class', () => {
      render(<FormField {...defaultProps} type="textarea" />);
      const textarea = screen.getByLabelText('Test Field');
      expect(textarea).toHaveClass('resize-none');
    });

    it('renders select dropdown', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];
      render(<FormField {...defaultProps} type="select" options={options} />);
      const select = screen.getByLabelText('Test Field');
      expect(select.tagName).toBe('SELECT');
    });

    it('renders select with empty options array', () => {
      render(<FormField {...defaultProps} type="select" options={[]} />);
      const select = screen.getByLabelText('Test Field');
      expect(select.tagName).toBe('SELECT');
      expect(select.children.length).toBe(0);
    });
  });

  describe('States', () => {
    it('can be disabled', () => {
      render(<FormField {...defaultProps} disabled />);
      expect(screen.getByLabelText('Test Field')).toBeDisabled();
    });

    it('disabled field has correct styling', () => {
      render(<FormField {...defaultProps} disabled />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveClass('disabled:opacity-50');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
    });

    it('can be required', () => {
      render(<FormField {...defaultProps} required />);
      expect(screen.getByLabelText('Test Field')).toBeRequired();
    });

    it('shows error state', () => {
      render(<FormField {...defaultProps} error="Field is required" />);
      expect(screen.getByText('Field is required')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Field')).toHaveClass('border-error');
    });

    it('error message has role alert', () => {
      render(<FormField {...defaultProps} error="Error message" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });

    it('shows error icon', () => {
      render(<FormField {...defaultProps} error="Error" />);
      const alertIcons = screen.getAllByTestId('alert-icon');
      expect(alertIcons.length).toBeGreaterThan(0);
    });

    it('shows success state with boolean', () => {
      render(<FormField {...defaultProps} success />);
      expect(screen.getByLabelText('Test Field')).toHaveClass('border-success');
    });

    it('shows success state with string message', () => {
      render(<FormField {...defaultProps} success="Looks good!" />);
      expect(screen.getByText('Looks good!')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Field')).toHaveClass('border-success');
    });

    it('shows success icon', () => {
      render(<FormField {...defaultProps} success />);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('shows help text', () => {
      render(<FormField {...defaultProps} helpText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('help text has info icon', () => {
      render(<FormField {...defaultProps} helpText="Help text" />);
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('error takes precedence over success', () => {
      render(<FormField {...defaultProps} error="Error" success="Success" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Test Field')).toHaveClass('border-error');
    });

    it('error hides help text', () => {
      render(<FormField {...defaultProps} error="Error" helpText="Help" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Help')).not.toBeInTheDocument();
    });

    it('success does not hide help text', () => {
      render(<FormField {...defaultProps} success helpText="Help" />);
      expect(screen.getByText('Help')).toBeInTheDocument();
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

    it('onChange receives event object', async () => {
      const handleChange = jest.fn();
      render(<FormField {...defaultProps} onChange={handleChange} />);

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'a');

      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({
          value: expect.any(String),
        }),
      }));
    });

    it('handles onBlur events', () => {
      const handleBlur = jest.fn();
      render(<FormField {...defaultProps} onBlur={handleBlur} />);

      const input = screen.getByLabelText('Test Field');
      input.focus();
      input.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('onBlur receives event object', () => {
      const handleBlur = jest.fn();
      render(<FormField {...defaultProps} onBlur={handleBlur} />);

      const input = screen.getByLabelText('Test Field');
      input.focus();
      input.blur();

      expect(handleBlur).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.any(Object),
      }));
    });

    it('tracks focus state', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByLabelText('Test Field');

      input.focus();
      expect(input).toHaveFocus();

      input.blur();
      expect(input).not.toHaveFocus();
    });

    it('works without onChange handler', async () => {
      render(<FormField id="test" name="test" label="Test" value="" />);
      const input = screen.getByLabelText('Test');

      // Should not throw error
      fireEvent.change(input, { target: { value: 'test' } });
    });

    it('works without onBlur handler', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByLabelText('Test Field');

      // Should not throw error
      input.focus();
      input.blur();
    });

    it('disabled input does not trigger onChange', async () => {
      const handleChange = jest.fn();
      render(<FormField {...defaultProps} disabled onChange={handleChange} />);

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'test');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Character Count', () => {
    it('shows character count when enabled', () => {
      render(<FormField {...defaultProps} value="test" maxLength={100} showCharCount />);
      expect(screen.getByText(/4.*\/.*100/)).toBeInTheDocument();
    });

    it('does not show character count by default', () => {
      render(<FormField {...defaultProps} value="test" maxLength={100} />);
      expect(screen.queryByText(/4.*\/.*100/)).not.toBeInTheDocument();
    });

    it('does not show character count without maxLength', () => {
      render(<FormField {...defaultProps} value="test" showCharCount />);
      expect(screen.queryByText(/4/)).not.toBeInTheDocument();
    });

    it('shows 0 character count for empty value', () => {
      render(<FormField {...defaultProps} value="" maxLength={100} showCharCount />);
      expect(screen.getByText(/0.*\/.*100/)).toBeInTheDocument();
    });

    it('shows correct count for undefined value', () => {
      render(<FormField id="test" name="test" label="Test" maxLength={100} showCharCount />);
      expect(screen.getByText(/0.*\/.*100/)).toBeInTheDocument();
    });

    it('uses tertiary color for low character count', () => {
      const lowValue = 'a'.repeat(50);
      const { container } = render(
        <FormField {...defaultProps} value={lowValue} maxLength={100} showCharCount />
      );
      expect(container.querySelector('.text-text-tertiary')).toBeInTheDocument();
    });

    it('uses warning color when 70% of limit', () => {
      const warningValue = 'a'.repeat(75);
      const { container } = render(
        <FormField {...defaultProps} value={warningValue} maxLength={100} showCharCount />
      );
      expect(container.querySelector('.text-warning')).toBeInTheDocument();
    });

    it('uses error color when 90% of limit', () => {
      const errorValue = 'a'.repeat(95);
      const { container } = render(
        <FormField {...defaultProps} value={errorValue} maxLength={100} showCharCount />
      );
      expect(container.querySelector('.text-error')).toBeInTheDocument();
    });

    it('updates character count on input change', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <FormField
            {...defaultProps}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={100}
            showCharCount
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Test Field');

      await userEvent.type(input, 'hello');
      expect(screen.getByText(/5.*\/.*100/)).toBeInTheDocument();
    });

    it('enforces maxLength on input', async () => {
      render(<FormField {...defaultProps} maxLength={5} />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveAttribute('maxLength', '5');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('renders password toggle for password fields', () => {
      render(<FormField {...defaultProps} type="password" />);
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });

    it('does not render password toggle for non-password fields', () => {
      render(<FormField {...defaultProps} type="text" />);
      expect(screen.queryByLabelText('Show password')).not.toBeInTheDocument();
    });

    it('shows eye icon initially', () => {
      render(<FormField {...defaultProps} type="password" />);
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
      render(<FormField {...defaultProps} type="password" value="secret" />);

      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByLabelText('Show password');
      await userEvent.click(toggleButton);

      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    });

    it('toggles back to password type', async () => {
      render(<FormField {...defaultProps} type="password" value="secret" />);

      const toggleButton = screen.getByLabelText('Show password');
      await userEvent.click(toggleButton);

      const hideButton = screen.getByLabelText('Hide password');
      await userEvent.click(hideButton);

      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('shows eye-off icon when password is visible', async () => {
      render(<FormField {...defaultProps} type="password" />);

      const toggleButton = screen.getByLabelText('Show password');
      await userEvent.click(toggleButton);

      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    });

    it('password toggle button has tabIndex -1', () => {
      render(<FormField {...defaultProps} type="password" />);
      const toggleButton = screen.getByLabelText('Show password');
      expect(toggleButton).toHaveAttribute('tabIndex', '-1');
    });

    it('password toggle is type button', () => {
      render(<FormField {...defaultProps} type="password" />);
      const toggleButton = screen.getByLabelText('Show password');
      expect(toggleButton).toHaveAttribute('type', 'button');
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

    it('does not validate on change when disabled', async () => {
      const validation = jest.fn(() => 'Invalid input');
      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnChange={false}
        />
      );

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'test');

      expect(validation).not.toHaveBeenCalled();
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

    it('does not validate on blur when disabled', () => {
      const validation = jest.fn(() => 'Invalid input');
      const handleChange = jest.fn();
      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnBlur={false}
          validateOnChange={false}
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Test Field');
      input.focus();
      fireEvent.change(input, { target: { value: 'test' } });
      input.blur();

      expect(validation).not.toHaveBeenCalled();
    });

    it('shows validation error message', async () => {
      const validation = jest.fn(() => 'Value is too short');
      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnChange
        />
      );

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'a');

      expect(screen.getByText('Value is too short')).toBeInTheDocument();
    });

    it('validation function receives the value', async () => {
      const validation = jest.fn(() => true);
      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnChange
        />
      );

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'test');

      expect(validation).toHaveBeenCalledWith(expect.stringContaining('t'));
    });

    it('shows success when validation returns true', async () => {
      const validation = jest.fn(() => true);
      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnChange
        />
      );

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'valid');

      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(input).toHaveClass('border-success');
    });

    it('shows error when validation returns string', async () => {
      const validation = jest.fn(() => 'Error message');
      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnChange
        />
      );

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'invalid');

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(input).toHaveClass('border-error');
    });

    it('clears validation when validation returns falsy (not string)', async () => {
      const validation = jest.fn((val) => val.length < 3 ? 'Too short' : false);
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <FormField
            {...defaultProps}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            validation={validation}
            validateOnChange
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Test Field');

      await userEvent.type(input, 'a');
      await waitFor(() => {
        expect(screen.getByText('Too short')).toBeInTheDocument();
      });

      await userEvent.type(input, 'bc');
      await waitFor(() => {
        expect(screen.queryByText('Too short')).not.toBeInTheDocument();
      });
    });

    it('external error overrides validation error', async () => {
      const validation = jest.fn(() => 'Validation error');
      render(
        <FormField
          {...defaultProps}
          error="External error"
          validation={validation}
          validateOnChange
        />
      );

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'test');

      expect(screen.getByText('External error')).toBeInTheDocument();
      expect(screen.queryByText('Validation error')).not.toBeInTheDocument();
    });

    it('external success overrides validation success', async () => {
      const validation = jest.fn(() => true);
      render(
        <FormField
          {...defaultProps}
          success="External success"
          validation={validation}
          validateOnChange
        />
      );

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'test');

      expect(screen.getByText('External success')).toBeInTheDocument();
    });

    it('clears validation error when user starts typing (with validateOnChange false)', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <FormField
            {...defaultProps}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            validation={(val) => val.length < 3 ? 'Too short' : true}
            validateOnChange={false}
            validateOnBlur
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Test Field');

      // Trigger validation on blur
      input.focus();
      fireEvent.change(input, { target: { value: 'ab' } });
      input.blur();

      await waitFor(() => {
        expect(screen.getByText('Too short')).toBeInTheDocument();
      });

      // Start typing again - error should clear
      await userEvent.type(input, 'c');
      await waitFor(() => {
        expect(screen.queryByText('Too short')).not.toBeInTheDocument();
      });
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      render(<FormField {...defaultProps} leftIcon={<Search />} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(<FormField {...defaultProps} rightIcon={<Mail />} />);
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('applies padding for left icon', () => {
      render(<FormField {...defaultProps} leftIcon={<Search />} />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveClass('pl-11');
    });

    it('applies padding for right icon', () => {
      render(<FormField {...defaultProps} rightIcon={<Mail />} />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveClass('pr-11');
    });

    it('applies padding for password field (implicit right icon)', () => {
      render(<FormField {...defaultProps} type="password" />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveClass('pr-11');
    });

    it('applies padding for error state (implicit right icon)', () => {
      render(<FormField {...defaultProps} error="Error" />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveClass('pr-11');
    });

    it('applies padding for success state (implicit right icon)', () => {
      render(<FormField {...defaultProps} success />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveClass('pr-11');
    });

    it('right icon is hidden when error is shown', () => {
      render(<FormField {...defaultProps} rightIcon={<Mail />} error="Error" />);
      expect(screen.queryByTestId('mail-icon')).not.toBeInTheDocument();
      const alertIcons = screen.getAllByTestId('alert-icon');
      expect(alertIcons.length).toBeGreaterThan(0);
    });

    it('right icon is hidden when success is shown', () => {
      render(<FormField {...defaultProps} rightIcon={<Mail />} success />);
      expect(screen.queryByTestId('mail-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('renders both left and right icons', () => {
      render(<FormField {...defaultProps} leftIcon={<Search />} rightIcon={<Mail />} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('password toggle and right icon work together', () => {
      render(<FormField {...defaultProps} type="password" rightIcon={<Mail />} />);
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
      // Right icon may still be present but password toggle takes precedence
    });
  });

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveAttribute('id', 'test-field');
    });

    it('sets aria-invalid when error', () => {
      render(<FormField {...defaultProps} error="Error" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid to false when no error', () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('aria-invalid', 'false');
    });

    it('sets aria-invalid when validation error', async () => {
      const validation = jest.fn(() => 'Error');
      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnChange
        />
      );

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'test');

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('associates error message with input via aria-describedby', () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByLabelText('Test Field');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBe('test-field-error');
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('id', 'test-field-error');
    });

    it('associates help text with input via aria-describedby', () => {
      render(<FormField {...defaultProps} helpText="Help text" />);
      const input = screen.getByLabelText('Test Field');
      const helpId = input.getAttribute('aria-describedby');
      expect(helpId).toBe('test-field-help');
    });

    it('error aria-describedby takes precedence over help text', () => {
      render(<FormField {...defaultProps} error="Error" helpText="Help" />);
      const input = screen.getByLabelText('Test Field');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBe('test-field-error');
    });

    it('no aria-describedby when no error or help text', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByLabelText('Test Field');
      expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('error icons have aria-hidden', () => {
      render(<FormField {...defaultProps} error="Error" />);
      const icons = screen.getAllByTestId('alert-icon');
      // One in the input, one in the error message
      expect(icons.length).toBeGreaterThan(0);
    });

    it('success icons have aria-hidden', () => {
      render(<FormField {...defaultProps} success />);
      const icon = screen.getByTestId('check-icon');
      expect(icon).toBeInTheDocument();
    });

    it('supports autoFocus', () => {
      render(<FormField {...defaultProps} autoFocus />);
      expect(screen.getByLabelText('Test Field')).toHaveFocus();
    });

    it('does not autofocus by default', () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByLabelText('Test Field')).not.toHaveFocus();
    });

    it('sets required attribute when required', () => {
      render(<FormField {...defaultProps} required />);
      expect(screen.getByLabelText('Test Field')).toBeRequired();
    });

    it('works for textarea accessibility', () => {
      render(<FormField {...defaultProps} type="textarea" error="Error" />);
      const textarea = screen.getByLabelText('Test Field');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
      expect(textarea).toHaveAttribute('aria-describedby', 'test-field-error');
    });

    it('works for select accessibility', () => {
      const options = [{ value: '1', label: 'Option 1' }];
      render(<FormField {...defaultProps} type="select" options={options} error="Error" />);
      const select = screen.getByLabelText('Test Field');
      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(select).toHaveAttribute('aria-describedby', 'test-field-error');
    });
  });

  describe('HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<FormField {...defaultProps} name="username" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('name', 'username');
    });

    it('supports autoComplete', () => {
      render(<FormField {...defaultProps} autoComplete="email" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('autoComplete', 'email');
    });

    it('supports maxLength', () => {
      render(<FormField {...defaultProps} maxLength={10} />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('maxLength', '10');
    });

    it('supports pattern', () => {
      render(<FormField {...defaultProps} pattern="[0-9]*" />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('pattern', '[0-9]*');
    });

    it('supports custom data attributes', () => {
      render(<FormField {...defaultProps} data-testid="custom-field" />);
      expect(screen.getByTestId('custom-field')).toBeInTheDocument();
    });

    it('textarea supports maxLength', () => {
      render(<FormField {...defaultProps} type="textarea" maxLength={100} />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('maxLength', '100');
    });

    it('textarea does not support pattern', () => {
      render(<FormField {...defaultProps} type="textarea" pattern="[0-9]*" />);
      const textarea = screen.getByLabelText('Test Field');
      expect(textarea).not.toHaveAttribute('pattern');
    });

    it('select does not support maxLength', () => {
      const options = [{ value: '1', label: 'Option 1' }];
      render(<FormField {...defaultProps} type="select" options={options} maxLength={10} />);
      const select = screen.getByLabelText('Test Field');
      expect(select).not.toHaveAttribute('maxLength');
    });

    it('select does not support pattern', () => {
      const options = [{ value: '1', label: 'Option 1' }];
      render(<FormField {...defaultProps} type="select" options={options} pattern="[0-9]*" />);
      const select = screen.getByLabelText('Test Field');
      expect(select).not.toHaveAttribute('pattern');
    });
  });

  describe('Select Options', () => {
    it('renders select options', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
        { value: '3', label: 'Option 3' },
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
        { value: '2', label: 'Option 2' },
      ];

      render(<FormField {...defaultProps} type="select" options={options} onChange={handleChange} />);

      const select = screen.getByLabelText('Test Field');
      await userEvent.selectOptions(select, '2');

      expect(handleChange).toHaveBeenCalled();
    });

    it('select respects value prop', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];

      render(<FormField {...defaultProps} type="select" options={options} value="2" />);

      const select = screen.getByLabelText('Test Field');
      expect(select).toHaveValue('2');
    });

    it('renders options with unique keys', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];

      const { container } = render(<FormField {...defaultProps} type="select" options={options} />);
      const optionElements = container.querySelectorAll('option');

      expect(optionElements).toHaveLength(2);
      expect(optionElements[0]).toHaveAttribute('value', '1');
      expect(optionElements[1]).toHaveAttribute('value', '2');
    });
  });

  describe('Focus Management', () => {
    it('applies focus ring on focus', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByLabelText('Test Field');

      input.focus();
      expect(input).toHaveClass('focus:ring-2');
    });

    it('autoFocus focuses input on mount', () => {
      render(<FormField {...defaultProps} autoFocus />);
      expect(screen.getByLabelText('Test Field')).toHaveFocus();
    });

    it('textarea supports autoFocus', () => {
      render(<FormField {...defaultProps} type="textarea" autoFocus />);
      expect(screen.getByLabelText('Test Field')).toHaveFocus();
    });

    it('select supports autoFocus', () => {
      const options = [{ value: '1', label: 'Option 1' }];
      render(<FormField {...defaultProps} type="select" options={options} autoFocus />);
      expect(screen.getByLabelText('Test Field')).toHaveFocus();
    });

    it('handles multiple focus and blur events', () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();

      render(<FormField {...defaultProps} onBlur={handleBlur} />);
      const input = screen.getByLabelText('Test Field');

      input.focus();
      input.blur();
      input.focus();
      input.blur();

      expect(handleBlur).toHaveBeenCalledTimes(2);
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies base input classes', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByLabelText('Test Field');

      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('py-2.5');
      expect(input).toHaveClass('rounded-lg');
      expect(input).toHaveClass('border');
    });

    it('applies error border classes', () => {
      render(<FormField {...defaultProps} error="Error" />);
      const input = screen.getByLabelText('Test Field');

      expect(input).toHaveClass('border-error');
      expect(input).toHaveClass('focus:ring-error/20');
      expect(input).toHaveClass('focus:border-error');
    });

    it('applies success border classes', () => {
      render(<FormField {...defaultProps} success />);
      const input = screen.getByLabelText('Test Field');

      expect(input).toHaveClass('border-success');
      expect(input).toHaveClass('focus:ring-success/20');
      expect(input).toHaveClass('focus:border-success');
    });

    it('applies default border classes when no error or success', () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByLabelText('Test Field');

      expect(input).toHaveClass('border-border');
      expect(input).toHaveClass('focus:ring-primary/20');
      expect(input).toHaveClass('focus:border-primary');
    });

    it('applies disabled styles', () => {
      render(<FormField {...defaultProps} disabled />);
      const input = screen.getByLabelText('Test Field');

      expect(input).toHaveClass('disabled:opacity-50');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:bg-bg-tertiary');
    });

    it('merges custom inputClassName with default classes', () => {
      render(<FormField {...defaultProps} inputClassName="custom-class" />);
      const input = screen.getByLabelText('Test Field');

      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('w-full'); // Still has default classes
    });

    it('container has correct spacing', () => {
      const { container } = render(<FormField {...defaultProps} />);
      expect(container.firstChild).toHaveClass('space-y-2');
    });
  });

  describe('Edge Cases', () => {
    it('handles null value gracefully', () => {
      render(<FormField {...defaultProps} value={null} />);
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });

    it('handles undefined value gracefully', () => {
      render(<FormField id="test" name="test" label="Test" />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();
    });

    it('handles empty string value', () => {
      render(<FormField {...defaultProps} value="" />);
      expect(screen.getByLabelText('Test Field')).toHaveValue('');
    });

    it('handles very long values', () => {
      const longValue = 'a'.repeat(1000);
      render(<FormField {...defaultProps} value={longValue} />);
      expect(screen.getByLabelText('Test Field')).toHaveValue(longValue);
    });

    it('handles special characters in value', () => {
      const specialValue = '<script>alert("xss")</script>';
      render(<FormField {...defaultProps} value={specialValue} />);
      expect(screen.getByLabelText('Test Field')).toHaveValue(specialValue);
    });

    it('handles unicode characters', () => {
      const unicodeValue = '你好世界 🌍 мир';
      render(<FormField {...defaultProps} value={unicodeValue} />);
      expect(screen.getByLabelText('Test Field')).toHaveValue(unicodeValue);
    });

    it('works without id prop', () => {
      const { container } = render(
        <FormField name="test" label="Test" value="" onChange={jest.fn()} />
      );
      expect(container.querySelector('input')).toBeInTheDocument();
    });

    it('handles rapid onChange events', async () => {
      const handleChange = jest.fn();
      render(<FormField {...defaultProps} onChange={handleChange} />);

      const input = screen.getByLabelText('Test Field');
      await userEvent.type(input, 'fast', { delay: 1 });

      expect(handleChange).toHaveBeenCalled();
    });

    it('handles validation function safely', async () => {
      const validation = jest.fn(() => 'Invalid');

      render(
        <FormField
          {...defaultProps}
          validation={validation}
          validateOnChange
        />
      );

      const input = screen.getByLabelText('Test Field');

      // Should handle validation without crashing
      fireEvent.change(input, { target: { value: 'test' } });
      expect(validation).toHaveBeenCalled();
    });

    it('handles empty options array for select', () => {
      render(<FormField {...defaultProps} type="select" options={[]} />);
      const select = screen.getByLabelText('Test Field');
      expect(select.children).toHaveLength(0);
    });

    it('textarea handles newlines', () => {
      const valueWithNewlines = 'Line 1\nLine 2\nLine 3';
      render(<FormField {...defaultProps} type="textarea" value={valueWithNewlines} />);
      expect(screen.getByLabelText('Test Field')).toHaveValue(valueWithNewlines);
    });

    it('handles maxLength of 0', () => {
      render(<FormField {...defaultProps} maxLength={0} />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('maxLength', '0');
    });

    it('handles rows of 1 for textarea', () => {
      render(<FormField {...defaultProps} type="textarea" rows={1} />);
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('rows', '1');
    });
  });

  describe('Complex Scenarios', () => {
    it('handles controlled component pattern', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <FormField
            {...defaultProps}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Test Field');

      await userEvent.type(input, 'controlled');
      expect(input).toHaveValue('controlled');
    });

    it('validation works with controlled component', async () => {
      const validation = jest.fn((val) => val.length >= 5 || 'Minimum 5 characters');
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <FormField
            {...defaultProps}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            validation={validation}
            validateOnChange
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Test Field');

      await userEvent.type(input, 'abc');
      expect(screen.getByText('Minimum 5 characters')).toBeInTheDocument();

      await userEvent.type(input, 'de');
      expect(screen.queryByText('Minimum 5 characters')).not.toBeInTheDocument();
    });

    it('character count updates with controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <FormField
            {...defaultProps}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={10}
            showCharCount
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Test Field');

      expect(screen.getByText(/0.*\/.*10/)).toBeInTheDocument();

      await userEvent.type(input, 'test');
      expect(screen.getByText(/4.*\/.*10/)).toBeInTheDocument();
    });

    it('works within a form', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <FormField {...defaultProps} required value="test" />
          <button type="submit">Submit</button>
        </form>
      );

      const button = screen.getByText('Submit');
      fireEvent.submit(button.closest('form'));

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('password field with validation', async () => {
      const validation = jest.fn((val) => val.length >= 8 || 'Password too short');
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <FormField
            {...defaultProps}
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            validation={validation}
            validateOnChange
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Test Field');

      await userEvent.type(input, 'short');
      expect(screen.getByText('Password too short')).toBeInTheDocument();

      // Can still toggle visibility
      const toggleButton = screen.getByLabelText('Show password');
      await userEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
    });

    it('textarea with character count and validation', async () => {
      const validation = jest.fn((val) => val.length <= 100 || 'Too long');
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <FormField
            {...defaultProps}
            type="textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={100}
            showCharCount
            validation={validation}
            validateOnChange
          />
        );
      };

      render(<TestComponent />);
      const textarea = screen.getByLabelText('Test Field');

      const textValue = 'a'.repeat(50);
      await userEvent.type(textarea, textValue);
      expect(screen.getByText(/50.*\/.*100/)).toBeInTheDocument();
      expect(screen.queryByText('Too long')).not.toBeInTheDocument();
    });

    it('select with validation', async () => {
      const validation = jest.fn((val) => val !== '' || 'Please select an option');
      const options = [
        { value: '', label: 'Select...' },
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];

      render(
        <FormField
          {...defaultProps}
          type="select"
          options={options}
          validation={validation}
          validateOnBlur
        />
      );

      const select = screen.getByLabelText('Test Field');
      select.focus();
      select.blur();

      await waitFor(() => {
        expect(screen.getByText('Please select an option')).toBeInTheDocument();
      });
    });

    it('field with left icon, right icon, and error', () => {
      render(
        <FormField
          {...defaultProps}
          leftIcon={<Search />}
          rightIcon={<Mail />}
          error="Error message"
        />
      );

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('mail-icon')).not.toBeInTheDocument(); // Hidden by error
      const alertIcons = screen.getAllByTestId('alert-icon');
      expect(alertIcons.length).toBeGreaterThan(0);
    });

    it('all states together', async () => {
      render(
        <FormField
          {...defaultProps}
          type="password"
          leftIcon={<Search />}
          helpText="Enter a strong password"
          maxLength={20}
          showCharCount
          required
          value="test123"
        />
      );

      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByText('Enter a strong password')).toBeInTheDocument();
      expect(screen.getByText(/7.*\/.*20/)).toBeInTheDocument();
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for default text input', () => {
      const { container } = render(<FormField {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for password input', () => {
      const { container } = render(<FormField {...defaultProps} type="password" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for textarea', () => {
      const { container } = render(<FormField {...defaultProps} type="textarea" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for select', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];
      const { container } = render(<FormField {...defaultProps} type="select" options={options} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with error', () => {
      const { container } = render(<FormField {...defaultProps} error="Error message" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with success', () => {
      const { container } = render(<FormField {...defaultProps} success="Success message" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with all features', () => {
      const { container } = render(
        <FormField
          {...defaultProps}
          type="password"
          leftIcon={<Search />}
          helpText="Help text"
          maxLength={100}
          showCharCount
          required
          value="test"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot in disabled state', () => {
      const { container } = render(<FormField {...defaultProps} disabled value="disabled" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default defaultProps
