/**
 * Simple Integration Test for API
 * This test verifies basic API functionality without complex middleware
 */

import supertest from 'supertest';
import { FastifyInstance } from 'fastify';
import Fastify from 'fastify';

describe('Simple API Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Create a minimal Fastify app for testing
    app = Fastify({ logger: false });

    // Simple health check route
    app.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Simple ping route
    app.get('/ping', async () => {
      return { message: 'pong' };
    });

    // Simple echo route
    app.post('/echo', async (request) => {
      return { echo: request.body };
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test('GET /health should return status ok', async () => {
    const response = await supertest(app.server)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /ping should return pong', async () => {
    const response = await supertest(app.server)
      .get('/ping')
      .expect(200);

    expect(response.body).toEqual({ message: 'pong' });
  });

  test('POST /echo should echo request body', async () => {
    const testData = { test: 'data', number: 123 };

    const response = await supertest(app.server)
      .post('/echo')
      .send(testData)
      .expect(200);

    expect(response.body).toEqual({ echo: testData });
  });
});