/**
 * CRYB Platform - Machine Learning Recommendation Models
 * TensorFlow.js-based recommendation algorithms
 */

import * as tf from '@tensorflow/tfjs-node';
import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface UserEmbedding {
  user_id: string;
  embedding: number[];
  last_updated: Date;
}

export interface ContentEmbedding {
  content_id: string;
  content_type: string;
  embedding: number[];
  features: number[];
  last_updated: Date;
}

export interface RecommendationScore {
  item_id: string;
  score: number;
  confidence: number;
  reason: string;
}

export class MLRecommendationEngine {
  private dbPool: Pool;
  private userEmbeddingModel: tf.LayersModel | null = null;
  private contentEmbeddingModel: tf.LayersModel | null = null;
  private interactionModel: tf.LayersModel | null = null;
  private userEmbeddingCache: Map<string, UserEmbedding> = new Map();
  private contentEmbeddingCache: Map<string, ContentEmbedding> = new Map();
  
  // Model configuration
  private readonly embeddingDim = 128;
  private readonly userFeatureDim = 50;
  private readonly contentFeatureDim = 100;

  constructor() {
    this.dbPool = new Pool({
      connectionString: config.database.url,
      max: 10,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.loadOrCreateModels();
      await this.loadEmbeddingCaches();
      logger.info('ML Recommendation Engine initialized');
    } catch (error) {
      logger.error('Failed to initialize ML engine', { error });
      throw error;
    }
  }

  private async loadOrCreateModels(): Promise<void> {
    try {
      // Try to load existing models
      this.userEmbeddingModel = await this.loadModel('user_embedding');
      this.contentEmbeddingModel = await this.loadModel('content_embedding');
      this.interactionModel = await this.loadModel('user_content_interaction');
    } catch (error) {
      logger.warn('Could not load existing models, creating new ones');
      await this.createModels();
    }
  }

  private async loadModel(modelName: string): Promise<tf.LayersModel> {
    const modelPath = `file://${config.ml.modelPath}/${modelName}/model.json`;
    return await tf.loadLayersModel(modelPath);
  }

  private async createModels(): Promise<void> {
    // User Embedding Model
    this.userEmbeddingModel = this.createUserEmbeddingModel();
    
    // Content Embedding Model
    this.contentEmbeddingModel = this.createContentEmbeddingModel();
    
    // Interaction Prediction Model
    this.interactionModel = this.createInteractionModel();
    
    logger.info('Created new ML models');
  }

  private createUserEmbeddingModel(): tf.LayersModel {
    const input = tf.input({ shape: [this.userFeatureDim] });
    
    // Feature extraction layers
    let x = tf.layers.dense({ units: 256, activation: 'relu' }).apply(input) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.3 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: 128, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;
    
    // Embedding layer
    const embedding = tf.layers.dense({ 
      units: this.embeddingDim, 
      activation: 'tanh',
      name: 'user_embedding'
    }).apply(x);
    
    const model = tf.model({ inputs: input, outputs: embedding });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  private createContentEmbeddingModel(): tf.LayersModel {
    const input = tf.input({ shape: [this.contentFeatureDim] });
    
    // Feature extraction layers
    let x = tf.layers.dense({ units: 256, activation: 'relu' }).apply(input) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.3 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: 128, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;
    
    // Embedding layer
    const embedding = tf.layers.dense({ 
      units: this.embeddingDim, 
      activation: 'tanh',
      name: 'content_embedding'
    }).apply(x);
    
    const model = tf.model({ inputs: input, outputs: embedding });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  private createInteractionModel(): tf.LayersModel {
    // User embedding input
    const userInput = tf.input({ shape: [this.embeddingDim], name: 'user_embedding' });
    
    // Content embedding input
    const contentInput = tf.input({ shape: [this.embeddingDim], name: 'content_embedding' });
    
    // Context features input (time of day, device, etc.)
    const contextInput = tf.input({ shape: [10], name: 'context_features' });
    
    // Combine embeddings
    const combined = tf.layers.concatenate().apply([userInput, contentInput, contextInput]) as tf.SymbolicTensor;
    
    // Prediction layers
    let x = tf.layers.dense({ units: 256, activation: 'relu' }).apply(combined) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.3 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: 128, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: 64, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    
    // Output: probability of interaction
    const output = tf.layers.dense({ 
      units: 1, 
      activation: 'sigmoid',
      name: 'interaction_probability'
    }).apply(x);
    
    const model = tf.model({ 
      inputs: [userInput, contentInput, contextInput], 
      outputs: output 
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  async generateUserEmbedding(userId: string): Promise<number[]> {
    try {
      // Check cache first
      const cached = this.userEmbeddingCache.get(userId);
      if (cached && this.isCacheValid(cached.last_updated)) {
        return cached.embedding;
      }

      // Get user features
      const userFeatures = await this.extractUserFeatures(userId);
      
      if (!this.userEmbeddingModel) {
        throw new Error('User embedding model not initialized');
      }

      // Generate embedding
      const featureTensor = tf.tensor2d([userFeatures]);
      const embeddingTensor = this.userEmbeddingModel.predict(featureTensor) as tf.Tensor;
      const embedding = Array.from(await embeddingTensor.data());
      
      // Cleanup tensors
      featureTensor.dispose();
      embeddingTensor.dispose();

      // Cache the result
      this.userEmbeddingCache.set(userId, {
        user_id: userId,
        embedding,
        last_updated: new Date()
      });

      return embedding;
    } catch (error) {
      logger.error('Failed to generate user embedding', { error, userId });
      throw error;
    }
  }

  async generateContentEmbedding(contentId: string, contentType: string): Promise<number[]> {
    try {
      // Check cache first
      const cached = this.contentEmbeddingCache.get(contentId);
      if (cached && this.isCacheValid(cached.last_updated)) {
        return cached.embedding;
      }

      // Get content features
      const contentFeatures = await this.extractContentFeatures(contentId, contentType);
      
      if (!this.contentEmbeddingModel) {
        throw new Error('Content embedding model not initialized');
      }

      // Generate embedding
      const featureTensor = tf.tensor2d([contentFeatures]);
      const embeddingTensor = this.contentEmbeddingModel.predict(featureTensor) as tf.Tensor;
      const embedding = Array.from(await embeddingTensor.data());
      
      // Cleanup tensors
      featureTensor.dispose();
      embeddingTensor.dispose();

      // Cache the result
      this.contentEmbeddingCache.set(contentId, {
        content_id: contentId,
        content_type: contentType,
        embedding,
        features: contentFeatures,
        last_updated: new Date()
      });

      return embedding;
    } catch (error) {
      logger.error('Failed to generate content embedding', { error, contentId });
      throw error;
    }
  }

  async predictInteraction(userId: string, contentId: string, context: any = {}): Promise<RecommendationScore> {
    try {
      const userEmbedding = await this.generateUserEmbedding(userId);
      const contentEmbedding = await this.generateContentEmbedding(contentId, context.content_type || 'post');
      const contextFeatures = this.extractContextFeatures(context);

      if (!this.interactionModel) {
        throw new Error('Interaction model not initialized');
      }

      // Predict interaction probability
      const userTensor = tf.tensor2d([userEmbedding]);
      const contentTensor = tf.tensor2d([contentEmbedding]);
      const contextTensor = tf.tensor2d([contextFeatures]);

      const prediction = this.interactionModel.predict([
        userTensor, 
        contentTensor, 
        contextTensor
      ]) as tf.Tensor;

      const score = (await prediction.data())[0];
      
      // Cleanup tensors
      userTensor.dispose();
      contentTensor.dispose();
      contextTensor.dispose();
      prediction.dispose();

      return {
        item_id: contentId,
        score,
        confidence: this.calculateConfidence(score, userEmbedding, contentEmbedding),
        reason: 'ML model prediction'
      };
    } catch (error) {
      logger.error('Failed to predict interaction', { error, userId, contentId });
      throw error;
    }
  }

  async getContentRecommendations(userId: string, limit: number = 10): Promise<RecommendationScore[]> {
    try {
      const userEmbedding = await this.generateUserEmbedding(userId);
      
      // Get candidate content (recent posts, trending, etc.)
      const candidates = await this.getCandidateContent(userId, limit * 5);
      
      const recommendations: RecommendationScore[] = [];
      
      for (const candidate of candidates) {
        try {
          const recommendation = await this.predictInteraction(
            userId, 
            candidate.id, 
            { content_type: candidate.content_type }
          );
          recommendations.push(recommendation);
        } catch (error) {
          logger.warn('Failed to score candidate', { error, candidateId: candidate.id });
        }
      }
      
      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get content recommendations', { error, userId });
      throw error;
    }
  }

  async getSimilarContent(contentId: string, limit: number = 10): Promise<RecommendationScore[]> {
    try {
      const targetEmbedding = await this.generateContentEmbedding(contentId, 'post');
      
      // Get all content embeddings (in practice, you'd use a vector database)
      const candidates = await this.getCandidateContent('', limit * 5);
      const similarities: RecommendationScore[] = [];
      
      for (const candidate of candidates) {
        if (candidate.id === contentId) continue;
        
        try {
          const candidateEmbedding = await this.generateContentEmbedding(
            candidate.id, 
            candidate.content_type
          );
          
          const similarity = this.cosineSimilarity(targetEmbedding, candidateEmbedding);
          
          similarities.push({
            item_id: candidate.id,
            score: similarity,
            confidence: Math.abs(similarity),
            reason: 'Content similarity'
          });
        } catch (error) {
          logger.warn('Failed to calculate similarity', { error, candidateId: candidate.id });
        }
      }
      
      return similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get similar content', { error, contentId });
      throw error;
    }
  }

  async trainModels(): Promise<void> {
    try {
      logger.info('Starting model training...');
      
      // Get training data
      const trainingData = await this.getTrainingData();
      
      if (trainingData.length < 1000) {
        logger.warn('Insufficient training data', { dataSize: trainingData.length });
        return;
      }

      // Prepare training datasets
      const { userFeatures, contentFeatures, interactions, labels } = await this.prepareTrainingData(trainingData);
      
      // Train user embedding model
      await this.trainUserEmbeddingModel(userFeatures);
      
      // Train content embedding model
      await this.trainContentEmbeddingModel(contentFeatures);
      
      // Train interaction model
      await this.trainInteractionModel(interactions, labels);
      
      // Save models
      await this.saveModels();
      
      logger.info('Model training completed');
    } catch (error) {
      logger.error('Failed to train models', { error });
      throw error;
    }
  }

  private async trainUserEmbeddingModel(userFeatures: number[][]): Promise<void> {
    if (!this.userEmbeddingModel) return;

    const xs = tf.tensor2d(userFeatures);
    const ys = xs; // Autoencoder-style training
    
    await this.userEmbeddingModel.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          logger.debug('User embedding training epoch', { epoch, loss: logs?.loss });
        }
      }
    });
    
    xs.dispose();
    ys.dispose();
  }

  private async trainContentEmbeddingModel(contentFeatures: number[][]): Promise<void> {
    if (!this.contentEmbeddingModel) return;

    const xs = tf.tensor2d(contentFeatures);
    const ys = xs; // Autoencoder-style training
    
    await this.contentEmbeddingModel.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          logger.debug('Content embedding training epoch', { epoch, loss: logs?.loss });
        }
      }
    });
    
    xs.dispose();
    ys.dispose();
  }

  private async trainInteractionModel(interactions: any[], labels: number[]): Promise<void> {
    if (!this.interactionModel) return;

    const userEmbeddings = [];
    const contentEmbeddings = [];
    const contextFeatures = [];
    
    for (const interaction of interactions) {
      userEmbeddings.push(await this.generateUserEmbedding(interaction.user_id));
      contentEmbeddings.push(await this.generateContentEmbedding(interaction.content_id, interaction.content_type));
      contextFeatures.push(this.extractContextFeatures(interaction.context));
    }
    
    const userTensor = tf.tensor2d(userEmbeddings);
    const contentTensor = tf.tensor2d(contentEmbeddings);
    const contextTensor = tf.tensor2d(contextFeatures);
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);
    
    await this.interactionModel.fit(
      [userTensor, contentTensor, contextTensor], 
      labelTensor, 
      {
        epochs: 100,
        batchSize: 64,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.debug('Interaction model training epoch', { 
              epoch, 
              loss: logs?.loss, 
              accuracy: logs?.acc 
            });
          }
        }
      }
    );
    
    // Cleanup tensors
    userTensor.dispose();
    contentTensor.dispose();
    contextTensor.dispose();
    labelTensor.dispose();
  }

  private async saveModels(): Promise<void> {
    const modelPath = config.ml.modelPath;
    
    if (this.userEmbeddingModel) {
      await this.userEmbeddingModel.save(`file://${modelPath}/user_embedding`);
    }
    
    if (this.contentEmbeddingModel) {
      await this.contentEmbeddingModel.save(`file://${modelPath}/content_embedding`);
    }
    
    if (this.interactionModel) {
      await this.interactionModel.save(`file://${modelPath}/user_content_interaction`);
    }
  }

  private async extractUserFeatures(userId: string): Promise<number[]> {
    const query = `
      SELECT 
        u.karma_score,
        u.post_count,
        u.comment_count,
        u.follower_count,
        u.following_count,
        EXTRACT(DAYS FROM NOW() - u.created_at) as account_age_days,
        EXTRACT(HOURS FROM NOW() - u.last_active_at) as hours_since_active,
        COUNT(DISTINCT cm.community_id) as community_count,
        AVG(p.upvote_count) as avg_post_upvotes,
        AVG(c.upvote_count) as avg_comment_upvotes
      FROM users u
      LEFT JOIN community_members cm ON u.id = cm.user_id
      LEFT JOIN posts p ON u.id = p.user_id AND p.created_at > NOW() - INTERVAL '30 days'
      LEFT JOIN comments c ON u.id = c.user_id AND c.created_at > NOW() - INTERVAL '30 days'
      WHERE u.id = $1
      GROUP BY u.id, u.karma_score, u.post_count, u.comment_count, 
               u.follower_count, u.following_count, u.created_at, u.last_active_at
    `;

    try {
      const result = await this.dbPool.query(query, [userId]);
      const user = result.rows[0];
      
      if (!user) {
        return new Array(this.userFeatureDim).fill(0);
      }

      // Normalize and extract features
      const features = [
        this.normalize(user.karma_score || 0, 0, 10000),
        this.normalize(user.post_count || 0, 0, 1000),
        this.normalize(user.comment_count || 0, 0, 5000),
        this.normalize(user.follower_count || 0, 0, 1000),
        this.normalize(user.following_count || 0, 0, 500),
        this.normalize(user.account_age_days || 0, 0, 365),
        this.normalize(user.hours_since_active || 0, 0, 168), // Week in hours
        this.normalize(user.community_count || 0, 0, 50),
        this.normalize(user.avg_post_upvotes || 0, 0, 100),
        this.normalize(user.avg_comment_upvotes || 0, 0, 50)
      ];

      // Pad or truncate to exact feature dimension
      while (features.length < this.userFeatureDim) {
        features.push(0);
      }
      
      return features.slice(0, this.userFeatureDim);
    } catch (error) {
      logger.error('Failed to extract user features', { error, userId });
      return new Array(this.userFeatureDim).fill(0);
    }
  }

  private async extractContentFeatures(contentId: string, contentType: string): Promise<number[]> {
    const query = `
      SELECT 
        p.upvote_count,
        p.downvote_count,
        p.comment_count,
        p.view_count,
        p.hot_score,
        LENGTH(p.title) as title_length,
        LENGTH(p.content) as content_length,
        EXTRACT(HOURS FROM NOW() - p.created_at) as hours_since_created,
        c.member_count as community_size,
        u.karma_score as author_karma,
        CASE WHEN p.is_nsfw THEN 1 ELSE 0 END as is_nsfw,
        CASE WHEN p.is_oc THEN 1 ELSE 0 END as is_oc
      FROM posts p
      JOIN communities c ON p.community_id = c.id
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;

    try {
      const result = await this.dbPool.query(query, [contentId]);
      const content = result.rows[0];
      
      if (!content) {
        return new Array(this.contentFeatureDim).fill(0);
      }

      // Normalize and extract features
      const features = [
        this.normalize(content.upvote_count || 0, 0, 1000),
        this.normalize(content.downvote_count || 0, 0, 100),
        this.normalize(content.comment_count || 0, 0, 500),
        this.normalize(content.view_count || 0, 0, 10000),
        this.normalize(content.hot_score || 0, 0, 100),
        this.normalize(content.title_length || 0, 0, 300),
        this.normalize(content.content_length || 0, 0, 10000),
        this.normalize(content.hours_since_created || 0, 0, 168),
        this.normalize(content.community_size || 0, 0, 100000),
        this.normalize(content.author_karma || 0, 0, 10000),
        content.is_nsfw || 0,
        content.is_oc || 0
      ];

      // Add content type encoding
      const contentTypeFeatures = this.encodeContentType(contentType);
      features.push(...contentTypeFeatures);

      // Pad or truncate to exact feature dimension
      while (features.length < this.contentFeatureDim) {
        features.push(0);
      }
      
      return features.slice(0, this.contentFeatureDim);
    } catch (error) {
      logger.error('Failed to extract content features', { error, contentId });
      return new Array(this.contentFeatureDim).fill(0);
    }
  }

  private extractContextFeatures(context: any): number[] {
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();
    
    return [
      this.normalize(hourOfDay, 0, 23),
      this.normalize(dayOfWeek, 0, 6),
      context.is_mobile ? 1 : 0,
      context.is_weekend ? 1 : 0,
      this.normalize(context.session_duration || 0, 0, 7200), // 2 hours max
      context.first_visit ? 1 : 0,
      this.normalize(context.pages_viewed || 0, 0, 100),
      this.normalize(context.previous_interactions || 0, 0, 50),
      context.from_notification ? 1 : 0,
      context.from_search ? 1 : 0
    ];
  }

  private encodeContentType(contentType: string): number[] {
    const types = ['text', 'link', 'image', 'video', 'poll'];
    const encoding = new Array(types.length).fill(0);
    const index = types.indexOf(contentType);
    if (index >= 0) {
      encoding[index] = 1;
    }
    return encoding;
  }

  private normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateConfidence(score: number, userEmbedding: number[], contentEmbedding: number[]): number {
    // Calculate confidence based on embedding magnitudes and score
    const userMagnitude = Math.sqrt(userEmbedding.reduce((sum, x) => sum + x * x, 0));
    const contentMagnitude = Math.sqrt(contentEmbedding.reduce((sum, x) => sum + x * x, 0));
    
    // Higher magnitudes indicate more confident embeddings
    const magnitudeConfidence = Math.min(1, (userMagnitude + contentMagnitude) / 2);
    
    // Score confidence (closer to 0.5 is less confident)
    const scoreConfidence = 1 - 2 * Math.abs(score - 0.5);
    
    return (magnitudeConfidence + scoreConfidence) / 2;
  }

  private isCacheValid(lastUpdated: Date, maxAgeMinutes: number = 60): boolean {
    const now = new Date();
    const ageMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    return ageMinutes < maxAgeMinutes;
  }

  private async getCandidateContent(excludeUserId: string, limit: number): Promise<any[]> {
    const query = `
      SELECT id, content_type, title
      FROM posts 
      WHERE is_published = true 
        AND is_removed = false
        AND created_at > NOW() - INTERVAL '7 days'
        ${excludeUserId ? 'AND user_id != $1' : ''}
      ORDER BY hot_score DESC, created_at DESC
      LIMIT $${excludeUserId ? '2' : '1'}
    `;

    const params = excludeUserId ? [excludeUserId, limit] : [limit];
    const result = await this.dbPool.query(query, params);
    return result.rows;
  }

  private async getTrainingData(): Promise<any[]> {
    // Get user interactions for training
    const query = `
      SELECT 
        v.user_id,
        v.target_id as content_id,
        'post' as content_type,
        v.vote_value,
        v.created_at,
        CASE WHEN v.vote_value > 0 THEN 1 ELSE 0 END as label
      FROM votes v
      WHERE v.target_type = 'post'
        AND v.created_at > NOW() - INTERVAL '30 days'
      ORDER BY v.created_at DESC
      LIMIT 100000
    `;

    const result = await this.dbPool.query(query);
    return result.rows;
  }

  private async prepareTrainingData(rawData: any[]): Promise<{
    userFeatures: number[][];
    contentFeatures: number[][];
    interactions: any[];
    labels: number[];
  }> {
    const userFeatures: number[][] = [];
    const contentFeatures: number[][] = [];
    const interactions: any[] = [];
    const labels: number[] = [];

    for (const interaction of rawData) {
      try {
        const userFeats = await this.extractUserFeatures(interaction.user_id);
        const contentFeats = await this.extractContentFeatures(interaction.content_id, interaction.content_type);
        
        userFeatures.push(userFeats);
        contentFeatures.push(contentFeats);
        interactions.push(interaction);
        labels.push(interaction.label);
      } catch (error) {
        logger.warn('Failed to prepare training sample', { error, interaction: interaction.content_id });
      }
    }

    return { userFeatures, contentFeatures, interactions, labels };
  }

  private async loadEmbeddingCaches(): Promise<void> {
    // In a production system, you'd load from a persistent cache like Redis
    // For now, we'll start with empty caches
    this.userEmbeddingCache.clear();
    this.contentEmbeddingCache.clear();
  }

  async getModelMetrics(): Promise<any> {
    return {
      user_embedding_cache_size: this.userEmbeddingCache.size,
      content_embedding_cache_size: this.contentEmbeddingCache.size,
      models_loaded: {
        user_embedding: !!this.userEmbeddingModel,
        content_embedding: !!this.contentEmbeddingModel,
        interaction: !!this.interactionModel
      },
      memory_usage: tf.memory()
    };
  }

  async shutdown(): Promise<void> {
    // Dispose of models
    this.userEmbeddingModel?.dispose();
    this.contentEmbeddingModel?.dispose();
    this.interactionModel?.dispose();
    
    // Clear caches
    this.userEmbeddingCache.clear();
    this.contentEmbeddingCache.clear();
    
    // Close database connection
    await this.dbPool.end();
  }
}

export const mlRecommendationEngine = new MLRecommendationEngine();