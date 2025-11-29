import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search, Mail, User, Lock, Phone, Calendar } from 'lucide-react';
import Input from './Input';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Eye: (props) => <svg data-testid="eye-icon" {...props} />,
  EyeOff: (props) => <svg data-testid="eyeoff-icon" {...props} />,
  AlertCircle: (props) => <svg data-testid="alert-icon" {...props} />,
  CheckCircle: (props) => <svg data-testid="check-icon" {...props} />,
  X: (props) => <svg data-testid="x-icon" {...props} />,
  Search: (props) => <svg data-testid="search-icon" {...props} />,
  Mail: (props) => <svg data-testid="mail-icon" {...props} />,
  User: (props) => <svg data-testid="user-icon" {...props} />,
  Lock: (props) => <svg data-testid="lock-icon" {...props} />,
  Phone: (props) => <svg data-testid="phone-icon" {...props} />,
  Calendar: (props) => <svg data-testid="calendar-icon" {...props} />
}));

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default type text', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with multiple placeholders correctly', () => {
      const { rerender } = render(<Input placeholder="First" />);
      expect(screen.getByPlaceholderText('First')).toBeInTheDocument();

      rerender(<Input placeholder="Second" />);
      expect(screen.getByPlaceholderText('Second')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('renders with label and placeholder', () => {
      render(<Input label="Username" placeholder="Enter username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Input defaultValue="default text" />);
      expect(screen.getByRole('textbox')).toHaveValue('default text');
    });

    it('renders with controlled value', () => {
      render(<Input value="controlled" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });

    it('renders without label when not provided', () => {
      const { container } = render(<Input />);
      expect(container.querySelector('label')).not.toBeInTheDocument();
    });

    it('renders with complex label text', () => {
      render(<Input label="Email Address (required)" />);
      expect(screen.getByText(/Email Address/)).toBeInTheDocument();
    });

    it('applies default variant', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('input');
    });
  });

  describe('Input Types', () => {
    it('renders as text input by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders as email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders as password input', () => {
      const { container } = render(<Input type="password" />);
      const input = container.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders as number input', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('renders as tel input', () => {
      render(<Input type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('renders as url input', () => {
      render(<Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('renders as search input', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('renders as date input', () => {
      render(<Input type="date" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('renders as time input', () => {
      render(<Input type="time" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'time');
    });

    it('changes type dynamically', () => {
      const { rerender } = render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');

      rerender(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });
  });

  describe('Size Variants', () => {
    it('applies small size class', () => {
      render(<Input size="sm" />);
      expect(screen.getByRole('textbox')).toHaveClass('input-sm');
    });

    it('applies medium size by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveClass('input');
    });

    it('applies large size class', () => {
      render(<Input size="lg" />);
      expect(screen.getByRole('textbox')).toHaveClass('input-lg');
    });

    it('applies medium size explicitly', () => {
      render(<Input size="md" />);
      expect(screen.getByRole('textbox')).toHaveClass('input');
    });

    it('changes size dynamically', () => {
      const { rerender } = render(<Input size="sm" />);
      expect(screen.getByRole('textbox')).toHaveClass('input-sm');

      rerender(<Input size="lg" />);
      expect(screen.getByRole('textbox')).toHaveClass('input-lg');
    });
  });

  describe('State Management', () => {
    it('can be disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables user input when disabled', async () => {
      const handleChange = jest.fn();
      render(<Input disabled onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('can be readonly', () => {
      render(<Input readonly value="readonly text" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('prevents editing when readonly', async () => {
      render(<Input readonly value="initial" onChange={() => {}} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'more');
      expect(input).toHaveValue('initial');
    });

    it('can be required', () => {
      render(<Input required label="Required Field" />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('shows required asterisk in label', () => {
      render(<Input required label="Required Field" />);
      const label = screen.getByText('Required Field');
      expect(label).toHaveClass("after:content-['*']");
    });

    it('does not show asterisk when not required', () => {
      render(<Input label="Optional Field" />);
      const label = screen.getByText('Optional Field');
      expect(label).not.toHaveClass("after:content-['*']");
    });

    it('shows error state', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows success state with boolean', () => {
      render(<Input success />);
      expect(screen.getByRole('textbox')).toHaveClass('border-success');
    });

    it('shows success state with message', () => {
      render(<Input success="Looks good!" />);
      expect(screen.getByText('Looks good!')).toBeInTheDocument();
    });

    it('applies error border class', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-error');
    });

    it('applies success border class', () => {
      render(<Input success />);
      expect(screen.getByRole('textbox')).toHaveClass('border-success');
    });

    it('error takes precedence over success', () => {
      render(<Input error="Error" success="Success" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-error');
      expect(screen.getByRole('textbox')).not.toHaveClass('border-success');
    });

    it('shows error icon when error is present', () => {
      render(<Input error="Error message" />);
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('shows success icon when success is present', () => {
      render(<Input success />);
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('does not show success icon when error is also present', () => {
      render(<Input error="Error" success="Success" />);
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });

    it('applies disabled opacity to label', () => {
      render(<Input label="Disabled" disabled />);
      const label = screen.getByText('Disabled');
      expect(label).toHaveClass('opacity-50');
    });
  });

  describe('User Interactions', () => {
    it('handles onChange events', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('hello');
    });

    it('calls onChange with correct event', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'a');

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 'a'
          })
        })
      );
    });

    it('handles onFocus events', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles onBlur events', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      input.focus();
      input.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles focus and blur in sequence', () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      input.focus();
      expect(handleFocus).toHaveBeenCalledTimes(1);

      input.blur();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('works as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test');
      expect(input).toHaveValue('test');
    });

    it('works as uncontrolled component', async () => {
      render(<Input defaultValue="initial" />);
      const input = screen.getByRole('textbox');

      await userEvent.clear(input);
      await userEvent.type(input, 'new value');
      expect(input).toHaveValue('new value');
    });

    it('updates internal value in uncontrolled mode', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'typing');
      expect(input).toHaveValue('typing');
    });

    it('does not break when onChange is not provided', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test');
      expect(input).toHaveValue('test');
    });

    it('handles rapid typing', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'rapid', { delay: 1 });

      expect(input).toHaveValue('rapid');
      expect(handleChange).toHaveBeenCalledTimes(5);
    });

    it('handles paste events', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      await userEvent.click(input);
      await userEvent.paste('pasted text');

      expect(input).toHaveValue('pasted text');
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      render(<Input leftIcon={<Search />} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(<Input rightIcon={<Mail />} />);
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('renders with both left and right icons', () => {
      render(<Input leftIcon={<Search />} rightIcon={<Mail />} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('applies padding for left icon with small size', () => {
      render(<Input leftIcon={<Search />} size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pl-8/);
    });

    it('applies padding for left icon with medium size', () => {
      render(<Input leftIcon={<Search />} size="md" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pl-10/);
    });

    it('applies padding for left icon with large size', () => {
      render(<Input leftIcon={<Search />} size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pl-12/);
    });

    it('applies padding for right icon with small size', () => {
      render(<Input rightIcon={<Mail />} size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pr-8/);
    });

    it('applies padding for right icon with medium size', () => {
      render(<Input rightIcon={<Mail />} size="md" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pr-10/);
    });

    it('applies padding for right icon with large size', () => {
      render(<Input rightIcon={<Mail />} size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pr-12/);
    });

    it('hides right icon when error is shown', () => {
      render(<Input rightIcon={<Mail />} error="Error" />);
      expect(screen.queryByTestId('mail-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('hides right icon when success is shown', () => {
      render(<Input rightIcon={<Mail />} success />);
      expect(screen.queryByTestId('mail-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('sets aria-hidden on left icon', () => {
      render(<Input leftIcon={<Search />} />);
      const icon = screen.getByTestId('search-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('sets aria-hidden on right icon', () => {
      render(<Input rightIcon={<Mail />} />);
      const icon = screen.getByTestId('mail-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Clearable Functionality', () => {
    it('shows clear button when clearable and has value', () => {
      render(<Input clearable defaultValue="test" />);
      expect(screen.getByLabelText('Clear input')).toBeInTheDocument();
    });

    it('does not show clear button when empty', () => {
      render(<Input clearable />);
      expect(screen.queryByLabelText('Clear input')).not.toBeInTheDocument();
    });

    it('does not show clear button when disabled', () => {
      render(<Input clearable disabled defaultValue="test" />);
      expect(screen.queryByLabelText('Clear input')).not.toBeInTheDocument();
    });

    it('does not show clear button when readonly', () => {
      render(<Input clearable readonly defaultValue="test" onChange={() => {}} />);
      expect(screen.queryByLabelText('Clear input')).not.toBeInTheDocument();
    });

    it('does not show clear button when clearable is false', () => {
      render(<Input clearable={false} defaultValue="test" />);
      expect(screen.queryByLabelText('Clear input')).not.toBeInTheDocument();
    });

    it('clears input on clear button click', async () => {
      render(<Input clearable defaultValue="test" />);

      const clearButton = screen.getByLabelText('Clear input');
      await userEvent.click(clearButton);

      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('calls onClear when clear button clicked', async () => {
      const handleClear = jest.fn();
      render(<Input clearable defaultValue="test" onClear={handleClear} />);

      const clearButton = screen.getByLabelText('Clear input');
      await userEvent.click(clearButton);

      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('calls onChange when clearing in controlled mode', async () => {
      const handleChange = jest.fn();
      render(<Input clearable value="test" onChange={handleChange} />);

      const clearButton = screen.getByLabelText('Clear input');
      await userEvent.click(clearButton);

      expect(handleChange).toHaveBeenCalled();
    });

    it('focuses input after clearing', async () => {
      render(<Input clearable defaultValue="test" />);

      const clearButton = screen.getByLabelText('Clear input');
      await userEvent.click(clearButton);

      const input = screen.getByRole('textbox');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('hides clear button after clearing', async () => {
      render(<Input clearable defaultValue="test" />);

      const clearButton = screen.getByLabelText('Clear input');
      await userEvent.click(clearButton);

      expect(screen.queryByLabelText('Clear input')).not.toBeInTheDocument();
    });

    it('shows clear button again after typing', async () => {
      render(<Input clearable />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'new');

      expect(screen.getByLabelText('Clear input')).toBeInTheDocument();
    });

    it('clear button has correct tabIndex', () => {
      render(<Input clearable defaultValue="test" />);
      const clearButton = screen.getByLabelText('Clear input');
      expect(clearButton).toHaveAttribute('tabIndex', '-1');
    });

    it('prevents default on clear button click', async () => {
      const preventDefault = jest.fn();
      render(<Input clearable defaultValue="test" />);

      const clearButton = screen.getByLabelText('Clear input');
      fireEvent.click(clearButton, { preventDefault });

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('Password Toggle', () => {
    it('shows password toggle for password inputs when enabled', () => {
      render(<Input type="password" showPasswordToggle />);
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });

    it('does not show toggle when showPasswordToggle is false', () => {
      render(<Input type="password" />);
      expect(screen.queryByLabelText('Show password')).not.toBeInTheDocument();
    });

    it('does not show toggle for non-password inputs', () => {
      render(<Input type="text" showPasswordToggle />);
      expect(screen.queryByLabelText('Show password')).not.toBeInTheDocument();
    });

    it('does not show toggle when disabled', () => {
      render(<Input type="password" showPasswordToggle disabled />);
      expect(screen.queryByLabelText('Show password')).not.toBeInTheDocument();
    });

    it('toggles password visibility on click', async () => {
      const { container } = render(<Input type="password" showPasswordToggle defaultValue="secret" />);

      const input = container.querySelector('input');
      expect(input).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByLabelText('Show password');
      await userEvent.click(toggleButton);

      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    });

    it('toggles back to password type', async () => {
      const { container } = render(<Input type="password" showPasswordToggle defaultValue="secret" />);

      const toggleButton = screen.getByLabelText('Show password');
      await userEvent.click(toggleButton);

      const hideButton = screen.getByLabelText('Hide password');
      await userEvent.click(hideButton);

      const input = container.querySelector('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('shows eye icon when password is hidden', () => {
      render(<Input type="password" showPasswordToggle />);
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('shows eyeoff icon when password is visible', async () => {
      render(<Input type="password" showPasswordToggle />);

      const toggleButton = screen.getByLabelText('Show password');
      await userEvent.click(toggleButton);

      expect(screen.getByTestId('eyeoff-icon')).toBeInTheDocument();
    });

    it('password toggle has correct tabIndex', () => {
      render(<Input type="password" showPasswordToggle />);
      const toggleButton = screen.getByLabelText('Show password');
      expect(toggleButton).toHaveAttribute('tabIndex', '-1');
    });

    it('maintains input value when toggling visibility', async () => {
      render(<Input type="password" showPasswordToggle defaultValue="secret123" />);
      const input = screen.getByRole('textbox');

      const toggleButton = screen.getByLabelText('Show password');
      await userEvent.click(toggleButton);

      expect(input).toHaveValue('secret123');
    });
  });

  describe('Helper Text', () => {
    it('renders helper text', () => {
      render(<Input helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('hides helper text when error is shown', () => {
      render(<Input helperText="Helper" error="Error" />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('shows helper text when success is shown', () => {
      render(<Input helperText="Helper" success />);
      expect(screen.getByText('Helper')).toBeInTheDocument();
    });

    it('associates helper text with input via aria-describedby', () => {
      render(<Input helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      const helperTextId = input.getAttribute('aria-describedby');
      expect(helperTextId).toBeTruthy();
      expect(helperTextId).toContain('helper');
    });

    it('renders long helper text', () => {
      const longText = 'This is a very long helper text that provides detailed information about the input field';
      render(<Input helperText={longText} />);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe('Error Messages', () => {
    it('renders error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('error message has correct role', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('associates error with input via aria-describedby', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(errorId).toContain('error');
    });

    it('shows error icon in message', () => {
      render(<Input error="Error" />);
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer.querySelector('[data-testid="alert-icon"]')).toBeInTheDocument();
    });

    it('error icon has aria-hidden', () => {
      render(<Input error="Error" />);
      const errorIcon = screen.getByRole('alert').querySelector('[data-testid="alert-icon"]');
      expect(errorIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('changes error message dynamically', () => {
      const { rerender } = render(<Input error="First error" />);
      expect(screen.getByText('First error')).toBeInTheDocument();

      rerender(<Input error="Second error" />);
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });
  });

  describe('Success Messages', () => {
    it('renders success message as string', () => {
      render(<Input success="Looks good!" />);
      expect(screen.getByText('Looks good!')).toBeInTheDocument();
    });

    it('does not render message for boolean success', () => {
      render(<Input success={true} />);
      expect(screen.queryByText('Looks good!')).not.toBeInTheDocument();
    });

    it('shows success icon in message', () => {
      render(<Input success="Success" />);
      const successText = screen.getByText('Success');
      expect(successText.parentElement.querySelector('[data-testid="check-icon"]')).toBeInTheDocument();
    });

    it('success icon has aria-hidden', () => {
      render(<Input success="Success" />);
      const successIcons = screen.getAllByTestId('check-icon');
      successIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<Input label="Email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('generates unique ID when not provided', () => {
      render(<Input label="Field" />);
      const input = screen.getByLabelText('Field');
      expect(input).toHaveAttribute('id');
    });

    it('generates different IDs for multiple inputs', () => {
      render(
        <>
          <Input label="First" />
          <Input label="Second" />
        </>
      );
      const first = screen.getByLabelText('First');
      const second = screen.getByLabelText('Second');
      expect(first.id).not.toBe(second.id);
    });

    it('sets aria-invalid on error', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid to false when no error', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('updates aria-invalid dynamically', () => {
      const { rerender } = render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');

      rerender(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('combines multiple aria-describedby values', () => {
      render(<Input helperText="Helper" error="Error" aria-describedby="custom-id" />);
      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('error');
      expect(describedBy).toContain('custom-id');
    });

    it('icons have aria-hidden', () => {
      render(<Input leftIcon={<Search />} />);
      const icon = screen.getByTestId('search-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('error icon has aria-hidden', () => {
      render(<Input error="Error" />);
      const icons = screen.getAllByTestId('alert-icon');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('success icon has aria-hidden', () => {
      render(<Input success />);
      const icon = screen.getByTestId('check-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('clear button has descriptive label', () => {
      render(<Input clearable defaultValue="test" />);
      expect(screen.getByLabelText('Clear input')).toBeInTheDocument();
    });

    it('password toggle has descriptive labels', async () => {
      render(<Input type="password" showPasswordToggle />);
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();

      await userEvent.click(screen.getByLabelText('Show password'));
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<Input name="username" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
    });

    it('supports id attribute', () => {
      render(<Input id="custom-id" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-id');
    });

    it('supports autoComplete', () => {
      render(<Input autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autoComplete', 'email');
    });

    it('supports autoFocus', () => {
      render(<Input autoFocus />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('supports maxLength', () => {
      render(<Input maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
    });

    it('enforces maxLength', async () => {
      render(<Input maxLength={5} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '1234567890');
      expect(input.value.length).toBeLessThanOrEqual(5);
    });

    it('supports minLength', () => {
      render(<Input minLength={3} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minLength', '3');
    });

    it('supports pattern', () => {
      render(<Input pattern="[0-9]*" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]*');
    });

    it('supports multiple patterns', () => {
      const { rerender } = render(<Input pattern="[0-9]*" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]*');

      rerender(<Input pattern="[a-z]*" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[a-z]*');
    });

    it('supports custom data attributes', () => {
      render(<Input data-testid="custom-input" data-custom="value" />);
      const input = screen.getByTestId('custom-input');
      expect(input).toHaveAttribute('data-custom', 'value');
    });

    it('supports aria-label', () => {
      render(<Input aria-label="Search" />);
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to input', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('preserves base classes with custom className', () => {
      render(<Input className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('input');
      expect(input).toHaveClass('custom-input');
    });

    it('applies custom containerClassName', () => {
      const { container } = render(<Input containerClassName="custom-container" />);
      expect(container.firstChild).toHaveClass('custom-container');
    });

    it('combines multiple class names', () => {
      render(<Input className="class1 class2 class3" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('class1');
      expect(input).toHaveClass('class2');
      expect(input).toHaveClass('class3');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('can focus input via ref', () => {
      const ref = React.createRef();
      render(<Input ref={ref} />);
      ref.current.focus();
      expect(ref.current).toHaveFocus();
    });

    it('can blur input via ref', () => {
      const ref = React.createRef();
      render(<Input ref={ref} autoFocus />);
      ref.current.blur();
      expect(ref.current).not.toHaveFocus();
    });

    it('can get input value via ref', () => {
      const ref = React.createRef();
      render(<Input ref={ref} defaultValue="test" />);
      expect(ref.current.value).toBe('test');
    });

    it('can set input value via ref', () => {
      const ref = React.createRef();
      render(<Input ref={ref} />);
      ref.current.value = 'new value';
      expect(ref.current.value).toBe('new value');
    });

    it('ref is used in clear functionality', async () => {
      const ref = React.createRef();
      render(<Input ref={ref} clearable defaultValue="test" />);

      const clearButton = screen.getByLabelText('Clear input');
      await userEvent.click(clearButton);

      await waitFor(() => {
        expect(ref.current).toHaveFocus();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles null value gracefully', () => {
      render(<Input value={null} onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('handles undefined value gracefully', () => {
      render(<Input value={undefined} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('handles empty string value', () => {
      render(<Input value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('handles numeric value in text input', () => {
      render(<Input defaultValue={123} />);
      expect(screen.getByRole('textbox')).toHaveValue('123');
    });

    it('works without onChange in uncontrolled mode', async () => {
      render(<Input defaultValue="test" />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'more');
      expect(input).toHaveValue('testmore');
    });

    it('handles switching between controlled and uncontrolled', () => {
      const { rerender } = render(<Input defaultValue="uncontrolled" />);
      expect(screen.getByRole('textbox')).toHaveValue('uncontrolled');

      rerender(<Input value="controlled" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });

    it('handles empty label', () => {
      render(<Input label="" />);
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('handles empty placeholder', () => {
      render(<Input placeholder="" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', '');
    });

    it('handles very long values', async () => {
      const longValue = 'a'.repeat(1000);
      render(<Input defaultValue={longValue} />);
      expect(screen.getByRole('textbox')).toHaveValue(longValue);
    });

    it('handles special characters in value', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<Input defaultValue={specialChars} />);
      expect(screen.getByRole('textbox')).toHaveValue(specialChars);
    });

    it('handles Unicode characters', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '你好🎉');
      expect(input).toHaveValue('你好🎉');
    });

    it('handles multiple spaces', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'a    b');
      expect(input).toHaveValue('a    b');
    });

    it('handles newline characters in value', () => {
      render(<Input defaultValue="line1\nline2" />);
      expect(screen.getByRole('textbox')).toHaveValue('line1\nline2');
    });
  });

  describe('Complex Scenarios', () => {
    it('handles all features together', () => {
      render(
        <Input
          label="Email"
          placeholder="Enter email"
          leftIcon={<Mail />}
          clearable
          required
          helperText="We'll never share your email"
          size="lg"
        />
      );

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
    });

    it('handles password input with all features', async () => {
      render(
        <Input
          type="password"
          label="Password"
          showPasswordToggle
          clearable
          required
          defaultValue="secret"
        />
      );

      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear input')).toBeInTheDocument();
    });

    it('handles controlled input with validation', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState('');

        const handleChange = (e) => {
          const newValue = e.target.value;
          setValue(newValue);
          if (newValue.length < 3) {
            setError('Must be at least 3 characters');
          } else {
            setError('');
          }
        };

        return (
          <Input
            value={value}
            onChange={handleChange}
            error={error}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'ab');
      expect(screen.getByText('Must be at least 3 characters')).toBeInTheDocument();

      await userEvent.type(input, 'c');
      expect(screen.queryByText('Must be at least 3 characters')).not.toBeInTheDocument();
    });

    it('handles dynamic state changes', async () => {
      const TestComponent = () => {
        const [disabled, setDisabled] = React.useState(false);
        const [value, setValue] = React.useState('');

        return (
          <>
            <button onClick={() => setDisabled(!disabled)}>Toggle</button>
            <Input
              disabled={disabled}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </>
        );
      };

      render(<TestComponent />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test');
      expect(input).toHaveValue('test');

      await userEvent.click(screen.getByText('Toggle'));
      expect(input).toBeDisabled();
    });

    it('handles form submission', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Input name="email" defaultValue="test@example.com" />
          <button type="submit">Submit</button>
        </form>
      );

      await userEvent.click(screen.getByText('Submit'));
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('handles multiple inputs in a form', async () => {
      render(
        <form>
          <Input name="firstName" label="First Name" />
          <Input name="lastName" label="Last Name" />
          <Input name="email" label="Email" type="email" />
        </form>
      );

      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('handles clearing in controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('initial');

        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            clearable
          />
        );
      };

      render(<TestComponent />);

      const clearButton = screen.getByLabelText('Clear input');
      await userEvent.click(clearButton);

      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('handles size change with icons', () => {
      const { rerender } = render(
        <Input leftIcon={<Search />} rightIcon={<Mail />} size="sm" />
      );

      let input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pl-8/);
      expect(input.className).toMatch(/pr-8/);

      rerender(<Input leftIcon={<Search />} rightIcon={<Mail />} size="lg" />);
      input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pl-12/);
      expect(input.className).toMatch(/pr-12/);
    });
  });

  describe('Display Name', () => {
    it('has correct display name', () => {
      expect(Input.displayName).toBe('Input');
    });
  });
});

export default input
