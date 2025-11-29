import { FastifyInstance } from 'fastify';
import { Web3AuthService } from '../services/web3-auth';

export default async function web3AuthRoutes(fastify: FastifyInstance) {
  const web3Auth = new Web3AuthService({
    redis: (fastify as any).redis,
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
    domain: process.env.DOMAIN || 'cryb.ai'
  });

  // Get nonce for wallet to sign
  fastify.get('/nonce/:address', async (request, reply) => {
    const { address } = request.params as any;
    const nonce = await web3Auth.generateNonce(address);
    return reply.send({ nonce });
  });

  // Verify signature and create session
  fastify.post('/verify', async (request, reply) => {
    const { message, signature } = request.body as any;
    try {
      const session = await web3Auth.verifyAndCreateSession(
        message,
        signature,
        request.ip,
        request.headers['user-agent'] || ''
      );
      return reply.send({
        success: true,
        token: session.token,
        refreshToken: session.refreshToken,
        address: session.address
      });
    } catch (error) {
      return reply.status(401).send({ 
        success: false, 
        error: 'Invalid signature or message' 
      });
    }
  });

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as any;
    try {
      const newSession = await web3Auth.refreshSession(refreshToken);
      return reply.send({
        success: true,
        token: newSession.token,
        refreshToken: newSession.refreshToken
      });
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  });
}