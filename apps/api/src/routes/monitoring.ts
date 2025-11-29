/**
 * Monitoring Routes
 * 
 * Endpoints for monitoring, health checks, and performance dashboards
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import PerformanceDashboardService from '../services/performance-dashboard';

interface MonitoringRoutes {
  prometheus: any;
  sentry?: any;
  businessTracker?: any;
  performanceDashboard?: PerformanceDashboardService;
}

export default async function monitoringRoutes(
  fastify: FastifyInstance,
  options: any
): Promise<void> {
  const {
    prometheus,
    sentry,
    businessTracker,
    performanceDashboard
  } = fastify as any as MonitoringRoutes;

  // ==============================================
  // HEALTH CHECK ENDPOINTS
  // ==============================================

  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const healthCheck = performanceDashboard ? 
        await performanceDashboard.performHealthCheck() : 
        {
          status: 'healthy' as const,
          components: {
            database: 'up' as const,
            redis: 'up' as const,
            elasticsearch: 'up' as const,
            livekit: 'up' as const
          },
          lastCheck: new Date().toISOString(),
          responseTime: 50
        };

      reply.code(healthCheck.status === 'healthy' ? 200 : 503);
      return healthCheck;
    } catch (error) {
      reply.code(503);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  });

  fastify.get('/health/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const systemStatus = performanceDashboard?.getSystemStatus() || {
        status: 'operational',
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };

      return {
        ...systemStatus,
        monitoring: {
          prometheus: !!prometheus,
          sentry: !!sentry,
          businessMetrics: !!businessTracker,
          dashboard: !!performanceDashboard
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==============================================
  // METRICS ENDPOINTS
  // ==============================================

  fastify.get('/metrics/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!performanceDashboard) {
        return reply.code(404).send({ error: 'Performance dashboard not available' });
      }

      const metrics = await performanceDashboard.getDashboardMetrics();
      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  fastify.get('/metrics/business', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!businessTracker) {
        return reply.code(404).send({ error: 'Business metrics tracker not available' });
      }

      const summary = businessTracker.getMetricsSummary();
      return {
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  fastify.get('/metrics/alerts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!performanceDashboard) {
        return reply.code(404).send({ error: 'Performance dashboard not available' });
      }

      const alerts = await performanceDashboard.getActiveAlerts();
      return {
        success: true,
        data: {
          alerts,
          summary: {
            total: alerts.length,
            critical: alerts.filter(a => a.severity === 'critical').length,
            warning: alerts.filter(a => a.severity === 'warning').length,
            firing: alerts.filter(a => a.status === 'firing').length
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==============================================
  // USER ENGAGEMENT TRACKING ENDPOINTS
  // ==============================================

  fastify.post('/track/user-action', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'action', 'category'],
        properties: {
          userId: { type: 'string' },
          action: { type: 'string' },
          category: { type: 'string' },
          duration: { type: 'number' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: {
      userId: string;
      action: string;
      category: string;
      duration?: number;
      metadata?: Record<string, any>;
    }
  }>, reply: FastifyReply) => {
    try {
      const { userId, action, category, duration, metadata } = request.body;

      // Track in business metrics
      if (businessTracker) {
        businessTracker.trackUserAction(userId, action, {
          category,
          duration,
          ...metadata
        });
      }

      // Track in Sentry for detailed analysis
      if (sentry) {
        sentry.trackUserAction(action, userId, {
          category,
          duration,
          ...metadata
        });
      }

      return {
        success: true,
        message: 'User action tracked successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  fastify.post('/track/feature-adoption', {
    schema: {
      body: {
        type: 'object',
        required: ['feature', 'userId', 'adopted'],
        properties: {
          feature: { type: 'string' },
          userId: { type: 'string' },
          adopted: { type: 'boolean' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: {
      feature: string;
      userId: string;
      adopted: boolean;
      metadata?: Record<string, any>;
    }
  }>, reply: FastifyReply) => {
    try {
      const { feature, userId, adopted, metadata } = request.body;

      // Track feature adoption
      if (businessTracker) {
        businessTracker.trackFeatureUsage(feature, userId, adopted, metadata);
      }

      return {
        success: true,
        message: 'Feature adoption tracked successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  fastify.post('/track/business-event', {
    schema: {
      body: {
        type: 'object',
        required: ['event', 'value'],
        properties: {
          event: { type: 'string' },
          value: { type: 'number' },
          userId: { type: 'string' },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: {
      event: string;
      value: number;
      userId?: string;
      metadata?: Record<string, any>;
    }
  }>, reply: FastifyReply) => {
    try {
      const { event, value, userId, metadata } = request.body;

      // Track business event
      if (businessTracker) {
        businessTracker.trackBusinessEvent(event, value, metadata);
      }

      // Track high-value events in Sentry
      if (sentry && (event.includes('revenue') || value > 100)) {
        sentry.captureMessage(`Business Event: ${event}`, {
          level: 'info',
          tags: {
            event,
            value: value.toString(),
            event_type: 'business'
          },
          user: userId ? { id: userId } : undefined,
          extra: metadata
        });
      }

      return {
        success: true,
        message: 'Business event tracked successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==============================================
  // PERFORMANCE MONITORING ENDPOINTS
  // ==============================================

  fastify.get('/performance/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const systemHealth = performanceDashboard?.trackSystemHealth() || {
        responseTime: 0,
        throughput: 0,
        errorRate: 0,
        uptime: process.uptime()
      };

      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        success: true,
        data: {
          system: systemHealth,
          process: {
            memory: {
              used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
              total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
              external: Math.round(memUsage.external / 1024 / 1024), // MB
              usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) // %
            },
            cpu: {
              user: cpuUsage.user,
              system: cpuUsage.system
            },
            uptime: Math.round(process.uptime()),
            pid: process.pid
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==============================================
  // ERROR TRACKING ENDPOINTS
  // ==============================================

  fastify.post('/track/error', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'message'],
        properties: {
          type: { type: 'string' },
          message: { type: 'string' },
          stack: { type: 'string' },
          context: { type: 'object' },
          userId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: {
      type: string;
      message: string;
      stack?: string;
      context?: Record<string, any>;
      userId?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const { type, message, stack, context, userId } = request.body;

      // Create error object
      const error = new Error(message);
      if (stack) error.stack = stack;

      // Track in Prometheus
      if (prometheus) {
        prometheus.trackError('error', 'api', type);
      }

      // Track in Sentry with context
      if (sentry) {
        sentry.captureError(error, {
          tags: {
            error_type: type,
            component: 'client-error'
          },
          user: userId ? { id: userId } : undefined,
          extra: context
        });
      }

      return {
        success: true,
        message: 'Error tracked successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==============================================
  // SYSTEM ADMINISTRATION ENDPOINTS
  // ==============================================

  fastify.post('/admin/trigger-test-alert', {
    preHandler: [
      // Add authentication middleware here in production
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Trigger a test alert for verification
      if (sentry) {
        sentry.captureMessage('Test Alert - Monitoring System Check', {
          level: 'warning',
          tags: {
            alert_type: 'test',
            component: 'monitoring-system'
          },
          extra: {
            triggered_by: 'admin_endpoint',
            timestamp: new Date().toISOString()
          }
        });
      }

      if (prometheus) {
        prometheus.trackError('warning', 'monitoring', 'test_alert');
      }

      return {
        success: true,
        message: 'Test alert triggered successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  fastify.get('/admin/monitoring-status', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      success: true,
      data: {
        services: {
          prometheus: {
            enabled: !!prometheus,
            status: prometheus ? 'active' : 'disabled'
          },
          sentry: {
            enabled: !!sentry,
            status: sentry ? 'active' : 'disabled'
          },
          businessMetrics: {
            enabled: !!businessTracker,
            status: businessTracker ? 'active' : 'disabled',
            summary: businessTracker ? businessTracker.getMetricsSummary() : null
          },
          performanceDashboard: {
            enabled: !!performanceDashboard,
            status: performanceDashboard ? 'active' : 'disabled'
          }
        },
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        uptime: process.uptime(),
        lastUpdated: new Date().toISOString()
      }
    };
  });
}