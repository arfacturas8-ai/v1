/**
 * ==============================================
 * COMPREHENSIVE TESTS FOR WEBSOCKET MONITORING
 * ==============================================
 * Tests for ClientWebSocketMonitor class and useWebSocketMonitoring hook
 * ==============================================
 */

import ClientWebSocketMonitor, { useWebSocketMonitoring } from './WebSocketMonitoring';
import RealUserMetrics from '../performance/RealUserMetrics';
import * as Sentry from '@sentry/react';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
jest.mock('../performance/RealUserMetrics', () => ({
  trackEvent: jest.fn()
}));

jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn()
}));

// Mock timers
jest.useFakeTimers();

describe('ClientWebSocketMonitor', () => {
  let mockSocket;
  let monitor;
  let eventHandlers;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Reset event handlers
    eventHandlers = {};

    // Create mock socket
    mockSocket = {
      id: 'test-socket-id-123',
      connected: true,
      io: {
        engine: {
          transport: {
            name: 'websocket'
          },
          upgrades: ['websocket']
        }
      },
      on: jest.fn((event, handler) => {
        eventHandlers[event] = handler;
      }),
      emit: jest.fn(),
      off: jest.fn()
    };
  });

  afterEach(() => {
    if (monitor) {
      monitor.destroy();
    }
  });

  // ==============================================
  // INITIALIZATION TESTS
  // ==============================================

  describe('Initialization', () => {
    test('should initialize with valid socket', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);

      expect(monitor.socket).toBe(mockSocket);
      expect(monitor.isMonitoring).toBe(true);
      expect(monitor.connectionId).toBe('test-socket-id-123');
      expect(monitor.metrics.connectionStart).toBeDefined();
      expect(monitor.metrics.qualityScore).toBe(100);
    });

    test('should not initialize with null socket', () => {
      monitor = new ClientWebSocketMonitor(null);

      expect(monitor.socket).toBeNull();
      expect(monitor.isMonitoring).toBe(false);
      expect(monitor.connectionId).toBeNull();
    });

    test('should setup event listeners on initialization', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('pong', expect.any(Function));
    });

    test('should initialize with default metrics', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);

      expect(monitor.metrics).toMatchObject({
        latencyHistory: [],
        messagesSent: 0,
        messagesReceived: 0,
        errorsCount: 0,
        reconnectCount: 0,
        qualityScore: 100,
        lastPingTime: null,
        averageLatency: 0,
        jitter: 0,
        bandwidthUsage: { sent: 0, received: 0 }
      });
    });

    test('should initialize with default config', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);

      expect(monitor.config.pingInterval).toBe(5000);
      expect(monitor.config.maxLatencyHistory).toBe(20);
      expect(monitor.config.qualityThresholds).toEqual({
        excellent: 90,
        good: 70,
        fair: 50,
        poor: 30
      });
    });
  });

  // ==============================================
  // CONNECTION EVENT HANDLERS
  // ==============================================

  describe('Connection Events', () => {
    beforeEach(() => {
      monitor = new ClientWebSocketMonitor(mockSocket);
    });

    test('should handle connect event', () => {
      eventHandlers.connect();

      expect(monitor.connectionId).toBe('test-socket-id-123');
      expect(monitor.metrics.connectionStart).toBeDefined();
      expect(RealUserMetrics.trackEvent).toHaveBeenCalledWith(
        'websocket_connection',
        expect.objectContaining({
          event: 'connect',
          transport: 'websocket',
          socketId: 'test-socket-id-123'
        })
      );
    });

    test('should handle disconnect event with reason', () => {
      const disconnectReason = 'transport close';
      monitor.metrics.messagesSent = 10;
      monitor.metrics.messagesReceived = 15;
      monitor.metrics.errorsCount = 2;

      eventHandlers.disconnect(disconnectReason);

      expect(monitor.isMonitoring).toBe(false);
      expect(RealUserMetrics.trackEvent).toHaveBeenCalledWith(
        'websocket_connection',
        expect.objectContaining({
          event: 'disconnect',
          reason: disconnectReason,
          qualityScore: 100
        })
      );
    });

    test('should handle reconnect event', () => {
      const attemptNumber = 3;

      eventHandlers.reconnect(attemptNumber);

      expect(monitor.metrics.reconnectCount).toBe(1);
      expect(RealUserMetrics.trackEvent).toHaveBeenCalledWith(
        'websocket_connection',
        expect.objectContaining({
          event: 'reconnect',
          attemptNumber: 3,
          totalReconnects: 1
        })
      );
    });

    test('should track multiple reconnects', () => {
      eventHandlers.reconnect(1);
      eventHandlers.reconnect(2);
      eventHandlers.reconnect(3);

      expect(monitor.metrics.reconnectCount).toBe(3);
    });

    test('should handle reconnect error', () => {
      const error = new Error('Connection failed');

      eventHandlers.reconnect_error(error);

      expect(monitor.metrics.errorsCount).toBe(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            component: 'websocket_monitor',
            event_type: 'reconnect_error'
          }
        })
      );
    });

    test('should handle general socket error', () => {
      const error = new Error('Socket error');
      error.type = 'transport_error';

      eventHandlers.error(error);

      expect(monitor.metrics.errorsCount).toBe(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            component: 'websocket_monitor',
            event_type: 'socket_error'
          }
        })
      );
    });
  });

  // ==============================================
  // LATENCY MONITORING
  // ==============================================

  describe('Latency Monitoring', () => {
    beforeEach(() => {
      monitor = new ClientWebSocketMonitor(mockSocket);
    });

    test('should start ping monitoring', () => {
      jest.advanceTimersByTime(5000);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'ping',
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      );
    });

    test('should send ping at configured intervals', () => {
      jest.advanceTimersByTime(5000);
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(5000);
      expect(mockSocket.emit).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(5000);
      expect(mockSocket.emit).toHaveBeenCalledTimes(3);
    });

    test('should not send ping when socket is disconnected', () => {
      mockSocket.connected = false;

      jest.advanceTimersByTime(5000);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    test('should handle pong response and calculate latency', () => {
      const pingTime = Date.now();
      monitor.metrics.lastPingTime = pingTime;

      jest.advanceTimersByTime(50); // 50ms latency

      eventHandlers.pong({ timestamp: pingTime });

      expect(monitor.metrics.latencyHistory).toContain(50);
      expect(monitor.metrics.averageLatency).toBe(50);
    });

    test('should maintain latency history with max length', () => {
      for (let i = 0; i < 25; i++) {
        monitor.updateLatencyMetrics(100 + i);
      }

      expect(monitor.metrics.latencyHistory.length).toBe(20);
      expect(monitor.metrics.latencyHistory[0]).toBe(105); // First 5 dropped
    });

    test('should calculate average latency correctly', () => {
      monitor.updateLatencyMetrics(100);
      monitor.updateLatencyMetrics(200);
      monitor.updateLatencyMetrics(300);

      expect(monitor.metrics.averageLatency).toBe(200);
    });

    test('should calculate jitter from latency variations', () => {
      monitor.updateLatencyMetrics(100);
      monitor.updateLatencyMetrics(150);
      monitor.updateLatencyMetrics(120);

      // Jitter = average of [|150-100|, |120-150|] = (50 + 30) / 2 = 40
      expect(monitor.metrics.jitter).toBe(40);
    });

    test('should handle ping timeout', () => {
      const pingTime = Date.now();
      monitor.metrics.lastPingTime = pingTime;
      const initialQuality = monitor.metrics.qualityScore;

      jest.advanceTimersByTime(10000); // 10 second timeout

      monitor.handlePingTimeout();

      expect(monitor.metrics.errorsCount).toBe(1);
      expect(monitor.metrics.qualityScore).toBe(initialQuality - 20);
    });

    test('should not handle timeout if pong received', () => {
      const pingTime = Date.now();
      monitor.metrics.lastPingTime = pingTime;

      // Receive pong before timeout
      monitor.metrics.lastPingTime = pingTime + 1;

      jest.advanceTimersByTime(10000);

      expect(monitor.metrics.errorsCount).toBe(0);
    });
  });

  // ==============================================
  // MESSAGE MONITORING
  // ==============================================

  describe('Message Monitoring', () => {
    beforeEach(() => {
      monitor = new ClientWebSocketMonitor(mockSocket);
    });

    test('should track outgoing messages', () => {
      const originalEmit = mockSocket.emit;
      monitor.setupMessageMonitoring();

      mockSocket.emit('test-event', { data: 'test' });

      expect(monitor.metrics.messagesSent).toBe(1);
    });

    test('should calculate message size for outgoing messages', () => {
      monitor.trackOutgoingMessage(['test-event', { data: 'hello world' }]);

      const expectedSize = JSON.stringify({ data: 'hello world' }).length;
      expect(monitor.metrics.bandwidthUsage.sent).toBe(expectedSize);
    });

    test('should track multiple outgoing messages', () => {
      monitor.trackOutgoingMessage(['event1', { data: 'test1' }]);
      monitor.trackOutgoingMessage(['event2', { data: 'test2' }]);
      monitor.trackOutgoingMessage(['event3', { data: 'test3' }]);

      expect(monitor.metrics.messagesSent).toBe(3);
    });

    test('should track incoming messages', () => {
      monitor.trackIncomingMessage('test-event', [{ data: 'test' }]);

      expect(monitor.metrics.messagesReceived).toBe(1);
    });

    test('should calculate message size for incoming messages', () => {
      const testData = [{ data: 'hello world' }];
      monitor.trackIncomingMessage('test-event', testData);

      const expectedSize = JSON.stringify(testData).length;
      expect(monitor.metrics.bandwidthUsage.received).toBe(expectedSize);
    });

    test('should track bandwidth usage separately for sent and received', () => {
      monitor.trackOutgoingMessage(['event1', { data: 'sent' }]);
      monitor.trackIncomingMessage('event2', [{ data: 'received' }]);

      expect(monitor.metrics.bandwidthUsage.sent).toBeGreaterThan(0);
      expect(monitor.metrics.bandwidthUsage.received).toBeGreaterThan(0);
    });

    test('should handle message size calculation errors', () => {
      const circularRef = {};
      circularRef.self = circularRef;

      const size = monitor.calculateMessageSize(circularRef);

      expect(size).toBe(0);
    });

    test('should emit tracking events for messages', () => {
      monitor.trackOutgoingMessage(['test-event', { data: 'test' }]);

      expect(RealUserMetrics.trackEvent).toHaveBeenCalledWith(
        'websocket_message',
        expect.objectContaining({
          direction: 'outgoing',
          event: 'test-event',
          socketId: 'test-socket-id-123'
        })
      );
    });
  });

  // ==============================================
  // QUALITY SCORING
  // ==============================================

  describe('Quality Scoring', () => {
    beforeEach(() => {
      monitor = new ClientWebSocketMonitor(mockSocket);
    });

    test('should start with excellent quality score', () => {
      expect(monitor.metrics.qualityScore).toBe(100);
      expect(monitor.getQualityTier()).toBe('excellent');
    });

    test('should reduce quality score based on latency', () => {
      monitor.updateLatencyMetrics(600); // Poor latency (> 500ms)
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBeLessThan(100);
    });

    test('should calculate excellent quality tier', () => {
      monitor.metrics.qualityScore = 95;
      expect(monitor.getQualityTier()).toBe('excellent');
    });

    test('should calculate good quality tier', () => {
      monitor.metrics.qualityScore = 80;
      expect(monitor.getQualityTier()).toBe('good');
    });

    test('should calculate fair quality tier', () => {
      monitor.metrics.qualityScore = 60;
      expect(monitor.getQualityTier()).toBe('fair');
    });

    test('should calculate poor quality tier', () => {
      monitor.metrics.qualityScore = 20;
      expect(monitor.getQualityTier()).toBe('poor');
    });

    test('should reduce score for poor latency (>500ms)', () => {
      monitor.updateLatencyMetrics(600);
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBe(60); // 100 - 40
    });

    test('should reduce score for fair latency (300-500ms)', () => {
      monitor.updateLatencyMetrics(400);
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBe(70); // 100 - 30
    });

    test('should reduce score for good latency (150-300ms)', () => {
      monitor.updateLatencyMetrics(200);
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBe(80); // 100 - 20
    });

    test('should reduce score for acceptable latency (50-150ms)', () => {
      monitor.updateLatencyMetrics(100);
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBe(90); // 100 - 10
    });

    test('should not reduce score for excellent latency (<50ms)', () => {
      monitor.updateLatencyMetrics(30);
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBe(100);
    });

    test('should reduce score based on jitter', () => {
      monitor.metrics.jitter = 50;
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBeLessThan(100);
    });

    test('should reduce score based on error rate', () => {
      monitor.metrics.messagesSent = 50;
      monitor.metrics.messagesReceived = 50;
      monitor.metrics.errorsCount = 10;

      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBeLessThan(100);
    });

    test('should reduce score based on reconnections', () => {
      monitor.metrics.reconnectCount = 3;
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBe(85); // 100 - 15 (3 * 5)
    });

    test('should apply maximum penalties correctly', () => {
      monitor.metrics.jitter = 100; // Max 20 penalty
      monitor.metrics.reconnectCount = 5; // Max 10 penalty

      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBeLessThanOrEqual(70);
    });

    test('should never go below 0 quality score', () => {
      monitor.metrics.averageLatency = 1000;
      monitor.metrics.jitter = 200;
      monitor.metrics.errorsCount = 100;
      monitor.metrics.messagesSent = 10;
      monitor.metrics.reconnectCount = 20;

      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBeGreaterThanOrEqual(0);
    });

    test('should report quality changes', () => {
      monitor.updateLatencyMetrics(200);
      monitor.updateQualityScore();

      expect(RealUserMetrics.trackEvent).toHaveBeenCalledWith(
        'websocket_quality',
        expect.objectContaining({
          score: monitor.metrics.qualityScore,
          tier: expect.any(String),
          latency: expect.any(Number),
          jitter: expect.any(Number)
        })
      );
    });

    test('should alert on poor quality', () => {
      monitor.metrics.qualityScore = 25;
      monitor.metrics.averageLatency = 500;
      monitor.metrics.jitter = 100;

      monitor.reportQualityChange();

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'WebSocket Quality Issue',
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            component: 'websocket_monitor',
            issue_type: 'poor_connection_quality'
          })
        })
      );
    });

    test('should not alert when quality is acceptable', () => {
      monitor.metrics.qualityScore = 75;
      monitor.reportQualityChange();

      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });

  // ==============================================
  // PERIODIC REPORTING
  // ==============================================

  describe('Periodic Reporting', () => {
    beforeEach(() => {
      monitor = new ClientWebSocketMonitor(mockSocket);
    });

    test('should generate report every 30 seconds', () => {
      const generateReportSpy = jest.spyOn(monitor, 'generateReport');

      jest.advanceTimersByTime(30000);
      expect(generateReportSpy).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(30000);
      expect(generateReportSpy).toHaveBeenCalledTimes(2);
    });

    test('should generate comprehensive report', () => {
      monitor.metrics.messagesSent = 50;
      monitor.metrics.messagesReceived = 60;
      monitor.metrics.errorsCount = 2;
      monitor.metrics.reconnectCount = 1;
      monitor.updateLatencyMetrics(100);

      const report = monitor.generateReport();

      expect(report).toMatchObject({
        socketId: 'test-socket-id-123',
        qualityScore: expect.any(Number),
        qualityTier: expect.any(String),
        latency: expect.objectContaining({
          average: expect.any(Number),
          latest: expect.any(Number),
          jitter: expect.any(Number)
        }),
        messages: {
          sent: 50,
          received: 60,
          total: 110
        },
        errors: {
          count: 2,
          reconnects: 1
        }
      });
    });

    test('should include transport information in report', () => {
      const report = monitor.generateReport();

      expect(report.transport).toBe('websocket');
    });

    test('should calculate message rate per minute', () => {
      monitor.metrics.connectionStart = Date.now() - 60000; // 1 minute ago
      monitor.metrics.messagesSent = 30;
      monitor.metrics.messagesReceived = 30;

      const report = monitor.generateReport();

      expect(report.performance.messageRate).toBeCloseTo(60, 0);
    });

    test('should calculate error rate', () => {
      monitor.metrics.messagesSent = 50;
      monitor.metrics.messagesReceived = 50;
      monitor.metrics.errorsCount = 5;

      const report = monitor.generateReport();

      expect(report.performance.errorRate).toBe(0.05);
    });

    test('should send report to server monitoring', () => {
      const report = monitor.generateReport();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'monitoring:client_report',
        expect.objectContaining({
          type: 'quality_report',
          data: report,
          timestamp: expect.any(Number)
        })
      );
    });

    test('should not send report if socket is disconnected', () => {
      mockSocket.connected = false;
      mockSocket.emit.mockClear();

      monitor.sendToServerMonitoring({});

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    test('should not generate report if not monitoring', () => {
      monitor.isMonitoring = false;

      const report = monitor.generateReport();

      expect(report).toBeUndefined();
    });
  });

  // ==============================================
  // PUBLIC API
  // ==============================================

  describe('Public API', () => {
    beforeEach(() => {
      monitor = new ClientWebSocketMonitor(mockSocket);
    });

    test('getMetrics should return comprehensive metrics', () => {
      monitor.metrics.messagesSent = 10;
      monitor.metrics.messagesReceived = 15;

      const metrics = monitor.getMetrics();

      expect(metrics).toMatchObject({
        messagesSent: 10,
        messagesReceived: 15,
        qualityScore: 100,
        qualityTier: 'excellent',
        sessionDuration: expect.any(Number),
        isConnected: true
      });
    });

    test('getQualityScore should return current quality score', () => {
      monitor.metrics.qualityScore = 85;

      expect(monitor.getQualityScore()).toBe(85);
    });

    test('getCurrentLatency should return latest latency', () => {
      monitor.updateLatencyMetrics(100);
      monitor.updateLatencyMetrics(150);

      expect(monitor.getCurrentLatency()).toBe(150);
    });

    test('getCurrentLatency should return 0 if no history', () => {
      expect(monitor.getCurrentLatency()).toBe(0);
    });

    test('getAverageLatency should return average latency', () => {
      monitor.updateLatencyMetrics(100);
      monitor.updateLatencyMetrics(200);

      expect(monitor.getAverageLatency()).toBe(150);
    });

    test('isHealthy should return true for good quality', () => {
      monitor.metrics.qualityScore = 75;

      expect(monitor.isHealthy()).toBe(true);
    });

    test('isHealthy should return false for poor quality', () => {
      monitor.metrics.qualityScore = 40;

      expect(monitor.isHealthy()).toBe(false);
    });

    test('checkQuality should send ping and return metrics', async () => {
      const promise = monitor.checkQuality();

      jest.advanceTimersByTime(1000);

      const metrics = await promise;

      expect(mockSocket.emit).toHaveBeenCalledWith('ping', expect.any(Object));
      expect(metrics).toBeDefined();
    });
  });

  // ==============================================
  // CLEANUP AND LIFECYCLE
  // ==============================================

  describe('Cleanup', () => {
    beforeEach(() => {
      monitor = new ClientWebSocketMonitor(mockSocket);
    });

    test('should stop monitoring on destroy', () => {
      monitor.destroy();

      expect(monitor.isMonitoring).toBe(false);
    });

    test('should clear intervals on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      monitor.destroy();

      expect(clearIntervalSpy).toHaveBeenCalledTimes(2); // ping and reporting intervals
    });

    test('should generate final report on destroy', () => {
      monitor.metrics.messagesSent = 25;

      monitor.destroy();

      expect(RealUserMetrics.trackEvent).toHaveBeenCalledWith(
        'websocket_monitor_destroyed',
        expect.objectContaining({
          finalReport: expect.any(Object),
          reason: 'manual_cleanup'
        })
      );
    });

    test('should handle destroy when intervals not set', () => {
      const newMonitor = new ClientWebSocketMonitor(null);

      expect(() => newMonitor.destroy()).not.toThrow();
    });
  });

  // ==============================================
  // EDGE CASES AND ERROR HANDLING
  // ==============================================

  describe('Edge Cases', () => {
    test('should handle missing transport information', () => {
      const socketWithoutTransport = {
        ...mockSocket,
        io: null
      };

      monitor = new ClientWebSocketMonitor(socketWithoutTransport);
      const report = monitor.generateReport();

      expect(report.transport).toBe('unknown');
    });

    test('should handle pong without timestamp', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);

      eventHandlers.pong({});

      expect(monitor.metrics.latencyHistory.length).toBe(0);
    });

    test('should handle pong with null data', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);

      eventHandlers.pong(null);

      expect(monitor.metrics.latencyHistory.length).toBe(0);
    });

    test('should handle error without message', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);

      eventHandlers.error('string error');

      expect(monitor.metrics.errorsCount).toBe(1);
    });

    test('should calculate session duration when connection start is null', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);
      monitor.metrics.connectionStart = null;

      const metrics = monitor.getMetrics();

      expect(metrics.sessionDuration).toBe(0);
    });

    test('should handle division by zero in error rate calculation', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);
      monitor.metrics.errorsCount = 5;
      monitor.metrics.messagesSent = 0;
      monitor.metrics.messagesReceived = 0;

      expect(() => monitor.updateQualityScore()).not.toThrow();
    });

    test('should handle empty latency history in jitter calculation', () => {
      monitor = new ClientWebSocketMonitor(mockSocket);
      monitor.updateLatencyMetrics(100);

      expect(monitor.metrics.jitter).toBe(0);
    });
  });

  // ==============================================
  // INTEGRATION SCENARIOS
  // ==============================================

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      monitor = new ClientWebSocketMonitor(mockSocket);
    });

    test('should handle complete connection lifecycle', () => {
      // Connect
      eventHandlers.connect();
      expect(monitor.isMonitoring).toBe(true);

      // Exchange messages
      monitor.trackOutgoingMessage(['chat', { message: 'hello' }]);
      monitor.trackIncomingMessage('chat', [{ message: 'hi' }]);

      // Measure latency
      const pingTime = Date.now();
      eventHandlers.pong({ timestamp: pingTime });

      // Disconnect
      eventHandlers.disconnect('client disconnect');
      expect(monitor.isMonitoring).toBe(false);
    });

    test('should handle reconnection scenario', () => {
      // Initial connection
      expect(monitor.metrics.reconnectCount).toBe(0);

      // Disconnect
      eventHandlers.disconnect('transport close');

      // Reconnect attempts
      eventHandlers.reconnect_error(new Error('Connection failed'));
      eventHandlers.reconnect_error(new Error('Connection failed'));

      // Successful reconnection
      eventHandlers.reconnect(3);

      expect(monitor.metrics.reconnectCount).toBe(1);
      expect(monitor.metrics.errorsCount).toBe(2);
    });

    test('should degrade quality score over poor conditions', () => {
      const initialScore = monitor.metrics.qualityScore;

      // Add poor latency
      monitor.updateLatencyMetrics(600);
      monitor.updateQualityScore();

      // Add errors
      monitor.metrics.errorsCount = 5;
      monitor.metrics.messagesSent = 10;
      monitor.updateQualityScore();

      // Add reconnections
      monitor.metrics.reconnectCount = 2;
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBeLessThan(initialScore);
      expect(monitor.getQualityTier()).not.toBe('excellent');
    });

    test('should maintain quality score under good conditions', () => {
      // Good latency
      monitor.updateLatencyMetrics(30);
      monitor.updateLatencyMetrics(40);
      monitor.updateLatencyMetrics(35);
      monitor.updateQualityScore();

      expect(monitor.metrics.qualityScore).toBe(100);
      expect(monitor.getQualityTier()).toBe('excellent');
    });

    test('should track high message volume', () => {
      for (let i = 0; i < 100; i++) {
        monitor.trackOutgoingMessage(['event', { data: 'test' }]);
      }

      for (let i = 0; i < 150; i++) {
        monitor.trackIncomingMessage('event', [{ data: 'test' }]);
      }

      expect(monitor.metrics.messagesSent).toBe(100);
      expect(monitor.metrics.messagesReceived).toBe(150);
      expect(monitor.metrics.bandwidthUsage.sent).toBeGreaterThan(0);
      expect(monitor.metrics.bandwidthUsage.received).toBeGreaterThan(0);
    });
  });
});

