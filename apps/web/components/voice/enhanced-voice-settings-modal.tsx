"use client";

import * as React from "react";
import { 
  Mic, 
  MicOff, 
  Video,
  VideoOff,
  Monitor,
  Headphones,
  Volume2,
  VolumeX,
  Settings,
  TestTube,
  Wifi,
  Server,
  Zap,
  Shield,
  Bell,
  Palette,
  Sliders,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CallQualityIndicator } from "./call-quality-indicator";

interface EnhancedVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

interface VideoDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export function EnhancedVoiceSettingsModal({
  isOpen,
  onClose
}: EnhancedVoiceSettingsModalProps) {
  const {
    isMuted,
    isDeafened,
    hasVideo,
    volume,
    setVolume,
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    selectAudioDevice,
    selectVideoDevice,
    refreshDevices,
    toggleMute,
    toggleVideo,
    networkQuality,
    bandwidthKbps,
    latencyMs,
    packetLoss
  } = useVoiceStore();

  const { user } = useAuthStore();

  // Local state for settings
  const [isTestingMic, setIsTestingMic] = React.useState(false);
  const [isTestingCamera, setIsTestingCamera] = React.useState(false);
  const [micTestLevel, setMicTestLevel] = React.useState(0);
  const [settings, setSettings] = React.useState({
    // Audio settings
    inputVolume: 100,
    outputVolume: volume,
    micSensitivity: 50,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    voiceActivation: true,
    pushToTalk: false,
    
    // Video settings
    videoQuality: 'auto',
    frameRate: 30,
    mirrorVideo: true,
    backgroundBlur: false,
    
    // Advanced settings
    audioCodec: 'opus',
    videoCodec: 'vp9',
    adaptiveQuality: true,
    hardwareAcceleration: true,
    
    // Notification settings
    soundNotifications: true,
    desktopNotifications: true,
    callRingtone: 'default',
    
    // Appearance
    showParticipantNames: true,
    showConnectionInfo: true,
    compactMode: false
  });

  const [testStream, setTestStream] = React.useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const micTestRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize settings from store
  React.useEffect(() => {
    setSettings(prev => ({
      ...prev,
      outputVolume: volume
    }));
  }, [volume]);

  // Start microphone test
  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          deviceId: selectedAudioDevice || undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl
        }
      });
      
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      setIsTestingMic(true);
      
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicTestLevel(Math.min(100, (average / 255) * 100 * 4));
        
        if (isTestingMic) {
          micTestRef.current = setTimeout(updateLevel, 100);
        }
      };
      
      updateLevel();
      setTestStream(stream);
    } catch (error) {
      console.error('Failed to test microphone:', error);
    }
  };

  const stopMicTest = () => {
    setIsTestingMic(false);
    setMicTestLevel(0);
    if (micTestRef.current) {
      clearTimeout(micTestRef.current);
    }
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
    }
  };

  // Start camera test
  const startCameraTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedVideoDevice || undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: settings.frameRate }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setTestStream(stream);
      setIsTestingCamera(true);
    } catch (error) {
      console.error('Failed to test camera:', error);
    }
  };

  const stopCameraTest = () => {
    setIsTestingCamera(false);
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Apply settings
  const applySettings = () => {
    setVolume(settings.outputVolume);
    if (selectedAudioDevice !== settings.inputVolume.toString()) {
      // Apply audio device change
    }
    // Apply other settings...
    onClose();
  };

  const resetSettings = () => {
    setSettings({
      inputVolume: 100,
      outputVolume: 100,
      micSensitivity: 50,
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      voiceActivation: true,
      pushToTalk: false,
      videoQuality: 'auto',
      frameRate: 30,
      mirrorVideo: true,
      backgroundBlur: false,
      audioCodec: 'opus',
      videoCodec: 'vp9',
      adaptiveQuality: true,
      hardwareAcceleration: true,
      soundNotifications: true,
      desktopNotifications: true,
      callRingtone: 'default',
      showParticipantNames: true,
      showConnectionInfo: true,
      compactMode: false
    });
  };

  // Cleanup on close
  React.useEffect(() => {
    if (!isOpen) {
      stopMicTest();
      stopCameraTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <Card className="w-full max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-gray-200 flex items-center">
                <Settings className="w-6 h-6 mr-2" />
                Voice & Video Settings
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={resetSettings}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs defaultValue="audio" className="w-full">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-5 bg-gray-800">
                  <TabsTrigger value="audio" className="flex items-center space-x-2">
                    <Mic className="w-4 h-4" />
                    <span>Audio</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center space-x-2">
                    <Video className="w-4 h-4" />
                    <span>Video</span>
                  </TabsTrigger>
                  <TabsTrigger value="connection" className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4" />
                    <span>Connection</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="flex items-center space-x-2">
                    <Palette className="w-4 h-4" />
                    <span>Appearance</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <ScrollArea className="h-96 px-6 pb-6">
                {/* Audio Settings */}
                <TabsContent value="audio" className="space-y-6 mt-6">
                  {/* Device Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-200">Audio Devices</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Input Device */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Input Device (Microphone)</Label>
                        <Select value={selectedAudioDevice || ""} onValueChange={selectAudioDevice}>
                          <SelectTrigger className="bg-gray-800 border-gray-700">
                            <SelectValue placeholder="Select microphone" />
                          </SelectTrigger>
                          <SelectContent>
                            {audioDevices.map(device => (
                              <SelectItem key={device.deviceId} value={device.deviceId}>
                                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Output Device */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Output Device (Speakers)</Label>
                        <Select value="default">
                          <SelectTrigger className="bg-gray-800 border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default System Audio</SelectItem>
                            <SelectItem value="speakers">Speakers</SelectItem>
                            <SelectItem value="headphones">Headphones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={refreshDevices}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Devices
                    </Button>
                  </div>
                  
                  <Separator className="bg-gray-700" />
                  
                  {/* Microphone Test */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-200">Microphone Test</h3>
                      <Button
                        variant={isTestingMic ? "destructive" : "default"}
                        onClick={isTestingMic ? stopMicTest : startMicTest}
                      >
                        {isTestingMic ? (
                          <><MicOff className="w-4 h-4 mr-2" />Stop Test</>
                        ) : (
                          <><TestTube className="w-4 h-4 mr-2" />Test Microphone</>
                        )}
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Mic className="w-4 h-4 text-gray-400" />
                        <Progress value={micTestLevel} className="flex-1 h-2" />
                        <span className="text-sm text-gray-400 min-w-[3rem]">
                          {Math.round(micTestLevel)}%
                        </span>
                      </div>
                      {isTestingMic && (
                        <p className="text-sm text-blue-400">
                          Speak into your microphone to test the input level
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-700" />
                  
                  {/* Audio Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-200">Audio Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Volume Controls */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Input Volume</Label>
                          <div className="flex items-center space-x-3">
                            <Volume2 className="w-4 h-4 text-gray-400" />
                            <Slider
                              value={[settings.inputVolume]}
                              onValueChange={([value]) => setSettings(prev => ({ ...prev, inputVolume: value }))}
                              max={200}
                              min={0}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-400 min-w-[3rem]">
                              {settings.inputVolume}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-gray-300">Output Volume</Label>
                          <div className="flex items-center space-x-3">
                            <Volume2 className="w-4 h-4 text-gray-400" />
                            <Slider
                              value={[settings.outputVolume]}
                              onValueChange={([value]) => setSettings(prev => ({ ...prev, outputVolume: value }))}
                              max={200}
                              min={0}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-400 min-w-[3rem]">
                              {settings.outputVolume}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Audio Enhancement */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">Noise Suppression</Label>
                            <p className="text-sm text-gray-500">Filter background noise</p>
                          </div>
                          <Switch
                            checked={settings.noiseSuppression}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, noiseSuppression: checked }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">Echo Cancellation</Label>
                            <p className="text-sm text-gray-500">Remove echo feedback</p>
                          </div>
                          <Switch
                            checked={settings.echoCancellation}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, echoCancellation: checked }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">Auto Gain Control</Label>
                            <p className="text-sm text-gray-500">Automatic volume adjustment</p>
                          </div>
                          <Switch
                            checked={settings.autoGainControl}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoGainControl: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Video Settings */}
                <TabsContent value="video" className="space-y-6 mt-6">
                  {/* Video Device Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-200">Camera Settings</h3>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-300">Camera Device</Label>
                      <Select value={selectedVideoDevice || ""} onValueChange={selectVideoDevice}>
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Select camera" />
                        </SelectTrigger>
                        <SelectContent>
                          {videoDevices.map(device => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Camera Test */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-200">Camera Preview</h3>
                      <Button
                        variant={isTestingCamera ? "destructive" : "default"}
                        onClick={isTestingCamera ? stopCameraTest : startCameraTest}
                      >
                        {isTestingCamera ? (
                          <><VideoOff className="w-4 h-4 mr-2" />Stop Preview</>
                        ) : (
                          <><TestTube className="w-4 h-4 mr-2" />Test Camera</>
                        )}
                      </Button>
                    </div>
                    
                    <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      {isTestingCamera ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={cn(
                            "w-full h-full object-cover",
                            settings.mirrorVideo && "scale-x-[-1]"
                          )}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <div className="text-center">
                            <Video className="w-12 h-12 mx-auto mb-2" />
                            <p>Camera preview will appear here</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-700" />
                  
                  {/* Video Quality Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-200">Video Quality</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Quality Preset</Label>
                          <Select
                            value={settings.videoQuality}
                            onValueChange={(value) => setSettings(prev => ({ ...prev, videoQuality: value }))}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto (Recommended)</SelectItem>
                              <SelectItem value="1080p">1080p (High)</SelectItem>
                              <SelectItem value="720p">720p (Medium)</SelectItem>
                              <SelectItem value="480p">480p (Low)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-gray-300">Frame Rate</Label>
                          <Select
                            value={settings.frameRate.toString()}
                            onValueChange={(value) => setSettings(prev => ({ ...prev, frameRate: parseInt(value) }))}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 FPS</SelectItem>
                              <SelectItem value="30">30 FPS</SelectItem>
                              <SelectItem value="60">60 FPS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">Mirror Video</Label>
                            <p className="text-sm text-gray-500">Flip camera horizontally</p>
                          </div>
                          <Switch
                            checked={settings.mirrorVideo}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, mirrorVideo: checked }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">Background Blur</Label>
                            <p className="text-sm text-gray-500">Blur background (experimental)</p>
                          </div>
                          <Switch
                            checked={settings.backgroundBlur}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, backgroundBlur: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Connection Settings */}
                <TabsContent value="connection" className="space-y-6 mt-6">
                  {/* Connection Quality */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-200">Connection Status</h3>
                    <CallQualityIndicator variant="detailed" showDetails={true} />
                  </div>
                  
                  <Separator className="bg-gray-700" />
                  
                  {/* Advanced Network Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-200">Advanced Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Audio Codec</Label>
                          <Select
                            value={settings.audioCodec}
                            onValueChange={(value) => setSettings(prev => ({ ...prev, audioCodec: value }))}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="opus">Opus (Recommended)</SelectItem>
                              <SelectItem value="aac">AAC</SelectItem>
                              <SelectItem value="pcm">PCM (Uncompressed)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-gray-300">Video Codec</Label>
                          <Select
                            value={settings.videoCodec}
                            onValueChange={(value) => setSettings(prev => ({ ...prev, videoCodec: value }))}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vp9">VP9 (Recommended)</SelectItem>
                              <SelectItem value="vp8">VP8</SelectItem>
                              <SelectItem value="h264">H.264</SelectItem>
                              <SelectItem value="av1">AV1 (Experimental)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">Adaptive Quality</Label>
                            <p className="text-sm text-gray-500">Adjust quality based on connection</p>
                          </div>
                          <Switch
                            checked={settings.adaptiveQuality}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, adaptiveQuality: checked }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">Hardware Acceleration</Label>
                            <p className="text-sm text-gray-500">Use GPU for encoding/decoding</p>
                          </div>
                          <Switch
                            checked={settings.hardwareAcceleration}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hardwareAcceleration: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-200">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Sound Notifications</Label>
                          <p className="text-sm text-gray-500">Play sounds for events</p>
                        </div>
                        <Switch
                          checked={settings.soundNotifications}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundNotifications: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Desktop Notifications</Label>
                          <p className="text-sm text-gray-500">Show browser notifications</p>
                        </div>
                        <Switch
                          checked={settings.desktopNotifications}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, desktopNotifications: checked }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Ringtone</Label>
                        <Select
                          value={settings.callRingtone}
                          onValueChange={(value) => setSettings(prev => ({ ...prev, callRingtone: value }))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Appearance Settings */}
                <TabsContent value="appearance" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-200">Interface Preferences</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Show Participant Names</Label>
                          <p className="text-sm text-gray-500">Display names on video tiles</p>
                        </div>
                        <Switch
                          checked={settings.showParticipantNames}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showParticipantNames: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Show Connection Info</Label>
                          <p className="text-sm text-gray-500">Display quality indicators</p>
                        </div>
                        <Switch
                          checked={settings.showConnectionInfo}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showConnectionInfo: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Compact Mode</Label>
                          <p className="text-sm text-gray-500">Reduce UI spacing and size</p>
                        </div>
                        <Switch
                          checked={settings.compactMode}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, compactMode: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
          
          {/* Footer Actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              Changes are applied automatically
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={applySettings}>
                <Check className="w-4 h-4 mr-2" />
                Apply Settings
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}"