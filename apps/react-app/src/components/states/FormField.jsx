import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

export const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  success,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  className = ''
}) => {
  const [touched, setTouched] = React.useState(false);
  const { isMobile } = useResponsive();
  const showError = touched && error;
  const showSuccess = touched && success && !error;

  return (
    <div className={'w-full ' + className}>
      {label && (
        <label
          htmlFor={name}
          className={isMobile ? 'text-sm' : 'text-sm md:text-base'}
          style={{
            display: 'block',
            fontWeight: '500',
            color: '#A0A0A0',
            marginBottom: '8px'
          }}
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <div style={{
  position: 'relative'
}}>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? name + '-error' : helperText ? name + '-helper' : undefined}
          className={'w-full bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ' +
            (isMobile ? 'h-12 px-3 text-base ' : 'h-10 px-4 py-2 text-sm md:text-base ') +
            (showError ? 'border-red-500 focus:ring-red-500' : showSuccess ? 'border-green-500 focus:ring-green-500' : 'border-gray-700 focus:ring-blue-500')}
        />
        {showSuccess && (
          <Check style={{
  position: 'absolute',
  height: '20px',
  width: '20px'
}} aria-hidden="true" />
        )}
        {showError && (
          <AlertCircle style={{
  position: 'absolute',
  height: '20px',
  width: '20px'
}} aria-hidden="true" />
        )}
      </div>
      {showError && (
        <p id={name + '-error'} className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      {!showError && helperText && (
        <p id={name + '-helper'} style={{
  color: '#A0A0A0'
}}>
          {helperText}
        </p>
      )}
    </div>
  );
};




export default FormField
