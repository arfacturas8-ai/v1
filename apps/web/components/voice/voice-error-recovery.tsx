"use client";

import * as React from "react";
import { 
  AlertTriangle, 
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Router,
  Server,
  Phone,
  PhoneOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceErrorRecoveryProps {
  onRetry?: () => void;
  onSettings?: () => void;
  onDisconnect?: () => void;
}

interface RecoveryStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  action?: () => Promise<void>;
}

export function VoiceErrorRecovery({
  onRetry,
  onSettings,
  onDisconnect
}: VoiceErrorRecoveryProps) {
  const {
    isConnected,
    isConnecting,
    isRecovering,
    error,
    lastError,
    recoveryAttempts,
    networkQuality,
    clearErrors,
    forceReconnect,
    refreshDevices,
    getHealthStatus
  } = useVoiceStore();

  const [isAutoRecovering, setIsAutoRecovering] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [recoveryProgress, setRecoveryProgress] = React.useState(0);
  const [showDetails, setShowDetails] = React.useState(false);
  
  const healthStatus = getHealthStatus();

  // Define recovery steps based on error type
  const recoverySteps: RecoveryStep[] = React.useMemo(() => {
    if (!error && !lastError) return [];

    const steps: RecoveryStep[] = [
      {
        id: 'diagnostics',
        title: 'Running Diagnostics',
        description: 'Checking connection and device status',
        status: 'pending',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await refreshDevices();
        }
      },
      {
        id: 'reconnect',
        title: 'Reconnecting',
        description: 'Attempting to reconnect to voice server',
        status: 'pending',
        action: async () => {
          await forceReconnect();
        }
      }
    ];

    const currentError = error || lastError;
    if (!currentError) return steps;

    // Add specific steps based on error type
    switch (currentError.error) {
      case 'MICROPHONE_PERMISSION_DENIED':
      case 'CAMERA_PERMISSION_DENIED':
        steps.unshift({
          id: 'permissions',
          title: 'Requesting Permissions',
          description: 'Please grant microphone and camera access',
          status: 'pending',
          action: async () => {
            try {
              await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: currentError.error === 'CAMERA_PERMISSION_DENIED' 
              });
            } catch (e) {
              throw new Error('Permission denied by user');
            }
          }
        });
        break;
      
      case 'NETWORK_ERROR':
      case 'CONNECTION_FAILED':
        steps.splice(1, 0, {
          id: 'network',
          title: 'Checking Network',
          description: 'Testing network connectivity',
          status: 'pending',
          action: async () => {
            // Test network connectivity
            await fetch('/api/health', { method: 'HEAD' });
          }
        });
        break;
        
      case 'MICROPHONE_NOT_FOUND':
      case 'CAMERA_NOT_FOUND':
        steps.unshift({
          id: 'devices',
          title: 'Detecting Devices',
          description: 'Searching for available audio/video devices',
          status: 'pending',
          action: async () => {
            await refreshDevices();
          }
        });
        break;
    }

    return steps;
  }, [error, lastError, refreshDevices, forceReconnect]);

  // Auto-recovery logic
  const startAutoRecovery = React.useCallback(async () => {
    if (isAutoRecovering || recoverySteps.length === 0) return;
    
    setIsAutoRecovering(true);
    setCurrentStep(0);
    setRecoveryProgress(0);
    
    for (let i = 0; i < recoverySteps.length; i++) {
      const step = recoverySteps[i];
      setCurrentStep(i);
      
      try {
        step.status = 'running';
        await step.action?.();
        step.status = 'completed';
        setRecoveryProgress(((i + 1) / recoverySteps.length) * 100);
        
        // Small delay between steps for UX
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (stepError) {
        console.error(`Recovery step ${step.id} failed:`, stepError);
        step.status = 'failed';
        break;
      }
    }
    
    setIsAutoRecovering(false);
  }, [isAutoRecovering, recoverySteps]);

  // Trigger auto-recovery when error occurs
  React.useEffect(() => {
    if (error && !isAutoRecovering && healthStatus === 'critical') {
      const timer = setTimeout(() => {
        startAutoRecovery();
      }, 2000); // Wait 2 seconds before starting auto-recovery
      
      return () => clearTimeout(timer);
    }
  }, [error, isAutoRecovering, healthStatus, startAutoRecovery]);

  const getErrorIcon = () => {
    const currentError = error || lastError;
    if (!currentError) return <CheckCircle className="w-5 h-5 text-green-500" />;
    
    switch (currentError.error) {
      case 'NETWORK_ERROR':
      case 'CONNECTION_FAILED':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'MICROPHONE_PERMISSION_DENIED':
      case 'MICROPHONE_NOT_FOUND':
        return <MicOff className="w-5 h-5 text-red-500" />;
      case 'CAMERA_PERMISSION_DENIED':
      case 'CAMERA_NOT_FOUND':
        return <VideoOff className="w-5 h-5 text-red-500" />;
      case 'SCREEN_SHARE_PERMISSION_DENIED':
        return <Monitor className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getErrorTitle = () => {
    const currentError = error || lastError;
    if (!currentError) return 'Connection Healthy';
    
    switch (currentError.error) {
      case 'CONNECTION_FAILED':
        return 'Connection Failed';
      case 'NETWORK_ERROR':
        return 'Network Issue';
      case 'MICROPHONE_PERMISSION_DENIED':
        return 'Microphone Access Denied';
      case 'CAMERA_PERMISSION_DENIED':
        return 'Camera Access Denied';
      case 'SCREEN_SHARE_PERMISSION_DENIED':
        return 'Screen Share Denied';
      case 'MICROPHONE_NOT_FOUND':
        return 'No Microphone Found';
      case 'CAMERA_NOT_FOUND':
        return 'No Camera Found';
      case 'MEDIA_DEVICE_ERROR':
        return 'Device Error';
      case 'AUDIO_CONTEXT_ERROR':
        return 'Audio System Error';
      default:
        return 'Connection Issue';
    }
  };

  const getErrorDescription = () => {
    const currentError = error || lastError;
    if (!currentError) return 'Your voice connection is working normally.';
    
    return currentError.message || 'An unexpected error occurred with your voice connection.';
  };

  const getSuggestions = () => {
    const currentError = error || lastError;
    if (!currentError) return [];
    
    switch (currentError.error) {
      case 'CONNECTION_FAILED':
      case 'NETWORK_ERROR':
        return [
          'Check your internet connection',
          'Try connecting to a different network',
          'Restart your router if the problem persists',
          'Contact your network administrator'
        ];
      case 'MICROPHONE_PERMISSION_DENIED':
        return [
          'Click the microphone icon in your browser\'s address bar',
          'Select "Allow" for microphone access',
          'Refresh the page after granting permission',
          'Check your browser\'s privacy settings'
        ];
      case 'CAMERA_PERMISSION_DENIED':
        return [
          'Click the camera icon in your browser\'s address bar',
          'Select "Allow" for camera access',
          'Refresh the page after granting permission',
          'Check your browser\'s privacy settings'
        ];
      case 'MICROPHONE_NOT_FOUND':
      case 'CAMERA_NOT_FOUND':
        return [
          'Ensure your device is properly connected',
          'Try unplugging and reconnecting your device',
          'Check if other applications are using the device',
          'Restart your computer if necessary'
        ];
      default:
        return [
          'Try refreshing your browser',
          'Check your internet connection',
          'Restart the application'
        ];
    }
  };

  const handleManualRetry = () => {
    clearErrors();
    if (onRetry) {
      onRetry();
    } else {
      forceReconnect();
    }
  };

  const handleDismiss = () => {
    clearErrors();
  };

  const renderRecoverySteps = () => {
    if (recoverySteps.length === 0) return null;
    
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Recovery Progress</span>
          <span className="text-xs text-gray-400">
            {Math.round(recoveryProgress)}%
          </span>
        </div>
        
        <Progress value={recoveryProgress} className="h-2" />
        
        <div className="space-y-2">
          {recoverySteps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                step.status === 'completed' && "bg-green-500",
                step.status === 'running' && "bg-blue-500 animate-pulse",
                step.status === 'failed' && "bg-red-500",
                step.status === 'pending' && "bg-gray-500"
              )} />
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm",
                  step.status === 'running' && "text-blue-400",
                  step.status === 'completed' && "text-green-400",
                  step.status === 'failed' && "text-red-400",
                  step.status === 'pending' && "text-gray-400"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              
              {step.status === 'running' && (
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              )}
              {step.status === 'completed' && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {step.status === 'failed' && (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Don't show if no error and connection is healthy
  if (!error && !lastError && healthStatus === 'healthy') {
    return null;
  }

  return (
    <TooltipProvider>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 right-4 z-30 w-96"
        >
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getErrorIcon()}
                  <div>
                    <CardTitle className="text-lg text-gray-200">
                      {getErrorTitle()}
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-1">
                      {isAutoRecovering ? 'Attempting automatic recovery...' : getErrorDescription()}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-white"
                  onClick={handleDismiss}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : isConnecting || isRecovering ? (
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-300">
                    {isConnected ? 'Connected' :
                     isConnecting ? 'Connecting...' :
                     isRecovering ? 'Recovering...' : 'Disconnected'}
                  </span>
                </div>
                
                <Badge variant={healthStatus === 'healthy' ? 'default' :
                              healthStatus === 'degraded' ? 'secondary' : 'destructive'}>
                  {healthStatus}
                </Badge>
              </div>
              
              {/* Recovery Steps */}
              {isAutoRecovering && renderRecoverySteps()}
              
              {/* Error Details */}
              {(error || lastError) && (
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showDetails ? 'Hide' : 'Show'} Details
                  </Button>
                  
                  {showDetails && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Technical Details</AlertTitle>
                      <AlertDescription className="mt-2 text-sm">
                        <div className="space-y-2">
                          <p><strong>Error:</strong> {(error || lastError)?.error}</p>
                          <p><strong>Message:</strong> {(error || lastError)?.message}</p>
                          <p><strong>Attempts:</strong> {recoveryAttempts.length}</p>
                          <p><strong>Network Quality:</strong> {networkQuality}</p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              {/* Suggestions */}
              {!isAutoRecovering && getSuggestions().length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Suggestions:</h4>
                  <ul className="space-y-1">
                    {getSuggestions().map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Action Buttons */}
              {!isAutoRecovering && (
                <>
                  <Separator className="bg-gray-700" />
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handleManualRetry}
                      disabled={isConnecting || isRecovering}
                      className="flex-1"
                    >
                      <RefreshCw className={cn(
                        "w-4 h-4 mr-2",
                        (isConnecting || isRecovering) && "animate-spin"
                      )} />
                      {isConnecting || isRecovering ? 'Retrying...' : 'Retry Connection'}
                    </Button>
                    
                    {onSettings && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={onSettings}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Open Settings</p></TooltipContent>
                      </Tooltip>
                    )}
                    
                    {onDisconnect && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="destructive" size="icon" onClick={onDisconnect}>
                            <PhoneOff className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Disconnect</p></TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </>
              )}
              
              {/* Auto-recovery controls */}
              {isAutoRecovering && (
                <div className="flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAutoRecovering(false)}
                  >
                    Cancel Recovery
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}

// Hook for managing error recovery
export function useVoiceErrorRecovery() {
  const {
    error,
    lastError,
    isRecovering,
    recoveryAttempts,
    getHealthStatus,
    clearErrors,
    forceReconnect
  } = useVoiceStore();

  const [recoveryInProgress, setRecoveryInProgress] = React.useState(false);

  const startRecovery = React.useCallback(async () => {
    if (recoveryInProgress) return;
    
    setRecoveryInProgress(true);
    try {
      await forceReconnect();
    } finally {
      setRecoveryInProgress(false);
    }
  }, [recoveryInProgress, forceReconnect]);

  const canRecover = React.useCallback(() => {
    const currentError = error || lastError;
    return currentError?.recoverable !== false;
  }, [error, lastError]);

  const getRecoveryStatus = React.useCallback(() => {
    if (recoveryInProgress || isRecovering) return 'recovering';
    if (error) return 'error';
    if (getHealthStatus() === 'critical') return 'critical';
    if (getHealthStatus() === 'degraded') return 'degraded';
    return 'healthy';
  }, [recoveryInProgress, isRecovering, error, getHealthStatus]);

  return {
    error,
    lastError,
    recoveryAttempts,
    recoveryInProgress,
    canRecover: canRecover(),
    recoveryStatus: getRecoveryStatus(),
    startRecovery,
    clearErrors
  };
}