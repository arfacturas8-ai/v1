import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';

export class SimpleMonitoringService {
  private metrics: Map<string, number> = new Map();
  
  track(metric: string, value: number = 1) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }
  
  getMetrics() {
    const result: Record<string, number> = {};
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }
    return result;
  }
  
  async getDashboardStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [users, posts, messages, communities] = await Promise.all([
      prisma.user.count(),
      prisma.post.count({ where: { createdAt: { gte: last24h } } }),
      prisma.message.count({ where: { createdAt: { gte: last24h } } }),
      prisma.community.count()
    ]);
    
    return {
      users,
      postsLast24h: posts,
      messagesLast24h: messages,
      communities,
      metrics: this.getMetrics()
    };
  }
}