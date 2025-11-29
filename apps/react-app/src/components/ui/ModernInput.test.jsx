import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import ModernInput, { ModernTextarea } from './ModernInput';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
  Lock: () => <svg data-testid="lock-icon" />,
  User: () => <svg data-testid="user-icon" />,
  Eye: () => <svg data-testid="eye-icon" />,
  EyeOff: () => <svg data-testid="eyeoff-icon" />,
}));

describe('ModernInput', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<ModernInput />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<ModernInput placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<ModernInput label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<ModernInput defaultValue="default text" />);
      expect(screen.getByRole('textbox')).toHaveValue('default text');
    });

    it('renders with controlled value', () => {
      render(<ModernInput value="controlled" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });

    it('renders with custom className', () => {
      const { container } = render(<ModernInput className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has proper display name', () => {
      expect(ModernInput.displayName).toBe('ModernInput');
    });
  });

  describe('Label Functionality', () => {
    it('associates label with input', () => {
      render(<ModernInput label="Email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('generates unique ID when not provided', () => {
      render(<ModernInput label="Field" />);
      const input = screen.getByLabelText('Field');
      const id = input.getAttribute('id');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^input-/);
    });

    it('generates different IDs for multiple inputs', () => {
      const { container } = render(
        <>
          <ModernInput label="Field 1" />
          <ModernInput label="Field 2" />
        </>
      );
      const inputs = container.querySelectorAll('input');
      const id1 = inputs[0].getAttribute('id');
      const id2 = inputs[1].getAttribute('id');
      expect(id1).not.toBe(id2);
    });

    it('uses provided id over generated one', () => {
      render(<ModernInput label="Custom" id="custom-id" />);
      const input = screen.getByLabelText('Custom');
      expect(input).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Variants', () => {
    it('applies glass variant by default', () => {
      render(<ModernInput />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/bg-bg-glass-primary/);
      expect(input.className).toMatch(/backdrop-filter/);
    });

    it('applies glass variant explicitly', () => {
      render(<ModernInput variant="glass" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/bg-bg-glass-primary/);
      expect(input.className).toMatch(/backdrop-blur-md/);
    });

    it('applies solid variant', () => {
      render(<ModernInput variant="solid" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/bg-bg-secondary/);
    });

    it('applies gradient variant', () => {
      render(<ModernInput variant="gradient" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/bg-gradient-to-r/);
      expect(input.className).toMatch(/from-bg-secondary/);
      expect(input.className).toMatch(/to-bg-tertiary/);
    });

    it('handles invalid variant gracefully', () => {
      render(<ModernInput variant="invalid" />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<ModernInput />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/px-4/);
      expect(input.className).toMatch(/py-3/);
      expect(input.className).toMatch(/text-base/);
    });

    it('applies small size', () => {
      render(<ModernInput size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/px-3/);
      expect(input.className).toMatch(/py-2/);
      expect(input.className).toMatch(/text-sm/);
      expect(input.className).toMatch(/rounded-lg/);
    });

    it('applies medium size explicitly', () => {
      render(<ModernInput size="md" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/px-4/);
      expect(input.className).toMatch(/py-3/);
      expect(input.className).toMatch(/rounded-xl/);
    });

    it('applies large size', () => {
      render(<ModernInput size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/px-5/);
      expect(input.className).toMatch(/py-4/);
      expect(input.className).toMatch(/text-lg/);
      expect(input.className).toMatch(/rounded-xl/);
    });
  });

  describe('Input Types', () => {
    it('renders as text input by default', () => {
      render(<ModernInput />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders as email input', () => {
      render(<ModernInput type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders as password input', () => {
      const { container } = render(<ModernInput type="password" />);
      const input = container.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders as number input', () => {
      render(<ModernInput type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('renders as tel input', () => {
      render(<ModernInput type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('renders as url input', () => {
      render(<ModernInput type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('renders as search input', () => {
      render(<ModernInput type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('renders as date input', () => {
      const { container } = render(<ModernInput type="date" />);
      const input = container.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('can be disabled', () => {
      render(<ModernInput disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input.className).toMatch(/disabled:opacity-50/);
      expect(input.className).toMatch(/disabled:cursor-not-allowed/);
    });

    it('can be readonly', () => {
      render(<ModernInput readOnly value="readonly text" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readOnly');
    });

    it('can be required', () => {
      render(<ModernInput required label="Required Field" />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('shows error state', () => {
      render(<ModernInput error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error border styling', () => {
      render(<ModernInput error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/border-error/);
      expect(input.className).toMatch(/focus:border-error/);
      expect(input.className).toMatch(/focus:ring-error/);
    });

    it('error message has proper styling', () => {
      render(<ModernInput error="Error message" />);
      const errorElement = screen.getByText('Error message');
      expect(errorElement.className).toMatch(/text-error/);
      expect(errorElement.className).toMatch(/text-sm/);
      expect(errorElement.className).toMatch(/animate-fade-in/);
    });

    it('shows hint text', () => {
      render(<ModernInput hint="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('hint text has proper styling', () => {
      render(<ModernInput hint="Helper text" />);
      const hintElement = screen.getByText('Helper text');
      expect(hintElement.className).toMatch(/text-text-quaternary/);
      expect(hintElement.className).toMatch(/text-sm/);
    });

    it('hides hint when error is shown', () => {
      render(<ModernInput hint="Hint text" error="Error message" />);
      expect(screen.queryByText('Hint text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('shows hint when no error', () => {
      render(<ModernInput hint="Hint text" />);
      expect(screen.getByText('Hint text')).toBeInTheDocument();
    });
  });

  describe('Focus States', () => {
    it('handles onFocus events', () => {
      const handleFocus = jest.fn();
      render(<ModernInput onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles onBlur events', () => {
      const handleBlur = jest.fn();
      render(<ModernInput onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      input.focus();
      input.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('updates label color on focus', () => {
      render(<ModernInput label="Test Label" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Test Label');

      fireEvent.focus(input);
      expect(label.className).toMatch(/text-accent-primary/);
    });

    it('restores label color on blur', () => {
      render(<ModernInput label="Test Label" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Test Label');

      fireEvent.focus(input);
      fireEvent.blur(input);
      expect(label.className).not.toMatch(/text-accent-primary/);
    });

    it('keeps error color on label even when focused', () => {
      render(<ModernInput label="Test Label" error="Error" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Test Label');

      fireEvent.focus(input);
      expect(label.className).toMatch(/text-error/);
    });

    it('calls custom onFocus with event', () => {
      const handleFocus = jest.fn();
      render(<ModernInput onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(handleFocus).toHaveBeenCalledWith(expect.any(Object));
    });

    it('calls custom onBlur with event', () => {
      const handleBlur = jest.fn();
      render(<ModernInput onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledWith(expect.any(Object));
    });

    it('applies focus ring styling', () => {
      render(<ModernInput />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/focus:outline-none/);
      expect(input.className).toMatch(/focus:ring-2/);
      expect(input.className).toMatch(/focus:ring-accent-primary/);
    });
  });

  describe('User Interactions', () => {
    it('handles onChange events', async () => {
      const handleChange = jest.fn();
      render(<ModernInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('hello');
    });

    it('works as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <ModernInput
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
      render(<ModernInput defaultValue="initial" />);
      const input = screen.getByRole('textbox');

      await userEvent.clear(input);
      await userEvent.type(input, 'new value');
      expect(input).toHaveValue('new value');
    });

    it('handles input with special characters', async () => {
      render(<ModernInput />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '!@#$%^&*()');
      expect(input).toHaveValue('!@#$%^&*()');
    });

    it('handles input with unicode characters', async () => {
      render(<ModernInput />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '你好世界');
      expect(input).toHaveValue('你好世界');
    });

    it('handles backspace correctly', async () => {
      render(<ModernInput defaultValue="test" />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '{backspace}');
      expect(input).toHaveValue('tes');
    });

    it('handles select all and delete', async () => {
      render(<ModernInput defaultValue="test content" />);
      const input = screen.getByRole('textbox');

      await userEvent.click(input);
      await userEvent.keyboard('{Control>}a{/Control}{Delete}');
      expect(input).toHaveValue('');
    });

    it('does not allow typing when disabled', async () => {
      render(<ModernInput disabled defaultValue="test" />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'more');
      expect(input).toHaveValue('test');
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      render(<ModernInput icon={<Search />} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(<ModernInput rightIcon={<Mail />} />);
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('renders with both icons', () => {
      render(<ModernInput icon={<Search />} rightIcon={<Mail />} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('applies padding for left icon', () => {
      render(<ModernInput icon={<Search />} />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pl-10/);
    });

    it('applies padding for right icon', () => {
      render(<ModernInput rightIcon={<Mail />} />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pr-10/);
    });

    it('applies padding for both icons', () => {
      render(<ModernInput icon={<Search />} rightIcon={<Mail />} />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/pl-10/);
      expect(input.className).toMatch(/pr-10/);
    });

    it('positions left icon correctly', () => {
      const { container } = render(<ModernInput icon={<Search />} />);
      const iconContainer = container.querySelector('.absolute.left-3');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer.className).toMatch(/top-1\/2/);
      expect(iconContainer.className).toMatch(/-translate-y-1\/2/);
    });

    it('positions right icon correctly', () => {
      const { container } = render(<ModernInput rightIcon={<Mail />} />);
      const iconContainer = container.querySelector('.absolute.right-3');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer.className).toMatch(/top-1\/2/);
      expect(iconContainer.className).toMatch(/-translate-y-1\/2/);
    });

    it('icon has proper size', () => {
      const { container } = render(<ModernInput icon={<Search />} />);
      const iconWrapper = container.querySelector('.w-5.h-5');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('icon has proper text color', () => {
      const { container } = render(<ModernInput icon={<Search />} />);
      const iconContainer = container.querySelector('.text-text-quaternary');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<ModernInput name="username" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
    });

    it('supports autoComplete', () => {
      render(<ModernInput autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autoComplete', 'email');
    });

    it('supports autoFocus', () => {
      render(<ModernInput autoFocus />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('supports maxLength', () => {
      render(<ModernInput maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
    });

    it('supports minLength', () => {
      render(<ModernInput minLength={3} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minLength', '3');
    });

    it('supports pattern', () => {
      render(<ModernInput pattern="[0-9]*" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]*');
    });

    it('supports min for number input', () => {
      render(<ModernInput type="number" min={0} />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '0');
    });

    it('supports max for number input', () => {
      render(<ModernInput type="number" max={100} />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('max', '100');
    });

    it('supports step for number input', () => {
      render(<ModernInput type="number" step={0.1} />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '0.1');
    });

    it('supports multiple arbitrary attributes', () => {
      render(
        <ModernInput
          data-testid="custom-input"
          data-cy="input-field"
          aria-label="Custom input"
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-testid', 'custom-input');
      expect(input).toHaveAttribute('data-cy', 'input-field');
      expect(input).toHaveAttribute('aria-label', 'Custom input');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef();
      render(<ModernInput ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('can focus input via ref', () => {
      const ref = React.createRef();
      render(<ModernInput ref={ref} />);
      ref.current.focus();
      expect(ref.current).toHaveFocus();
    });

    it('can blur input via ref', () => {
      const ref = React.createRef();
      render(<ModernInput ref={ref} />);
      ref.current.focus();
      ref.current.blur();
      expect(ref.current).not.toHaveFocus();
    });

    it('can access input value via ref', () => {
      const ref = React.createRef();
      render(<ModernInput ref={ref} defaultValue="test" />);
      expect(ref.current.value).toBe('test');
    });

    it('can set input value via ref', () => {
      const ref = React.createRef();
      render(<ModernInput ref={ref} />);
      ref.current.value = 'new value';
      expect(ref.current.value).toBe('new value');
    });
  });

  describe('Edge Cases', () => {
    it('handles null value gracefully', () => {
      render(<ModernInput value={null} onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('handles undefined value gracefully', () => {
      render(<ModernInput value={undefined} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('handles empty string value', () => {
      render(<ModernInput value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('handles empty string label', () => {
      render(<ModernInput label="" />);
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('handles null label gracefully', () => {
      render(<ModernInput label={null} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('handles undefined label gracefully', () => {
      render(<ModernInput label={undefined} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('works without onChange in uncontrolled mode', async () => {
      render(<ModernInput defaultValue="test" />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'more');
      expect(input).toHaveValue('testmore');
    });

    it('handles rapid value changes', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <ModernInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'quicktype', { delay: 1 });
      expect(input).toHaveValue('quicktype');
    });

    it('handles very long text', async () => {
      const longText = 'a'.repeat(1000);
      render(<ModernInput defaultValue={longText} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(longText);
    });

    it('handles error as empty string', () => {
      render(<ModernInput error="" />);
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('handles hint as empty string', () => {
      render(<ModernInput hint="" />);
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });
  });

  describe('Combination Tests', () => {
    it('renders with all props combined', () => {
      render(
        <ModernInput
          label="Email"
          placeholder="Enter email"
          icon={<Mail />}
          rightIcon={<Search />}
          hint="We'll never share your email"
          variant="solid"
          size="lg"
          className="custom-class"
        />
      );

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
    });

    it('combines size and variant correctly', () => {
      render(<ModernInput size="lg" variant="gradient" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/px-5/);
      expect(input.className).toMatch(/bg-gradient-to-r/);
    });

    it('combines error with all other props', () => {
      render(
        <ModernInput
          label="Field"
          icon={<Search />}
          hint="Helper"
          error="Error message"
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      const label = screen.getByText('Field');
      expect(label.className).toMatch(/text-error/);
    });

    it('combines disabled with other states', () => {
      render(
        <ModernInput
          disabled
          error="Error"
          icon={<Search />}
          rightIcon={<Mail />}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('associates label with input via htmlFor', () => {
      const { container } = render(<ModernInput label="Username" id="user-input" />);
      const label = container.querySelector('label');
      expect(label).toHaveAttribute('for', 'user-input');
    });

    it('label has proper styling', () => {
      const { container } = render(<ModernInput label="Test" />);
      const label = container.querySelector('label');
      expect(label.className).toMatch(/text-sm/);
      expect(label.className).toMatch(/font-medium/);
      expect(label.className).toMatch(/mb-2/);
    });

    it('input has proper focus styles for accessibility', () => {
      render(<ModernInput />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/focus:ring-2/);
      expect(input.className).toMatch(/focus:ring-offset-2/);
    });

    it('disabled state has visual feedback', () => {
      render(<ModernInput disabled />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/disabled:opacity-50/);
      expect(input.className).toMatch(/disabled:cursor-not-allowed/);
    });

    it('can be navigated with tab key', () => {
      render(
        <>
          <ModernInput />
          <ModernInput />
        </>
      );
      const inputs = screen.getAllByRole('textbox');
      inputs[0].focus();
      expect(inputs[0]).toHaveFocus();
    });
  });

  describe('Styling and Animations', () => {
    it('has transition classes', () => {
      render(<ModernInput />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/transition-all/);
      expect(input.className).toMatch(/duration-300/);
      expect(input.className).toMatch(/ease-out/);
    });

    it('has width class', () => {
      render(<ModernInput />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/w-full/);
    });

    it('error message has animation', () => {
      render(<ModernInput error="Error" />);
      const errorElement = screen.getByText('Error');
      expect(errorElement.className).toMatch(/animate-fade-in/);
    });

    it('label has transition on focus', () => {
      const { container } = render(<ModernInput label="Test" />);
      const label = container.querySelector('label');
      expect(label.className).toMatch(/transition-colors/);
      expect(label.className).toMatch(/duration-200/);
    });
  });
});

describe('ModernTextarea', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<ModernTextarea />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<ModernTextarea placeholder="Enter description" />);
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<ModernTextarea label="Description" />);
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<ModernTextarea defaultValue="default text" />);
      expect(screen.getByRole('textbox')).toHaveValue('default text');
    });

    it('renders with controlled value', () => {
      render(<ModernTextarea value="controlled" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });

    it('has proper display name', () => {
      expect(ModernTextarea.displayName).toBe('ModernTextarea');
    });

    it('renders as textarea element', () => {
      const { container } = render(<ModernTextarea />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Rows', () => {
    it('applies default rows of 4', () => {
      render(<ModernTextarea />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
    });

    it('applies custom rows', () => {
      render(<ModernTextarea rows={6} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '6');
    });

    it('applies single row', () => {
      render(<ModernTextarea rows={1} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '1');
    });

    it('applies large number of rows', () => {
      render(<ModernTextarea rows={20} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '20');
    });
  });

  describe('Variants', () => {
    it('applies glass variant by default', () => {
      render(<ModernTextarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toMatch(/bg-bg-glass-primary/);
      expect(textarea.className).toMatch(/backdrop-blur-md/);
    });

    it('applies solid variant', () => {
      render(<ModernTextarea variant="solid" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toMatch(/bg-bg-secondary/);
    });

    it('does not support gradient variant', () => {
      render(<ModernTextarea variant="gradient" />);
      const textarea = screen.getByRole('textbox');
      // Gradient variant not defined for textarea, should handle gracefully
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Label Functionality', () => {
    it('associates label with textarea', () => {
      render(<ModernTextarea label="Bio" id="bio-input" />);
      const textarea = screen.getByLabelText('Bio');
      expect(textarea).toHaveAttribute('id', 'bio-input');
    });

    it('generates unique ID when not provided', () => {
      render(<ModernTextarea label="Field" />);
      const textarea = screen.getByLabelText('Field');
      const id = textarea.getAttribute('id');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^textarea-/);
    });

    it('generates different IDs for multiple textareas', () => {
      const { container } = render(
        <>
          <ModernTextarea label="Field 1" />
          <ModernTextarea label="Field 2" />
        </>
      );
      const textareas = container.querySelectorAll('textarea');
      const id1 = textareas[0].getAttribute('id');
      const id2 = textareas[1].getAttribute('id');
      expect(id1).not.toBe(id2);
    });
  });

  describe('States', () => {
    it('can be disabled', () => {
      render(<ModernTextarea disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
      expect(textarea.className).toMatch(/disabled:opacity-50/);
      expect(textarea.className).toMatch(/disabled:cursor-not-allowed/);
    });

    it('can be readonly', () => {
      render(<ModernTextarea readOnly value="readonly" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readOnly');
    });

    it('can be required', () => {
      render(<ModernTextarea required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('shows error state', () => {
      render(<ModernTextarea error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error border styling', () => {
      render(<ModernTextarea error="Error" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toMatch(/border-error/);
      expect(textarea.className).toMatch(/focus:border-error/);
      expect(textarea.className).toMatch(/focus:ring-error/);
    });

    it('shows hint text', () => {
      render(<ModernTextarea hint="Maximum 500 characters" />);
      expect(screen.getByText('Maximum 500 characters')).toBeInTheDocument();
    });

    it('hides hint when error is shown', () => {
      render(<ModernTextarea hint="Hint" error="Error" />);
      expect(screen.queryByText('Hint')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Focus States', () => {
    it('handles onFocus events', () => {
      const handleFocus = jest.fn();
      render(<ModernTextarea onFocus={handleFocus} />);

      const textarea = screen.getByRole('textbox');
      textarea.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles onBlur events', () => {
      const handleBlur = jest.fn();
      render(<ModernTextarea onBlur={handleBlur} />);

      const textarea = screen.getByRole('textbox');
      textarea.focus();
      textarea.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('updates label color on focus', () => {
      render(<ModernTextarea label="Bio" />);
      const textarea = screen.getByRole('textbox');
      const label = screen.getByText('Bio');

      fireEvent.focus(textarea);
      expect(label.className).toMatch(/text-accent-primary/);
    });

    it('restores label color on blur', () => {
      render(<ModernTextarea label="Bio" />);
      const textarea = screen.getByRole('textbox');
      const label = screen.getByText('Bio');

      fireEvent.focus(textarea);
      fireEvent.blur(textarea);
      expect(label.className).not.toMatch(/text-accent-primary/);
    });

    it('keeps error color on label when focused', () => {
      render(<ModernTextarea label="Bio" error="Required" />);
      const textarea = screen.getByRole('textbox');
      const label = screen.getByText('Bio');

      fireEvent.focus(textarea);
      expect(label.className).toMatch(/text-error/);
    });
  });

  describe('User Interactions', () => {
    it('handles onChange events', async () => {
      const handleChange = jest.fn();
      render(<ModernTextarea onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'hello');

      expect(handleChange).toHaveBeenCalled();
      expect(textarea).toHaveValue('hello');
    });

    it('works as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <ModernTextarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<TestComponent />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, 'test content');
      expect(textarea).toHaveValue('test content');
    });

    it('works as uncontrolled component', async () => {
      render(<ModernTextarea defaultValue="initial" />);
      const textarea = screen.getByRole('textbox');

      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'new content');
      expect(textarea).toHaveValue('new content');
    });

    it('handles multiline text', async () => {
      render(<ModernTextarea />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');
      expect(textarea.value).toContain('\n');
    });

    it('handles tab key correctly', async () => {
      render(<ModernTextarea />);
      const textarea = screen.getByRole('textbox');

      textarea.focus();
      await userEvent.keyboard('{Tab}');
      // Tab should navigate away (or be prevented by browser default behavior)
      expect(textarea).not.toHaveFocus();
    });

    it('does not allow typing when disabled', async () => {
      render(<ModernTextarea disabled defaultValue="test" />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, 'more');
      expect(textarea).toHaveValue('test');
    });
  });

  describe('HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<ModernTextarea name="description" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'description');
    });

    it('supports maxLength', () => {
      render(<ModernTextarea maxLength={500} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '500');
    });

    it('supports minLength', () => {
      render(<ModernTextarea minLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minLength', '10');
    });

    it('supports autoFocus', () => {
      render(<ModernTextarea autoFocus />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('supports custom data attributes', () => {
      render(<ModernTextarea data-testid="custom-textarea" />);
      expect(screen.getByTestId('custom-textarea')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = React.createRef();
      render(<ModernTextarea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('can focus textarea via ref', () => {
      const ref = React.createRef();
      render(<ModernTextarea ref={ref} />);
      ref.current.focus();
      expect(ref.current).toHaveFocus();
    });

    it('can access textarea value via ref', () => {
      const ref = React.createRef();
      render(<ModernTextarea ref={ref} defaultValue="test" />);
      expect(ref.current.value).toBe('test');
    });
  });

  describe('Styling', () => {
    it('has resize-none class', () => {
      render(<ModernTextarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toMatch(/resize-none/);
    });

    it('has transition classes', () => {
      render(<ModernTextarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toMatch(/transition-all/);
      expect(textarea.className).toMatch(/duration-300/);
    });

    it('has rounded corners', () => {
      render(<ModernTextarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toMatch(/rounded-xl/);
    });

    it('has proper padding', () => {
      render(<ModernTextarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toMatch(/px-4/);
      expect(textarea.className).toMatch(/py-3/);
    });

    it('applies custom className', () => {
      const { container } = render(<ModernTextarea className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles null value gracefully', () => {
      render(<ModernTextarea value={null} onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('handles undefined value gracefully', () => {
      render(<ModernTextarea value={undefined} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('handles empty string value', () => {
      render(<ModernTextarea value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('handles very long text', async () => {
      const longText = 'a'.repeat(5000);
      render(<ModernTextarea defaultValue={longText} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(longText);
    });

    it('works without onChange in uncontrolled mode', async () => {
      render(<ModernTextarea defaultValue="test" />);
      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, ' more');
      expect(textarea).toHaveValue('test more');
    });
  });

  describe('Combination Tests', () => {
    it('renders with all props combined', () => {
      render(
        <ModernTextarea
          label="Description"
          placeholder="Enter description"
          hint="Tell us about yourself"
          variant="solid"
          rows={6}
          className="custom-class"
        />
      );

      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
      expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
    });

    it('combines error with other props', () => {
      render(
        <ModernTextarea
          label="Bio"
          hint="Helper"
          error="Error message"
          rows={8}
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      const label = screen.getByText('Bio');
      expect(label.className).toMatch(/text-error/);
    });
  });

  describe('Accessibility', () => {
    it('associates label with textarea via htmlFor', () => {
      const { container } = render(<ModernTextarea label="Bio" id="bio-input" />);
      const label = container.querySelector('label');
      expect(label).toHaveAttribute('for', 'bio-input');
    });

    it('textarea has proper focus styles', () => {
      render(<ModernTextarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toMatch(/focus:ring-2/);
      expect(textarea.className).toMatch(/focus:outline-none/);
    });
  });
});

export default input
