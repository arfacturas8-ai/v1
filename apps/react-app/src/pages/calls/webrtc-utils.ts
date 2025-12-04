/**
 * WebRTC Utilities for Call Implementation
 * Helper functions and configurations for WebRTC functionality
 */

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface RTCConfig extends RTCConfiguration {
  iceServers: RTCIceServer[];
}

/**
 * Get optimized media constraints based on call type and device
 */
export const getMediaConstraints = (
  type: 'voice' | 'video',
  quality: 'low' | 'medium' | 'high' = 'medium'
): MediaConstraints => {
  const audioConstraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  if (type === 'voice') {
    return {
      video: false,
      audio: audioConstraints,
    };
  }

  // Video constraints based on quality
  const videoConstraints: Record<string, MediaTrackConstraints> = {
    low: {
      width: { ideal: 480 },
      height: { ideal: 360 },
      frameRate: { ideal: 15 },
    },
    medium: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 24 },
    },
    high: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
  };

  return {
    video: videoConstraints[quality],
    audio: audioConstraints,
  };
};

/**
 * Get RTCPeerConnection configuration
 */
export const getRTCConfiguration = (): RTCConfig => {
  return {
    iceServers: [
      // Public STUN servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Add TURN servers here for production
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'password',
      // },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };
};

/**
 * Check if WebRTC is supported
 */
export const isWebRTCSupported = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.RTCPeerConnection
  );
};

/**
 * Check if device has camera
 */
export const hasCamera = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error checking for camera:', error);
    return false;
  }
};

/**
 * Check if device has microphone
 */
export const hasMicrophone = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === 'audioinput');
  } catch (error) {
    console.error('Error checking for microphone:', error);
    return false;
  }
};

/**
 * Get list of available media devices
 */
export const getMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      audioInputs: devices.filter((d) => d.kind === 'audioinput'),
      audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
      videoInputs: devices.filter((d) => d.kind === 'videoinput'),
    };
  } catch (error) {
    console.error('Error getting media devices:', error);
    return {
      audioInputs: [],
      audioOutputs: [],
      videoInputs: [],
    };
  }
};

/**
 * Request media permissions
 */
export const requestMediaPermissions = async (
  type: 'voice' | 'video'
): Promise<MediaStream | null> => {
  try {
    const constraints = getMediaConstraints(type);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error requesting media permissions:', error);
    handleMediaError(error as DOMException);
    return null;
  }
};

/**
 * Handle media access errors
 */
export const handleMediaError = (error: DOMException) => {
  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      console.error('Permission denied for camera/microphone access');
      // Show permission request dialog
      break;
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      console.error('No camera/microphone found');
      // Show device not found error
      break;
    case 'NotReadableError':
    case 'TrackStartError':
      console.error('Device already in use');
      // Show device in use error
      break;
    case 'OverconstrainedError':
      console.error('Constraints cannot be satisfied');
      // Show constraint error
      break;
    case 'TypeError':
      console.error('Invalid constraints');
      // Show invalid constraints error
      break;
    default:
      console.error('Unknown media error:', error);
      // Show generic error
  }
};

/**
 * Stop all media tracks in a stream
 */
export const stopMediaStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
};

/**
 * Toggle audio track in stream
 */
export const toggleAudioTrack = (stream: MediaStream | null, enabled: boolean) => {
  if (stream) {
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = enabled;
    });
  }
};

/**
 * Toggle video track in stream
 */
export const toggleVideoTrack = (stream: MediaStream | null, enabled: boolean) => {
  if (stream) {
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = enabled;
    });
  }
};

/**
 * Switch camera (front/back)
 */
export const switchCamera = async (
  currentStream: MediaStream | null,
  currentFacingMode: 'user' | 'environment'
): Promise<MediaStream | null> => {
  try {
    // Stop current stream
    stopMediaStream(currentStream);

    // Get new stream with opposite facing mode
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: newFacingMode,
      },
      audio: true,
    });

    return stream;
  } catch (error) {
    console.error('Error switching camera:', error);
    return null;
  }
};

/**
 * Start screen sharing
 */
export const startScreenShare = async (): Promise<MediaStream | null> => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
      },
      audio: false, // Screen audio can be added if needed
    });
    return stream;
  } catch (error) {
    console.error('Error starting screen share:', error);
    return null;
  }
};

