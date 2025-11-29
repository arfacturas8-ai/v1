/**
 * CRYB Platform - Recommendation Engine
 * Advanced content and user recommendations with machine learning
 */

import { Pool } from 'pg';
import { elasticsearchClient } from '../elasticsearch/client';
import { timescaleClient } from '../analytics/timescale-client';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface RecommendationRequest {
  user_id: string;
  type: 'content' | 'users' | 'communities';
  limit?: number;
  context?: any;
  filters?: any;
}

export interface ContentRecommendation {
  post_id: string;
  title: string;
  score: number;
  reason: string;
  community: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    username: string;
  };
  metrics: {
    upvotes: number;
    comments: number;
    engagement_rate: number;
  };
}

export interface UserRecommendation {
  user_id: string;
  username: string;
  display_name: string;
  score: number;
  reason: string;
  mutual_connections: number;
  shared_interests: string[];
}

export interface CommunityRecommendation {
  community_id: string;
  name: string;
  display_name: string;
  score: number;
  reason: string;
  member_count: number;
  activity_level: string;
  similarity_score: number;
}

export class RecommendationEngine {
  private dbPool: Pool;
  private userProfiles: Map<string, any> = new Map();
  private contentVectors: Map<string, number[]> = new Map();
  private communityVectors: Map<string, number[]> = new Map();

