import { FastifyRequest, FastifyInstance } from 'fastify';
import { User, ServerMember, CommunityMember } from '@cryb/database';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    userId?: string;
    serverMember?: ServerMember;
    communityMember?: CommunityMember;
    rateLimitInfo?: {
      limit: number;
      remaining: number;
      reset: Date;
    };
  }

  interface FastifyInstance {
    socketIntegration?: {
      io: {
        to(room: string): {
          emit(event: string, data: any): void;
        };
      };
      getHealthStatus(): any;
    };
  }
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: User;
  userId: string;
}

export interface ServerContextRequest extends AuthenticatedRequest {
  serverMember: ServerMember;
  serverId: string;
}

export interface CommunityContextRequest extends AuthenticatedRequest {
  communityMember: CommunityMember;
  communityId: string;
}