// Core entity types
export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  email: string;
  status: UserStatus;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
  roles: UserRole[];
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  ownerId: string;
  isPublic: boolean;
  memberCount: number;
  createdAt: Date;
  channels: Channel[];
  roles: Role[];
  members: ServerMember[];
  inviteCode?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  serverId: string;
  categoryId?: string;
  position: number;
  isNsfw: boolean;
  slowModeDelay?: number;
  userLimit?: number; // For voice channels
  bitrate?: number; // For voice channels
  createdAt: Date;
  permissions: ChannelPermission[];
  lastMessageId?: string;
  lastMessageAt?: Date;
}

export interface ChannelCategory {
  id: string;
  name: string;
  serverId: string;
  position: number;
  channels: Channel[];
  permissions: CategoryPermission[];
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  author: User;
  channelId: string;
  serverId?: string;
  type: MessageType;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt?: Date;
  attachments: Attachment[];
  embeds: Embed[];
  reactions: Reaction[];
  mentions: MessageMention[];
  replyTo?: Message;
  threadId?: string;
}

export interface DirectMessage {
  id: string;
  content: string;
  authorId: string;
  author: User;
  recipientId: string;
  recipient: User;
  type: MessageType;
  isEdited: boolean;
  createdAt: Date;
  updatedAt?: Date;
  attachments: Attachment[];
  reactions: Reaction[];
  isRead: boolean;
}

export interface ServerMember {
  id: string;
  userId: string;
  user: User;
  serverId: string;
  nickname?: string;
  joinedAt: Date;
  roles: Role[];
  permissions: Permission[];
  isMuted: boolean;
  isDeafened: boolean;
  mutedUntil?: Date;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  serverId: string;
  position: number;
  permissions: Permission[];
  isHoisted: boolean;
  isMentionable: boolean;
  isDefault: boolean;
  memberCount: number;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  proxyUrl: string;
  size: number;
  contentType: string;
  width?: number;
  height?: number;
  description?: string;
}

export interface Embed {
  id: string;
  title?: string;
  description?: string;
  url?: string;
  timestamp?: Date;
  color?: string;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  author?: EmbedAuthor;
  fields: EmbedField[];
}

export interface EmbedFooter {
  text: string;
  iconUrl?: string;
}

export interface EmbedImage {
  url: string;
  proxyUrl?: string;
  width?: number;
  height?: number;
}

export interface EmbedThumbnail {
  url: string;
  proxyUrl?: string;
  width?: number;
  height?: number;
}

export interface EmbedAuthor {
  name: string;
  url?: string;
  iconUrl?: string;
}

export interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface Reaction {
  id: string;
  emoji: string;
  count: number;
  users: User[];
  messageId: string;
}

export interface MessageMention {
  id: string;
  userId: string;
  user: User;
  messageId: string;
  type: MentionType;
}

export interface VoiceState {
  userId: string;
  channelId?: string;
  serverId?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSelfMuted: boolean;
  isSelfDeafened: boolean;
  isStreaming: boolean;
  isVideoEnabled: boolean;
  joinedAt: Date;
}

// Server-side voice state (from backend)
export interface ServerVoiceState {
  userId: string;
  channelId: string;
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
  joinedAt: Date;
}

// Presence data
export interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'invisible';
  activity?: string;
  lastSeen: Date;
  deviceType?: 'web' | 'mobile' | 'desktop';
}

// Enums
export enum UserStatus {
  ONLINE = 'online',
  IDLE = 'idle',
  DND = 'dnd',
  INVISIBLE = 'invisible',
  OFFLINE = 'offline'
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  OWNER = 'owner'
}

export enum ChannelType {
  TEXT = 'text',
  VOICE = 'voice',
  CATEGORY = 'category',
  ANNOUNCEMENT = 'announcement',
  STAGE_VOICE = 'stage_voice',
  THREAD = 'thread'
}

