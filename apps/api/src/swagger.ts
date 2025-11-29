import { FastifyInstance } from 'fastify';
import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

// Define comprehensive schema definitions for reuse
const commonSchemas = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Error message' },
      code: { type: 'string', example: 'ERROR_CODE' },
      details: { 
        type: 'object',
        additionalProperties: true
      }
    }
  },
  
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'user_123' },
      username: { type: 'string', example: 'johndoe' },
      displayName: { type: 'string', example: 'John Doe' },
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      avatar: { type: 'string', format: 'uri', example: 'https://cdn.cryb.ai/avatars/user_123.jpg' },
      banner: { type: 'string', format: 'uri', example: 'https://cdn.cryb.ai/banners/user_123.jpg' },
      bio: { type: 'string', example: 'Software developer passionate about technology' },
      pronouns: { type: 'string', example: 'they/them' },
      isVerified: { type: 'boolean', example: true },
      isBot: { type: 'boolean', example: false },
      premiumType: { type: 'string', enum: ['NONE', 'PLUS', 'PRO'], example: 'PLUS' },
      locale: { type: 'string', example: 'en-US' },
      walletAddress: { type: 'string', example: '0x742d35Cc6634C0532925a3b8D6977E' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },

  Server: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'server_123' },
      name: { type: 'string', example: 'Gaming Community' },
      description: { type: 'string', example: 'A place for gamers to connect' },
      icon: { type: 'string', format: 'uri', example: 'https://cdn.cryb.ai/icons/server_123.jpg' },
      banner: { type: 'string', format: 'uri', example: 'https://cdn.cryb.ai/banners/server_123.jpg' },
      isPublic: { type: 'boolean', example: true },
      category: { 
        type: 'string', 
        enum: ['GAMING', 'MUSIC', 'EDUCATION', 'SCIENCE', 'TECHNOLOGY', 'ENTERTAINMENT', 'OTHER'],
        example: 'GAMING'
      },
      memberCount: { type: 'number', example: 1250 },
      channelCount: { type: 'number', example: 12 },
      maxMembers: { type: 'number', example: 10000 },
      verificationLevel: { type: 'number', minimum: 0, maximum: 4, example: 1 },
      nsfw: { type: 'boolean', example: false },
      ownerId: { type: 'string', example: 'user_456' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },

  Channel: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'channel_123' },
      name: { type: 'string', example: 'general' },
      topic: { type: 'string', example: 'General discussion' },
      type: { 
        type: 'string', 
        enum: ['TEXT', 'VOICE', 'CATEGORY', 'STAGE', 'ANNOUNCEMENT'],
        example: 'TEXT'
      },
      serverId: { type: 'string', example: 'server_123' },
      parentId: { type: 'string', example: 'category_456' },
      position: { type: 'number', example: 1 },
      isPrivate: { type: 'boolean', example: false },
      slowModeSeconds: { type: 'number', example: 0 },
      userLimit: { type: 'number', example: 0 },
      bitrate: { type: 'number', example: 64000 },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },

  Message: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'msg_123' },
      content: { type: 'string', example: 'Hello everyone!' },
      channelId: { type: 'string', example: 'channel_123' },
      userId: { type: 'string', example: 'user_456' },
      replyToId: { type: 'string', example: 'msg_122' },
      editedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      attachments: {
        type: 'array',
        items: { $ref: '#/components/schemas/Attachment' }
      },
      embeds: {
        type: 'array',
        items: { type: 'object' }
      },
      reactions: {
        type: 'array',
        items: { $ref: '#/components/schemas/Reaction' }
      },
      user: { $ref: '#/components/schemas/User' }
    }
  },

  Community: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'community_123' },
      name: { type: 'string', example: 'technology' },
      displayName: { type: 'string', example: 'Technology' },
      description: { type: 'string', example: 'Discussion about technology trends' },
      icon: { type: 'string', format: 'uri', example: 'https://cdn.cryb.ai/communities/tech.jpg' },
      banner: { type: 'string', format: 'uri', example: 'https://cdn.cryb.ai/communities/tech_banner.jpg' },
      isPublic: { type: 'boolean', example: true },
      category: { type: 'string', example: 'TECHNOLOGY' },
      memberCount: { type: 'number', example: 15420 },
      postCount: { type: 'number', example: 1250 },
      rules: {
        type: 'array',
        items: { type: 'string' },
        example: ['Be respectful', 'No spam', 'Stay on topic']
      },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },

  Post: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'post_123' },
      title: { type: 'string', example: 'Amazing Technology Discovery' },
      content: { type: 'string', example: 'Check out this new breakthrough...' },
      type: { 
        type: 'string', 
        enum: ['TEXT', 'LINK', 'IMAGE', 'VIDEO'],
        example: 'TEXT'
      },
      url: { type: 'string', format: 'uri', nullable: true },
      imageUrl: { type: 'string', format: 'uri', nullable: true },
      videoUrl: { type: 'string', format: 'uri', nullable: true },
      score: { type: 'number', example: 1520 },
      commentCount: { type: 'number', example: 89 },
      viewCount: { type: 'number', example: 15420 },
      isNsfw: { type: 'boolean', example: false },
      isStickied: { type: 'boolean', example: false },
      isRemoved: { type: 'boolean', example: false },
      userId: { type: 'string', example: 'user_123' },
      communityId: { type: 'string', example: 'community_123' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      user: { $ref: '#/components/schemas/User' },
      community: { $ref: '#/components/schemas/Community' }
    }
  },

  Comment: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'comment_123' },
      content: { type: 'string', example: 'Great post! Thanks for sharing.' },
      postId: { type: 'string', example: 'post_123' },
      parentId: { type: 'string', example: 'comment_122', nullable: true },
      userId: { type: 'string', example: 'user_456' },
      score: { type: 'number', example: 25 },
      depth: { type: 'number', example: 0 },
      childCount: { type: 'number', example: 3 },
      isRemoved: { type: 'boolean', example: false },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      user: { $ref: '#/components/schemas/User' },
      children: {
        type: 'array',
        items: { $ref: '#/components/schemas/Comment' }
      }
    }
  },

  Attachment: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'attachment_123' },
      filename: { type: 'string', example: 'image.jpg' },
      originalName: { type: 'string', example: 'my-image.jpg' },
      size: { type: 'number', example: 102400 },
      contentType: { type: 'string', example: 'image/jpeg' },
      url: { type: 'string', format: 'uri', example: 'https://cdn.cryb.ai/attachments/attachment_123.jpg' },
      thumbnailUrl: { type: 'string', format: 'uri', example: 'https://cdn.cryb.ai/attachments/attachment_123_thumb.jpg' },
      width: { type: 'number', example: 1920 },
      height: { type: 'number', example: 1080 },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },

  Reaction: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'reaction_123' },
      emoji: { type: 'string', example: '👍' },
      count: { type: 'number', example: 5 },
      users: {
        type: 'array',
        items: { $ref: '#/components/schemas/User' }
      }
    }
  },

  Notification: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'notification_123' },
      type: { 
        type: 'string', 
        enum: ['MESSAGE', 'MENTION', 'REPLY', 'REACTION', 'FOLLOW', 'SERVER_INVITE'],
        example: 'MESSAGE'
      },
      title: { type: 'string', example: 'New message' },
      content: { type: 'string', example: 'You have a new message in #general' },
      isRead: { type: 'boolean', example: false },
      userId: { type: 'string', example: 'user_123' },
      sourceId: { type: 'string', example: 'msg_456' },
      sourceType: { type: 'string', example: 'MESSAGE' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },

  Pagination: {
    type: 'object',
    properties: {
      total: { type: 'number', example: 1000 },
      page: { type: 'number', example: 1 },
      pageSize: { type: 'number', example: 25 },
      hasMore: { type: 'boolean', example: true },
      totalPages: { type: 'number', example: 40 }
    }
  },

  TokenPair: {
    type: 'object',
    properties: {
      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      expiresAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
    }
  }
};

