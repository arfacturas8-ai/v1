import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Textarea from '../Textarea';

describe('Textarea', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Textarea placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Textarea label="Description" />);
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Textarea defaultValue="default text" />);
      expect(screen.getByRole('textbox')).toHaveValue('default text');
    });

    it('renders with controlled value', () => {
      render(<Textarea value="controlled" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });
  });

  describe('Sizes', () => {
    it('applies default rows', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
    });

    it('applies custom rows', () => {
      render(<Textarea rows={8} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
    });
  });

  describe('States', () => {
    it('can be disabled', () => {
      render(<Textarea disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('can be readonly', () => {
      render(<Textarea readonly value="readonly text" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('can be required', () => {
      render(<Textarea required label="Required Field" />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('shows error state', () => {
      render(<Textarea error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows success state', () => {
      render(<Textarea success="Looks good!" />);
      expect(screen.getByText('Looks good!')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles onChange events', async () => {
      const handleChange = jest.fn();
      render(<Textarea onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'hello');

      expect(handleChange).toHaveBeenCalled();
      expect(textarea).toHaveValue('hello');
    });

    it('handles onFocus events', () => {
      const handleFocus = jest.fn();
      render(<Textarea onFocus={handleFocus} />);

      const textarea = screen.getByRole('textbox');
      textarea.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles onBlur events', () => {
      const handleBlur = jest.fn();
      render(<Textarea onBlur={handleBlur} />);

      const textarea = screen.getByRole('textbox');
      textarea.focus();
      textarea.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('works as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<TestComponent />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, 'test');
      expect(textarea).toHaveValue('test');
    });
  });

  describe('Character Count', () => {
    it('shows character count when enabled', () => {
      render(<Textarea showCharCount maxLength={100} defaultValue="test" />);
      expect(screen.getByText(/4 \/ 100/)).toBeInTheDocument();
    });

    it('does not show character count by default', () => {
      render(<Textarea maxLength={100} />);
      expect(screen.queryByText(/\/ 100/)).not.toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('renders helper text', () => {
      render(<Textarea helperText="Enter your description" />);
      expect(screen.getByText('Enter your description')).toBeInTheDocument();
    });

    it('hides helper text when error is shown', () => {
      render(<Textarea helperText="Helper" error="Error" />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('associates label with textarea', () => {
      render(<Textarea label="Description" id="desc" />);
      const textarea = screen.getByLabelText('Description');
      expect(textarea).toHaveAttribute('id', 'desc');
    });

    it('sets aria-invalid on error', () => {
      render(<Textarea error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('error message has role="alert"', () => {
      render(<Textarea error="Error" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('supports name attribute', () => {
      render(<Textarea name="description" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'description');
    });

    it('supports autoFocus', () => {
      render(<Textarea autoFocus />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('supports maxLength', () => {
      render(<Textarea maxLength={100} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '100');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = React.createRef();
      render(<Textarea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });
});

export default handleChange
