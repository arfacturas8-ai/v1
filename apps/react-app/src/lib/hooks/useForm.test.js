/**
 * Tests for useForm hook
 * Comprehensive test coverage for custom form hook with Zod validation
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { useForm, field, getFieldProps } from './useForm';

describe('useForm', () => {
  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useForm());

      expect(result.current.formState).toBeDefined();
      expect(result.current.isValid).toBe(false);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isSubmitted).toBe(false);
    });

    it('initializes with provided default values', () => {
      const defaultValues = {
        username: 'testuser',
        email: 'test@example.com',
        age: 25
      };

      const { result } = renderHook(() => useForm({ defaultValues }));

      expect(result.current.getValues()).toEqual(defaultValues);
    });

    it('initializes with empty default values when not provided', () => {
      const { result } = renderHook(() => useForm());

      expect(result.current.getValues()).toEqual({});
    });

    it('initializes with Zod schema validation', () => {
      const schema = z.object({
        username: z.string().min(3),
        email: z.string().email()
      });

      const { result } = renderHook(() => useForm({ schema }));

      expect(result.current.formState).toBeDefined();
    });

    it('initializes with different validation modes', () => {
      const modes = ['onChange', 'onBlur', 'onSubmit', 'onTouched', 'all'];

      modes.forEach((mode) => {
        const { result } = renderHook(() => useForm({ mode }));
        expect(result.current.formState).toBeDefined();
      });
    });
  });

  describe('Form State Management', () => {
    it('tracks form values correctly', () => {
      const { result } = renderHook(() => useForm({
        defaultValues: { username: '' }
      }));

      act(() => {
        result.current.setValue('username', 'newuser');
      });

      expect(result.current.getValues('username')).toBe('newuser');
    });

    it('tracks dirty state when values change', async () => {
      const { result } = renderHook(() => useForm({
        defaultValues: { username: 'initial' }
      }));

      expect(result.current.isDirty).toBe(false);

      await act(async () => {
        result.current.setValue('username', 'changed', { shouldDirty: true });
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });
    });

    it('tracks touched fields', () => {
      const { result } = renderHook(() => useForm({
        defaultValues: { username: '' }
      }));

      expect(result.current.touchedFields).toEqual({});
    });

    it('watches specific field values', () => {
      const { result } = renderHook(() => useForm({
        defaultValues: { username: 'test', email: 'test@example.com' }
      }));

      const username = result.current.watch('username');
      expect(username).toBe('test');
    });

    it('watches all field values', () => {
      const defaultValues = { username: 'test', email: 'test@example.com' };
      const { result } = renderHook(() => useForm({ defaultValues }));

      const values = result.current.watch();
      expect(values).toEqual(defaultValues);
    });

    it('provides control object for external libraries', () => {
      const { result } = renderHook(() => useForm());

      expect(result.current.control).toBeDefined();
    });
  });

  describe('Validation', () => {
    describe('Synchronous Validation', () => {
      it('validates required fields with Zod', async () => {
        const schema = z.object({
          username: z.string().min(1, 'Username is required'),
          email: z.string().email('Invalid email')
        });

        const { result } = renderHook(() => useForm({
          schema,
          mode: 'onChange'
        }));

        await act(async () => {
          result.current.setValue('username', '', { shouldValidate: true });
          result.current.setValue('email', 'invalid', { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.hasError('username')).toBe(true);
          expect(result.current.hasError('email')).toBe(true);
        });
      });

      it('validates string minimum length', async () => {
        const schema = z.object({
          password: z.string().min(8, 'Password must be at least 8 characters')
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        await act(async () => {
          result.current.setValue('password', 'short', { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.getError('password')).toBe('Password must be at least 8 characters');
        });

        await act(async () => {
          result.current.setValue('password', 'longenoughpassword', { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.getError('password')).toBeUndefined();
        });
      });

      it('validates string maximum length', async () => {
        const schema = z.object({
          bio: z.string().max(100, 'Bio must be less than 100 characters')
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        await act(async () => {
          result.current.setValue('bio', 'a'.repeat(101), { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.hasError('bio')).toBe(true);
        });
      });

      it('validates email format', async () => {
        const schema = z.object({
          email: z.string().email('Invalid email format')
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        const invalidEmails = ['invalid', '@example.com', 'test@', 'test'];
        const validEmails = ['test@example.com', 'user+tag@domain.co.uk'];

        for (const email of invalidEmails) {
          await act(async () => {
            result.current.setValue('email', email, { shouldValidate: true });
          });

          await waitFor(() => {
            expect(result.current.hasError('email')).toBe(true);
          });
        }

        for (const email of validEmails) {
          await act(async () => {
            result.current.setValue('email', email, { shouldValidate: true });
          });

          await waitFor(() => {
            expect(result.current.hasError('email')).toBe(false);
          });
        }
      });

      it('validates number ranges', async () => {
        const schema = z.object({
          age: z.number().min(18, 'Must be 18 or older').max(100, 'Age seems invalid')
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        await act(async () => {
          result.current.setValue('age', 15, { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.getError('age')).toBe('Must be 18 or older');
        });

        await act(async () => {
          result.current.setValue('age', 101, { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.getError('age')).toBe('Age seems invalid');
        });

        await act(async () => {
          result.current.setValue('age', 25, { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.hasError('age')).toBe(false);
        });
      });

      it('validates with custom regex patterns', async () => {
        const schema = z.object({
          phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, 'Phone must be in format XXX-XXX-XXXX')
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        await act(async () => {
          result.current.setValue('phone', '1234567890', { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.hasError('phone')).toBe(true);
        });

        await act(async () => {
          result.current.setValue('phone', '123-456-7890', { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.hasError('phone')).toBe(false);
        });
      });

      it('validates optional fields', async () => {
        const schema = z.object({
          nickname: z.string().optional(),
          website: z.string().url().optional()
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        act(() => {
          result.current.setValue('nickname', '');
          result.current.setValue('website', '');
        });

        await waitFor(() => {
          expect(result.current.isValid).toBe(true);
        });
      });
    });

    describe('Async Validation', () => {
      it('handles async validation with Zod refine', async () => {
        const schema = z.object({
          username: z.string().refine(
            async (val) => {
              await new Promise(resolve => setTimeout(resolve, 100));
              return val !== 'taken';
            },
            { message: 'Username is already taken' }
          )
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onBlur' }));

        await act(async () => {
          result.current.setValue('username', 'taken');
          await result.current.trigger('username');
        });

        await waitFor(() => {
          expect(result.current.getError('username')).toBe('Username is already taken');
        }, { timeout: 3000 });
      });
    });

    describe('Field-level Validation', () => {
      it('validates individual fields on trigger', async () => {
        const schema = z.object({
          email: z.string().email(),
          password: z.string().min(8)
        });

        const { result } = renderHook(() => useForm({ schema }));

        act(() => {
          result.current.setValue('email', 'invalid');
        });

        await act(async () => {
          await result.current.trigger('email');
        });

        expect(result.current.hasError('email')).toBe(true);
      });

      it('validates multiple fields on trigger', async () => {
        const schema = z.object({
          email: z.string().email(),
          password: z.string().min(8)
        });

        const { result } = renderHook(() => useForm({ schema }));

        act(() => {
          result.current.setValue('email', 'invalid');
          result.current.setValue('password', 'short');
        });

        await act(async () => {
          await result.current.trigger(['email', 'password']);
        });

        expect(result.current.hasError('email')).toBe(true);
        expect(result.current.hasError('password')).toBe(true);
      });
    });

    describe('Form-level Validation', () => {
      it('validates entire form with complex schema', async () => {
        const schema = z.object({
          username: z.string().min(3),
          email: z.string().email(),
          password: z.string().min(8),
          confirmPassword: z.string()
        }).refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ['confirmPassword']
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        await act(async () => {
          result.current.setValue('username', 'user', { shouldValidate: true });
          result.current.setValue('email', 'test@example.com', { shouldValidate: true });
          result.current.setValue('password', 'password123', { shouldValidate: true });
          result.current.setValue('confirmPassword', 'different', { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.getError('confirmPassword')).toBe("Passwords don't match");
        });
      });
    });

    describe('Validation Modes', () => {
      it('validates on change when mode is onChange', async () => {
        const schema = z.object({
          username: z.string().min(3, 'Too short')
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        await act(async () => {
          result.current.setValue('username', 'ab', { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.hasError('username')).toBe(true);
        });
      });

      it('validates on submit when mode is onSubmit', async () => {
        const schema = z.object({
          username: z.string().min(3, 'Too short')
        });

        const onSubmit = jest.fn();
        const { result } = renderHook(() => useForm({ schema, mode: 'onSubmit', onSubmit }));

        act(() => {
          result.current.setValue('username', 'ab');
        });

        // Errors shouldn't appear until submit
        expect(result.current.hasError('username')).toBe(false);
      });
    });
  });

  describe('Error Management', () => {
    it('gets error message for a field', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email format')
      });

      const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

      await act(async () => {
        result.current.setValue('email', 'invalid', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.getError('email')).toBe('Invalid email format');
      });
    });

    it('returns undefined for field without error', () => {
      const { result } = renderHook(() => useForm());

      expect(result.current.getError('email')).toBeUndefined();
    });

    it('checks if field has error', async () => {
      const schema = z.object({
        email: z.string().email()
      });

      const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

      await act(async () => {
        result.current.setValue('email', 'invalid', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.hasError('email')).toBe(true);
      });
    });

    it('clears specific field error', async () => {
      const schema = z.object({
        email: z.string().email()
      });

      const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

      await act(async () => {
        result.current.setValue('email', 'invalid', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.hasError('email')).toBe(true);
      });

      act(() => {
        result.current.clearError('email');
      });

      expect(result.current.hasError('email')).toBe(false);
    });

    it('clears all errors', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8)
      });

      const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

      await act(async () => {
        result.current.setValue('email', 'invalid', { shouldValidate: true });
        result.current.setValue('password', 'short', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.hasError('email')).toBe(true);
        expect(result.current.hasError('password')).toBe(true);
      });

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.hasError('email')).toBe(false);
      expect(result.current.hasError('password')).toBe(false);
    });

    it('gets all errors as array', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
        password: z.string().min(8, 'Password too short')
      });

      const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

      await act(async () => {
        result.current.setValue('email', 'invalid', { shouldValidate: true });
        result.current.setValue('password', 'short', { shouldValidate: true });
      });

      await waitFor(() => {
        const errors = result.current.getAllErrors();
        expect(errors).toHaveLength(2);
        expect(errors).toContainEqual({ field: 'email', message: 'Invalid email' });
        expect(errors).toContainEqual({ field: 'password', message: 'Password too short' });
      });
    });

    it('returns empty array when no errors', () => {
      const { result } = renderHook(() => useForm());

      expect(result.current.getAllErrors()).toEqual([]);
    });

    it('exposes errors object directly', async () => {
      const schema = z.object({
        email: z.string().email()
      });

      const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

      await act(async () => {
        result.current.setValue('email', 'invalid', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBeDefined();
        expect(result.current.errors.email.message).toBeTruthy();
      });
    });
  });

  describe('Form Submission', () => {
    it('handles successful form submission', async () => {
      const schema = z.object({
        username: z.string().min(3)
      });

      const onSubmit = jest.fn();
      const { result } = renderHook(() => useForm({
        schema,
        defaultValues: { username: 'testuser' },
        onSubmit
      }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith({ username: 'testuser' });
    });

    it('handles async submission', async () => {
      const schema = z.object({
        username: z.string()
      });

      const onSubmit = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const { result } = renderHook(() => useForm({
        schema,
        defaultValues: { username: 'test' },
        onSubmit
      }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalled();
    });

    it('prevents submission when form is invalid', async () => {
      const schema = z.object({
        email: z.string().email()
      });

      const onSubmit = jest.fn();
      const { result } = renderHook(() => useForm({
        schema,
        defaultValues: { email: 'invalid' },
        onSubmit
      }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('handles submission errors', async () => {
      const schema = z.object({
        username: z.string()
      });

      const errorMessage = 'Server error occurred';
      const onSubmit = jest.fn(async () => {
        throw new Error(errorMessage);
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useForm({
        schema,
        defaultValues: { username: 'test' },
        onSubmit
      }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.errors.root).toBeDefined();
        expect(result.current.errors.root.message).toBe(errorMessage);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('sets generic error message when error has no message', async () => {
      const schema = z.object({
        username: z.string()
      });

      const onSubmit = jest.fn(async () => {
        throw new Error();
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useForm({
        schema,
        defaultValues: { username: 'test' },
        onSubmit
      }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.errors.root.message).toBe('An error occurred during submission');
      });

      consoleErrorSpy.mockRestore();
    });

    it('tracks submitting state', async () => {
      const schema = z.object({
        username: z.string()
      });

      const onSubmit = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const { result } = renderHook(() => useForm({
        schema,
        defaultValues: { username: 'test' },
        onSubmit
      }));

      expect(result.current.isSubmitting).toBe(false);

      const submitPromise = act(async () => {
        await result.current.handleSubmit();
      });

      await submitPromise;
      expect(result.current.isSubmitting).toBe(false);
    });

    it('tracks submitted state', async () => {
      const schema = z.object({
        username: z.string()
      });

      const onSubmit = jest.fn();
      const { result } = renderHook(() => useForm({
        schema,
        defaultValues: { username: 'test' },
        onSubmit
      }));

      expect(result.current.isSubmitted).toBe(false);

      await act(async () => {
        await result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.isSubmitted).toBe(true);
      });
    });

    it('returns custom submit handler when no onSubmit provided', () => {
      const { result } = renderHook(() => useForm());

      expect(typeof result.current.handleSubmit).toBe('function');
    });

    it('allows custom submit handler to be passed to handleSubmit', async () => {
      const schema = z.object({
        username: z.string()
      });

      const customHandler = jest.fn();
      const { result } = renderHook(() => useForm({
        schema,
        defaultValues: { username: 'test' }
      }));

      await act(async () => {
        await result.current.handleSubmit(customHandler)();
      });

      expect(customHandler).toHaveBeenCalledWith({ username: 'test' });
    });
  });

  describe('Form Reset', () => {
    it('resets form to default values', () => {
      const defaultValues = { username: 'test', email: 'test@example.com' };
      const { result } = renderHook(() => useForm({ defaultValues }));

      act(() => {
        result.current.setValue('username', 'changed');
        result.current.setValue('email', 'changed@example.com');
      });

      expect(result.current.getValues()).toEqual({
        username: 'changed',
        email: 'changed@example.com'
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.getValues()).toEqual(defaultValues);
    });

    it('resets form to new values', () => {
      const defaultValues = { username: 'test' };
      const newValues = { username: 'newtest', email: 'new@example.com' };

      const { result } = renderHook(() => useForm({ defaultValues }));

      act(() => {
        result.current.reset(newValues);
      });

      expect(result.current.getValues()).toEqual(newValues);
    });

    it('resets dirty state on reset', async () => {
      const defaultValues = { username: 'test' };
      const { result } = renderHook(() => useForm({ defaultValues }));

      await act(async () => {
        result.current.setValue('username', 'changed', { shouldDirty: true });
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });
    });

    it('clears errors on reset', async () => {
      const schema = z.object({
        email: z.string().email()
      });

      const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

      await act(async () => {
        result.current.setValue('email', 'invalid', { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.hasError('email')).toBe(true);
      });

      act(() => {
        result.current.reset({ email: '' });
      });

      expect(result.current.hasError('email')).toBe(false);
    });
  });

  describe('Complex Field Types', () => {
    describe('Array Fields', () => {
      it('handles array field values', () => {
        const defaultValues = {
          tags: ['react', 'testing']
        };

        const { result } = renderHook(() => useForm({ defaultValues }));

        expect(result.current.getValues('tags')).toEqual(['react', 'testing']);

        act(() => {
          result.current.setValue('tags', ['react', 'testing', 'jest']);
        });

        expect(result.current.getValues('tags')).toEqual(['react', 'testing', 'jest']);
      });

      it('validates array fields with Zod', async () => {
        const schema = z.object({
          tags: z.array(z.string()).min(1, 'At least one tag required')
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        await act(async () => {
          result.current.setValue('tags', [], { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.hasError('tags')).toBe(true);
        });

        await act(async () => {
          result.current.setValue('tags', ['test'], { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.hasError('tags')).toBe(false);
        });
      });

      it('validates array item types', async () => {
        const schema = z.object({
          scores: z.array(z.number()).min(1)
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        act(() => {
          result.current.setValue('scores', [1, 2, 3]);
        });

        await waitFor(() => {
          expect(result.current.hasError('scores')).toBe(false);
        });
      });
    });

    describe('Nested Object Fields', () => {
      it('handles nested object values', () => {
        const defaultValues = {
          user: {
            name: 'John',
            contact: {
              email: 'john@example.com',
              phone: '123-456-7890'
            }
          }
        };

        const { result } = renderHook(() => useForm({ defaultValues }));

        expect(result.current.getValues('user.name')).toBe('John');
        expect(result.current.getValues('user.contact.email')).toBe('john@example.com');
      });

      it('validates nested object fields', async () => {
        const schema = z.object({
          user: z.object({
            name: z.string().min(1, 'Name is required'),
            contact: z.object({
              email: z.string().email('Invalid email')
            })
          })
        });

        const { result } = renderHook(() => useForm({
          schema,
          mode: 'onChange',
          defaultValues: {
            user: {
              name: 'Test',
              contact: {
                email: ''
              }
            }
          }
        }));

        await act(async () => {
          result.current.setValue('user', {
            name: 'Test',
            contact: {
              email: 'invalid'
            }
          }, { shouldValidate: true });
        });

        await waitFor(() => {
          // Check if the error exists on the nested field
          const hasNestedError = result.current.errors?.user?.contact?.email;
          expect(hasNestedError).toBeTruthy();
        });
      });

      it('updates nested fields independently', () => {
        const defaultValues = {
          user: {
            name: 'John',
            age: 30
          }
        };

        const { result } = renderHook(() => useForm({ defaultValues }));

        act(() => {
          result.current.setValue('user.name', 'Jane');
        });

        expect(result.current.getValues('user.name')).toBe('Jane');
        expect(result.current.getValues('user.age')).toBe(30);
      });
    });

    describe('File Upload Fields', () => {
      it('handles file input values', async () => {
        const { result } = renderHook(() => useForm());

        const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

        await act(async () => {
          result.current.setValue('file', mockFile);
        });

        expect(result.current.getValues('file')).toBe(mockFile);
      });

      it('validates file types', async () => {
        const schema = z.object({
          avatar: z.any().refine(
            (files) => {
              if (!files || files.length === 0) return false;
              return ['image/jpeg', 'image/png'].includes(files[0]?.type);
            },
            { message: 'Only JPEG and PNG files are allowed' }
          )
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
        await act(async () => {
          result.current.setValue('avatar', [invalidFile], { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.getError('avatar')).toBe('Only JPEG and PNG files are allowed');
        });
      });

      it('validates file size', async () => {
        const MAX_SIZE = 1024 * 1024; // 1MB

        const schema = z.object({
          document: z.any().refine(
            (files) => {
              if (!files || files.length === 0) return true;
              return files[0]?.size <= MAX_SIZE;
            },
            { message: 'File size must be less than 1MB' }
          )
        });

        const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

        // Create a mock file that appears to be larger than MAX_SIZE
        const largeFile = new File(['x'.repeat(MAX_SIZE + 1)], 'large.pdf', { type: 'application/pdf' });

        await act(async () => {
          result.current.setValue('document', [largeFile], { shouldValidate: true });
        });

        await waitFor(() => {
          expect(result.current.getError('document')).toBe('File size must be less than 1MB');
        });
      });
    });
  });

  describe('Register Function', () => {
    it('provides register function for field registration', () => {
      const { result } = renderHook(() => useForm());

      const registration = result.current.register('username');
      expect(registration).toHaveProperty('name');
      expect(registration).toHaveProperty('onChange');
      expect(registration).toHaveProperty('onBlur');
      expect(registration).toHaveProperty('ref');
    });

    it('registers field with validation options', () => {
      const { result } = renderHook(() => useForm());

      const registration = result.current.register('email', { required: true });
      expect(registration.name).toBe('email');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles undefined field values', () => {
      const { result } = renderHook(() => useForm());

      expect(result.current.getValues('nonexistent')).toBeUndefined();
      expect(result.current.getError('nonexistent')).toBeUndefined();
      expect(result.current.hasError('nonexistent')).toBe(false);
    });

    it('handles multiple setValue calls in sequence', () => {
      const { result } = renderHook(() => useForm());

      act(() => {
        result.current.setValue('field1', 'value1');
        result.current.setValue('field2', 'value2');
        result.current.setValue('field3', 'value3');
      });

      expect(result.current.getValues('field1')).toBe('value1');
      expect(result.current.getValues('field2')).toBe('value2');
      expect(result.current.getValues('field3')).toBe('value3');
    });

    it('handles complex validation schemas', async () => {
      const schema = z.object({
        username: z.string()
          .min(3, 'Too short')
          .max(20, 'Too long')
          .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
        email: z.string().email(),
        password: z.string()
          .min(8)
          .regex(/[A-Z]/, 'Must contain uppercase')
          .regex(/[a-z]/, 'Must contain lowercase')
          .regex(/[0-9]/, 'Must contain number'),
        terms: z.boolean().refine(val => val === true, {
          message: 'You must accept the terms'
        })
      });

      const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

      await act(async () => {
        result.current.setValue('username', 'a', { shouldValidate: true });
        result.current.setValue('email', 'invalid', { shouldValidate: true });
        result.current.setValue('password', 'weak', { shouldValidate: true });
        result.current.setValue('terms', false, { shouldValidate: true });
      });

      await waitFor(() => {
        expect(result.current.hasError('username')).toBe(true);
        expect(result.current.hasError('email')).toBe(true);
        expect(result.current.hasError('password')).toBe(true);
        expect(result.current.hasError('terms')).toBe(true);
      });
    });

    it('handles form without schema', () => {
      const { result } = renderHook(() => useForm({
        defaultValues: { username: 'test' }
      }));

      act(() => {
        result.current.setValue('username', 'changed');
      });

      expect(result.current.getValues('username')).toBe('changed');
    });

    it('handles empty submit handler', async () => {
      const { result } = renderHook(() => useForm({
        defaultValues: { username: 'test' }
      }));

      // Should not throw when no onSubmit is provided
      await act(async () => {
        const handler = result.current.handleSubmit(jest.fn());
        await handler();
      });
    });
  });
});

describe('field helper function', () => {
  it('returns field registration with name', () => {
    const mockRegister = jest.fn((name) => ({
      name,
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn()
    }));

    const result = field(mockRegister, 'username');

    expect(mockRegister).toHaveBeenCalledWith('username', {});
    expect(result.name).toBe('username');
  });

  it('passes options to register function', () => {
    const mockRegister = jest.fn();
    const options = { required: true, minLength: 3 };

    field(mockRegister, 'email', options);

    expect(mockRegister).toHaveBeenCalledWith('email', options);
  });
});

describe('getFieldProps helper function', () => {
  it('returns field props with error state', async () => {
    const schema = z.object({
      email: z.string().email('Invalid email')
    });

    const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

    await act(async () => {
      result.current.setValue('email', 'invalid', { shouldValidate: true });
    });

    await waitFor(() => {
      const props = getFieldProps(result.current, 'email');

      expect(props).toHaveProperty('name', 'email');
      expect(props).toHaveProperty('onChange');
      expect(props).toHaveProperty('onBlur');
      expect(props).toHaveProperty('ref');
      expect(props.error).toBe('Invalid email');
      expect(props.hasError).toBe(true);
      expect(props['aria-invalid']).toBe(true);
      expect(props['aria-describedby']).toBe('email-error');
    });
  });

  it('returns field props without error state when valid', () => {
    const { result } = renderHook(() => useForm());

    const props = getFieldProps(result.current, 'username');

    expect(props).toHaveProperty('name', 'username');
    expect(props.error).toBeUndefined();
    expect(props.hasError).toBe(false);
    expect(props['aria-invalid']).toBe(false);
    expect(props['aria-describedby']).toBeUndefined();
  });

  it('provides correct accessibility attributes', async () => {
    const schema = z.object({
      password: z.string().min(8, 'Password too short')
    });

    const { result } = renderHook(() => useForm({ schema, mode: 'onChange' }));

    await act(async () => {
      result.current.setValue('password', 'short', { shouldValidate: true });
    });

    await waitFor(() => {
      const props = getFieldProps(result.current, 'password');

      expect(props['aria-invalid']).toBe(true);
      expect(props['aria-describedby']).toBe('password-error');
    });
  });
});

describe('Integration Tests', () => {
  it('handles complete registration form workflow', async () => {
    const schema = z.object({
      username: z.string().min(3, 'Username must be at least 3 characters'),
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword']
    });

    const onSubmit = jest.fn();
    const { result } = renderHook(() => useForm({
      schema,
      mode: 'onChange',
      onSubmit
    }));

    // Set valid values
    await act(async () => {
      result.current.setValue('username', 'johndoe', { shouldValidate: true });
      result.current.setValue('email', 'john@example.com', { shouldValidate: true });
      result.current.setValue('password', 'SecurePass123', { shouldValidate: true });
      result.current.setValue('confirmPassword', 'SecurePass123', { shouldValidate: true });
    });

    // Wait for validation
    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123'
    });
  });

  it('handles complete form workflow with validation errors', async () => {
    const schema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(8, 'Password too short')
    });

    const onSubmit = jest.fn();
    const { result } = renderHook(() => useForm({
      schema,
      mode: 'onChange',
      onSubmit
    }));

    // Set invalid values
    await act(async () => {
      result.current.setValue('email', 'not-an-email', { shouldValidate: true });
      result.current.setValue('password', 'short', { shouldValidate: true });
    });

    // Wait for validation errors
    await waitFor(() => {
      expect(result.current.hasError('email')).toBe(true);
      expect(result.current.hasError('password')).toBe(true);
    });

    // Attempt to submit (should fail)
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();

    // Fix errors
    await act(async () => {
      result.current.setValue('email', 'valid@example.com', { shouldValidate: true });
      result.current.setValue('password', 'longpassword', { shouldValidate: true });
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
    });

    // Submit again
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalled();
  });

  it('handles form reset after submission', async () => {
    const schema = z.object({
      message: z.string().min(1)
    });

    const onSubmit = jest.fn();
    const defaultValues = { message: '' };

    const { result } = renderHook(() => useForm({
      schema,
      defaultValues,
      onSubmit
    }));

    // Fill form
    act(() => {
      result.current.setValue('message', 'Hello World');
    });

    // Submit
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith({ message: 'Hello World' });

    // Reset form
    act(() => {
      result.current.reset();
    });

    expect(result.current.getValues('message')).toBe('');
    expect(result.current.isDirty).toBe(false);
  });
});
