'use client';

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'glass' | 'gradient' | 'neon';
  icon?: ReactNode;
  closeable?: boolean;
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction =
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'UPDATE_TOAST'; id: string; toast: Partial<Toast> };

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
} | null>(null);

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.id),
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.id ? { ...toast, ...action.toast } : toast
        ),
      };
    default:
      return state;
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2);
    const newToast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    dispatch({ type: 'ADD_TOAST', toast: newToast });

    // Auto remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id });
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  const updateToast = useCallback((id: string, toast: Partial<Toast>) => {
    dispatch({ type: 'UPDATE_TOAST', id, toast });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const { toasts, removeToast } = useToast();

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className='fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] pointer-events-none'>
      
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      
    </div>,
    document.body
  );
}

function ToastComponent({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const variant = toast.variant || 'default';
  const closeable = toast.closeable !== false;

  const getIcon = () => {
    if (toast.icon) return toast.icon;

    switch (toast.type) {
      case 'success':
        return <CheckCircle2 style={{
  height: '20px',
  width: '20px'
}} />;
      case 'error':
        return <AlertCircle style={{
  height: '20px',
  width: '20px'
}} />;
      case 'warning':
        return <AlertTriangle style={{
  height: '20px',
  width: '20px'
}} />;
      case 'info':
        return <Info style={{
  height: '20px',
  width: '20px'
}} />;
      default:
        return null;
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'pointer-events-auto relative flex w-full items-start space-x-4 overflow-hidden rounded-lg border shadow-lg mb-2';

    const typeClasses = {
      default: 'bg-background border-border text-foreground',
      success: 'bg-cryb-success border-cryb-success text-white',
      error: 'bg-destructive border-destructive text-white',
      warning: 'bg-cryb-warning border-cryb-warning text-white',
      info: 'bg-blue-500 border-blue-500 text-white',
    }[toast.type || 'default'];

    const variantClasses = {
      default: '',
      glass: 'backdrop-blur-xl bg-background/80 border-border/50',
      gradient: 'bg-gradient-to-br from-background via-background to-primary/10 border-primary/20',
      neon: 'bg-background/90 backdrop-blur-md border-2 border-accent-cyan/40 shadow-accent-cyan/20',
    }[variant];

    return cn(baseClasses, typeClasses, variantClasses);
  };

  const icon = getIcon();

  return (
    <div
      className={getVariantClasses()}
    >
      {icon && (
        <div className="flex-shrink-0 pt-3 pl-4">
          {icon}
        </div>
      )}

      <div className='flex-1 p-4'>
        {toast.title && (
          <div className={cn('text-sm font-semibold mb-1')}>
            {toast.title}
          </div>
        )}
        {toast.description && (
          <div className={cn('text-sm opacity-90')}>
            {toast.description}
          </div>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={cn(
              'inline-flex h-8 mt-3 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              toast.type === 'default' ? 'border-border hover:bg-accent' : 'border-white/20 text-white'
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {closeable && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 rounded-md p-1 mt-3 mr-3 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 opacity-70',
            toast.type === 'default' ? 'text-foreground/70' : 'text-white/90'
          )}
          aria-label="Close notification"
        >
          <X className='h-4 w-4' />
        </button>
      )}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}