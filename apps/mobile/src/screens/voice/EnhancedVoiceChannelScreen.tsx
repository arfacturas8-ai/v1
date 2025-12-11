/**
 * ENHANCED VOICE CHANNEL SCREEN WITH LIVEKIT
 * Real-time voice chat with LiveKit integration, Discord-style UI, and mobile optimizations
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  Dimensions,
  AppState,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetworkContext } from '../../contexts/NetworkContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { 
  Avatar, 
  Button, 
  Card,
  LoadingSpinner,
} from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useMobileLiveKit } from '../../hooks/useMobileLiveKit';
import { MobileParticipantInfo } from '../../services/LiveKitMobileService';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

type VoiceChannelScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type VoiceChannelScreenRouteProp = RouteProp<MainStackParamList, 'VoiceChannel'>;

interface VoiceChannel {
  id: string;
  name: string;
  serverId?: string;
  serverName?: string;
  type: 'voice' | 'stage';
  maxParticipants: number;
  isLocked: boolean;
  requiresPermission: boolean;
  quality: 'low' | 'medium' | 'high';
}

const EnhancedVoiceChannelScreen: React.FC = () => {
  const navigation = useNavigation<VoiceChannelScreenNavigationProp>();
  const route = useRoute<VoiceChannelScreenRouteProp>();
  const { colors, spacing } = useTheme();
  const { isConnected: isNetworkConnected } = useNetworkContext();
  const { user } = useAuthStore();

  const { channelId, channelName, serverId } = route.params;

  const [channel, setChannel] = useState<VoiceChannel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isDataSaverEnabled, setIsDataSaverEnabled] = useState(false);
  const [isBatteryOptimizationEnabled, setIsBatteryOptimizationEnabled] = useState(Platform.OS !== 'web');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const speakingAnims = useRef<Map<string, Animated.Value>>(new Map()).current;

  // LiveKit Mobile Hook
  const liveKit = useMobileLiveKit({
    enableDataSaver: isDataSaverEnabled,
    enableBatteryOptimization: isBatteryOptimizationEnabled,
    enableBackgroundMode: true,
    onError: (error) => {
      console.error('📱 LiveKit error:', error);
      setError(error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    onParticipantJoined: (participant) => {
      console.log('📱 Participant joined:', participant.identity);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onParticipantLeft: (participantId) => {
      console.log('📱 Participant left:', participantId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onAudioLevelChanged: (participantId, level) => {
      // Update audio level animations
      const anim = speakingAnims.get(participantId);
      if (anim && level > 0.1) {
        Animated.timing(anim, {
          toValue: 1 + (level * 0.2),
          duration: 100,
          useNativeDriver: true,
        }).start();
      } else if (anim) {
        Animated.timing(anim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }
    }
  });

  useEffect(() => {
    loadChannelData();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => {
      // Cleanup on unmount
      handleDisconnect();
    };
  }, []);

  // App state handling for background mode
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && liveKit.isConnected) {
        console.log('📱 App backgrounded - maintaining voice connection');
      } else if (nextAppState === 'active' && liveKit.isConnected) {
        console.log('📱 App resumed - voice connection active');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [liveKit.isConnected]);

  // Focus effect to handle navigation
  useFocusEffect(
    useCallback(() => {
      if (liveKit.isConnected) {
        console.log('📱 Screen focused - voice connection active');
      }
      
      return () => {
        if (liveKit.isConnected) {
          console.log('📱 Screen unfocused - maintaining voice connection');
        }
      };
    }, [liveKit.isConnected])
  );

  const loadChannelData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load channel data from API
      const mockChannel: VoiceChannel = {
        id: channelId,
        name: channelName,
        serverId,
        serverName: 'Gaming Community',
        type: 'voice',
        maxParticipants: 10,
        isLocked: false,
        requiresPermission: false,
        quality: 'high',
      };

      setChannel(mockChannel);
    } catch (error) {
      console.error('Failed to load channel data:', error);
      setError('Failed to load voice channel');
    } finally {
      setIsLoading(false);
    }
  }, [channelId, channelName, serverId]);

  const handleConnect = useCallback(async () => {
    try {
      setError(null);

      // Get LiveKit token from backend
      const response = await fetch(`/api/v1/voice/channels/${channelId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token from storage
        },
        body: JSON.stringify({
          mute: false,
          video: false,
          quality: isDataSaverEnabled ? 'low' : 'high'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to join voice channel: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await liveKit.connect(data.data.liveKitToken, channelId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(data.message || 'Failed to join voice channel');
      }
    } catch (error) {
      console.error('Failed to connect to voice channel:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [channelId, liveKit, isDataSaverEnabled]);

  const handleDisconnect = useCallback(async () => {
    try {
      await liveKit.disconnect();
      navigation.goBack();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to disconnect from voice channel:', error);
      navigation.goBack(); // Still go back even if disconnect fails
    }
  }, [liveKit, navigation]);

  const handleVideoCall = useCallback(() => {
    navigation.navigate('VideoCall', {
      channelId,
      channelName,
      participants: liveKit.participants.filter(p => p.audioEnabled || p.videoEnabled),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [navigation, channelId, channelName, liveKit.participants]);

  const handleParticipantAction = useCallback((participant: MobileParticipantInfo, action: string) => {
    Alert.alert(
      participant.name || participant.identity,
      `Choose an action for ${participant.name || participant.identity}`,
      [
        {
          text: 'View Profile',
          onPress: () => {
            console.log('View profile:', participant.identity);
          },
        },
        {
          text: 'Private Message',
          onPress: () => {
            console.log('Send DM to:', participant.identity);
          },
        },
        ...(user?.id !== participant.identity ? [
          {
            text: 'Adjust Volume',
            onPress: () => {
              // Could open a volume slider modal
              console.log('Adjust volume for:', participant.identity);
            },
          },
        ] : []),
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
      ]
    );
  }, [user]);

  const getConnectionQualityColor = useCallback((quality: string) => {
    switch (quality) {
      case 'poor': return colors.error;
      case 'fair': return colors.warning;
      case 'good': return colors.success;
      case 'excellent': return colors.primary;
      default: return colors.textSecondary;
    }
  }, [colors]);

  const getConnectionQualityIcon = useCallback((quality: string) => {
    switch (quality) {
      case 'poor': return 'signal-cellular-1-bar';
      case 'fair': return 'signal-cellular-2-bar';
      case 'good': return 'signal-cellular-3-bar';
      case 'excellent': return 'signal-cellular-4-bar';
      default: return 'signal-cellular-off';
    }
  }, []);

  const renderParticipant = useCallback(({ item: participant }: { item: MobileParticipantInfo }) => {
    const isCurrentUser = participant.identity === user?.id;
    
    // Get or create speaking animation for this participant
    if (!speakingAnims.has(participant.identity)) {
      speakingAnims.set(participant.identity, new Animated.Value(1));
    }
    const speakingAnim = speakingAnims.get(participant.identity)!;

    return (
      <TouchableOpacity
        style={[
          styles.participantItem,
          { backgroundColor: colors.cardBackground },
          isCurrentUser && { backgroundColor: colors.primary + '10' }
        ]}
        onPress={() => handleParticipantAction(participant, 'info')}
        disabled={!liveKit.isConnected}
      >
        <Animated.View
          style={[
            styles.participantAvatar,
            {
              transform: [{ scale: speakingAnim }],
            }
          ]}
        >
          <Avatar
            size="lg"
            source={participant.name}
            name={participant.name || participant.identity}
            showOnlineStatus={false}
          />
          
          {/* Speaking indicator */}
          {participant.isSpeaking && (
            <View style={[styles.speakingIndicator, { backgroundColor: colors.success }]}>
              <Ionicons name="mic" size={12} color={colors.textInverse} />
            </View>
          )}

          {/* Muted indicator */}
          {!participant.audioEnabled && (
            <View style={[styles.mutedIndicator, { backgroundColor: colors.error }]}>
              <Ionicons name="mic-off" size={12} color={colors.textInverse} />
            </View>
          )}

          {/* Role badge */}
          {participant.role === 'owner' && (
            <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="crown" size={10} color={colors.textInverse} />
            </View>
          )}
          {participant.role === 'moderator' && (
            <View style={[styles.roleBadge, { backgroundColor: colors.info }]}>
              <Ionicons name="shield" size={10} color={colors.textInverse} />
            </View>
          )}
        </Animated.View>

        <View style={styles.participantInfo}>
          <Text 
            style={[
              styles.participantName, 
              { color: colors.text },
              isCurrentUser && { color: colors.primary }
            ]}
            numberOfLines={1}
          >
            {participant.name || participant.identity}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={[styles.participantStatus, { color: colors.textSecondary }]}>
            {!participant.audioEnabled ? 'Muted' : participant.isSpeaking ? 'Speaking' : 'Connected'}
          </Text>
        </View>

        {/* Audio level indicator */}
        <View style={styles.audioLevelContainer}>
          <View style={[styles.audioLevelBar, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.audioLevelFill,
                {
                  backgroundColor: getConnectionQualityColor(participant.connectionQuality),
                  height: `${participant.audioLevel * 100}%`,
                }
              ]}
            />
          </View>
        </View>

        {/* Connection quality */}
        <View style={styles.connectionIndicator}>
          <Ionicons 
            name={getConnectionQualityIcon(participant.connectionQuality)} 
            size={16} 
            color={getConnectionQualityColor(participant.connectionQuality)} 
          />
        </View>
      </TouchableOpacity>
    );
  }, [user, colors, speakingAnims, liveKit.isConnected, handleParticipantAction, getConnectionQualityColor, getConnectionQualityIcon]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.channelInfo}>
        <View style={styles.channelHeader}>
          <Ionicons name="volume-high" size={24} color={colors.text} />
          <Text style={[styles.channelName, { color: colors.text }]}>
            {channel?.name}
          </Text>
        </View>
        {channel?.serverName && (
          <Text style={[styles.serverName, { color: colors.textSecondary }]}>
            {channel.serverName}
          </Text>
        )}
        
        {liveKit.isConnected && (
          <View style={styles.connectionInfo}>
            <Ionicons 
              name={getConnectionQualityIcon(liveKit.connectionQuality)} 
              size={16} 
              color={getConnectionQualityColor(liveKit.connectionQuality)} 
            />
            <Text style={[styles.connectionText, { color: colors.textSecondary }]}>
              {liveKit.connectionQuality}
            </Text>
            {liveKit.isInBackground && (
              <View style={[styles.backgroundIndicator, { backgroundColor: colors.warning }]}>
                <Text style={[styles.backgroundText, { color: colors.textInverse }]}>BG</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.participantCount}>
        <Ionicons name="people" size={16} color={colors.textSecondary} />
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {(liveKit.participants.length + (liveKit.localParticipant ? 1 : 0))}/{channel?.maxParticipants || 10}
        </Text>
      </View>
    </View>
  ), [channel, colors, liveKit, getConnectionQualityIcon, getConnectionQualityColor]);

  const renderControls = useCallback(() => (
    <View style={[styles.controls, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.primaryControls}>
        {/* Mute Button */}
        <Animated.View style={{ transform: [{ scale: !liveKit.localParticipant?.audioEnabled ? 1.1 : 1 }] }}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.muteButton,
              { backgroundColor: !liveKit.localParticipant?.audioEnabled ? colors.error : colors.background },
            ]}
            onPress={liveKit.toggleMicrophone}
            disabled={!liveKit.isConnected}
          >
            <Ionicons
              name={!liveKit.localParticipant?.audioEnabled ? 'mic-off' : 'mic'}
              size={24}
              color={!liveKit.localParticipant?.audioEnabled ? colors.textInverse : colors.text}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Camera Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: liveKit.localParticipant?.videoEnabled ? colors.success : colors.background },
          ]}
          onPress={liveKit.toggleCamera}
          disabled={!liveKit.isConnected}
        >
          <Ionicons
            name={liveKit.localParticipant?.videoEnabled ? 'videocam' : 'videocam-off'}
            size={24}
            color={liveKit.localParticipant?.videoEnabled ? colors.textInverse : colors.text}
          />
        </TouchableOpacity>

        {/* Video Call Button */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.background }]}
          onPress={handleVideoCall}
          disabled={!liveKit.isConnected}
        >
          <Ionicons name="call" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Switch Camera (Mobile Only) */}
        {Platform.OS !== 'web' && liveKit.localParticipant?.videoEnabled && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.background }]}
            onPress={liveKit.switchCamera}
            disabled={!liveKit.isConnected}
          >
            <Ionicons name="camera-reverse" size={24} color={colors.text} />
          </TouchableOpacity>
        )}

        {/* Settings Button */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.background }]}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Ionicons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Data Saver & Battery Toggle */}
      {showSettings && (
        <View style={styles.settingsRow}>
          <TouchableOpacity
            style={[styles.settingButton, isDataSaverEnabled && { backgroundColor: colors.info + '20' }]}
            onPress={() => {
              setIsDataSaverEnabled(!isDataSaverEnabled);
              liveKit.enableDataSaverMode(!isDataSaverEnabled);
            }}
          >
            <Ionicons 
              name="cellular" 
              size={16} 
              color={isDataSaverEnabled ? colors.info : colors.textSecondary} 
            />
            <Text style={[styles.settingText, { color: isDataSaverEnabled ? colors.info : colors.textSecondary }]}>
              Data Saver
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, isBatteryOptimizationEnabled && { backgroundColor: colors.success + '20' }]}
            onPress={() => {
              setIsBatteryOptimizationEnabled(!isBatteryOptimizationEnabled);
              liveKit.enableBatteryOptimization(!isBatteryOptimizationEnabled);
            }}
          >
            <Ionicons 
              name="battery-charging" 
              size={16} 
              color={isBatteryOptimizationEnabled ? colors.success : colors.textSecondary} 
            />
            <Text style={[styles.settingText, { color: isBatteryOptimizationEnabled ? colors.success : colors.textSecondary }]}>
              Battery
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Disconnect Button */}
      <TouchableOpacity
        style={[styles.disconnectButton, { backgroundColor: colors.error }]}
        onPress={handleDisconnect}
      >
        <Ionicons name="call" size={24} color={colors.textInverse} />
        <Text style={[styles.disconnectText, { color: colors.textInverse }]}>
          Disconnect
        </Text>
      </TouchableOpacity>
    </View>
  ), [colors, liveKit, handleVideoCall, handleDisconnect, showSettings, isDataSaverEnabled, isBatteryOptimizationEnabled]);

  // All participants including local
  const allParticipants = [
    ...(liveKit.localParticipant ? [liveKit.localParticipant] : []),
    ...liveKit.participants
  ];

  if (isLoading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            colors.background,
            colors.primary + '05',
            colors.background,
          ]}
          style={styles.gradient}
        />

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            {renderHeader()}
          </View>

          {/* Connection State */}
          {!liveKit.isConnected && !liveKit.isConnecting ? (
            <View style={styles.connectionContainer}>
              <Card padding="xl" style={styles.connectionCard}>
                <View style={styles.connectionContent}>
                  <Ionicons name="volume-high" size={64} color={colors.primary} />
                  <Text style={[styles.connectionTitle, { color: colors.text }]}>
                    Join Voice Channel
                  </Text>
                  <Text style={[styles.connectionDescription, { color: colors.textSecondary }]}>
                    Connect to start talking with others in this channel
                  </Text>
                  
                  <Button
                    title="Connect"
                    onPress={handleConnect}
                    variant="primary"
                    size="lg"
                    loading={liveKit.isConnecting}
                    style={{ marginTop: spacing.lg }}
                    icon={<Ionicons name="call" size={20} color={colors.textInverse} />}
                  />
                </View>
              </Card>
            </View>
          ) : (
            <>
              {/* Connecting State removed */}

              {/* Participants List */}
              {liveKit.isConnected && (
                <FlatList
                  data={allParticipants}
                  renderItem={renderParticipant}
                  keyExtractor={(item) => item.identity}
                  style={styles.participantsList}
                  contentContainerStyle={styles.participantsContent}
                  showsVerticalScrollIndicator={false}
                />
              )}

              {/* Controls */}
              {liveKit.isConnected && renderControls()}
            </>
          )}

          {/* Error Display */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <TouchableOpacity onPress={liveKit.retry}>
                <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
              </TouchableOpacity>
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
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelName: {
    fontSize: 18,
    fontWeight: '600',
  },
  serverName: {
    fontSize: 14,
    marginTop: 2,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  connectionText: {
    fontSize: 12,
  },
  backgroundIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  backgroundText: {
    fontSize: 10,
    fontWeight: '600',
  },
  participantCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
  },
  connectionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  connectingText: {
    marginTop: 16,
    fontSize: 16,
  },
  connectionCard: {
    alignItems: 'center',
  },
  connectionContent: {
    alignItems: 'center',
  },
  connectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  connectionDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  participantsList: {
    flex: 1,
  },
  participantsContent: {
    padding: 16,
    paddingBottom: 200, // Space for controls
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  participantAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  speakingIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  participantStatus: {
    fontSize: 12,
  },
  audioLevelContainer: {
    width: 20,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  audioLevelBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  audioLevelFill: {
    width: '100%',
    borderRadius: 2,
  },
  connectionIndicator: {
    width: 20,
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 16,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  primaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
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
  muteButton: {
    // Special styling for mute button handled in render
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
    marginTop: 8,
  },
  settingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  settingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disconnectText: {
    fontSize: 16,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export { EnhancedVoiceChannelScreen };
export default EnhancedVoiceChannelScreen;