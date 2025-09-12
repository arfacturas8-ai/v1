import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodSchema, ZodError } from 'zod';
import { throwValidationError } from './errorHandler';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

// Create validation middleware
export const validate = (schemas: ValidationSchemas) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      if (schemas.body && request.body !== undefined) {
        request.body = schemas.body.parse(request.body);
      }

      // Validate query parameters
      if (schemas.query) {
        request.query = schemas.query.parse(request.query);
      }

      // Validate route parameters
      if (schemas.params) {
        request.params = schemas.params.parse(request.params);
      }

      // Validate headers
      if (schemas.headers) {
        request.headers = schemas.headers.parse(request.headers);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!validationErrors[path]) {
            validationErrors[path] = [];
          }
          validationErrors[path].push(err.message);
        });

        throwValidationError('Invalid request data', validationErrors);
      }
      throw error;
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),

  // Resource ID parameters
  params: {
    id: z.object({
      id: z.string().cuid()
    }),
    serverId: z.object({
      serverId: z.string().cuid()
    }),
    channelId: z.object({
      channelId: z.string().cuid()
    }),
    messageId: z.object({
      messageId: z.string().cuid()
    }),
    userId: z.object({
      userId: z.string().cuid()
    }),
    communityId: z.object({
      communityId: z.string().cuid()
    }),
    postId: z.object({
      postId: z.string().cuid()
    }),
    commentId: z.object({
      commentId: z.string().cuid()
    })
  },

  // Common headers
  headers: {
    auth: z.object({
      authorization: z.string().startsWith('Bearer ')
    })
  },

  // File upload
  fileUpload: z.object({
    file: z.any().refine(
      (file) => file && file.mimetype && file.buffer,
      'Valid file required'
    ),
    filename: z.string().min(1).max(255).optional()
  }),


  // Date range filters
  dateRange: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
  }).refine(
    (data) => !data.from || !data.to || data.from <= data.to,
    'From date must be before to date'
  ),

  // Search schema
  search: z.object({
    q: z.string().min(1).max(500),
    type: z.enum(['users', 'servers', 'channels', 'messages', 'posts', 'communities']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  })
};

// Type-safe request body extractor
export const getValidatedBody = <T>(request: FastifyRequest): T => {
  return request.body as T;
};

export const getValidatedQuery = <T>(request: FastifyRequest): T => {
  return request.query as T;
};

export const getValidatedParams = <T>(request: FastifyRequest): T => {
  return request.params as T;
};

// Validation for specific API endpoints
export const validationSchemas = {
  // Authentication
  auth: {
    register: {
      body: z.object({
        email: z.string().email().optional(),
        username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
        displayName: z.string().min(1).max(100),
        password: z.string().min(8).optional(),
        confirmPassword: z.string().min(8).optional(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
        signature: z.string().optional(),
        message: z.string().optional()
      }).refine(
        (data) => {
          // Check if password authentication is provided
          if (data.password) {
            return data.confirmPassword === data.password;
          }
          // Check if wallet authentication is provided
          if (data.walletAddress && data.signature && data.message) {
            return true;
          }
          // Allow just username and displayName if no auth method is provided yet
          // This supports the case where users register first then add auth methods later
          return true;
        },
        {
          message: 'If using password authentication, passwords must match.',
          path: ['confirmPassword']
        }
      )
    },
    login: {
      body: z.object({
        username: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().optional(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
        signature: z.string().optional(),
        message: z.string().optional()
      }).refine(
        (data) => (data.username || data.email) && data.password || 
                 (data.walletAddress && data.signature && data.message),
        'Valid credentials required'
      )
    }
  },

  // User management
  user: {
    update: {
      body: z.object({
        displayName: z.string().min(1).max(100).optional(),
        bio: z.string().max(500).optional(),
        avatar: z.string().url().optional(),
        email: z.string().email().optional()
      })
    }
  },

  // Server management
  server: {
    create: {
      body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(1000).optional(),
        icon: z.string().url().optional(),
        banner: z.string().url().optional(),
        isPublic: z.boolean().default(true),
        tokenGated: z.boolean().default(false),
        requiredTokens: z.array(z.object({
          address: z.string(),
          minAmount: z.string(),
          chainId: z.number()
        })).optional()
      })
    },
    update: {
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(1000).optional(),
        icon: z.string().url().optional(),
        banner: z.string().url().optional(),
        isPublic: z.boolean().optional(),
        tokenGated: z.boolean().optional(),
        requiredTokens: z.array(z.object({
          address: z.string(),
          minAmount: z.string(),
          chainId: z.number()
        })).optional()
      })
    }
  },

  // Channel management
  channel: {
    create: {
      body: z.object({
        serverId: z.string().cuid(),
        name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
        description: z.string().max(500).optional(),
        type: z.enum(['TEXT', 'VOICE', 'VIDEO', 'FORUM', 'STAGE', 'CATEGORY', 'ANNOUNCEMENT']).default('TEXT'),
        parentId: z.string().cuid().optional(),
        isPrivate: z.boolean().default(false),
        slowMode: z.number().min(0).max(21600).default(0),
        nsfw: z.boolean().default(false)
      })
    }
  },

  // Messages
  message: {
    create: z.object({
      channelId: z.string().cuid(),
      content: z.string().min(1).max(4000),
      replyToId: z.string().cuid().optional(),
      attachments: z.array(z.object({
        url: z.string().url(),
        filename: z.string(),
        size: z.number(),
        contentType: z.string()
      })).optional(),
      embeds: z.array(z.any()).optional()
    })
  },

  // Communities (Reddit-style)
  community: {
    create: {
      body: z.object({
        name: z.string().min(3).max(21).regex(/^[a-zA-Z0-9_]+$/),
        displayName: z.string().min(1).max(100),
        description: z.string().max(1000).optional(),
        icon: z.string().url().optional(),
        banner: z.string().url().optional(),
        isPublic: z.boolean().default(true),
        isNsfw: z.boolean().default(false),
        rules: z.array(z.object({
          title: z.string().max(100),
          description: z.string().max(500)
        })).optional()
      })
    }
  },

  // Posts
  post: {
    create: {
      body: z.object({
        communityId: z.string().cuid(),
        title: z.string().min(1).max(300),
        content: z.string().min(1).max(40000),
        url: z.string().url().optional(),
        thumbnail: z.string().url().optional()
      })
    },
    update: {
      body: z.object({
        content: z.string().min(1).max(40000)
      })
    }
  },

  // Comments
  comment: {
    create: {
      body: z.object({
        content: z.string().min(1).max(10000),
        parentId: z.string().cuid().optional()
      })
    },
    update: {
      body: z.object({
        content: z.string().min(1).max(10000)
      })
    }
  },

  // Voting
  vote: {
    create: {
      body: z.object({
        value: z.number().int().min(-1).max(1)
      })
    }
  }
};