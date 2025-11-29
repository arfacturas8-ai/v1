#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Client as MinioClient } from 'minio';

const prisma = new PrismaClient();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  maxRetriesPerRequest: null
});

const minio = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
});

/**
 * Cleanup expired sessions from database
 */
async function cleanupSessions() {
  console.log('🧹 Cleaning up expired sessions...');
  
  try {
    // Delete sessions older than 30 days
    const result = await prisma.$executeRaw`
      DELETE FROM "Session" 
      WHERE "expiresAt" < NOW() 
      OR "createdAt" < NOW() - INTERVAL '30 days'
    `;
    
    console.log(`✅ Deleted ${result} expired sessions`);
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
  }
}

/**
 * Cleanup orphaned files in MinIO
 */
async function cleanupOrphanedFiles() {
  console.log('🧹 Cleaning up orphaned files...');
  
  try {
    const buckets = ['avatars', 'attachments', 'media'];
    
    for (const bucket of buckets) {
      const stream = minio.listObjects(bucket, '', true);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      stream.on('data', async (obj) => {
        // Check if file is referenced in database
        const isReferenced = await prisma.$queryRaw`
          SELECT EXISTS(
            SELECT 1 FROM "User" WHERE "avatar" LIKE '%' || ${obj.name} || '%'
            UNION
            SELECT 1 FROM "Post" WHERE "thumbnail" LIKE '%' || ${obj.name} || '%'
            UNION
            SELECT 1 FROM "Message" WHERE "attachments"::text LIKE '%' || ${obj.name} || '%'
          )
        `;
        
        // Delete if not referenced and older than 1 week
        if (!isReferenced && obj.lastModified < oneWeekAgo) {
          await minio.removeObject(bucket, obj.name);
          console.log(`  Deleted orphaned file: ${bucket}/${obj.name}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ File cleanup failed:', error);
  }
}

/**
 * Cleanup old Redis keys
 */
async function cleanupRedisKeys() {
  console.log('🧹 Cleaning up Redis keys...');
  
  try {
    // Scan for expired rate limit keys
    const stream = redis.scanStream({
      match: 'rl:*',
      count: 100
    });
    
    let cleaned = 0;
    stream.on('data', async (keys) => {
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl === -1) { // No expiry set
          await redis.expire(key, 3600); // Set 1 hour expiry
          cleaned++;
        }
      }
    });
    
    stream.on('end', () => {
      console.log(`✅ Cleaned ${cleaned} Redis keys`);
    });
  } catch (error) {
    console.error('❌ Redis cleanup failed:', error);
  }
}

/**
 * Cleanup old notifications
 */
async function cleanupNotifications() {
  console.log('🧹 Cleaning up old notifications...');
  
  try {
    // Delete read notifications older than 30 days
    const result = await prisma.$executeRaw`
      DELETE FROM "Notification" 
      WHERE "isRead" = true 
      AND "createdAt" < NOW() - INTERVAL '30 days'
    `;
    
    console.log(`✅ Deleted ${result} old notifications`);
    
    // Delete all notifications older than 90 days
    const result2 = await prisma.$executeRaw`
      DELETE FROM "Notification" 
      WHERE "createdAt" < NOW() - INTERVAL '90 days'
    `;
    
    console.log(`✅ Deleted ${result2} very old notifications`);
  } catch (error) {
    console.error('❌ Notification cleanup failed:', error);
  }
}

/**
 * Update community statistics
 */
async function updateCommunityStats() {
  console.log('📊 Updating community statistics...');
  
  try {
    // Update member counts
    const communities = await prisma.community.findMany();
    
    for (const community of communities) {
      const memberCount = await prisma.communityMember.count({
        where: { communityId: community.id }
      });
      
      await prisma.community.update({
        where: { id: community.id },
        data: { memberCount }
      });
    }
    
    console.log(`✅ Updated stats for ${communities.length} communities`);
  } catch (error) {
    console.error('❌ Stats update failed:', error);
  }
}

/**
 * Main cleanup function
 */
async function runCleanup() {
  console.log('🔧 Starting scheduled cleanup tasks...\n');
  const startTime = Date.now();
  
  try {
    await cleanupSessions();
    await cleanupNotifications();
    await cleanupRedisKeys();
    await updateCommunityStats();
    // await cleanupOrphanedFiles(); // Disabled for now to avoid accidental deletion
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ All cleanup tasks completed in ${duration}s`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runCleanup();
}

export { runCleanup };