export enum MessageType {
  DEFAULT = 'default',
  RECIPIENT_ADD = 'recipient_add',
  RECIPIENT_REMOVE = 'recipient_remove',
  CALL = 'call',
  CHANNEL_NAME_CHANGE = 'channel_name_change',
  CHANNEL_ICON_CHANGE = 'channel_icon_change',
  CHANNEL_PINNED_MESSAGE = 'channel_pinned_message',
  GUILD_MEMBER_JOIN = 'guild_member_join',
  SYSTEM = 'system'
}

export enum MentionType {
  USER = 'user',
  ROLE = 'role',
  CHANNEL = 'channel',
  EVERYONE = 'everyone',
  HERE = 'here'
}

export enum Permission {
  // General permissions
  VIEW_CHANNELS = 'view_channels',
  MANAGE_CHANNELS = 'manage_channels',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_GUILD = 'manage_guild',
  CREATE_INSTANT_INVITE = 'create_instant_invite',
  CHANGE_NICKNAME = 'change_nickname',
  MANAGE_NICKNAMES = 'manage_nicknames',
  KICK_MEMBERS = 'kick_members',
  BAN_MEMBERS = 'ban_members',
  ADMINISTRATOR = 'administrator',
  
  // Text channel permissions
  SEND_MESSAGES = 'send_messages',
  EMBED_LINKS = 'embed_links',
  ATTACH_FILES = 'attach_files',
  ADD_REACTIONS = 'add_reactions',
  USE_EXTERNAL_EMOJIS = 'use_external_emojis',
  MENTION_EVERYONE = 'mention_everyone',
  MANAGE_MESSAGES = 'manage_messages',
  READ_MESSAGE_HISTORY = 'read_message_history',
  SEND_TTS_MESSAGES = 'send_tts_messages',
  USE_SLASH_COMMANDS = 'use_slash_commands',
  
  // Voice channel permissions
  CONNECT = 'connect',
  SPEAK = 'speak',
  MUTE_MEMBERS = 'mute_members',
  DEAFEN_MEMBERS = 'deafen_members',
  MOVE_MEMBERS = 'move_members',
  USE_VAD = 'use_vad',
  PRIORITY_SPEAKER = 'priority_speaker',
  STREAM = 'stream',
  USE_VIDEO = 'use_video'
}

export interface ChannelPermission {
  id: string;
  channelId: string;
  targetId: string; // User or Role ID
  targetType: 'user' | 'role';
  allow: Permission[];
  deny: Permission[];
}

export interface CategoryPermission {
  id: string;
  categoryId: string;
  targetId: string; // User or Role ID
  targetType: 'user' | 'role';
  allow: Permission[];
  deny: Permission[];
}

// UI State types
export interface ChatState {
  selectedServerId?: string;
  selectedChannelId?: string;
  selectedDmUserId?: string;
  messages: Record<string, Message[]>;
  directMessages: Record<string, DirectMessage[]>;
  isTyping: Record<string, string[]>; // channelId -> userIds
  messageCache: Record<string, Message>;
  scrollPositions: Record<string, number>;
}

export interface VoiceState {
  currentChannelId?: string;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  participants: VoiceParticipant[];
}

export interface VoiceParticipant {
  userId: string;
  user: User;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  volume: number;
}

export interface UIState {
  sidebarCollapsed: boolean;
  userListCollapsed: boolean;
  activeModal?: string;
  activeOverlay?: string;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  serverId?: string;
  channelId?: string;
}

export enum NotificationType {
  MESSAGE = 'message',
  MENTION = 'mention',
  FRIEND_REQUEST = 'friend_request',
  SERVER_INVITE = 'server_invite',
  SYSTEM = 'system'
}

// Socket event types - matching server implementation
export interface SocketEvents {
  // Connection
  connect: () => void;
  disconnect: () => void;
  error: (error: any) => void;
  auth_error: (error: any) => void;
  ping: () => void;
  pong: () => void;
  
