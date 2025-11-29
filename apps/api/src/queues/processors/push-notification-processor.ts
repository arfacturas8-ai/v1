import { Job } from 'bullmq';
import webpush from 'web-push';
import { Logger } from 'pino';
import { Redis } from 'ioredis';
import { createGenericPool, Pool } from 'generic-pool';
import axios, { AxiosInstance } from 'axios';

export interface PushNotificationJobData {
  userId: string | string[];
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  ttl?: number;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  topic?: string;
  collapseKey?: string;
  priority?: 'high' | 'normal' | 'low';
  platform?: 'web' | 'ios' | 'android' | 'all';
  segmentation?: {
    countries?: string[];
    languages?: string[];
    timezone?: string;
    deviceTypes?: string[];
  };
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  platform: 'web' | 'ios' | 'android';
  deviceId?: string;
  userAgent?: string;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

export interface PushDeliveryResult {
  successful: number;
  failed: number;
  totalTargeted: number;
  deliveryTime: number;
  errors: Array<{
    subscription: string;
    error: string;
    statusCode?: number;
  }>;
  deliveryStats: {
    web: { sent: number; failed: number };
    ios: { sent: number; failed: number };
    android: { sent: number; failed: number };
  };
}

export interface FCMConfig {
  serverKey: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

export interface APNSConfig {
  teamId: string;
  keyId: string;
  key: string;
  bundleId: string;
  production: boolean;
}

export class PushNotificationProcessor {
  private redis: Redis;
  private logger: Logger;
  private webPushPool: Pool<typeof webpush>;
  private fcmClient?: AxiosInstance;
  private apnsClient?: AxiosInstance;
  
  private metrics = {
    notificationsSent: 0,
    notificationsFailed: 0,
    totalDeliveryTime: 0,
    platformStats: new Map<string, { sent: number; failed: number }>(),
    subscriptionStats: {
      active: 0,
      inactive: 0,
      expired: 0,
    },
  };

  private fcmConfig?: FCMConfig;
  private apnsConfig?: APNSConfig;

  constructor(redis: Redis, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
    this.initializeWebPush();
    this.initializeFCM();
    this.initializeAPNS();
    this.initializeWebPushPool();
  }

  private initializeWebPush(): void {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:noreply@cryb.ai';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
      this.logger.info('Web Push VAPID keys configured');
    } else {
      this.logger.warn('Web Push VAPID keys not configured');
    }
  }

