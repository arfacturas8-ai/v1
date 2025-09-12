"use client";

import * as React from 'react';
import { Shield, Lock, UserX, AlertTriangle, RefreshCw } from 'lucide-react';
import { captureError } from './error-monitor';

// Permission error types
export enum PermissionErrorType {
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  CHANNEL_ACCESS_DENIED = 'channel_access_denied',
  SERVER_ACCESS_DENIED = 'server_access_denied',
  MESSAGE_SEND_DENIED = 'message_send_denied',
  FILE_UPLOAD_DENIED = 'file_upload_denied',
  USER_BANNED = 'user_banned',
  USER_MUTED = 'user_muted',
  RATE_LIMITED = 'rate_limited',
  AUTHENTICATION_REQUIRED = 'authentication_required',
  ACCOUNT_SUSPENDED = 'account_suspended',
  FEATURE_DISABLED = 'feature_disabled',
  UNKNOWN_PERMISSION_ERROR = 'unknown_permission_error'
}

export interface PermissionError {
  type: PermissionErrorType;
  message: string;
  details?: string;
  action?: string;
  canRetry: boolean;
  retryAfter?: number; // For rate limiting
  requiredRole?: string;
  resourceId?: string;
  resourceType?: 'channel' | 'server' | 'user' | 'message';
  timestamp: Date;
}

interface PermissionCheckResult {
  allowed: boolean;
  error?: PermissionError;
}

// Permission context for React components
interface PermissionContextType {
  checkPermission: (action: string, resourceType?: string, resourceId?: string) => Promise<PermissionCheckResult>;
  hasPermission: (action: string, resourceType?: string, resourceId?: string) => boolean;
  permissions: Set<string>;
  roles: string[];
  userId?: string;
  isAuthenticated: boolean;
}

const PermissionContext = React.createContext<PermissionContextType | null>(null);