// ==============================================
// REACT HOOK TESTS
// ==============================================

describe('useWebSocketMonitoring', () => {
  let mockSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    mockSocket = {
      id: 'hook-test-socket-123',
      connected: true,
      io: {
        engine: {
          transport: { name: 'websocket' },
          upgrades: ['websocket']
        }
      },
      on: jest.fn(),
      emit: jest.fn(),
      off: jest.fn()
    };
  });

  test('should initialize monitor with socket', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(mockSocket));

    expect(result.current.monitor).toBeInstanceOf(ClientWebSocketMonitor);
  });

  test('should return initial state', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(mockSocket));

    expect(result.current.qualityScore).toBe(100);
    expect(result.current.isHealthy).toBe(true);
    expect(result.current.metrics).toBeNull();
  });

  test('should update metrics periodically', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(mockSocket));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics.qualityScore).toBeDefined();
  });

  test('should update quality score', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(mockSocket));

    act(() => {
      if (result.current.monitor) {
        result.current.monitor.metrics.qualityScore = 75;
      }
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.qualityScore).toBe(75);
  });

  test('should update health status', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(mockSocket));

    act(() => {
      if (result.current.monitor) {
        result.current.monitor.metrics.qualityScore = 40;
      }
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.isHealthy).toBe(false);
  });

  test('should provide checkQuality function', async () => {
    const { result } = renderHook(() => useWebSocketMonitoring(mockSocket));

    let promise;
    act(() => {
      promise = result.current.checkQuality();
      jest.advanceTimersByTime(1000);
    });

    const metrics = await promise;
    expect(metrics).toBeDefined();
  });

  test('should provide getDetailedMetrics function', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(mockSocket));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const detailedMetrics = result.current.getDetailedMetrics();
    expect(detailedMetrics).toBeDefined();
  });

  test('should provide forceReport function', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(mockSocket));

    const report = result.current.forceReport();
    expect(report).toBeDefined();
  });

  test('should cleanup monitor on unmount', () => {
    const { result, unmount } = renderHook(() => useWebSocketMonitoring(mockSocket));

    const destroySpy = jest.spyOn(result.current.monitor, 'destroy');

    unmount();

    expect(destroySpy).toHaveBeenCalled();
  });

  test('should handle null socket', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(null));

    expect(result.current.monitor).toBeNull();
  });

  test('should handle socket change', () => {
    const { result, rerender } = renderHook(
      ({ socket }) => useWebSocketMonitoring(socket),
      { initialProps: { socket: mockSocket } }
    );

    const firstMonitor = result.current.monitor;

    const newSocket = { ...mockSocket, id: 'new-socket-id' };
    rerender({ socket: newSocket });

    expect(result.current.monitor).not.toBe(firstMonitor);
  });

  test('should clear interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useWebSocketMonitoring(mockSocket));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  test('checkQuality should return null if monitor not initialized', async () => {
    const { result } = renderHook(() => useWebSocketMonitoring(null));

    const metrics = await result.current.checkQuality();
    expect(metrics).toBeNull();
  });

  test('getDetailedMetrics should return null if monitor not initialized', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(null));

    const metrics = result.current.getDetailedMetrics();
    expect(metrics).toBeNull();
  });

  test('forceReport should return null if monitor not initialized', () => {
    const { result } = renderHook(() => useWebSocketMonitoring(null));

    const report = result.current.forceReport();
    expect(report).toBeNull();
  });
});
