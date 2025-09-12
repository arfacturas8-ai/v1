import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

// Enhanced validation schemas for server discovery and templates
const serverDiscoverySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(24),
  category: z.enum(['GAMING', 'MUSIC', 'EDUCATION', 'SCIENCE', 'TECHNOLOGY', 'ENTERTAINMENT', 'OTHER']).optional(),
  search: z.string().min(1).max(100).optional(),
  sortBy: z.enum(['members', 'activity', 'created', 'alphabetical']).default('members'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  featured: z.boolean().optional(),
  minMembers: z.number().min(1).optional(),
  maxMembers: z.number().min(1).optional(),
  verified: z.boolean().optional()
});

const serverTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: z.enum(['GAMING', 'MUSIC', 'EDUCATION', 'SCIENCE', 'TECHNOLOGY', 'ENTERTAINMENT', 'OTHER']),
  icon: z.string().url().optional(),
  banner: z.string().url().optional(),
  useTemplate: z.boolean().default(true)
});

// Server templates with predefined channels and roles
const SERVER_TEMPLATES = {
  GAMING: {
    name: "Gaming Community",
    description: "Perfect for gaming communities and esports teams",
    channels: [
      { name: "Text Channels", type: "CATEGORY", position: 0 },
      { name: "general", type: "TEXT", position: 1, topic: "General discussion for all gamers" },
      { name: "game-chat", type: "TEXT", position: 2, topic: "Talk about your current games" },
      { name: "looking-for-group", type: "TEXT", position: 3, topic: "Find teammates and groups" },
      { name: "screenshots", type: "TEXT", position: 4, topic: "Share your epic gaming moments" },
      { name: "Voice Channels", type: "CATEGORY", position: 5 },
      { name: "General", type: "VOICE", position: 6 },
      { name: "Gaming Room 1", type: "VOICE", position: 7 },
      { name: "Gaming Room 2", type: "VOICE", position: 8 },
      { name: "AFK", type: "VOICE", position: 9 }
    ],
    roles: [
      { name: "@everyone", position: 0, permissions: "1024", color: null },
      { name: "Admin", position: 4, permissions: "8", color: "#ff0000" },
      { name: "Moderator", position: 3, permissions: "268435462", color: "#ffa500" },
      { name: "Pro Gamer", position: 2, permissions: "36701248", color: "#00ff00" },
      { name: "Member", position: 1, permissions: "36701248", color: "#0099ff" }
    ]
  },
  EDUCATION: {
    name: "Study Group",
    description: "Educational community for students and teachers",
    channels: [
      { name: "Text Channels", type: "CATEGORY", position: 0 },
      { name: "general", type: "TEXT", position: 1, topic: "General academic discussion" },
      { name: "announcements", type: "ANNOUNCEMENT", position: 2, topic: "Important announcements and deadlines" },
      { name: "homework-help", type: "TEXT", position: 3, topic: "Get help with assignments" },
      { name: "resources", type: "TEXT", position: 4, topic: "Share educational resources and links" },
      { name: "off-topic", type: "TEXT", position: 5, topic: "Non-academic discussions" },
      { name: "Voice Channels", type: "CATEGORY", position: 6 },
      { name: "Study Hall", type: "VOICE", position: 7 },
      { name: "Group Study", type: "VOICE", position: 8 },
      { name: "Office Hours", type: "VOICE", position: 9 }
    ],
    roles: [
      { name: "@everyone", position: 0, permissions: "1024", color: null },
      { name: "Admin", position: 4, permissions: "8", color: "#ff0000" },
      { name: "Teacher", position: 3, permissions: "268435462", color: "#8b4513" },
      { name: "TA", position: 2, permissions: "36701248", color: "#ffa500" },
      { name: "Student", position: 1, permissions: "36701248", color: "#0066cc" }
    ]
  },
  MUSIC: {
    name: "Music Community",
    description: "For musicians, producers, and music lovers",
    channels: [
      { name: "Text Channels", type: "CATEGORY", position: 0 },
      { name: "general", type: "TEXT", position: 1, topic: "General music discussion" },
      { name: "share-your-music", type: "TEXT", position: 2, topic: "Share your original compositions" },
      { name: "feedback", type: "TEXT", position: 3, topic: "Give and receive constructive feedback" },
      { name: "collaboration", type: "TEXT", position: 4, topic: "Find collaborators for projects" },
      { name: "gear-talk", type: "TEXT", position: 5, topic: "Discuss instruments and equipment" },
      { name: "Voice Channels", type: "CATEGORY", position: 6 },
      { name: "Listening Room", type: "VOICE", position: 7 },
      { name: "Jam Session", type: "VOICE", position: 8 },
      { name: "Recording Studio", type: "VOICE", position: 9 }
    ],
    roles: [
      { name: "@everyone", position: 0, permissions: "1024", color: null },
      { name: "Admin", position: 4, permissions: "8", color: "#ff0000" },
      { name: "Producer", position: 3, permissions: "36701248", color: "#ff6600" },
      { name: "Musician", position: 2, permissions: "36701248", color: "#9932cc" },
      { name: "Music Lover", position: 1, permissions: "36701248", color: "#ff1493" }
    ]
  },
  TECHNOLOGY: {
    name: "Tech Community",
    description: "For developers, tech enthusiasts, and innovators",
    channels: [
      { name: "Text Channels", type: "CATEGORY", position: 0 },
      { name: "general", type: "TEXT", position: 1, topic: "General tech discussion" },
      { name: "announcements", type: "ANNOUNCEMENT", position: 2, topic: "Tech news and updates" },
      { name: "programming", type: "TEXT", position: 3, topic: "Programming languages and frameworks" },
      { name: "projects", type: "TEXT", position: 4, topic: "Share your projects and get feedback" },
      { name: "job-board", type: "TEXT", position: 5, topic: "Job opportunities and career advice" },
      { name: "Voice Channels", type: "CATEGORY", position: 6 },
      { name: "General", type: "VOICE", position: 7 },
      { name: "Code Review", type: "VOICE", position: 8 },
      { name: "Pair Programming", type: "VOICE", position: 9 }
    ],
    roles: [
      { name: "@everyone", position: 0, permissions: "1024", color: null },
      { name: "Admin", position: 4, permissions: "8", color: "#ff0000" },
      { name: "Senior Dev", position: 3, permissions: "36701248", color: "#00ff00" },
      { name: "Developer", position: 2, permissions: "36701248", color: "#00aaff" },
      { name: "Enthusiast", position: 1, permissions: "36701248", color: "#ffaa00" }
    ]
  },
  ENTERTAINMENT: {
    name: "Entertainment Hub",
    description: "Movies, TV shows, books, and general entertainment",
    channels: [
      { name: "Text Channels", type: "CATEGORY", position: 0 },
      { name: "general", type: "TEXT", position: 1, topic: "General entertainment chat" },
      { name: "movies-tv", type: "TEXT", position: 2, topic: "Discuss movies and TV shows" },
      { name: "books", type: "TEXT", position: 3, topic: "Book recommendations and discussions" },
      { name: "memes", type: "TEXT", position: 4, topic: "Share funny memes and jokes" },
      { name: "recommendations", type: "TEXT", position: 5, topic: "Get entertainment recommendations" },
      { name: "Voice Channels", type: "CATEGORY", position: 6 },
      { name: "Movie Night", type: "VOICE", position: 7 },
      { name: "General Chat", type: "VOICE", position: 8 },
      { name: "Book Club", type: "VOICE", position: 9 }
    ],
    roles: [
      { name: "@everyone", position: 0, permissions: "1024", color: null },
      { name: "Admin", position: 4, permissions: "8", color: "#ff0000" },
      { name: "Critic", position: 3, permissions: "36701248", color: "#800080" },
      { name: "Enthusiast", position: 2, permissions: "36701248", color: "#ff69b4" },
      { name: "Member", position: 1, permissions: "36701248", color: "#32cd32" }
    ]
  }
};

