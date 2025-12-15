/**
 * CRYB Design System - Notification Components
 * Animated notification system with toast, alerts, and push notifications
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { 
  toastVariants, 
  notificationSlide, 
  fadeVariants,
  slideVariants,
  staggerContainer,
  staggerItem,
} from '../../lib/animations';
import { useAnnouncement } from '../../lib/accessibility';
import { Button } from './button';

// ===== NOTIFICATION TYPES =====
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  timestamp?: Date;
}

// ===== NOTIFICATION VARIANTS =====
const notificationVariants = cva(
  [
    'relative p-4 rounded-lg shadow-lg border backdrop-blur-sm',
    'pointer-events-auto max-w-md w-full',
    'flex items-start gap-3',
  ],
  {
    variants: {
      type: {
        default: 'bg-background/95 border-border text-foreground',
        success: 'bg-green-50/95 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100',
        error: 'bg-red-50/95 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100',
        warning: 'bg-yellow-50/95 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100',
        info: 'bg-blue-50/95 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100',
      },
      size: {
        sm: 'text-sm',
        default: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      type: 'default',
      size: 'default',
    },
  }
);

// ===== TOAST PROVIDER CONTEXT =====
interface ToastContextValue {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ===== NOTIFICATION ICONS =====
const NotificationIcon: React.FC<{ type: NotificationType; customIcon?: React.ReactNode }> = ({ 
  type, 
  customIcon 
}) => {
  if (customIcon) return <>{customIcon}</>;

  const iconClasses = 'w-5 h-5 shrink-0 mt-0.5';

  switch (type) {
    case 'success':
      return (
        <svg
          className={cn(iconClasses, 'text-green-600 dark:text-green-400')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z">"
          />
        </svg>
      );
    case 'error':
      return (
        <svg
          className={cn(iconClasses, 'text-red-600 dark:text-red-400')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg
          className={cn(iconClasses, 'text-yellow-600 dark:text-yellow-400')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case 'info':
      return (
        <svg
          className={cn(iconClasses, 'text-blue-600 dark:text-blue-400')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    default:
      return (
        <div
          className={cn(iconClasses, 'bg-primary rounded-full')}
        />
      );
  }
};

// ===== TOAST COMPONENT =====
export interface ToastProps extends VariantProps<typeof notificationVariants> {
  notification: NotificationData;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const Toast: React.FC<ToastProps> = ({ 
  notification, 
  onClose, 
  type,
  size,
  position = 'top-right' 
}) => {
  const announce = useAnnouncement();
  const [isVisible, setIsVisible] = React.useState(true);
  const [isPaused, setIsPaused] = React.useState(false);
  const [remainingTime, setRemainingTime] = React.useState(notification.duration || 5000);

  // Auto-dismiss timer
  React.useEffect(() => {
    if (notification.persistent || isPaused) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 100) {
          setIsVisible(false);
          setTimeout(() => onClose(notification.id), 300);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [notification.id, notification.persistent, isPaused, onClose]);

  // Announce to screen readers
  React.useEffect(() => {
    const priority = notification.type === 'error' ? 'assertive' : 'polite';
    announce(`${notification.type}: ${notification.title}`, priority);
  }, [notification, announce]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  const progressPercentage = notification.persistent ? 0 : 
    ((notification.duration || 5000) - remainingTime) / (notification.duration || 5000) * 100;

  return (
    
      {isVisible && (
        <div
          layout
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(notificationVariants({ type: type || notification.type, size }))}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="alert"
          aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
        >
          {/* Progress bar */}
          {!notification.persistent && (
            <div
              style={{
  position: 'absolute',
  height: '4px'
}` }}}
            />
          )}

          {/* Icon */}
          <NotificationIcon type={notification.type} customIcon={notification.icon} />

          {/* Content */}
          <div style={{
  flex: '1'
}}>
            <div
            >
              <h4 style={{
  fontWeight: '500'
}}>{notification.title}</h4>
              {notification.message && (
                <p className="mt-1 text-sm opacity-90 leading-relaxed">
                  {notification.message}
                </p>
              )}
              
              {/* Action button */}
              {notification.action && (
                <div
                  className="mt-3"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={notification.action.onClick}
                    style={{
  height: '32px',
  paddingLeft: '12px',
  paddingRight: '12px'
}}
                  >
                    {notification.action.label}
                  </Button>
                </div>
              )}

              {/* Timestamp */}
              {notification.timestamp && (
                <p
                  className="mt-2 text-xs opacity-60"
                >
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
  padding: '4px'
}}
            aria-label="Close notification"
          >
            <svg style={{
  width: '16px',
  height: '16px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    
  );
};

// ===== TOAST CONTAINER =====
export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications?: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ 
  position = 'top-right',
  maxNotifications = 5 
}) => {
  const { notifications, removeNotification } = useToast();

  const positionClasses = {
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  };

  const visibleNotifications = notifications.slice(0, maxNotifications);

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        positionClasses[position]
      )}
    >
      <div
        initial="hidden"
        animate="visible"
        style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}}
      >
        
          {visibleNotifications.map((notification) => (
            <div
              key={notification.id}
              layout
            >
              <Toast
                notification={notification}
                onClose={removeNotification}
                position={position}
              />
            </div>
          ))}
        
      </div>

      {/* Overflow indicator */}
      {notifications.length > maxNotifications && (
        <div
          className="pointer-events-auto"
        >
          <div style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
            +{notifications.length - maxNotifications} more notifications
          </div>
        </div>
      )}
    </div>
  );
};

// ===== TOAST PROVIDER =====
export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastContainerProps['position'];
  maxNotifications?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position,
  maxNotifications 
}) => {
  const [notifications, setNotifications] = React.useState<NotificationData[]>([]);

  const addNotification = React.useCallback((notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newNotification: NotificationData = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const removeNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  const value: ToastContextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position={position} maxNotifications={maxNotifications} />
    </ToastContext.Provider>
  );
};

// ===== ALERT COMPONENT =====
export interface AlertProps extends VariantProps<typeof notificationVariants> {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  message,
  icon,
  action,
  onClose,
  type = 'default',
  size = 'default',
  className,
}) => {
  return (
    <div
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(notificationVariants({ type, size }), className)}
      role="alert"
    >
      <NotificationIcon type={type || 'default'} customIcon={icon} />
      
      <div style={{
  flex: '1'
}}>
        <h4 style={{
  fontWeight: '500'
}}>{title}</h4>
        {message && (
          <p className="mt-1 text-sm opacity-90 leading-relaxed">{message}</p>
        )}
        
        {action && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={action.onClick}
              style={{
  height: '32px',
  paddingLeft: '12px',
  paddingRight: '12px'
}}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
  padding: '4px'
}}
          aria-label="Close alert"
        >
          <svg style={{
  width: '16px',
  height: '16px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ===== CONVENIENCE HOOKS =====
export const useNotification = () => {
  const { addNotification } = useToast();

  return {
    success: (title: string, message?: string, options?: Partial<NotificationData>) =>
      addNotification({ ...options, type: 'success', title, message }),
    error: (title: string, message?: string, options?: Partial<NotificationData>) =>
      addNotification({ ...options, type: 'error', title, message }),
    warning: (title: string, message?: string, options?: Partial<NotificationData>) =>
      addNotification({ ...options, type: 'warning', title, message }),
    info: (title: string, message?: string, options?: Partial<NotificationData>) =>
      addNotification({ ...options, type: 'info', title, message }),
    default: (title: string, message?: string, options?: Partial<NotificationData>) =>
      addNotification({ ...options, type: 'default', title, message }),
  };
};

// ===== EXPORTS =====


const styles = {
  card: {
    background: 'rgba(22, 27, 34, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    padding: '16px'
  },
  button: {
    background: 'linear-gradient(to right, #58a6ff, #a371f7)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    padding: '12px 24px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  container: {
    background: 'var(--bg-primary)',
    padding: '16px'
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 16px 0'
  },
  text: {
    color: '#A0A0A0',
    fontSize: '14px',
    margin: '0'
  },
  textTertiary: {
    color: '#666666',
    fontSize: '14px'
  }
}

export default {
  ToastProvider,
  ToastContainer,
  Toast,
  Alert,
  useToast,
  useNotification,
};