export const swaggerConfig: SwaggerOptions = {
  swagger: {
    info: {
      title: 'CRYB Platform API',
      description: `
# CRYB Platform API

The CRYB Platform API provides a comprehensive REST API for building Discord-style chat applications combined with Reddit-style community features.

## Features

- **Real-time Messaging**: WebSocket-based chat with Discord-style channels
- **Community System**: Reddit-style communities with posts and comments  
- **Voice & Video**: LiveKit integration for high-quality voice/video calls
- **File Uploads**: Support for images, videos, and documents
- **User Management**: Comprehensive user profiles and authentication
- **Moderation**: AI-powered content moderation and reporting
- **Web3 Integration**: Wallet connectivity and NFT profile pictures
- **Analytics**: Detailed usage and engagement metrics

## Authentication

Most endpoints require JWT authentication via the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting

The API implements comprehensive rate limiting:
- **General**: 1000 requests/hour per authenticated user
- **Auth**: 5 attempts per 15 minutes per IP
- **Messages**: 30 messages/minute per channel
- **Uploads**: 10 uploads/minute, max 50MB

## WebSocket Events

Connect to \`/socket.io\` for real-time features:
- Message events (new, edit, delete, reactions)
- User presence and typing indicators  
- Voice channel events
- Server/channel updates

## Error Handling

All errors follow a consistent format with appropriate HTTP status codes and detailed error messages.

## SDK Support

Official SDKs available for:
- JavaScript/TypeScript
- Python
- Go
- Mobile (React Native)

For more information, visit: https://docs.cryb.ai
      `,
      version: '1.0.0',
      contact: {
        name: 'CRYB API Support',
        email: 'api-support@cryb.ai',
        url: 'https://docs.cryb.ai'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    host: process.env.API_HOST || 'localhost:3000',
    schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http', 'https'],
    consumes: ['application/json', 'multipart/form-data'],
    produces: ['application/json'],
    
    tags: [
      {
        name: 'auth',
        description: 'Authentication and authorization endpoints'
      },
      {
        name: 'users',
        description: 'User management and profiles'
      },
      {
        name: 'servers',
        description: 'Discord-style server management'
      },
      {
        name: 'channels',
        description: 'Channel creation and management'
      },
      {
        name: 'messages',
        description: 'Real-time messaging system'
      },
      {
        name: 'communities',
        description: 'Reddit-style community management'
      },
      {
        name: 'posts',
        description: 'Community posts and content'
      },
      {
        name: 'comments',
        description: 'Post comments and replies'
      },
      {
        name: 'voice',
        description: 'Voice and video communication'
      },
      {
        name: 'uploads',
        description: 'File upload and media management'
      },
      {
        name: 'search',
        description: 'Content search and discovery'
      },
      {
        name: 'notifications',
        description: 'User notifications and alerts'
      },
      {
        name: 'moderation',
        description: 'Content moderation and reporting'
      },
      {
        name: 'analytics',
        description: 'Usage analytics and metrics'
      },
      {
        name: 'web3',
        description: 'Web3 wallet integration'
      },
      {
        name: 'nft',
        description: 'NFT profile pictures and management'
      },
      {
        name: 'token-gating',
        description: 'Token-based access control'
      },
      {
        name: 'crypto-payments',
        description: 'Cryptocurrency payment processing'
      },
      {
        name: 'crypto-tipping',
        description: 'Cryptocurrency tipping system'
      },
      {
        name: 'bots',
        description: 'Bot framework and automation'
      },
      {
        name: 'ai-moderation',
        description: 'AI-powered content moderation'
      },
      {
        name: 'admin',
        description: 'Administrative functions'
      }
    ],

    components: {
      schemas: commonSchemas,
      
      securitySchemes: {
        Bearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login/register endpoints'
        },
        ApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for server-to-server communication'
        }
      },

      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Invalid request parameters',
                code: 'BAD_REQUEST',
                details: {
                  field: 'email',
                  message: 'Invalid email format'
                }
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Insufficient permissions',
                code: 'FORBIDDEN'
              }
            }
          }
        },
        NotFound: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Resource not found',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        Conflict: {
          description: 'Conflict - Resource already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Resource already exists',
                code: 'CONFLICT'
              }
            }
          }
        },
        RateLimit: {
          description: 'Too Many Requests - Rate limit exceeded',
          headers: {
            'X-RateLimit-Limit': {
              description: 'Request limit per time window',
              schema: { type: 'integer' }
            },
            'X-RateLimit-Remaining': {
              description: 'Remaining requests in current window',
              schema: { type: 'integer' }
            },
            'X-RateLimit-Reset': {
              description: 'Time when rate limit resets (Unix timestamp)',
              schema: { type: 'integer' }
            }
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED'
              }
            }
          }
        },
        InternalError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: 'Internal server error',
                code: 'INTERNAL_ERROR'
              }
            }
          }
        }
      },

      parameters: {
        Page: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination (1-based)',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        Limit: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25
          }
        },
        Sort: {
          name: 'sort',
          in: 'query',
          description: 'Sort order',
          required: false,
          schema: {
            type: 'string',
            enum: ['hot', 'new', 'top', 'controversial', 'best'],
            default: 'hot'
          }
        },
        TimeFrame: {
          name: 'timeFrame',
          in: 'query',
          description: 'Time filter for content',
          required: false,
          schema: {
            type: 'string',
            enum: ['hour', 'day', 'week', 'month', 'year', 'all'],
            default: 'all'
          }
        }
      }
    },

    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.cryb.ai' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server'
      }
    ],

    externalDocs: {
      description: 'Full API Documentation',
      url: 'https://docs.cryb.ai'
    }
  }
};