// Permission error handler
export class PermissionHandler {
  private errorCallbacks: Map<PermissionErrorType, Array<(error: PermissionError) => void>> = new Map();
  private retryCallbacks: Map<string, () => Promise<void>> = new Map();
  private rateLimitState: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.setupDefaultErrorHandlers();
  }

  private setupDefaultErrorHandlers(): void {
    // Default handler for authentication required
    this.onError(PermissionErrorType.AUTHENTICATION_REQUIRED, (error) => {
      console.log('Redirecting to login...');
      // In a real app, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    });

    // Default handler for rate limiting
    this.onError(PermissionErrorType.RATE_LIMITED, (error) => {
      if (error.retryAfter) {
        console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
        setTimeout(() => {
          // Attempt retry if callback exists
          const retryCallback = this.retryCallbacks.get(error.resourceId || 'default');
          if (retryCallback) {
            retryCallback();
          }
        }, error.retryAfter);
      }
    });
  }

  public createError(
    type: PermissionErrorType,
    message: string,
    options: Partial<Omit<PermissionError, 'type' | 'message' | 'timestamp'>> = {}
  ): PermissionError {
    const error: PermissionError = {
      type,
      message,
      timestamp: new Date(),
      canRetry: false,
      ...options,
    };

    // Capture error for monitoring
    captureError(new Error(`Permission Error: ${message}`), {
      type: 'security',
      severity: this.getErrorSeverity(type),
      context: {
        component: 'permission_handler',
        action: 'create_permission_error',
        additional: {
          permissionErrorType: type,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          requiredRole: options.requiredRole,
        },
      },
      tags: ['permission', 'access_denied', type],
    });

    return error;
  }

  private getErrorSeverity(type: PermissionErrorType): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case PermissionErrorType.ACCOUNT_SUSPENDED:
      case PermissionErrorType.USER_BANNED:
        return 'high';
      case PermissionErrorType.AUTHENTICATION_REQUIRED:
      case PermissionErrorType.SERVER_ACCESS_DENIED:
        return 'medium';
      case PermissionErrorType.RATE_LIMITED:
      case PermissionErrorType.USER_MUTED:
        return 'low';
      default:
        return 'medium';
    }
  }

  public handleError(error: PermissionError): void {
    // Execute registered callbacks
    const callbacks = this.errorCallbacks.get(error.type) || [];
    callbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in permission error callback:', callbackError);
      }
    });

    // Update rate limit state if applicable
    if (error.type === PermissionErrorType.RATE_LIMITED && error.retryAfter) {
      const key = error.resourceId || 'global';
      this.rateLimitState.set(key, {
        count: 1,
        resetTime: Date.now() + error.retryAfter,
      });
    }
  }

  public onError(type: PermissionErrorType, callback: (error: PermissionError) => void): () => void {
    if (!this.errorCallbacks.has(type)) {
      this.errorCallbacks.set(type, []);
    }
    
    this.errorCallbacks.get(type)!.push(callback);

    // Return cleanup function
    return () => {
      const callbacks = this.errorCallbacks.get(type);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  public setRetryCallback(resourceId: string, callback: () => Promise<void>): void {
    this.retryCallbacks.set(resourceId, callback);
  }

  public isRateLimited(resourceId: string = 'global'): boolean {
    const state = this.rateLimitState.get(resourceId);
    if (!state) return false;

    if (Date.now() > state.resetTime) {
      this.rateLimitState.delete(resourceId);
      return false;
    }

    return true;
  }

  public getRetryTime(resourceId: string = 'global'): number | null {
    const state = this.rateLimitState.get(resourceId);
    if (!state) return null;

    const remaining = state.resetTime - Date.now();
    return remaining > 0 ? remaining : null;
  }
}

// Global instance
const permissionHandler = new PermissionHandler();

// Permission provider component
export const PermissionProvider: React.FC<{
  children: React.ReactNode;
  userId?: string;
  permissions?: string[];
  roles?: string[];
}> = ({ children, userId, permissions = [], roles = [] }) => {
  const [permissionSet, setPermissionSet] = React.useState(new Set(permissions));
  const [userRoles, setUserRoles] = React.useState(roles);

  React.useEffect(() => {
    setPermissionSet(new Set(permissions));
  }, [permissions]);

  React.useEffect(() => {
    setUserRoles(roles);
  }, [roles]);

  const checkPermission = React.useCallback(async (
    action: string,
    resourceType?: string,
    resourceId?: string
  ): Promise<PermissionCheckResult> => {
    try {
      // Check if user is authenticated
      if (!userId) {
        const error = permissionHandler.createError(
          PermissionErrorType.AUTHENTICATION_REQUIRED,
          'You must be logged in to perform this action',
          { canRetry: true, action }
        );
        return { allowed: false, error };
      }

      // Check rate limiting
      if (permissionHandler.isRateLimited(resourceId)) {
        const retryTime = permissionHandler.getRetryTime(resourceId);
        const error = permissionHandler.createError(
          PermissionErrorType.RATE_LIMITED,
          'You are being rate limited. Please try again later.',
          { 
            canRetry: true, 
            retryAfter: retryTime || 60000, 
            resourceId,
            action 
          }
        );
        return { allowed: false, error };
      }

      // Check basic permissions
      const hasPermission = permissionSet.has(action) || 
                           permissionSet.has('*') || 
                           userRoles.includes('admin');

      if (!hasPermission) {
        const error = permissionHandler.createError(
          PermissionErrorType.INSUFFICIENT_PERMISSIONS,
          `You don't have permission to ${action}`,
          { 
            canRetry: false,
            action,
            resourceType,
            resourceId,
            requiredRole: 'user'
          }
        );
        return { allowed: false, error };
      }

      // Additional checks based on resource type
      if (resourceType === 'channel' && resourceId) {
        // In a real implementation, you'd check channel-specific permissions
        // For now, we'll assume access is allowed if basic permission exists
      }

      return { allowed: true };
    } catch (error) {
      const permissionError = permissionHandler.createError(
        PermissionErrorType.UNKNOWN_PERMISSION_ERROR,
        'An error occurred while checking permissions',
        { canRetry: true, action }
      );
      
      captureError(error as Error, {
        type: 'security',
        severity: 'medium',
        context: {
          component: 'permission_provider',
          action: 'check_permission',
          additional: { action, resourceType, resourceId },
        },
      });

      return { allowed: false, error: permissionError };
    }
  }, [userId, permissionSet, userRoles]);

  const hasPermission = React.useCallback((
    action: string,
    resourceType?: string,
    resourceId?: string
  ): boolean => {
    if (!userId) return false;
    
    return permissionSet.has(action) || 
           permissionSet.has('*') || 
           userRoles.includes('admin');
  }, [userId, permissionSet, userRoles]);

  const contextValue: PermissionContextType = {
    checkPermission,
    hasPermission,
    permissions: permissionSet,
    roles: userRoles,
    userId,
    isAuthenticated: !!userId,
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

// Hook to use permissions
export function usePermissions() {
  const context = React.useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

// Hook for permission-gated actions
export function usePermissionGate(
  action: string,
  resourceType?: string,
  resourceId?: string
) {
  const { checkPermission, hasPermission } = usePermissions();
  const [error, setError] = React.useState<PermissionError | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);

  const execute = React.useCallback(async <T>(
    fn: () => Promise<T>
  ): Promise<T | null> => {
    setIsChecking(true);
    setError(null);

    try {
      const result = await checkPermission(action, resourceType, resourceId);
      
      if (!result.allowed) {
        setError(result.error!);
        permissionHandler.handleError(result.error!);
        return null;
      }

      return await fn();
    } catch (err) {
      const permissionError = permissionHandler.createError(
        PermissionErrorType.UNKNOWN_PERMISSION_ERROR,
        'An error occurred while executing the action',
        { canRetry: true, action }
      );
      
      setError(permissionError);
      permissionHandler.handleError(permissionError);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [checkPermission, action, resourceType, resourceId]);

  const canExecute = hasPermission(action, resourceType, resourceId);

  return {
    execute,
    canExecute,
    error,
    isChecking,
    clearError: () => setError(null),
  };
}

// Permission error components
export const PermissionErrorDisplay: React.FC<{
  error: PermissionError;
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className = '' }) => {
  const getErrorIcon = (type: PermissionErrorType) => {
    switch (type) {
      case PermissionErrorType.AUTHENTICATION_REQUIRED:
        return <UserX className="w-6 h-6 text-orange-400" />;
      case PermissionErrorType.USER_BANNED:
      case PermissionErrorType.ACCOUNT_SUSPENDED:
        return <Shield className="w-6 h-6 text-red-500" />;
      case PermissionErrorType.INSUFFICIENT_PERMISSIONS:
      case PermissionErrorType.CHANNEL_ACCESS_DENIED:
      case PermissionErrorType.SERVER_ACCESS_DENIED:
        return <Lock className="w-6 h-6 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getErrorTitle = (type: PermissionErrorType) => {
    switch (type) {
      case PermissionErrorType.AUTHENTICATION_REQUIRED:
        return 'Login Required';
      case PermissionErrorType.INSUFFICIENT_PERMISSIONS:
        return 'Access Denied';
      case PermissionErrorType.CHANNEL_ACCESS_DENIED:
        return 'Channel Access Denied';
      case PermissionErrorType.SERVER_ACCESS_DENIED:
        return 'Server Access Denied';
      case PermissionErrorType.USER_BANNED:
        return 'Account Banned';
      case PermissionErrorType.USER_MUTED:
        return 'Account Muted';
      case PermissionErrorType.RATE_LIMITED:
        return 'Rate Limited';
      default:
        return 'Permission Error';
    }
  };

  const formatRetryTime = (retryAfter: number) => {
    const seconds = Math.ceil(retryAfter / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className={`flex flex-col items-center p-6 text-center ${className}`}>
      <div className="mb-4">
        {getErrorIcon(error.type)}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-200 mb-2">
        {getErrorTitle(error.type)}
      </h3>
      
      <p className="text-gray-400 mb-4 max-w-md">
        {error.message}
      </p>

      {error.details && (
        <p className="text-sm text-gray-500 mb-4">
          {error.details}
        </p>
      )}

      {error.retryAfter && (
        <p className="text-sm text-yellow-400 mb-4">
          Try again in {formatRetryTime(error.retryAfter)}
        </p>
      )}

      {error.canRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

// Higher-order component for permission gating
export function withPermissionGate<P extends object>(
  Component: React.ComponentType<P>,
  action: string,
  resourceType?: string,
  getResourceId?: (props: P) => string
) {
  return React.forwardRef<any, P>((props, ref) => {
    const resourceId = getResourceId ? getResourceId(props) : undefined;
    const { canExecute, error } = usePermissionGate(action, resourceType, resourceId);

    if (error) {
      return <PermissionErrorDisplay error={error} />;
    }

    if (!canExecute) {
      return (
        <PermissionErrorDisplay
          error={permissionHandler.createError(
            PermissionErrorType.INSUFFICIENT_PERMISSIONS,
            `You don't have permission to access this feature`,
            { canRetry: false, action }
          )}
        />
      );
    }

    return <Component {...props} ref={ref} />;
  });
}

// Export the handler instance
export { permissionHandler };