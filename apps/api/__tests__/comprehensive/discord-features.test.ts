import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app';
import { io, Socket } from 'socket.io-client';

describe('Comprehensive Discord Features Tests', () => {
  let app: FastifyInstance;
  let authToken1: string;
  let authToken2: string;
  let authToken3: string;
  let serverId: string;
  let textChannelId: string;
  let voiceChannelId: string;
  let categoryId: string;
  let roleId: string;
  let inviteCode: string;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  
  const testUsers = {
    owner: {
      email: `discord-owner-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      username: `discordowner${Date.now()}`
    },
    member1: {
      email: `discord-member1-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      username: `discordmember1${Date.now()}`
    },
    member2: {
      email: `discord-member2-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      username: `discordmember2${Date.now()}`
    }
  };

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();

    // Register all test users
    for (const user of Object.values(testUsers)) {
      await request(app.server)
        .post('/api/auth/register')
        .send(user);
    }

    // Login all users
    const loginResponse1 = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: testUsers.owner.email,
        password: testUsers.owner.password
      });

    const loginResponse2 = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: testUsers.member1.email,
        password: testUsers.member1.password
      });

    const loginResponse3 = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: testUsers.member2.email,
        password: testUsers.member2.password
      });

    authToken1 = loginResponse1.body.token;
    authToken2 = loginResponse2.body.token;
    authToken3 = loginResponse3.body.token;

    // Setup socket connections
    clientSocket1 = io('http://localhost:3002', {
      auth: { token: authToken1 },
      transports: ['websocket']
    });

    clientSocket2 = io('http://localhost:3002', {
      auth: { token: authToken2 },
      transports: ['websocket']
    });

    await new Promise((resolve) => {
      let connectCount = 0;
      const checkConnections = () => {
        connectCount++;
        if (connectCount === 2) resolve(undefined);
      };
      
      clientSocket1.on('connect', checkConnections);
      clientSocket2.on('connect', checkConnections);
    });
  }, 30000);

  afterAll(async () => {
    clientSocket1?.disconnect();
    clientSocket2?.disconnect();
    await app.close();
  });

  describe('Server Management', () => {
    it('should create a new Discord server', async () => {
      const serverData = {
        name: 'Test Discord Server',
        description: 'A test server for Discord features',
        icon: 'https://example.com/server-icon.png',
        region: 'us-west',
        verificationLevel: 'medium',
        defaultNotifications: 'mentions',
        explicitContentFilter: 'members_without_roles'
      };

      const response = await request(app.server)
        .post('/api/servers')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(serverData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.server).toHaveProperty('id');
      expect(response.body.server.name).toBe(serverData.name);
      expect(response.body.server.description).toBe(serverData.description);
      expect(response.body.server).toHaveProperty('inviteCode');
      expect(response.body.server.ownerId).toBeDefined();

      serverId = response.body.server.id;
      inviteCode = response.body.server.inviteCode;
    });

    it('should update server settings', async () => {
      const updateData = {
        name: 'Updated Discord Server',
        description: 'Updated description',
        verificationLevel: 'high',
        systemChannelFlags: ['suppress_join_notifications']
      };

      const response = await request(app.server)
        .patch(`/api/servers/${serverId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.server.name).toBe(updateData.name);
      expect(response.body.server.description).toBe(updateData.description);
      expect(response.body.server.verificationLevel).toBe(updateData.verificationLevel);
    });

    it('should get server information', async () => {
      const response = await request(app.server)
        .get(`/api/servers/${serverId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.server).toHaveProperty('id', serverId);
      expect(response.body.server).toHaveProperty('name');
      expect(response.body.server).toHaveProperty('channels');
      expect(response.body.server).toHaveProperty('members');
      expect(response.body.server).toHaveProperty('roles');
    });

    it('should generate and manage invite codes', async () => {
      const inviteData = {
        channelId: null, // Server invite
        maxUses: 10,
        maxAge: 3600, // 1 hour
        temporary: false,
        unique: true
      };

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/invites`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(inviteData)
        .expect(201);

      expect(response.body.invite).toHaveProperty('code');
      expect(response.body.invite).toHaveProperty('maxUses', 10);
      expect(response.body.invite).toHaveProperty('maxAge', 3600);
      expect(response.body.invite).toHaveProperty('uses', 0);
    });

    it('should list server invites', async () => {
      const response = await request(app.server)
        .get(`/api/servers/${serverId}/invites`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(Array.isArray(response.body.invites)).toBe(true);
      expect(response.body.invites.length).toBeGreaterThan(0);
    });
  });

  describe('Channel Management', () => {
    it('should create channel categories', async () => {
      const categoryData = {
        name: 'General',
        type: 'category',
        position: 0,
        permissionOverwrites: []
      };

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/channels`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.channel).toHaveProperty('id');
      expect(response.body.channel.name).toBe(categoryData.name);
      expect(response.body.channel.type).toBe('category');

      categoryId = response.body.channel.id;
    });

    it('should create text channels', async () => {
      const textChannelData = {
        name: 'general',
        type: 'text',
        topic: 'General discussion channel',
        categoryId: categoryId,
        slowmode: 0,
        nsfw: false,
        position: 1
      };

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/channels`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(textChannelData)
        .expect(201);

      expect(response.body.channel).toHaveProperty('id');
      expect(response.body.channel.name).toBe(textChannelData.name);
      expect(response.body.channel.type).toBe('text');
      expect(response.body.channel.categoryId).toBe(categoryId);

      textChannelId = response.body.channel.id;
    });

    it('should create voice channels', async () => {
      const voiceChannelData = {
        name: 'General Voice',
        type: 'voice',
        categoryId: categoryId,
        bitrate: 64000,
        userLimit: 10,
        position: 2
      };

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/channels`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(voiceChannelData)
        .expect(201);

      expect(response.body.channel).toHaveProperty('id');
      expect(response.body.channel.name).toBe(voiceChannelData.name);
      expect(response.body.channel.type).toBe('voice');
      expect(response.body.channel.bitrate).toBe(voiceChannelData.bitrate);
      expect(response.body.channel.userLimit).toBe(voiceChannelData.userLimit);

      voiceChannelId = response.body.channel.id;
    });

    it('should update channel settings', async () => {
      const updateData = {
        name: 'updated-general',
        topic: 'Updated general discussion',
        slowmode: 5,
        position: 0
      };

      const response = await request(app.server)
        .patch(`/api/servers/${serverId}/channels/${textChannelId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.channel.name).toBe(updateData.name);
      expect(response.body.channel.topic).toBe(updateData.topic);
      expect(response.body.channel.slowmode).toBe(updateData.slowmode);
    });

    it('should delete channels', async () => {
      // Create a temporary channel to delete
      const tempChannelResponse = await request(app.server)
        .post(`/api/servers/${serverId}/channels`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'temp-channel',
          type: 'text'
        });

      const tempChannelId = tempChannelResponse.body.channel.id;

      await request(app.server)
        .delete(`/api/servers/${serverId}/channels/${tempChannelId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      // Verify channel is deleted
      await request(app.server)
        .get(`/api/servers/${serverId}/channels/${tempChannelId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);
    });
  });

  describe('Role Management', () => {
    it('should create server roles', async () => {
      const roleData = {
        name: 'Moderator',
        color: '#FF5733',
        permissions: {
          manageMessages: true,
          kickMembers: true,
          banMembers: false,
          manageChannels: true,
          manageRoles: false,
          administrator: false
        },
        hoist: true,
        mentionable: true,
        position: 1
      };

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/roles`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(roleData)
        .expect(201);

      expect(response.body.role).toHaveProperty('id');
      expect(response.body.role.name).toBe(roleData.name);
      expect(response.body.role.color).toBe(roleData.color);
      expect(response.body.role.permissions).toMatchObject(roleData.permissions);
      expect(response.body.role.hoist).toBe(true);

      roleId = response.body.role.id;
    });

    it('should update role permissions', async () => {
      const updateData = {
        permissions: {
          manageMessages: true,
          kickMembers: true,
          banMembers: true,
          manageChannels: true,
          manageRoles: true,
          administrator: false
        }
      };

      const response = await request(app.server)
        .patch(`/api/servers/${serverId}/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.role.permissions.banMembers).toBe(true);
      expect(response.body.role.permissions.manageRoles).toBe(true);
    });

    it('should assign roles to members', async () => {
      // First, add member to server
      await request(app.server)
        .post(`/api/servers/${serverId}/join`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ inviteCode });

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/members/${testUsers.member1.username}/roles`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ roleIds: [roleId] })
        .expect(200);

      expect(response.body.member.roles).toContain(roleId);
    });

    it('should remove roles from members', async () => {
      const response = await request(app.server)
        .delete(`/api/servers/${serverId}/members/${testUsers.member1.username}/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.member.roles).not.toContain(roleId);
    });
  });

  describe('Member Management', () => {
    it('should allow members to join server with invite', async () => {
      const response = await request(app.server)
        .post(`/api/servers/${serverId}/join`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({ inviteCode })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.member).toHaveProperty('userId');
      expect(response.body.member).toHaveProperty('joinedAt');
    });

    it('should list server members', async () => {
      const response = await request(app.server)
        .get(`/api/servers/${serverId}/members`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(Array.isArray(response.body.members)).toBe(true);
      expect(response.body.members.length).toBeGreaterThan(1);
      expect(response.body.members.some((m: any) => m.username === testUsers.owner.username)).toBe(true);
      expect(response.body.members.some((m: any) => m.username === testUsers.member1.username)).toBe(true);
    });

    it('should kick members from server', async () => {
      const response = await request(app.server)
        .delete(`/api/servers/${serverId}/members/${testUsers.member2.username}/kick`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ reason: 'Testing kick functionality' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify member was kicked
      const membersResponse = await request(app.server)
        .get(`/api/servers/${serverId}/members`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(membersResponse.body.members.some((m: any) => m.username === testUsers.member2.username)).toBe(false);
    });

    it('should ban members from server', async () => {
      // Re-add member first
      await request(app.server)
        .post(`/api/servers/${serverId}/join`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({ inviteCode });

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/members/${testUsers.member2.username}/ban`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ 
          reason: 'Testing ban functionality',
          deleteMessageDays: 1
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should list server bans', async () => {
      const response = await request(app.server)
        .get(`/api/servers/${serverId}/bans`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(Array.isArray(response.body.bans)).toBe(true);
      expect(response.body.bans.some((b: any) => b.username === testUsers.member2.username)).toBe(true);
    });

    it('should unban members', async () => {
      const response = await request(app.server)
        .delete(`/api/servers/${serverId}/bans/${testUsers.member2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Message System', () => {
    let messageId: string;

    it('should send messages to text channels', async () => {
      const messageData = {
        content: 'Hello Discord world! 👋',
        embeds: [{
          title: 'Test Embed',
          description: 'This is a test embed',
          color: 0x00FF00
        }]
      };

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/channels/${textChannelId}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toHaveProperty('id');
      expect(response.body.message.content).toBe(messageData.content);
      expect(response.body.message.embeds).toHaveLength(1);
      expect(response.body.message.embeds[0].title).toBe('Test Embed');

      messageId = response.body.message.id;
    });

    it('should edit messages', async () => {
      const editData = {
        content: 'Edited message content',
        embeds: []
      };

      const response = await request(app.server)
        .patch(`/api/servers/${serverId}/channels/${textChannelId}/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(editData)
        .expect(200);

      expect(response.body.message.content).toBe(editData.content);
      expect(response.body.message.edited).toBe(true);
      expect(response.body.message.editedTimestamp).toBeDefined();
    });

    it('should add reactions to messages', async () => {
      const response = await request(app.server)
        .post(`/api/servers/${serverId}/channels/${textChannelId}/messages/${messageId}/reactions/👍`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should get message reactions', async () => {
      const response = await request(app.server)
        .get(`/api/servers/${serverId}/channels/${textChannelId}/messages/${messageId}/reactions/👍`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.some((u: any) => u.username === testUsers.owner.username)).toBe(true);
    });

    it('should pin messages', async () => {
      const response = await request(app.server)
        .post(`/api/servers/${serverId}/channels/${textChannelId}/messages/${messageId}/pin`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.message.pinned).toBe(true);
      expect(response.body.message.pinnedTimestamp).toBeDefined();
    });

    it('should get pinned messages', async () => {
      const response = await request(app.server)
        .get(`/api/servers/${serverId}/channels/${textChannelId}/pins`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages.some((m: any) => m.id === messageId)).toBe(true);
    });

    it('should delete messages', async () => {
      await request(app.server)
        .delete(`/api/servers/${serverId}/channels/${textChannelId}/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      // Verify message is deleted
      await request(app.server)
        .get(`/api/servers/${serverId}/channels/${textChannelId}/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);
    });
  });

  describe('Real-time Discord Events', () => {
    it('should notify users of new messages', (done) => {
      clientSocket1.emit('join_channel', { channelId: textChannelId });
      clientSocket2.emit('join_channel', { channelId: textChannelId });

      clientSocket2.on('channel_message', (data) => {
        expect(data.content).toBe('Real-time message test');
        expect(data.channelId).toBe(textChannelId);
        expect(data.author.username).toBe(testUsers.owner.username);
        done();
      });

      setTimeout(() => {
        clientSocket1.emit('send_channel_message', {
          channelId: textChannelId,
          content: 'Real-time message test'
        });
      }, 500);
    }, 10000);

    it('should notify users of server member events', (done) => {
      clientSocket1.on('server_member_joined', (data) => {
        expect(data.serverId).toBe(serverId);
        expect(data.member).toHaveProperty('username');
        done();
      });

      // Simulate a new member joining
      setTimeout(async () => {
        const newUser = {
          email: `new-discord-member-${Date.now()}@example.com`,
          password: 'SecurePassword123!',
          username: `newdiscordmember${Date.now()}`
        };

        await request(app.server)
          .post('/api/auth/register')
          .send(newUser);

        const loginResponse = await request(app.server)
          .post('/api/auth/login')
          .send({
            email: newUser.email,
            password: newUser.password
          });

        await request(app.server)
          .post(`/api/servers/${serverId}/join`)
          .set('Authorization', `Bearer ${loginResponse.body.token}`)
          .send({ inviteCode });
      }, 500);
    }, 15000);

    it('should notify users of role updates', (done) => {
      clientSocket2.on('member_role_updated', (data) => {
        expect(data.serverId).toBe(serverId);
        expect(data.member.username).toBe(testUsers.member1.username);
        expect(data.rolesAdded).toContain(roleId);
        done();
      });

      setTimeout(async () => {
        await request(app.server)
          .post(`/api/servers/${serverId}/members/${testUsers.member1.username}/roles`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send({ roleIds: [roleId] });
      }, 500);
    }, 10000);
  });

  describe('Permission System', () => {
    it('should enforce channel permissions', async () => {
      // Create a private channel
      const privateChannelResponse = await request(app.server)
        .post(`/api/servers/${serverId}/channels`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'private-channel',
          type: 'text',
          permissionOverwrites: [{
            id: roleId,
            type: 'role',
            allow: 0,
            deny: 1024 // VIEW_CHANNEL permission
          }]
        });

      const privateChannelId = privateChannelResponse.body.channel.id;

      // Member with role should not be able to access
      await request(app.server)
        .get(`/api/servers/${serverId}/channels/${privateChannelId}/messages`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);
    });

    it('should check message permissions', async () => {
      // Try to delete message as non-owner without permissions
      const messageResponse = await request(app.server)
        .post(`/api/servers/${serverId}/channels/${textChannelId}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'Test message for permissions' });

      const messageId = messageResponse.body.message.id;

      await request(app.server)
        .delete(`/api/servers/${serverId}/channels/${textChannelId}/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);
    });

    it('should check administrative permissions', async () => {
      // Regular member should not be able to create channels
      await request(app.server)
        .post(`/api/servers/${serverId}/channels`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          name: 'unauthorized-channel',
          type: 'text'
        })
        .expect(403);
    });
  });

  describe('Server Discovery and Templates', () => {
    it('should create server template', async () => {
      const templateData = {
        name: 'Gaming Server Template',
        description: 'A template for gaming communities'
      };

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/templates`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(templateData)
        .expect(201);

      expect(response.body.template).toHaveProperty('code');
      expect(response.body.template.name).toBe(templateData.name);
      expect(response.body.template.description).toBe(templateData.description);
    });

    it('should sync template with server changes', async () => {
      const templatesResponse = await request(app.server)
        .get(`/api/servers/${serverId}/templates`)
        .set('Authorization', `Bearer ${authToken1}`);

      const templateCode = templatesResponse.body.templates[0].code;

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/templates/${templateCode}/sync`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.template.synced).toBe(true);
    });
  });

  describe('Audit Logs', () => {
    it('should log server actions', async () => {
      // Perform an action that should be logged
      await request(app.server)
        .patch(`/api/servers/${serverId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ name: 'Audit Log Test Server' });

      const response = await request(app.server)
        .get(`/api/servers/${serverId}/audit-logs`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(Array.isArray(response.body.auditLogs)).toBe(true);
      expect(response.body.auditLogs.some((log: any) => 
        log.action === 'server_update' && log.userId === testUsers.owner.username
      )).toBe(true);
    });

    it('should filter audit logs by action type', async () => {
      const response = await request(app.server)
        .get(`/api/servers/${serverId}/audit-logs`)
        .query({ actionType: 'channel_create' })
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.auditLogs.every((log: any) => log.action === 'channel_create')).toBe(true);
    });
  });

  describe('Webhooks', () => {
    let webhookId: string;

    it('should create channel webhooks', async () => {
      const webhookData = {
        name: 'Test Webhook',
        avatar: 'https://example.com/webhook-avatar.png'
      };

      const response = await request(app.server)
        .post(`/api/servers/${serverId}/channels/${textChannelId}/webhooks`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(webhookData)
        .expect(201);

      expect(response.body.webhook).toHaveProperty('id');
      expect(response.body.webhook).toHaveProperty('token');
      expect(response.body.webhook).toHaveProperty('url');
      expect(response.body.webhook.name).toBe(webhookData.name);

      webhookId = response.body.webhook.id;
    });

    it('should execute webhooks', async () => {
      const webhookResponse = await request(app.server)
        .get(`/api/servers/${serverId}/channels/${textChannelId}/webhooks`)
        .set('Authorization', `Bearer ${authToken1}`);

      const webhook = webhookResponse.body.webhooks[0];

      const response = await request(app.server)
        .post(`/api/webhooks/${webhook.id}/${webhook.token}`)
        .send({
          content: 'Message from webhook',
          username: 'Custom Webhook Name',
          avatar_url: 'https://example.com/custom-avatar.png'
        })
        .expect(204);
    });

    it('should manage webhook permissions', async () => {
      const response = await request(app.server)
        .patch(`/api/servers/${serverId}/channels/${textChannelId}/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'Updated Webhook',
          channel_id: textChannelId
        })
        .expect(200);

      expect(response.body.webhook.name).toBe('Updated Webhook');
    });

    it('should delete webhooks', async () => {
      await request(app.server)
        .delete(`/api/servers/${serverId}/channels/${textChannelId}/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(204);
    });
  });
});