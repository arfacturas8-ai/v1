import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app';
import { io, Socket } from 'socket.io-client';

describe('Comprehensive Reddit Features Tests', () => {
  let app: FastifyInstance;
  let authToken1: string;
  let authToken2: string;
  let authToken3: string;
  let communityId: string;
  let postId: string;
  let commentId: string;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  
  const testUsers = {
    moderator: {
      email: `reddit-mod-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      username: `redditmod${Date.now()}`
    },
    user1: {
      email: `reddit-user1-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      username: `reddituser1${Date.now()}`
    },
    user2: {
      email: `reddit-user2-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      username: `reddituser2${Date.now()}`
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
        email: testUsers.moderator.email,
        password: testUsers.moderator.password
      });

    const loginResponse2 = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: testUsers.user1.email,
        password: testUsers.user1.password
      });

    const loginResponse3 = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: testUsers.user2.email,
        password: testUsers.user2.password
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

  describe('Community Management', () => {
    it('should create a new community (subreddit)', async () => {
      const communityData = {
        name: 'testcommunity',
        title: 'Test Community',
        description: 'A test community for Reddit features testing',
        type: 'public',
        category: 'technology',
        nsfw: false,
        rules: [
          {
            title: 'Be respectful',
            description: 'Treat others with respect and kindness'
          },
          {
            title: 'No spam',
            description: 'Do not post spam or self-promotional content'
          }
        ],
        settings: {
          allowImages: true,
          allowVideos: true,
          allowPolls: true,
          restrictComments: false,
          requireApproval: false
        }
      };

      const response = await request(app.server)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(communityData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.community).toHaveProperty('id');
      expect(response.body.community.name).toBe(communityData.name);
      expect(response.body.community.title).toBe(communityData.title);
      expect(response.body.community.description).toBe(communityData.description);
      expect(response.body.community.rules).toHaveLength(2);

      communityId = response.body.community.id;
    });

    it('should update community settings', async () => {
      const updateData = {
        title: 'Updated Test Community',
        description: 'Updated description for the test community',
        settings: {
          allowImages: false,
          allowVideos: true,
          allowPolls: false,
          restrictComments: true,
          requireApproval: true
        }
      };

      const response = await request(app.server)
        .patch(`/api/communities/${communityId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.community.title).toBe(updateData.title);
      expect(response.body.community.description).toBe(updateData.description);
      expect(response.body.community.settings.allowImages).toBe(false);
      expect(response.body.community.settings.requireApproval).toBe(true);
    });

    it('should get community information', async () => {
      const response = await request(app.server)
        .get(`/api/communities/${communityId}`)
        .expect(200);

      expect(response.body.community).toHaveProperty('id', communityId);
      expect(response.body.community).toHaveProperty('name');
      expect(response.body.community).toHaveProperty('memberCount');
      expect(response.body.community).toHaveProperty('rules');
      expect(response.body.community).toHaveProperty('moderators');
    });

    it('should join community', async () => {
      const response = await request(app.server)
        .post(`/api/communities/${communityId}/join`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('joined', true);
    });

    it('should leave community', async () => {
      const response = await request(app.server)
        .post(`/api/communities/${communityId}/leave`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('left', true);
    });

    it('should list popular communities', async () => {
      const response = await request(app.server)
        .get('/api/communities/popular')
        .expect(200);

      expect(Array.isArray(response.body.communities)).toBe(true);
      expect(response.body.communities.every((c: any) => c.memberCount >= 0)).toBe(true);
    });
  });

  describe('Post Management', () => {
    beforeAll(async () => {
      // Join community for posting
      await request(app.server)
        .post(`/api/communities/${communityId}/join`)
        .set('Authorization', `Bearer ${authToken2}`);
    });

    it('should create text posts', async () => {
      const postData = {
        title: 'This is a test text post',
        content: 'This is the content of the test post. It contains **markdown** and [links](https://example.com).',
        type: 'text',
        flair: 'Discussion',
        nsfw: false,
        spoiler: false,
        tags: ['test', 'discussion', 'reddit']
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(postData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.post).toHaveProperty('id');
      expect(response.body.post.title).toBe(postData.title);
      expect(response.body.post.content).toBe(postData.content);
      expect(response.body.post.type).toBe('text');
      expect(response.body.post.tags).toEqual(postData.tags);

      postId = response.body.post.id;
    });

    it('should create link posts', async () => {
      const linkPostData = {
        title: 'Interesting article about technology',
        url: 'https://example.com/article',
        type: 'link',
        flair: 'News'
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(linkPostData)
        .expect(201);

      expect(response.body.post.type).toBe('link');
      expect(response.body.post.url).toBe(linkPostData.url);
      expect(response.body.post.flair).toBe(linkPostData.flair);
    });

    it('should create image posts', async () => {
      const imagePostData = {
        title: 'Check out this cool image',
        imageUrl: 'https://example.com/image.jpg',
        type: 'image',
        flair: 'Media'
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(imagePostData)
        .expect(201);

      expect(response.body.post.type).toBe('image');
      expect(response.body.post.imageUrl).toBe(imagePostData.imageUrl);
    });

    it('should create poll posts', async () => {
      const pollPostData = {
        title: 'What is your favorite programming language?',
        type: 'poll',
        pollOptions: [
          { text: 'JavaScript', votes: 0 },
          { text: 'Python', votes: 0 },
          { text: 'TypeScript', votes: 0 },
          { text: 'Rust', votes: 0 }
        ],
        pollDuration: 7 // days
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(pollPostData)
        .expect(201);

      expect(response.body.post.type).toBe('poll');
      expect(response.body.post.pollOptions).toHaveLength(4);
      expect(response.body.post.pollOptions[0].text).toBe('JavaScript');
    });

    it('should edit posts', async () => {
      const editData = {
        content: 'This is the updated content of the test post with **new** information.',
        tags: ['test', 'updated', 'reddit']
      };

      const response = await request(app.server)
        .patch(`/api/communities/${communityId}/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(editData)
        .expect(200);

      expect(response.body.post.content).toBe(editData.content);
      expect(response.body.post.tags).toEqual(editData.tags);
      expect(response.body.post.edited).toBe(true);
      expect(response.body.post.editedAt).toBeDefined();
    });

    it('should get post details', async () => {
      const response = await request(app.server)
        .get(`/api/communities/${communityId}/posts/${postId}`)
        .expect(200);

      expect(response.body.post).toHaveProperty('id', postId);
      expect(response.body.post).toHaveProperty('title');
      expect(response.body.post).toHaveProperty('author');
      expect(response.body.post).toHaveProperty('votes');
      expect(response.body.post).toHaveProperty('commentCount');
      expect(response.body.post).toHaveProperty('createdAt');
    });

    it('should list community posts with sorting', async () => {
      // Test different sorting methods
      const sortOptions = ['hot', 'new', 'top', 'rising'];
      
      for (const sort of sortOptions) {
        const response = await request(app.server)
          .get(`/api/communities/${communityId}/posts`)
          .query({ sort, limit: 10 })
          .expect(200);

        expect(Array.isArray(response.body.posts)).toBe(true);
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.posts.length).toBeGreaterThan(0);
      }
    });

    it('should delete posts', async () => {
      // Create a post to delete
      const deletePostResponse = await request(app.server)
        .post(`/api/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          title: 'Post to be deleted',
          content: 'This post will be deleted',
          type: 'text'
        });

      const deletePostId = deletePostResponse.body.post.id;

      await request(app.server)
        .delete(`/api/communities/${communityId}/posts/${deletePostId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      // Verify post is deleted
      await request(app.server)
        .get(`/api/communities/${communityId}/posts/${deletePostId}`)
        .expect(404);
    });
  });

  describe('Voting System', () => {
    it('should upvote posts', async () => {
      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/vote`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({ vote: 'up' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.post.votes.upvotes).toBe(1);
      expect(response.body.post.votes.downvotes).toBe(0);
      expect(response.body.post.votes.score).toBe(1);
    });

    it('should downvote posts', async () => {
      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/vote`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ vote: 'down' })
        .expect(200);

      expect(response.body.post.votes.downvotes).toBe(1);
      expect(response.body.post.votes.score).toBe(0); // 1 up - 1 down = 0
    });

    it('should change vote from up to down', async () => {
      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/vote`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({ vote: 'down' })
        .expect(200);

      expect(response.body.post.votes.upvotes).toBe(0);
      expect(response.body.post.votes.downvotes).toBe(2);
      expect(response.body.post.votes.score).toBe(-2);
    });

    it('should remove vote', async () => {
      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/vote`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({ vote: null })
        .expect(200);

      expect(response.body.post.votes.downvotes).toBe(1);
      expect(response.body.post.votes.score).toBe(-1);
    });

    it('should get post voting statistics', async () => {
      const response = await request(app.server)
        .get(`/api/communities/${communityId}/posts/${postId}/votes`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.votes).toHaveProperty('upvotes');
      expect(response.body.votes).toHaveProperty('downvotes');
      expect(response.body.votes).toHaveProperty('score');
      expect(response.body.votes).toHaveProperty('upvotePercentage');
    });
  });

  describe('Comment System', () => {
    it('should create top-level comments', async () => {
      const commentData = {
        content: 'This is a test comment on the post. It has **markdown** support.',
        parentId: null
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send(commentData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.comment).toHaveProperty('id');
      expect(response.body.comment.content).toBe(commentData.content);
      expect(response.body.comment.parentId).toBeNull();
      expect(response.body.comment.depth).toBe(0);

      commentId = response.body.comment.id;
    });

    it('should create nested reply comments', async () => {
      const replyData = {
        content: 'This is a reply to the above comment.',
        parentId: commentId
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(replyData)
        .expect(201);

      expect(response.body.comment.parentId).toBe(commentId);
      expect(response.body.comment.depth).toBe(1);
      expect(response.body.comment.content).toBe(replyData.content);
    });

    it('should edit comments', async () => {
      const editData = {
        content: 'This is the edited version of the comment with **updated** content.'
      };

      const response = await request(app.server)
        .patch(`/api/communities/${communityId}/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send(editData)
        .expect(200);

      expect(response.body.comment.content).toBe(editData.content);
      expect(response.body.comment.edited).toBe(true);
      expect(response.body.comment.editedAt).toBeDefined();
    });

    it('should vote on comments', async () => {
      const upvoteResponse = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ vote: 'up' })
        .expect(200);

      expect(upvoteResponse.body.comment.votes.score).toBe(1);

      const downvoteResponse = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/comments/${commentId}/vote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ vote: 'down' })
        .expect(200);

      expect(downvoteResponse.body.comment.votes.score).toBe(0);
    });

    it('should get comment thread with proper nesting', async () => {
      const response = await request(app.server)
        .get(`/api/communities/${communityId}/posts/${postId}/comments`)
        .query({ sort: 'best' })
        .expect(200);

      expect(Array.isArray(response.body.comments)).toBe(true);
      expect(response.body.comments.length).toBeGreaterThan(0);
      
      // Check comment structure
      const topLevelComment = response.body.comments.find((c: any) => c.id === commentId);
      expect(topLevelComment).toBeDefined();
      expect(topLevelComment.depth).toBe(0);
      expect(Array.isArray(topLevelComment.replies)).toBe(true);
    });

    it('should delete comments', async () => {
      // Create a comment to delete
      const deleteCommentResponse = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({
          content: 'This comment will be deleted',
          parentId: null
        });

      const deleteCommentId = deleteCommentResponse.body.comment.id;

      await request(app.server)
        .delete(`/api/communities/${communityId}/posts/${postId}/comments/${deleteCommentId}`)
        .set('Authorization', `Bearer ${authToken3}`)
        .expect(200);
    });

    it('should collapse heavily downvoted comments', async () => {
      // Create comment and downvote it heavily
      const heavilyDownvotedResponse = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({
          content: 'This comment will be heavily downvoted',
          parentId: null
        });

      const heavilyDownvotedId = heavilyDownvotedResponse.body.comment.id;

      // Simulate multiple downvotes
      await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/comments/${heavilyDownvotedId}/vote`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ vote: 'down' });

      await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/comments/${heavilyDownvotedId}/vote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ vote: 'down' });

      const response = await request(app.server)
        .get(`/api/communities/${communityId}/posts/${postId}/comments`)
        .expect(200);

      const downvotedComment = response.body.comments.find((c: any) => c.id === heavilyDownvotedId);
      expect(downvotedComment.collapsed).toBe(true);
    });
  });

  describe('Awards System', () => {
    it('should list available awards', async () => {
      const response = await request(app.server)
        .get('/api/awards')
        .expect(200);

      expect(Array.isArray(response.body.awards)).toBe(true);
      expect(response.body.awards.length).toBeGreaterThan(0);
      expect(response.body.awards[0]).toHaveProperty('id');
      expect(response.body.awards[0]).toHaveProperty('name');
      expect(response.body.awards[0]).toHaveProperty('cost');
      expect(response.body.awards[0]).toHaveProperty('icon');
    });

    it('should give awards to posts', async () => {
      const awardData = {
        awardId: 'silver', // Assuming 'silver' award exists
        message: 'Great post!'
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/award`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(awardData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.award).toHaveProperty('type', 'silver');
      expect(response.body.award).toHaveProperty('message', awardData.message);
    });

    it('should give awards to comments', async () => {
      const awardData = {
        awardId: 'helpful',
        message: 'Very helpful comment!'
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/comments/${commentId}/award`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(awardData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.award.type).toBe(awardData.awardId);
    });

    it('should get post awards summary', async () => {
      const response = await request(app.server)
        .get(`/api/communities/${communityId}/posts/${postId}/awards`)
        .expect(200);

      expect(Array.isArray(response.body.awards)).toBe(true);
      expect(response.body.awards.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('totalAwards');
      expect(response.body).toHaveProperty('totalValue');
    });
  });

  describe('Karma System', () => {
    it('should calculate user karma from posts and comments', async () => {
      const response = await request(app.server)
        .get(`/api/users/${testUsers.user1.username}/karma`)
        .expect(200);

      expect(response.body.karma).toHaveProperty('postKarma');
      expect(response.body.karma).toHaveProperty('commentKarma');
      expect(response.body.karma).toHaveProperty('totalKarma');
      expect(typeof response.body.karma.totalKarma).toBe('number');
    });

    it('should show karma breakdown by community', async () => {
      const response = await request(app.server)
        .get(`/api/users/${testUsers.user1.username}/karma/breakdown`)
        .expect(200);

      expect(Array.isArray(response.body.breakdown)).toBe(true);
      expect(response.body.breakdown.every((item: any) => 
        item.hasOwnProperty('communityName') && 
        item.hasOwnProperty('karma')
      )).toBe(true);
    });

    it('should update karma when posts/comments are voted', async () => {
      // Get initial karma
      const initialKarma = await request(app.server)
        .get(`/api/users/${testUsers.user1.username}/karma`)
        .expect(200);

      // Upvote user's post
      await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/vote`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({ vote: 'up' });

      // Get updated karma
      const updatedKarma = await request(app.server)
        .get(`/api/users/${testUsers.user1.username}/karma`)
        .expect(200);

      expect(updatedKarma.body.karma.totalKarma).toBeGreaterThan(initialKarma.body.karma.totalKarma);
    });
  });

  describe('Real-time Reddit Events', () => {
    it('should notify users of new posts in subscribed communities', (done) => {
      clientSocket1.emit('subscribe_community', { communityId });

      clientSocket1.on('new_community_post', (data) => {
        expect(data.communityId).toBe(communityId);
        expect(data.post).toHaveProperty('title');
        expect(data.post).toHaveProperty('author');
        done();
      });

      setTimeout(() => {
        request(app.server)
          .post(`/api/communities/${communityId}/posts`)
          .set('Authorization', `Bearer ${authToken2}`)
          .send({
            title: 'Real-time notification test post',
            content: 'This post should trigger real-time notifications',
            type: 'text'
          })
          .end(() => {});
      }, 500);
    }, 10000);

    it('should notify users of replies to their comments', (done) => {
      clientSocket2.on('comment_reply', (data) => {
        expect(data.postId).toBe(postId);
        expect(data.parentCommentId).toBe(commentId);
        expect(data.reply).toHaveProperty('content');
        done();
      });

      setTimeout(() => {
        request(app.server)
          .post(`/api/communities/${communityId}/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            content: 'This is a real-time reply notification test',
            parentId: commentId
          })
          .end(() => {});
      }, 500);
    }, 10000);

    it('should notify users when their posts receive awards', (done) => {
      clientSocket2.on('post_awarded', (data) => {
        expect(data.postId).toBe(postId);
        expect(data.award).toHaveProperty('type');
        expect(data.award).toHaveProperty('giver');
        done();
      });

      setTimeout(() => {
        request(app.server)
          .post(`/api/communities/${communityId}/posts/${postId}/award`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            awardId: 'gold',
            message: 'Excellent post!'
          })
          .end(() => {});
      }, 500);
    }, 10000);
  });

  describe('Moderation Features', () => {
    let reportId: string;

    it('should report posts', async () => {
      const reportData = {
        reason: 'spam',
        description: 'This post appears to be spam content'
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/report`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send(reportData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.report).toHaveProperty('id');
      expect(response.body.report.reason).toBe(reportData.reason);

      reportId = response.body.report.id;
    });

    it('should list community reports for moderators', async () => {
      const response = await request(app.server)
        .get(`/api/communities/${communityId}/reports`)
        .set('Authorization', `Bearer ${authToken1}`) // Community creator/moderator
        .expect(200);

      expect(Array.isArray(response.body.reports)).toBe(true);
      expect(response.body.reports.some((r: any) => r.id === reportId)).toBe(true);
    });

    it('should resolve reports', async () => {
      const response = await request(app.server)
        .patch(`/api/communities/${communityId}/reports/${reportId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          status: 'resolved',
          moderatorNote: 'Reviewed and found not to be spam'
        })
        .expect(200);

      expect(response.body.report.status).toBe('resolved');
      expect(response.body.report.moderatorNote).toBeDefined();
    });

    it('should remove posts as moderator', async () => {
      const response = await request(app.server)
        .post(`/api/communities/${communityId}/posts/${postId}/remove`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          reason: 'Rule violation',
          notifyUser: true
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.post.removed).toBe(true);
      expect(response.body.post.removalReason).toBe('Rule violation');
    });

    it('should ban users from community', async () => {
      const banData = {
        duration: 7, // days
        reason: 'Repeated rule violations',
        note: 'User has been warned multiple times'
      };

      const response = await request(app.server)
        .post(`/api/communities/${communityId}/bans/${testUsers.user2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(banData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.ban.duration).toBe(banData.duration);
      expect(response.body.ban.reason).toBe(banData.reason);
    });

    it('should prevent banned users from posting', async () => {
      await request(app.server)
        .post(`/api/communities/${communityId}/posts`)
        .set('Authorization', `Bearer ${authToken3}`) // Banned user
        .send({
          title: 'This should fail',
          content: 'Banned user trying to post',
          type: 'text'
        })
        .expect(403);
    });
  });

  describe('Search and Discovery', () => {
    it('should search posts within community', async () => {
      const response = await request(app.server)
        .get(`/api/communities/${communityId}/search`)
        .query({
          q: 'test',
          sort: 'relevance',
          time: 'all'
        })
        .expect(200);

      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.every((r: any) => r.type === 'post')).toBe(true);
    });

    it('should search across all communities', async () => {
      const response = await request(app.server)
        .get('/api/search')
        .query({
          q: 'test',
          type: 'posts',
          sort: 'relevance'
        })
        .expect(200);

      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should search for communities', async () => {
      const response = await request(app.server)
        .get('/api/search')
        .query({
          q: 'test',
          type: 'communities'
        })
        .expect(200);

      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.every((r: any) => r.type === 'community')).toBe(true);
    });
  });

  describe('User Profiles and History', () => {
    it('should get user profile with posts and comments', async () => {
      const response = await request(app.server)
        .get(`/api/users/${testUsers.user1.username}/profile`)
        .expect(200);

      expect(response.body.user).toHaveProperty('username', testUsers.user1.username);
      expect(response.body.user).toHaveProperty('karma');
      expect(response.body.user).toHaveProperty('cakeDay');
      expect(Array.isArray(response.body.recentPosts)).toBe(true);
      expect(Array.isArray(response.body.recentComments)).toBe(true);
    });

    it('should get user post history', async () => {
      const response = await request(app.server)
        .get(`/api/users/${testUsers.user1.username}/posts`)
        .query({ limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.every((p: any) => p.author.username === testUsers.user1.username)).toBe(true);
    });

    it('should get user comment history', async () => {
      const response = await request(app.server)
        .get(`/api/users/${testUsers.user1.username}/comments`)
        .query({ limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body.comments)).toBe(true);
      expect(response.body.comments.every((c: any) => c.author.username === testUsers.user1.username)).toBe(true);
    });
  });

  describe('Feed and Recommendations', () => {
    it('should generate personalized home feed', async () => {
      const response = await request(app.server)
        .get('/api/feed/home')
        .set('Authorization', `Bearer ${authToken2}`)
        .query({ limit: 20 })
        .expect(200);

      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.posts.every((p: any) => p.hasOwnProperty('votes'))).toBe(true);
    });

    it('should generate popular feed', async () => {
      const response = await request(app.server)
        .get('/api/feed/popular')
        .query({ time: 'day', limit: 20 })
        .expect(200);

      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.every((p: any) => p.votes.score >= 0)).toBe(true);
    });

    it('should recommend communities', async () => {
      const response = await request(app.server)
        .get('/api/recommendations/communities')
        .set('Authorization', `Bearer ${authToken2}`)
        .query({ limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.recommendations.every((r: any) => r.hasOwnProperty('reason'))).toBe(true);
    });
  });
});