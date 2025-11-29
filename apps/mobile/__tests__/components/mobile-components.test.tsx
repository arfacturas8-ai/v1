import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';

// Mock React Native components
const MobilePostCard = ({ post, onVote, onComment, onShare }: any) => (
  <View testID="mobile-post-card">
    <View testID="post-header">
      <Text testID="post-author">{post.author}</Text>
      <Text testID="post-community">r/{post.community}</Text>
      <Text testID="post-timestamp">{post.timestamp}</Text>
    </View>
    
    <Text testID="post-title">{post.title}</Text>
    {post.content && <Text testID="post-content">{post.content}</Text>}
    
    {post.imageUrl && (
      <Image 
        testID="post-image" 
        source={{ uri: post.imageUrl }} 
        style={{ width: 300, height: 200 }}
      />
    )}

    <View testID="post-actions">
      <TouchableOpacity 
        testID="upvote-button"
        onPress={() => onVote(post.id, 'upvote')}
        style={{ backgroundColor: post.userVote === 'upvote' ? 'orange' : 'gray' }}
      >
        <Text>↑ {post.upvotes}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        testID="downvote-button"
        onPress={() => onVote(post.id, 'downvote')}
        style={{ backgroundColor: post.userVote === 'downvote' ? 'blue' : 'gray' }}
      >
        <Text>↓ {post.downvotes}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        testID="comment-button"
        onPress={() => onComment(post.id)}
      >
        <Text>💬 {post.commentCount}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        testID="share-button"
        onPress={() => onShare(post.id)}
      >
        <Text>Share</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const MobileMessageItem = ({ message, onReaction, onReply, isOwnMessage }: any) => (
  <View testID="mobile-message-item">
    <View testID="message-header">
      <Text testID="message-author">{message.author}</Text>
      <Text testID="message-timestamp">{message.timestamp}</Text>
    </View>
    
    <Text testID="message-content">{message.content}</Text>
    
    {message.attachments && message.attachments.length > 0 && (
      <View testID="message-attachments">
        {message.attachments.map((attachment: any, index: number) => (
          <View key={index} testID={`attachment-${index}`}>
            {attachment.type === 'image' ? (
              <Image 
                testID={`attachment-image-${index}`}
                source={{ uri: attachment.url }}
                style={{ width: 200, height: 150 }}
              />
            ) : (
              <Text testID={`attachment-file-${index}`}>{attachment.filename}</Text>
            )}
          </View>
        ))}
      </View>
    )}

    {message.reactions && message.reactions.length > 0 && (
      <View testID="message-reactions">
        {message.reactions.map((reaction: any, index: number) => (
          <TouchableOpacity
            key={index}
            testID={`reaction-${reaction.emoji}`}
            onPress={() => onReaction(message.id, reaction.emoji)}
            style={{ 
              backgroundColor: reaction.userReacted ? 'lightblue' : 'lightgray',
              padding: 5,
              margin: 2
            }}
          >
            <Text>{reaction.emoji} {reaction.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}

    <View testID="message-actions">
      <TouchableOpacity 
        testID="add-reaction-button"
        onPress={() => onReaction(message.id, '👍')}
      >
        <Text>React</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        testID="reply-button"
        onPress={() => onReply(message.id)}
      >
        <Text>Reply</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const MobileChannelList = ({ channels, activeChannelId, onChannelSelect }: any) => (
  <ScrollView testID="mobile-channel-list">
    {channels.map((channel: any) => (
      <TouchableOpacity
        key={channel.id}
        testID={`channel-item-${channel.id}`}
        onPress={() => onChannelSelect(channel.id)}
        style={{
          backgroundColor: channel.id === activeChannelId ? 'lightblue' : 'white',
          padding: 10,
          borderBottomWidth: 1
        }}
      >
        <Text testID={`channel-name-${channel.id}`}>
          {channel.type === 'voice' ? '🔊' : '#'} {channel.name}
        </Text>
        {channel.unreadCount > 0 && (
          <Text testID={`unread-count-${channel.id}`} style={{ color: 'red' }}>
            {channel.unreadCount}
          </Text>
        )}
        {channel.type === 'voice' && channel.connectedUsers > 0 && (
          <Text testID={`voice-users-${channel.id}`}>
            {channel.connectedUsers} users connected
          </Text>
        )}
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const MobileServerList = ({ servers, activeServerId, onServerSelect }: any) => (
  <ScrollView testID="mobile-server-list" horizontal>
    {servers.map((server: any) => (
      <TouchableOpacity
        key={server.id}
        testID={`server-item-${server.id}`}
        onPress={() => onServerSelect(server.id)}
        style={{
          margin: 5,
          padding: 10,
          backgroundColor: server.id === activeServerId ? 'lightblue' : 'lightgray',
          borderRadius: 25,
          width: 50,
          height: 50,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {server.icon ? (
          <Image 
            testID={`server-icon-${server.id}`}
            source={{ uri: server.icon }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        ) : (
          <Text testID={`server-initial-${server.id}`}>
            {server.name.charAt(0)}
          </Text>
        )}
        
        {server.unreadCount > 0 && (
          <View 
            testID={`server-unread-${server.id}`}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: 'red',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>
              {server.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const MobileMessageInput = ({ onSendMessage, onAttachment }: any) => {
  const [message, setMessage] = React.useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <View testID="mobile-message-input">
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <TouchableOpacity 
          testID="attachment-button"
          onPress={onAttachment}
          style={{ padding: 10 }}
        >
          <Text>📎</Text>
        </TouchableOpacity>
        
        <TextInput
          testID="message-text-input"
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            borderWidth: 1, 
            borderColor: 'gray', 
            padding: 10,
            borderRadius: 20
          }}
          multiline
        />
        
        <TouchableOpacity 
          testID="send-button"
          onPress={handleSend}
          style={{ 
            padding: 10,
            backgroundColor: message.trim() ? 'blue' : 'gray',
            borderRadius: 20,
            marginLeft: 10
          }}
        >
          <Text style={{ color: 'white' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MobileNotificationItem = ({ notification, onPress, onDismiss }: any) => (
  <TouchableOpacity 
    testID="mobile-notification-item"
    onPress={() => onPress(notification.id)}
    style={{
      padding: 15,
      backgroundColor: notification.read ? 'white' : 'lightblue',
      borderBottomWidth: 1,
      borderBottomColor: 'lightgray'
    }}
  >
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Text testID="notification-title" style={{ fontWeight: 'bold' }}>
          {notification.title}
        </Text>
        <Text testID="notification-message">{notification.message}</Text>
        <Text testID="notification-timestamp" style={{ color: 'gray' }}>
          {notification.timestamp}
        </Text>
      </View>
      
      <TouchableOpacity 
        testID="dismiss-button"
        onPress={() => onDismiss(notification.id)}
        style={{ padding: 5 }}
      >
        <Text>✕</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const MobileVoiceControls = ({ isConnected, isMuted, isDeafened, onToggleMute, onToggleDeafen, onDisconnect }: any) => (
  <View testID="mobile-voice-controls" style={{ 
    backgroundColor: isConnected ? 'green' : 'gray',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around'
  }}>
    <TouchableOpacity 
      testID="mobile-mute-button"
      onPress={onToggleMute}
      style={{
        backgroundColor: isMuted ? 'red' : 'white',
        padding: 10,
        borderRadius: 25
      }}
    >
      <Text>{isMuted ? '🔇' : '🎤'}</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      testID="mobile-deafen-button"
      onPress={onToggleDeafen}
      style={{
        backgroundColor: isDeafened ? 'red' : 'white',
        padding: 10,
        borderRadius: 25
      }}
    >
      <Text>{isDeafened ? '🔇' : '🎧'}</Text>
    </TouchableOpacity>
    
    {isConnected && (
      <TouchableOpacity 
        testID="mobile-disconnect-button"
        onPress={onDisconnect}
        style={{
          backgroundColor: 'red',
          padding: 10,
          borderRadius: 25
        }}
      >
        <Text style={{ color: 'white' }}>Disconnect</Text>
      </TouchableOpacity>
    )}
  </View>
);

describe('Mobile Components', () => {
  describe('MobilePostCard Component', () => {
    const mockPost = {
      id: '1',
      title: 'Test Mobile Post',
      content: 'This is a test post for mobile',
      author: 'TestUser',
      community: 'technology',
      timestamp: '2h ago',
      upvotes: 25,
      downvotes: 3,
      commentCount: 12,
      userVote: null,
      imageUrl: null
    };

    test('renders post information correctly', () => {
      const mockHandlers = {
        onVote: jest.fn(),
        onComment: jest.fn(),
        onShare: jest.fn()
      };

      const { getByTestId } = render(
        <MobilePostCard post={mockPost} {...mockHandlers} />
      );

      expect(getByTestId('post-title')).toHaveTextContent('Test Mobile Post');
      expect(getByTestId('post-content')).toHaveTextContent('This is a test post for mobile');
      expect(getByTestId('post-author')).toHaveTextContent('TestUser');
      expect(getByTestId('post-community')).toHaveTextContent('r/technology');
    });

    test('handles voting actions', () => {
      const mockHandlers = {
        onVote: jest.fn(),
        onComment: jest.fn(),
        onShare: jest.fn()
      };

      const { getByTestId } = render(
        <MobilePostCard post={mockPost} {...mockHandlers} />
      );

      fireEvent.press(getByTestId('upvote-button'));
      expect(mockHandlers.onVote).toHaveBeenCalledWith('1', 'upvote');

      fireEvent.press(getByTestId('downvote-button'));
      expect(mockHandlers.onVote).toHaveBeenCalledWith('1', 'downvote');
    });

    test('shows voted state correctly', () => {
      const upvotedPost = { ...mockPost, userVote: 'upvote' };
      const mockHandlers = {
        onVote: jest.fn(),
        onComment: jest.fn(),
        onShare: jest.fn()
      };

      const { getByTestId } = render(
        <MobilePostCard post={upvotedPost} {...mockHandlers} />
      );

      const upvoteButton = getByTestId('upvote-button');
      expect(upvoteButton.props.style.backgroundColor).toBe('orange');
    });

    test('handles comment and share actions', () => {
      const mockHandlers = {
        onVote: jest.fn(),
        onComment: jest.fn(),
        onShare: jest.fn()
      };

      const { getByTestId } = render(
        <MobilePostCard post={mockPost} {...mockHandlers} />
      );

      fireEvent.press(getByTestId('comment-button'));
      expect(mockHandlers.onComment).toHaveBeenCalledWith('1');

      fireEvent.press(getByTestId('share-button'));
      expect(mockHandlers.onShare).toHaveBeenCalledWith('1');
    });

    test('renders image when present', () => {
      const postWithImage = { ...mockPost, imageUrl: 'https://example.com/image.jpg' };
      const mockHandlers = {
        onVote: jest.fn(),
        onComment: jest.fn(),
        onShare: jest.fn()
      };

      const { getByTestId } = render(
        <MobilePostCard post={postWithImage} {...mockHandlers} />
      );

      expect(getByTestId('post-image')).toBeTruthy();
    });
  });

  describe('MobileMessageItem Component', () => {
    const mockMessage = {
      id: '1',
      content: 'Hello mobile world!',
      author: 'MobileUser',
      timestamp: '10:30 AM',
      reactions: [
        { emoji: '👍', count: 2, userReacted: true },
        { emoji: '❤️', count: 1, userReacted: false }
      ],
      attachments: []
    };

    test('renders message content correctly', () => {
      const mockHandlers = {
        onReaction: jest.fn(),
        onReply: jest.fn()
      };

      const { getByTestId } = render(
        <MobileMessageItem 
          message={mockMessage} 
          {...mockHandlers}
          isOwnMessage={false}
        />
      );

      expect(getByTestId('message-content')).toHaveTextContent('Hello mobile world!');
      expect(getByTestId('message-author')).toHaveTextContent('MobileUser');
      expect(getByTestId('message-timestamp')).toHaveTextContent('10:30 AM');
    });

    test('renders reactions correctly', () => {
      const mockHandlers = {
        onReaction: jest.fn(),
        onReply: jest.fn()
      };

      const { getByTestId } = render(
        <MobileMessageItem 
          message={mockMessage} 
          {...mockHandlers}
          isOwnMessage={false}
        />
      );

      expect(getByTestId('reaction-👍')).toHaveTextContent('👍 2');
      expect(getByTestId('reaction-❤️')).toHaveTextContent('❤️ 1');
      
      // Check user reacted state
      const thumbsUpReaction = getByTestId('reaction-👍');
      expect(thumbsUpReaction.props.style.backgroundColor).toBe('lightblue');
    });

    test('handles reaction and reply actions', () => {
      const mockHandlers = {
        onReaction: jest.fn(),
        onReply: jest.fn()
      };

      const { getByTestId } = render(
        <MobileMessageItem 
          message={mockMessage} 
          {...mockHandlers}
          isOwnMessage={false}
        />
      );

      fireEvent.press(getByTestId('add-reaction-button'));
      expect(mockHandlers.onReaction).toHaveBeenCalledWith('1', '👍');

      fireEvent.press(getByTestId('reply-button'));
      expect(mockHandlers.onReply).toHaveBeenCalledWith('1');
    });

    test('renders attachments when present', () => {
      const messageWithAttachment = {
        ...mockMessage,
        attachments: [
          { type: 'image', url: 'https://example.com/image.jpg', filename: 'image.jpg' }
        ]
      };

      const mockHandlers = {
        onReaction: jest.fn(),
        onReply: jest.fn()
      };

      const { getByTestId } = render(
        <MobileMessageItem 
          message={messageWithAttachment} 
          {...mockHandlers}
          isOwnMessage={false}
        />
      );

      expect(getByTestId('message-attachments')).toBeTruthy();
      expect(getByTestId('attachment-image-0')).toBeTruthy();
    });
  });

  describe('MobileChannelList Component', () => {
    const mockChannels = [
      { id: '1', name: 'general', type: 'text', unreadCount: 3 },
      { id: '2', name: 'voice-general', type: 'voice', connectedUsers: 5, unreadCount: 0 },
      { id: '3', name: 'announcements', type: 'text', unreadCount: 0 }
    ];

    test('renders channels correctly', () => {
      const mockOnChannelSelect = jest.fn();

      const { getByTestId } = render(
        <MobileChannelList 
          channels={mockChannels}
          activeChannelId="1"
          onChannelSelect={mockOnChannelSelect}
        />
      );

      expect(getByTestId('channel-name-1')).toHaveTextContent('# general');
      expect(getByTestId('channel-name-2')).toHaveTextContent('🔊 voice-general');
      expect(getByTestId('channel-name-3')).toHaveTextContent('# announcements');
    });

    test('shows unread count when present', () => {
      const mockOnChannelSelect = jest.fn();

      const { getByTestId } = render(
        <MobileChannelList 
          channels={mockChannels}
          activeChannelId="1"
          onChannelSelect={mockOnChannelSelect}
        />
      );

      expect(getByTestId('unread-count-1')).toHaveTextContent('3');
    });

    test('shows connected users for voice channels', () => {
      const mockOnChannelSelect = jest.fn();

      const { getByTestId } = render(
        <MobileChannelList 
          channels={mockChannels}
          activeChannelId="1"
          onChannelSelect={mockOnChannelSelect}
        />
      );

      expect(getByTestId('voice-users-2')).toHaveTextContent('5 users connected');
    });

    test('handles channel selection', () => {
      const mockOnChannelSelect = jest.fn();

      const { getByTestId } = render(
        <MobileChannelList 
          channels={mockChannels}
          activeChannelId="1"
          onChannelSelect={mockOnChannelSelect}
        />
      );

      fireEvent.press(getByTestId('channel-item-2'));
      expect(mockOnChannelSelect).toHaveBeenCalledWith('2');
    });

    test('shows active channel state', () => {
      const mockOnChannelSelect = jest.fn();

      const { getByTestId } = render(
        <MobileChannelList 
          channels={mockChannels}
          activeChannelId="1"
          onChannelSelect={mockOnChannelSelect}
        />
      );

      const activeChannel = getByTestId('channel-item-1');
      expect(activeChannel.props.style.backgroundColor).toBe('lightblue');
    });
  });

  describe('MobileMessageInput Component', () => {
    test('renders message input correctly', () => {
      const mockHandlers = {
        onSendMessage: jest.fn(),
        onAttachment: jest.fn()
      };

      const { getByTestId } = render(
        <MobileMessageInput {...mockHandlers} />
      );

      expect(getByTestId('message-text-input')).toBeTruthy();
      expect(getByTestId('send-button')).toBeTruthy();
      expect(getByTestId('attachment-button')).toBeTruthy();
    });

    test('handles message typing and sending', () => {
      const mockHandlers = {
        onSendMessage: jest.fn(),
        onAttachment: jest.fn()
      };

      const { getByTestId } = render(
        <MobileMessageInput {...mockHandlers} />
      );

      const textInput = getByTestId('message-text-input');
      fireEvent.changeText(textInput, 'Hello mobile!');
      
      const sendButton = getByTestId('send-button');
      fireEvent.press(sendButton);

      expect(mockHandlers.onSendMessage).toHaveBeenCalledWith('Hello mobile!');
    });

    test('handles attachment button press', () => {
      const mockHandlers = {
        onSendMessage: jest.fn(),
        onAttachment: jest.fn()
      };

      const { getByTestId } = render(
        <MobileMessageInput {...mockHandlers} />
      );

      const attachmentButton = getByTestId('attachment-button');
      fireEvent.press(attachmentButton);

      expect(mockHandlers.onAttachment).toHaveBeenCalled();
    });

    test('updates send button style based on message content', () => {
      const mockHandlers = {
        onSendMessage: jest.fn(),
        onAttachment: jest.fn()
      };

      const { getByTestId } = render(
        <MobileMessageInput {...mockHandlers} />
      );

      const textInput = getByTestId('message-text-input');
      const sendButton = getByTestId('send-button');
      
      // Initially gray when empty
      expect(sendButton.props.style.backgroundColor).toBe('gray');
      
      // Blue when has content
      fireEvent.changeText(textInput, 'Test message');
      expect(sendButton.props.style.backgroundColor).toBe('blue');
    });
  });

  describe('MobileVoiceControls Component', () => {
    test('renders voice controls when connected', () => {
      const mockHandlers = {
        onToggleMute: jest.fn(),
        onToggleDeafen: jest.fn(),
        onDisconnect: jest.fn()
      };

      const { getByTestId } = render(
        <MobileVoiceControls 
          isConnected={true}
          isMuted={false}
          isDeafened={false}
          {...mockHandlers}
        />
      );

      expect(getByTestId('mobile-mute-button')).toBeTruthy();
      expect(getByTestId('mobile-deafen-button')).toBeTruthy();
      expect(getByTestId('mobile-disconnect-button')).toBeTruthy();
    });

    test('shows correct mute state', () => {
      const mockHandlers = {
        onToggleMute: jest.fn(),
        onToggleDeafen: jest.fn(),
        onDisconnect: jest.fn()
      };

      const { getByTestId } = render(
        <MobileVoiceControls 
          isConnected={true}
          isMuted={true}
          isDeafened={false}
          {...mockHandlers}
        />
      );

      const muteButton = getByTestId('mobile-mute-button');
      expect(muteButton.props.style.backgroundColor).toBe('red');
      expect(muteButton.props.children).toBe('🔇');
    });

    test('handles voice control actions', () => {
      const mockHandlers = {
        onToggleMute: jest.fn(),
        onToggleDeafen: jest.fn(),
        onDisconnect: jest.fn()
      };

      const { getByTestId } = render(
        <MobileVoiceControls 
          isConnected={true}
          isMuted={false}
          isDeafened={false}
          {...mockHandlers}
        />
      );

      fireEvent.press(getByTestId('mobile-mute-button'));
      expect(mockHandlers.onToggleMute).toHaveBeenCalled();

      fireEvent.press(getByTestId('mobile-deafen-button'));
      expect(mockHandlers.onToggleDeafen).toHaveBeenCalled();

      fireEvent.press(getByTestId('mobile-disconnect-button'));
      expect(mockHandlers.onDisconnect).toHaveBeenCalled();
    });

    test('hides disconnect button when not connected', () => {
      const mockHandlers = {
        onToggleMute: jest.fn(),
        onToggleDeafen: jest.fn(),
        onDisconnect: jest.fn()
      };

      const { queryByTestId } = render(
        <MobileVoiceControls 
          isConnected={false}
          isMuted={false}
          isDeafened={false}
          {...mockHandlers}
        />
      );

      expect(queryByTestId('mobile-disconnect-button')).toBeNull();
    });
  });

  describe('MobileNotificationItem Component', () => {
    const mockNotification = {
      id: '1',
      title: 'New Message',
      message: 'You have a new message from TestUser',
      timestamp: '2 minutes ago',
      read: false
    };

    test('renders notification correctly', () => {
      const mockHandlers = {
        onPress: jest.fn(),
        onDismiss: jest.fn()
      };

      const { getByTestId } = render(
        <MobileNotificationItem 
          notification={mockNotification}
          {...mockHandlers}
        />
      );

      expect(getByTestId('notification-title')).toHaveTextContent('New Message');
      expect(getByTestId('notification-message')).toHaveTextContent('You have a new message from TestUser');
      expect(getByTestId('notification-timestamp')).toHaveTextContent('2 minutes ago');
    });

    test('shows unread state correctly', () => {
      const mockHandlers = {
        onPress: jest.fn(),
        onDismiss: jest.fn()
      };

      const { getByTestId } = render(
        <MobileNotificationItem 
          notification={mockNotification}
          {...mockHandlers}
        />
      );

      const notificationItem = getByTestId('mobile-notification-item');
      expect(notificationItem.props.style.backgroundColor).toBe('lightblue');
    });

    test('shows read state correctly', () => {
      const readNotification = { ...mockNotification, read: true };
      const mockHandlers = {
        onPress: jest.fn(),
        onDismiss: jest.fn()
      };

      const { getByTestId } = render(
        <MobileNotificationItem 
          notification={readNotification}
          {...mockHandlers}
        />
      );

      const notificationItem = getByTestId('mobile-notification-item');
      expect(notificationItem.props.style.backgroundColor).toBe('white');
    });

    test('handles notification actions', () => {
      const mockHandlers = {
        onPress: jest.fn(),
        onDismiss: jest.fn()
      };

      const { getByTestId } = render(
        <MobileNotificationItem 
          notification={mockNotification}
          {...mockHandlers}
        />
      );

      fireEvent.press(getByTestId('mobile-notification-item'));
      expect(mockHandlers.onPress).toHaveBeenCalledWith('1');

      fireEvent.press(getByTestId('dismiss-button'));
      expect(mockHandlers.onDismiss).toHaveBeenCalledWith('1');
    });
  });
});