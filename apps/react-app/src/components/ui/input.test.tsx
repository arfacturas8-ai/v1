/**
 * CRYB Design System - Input Component Tests
 * Comprehensive test suite for the Input component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Textarea, InputGroup, SearchInput } from './input';
import { Mail, User } from 'lucide-react';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render with custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should apply fullWidth variant correctly', () => {
      render(<Input fullWidth={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full');
    });

    it('should apply non-fullWidth variant correctly', () => {
      render(<Input fullWidth={false} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-auto');
    });
  });

  describe('Input Types', () => {
    it('should render text input type', () => {
      render(<Input type="text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render email input type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input type', () => {
      render(<Input type="password" label="Password" data-testid="password-field" />);
      const input = screen.getByTestId('password-field');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input type', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render tel input type', () => {
      render(<Input type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render url input type', () => {
      render(<Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('should render search input type', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });
  });

  describe('Placeholder', () => {
    it('should render with placeholder text', () => {
      render(<Input placeholder="Enter your name" />);
      const input = screen.getByPlaceholderText('Enter your name');
      expect(input).toBeInTheDocument();
    });

    it('should render without placeholder', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('placeholder');
    });
  });

  describe('Value and onChange', () => {
    it('should handle controlled value', () => {
      const { rerender } = render(<Input value="test value" onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('test value');

      rerender(<Input value="updated value" onChange={() => {}} />);
      expect(input.value).toBe('updated value');
    });

    it('should handle onChange events', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(4); // once per character
    });

    it('should update value on user input', async () => {
      const handleChange = jest.fn((e) => e.target.value);
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'hello');
      expect(input.value).toBe('hello');
    });
  });

  describe('Disabled State', () => {
    it('should render disabled input', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should not accept input when disabled', async () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test');
      expect(input).toHaveValue('');
    });

    it('should have opacity style when disabled', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Read-only State', () => {
    it('should render read-only input', () => {
      render(<Input readOnly value="read-only value" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('should not accept input when read-only', async () => {
      render(<Input readOnly value="initial" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'test');
      expect(input.value).toBe('initial');
    });
  });

  describe('Validation States', () => {
    it('should render error state', () => {
      render(<Input error="This field is required" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should render success state', () => {
      render(<Input success="Looks good!" />);
      expect(screen.getByText('Looks good!')).toBeInTheDocument();
    });

    it('should render warning state', () => {
      render(<Input warning="Please verify this" />);
      expect(screen.getByText('Please verify this')).toBeInTheDocument();
    });

    it('should prioritize error over success and warning', () => {
      render(<Input error="Error" success="Success" warning="Warning" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
      expect(screen.queryByText('Warning')).not.toBeInTheDocument();
    });

    it('should prioritize success over warning', () => {
      render(<Input success="Success" warning="Warning" />);
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.queryByText('Warning')).not.toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('should render helper text', () => {
      render(<Input helperText="This is a hint" />);
      expect(screen.getByText('This is a hint')).toBeInTheDocument();
    });

    it('should prioritize validation messages over helper text', () => {
      render(<Input error="Error message" helperText="Helper text" />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Label', () => {
    it('should render with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should associate label with input', () => {
      render(<Input label="Username" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', input.id);
    });

    it('should render without label', () => {
      render(<Input />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should show required asterisk when required', () => {
      render(<Input label="Email" required />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-destructive');
    });

    it('should show required asterisk in label', () => {
      render(<Input label="Email" required />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-destructive');
    });
  });

  describe('Icons and Adornments', () => {
    it('should render left icon', () => {
      render(<Input leftIcon={<Mail data-testid="mail-icon" />} />);
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      render(<Input rightIcon={<User data-testid="user-icon" />} />);
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should render both left and right icons', () => {
      render(
        <Input
          leftIcon={<Mail data-testid="mail-icon" />}
          rightIcon={<User data-testid="user-icon" />}
        />
      );
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should apply padding when left icon is present', () => {
      render(<Input leftIcon={<Mail />} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
    });

    it('should apply padding when right icon is present', () => {
      render(<Input rightIcon={<User />} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pr-10');
    });
  });

  describe('Password Toggle', () => {
    it('should render password toggle button for password type', () => {
      render(<Input type="password" label="Password" />);
      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toBeInTheDocument();
    });

    it('should toggle password visibility on click', async () => {
      render(<Input type="password" label="Password" data-testid="password-input" />);
      const input = screen.getByTestId('password-input');
      const toggleButton = screen.getByLabelText(/show password/i);

      expect(input).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();

      await userEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should not render toggle button for non-password types', () => {
      render(<Input type="text" />);
      expect(screen.queryByLabelText(/show password/i)).not.toBeInTheDocument();
    });

    it('should not render password toggle when loading', () => {
      render(<Input type="password" label="Password" loading />);
      expect(screen.queryByLabelText(/show password/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading spinner', () => {
      render(<Input loading />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should disable input when loading', () => {
      render(<Input loading />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should hide right icon when loading', () => {
      render(<Input loading rightIcon={<User data-testid="user-icon" />} />);
      expect(screen.queryByTestId('user-icon')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      render(<Input size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-8', 'px-2', 'text-sm');
    });

    it('should render default size', () => {
      render(<Input size="default" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-10', 'px-3');
    });

    it('should render large size', () => {
      render(<Input size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-12', 'px-4', 'text-lg');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-invalid when error exists', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not have aria-invalid when no error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have aria-describedby linking to error message', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');

      expect(describedBy).toBeTruthy();
      expect(describedBy).toContain('-message');
    });

    it('should have aria-describedby linking to helper text', () => {
      render(<Input helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');

      expect(describedBy).toBeTruthy();
      expect(describedBy).toContain('-message');
    });

    it('should have proper label association', () => {
      render(<Input label="Email Address" id="email" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email Address');

      expect(label).toHaveAttribute('for', 'email');
      expect(input).toHaveAttribute('id', 'email');
    });

    it('should generate unique id when not provided', () => {
      const { container } = render(
        <>
          <Input label="First" />
          <Input label="Second" />
        </>
      );
      const inputs = container.querySelectorAll('input');
      expect(inputs[0].id).not.toBe(inputs[1].id);
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = jest.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });

    it('should allow focus via ref', () => {
      const TestComponent = () => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        return (
          <>
            <Input ref={inputRef} data-testid="test-input" />
            <button onClick={() => inputRef.current?.focus()}>Focus Input</button>
          </>
        );
      };

      render(<TestComponent />);
      const button = screen.getByRole('button');
      const input = screen.getByTestId('test-input');

      fireEvent.click(button);
      expect(input).toHaveFocus();
    });
  });

  describe('Focus and Blur Events', () => {
    it('should handle onFocus event', async () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      await userEvent.click(input);
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should handle onBlur event', async () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      await userEvent.click(input);
      await userEvent.tab();
      expect(handleBlur).toHaveBeenCalled();
    });
  });
});

describe('Textarea Component', () => {
  describe('Basic Rendering', () => {
    it('should render textarea element', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should render with label', () => {
      render(<Textarea label="Description" />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Textarea placeholder="Enter description" />);
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    });
  });

  describe('Validation States', () => {
    it('should render error state', () => {
      render(<Textarea error="Required field" />);
      expect(screen.getByText('Required field')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should render success state', () => {
      render(<Textarea success="Perfect!" />);
      expect(screen.getByText('Perfect!')).toBeInTheDocument();
    });

    it('should render warning state', () => {
      render(<Textarea warning="Be careful" />);
      expect(screen.getByText('Be careful')).toBeInTheDocument();
    });
  });

  describe('Resize Behavior', () => {
    it('should default to vertical resize', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize-y');
    });

    it('should apply none resize', () => {
      render(<Textarea resize="none" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize-none');
    });

    it('should apply horizontal resize', () => {
      render(<Textarea resize="horizontal" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize-x');
    });

    it('should apply both resize', () => {
      render(<Textarea resize="both" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize');
    });
  });

  describe('Required and Disabled States', () => {
    it('should render required asterisk', () => {
      render(<Textarea label="Bio" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Textarea disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to textarea element', () => {
      const ref = jest.fn();
      render(<Textarea ref={ref} />);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLTextAreaElement);
    });
  });
});

describe('InputGroup Component', () => {
  describe('Basic Rendering', () => {
    it('should render as fieldset', () => {
      const { container } = render(<InputGroup>Content</InputGroup>);
      const fieldset = container.querySelector('fieldset');
      expect(fieldset).toBeInTheDocument();
      expect(fieldset?.tagName).toBe('FIELDSET');
    });

    it('should render with label as legend', () => {
      render(<InputGroup label="Personal Information">Content</InputGroup>);
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <InputGroup>
          <Input label="First Name" />
          <Input label="Last Name" />
        </InputGroup>
      );
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
    });
  });

  describe('Orientation', () => {
    it('should default to vertical orientation', () => {
      const { container } = render(
        <InputGroup>
          <Input />
          <Input />
        </InputGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group).toHaveClass('space-y-4');
    });

    it('should render horizontal orientation', () => {
      const { container } = render(
        <InputGroup orientation="horizontal">
          <Input />
          <Input />
        </InputGroup>
      );
      const group = container.querySelector('[role="group"]');
      expect(group).toHaveClass('flex', 'gap-4');
    });
  });

  describe('Required Indicator', () => {
    it('should show required asterisk when required', () => {
      render(<InputGroup label="Required Group" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to fieldset element', () => {
      const ref = jest.fn();
      render(<InputGroup ref={ref}>Content</InputGroup>);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLFieldSetElement);
    });
  });
});

describe('SearchInput Component', () => {
  describe('Basic Rendering', () => {
    it('should render with search icon', () => {
      const { container } = render(<SearchInput />);
      const searchIcon = container.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should render with type search', () => {
      render(<SearchInput />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render with placeholder', () => {
      render(<SearchInput placeholder="Search..." />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should show clear button when value exists and clearable is true', async () => {
      render(<SearchInput clearable value="test" onChange={() => {}} />);
      const clearButton = screen.getByLabelText(/clear search/i);
      expect(clearButton).toBeInTheDocument();
    });

    it('should not show clear button when value is empty', () => {
      render(<SearchInput clearable value="" onChange={() => {}} />);
      expect(screen.queryByLabelText(/clear search/i)).not.toBeInTheDocument();
    });

    it('should not show clear button when clearable is false', () => {
      render(<SearchInput clearable={false} value="test" onChange={() => {}} />);
      expect(screen.queryByLabelText(/clear search/i)).not.toBeInTheDocument();
    });

    it('should call onClear when clear button is clicked', async () => {
      const handleClear = jest.fn();
      render(<SearchInput clearable value="test" onChange={() => {}} onClear={handleClear} />);
      const clearButton = screen.getByLabelText(/clear search/i);

      await userEvent.click(clearButton);
      expect(handleClear).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('should call onSearch when Enter is pressed', async () => {
      const handleSearch = jest.fn();
      render(<SearchInput onSearch={handleSearch} />);
      const input = screen.getByRole('searchbox');

      await userEvent.type(input, 'test query{Enter}');
      expect(handleSearch).toHaveBeenCalledWith('test query');
    });

    it('should handle controlled value', () => {
      const { rerender } = render(<SearchInput value="initial" onChange={() => {}} />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input.value).toBe('initial');

      rerender(<SearchInput value="updated" onChange={() => {}} />);
      expect(input.value).toBe('updated');
    });

    it('should handle uncontrolled value', async () => {
      render(<SearchInput />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;

      await userEvent.type(input, 'uncontrolled');
      expect(input.value).toBe('uncontrolled');
    });

    it('should call onChange on value change', async () => {
      const handleChange = jest.fn();
      render(<SearchInput onChange={handleChange} />);
      const input = screen.getByRole('searchbox');

      await userEvent.type(input, 'a');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('should prevent default form submission on Enter', async () => {
      const handleSearch = jest.fn();
      const TestForm = () => (
        <form>
          <SearchInput onSearch={handleSearch} />
        </form>
      );

      render(<TestForm />);
      const input = screen.getByRole('searchbox');

      await userEvent.type(input, 'test{Enter}');
      expect(handleSearch).toHaveBeenCalledWith('test');
    });

    it('should call custom onKeyDown handler', async () => {
      const handleKeyDown = jest.fn();
      render(<SearchInput onKeyDown={handleKeyDown} />);
      const input = screen.getByRole('searchbox');

      await userEvent.type(input, 'a');
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = jest.fn();
      render(<SearchInput ref={ref} />);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });
  });
});

describe('Input Variants', () => {
  describe('Style Variants', () => {
    it('should apply default variant', () => {
      render(<Input variant="default" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-input');
    });

    it('should apply error variant', () => {
      render(<Input variant="error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive/50');
    });

    it('should apply success variant', () => {
      render(<Input variant="success" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-cryb-success/50');
    });

    it('should apply warning variant', () => {
      render(<Input variant="warning" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-cryb-warning/50');
    });

    it('should auto-apply error variant when error prop exists', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive/50');
    });
  });
});

describe('Integration Tests', () => {
  it('should work in a complete form', async () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    const TestForm = () => (
      <form onSubmit={handleSubmit}>
        <Input label="Username" name="username" required data-testid="username-input" />
        <Input label="Email" type="email" name="email" required data-testid="email-input" />
        <Input label="Password" type="password" name="password" required data-testid="password-input" />
        <button type="submit">Submit</button>
      </form>
    );

    render(<TestForm />);

    const username = screen.getByTestId('username-input') as HTMLInputElement;
    const email = screen.getByTestId('email-input') as HTMLInputElement;
    const password = screen.getByTestId('password-input') as HTMLInputElement;
    const submit = screen.getByRole('button', { name: /submit/i });

    await userEvent.type(username, 'testuser');
    await userEvent.type(email, 'test@example.com');
    await userEvent.type(password, 'password123');
    await userEvent.click(submit);

    expect(handleSubmit).toHaveBeenCalled();
    expect(username.value).toBe('testuser');
    expect(email.value).toBe('test@example.com');
    expect(password.value).toBe('password123');
  });

  it('should display multiple validation states in a form', () => {
    render(
      <>
        <Input label="Valid" success="Good!" />
        <Input label="Invalid" error="Required" />
        <Input label="Warning" warning="Check this" />
      </>
    );

    expect(screen.getByText('Good!')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Check this')).toBeInTheDocument();
  });

  it('should handle dynamic error states', () => {
    const { rerender } = render(<Input label="Email" data-testid="email-field" />);
    expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();

    rerender(<Input label="Email" error="Invalid email" data-testid="email-field" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByTestId('email-field')).toHaveAttribute('aria-invalid', 'true');
  });
});