export default async function serverDiscoveryRoutes(fastify: FastifyInstance) {
  
  /**
   * @swagger
   * /servers/discover:
   *   get:
   *     tags: [servers]
   *     summary: Discover public servers
   *     description: Browse and search public servers with advanced filtering
   */
  fastify.get('/discover', {
    schema: {
      tags: ['servers'],
      summary: 'Discover public servers',
      description: 'Browse and search public servers with advanced filtering and sorting options',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 24 },
          category: { 
            type: 'string', 
            enum: ['GAMING', 'MUSIC', 'EDUCATION', 'SCIENCE', 'TECHNOLOGY', 'ENTERTAINMENT', 'OTHER'] 
          },
          search: { type: 'string', minLength: 1, maxLength: 100 },
          sortBy: { type: 'string', enum: ['members', 'activity', 'created', 'alphabetical'], default: 'members' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          featured: { type: 'boolean' },
          minMembers: { type: 'number', minimum: 1 },
          maxMembers: { type: 'number', minimum: 1 },
          verified: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                servers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      icon: { type: 'string' },
                      banner: { type: 'string' },
                      category: { type: 'string' },
                      memberCount: { type: 'number' },
                      onlineCount: { type: 'number' },
                      featured: { type: 'boolean' },
                      verified: { type: 'boolean' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    page: { type: 'number' },
                    pageSize: { type: 'number' },
                    hasMore: { type: 'boolean' }
                  }
                },
                categories: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      count: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const query = serverDiscoverySchema.parse(request.query);
      const { page, limit, category, search, sortBy, sortOrder, featured, minMembers, maxMembers, verified } = query;

      // Build where clause for filtering
      const where: any = {
        isPublic: true
      };

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ];
      }

      if (featured !== undefined) {
        where.featured = featured;
      }

      if (verified !== undefined) {
        where.verified = verified;
      }

      // Handle member count filtering
      if (minMembers !== undefined || maxMembers !== undefined) {
        where.members = {};
        if (minMembers !== undefined) {
          where.members.some = {
            id: {
              in: await prisma.serverMember.findMany({
                select: { serverId: true },
                groupBy: ['serverId'],
                having: {
                  _count: {
                    serverId: {
                      gte: minMembers
                    }
                  }
                }
              }).then(results => results.map(r => r.serverId))
            }
          };
        }
        if (maxMembers !== undefined) {
          where.members.some = {
            ...where.members.some,
            id: {
              in: await prisma.serverMember.findMany({
                select: { serverId: true },
                groupBy: ['serverId'],
                having: {
                  _count: {
                    serverId: {
                      lte: maxMembers
                    }
                  }
                }
              }).then(results => results.map(r => r.serverId))
            }
          };
        }
      }

      // Build order by clause
      let orderBy: any = {};
      switch (sortBy) {
        case 'members':
          orderBy = { members: { _count: sortOrder } };
          break;
        case 'created':
          orderBy = { createdAt: sortOrder };
          break;
        case 'alphabetical':
          orderBy = { name: sortOrder };
          break;
        case 'activity':
          // Sort by recent activity (messages, joins, etc.)
          orderBy = { updatedAt: sortOrder };
          break;
        default:
          orderBy = { members: { _count: 'desc' } };
      }

      // Execute queries in parallel
      const [servers, total, categoryStats] = await Promise.all([
        prisma.server.findMany({
          where,
          include: {
            _count: {
              select: {
                members: true,
                channels: true
              }
            },
            owner: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy
        }),
        prisma.server.count({ where }),
        prisma.server.groupBy({
          by: ['category'],
          where: { isPublic: true },
          _count: {
            id: true
          }
        })
      ]);

      // Calculate online members (this would need a presence system in production)
      const serversWithOnlineCount = servers.map(server => ({
        ...server,
        memberCount: server._count.members,
        channelCount: server._count.channels,
        onlineCount: Math.floor(server._count.members * 0.3), // Mock online count
        verified: server.verified || false,
        featured: server.featured || false
      }));

      const categories = categoryStats.map(stat => ({
        name: stat.category || 'OTHER',
        count: stat._count.id
      }));

      return reply.send({
        success: true,
        data: {
          servers: serversWithOnlineCount,
          pagination: {
            total,
            page,
            pageSize: limit,
            hasMore: page * limit < total
          },
          categories
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors
        });
      }

      fastify.log.error({ error }, 'Server discovery failed');
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch servers"
      });
    }
  });

  /**
   * @swagger
   * /servers/templates:
   *   get:
   *     tags: [servers]
   *     summary: Get server templates
   *     description: Get available server templates for quick setup
   */
  fastify.get('/templates', {
    schema: {
      tags: ['servers'],
      summary: 'Get server templates',
      description: 'Get available server templates for quick server setup',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  icon: { type: 'string' },
                  channelCount: { type: 'number' },
                  roleCount: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const templates = Object.entries(SERVER_TEMPLATES).map(([key, template]) => ({
        id: key,
        name: template.name,
        description: template.description,
        category: key,
        icon: null,
        channelCount: template.channels.length,
        roleCount: template.roles.length
      }));

      return reply.send({
        success: true,
        data: templates
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to get server templates');
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch server templates"
      });
    }
  });

  /**
   * @swagger
   * /servers/create-from-template:
   *   post:
   *     tags: [servers]
   *     summary: Create server from template
   *     description: Create a new server using a predefined template
   *     security:
   *       - Bearer: []
   */
  fastify.post('/create-from-template', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['servers'],
      summary: 'Create server from template',
      description: 'Create a new server using a predefined template with default channels and roles',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          templateId: { 
            type: 'string', 
            enum: ['GAMING', 'MUSIC', 'EDUCATION', 'SCIENCE', 'TECHNOLOGY', 'ENTERTAINMENT', 'OTHER'],
            description: 'Template ID to use'
          },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          icon: { type: 'string', format: 'uri' },
          banner: { type: 'string', format: 'uri' },
          isPublic: { type: 'boolean', default: true }
        },
        required: ['templateId', 'name']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                ownerId: { type: 'string' },
                channels: { type: 'array' },
                roles: { type: 'array' },
                memberCount: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { templateId, name, description, icon, banner, isPublic = true } = request.body as any;

      const template = SERVER_TEMPLATES[templateId as keyof typeof SERVER_TEMPLATES];
      if (!template) {
        return reply.code(400).send({
          success: false,
          error: "Invalid template ID"
        });
      }

      // Create server with template structure using transaction
      const server = await prisma.$transaction(async (tx) => {
        // Create the server
        const newServer = await tx.server.create({
          data: {
            name,
            description: description || template.description,
            icon,
            banner,
            isPublic,
            category: templateId,
            maxMembers: 100000,
            ownerId: request.userId,
            verificationLevel: 'MEDIUM'
          }
        });

        // Create roles from template
        const createdRoles: any[] = [];
        for (const roleData of template.roles) {
          const role = await tx.role.create({
            data: {
              serverId: newServer.id,
              name: roleData.name,
              position: roleData.position,
              permissions: BigInt(roleData.permissions),
              color: roleData.color,
              hoist: roleData.name !== "@everyone",
              mentionable: roleData.name !== "@everyone"
            }
          });
          createdRoles.push(role);
        }

        // Create channels from template
        const createdChannels: any[] = [];
        let parentMap: { [key: string]: string } = {};

        for (const channelData of template.channels) {
          let parentId = null;
          if (channelData.type !== 'CATEGORY' && channelData.position > 0) {
            // Find the most recent category before this channel
            const categories = template.channels
              .filter(c => c.type === 'CATEGORY' && c.position < channelData.position)
              .sort((a, b) => b.position - a.position);
            
            if (categories.length > 0) {
              parentId = parentMap[categories[0].name];
            }
          }

          const channel = await tx.channel.create({
            data: {
              serverId: newServer.id,
              name: channelData.name.toLowerCase().replace(/\\s+/g, '-'),
              type: channelData.type as any,
              position: channelData.position,
              parentId,
              topic: (channelData as any).topic
            }
          });

          createdChannels.push(channel);
          
          if (channelData.type === 'CATEGORY') {
            parentMap[channelData.name] = channel.id;
          }
        }

        // Add owner as member with admin role
        const adminRole = createdRoles.find(r => r.name === 'Admin');
        
        await tx.serverMember.create({
          data: {
            serverId: newServer.id,
            userId: request.userId,
            joinedAt: new Date()
          }
        });

        if (adminRole) {
          await tx.memberRole.create({
            data: {
              serverId: newServer.id,
              userId: request.userId,
              roleId: adminRole.id
            }
          });
        }

        // Log server creation
        await tx.auditLog.create({
          data: {
            serverId: newServer.id,
            userId: request.userId,
            action: "SERVER_CREATE_FROM_TEMPLATE",
            metadata: {
              templateId,
              serverName: name,
              channelCount: createdChannels.length,
              roleCount: createdRoles.length
            }
          }
        });

        return {
          ...newServer,
          channels: createdChannels,
          roles: createdRoles
        };
      });

      // Emit socket event for real-time updates
      if (fastify.socketIntegration) {
        fastify.socketIntegration.io.emit('serverCreateFromTemplate', {
          server,
          templateId,
          ownerId: request.userId
        });
      }

      return reply.code(201).send({
        success: true,
        data: {
          ...server,
          memberCount: 1
        },
        message: `Server created successfully using ${template.name} template`
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Validation failed",
          details: error.errors
        });
      }

      fastify.log.error({ error, userId: request.userId }, 'Template server creation failed');
      return reply.code(500).send({
        success: false,
        error: "Failed to create server from template"
      });
    }
  });
}