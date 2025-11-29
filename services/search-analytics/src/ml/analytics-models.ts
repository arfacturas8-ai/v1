/**
 * CRYB Platform - Analytics Machine Learning Models
 * Predictive analytics, anomaly detection, and trend analysis
 */

import * as tf from '@tensorflow/tfjs-node';
import { Pool } from 'pg';
import { timescaleClient } from '../analytics/timescale-client';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface PredictionResult {
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  confidence_score: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AnomalyDetectionResult {
  is_anomaly: boolean;
  anomaly_score: number;
  threshold: number;
  expected_range: {
    min: number;
    max: number;
  };
}

export interface UserBehaviorPrediction {
  user_id: string;
  churn_probability: number;
  engagement_prediction: number;
  lifetime_value_prediction: number;
  recommended_actions: string[];
}

export class MLAnalyticsEngine {
  private dbPool: Pool;
  
  // Models
  private timeSeriesForecastModel: tf.LayersModel | null = null;
  private anomalyDetectionModel: tf.LayersModel | null = null;
  private churnPredictionModel: tf.LayersModel | null = null;
  private engagementPredictionModel: tf.LayersModel | null = null;
  
  // Model configurations
  private readonly sequenceLength = 24; // 24 hours/days lookback
  private readonly forecastHorizon = 7; // Predict 7 periods ahead
  private readonly featureDim = 20;

  constructor() {
    this.dbPool = new Pool({
      connectionString: config.database.url,
      max: 10,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.loadOrCreateModels();
      logger.info('ML Analytics Engine initialized');
    } catch (error) {
      logger.error('Failed to initialize ML Analytics engine', { error });
      throw error;
    }
  }

  private async loadOrCreateModels(): Promise<void> {
    try {
      // Try to load existing models
      this.timeSeriesForecastModel = await this.loadModel('time_series_forecast');
      this.anomalyDetectionModel = await this.loadModel('anomaly_detection');
      this.churnPredictionModel = await this.loadModel('churn_prediction');
      this.engagementPredictionModel = await this.loadModel('engagement_prediction');
    } catch (error) {
      logger.warn('Could not load existing analytics models, creating new ones');
      await this.createModels();
    }
  }

  private async loadModel(modelName: string): Promise<tf.LayersModel> {
    const modelPath = `file://${config.ml.modelPath}/${modelName}/model.json`;
    return await tf.loadLayersModel(modelPath);
  }

  private async createModels(): Promise<void> {
    this.timeSeriesForecastModel = this.createTimeSeriesForecastModel();
    this.anomalyDetectionModel = this.createAnomalyDetectionModel();
    this.churnPredictionModel = this.createChurnPredictionModel();
    this.engagementPredictionModel = this.createEngagementPredictionModel();
    
    logger.info('Created new ML analytics models');
  }

  private createTimeSeriesForecastModel(): tf.LayersModel {
    const input = tf.input({ shape: [this.sequenceLength, this.featureDim] });
    
    // LSTM layers for time series prediction
    let x = tf.layers.lstm({ 
      units: 64, 
      returnSequences: true,
      dropout: 0.2,
      recurrentDropout: 0.2
    }).apply(input) as tf.SymbolicTensor;
    
    x = tf.layers.lstm({ 
      units: 32, 
      returnSequences: false,
      dropout: 0.2,
      recurrentDropout: 0.2
    }).apply(x) as tf.SymbolicTensor;
    
    // Dense layers for prediction
    x = tf.layers.dense({ units: 16, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.1 }).apply(x) as tf.SymbolicTensor;
    
    // Output: predict next values
    const output = tf.layers.dense({ 
      units: this.forecastHorizon,
      name: 'forecast_output'
    }).apply(x);
    
    const model = tf.model({ inputs: input, outputs: output });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  private createAnomalyDetectionModel(): tf.LayersModel {
    // Autoencoder for anomaly detection
    const inputDim = this.featureDim;
    const encodingDim = 8;
    
    const input = tf.input({ shape: [inputDim] });
    
    // Encoder
    let encoded = tf.layers.dense({ units: 16, activation: 'relu' }).apply(input) as tf.SymbolicTensor;
    encoded = tf.layers.dense({ units: encodingDim, activation: 'relu', name: 'encoding' }).apply(encoded) as tf.SymbolicTensor;
    
    // Decoder
    let decoded = tf.layers.dense({ units: 16, activation: 'relu' }).apply(encoded) as tf.SymbolicTensor;
    decoded = tf.layers.dense({ units: inputDim, activation: 'sigmoid' }).apply(decoded);
    
    const model = tf.model({ inputs: input, outputs: decoded });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  private createChurnPredictionModel(): tf.LayersModel {
    const input = tf.input({ shape: [30] }); // 30 user features
    
    // Deep neural network for churn prediction
    let x = tf.layers.dense({ units: 64, activation: 'relu' }).apply(input) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.3 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: 32, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: 16, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    
    // Output: churn probability
    const output = tf.layers.dense({ 
      units: 1, 
      activation: 'sigmoid',
      name: 'churn_probability'
    }).apply(x);
    
    const model = tf.model({ inputs: input, outputs: output });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });
    
    return model;
  }

  private createEngagementPredictionModel(): tf.LayersModel {
    const input = tf.input({ shape: [25] }); // 25 engagement features
    
    // Regression model for engagement prediction
    let x = tf.layers.dense({ units: 32, activation: 'relu' }).apply(input) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: 16, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
    
    // Output: engagement score
    const output = tf.layers.dense({ 
      units: 1, 
      activation: 'linear',
      name: 'engagement_score'
    }).apply(x);
    
    const model = tf.model({ inputs: input, outputs: output });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  // Time Series Forecasting
  async forecastMetric(
    metricName: string, 
    periods: number = 7,
    granularity: 'hour' | 'day' = 'day'
  ): Promise<PredictionResult[]> {
    try {
      // Get historical data
      const historicalData = await this.getHistoricalMetricData(metricName, granularity);
      
      if (historicalData.length < this.sequenceLength) {
        throw new Error('Insufficient historical data for forecasting');
      }

      // Prepare data for model
      const sequences = this.createSequences(historicalData, this.sequenceLength);
      const lastSequence = sequences[sequences.length - 1];
      
      if (!this.timeSeriesForecastModel) {
        throw new Error('Time series forecast model not initialized');
      }

      // Generate forecast
      const inputTensor = tf.tensor3d([lastSequence]);
      const forecastTensor = this.timeSeriesForecastModel.predict(inputTensor) as tf.Tensor;
      const forecast = Array.from(await forecastTensor.data());
      
      // Calculate confidence intervals (simplified)
      const historicalVariance = this.calculateVariance(historicalData);
      
      const results: PredictionResult[] = forecast.slice(0, periods).map((value, index) => {
        const confidenceMargin = Math.sqrt(historicalVariance) * (1 + index * 0.1);
        return {
          predicted_value: value,
          confidence_interval: {
            lower: value - confidenceMargin,
            upper: value + confidenceMargin
          },
          confidence_score: Math.max(0.1, 0.9 - index * 0.1),
          trend: this.determineTrend(historicalData.slice(-7).concat([value]))
        };
      });
      
      // Cleanup
      inputTensor.dispose();
      forecastTensor.dispose();
      
      return results;
    } catch (error) {
      logger.error('Failed to forecast metric', { error, metricName });
      throw error;
    }
  }

  // Anomaly Detection
  async detectAnomalies(metricName: string, timeWindow: string = '24h'): Promise<AnomalyDetectionResult[]> {
    try {
      // Get recent data
      const recentData = await this.getRecentMetricData(metricName, timeWindow);
      
      if (!this.anomalyDetectionModel) {
        throw new Error('Anomaly detection model not initialized');
      }

      const results: AnomalyDetectionResult[] = [];
      
      for (const dataPoint of recentData) {
        const features = this.extractAnomalyFeatures(dataPoint);
        const featureTensor = tf.tensor2d([features]);
        
        // Get reconstruction
        const reconstructionTensor = this.anomalyDetectionModel.predict(featureTensor) as tf.Tensor;
        const reconstruction = Array.from(await reconstructionTensor.data());
        
        // Calculate reconstruction error
        const reconstructionError = this.calculateMSE(features, reconstruction);
        
        // Determine if anomaly (threshold would be learned from training data)
        const threshold = 0.1; // This should be dynamically determined
        const isAnomaly = reconstructionError > threshold;
        
        // Calculate expected range
        const historicalStats = await this.getHistoricalStats(metricName);
        
        results.push({
          is_anomaly: isAnomaly,
          anomaly_score: reconstructionError,
          threshold,
          expected_range: {
            min: historicalStats.min,
            max: historicalStats.max
          }
        });
        
        // Cleanup
        featureTensor.dispose();
        reconstructionTensor.dispose();
      }
      
      return results;
    } catch (error) {
      logger.error('Failed to detect anomalies', { error, metricName });
      throw error;
    }
  }

  // User Behavior Prediction
  async predictUserBehavior(userId: string): Promise<UserBehaviorPrediction> {
    try {
      // Extract user features
      const userFeatures = await this.extractUserBehaviorFeatures(userId);
      
      if (!this.churnPredictionModel || !this.engagementPredictionModel) {
        throw new Error('User behavior models not initialized');
      }

      // Predict churn
      const churnFeatureTensor = tf.tensor2d([userFeatures.churn_features]);
      const churnPredictionTensor = this.churnPredictionModel.predict(churnFeatureTensor) as tf.Tensor;
      const churnProbability = (await churnPredictionTensor.data())[0];
      
      // Predict engagement
      const engagementFeatureTensor = tf.tensor2d([userFeatures.engagement_features]);
      const engagementPredictionTensor = this.engagementPredictionModel.predict(engagementFeatureTensor) as tf.Tensor;
      const engagementPrediction = (await engagementPredictionTensor.data())[0];
      
      // Calculate lifetime value (simplified)
      const lifetimeValuePrediction = this.calculateLifetimeValue(userFeatures, churnProbability, engagementPrediction);
      
      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(churnProbability, engagementPrediction, userFeatures);
      
      // Cleanup
      churnFeatureTensor.dispose();
      churnPredictionTensor.dispose();
      engagementFeatureTensor.dispose();
      engagementPredictionTensor.dispose();
      
      return {
        user_id: userId,
        churn_probability,
        engagement_prediction,
        lifetime_value_prediction: lifetimeValuePrediction,
        recommended_actions: recommendedActions
      };
    } catch (error) {
      logger.error('Failed to predict user behavior', { error, userId });
      throw error;
    }
  }

  // Content Performance Prediction
  async predictContentPerformance(contentFeatures: any): Promise<{
    predicted_upvotes: number;
    predicted_comments: number;
    predicted_views: number;
    virality_score: number;
  }> {
    try {
      // Extract features from content
      const features = this.extractContentPerformanceFeatures(contentFeatures);
      
      // Use ensemble of simple models for now (could be replaced with more sophisticated models)
      const predictedUpvotes = this.predictUpvotes(features);
      const predictedComments = this.predictComments(features);
      const predictedViews = this.predictViews(features);
      const viralityScore = this.calculateViralityScore(features);
      
      return {
        predicted_upvotes: predictedUpvotes,
        predicted_comments: predictedComments,
        predicted_views: predictedViews,
        virality_score: viralityScore
      };
    } catch (error) {
      logger.error('Failed to predict content performance', { error });
      throw error;
    }
  }

  // Model Training Methods
  async trainTimeSeriesModel(): Promise<void> {
    try {
      logger.info('Training time series forecasting model...');
      
      const trainingData = await this.getTimeSeriesTrainingData();
      const { sequences, targets } = this.prepareTimeSeriesData(trainingData);
      
      if (!this.timeSeriesForecastModel || sequences.length < 100) {
        logger.warn('Insufficient data for time series training');
        return;
      }

      const xTrain = tf.tensor3d(sequences);
      const yTrain = tf.tensor2d(targets);
      
      await this.timeSeriesForecastModel.fit(xTrain, yTrain, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.debug('Time series training epoch', { epoch, loss: logs?.loss });
          }
        }
      });
      
      xTrain.dispose();
      yTrain.dispose();
      
      logger.info('Time series model training completed');
    } catch (error) {
      logger.error('Failed to train time series model', { error });
      throw error;
    }
  }

  async trainAnomalyDetectionModel(): Promise<void> {
    try {
      logger.info('Training anomaly detection model...');
      
      const normalData = await this.getNormalMetricData();
      
      if (!this.anomalyDetectionModel || normalData.length < 1000) {
        logger.warn('Insufficient data for anomaly detection training');
        return;
      }

      const features = normalData.map(d => this.extractAnomalyFeatures(d));
      const xTrain = tf.tensor2d(features);
      
      await this.anomalyDetectionModel.fit(xTrain, xTrain, {
        epochs: 100,
        batchSize: 64,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.debug('Anomaly detection training epoch', { epoch, loss: logs?.loss });
          }
        }
      });
      
      xTrain.dispose();
      
      logger.info('Anomaly detection model training completed');
    } catch (error) {
      logger.error('Failed to train anomaly detection model', { error });
      throw error;
    }
  }

  async trainChurnModel(): Promise<void> {
    try {
      logger.info('Training churn prediction model...');
      
      const churnData = await this.getChurnTrainingData();
      
      if (!this.churnPredictionModel || churnData.length < 500) {
        logger.warn('Insufficient data for churn model training');
        return;
      }

      const { features, labels } = this.prepareChurnData(churnData);
      const xTrain = tf.tensor2d(features);
      const yTrain = tf.tensor2d(labels, [labels.length, 1]);
      
      await this.churnPredictionModel.fit(xTrain, yTrain, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        classWeight: { 0: 1, 1: 3 }, // Weight churn cases higher
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.debug('Churn model training epoch', { 
              epoch, 
              loss: logs?.loss, 
              accuracy: logs?.acc 
            });
          }
        }
      });
      
      xTrain.dispose();
      yTrain.dispose();
      
      logger.info('Churn model training completed');
    } catch (error) {
      logger.error('Failed to train churn model', { error });
      throw error;
    }
  }

  // Helper Methods
  private async getHistoricalMetricData(metricName: string, granularity: string): Promise<number[]> {
    const interval = granularity === 'hour' ? '1 hour' : '1 day';
    const query = `
      SELECT AVG(metric_value) as avg_value
      FROM platform_metrics 
      WHERE metric_name = $1
        AND time > NOW() - INTERVAL '${Math.max(this.sequenceLength * 2, 30)} ${granularity}s'
      GROUP BY time_bucket('${interval}', time)
      ORDER BY time_bucket('${interval}', time)
    `;

    const result = await this.dbPool.query(query, [metricName]);
    return result.rows.map(row => row.avg_value || 0);
  }

  private async getRecentMetricData(metricName: string, timeWindow: string): Promise<any[]> {
    const query = `
      SELECT *
      FROM platform_metrics 
      WHERE metric_name = $1
        AND time > NOW() - INTERVAL '${timeWindow}'
      ORDER BY time DESC
    `;

    const result = await this.dbPool.query(query, [metricName]);
    return result.rows;
  }

  private createSequences(data: number[], sequenceLength: number): number[][] {
    const sequences = [];
    for (let i = 0; i <= data.length - sequenceLength; i++) {
      sequences.push(data.slice(i, i + sequenceLength));
    }
    return sequences;
  }

  private calculateVariance(data: number[]): number {
    const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
    return variance;
  }

  private determineTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const slope = (data[data.length - 1] - data[0]) / (data.length - 1);
    const threshold = Math.abs(data[0]) * 0.05; // 5% threshold
    
    if (Math.abs(slope) < threshold) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }

  private extractAnomalyFeatures(dataPoint: any): number[] {
    // Extract features for anomaly detection
    const hour = new Date(dataPoint.time).getHours();
    const dayOfWeek = new Date(dataPoint.time).getDay();
    
    return [
      dataPoint.metric_value || 0,
      hour / 23, // Normalized hour
      dayOfWeek / 6, // Normalized day of week
      dataPoint.service_name === 'api' ? 1 : 0,
      dataPoint.service_name === 'web' ? 1 : 0,
      // Add more features as needed
      ...new Array(15).fill(0) // Pad to feature dimension
    ].slice(0, this.featureDim);
  }

  private calculateMSE(actual: number[], predicted: number[]): number {
    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
      sum += Math.pow(actual[i] - predicted[i], 2);
    }
    return sum / actual.length;
  }

  private async getHistoricalStats(metricName: string): Promise<{ min: number; max: number; mean: number }> {
    const query = `
      SELECT 
        MIN(metric_value) as min,
        MAX(metric_value) as max,
        AVG(metric_value) as mean
      FROM platform_metrics 
      WHERE metric_name = $1
        AND time > NOW() - INTERVAL '30 days'
    `;

    const result = await this.dbPool.query(query, [metricName]);
    return result.rows[0] || { min: 0, max: 100, mean: 50 };
  }

  private async extractUserBehaviorFeatures(userId: string): Promise<{
    churn_features: number[];
    engagement_features: number[];
  }> {
    // This would extract comprehensive user behavior features
    // For now, returning mock data structure
    return {
      churn_features: new Array(30).fill(0).map(() => Math.random()),
      engagement_features: new Array(25).fill(0).map(() => Math.random())
    };
  }

  private calculateLifetimeValue(userFeatures: any, churnProb: number, engagement: number): number {
    // Simplified LTV calculation
    const monthlyValue = engagement * 10; // Assuming engagement translates to value
    const expectedLifetimeMonths = (1 - churnProb) * 24; // Up to 2 years
    return monthlyValue * expectedLifetimeMonths;
  }

  private generateRecommendedActions(churnProb: number, engagement: number, features: any): string[] {
    const actions = [];
    
    if (churnProb > 0.7) {
      actions.push('High churn risk - implement retention campaign');
      actions.push('Send personalized content recommendations');
    }
    
    if (engagement < 0.3) {
      actions.push('Low engagement - suggest relevant communities');
      actions.push('Optimize notification frequency');
    }
    
    if (churnProb > 0.5 && engagement > 0.7) {
      actions.push('Engaged but at risk - offer premium features');
    }
    
    return actions;
  }

  private extractContentPerformanceFeatures(content: any): number[] {
    // Extract features that predict content performance
    return [
      content.title_length || 0,
      content.content_length || 0,
      content.author_karma || 0,
      content.community_size || 0,
      content.hour_of_day || 0,
      content.day_of_week || 0,
      content.is_weekend ? 1 : 0,
      content.has_media ? 1 : 0,
      content.is_oc ? 1 : 0,
      content.sentiment_score || 0
    ];
  }

  private predictUpvotes(features: number[]): number {
    // Simple linear model (would be replaced with trained model)
    return Math.max(0, features[2] * 0.1 + features[3] * 0.0001 + Math.random() * 10);
  }

  private predictComments(features: number[]): number {
    return Math.max(0, features[0] * 0.05 + features[1] * 0.001 + Math.random() * 5);
  }

  private predictViews(features: number[]): number {
    return Math.max(0, features[3] * 0.01 + features[7] * 50 + Math.random() * 100);
  }

  private calculateViralityScore(features: number[]): number {
    // Virality is often related to timing, content quality, and community engagement
    return Math.min(1, (features[2] + features[3] + features[8] + features[9]) / 4);
  }

  // Training data methods (simplified implementations)
  private async getTimeSeriesTrainingData(): Promise<any[]> {
    const query = `
      SELECT metric_name, metric_value, time
      FROM platform_metrics 
      WHERE time > NOW() - INTERVAL '90 days'
      ORDER BY metric_name, time
    `;
    
    const result = await this.dbPool.query(query);
    return result.rows;
  }

  private prepareTimeSeriesData(data: any[]): { sequences: number[][][]; targets: number[][] } {
    // Group by metric and create sequences
    const groupedData = this.groupByMetric(data);
    const sequences = [];
    const targets = [];
    
    for (const [metric, values] of Object.entries(groupedData)) {
      const metricSequences = this.createSequences(values as number[], this.sequenceLength);
      for (let i = 0; i < metricSequences.length - this.forecastHorizon; i++) {
        const sequence = metricSequences[i].map(val => [val]); // Add feature dimension
        const target = (values as number[]).slice(i + this.sequenceLength, i + this.sequenceLength + this.forecastHorizon);
        
        sequences.push(sequence);
        targets.push(target);
      }
    }
    
    return { sequences, targets };
  }

  private groupByMetric(data: any[]): Record<string, number[]> {
    const grouped: Record<string, number[]> = {};
    
    data.forEach(row => {
      if (!grouped[row.metric_name]) {
        grouped[row.metric_name] = [];
      }
      grouped[row.metric_name].push(row.metric_value);
    });
    
    return grouped;
  }

  private async getNormalMetricData(): Promise<any[]> {
    // Get data that represents normal system behavior
    const query = `
      SELECT *
      FROM platform_metrics 
      WHERE time > NOW() - INTERVAL '30 days'
        AND metric_name IN ('response_time', 'cpu_usage', 'memory_usage', 'request_count')
      ORDER BY time
    `;
    
    const result = await this.dbPool.query(query);
    return result.rows;
  }

  private async getChurnTrainingData(): Promise<any[]> {
    // Get historical user data with churn labels
    const query = `
      SELECT 
        user_id,
        CASE 
          WHEN last_active_at < NOW() - INTERVAL '30 days' THEN 1 
          ELSE 0 
        END as churned
      FROM users
      WHERE created_at < NOW() - INTERVAL '60 days'
    `;
    
    const result = await this.dbPool.query(query);
    return result.rows;
  }

  private prepareChurnData(data: any[]): { features: number[][]; labels: number[] } {
    // This would extract comprehensive features for each user
    // For now, returning mock structure
    const features = data.map(() => new Array(30).fill(0).map(() => Math.random()));
    const labels = data.map(row => row.churned);
    
    return { features, labels };
  }

  async saveModels(): Promise<void> {
    const modelPath = config.ml.modelPath;
    
    if (this.timeSeriesForecastModel) {
      await this.timeSeriesForecastModel.save(`file://${modelPath}/time_series_forecast`);
    }
    
    if (this.anomalyDetectionModel) {
      await this.anomalyDetectionModel.save(`file://${modelPath}/anomaly_detection`);
    }
    
    if (this.churnPredictionModel) {
      await this.churnPredictionModel.save(`file://${modelPath}/churn_prediction`);
    }
    
    if (this.engagementPredictionModel) {
      await this.engagementPredictionModel.save(`file://${modelPath}/engagement_prediction`);
    }
  }

  async getAnalyticsModelMetrics(): Promise<any> {
    return {
      models_loaded: {
        time_series_forecast: !!this.timeSeriesForecastModel,
        anomaly_detection: !!this.anomalyDetectionModel,
        churn_prediction: !!this.churnPredictionModel,
        engagement_prediction: !!this.engagementPredictionModel
      },
      memory_usage: tf.memory(),
      sequence_length: this.sequenceLength,
      forecast_horizon: this.forecastHorizon
    };
  }

  async shutdown(): Promise<void> {
    // Dispose of models
    this.timeSeriesForecastModel?.dispose();
    this.anomalyDetectionModel?.dispose();
    this.churnPredictionModel?.dispose();
    this.engagementPredictionModel?.dispose();
    
    // Close database connection
    await this.dbPool.end();
  }
}

export const mlAnalyticsEngine = new MLAnalyticsEngine();