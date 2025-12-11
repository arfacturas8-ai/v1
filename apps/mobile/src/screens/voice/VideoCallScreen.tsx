/**
 * VIDEO CALL SCREEN
 * Full-featured video calling with camera controls, screen sharing, and participant management
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Dimensions,
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useKeepAwake } from 'expo-keep-awake';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetworkContext } from '../../contexts/NetworkContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { 
  Avatar, 
  Button,
  LoadingSpinner,
} from '../../components/ui';
import { apiService } from '../../services/ApiService';
import { useAuthStore } from '../../stores/authStore';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

type VideoCallScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type VideoCallScreenRouteProp = RouteProp<MainStackParamList, 'VideoCall'>;

interface VideoParticipant {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking: boolean;
  isPinned: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  videoStreamId?: string;
  audioLevel: number;
}

interface VideoCallState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeakerEnabled: boolean;
  isScreenSharing: boolean;
  cameraPosition: 'front' | 'back';
  isFullscreen: boolean;
  controlsVisible: boolean;
  isPictureInPicture: boolean;
}

interface VideoLayout {
  type: 'grid' | 'speaker' | 'screen_share';
  pinnedParticipant?: string;
  gridSize: number;
}

const VideoCallScreen: React.FC = () => {
  useKeepAwake(); // Keep screen awake during video call
  
  const navigation = useNavigation<VideoCallScreenNavigationProp>();
  const route = useRoute<VideoCallScreenRouteProp>();
  const { colors, spacing } = useTheme();
  const { isConnected } = useNetworkContext();
  const { user } = useAuthStore();

  const { channelId, channelName, participants: initialParticipants } = route.params;

  const [participants, setParticipants] = useState<VideoParticipant[]>([]);
  const [callState, setCallState] = useState<VideoCallState>({
    isVideoEnabled: true,
    isAudioEnabled: true,
    isSpeakerEnabled: true,
    isScreenSharing: false,
    cameraPosition: 'front',
    isFullscreen: false,
    controlsVisible: true,
    isPictureInPicture: false,
  });
  const [layout, setLayout] = useState<VideoLayout>({
    type: 'grid',
    gridSize: 2,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsAnim = useRef(new Animated.Value(1)).current;
  const pipAnim = useRef(new Animated.Value(1)).current;

  // Refs
  const hideControlsTimer = useRef<NodeJS.Timeout>();
  const callStartTime = useRef<number>(Date.now());

  useEffect(() => {
    initializeVideoCall();
    startCallTimer();
    setupOrientationLock();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Auto-hide controls after 5 seconds of inactivity
    if (callState.controlsVisible) {
      clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = setTimeout(() => {
        hideControls();
      }, 5000);
    }

    return () => {
      clearTimeout(hideControlsTimer.current);
    };
  }, [callState.controlsVisible]);

  const initializeVideoCall = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert initial participants to video participants
      const videoParticipants: VideoParticipant[] = [
        ...initialParticipants.map(p => ({
          id: p.id,
          username: p.username,
          displayName: p.displayName,
          avatar: p.avatar,
          isVideoEnabled: true,
          isAudioEnabled: !p.isMuted,
          isSpeaking: p.isSpeaking,
          isPinned: false,
          isScreenSharing: false,
          connectionQuality: 'good' as const,
          videoStreamId: `stream-${p.id}`,
          audioLevel: p.audioLevel,
        })),
        // Add current user
        {
          id: user?.id || 'me',
          username: user?.username || 'me',
          displayName: user?.username || 'Me',
          avatar: user?.avatarUrl,
          isVideoEnabled: callState.isVideoEnabled,
          isAudioEnabled: callState.isAudioEnabled,
          isSpeaking: false,
          isPinned: false,
          isScreenSharing: false,
          connectionQuality: 'excellent' as const,
          videoStreamId: 'local-stream',
          audioLevel: 0,
        },
      ];

      setParticipants(videoParticipants);
      
      // Determine optimal grid size
      const gridSize = Math.ceil(Math.sqrt(videoParticipants.length));
      setLayout(prev => ({ ...prev, gridSize }));

    } catch (error) {
      console.error('Failed to initialize video call:', error);
      setError('Failed to initialize video call');
    } finally {
      setIsLoading(false);
    }
  }, [initialParticipants, user, callState.isVideoEnabled, callState.isAudioEnabled]);

  const startCallTimer = useCallback(() => {
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const setupOrientationLock = useCallback(async () => {
    // Allow all orientations for video calls
    await ScreenOrientation.unlockAsync();
  }, []);

  const cleanup = useCallback(async () => {
    // Restore orientation lock
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    clearTimeout(hideControlsTimer.current);
  }, []);

  const showControls = useCallback(() => {
    setCallState(prev => ({ ...prev, controlsVisible: true }));
    Animated.timing(controlsAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const hideControls = useCallback(() => {
    setCallState(prev => ({ ...prev, controlsVisible: false }));
    Animated.timing(controlsAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleControls = useCallback(() => {
    if (callState.controlsVisible) {
      hideControls();
    } else {
      showControls();
    }
  }, [callState.controlsVisible, showControls, hideControls]);

  const handleToggleVideo = useCallback(() => {
    setCallState(prev => {
      const newVideoEnabled = !prev.isVideoEnabled;
      
      // Update participant video state
      setParticipants(current => 
        current.map(p => 
          p.id === user?.id ? { ...p, isVideoEnabled: newVideoEnabled } : p
        )
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return { ...prev, isVideoEnabled: newVideoEnabled };
    });
  }, [user?.id]);

  const handleToggleAudio = useCallback(() => {
    setCallState(prev => {
      const newAudioEnabled = !prev.isAudioEnabled;
      
      // Update participant audio state
      setParticipants(current => 
        current.map(p => 
          p.id === user?.id ? { ...p, isAudioEnabled: newAudioEnabled } : p
        )
      );

      if (newAudioEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      
      return { ...prev, isAudioEnabled: newAudioEnabled };
    });
  }, [user?.id]);

  const handleToggleSpeaker = useCallback(() => {
    setCallState(prev => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return { ...prev, isSpeakerEnabled: !prev.isSpeakerEnabled };
    });
  }, []);

  const handleSwitchCamera = useCallback(() => {
    setCallState(prev => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return { 
        ...prev, 
        cameraPosition: prev.cameraPosition === 'front' ? 'back' : 'front' 
      };
    });
  }, []);

  const handleScreenShare = useCallback(() => {
    Alert.alert(
      'Screen Share',
      'Would you like to share your screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share Screen',
          onPress: () => {
            setCallState(prev => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
            setLayout(prev => ({ 
              ...prev, 
              type: callState.isScreenSharing ? 'grid' : 'screen_share' 
            }));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  }, [callState.isScreenSharing]);

  const handlePinParticipant = useCallback((participantId: string) => {
    setParticipants(current => 
      current.map(p => ({
        ...p,
        isPinned: p.id === participantId ? !p.isPinned : false,
      }))
    );
    
    setLayout(prev => ({
      ...prev,
      type: 'speaker',
      pinnedParticipant: participantId,
    }));
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleEndCall = useCallback(() => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end the call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [navigation]);

  const formatCallDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getConnectionQualityColor = useCallback((quality: VideoParticipant['connectionQuality']) => {
    switch (quality) {
      case 'poor': return colors.error;
      case 'fair': return colors.warning;
      case 'good': return colors.success;
      case 'excellent': return colors.primary;
      default: return colors.textSecondary;
    }
  }, [colors]);

  const renderParticipantVideo = useCallback((participant: VideoParticipant, isMainView = false) => {
    const isCurrentUser = participant.id === user?.id;
    const videoSize = isMainView ? 
      { width: width, height: height * 0.7 } : 
      { width: width / layout.gridSize - 20, height: (width / layout.gridSize - 20) * (9/16) };

    return (
      <TouchableOpacity
        key={participant.id}
        style={[
          styles.videoContainer,
          videoSize,
          isMainView && styles.mainVideoContainer,
        ]}
        onPress={() => !isMainView && handlePinParticipant(participant.id)}
        onLongPress={toggleControls}
        activeOpacity={0.8}
      >
        {/* Video Stream Placeholder */}
        <View style={[styles.videoStream, { backgroundColor: colors.cardBackground }]}>
          {participant.isVideoEnabled ? (
            <View style={styles.videoPlaceholder}>
              <Text style={[styles.videoPlaceholderText, { color: colors.textSecondary }]}>
                📹 Video Stream
              </Text>
            </View>
          ) : (
            <View style={styles.videoDisabled}>
              <Avatar
                size={isMainView ? 'xl' : 'lg'}
                source={participant.avatar}
                name={participant.displayName}
              />
            </View>
          )}
        </View>

        {/* Participant Info Overlay */}
        <View style={styles.participantOverlay}>
          <View style={styles.participantInfo}>
            <Text 
              style={[
                styles.participantName, 
                { color: colors.textInverse },
                isCurrentUser && styles.currentUserName,
              ]}
              numberOfLines={1}
            >
              {participant.displayName}
              {isCurrentUser && ' (You)'}
            </Text>
            
            {/* Status Indicators */}
            <View style={styles.statusIndicators}>
              {participant.isSpeaking && (
                <View style={[styles.speakingIndicator, { backgroundColor: colors.success }]}>
                  <Ionicons name="mic" size={12} color={colors.textInverse} />
                </View>
              )}
              
              {!participant.isAudioEnabled && (
                <View style={[styles.mutedIndicator, { backgroundColor: colors.error }]}>
                  <Ionicons name="mic-off" size={12} color={colors.textInverse} />
                </View>
              )}

              {participant.isScreenSharing && (
                <View style={[styles.screenShareIndicator, { backgroundColor: colors.info }]}>
                  <Ionicons name="desktop" size={12} color={colors.textInverse} />
                </View>
              )}

              {participant.isPinned && (
                <View style={[styles.pinnedIndicator, { backgroundColor: colors.warning }]}>
                  <Ionicons name="pin" size={12} color={colors.textInverse} />
                </View>
              )}
            </View>
          </View>

          {/* Connection Quality */}
          <View style={styles.connectionQuality}>
            <View 
              style={[
                styles.qualityDot, 
                { backgroundColor: getConnectionQualityColor(participant.connectionQuality) }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [user?.id, layout.gridSize, colors, handlePinParticipant, toggleControls, getConnectionQualityColor]);

  const renderGridLayout = useCallback(() => {
    return (
      <View style={styles.gridContainer}>
        {participants.map(participant => renderParticipantVideo(participant))}
      </View>
    );
  }, [participants, renderParticipantVideo]);

  const renderSpeakerLayout = useCallback(() => {
    const pinnedParticipant = participants.find(p => p.isPinned);
    const otherParticipants = participants.filter(p => !p.isPinned);

    return (
      <View style={styles.speakerContainer}>
        {/* Main Speaker View */}
        {pinnedParticipant && renderParticipantVideo(pinnedParticipant, true)}
        
        {/* Thumbnail Views */}
        <View style={styles.thumbnailContainer}>
          {otherParticipants.slice(0, 4).map(participant => (
            <View key={participant.id} style={styles.thumbnail}>
              {renderParticipantVideo(participant)}
            </View>
          ))}
        </View>
      </View>
    );
  }, [participants, renderParticipantVideo]);

  const renderControls = useCallback(() => (
    <Animated.View 
      style={[
        styles.controlsContainer,
        { 
          backgroundColor: colors.background + 'E6',
          opacity: controlsAnim,
        }
      ]}
    >
      {/* Top Controls */}
      <View style={styles.topControls}>
        <View style={styles.callInfo}>
          <Text style={[styles.channelName, { color: colors.text }]}>
            {channelName}
          </Text>
          <Text style={[styles.callDuration, { color: colors.textSecondary }]}>
            {formatCallDuration(callDuration)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.layoutButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => setLayout(prev => ({ 
            ...prev, 
            type: prev.type === 'grid' ? 'speaker' : 'grid' 
          }))}
        >
          <Ionicons 
            name={layout.type === 'grid' ? 'apps' : 'person'} 
            size={20} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.primaryControls}>
          {/* Video Toggle */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: callState.isVideoEnabled ? colors.cardBackground : colors.error },
            ]}
            onPress={handleToggleVideo}
          >
            <Ionicons
              name={callState.isVideoEnabled ? 'videocam' : 'videocam-off'}
              size={24}
              color={callState.isVideoEnabled ? colors.text : colors.textInverse}
            />
          </TouchableOpacity>

          {/* Audio Toggle */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: callState.isAudioEnabled ? colors.cardBackground : colors.error },
            ]}
            onPress={handleToggleAudio}
          >
            <Ionicons
              name={callState.isAudioEnabled ? 'mic' : 'mic-off'}
              size={24}
              color={callState.isAudioEnabled ? colors.text : colors.textInverse}
            />
          </TouchableOpacity>

          {/* Speaker Toggle */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: callState.isSpeakerEnabled ? colors.primary : colors.cardBackground },
            ]}
            onPress={handleToggleSpeaker}
          >
            <Ionicons
              name={callState.isSpeakerEnabled ? 'volume-high' : 'volume-low'}
              size={24}
              color={callState.isSpeakerEnabled ? colors.textInverse : colors.text}
            />
          </TouchableOpacity>

          {/* Camera Switch */}
          {callState.isVideoEnabled && (
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.cardBackground }]}
              onPress={handleSwitchCamera}
            >
              <Ionicons name="camera-reverse" size={24} color={colors.text} />
            </TouchableOpacity>
          )}

          {/* Screen Share */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: callState.isScreenSharing ? colors.info : colors.cardBackground },
            ]}
            onPress={handleScreenShare}
          >
            <Ionicons
              name="desktop"
              size={24}
              color={callState.isScreenSharing ? colors.textInverse : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* End Call */}
        <TouchableOpacity
          style={[styles.endCallButton, { backgroundColor: colors.error }]}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={28} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  ), [
    colors, 
    controlsAnim, 
    channelName, 
    callDuration, 
    layout.type, 
    callState,
    formatCallDuration,
    handleToggleVideo,
    handleToggleAudio,
    handleToggleSpeaker,
    handleSwitchCamera,
    handleScreenShare,
    handleEndCall,
  ]);

  if (isLoading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" hidden={!callState.controlsVisible} />
        
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Video Layout */}
          <TouchableOpacity 
            style={styles.videoLayout}
            onPress={toggleControls}
            activeOpacity={1}
          >
            {layout.type === 'grid' ? renderGridLayout() : renderSpeakerLayout()}
          </TouchableOpacity>

          {/* Controls Overlay */}
          {callState.controlsVisible && renderControls()}

          {/* Participant Count Badge */}
          <View style={[styles.participantBadge, { backgroundColor: colors.background + 'CC' }]}>
            <Ionicons name="people" size={16} color={colors.text} />
            <Text style={[styles.participantCount, { color: colors.text }]}>
              {participants.length}
            </Text>
          </View>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  videoLayout: {
    flex: 1,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  speakerContainer: {
    flex: 1,
  },
  thumbnailContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 10,
  },
  thumbnail: {
    width: 100,
    height: 56,
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  mainVideoContainer: {
    borderRadius: 0,
  },
  videoStream: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    fontSize: 16,
  },
  videoDisabled: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 12,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentUserName: {
    // Additional styling for current user
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  speakingIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mutedIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  screenShareIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pinnedIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  connectionQuality: {
    alignItems: 'center',
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingHorizontal: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 18,
    fontWeight: '600',
  },
  callDuration: {
    fontSize: 14,
    marginTop: 2,
  },
  layoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    alignItems: 'center',
    gap: 20,
  },
  primaryControls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  participantBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 34,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  participantCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export { VideoCallScreen };