/**
 * Chat Integration Component
 * Demonstrates how to use the new backend services together
 * This replaces the old ChatSystem with modern React hooks and API integration
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useServers from '../hooks/useServers';
import useChannels from '../hooks/useChannels';
import useMessages from '../hooks/useMessages';
import usePresence from '../hooks/usePresence';
import websocketService from '../services/websocketService';

const ChatIntegration = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Initialize all the hooks
  const {
    servers,
    currentServer,
    selectServer,
    loadServers
  } = useServers();

  const {
    channels,
    currentChannel,
    selectChannel,
    loadChannels
  } = useChannels(currentServer?.id);

  const {
    messages,
    sendMessage,
    loadMessages,
    typingUsers
  } = useMessages(currentChannel?.id);

  const {
    onlineUsers,
    currentStatus,
    updateStatus
  } = usePresence();

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      
      // Connect WebSocket
      websocketService.connect(user).then(() => {
        setConnectionStatus('connected');
        
        // Load initial data
        loadServers();
      }).catch(error => {
        setConnectionStatus('error');
        console.error('❌ WebSocket connection failed:', error);
      });

      // Listen for connection events
      const handleConnectionSuccess = () => {
        setConnectionStatus('connected');
      };

      const handleConnectionLost = ({ reason }) => {
        setConnectionStatus('reconnecting');
      };

      const handleConnectionError = ({ error }) => {
        setConnectionStatus('error');
        console.error('❌ WebSocket connection error:', error);
      };

      const handleConnectionReconnecting = ({ attempt }) => {
        setConnectionStatus('reconnecting');
      };

      const handleConnectionFailed = () => {
        setConnectionStatus('failed');
        console.error('💥 WebSocket connection failed permanently');
      };

      // Register event listeners
      websocketService.on('connection:success', handleConnectionSuccess);
      websocketService.on('connection:lost', handleConnectionLost);
      websocketService.on('connection:error', handleConnectionError);
      websocketService.on('connection:reconnecting', handleConnectionReconnecting);
      websocketService.on('connection:failed', handleConnectionFailed);

      // Cleanup
      return () => {
        websocketService.off('connection:success', handleConnectionSuccess);
        websocketService.off('connection:lost', handleConnectionLost);
        websocketService.off('connection:error', handleConnectionError);
        websocketService.off('connection:reconnecting', handleConnectionReconnecting);
        websocketService.off('connection:failed', handleConnectionFailed);
      };
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isAuthenticated, user, loadServers]);

  // Auto-select first server and channel
  useEffect(() => {
    if (servers.length > 0 && !currentServer) {
      const firstServer = servers[0];
      selectServer(firstServer);
    }
  }, [servers, currentServer, selectServer]);

  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      const generalChannel = channels.find(c => c.name === 'general') || channels[0];
      selectChannel(generalChannel);
    }
  }, [channels, currentChannel, selectChannel]);

  // Log real-time updates
  useEffect(() => {
    const handleNewMessage = (message) => {
      console.log('New message received:', {
        channel: message.channelId,
        author: message.authorUsername,
        content: message.content.substring(0, 50) + '...'
      });
    };

    websocketService.on('message:received', handleNewMessage);
    return () => websocketService.off('message:received', handleNewMessage);
  }, []);

  // Provide connection status to children
  const chatContextValue = {
    // Connection
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    
    // Servers
    servers,
    currentServer,
    selectServer,
    
    // Channels
    channels,
    currentChannel,
    selectChannel,
    
    // Messages
    messages,
    sendMessage,
    typingUsers,
    
    // Presence
    onlineUsers,
    currentStatus,
    updateStatus,
    
    // WebSocket service for direct access
    websocket: websocketService
  };

  return (
    <ChatContext.Provider value={chatContextValue}>
      <div className="chat-integration">
        {/* Connection status indicator */}
        <ConnectionStatus status={connectionStatus} />
        
        {/* Debug info (only in development) */}
        {import.meta.env.MODE === 'development' && (
          <DebugInfo 
            servers={servers}
            currentServer={currentServer}
            channels={channels}
            currentChannel={currentChannel}
            messages={messages}
            onlineUsers={onlineUsers}
            connectionStatus={connectionStatus}
          />
        )}
        
        {children}
      </div>
    </ChatContext.Provider>
  );
};

// Connection status indicator component
const ConnectionStatus = ({ status }) => {
  const statusConfig = {
    connecting: { color: 'yellow', text: 'Connecting...', icon: '🔄' },
    connected: { color: 'green', text: 'Connected', icon: '✅' },
    reconnecting: { color: 'orange', text: 'Reconnecting...', icon: '🔄' },
    error: { color: 'red', text: 'Connection Error', icon: '❌' },
    failed: { color: 'red', text: 'Connection Failed', icon: '💥' },
    disconnected: { color: 'gray', text: 'Disconnected', icon: '⚫' }
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <div 
      style={{
  position: 'fixed',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  fontWeight: '500'
}}
      style={{
        backgroundColor: `var(--${config.color === 'green' ? 'success' : 'error'}-bg, rgba(0,0,0,0.8))`,
        color: 'white',
        display: status === 'connected' ? 'none' : 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};

// Debug info component (development only)
const DebugInfo = ({ 
  servers, 
  currentServer, 
  channels, 
  currentChannel, 
  messages, 
  onlineUsers, 
  connectionStatus 
}) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        style={{
  position: 'fixed',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
        style={{ zIndex: 1000 }}
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div 
      style={{
  position: 'fixed',
  width: '320px',
  padding: '16px',
  borderRadius: '12px'
}}
      style={{ zIndex: 1000 }}
    >
      <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
        <h3 style={{
  color: '#ffffff',
  fontWeight: 'bold'
}}>Debug Info</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Connection:</strong> {connectionStatus}
        </div>
        <div>
          <strong>Servers:</strong> {servers.length}
          {currentServer && (
            <div className="ml-2">Current: {currentServer.name}</div>
          )}
        </div>
        <div>
          <strong>Channels:</strong> {channels.length}
          {currentChannel && (
            <div className="ml-2">Current: #{currentChannel.name}</div>
          )}
        </div>
        <div>
          <strong>Messages:</strong> {messages.length}
        </div>
        <div>
          <strong>Online Users:</strong> {onlineUsers.length}
        </div>
        
        {/* WebSocket connection details */}
        <div>
          <strong>WebSocket:</strong>
          <div className="ml-2">
            <div>Connected: {websocketService.isConnected ? 'Yes' : 'No'}</div>
            <div>Reconnect Attempts: {websocketService.reconnectAttempts}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Chat Context
const ChatContext = React.createContext();

// Hook to use chat context
export const useChatIntegration = () => {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChatIntegration must be used within ChatIntegration');
  }
  return context;
};



export default ChatIntegration;