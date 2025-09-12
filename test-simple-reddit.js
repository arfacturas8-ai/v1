#!/usr/bin/env node
const { prisma } = require('./packages/database');

async function testSimpleRedditFunctionality() {
  console.log('🔍 Testing Simple Reddit Functionality');
  console.log('====================================');

  try {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        displayName: 'Test User',
        passwordHash: 'dummy_hash_for_testing',
      },
    });
    console.log('✅ Created test user:', testUser.username);

    // Create a test community
    const testCommunity = await prisma.community.create({
      data: {
        name: `testcom${Date.now()}`,
        displayName: 'Test Community',
        description: 'A test community for Reddit features',
        isPublic: true,
        memberCount: 1,
        members: {
          create: {
            userId: testUser.id,
          },
        },
        moderators: {
          create: {
            userId: testUser.id,
            permissions: { all: true },
          },
        },
      },
    });
    console.log('✅ Created test community:', testCommunity.name);

    // Create a test post
    const testPost = await prisma.post.create({
      data: {
        communityId: testCommunity.id,
        userId: testUser.id,
        title: 'Test Post for Reddit Features',
        content: 'This is a test post to verify Reddit functionality',
      },
    });
    console.log('✅ Created test post:', testPost.title);

    // Create a test comment
    const testComment = await prisma.comment.create({
      data: {
        postId: testPost.id,
        userId: testUser.id,
        content: 'This is a test comment on the post',
      },
    });
    console.log('✅ Created test comment');

    // Test voting on post
    const postVote = await prisma.vote.create({
      data: {
        userId: testUser.id,
        postId: testPost.id,
        value: 1, // Upvote
      },
    });
    console.log('✅ Created post vote');

    // Test voting on comment
    const commentVote = await prisma.vote.create({
      data: {
        userId: testUser.id,
        commentId: testComment.id,
        value: 1, // Upvote
      },
    });
    console.log('✅ Created comment vote');

    // Test award system
    const testAward = await prisma.award.create({
      data: {
        postId: testPost.id,
        type: 'silver',
        cost: 100,
        message: 'Great post!',
        giverId: testUser.id,
        receiverId: testUser.id,
      },
    });
    console.log('✅ Created test award');

    // Verify data retrieval
    const retrievedPost = await prisma.post.findUnique({
      where: { id: testPost.id },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
        community: {
          select: {
            name: true,
            displayName: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        votes: true,
        awards: true,
        _count: {
          select: { comments: true, votes: true, awards: true },
        },
      },
    });

    console.log('✅ Retrieved post with relations:');
    console.log('  - User:', retrievedPost?.user?.username);
    console.log('  - Community:', retrievedPost?.community?.name);
    console.log('  - Comments count:', retrievedPost?._count?.comments);
    console.log('  - Votes count:', retrievedPost?._count?.votes);
    console.log('  - Awards count:', retrievedPost?._count?.awards);

    // Test karma calculation
    const userKarma = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: testCommunity.id,
          userId: testUser.id,
        },
      },
    });
    console.log('✅ User karma in community:', userKarma?.karma || 0);

    // Cleanup test data
    await prisma.award.delete({ where: { id: testAward.id } });
    await prisma.vote.delete({ where: { id: commentVote.id } });
    await prisma.vote.delete({ where: { id: postVote.id } });
    await prisma.comment.delete({ where: { id: testComment.id } });
    await prisma.post.delete({ where: { id: testPost.id } });
    await prisma.moderator.deleteMany({ where: { communityId: testCommunity.id } });
    await prisma.communityMember.deleteMany({ where: { communityId: testCommunity.id } });
    await prisma.community.delete({ where: { id: testCommunity.id } });
    await prisma.user.delete({ where: { id: testUser.id } });

    console.log('✅ Cleanup completed');
    console.log('\n🎉 All Reddit functionality tests passed!');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleRedditFunctionality().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});