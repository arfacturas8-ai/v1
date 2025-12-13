/**
 * CRYB Platform - Utility Components v.1
 * Toast notifications, Loaders, Skeletons for light theme
 */

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ===== TOAST NOTIFICATION =====
export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />
  };

  const colors = {
    success: {
      bg: 'var(--color-success-light)',
      border: 'var(--color-success)',
      text: 'var(--color-success-dark)',
      icon: 'var(--color-success)'
    },
    error: {
      bg: 'var(--color-error-light)',
      border: 'var(--color-error)',
      text: 'var(--color-error-dark)',
      icon: 'var(--color-error)'
    },
    warning: {
      bg: 'var(--color-warning-light)',
      border: 'var(--color-warning)',
      text: 'var(--color-warning-dark)',
      icon: 'var(--color-warning)'
    },
    info: {
      bg: 'var(--color-info-light)',
      border: 'var(--color-info)',
      text: 'var(--color-info-dark)',
      icon: 'var(--color-info)'
    }
  };

  const style = colors[type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideInRight 200ms ease-out'
      }}
    >
      <div style={{ color: style.icon, flexShrink: 0 }}>
        {icons[type]}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 'var(--text-sm)',
          color: style.text,
          fontWeight: 'var(--font-medium)'
        }}
      >
        {message}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--space-1)',
            cursor: 'pointer',
            color: style.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            transition: 'background var(--transition-fast)'
          }}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// ===== TOAST CONTAINER =====
export interface ToastContainerProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  children,
  position = 'top-right'
}) => {
  const positions = {
    'top-right': { top: 'var(--space-4)', right: 'var(--space-4)' },
    'top-left': { top: 'var(--space-4)', left: 'var(--space-4)' },
    'bottom-right': { bottom: 'var(--space-4)', right: 'var(--space-4)' },
    'bottom-left': { bottom: 'var(--space-4)', left: 'var(--space-4)' },
    'top-center': { top: 'var(--space-4)', left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: 'var(--space-4)', left: '50%', transform: 'translateX(-50%)' }
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positions[position],
        zIndex: 'var(--z-notification)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        pointerEvents: 'none'
      }}
    >
      {React.Children.map(children, child => (
        <div style={{ pointerEvents: 'auto' }}>{child}</div>
      ))}
    </div>
  );
};

// ===== SPINNER/LOADER =====
export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'var(--brand-primary)'
}) => {
  const sizes = {
    sm: '20px',
    md: '40px',
    lg: '60px'
  };

  return (
    <div
      style={{
        width: sizes[size],
        height: sizes[size],
        border: `3px solid var(--border-subtle)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ===== LOADING OVERLAY =====
export interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal-backdrop)',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)'
      }}
    >
      <Loader size="lg" />
      {message && (
        <p
          style={{
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-medium)'
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

// ===== SKELETON LOADER =====
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  className = ''
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius
      }}
    />
  );
};

// ===== SKELETON TEXT =====
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

// ===== SKELETON CARD =====
export const SkeletonCard: React.FC = () => {
  return (
    <div className="card">
      <Skeleton height="200px" borderRadius="var(--radius-lg)" />
      <div style={{ padding: 'var(--space-4)' }}>
        <Skeleton height="24px" width="70%" style={{ marginBottom: 'var(--space-2)' }} />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

// ===== EXPORTS =====
export default { Toast, ToastContainer, Loader, LoadingOverlay, Skeleton, SkeletonText, SkeletonCard };
