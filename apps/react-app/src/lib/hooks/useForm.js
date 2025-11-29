/**
 * CRYB Platform - Custom Form Hook
 * Integration of React Hook Form with Zod validation
 * Provides a simple API for form management
 */

import { useForm as useReactHookForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

/**
 * Custom form hook with Zod validation
 * @param {Object} options - Form options
 * @param {z.ZodSchema} options.schema - Zod validation schema
 * @param {Object} options.defaultValues - Default form values
 * @param {string} options.mode - Validation mode (onChange, onBlur, onSubmit, onTouched, all)
 * @param {Function} options.onSubmit - Submit handler
 * @returns {Object} Form methods and state
 */
export function useForm({
  schema,
  defaultValues = {},
  mode = 'onChange',
  onSubmit
} = {}) {
  const form = useReactHookForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode
  })

  /**
   * Handle form submission with error handling
   * @param {Function} submitHandler - Submit handler function
   * @returns {Function} Form submit handler
   */
  const handleSubmit = (submitHandler) => {
    return form.handleSubmit(async (data) => {
      try {
        await submitHandler(data)
      } catch (error) {
        console.error('Form submission error:', error)

        // Set form-level error
        form.setError('root', {
          type: 'manual',
          message: error.message || 'An error occurred during submission'
        })
      }
    })
  }

  /**
   * Get error message for a field
   * @param {string} fieldName - Field name
   * @returns {string | undefined} Error message
   */
  const getError = (fieldName) => {
    return form.formState.errors[fieldName]?.message
  }

  /**
   * Check if a field has an error
   * @param {string} fieldName - Field name
   * @returns {boolean} True if field has error
   */
  const hasError = (fieldName) => {
    return !!form.formState.errors[fieldName]
  }

  /**
   * Clear specific field error
   * @param {string} fieldName - Field name
   */
  const clearError = (fieldName) => {
    form.clearErrors(fieldName)
  }

  /**
   * Clear all errors
   */
  const clearAllErrors = () => {
    form.clearErrors()
  }

  /**
   * Get all error messages as array
   * @returns {Array<{field: string, message: string}>}
   */
  const getAllErrors = () => {
    const errors = form.formState.errors
    return Object.keys(errors).map((key) => ({
      field: key,
      message: errors[key].message
    }))
  }

  /**
   * Reset form to default values
   * @param {Object} values - Optional new default values
   */
  const resetForm = (values) => {
    form.reset(values || defaultValues)
  }

  return {
    // React Hook Form methods
    register: form.register,
    handleSubmit: onSubmit ? handleSubmit(onSubmit) : handleSubmit,
    watch: form.watch,
    setValue: form.setValue,
    getValues: form.getValues,
    reset: resetForm,
    trigger: form.trigger,
    control: form.control,
    formState: form.formState,

    // Custom helper methods
    getError,
    hasError,
    clearError,
    clearAllErrors,
    getAllErrors,

    // Form state properties
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    isSubmitted: form.formState.isSubmitted,
    errors: form.formState.errors,
    touchedFields: form.formState.touchedFields
  }
}

/**
 * Form field registration helper
 * @param {Object} register - React Hook Form register function
 * @param {string} name - Field name
 * @param {Object} options - Registration options
 * @returns {Object} Field props
 */
export function field(register, name, options = {}) {
  return register(name, options)
}

/**
 * Get field props with error state
 * @param {Object} form - Form object from useForm
 * @param {string} name - Field name
 * @returns {Object} Field props including error state
 */
export function getFieldProps(form, name) {
  return {
    ...form.register(name),
    error: form.getError(name),
    hasError: form.hasError(name),
    'aria-invalid': form.hasError(name),
    'aria-describedby': form.hasError(name) ? `${name}-error` : undefined
  }
}

export default useForm
