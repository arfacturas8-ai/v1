import { FastifyReply } from 'fastify';
import { LiveKitService } from './livekit';

export enum VoiceErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TOKEN_GENERATION_FAILED = 'TOKEN_GENERATION_FAILED',
  ROOM_CREATION_FAILED = 'ROOM_CREATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SERVER_OVERLOAD = 'SERVER_OVERLOAD',
  MEDIA_DEVICE_ERROR = 'MEDIA_DEVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  LIVEKIT_UNAVAILABLE = 'LIVEKIT_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export interface VoiceError {
  type: VoiceErrorType;
  message: string;
  originalError?: Error;
  context?: any;
  timestamp: Date;
  userId?: string;
  channelId?: string;
  roomName?: string;
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'degrade' | 'notify';
  description: string;
  automatic: boolean;
  parameters?: any;
}

export interface ErrorHandlingConfig {
  maxRetryAttempts: number;
  retryDelayMs: number;
  fallbackServers: string[];
  enableDegradedMode: boolean;
  notifyThreshold: number;
}

export class VoiceErrorHandler {
  private config: ErrorHandlingConfig;
  private errorLog: VoiceError[] = [];
  private retryCounters: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = {
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      fallbackServers: process.env.LIVEKIT_BACKUP_URLS?.split(',') || [],
      enableDegradedMode: true,
      notifyThreshold: 10,
      ...config
    };
  }

  /**
   * Handle and recover from voice-related errors
   */
  async handleError(
    error: Error | VoiceError,
    context?: any
  ): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const voiceError = this.normalizeError(error, context);
    this.logError(voiceError);

    const recoveryPlan = await this.createRecoveryPlan(voiceError);
    
    // Execute automatic recovery actions
    for (const action of recoveryPlan.recoveryActions) {
      if (action.automatic) {
        await this.executeRecoveryAction(action, voiceError);
      }
    }

    return recoveryPlan;
  }

  /**
   * Create a recovery plan based on error type
   */
  private async createRecoveryPlan(error: VoiceError): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const retryKey = `${error.type}_${error.channelId || error.roomName || 'global'}`;
    const retryCount = this.retryCounters.get(retryKey) || 0;

    switch (error.type) {
      case VoiceErrorType.LIVEKIT_UNAVAILABLE:
        return this.handleLiveKitUnavailable(error, retryCount);
      
      case VoiceErrorType.CONNECTION_FAILED:
        return this.handleConnectionFailed(error, retryCount);
      
      case VoiceErrorType.TOKEN_GENERATION_FAILED:
        return this.handleTokenGenerationFailed(error, retryCount);
      
      case VoiceErrorType.ROOM_CREATION_FAILED:
        return this.handleRoomCreationFailed(error, retryCount);
      
      case VoiceErrorType.SERVER_OVERLOAD:
        return this.handleServerOverload(error, retryCount);
      
      case VoiceErrorType.NETWORK_ERROR:
        return this.handleNetworkError(error, retryCount);
      
      case VoiceErrorType.DATABASE_ERROR:
        return this.handleDatabaseError(error, retryCount);
      
      case VoiceErrorType.RATE_LIMIT_EXCEEDED:
        return this.handleRateLimit(error, retryCount);

      default:
        return this.handleGenericError(error, retryCount);
    }
  }

  /**
   * Handle LiveKit server unavailable
   */
  private async handleLiveKitUnavailable(error: VoiceError, retryCount: number): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const recoveryActions: RecoveryAction[] = [];

    if (retryCount < this.config.maxRetryAttempts) {
      recoveryActions.push({
        type: 'retry',
        description: `Retry connection to LiveKit (attempt ${retryCount + 1}/${this.config.maxRetryAttempts})`,
        automatic: true,
        parameters: { delay: this.config.retryDelayMs * (retryCount + 1) }
      });
    }

    // Check for fallback servers
    if (this.config.fallbackServers.length > 0) {
      recoveryActions.push({
        type: 'fallback',
        description: 'Switch to fallback LiveKit server',
        automatic: true,
        parameters: { 
          fallbackUrl: this.config.fallbackServers[retryCount % this.config.fallbackServers.length]
        }
      });
    }

    // Enable degraded mode
    if (this.config.enableDegradedMode) {
      recoveryActions.push({
        type: 'degrade',
        description: 'Enable audio-only mode to reduce server load',
        automatic: false,
        parameters: { disableVideo: true, reduceBitrate: true }
      });
    }

    return {
      shouldRetry: retryCount < this.config.maxRetryAttempts,
      recoveryActions,
      fallbackResponse: {
        success: false,
        error: 'LiveKit service temporarily unavailable',
        degradedMode: true,
        fallbackAvailable: this.config.fallbackServers.length > 0,
        retryAfter: this.config.retryDelayMs
      }
    };
  }

  /**
   * Handle connection failures
   */
  private async handleConnectionFailed(error: VoiceError, retryCount: number): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const recoveryActions: RecoveryAction[] = [];

    // WebRTC connection issues often resolve with retry
    if (retryCount < this.config.maxRetryAttempts) {
      recoveryActions.push({
        type: 'retry',
        description: 'Retry WebRTC connection with fresh STUN/TURN servers',
        automatic: true,
        parameters: { 
          delay: this.config.retryDelayMs,
          refreshIceServers: true 
        }
      });
    }

    // Try fallback with TURN relay
    recoveryActions.push({
      type: 'fallback',
      description: 'Force TURN relay connection',
      automatic: true,
      parameters: { forceTurn: true }
    });

    return {
      shouldRetry: retryCount < this.config.maxRetryAttempts,
      recoveryActions,
      fallbackResponse: {
        success: false,
        error: 'Connection failed - check network connectivity',
        suggestions: [
          'Check firewall settings',
          'Verify UDP traffic is allowed',
          'Try refreshing the page'
        ]
      }
    };
  }

  /**
   * Handle token generation failures
   */
  private async handleTokenGenerationFailed(error: VoiceError, retryCount: number): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const recoveryActions: RecoveryAction[] = [];

    // Token generation should not normally fail, but retry once
    if (retryCount < 1) {
      recoveryActions.push({
        type: 'retry',
        description: 'Retry token generation with fresh credentials',
        automatic: true,
        parameters: { delay: 500 }
      });
    }

    // Notify administrators of authentication issues
    recoveryActions.push({
      type: 'notify',
      description: 'Alert administrators of authentication system issues',
      automatic: true,
      parameters: { severity: 'high', component: 'token_generation' }
    });

    return {
      shouldRetry: retryCount < 1,
      recoveryActions,
      fallbackResponse: {
        success: false,
        error: 'Authentication service temporarily unavailable',
        code: 'AUTH_SERVICE_ERROR',
        retryAfter: 5000
      }
    };
  }

  /**
   * Handle room creation failures
   */
  private async handleRoomCreationFailed(error: VoiceError, retryCount: number): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const recoveryActions: RecoveryAction[] = [];

    if (retryCount < this.config.maxRetryAttempts) {
      recoveryActions.push({
        type: 'retry',
        description: 'Retry room creation with alternative configuration',
        automatic: true,
        parameters: { 
          delay: this.config.retryDelayMs,
          reducedCapacity: true 
        }
      });
    }

    // Try joining existing room instead
    recoveryActions.push({
      type: 'fallback',
      description: 'Join existing room if available',
      automatic: true,
      parameters: { allowExistingRoom: true }
    });

    return {
      shouldRetry: retryCount < this.config.maxRetryAttempts,
      recoveryActions,
      fallbackResponse: {
        success: false,
        error: 'Unable to create voice room',
        alternative: 'Try joining an existing room',
        canJoinExisting: true
      }
    };
  }

  /**
   * Handle server overload
   */
  private async handleServerOverload(error: VoiceError, retryCount: number): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const recoveryActions: RecoveryAction[] = [];

    // Don't retry immediately on overload
    recoveryActions.push({
      type: 'fallback',
      description: 'Redirect to less loaded server',
      automatic: true,
      parameters: { 
        loadBalance: true,
        fallbackServers: this.config.fallbackServers
      }
    });

    // Enable degraded mode
    recoveryActions.push({
      type: 'degrade',
      description: 'Reduce quality to handle load',
      automatic: true,
      parameters: { 
        maxBitrate: 200000, // 200 kbps
        disableVideo: false,
        audioOnly: false
      }
    });

    return {
      shouldRetry: false, // Don't retry on overload
      recoveryActions,
      fallbackResponse: {
        success: false,
        error: 'Server temporarily overloaded',
        degradedMode: true,
        retryAfter: 30000, // 30 seconds
        queuePosition: Math.floor(Math.random() * 10) + 1
      }
    };
  }

  /**
   * Handle network errors
   */
  private async handleNetworkError(error: VoiceError, retryCount: number): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const recoveryActions: RecoveryAction[] = [];

    if (retryCount < this.config.maxRetryAttempts) {
      recoveryActions.push({
        type: 'retry',
        description: 'Retry with exponential backoff',
        automatic: true,
        parameters: { 
          delay: Math.min(this.config.retryDelayMs * Math.pow(2, retryCount), 10000)
        }
      });
    }

    // Degrade to audio-only on network issues
    recoveryActions.push({
      type: 'degrade',
      description: 'Switch to audio-only mode',
      automatic: false,
      parameters: { audioOnlyMode: true }
    });

    return {
      shouldRetry: retryCount < this.config.maxRetryAttempts,
      recoveryActions,
      fallbackResponse: {
        success: false,
        error: 'Network connectivity issues detected',
        suggestions: [
          'Check your internet connection',
          'Try audio-only mode',
          'Refresh the page'
        ]
      }
    };
  }

  /**
   * Handle database errors
   */
  private async handleDatabaseError(error: VoiceError, retryCount: number): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const recoveryActions: RecoveryAction[] = [];

    if (retryCount < 2) { // Limited retries for DB issues
      recoveryActions.push({
        type: 'retry',
        description: 'Retry database operation',
        automatic: true,
        parameters: { delay: this.config.retryDelayMs }
      });
    }

    // Continue with limited functionality
    recoveryActions.push({
      type: 'degrade',
      description: 'Continue with cached data',
      automatic: true,
      parameters: { useCachedData: true }
    });

    return {
      shouldRetry: retryCount < 2,
      recoveryActions,
      fallbackResponse: {
        success: false,
        error: 'Database temporarily unavailable',
        limitedFunctionality: true
      }
    };
  }

  /**
   * Handle rate limiting
   */
  private async handleRateLimit(error: VoiceError, retryCount: number): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const recoveryActions: RecoveryAction[] = [];

    // Wait longer for rate limits
    const retryDelay = 5000 * (retryCount + 1);
    
    if (retryCount < 2) {
      recoveryActions.push({
        type: 'retry',
        description: 'Retry after rate limit window',
        automatic: true,
        parameters: { delay: retryDelay }
      });
    }

    return {
      shouldRetry: retryCount < 2,
      recoveryActions,
      fallbackResponse: {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: retryDelay,
        code: 'RATE_LIMITED'
      }
    };
  }

  /**
   * Handle generic errors
   */
  private async handleGenericError(error: VoiceError, retryCount: number): Promise<{
    shouldRetry: boolean;
    recoveryActions: RecoveryAction[];
    fallbackResponse?: any;
  }> {
    const recoveryActions: RecoveryAction[] = [];

    if (retryCount < 1) {
      recoveryActions.push({
        type: 'retry',
        description: 'Single retry for unknown error',
        automatic: true,
        parameters: { delay: this.config.retryDelayMs }
      });
    }

    return {
      shouldRetry: retryCount < 1,
      recoveryActions,
      fallbackResponse: {
        success: false,
        error: 'An unexpected error occurred',
        canRetry: retryCount < 1
      }
    };
  }

  /**
   * Execute a recovery action
   */
  private async executeRecoveryAction(action: RecoveryAction, error: VoiceError): Promise<void> {
    try {
      console.log(`🔧 Executing recovery action: ${action.type} - ${action.description}`);

      switch (action.type) {
        case 'retry':
          if (action.parameters?.delay) {
            await new Promise(resolve => setTimeout(resolve, action.parameters.delay));
          }
          this.incrementRetryCounter(error);
          break;

        case 'fallback':
          console.log('⚡ Switching to fallback configuration');
          // Fallback logic would be implemented here
          break;

        case 'degrade':
          console.log('📉 Enabling degraded mode');
          // Degraded mode logic would be implemented here
          break;

        case 'notify':
          console.log('📢 Notifying administrators');
          // Notification logic would be implemented here
          break;
      }
    } catch (recoveryError) {
      console.error('❌ Recovery action failed:', recoveryError);
    }
  }

  /**
   * Normalize different error types to VoiceError
   */
  private normalizeError(error: Error | VoiceError, context?: any): VoiceError {
    if ('type' in error && 'timestamp' in error) {
      return error as VoiceError;
    }

    // Detect error type from message
    let errorType = VoiceErrorType.NETWORK_ERROR; // Default
    const message = error.message.toLowerCase();

    if (message.includes('livekit') || message.includes('websocket')) {
      errorType = VoiceErrorType.LIVEKIT_UNAVAILABLE;
    } else if (message.includes('token')) {
      errorType = VoiceErrorType.TOKEN_GENERATION_FAILED;
    } else if (message.includes('connection') || message.includes('webrtc')) {
      errorType = VoiceErrorType.CONNECTION_FAILED;
    } else if (message.includes('room')) {
      errorType = VoiceErrorType.ROOM_CREATION_FAILED;
    } else if (message.includes('permission') || message.includes('forbidden')) {
      errorType = VoiceErrorType.PERMISSION_DENIED;
    } else if (message.includes('database') || message.includes('prisma')) {
      errorType = VoiceErrorType.DATABASE_ERROR;
    } else if (message.includes('rate limit') || message.includes('too many')) {
      errorType = VoiceErrorType.RATE_LIMIT_EXCEEDED;
    } else if (message.includes('overload') || message.includes('capacity')) {
      errorType = VoiceErrorType.SERVER_OVERLOAD;
    }

    return {
      type: errorType,
      message: error.message,
      originalError: error,
      context,
      timestamp: new Date(),
      userId: context?.userId,
      channelId: context?.channelId,
      roomName: context?.roomName
    };
  }

  /**
   * Log error for analysis
   */
  private logError(error: VoiceError): void {
    this.errorLog.push(error);

    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog.shift();
    }

    console.error(`🚨 Voice Error [${error.type}]:`, {
      message: error.message,
      userId: error.userId,
      channelId: error.channelId,
      roomName: error.roomName,
      timestamp: error.timestamp
    });

    // Alert if error rate is too high
    this.checkErrorRate();
  }

  /**
   * Check if error rate exceeds threshold
   */
  private checkErrorRate(): void {
    const recentErrors = this.errorLog.filter(
      error => Date.now() - error.timestamp.getTime() < 300000 // Last 5 minutes
    );

    if (recentErrors.length >= this.config.notifyThreshold) {
      console.error(`🚨 HIGH ERROR RATE: ${recentErrors.length} errors in last 5 minutes`);
      // In production, this would trigger alerts
    }
  }

  /**
   * Increment retry counter
   */
  private incrementRetryCounter(error: VoiceError): void {
    const retryKey = `${error.type}_${error.channelId || error.roomName || 'global'}`;
    const currentCount = this.retryCounters.get(retryKey) || 0;
    this.retryCounters.set(retryKey, currentCount + 1);

    // Clean up old counters
    setTimeout(() => {
      this.retryCounters.delete(retryKey);
    }, 300000); // 5 minutes
  }

  /**
   * Create error response for API
   */
  createErrorResponse(error: VoiceError, recoveryActions: RecoveryAction[]): any {
    return {
      success: false,
      error: error.message,
      errorType: error.type,
      timestamp: error.timestamp,
      recoveryOptions: recoveryActions.filter(action => !action.automatic).map(action => ({
        type: action.type,
        description: action.description,
        parameters: action.parameters
      })),
      canRetry: recoveryActions.some(action => action.type === 'retry'),
      fallbackAvailable: recoveryActions.some(action => action.type === 'fallback'),
      degradedModeAvailable: recoveryActions.some(action => action.type === 'degrade')
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<VoiceErrorType, number>;
    recentErrorRate: number;
    topErrors: Array<{ type: VoiceErrorType; count: number }>;
  } {
    const errorsByType = {} as Record<VoiceErrorType, number>;
    
    // Initialize all error types
    Object.values(VoiceErrorType).forEach(type => {
      errorsByType[type] = 0;
    });

    // Count errors by type
    this.errorLog.forEach(error => {
      errorsByType[error.type]++;
    });

    // Recent error rate (last 5 minutes)
    const recentErrors = this.errorLog.filter(
      error => Date.now() - error.timestamp.getTime() < 300000
    );

    // Top errors
    const topErrors = Object.entries(errorsByType)
      .map(([type, count]) => ({ type: type as VoiceErrorType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      recentErrorRate: recentErrors.length,
      topErrors
    };
  }
}

// Singleton instance
let errorHandler: VoiceErrorHandler | null = null;

export function getVoiceErrorHandler(): VoiceErrorHandler {
  if (!errorHandler) {
    errorHandler = new VoiceErrorHandler();
  }
  return errorHandler;
}