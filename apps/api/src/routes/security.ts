import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimiter';
import EnhancedSecurityHeaders from '../middleware/enhanced-security-headers';

const securityHeaders = new EnhancedSecurityHeaders();

export default async function securityRoutes(fastify: FastifyInstance) {
  // CSP violation report endpoint (no auth required)
  fastify.post('/csp-report', {
    schema: {
      tags: ['Security'],
      summary: 'Report CSP violations',
      description: 'Endpoint for browsers to report Content Security Policy violations'
    }
  }, securityHeaders.cspReportHandler());

  // Security monitoring endpoint (admin only)
  fastify.get('/monitoring', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Security'],
      summary: 'Get security monitoring data',
      description: 'Retrieve security events and CSP violations for monitoring',
      response: {
        200: {
          type: 'object',
          properties: {
            security: {
              type: 'object',
              properties: {
                cspViolations: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    recent: { type: 'array' }
                  }
                },
                securityEvents: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    recent: { type: 'array' }
                  }
                },
                lastUpdated: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, securityHeaders.securityMonitoringHandler());

  // Security configuration endpoint (admin only)
  fastify.get('/config', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Security'],
      summary: 'Get security configuration',
      description: 'Retrieve current security headers configuration'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = securityHeaders.getConfig();
      return reply.send({
        success: true,
        config
      });
    } catch (error) {
      request.log.error('Failed to get security config:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve security configuration'
      });
    }
  });

  // Security report endpoint (admin only)
  fastify.get('/report', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Security'],
      summary: 'Generate security report',
      description: 'Generate comprehensive security compliance report'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const report = await securityHeaders.generateSecurityReport();
      return reply.send({
        success: true,
        report
      });
    } catch (error) {
      request.log.error('Failed to generate security report:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate security report'
      });
    }
  });

  // Update security configuration (admin only)
  fastify.patch('/config', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Security'],
      summary: 'Update security configuration',
      description: 'Update security headers configuration',
      body: {
        type: 'object',
        properties: {
          csp: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              reportOnly: { type: 'boolean' },
              useNonces: { type: 'boolean' }
            }
          },
          hsts: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              maxAge: { type: 'number' },
              includeSubDomains: { type: 'boolean' },
              preload: { type: 'boolean' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const updates = request.body;
      securityHeaders.updateConfig(updates);
      
      request.log.info('Security configuration updated', { updates });
      
      return reply.send({
        success: true,
        message: 'Security configuration updated successfully',
        config: securityHeaders.getConfig()
      });
    } catch (error) {
      request.log.error('Failed to update security config:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update security configuration'
      });
    }
  });

  // Security health check
  fastify.get('/health', {
    schema: {
      tags: ['Security'],
      summary: 'Security health check',
      description: 'Check security systems status'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = securityHeaders.getConfig();
      const health = {
        csp: config.csp.enabled,
        hsts: config.hsts.enabled,
        cors: config.cors.enabled,
        frameOptions: config.frameOptions.enabled,
        contentTypeOptions: config.contentType.enabled,
        referrerPolicy: config.referrer.enabled,
        permissionsPolicy: config.permissions.enabled,
        timestamp: new Date().toISOString(),
        status: 'healthy'
      };

      return reply.send({
        success: true,
        security: health
      });
    } catch (error) {
      request.log.error('Security health check failed:', error);
      return reply.code(500).send({
        success: false,
        security: {
          status: 'unhealthy',
          error: 'Health check failed'
        }
      });
    }
  });

  // Input sanitization test endpoint
  fastify.post('/sanitize', {
    preHandler: [rateLimiters.general],
    schema: {
      tags: ['Security'],
      summary: 'Test input sanitization',
      description: 'Test input sanitization for XSS prevention',
      body: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        },
        required: ['input']
      }
    }
  }, async (request: FastifyRequest<{ Body: { input: string } }>, reply: FastifyReply) => {
    try {
      const { input } = request.body;
      const sanitized = EnhancedSecurityHeaders.sanitizeInput(input);
      
      return reply.send({
        success: true,
        original: input,
        sanitized,
        safe: sanitized === input
      });
    } catch (error) {
      request.log.error('Sanitization test failed:', error);
      return reply.code(500).send({
        success: false,
        error: 'Sanitization test failed'
      });
    }
  });

  // Security headers test endpoint
  fastify.get('/headers-test', {
    schema: {
      tags: ['Security'],
      summary: 'Test security headers',
      description: 'Test endpoint to verify security headers are properly set'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const headers = reply.getHeaders();
    const securityHeadersPresent = {
      'content-security-policy': !!headers['content-security-policy'],
      'strict-transport-security': !!headers['strict-transport-security'],
      'x-frame-options': !!headers['x-frame-options'],
      'x-content-type-options': !!headers['x-content-type-options'],
      'referrer-policy': !!headers['referrer-policy'],
      'permissions-policy': !!headers['permissions-policy'],
      'x-xss-protection': !!headers['x-xss-protection']
    };

    return reply.send({
      success: true,
      message: 'Security headers test completed',
      headers: securityHeadersPresent,
      nonce: (request as any).nonce || null,
      timestamp: new Date().toISOString()
    });
  });

  // CORS test endpoint
  fastify.options('/cors-test', {
    schema: {
      tags: ['Security'],
      summary: 'Test CORS configuration',
      description: 'Test CORS preflight request handling'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(204).send();
  });

  fastify.get('/cors-test', {
    schema: {
      tags: ['Security'],
      summary: 'Test CORS configuration',
      description: 'Test CORS configuration and headers'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-expose-headers',
      'access-control-allow-credentials',
      'access-control-max-age'
    ];

    const headers = reply.getHeaders();
    const corsHeadersPresent = corsHeaders.reduce((acc, header) => {
      acc[header] = headers[header] || null;
      return acc;
    }, {} as Record<string, any>);

    return reply.send({
      success: true,
      message: 'CORS test completed',
      origin: request.headers.origin || null,
      corsHeaders: corsHeadersPresent,
      timestamp: new Date().toISOString()
    });
  });
}