import { AIIntegrationService } from './ai-integration';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import * as natural from 'natural';

export interface RecommendationConfig {
  algorithms: {
    collaborative: boolean;
    contentBased: boolean;
    hybrid: boolean;
    trending: boolean;
    social: boolean;
  };
  weights: {
    collaborative: number;
    contentBased: number;
    behavioral: number;
    social: number;
    recency: number;
    popularity: number;
  };
  filters: {
    minScore: number;
    maxAge: number; // hours
    excludeBlocked: boolean;
    respectPrivacy: boolean;
    nsfwFilter: boolean;
  };
  personalization: {
    learningRate: number;
    decayFactor: number;
    minInteractions: number;
    maxRecommendations: number;
  };
}

export interface UserProfile {
  userId: string;
  interests: { [topic: string]: number };
  behaviorPatterns: {
    activeHours: number[];
    preferredChannels: string[];
    interactionTypes: { [type: string]: number };
    avgSessionLength: number;
    messageFrequency: number;
  };
  socialConnections: {
    friends: string[];
    frequentInteractions: string[];
    sharedInterests: { [userId: string]: string[] };
  };
  preferences: {
    contentTypes: string[];
    topics: string[];
    excludedTopics: string[];
    languages: string[];
  };
  feedback: {
    liked: string[];
    disliked: string[];
    shared: string[];
    saved: string[];
  };
  lastUpdate: Date;
}

export interface ContentItem {
  id: string;
  type: 'message' | 'post' | 'server' | 'channel' | 'user' | 'event';
  content: string;
  authorId: string;
  serverId?: string;
  channelId?: string;
  timestamp: Date;
  metadata: {
    topics: string[];
    sentiment: number;
    engagement: {
      reactions: number;
      replies: number;
      shares: number;
      views: number;
    };
    quality: number;
    relevance: number;
  };
  features: number[]; // Vector representation
}

export interface Recommendation {
  id: string;
  type: 'content' | 'server' | 'channel' | 'user' | 'event';
  itemId: string;
  score: number;
  confidence: number;
  reasoning: string[];
  algorithm: string;
  metadata: {
    title?: string;
    description?: string;
    preview?: string;
    thumbnail?: string;
    tags?: string[];
  };
  personalizedScore: number;
  freshness: number;
  diversity: number;
}

export interface RecommendationRequest {
  userId: string;
  context?: {
    currentChannel?: string;
    currentServer?: string;
    sessionLength?: number;
    recentActivity?: string[];
  };
  filters?: {
    contentTypes?: string[];
    topics?: string[];
    excludeAuthors?: string[];
    minQuality?: number;
  };
  count?: number;
  diversityWeight?: number;
}

export class RecommendationEngine {
  private aiService: AIIntegrationService;
  private queue: Queue;
  private config: RecommendationConfig;
  
  // Data structures
  private userProfiles: Map<string, UserProfile> = new Map();
  private contentVectors: Map<string, ContentItem> = new Map();
  private userItemMatrix: Map<string, Map<string, number>> = new Map(); // user -> item -> rating
  private itemSimilarityCache: Map<string, Map<string, number>> = new Map();
  private trendingTopics: Map<string, { score: number; momentum: number; lastUpdate: Date }> = new Map();
  
  // ML components
  private tfidf: natural.TfIdf;
  private topicModel: Map<string, number[]> = new Map();

  constructor(aiService: AIIntegrationService, moderationQueue: Queue) {
    this.aiService = aiService;
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    this.tfidf = new natural.TfIdf();
    
    this.startRecommendationProcessing();
    this.startTrendAnalysis();
    this.startModelUpdates();
  }

