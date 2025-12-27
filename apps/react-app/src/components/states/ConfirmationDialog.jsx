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
    default: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
    danger: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
    warning: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.9) 100%)'
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
              background: 'rgba(0, 0, 0, 0.5)',
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
                background: '#FFFFFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                border: '1px solid #E8EAED',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
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
                    fontWeight: '700',
                    fontSize: '20px',
                    color: '#1A1A1A'
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
                color: '#666666',
                fontSize: '15px',
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
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background: '#F8F9FA',
                    border: '1px solid #E8EAED',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#666666',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = '#F0F2F5')}
                  onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = '#F8F9FA')}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  style={{
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background: variants[variant],
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    border: variant === 'default' ? '1px solid rgba(88, 166, 255, 0.3)' : 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                    boxShadow: variant === 'default' ? '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => !isLoading && (e.currentTarget.style.opacity = '1')}
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
