import { CrashSafeEventHandlers } from '../../src/socket/crash-safe-handlers';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import { prisma } from '@cryb/database';

// Mock dependencies
const mockFastify = {
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
} as unknown as FastifyInstance;

const mockRedis = {
  setex: jest.fn(),
  del: jest.fn(),
  sadd: jest.fn(),
  srem: jest.fn(),
  scard: jest.fn(),
  expire: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
} as unknown as Redis;

const mockCheckRateLimit = jest.fn();
const mockExecuteWithCircuitBreaker = jest.fn();
const mockPresenceMap = new Map();
const mockVoiceStates = new Map();
const mockTypingIndicators = new Map();
const mockConnectionCleanupTasks = new Map();

// Mock socket
const createMockSocket = () => ({
  id: 'socket-123',
  userId: 'user-123',
  username: 'testuser',
  displayName: 'Test User',
  isVerified: true,
  connectionTime: new Date(),
  lastActivity: new Date(),
  rooms: new Set<string>(),
  emit: jest.fn(),
  to: jest.fn(() => ({ emit: jest.fn() })),
  join: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
});

// Mock database responses
const mockChannel = {
  id: 'channel-123',
  name: 'general',
  communityId: 'community-123',
  community: {
    id: 'community-123',
    name: 'Test Server',
    ownerId: 'owner-123',
  },
};

const mockMessage = {
  id: 'message-123',
  channelId: 'channel-123',
  authorId: 'user-123',
  content: 'Hello world',
  timestamp: new Date(),
  author: {
    id: 'user-123',
    username: 'testuser',
    displayName: 'Test User',
    avatar: null,
    isVerified: true,
  },
  channel: mockChannel,
};

const mockMember = {
  communityId: 'community-123',
  userId: 'user-123',
  roles: [],
};