  /**
   * Generate personalized recommendations for a user
   */
  async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    try {
      const startTime = Date.now();
      const { userId, context, filters, count = 10, diversityWeight = 0.3 } = request;
      
      // Get or create user profile
      const userProfile = await this.getUserProfile(userId);
      
      // Update profile with current context
      if (context) {
        await this.updateUserContext(userProfile, context);
      }

      // Generate recommendations using multiple algorithms
      const recommendations = await this.generateMultiAlgorithmRecommendations(
        userProfile,
        context,
        filters,
        count * 3 // Generate more for filtering and ranking
      );

      // Re-rank based on personalization
      const personalizedRecs = await this.personalizeRecommendations(
        recommendations,
        userProfile,
        context
      );

      // Apply diversity and final filtering
      const finalRecs = this.diversifyRecommendations(
        personalizedRecs,
        diversityWeight,
        count
      );

      // Log recommendation generation
      await this.logRecommendationGeneration(userId, finalRecs, Date.now() - startTime);

      return finalRecs;
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return [];
    }
  }

  /**
   * Generate recommendations using multiple algorithms
   */
  private async generateMultiAlgorithmRecommendations(
    userProfile: UserProfile,
    context: any,
    filters: any,
    count: number
  ): Promise<Recommendation[]> {
    const allRecommendations: Recommendation[] = [];

    // Collaborative Filtering
    if (this.config.algorithms.collaborative) {
      const collaborative = await this.collaborativeFiltering(userProfile, count / 4);
      allRecommendations.push(...collaborative);
    }

    // Content-Based Filtering
    if (this.config.algorithms.contentBased) {
      const contentBased = await this.contentBasedFiltering(userProfile, count / 4);
      allRecommendations.push(...contentBased);
    }

    // Trending Content
    if (this.config.algorithms.trending) {
      const trending = await this.trendingRecommendations(userProfile, count / 4);
      allRecommendations.push(...trending);
    }

    // Social Recommendations
    if (this.config.algorithms.social) {
      const social = await this.socialRecommendations(userProfile, count / 4);
      allRecommendations.push(...social);
    }

    // Hybrid approach (combining multiple signals)
    if (this.config.algorithms.hybrid) {
      const hybrid = await this.hybridRecommendations(userProfile, context, count / 4);
      allRecommendations.push(...hybrid);
    }

    return allRecommendations;
  }

  /**
   * Collaborative filtering recommendations
   */
  private async collaborativeFiltering(
    userProfile: UserProfile,
    count: number
  ): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];
      const userInteractions = this.userItemMatrix.get(userProfile.userId) || new Map();
      
      // Find similar users based on interaction patterns
      const similarUsers = await this.findSimilarUsers(userProfile.userId, 20);
      
      // Get items liked by similar users that current user hasn't seen
      const candidateItems = new Map<string, { score: number; count: number }>();
      
      for (const { userId: similarUserId, similarity } of similarUsers) {
        const similarUserInteractions = this.userItemMatrix.get(similarUserId);
        if (!similarUserInteractions) continue;
        
        for (const [itemId, rating] of similarUserInteractions.entries()) {
          if (userInteractions.has(itemId)) continue; // Already seen
          
          const existing = candidateItems.get(itemId) || { score: 0, count: 0 };
          candidateItems.set(itemId, {
            score: existing.score + (rating * similarity),
            count: existing.count + 1
          });
        }
      }
      
      // Convert to recommendations and sort
      const sortedCandidates = Array.from(candidateItems.entries())
        .map(([itemId, { score, count }]) => ({
          itemId,
          score: score / count, // Average weighted score
          confidence: Math.min(count / 5, 1) // More confident with more similar users
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
      
      for (const candidate of sortedCandidates) {
        const contentItem = this.contentVectors.get(candidate.itemId);
        if (!contentItem) continue;
        
        recommendations.push({
          id: `collab_${candidate.itemId}`,
          type: contentItem.type as any,
          itemId: candidate.itemId,
          score: candidate.score,
          confidence: candidate.confidence,
          reasoning: ['Users with similar interests also liked this content'],
          algorithm: 'collaborative',
          metadata: {
            title: contentItem.content.substring(0, 50) + '...',
            tags: contentItem.metadata.topics
          },
          personalizedScore: 0,
          freshness: this.calculateFreshness(contentItem.timestamp),
          diversity: 0
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Collaborative filtering failed:', error);
      return [];
    }
  }

  /**
   * Content-based filtering recommendations
   */
  private async contentBasedFiltering(
    userProfile: UserProfile,
    count: number
  ): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];
      const userInterests = userProfile.interests;
      
      // Get content items and calculate similarity to user interests
      const candidateItems: Array<{ item: ContentItem; similarity: number }> = [];
      
      for (const [itemId, contentItem] of this.contentVectors.entries()) {
        // Skip if user has already interacted with this content
        const userInteractions = this.userItemMatrix.get(userProfile.userId);
        if (userInteractions && userInteractions.has(itemId)) continue;
        
        // Calculate content similarity to user interests
        let similarity = 0;
        for (const topic of contentItem.metadata.topics) {
          const userInterest = userInterests[topic] || 0;
          similarity += userInterest;
        }
        
        // Boost based on content quality and engagement
        similarity *= (1 + contentItem.metadata.quality * 0.2);
        similarity *= (1 + Math.log(1 + contentItem.metadata.engagement.reactions) * 0.1);
        
        if (similarity > 0) {
          candidateItems.push({ item: contentItem, similarity });
        }
      }
      
      // Sort by similarity and take top candidates
      candidateItems.sort((a, b) => b.similarity - a.similarity);
      const topCandidates = candidateItems.slice(0, count);
      
      for (const { item, similarity } of topCandidates) {
        recommendations.push({
          id: `content_${item.id}`,
          type: item.type as any,
          itemId: item.id,
          score: similarity,
          confidence: Math.min(similarity / 5, 1),
          reasoning: [`Matches your interests in: ${item.metadata.topics.join(', ')}`],
          algorithm: 'content_based',
          metadata: {
            title: item.content.substring(0, 50) + '...',
            tags: item.metadata.topics
          },
          personalizedScore: 0,
          freshness: this.calculateFreshness(item.timestamp),
          diversity: 0
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Content-based filtering failed:', error);
      return [];
    }
  }

  /**
   * Trending content recommendations
   */
  private async trendingRecommendations(
    userProfile: UserProfile,
    count: number
  ): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];
      const now = Date.now();
      
      // Get trending topics that match user interests
      const relevantTrends = Array.from(this.trendingTopics.entries())
        .filter(([topic, data]) => {
          // Filter by recency
          if (now - data.lastUpdate.getTime() > 4 * 60 * 60 * 1000) return false; // 4 hours
          
          // Check if topic matches user interests
          return (userProfile.interests[topic] || 0) > 0.1;
        })
        .sort((a, b) => (b[1].score * b[1].momentum) - (a[1].score * a[1].momentum))
        .slice(0, 10);
      
      // Find content for trending topics
      const trendingContent: Array<{ item: ContentItem; trendScore: number }> = [];
      
      for (const [topic, trendData] of relevantTrends) {
        for (const [itemId, contentItem] of this.contentVectors.entries()) {
          if (contentItem.metadata.topics.includes(topic)) {
            // Skip old content
            const ageHours = (now - contentItem.timestamp.getTime()) / (60 * 60 * 1000);
            if (ageHours > 24) continue;
            
            const trendScore = trendData.score * trendData.momentum * 
                              (1 - ageHours / 24) * // Recency factor
                              (1 + contentItem.metadata.engagement.reactions / 100); // Engagement boost
            
            trendingContent.push({ item: contentItem, trendScore });
          }
        }
      }
      
      // Sort and select top trending content
      trendingContent.sort((a, b) => b.trendScore - a.trendScore);
      const topTrending = trendingContent.slice(0, count);
      
      for (const { item, trendScore } of topTrending) {
        recommendations.push({
          id: `trending_${item.id}`,
          type: item.type as any,
          itemId: item.id,
          score: trendScore,
          confidence: 0.8,
          reasoning: [`Trending topic: ${item.metadata.topics.join(', ')}`],
          algorithm: 'trending',
          metadata: {
            title: item.content.substring(0, 50) + '...',
            tags: [...item.metadata.topics, 'trending']
          },
          personalizedScore: 0,
          freshness: this.calculateFreshness(item.timestamp),
          diversity: 0
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Trending recommendations failed:', error);
      return [];
    }
  }

  /**
   * Social-based recommendations
   */
  private async socialRecommendations(
    userProfile: UserProfile,
    count: number
  ): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];
      const socialConnections = userProfile.socialConnections;
      
      // Get content liked by friends and frequent interactions
      const socialCandidates = new Map<string, { score: number; sources: string[] }>();
      
      const allSocialConnections = [
        ...socialConnections.friends,
        ...socialConnections.frequentInteractions
      ];
      
      for (const connectionId of allSocialConnections) {
        const connectionInteractions = this.userItemMatrix.get(connectionId);
        if (!connectionInteractions) continue;
        
        for (const [itemId, rating] of connectionInteractions.entries()) {
          if (rating < 0.5) continue; // Only positive interactions
          
          // Skip if user has already seen this
          const userInteractions = this.userItemMatrix.get(userProfile.userId);
          if (userInteractions && userInteractions.has(itemId)) continue;
          
          const existing = socialCandidates.get(itemId) || { score: 0, sources: [] };
          socialCandidates.set(itemId, {
            score: existing.score + rating,
            sources: [...existing.sources, connectionId]
          });
        }
      }
      
      // Convert to recommendations
      const sortedSocial = Array.from(socialCandidates.entries())
        .map(([itemId, { score, sources }]) => ({ itemId, score, sources }))
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
      
      for (const { itemId, score, sources } of sortedSocial) {
        const contentItem = this.contentVectors.get(itemId);
        if (!contentItem) continue;
        
        recommendations.push({
          id: `social_${itemId}`,
          type: contentItem.type as any,
          itemId,
          score,
          confidence: Math.min(sources.length / 3, 1),
          reasoning: [`Liked by ${sources.length} of your connections`],
          algorithm: 'social',
          metadata: {
            title: contentItem.content.substring(0, 50) + '...',
            tags: contentItem.metadata.topics
          },
          personalizedScore: 0,
          freshness: this.calculateFreshness(contentItem.timestamp),
          diversity: 0
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Social recommendations failed:', error);
      return [];
    }
  }

  /**
   * Hybrid recommendations combining multiple signals
   */
  private async hybridRecommendations(
    userProfile: UserProfile,
    context: any,
    count: number
  ): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];
      
      // Use AI to analyze user's recent activity and preferences
      const recentActivity = context?.recentActivity || [];
      const analysisText = recentActivity.join(' ');
      
      if (analysisText.length > 0) {
        const aiAnalysis = await this.aiService.analyzeContent(analysisText, userProfile.userId, {
          categorize: true,
          extractEntities: true,
          checkSentiment: true
        });
        
        // Find content that matches AI-extracted categories and entities
        const aiCategories = new Set(aiAnalysis.categories);
        const aiEntities = aiAnalysis.entities.map(e => e.value.toLowerCase());
        
        const hybridCandidates: Array<{ item: ContentItem; relevanceScore: number }> = [];
        
        for (const [itemId, contentItem] of this.contentVectors.entries()) {
          let relevanceScore = 0;
          
          // Category matching
          for (const topic of contentItem.metadata.topics) {
            if (aiCategories.has(topic)) {
              relevanceScore += 2;
            }
          }
          
          // Entity matching
          const itemText = contentItem.content.toLowerCase();
          for (const entity of aiEntities) {
            if (itemText.includes(entity)) {
              relevanceScore += 1;
            }
          }
          
          // Sentiment alignment
          const sentimentAlignment = 1 - Math.abs(aiAnalysis.sentiment.comparative - contentItem.metadata.sentiment);
          relevanceScore += sentimentAlignment;
          
          // Quality and engagement boost
          relevanceScore *= (1 + contentItem.metadata.quality * 0.3);
          relevanceScore *= (1 + Math.log(1 + contentItem.metadata.engagement.reactions) * 0.1);
          
          if (relevanceScore > 1) {
            hybridCandidates.push({ item: contentItem, relevanceScore });
          }
        }
        
        // Sort and select top candidates
        hybridCandidates.sort((a, b) => b.relevanceScore - a.relevanceScore);
        const topHybrid = hybridCandidates.slice(0, count);
        
        for (const { item, relevanceScore } of topHybrid) {
          recommendations.push({
            id: `hybrid_${item.id}`,
            type: item.type as any,
            itemId: item.id,
            score: relevanceScore,
            confidence: Math.min(relevanceScore / 5, 1),
            reasoning: ['AI-powered content matching based on your recent activity'],
            algorithm: 'hybrid',
            metadata: {
              title: item.content.substring(0, 50) + '...',
              tags: item.metadata.topics
            },
            personalizedScore: 0,
            freshness: this.calculateFreshness(item.timestamp),
            diversity: 0
          });
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Hybrid recommendations failed:', error);
      return [];
    }
  }

  /**
   * Personalize recommendations based on user profile
   */
  private async personalizeRecommendations(
    recommendations: Recommendation[],
    userProfile: UserProfile,
    context: any
  ): Promise<Recommendation[]> {
    try {
      for (const rec of recommendations) {
        let personalizedScore = rec.score;
        
        // Apply user behavior patterns
        const behaviorMultiplier = this.calculateBehaviorMultiplier(rec, userProfile);
        personalizedScore *= behaviorMultiplier;
        
        // Apply time-based preferences
        const timeMultiplier = this.calculateTimeMultiplier(rec, userProfile);
        personalizedScore *= timeMultiplier;
        
        // Apply feedback history
        const feedbackMultiplier = this.calculateFeedbackMultiplier(rec, userProfile);
        personalizedScore *= feedbackMultiplier;
        
        // Apply context boost
        if (context) {
          const contextMultiplier = this.calculateContextMultiplier(rec, context);
          personalizedScore *= contextMultiplier;
        }
        
        rec.personalizedScore = personalizedScore;
      }
      
      // Sort by personalized score
      recommendations.sort((a, b) => b.personalizedScore - a.personalizedScore);
      
      return recommendations;
    } catch (error) {
      console.error('Recommendation personalization failed:', error);
      return recommendations;
    }
  }

  /**
   * Diversify recommendations to avoid filter bubbles
   */
  private diversifyRecommendations(
    recommendations: Recommendation[],
    diversityWeight: number,
    count: number
  ): Recommendation[] {
    if (recommendations.length <= count) {
      return recommendations;
    }
    
    const diversified: Recommendation[] = [];
    const usedTopics = new Set<string>();
    const usedAlgorithms = new Set<string>();
    
    // Sort by personalized score first
    const sorted = [...recommendations].sort((a, b) => b.personalizedScore - a.personalizedScore);
    
    for (const rec of sorted) {
      if (diversified.length >= count) break;
      
      // Calculate diversity score
      let diversityScore = 1;
      
      // Topic diversity
      const recTopics = rec.metadata.tags || [];
      const topicOverlap = recTopics.filter(topic => usedTopics.has(topic)).length;
      const topicDiversity = Math.max(0, 1 - topicOverlap / Math.max(recTopics.length, 1));
      
      // Algorithm diversity
      const algorithmDiversity = usedAlgorithms.has(rec.algorithm) ? 0.5 : 1;
      
      diversityScore = topicDiversity * algorithmDiversity;
      
      // Combined score
      const finalScore = (1 - diversityWeight) * rec.personalizedScore + diversityWeight * diversityScore;
      rec.diversity = diversityScore;
      
      // Add to results
      diversified.push({ ...rec, personalizedScore: finalScore });
      
      // Update used sets
      recTopics.forEach(topic => usedTopics.add(topic));
      usedAlgorithms.add(rec.algorithm);
    }
    
    // Final sort and return
    return diversified
      .sort((a, b) => b.personalizedScore - a.personalizedScore)
      .slice(0, count);
  }

  /**
   * Helper methods for personalization
   */
  private calculateBehaviorMultiplier(rec: Recommendation, userProfile: UserProfile): number {
    let multiplier = 1;
    
    // Preferred channels
    const contentItem = this.contentVectors.get(rec.itemId);
    if (contentItem && contentItem.channelId && 
        userProfile.behaviorPatterns.preferredChannels.includes(contentItem.channelId)) {
      multiplier *= 1.2;
    }
    
    // Interaction type preferences
    const interactionTypes = userProfile.behaviorPatterns.interactionTypes;
    const topInteractionType = Object.keys(interactionTypes).reduce((a, b) => 
      interactionTypes[a] > interactionTypes[b] ? a : b, 'reaction'
    );
    
    if (rec.type === topInteractionType) {
      multiplier *= 1.1;
    }
    
    return multiplier;
  }

  private calculateTimeMultiplier(rec: Recommendation, userProfile: UserProfile): number {
    const currentHour = new Date().getHours();
    const activeHours = userProfile.behaviorPatterns.activeHours;
    
    if (activeHours.includes(currentHour)) {
      return 1.1;
    }
    
    return 1.0;
  }

  private calculateFeedbackMultiplier(rec: Recommendation, userProfile: UserProfile): number {
    const feedback = userProfile.feedback;
    
    // Boost if similar content was liked
    if (feedback.liked.some(likedId => this.areItemsSimilar(likedId, rec.itemId))) {
      return 1.3;
    }
    
    // Penalize if similar content was disliked
    if (feedback.disliked.some(dislikedId => this.areItemsSimilar(dislikedId, rec.itemId))) {
      return 0.7;
    }
    
    return 1.0;
  }

  private calculateContextMultiplier(rec: Recommendation, context: any): number {
    let multiplier = 1;
    
    // Current channel context
    const contentItem = this.contentVectors.get(rec.itemId);
    if (contentItem && context.currentChannel && 
        contentItem.channelId === context.currentChannel) {
      multiplier *= 1.2;
    }
    
    // Current server context
    if (contentItem && context.currentServer && 
        contentItem.serverId === context.currentServer) {
      multiplier *= 1.1;
    }
    
    return multiplier;
  }

  private calculateFreshness(timestamp: Date): number {
    const ageHours = (Date.now() - timestamp.getTime()) / (60 * 60 * 1000);
    return Math.max(0, 1 - ageHours / (7 * 24)); // Decay over a week
  }

  /**
   * User profile management
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      // Create new profile - in production, load from database
      profile = {
        userId,
        interests: {},
        behaviorPatterns: {
          activeHours: [],
          preferredChannels: [],
          interactionTypes: {},
          avgSessionLength: 0,
          messageFrequency: 0
        },
        socialConnections: {
          friends: [],
          frequentInteractions: [],
          sharedInterests: {}
        },
        preferences: {
          contentTypes: [],
          topics: [],
          excludedTopics: [],
          languages: ['en']
        },
        feedback: {
          liked: [],
          disliked: [],
          shared: [],
          saved: []
        },
        lastUpdate: new Date()
      };
      
      this.userProfiles.set(userId, profile);
    }
    
    return profile;
  }

  private async updateUserContext(profile: UserProfile, context: any): Promise<void> {
    // Update active hours
    const currentHour = new Date().getHours();
    if (!profile.behaviorPatterns.activeHours.includes(currentHour)) {
      profile.behaviorPatterns.activeHours.push(currentHour);
    }
    
    // Update preferred channels
    if (context.currentChannel && 
        !profile.behaviorPatterns.preferredChannels.includes(context.currentChannel)) {
      profile.behaviorPatterns.preferredChannels.push(context.currentChannel);
      // Keep only top 10 preferred channels
      if (profile.behaviorPatterns.preferredChannels.length > 10) {
        profile.behaviorPatterns.preferredChannels = profile.behaviorPatterns.preferredChannels.slice(-10);
      }
    }
    
    profile.lastUpdate = new Date();
  }

  /**
   * Find similar users for collaborative filtering
   */
  private async findSimilarUsers(userId: string, limit: number): Promise<Array<{ userId: string; similarity: number }>> {
    const userInteractions = this.userItemMatrix.get(userId);
    if (!userInteractions) return [];
    
    const similarities: Array<{ userId: string; similarity: number }> = [];
    
    for (const [otherUserId, otherInteractions] of this.userItemMatrix.entries()) {
      if (otherUserId === userId) continue;
      
      const similarity = this.calculateUserSimilarity(userInteractions, otherInteractions);
      if (similarity > 0.1) { // Minimum similarity threshold
        similarities.push({ userId: otherUserId, similarity });
      }
    }
    
    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  private calculateUserSimilarity(
    interactions1: Map<string, number>,
    interactions2: Map<string, number>
  ): number {
    const commonItems = new Set([...interactions1.keys()].filter(item => interactions2.has(item)));
    if (commonItems.size === 0) return 0;
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const item of commonItems) {
      const rating1 = interactions1.get(item) || 0;
      const rating2 = interactions2.get(item) || 0;
      
      dotProduct += rating1 * rating2;
      norm1 += rating1 * rating1;
      norm2 += rating2 * rating2;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private areItemsSimilar(itemId1: string, itemId2: string): boolean {
    // Simple similarity check - in production, use more sophisticated content similarity
    const item1 = this.contentVectors.get(itemId1);
    const item2 = this.contentVectors.get(itemId2);
    
    if (!item1 || !item2) return false;
    
    // Check topic overlap
    const topics1 = new Set(item1.metadata.topics);
    const topics2 = new Set(item2.metadata.topics);
    const intersection = new Set([...topics1].filter(t => topics2.has(t)));
    
    return intersection.size > 0;
  }

  /**
   * Add user feedback to improve recommendations
   */
  async addUserFeedback(
    userId: string,
    itemId: string,
    feedbackType: 'like' | 'dislike' | 'share' | 'save',
    rating?: number
  ): Promise<void> {
    try {
      const userProfile = await this.getUserProfile(userId);
      
      // Add to feedback history
      switch (feedbackType) {
        case 'like':
          userProfile.feedback.liked.push(itemId);
          this.updateUserItemMatrix(userId, itemId, rating || 1);
          break;
        case 'dislike':
          userProfile.feedback.disliked.push(itemId);
          this.updateUserItemMatrix(userId, itemId, rating || -1);
          break;
        case 'share':
          userProfile.feedback.shared.push(itemId);
          this.updateUserItemMatrix(userId, itemId, 0.8);
          break;
        case 'save':
          userProfile.feedback.saved.push(itemId);
          this.updateUserItemMatrix(userId, itemId, 0.9);
          break;
      }
      
      // Update user interests based on content
      const contentItem = this.contentVectors.get(itemId);
      if (contentItem) {
        for (const topic of contentItem.metadata.topics) {
          const currentInterest = userProfile.interests[topic] || 0;
          const adjustment = feedbackType === 'like' || feedbackType === 'save' ? 0.1 : -0.1;
          userProfile.interests[topic] = Math.max(0, Math.min(1, currentInterest + adjustment));
        }
      }
      
      userProfile.lastUpdate = new Date();
      
      console.log(`📝 User feedback: ${userId} ${feedbackType}d ${itemId}`);
    } catch (error) {
      console.error('Failed to add user feedback:', error);
    }
  }

  private updateUserItemMatrix(userId: string, itemId: string, rating: number): void {
    let userInteractions = this.userItemMatrix.get(userId);
    if (!userInteractions) {
      userInteractions = new Map();
      this.userItemMatrix.set(userId, userInteractions);
    }
    
    userInteractions.set(itemId, rating);
  }

  /**
   * Add content to recommendation system
   */
  async addContent(
    id: string,
    type: string,
    content: string,
    authorId: string,
    serverId?: string,
    channelId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Analyze content with AI
      const analysis = await this.aiService.analyzeContent(content, authorId, {
        categorize: true,
        extractEntities: true,
        checkSentiment: true
      });
      
      // Extract features and topics
      const topics = analysis.categories.slice(0, 5); // Top 5 categories
      const entities = analysis.entities.map(e => e.value);
      
      // Create content item
      const contentItem: ContentItem = {
        id,
        type: type as any,
        content,
        authorId,
        serverId,
        channelId,
        timestamp: new Date(),
        metadata: {
          topics,
          sentiment: analysis.sentiment.comparative,
          engagement: {
            reactions: 0,
            replies: 0,
            shares: 0,
            views: 0
          },
          quality: analysis.confidence,
          relevance: 0.5,
          ...metadata
        },
        features: [] // Would be vector representation
      };
      
      this.contentVectors.set(id, contentItem);
      
      // Update trending topics
      for (const topic of topics) {
        const existing = this.trendingTopics.get(topic) || { score: 0, momentum: 0, lastUpdate: new Date() };
        existing.score += 1;
        existing.momentum = Math.min(existing.momentum + 0.1, 2.0);
        existing.lastUpdate = new Date();
        this.trendingTopics.set(topic, existing);
      }
      
      console.log(`📚 Added content: ${id} with topics: ${topics.join(', ')}`);
    } catch (error) {
      console.error('Failed to add content:', error);
    }
  }

  /**
   * Logging and analytics
   */
  private async logRecommendationGeneration(
    userId: string,
    recommendations: Recommendation[],
    processingTime: number
  ): Promise<void> {
    try {
      console.log(`🎯 Generated ${recommendations.length} recommendations for ${userId} in ${processingTime}ms`);
      
      // Log to audit if needed
      if (recommendations.length > 0) {
        const algorithms = [...new Set(recommendations.map(r => r.algorithm))];
        const avgScore = recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length;
        
        console.log(`   Algorithms used: ${algorithms.join(', ')}`);
        console.log(`   Average score: ${avgScore.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Failed to log recommendation generation:', error);
    }
  }

  /**
   * Scheduled tasks
   */
  private startRecommendationProcessing(): void {
    // Process periodic recommendation updates
    setInterval(() => {
      this.updateRecommendationModels();
    }, 60 * 60 * 1000); // Every hour
  }

  private startTrendAnalysis(): void {
    // Update trending topics analysis
    setInterval(() => {
      this.updateTrendingTopics();
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  private startModelUpdates(): void {
    // Update ML models
    setInterval(() => {
      this.updateMLModels();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  private updateRecommendationModels(): void {
    // Update similarity caches, user profiles, etc.
    console.log('🔄 Updating recommendation models');
  }

  private updateTrendingTopics(): void {
    // Decay trending topics over time
    const now = Date.now();
    const decayFactor = 0.95;
    
    for (const [topic, data] of this.trendingTopics.entries()) {
      const hoursSinceUpdate = (now - data.lastUpdate.getTime()) / (60 * 60 * 1000);
      
      if (hoursSinceUpdate > 0.25) { // 15 minutes
        data.momentum *= Math.pow(decayFactor, hoursSinceUpdate * 4); // Decay every 15 min
        if (data.momentum < 0.1) {
          this.trendingTopics.delete(topic);
        }
      }
    }
  }

  private updateMLModels(): void {
    // Retrain models, update parameters, etc.
    console.log('🧠 Updating ML models');
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): RecommendationConfig {
    return {
      algorithms: {
        collaborative: true,
        contentBased: true,
        hybrid: true,
        trending: true,
        social: true
      },
      weights: {
        collaborative: 0.3,
        contentBased: 0.25,
        behavioral: 0.2,
        social: 0.15,
        recency: 0.05,
        popularity: 0.05
      },
      filters: {
        minScore: 0.1,
        maxAge: 168, // 7 days
        excludeBlocked: true,
        respectPrivacy: true,
        nsfwFilter: true
      },
      personalization: {
        learningRate: 0.01,
        decayFactor: 0.95,
        minInteractions: 5,
        maxRecommendations: 50
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RecommendationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    userProfiles: number;
    contentItems: number;
    trendingTopics: number;
    totalInteractions: number;
    averagePersonalizationScore: number;
  } {
    let totalInteractions = 0;
    for (const interactions of this.userItemMatrix.values()) {
      totalInteractions += interactions.size;
    }

    return {
      userProfiles: this.userProfiles.size,
      contentItems: this.contentVectors.size,
      trendingTopics: this.trendingTopics.size,
      totalInteractions,
      averagePersonalizationScore: 0.7 // Would calculate actual average
    };
  }
}