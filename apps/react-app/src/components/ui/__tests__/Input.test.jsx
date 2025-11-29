import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search, Mail } from 'lucide-react';
import Input from '../Input';

describe('Input', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Input defaultValue="default text" />);
      expect(screen.getByRole('textbox')).toHaveValue('default text');
    });

    it('renders with controlled value', () => {
      render(<Input value="controlled" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
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
  });

  describe('Sizes', () => {
    it('applies small size', () => {
      render(<Input size="sm" />);
      expect(screen.getByRole('textbox')).toHaveClass('input-sm');
    });

    it('applies medium size (default)', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveClass('input');
    });

    it('applies large size', () => {
      render(<Input size="lg" />);
      expect(screen.getByRole('textbox')).toHaveClass('input-lg');
    });
  });

  describe('States', () => {
    it('can be disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('can be readonly', () => {
      render(<Input readonly value="readonly text" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
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

    it('shows error state', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows success state', () => {
      render(<Input success="Looks good!" />);
      expect(screen.getByText('Looks good!')).toBeInTheDocument();
    });

    it('applies error border', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-error');
    });

    it('applies success border', () => {
      render(<Input success />);
      expect(screen.getByRole('textbox')).toHaveClass('border-success');
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
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      const { container } = render(<Input leftIcon={<Search />} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      const { container } = render(<Input rightIcon={<Mail />} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('applies padding for left icon', () => {
      render(<Input leftIcon={<Search />} />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pl-\d+/);
    });

    it('applies padding for right icon', () => {
      render(<Input rightIcon={<Mail />} />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pr-\d+/);
    });
  });

  describe('Clearable', () => {
    it('shows clear button when clearable and has value', async () => {
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

    it('clears input on clear button click', async () => {
      const handleChange = jest.fn();
      render(<Input clearable defaultValue="test" onChange={handleChange} />);

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

    it('focuses input after clearing', async () => {
      render(<Input clearable defaultValue="test" />);

      const clearButton = screen.getByLabelText('Clear input');
      await userEvent.click(clearButton);

      const input = screen.getByRole('textbox');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Password Toggle', () => {
    it('shows password toggle for password inputs', () => {
      render(<Input type="password" showPasswordToggle />);
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });

    it('does not show toggle when showPasswordToggle is false', () => {
      render(<Input type="password" />);
      expect(screen.queryByLabelText('Show password')).not.toBeInTheDocument();
    });

    it('does not show toggle when disabled', () => {
      render(<Input type="password" showPasswordToggle disabled />);
      expect(screen.queryByLabelText('Show password')).not.toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
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

    it('associates helper text with input via aria-describedby', () => {
      render(<Input helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      const helperTextId = input.getAttribute('aria-describedby');
      expect(helperTextId).toBeTruthy();
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

    it('sets aria-invalid on error', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid to false when no error', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('associates error message with input', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
    });

    it('error message has role="alert"', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('icons have aria-hidden', () => {
      const { container } = render(<Input leftIcon={<Search />} />);
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<Input name="username" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
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

    it('supports minLength', () => {
      render(<Input minLength={3} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minLength', '3');
    });

    it('supports pattern', () => {
      render(<Input pattern="[0-9]*" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]*');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to input', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('applies custom containerClassName', () => {
      const { container } = render(<Input containerClassName="custom-container" />);
      expect(container.firstChild).toHaveClass('custom-container');
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

    it('works without onChange in uncontrolled mode', async () => {
      render(<Input defaultValue="test" />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'more');
      expect(input).toHaveValue('testmore');
    });
  });
});

export default input