  // Server events
  'join-server': (data: { serverId: string }) => void;
  'leave-server': (data: { serverId: string }) => void;
  'joined-server': (data: { serverId: string }) => void;
  'left-server': (data: { serverId: string }) => void;
  'server-state': (data: any) => void;
  'server-updated': (data: any) => void;
  'server-settings-update': (data: { serverId: string; settings: any }) => void;
  
  // Channel events
  'join-channel': (data: { channelId: string }) => void;
  'leave-channel': (data: { channelId: string }) => void;
  'joined-channel': (data: { channelId: string }) => void;
  'left-channel': (data: { channelId: string }) => void;
  'channel-history': (data: { channelId: string; messages: Message[] }) => void;
  'channel-updated': (data: any) => void;
  'channel-settings-update': (data: { channelId: string; settings: any }) => void;
  'user-joined-channel': (data: { userId: string; username: string; displayName: string }) => void;
  'user-left-channel': (data: { userId: string }) => void;
  
  // Messages
  'send-message': (data: { channelId: string; content: string; replyToId?: string; attachments?: any[]; embeds?: any[] }) => void;
  'new-message': (message: Message) => void;
  'edit-message': (data: { messageId: string; content: string }) => void;
  'message-updated': (message: Message) => void;
  'delete-message': (data: { messageId: string }) => void;
  'message-deleted': (data: { messageId: string; channelId: string; deletedBy: string }) => void;
  
  // Direct messages
  'create-dm': (data: { userId: string }) => void;
  'dm-created': (data: { channelId: string; recipientId: string }) => void;
  'send-dm': (data: { recipientId: string; content: string; attachments?: string[] }) => void;
  'new-dm': (dm: any) => void;
  'dm-sent': (dm: any) => void;
  
  // Typing indicators
  typing: (data: { channelId: string }) => void;
  'stop-typing': (data: { channelId: string }) => void;
  'user-typing': (data: { userId: string; username: string; displayName: string; channelId: string }) => void;
  'user-stop-typing': (data: { userId: string; channelId: string }) => void;
  
  // Voice events
  'join-voice': (data: { channelId: string }) => void;
  'leave-voice': () => void;
  'user-joined-voice': (data: { userId: string; username: string; displayName: string; voiceState: any }) => void;
  'user-left-voice': (data: { userId: string; channelId: string }) => void;
  'left-voice': (data: { channelId: string }) => void;
  'voice-state-update': (data: any) => void;
  
  // Presence
  'update-presence': (data: { status: string; activity?: string }) => void;
  'get-presence': (data: { userIds: string[] }) => void;
  'presence-update': (data: { userId: string; status: string; activity?: string; lastSeen: Date }) => void;
  'presence-data': (data: any[]) => void;
  
  // Moderation
  'kick-member': (data: { serverId: string; userId: string; reason?: string }) => void;
  'ban-member': (data: { serverId: string; userId: string; reason?: string }) => void;
  'kicked-from-server': (data: { serverId: string; reason?: string; moderator: string }) => void;
  'banned-from-server': (data: { serverId: string; reason?: string; moderator: string }) => void;
  'member-kicked': (data: { userId: string; serverId: string; moderator: string; reason?: string }) => void;
  'member-banned': (data: { userId: string; serverId: string; moderator: string; reason?: string }) => void;
  
  // Mentions and notifications
  mentioned: (data: { messageId: string; channelId: string; mentionedBy: string }) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form types
export interface CreateServerForm {
  name: string;
  description?: string;
  icon?: File;
  isPublic: boolean;
}

export interface CreateChannelForm {
  name: string;
  description?: string;
  type: ChannelType;
  categoryId?: string;
  isNsfw?: boolean;
  slowModeDelay?: number;
  userLimit?: number;
}

export interface SendMessageForm {
  content: string;
  attachments?: File[];
  replyTo?: string;
}

export interface UserProfileForm {
  username?: string;
  displayName?: string;
  avatar?: File;
  status?: UserStatus;
}