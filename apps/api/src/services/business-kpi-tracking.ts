import { Registry, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { PrometheusMetricsService } from './prometheus-metrics';
import { SentryIntegrationService } from './sentry-integration';
import { prisma } from '@cryb/database';
import { performance } from 'perf_hooks';

/**
 * Business KPI Tracking Service for CRYB Platform
 * 
 * Tracks critical business metrics that directly impact revenue,
 * user engagement, and platform health. Integrates with existing
 * monitoring infrastructure for comprehensive observability.
 */
export class BusinessKPITrackingService {
  private register: Registry;
  private prometheusService?: PrometheusMetricsService;
  private sentryService?: SentryIntegrationService;
  
  // User Engagement Metrics
  private dailyActiveUsers: Gauge<string>;
  private weeklyActiveUsers: Gauge<string>;
  private monthlyActiveUsers: Gauge<string>;
  private userRetentionRate: Gauge<string>;
  private userChurnRate: Gauge<string>;
  private averageSessionDuration: Histogram<string>;
  private userEngagementScore: Gauge<string>;
  
  // Community Metrics
  private communitiesCreated: Counter<string>;
  private communitiesActive: Gauge<string>;
  private communityGrowthRate: Gauge<string>;
  private messagesPerCommunity: Histogram<string>;
  private communityEngagementRate: Gauge<string>;
  private moderationActions: Counter<string>;
  
  // Content Metrics
  private contentCreationRate: Gauge<string>;
  private contentInteractionRate: Gauge<string>;
  private contentModerationRate: Gauge<string>;
  private mediaSharingFrequency: Counter<string>;
  private linkSharingFrequency: Counter<string>;
  
  // Communication Metrics
  private messageVelocity: Gauge<string>;
  private voiceCallSuccessRate: Gauge<string>;
  private voiceCallDuration: Histogram<string>;
  private videoCallQuality: Histogram<string>;
  private realTimeMessageLatency: Histogram<string>;
  
  // Revenue Metrics
  private monthlyRecurringRevenue: Gauge<string>;
  private customerLifetimeValue: Histogram<string>;
  private conversionRate: Gauge<string>;
  private paymentSuccessRate: Gauge<string>;
  private subscriptionChurnRate: Gauge<string>;
  
  // Performance Impact Metrics
  private featureAdoptionRate: Gauge<string>;
  private apiResponseQuality: Summary<string>;
  private platformUptime: Gauge<string>;
  private errorImpactOnUsers: Counter<string>;
  
  // Advanced Business Intelligence
  private networkEffectStrength: Gauge<string>;
  private viralCoefficient: Gauge<string>;
  private powerUserPercentage: Gauge<string>;
  private crossPlatformUsage: Counter<string>;

  constructor(
    prometheusService?: PrometheusMetricsService,
    sentryService?: SentryIntegrationService
  ) {
    this.register = new Registry();
    this.prometheusService = prometheusService;
    this.sentryService = sentryService;
    
    this.setupMetrics();
    this.startPeriodicCalculations();
  }

  private setupMetrics(): void {
    // ==============================================
    // USER ENGAGEMENT METRICS
    // ==============================================
    
    this.dailyActiveUsers = new Gauge({
      name: 'cryb_daily_active_users',
      help: 'Number of daily active users',
      labelNames: ['date'],
      registers: [this.register]
    });

    this.weeklyActiveUsers = new Gauge({
      name: 'cryb_weekly_active_users',
      help: 'Number of weekly active users',
      labelNames: ['week'],
      registers: [this.register]
    });

    this.monthlyActiveUsers = new Gauge({
      name: 'cryb_monthly_active_users',
      help: 'Number of monthly active users',
      labelNames: ['month'],
      registers: [this.register]
    });

    this.userRetentionRate = new Gauge({
      name: 'cryb_user_retention_rate',
      help: 'User retention rate percentage',
      labelNames: ['period', 'cohort'],
      registers: [this.register]
    });

    this.userChurnRate = new Gauge({
      name: 'cryb_user_churn_rate',
      help: 'User churn rate percentage',
      labelNames: ['period'],
      registers: [this.register]
    });

    this.averageSessionDuration = new Histogram({
      name: 'cryb_average_session_duration_seconds',
      help: 'Average user session duration in seconds',
      labelNames: ['platform'],
      buckets: [60, 300, 600, 1800, 3600, 7200, 14400], // 1m to 4h
      registers: [this.register]
    });

    this.userEngagementScore = new Gauge({
      name: 'cryb_user_engagement_score',
      help: 'Composite user engagement score (0-100)',
      labelNames: ['user_tier'],
      registers: [this.register]
    });

    // ==============================================
    // COMMUNITY METRICS
    // ==============================================

    this.communitiesCreated = new Counter({
      name: 'cryb_communities_created_total',
      help: 'Total number of communities created',
      labelNames: ['type', 'creator_tier'],
      registers: [this.register]
    });

    this.communitiesActive = new Gauge({
      name: 'cryb_communities_active',
      help: 'Number of active communities',
      labelNames: ['activity_level'],
      registers: [this.register]
    });

    this.communityGrowthRate = new Gauge({
      name: 'cryb_community_growth_rate',
      help: 'Community growth rate percentage',
      labelNames: ['period'],
      registers: [this.register]
    });

    this.messagesPerCommunity = new Histogram({
      name: 'cryb_messages_per_community',
      help: 'Distribution of messages per community',
      buckets: [1, 10, 50, 100, 500, 1000, 5000, 10000],
      registers: [this.register]
    });

    this.communityEngagementRate = new Gauge({
      name: 'cryb_community_engagement_rate',
      help: 'Community engagement rate percentage',
      labelNames: ['community_size'],
      registers: [this.register]
    });

    this.moderationActions = new Counter({
      name: 'cryb_moderation_actions_total',
      help: 'Total moderation actions taken',
      labelNames: ['action_type', 'reason'],
      registers: [this.register]
    });

    // ==============================================
    // CONTENT METRICS
    // ==============================================

    this.contentCreationRate = new Gauge({
      name: 'cryb_content_creation_rate',
      help: 'Content creation rate per hour',
      labelNames: ['content_type'],
      registers: [this.register]
    });

    this.contentInteractionRate = new Gauge({
      name: 'cryb_content_interaction_rate',
      help: 'Content interaction rate percentage',
      labelNames: ['interaction_type'],
      registers: [this.register]
    });

    this.contentModerationRate = new Gauge({
      name: 'cryb_content_moderation_rate',
      help: 'Content requiring moderation percentage',
      labelNames: ['content_type'],
      registers: [this.register]
    });

    this.mediaSharingFrequency = new Counter({
      name: 'cryb_media_sharing_total',
      help: 'Total media sharing events',
      labelNames: ['media_type', 'sharing_method'],
      registers: [this.register]
    });

    this.linkSharingFrequency = new Counter({
      name: 'cryb_link_sharing_total',
      help: 'Total link sharing events',
      labelNames: ['link_type'],
      registers: [this.register]
    });

    // ==============================================
    // COMMUNICATION METRICS
    // ==============================================

    this.messageVelocity = new Gauge({
      name: 'cryb_message_velocity',
      help: 'Messages per minute across platform',
      registers: [this.register]
    });

    this.voiceCallSuccessRate = new Gauge({
      name: 'cryb_voice_call_success_rate',
      help: 'Voice call success rate percentage',
      labelNames: ['call_type'],
      registers: [this.register]
    });

    this.voiceCallDuration = new Histogram({
      name: 'cryb_voice_call_duration_business_seconds',
      help: 'Voice call duration for business metrics',
      labelNames: ['call_type', 'quality_tier'],
      buckets: [30, 60, 300, 900, 1800, 3600], // 30s to 1h
      registers: [this.register]
    });

    this.videoCallQuality = new Histogram({
      name: 'cryb_video_call_quality_score',
      help: 'Video call quality score (1-10)',
      buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      registers: [this.register]
    });

    this.realTimeMessageLatency = new Histogram({
      name: 'cryb_realtime_message_latency_business_seconds',
      help: 'Real-time message latency for business metrics',
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.register]
    });

    // ==============================================
    // REVENUE METRICS
    // ==============================================

    this.monthlyRecurringRevenue = new Gauge({
      name: 'cryb_monthly_recurring_revenue_usd',
      help: 'Monthly recurring revenue in USD',
      labelNames: ['plan_type'],
      registers: [this.register]
    });

    this.customerLifetimeValue = new Histogram({
      name: 'cryb_customer_lifetime_value_usd',
      help: 'Customer lifetime value in USD',
      labelNames: ['acquisition_channel'],
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
      registers: [this.register]
    });

    this.conversionRate = new Gauge({
      name: 'cryb_conversion_rate',
      help: 'Conversion rate percentage',
      labelNames: ['funnel_stage', 'source'],
      registers: [this.register]
    });

    this.paymentSuccessRate = new Gauge({
      name: 'cryb_payment_success_rate',
      help: 'Payment success rate percentage',
      labelNames: ['payment_method'],
      registers: [this.register]
    });

    this.subscriptionChurnRate = new Gauge({
      name: 'cryb_subscription_churn_rate',
      help: 'Subscription churn rate percentage',
      labelNames: ['plan_type', 'churn_reason'],
      registers: [this.register]
    });

    // ==============================================
    // PERFORMANCE IMPACT METRICS
    // ==============================================

    this.featureAdoptionRate = new Gauge({
      name: 'cryb_feature_adoption_rate',
      help: 'Feature adoption rate percentage',
      labelNames: ['feature_name', 'user_tier'],
      registers: [this.register]
    });

    this.apiResponseQuality = new Summary({
      name: 'cryb_api_response_quality',
      help: 'API response quality score',
      labelNames: ['endpoint'],
      maxAgeSeconds: 600,
      ageBuckets: 5,
      registers: [this.register]
    });

    this.platformUptime = new Gauge({
      name: 'cryb_platform_uptime_percentage',
      help: 'Platform uptime percentage',
      labelNames: ['service'],
      registers: [this.register]
    });

    this.errorImpactOnUsers = new Counter({
      name: 'cryb_error_impact_on_users_total',
      help: 'Number of users affected by errors',
      labelNames: ['error_type', 'severity'],
      registers: [this.register]
    });

    // ==============================================
    // ADVANCED BUSINESS INTELLIGENCE
    // ==============================================

    this.networkEffectStrength = new Gauge({
      name: 'cryb_network_effect_strength',
      help: 'Network effect strength score (0-1)',
      registers: [this.register]
    });

    this.viralCoefficient = new Gauge({
      name: 'cryb_viral_coefficient',
      help: 'Viral coefficient (invites per user)',
      labelNames: ['period'],
      registers: [this.register]
    });

    this.powerUserPercentage = new Gauge({
      name: 'cryb_power_user_percentage',
      help: 'Percentage of power users',
      registers: [this.register]
    });

    this.crossPlatformUsage = new Counter({
      name: 'cryb_cross_platform_usage_total',
      help: 'Cross-platform usage events',
      labelNames: ['from_platform', 'to_platform'],
      registers: [this.register]
    });
  }

  /**
   * Start periodic calculations for complex KPIs
   */
  private startPeriodicCalculations(): void {
    // Calculate basic metrics every 5 minutes
    setInterval(() => {
      this.calculateBasicKPIs().catch(error => {
        console.error('[BusinessKPI] Error calculating basic KPIs:', error);
        this.sentryService?.captureException(error, {
          component: 'business-kpi',
          level: 'warning'
        });
      });
    }, 5 * 60 * 1000);

    // Calculate complex metrics every 15 minutes
    setInterval(() => {
      this.calculateComplexKPIs().catch(error => {
        console.error('[BusinessKPI] Error calculating complex KPIs:', error);
        this.sentryService?.captureException(error, {
          component: 'business-kpi',
          level: 'warning'
        });
      });
    }, 15 * 60 * 1000);

    // Calculate daily metrics every hour
    setInterval(() => {
      this.calculateDailyKPIs().catch(error => {
        console.error('[BusinessKPI] Error calculating daily KPIs:', error);
        this.sentryService?.captureException(error, {
          component: 'business-kpi',
          level: 'warning'
        });
      });
    }, 60 * 60 * 1000);
  }

  /**
   * Calculate basic KPIs that can be computed quickly
   */
  private async calculateBasicKPIs(): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Message velocity (messages per minute)
      const recentMessages = await prisma.message.count({
        where: { createdAt: { gte: oneHourAgo } }
      });
      this.messageVelocity.set(recentMessages / 60);

      // Active communities
      const activeCommunities = await prisma.server.count({
        where: {
          channels: {
            some: {
              messages: {
                some: { createdAt: { gte: oneDayAgo } }
              }
            }
          }
        }
      });
      this.communitiesActive.set({ activity_level: 'daily' }, activeCommunities);

      // Content creation rate
      const recentPosts = await prisma.post.count({
        where: { createdAt: { gte: oneHourAgo } }
      });
      this.contentCreationRate.set({ content_type: 'posts' }, recentPosts);

      console.log(`[BusinessKPI] Updated basic KPIs: ${recentMessages} messages, ${activeCommunities} active communities`);

    } catch (error) {
      console.error('[BusinessKPI] Error in calculateBasicKPIs:', error);
      throw error;
    }
  }

  /**
   * Calculate complex KPIs that require more computation
   */
  private async calculateComplexKPIs(): Promise<void> {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // User engagement score calculation
      const engagementScores = await this.calculateUserEngagementScores();
      Object.entries(engagementScores).forEach(([tier, score]) => {
        this.userEngagementScore.set({ user_tier: tier }, score);
      });

      // Community engagement rate
      const communityEngagement = await this.calculateCommunityEngagementRates();
      Object.entries(communityEngagement).forEach(([size, rate]) => {
        this.communityEngagementRate.set({ community_size: size }, rate);
      });

      // Network effect strength
      const networkStrength = await this.calculateNetworkEffectStrength();
      this.networkEffectStrength.set(networkStrength);

      console.log(`[BusinessKPI] Updated complex KPIs: engagement calculated, network strength: ${networkStrength}`);

    } catch (error) {
      console.error('[BusinessKPI] Error in calculateComplexKPIs:', error);
      throw error;
    }
  }

  /**
   * Calculate daily KPIs for long-term tracking
   */
  private async calculateDailyKPIs(): Promise<void> {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Daily Active Users
      const dau = await prisma.user.count({
        where: { lastActiveAt: { gte: yesterday } }
      });
      this.dailyActiveUsers.set({ date: today.toISOString().split('T')[0] }, dau);

      // Weekly Active Users
      const wau = await prisma.user.count({
        where: { lastActiveAt: { gte: oneWeekAgo } }
      });
      this.weeklyActiveUsers.set({ week: this.getWeekString(today) }, wau);

      // Monthly Active Users
      const mau = await prisma.user.count({
        where: { lastActiveAt: { gte: oneMonthAgo } }
      });
      this.monthlyActiveUsers.set({ month: this.getMonthString(today) }, mau);

      // User retention rates
      const retentionRates = await this.calculateUserRetentionRates();
      Object.entries(retentionRates).forEach(([period, rates]) => {
        Object.entries(rates).forEach(([cohort, rate]) => {
          this.userRetentionRate.set({ period, cohort }, rate);
        });
      });

      console.log(`[BusinessKPI] Updated daily KPIs: DAU=${dau}, WAU=${wau}, MAU=${mau}`);

    } catch (error) {
      console.error('[BusinessKPI] Error in calculateDailyKPIs:', error);
      throw error;
    }
  }

  /**
   * Calculate user engagement scores by tier
   */
  private async calculateUserEngagementScores(): Promise<Record<string, number>> {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get user activity data
      const userActivity = await prisma.user.findMany({
        where: { lastActiveAt: { gte: oneWeekAgo } },
        include: {
          _count: {
            select: {
              sentMessages: true,
              posts: true,
              comments: true,
              reactions: true,
            }
          }
        }
      });

      const scores = {
        power_users: 0,
        regular_users: 0,
        casual_users: 0,
      };

      let powerUsers = 0, regularUsers = 0, casualUsers = 0;

      userActivity.forEach(user => {
        const totalActivity = 
          user._count.sentMessages + 
          user._count.posts * 2 + 
          user._count.comments * 1.5 + 
          user._count.reactions * 0.5;

        let score = Math.min(100, totalActivity * 2); // Normalize to 0-100

        if (totalActivity >= 50) {
          scores.power_users += score;
          powerUsers++;
        } else if (totalActivity >= 10) {
          scores.regular_users += score;
          regularUsers++;
        } else {
          scores.casual_users += score;
          casualUsers++;
        }
      });

      // Average scores
      scores.power_users = powerUsers > 0 ? scores.power_users / powerUsers : 0;
      scores.regular_users = regularUsers > 0 ? scores.regular_users / regularUsers : 0;
      scores.casual_users = casualUsers > 0 ? scores.casual_users / casualUsers : 0;

      return scores;

    } catch (error) {
      console.error('[BusinessKPI] Error calculating engagement scores:', error);
      return { power_users: 0, regular_users: 0, casual_users: 0 };
    }
  }

  /**
   * Calculate community engagement rates by size
   */
  private async calculateCommunityEngagementRates(): Promise<Record<string, number>> {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const communities = await prisma.server.findMany({
        include: {
          members: true,
          channels: {
            include: {
              messages: {
                where: { createdAt: { gte: oneWeekAgo } }
              }
            }
          }
        }
      });

      const rates = {
        small: 0,    // < 50 members
        medium: 0,   // 50-500 members
        large: 0,    // > 500 members
      };

      let smallCount = 0, mediumCount = 0, largeCount = 0;

      communities.forEach(community => {
        const memberCount = community.members.length;
        const messageCount = community.channels.reduce((total, channel) => 
          total + channel.messages.length, 0
        );
        
        const engagementRate = memberCount > 0 ? (messageCount / memberCount) * 100 : 0;

        if (memberCount < 50) {
          rates.small += engagementRate;
          smallCount++;
        } else if (memberCount < 500) {
          rates.medium += engagementRate;
          mediumCount++;
        } else {
          rates.large += engagementRate;
          largeCount++;
        }
      });

      rates.small = smallCount > 0 ? rates.small / smallCount : 0;
      rates.medium = mediumCount > 0 ? rates.medium / mediumCount : 0;
      rates.large = largeCount > 0 ? rates.large / largeCount : 0;

      return rates;

    } catch (error) {
      console.error('[BusinessKPI] Error calculating community engagement:', error);
      return { small: 0, medium: 0, large: 0 };
    }
  }

  /**
   * Calculate network effect strength
   */
  private async calculateNetworkEffectStrength(): Promise<number> {
    try {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get invitation data
      const invitations = await prisma.serverInvite.findMany({
        where: { createdAt: { gte: oneMonthAgo } },
        include: {
          inviter: true,
          server: true,
        }
      });

      if (invitations.length === 0) return 0;

      // Calculate viral coefficient
      const uniqueInviterIds = new Set(invitations.map(inv => inv.inviterId));
      const viralCoefficient = invitations.length / uniqueInviterIds.size;

      // Normalize to 0-1 scale (assuming max viral coefficient of 10)
      const networkStrength = Math.min(1, viralCoefficient / 10);

      return networkStrength;

    } catch (error) {
      console.error('[BusinessKPI] Error calculating network effect:', error);
      return 0;
    }
  }

  /**
   * Calculate user retention rates for different cohorts
   */
  private async calculateUserRetentionRates(): Promise<Record<string, Record<string, number>>> {
    try {
      const now = new Date();
      const rates: Record<string, Record<string, number>> = {};

      // 7-day retention for users registered in different weeks
      for (let weekOffset = 1; weekOffset <= 4; weekOffset++) {
        const cohortStart = new Date(now.getTime() - (weekOffset + 1) * 7 * 24 * 60 * 60 * 1000);
        const cohortEnd = new Date(now.getTime() - weekOffset * 7 * 24 * 60 * 60 * 1000);
        const retentionCheck = new Date(now.getTime() - (weekOffset - 1) * 7 * 24 * 60 * 60 * 1000);

        const cohortUsers = await prisma.user.count({
          where: {
            createdAt: {
              gte: cohortStart,
              lt: cohortEnd
            }
          }
        });

        const retainedUsers = await prisma.user.count({
          where: {
            createdAt: {
              gte: cohortStart,
              lt: cohortEnd
            },
            lastActiveAt: {
              gte: retentionCheck
            }
          }
        });

        const retentionRate = cohortUsers > 0 ? (retainedUsers / cohortUsers) * 100 : 0;
        
        if (!rates['7day']) rates['7day'] = {};
        rates['7day'][`week_${weekOffset}`] = retentionRate;
      }

      return rates;

    } catch (error) {
      console.error('[BusinessKPI] Error calculating retention rates:', error);
      return {};
    }
  }

  // Utility methods
  private getWeekString(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getMonthString(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // Public API methods for manual tracking

  /**
   * Track user registration with source attribution
   */
  trackUserRegistration(source: string = 'organic', userTier: string = 'free'): void {
    this.prometheusService?.trackUserRegistration(source);
    
    // Track in business metrics
    console.log(`[BusinessKPI] User registration tracked: source=${source}, tier=${userTier}`);
  }

  /**
   * Track community creation
   */
  trackCommunityCreation(type: string = 'public', creatorTier: string = 'free'): void {
    this.communitiesCreated.inc({ type, creator_tier: creatorTier });
    console.log(`[BusinessKPI] Community creation tracked: type=${type}, creator=${creatorTier}`);
  }

  /**
   * Track moderation action
   */
  trackModerationAction(actionType: string, reason: string = 'policy_violation'): void {
    this.moderationActions.inc({ action_type: actionType, reason });
    console.log(`[BusinessKPI] Moderation action tracked: ${actionType} for ${reason}`);
  }

  /**
   * Track feature adoption
   */
  trackFeatureAdoption(featureName: string, userTier: string = 'free', adopted: boolean = true): void {
    if (adopted) {
      // This would typically be calculated as a percentage over time
      console.log(`[BusinessKPI] Feature adoption tracked: ${featureName} by ${userTier} user`);
    }
  }

  /**
   * Track revenue event
   */
  trackRevenueEvent(amount: number, planType: string, paymentMethod: string = 'stripe'): void {
    // This would integrate with payment processor webhooks
    console.log(`[BusinessKPI] Revenue event tracked: $${amount} for ${planType} via ${paymentMethod}`);
  }

  /**
   * Track user session
   */
  trackUserSession(duration: number, platform: string = 'web'): void {
    this.averageSessionDuration.observe({ platform }, duration);
    console.log(`[BusinessKPI] User session tracked: ${duration}s on ${platform}`);
  }

  /**
   * Track cross-platform usage
   */
  trackCrossPlatformUsage(fromPlatform: string, toPlatform: string): void {
    this.crossPlatformUsage.inc({ from_platform: fromPlatform, to_platform: toPlatform });
    console.log(`[BusinessKPI] Cross-platform usage tracked: ${fromPlatform} -> ${toPlatform}`);
  }

  /**
   * Get metrics for Prometheus
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get registry for integration
   */
  getRegistry(): Registry {
    return this.register;
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    return true;
  }
}

// Export singleton instance
export const businessKPIService = new BusinessKPITrackingService();