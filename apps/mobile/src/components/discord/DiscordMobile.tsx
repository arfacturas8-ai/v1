import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  FlatList,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSocketStore } from '../../stores/socketStore';
import { RealApiService } from '../../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

interface Server {
  id: string;
  name: string;
  icon?: string;
  memberCount: number;
  unreadCount?: number;
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'stage';
  serverId: string;
  unreadCount?: number;
  hasNotification?: boolean;
}

interface Message {
  id: string;
  content: string;
  author: User;
  timestamp: Date;
  attachments?: any[];
  reactions?: any[];
  replyTo?: Message;
}

interface DiscordMobileProps {
  currentUser: User;
}

const DiscordMobile: React.FC<DiscordMobileProps> = ({ currentUser }) => {
  const { socket, isConnected, sendMessage } = useSocketStore();
  const [currentView, setCurrentView] = useState<'servers' | 'channels' | 'chat' | 'members'>('servers');
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [userPresence, setUserPresence] = useState<Record<string, any>>({});

  // Initialize with mock data
  useEffect(() => {
    initializeData();
    setupSocketListeners();
  }, []);

  const initializeData = async () => {
    // Mock servers data
    const mockServers: Server[] = [
      {
        id: '1',
        name: 'CRYB Community',
        icon: null,
        memberCount: 1337,
        unreadCount: 3,
      },
      {
        id: '2',
        name: 'Gaming Hub',
        icon: null,
        memberCount: 856,
        unreadCount: 0,
      },
    ];

    const mockChannels: Channel[] = [
      {
        id: '1',
        name: 'general',
        type: 'text',
        serverId: '1',
        unreadCount: 2,
        hasNotification: true,
      },
      {
        id: '2',
        name: 'announcements',
        type: 'announcement',
        serverId: '1',
        unreadCount: 0,
      },
      {
        id: '3',
        name: 'General Voice',
        type: 'voice',
        serverId: '1',
        unreadCount: 0,
      },
      {
        id: '4',
        name: 'Community Stage',
        type: 'stage',
        serverId: '1',
        unreadCount: 0,
      },
    ];

    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Welcome to CRYB Discord! 🎉',
        author: {
          id: '2',
          username: 'CRYBBot',
          status: 'online',
        },
        timestamp: new Date(),
      },
      {
        id: '2',
        content: 'Hey everyone! How is everyone doing today?',
        author: currentUser,
        timestamp: new Date(),
      },
    ];

    setServers(mockServers);
    setChannels(mockChannels);
    setMessages(mockMessages);
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    // Message events
    socket.on('message:create', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Typing events
    socket.on('typing:user_start', (data: { userId: string; username: string }) => {
      setTypingUsers(prev => [...prev.filter(u => u.id !== data.userId), {
        id: data.userId,
        username: data.username,
        status: 'online' as const,
      }]);
    });

    socket.on('typing:user_stop', (data: { userId: string }) => {
      setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    // Voice events
    socket.on('voice:state_update', (data: any) => {
      setVoiceConnected(data.channelId !== null);
      setIsMuted(data.selfMute || false);
      setIsDeafened(data.selfDeaf || false);
    });

    // Presence events
    socket.on('presence:user_update', (data: any) => {
      setUserPresence(prev => ({
        ...prev,
        [data.userId]: {
          status: data.status,
          activity: data.activities?.[0],
        },
      }));
    });

    return () => {
      socket?.off('message:create');
      socket?.off('typing:user_start');
      socket?.off('typing:user_stop');
      socket?.off('voice:state_update');
      socket?.off('presence:user_update');
    };
  };

  const sendMessageHandler = async () => {
    if (!messageInput.trim() || !selectedChannelId) return;

    const message: Message = {
      id: Date.now().toString(),
      content: messageInput,
      author: currentUser,
      timestamp: new Date(),
    };

    // Optimistic update
    setMessages(prev => [...prev, message]);
    setMessageInput('');

    // Send via socket
    if (socket && isConnected) {
      await sendMessage('message:send', {
        channelId: selectedChannelId,
        content: messageInput,
      });
    }

    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      socket?.emit('typing:stop', { channelId: selectedChannelId });
    }
  };

  const handleTyping = (text: string) => {
    setMessageInput(text);

    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      socket?.emit('typing:start', { channelId: selectedChannelId });
    }

    // Stop typing after 3 seconds of no input
    setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket?.emit('typing:stop', { channelId: selectedChannelId });
      }
    }, 3000);
  };

  const joinVoiceChannel = (channelId: string) => {
    socket?.emit('voice:state_update', {
      channelId,
      serverId: selectedServerId,
      selfMute: false,
      selfDeaf: false,
    });
    setVoiceConnected(true);
  };

  const leaveVoiceChannel = () => {
    socket?.emit('voice:state_update', {
      channelId: null,
      serverId: selectedServerId,
    });
    setVoiceConnected(false);
    setIsMuted(false);
    setIsDeafened(false);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    socket?.emit('voice:state_update', {
      channelId: selectedChannelId,
      serverId: selectedServerId,
      selfMute: newMutedState,
    });
  };

  const toggleDeafen = () => {
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);
    setIsMuted(newDeafenedState || isMuted);
    socket?.emit('voice:state_update', {
      channelId: selectedChannelId,
      serverId: selectedServerId,
      selfDeaf: newDeafenedState,
      selfMute: newDeafenedState || isMuted,
    });
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'text': return 'tag';
      case 'voice': return 'volume-up';
      case 'announcement': return 'campaign';
      case 'stage': return 'podium';
      default: return 'tag';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#43B581';
      case 'idle': return '#FAA61A';
      case 'dnd': return '#F04747';
      case 'offline': return '#747F8D';
      default: return '#747F8D';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const renderServerList = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Servers</Text>
        <TouchableOpacity onPress={() => Alert.alert('Create Server', 'Feature coming soon!')}>
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {servers.map((server) => (
          <TouchableOpacity
            key={server.id}
            style={[
              styles.serverItem,
              selectedServerId === server.id && styles.selectedItem,
            ]}
            onPress={() => {
              setSelectedServerId(server.id);
              setCurrentView('channels');
            }}
          >
            <View style={styles.serverIcon}>
              {server.icon ? (
                <Image source={{ uri: server.icon }} style={styles.serverIconImage} />
              ) : (
                <Text style={styles.serverIconText}>
                  {server.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                </Text>
              )}
            </View>
            
            <View style={styles.serverInfo}>
              <Text style={styles.serverName}>{server.name}</Text>
              <Text style={styles.serverMemberCount}>{server.memberCount} members</Text>
            </View>
            
            {server.unreadCount && server.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{server.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Icon name="home" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Icon name="explore" size={24} color="#747F8D" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => setNotificationCount(0)}
        >
          <Icon name="notifications" size={24} color="#747F8D" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Icon name="person" size={24} color="#747F8D" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChannelList = () => {
    const selectedServer = servers.find(s => s.id === selectedServerId);
    const serverChannels = channels.filter(c => c.serverId === selectedServerId);
    
    const textChannels = serverChannels.filter(c => c.type === 'text');
    const voiceChannels = serverChannels.filter(c => c.type === 'voice');
    const announcementChannels = serverChannels.filter(c => c.type === 'announcement');
    const stageChannels = serverChannels.filter(c => c.type === 'stage');

    const renderChannelSection = (title: string, channels: Channel[]) => {
      if (channels.length === 0) return null;

      return (
        <View style={styles.channelSection}>
          <Text style={styles.channelSectionTitle}>{title}</Text>
          {channels.map((channel) => (
            <TouchableOpacity
              key={channel.id}
              style={[
                styles.channelItem,
                selectedChannelId === channel.id && styles.selectedItem,
              ]}
              onPress={() => {
                setSelectedChannelId(channel.id);
                setCurrentView('chat');
              }}
            >
              <Icon 
                name={getChannelIcon(channel.type)} 
                size={20} 
                color="#B9BBBE" 
              />
              <Text style={styles.channelName}>{channel.name}</Text>
              
              {channel.unreadCount && channel.unreadCount > 0 && (
                <View style={styles.channelUnreadBadge}>
                  <Text style={styles.channelUnreadBadgeText}>{channel.unreadCount}</Text>
                </View>
              )}
              
              {channel.hasNotification && (
                <View style={styles.notificationDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentView('servers')}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedServer?.name}</Text>
          <TouchableOpacity onPress={() => setCurrentView('members')}>
            <Icon name="people" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {renderChannelSection('TEXT CHANNELS', textChannels)}
          {renderChannelSection('VOICE CHANNELS', voiceChannels)}
          {renderChannelSection('ANNOUNCEMENTS', announcementChannels)}
          {renderChannelSection('STAGE CHANNELS', stageChannels)}
        </ScrollView>

        {/* Voice connection status */}
        {voiceConnected && (
          <View style={styles.voiceStatus}>
            <View style={styles.voiceInfo}>
              <Icon name="volume-up" size={16} color="#43B581" />
              <Text style={styles.voiceText}>Connected to voice</Text>
            </View>
            <View style={styles.voiceControls}>
              <TouchableOpacity 
                style={[styles.voiceButton, isMuted && styles.voiceButtonMuted]}
                onPress={toggleMute}
              >
                <Icon name={isMuted ? 'mic-off' : 'mic'} size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.voiceButton, isDeafened && styles.voiceButtonMuted]}
                onPress={toggleDeafen}
              >
                <Icon name={isDeafened ? 'volume-off' : 'volume-up'} size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.voiceButton, styles.voiceButtonLeave]}
                onPress={leaveVoiceChannel}
              >
                <Icon name="call-end" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderChat = () => {
    const selectedChannel = channels.find(c => c.id === selectedChannelId);
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentView('channels')}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.channelHeader}>
            <Icon name={getChannelIcon(selectedChannel?.type || 'text')} size={20} color="#B9BBBE" />
            <Text style={styles.headerTitle}>{selectedChannel?.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowSlashCommands(true)}>
              <Icon name="code" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentView('members')}>
              <Icon name="people" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          renderItem={({ item: message }) => (
            <View style={styles.messageItem}>
              <View style={styles.messageHeader}>
                <View style={[
                  styles.userStatusDot,
                  { backgroundColor: getStatusColor(message.author.status) }
                ]} />
                <Text style={styles.messageAuthor}>
                  {message.author.displayName || message.author.username}
                </Text>
                <Text style={styles.messageTimestamp}>
                  {formatTimestamp(message.timestamp)}
                </Text>
              </View>
              
              {message.replyTo && (
                <View style={styles.replyPreview}>
                  <Text style={styles.replyText}>
                    Replying to {message.replyTo.author.username}: {message.replyTo.content}
                  </Text>
                </View>
              )}
              
              <Text style={styles.messageContent}>{message.content}</Text>
              
              {message.reactions && message.reactions.length > 0 && (
                <View style={styles.reactions}>
                  {message.reactions.map((reaction, index) => (
                    <TouchableOpacity key={index} style={styles.reactionButton}>
                      <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                      <Text style={styles.reactionCount}>{reaction.count}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        />

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Text>
          </View>
        )}

        {/* Message input */}
        <View style={styles.messageInput}>
          <TouchableOpacity onPress={() => setShowEmojiPicker(true)}>
            <Icon name="emoji-emotions" size={24} color="#B9BBBE" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageTextInput}
            placeholder={`Message #${selectedChannel?.name}`}
            placeholderTextColor="#72767D"
            value={messageInput}
            onChangeText={handleTyping}
            multiline
          />
          
          <TouchableOpacity onPress={sendMessageHandler}>
            <Icon name="send" size={24} color="#5865F2" />
          </TouchableOpacity>
        </View>

        {/* Voice channel quick access */}
        {selectedChannel?.type === 'voice' && !voiceConnected && (
          <TouchableOpacity
            style={styles.voiceJoinButton}
            onPress={() => joinVoiceChannel(selectedChannelId!)}
          >
            <Icon name="volume-up" size={20} color="#FFFFFF" />
            <Text style={styles.voiceJoinText}>Join Voice Channel</Text>
          </TouchableOpacity>
        )}

        {/* Slash commands modal */}
        <Modal
          visible={showSlashCommands}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.slashCommandsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Slash Commands</Text>
                <TouchableOpacity onPress={() => setShowSlashCommands(false)}>
                  <Icon name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <TouchableOpacity style={styles.commandItem}>
                  <Text style={styles.commandName}>/nick</Text>
                  <Text style={styles.commandDescription}>Change your nickname</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.commandItem}>
                  <Text style={styles.commandName}>/poll</Text>
                  <Text style={styles.commandDescription}>Create a poll</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.commandItem}>
                  <Text style={styles.commandName}>/remind</Text>
                  <Text style={styles.commandDescription}>Set a reminder</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderMembers = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentView(selectedChannelId ? 'chat' : 'channels')}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.memberSection}>
          <Text style={styles.memberSectionTitle}>ONLINE — {members.filter(m => m.status === 'online').length}</Text>
          {members.filter(m => m.status === 'online').map((member) => (
            <TouchableOpacity key={member.id} style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                {member.avatar ? (
                  <Image source={{ uri: member.avatar }} style={styles.memberAvatarImage} />
                ) : (
                  <Text style={styles.memberAvatarText}>
                    {(member.displayName || member.username).charAt(0).toUpperCase()}
                  </Text>
                )}
                <View style={[
                  styles.memberStatusDot,
                  { backgroundColor: getStatusColor(member.status) }
                ]} />
              </View>
              
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.displayName || member.username}
                </Text>
                {userPresence[member.id]?.activity && (
                  <Text style={styles.memberActivity}>
                    Playing {userPresence[member.id].activity.name}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.memberSection}>
          <Text style={styles.memberSectionTitle}>OFFLINE — {members.filter(m => m.status === 'offline').length}</Text>
          {members.filter(m => m.status === 'offline').map((member) => (
            <TouchableOpacity key={member.id} style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                {member.avatar ? (
                  <Image source={{ uri: member.avatar }} style={[styles.memberAvatarImage, styles.offlineAvatar]} />
                ) : (
                  <Text style={[styles.memberAvatarText, styles.offlineText]}>
                    {(member.displayName || member.username).charAt(0).toUpperCase()}
                  </Text>
                )}
                <View style={[
                  styles.memberStatusDot,
                  { backgroundColor: getStatusColor(member.status) }
                ]} />
              </View>
              
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, styles.offlineText]}>
                  {member.displayName || member.username}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'servers':
        return renderServerList();
      case 'channels':
        return renderChannelList();
      case 'chat':
        return renderChat();
      case 'members':
        return renderMembers();
      default:
        return renderServerList();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2F3136" />
      {renderCurrentView()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2F3136',
  },
  container: {
    flex: 1,
    backgroundColor: '#2F3136',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#36393F',
    borderBottomWidth: 1,
    borderBottomColor: '#202225',
  },
  headerTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  
  // Server List Styles
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#36393F',
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: '#5865F2',
  },
  serverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5865F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  serverIconImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  serverIconText: {
    color: '#FFFFFF',
    fontSize: typography.h6,
    fontWeight: '600',
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  serverMemberCount: {
    fontSize: typography.caption,
    color: '#B9BBBE',
  },
  unreadBadge: {
    backgroundColor: '#F04747',
    borderRadius: deviceInfo.isTablet ? 12 : 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.caption,
    fontWeight: '600',
  },
  
  // Channel List Styles
  channelSection: {
    marginBottom: spacing.xxl,
  },
  channelSectionTitle: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: '#B9BBBE',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 4,
    marginBottom: 2,
  },
  channelName: {
    fontSize: typography.body1,
    color: '#B9BBBE',
    marginLeft: spacing.md,
    flex: 1,
  },
  channelUnreadBadge: {
    backgroundColor: '#F04747',
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  channelUnreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F04747',
    marginLeft: spacing.sm,
  },
  
  // Chat Styles
  messagesList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  messageItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#40444B',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  messageAuthor: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: spacing.sm,
  },
  messageTimestamp: {
    fontSize: typography.caption,
    color: '#72767D',
  },
  replyPreview: {
    backgroundColor: '#40444B',
    padding: spacing.sm,
    borderRadius: 4,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: '#B9BBBE',
  },
  replyText: {
    fontSize: typography.caption,
    color: '#B9BBBE',
  },
  messageContent: {
    fontSize: typography.body1,
    color: '#DCDDDE',
    lineHeight: 22,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40444B',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: spacing.xs,
  },
  reactionEmoji: {
    fontSize: typography.body2,
    marginRight: spacing.xs,
  },
  reactionCount: {
    fontSize: typography.caption,
    color: '#B9BBBE',
    fontWeight: '600',
  },
  
  // Typing Indicator
  typingIndicator: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#40444B',
  },
  typingText: {
    fontSize: typography.caption,
    color: '#B9BBBE',
    fontStyle: 'italic',
  },
  
  // Message Input
  messageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#40444B',
    borderTopWidth: 1,
    borderTopColor: '#202225',
  },
  messageTextInput: {
    flex: 1,
    backgroundColor: '#36393F',
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    color: '#DCDDDE',
    fontSize: typography.body1,
    maxHeight: 100,
  },
  
  // Voice Components
  voiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#43B581',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  voiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceText: {
    color: '#FFFFFF',
    fontSize: typography.body2,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  voiceControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  voiceButtonMuted: {
    backgroundColor: '#F04747',
  },
  voiceButtonLeave: {
    backgroundColor: '#F04747',
  },
  voiceJoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43B581',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  voiceJoinText: {
    color: '#FFFFFF',
    fontSize: typography.body1,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  
  // Members List
  memberSection: {
    marginBottom: spacing.xxl,
  },
  memberSectionTitle: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: '#B9BBBE',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5865F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  memberAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: typography.body2,
    fontWeight: '600',
  },
  offlineAvatar: {
    opacity: 0.5,
  },
  offlineText: {
    opacity: 0.5,
  },
  memberStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderWidth: 2,
    borderColor: '#2F3136',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.body1,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  memberActivity: {
    fontSize: typography.caption,
    color: '#B9BBBE',
    marginTop: 2,
  },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#202225',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#40444B',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: '40%',
    backgroundColor: '#F04747',
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  slashCommandsModal: {
    backgroundColor: '#36393F',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#40444B',
  },
  modalTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    padding: spacing.lg,
  },
  commandItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#40444B',
  },
  commandName: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#5865F2',
    marginBottom: spacing.xs,
  },
  commandDescription: {
    fontSize: typography.body2,
    color: '#B9BBBE',
  },
});

export default DiscordMobile;