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

  // Search schema with enhanced security
  search: z.object({
    q: z.string()
      .min(1, 'Search query is required')
      .max(500, 'Search query too long')
      .transform((val) => val.trim()) // Trim whitespace
      .refine(
        (val) => !/[<>;"'\\{}()=]/.test(val), // Block potentially dangerous characters
        'Search query contains invalid characters'
      ),
    type: z.enum(['users', 'servers', 'channels', 'messages', 'posts', 'communities']).optional(),
    page: z.coerce.number().min(1).max(1000).default(1), // Add max page limit
    limit: z.coerce.number().min(1).max(100).default(20),
    sort: z.string()
      .max(50) // Limit sort field length
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid sort field') // Only allow valid field names
      .optional(),
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
        username: z.string()
          .min(3, 'Username must be at least 3 characters')
          .max(32, 'Username must be at most 32 characters')
          .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
          .transform((val) => val.toLowerCase().trim()),
        displayName: z.string()
          .min(1, 'Display name must be at least 1 character')
          .max(100, 'Display name must be at most 100 characters')
          .transform((val) => val.trim())
          .refine(
            (val) => !/[<>]/g.test(val), // Block HTML tags
            'Display name cannot contain HTML tags'
          )
          .optional(),
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
          // Allow just username if no auth method is provided yet
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
        identifier: z.string().optional(), // Can be username or email
        password: z.string().optional(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
        signature: z.string().optional(),
        message: z.string().optional()
      }).refine(
        (data) => {
          // Password authentication: requires identifier OR (username OR email), plus password
          const hasPasswordAuth = (data.identifier || data.username || data.email) && data.password;
          // Wallet authentication: requires walletAddress, signature, and message
          const hasWalletAuth = data.walletAddress && data.signature && data.message;
          
          return hasPasswordAuth || hasWalletAuth;
        },
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
        name: z.string().min(1, "Server name is required").max(100, "Server name must be 100 characters or less"),
        description: z.string().max(500, "Description must be 500 characters or less").optional(),
        icon: z.string().url("Invalid icon URL").optional(),
        banner: z.string().url("Invalid banner URL").optional(),
        isPublic: z.boolean().default(true),
        category: z.enum(["GAMING", "MUSIC", "EDUCATION", "SCIENCE", "TECHNOLOGY", "ENTERTAINMENT", "OTHER"]).optional(),
        maxMembers: z.number().min(1, "Max members must be at least 1").max(500000, "Max members cannot exceed 500,000").default(100000),
        tokenGated: z.boolean().default(false),
        requiredTokens: z.array(z.object({
          contractAddress: z.string(),
          tokenType: z.enum(["ERC20", "ERC721", "ERC1155"]),
          minAmount: z.string().optional(),
          tokenId: z.string().optional()
        })).optional(),
        rules: z.array(z.string().max(500)).max(20).optional(),
        welcomeChannelId: z.string().optional(),
        systemChannelId: z.string().optional(),
        verificationLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "HIGHEST"]).default("MEDIUM")
      })
    },
    update: {
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        icon: z.string().url().optional(),
        banner: z.string().url().optional(),
        isPublic: z.boolean().optional(),
        category: z.enum(["GAMING", "MUSIC", "EDUCATION", "SCIENCE", "TECHNOLOGY", "ENTERTAINMENT", "OTHER"]).optional(),
        maxMembers: z.number().min(1).max(500000).optional(),
        rules: z.array(z.string().max(500)).max(20).optional(),
        welcomeChannelId: z.string().optional(),
        systemChannelId: z.string().optional(),
        verificationLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "HIGHEST"]).optional()
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
        type: z.enum(['GUILD_TEXT', 'DM', 'GUILD_VOICE', 'GROUP_DM', 'GUILD_CATEGORY', 'GUILD_ANNOUNCEMENT', 'ANNOUNCEMENT_THREAD', 'PUBLIC_THREAD', 'PRIVATE_THREAD', 'GUILD_STAGE_VOICE']).default('GUILD_TEXT'),
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
        title: z.string()
          .min(1, 'Title is required')
          .max(300, 'Title must be at most 300 characters')
          .transform((val) => val.trim())
          .refine(
            (val) => !/[<>]/g.test(val), // Block HTML tags in titles
            'Title cannot contain HTML tags'
          ),
        content: z.string()
          .max(40000, 'Content must be at most 40,000 characters')
          .transform((val) => val.trim())
          .optional(),
        url: z.string().url('Invalid URL format').optional(),
        thumbnail: z.string().url('Invalid thumbnail URL format').optional()
      }).refine(
        (data) => data.content || data.url,
        {
          message: 'Either content or URL must be provided',
          path: ['content']
        }
      )
    },
    update: {
      body: z.object({
        content: z.string()
          .min(1, 'Content is required')
          .max(40000, 'Content must be at most 40,000 characters')
          .transform((val) => val.trim())
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