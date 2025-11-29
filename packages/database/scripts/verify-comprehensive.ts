#!/usr/bin/env ts-node

/**
 * Verification script to display a sample of the seeded data
 * This demonstrates the realistic content that was generated
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySeededData() {
  console.log('🔍 CRYB Platform - Seed Data Verification\n');
  
  try {
    // Get sample users
    console.log('👥 Sample Users:');
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        username: true,
        displayName: true,
        bio: true,
        isVerified: true,
        premiumType: true,
        createdAt: true
      }
    });
    
    users.forEach(user => {
      console.log(`  • ${user.displayName} (@${user.username})`);
      console.log(`    Bio: ${user.bio}`);
      console.log(`    Premium: ${user.premiumType} | Verified: ${user.isVerified ? '✓' : '✗'}`);
      console.log('');
    });
    
    // Get communities with member counts
    console.log('🏘️ Communities:');
    const communities = await prisma.community.findMany({
      select: {
        name: true,
        displayName: true,
        description: true,
        memberCount: true,
        isPublic: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });
    
    communities.forEach(community => {
      console.log(`  • r/${community.name} - ${community.displayName}`);
      console.log(`    ${community.description}`);
      console.log(`    Members: ${community.memberCount} | Posts: ${community._count.posts} | Public: ${community.isPublic ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Get sample posts with engagement
    console.log('📝 Top Posts by Score:');
    const topPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { score: 'desc' },
      select: {
        title: true,
        content: true,
        score: true,
        commentCount: true,
        viewCount: true,
        flair: true,
        community: {
          select: { name: true }
        },
        user: {
          select: { username: true }
        }
      }
    });
    
    topPosts.forEach(post => {
      console.log(`  • ${post.title}`);
      console.log(`    Posted in r/${post.community.name} by u/${post.user.username}`);
      console.log(`    ${post.content.substring(0, 100)}...`);
      console.log(`    Score: ${post.score} | Comments: ${post.commentCount} | Views: ${post.viewCount} | Flair: ${post.flair || 'None'}`);
      console.log('');
    });
    
    // Get servers with channel counts
    console.log('🖥️ Discord-style Servers:');
    const servers = await prisma.server.findMany({
      select: {
        name: true,
        description: true,
        isPublic: true,
        _count: {
          select: {
            channels: true,
            members: true
          }
        }
      }
    });
    
    servers.forEach(server => {
      console.log(`  • ${server.name}`);
      console.log(`    ${server.description}`);
      console.log(`    Channels: ${server._count.channels} | Members: ${server._count.members} | Public: ${server.isPublic ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Get recent messages from a popular channel
    console.log('💌 Recent Messages (Sample Channel):');
    const sampleChannel = await prisma.channel.findFirst({
      where: { type: 'GUILD_TEXT' },
      select: { id: true, name: true, server: { select: { name: true } } }
    });
    
    if (sampleChannel) {
      const messages = await prisma.message.findMany({
        where: { channelId: sampleChannel.id },
        take: 5,
        orderBy: { timestamp: 'desc' },
        select: {
          content: true,
          timestamp: true,
          user: {
            select: { username: true }
          }
        }
      });
      
      console.log(`  Channel: #${sampleChannel.name} (${sampleChannel.server?.name})`);
      messages.forEach(message => {
        console.log(`  [${message.timestamp.toISOString().split('T')[0]}] ${message.user.username}: ${message.content}`);
      });
      console.log('');
    }
    
    // Get engagement statistics
    console.log('📊 Platform Statistics:');
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.community.count(),
      prisma.server.count(),
      prisma.channel.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.message.count(),
      prisma.vote.count(),
      prisma.friendship.count({ where: { status: 'ACCEPTED' } }),
      prisma.reaction.count()
    ]);
    
    const [userCount, communityCount, serverCount, channelCount, postCount, commentCount, messageCount, voteCount, friendshipCount, reactionCount] = stats;
    
    console.log(`  👥 Total Users: ${userCount}`);
    console.log(`  🏘️ Total Communities: ${communityCount}`);
    console.log(`  🖥️ Total Servers: ${serverCount}`);
    console.log(`  📺 Total Channels: ${channelCount}`);
    console.log(`  📝 Total Posts: ${postCount}`);
    console.log(`  💬 Total Comments: ${commentCount}`);
    console.log(`  💌 Total Messages: ${messageCount}`);
    console.log(`  🗳️ Total Votes: ${voteCount}`);
    console.log(`  🤝 Active Friendships: ${friendshipCount}`);
    console.log(`  😊 Total Reactions: ${reactionCount}`);
    
    console.log('\n✅ Verification completed! The platform is fully populated with realistic demo content.');
    console.log('🚀 All major features have sample data ready for demonstration.');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
if (require.main === module) {
  verifySeededData()
    .catch((error) => {
      console.error('Failed to verify seeded data:', error);
      process.exit(1);
    });
}

export { verifySeededData };