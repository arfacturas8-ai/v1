import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false
}) => {
  const variants = {
    default: 'bg-[#58a6ff] hover:bg-[#58a6ff]',
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600'
  };

  return (
    <div>
      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 50
            }}
            onClick={onClose}
            aria-hidden="true"
          />
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 51,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div
              style={{
                background: 'rgba(20, 20, 20, 0.6)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
              role="alertdialog"
              aria-labelledby="dialog-title"
              aria-describedby="dialog-description"
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {variant === 'danger' && (
                    <AlertTriangle style={{
                      height: '24px',
                      width: '24px',
                      color: '#EF4444'
                    }} aria-hidden="true" />
                  )}
                  <h3 id="dialog-title" style={{
                    fontWeight: '600',
                    fontSize: '20px',
                    color: '#ffffff'
                  }}>
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    color: '#666666',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  aria-label="Close dialog"
                >
                  <X style={{
                    height: '20px',
                    width: '20px'
                  }} aria-hidden="true" />
                </button>
              </div>
              <p id="dialog-description" style={{
                color: '#A0A0A0',
                fontSize: '14px',
                lineHeight: '1.5',
                marginBottom: '24px'
              }}>
                {message}
              </p>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#666666',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={variants[variant]}
                  style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    background: variant === 'danger' ? 'linear-gradient(to right, #DC2626, #B91C1C)' : 'linear-gradient(to right, #58a6ff, #a371f7)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  {isLoading && (
                    <div style={{
                      borderRadius: '50%',
                      height: '16px',
                      width: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: '#ffffff',
                      animation: 'spin 1s linear infinite'
                    }} aria-hidden="true"></div>
                  )}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};




export default ConfirmationDialog