  constructor() {
    this.dbPool = new Pool({
      connectionString: config.database.url,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    // Initialize cache refresh intervals
    this.startCacheRefresh();
  }

  private startCacheRefresh(): void {
    // Refresh user profiles every 30 minutes
    setInterval(() => {
      this.refreshUserProfiles();
    }, 30 * 60 * 1000);

    // Refresh content vectors every hour
    setInterval(() => {
      this.refreshContentVectors();
    }, 60 * 60 * 1000);

    // Initial refresh
    this.refreshUserProfiles();
    this.refreshContentVectors();
  }

  async getRecommendations(request: RecommendationRequest): Promise<any> {
    const { user_id, type, limit = 10, context, filters } = request;

    try {
      switch (type) {
        case 'content':
          return await this.getContentRecommendations(user_id, limit, context, filters);
        case 'users':
          return await this.getUserRecommendations(user_id, limit, context, filters);
        case 'communities':
          return await this.getCommunityRecommendations(user_id, limit, context, filters);
        default:
          throw new Error(`Unknown recommendation type: ${type}`);
      }
    } catch (error) {
      logger.error('Failed to get recommendations', { error, request });
      throw error;
    }
  }

  // Content Recommendations
  async getContentRecommendations(
    userId: string, 
    limit: number, 
    context?: any, 
    filters?: any
  ): Promise<ContentRecommendation[]> {
    const userProfile = await this.getUserProfile(userId);
    const recommendations: ContentRecommendation[] = [];

    // 1. Collaborative Filtering - Similar users' liked content
    const collaborativeRecs = await this.getCollaborativeContentRecommendations(userId, userProfile, limit / 3);
    recommendations.push(...collaborativeRecs);

    // 2. Content-based filtering - Similar content to what user has engaged with
    const contentBasedRecs = await this.getContentBasedRecommendations(userId, userProfile, limit / 3);
    recommendations.push(...contentBasedRecs);

    // 3. Trending content in user's communities
    const trendingRecs = await this.getTrendingContentRecommendations(userId, userProfile, limit / 3);
    recommendations.push(...trendingRecs);

    // 4. Diversification and ranking
    const diversifiedRecs = this.diversifyRecommendations(recommendations, limit);
    
    // Apply filters
    let filteredRecs = diversifiedRecs;
    if (filters) {
      filteredRecs = this.applyContentFilters(diversifiedRecs, filters);
    }

    return filteredRecs.slice(0, limit);
  }

  private async getCollaborativeContentRecommendations(
    userId: string, 
    userProfile: any, 
    limit: number
  ): Promise<ContentRecommendation[]> {
    // Find users with similar behavior patterns
    const similarUsers = await this.findSimilarUsers(userId, userProfile);
    
    if (similarUsers.length === 0) {
      return [];
    }

    const similarUserIds = similarUsers.map(u => u.user_id);

    // Get content that similar users have highly engaged with
    const query = `
      SELECT DISTINCT 
        p.id as post_id,
        p.title,
        p.community_id,
        p.user_id as author_id,
        c.name as community_name,
        u.username as author_username,
        p.upvote_count,
        p.comment_count,
        COALESCE(pa.engagement_rate, 0) as engagement_rate,
        COUNT(v.user_id) as similar_user_engagements
      FROM posts p
      JOIN communities c ON p.community_id = c.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN post_analytics pa ON p.id = pa.post_id AND pa.time > NOW() - INTERVAL '24 hours'
      JOIN votes v ON p.id = v.target_id AND v.target_type = 'post'
      WHERE v.user_id = ANY($1)
        AND v.vote_value = 1
        AND p.is_published = true
        AND p.is_removed = false
        AND p.user_id != $2
        AND p.id NOT IN (
          SELECT target_id FROM votes 
          WHERE user_id = $2 AND target_type = 'post'
        )
        AND p.created_at > NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.title, p.community_id, p.user_id, c.name, u.username, 
               p.upvote_count, p.comment_count, pa.engagement_rate
      HAVING COUNT(v.user_id) >= 2
      ORDER BY similar_user_engagements DESC, p.upvote_count DESC
      LIMIT $3
    `;

    try {
      const result = await this.dbPool.query(query, [similarUserIds, userId, limit]);
      
      return result.rows.map(row => ({
        post_id: row.post_id,
        title: row.title,
        score: this.calculateCollaborativeScore(row),
        reason: `Liked by ${row.similar_user_engagements} users with similar interests`,
        community: {
          id: row.community_id,
          name: row.community_name
        },
        author: {
          id: row.author_id,
          username: row.author_username
        },
        metrics: {
          upvotes: row.upvote_count,
          comments: row.comment_count,
          engagement_rate: row.engagement_rate
        }
      }));
    } catch (error) {
      logger.error('Failed to get collaborative recommendations', { error, userId });
      return [];
    }
  }

  private async getContentBasedRecommendations(
    userId: string, 
    userProfile: any, 
    limit: number
  ): Promise<ContentRecommendation[]> {
    // Get user's interaction history to understand preferences
    const userInteractionQuery = `
      SELECT 
        p.id,
        p.title,
        p.content,
        array_agg(DISTINCT t.name) as tags,
        c.name as community_name
      FROM posts p
      JOIN communities c ON p.community_id = c.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      JOIN votes v ON p.id = v.target_id
      WHERE v.user_id = $1 
        AND v.target_type = 'post' 
        AND v.vote_value = 1
        AND p.created_at > NOW() - INTERVAL '90 days'
      GROUP BY p.id, p.title, p.content, c.name
      ORDER BY v.created_at DESC
      LIMIT 50
    `;

    try {
      const userInteractions = await this.dbPool.query(userInteractionQuery, [userId]);
      
      if (userInteractions.rows.length === 0) {
        return [];
      }

      // Extract keywords and topics from user's liked content
      const userPreferences = this.extractUserPreferences(userInteractions.rows);

      // Find similar content using Elasticsearch More Like This
      const similarContentIds = await this.findSimilarContent(userInteractions.rows, limit * 2);

      // Get full post details for recommendations
      const recommendationsQuery = `
        SELECT 
          p.id as post_id,
          p.title,
          p.community_id,
          p.user_id as author_id,
          c.name as community_name,
          u.username as author_username,
          p.upvote_count,
          p.comment_count,
          COALESCE(pa.engagement_rate, 0) as engagement_rate,
          array_agg(DISTINCT t.name) as tags
        FROM posts p
        JOIN communities c ON p.community_id = c.id
        JOIN users u ON p.user_id = u.id
        LEFT JOIN post_analytics pa ON p.id = pa.post_id AND pa.time > NOW() - INTERVAL '24 hours'
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE p.id = ANY($1)
          AND p.is_published = true
          AND p.is_removed = false
          AND p.user_id != $2
          AND p.id NOT IN (
            SELECT target_id FROM votes 
            WHERE user_id = $2 AND target_type = 'post'
          )
        GROUP BY p.id, p.title, p.community_id, p.user_id, c.name, u.username,
                 p.upvote_count, p.comment_count, pa.engagement_rate
        ORDER BY p.upvote_count DESC
        LIMIT $3
      `;

      const result = await this.dbPool.query(recommendationsQuery, [similarContentIds, userId, limit]);

      return result.rows.map(row => ({
        post_id: row.post_id,
        title: row.title,
        score: this.calculateContentBasedScore(row, userPreferences),
        reason: 'Similar to content you\'ve liked',
        community: {
          id: row.community_id,
          name: row.community_name
        },
        author: {
          id: row.author_id,
          username: row.author_username
        },
        metrics: {
          upvotes: row.upvote_count,
          comments: row.comment_count,
          engagement_rate: row.engagement_rate
        }
      }));
    } catch (error) {
      logger.error('Failed to get content-based recommendations', { error, userId });
      return [];
    }
  }

  private async getTrendingContentRecommendations(
    userId: string, 
    userProfile: any, 
    limit: number
  ): Promise<ContentRecommendation[]> {
    // Get user's communities
    const userCommunitiesQuery = `
      SELECT DISTINCT community_id
      FROM community_members
      WHERE user_id = $1
    `;

    try {
      const userCommunities = await this.dbPool.query(userCommunitiesQuery, [userId]);
      const communityIds = userCommunities.rows.map(row => row.community_id);

      if (communityIds.length === 0) {
        // If user is not in any communities, get trending from popular communities
        return await this.getPopularTrendingContent(userId, limit);
      }

      // Get trending content from user's communities
      const trendingQuery = `
        SELECT 
          p.id as post_id,
          p.title,
          p.community_id,
          p.user_id as author_id,
          c.name as community_name,
          u.username as author_username,
          p.upvote_count,
          p.comment_count,
          p.hot_score,
          COALESCE(pa.engagement_rate, 0) as engagement_rate,
          COALESCE(pa.velocity_score, 0) as velocity_score
        FROM posts p
        JOIN communities c ON p.community_id = c.id
        JOIN users u ON p.user_id = u.id
        LEFT JOIN post_analytics pa ON p.id = pa.post_id AND pa.time > NOW() - INTERVAL '6 hours'
        WHERE p.community_id = ANY($1)
          AND p.is_published = true
          AND p.is_removed = false
          AND p.user_id != $2
          AND p.created_at > NOW() - INTERVAL '24 hours'
          AND p.id NOT IN (
            SELECT target_id FROM votes 
            WHERE user_id = $2 AND target_type = 'post'
          )
        ORDER BY p.hot_score DESC, pa.velocity_score DESC NULLS LAST
        LIMIT $3
      `;

      const result = await this.dbPool.query(trendingQuery, [communityIds, userId, limit]);

      return result.rows.map(row => ({
        post_id: row.post_id,
        title: row.title,
        score: this.calculateTrendingScore(row),
        reason: `Trending in ${row.community_name}`,
        community: {
          id: row.community_id,
          name: row.community_name
        },
        author: {
          id: row.author_id,
          username: row.author_username
        },
        metrics: {
          upvotes: row.upvote_count,
          comments: row.comment_count,
          engagement_rate: row.engagement_rate
        }
      }));
    } catch (error) {
      logger.error('Failed to get trending recommendations', { error, userId });
      return [];
    }
  }

  // User Recommendations
  async getUserRecommendations(
    userId: string, 
    limit: number, 
    context?: any, 
    filters?: any
  ): Promise<UserRecommendation[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const recommendations: UserRecommendation[] = [];

      // 1. Users with similar interests (based on community memberships)
      const similarInterestUsers = await this.findUsersBySimilarInterests(userId, limit / 2);
      recommendations.push(...similarInterestUsers);

      // 2. Users with mutual connections
      const mutualConnectionUsers = await this.findUsersByMutualConnections(userId, limit / 2);
      recommendations.push(...mutualConnectionUsers);

      // 3. Active users in same communities
      const activeCommunityUsers = await this.findActiveCommunityUsers(userId, limit / 2);
      recommendations.push(...activeCommunityUsers);

      // Remove duplicates and rank
      const uniqueRecs = this.removeDuplicateUsers(recommendations);
      const rankedRecs = this.rankUserRecommendations(uniqueRecs, userProfile);

      return rankedRecs.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get user recommendations', { error, userId });
      return [];
    }
  }

  // Community Recommendations
  async getCommunityRecommendations(
    userId: string, 
    limit: number, 
    context?: any, 
    filters?: any
  ): Promise<CommunityRecommendation[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const recommendations: CommunityRecommendation[] = [];

      // 1. Communities with similar topics to user's interests
      const topicBasedRecs = await this.findCommunitiesByTopics(userId, userProfile, limit / 2);
      recommendations.push(...topicBasedRecs);

      // 2. Communities where user's connections are active
      const connectionBasedRecs = await this.findCommunitiesByConnections(userId, limit / 2);
      recommendations.push(...connectionBasedRecs);

      // 3. Trending/growing communities
      const trendingCommunityRecs = await this.findTrendingCommunities(userId, limit / 2);
      recommendations.push(...trendingCommunityRecs);

      // Remove duplicates and rank
      const uniqueRecs = this.removeDuplicateCommunities(recommendations);
      const rankedRecs = this.rankCommunityRecommendations(uniqueRecs, userProfile);

      return rankedRecs.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get community recommendations', { error, userId });
      return [];
    }
  }

