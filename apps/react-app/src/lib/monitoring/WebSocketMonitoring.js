/**
 * ==============================================
 * CRYB PLATFORM - CLIENT-SIDE WEBSOCKET MONITORING
 * ==============================================
 * Real-time WebSocket connection quality monitoring for React app
 * Integrates with server-side monitoring and RUM system
 * ==============================================
 */

import RealUserMetrics from '../performance/RealUserMetrics';
import * as Sentry from '@sentry/react';

class ClientWebSocketMonitor {
  constructor(socket) {
    this.socket = socket;
    this.isMonitoring = false;
    this.connectionId = null;
    this.metrics = {
      connectionStart: null,
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
    };
    
    this.config = {
      pingInterval: 5000, // 5 seconds
      maxLatencyHistory: 20,
      qualityThresholds: {
        excellent: 90,
        good: 70,
        fair: 50,
        poor: 30
      },
      latencyThresholds: {
        excellent: 50,   // < 50ms
        good: 150,       // < 150ms
        fair: 300,       // < 300ms
        poor: 500        // < 500ms
      }
    };

    this.initialize();
  }

  initialize() {
    if (!this.socket) {
      return;
    }

    this.connectionId = this.socket.id;
    this.metrics.connectionStart = Date.now();
    this.isMonitoring = true;

    this.setupEventListeners();
    this.startPingMonitoring();
    this.startPeriodicReporting();

  }

  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      this.handleConnect();
    });

    this.socket.on('disconnect', (reason) => {
      this.handleDisconnect(reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.handleReconnect(attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      this.handleReconnectError(error);
    });

    this.socket.on('error', (error) => {
      this.handleError(error);
    });

    // Ping/Pong for latency measurement
    this.socket.on('pong', (data) => {
      this.handlePong(data);
    });

    // Message monitoring
    this.setupMessageMonitoring();
  }

  setupMessageMonitoring() {
    // Override emit to track outgoing messages
    const originalEmit = this.socket.emit.bind(this.socket);
    this.socket.emit = (...args) => {
      this.trackOutgoingMessage(args);
      return originalEmit(...args);
    };

    // Track incoming messages
    const originalOn = this.socket.on.bind(this.socket);
    this.socket.on = (event, handler) => {
      const wrappedHandler = (...args) => {
        this.trackIncomingMessage(event, args);
        return handler(...args);
      };
      return originalOn(event, wrappedHandler);
    };
  }

  // ==============================================
  // CONNECTION EVENT HANDLERS
  // ==============================================

  handleConnect() {
    this.connectionId = this.socket.id;
    this.metrics.connectionStart = Date.now();
    
    this.trackEvent('websocket_connect', {
      transport: this.socket.io.engine.transport.name,
      upgrades: this.socket.io.engine.upgrades
    });

    RealUserMetrics.trackEvent('websocket_connection', {
      event: 'connect',
      transport: this.socket.io.engine.transport.name,
      socketId: this.connectionId
    });
  }

  handleDisconnect(reason) {
    const sessionDuration = this.metrics.connectionStart 
      ? Date.now() - this.metrics.connectionStart 
      : 0;

    this.trackEvent('websocket_disconnect', {
      reason,
      sessionDuration,
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
      errorsCount: this.metrics.errorsCount,
      finalQualityScore: this.metrics.qualityScore,
      averageLatency: this.metrics.averageLatency
    });

    RealUserMetrics.trackEvent('websocket_connection', {
      event: 'disconnect',
      reason,
      sessionDuration,
      qualityScore: this.metrics.qualityScore
    });

    this.isMonitoring = false;
  }

  handleReconnect(attemptNumber) {
    this.metrics.reconnectCount++;
    
    this.trackEvent('websocket_reconnect', {
      attemptNumber,
      reconnectCount: this.metrics.reconnectCount
    });

    RealUserMetrics.trackEvent('websocket_connection', {
      event: 'reconnect',
      attemptNumber,
      totalReconnects: this.metrics.reconnectCount
    });
  }

  handleReconnectError(error) {
    this.metrics.errorsCount++;
    
    this.trackEvent('websocket_reconnect_error', {
      error: error.message || error.toString(),
      reconnectCount: this.metrics.reconnectCount
    });

    Sentry.captureException(error, {
      tags: {
        component: 'websocket_monitor',
        event_type: 'reconnect_error'
      },
      extra: {
        socketId: this.connectionId,
        reconnectCount: this.metrics.reconnectCount
      }
    });
  }

  handleError(error) {
    this.metrics.errorsCount++;
    
    this.trackEvent('websocket_error', {
      error: error.message || error.toString(),
      errorType: error.type || 'unknown'
    });

    Sentry.captureException(error, {
      tags: {
        component: 'websocket_monitor',
        event_type: 'socket_error'
      },
      extra: {
        socketId: this.connectionId,
        qualityScore: this.metrics.qualityScore
      }
    });
  }

  // ==============================================
  // LATENCY MONITORING
  // ==============================================

  startPingMonitoring() {
    if (!this.isMonitoring) return;

    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, this.config.pingInterval);
  }

  sendPing() {
    if (!this.socket.connected) return;

    const pingTime = Date.now();
    this.metrics.lastPingTime = pingTime;
    
    this.socket.emit('ping', { timestamp: pingTime });
    
    // Timeout handling
    setTimeout(() => {
      if (this.metrics.lastPingTime === pingTime) {
        // Ping timeout
        this.handlePingTimeout();
      }
    }, 10000); // 10 second timeout
  }

  handlePong(data) {
    if (!data || !data.timestamp) return;

    const latency = Date.now() - data.timestamp;
    this.updateLatencyMetrics(latency);
    this.updateQualityScore();

    this.trackEvent('websocket_ping', {
      latency,
      qualityScore: this.metrics.qualityScore
    });
  }

  handlePingTimeout() {
    this.metrics.errorsCount++;
    
    this.trackEvent('websocket_ping_timeout', {
      timeout: 10000,
      qualityScore: this.metrics.qualityScore
    });

    // Significant quality reduction for timeouts
    this.metrics.qualityScore = Math.max(0, this.metrics.qualityScore - 20);
  }

  updateLatencyMetrics(latency) {
    this.metrics.latencyHistory.push(latency);
    
    if (this.metrics.latencyHistory.length > this.config.maxLatencyHistory) {
      this.metrics.latencyHistory.shift();
    }

    // Calculate average latency
    this.metrics.averageLatency = this.metrics.latencyHistory.reduce((a, b) => a + b, 0) 
      / this.metrics.latencyHistory.length;

    // Calculate jitter
    if (this.metrics.latencyHistory.length > 1) {
      const diffs = [];
      for (let i = 1; i < this.metrics.latencyHistory.length; i++) {
        diffs.push(Math.abs(this.metrics.latencyHistory[i] - this.metrics.latencyHistory[i - 1]));
      }
      this.metrics.jitter = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    }
  }

  // ==============================================
  // MESSAGE MONITORING
  // ==============================================

  trackOutgoingMessage(args) {
    this.metrics.messagesSent++;
    
    const [event, data] = args;
    const messageSize = this.calculateMessageSize(data);
    this.metrics.bandwidthUsage.sent += messageSize;

    this.trackEvent('websocket_message_sent', {
      event,
      size: messageSize,
      totalSent: this.metrics.messagesSent
    });

    RealUserMetrics.trackEvent('websocket_message', {
      direction: 'outgoing',
      event,
      size: messageSize,
      socketId: this.connectionId
    });
  }

  trackIncomingMessage(event, args) {
    this.metrics.messagesReceived++;
    
    const messageSize = this.calculateMessageSize(args);
    this.metrics.bandwidthUsage.received += messageSize;

    this.trackEvent('websocket_message_received', {
      event,
      size: messageSize,
      totalReceived: this.metrics.messagesReceived
    });

    RealUserMetrics.trackEvent('websocket_message', {
      direction: 'incoming',
      event,
      size: messageSize,
      socketId: this.connectionId
    });
  }

  calculateMessageSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  // ==============================================
  // QUALITY SCORING
  // ==============================================

  updateQualityScore() {
    let score = 100;

    // Latency impact
    const avgLatency = this.metrics.averageLatency;
    if (avgLatency > this.config.latencyThresholds.excellent) {
      if (avgLatency > this.config.latencyThresholds.poor) {
        score -= 40;
      } else if (avgLatency > this.config.latencyThresholds.fair) {
        score -= 30;
      } else if (avgLatency > this.config.latencyThresholds.good) {
        score -= 20;
      } else {
        score -= 10;
      }
    }

    // Jitter impact
    if (this.metrics.jitter > 20) {
      score -= Math.min(20, this.metrics.jitter / 2);
    }

    // Error rate impact
    const totalMessages = this.metrics.messagesSent + this.metrics.messagesReceived;
    if (totalMessages > 0) {
      const errorRate = this.metrics.errorsCount / totalMessages;
      score -= Math.min(30, errorRate * 1000);
    }

    // Reconnection penalty
    score -= Math.min(10, this.metrics.reconnectCount * 5);

    this.metrics.qualityScore = Math.max(0, score);

    // Report quality changes
    this.reportQualityChange();
  }

  reportQualityChange() {
    const qualityTier = this.getQualityTier();
    
    RealUserMetrics.trackEvent('websocket_quality', {
      score: this.metrics.qualityScore,
      tier: qualityTier,
      latency: this.metrics.averageLatency,
      jitter: this.metrics.jitter,
      errorRate: this.metrics.errorsCount / Math.max(this.metrics.messagesSent + this.metrics.messagesReceived, 1),
      socketId: this.connectionId
    });

    // Alert on quality degradation
    if (this.metrics.qualityScore < this.config.qualityThresholds.poor) {
      this.alertQualityIssue('poor_connection_quality', {
        score: this.metrics.qualityScore,
        latency: this.metrics.averageLatency,
        jitter: this.metrics.jitter
      });
    }
  }

  getQualityTier() {
    const score = this.metrics.qualityScore;
    
    if (score >= this.config.qualityThresholds.excellent) return 'excellent';
    if (score >= this.config.qualityThresholds.good) return 'good';
    if (score >= this.config.qualityThresholds.fair) return 'fair';
    return 'poor';
  }

  alertQualityIssue(issueType, data) {
    Sentry.captureMessage('WebSocket Quality Issue', {
      level: 'warning',
      tags: {
        component: 'websocket_monitor',
        issue_type: issueType,
        quality_tier: this.getQualityTier()
      },
      extra: {
        socketId: this.connectionId,
        ...data,
        sessionDuration: Date.now() - this.metrics.connectionStart
      }
    });
  }

  // ==============================================
  // PERIODIC REPORTING
  // ==============================================

  startPeriodicReporting() {
    this.reportingInterval = setInterval(() => {
      this.generateReport();
    }, 30000); // Every 30 seconds
  }

  generateReport() {
    if (!this.isMonitoring) return;

    const sessionDuration = Date.now() - this.metrics.connectionStart;
    const report = {
      socketId: this.connectionId,
      sessionDuration,
      transport: this.socket?.io?.engine?.transport?.name || 'unknown',
      qualityScore: this.metrics.qualityScore,
      qualityTier: this.getQualityTier(),
      latency: {
        average: this.metrics.averageLatency,
        latest: this.metrics.latencyHistory[this.metrics.latencyHistory.length - 1] || 0,
        jitter: this.metrics.jitter
      },
      messages: {
        sent: this.metrics.messagesSent,
        received: this.metrics.messagesReceived,
        total: this.metrics.messagesSent + this.metrics.messagesReceived
      },
      bandwidth: {
        sent: this.metrics.bandwidthUsage.sent,
        received: this.metrics.bandwidthUsage.received,
        total: this.metrics.bandwidthUsage.sent + this.metrics.bandwidthUsage.received
      },
      errors: {
        count: this.metrics.errorsCount,
        reconnects: this.metrics.reconnectCount
      },
      performance: {
        messageRate: (this.metrics.messagesSent + this.metrics.messagesReceived) / (sessionDuration / 60000), // per minute
        errorRate: this.metrics.errorsCount / Math.max(this.metrics.messagesSent + this.metrics.messagesReceived, 1)
      }
    };

    this.trackEvent('websocket_report', report);

    // Send to server monitoring if available
    this.sendToServerMonitoring(report);

    return report;
  }

  sendToServerMonitoring(report) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('monitoring:client_report', {
        type: 'quality_report',
        data: report,
        timestamp: Date.now()
      });
    }
  }

  // ==============================================
  // PUBLIC API
  // ==============================================

  getMetrics() {
    return {
      ...this.metrics,
      qualityTier: this.getQualityTier(),
      sessionDuration: this.metrics.connectionStart ? Date.now() - this.metrics.connectionStart : 0,
      isConnected: this.socket?.connected || false
    };
  }

  getQualityScore() {
    return this.metrics.qualityScore;
  }

  getCurrentLatency() {
    return this.metrics.latencyHistory[this.metrics.latencyHistory.length - 1] || 0;
  }

  getAverageLatency() {
    return this.metrics.averageLatency;
  }

  isHealthy() {
    return this.metrics.qualityScore > this.config.qualityThresholds.fair;
  }

  // Force a quality check
  checkQuality() {
    this.sendPing();
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.getMetrics());
      }, 1000);
    });
  }

  // ==============================================
  // CLEANUP
  // ==============================================

  destroy() {
    this.isMonitoring = false;
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }

    // Generate final report
    const finalReport = this.generateReport();
    
    this.trackEvent('websocket_monitor_destroyed', {
      finalReport,
      reason: 'manual_cleanup'
    });
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  trackEvent(eventType, data) {
    RealUserMetrics.trackEvent(eventType, {
      ...data,
      timestamp: Date.now(),
      socketId: this.connectionId
    });
  }

  log(message, data = {}) {
  }

  warn(message, data = {}) {
  }

  error(message, error = null) {
    console.error(`[WSMonitor] ${message}`, error);
  }
}

