/**
 * VOICE CHANNEL SCREEN
 * Real-time voice chat with live participants, controls, and visual feedback
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
  Vibration,
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
import { apiService } from '../../services/ApiService';
import { useAuthStore } from '../../stores/authStore';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import webrtcService from '../../services/WebRTCService';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

type VoiceChannelScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type VoiceChannelScreenRouteProp = RouteProp<MainStackParamList, 'VoiceChannel'>;

interface VoiceParticipant {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAt: string;
  isConnected: boolean;
  audioLevel: number; // 0-1
  role?: 'owner' | 'moderator' | 'member';
}

interface VoiceChannel {
  id: string;
  name: string;
  serverId?: string;
  serverName?: string;
  type: 'voice' | 'stage';
  maxParticipants: number;
  currentParticipants: number;
  isLocked: boolean;
  requiresPermission: boolean;
  quality: 'low' | 'medium' | 'high';
}

interface VoiceState {
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  latency: number; // ms
}

const VoiceChannelScreen: React.FC = () => {
  const navigation = useNavigation<VoiceChannelScreenNavigationProp>();
  const route = useRoute<VoiceChannelScreenRouteProp>();
  const { colors, spacing } = useTheme();
  const { isConnected } = useNetworkContext();
  const { user } = useAuthStore();

  const { channelId, channelName, serverId } = route.params;

  const [channel, setChannel] = useState<VoiceChannel | null>(null);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    audioLevel: 0,
    connectionQuality: 'good',
    latency: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const speakingAnims = useRef<Map<string, Animated.Value>>(new Map()).current;

  // Audio level animation
  const audioLevelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadChannelData();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Setup WebRTC event listeners
    const handleParticipantConnected = (participant: VoiceParticipant) => {
      setParticipants(prev => [...prev, participant]);
    };

    const handleParticipantDisconnected = (participantId: string) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    };

    const handleAudioLevelChanged = ({ participantId, level }: { participantId: string; level: number }) => {
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, audioLevel: level, isSpeaking: level > 0.1 } : p
      ));
    };

    const handleConnectionQualityChanged = ({ participantId, quality }: any) => {
      // Update connection quality for the participant
      if (participantId === user?.id) {
        setVoiceState(prev => ({ ...prev, connectionQuality: quality }));
      }
    };

    webrtcService.on('participantConnected', handleParticipantConnected);
    webrtcService.on('participantDisconnected', handleParticipantDisconnected);
    webrtcService.on('audioLevelChanged', handleAudioLevelChanged);
    webrtcService.on('connectionQualityChanged', handleConnectionQualityChanged);

    return () => {
      // Cleanup voice connection when leaving
      handleDisconnect();
      
      // Remove event listeners
      webrtcService.off('participantConnected', handleParticipantConnected);
      webrtcService.off('participantDisconnected', handleParticipantDisconnected);
      webrtcService.off('audioLevelChanged', handleAudioLevelChanged);
      webrtcService.off('connectionQualityChanged', handleConnectionQualityChanged);
    };
  }, []);

  // Focus effect to handle app state changes
  useFocusEffect(
    useCallback(() => {
      if (voiceState.isConnected) {
        // Resume voice connection
        console.log('Resuming voice connection');
      }
      
      return () => {
        // Pause voice connection when losing focus
        if (voiceState.isConnected) {
          console.log('Pausing voice connection');
        }
      };
    }, [voiceState.isConnected])
  );

  // Speaking animation effect
  useEffect(() => {
    if (voiceState.isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [voiceState.isSpeaking]);

  // Audio level animation effect
  useEffect(() => {
    Animated.timing(audioLevelAnim, {
      toValue: voiceState.audioLevel,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [voiceState.audioLevel]);

  const loadChannelData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch actual channel data from API
      const channelData = await apiService.voice.getChannel(channelId);
      
      const channelInfo: VoiceChannel = {
        id: channelData.id,
        name: channelData.name,
        serverId: channelData.serverId,
        serverName: channelData.serverName,
        type: channelData.type || 'voice',
        maxParticipants: channelData.maxParticipants || 50,
        currentParticipants: channelData.participants?.length || 0,
        isLocked: channelData.isLocked || false,
        requiresPermission: channelData.requiresPermission || false,
        quality: channelData.quality || 'high',
      };

      // Fetch current participants from API
      const participantsData = await apiService.voice.getParticipants(channelId);
      
      const participants: VoiceParticipant[] = participantsData.map((p: any) => ({
        id: p.id,
        username: p.username,
        displayName: p.displayName || p.username,
        avatar: p.avatar,
        isMuted: p.isMuted || false,
        isDeafened: p.isDeafened || false,
        isSpeaking: p.isSpeaking || false,
        joinedAt: p.joinedAt,
        isConnected: p.isConnected || true,
        audioLevel: p.audioLevel || 0,
        role: p.role || 'member',
      }));

      // Add current user if connected
      if (voiceState.isConnected && user) {
        const currentUserParticipant: VoiceParticipant = {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          avatar: user.avatarUrl,
          isMuted: voiceState.isMuted,
          isDeafened: voiceState.isDeafened,
          isSpeaking: voiceState.isSpeaking,
          joinedAt: new Date().toISOString(),
          isConnected: voiceState.isConnected,
          audioLevel: voiceState.audioLevel,
          role: 'member',
        };
        
        // Only add if not already in list
        if (!participants.find(p => p.id === user.id)) {
          participants.push(currentUserParticipant);
        }
      }

      setChannel(channelInfo);
      setParticipants(participants);
    } catch (error) {
      console.error('Failed to load channel data:', error);
      setError('Failed to load voice channel');
    } finally {
      setIsLoading(false);
    }
  }, [channelId, channelName, serverId, user, voiceState]);

  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Connect to voice channel using WebRTC
      await webrtcService.connectToChannel({
        id: channelId,
        name: channelName,
        serverId: serverId,
        maxParticipants: channel?.maxParticipants || 50,
      });

      // Update voice state
      setVoiceState(prev => ({
        ...prev,
        isConnected: true,
        connectionQuality: 'good',
        latency: 20,
      }));

      // Get participants from WebRTC
      const rtcParticipants = webrtcService.getParticipants();
      setParticipants(rtcParticipants);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to connect to voice channel:', error);
      setError('Failed to connect to voice channel');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      // Disconnect from WebRTC
      await webrtcService.disconnect();
      
      setVoiceState(prev => ({
        ...prev,
        isConnected: false,
        isSpeaking: false,
        audioLevel: 0,
      }));

      // Navigate back
      navigation.goBack();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to disconnect from voice channel:', error);
    }
  }, [navigation]);

  const handleToggleMute = useCallback(async () => {
    try {
      await webrtcService.toggleMute();
      const isMuted = webrtcService.getIsMuted();
      
      setVoiceState(prev => ({
        ...prev,
        isMuted,
        isSpeaking: isMuted ? false : prev.isSpeaking,
      }));
      
      // Haptic feedback
      if (isMuted) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  }, []);

  const handleToggleDeafen = useCallback(async () => {
    try {
      const newDeafened = !voiceState.isDeafened;
      await webrtcService.setDeafened(newDeafened);
      
      setVoiceState(prev => ({
        ...prev,
        isDeafened: newDeafened,
        isMuted: newDeafened ? true : prev.isMuted, // Auto-mute when deafened
      }));
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to toggle deafen:', error);
    }
  }, [voiceState.isDeafened]);

  const handleVideoCall = useCallback(() => {
    navigation.navigate('VideoCall', {
      channelId,
      channelName,
      participants: participants.filter(p => p.isConnected),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [navigation, channelId, channelName, participants]);

  const handleParticipantAction = useCallback((participant: VoiceParticipant, action: 'mute' | 'kick' | 'info') => {
    Alert.alert(
      participant.displayName,
      `Choose an action for ${participant.displayName}`,
      [
        {
          text: 'View Profile',
          onPress: () => {
            // TODO: Navigate to user profile
            console.log('View profile:', participant.id);
          },
        },
        {
          text: 'Private Message',
          onPress: () => {
            // TODO: Open DM
            console.log('Send DM to:', participant.id);
          },
        },
        ...(user?.id !== participant.id ? [
          {
            text: participant.isMuted ? 'Unmute' : 'Mute',
            onPress: () => {
              // TODO: Implement participant mute/unmute
              console.log(participant.isMuted ? 'Unmute' : 'Mute', participant.id);
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

  const getConnectionQualityColor = useCallback((quality: VoiceState['connectionQuality']) => {
    switch (quality) {
      case 'poor': return colors.error;
      case 'fair': return colors.warning;
      case 'good': return colors.success;
      case 'excellent': return colors.primary;
      default: return colors.textSecondary;
    }
  }, [colors]);

  const getConnectionQualityIcon = useCallback((quality: VoiceState['connectionQuality']) => {
    switch (quality) {
      case 'poor': return 'signal-cellular-1-bar';
      case 'fair': return 'signal-cellular-2-bar';
      case 'good': return 'signal-cellular-3-bar';
      case 'excellent': return 'signal-cellular-4-bar';
      default: return 'signal-cellular-off';
    }
  }, []);

  const renderParticipant = useCallback(({ item: participant }: { item: VoiceParticipant }) => {
    const isCurrentUser = participant.id === user?.id;
    
    // Get or create speaking animation for this participant
    if (!speakingAnims.has(participant.id)) {
      speakingAnims.set(participant.id, new Animated.Value(1));
    }
    const speakingAnim = speakingAnims.get(participant.id)!;

    // Animate speaking state
    useEffect(() => {
      if (participant.isSpeaking) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(speakingAnim, {
              toValue: 1.1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(speakingAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        speakingAnim.setValue(1);
      }
    }, [participant.isSpeaking, speakingAnim]);

    return (
      <TouchableOpacity
        style={[
          styles.participantItem,
          { backgroundColor: colors.cardBackground },
          isCurrentUser && { backgroundColor: colors.primary + '10' }
        ]}
        onPress={() => handleParticipantAction(participant, 'info')}
        disabled={!voiceState.isConnected}
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
            source={participant.avatar}
            name={participant.displayName}
            showOnlineStatus={false}
          />
          
          {/* Speaking indicator */}
          {participant.isSpeaking && (
            <View style={[styles.speakingIndicator, { backgroundColor: colors.success }]}>
              <Ionicons name="mic" size={12} color={colors.textInverse} />
            </View>
          )}

          {/* Muted indicator */}
          {participant.isMuted && (
            <View style={[styles.mutedIndicator, { backgroundColor: colors.error }]}>
              <Ionicons name="mic-off" size={12} color={colors.textInverse} />
            </View>
          )}

          {/* Deafened indicator */}
          {participant.isDeafened && (
            <View style={[styles.deafenedIndicator, { backgroundColor: colors.warning }]}>
              <Ionicons name="volume-mute" size={12} color={colors.textInverse} />
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
            {participant.displayName}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={[styles.participantStatus, { color: colors.textSecondary }]}>
            {participant.isMuted ? 'Muted' : participant.isSpeaking ? 'Speaking' : 'Connected'}
          </Text>
        </View>

        {/* Audio level indicator */}
        <View style={styles.audioLevelContainer}>
          <View style={[styles.audioLevelBar, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.audioLevelFill,
                {
                  backgroundColor: getConnectionQualityColor('good'),
                  height: `${participant.audioLevel * 100}%`,
                }
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [user, colors, speakingAnims, voiceState.isConnected, handleParticipantAction, getConnectionQualityColor]);

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
        
        {voiceState.isConnected && (
          <View style={styles.connectionInfo}>
            <Ionicons 
              name={getConnectionQualityIcon(voiceState.connectionQuality)} 
              size={16} 
              color={getConnectionQualityColor(voiceState.connectionQuality)} 
            />
            <Text style={[styles.connectionText, { color: colors.textSecondary }]}>
              {voiceState.connectionQuality} • {voiceState.latency}ms
            </Text>
          </View>
        )}
      </View>

      <View style={styles.participantCount}>
        <Ionicons name="people" size={16} color={colors.textSecondary} />
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {participants.filter(p => p.isConnected).length}/{channel?.maxParticipants || 10}
        </Text>
      </View>
    </View>
  ), [channel, colors, voiceState, participants, getConnectionQualityIcon, getConnectionQualityColor]);

  const renderControls = useCallback(() => (
    <View style={[styles.controls, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.primaryControls}>
        {/* Mute Button */}
        <Animated.View style={{ transform: [{ scale: voiceState.isMuted ? 1.1 : 1 }] }}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.muteButton,
              { backgroundColor: voiceState.isMuted ? colors.error : colors.background },
            ]}
            onPress={handleToggleMute}
            disabled={!voiceState.isConnected}
          >
            <Ionicons
              name={voiceState.isMuted ? 'mic-off' : 'mic'}
              size={24}
              color={voiceState.isMuted ? colors.textInverse : colors.text}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Deafen Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: voiceState.isDeafened ? colors.warning : colors.background },
          ]}
          onPress={handleToggleDeafen}
          disabled={!voiceState.isConnected}
        >
          <Ionicons
            name={voiceState.isDeafened ? 'volume-mute' : 'volume-high'}
            size={24}
            color={voiceState.isDeafened ? colors.textInverse : colors.text}
          />
        </TouchableOpacity>

        {/* Video Call Button */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.background }]}
          onPress={handleVideoCall}
          disabled={!voiceState.isConnected}
        >
          <Ionicons name="videocam" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.background }]}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Ionicons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

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
  ), [colors, voiceState, handleToggleMute, handleToggleDeafen, handleVideoCall, handleDisconnect, showSettings]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading voice channel...
          </Text>
        </View>
      </SafeAreaView>
    );
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
          {!voiceState.isConnected ? (
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
                    loading={isConnecting}
                    style={{ marginTop: spacing.lg }}
                    icon={<Ionicons name="call" size={20} color={colors.textInverse} />}
                  />
                </View>
              </Card>
            </View>
          ) : (
            <>
              {/* Participants List */}
              <FlatList
                data={participants.filter(p => p.isConnected)}
                renderItem={renderParticipant}
                keyExtractor={(item) => item.id}
                style={styles.participantsList}
                contentContainerStyle={styles.participantsContent}
                showsVerticalScrollIndicator={false}
              />

              {/* Controls */}
              {renderControls()}
            </>
          )}

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <TouchableOpacity onPress={loadChannelData}>
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
    paddingBottom: 120,
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
  deafenedIndicator: {
    position: 'absolute',
    top: -2,
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
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 16,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  primaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  muteButton: {
    // Special styling for mute button handled in render
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

export { VoiceChannelScreen };