  // Helper Methods

  private async getUserProfile(userId: string): Promise<any> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId);
    }

    const profileQuery = `
      SELECT 
        u.*,
        array_agg(DISTINCT cm.community_id) as communities,
        array_agg(DISTINCT t.name) as interests
      FROM users u
      LEFT JOIN community_members cm ON u.id = cm.user_id
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE u.id = $1
      GROUP BY u.id
    `;

    try {
      const result = await this.dbPool.query(profileQuery, [userId]);
      const profile = result.rows[0];
      
      if (profile) {
        this.userProfiles.set(userId, profile);
      }
      
      return profile;
    } catch (error) {
      logger.error('Failed to get user profile', { error, userId });
      return null;
    }
  }

  private async findSimilarUsers(userId: string, userProfile: any): Promise<any[]> {
    // Find users with overlapping community memberships and similar activity patterns
    const query = `
      WITH user_communities AS (
        SELECT community_id FROM community_members WHERE user_id = $1
      ),
      similar_users AS (
        SELECT 
          cm.user_id,
          COUNT(*) as shared_communities,
          u.karma_score,
          u.post_count,
          u.comment_count
        FROM community_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.community_id IN (SELECT community_id FROM user_communities)
          AND cm.user_id != $1
          AND u.is_active = true
        GROUP BY cm.user_id, u.karma_score, u.post_count, u.comment_count
        HAVING COUNT(*) >= 2
      )
      SELECT user_id, shared_communities
      FROM similar_users
      ORDER BY shared_communities DESC, karma_score DESC
      LIMIT 20
    `;

    try {
      const result = await this.dbPool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find similar users', { error, userId });
      return [];
    }
  }

  private async findSimilarContent(userLikedContent: any[], limit: number): Promise<string[]> {
    try {
      // Use Elasticsearch More Like This to find similar content
      const likeDocuments = userLikedContent.slice(0, 5).map(content => ({
        _index: 'cryb-posts-*',
        _id: content.id
      }));

      const response = await elasticsearchClient.getClient().search({
        index: 'cryb-posts-*',
        body: {
          query: {
            more_like_this: {
              fields: ['title', 'content', 'tags'],
              like: likeDocuments,
              min_term_freq: 1,
              max_query_terms: 12,
              min_doc_freq: 1,
              minimum_should_match: '30%'
            }
          },
          size: limit
        }
      });

      return response.hits.hits.map(hit => hit._id);
    } catch (error) {
      logger.error('Failed to find similar content', { error });
      return [];
    }
  }

  private extractUserPreferences(interactions: any[]): any {
    const tags = new Map<string, number>();
    const communities = new Map<string, number>();
    const keywords = new Map<string, number>();

    interactions.forEach(interaction => {
      // Count tag frequencies
      if (interaction.tags) {
        interaction.tags.forEach(tag => {
          tags.set(tag, (tags.get(tag) || 0) + 1);
        });
      }

      // Count community frequencies
      communities.set(interaction.community_name, (communities.get(interaction.community_name) || 0) + 1);

      // Extract keywords from titles (simple keyword extraction)
      const titleWords = interaction.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 3) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      });
    });

    return {
      top_tags: Array.from(tags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
      top_communities: Array.from(communities.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      top_keywords: Array.from(keywords.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20)
    };
  }

  // Scoring functions
  private calculateCollaborativeScore(post: any): number {
    const baseScore = post.similar_user_engagements * 10;
    const engagementBonus = (post.upvote_count + post.comment_count) * 0.1;
    const recencyBonus = 1.0; // Could add time decay here
    
    return Math.min(baseScore + engagementBonus + recencyBonus, 100);
  }

  private calculateContentBasedScore(post: any, preferences: any): number {
    let score = 50; // Base score

    // Tag matching bonus
    if (post.tags && preferences.top_tags) {
      const tagMatches = post.tags.filter(tag => 
        preferences.top_tags.some(([prefTag]) => prefTag === tag)
      ).length;
      score += tagMatches * 10;
    }

    // Community preference bonus
    if (preferences.top_communities) {
      const communityMatch = preferences.top_communities.find(([community]) => 
        community === post.community_name
      );
      if (communityMatch) {
        score += communityMatch[1] * 5;
      }
    }

    // Engagement bonus
    score += (post.upvote_count + post.comment_count) * 0.1;
    score += post.engagement_rate * 20;

    return Math.min(score, 100);
  }

  private calculateTrendingScore(post: any): number {
    const hotScore = post.hot_score || 0;
    const velocityScore = post.velocity_score || 0;
    const engagementScore = (post.upvote_count + post.comment_count) * 0.1;
    
    return Math.min(hotScore + velocityScore + engagementScore, 100);
  }

  // Utility functions
  private diversifyRecommendations(recommendations: ContentRecommendation[], limit: number): ContentRecommendation[] {
    // Ensure diversity in communities and content types
    const diversified: ContentRecommendation[] = [];
    const seenCommunities = new Set<string>();
    const maxPerCommunity = Math.max(2, Math.floor(limit / 5));

    // Sort by score first
    recommendations.sort((a, b) => b.score - a.score);

    for (const rec of recommendations) {
      const communityCount = Array.from(seenCommunities).filter(c => c === rec.community.id).length;
      
      if (communityCount < maxPerCommunity || diversified.length < limit / 2) {
        diversified.push(rec);
        seenCommunities.add(rec.community.id);
        
        if (diversified.length >= limit) break;
      }
    }

    // Fill remaining slots with highest-scored items
    if (diversified.length < limit) {
      for (const rec of recommendations) {
        if (!diversified.find(d => d.post_id === rec.post_id)) {
          diversified.push(rec);
          if (diversified.length >= limit) break;
        }
      }
    }

    return diversified;
  }

  private applyContentFilters(recommendations: ContentRecommendation[], filters: any): ContentRecommendation[] {
    let filtered = recommendations;

    if (filters.communities) {
      filtered = filtered.filter(rec => filters.communities.includes(rec.community.id));
    }

    if (filters.min_score) {
      filtered = filtered.filter(rec => rec.score >= filters.min_score);
    }

    if (filters.content_types) {
      // Would need to add content_type to recommendation object
    }

    return filtered;
  }

  // Placeholder implementations for user and community recommendations
  private async findUsersBySimilarInterests(userId: string, limit: number): Promise<UserRecommendation[]> {
    // Implementation would find users with similar community memberships and interests
    return [];
  }

  private async findUsersByMutualConnections(userId: string, limit: number): Promise<UserRecommendation[]> {
    // Implementation would find users through mutual follows/connections
    return [];
  }

  private async findActiveCommunityUsers(userId: string, limit: number): Promise<UserRecommendation[]> {
    // Implementation would find active users in same communities
    return [];
  }

  private async findCommunitiesByTopics(userId: string, userProfile: any, limit: number): Promise<CommunityRecommendation[]> {
    // Implementation would find communities with similar topics/tags
    return [];
  }

  private async findCommunitiesByConnections(userId: string, limit: number): Promise<CommunityRecommendation[]> {
    // Implementation would find communities where user's connections are active
    return [];
  }

  private async findTrendingCommunities(userId: string, limit: number): Promise<CommunityRecommendation[]> {
    // Implementation would find growing/trending communities
    return [];
  }

  private async getPopularTrendingContent(userId: string, limit: number): Promise<ContentRecommendation[]> {
    // Implementation would get trending content from popular communities
    return [];
  }

  private removeDuplicateUsers(users: UserRecommendation[]): UserRecommendation[] {
    const seen = new Set<string>();
    return users.filter(user => {
      if (seen.has(user.user_id)) return false;
      seen.add(user.user_id);
      return true;
    });
  }

  private removeDuplicateCommunities(communities: CommunityRecommendation[]): CommunityRecommendation[] {
    const seen = new Set<string>();
    return communities.filter(community => {
      if (seen.has(community.community_id)) return false;
      seen.add(community.community_id);
      return true;
    });
  }

  private rankUserRecommendations(users: UserRecommendation[], userProfile: any): UserRecommendation[] {
    return users.sort((a, b) => b.score - a.score);
  }

  private rankCommunityRecommendations(communities: CommunityRecommendation[], userProfile: any): CommunityRecommendation[] {
    return communities.sort((a, b) => b.score - a.score);
  }

  private async refreshUserProfiles(): Promise<void> {
    try {
      // Clear old profiles
      this.userProfiles.clear();
      logger.info('Refreshed user profile cache');
    } catch (error) {
      logger.error('Failed to refresh user profiles', { error });
    }
  }

  private async refreshContentVectors(): Promise<void> {
    try {
      // Clear old vectors
      this.contentVectors.clear();
      this.communityVectors.clear();
      logger.info('Refreshed content vector cache');
    } catch (error) {
      logger.error('Failed to refresh content vectors', { error });
    }
  }

  async shutdown(): Promise<void> {
    await this.dbPool.end();
  }
}

export const recommendationEngine = new RecommendationEngine();