/**
 * Socket.IO Real-time Integration Tests
 * Tests real-time messaging, voice/video, and connection handling
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.SOCKET_URL || 'https://platform.cryb.ai';
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.cryb.ai';

describe('Socket.IO Real-time Integration', () => {
  let socket1, socket2;
  let authToken1, authToken2;
  let testChannel;

  beforeAll(async () => {
    // Create test users and get auth tokens
    const user1Response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `socket-test-1-${Date.now()}@example.com`,
        password: 'SocketTest123!',
        username: `socketuser1${Date.now()}`
      })
    });

    const user2Response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `socket-test-2-${Date.now()}@example.com`,
        password: 'SocketTest123!',
        username: `socketuser2${Date.now()}`
      })
    });

    const user1Data = await user1Response.json();
    const user2Data = await user2Response.json();

    authToken1 = user1Data.token;
    authToken2 = user2Data.token;

    // Create test channel
    const channelResponse = await fetch(`${API_BASE_URL}/api/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `test-channel-${Date.now()}`,
        type: 'text'
      })
    });

    const channelData = await channelResponse.json();
    testChannel = channelData.channel;
  });

  afterAll(async () => {
    // Cleanup
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();
  });

  beforeEach(() => {
    jest.setTimeout(30000);
  });

  afterEach(() => {
    if (socket1) {
      socket1.removeAllListeners();
    }
    if (socket2) {
      socket2.removeAllListeners();
    }
  });

  describe('Socket Connection', () => {
    test('should connect with valid authentication', (done) => {
      socket1 = io(SOCKET_URL, {
        auth: {
          token: authToken1
        },
        transports: ['websocket']
      });

      socket1.on('connect', () => {
        expect(socket1.connected).toBe(true);
        expect(socket1.id).toBeTruthy();
        done();
      });

      socket1.on('connect_error', (error) => {
        done(error);
      });
    });

    test('should reject connection with invalid token', (done) => {
      const invalidSocket = io(SOCKET_URL, {
        auth: {
          token: 'invalid-token'
        },
        transports: ['websocket']
      });

      invalidSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        invalidSocket.disconnect();
        done();
      });

      invalidSocket.on('connect', () => {
        invalidSocket.disconnect();
        done(new Error('Should not connect with invalid token'));
      });
    });

    test('should handle reconnection automatically', (done) => {
      socket1 = io(SOCKET_URL, {
        auth: { token: authToken1 },
        transports: ['websocket']
      });

      let connectCount = 0;

      socket1.on('connect', () => {
        connectCount++;
        
        if (connectCount === 1) {
          // Force disconnect to test reconnection
          socket1.disconnect();
          setTimeout(() => socket1.connect(), 100);
        } else if (connectCount === 2) {
          expect(socket1.connected).toBe(true);
          done();
        }
      });

      socket1.on('connect_error', done);
    });
  });

  describe('Real-time Messaging', () => {
    beforeEach((done) => {
      socket1 = io(SOCKET_URL, {
        auth: { token: authToken1 },
        transports: ['websocket']
      });

      socket2 = io(SOCKET_URL, {
        auth: { token: authToken2 },
        transports: ['websocket']
      });

      let connections = 0;
      const checkConnections = () => {
        connections++;
        if (connections === 2) {
          // Join both sockets to test channel
          socket1.emit('join-channel', testChannel.id);
          socket2.emit('join-channel', testChannel.id);
          setTimeout(done, 100);
        }
      };

      socket1.on('connect', checkConnections);
      socket2.on('connect', checkConnections);
    });

    test('should send and receive messages in real-time', (done) => {
      const testMessage = {
        content: 'Hello from socket test!',
        channelId: testChannel.id
      };

      socket2.on('new-message', (message) => {
        expect(message.content).toBe(testMessage.content);
        expect(message.channelId).toBe(testChannel.id);
        expect(message.userId).toBeTruthy();
        expect(message.timestamp).toBeTruthy();
        done();
      });

      socket1.emit('send-message', testMessage);
    });

    test('should handle message editing', (done) => {
      const originalMessage = {
        content: 'Original message',
        channelId: testChannel.id
      };

      let messageId;

      socket2.on('new-message', (message) => {
        messageId = message.id;
        
        // Edit the message
        socket1.emit('edit-message', {
          messageId,
          content: 'Edited message'
        });
      });

      socket2.on('message-edited', (editedMessage) => {
        expect(editedMessage.id).toBe(messageId);
        expect(editedMessage.content).toBe('Edited message');
        expect(editedMessage.edited).toBe(true);
        done();
      });

      socket1.emit('send-message', originalMessage);
    });

    test('should handle message deletion', (done) => {
      const messageToDelete = {
        content: 'Message to delete',
        channelId: testChannel.id
      };

      let messageId;

      socket2.on('new-message', (message) => {
        messageId = message.id;
        
        // Delete the message
        socket1.emit('delete-message', { messageId });
      });

      socket2.on('message-deleted', (deletedMessage) => {
        expect(deletedMessage.id).toBe(messageId);
        done();
      });

      socket1.emit('send-message', messageToDelete);
    });

    test('should handle typing indicators', (done) => {
      socket2.on('user-typing', (data) => {
        expect(data.channelId).toBe(testChannel.id);
        expect(data.userId).toBeTruthy();
        expect(data.isTyping).toBe(true);
        done();
      });

      socket1.emit('typing', {
        channelId: testChannel.id,
        isTyping: true
      });
    });

    test('should handle user presence updates', (done) => {
      socket2.on('user-presence', (data) => {
        expect(data.userId).toBeTruthy();
        expect(['online', 'away', 'busy', 'offline']).toContain(data.status);
        done();
      });

      socket1.emit('update-presence', { status: 'busy' });
    });
  });

  describe('Voice/Video Features', () => {
    test('should handle voice channel join/leave', (done) => {
      socket2.on('user-joined-voice', (data) => {
        expect(data.channelId).toBe(testChannel.id);
        expect(data.userId).toBeTruthy();
        done();
      });

      socket1.emit('join-voice-channel', {
        channelId: testChannel.id
      });
    });

    test('should handle video call signaling', (done) => {
      const offerData = {
        to: 'user2-id',
        offer: { sdp: 'mock-sdp', type: 'offer' }
      };

      socket2.on('video-offer', (data) => {
        expect(data.from).toBeTruthy();
        expect(data.offer).toEqual(offerData.offer);
        
        // Send answer back
        socket2.emit('video-answer', {
          to: data.from,
          answer: { sdp: 'mock-answer-sdp', type: 'answer' }
        });
      });

      socket1.on('video-answer', (data) => {
        expect(data.answer.type).toBe('answer');
        done();
      });

      socket1.emit('video-offer', offerData);
    });

    test('should handle ICE candidates exchange', (done) => {
      const candidate = {
        to: 'user2-id',
        candidate: {
          candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 54400 typ host',
          sdpMLineIndex: 0,
          sdpMid: '0'
        }
      };

      socket2.on('ice-candidate', (data) => {
        expect(data.candidate).toEqual(candidate.candidate);
        done();
      });

      socket1.emit('ice-candidate', candidate);
    });

    test('should handle screen sharing events', (done) => {
      socket2.on('screen-share-started', (data) => {
        expect(data.userId).toBeTruthy();
        expect(data.channelId).toBe(testChannel.id);
        done();
      });

      socket1.emit('start-screen-share', {
        channelId: testChannel.id
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid channel join attempts', (done) => {
      socket1.on('error', (error) => {
        expect(error.type).toBe('channel-error');
        expect(error.message).toContain('Channel not found');
        done();
      });

      socket1.emit('join-channel', 'invalid-channel-id');
    });

    test('should handle rate limiting', (done) => {
      let messageCount = 0;
      const maxMessages = 10;

      socket1.on('error', (error) => {
        if (error.type === 'rate-limit') {
          expect(error.message).toContain('Rate limit exceeded');
          done();
        }
      });

      // Send messages rapidly to trigger rate limit
      const sendMessages = () => {
        if (messageCount < maxMessages) {
          socket1.emit('send-message', {
            content: `Spam message ${messageCount}`,
            channelId: testChannel.id
          });
          messageCount++;
          setTimeout(sendMessages, 10);
        }
      };

      sendMessages();
    });

    test('should handle network disconnections gracefully', (done) => {
      socket1.on('disconnect', (reason) => {
        expect(reason).toBeTruthy();
        
        // Should automatically attempt to reconnect
        socket1.on('connect', () => {
          expect(socket1.connected).toBe(true);
          done();
        });
      });

      // Simulate network disconnection
      socket1.disconnect();
      setTimeout(() => socket1.connect(), 1000);
    });
  });

  describe('Performance', () => {
    test('should handle high message throughput', (done) => {
      const messageCount = 100;
      let receivedCount = 0;
      const startTime = Date.now();

      socket2.on('new-message', (message) => {
        receivedCount++;
        
        if (receivedCount === messageCount) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          // Should handle 100 messages in reasonable time (< 5 seconds)
          expect(duration).toBeLessThan(5000);
          done();
        }
      });

      // Send messages rapidly
      for (let i = 0; i < messageCount; i++) {
        socket1.emit('send-message', {
          content: `Performance test message ${i}`,
          channelId: testChannel.id
        });
      }
    });

    test('should maintain connection with multiple concurrent users', (done) => {
      const socketCount = 5;
      const sockets = [];
      let connectedCount = 0;

      // Create multiple socket connections
      for (let i = 0; i < socketCount; i++) {
        const socket = io(SOCKET_URL, {
          auth: { token: authToken1 },
          transports: ['websocket']
        });

        socket.on('connect', () => {
          connectedCount++;
          
          if (connectedCount === socketCount) {
            // All sockets connected successfully
            expect(connectedCount).toBe(socketCount);
            
            // Cleanup
            sockets.forEach(s => s.disconnect());
            done();
          }
        });

        sockets.push(socket);
      }
    });
  });
});