/**
 * FormField Molecule Component
 * Complete form field with label, input, and validation
 */

import React from 'react';
import { Input } from '../atoms/Input';
import { Text } from '../atoms/Text';
import { spacing } from '../tokens';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  maxLength,
  showCharCount = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className,
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[1],
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
    >
      <Text
        as="label"
        variant="label"
        size="sm"
        weight="medium"
        style={{ marginBottom: spacing[1] }}
      >
        {label}
        {required && <span style={{ color: 'var(--error)' }}> *</span>}
      </Text>

      <Input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        error={error}
        helperText={error || helperText}
        disabled={disabled}
        maxLength={maxLength}
        showCharCount={showCharCount}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        fullWidth={fullWidth}
      />
    </div>
  );
};

export default FormField;
