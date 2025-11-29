/**
 * Tests for useFormValidation hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import useFormValidation from './useFormValidation';

describe('useFormValidation', () => {
  const mockValidator = (value) => {
    if (!value) return 'Field is required';
    if (value.length < 3) return 'Must be at least 3 characters';
    return true;
  };

  const emailValidator = (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email';
    return true;
  };

  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useFormValidation({ name: 'John' }));

      expect(result.current.values).toEqual({ name: 'John' });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.submitCount).toBe(0);
    });

    it('initializes with validation schema', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { email: '' },
          { email: emailValidator }
        )
      );

      expect(result.current.values).toEqual({ email: '' });
    });
  });

  describe('handleChange', () => {
    it('updates field value', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: '' })
      );

      act(() => {
        result.current.handleChange('name', 'John');
      });

      expect(result.current.values.name).toBe('John');
      expect(result.current.isDirty).toBe(true);
    });

    it('validates on change when field is touched', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: '' },
          { name: mockValidator }
        )
      );

      act(() => {
        result.current.setFieldTouched('name', true);
      });

      act(() => {
        result.current.handleChange('name', 'ab');
      });

      expect(result.current.errors.name).toBe('Must be at least 3 characters');
    });

    it('does not validate untouched fields on change', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: '' },
          { name: mockValidator }
        )
      );

      act(() => {
        result.current.handleChange('name', 'ab');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('handleBlur', () => {
    it('marks field as touched', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: '' })
      );

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.touched.name).toBe(true);
    });

    it('validates field on blur', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'ab' },
          { name: mockValidator }
        )
      );

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('Must be at least 3 characters');
    });

    it('clears error if field is valid', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'ab' },
          { name: mockValidator }
        )
      );

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('Must be at least 3 characters');

      act(() => {
        result.current.handleChange('name', 'John');
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBeNull();
    });
  });

  describe('validateForm', () => {
    it('validates all fields', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: '', email: '' },
          {
            name: mockValidator,
            email: emailValidator
          }
        )
      );

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(false);
      });

      expect(result.current.errors.name).toBe('Field is required');
      expect(result.current.errors.email).toBe('Email is required');
    });

    it('returns true when all fields are valid', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'John', email: 'john@example.com' },
          {
            name: mockValidator,
            email: emailValidator
          }
        )
      );

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(true);
      });

      expect(result.current.errors).toEqual({});
    });

    it('updates errors object', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'ab' },
          { name: mockValidator }
        )
      );

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.name).toBe('Must be at least 3 characters');
    });
  });

  describe('resetForm', () => {
    it('resets to initial values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() =>
        useFormValidation(initialValues)
      );

      act(() => {
        result.current.handleChange('name', 'Jane');
        result.current.setFieldError('name', 'Error');
        result.current.setFieldTouched('name', true);
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isDirty).toBe(false);
      expect(result.current.submitCount).toBe(0);
    });

    it('resets to new values', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: 'John' })
      );

      act(() => {
        result.current.resetForm({ name: 'Jane' });
      });

      expect(result.current.values.name).toBe('Jane');
    });
  });

  describe('setFieldValue', () => {
    it('sets field value', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: '' })
      );

      act(() => {
        result.current.setFieldValue('name', 'John');
      });

      expect(result.current.values.name).toBe('John');
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('setFieldError', () => {
    it('sets field error', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: '' })
      );

      act(() => {
        result.current.setFieldError('name', 'Custom error');
      });

      expect(result.current.errors.name).toBe('Custom error');
    });
  });

  describe('setFieldTouched', () => {
    it('sets field touched state', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: '' })
      );

      act(() => {
        result.current.setFieldTouched('name', true);
      });

      expect(result.current.touched.name).toBe(true);
    });

    it('can set field as untouched', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: '' })
      );

      act(() => {
        result.current.setFieldTouched('name', true);
      });

      act(() => {
        result.current.setFieldTouched('name', false);
      });

      expect(result.current.touched.name).toBe(false);
    });
  });

  describe('handleSubmit', () => {
    it('validates form before submitting', async () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() =>
        useFormValidation(
          { name: '' },
          { name: mockValidator }
        )
      );

      await act(async () => {
        await result.current.handleSubmit(onSubmit);
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.errors.name).toBe('Field is required');
    });

    it('marks all fields as touched on submit', async () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() =>
        useFormValidation(
          { name: '', email: '' },
          { name: mockValidator, email: emailValidator }
        )
      );

      await act(async () => {
        await result.current.handleSubmit(onSubmit);
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.email).toBe(true);
    });

    it('calls onSubmit with values when valid', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'John' },
          { name: mockValidator }
        )
      );

      await act(async () => {
        await result.current.handleSubmit(onSubmit);
      });

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
      expect(result.current.isDirty).toBe(false);
    });

    it('sets isSubmitting during submission', async () => {
      let resolveSubmit;
      const onSubmit = jest.fn(() => new Promise(resolve => {
        resolveSubmit = resolve;
      }));

      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'John' },
          { name: mockValidator }
        )
      );

      act(() => {
        result.current.handleSubmit(onSubmit);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      await act(async () => {
        resolveSubmit();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('increments submit count', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'John' },
          { name: mockValidator }
        )
      );

      await act(async () => {
        await result.current.handleSubmit(onSubmit);
      });

      expect(result.current.submitCount).toBe(1);

      await act(async () => {
        await result.current.handleSubmit(onSubmit);
      });

      expect(result.current.submitCount).toBe(2);
    });

    it('handles submission errors', async () => {
      const error = new Error('Submission failed');
      const onSubmit = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'John' },
          { name: mockValidator }
        )
      );

      await act(async () => {
        await expect(result.current.handleSubmit(onSubmit)).rejects.toThrow('Submission failed');
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('getFieldProps', () => {
    it('returns field props', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: 'John' })
      );

      const props = result.current.getFieldProps('name');

      expect(props.name).toBe('name');
      expect(props.value).toBe('John');
      expect(props.onChange).toBeInstanceOf(Function);
      expect(props.onBlur).toBeInstanceOf(Function);
    });

    it('handles onChange event', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: '' })
      );

      const props = result.current.getFieldProps('name');

      act(() => {
        props.onChange({ target: { value: 'John' } });
      });

      expect(result.current.values.name).toBe('John');
    });

    it('handles onBlur event', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'ab' },
          { name: mockValidator }
        )
      );

      const props = result.current.getFieldProps('name');

      act(() => {
        props.onBlur();
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.errors.name).toBe('Must be at least 3 characters');
    });

    it('includes error only when touched', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'ab' },
          { name: mockValidator }
        )
      );

      let props = result.current.getFieldProps('name');
      expect(props.error).toBeNull();

      act(() => {
        result.current.handleBlur('name');
      });

      props = result.current.getFieldProps('name');
      expect(props.error).toBe('Must be at least 3 characters');
    });
  });

  describe('getFieldMeta', () => {
    it('returns field metadata', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: 'John' },
          { name: mockValidator }
        )
      );

      act(() => {
        result.current.setFieldError('name', 'Error');
        result.current.setFieldTouched('name', true);
      });

      const meta = result.current.getFieldMeta('name');

      expect(meta.value).toBe('John');
      expect(meta.error).toBe('Error');
      expect(meta.touched).toBe(true);
      expect(meta.isDirty).toBe(false);
    });

    it('tracks field dirty state', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: 'John' })
      );

      let meta = result.current.getFieldMeta('name');
      expect(meta.isDirty).toBe(false);

      act(() => {
        result.current.handleChange('name', 'Jane');
      });

      meta = result.current.getFieldMeta('name');
      expect(meta.isDirty).toBe(true);
    });
  });

  describe('setValues', () => {
    it('updates multiple values', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: '', email: '' })
      );

      act(() => {
        result.current.setValues({ name: 'John', email: 'john@example.com' });
      });

      expect(result.current.values).toEqual({
        name: 'John',
        email: 'john@example.com'
      });
    });
  });

  describe('Complex validation scenarios', () => {
    it('handles multiple fields with different validators', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: '', email: '', age: '' },
          {
            name: mockValidator,
            email: emailValidator,
            age: (v) => {
              if (!v) return 'Age is required';
              if (Number(v) < 18) return 'Must be 18 or older';
              return true;
            }
          }
        )
      );

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.name).toBe('Field is required');
      expect(result.current.errors.email).toBe('Email is required');
      expect(result.current.errors.age).toBe('Age is required');
    });

    it('maintains validation state across multiple changes', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { name: '' },
          { name: mockValidator }
        )
      );

      act(() => {
        result.current.setFieldTouched('name', true);
        result.current.handleChange('name', 'J');
      });

      expect(result.current.errors.name).toBe('Must be at least 3 characters');

      act(() => {
        result.current.handleChange('name', 'John');
      });

      expect(result.current.errors.name).toBeNull();
    });
  });
});