  private initializeFCM(): void {
    const serverKey = process.env.FCM_SERVER_KEY;
    const projectId = process.env.FCM_PROJECT_ID;

    if (serverKey) {
      this.fcmConfig = {
        serverKey,
        projectId,
        clientEmail: process.env.FCM_CLIENT_EMAIL,
        privateKey: process.env.FCM_PRIVATE_KEY,
      };

      this.fcmClient = axios.create({
        baseURL: 'https://fcm.googleapis.com',
        headers: {
          'Authorization': `key=${serverKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      this.logger.info('FCM client configured');
    } else {
      this.logger.warn('FCM server key not configured');
    }
  }

  private initializeAPNS(): void {
    const teamId = process.env.APNS_TEAM_ID;
    const keyId = process.env.APNS_KEY_ID;
    const key = process.env.APNS_KEY;
    const bundleId = process.env.APNS_BUNDLE_ID;

    if (teamId && keyId && key && bundleId) {
      this.apnsConfig = {
        teamId,
        keyId,
        key,
        bundleId,
        production: process.env.NODE_ENV === 'production',
      };

      // Initialize APNS client (simplified - in production use node-apn or similar)
      this.apnsClient = axios.create({
        baseURL: this.apnsConfig.production 
          ? 'https://api.push.apple.com'
          : 'https://api.development.push.apple.com',
        timeout: 30000,
      });

      this.logger.info('APNS client configured');
    } else {
      this.logger.warn('APNS configuration incomplete');
    }
  }

  private initializeWebPushPool(): void {
    this.webPushPool = createGenericPool({
      create: async () => webpush,
      destroy: async () => Promise.resolve(),
      validate: async () => true,
    }, {
      max: 10,
      min: 2,
      acquireTimeoutMillis: 5000,
      idleTimeoutMillis: 300000,
      autostart: true,
    });
  }

  public async processPushNotificationJob(job: Job<PushNotificationJobData>): Promise<PushDeliveryResult> {
    const startTime = Date.now();
    const jobData = job.data;

    try {
      this.logger.info({ jobId: job.id, userId: jobData.userId }, 'Processing push notification job');

      // Get target subscriptions
      const subscriptions = await this.getTargetSubscriptions(jobData);
      
      if (subscriptions.length === 0) {
        this.logger.warn({ jobId: job.id, userId: jobData.userId }, 'No active subscriptions found');
        return this.createEmptyResult(Date.now() - startTime);
      }

      // Filter subscriptions by platform and segmentation
      const filteredSubscriptions = this.filterSubscriptions(subscriptions, jobData);

      // Send notifications by platform
      const results = await Promise.allSettled([
        this.sendWebPushNotifications(filteredSubscriptions.web, jobData),
        this.sendFCMNotifications(filteredSubscriptions.android, jobData),
        this.sendAPNSNotifications(filteredSubscriptions.ios, jobData),
      ]);

      // Aggregate results
      const deliveryResult = this.aggregateResults(results, Date.now() - startTime, filteredSubscriptions);

      // Update metrics
      this.updateMetrics(deliveryResult);

      // Clean up expired subscriptions
      await this.cleanupExpiredSubscriptions(deliveryResult.errors);

      this.logger.info({
        jobId: job.id,
        successful: deliveryResult.successful,
        failed: deliveryResult.failed,
        deliveryTime: deliveryResult.deliveryTime,
      }, 'Push notification job completed');

      return deliveryResult;

    } catch (error) {
      this.metrics.notificationsFailed++;
      this.logger.error({
        error,
        jobId: job.id,
        userId: jobData.userId,
      }, 'Failed to process push notification job');
      throw error;
    }
  }

  private async getTargetSubscriptions(jobData: PushNotificationJobData): Promise<PushSubscription[]> {
    const userIds = Array.isArray(jobData.userId) ? jobData.userId : [jobData.userId];
    const subscriptions: PushSubscription[] = [];

    for (const userId of userIds) {
      const userSubscriptions = await this.redis.smembers(`push:subscriptions:${userId}`);
      
      for (const subscriptionKey of userSubscriptions) {
        const subscriptionData = await this.redis.get(`push:subscription:${subscriptionKey}`);
        if (subscriptionData) {
          const subscription = JSON.parse(subscriptionData) as PushSubscription;
          if (subscription.isActive) {
            subscriptions.push(subscription);
          }
        }
      }
    }

    return subscriptions;
  }

  private filterSubscriptions(
    subscriptions: PushSubscription[],
    jobData: PushNotificationJobData
  ): { web: PushSubscription[]; ios: PushSubscription[]; android: PushSubscription[] } {
    const filtered = {
      web: [] as PushSubscription[],
      ios: [] as PushSubscription[],
      android: [] as PushSubscription[],
    };

    for (const subscription of subscriptions) {
      // Platform filtering
      if (jobData.platform && jobData.platform !== 'all' && subscription.platform !== jobData.platform) {
        continue;
      }

      // Segmentation filtering (simplified)
      if (jobData.segmentation) {
        // Add your segmentation logic here
        // For now, we'll include all subscriptions
      }

      filtered[subscription.platform].push(subscription);
    }

    return filtered;
  }

  private async sendWebPushNotifications(
    subscriptions: PushSubscription[],
    jobData: PushNotificationJobData
  ): Promise<{ successful: number; failed: number; errors: Array<{ subscription: string; error: string }> }> {
    const results = { successful: 0, failed: 0, errors: [] as Array<{ subscription: string; error: string }> };

    if (subscriptions.length === 0) return results;

    const webPush = await this.webPushPool.acquire();

    try {
      const payload = JSON.stringify({
        title: jobData.title,
        body: jobData.body,
        icon: jobData.icon || '/icons/icon-192x192.png',
        badge: jobData.badge || '/icons/badge-72x72.png',
        image: jobData.image,
        url: jobData.url,
        actions: jobData.actions,
        data: {
          ...jobData.data,
          timestamp: Date.now(),
        },
        tag: jobData.tag,
        renotify: jobData.renotify,
        requireInteraction: jobData.requireInteraction,
        silent: jobData.silent,
        vibrate: jobData.vibrate,
      });

      const options = {
        TTL: jobData.ttl || 86400, // 24 hours
        urgency: jobData.urgency || 'normal',
        topic: jobData.topic,
      };

      const promises = subscriptions.map(async (subscription) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys,
            },
            payload,
            options
          );
          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            subscription: subscription.endpoint,
            error: error.message,
          });

          // Mark subscription as inactive if it's expired
          if (error.statusCode === 410 || error.statusCode === 413) {
            await this.markSubscriptionInactive(subscription);
          }
        }
      });

      await Promise.all(promises);

    } finally {
      await this.webPushPool.release(webPush);
    }

    return results;
  }

  private async sendFCMNotifications(
    subscriptions: PushSubscription[],
    jobData: PushNotificationJobData
  ): Promise<{ successful: number; failed: number; errors: Array<{ subscription: string; error: string }> }> {
    const results = { successful: 0, failed: 0, errors: [] as Array<{ subscription: string; error: string }> };

    if (subscriptions.length === 0 || !this.fcmClient) return results;

    try {
      const tokens = subscriptions.map(s => s.endpoint);

      const message = {
        registration_ids: tokens,
        notification: {
          title: jobData.title,
          body: jobData.body,
          icon: jobData.icon,
          image: jobData.image,
          click_action: jobData.url,
        },
        data: {
          ...jobData.data,
          timestamp: Date.now().toString(),
        },
        android: {
          priority: jobData.priority === 'high' ? 'high' : 'normal',
          ttl: `${jobData.ttl || 86400}s`,
          collapse_key: jobData.collapseKey,
          notification: {
            tag: jobData.tag,
            vibrate_timings: jobData.vibrate,
          },
        },
      };

      const response = await this.fcmClient.post('/fcm/send', message);
      const fcmResults = response.data.results || [];

      fcmResults.forEach((result: any, index: number) => {
        if (result.message_id) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            subscription: tokens[index],
            error: result.error || 'Unknown FCM error',
          });

          // Handle registration token errors
          if (result.error === 'NotRegistered' || result.error === 'InvalidRegistration') {
            this.markSubscriptionInactive(subscriptions[index]);
          }
        }
      });

    } catch (error: any) {
      results.failed = subscriptions.length;
      results.errors.push({
        subscription: 'FCM_BATCH',
        error: error.message,
      });
    }

    return results;
  }

  private async sendAPNSNotifications(
    subscriptions: PushSubscription[],
    jobData: PushNotificationJobData
  ): Promise<{ successful: number; failed: number; errors: Array<{ subscription: string; error: string }> }> {
    const results = { successful: 0, failed: 0, errors: [] as Array<{ subscription: string; error: string }> };

    if (subscriptions.length === 0 || !this.apnsClient || !this.apnsConfig) return results;

    try {
      const payload = {
        aps: {
          alert: {
            title: jobData.title,
            body: jobData.body,
          },
          badge: 1,
          sound: 'default',
          'thread-id': jobData.tag,
          'content-available': 1,
          'mutable-content': 1,
        },
        data: {
          ...jobData.data,
          url: jobData.url,
          timestamp: Date.now(),
        },
      };

      const promises = subscriptions.map(async (subscription) => {
        try {
          const deviceToken = subscription.deviceId || subscription.endpoint;
          
          await this.apnsClient!.post(`/3/device/${deviceToken}`, payload, {
            headers: {
              'authorization': `bearer ${this.generateAPNSToken()}`,
              'apns-topic': this.apnsConfig!.bundleId,
              'apns-priority': jobData.priority === 'high' ? '10' : '5',
              'apns-expiration': Math.floor(Date.now() / 1000) + (jobData.ttl || 86400),
            },
          });

          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            subscription: subscription.deviceId || subscription.endpoint,
            error: error.response?.data?.reason || error.message,
          });

          // Handle device token errors
          if (error.response?.status === 410) {
            await this.markSubscriptionInactive(subscription);
          }
        }
      });

      await Promise.all(promises);

    } catch (error: any) {
      results.failed = subscriptions.length;
      results.errors.push({
        subscription: 'APNS_BATCH',
        error: error.message,
      });
    }

    return results;
  }

  private generateAPNSToken(): string {
    // In a real implementation, generate a proper JWT token for APNS
    // This is a placeholder
    return 'apns-jwt-token';
  }

  private aggregateResults(
    results: PromiseSettledResult<any>[],
    deliveryTime: number,
    subscriptions: { web: PushSubscription[]; ios: PushSubscription[]; android: PushSubscription[] }
  ): PushDeliveryResult {
    let successful = 0;
    let failed = 0;
    const errors: Array<{ subscription: string; error: string; statusCode?: number }> = [];
    const deliveryStats = {
      web: { sent: 0, failed: 0 },
      ios: { sent: 0, failed: 0 },
      android: { sent: 0, failed: 0 },
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful += result.value.successful;
        failed += result.value.failed;
        errors.push(...result.value.errors);

        // Update platform stats
        const platform = ['web', 'android', 'ios'][index] as keyof typeof deliveryStats;
        deliveryStats[platform].sent = result.value.successful;
        deliveryStats[platform].failed = result.value.failed;
      } else {
        const platform = ['web', 'android', 'ios'][index] as keyof typeof deliveryStats;
        const platformSubscriptions = subscriptions[platform];
        failed += platformSubscriptions.length;
        deliveryStats[platform].failed = platformSubscriptions.length;
      }
    });

    const totalTargeted = subscriptions.web.length + subscriptions.ios.length + subscriptions.android.length;

    return {
      successful,
      failed,
      totalTargeted,
      deliveryTime,
      errors,
      deliveryStats,
    };
  }

  private createEmptyResult(deliveryTime: number): PushDeliveryResult {
    return {
      successful: 0,
      failed: 0,
      totalTargeted: 0,
      deliveryTime,
      errors: [],
      deliveryStats: {
        web: { sent: 0, failed: 0 },
        ios: { sent: 0, failed: 0 },
        android: { sent: 0, failed: 0 },
      },
    };
  }

  private updateMetrics(result: PushDeliveryResult): void {
    this.metrics.notificationsSent += result.successful;
    this.metrics.notificationsFailed += result.failed;
    this.metrics.totalDeliveryTime += result.deliveryTime;

    // Update platform stats
    Object.entries(result.deliveryStats).forEach(([platform, stats]) => {
      const current = this.metrics.platformStats.get(platform) || { sent: 0, failed: 0 };
      current.sent += stats.sent;
      current.failed += stats.failed;
      this.metrics.platformStats.set(platform, current);
    });
  }

  private async markSubscriptionInactive(subscription: PushSubscription): Promise<void> {
    try {
      subscription.isActive = false;
      const subscriptionKey = this.generateSubscriptionKey(subscription);
      
      await this.redis.set(
        `push:subscription:${subscriptionKey}`,
        JSON.stringify(subscription),
        'EX',
        86400 // Keep for 24 hours for cleanup
      );

      await this.redis.srem(`push:subscriptions:${subscription.userId}`, subscriptionKey);
      
      this.metrics.subscriptionStats.inactive++;
      
      this.logger.info({
        userId: subscription.userId,
        platform: subscription.platform,
        endpoint: subscription.endpoint,
      }, 'Marked subscription as inactive');
    } catch (error) {
      this.logger.error({ error, subscription }, 'Failed to mark subscription as inactive');
    }
  }

  private async cleanupExpiredSubscriptions(errors: Array<{ subscription: string; error: string }>): Promise<void> {
    const expiredEndpoints = errors
      .filter(error => error.error.includes('expired') || error.error.includes('410'))
      .map(error => error.subscription);

    for (const endpoint of expiredEndpoints) {
      try {
        const keys = await this.redis.keys(`push:subscription:*`);
        for (const key of keys) {
          const subscriptionData = await this.redis.get(key);
          if (subscriptionData) {
            const subscription = JSON.parse(subscriptionData) as PushSubscription;
            if (subscription.endpoint === endpoint) {
              await this.redis.del(key);
              await this.redis.srem(`push:subscriptions:${subscription.userId}`, key.split(':')[2]);
              this.metrics.subscriptionStats.expired++;
              break;
            }
          }
        }
      } catch (error) {
        this.logger.error({ error, endpoint }, 'Failed to cleanup expired subscription');
      }
    }
  }

  private generateSubscriptionKey(subscription: PushSubscription): string {
    return `${subscription.userId}:${subscription.platform}:${Buffer.from(subscription.endpoint).toString('base64').substring(0, 10)}`;
  }

  public async addSubscription(subscription: PushSubscription): Promise<void> {
    const subscriptionKey = this.generateSubscriptionKey(subscription);
    
    await this.redis.set(
      `push:subscription:${subscriptionKey}`,
      JSON.stringify(subscription),
      'EX',
      2592000 // 30 days
    );

    await this.redis.sadd(`push:subscriptions:${subscription.userId}`, subscriptionKey);
    
    this.metrics.subscriptionStats.active++;
    
    this.logger.info({
      userId: subscription.userId,
      platform: subscription.platform,
    }, 'Push subscription added');
  }

  public async removeSubscription(userId: string, endpoint: string): Promise<void> {
    const userSubscriptions = await this.redis.smembers(`push:subscriptions:${userId}`);
    
    for (const subscriptionKey of userSubscriptions) {
      const subscriptionData = await this.redis.get(`push:subscription:${subscriptionKey}`);
      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData) as PushSubscription;
        if (subscription.endpoint === endpoint) {
          await this.redis.del(`push:subscription:${subscriptionKey}`);
          await this.redis.srem(`push:subscriptions:${userId}`, subscriptionKey);
          this.metrics.subscriptionStats.active--;
          break;
        }
      }
    }
  }

  public getMetrics(): any {
    return {
      ...this.metrics,
      averageDeliveryTime: this.metrics.notificationsSent > 0 
        ? this.metrics.totalDeliveryTime / this.metrics.notificationsSent 
        : 0,
      successRate: this.metrics.notificationsSent + this.metrics.notificationsFailed > 0
        ? (this.metrics.notificationsSent / (this.metrics.notificationsSent + this.metrics.notificationsFailed)) * 100
        : 100,
      platformStats: Object.fromEntries(this.metrics.platformStats),
    };
  }
}

export default PushNotificationProcessor;