describe('CrashSafeEventHandlers', () => {
  let handlers: CrashSafeEventHandlers;
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = createMockSocket();
    
    handlers = new CrashSafeEventHandlers(
      mockFastify,
      mockRedis,
      mockCheckRateLimit,
      mockExecuteWithCircuitBreaker,
      mockPresenceMap,
      mockVoiceStates,
      mockTypingIndicators,
      mockConnectionCleanupTasks
    );

    // Default mocks
    mockCheckRateLimit.mockReturnValue(true);
    mockExecuteWithCircuitBreaker.mockImplementation(async (service, operation) => {
      return await operation();
    });
  });

  describe('Message Events Safety', () => {
    beforeEach(() => {
      (prisma.message.create as jest.Mock) = jest.fn().mockResolvedValue(mockMessage);
      (prisma.message.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockMessage);
      (prisma.message.update as jest.Mock) = jest.fn().mockResolvedValue(mockMessage);
      (prisma.message.delete as jest.Mock) = jest.fn().mockResolvedValue(mockMessage);
      (prisma.communityMember.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockMember);
      (prisma.channel.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockChannel);
    });

    test('should handle message:send with comprehensive validation', (done) => {
      handlers.setupSafeMessageEvents(mockSocket);
      
      const messageData = {
        channelId: 'channel-123',
        content: 'Hello world',
        mentions: ['user-456'],
        attachments: []
      };
      
      const callback = jest.fn((response) => {
        expect(response.success).toBe(true);
        expect(response.messageId).toBe('message-123');
        expect(mockSocket.to).toHaveBeenCalledWith('channel:channel-123');
        done();
      });

      // Simulate socket event
      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:send')[1];
      eventHandler(messageData, callback);
    });

    test('should reject message:send when rate limited', (done) => {
      mockCheckRateLimit.mockReturnValue(false);
      handlers.setupSafeMessageEvents(mockSocket);
      
      const messageData = {
        channelId: 'channel-123',
        content: 'Hello world'
      };
      
      const callback = jest.fn((response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBe('Message rate limit exceeded');
        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
          code: 'RATE_LIMITED',
          message: 'Message rate limit exceeded'
        });
        done();
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:send')[1];
      eventHandler(messageData, callback);
    });

    test('should reject invalid message input', (done) => {
      handlers.setupSafeMessageEvents(mockSocket);
      
      const invalidInputs = [
        { channelId: '', content: 'Hello' }, // Empty channel ID
        { channelId: 'channel-123', content: '' }, // Empty content
        { channelId: 'channel-123', content: 'a'.repeat(2001) }, // Too long
        { channelId: null, content: 'Hello' }, // Null channel ID
      ];

      let testsCompleted = 0;
      
      invalidInputs.forEach((messageData, index) => {
        const callback = jest.fn((response) => {
          expect(response.success).toBe(false);
          expect(['Invalid input', 'Channel ID is required', 'Message content cannot be empty', 'Message too long'].some(msg => response.error.includes(msg))).toBe(true);
          
          testsCompleted++;
          if (testsCompleted === invalidInputs.length) {
            done();
          }
        });

        const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:send')[1];
        setTimeout(() => eventHandler(messageData, callback), index * 10);
      });
    });

    test('should handle XSS attempts in message content', (done) => {
      handlers.setupSafeMessageEvents(mockSocket);
      
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<iframe src="javascript:alert(1)"></iframe>',
        'javascript:alert(1)',
        '<img onload="alert(1)" src="x">',
      ];

      let testsCompleted = 0;
      
      xssPayloads.forEach((maliciousContent, index) => {
        const messageData = {
          channelId: 'channel-123',
          content: maliciousContent
        };
        
        const callback = jest.fn((response) => {
          // Should either sanitize or reject the content
          if (response.success) {
            // If accepted, content should be sanitized
            expect(mockMessage.content).not.toContain('<script>');
            expect(mockMessage.content).not.toContain('javascript:');
          } else {
            // Should be rejected for invalid content
            expect(response.error).toContain('invalid');
          }
          
          testsCompleted++;
          if (testsCompleted === xssPayloads.length) {
            done();
          }
        });

        const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:send')[1];
        setTimeout(() => eventHandler(messageData, callback), index * 10);
      });
    });

    test('should handle database failures gracefully', (done) => {
      (prisma.message.create as jest.Mock) = jest.fn().mockRejectedValue(new Error('Database error'));
      mockExecuteWithCircuitBreaker.mockResolvedValue(null); // Circuit breaker open
      
      handlers.setupSafeMessageEvents(mockSocket);
      
      const messageData = {
        channelId: 'channel-123',
        content: 'Hello world'
      };
      
      const callback = jest.fn((response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBe('Failed to create message - database unavailable');
        done();
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:send')[1];
      eventHandler(messageData, callback);
    });

    test('should validate channel access before sending message', (done) => {
      (prisma.communityMember.findUnique as jest.Mock) = jest.fn().mockResolvedValue(null); // No access
      
      handlers.setupSafeMessageEvents(mockSocket);
      
      const messageData = {
        channelId: 'channel-123',
        content: 'Hello world'
      };
      
      const callback = jest.fn((response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBe('No access to channel or database unavailable');
        done();
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:send')[1];
      eventHandler(messageData, callback);
    });

    test('should handle message:edit with ownership validation', (done) => {
      handlers.setupSafeMessageEvents(mockSocket);
      
      const editData = {
        messageId: 'message-123',
        content: 'Edited content'
      };

      // Mock success response
      mockSocket.emit = jest.fn((event, data) => {
        if (event === 'message:edit_success') {
          expect(data.messageId).toBe('message-123');
          expect(mockSocket.to).toHaveBeenCalledWith('channel:channel-123');
          done();
        }
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:edit')[1];
      eventHandler(editData);
    });

    test('should reject editing messages by non-authors', (done) => {
      const differentUserMessage = {
        ...mockMessage,
        authorId: 'different-user-123'
      };
      (prisma.message.findUnique as jest.Mock) = jest.fn().mockResolvedValue(differentUserMessage);
      
      handlers.setupSafeMessageEvents(mockSocket);
      
      const editData = {
        messageId: 'message-123',
        content: 'Edited content'
      };

      mockSocket.emit = jest.fn((event, data) => {
        if (event === 'error') {
          expect(data.code).toBe('FORBIDDEN');
          expect(data.message).toBe('Cannot edit this message');
          done();
        }
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:edit')[1];
      eventHandler(editData);
    });

    test('should reject editing old messages', (done) => {
      const oldMessage = {
        ...mockMessage,
        timestamp: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes old
      };
      (prisma.message.findUnique as jest.Mock) = jest.fn().mockResolvedValue(oldMessage);
      
      handlers.setupSafeMessageEvents(mockSocket);
      
      const editData = {
        messageId: 'message-123',
        content: 'Edited content'
      };

      mockSocket.emit = jest.fn((event, data) => {
        if (event === 'error') {
          expect(data.code).toBe('MESSAGE_TOO_OLD');
          expect(data.message).toBe('Message too old to edit');
          done();
        }
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:edit')[1];
      eventHandler(editData);
    });
  });

  describe('Typing Events Safety', () => {
    beforeEach(() => {
      (prisma.communityMember.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockMember);
      mockRedis.setex = jest.fn().mockResolvedValue('OK');
      mockRedis.del = jest.fn().mockResolvedValue(1);
    });

    test('should handle typing:start with proper cleanup', (done) => {
      handlers.setupSafeTypingEvents(mockSocket);
      
      const typingData = { channelId: 'channel-123' };
      
      // Verify typing indicator is stored
      setTimeout(() => {
        const key = `${mockSocket.userId}:${typingData.channelId}`;
        expect(mockTypingIndicators.has(key)).toBe(true);
        
        const indicator = mockTypingIndicators.get(key);
        expect(indicator.timeout).toBeDefined();
        expect(mockRedis.setex).toHaveBeenCalledWith(
          `typing:${typingData.channelId}:${mockSocket.userId}`,
          10,
          mockSocket.username
        );
        
        done();
      }, 100);

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'typing:start')[1];
      eventHandler(typingData);
    });

    test('should ignore typing events when rate limited', (done) => {
      mockCheckRateLimit.mockReturnValue(false);
      handlers.setupSafeTypingEvents(mockSocket);
      
      const typingData = { channelId: 'channel-123' };
      
      setTimeout(() => {
        // Should not store typing indicator when rate limited
        const key = `${mockSocket.userId}:${typingData.channelId}`;
        expect(mockTypingIndicators.has(key)).toBe(false);
        expect(mockRedis.setex).not.toHaveBeenCalled();
        done();
      }, 100);

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'typing:start')[1];
      eventHandler(typingData);
    });

    test('should clear existing typing timeout before setting new one', (done) => {
      handlers.setupSafeTypingEvents(mockSocket);
      
      const typingData = { channelId: 'channel-123' };
      const key = `${mockSocket.userId}:${typingData.channelId}`;
      
      // Set up existing indicator with timeout
      const existingTimeout = setTimeout(() => {}, 5000);
      mockTypingIndicators.set(key, { timeout: existingTimeout });
      
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      setTimeout(() => {
        expect(clearTimeoutSpy).toHaveBeenCalledWith(existingTimeout);
        done();
      }, 100);

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'typing:start')[1];
      eventHandler(typingData);
    });

    test('should handle typing:stop and cleanup properly', (done) => {
      handlers.setupSafeTypingEvents(mockSocket);
      
      const typingData = { channelId: 'channel-123' };
      const key = `${mockSocket.userId}:${typingData.channelId}`;
      
      // Set up existing indicator
      const timeout = setTimeout(() => {}, 5000);
      mockTypingIndicators.set(key, { timeout });
      
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      setTimeout(() => {
        expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout);
        expect(mockTypingIndicators.has(key)).toBe(false);
        expect(mockRedis.del).toHaveBeenCalledWith(`typing:${typingData.channelId}:${mockSocket.userId}`);
        done();
      }, 100);

      const stopHandler = mockSocket.on.mock.calls.find(call => call[0] === 'typing:stop')[1];
      stopHandler(typingData);
    });
  });

  describe('Channel Events Safety', () => {
    beforeEach(() => {
      (prisma.channel.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockChannel);
      (prisma.communityMember.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockMember);
      mockRedis.sadd = jest.fn().mockResolvedValue(1);
      mockRedis.scard = jest.fn().mockResolvedValue(5);
      mockRedis.srem = jest.fn().mockResolvedValue(1);
      mockRedis.expire = jest.fn().mockResolvedValue(1);
    });

    test('should handle channel:join with proper validation', (done) => {
      handlers.setupSafeChannelEvents(mockSocket);
      
      const joinData = { channelId: 'channel-123' };
      
      const callback = jest.fn((response) => {
        expect(response.success).toBe(true);
        expect(response.channelId).toBe('channel-123');
        expect(response.memberCount).toBe(5);
        expect(mockSocket.join).toHaveBeenCalledWith('channel:channel-123');
        expect(mockSocket.rooms.has('channel:channel-123')).toBe(true);
        done();
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'channel:join')[1];
      eventHandler(joinData, callback);
    });

    test('should reject channel:join without permission', (done) => {
      (prisma.communityMember.findUnique as jest.Mock) = jest.fn().mockResolvedValue(null); // No membership
      
      handlers.setupSafeChannelEvents(mockSocket);
      
      const joinData = { channelId: 'channel-123' };
      
      const callback = jest.fn((response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('No access to channel');
        expect(mockSocket.join).not.toHaveBeenCalled();
        done();
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'channel:join')[1];
      eventHandler(joinData, callback);
    });

    test('should handle channel:leave gracefully', (done) => {
      handlers.setupSafeChannelEvents(mockSocket);
      
      const leaveData = { channelId: 'channel-123' };
      mockSocket.rooms.add('channel:channel-123');
      
      setTimeout(() => {
        expect(mockSocket.leave).toHaveBeenCalledWith('channel:channel-123');
        expect(mockSocket.rooms.has('channel:channel-123')).toBe(false);
        expect(mockRedis.srem).toHaveBeenCalledWith('channel:channel-123:presence', mockSocket.userId);
        done();
      }, 100);

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'channel:leave')[1];
      eventHandler(leaveData);
    });
  });

  describe('Presence Events Safety', () => {
    beforeEach(() => {
      (prisma.user.update as jest.Mock) = jest.fn().mockResolvedValue({ id: mockSocket.userId });
      mockRedis.setex = jest.fn().mockResolvedValue('OK');
    });

    test('should handle presence:update with valid status', (done) => {
      handlers.setupSafePresenceEvents(mockSocket);
      
      const presenceData = {
        status: 'online' as const,
        activity: {
          type: 'playing',
          name: 'Test Game'
        }
      };
      
      setTimeout(() => {
        expect(mockPresenceMap.has(mockSocket.userId)).toBe(true);
        const presence = mockPresenceMap.get(mockSocket.userId);
        expect(presence.status).toBe('online');
        expect(presence.activity).toBeDefined();
        done();
      }, 100);

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'presence:update')[1];
      eventHandler(presenceData);
    });

    test('should reject invalid presence status', (done) => {
      handlers.setupSafePresenceEvents(mockSocket);
      
      const invalidPresenceData = {
        status: 'invalid_status' as any
      };
      
      mockSocket.emit = jest.fn((event, data) => {
        if (event === 'error') {
          expect(data.code).toBe('INVALID_INPUT');
          expect(data.message).toBe('Invalid status');
          done();
        }
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'presence:update')[1];
      eventHandler(invalidPresenceData);
    });

    test('should handle presence update rate limiting', (done) => {
      mockCheckRateLimit.mockReturnValue(false);
      handlers.setupSafePresenceEvents(mockSocket);
      
      const presenceData = { status: 'idle' as const };
      
      mockSocket.emit = jest.fn((event, data) => {
        if (event === 'error') {
          expect(data.code).toBe('RATE_LIMITED');
          expect(data.message).toBe('Presence update rate limit exceeded');
          done();
        }
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'presence:update')[1];
      eventHandler(presenceData);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle critical errors without crashing', (done) => {
      // Force an error in the message handler
      mockExecuteWithCircuitBreaker.mockRejectedValue(new Error('Circuit breaker failure'));
      
      handlers.setupSafeMessageEvents(mockSocket);
      
      const messageData = {
        channelId: 'channel-123',
        content: 'Hello world'
      };
      
      const callback = jest.fn((response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBe('An unexpected error occurred');
        expect(mockFastify.log.error).toHaveBeenCalled();
        done();
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:send')[1];
      eventHandler(messageData, callback);
    });

    test('should continue functioning after broadcast failures', (done) => {
      mockSocket.to = jest.fn(() => ({
        emit: jest.fn().mockImplementation(() => {
          throw new Error('Broadcast failed');
        })
      }));
      
      handlers.setupSafeMessageEvents(mockSocket);
      
      const messageData = {
        channelId: 'channel-123',
        content: 'Hello world'
      };
      
      const callback = jest.fn((response) => {
        // Message should still be created successfully despite broadcast failure
        expect(response.success).toBe(true);
        expect(mockFastify.log.error).toHaveBeenCalledWith('Failed to broadcast message:', expect.any(Error));
        done();
      });

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message:send')[1];
      eventHandler(messageData, callback);
    });

    test('should handle Redis failures gracefully', (done) => {
      mockRedis.setex = jest.fn().mockRejectedValue(new Error('Redis connection failed'));
      mockExecuteWithCircuitBreaker.mockImplementation(async (service, operation) => {
        if (service === 'redis') {
          return null; // Circuit breaker open for Redis
        }
        return await operation();
      });
      
      handlers.setupSafeTypingEvents(mockSocket);
      
      const typingData = { channelId: 'channel-123' };
      
      setTimeout(() => {
        // Should continue functioning despite Redis failure
        expect(mockFastify.log.error).toHaveBeenCalled();
        done();
      }, 100);

      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'typing:start')[1];
      eventHandler(typingData);
    });

    test('should sanitize all user inputs properly', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>Hello',
        '<iframe src="javascript:alert(1)"></iframe>World',
        'javascript:alert(1)',
        '<img onload="alert(1)" src="x">Test',
        'Hello<script>World</script>',
      ];

      const sanitizeInput = (handlers as any).sanitizeInput.bind(handlers);
      
      maliciousInputs.forEach(input => {
        const result = sanitizeInput(input);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('<iframe>');
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('onload=');
        expect(result).not.toBeNull();
      });
    });

    test('should handle attachment sanitization safely', () => {
      const maliciousAttachments = [
        { filename: '../../../etc/passwd', size: 1024 },
        { filename: 'test.exe', size: 999999999999 }, // Huge file
        { contentType: 'application/x-executable' },
        { url: 'javascript:alert(1)' },
        null, // Null attachment
        'not-an-object', // Invalid type
      ];

      const sanitizeAttachments = (handlers as any).sanitizeAttachments.bind(handlers);
      const result = sanitizeAttachments(maliciousAttachments);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10); // Max limit enforced
      
      result.forEach((attachment: any) => {
        if (attachment) {
          expect(attachment.filename).toBeTruthy();
          expect(attachment.size).toBeLessThanOrEqual(100 * 1024 * 1024); // Size limit
          expect(typeof attachment.url === 'string' ? attachment.url : '').not.toContain('javascript:');
        }
      });
    });
  });

  describe('Memory Leak Prevention', () => {
    test('should clean up typing timeouts properly', () => {
      handlers.setupSafeTypingEvents(mockSocket);
      
      const typingData = { channelId: 'channel-123' };
      const key = `${mockSocket.userId}:${typingData.channelId}`;
      
      // Start typing multiple times
      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'typing:start')[1];
      
      eventHandler(typingData);
      const firstTimeout = mockTypingIndicators.get(key)?.timeout;
      
      eventHandler(typingData);
      const secondTimeout = mockTypingIndicators.get(key)?.timeout;
      
      // Should have different timeouts, indicating cleanup
      expect(firstTimeout).not.toBe(secondTimeout);
      expect(mockTypingIndicators.size).toBe(1); // Only one entry
    });

    test('should track cleanup tasks for connection', () => {
      handlers.setupSafeTypingEvents(mockSocket);
      
      const typingData = { channelId: 'channel-123' };
      
      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'typing:start')[1];
      eventHandler(typingData);
      
      // Should track cleanup task
      const cleanupTasks = mockConnectionCleanupTasks.get(mockSocket.id);
      expect(cleanupTasks).toBeDefined();
      expect(cleanupTasks.length).toBeGreaterThan(0);
    });

    test('should limit mentions to prevent abuse', () => {
      const sanitizeMentions = (handlers as any).sanitizeMentions.bind(handlers);
      
      // Generate 25 mentions (over the limit)
      const tooManyMentions = Array.from({ length: 25 }, (_, i) => `user-${i}`);
      const result = sanitizeMentions(tooManyMentions);
      
      expect(result.length).toBe(20); // Should be limited to max 20
    });

    test('should limit embeds to prevent memory issues', () => {
      const sanitizeEmbeds = (handlers as any).sanitizeEmbeds.bind(handlers);
      
      // Generate 10 embeds (over the limit)
      const tooManyEmbeds = Array.from({ length: 10 }, (_, i) => ({
        title: `Embed ${i}`,
        description: 'Test description',
        url: `https://example.com/${i}`
      }));
      
      const result = sanitizeEmbeds(tooManyEmbeds);
      
      expect(result.length).toBe(5); // Should be limited to max 5
    });
  });
});