/**
 * Replace video track in peer connection
 */
export const replaceVideoTrack = async (
  peerConnection: RTCPeerConnection,
  newTrack: MediaStreamTrack
) => {
  try {
    const senders = peerConnection.getSenders();
    const videoSender = senders.find((sender) => sender.track?.kind === 'video');

    if (videoSender) {
      await videoSender.replaceTrack(newTrack);
    }
  } catch (error) {
    console.error('Error replacing video track:', error);
  }
};

/**
 * Get connection quality based on stats
 */
export const getConnectionQuality = (stats: {
  packetLoss: number;
  latency: number;
  jitter: number;
}): 'excellent' | 'good' | 'fair' | 'poor' => {
  const { packetLoss, latency, jitter } = stats;

  if (packetLoss > 10 || latency > 300 || jitter > 50) {
    return 'poor';
  } else if (packetLoss > 5 || latency > 200 || jitter > 30) {
    return 'fair';
  } else if (packetLoss > 2 || latency > 100 || jitter > 20) {
    return 'good';
  } else {
    return 'excellent';
  }
};

/**
 * Parse WebRTC stats
 */
export const parseWebRTCStats = async (
  peerConnection: RTCPeerConnection
): Promise<{
  bitrate: number;
  packetLoss: number;
  latency: number;
  jitter: number;
  resolution?: string;
  fps?: number;
} | null> => {
  try {
    const stats = await peerConnection.getStats();
    let bitrate = 0;
    let packetLoss = 0;
    let latency = 0;
    let jitter = 0;
    let resolution: string | undefined;
    let fps: number | undefined;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        // Calculate bitrate
        if (report.bytesReceived) {
          bitrate = Math.round((report.bytesReceived * 8) / 1000); // kbps
        }

        // Calculate packet loss
        if (report.packetsLost && report.packetsReceived) {
          packetLoss = (report.packetsLost / report.packetsReceived) * 100;
        }

        // Get resolution
        if (report.frameWidth && report.frameHeight) {
          resolution = `${report.frameWidth}x${report.frameHeight}`;
        }

        // Get FPS
        if (report.framesPerSecond) {
          fps = report.framesPerSecond;
        }
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        // Get latency (RTT)
        if (report.currentRoundTripTime) {
          latency = Math.round(report.currentRoundTripTime * 1000); // ms
        }
      }

      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        // Get jitter
        if (report.jitter) {
          jitter = Math.round(report.jitter * 1000); // ms
        }
      }
    });

    return {
      bitrate,
      packetLoss,
      latency,
      jitter,
      resolution,
      fps,
    };
  } catch (error) {
    console.error('Error parsing WebRTC stats:', error);
    return null;
  }
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Check if browser supports screen sharing
 */
export const supportsScreenSharing = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
};

/**
 * Check if browser supports Picture-in-Picture
 */
export const supportsPictureInPicture = (): boolean => {
  return 'pictureInPicture' in document;
};

/**
 * Enable Picture-in-Picture mode
 */
export const enablePictureInPicture = async (
  videoElement: HTMLVideoElement
): Promise<boolean> => {
  try {
    if (supportsPictureInPicture() && videoElement) {
      await (videoElement as any).requestPictureInPicture();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error enabling Picture-in-Picture:', error);
    return false;
  }
};

/**
 * Disable Picture-in-Picture mode
 */
export const disablePictureInPicture = async (): Promise<boolean> => {
  try {
    if (supportsPictureInPicture() && (document as any).pictureInPictureElement) {
      await (document as any).exitPictureInPicture();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error disabling Picture-in-Picture:', error);
    return false;
  }
};

export default {
  getMediaConstraints,
  getRTCConfiguration,
  isWebRTCSupported,
  hasCamera,
  hasMicrophone,
  getMediaDevices,
  requestMediaPermissions,
  handleMediaError,
  stopMediaStream,
  toggleAudioTrack,
  toggleVideoTrack,
  switchCamera,
  startScreenShare,
  replaceVideoTrack,
  getConnectionQuality,
  parseWebRTCStats,
  formatBytes,
  isMobileDevice,
  supportsScreenSharing,
  supportsPictureInPicture,
  enablePictureInPicture,
  disablePictureInPicture,
};
