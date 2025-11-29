import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { FastifyInstance } from 'fastify';

export function initializeErrorTracking(app: FastifyInstance) {
  const sentryDsn = process.env.SENTRY_DSN;
  
  if (!sentryDsn) {
    app.log.warn('Sentry DSN not configured - using console error tracking');
    return {
      captureException: (error: any) => {
        app.log.error({ error }, 'Error captured (Sentry not configured)');
      },
      captureMessage: (message: string) => {
        app.log.info({ message }, 'Message captured (Sentry not configured)');
      }
    };
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend: (event, hint) => {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    }
  });

  app.log.info('✅ Sentry error tracking initialized');
  
  return Sentry;
}

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context
  });
}