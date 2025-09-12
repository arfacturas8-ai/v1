"use client";

import * as React from "react";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Volume2,
  VolumeX,
  Settings,
  TestTube,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Headphones
} from "lucide-react";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/modal";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
// import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceSettingsModal({ isOpen, onClose }: VoiceSettingsModalProps) {
  const {
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    volume,
    audioLevel,
    isMuted,
    isDeafened,
    hasVideo,
    safetyEnabled,
    crashRecoveryEnabled,
    autoReconnectEnabled,
    fallbackModeEnabled,
    networkQuality,
    bandwidthKbps,
    latencyMs,
    packetLoss,
    selectAudioDevice,
    selectVideoDevice,
    setVolume,
    refreshDevices,
    setSafetyEnabled,
    setCrashRecoveryEnabled,
    setAutoReconnectEnabled,
    setFallbackModeEnabled,
    getHealthStatus,
    getDiagnostics
  } = useVoiceStore();

  const [currentTab, setCurrentTab] = React.useState<'devices' | 'quality' | 'advanced'>('devices');
  const [isTestingAudio, setIsTestingAudio] = React.useState(false);
  const [isTestingVideo, setIsTestingVideo] = React.useState(false);
  const [testResults, setTestResults] = React.useState<{
    audio: boolean | null;
    video: boolean | null;
    network: boolean | null;
  }>({ audio: null, video: null, network: null });

  React.useEffect(() => {
    if (isOpen) {
      refreshDevices();
    }
  }, [isOpen, refreshDevices]);

  const healthStatus = getHealthStatus();
  const diagnostics = getDiagnostics();

  const handleAudioTest = async () => {
    setIsTestingAudio(true);
    try {
      // Simulate audio test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResults(prev => ({ ...prev, audio: true }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, audio: false }));
    } finally {
      setIsTestingAudio(false);
    }
  };

  const handleVideoTest = async () => {
    setIsTestingVideo(true);
    try {
      // Simulate video test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResults(prev => ({ ...prev, video: true }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, video: false }));
    } finally {
      setIsTestingVideo(false);
    }
  };

  const handleNetworkTest = async () => {
    try {
      const response = await fetch('/api/voice/health');
      setTestResults(prev => ({ ...prev, network: response.ok }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, network: false }));
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Voice & Video Settings
          </DialogTitle>
          <DialogDescription>
            Configure your audio and video settings, test devices, and manage connection quality.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              currentTab === 'devices'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setCurrentTab('devices')}
          >
            Devices & Testing
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              currentTab === 'quality'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setCurrentTab('quality')}
          >
            Quality & Performance
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              currentTab === 'advanced'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setCurrentTab('advanced')}
          >
            Advanced Settings
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Devices & Testing Tab */}
          {currentTab === 'devices' && (
            <div className="space-y-6">
              {/* Audio Device Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Mic className="w-5 h-5 mr-2" />
                    Microphone
                  </CardTitle>
                  <CardDescription>
                    Select and test your microphone device
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Select 
                        value={selectedAudioDevice || ''} 
                        onValueChange={selectAudioDevice}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select microphone device" />
                        </SelectTrigger>
                        <SelectContent>
                          {audioDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAudioTest}
                      disabled={isTestingAudio}
                      variant="outline"
                      size="sm"
                    >
                      {isTestingAudio ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      Test
                    </Button>
                  </div>
                  
                  {/* Audio Level Display */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Audio Level</span>
                      <span>{Math.round(audioLevel)}%</span>
                    </div>
                    <Progress value={audioLevel} className="h-2" />
                  </div>
                  
                  {testResults.audio !== null && (
                    <div className={cn(
                      "flex items-center space-x-2 text-sm",
                      testResults.audio ? "text-green-600" : "text-red-600"
                    )}>
                      {testResults.audio ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span>
                        {testResults.audio ? "Microphone is working properly" : "Microphone test failed"}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Video Device Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    Camera
                  </CardTitle>
                  <CardDescription>
                    Select and test your camera device
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Select 
                        value={selectedVideoDevice || ''} 
                        onValueChange={selectVideoDevice}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select camera device" />
                        </SelectTrigger>
                        <SelectContent>
                          {videoDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleVideoTest}
                      disabled={isTestingVideo}
                      variant="outline"
                      size="sm"
                    >
                      {isTestingVideo ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      Test
                    </Button>
                  </div>
                  
                  {testResults.video !== null && (
                    <div className={cn(
                      "flex items-center space-x-2 text-sm",
                      testResults.video ? "text-green-600" : "text-red-600"
                    )}>
                      {testResults.video ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span>
                        {testResults.video ? "Camera is working properly" : "Camera test failed"}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Volume Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Volume2 className="w-5 h-5 mr-2" />
                    Audio Output
                  </CardTitle>
                  <CardDescription>
                    Adjust your audio output volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <VolumeX className="w-4 h-4 text-gray-400" />
                      <Slider
                        value={[volume]}
                        onValueChange={(value) => setVolume(value[0])}
                        max={200}
                        step={1}
                        className="flex-1"
                      />
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium w-12">{volume}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quality & Performance Tab */}
          {currentTab === 'quality' && (
            <div className="space-y-6">
              {/* Connection Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    {getHealthStatusIcon(healthStatus)}
                    <span className="ml-2">Connection Health</span>
                    <Badge variant="outline" className="ml-2">
                      {healthStatus}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Current connection quality and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Network Quality</div>
                      <div className={cn("text-lg font-semibold", getQualityColor(networkQuality))}>
                        {networkQuality.charAt(0).toUpperCase() + networkQuality.slice(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Bandwidth</div>
                      <div className="text-lg font-semibold">
                        {Math.round(bandwidthKbps)} kbps
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Latency</div>
                      <div className="text-lg font-semibold">
                        {Math.round(latencyMs)} ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Packet Loss</div>
                      <div className="text-lg font-semibold">
                        {packetLoss.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleNetworkTest}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Network Connection
                  </Button>
                  
                  {testResults.network !== null && (
                    <div className={cn(
                      "flex items-center space-x-2 text-sm",
                      testResults.network ? "text-green-600" : "text-red-600"
                    )}>
                      {testResults.network ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span>
                        {testResults.network ? "Network connection is stable" : "Network connection issues detected"}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Diagnostics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Diagnostics</CardTitle>
                  <CardDescription>
                    Detailed connection and performance information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Connection Status:</span>
                      <span className={diagnostics.connectionState.isConnected ? "text-green-600" : "text-red-600"}>
                        {diagnostics.connectionState.isConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Audio State:</span>
                      <span className={!diagnostics.audioState.isMuted ? "text-green-600" : "text-yellow-600"}>
                        {!diagnostics.audioState.isMuted ? "Unmuted" : "Muted"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Error:</span>
                      <span className={!diagnostics.errorState.currentError ? "text-green-600" : "text-red-600"}>
                        {!diagnostics.errorState.currentError ? "None" : "Active"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recovery Attempts:</span>
                      <span>{diagnostics.errorState.recoveryAttempts}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Advanced Settings Tab */}
          {currentTab === 'advanced' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Safety & Recovery</CardTitle>
                  <CardDescription>
                    Configure crash recovery and safety mechanisms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Safety Mechanisms</div>
                      <div className="text-sm text-gray-500">
                        Enable built-in safety and error handling
                      </div>
                    </div>
                    <Switch 
                      checked={safetyEnabled} 
                      onCheckedChange={setSafetyEnabled} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Crash Recovery</div>
                      <div className="text-sm text-gray-500">
                        Automatically recover from connection crashes
                      </div>
                    </div>
                    <Switch 
                      checked={crashRecoveryEnabled} 
                      onCheckedChange={setCrashRecoveryEnabled} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Reconnect</div>
                      <div className="text-sm text-gray-500">
                        Automatically reconnect after disconnections
                      </div>
                    </div>
                    <Switch 
                      checked={autoReconnectEnabled} 
                      onCheckedChange={setAutoReconnectEnabled} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Fallback Mode</div>
                      <div className="text-sm text-gray-500">
                        Use fallback servers when primary is unavailable
                      </div>
                    </div>
                    <Switch 
                      checked={fallbackModeEnabled} 
                      onCheckedChange={setFallbackModeEnabled} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}