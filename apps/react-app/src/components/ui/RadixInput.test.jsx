import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search, Mail, Eye, X } from 'lucide-react';
import { Input, InputGroup, InputLeftElement, InputRightElement, inputVariants } from './RadixInput';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
  Eye: () => <svg data-testid="eye-icon" />,
  X: () => <svg data-testid="x-icon" />,
}));

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

    it('renders with default value', () => {
      render(<Input defaultValue="default text" />);
      expect(screen.getByRole('textbox')).toHaveValue('default text');
    });

    it('renders with controlled value', () => {
      render(<Input value="controlled" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });

    it('renders as text input by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('has displayName set', () => {
      expect(Input.displayName).toBe('Input');
    });
  });

  describe('Input Types', () => {
    it('renders as text input', () => {
      render(<Input type="text" />);
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
      const { container } = render(<Input type="date" />);
      const input = container.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('renders as time input', () => {
      const { container } = render(<Input type="time" />);
      const input = container.querySelector('input[type="time"]');
      expect(input).toBeInTheDocument();
    });

    it('renders as datetime-local input', () => {
      const { container } = render(<Input type="datetime-local" />);
      const input = container.querySelector('input[type="datetime-local"]');
      expect(input).toBeInTheDocument();
    });

    it('renders as file input', () => {
      const { container } = render(<Input type="file" />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it('renders as hidden input', () => {
      const { container } = render(<Input type="hidden" />);
      const input = container.querySelector('input[type="hidden"]');
      expect(input).toBeInTheDocument();
    });

    it('renders as color input', () => {
      const { container } = render(<Input type="color" />);
      const input = container.querySelector('input[type="color"]');
      expect(input).toBeInTheDocument();
    });

    it('renders as range input', () => {
      render(<Input type="range" />);
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('type', 'range');
    });
  });

  describe('Variants', () => {
    it('applies default variant by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-7', 'bg-gray-1');
    });

    it('applies default variant explicitly', () => {
      render(<Input variant="default" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-7', 'bg-gray-1');
    });

    it('applies glass variant', () => {
      render(<Input variant="glass" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-white/20', 'bg-white/5', 'backdrop-blur-md');
    });

    it('applies outline variant', () => {
      render(<Input variant="outline" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-7', 'bg-transparent');
    });

    it('applies filled variant', () => {
      render(<Input variant="filled" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-transparent', 'bg-gray-3');
    });

    it('default variant has hover styles', () => {
      render(<Input variant="default" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('hover:border-gray-8');
    });

    it('glass variant has hover styles', () => {
      render(<Input variant="glass" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('hover:bg-white/10');
    });

    it('outline variant has hover styles', () => {
      render(<Input variant="outline" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('hover:border-gray-8');
    });

    it('filled variant has hover styles', () => {
      render(<Input variant="filled" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('hover:bg-gray-4');
    });

    it('default variant has focus styles', () => {
      render(<Input variant="default" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-blue-9');
    });

    it('glass variant has focus styles', () => {
      render(<Input variant="glass" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-blue-9', 'focus:bg-white/10');
    });

    it('outline variant has focus styles', () => {
      render(<Input variant="outline" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-blue-9');
    });

    it('filled variant has focus styles', () => {
      render(<Input variant="filled" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-blue-9', 'focus:bg-gray-1');
    });
  });

  describe('Sizes', () => {
    it('applies default size by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-10');
    });

    it('applies default size explicitly', () => {
      render(<Input size="default" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-10');
    });

    it('applies small size', () => {
      render(<Input size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-8', 'text-xs');
    });

    it('applies large size', () => {
      render(<Input size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-12', 'text-base');
    });

    it('combines variant and size', () => {
      render(<Input variant="glass" size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-white/20', 'h-8', 'text-xs');
    });

    it('combines multiple variants and sizes', () => {
      const { rerender } = render(<Input variant="default" size="default" />);
      let input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-gray-7', 'h-10');

      rerender(<Input variant="filled" size="lg" />);
      input = screen.getByRole('textbox');
      expect(input).toHaveClass('bg-gray-3', 'h-12');
    });
  });

  describe('States', () => {
    it('can be disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('can be readonly', () => {
      render(<Input readOnly value="readonly text" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readOnly');
    });

    it('can be required', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('disabled state prevents user interaction', async () => {
      const handleChange = jest.fn();
      render(<Input disabled onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');

      expect(handleChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
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

    it('handles onKeyDown events', () => {
      const handleKeyDown = jest.fn();
      render(<Input onKeyDown={handleKeyDown} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('handles onKeyUp events', () => {
      const handleKeyUp = jest.fn();
      render(<Input onKeyUp={handleKeyUp} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyUp(input, { key: 'Enter' });

      expect(handleKeyUp).toHaveBeenCalledTimes(1);
    });

    it('handles onClick events', () => {
      const handleClick = jest.fn();
      render(<Input onClick={handleClick} />);

      const input = screen.getByRole('textbox');
      fireEvent.click(input);

      expect(handleClick).toHaveBeenCalledTimes(1);
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

    it('supports typing special characters', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test@example.com!#$%');
      expect(input).toHaveValue('test@example.com!#$%');
    });

    it('supports typing numbers', async () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');

      await userEvent.type(input, '12345');
      expect(input).toHaveValue(12345);
    });

    it('supports pasting text', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      await userEvent.click(input);
      await userEvent.paste('pasted text');
      expect(input).toHaveValue('pasted text');
    });

    it('supports selecting text', async () => {
      render(<Input defaultValue="select me" />);
      const input = screen.getByRole('textbox');

      input.setSelectionRange(0, 6);
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(6);
    });
  });

  describe('HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<Input name="username" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
    });

    it('supports id attribute', () => {
      render(<Input id="email-input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-input');
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

    it('supports title attribute', () => {
      render(<Input title="Enter your name" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('title', 'Enter your name');
    });

    it('supports multiple attributes', () => {
      render(
        <Input
          name="email"
          id="email-field"
          autoComplete="email"
          maxLength={100}
          required
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
      expect(input).toHaveAttribute('id', 'email-field');
      expect(input).toHaveAttribute('autoComplete', 'email');
      expect(input).toHaveAttribute('maxLength', '100');
      expect(input).toBeRequired();
    });

    it('supports aria-label', () => {
      render(<Input aria-label="Search input" />);
      expect(screen.getByLabelText('Search input')).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(<Input aria-describedby="helper-text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'helper-text');
    });

    it('supports aria-invalid', () => {
      render(<Input aria-invalid="true" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports tabIndex', () => {
      render(<Input tabIndex={5} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('tabIndex', '5');
    });

    it('supports data attributes', () => {
      render(<Input data-testid="custom-input" data-custom="value" />);
      const input = screen.getByTestId('custom-input');
      expect(input).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to input', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('preserves default classes with custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('rounded-lg');
    });

    it('combines variant, size, and custom className', () => {
      render(<Input variant="glass" size="lg" className="custom" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-white/20', 'h-12', 'custom');
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
      expect(ref.current).toHaveFocus();
      ref.current.blur();
      expect(ref.current).not.toHaveFocus();
    });

    it('can access input value via ref', () => {
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

    it('handles rapid typing', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'fast', { delay: 1 });

      expect(input).toHaveValue('fast');
      expect(handleChange).toHaveBeenCalledTimes(4);
    });

    it('handles empty placeholder', () => {
      render(<Input placeholder="" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '');
    });

    it('handles very long values', async () => {
      const longValue = 'a'.repeat(1000);
      render(<Input defaultValue={longValue} />);
      expect(screen.getByRole('textbox')).toHaveValue(longValue);
    });

    it('handles unicode characters', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '你好世界🌍');
      expect(input).toHaveValue('你好世界🌍');
    });

    it('handles numeric string in text input', async () => {
      render(<Input type="text" />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '12345');
      expect(input).toHaveValue('12345');
    });

    it('handles defaultValue and value conflict', () => {
      // value should take precedence
      render(<Input defaultValue="default" value="controlled" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      input.focus();
      expect(input).toHaveFocus();
    });

    it('supports tab navigation', () => {
      render(
        <>
          <Input placeholder="First" />
          <Input placeholder="Second" />
        </>
      );

      const firstInput = screen.getByPlaceholderText('First');
      const secondInput = screen.getByPlaceholderText('Second');

      firstInput.focus();
      expect(firstInput).toHaveFocus();

      userEvent.tab();
      expect(secondInput).toHaveFocus();
    });

    it('has proper focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });

    it('applies ring styles on focus', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:ring-blue-9', 'focus-visible:ring-offset-2');
    });

    it('placeholder has proper color', () => {
      render(<Input placeholder="Placeholder" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('placeholder:text-gray-9');
    });

    it('has transition effects', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('File Input Specific', () => {
    it('applies file input styles', () => {
      const { container } = render(<Input type="file" />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveClass('file:border-0', 'file:bg-transparent');
    });

    it('applies file text styles', () => {
      const { container } = render(<Input type="file" />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveClass('file:text-sm', 'file:font-medium');
    });

    it('combines file styles with variant', () => {
      const { container } = render(<Input type="file" variant="glass" />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveClass('file:border-0', 'border-white/20');
    });
  });

  describe('Validation', () => {
    it('validates required field', async () => {
      render(
        <form data-testid="form">
          <Input required name="email" />
          <button type="submit">Submit</button>
        </form>
      );

      const form = screen.getByTestId('form');
      const input = screen.getByRole('textbox');

      expect(input).toBeRequired();
      expect(input.validity.valid).toBe(false);
    });

    it('validates email format', () => {
      const { container } = render(<Input type="email" />);
      const input = container.querySelector('input[type="email"]');

      fireEvent.change(input, { target: { value: 'invalid-email' } });
      expect(input.validity.valid).toBe(false);

      fireEvent.change(input, { target: { value: 'valid@example.com' } });
      expect(input.validity.valid).toBe(true);
    });

    it('validates pattern', () => {
      render(<Input pattern="[0-9]{3}" />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '12' } });
      expect(input.validity.valid).toBe(false);

      fireEvent.change(input, { target: { value: '123' } });
      expect(input.validity.valid).toBe(true);
    });

    it('validates maxLength', async () => {
      render(<Input maxLength={5} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '1234567890');
      // Browser enforces maxLength
      expect(input.value.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();

      const TestComponent = React.memo(() => {
        renderSpy();
        return <Input />;
      });

      const { rerender } = render(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});

describe('InputGroup', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<InputGroup>Content</InputGroup>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <InputGroup>
          <Input placeholder="Test" />
        </InputGroup>
      );
      expect(screen.getByPlaceholderText('Test')).toBeInTheDocument();
    });

    it('applies relative positioning', () => {
      const { container } = render(<InputGroup>Content</InputGroup>);
      expect(container.firstChild).toHaveClass('relative');
    });

    it('has displayName set', () => {
      expect(InputGroup.displayName).toBe('InputGroup');
    });

    it('renders as div by default', () => {
      const { container } = render(<InputGroup>Content</InputGroup>);
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<InputGroup className="custom-group">Content</InputGroup>);
      expect(container.firstChild).toHaveClass('custom-group');
    });

    it('preserves relative class with custom className', () => {
      const { container } = render(<InputGroup className="custom">Content</InputGroup>);
      expect(container.firstChild).toHaveClass('relative', 'custom');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to div element', () => {
      const ref = React.createRef();
      render(<InputGroup ref={ref}>Content</InputGroup>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Multiple Children', () => {
    it('renders multiple children', () => {
      render(
        <InputGroup>
          <InputLeftElement>
            <Search />
          </InputLeftElement>
          <Input placeholder="Search" />
          <InputRightElement>
            <X />
          </InputRightElement>
        </InputGroup>
      );

      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('supports data attributes', () => {
      const { container } = render(
        <InputGroup data-testid="input-group" data-custom="value">
          Content
        </InputGroup>
      );
      const group = screen.getByTestId('input-group');
      expect(group).toHaveAttribute('data-custom', 'value');
    });

    it('supports id attribute', () => {
      const { container } = render(<InputGroup id="search-group">Content</InputGroup>);
      expect(container.firstChild).toHaveAttribute('id', 'search-group');
    });
  });
});

describe('InputLeftElement', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <InputLeftElement>
          <Search />
        </InputLeftElement>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders icon', () => {
      render(
        <InputLeftElement>
          <Search />
        </InputLeftElement>
      );
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('has displayName set', () => {
      expect(InputLeftElement.displayName).toBe('InputLeftElement');
    });

    it('renders as div', () => {
      const { container } = render(
        <InputLeftElement>
          <Search />
        </InputLeftElement>
      );
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });

  describe('Positioning', () => {
    it('applies absolute positioning', () => {
      const { container } = render(
        <InputLeftElement>
          <Search />
        </InputLeftElement>
      );
      expect(container.firstChild).toHaveClass('absolute', 'left-3');
    });

    it('applies vertical centering', () => {
      const { container } = render(
        <InputLeftElement>
          <Search />
        </InputLeftElement>
      );
      expect(container.firstChild).toHaveClass('top-1/2', 'transform', '-translate-y-1/2');
    });

    it('applies text color', () => {
      const { container } = render(
        <InputLeftElement>
          <Search />
        </InputLeftElement>
      );
      expect(container.firstChild).toHaveClass('text-gray-9');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <InputLeftElement className="custom-left">
          <Search />
        </InputLeftElement>
      );
      expect(container.firstChild).toHaveClass('custom-left');
    });

    it('preserves default classes with custom className', () => {
      const { container } = render(
        <InputLeftElement className="custom">
          <Search />
        </InputLeftElement>
      );
      expect(container.firstChild).toHaveClass('absolute', 'left-3', 'custom');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to div element', () => {
      const ref = React.createRef();
      render(
        <InputLeftElement ref={ref}>
          <Search />
        </InputLeftElement>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Integration with Input', () => {
    it('works with Input in InputGroup', () => {
      render(
        <InputGroup>
          <InputLeftElement>
            <Search />
          </InputLeftElement>
          <Input placeholder="Search" />
        </InputGroup>
      );

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('icon appears to left of input', () => {
      const { container } = render(
        <InputGroup>
          <InputLeftElement>
            <Search />
          </InputLeftElement>
          <Input placeholder="Search" />
        </InputGroup>
      );

      const leftElement = container.querySelector('.left-3');
      expect(leftElement).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('supports data attributes', () => {
      const { container } = render(
        <InputLeftElement data-testid="left-icon" data-custom="value">
          <Search />
        </InputLeftElement>
      );
      const element = screen.getByTestId('left-icon');
      expect(element).toHaveAttribute('data-custom', 'value');
    });
  });
});

describe('InputRightElement', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <InputRightElement>
          <Mail />
        </InputRightElement>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders icon', () => {
      render(
        <InputRightElement>
          <Mail />
        </InputRightElement>
      );
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('has displayName set', () => {
      expect(InputRightElement.displayName).toBe('InputRightElement');
    });

    it('renders as div', () => {
      const { container } = render(
        <InputRightElement>
          <Mail />
        </InputRightElement>
      );
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });

  describe('Positioning', () => {
    it('applies absolute positioning', () => {
      const { container } = render(
        <InputRightElement>
          <Mail />
        </InputRightElement>
      );
      expect(container.firstChild).toHaveClass('absolute', 'right-3');
    });

    it('applies vertical centering', () => {
      const { container } = render(
        <InputRightElement>
          <Mail />
        </InputRightElement>
      );
      expect(container.firstChild).toHaveClass('top-1/2', 'transform', '-translate-y-1/2');
    });

    it('applies text color', () => {
      const { container } = render(
        <InputRightElement>
          <Mail />
        </InputRightElement>
      );
      expect(container.firstChild).toHaveClass('text-gray-9');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <InputRightElement className="custom-right">
          <Mail />
        </InputRightElement>
      );
      expect(container.firstChild).toHaveClass('custom-right');
    });

    it('preserves default classes with custom className', () => {
      const { container } = render(
        <InputRightElement className="custom">
          <Mail />
        </InputRightElement>
      );
      expect(container.firstChild).toHaveClass('absolute', 'right-3', 'custom');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to div element', () => {
      const ref = React.createRef();
      render(
        <InputRightElement ref={ref}>
          <Mail />
        </InputRightElement>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Integration with Input', () => {
    it('works with Input in InputGroup', () => {
      render(
        <InputGroup>
          <Input placeholder="Email" />
          <InputRightElement>
            <Mail />
          </InputRightElement>
        </InputGroup>
      );

      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    it('icon appears to right of input', () => {
      const { container } = render(
        <InputGroup>
          <Input placeholder="Email" />
          <InputRightElement>
            <Mail />
          </InputRightElement>
        </InputGroup>
      );

      const rightElement = container.querySelector('.right-3');
      expect(rightElement).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('supports data attributes', () => {
      const { container } = render(
        <InputRightElement data-testid="right-icon" data-custom="value">
          <Mail />
        </InputRightElement>
      );
      const element = screen.getByTestId('right-icon');
      expect(element).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Interactive Elements', () => {
    it('can contain clickable elements', async () => {
      const handleClick = jest.fn();
      render(
        <InputGroup>
          <Input placeholder="Email" />
          <InputRightElement>
            <button onClick={handleClick} aria-label="Clear">
              <X />
            </button>
          </InputRightElement>
        </InputGroup>
      );

      const button = screen.getByLabelText('Clear');
      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe('inputVariants', () => {
  it('exports inputVariants function', () => {
    expect(inputVariants).toBeDefined();
    expect(typeof inputVariants).toBe('function');
  });

  it('generates classes for default variant', () => {
    const classes = inputVariants({ variant: 'default' });
    expect(classes).toContain('border-gray-7');
    expect(classes).toContain('bg-gray-1');
  });

  it('generates classes for glass variant', () => {
    const classes = inputVariants({ variant: 'glass' });
    expect(classes).toContain('border-white/20');
    expect(classes).toContain('bg-white/5');
  });

  it('generates classes for outline variant', () => {
    const classes = inputVariants({ variant: 'outline' });
    expect(classes).toContain('border-gray-7');
    expect(classes).toContain('bg-transparent');
  });

  it('generates classes for filled variant', () => {
    const classes = inputVariants({ variant: 'filled' });
    expect(classes).toContain('border-transparent');
    expect(classes).toContain('bg-gray-3');
  });

  it('generates classes for default size', () => {
    const classes = inputVariants({ size: 'default' });
    expect(classes).toContain('h-10');
  });

  it('generates classes for sm size', () => {
    const classes = inputVariants({ size: 'sm' });
    expect(classes).toContain('h-8');
    expect(classes).toContain('text-xs');
  });

  it('generates classes for lg size', () => {
    const classes = inputVariants({ size: 'lg' });
    expect(classes).toContain('h-12');
    expect(classes).toContain('text-base');
  });

  it('uses default variant when none specified', () => {
    const classes = inputVariants({});
    expect(classes).toContain('border-gray-7');
    expect(classes).toContain('bg-gray-1');
  });

  it('uses default size when none specified', () => {
    const classes = inputVariants({});
    expect(classes).toContain('h-10');
  });

  it('combines variant and size', () => {
    const classes = inputVariants({ variant: 'glass', size: 'lg' });
    expect(classes).toContain('border-white/20');
    expect(classes).toContain('h-12');
  });
});

describe('Complete Integration', () => {
  it('renders complete input with all elements', () => {
    render(
      <InputGroup>
        <InputLeftElement>
          <Search />
        </InputLeftElement>
        <Input placeholder="Search..." />
        <InputRightElement>
          <button aria-label="Clear">
            <X />
          </button>
        </InputRightElement>
      </InputGroup>
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Clear')).toBeInTheDocument();
  });

  it('handles input with left and right icons', async () => {
    const handleChange = jest.fn();
    const handleClear = jest.fn();

    render(
      <InputGroup>
        <InputLeftElement>
          <Search />
        </InputLeftElement>
        <Input placeholder="Search..." onChange={handleChange} />
        <InputRightElement>
          <button onClick={handleClear} aria-label="Clear">
            <X />
          </button>
        </InputRightElement>
      </InputGroup>
    );

    const input = screen.getByPlaceholderText('Search...');
    await userEvent.type(input, 'test');
    expect(handleChange).toHaveBeenCalled();

    const clearButton = screen.getByLabelText('Clear');
    await userEvent.click(clearButton);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('renders password input with toggle visibility', async () => {
    const TestComponent = () => {
      const [showPassword, setShowPassword] = React.useState(false);

      return (
        <InputGroup>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
          />
          <InputRightElement>
            <button
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Eye />
            </button>
          </InputRightElement>
        </InputGroup>
      );
    };

    render(<TestComponent />);

    const input = screen.getByPlaceholderText('Password');
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByLabelText('Show password');
    await userEvent.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <InputGroup>
          <InputLeftElement>
            <Mail />
          </InputLeftElement>
          <Input name="email" type="email" placeholder="Email" required />
        </InputGroup>
        <button type="submit">Submit</button>
      </form>
    );

    const input = screen.getByPlaceholderText('Email');
    await userEvent.type(input, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await userEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('supports multiple inputs in same form', async () => {
    render(
      <form>
        <InputGroup>
          <Input name="email" placeholder="Email" />
        </InputGroup>
        <InputGroup>
          <Input name="password" type="password" placeholder="Password" />
        </InputGroup>
      </form>
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('user@example.com');
    expect(passwordInput).toHaveValue('password123');
  });
});

describe('Snapshot Tests', () => {
  it('matches snapshot for default input', () => {
    const { container } = render(<Input />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for all variants', () => {
    const { container } = render(
      <>
        <Input variant="default" />
        <Input variant="glass" />
        <Input variant="outline" />
        <Input variant="filled" />
      </>
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for all sizes', () => {
    const { container } = render(
      <>
        <Input size="sm" />
        <Input size="default" />
        <Input size="lg" />
      </>
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for InputGroup with elements', () => {
    const { container } = render(
      <InputGroup>
        <InputLeftElement>
          <Search />
        </InputLeftElement>
        <Input placeholder="Search" />
        <InputRightElement>
          <X />
        </InputRightElement>
      </InputGroup>
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for disabled state', () => {
    const { container } = render(<Input disabled />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

export default input
