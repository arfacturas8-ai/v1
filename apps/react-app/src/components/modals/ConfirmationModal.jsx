/**
 * ConfirmationModal - Professional confirmation dialogs
 * Replaces window.confirm/prompt/alert with proper iOS-style modals
 */

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // 'default' | 'danger' | 'warning'
  requiresInput = false,
  inputPlaceholder = '',
  inputValidation = null,
  children,
}) {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(!requiresInput);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (value) => {
    setInputValue(value);
    if (inputValidation) {
      setIsValid(inputValidation(value));
    } else {
      setIsValid(value.length > 0);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (requiresInput) {
        await onConfirm(inputValue);
      } else {
        await onConfirm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const variantStyles = {
    default: {
      buttonBg: '#58a6ff',
      buttonHoverBg: '#4a93e6',
    },
    danger: {
      buttonBg: '#EF4444',
      buttonHoverBg: '#DC2626',
    },
    warning: {
      buttonBg: '#F59E0B',
      buttonHoverBg: '#D97706',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '440px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'modalSlideIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {variant === 'danger' && (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={20} color="#EF4444" />
              </div>
            )}
            <h3
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1A1A1A',
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              opacity: isSubmitting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.background = '#F8F9FA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={20} color="#666666" />
          </button>
        </div>

        {/* Message */}
        <p
          style={{
            color: '#666666',
            fontSize: '15px',
            lineHeight: '1.5',
            marginBottom: requiresInput || children ? '20px' : '24px',
          }}
        >
          {message}
        </p>

        {/* Custom Content */}
        {children && <div style={{ marginBottom: '20px' }}>{children}</div>}

        {/* Input Field */}
        {requiresInput && (
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: isValid || !inputValue ? '2px solid #E8EAED' : '2px solid #EF4444',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                if (!isValid && inputValue) return;
                e.target.style.borderColor = '#58a6ff';
              }}
              onBlur={(e) => {
                if (!isValid && inputValue) {
                  e.target.style.borderColor = '#EF4444';
                } else {
                  e.target.style.borderColor = '#E8EAED';
                }
              }}
            />
            {!isValid && inputValue && (
              <p
                style={{
                  color: '#EF4444',
                  fontSize: '13px',
                  marginTop: '8px',
                }}
              >
                Please enter the correct confirmation text
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: '#F8F9FA',
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              opacity: isSubmitting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.background = '#E8EAED';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.background = '#F8F9FA';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (requiresInput && !isValid)}
            style={{
              flex: 1,
              padding: '12px 24px',
              background:
                isSubmitting || (requiresInput && !isValid) ? '#CCCCCC' : styles.buttonBg,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isSubmitting || (requiresInput && !isValid) ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && !(requiresInput && !isValid)) {
                e.currentTarget.style.background = styles.buttonHoverBg;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && !(requiresInput && !isValid)) {
                e.currentTarget.style.background = styles.buttonBg;
              }
            }}
          >
            {isSubmitting ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
