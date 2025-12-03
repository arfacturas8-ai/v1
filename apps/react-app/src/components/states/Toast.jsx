import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  position = 'top-right'
}) => {
  React.useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-500/10 border-green-500 text-green-500',
    error: 'bg-red-500/10 border-red-500 text-red-500',
    info: 'bg-[#58a6ff]/10 border-blue-500 text-blue-500'
  };

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  const Icon = icons[type];

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(20, 20, 20, 0.9)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minWidth: '300px',
        maxWidth: '500px'
      }}
      role="alert"
      aria-live="polite"
    >
      <Icon style={{
        height: '20px',
        width: '20px',
        color: type === 'success' ? '#22C55E' : type === 'error' ? '#EF4444' : '#3B82F6',
        flexShrink: 0
      }} aria-hidden="true" />
      <p style={{
        color: '#ffffff',
        fontSize: '14px',
        flex: '1'
      }}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            color: '#666666',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            flexShrink: 0
          }}
          aria-label="Close notification"
        >
          <X style={{
            height: '16px',
            width: '16px'
          }} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};




export default Toast
