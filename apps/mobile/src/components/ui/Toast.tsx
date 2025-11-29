import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast Provider Component
 *
 * Wrap your app with this provider to enable toast notifications.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = {
      id,
      duration: 3000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-hide after duration
    if (newToast.duration) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'success', title, message });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'error', title, message, duration: 5000 });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'warning', title, message, duration: 4000 });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'info', title, message });
    },
    [showToast]
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast notification functions
 *
 * @example
 * ```tsx
 * const { showSuccess, showError } = useToast();
 *
 * const handleSubmit = async () => {
 *   try {
 *     await submitForm();
 *     showSuccess('Form submitted successfully!');
 *   } catch (error) {
 *     showError('Failed to submit form', error.message);
 *   }
 * };
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * Toast Container Component (Internal)
 */
function ToastContainer({
  toasts,
  onHide,
}: {
  toasts: Toast[];
  onHide: (id: string) => void;
}) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </View>
  );
}

/**
 * Individual Toast Item Component (Internal)
 */
function ToastItem({ toast, onHide }: { toast: Toast; onHide: (id: string) => void }) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    // Slide in and fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleHide = useCallback(() => {
    // Slide out and fade out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  }, [toast.id, onHide]);

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10B981',
          bgColor: '#10B98115',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: '#EF4444',
          bgColor: '#EF444415',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: '#F59E0B',
          bgColor: '#F59E0B15',
        };
      case 'info':
        return {
          icon: 'information-circle' as const,
          color: colors.primary,
          bgColor: `${colors.primary}15`,
        };
    }
  };

  const config = getToastConfig(toast.type);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.card,
          borderLeftColor: config.color,
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: config.bgColor },
        ]}
      >
        <Ionicons name={config.icon} size={24} color={config.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {toast.title}
        </Text>
        {toast.message && (
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {toast.message}
          </Text>
        )}
        {toast.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              toast.action?.onPress();
              handleHide();
            }}
          >
            <Text style={[styles.actionText, { color: config.color }]}>
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={handleHide}>
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: spacing.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: width - 32,
    maxWidth: 500,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.body2,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.xs,
  },
});
