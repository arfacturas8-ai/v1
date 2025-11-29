/**
 * CRYB Platform - Form Validation Hook
 * Comprehensive form state and validation management
 */

import { useState, useCallback, useRef } from 'react';

export const useFormValidation = (initialValues = {}, validationSchema = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Track initial values for dirty state
  const initialValuesRef = useRef(initialValues);

  // Handle field change
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);

    // Validate on change if field has been touched
    if (touched[name] && validationSchema[name]) {
      const validator = validationSchema[name];
      const error = typeof validator === 'function' ? validator(value) : null;
      setErrors(prev => ({
        ...prev,
        [name]: error === true ? null : error,
      }));
    }
  }, [touched, validationSchema]);

  // Handle field blur
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    if (validationSchema[name]) {
      const validator = validationSchema[name];
      const value = values[name];
      const error = typeof validator === 'function' ? validator(value) : null;
      setErrors(prev => ({
        ...prev,
        [name]: error === true ? null : error,
      }));
    }
  }, [values, validationSchema]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(name => {
      const validator = validationSchema[name];
      const value = values[name];
      const error = typeof validator === 'function' ? validator(value) : null;

      if (error !== true) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationSchema]);

  // Reset form
  const resetForm = useCallback((newValues = initialValuesRef.current) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsDirty(false);
    setSubmitCount(0);
    initialValuesRef.current = newValues;
  }, []);

  // Set field value
  const setFieldValue = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  // Set field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Set field touched
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  // Submit form
  const handleSubmit = useCallback(async (onSubmit) => {
    setSubmitCount(prev => prev + 1);

    // Mark all fields as touched
    const allTouched = Object.keys(validationSchema).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate
    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
      setIsDirty(false);
    } catch (error) {
      // Handle submission error
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, validationSchema]);

  // Get field props helper
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: (e) => handleChange(name, e.target.value),
    onBlur: () => handleBlur(name),
    error: touched[name] ? errors[name] : null,
  }), [values, errors, touched, handleChange, handleBlur]);

  // Get field meta helper
  const getFieldMeta = useCallback((name) => ({
    value: values[name],
    error: errors[name],
    touched: touched[name],
    isDirty: values[name] !== initialValuesRef.current[name],
  }), [values, errors, touched]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    submitCount,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    resetForm,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    getFieldProps,
    getFieldMeta,
  };
};

export default useFormValidation;