export const swaggerUiConfig: FastifySwaggerUiOptions = {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayOperationId: true,
    defaultModelRendering: 'example',
    displayRequestDuration: true,
    showExtensions: true,
    showCommonExtensions: true,
    useUnsafeMarkdown: false
  },
  uiHooks: {
    onRequest: function (request, reply, next) {
      // Add custom headers or logic here if needed
      next();
    }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  theme: {
    title: 'CRYB Platform API Documentation',
    favicon: [
      {
        filename: 'favicon.ico',
        rel: 'icon',
        sizes: '16x16',
        type: 'image/x-icon'
      }
    ]
  }
};

// Helper function to register Swagger with Fastify
export async function registerSwagger(fastify: FastifyInstance) {
  await fastify.register(require('@fastify/swagger'), swaggerConfig);
  await fastify.register(require('@fastify/swagger-ui'), swaggerUiConfig);
}

// Export individual schemas for use in route definitions
export { commonSchemas };

// Utility function to create standard API responses
export const createApiResponse = (data: any) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: data
  }
});

export const createErrorResponse = (code: string, message: string) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: { type: 'string', example: message },
    code: { type: 'string', example: code }
  }
});

export const createPaginatedResponse = (itemSchema: any) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: itemSchema
        },
        pagination: { $ref: '#/components/schemas/Pagination' }
      }
    }
  }
});