// ==============================================
// REACT HOOK FOR WEBSOCKET MONITORING
// ==============================================

import { useEffect, useRef, useState } from 'react';

export const useWebSocketMonitoring = (socket) => {
  const monitorRef = useRef(null);
  const [metrics, setMetrics] = useState(null);
  const [qualityScore, setQualityScore] = useState(100);
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    if (!socket) return;

    // Initialize monitor
    monitorRef.current = new ClientWebSocketMonitor(socket);

    // Update metrics periodically
    const updateInterval = setInterval(() => {
      if (monitorRef.current) {
        const currentMetrics = monitorRef.current.getMetrics();
        setMetrics(currentMetrics);
        setQualityScore(currentMetrics.qualityScore);
        setIsHealthy(monitorRef.current.isHealthy());
      }
    }, 5000);

    return () => {
      clearInterval(updateInterval);
      if (monitorRef.current) {
        monitorRef.current.destroy();
        monitorRef.current = null;
      }
    };
  }, [socket]);

  const checkQuality = async () => {
    if (monitorRef.current) {
      return await monitorRef.current.checkQuality();
    }
    return null;
  };

  const getDetailedMetrics = () => {
    return monitorRef.current?.getMetrics() || null;
  };

  const forceReport = () => {
    return monitorRef.current?.generateReport() || null;
  };

  return {
    metrics,
    qualityScore,
    isHealthy,
    checkQuality,
    getDetailedMetrics,
    forceReport,
    monitor: monitorRef.current
  };
};

export default ClientWebSocketMonitor;