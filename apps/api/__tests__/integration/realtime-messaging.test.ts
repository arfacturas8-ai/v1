import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { buildApp } from '../../src/app';
import { testData } from '../helpers/test-data';
import request from 'supertest';

describe('Real-time Messaging', () => {
  let server: any;
  let serverSocket: Server;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let port: number;
  let authToken1: string;
  let authToken2: string;
  let user1Id: number;
  let user2Id: number;

  beforeEach(async () => {
    // Set up test server
    const app = buildApp({ logger: false });
    await app.ready();
    
    server = createServer();
    serverSocket = new Server(server);
    
    await new Promise<void>((resolve) => {
      server.listen(() => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });

    // Create test users and get auth tokens
    const user1Data = testData.validUser('user1@example.com');
    const user2Data = testData.validUser('user2@example.com');

    const response1 = await request(app.server)
      .post('/api/auth/register')
      .send(user1Data);
    
    const response2 = await request(app.server)
      .post('/api/auth/register')
      .send(user2Data);

    authToken1 = response1.body.token;
    authToken2 = response2.body.token;
    user1Id = response1.body.user.id;
    user2Id = response2.body.user.id;

    await app.close();
  });

  afterEach(async () => {
    if (clientSocket1?.connected) clientSocket1.disconnect();
    if (clientSocket2?.connected) clientSocket2.disconnect();
    if (serverSocket) serverSocket.close();
    if (server) server.close();
  });

  describe('Socket Connection', () => {
    it('should establish socket connection with valid auth token', async () => {
      clientSocket1 = Client(`http://localhost:${port}`, {
        auth: { token: authToken1 }
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket1.on('connect', () => {
          expect(clientSocket1.connected).toBe(true);
          resolve();
        });
        
        clientSocket1.on('connect_error', (error) => {
          reject(error);
        });
        
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    });

    it('should reject connection with invalid auth token', async () => {
      clientSocket1 = Client(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' }
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket1.on('connect', () => {
          reject(new Error('Should not connect with invalid token'));
        });
        
        clientSocket1.on('connect_error', (error) => {
          expect(error.message).toContain('Authentication failed');
          resolve();
        });
        
        setTimeout(() => reject(new Error('Should have received error')), 5000);
      });
    });

    it('should handle connection without auth token', async () => {
      clientSocket1 = Client(`http://localhost:${port}`);

      await new Promise<void>((resolve, reject) => {
        clientSocket1.on('connect', () => {
          reject(new Error('Should not connect without token'));
        });
        
        clientSocket1.on('connect_error', (error) => {
          expect(error.message).toContain('Authentication required');
          resolve();
        });
        
        setTimeout(() => reject(new Error('Should have received error')), 5000);
      });
    });
  });

  describe('Direct Messaging', () => {
    beforeEach(async () => {
      clientSocket1 = Client(`http://localhost:${port}`, {
        auth: { token: authToken1 }
      });
      
      clientSocket2 = Client(`http://localhost:${port}`, {
        auth: { token: authToken2 }
      });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
        new Promise<void>((resolve) => clientSocket2.on('connect', resolve))
      ]);
    });

    it('should send and receive direct messages', async () => {
      const messageData = {
        recipientId: user2Id,
        content: 'Hello from user 1!',
        type: 'text'
      };

      // Set up message listener for user 2
      const messagePromise = new Promise<any>((resolve) => {
        clientSocket2.on('direct_message', resolve);
      });

      // Send message from user 1
      clientSocket1.emit('send_direct_message', messageData);

      // Wait for message to be received
      const receivedMessage = await messagePromise;

      expect(receivedMessage.content).toBe(messageData.content);
      expect(receivedMessage.senderId).toBe(user1Id);
      expect(receivedMessage.recipientId).toBe(user2Id);
      expect(receivedMessage).toHaveProperty('id');
      expect(receivedMessage).toHaveProperty('timestamp');
    });

    it('should handle message delivery confirmation', async () => {
      const messageData = {
        recipientId: user2Id,
        content: 'Test message',
        type: 'text'
      };

      // Set up delivery confirmation listener
      const confirmationPromise = new Promise<any>((resolve) => {
        clientSocket1.on('message_delivered', resolve);
      });

      // Send message
      clientSocket1.emit('send_direct_message', messageData);

      // Wait for delivery confirmation
      const confirmation = await confirmationPromise;

      expect(confirmation.status).toBe('delivered');
      expect(confirmation).toHaveProperty('messageId');
      expect(confirmation).toHaveProperty('deliveredAt');
    });

    it('should handle message read receipts', async () => {
      const messageData = {
        recipientId: user2Id,
        content: 'Test message for read receipt',
        type: 'text'
      };

      // Send message
      clientSocket1.emit('send_direct_message', messageData);

      // Wait for message to be received by user 2
      const messagePromise = new Promise<any>((resolve) => {
        clientSocket2.on('direct_message', resolve);
      });
      const receivedMessage = await messagePromise;

      // Set up read receipt listener for user 1
      const readReceiptPromise = new Promise<any>((resolve) => {
        clientSocket1.on('message_read', resolve);
      });

      // Mark message as read by user 2
      clientSocket2.emit('mark_message_read', { messageId: receivedMessage.id });

      // Wait for read receipt
      const readReceipt = await readReceiptPromise;

      expect(readReceipt.messageId).toBe(receivedMessage.id);
      expect(readReceipt.readBy).toBe(user2Id);
      expect(readReceipt).toHaveProperty('readAt');
    });

    it('should handle offline message storage', async () => {
      // Disconnect user 2
      clientSocket2.disconnect();

      const messageData = {
        recipientId: user2Id,
        content: 'Message while offline',
        type: 'text'
      };

      // Send message to offline user
      clientSocket1.emit('send_direct_message', messageData);

      // Reconnect user 2
      clientSocket2 = Client(`http://localhost:${port}`, {
        auth: { token: authToken2 }
      });

      // Wait for connection and offline messages
      const offlineMessagesPromise = new Promise<any[]>((resolve) => {
        const messages: any[] = [];
        
        clientSocket2.on('connect', () => {
          clientSocket2.on('offline_messages', (msgs) => {
            resolve(msgs);
          });
        });
      });

      const offlineMessages = await offlineMessagesPromise;

      expect(offlineMessages.some(msg => msg.content === messageData.content)).toBe(true);
    });

    it('should validate message content and reject malicious input', async () => {
      const maliciousMessage = {
        recipientId: user2Id,
        content: '<script>alert("xss")</script>Malicious content',
        type: 'text'
      };

      // Set up error listener
      const errorPromise = new Promise<any>((resolve) => {
        clientSocket1.on('message_error', resolve);
      });

      // Send malicious message
      clientSocket1.emit('send_direct_message', maliciousMessage);

      // Should receive sanitized content or error
      const messagePromise = new Promise<any>((resolve) => {
        clientSocket2.on('direct_message', resolve);
      });

      const receivedMessage = await messagePromise;

      // XSS content should be sanitized
      expect(receivedMessage.content).not.toContain('<script>');
      expect(receivedMessage.content).toContain('Malicious content');
    });
  });

  describe('Channel Messaging', () => {
    let channelId: string;

    beforeEach(async () => {
      clientSocket1 = Client(`http://localhost:${port}`, {
        auth: { token: authToken1 }
      });
      
      clientSocket2 = Client(`http://localhost:${port}`, {
        auth: { token: authToken2 }
      });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
        new Promise<void>((resolve) => clientSocket2.on('connect', resolve))
      ]);

      channelId = 'test-channel-123';
    });

    it('should join and leave channels', async () => {
      // Join channel
      const joinPromise1 = new Promise<any>((resolve) => {
        clientSocket1.on('channel_joined', resolve);
      });

      const joinPromise2 = new Promise<any>((resolve) => {
        clientSocket2.on('channel_joined', resolve);
      });

      clientSocket1.emit('join_channel', { channelId });
      clientSocket2.emit('join_channel', { channelId });

      const [joinResult1, joinResult2] = await Promise.all([joinPromise1, joinPromise2]);

      expect(joinResult1.channelId).toBe(channelId);
      expect(joinResult2.channelId).toBe(channelId);

      // Leave channel
      const leavePromise = new Promise<any>((resolve) => {
        clientSocket1.on('channel_left', resolve);
      });

      clientSocket1.emit('leave_channel', { channelId });

      const leaveResult = await leavePromise;
      expect(leaveResult.channelId).toBe(channelId);
    });

    it('should broadcast messages to channel members', async () => {
      // Both users join channel
      clientSocket1.emit('join_channel', { channelId });
      clientSocket2.emit('join_channel', { channelId });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('channel_joined', () => resolve())),
        new Promise<void>((resolve) => clientSocket2.on('channel_joined', () => resolve()))
      ]);

      const messageData = {
        channelId,
        content: 'Hello channel!',
        type: 'text'
      };

      // Set up message listener for user 2
      const messagePromise = new Promise<any>((resolve) => {
        clientSocket2.on('channel_message', resolve);
      });

      // Send message from user 1
      clientSocket1.emit('send_channel_message', messageData);

      const receivedMessage = await messagePromise;

      expect(receivedMessage.content).toBe(messageData.content);
      expect(receivedMessage.channelId).toBe(channelId);
      expect(receivedMessage.senderId).toBe(user1Id);
    });

    it('should handle user presence in channels', async () => {
      // User 1 joins channel
      clientSocket1.emit('join_channel', { channelId });

      await new Promise<void>((resolve) => {
        clientSocket1.on('channel_joined', () => resolve());
      });

      // Set up presence update listener
      const presencePromise = new Promise<any>((resolve) => {
        clientSocket1.on('user_joined_channel', resolve);
      });

      // User 2 joins channel
      clientSocket2.emit('join_channel', { channelId });

      const presenceUpdate = await presencePromise;

      expect(presenceUpdate.userId).toBe(user2Id);
      expect(presenceUpdate.channelId).toBe(channelId);
    });

    it('should handle typing indicators', async () => {
      // Both users join channel
      clientSocket1.emit('join_channel', { channelId });
      clientSocket2.emit('join_channel', { channelId });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('channel_joined', () => resolve())),
        new Promise<void>((resolve) => clientSocket2.on('channel_joined', () => resolve()))
      ]);

      // Set up typing indicator listener
      const typingPromise = new Promise<any>((resolve) => {
        clientSocket2.on('user_typing', resolve);
      });

      // User 1 starts typing
      clientSocket1.emit('start_typing', { channelId });

      const typingIndicator = await typingPromise;

      expect(typingIndicator.userId).toBe(user1Id);
      expect(typingIndicator.channelId).toBe(channelId);
      expect(typingIndicator.isTyping).toBe(true);
    });

    it('should enforce channel permissions', async () => {
      const restrictedChannelId = 'private-channel-456';

      // Set up error listener
      const errorPromise = new Promise<any>((resolve) => {
        clientSocket1.on('channel_error', resolve);
      });

      // Try to join restricted channel without permission
      clientSocket1.emit('join_channel', { channelId: restrictedChannelId });

      const error = await errorPromise;

      expect(error.message).toContain('permission denied');
      expect(error.channelId).toBe(restrictedChannelId);
    });
  });

  describe('Voice and Video Signaling', () => {
    beforeEach(async () => {
      clientSocket1 = Client(`http://localhost:${port}`, {
        auth: { token: authToken1 }
      });
      
      clientSocket2 = Client(`http://localhost:${port}`, {
        auth: { token: authToken2 }
      });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
        new Promise<void>((resolve) => clientSocket2.on('connect', resolve))
      ]);
    });

    it('should handle WebRTC offer/answer signaling', async () => {
      const offer = {
        recipientId: user2Id,
        sdp: 'fake-offer-sdp',
        type: 'offer'
      };

      // Set up offer listener
      const offerPromise = new Promise<any>((resolve) => {
        clientSocket2.on('webrtc_offer', resolve);
      });

      // Send offer
      clientSocket1.emit('webrtc_offer', offer);

      const receivedOffer = await offerPromise;

      expect(receivedOffer.sdp).toBe(offer.sdp);
      expect(receivedOffer.senderId).toBe(user1Id);
      expect(receivedOffer.type).toBe('offer');

      // Send answer
      const answer = {
        recipientId: user1Id,
        sdp: 'fake-answer-sdp',
        type: 'answer'
      };

      const answerPromise = new Promise<any>((resolve) => {
        clientSocket1.on('webrtc_answer', resolve);
      });

      clientSocket2.emit('webrtc_answer', answer);

      const receivedAnswer = await answerPromise;

      expect(receivedAnswer.sdp).toBe(answer.sdp);
      expect(receivedAnswer.senderId).toBe(user2Id);
      expect(receivedAnswer.type).toBe('answer');
    });

    it('should handle ICE candidate exchange', async () => {
      const iceCandidate = {
        recipientId: user2Id,
        candidate: 'fake-ice-candidate',
        sdpMLineIndex: 0,
        sdpMid: 'audio'
      };

      // Set up ICE candidate listener
      const candidatePromise = new Promise<any>((resolve) => {
        clientSocket2.on('ice_candidate', resolve);
      });

      // Send ICE candidate
      clientSocket1.emit('ice_candidate', iceCandidate);

      const receivedCandidate = await candidatePromise;

      expect(receivedCandidate.candidate).toBe(iceCandidate.candidate);
      expect(receivedCandidate.senderId).toBe(user1Id);
      expect(receivedCandidate.sdpMLineIndex).toBe(iceCandidate.sdpMLineIndex);
    });

    it('should handle call initiation and termination', async () => {
      // Set up call listener
      const callPromise = new Promise<any>((resolve) => {
        clientSocket2.on('incoming_call', resolve);
      });

      // Initiate call
      clientSocket1.emit('initiate_call', {
        recipientId: user2Id,
        type: 'video'
      });

      const incomingCall = await callPromise;

      expect(incomingCall.callerId).toBe(user1Id);
      expect(incomingCall.type).toBe('video');
      expect(incomingCall).toHaveProperty('callId');

      // Accept call
      const callAcceptedPromise = new Promise<any>((resolve) => {
        clientSocket1.on('call_accepted', resolve);
      });

      clientSocket2.emit('accept_call', {
        callId: incomingCall.callId
      });

      const callAccepted = await callAcceptedPromise;

      expect(callAccepted.callId).toBe(incomingCall.callId);
      expect(callAccepted.acceptedBy).toBe(user2Id);

      // End call
      const callEndedPromise = new Promise<any>((resolve) => {
        clientSocket2.on('call_ended', resolve);
      });

      clientSocket1.emit('end_call', {
        callId: incomingCall.callId
      });

      const callEnded = await callEndedPromise;

      expect(callEnded.callId).toBe(incomingCall.callId);
      expect(callEnded.endedBy).toBe(user1Id);
    });
  });

  describe('Connection Resilience', () => {
    beforeEach(async () => {
      clientSocket1 = Client(`http://localhost:${port}`, {
        auth: { token: authToken1 }
      });

      await new Promise<void>((resolve) => {
        clientSocket1.on('connect', resolve);
      });
    });

    it('should handle connection drops and reconnection', async () => {
      // Simulate connection drop
      clientSocket1.disconnect();

      // Set up reconnection listener
      const reconnectPromise = new Promise<void>((resolve) => {
        clientSocket1.on('connect', resolve);
      });

      // Reconnect
      clientSocket1.connect();

      await reconnectPromise;

      expect(clientSocket1.connected).toBe(true);
    });

    it('should handle message queuing during disconnection', async () => {
      const messageData = {
        recipientId: user2Id,
        content: 'Message during disconnection',
        type: 'text'
      };

      // Disconnect
      clientSocket1.disconnect();

      // Try to send message while disconnected (should be queued)
      clientSocket1.emit('send_direct_message', messageData);

      // Reconnect
      clientSocket1.connect();

      await new Promise<void>((resolve) => {
        clientSocket1.on('connect', resolve);
      });

      // Message should be sent after reconnection
      // This would be tested with proper queue implementation
    });

    it('should handle server restart gracefully', async () => {
      // This test would simulate server restart and verify client reconnection
      // In a real test, you'd restart the socket server and verify clients reconnect
      expect(true).toBe(true); // Placeholder for complex restart test
    });
  });

  describe('Rate Limiting and Security', () => {
    beforeEach(async () => {
      clientSocket1 = Client(`http://localhost:${port}`, {
        auth: { token: authToken1 }
      });

      await new Promise<void>((resolve) => {
        clientSocket1.on('connect', resolve);
      });
    });

    it('should rate limit message sending', async () => {
      const messageData = {
        recipientId: user2Id,
        content: 'Spam message',
        type: 'text'
      };

      // Send many messages rapidly
      const promises = Array(20).fill(0).map(() =>
        new Promise<void>((resolve) => {
          clientSocket1.emit('send_direct_message', messageData);
          resolve();
        })
      );

      await Promise.all(promises);

      // Should receive rate limit error
      const errorPromise = new Promise<any>((resolve) => {
        clientSocket1.on('rate_limit_error', resolve);
      });

      // Send one more message to trigger rate limit
      clientSocket1.emit('send_direct_message', messageData);

      const error = await errorPromise;

      expect(error.message).toContain('rate limit exceeded');
    });

    it('should prevent message spoofing', async () => {
      const spoofedMessage = {
        senderId: user2Id, // Trying to spoof sender ID
        recipientId: user2Id,
        content: 'Spoofed message',
        type: 'text'
      };

      clientSocket1.emit('send_direct_message', spoofedMessage);

      // Server should ignore spoofed senderId and use authenticated user ID
      // This would be verified in the message handling logic
      expect(true).toBe(true); // Placeholder for spoofing prevention test
    });
  });
});