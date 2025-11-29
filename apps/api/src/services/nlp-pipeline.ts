import * as natural from 'natural';
import * as compromise from 'compromise';
import Sentiment from 'sentiment';
import OpenAI from 'openai';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';
import { AIIntegrationService } from './ai-integration';

export interface NLPConfig {
  features: {
    sentimentAnalysis: boolean;
    entityExtraction: boolean;
    topicModeling: boolean;
    languageDetection: boolean;
    textClassification: boolean;
    keywordExtraction: boolean;
    textSummarization: boolean;
    intentDetection: boolean;
    emotionAnalysis: boolean;
    readabilityAnalysis: boolean;
  };
  models: {
    sentimentModel: string;
    classificationModel: string;
    topicModel: string;
    embeddingModel: string;
  };
  thresholds: {
    sentimentConfidence: number;
    entityConfidence: number;
    topicConfidence: number;
    classificationConfidence: number;
  };
  processing: {
    batchSize: number;
    maxTextLength: number;
    cacheEnabled: boolean;
    cacheTtl: number;
    parallelProcessing: boolean;
  };
  languages: {
    supported: string[];
    defaultLanguage: string;
    autoDetect: boolean;
  };
}

export interface TextAnalysisRequest {
  text: string;
  userId?: string;
  context?: {
    source: 'message' | 'post' | 'comment' | 'document';
    channelId?: string;
    serverId?: string;
    parentId?: string;
  };
  features?: {
    sentiment?: boolean;
    entities?: boolean;
    topics?: boolean;
    classification?: boolean;
    keywords?: boolean;
    summary?: boolean;
    intent?: boolean;
    emotion?: boolean;
    readability?: boolean;
    language?: boolean;
  };
  options?: {
    detailed?: boolean;
    includeConfidence?: boolean;
    includeAlternatives?: boolean;
  };
}

export interface TextAnalysisResponse {
  id: string;
  text: string;
  language: LanguageDetection;
  sentiment: SentimentAnalysis;
  entities: EntityExtraction[];
  topics: TopicModeling[];
  classification: TextClassification;
  keywords: KeywordExtraction[];
  summary: TextSummary;
  intent: IntentDetection;
  emotion: EmotionAnalysis;
  readability: ReadabilityAnalysis;
  metadata: {
    processingTime: number;
    timestamp: Date;
    confidence: number;
    modelVersions: { [feature: string]: string };
    features: string[];
    cached: boolean;
  };
}

export interface LanguageDetection {
  language: string;
  confidence: number;
  alternatives: {
    language: string;
    confidence: number;
  }[];
  script: string;
  region?: string;
}

export interface SentimentAnalysis {
  overall: {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number; // -1 to 1
    confidence: number;
    magnitude: number;
  };
  aspects: {
    aspect: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
    mentions: {
      text: string;
      position: { start: number; end: number };
    }[];
  }[];
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
    trust: number;
    anticipation: number;
  };
  subjectivity: number; // 0 (objective) to 1 (subjective)
  intensity: number; // 0 (mild) to 1 (intense)
}

export interface EntityExtraction {
  text: string;
  label: string;
  confidence: number;
  startOffset: number;
  endOffset: number;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'TIME' | 'MONEY' | 'PERCENT' | 'MISC';
  subtype?: string;
  canonicalForm?: string;
  linkedData?: {
    wikiId?: string;
    description?: string;
    category?: string;
  };
  attributes: {
    [key: string]: any;
  };
}

export interface TopicModeling {
  topic: string;
  probability: number;
  keywords: {
    word: string;
    weight: number;
    relevance: number;
  }[];
  category: string;
  subcategory?: string;
  coherence: number;
  prevalence: number;
}

export interface TextClassification {
  categories: {
    category: string;
    subcategory?: string;
    confidence: number;
    hierarchy: string[];
  }[];
  tags: {
    tag: string;
    confidence: number;
    relevance: number;
    source: 'model' | 'rule' | 'keyword';
  }[];
  genre: {
    type: string;
    confidence: number;
  };
  style: {
    formality: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
    register: 'academic' | 'professional' | 'conversational' | 'casual';
    complexity: 'simple' | 'moderate' | 'complex';
    tone: string[];
  };
}

export interface KeywordExtraction {
  keyword: string;
  score: number;
  frequency: number;
  positions: number[];
  context: string[];
  type: 'single' | 'phrase' | 'compound';
  stemmed: string;
  synonyms: string[];
  category?: string;
}

export interface TextSummary {
  extractive: {
    sentences: {
      text: string;
      score: number;
      position: number;
    }[];
    summary: string;
  };
  abstractive: {
    summary: string;
    keyPoints: string[];
    confidence: number;
  };
  metadata: {
    originalLength: number;
    summaryLength: number;
    compressionRatio: number;
    readingTime: {
      original: number;
      summary: number;
    };
  };
}

export interface IntentDetection {
  intent: string;
  confidence: number;
  category: 'question' | 'request' | 'command' | 'statement' | 'greeting' | 'complaint' | 'compliment';
  subcategory?: string;
  parameters: {
    [key: string]: {
      value: any;
      confidence: number;
    };
  };
  context: {
    domain: string;
    urgency: 'low' | 'medium' | 'high';
    politeness: number;
  };
}

export interface EmotionAnalysis {
  primary: {
    emotion: string;
    intensity: number;
    confidence: number;
  };
  secondary: {
    emotion: string;
    intensity: number;
    confidence: number;
  }[];
  valence: number; // -1 (negative) to 1 (positive)
  arousal: number; // 0 (calm) to 1 (excited)
  dominance: number; // 0 (submissive) to 1 (dominant)
  emotional_progression: {
    start: string;
    middle: string;
    end: string;
  };
}

export interface ReadabilityAnalysis {
  scores: {
    fleschKincaid: number;
    fleschReadingEase: number;
    gunningFog: number;
    smog: number;
    automatedReadability: number;
    colemanLiau: number;
  };
  grade: {
    level: number;
    description: string;
  };
  complexity: {
    lexical: number; // vocabulary complexity
    syntactic: number; // sentence structure complexity
    semantic: number; // meaning complexity
  };
  statistics: {
    sentences: number;
    words: number;
    characters: number;
    syllables: number;
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    avgCharactersPerWord: number;
  };
  recommendations: string[];
}

export interface BatchAnalysisRequest {
  texts: {
    id: string;
    text: string;
    context?: any;
  }[];
  features: string[];
  options?: {
    parallel?: boolean;
    priority?: 'low' | 'normal' | 'high';
    callback?: string; // webhook URL
  };
}

export interface BatchAnalysisResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  results?: TextAnalysisResponse[];
  errors?: {
    id: string;
    error: string;
  }[];
  metadata: {
    startTime: Date;
    endTime?: Date;
    processingTime?: number;
    estimatedTimeRemaining?: number;
  };
}

export class NLPPipelineService {
  private config: NLPConfig;
  private aiService: AIIntegrationService;
  private openai: OpenAI | null = null;
  private redis: Redis;
  private queue: Queue;
  
  // Core NLP tools
  private sentiment: Sentiment;
  private tokenizer: natural.WordTokenizer;
  private stemmer: natural.PorterStemmer;
  private tfidf: natural.TfIdf;
  
  // Caches
  private analysisCache: Map<string, { result: TextAnalysisResponse; timestamp: number }> = new Map();
  private languageCache: Map<string, { language: string; confidence: number; timestamp: number }> = new Map();
  private embeddingCache: Map<string, { embedding: number[]; timestamp: number }> = new Map();
  
  // Models and data
  private stopWords: Set<string> = new Set();
  private languagePatterns: Map<string, RegExp> = new Map();
  private topicModels: Map<string, any> = new Map();
  private intentPatterns: Map<string, { pattern: RegExp; intent: string; category: string }[]> = new Map();
  
  // Batch processing
  private batchJobs: Map<string, BatchAnalysisResponse> = new Map();
  private processingQueues: Map<string, any[]> = new Map();
  
  // Metrics
  private metrics = {
    totalAnalyses: 0,
    averageProcessingTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    featureUsage: {} as { [feature: string]: number }
  };
  
  private isHealthy: boolean = true;

  constructor(aiService: AIIntegrationService, moderationQueue: Queue) {
    this.aiService = aiService;
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    
    // Initialize Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
    
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000,
        maxRetries: 3,
      });
    }
    
    this.initializeNLPTools();
    this.loadLanguageModels();
    this.startBatchProcessing();
    this.startCacheCleanup();
    this.startMetricsTracking();
    
    console.log('📝 NLP Pipeline Service initialized');
  }

  /**
   * Initialize core NLP tools and libraries
   */
  private initializeNLPTools(): void {
    try {
      // Initialize sentiment analyzer
      this.sentiment = new Sentiment();
      
      // Initialize tokenizer
      this.tokenizer = new natural.WordTokenizer();
      
      // Initialize stemmer
      this.stemmer = natural.PorterStemmer;
      
      // Initialize TF-IDF
      this.tfidf = new natural.TfIdf();
      
      // Load stop words
      this.loadStopWords();
      
      console.log('✅ NLP tools initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NLP tools:', error);
      this.isHealthy = false;
    }
  }

  /**
   * Load language models and patterns
   */
  private async loadLanguageModels(): Promise<void> {
    try {
      // Load language detection patterns
      this.languagePatterns.set('en', /^[a-zA-Z\s.,!?;:()\[\]{}"'-]+$/);
      this.languagePatterns.set('es', /[ñáéíóúüÁÉÍÓÚÜÑ]/);
      this.languagePatterns.set('fr', /[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/);
      this.languagePatterns.set('de', /[äöüßÄÖÜ]/);
      this.languagePatterns.set('it', /[àèéìíîòóùÀÈÉÌÍÎÒÓÙ]/);
      
      // Load intent patterns
      this.loadIntentPatterns();
      
      console.log('✅ Language models loaded successfully');
    } catch (error) {
      console.warn('⚠️ Failed to load some language models:', error);
    }
  }

  /**
   * Comprehensive text analysis
   */
  async analyzeText(request: TextAnalysisRequest): Promise<TextAnalysisResponse> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId(request.text, request.userId);
    
    try {
      // Validate input
      this.validateAnalysisRequest(request);
      
      // Check cache
      if (this.config.processing.cacheEnabled) {
        const cached = await this.getCachedAnalysis(analysisId);
        if (cached) {
          this.metrics.cacheHitRate += 1;
          return { ...cached, metadata: { ...cached.metadata, cached: true } };
        }
      }
      
      // Initialize response
      const response: TextAnalysisResponse = {
        id: analysisId,
        text: request.text,
        language: { language: 'unknown', confidence: 0, alternatives: [], script: 'unknown' },
        sentiment: this.getDefaultSentiment(),
        entities: [],
        topics: [],
        classification: this.getDefaultClassification(),
        keywords: [],
        summary: this.getDefaultSummary(),
        intent: this.getDefaultIntent(),
        emotion: this.getDefaultEmotion(),
        readability: this.getDefaultReadability(),
        metadata: {
          processingTime: 0,
          timestamp: new Date(),
          confidence: 0,
          modelVersions: {},
          features: [],
          cached: false
        }
      };
      
      // Determine which features to analyze
      const features = this.determineFeatures(request.features);
      response.metadata.features = features;
      
      // Parallel analysis pipeline
      const analysisPromises: Promise<void>[] = [];
      
      // Language Detection
      if (features.includes('language') && this.config.features.languageDetection) {
        analysisPromises.push(
          this.detectLanguage(request.text)
            .then(lang => { response.language = lang; })
            .catch(error => console.error('Language detection failed:', error))
        );
      }
      
      // Sentiment Analysis
      if (features.includes('sentiment') && this.config.features.sentimentAnalysis) {
        analysisPromises.push(
          this.analyzeSentiment(request.text)
            .then(sentiment => { response.sentiment = sentiment; })
            .catch(error => console.error('Sentiment analysis failed:', error))
        );
      }
      
      // Entity Extraction
      if (features.includes('entities') && this.config.features.entityExtraction) {
        analysisPromises.push(
          this.extractEntities(request.text)
            .then(entities => { response.entities = entities; })
            .catch(error => console.error('Entity extraction failed:', error))
        );
      }
      
      // Topic Modeling
      if (features.includes('topics') && this.config.features.topicModeling) {
        analysisPromises.push(
          this.modelTopics(request.text)
            .then(topics => { response.topics = topics; })
            .catch(error => console.error('Topic modeling failed:', error))
        );
      }
      
      // Text Classification
      if (features.includes('classification') && this.config.features.textClassification) {
        analysisPromises.push(
          this.classifyText(request.text)
            .then(classification => { response.classification = classification; })
            .catch(error => console.error('Text classification failed:', error))
        );
      }
      
      // Keyword Extraction
      if (features.includes('keywords') && this.config.features.keywordExtraction) {
        analysisPromises.push(
          this.extractKeywords(request.text)
            .then(keywords => { response.keywords = keywords; })
            .catch(error => console.error('Keyword extraction failed:', error))
        );
      }
      
      // Text Summarization
      if (features.includes('summary') && this.config.features.textSummarization) {
        analysisPromises.push(
          this.summarizeText(request.text)
            .then(summary => { response.summary = summary; })
            .catch(error => console.error('Text summarization failed:', error))
        );
      }
      
      // Intent Detection
      if (features.includes('intent') && this.config.features.intentDetection) {
        analysisPromises.push(
          this.detectIntent(request.text)
            .then(intent => { response.intent = intent; })
            .catch(error => console.error('Intent detection failed:', error))
        );
      }
      
      // Emotion Analysis
      if (features.includes('emotion') && this.config.features.emotionAnalysis) {
        analysisPromises.push(
          this.analyzeEmotion(request.text)
            .then(emotion => { response.emotion = emotion; })
            .catch(error => console.error('Emotion analysis failed:', error))
        );
      }
      
      // Readability Analysis
      if (features.includes('readability') && this.config.features.readabilityAnalysis) {
        analysisPromises.push(
          this.analyzeReadability(request.text)
            .then(readability => { response.readability = readability; })
            .catch(error => console.error('Readability analysis failed:', error))
        );
      }
      
      // Wait for all analyses to complete
      if (this.config.processing.parallelProcessing) {
        await Promise.all(analysisPromises);
      } else {
        // Sequential processing
        for (const promise of analysisPromises) {
          await promise;
        }
      }
      
      // Calculate overall confidence
      response.metadata.confidence = this.calculateOverallConfidence(response, features);
      response.metadata.processingTime = Date.now() - startTime;
      response.metadata.modelVersions = this.getModelVersions(features);
      
      // Cache result
      if (this.config.processing.cacheEnabled) {
        await this.cacheAnalysis(analysisId, response);
      }
      
      // Update metrics
      this.updateMetrics(features, Date.now() - startTime);
      
      // Log analysis
      console.log(`📝 Text analysis completed: ${features.join(', ')} (${response.metadata.processingTime}ms)`);
      
      return response;
    } catch (error) {
      console.error('Text analysis failed:', error);
      this.metrics.errorRate += 1;
      throw error;
    }
  }

  /**
   * Language detection with multiple algorithms
   */
  private async detectLanguage(text: string): Promise<LanguageDetection> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey('language', text);
      const cached = this.languageCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.processing.cacheTtl) {
        return {
          language: cached.language,
          confidence: cached.confidence,
          alternatives: [],
          script: this.detectScript(text)
        };
      }
      
      const alternatives: { language: string; confidence: number }[] = [];
      let bestMatch = { language: 'en', confidence: 0.3 };
      
      // Pattern-based detection
      for (const [lang, pattern] of this.languagePatterns.entries()) {
        const matches = text.match(pattern);
        if (matches) {
          const confidence = Math.min(matches.length / text.length * 2, 1.0);
          if (confidence > bestMatch.confidence) {
            if (bestMatch.confidence > 0.1) {
              alternatives.push(bestMatch);
            }
            bestMatch = { language: lang, confidence };
          } else if (confidence > 0.1) {
            alternatives.push({ language: lang, confidence });
          }
        }
      }
      
      // Character frequency analysis
      const charFreq = this.analyzeCharacterFrequency(text);
      const langFromCharFreq = this.detectLanguageFromCharFreq(charFreq);
      if (langFromCharFreq.confidence > bestMatch.confidence) {
        alternatives.push(bestMatch);
        bestMatch = langFromCharFreq;
      }
      
      // Use OpenAI for additional validation if available
      if (this.openai && bestMatch.confidence < 0.8) {
        try {
          const aiDetection = await this.detectLanguageWithOpenAI(text);
          if (aiDetection.confidence > bestMatch.confidence) {
            alternatives.push(bestMatch);
            bestMatch = aiDetection;
          }
        } catch (error) {
          console.warn('OpenAI language detection failed:', error);
        }
      }
      
      // Cache result
      this.languageCache.set(cacheKey, {
        language: bestMatch.language,
        confidence: bestMatch.confidence,
        timestamp: Date.now()
      });
      
      return {
        language: bestMatch.language,
        confidence: bestMatch.confidence,
        alternatives: alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 3),
        script: this.detectScript(text),
        region: this.detectRegion(text, bestMatch.language)
      };
    } catch (error) {
      console.error('Language detection failed:', error);
      return {
        language: this.config.languages.defaultLanguage,
        confidence: 0.1,
        alternatives: [],
        script: 'unknown'
      };
    }
  }

  /**
   * Advanced sentiment analysis with aspect detection
   */
  private async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      // Basic sentiment analysis
      const basicSentiment = this.sentiment.analyze(text);
      
      // Normalize score to -1 to 1 range
      const normalizedScore = Math.max(-1, Math.min(1, basicSentiment.comparative));
      const sentiment = normalizedScore > 0.1 ? 'positive' : normalizedScore < -0.1 ? 'negative' : 'neutral';
      
      // Aspect-based sentiment analysis
      const aspects = await this.detectAspectSentiment(text);
      
      // Emotion analysis from sentiment
      const emotions = this.extractEmotionsFromSentiment(text, basicSentiment);
      
      // Calculate subjectivity and intensity
      const subjectivity = this.calculateSubjectivity(text);
      const intensity = Math.abs(normalizedScore);
      
      return {
        overall: {
          sentiment,
          score: normalizedScore,
          confidence: Math.min(Math.abs(normalizedScore) + 0.3, 1.0),
          magnitude: intensity
        },
        aspects,
        emotions,
        subjectivity,
        intensity
      };
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return this.getDefaultSentiment();
    }
  }

  /**
   * Named Entity Recognition and extraction
   */
  private async extractEntities(text: string): Promise<EntityExtraction[]> {
    try {
      const entities: EntityExtraction[] = [];
      
      // Use compromise for basic entity extraction
      const doc = compromise(text);
      
      // Extract people
      const people = doc.people().out('array');
      people.forEach((person, index) => {
        const matches = text.toLowerCase().indexOf(person.toLowerCase());
        if (matches !== -1) {
          entities.push({
            text: person,
            label: 'PERSON',
            confidence: 0.8,
            startOffset: matches,
            endOffset: matches + person.length,
            type: 'PERSON',
            attributes: {}
          });
        }
      });
      
      // Extract places
      const places = doc.places().out('array');
      places.forEach((place, index) => {
        const matches = text.toLowerCase().indexOf(place.toLowerCase());
        if (matches !== -1) {
          entities.push({
            text: place,
            label: 'LOCATION',
            confidence: 0.7,
            startOffset: matches,
            endOffset: matches + place.length,
            type: 'LOCATION',
            attributes: {}
          });
        }
      });
      
      // Extract organizations
      const orgs = doc.organizations().out('array');
      orgs.forEach((org, index) => {
        const matches = text.toLowerCase().indexOf(org.toLowerCase());
        if (matches !== -1) {
          entities.push({
            text: org,
            label: 'ORGANIZATION',
            confidence: 0.7,
            startOffset: matches,
            endOffset: matches + org.length,
            type: 'ORGANIZATION',
            attributes: {}
          });
        }
      });
      
      // Extract dates and times
      const dates = doc.dates().out('array');
      dates.forEach((date, index) => {
        const matches = text.toLowerCase().indexOf(date.toLowerCase());
        if (matches !== -1) {
          entities.push({
            text: date,
            label: 'DATE',
            confidence: 0.9,
            startOffset: matches,
            endOffset: matches + date.length,
            type: 'DATE',
            attributes: {}
          });
        }
      });
      
      // Extract money and percentages with regex
      this.extractPatternEntities(text, entities);
      
      // Use OpenAI for enhanced entity extraction if available
      if (this.openai && entities.length < 5) {
        try {
          const aiEntities = await this.extractEntitiesWithOpenAI(text);
          entities.push(...aiEntities);
        } catch (error) {
          console.warn('OpenAI entity extraction failed:', error);
        }
      }
      
      // Remove duplicates and sort by confidence
      const uniqueEntities = this.removeDuplicateEntities(entities);
      return uniqueEntities.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return [];
    }
  }

  /**
   * Topic modeling and categorization
   */
  private async modelTopics(text: string): Promise<TopicModeling[]> {
    try {
      const topics: TopicModeling[] = [];
      
      // Keyword-based topic detection
      const keywords = await this.extractKeywords(text);
      const topicCandidates = this.groupKeywordsByTopic(keywords);
      
      // Use TF-IDF for topic coherence
      this.tfidf.addDocument(text);
      
      for (const [topic, topicKeywords] of Object.entries(topicCandidates)) {
        const probability = this.calculateTopicProbability(topicKeywords, keywords);
        const coherence = this.calculateTopicCoherence(topicKeywords);
        
        if (probability > this.config.thresholds.topicConfidence) {
          topics.push({
            topic,
            probability,
            keywords: topicKeywords.map(kw => ({
              word: kw.keyword,
              weight: kw.score,
              relevance: kw.frequency / keywords.length
            })),
            category: this.categorizeTopicKeywords(topicKeywords),
            coherence,
            prevalence: probability
          });
        }
      }
      
      // Use OpenAI for advanced topic modeling
      if (this.openai && topics.length < 3) {
        try {
          const aiTopics = await this.modelTopicsWithOpenAI(text);
          topics.push(...aiTopics);
        } catch (error) {
          console.warn('OpenAI topic modeling failed:', error);
        }
      }
      
      return topics.sort((a, b) => b.probability - a.probability).slice(0, 5);
    } catch (error) {
      console.error('Topic modeling failed:', error);
      return [];
    }
  }

  /**
   * Text classification and categorization
   */
  private async classifyText(text: string): Promise<TextClassification> {
    try {
      // Rule-based classification
      const ruleBasedCategories = this.classifyWithRules(text);
      
      // Keyword-based classification
      const keywords = await this.extractKeywords(text);
      const keywordCategories = this.classifyWithKeywords(keywords);
      
      // Style analysis
      const style = this.analyzeTextStyle(text);
      
      // Combine classifications
      const allCategories = [...ruleBasedCategories, ...keywordCategories];
      const uniqueCategories = this.mergeCategories(allCategories);
      
      // Generate tags
      const tags = this.generateTags(text, keywords, uniqueCategories);
      
      // Determine genre
      const genre = this.determineGenre(text, uniqueCategories);
      
      return {
        categories: uniqueCategories.slice(0, 5),
        tags: tags.slice(0, 10),
        genre,
        style
      };
    } catch (error) {
      console.error('Text classification failed:', error);
      return this.getDefaultClassification();
    }
  }

  /**
   * Keyword extraction with multiple algorithms
   */
  private async extractKeywords(text: string): Promise<KeywordExtraction[]> {
    try {
      const keywords: KeywordExtraction[] = [];
      
      // Tokenize text
      const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
      const cleanTokens = tokens.filter(token => 
        token.length > 2 && 
        !this.stopWords.has(token) && 
        /^[a-zA-Z]+$/.test(token)
      );
      
      // Calculate frequency
      const frequency: { [word: string]: number } = {};
      const positions: { [word: string]: number[] } = {};
      
      cleanTokens.forEach((token, index) => {
        frequency[token] = (frequency[token] || 0) + 1;
        if (!positions[token]) positions[token] = [];
        positions[token].push(index);
      });
      
      // Calculate TF-IDF scores
      this.tfidf.addDocument(cleanTokens.join(' '));
      const tfidfScores: { [word: string]: number } = {};
      
      this.tfidf.listTerms(0).forEach(item => {
        tfidfScores[item.term] = item.tfidf;
      });
      
      // Create keyword objects
      for (const [word, freq] of Object.entries(frequency)) {
        const stemmed = this.stemmer.stem(word);
        const tfidfScore = tfidfScores[word] || 0;
        const score = (freq / cleanTokens.length) * 0.5 + tfidfScore * 0.5;
        
        if (score > 0.1) {
          keywords.push({
            keyword: word,
            score,
            frequency: freq,
            positions: positions[word],
            context: this.getKeywordContext(text, word, positions[word]),
            type: word.includes(' ') ? 'phrase' : 'single',
            stemmed,
            synonyms: await this.findSynonyms(word),
            category: this.categorizeKeyword(word)
          });
        }
      }
      
      // Extract phrases
      const phrases = this.extractPhrases(text);
      keywords.push(...phrases);
      
      return keywords.sort((a, b) => b.score - a.score).slice(0, 20);
    } catch (error) {
      console.error('Keyword extraction failed:', error);
      return [];
    }
  }

  /**
   * Text summarization (extractive and abstractive)
   */
  private async summarizeText(text: string): Promise<TextSummary> {
    try {
      const sentences = this.segmentSentences(text);
      
      // Extractive summarization
      const extractive = await this.extractiveSummarization(sentences);
      
      // Abstractive summarization using OpenAI if available
      let abstractive = {
        summary: extractive.summary,
        keyPoints: [],
        confidence: 0.6
      };
      
      if (this.openai && text.length > 500) {
        try {
          abstractive = await this.abstractiveSummarization(text);
        } catch (error) {
          console.warn('Abstractive summarization failed:', error);
        }
      }
      
      // Calculate metadata
      const originalWords = text.split(/\s+/).length;
      const summaryWords = extractive.summary.split(/\s+/).length;
      
      return {
        extractive,
        abstractive,
        metadata: {
          originalLength: originalWords,
          summaryLength: summaryWords,
          compressionRatio: summaryWords / originalWords,
          readingTime: {
            original: Math.ceil(originalWords / 200),
            summary: Math.ceil(summaryWords / 200)
          }
        }
      };
    } catch (error) {
      console.error('Text summarization failed:', error);
      return this.getDefaultSummary();
    }
  }

  /**
   * Intent detection and parameter extraction
   */
  private async detectIntent(text: string): Promise<IntentDetection> {
    try {
      const lowerText = text.toLowerCase();
      let bestMatch = {
        intent: 'general',
        confidence: 0.3,
        category: 'statement' as const,
        subcategory: undefined,
        parameters: {}
      };
      
      // Pattern-based intent detection
      for (const [category, patterns] of this.intentPatterns.entries()) {
        for (const pattern of patterns) {
          const match = lowerText.match(pattern.pattern);
          if (match) {
            const confidence = 0.8 + (match[0].length / text.length) * 0.2;
            if (confidence > bestMatch.confidence) {
              bestMatch = {
                intent: pattern.intent,
                confidence: Math.min(confidence, 1.0),
                category: pattern.category as any,
                subcategory: undefined,
                parameters: this.extractParameters(text, match)
              };
            }
          }
        }
      }
      
      // Analyze context and politeness
      const context = this.analyzeIntentContext(text);
      
      return {
        intent: bestMatch.intent,
        confidence: bestMatch.confidence,
        category: bestMatch.category,
        subcategory: bestMatch.subcategory,
        parameters: bestMatch.parameters,
        context
      };
    } catch (error) {
      console.error('Intent detection failed:', error);
      return this.getDefaultIntent();
    }
  }

  /**
   * Emotion analysis with multiple dimensions
   */
  private async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    try {
      // Basic emotion detection using keywords
      const emotions = this.detectEmotionKeywords(text);
      
      // Calculate VAD (Valence, Arousal, Dominance)
      const vad = this.calculateVAD(text, emotions);
      
      // Analyze emotional progression
      const progression = this.analyzeEmotionalProgression(text);
      
      // Find primary and secondary emotions
      const sortedEmotions = Object.entries(emotions)
        .map(([emotion, intensity]) => ({ emotion, intensity, confidence: 0.7 }))
        .sort((a, b) => b.intensity - a.intensity);
      
      const primary = sortedEmotions[0] || { emotion: 'neutral', intensity: 0.5, confidence: 0.5 };
      const secondary = sortedEmotions.slice(1, 3);
      
      return {
        primary,
        secondary,
        valence: vad.valence,
        arousal: vad.arousal,
        dominance: vad.dominance,
        emotional_progression: progression
      };
    } catch (error) {
      console.error('Emotion analysis failed:', error);
      return this.getDefaultEmotion();
    }
  }

  /**
   * Comprehensive readability analysis
   */
  private async analyzeReadability(text: string): Promise<ReadabilityAnalysis> {
    try {
      const stats = this.calculateTextStatistics(text);
      const scores = this.calculateReadabilityScores(stats);
      const complexity = this.analyzeComplexity(text, stats);
      const recommendations = this.generateReadabilityRecommendations(scores, complexity);
      
      return {
        scores,
        grade: this.determineGradeLevel(scores),
        complexity,
        statistics: stats,
        recommendations
      };
    } catch (error) {
      console.error('Readability analysis failed:', error);
      return this.getDefaultReadability();
    }
  }

  /**
   * Batch processing for multiple texts
   */
  async analyzeTextBatch(request: BatchAnalysisRequest): Promise<BatchAnalysisResponse> {
    const jobId = this.generateJobId();
    const startTime = new Date();
    
    try {
      // Initialize batch job
      const batchResponse: BatchAnalysisResponse = {
        jobId,
        status: 'queued',
        progress: {
          total: request.texts.length,
          completed: 0,
          failed: 0,
          percentage: 0
        },
        results: [],
        errors: [],
        metadata: {
          startTime
        }
      };
      
      this.batchJobs.set(jobId, batchResponse);
      
      // Process texts
      if (request.options?.parallel !== false && this.config.processing.parallelProcessing) {
        await this.processBatchParallel(jobId, request);
      } else {
        await this.processBatchSequential(jobId, request);
      }
      
      return this.batchJobs.get(jobId)!;
    } catch (error) {
      console.error('Batch analysis failed:', error);
      const errorResponse = this.batchJobs.get(jobId);
      if (errorResponse) {
        errorResponse.status = 'failed';
        errorResponse.metadata.endTime = new Date();
      }
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private validateAnalysisRequest(request: TextAnalysisRequest): void {
    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
    
    if (request.text.length > this.config.processing.maxTextLength) {
      throw new Error(`Text too long: ${request.text.length} > ${this.config.processing.maxTextLength}`);
    }
  }

  private generateAnalysisId(text: string, userId?: string): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(text + (userId || '') + Date.now())
      .digest('hex');
    return `nlp_${hash.substring(0, 16)}`;
  }

  private generateCacheKey(type: string, content: string): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(type + content)
      .digest('hex');
    return `${type}_${hash}`;
  }

  private generateJobId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private determineFeatures(requestFeatures?: any): string[] {
    const defaultFeatures = ['language', 'sentiment', 'entities', 'keywords'];
    
    if (!requestFeatures) {
      return defaultFeatures;
    }
    
    const features: string[] = [];
    
    if (requestFeatures.language !== false) features.push('language');
    if (requestFeatures.sentiment !== false) features.push('sentiment');
    if (requestFeatures.entities !== false) features.push('entities');
    if (requestFeatures.topics) features.push('topics');
    if (requestFeatures.classification) features.push('classification');
    if (requestFeatures.keywords !== false) features.push('keywords');
    if (requestFeatures.summary) features.push('summary');
    if (requestFeatures.intent) features.push('intent');
    if (requestFeatures.emotion) features.push('emotion');
    if (requestFeatures.readability) features.push('readability');
    
    return features.length > 0 ? features : defaultFeatures;
  }

  private calculateOverallConfidence(response: TextAnalysisResponse, features: string[]): number {
    let totalConfidence = 0;
    let count = 0;
    
    if (features.includes('language')) {
      totalConfidence += response.language.confidence;
      count++;
    }
    
    if (features.includes('sentiment')) {
      totalConfidence += response.sentiment.overall.confidence;
      count++;
    }
    
    if (features.includes('entities') && response.entities.length > 0) {
      const avgEntityConfidence = response.entities.reduce((sum, e) => sum + e.confidence, 0) / response.entities.length;
      totalConfidence += avgEntityConfidence;
      count++;
    }
    
    if (features.includes('topics') && response.topics.length > 0) {
      const avgTopicConfidence = response.topics.reduce((sum, t) => sum + t.probability, 0) / response.topics.length;
      totalConfidence += avgTopicConfidence;
      count++;
    }
    
    return count > 0 ? totalConfidence / count : 0.5;
  }

  private getModelVersions(features: string[]): { [feature: string]: string } {
    const versions: { [feature: string]: string } = {};
    
    features.forEach(feature => {
      versions[feature] = '1.0.0'; // Would use actual model versions
    });
    
    return versions;
  }

  // Default response generators
  private getDefaultSentiment(): SentimentAnalysis {
    return {
      overall: {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.3,
        magnitude: 0
      },
      aspects: [],
      emotions: {
        joy: 0.1,
        anger: 0.1,
        fear: 0.1,
        sadness: 0.1,
        surprise: 0.1,
        disgust: 0.1,
        trust: 0.1,
        anticipation: 0.1
      },
      subjectivity: 0.5,
      intensity: 0.1
    };
  }

  private getDefaultClassification(): TextClassification {
    return {
      categories: [
        {
          category: 'general',
          confidence: 0.5,
          hierarchy: ['content', 'text', 'general']
        }
      ],
      tags: [
        {
          tag: 'text',
          confidence: 0.8,
          relevance: 1.0,
          source: 'rule'
        }
      ],
      genre: {
        type: 'conversational',
        confidence: 0.6
      },
      style: {
        formality: 'neutral',
        register: 'conversational',
        complexity: 'moderate',
        tone: ['neutral']
      }
    };
  }

  private getDefaultSummary(): TextSummary {
    return {
      extractive: {
        sentences: [],
        summary: ''
      },
      abstractive: {
        summary: '',
        keyPoints: [],
        confidence: 0
      },
      metadata: {
        originalLength: 0,
        summaryLength: 0,
        compressionRatio: 0,
        readingTime: {
          original: 0,
          summary: 0
        }
      }
    };
  }

  private getDefaultIntent(): IntentDetection {
    return {
      intent: 'general',
      confidence: 0.3,
      category: 'statement',
      parameters: {},
      context: {
        domain: 'general',
        urgency: 'low',
        politeness: 0.5
      }
    };
  }

  private getDefaultEmotion(): EmotionAnalysis {
    return {
      primary: {
        emotion: 'neutral',
        intensity: 0.5,
        confidence: 0.3
      },
      secondary: [],
      valence: 0,
      arousal: 0.5,
      dominance: 0.5,
      emotional_progression: {
        start: 'neutral',
        middle: 'neutral',
        end: 'neutral'
      }
    };
  }

  private getDefaultReadability(): ReadabilityAnalysis {
    return {
      scores: {
        fleschKincaid: 0,
        fleschReadingEase: 50,
        gunningFog: 10,
        smog: 10,
        automatedReadability: 10,
        colemanLiau: 10
      },
      grade: {
        level: 10,
        description: 'High school level'
      },
      complexity: {
        lexical: 0.5,
        syntactic: 0.5,
        semantic: 0.5
      },
      statistics: {
        sentences: 0,
        words: 0,
        characters: 0,
        syllables: 0,
        avgWordsPerSentence: 0,
        avgSyllablesPerWord: 0,
        avgCharactersPerWord: 0
      },
      recommendations: []
    };
  }

  // Stub implementations for complex methods (would be fully implemented in production)
  private loadStopWords(): void {
    const commonStopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ];
    
    commonStopWords.forEach(word => this.stopWords.add(word));
  }

  private loadIntentPatterns(): void {
    this.intentPatterns.set('question', [
      { pattern: /^(what|how|when|where|why|who|which)\b/i, intent: 'question', category: 'question' },
      { pattern: /\?$/, intent: 'question', category: 'question' }
    ]);
    
    this.intentPatterns.set('request', [
      { pattern: /^(can you|could you|please|would you)\b/i, intent: 'request', category: 'request' },
      { pattern: /\b(help|assist|support)\b/i, intent: 'help_request', category: 'request' }
    ]);
    
    this.intentPatterns.set('greeting', [
      { pattern: /^(hi|hello|hey|good morning|good evening)\b/i, intent: 'greeting', category: 'greeting' }
    ]);
  }

  // Placeholder implementations (would be fully implemented with proper algorithms)
  private detectScript(text: string): string {
    if (/[\u4e00-\u9fff]/.test(text)) return 'Han';
    if (/[\u0400-\u04ff]/.test(text)) return 'Cyrillic';
    if (/[\u0600-\u06ff]/.test(text)) return 'Arabic';
    return 'Latin';
  }

  private detectRegion(text: string, language: string): string | undefined {
    // Would implement region detection based on language variants
    return undefined;
  }

  private analyzeCharacterFrequency(text: string): { [char: string]: number } {
    const freq: { [char: string]: number } = {};
    for (const char of text.toLowerCase()) {
      if (/[a-zà-ɏḀ-ỿ]/.test(char)) {
        freq[char] = (freq[char] || 0) + 1;
      }
    }
    return freq;
  }

  private detectLanguageFromCharFreq(freq: { [char: string]: number }): { language: string; confidence: number } {
    // Simplified implementation
    return { language: 'en', confidence: 0.5 };
  }

  private async detectLanguageWithOpenAI(text: string): Promise<{ language: string; confidence: number }> {
    // Would use OpenAI for language detection
    return { language: 'en', confidence: 0.8 };
  }

  // Additional stub methods would be implemented here...
  private async detectAspectSentiment(text: string): Promise<any[]> { return []; }
  private extractEmotionsFromSentiment(text: string, sentiment: any): any { return {}; }
  private calculateSubjectivity(text: string): number { return 0.5; }
  private extractPatternEntities(text: string, entities: EntityExtraction[]): void {}
  private async extractEntitiesWithOpenAI(text: string): Promise<EntityExtraction[]> { return []; }
  private removeDuplicateEntities(entities: EntityExtraction[]): EntityExtraction[] { return entities; }
  private groupKeywordsByTopic(keywords: KeywordExtraction[]): { [topic: string]: KeywordExtraction[] } { return {}; }
  private calculateTopicProbability(keywords: KeywordExtraction[], allKeywords: KeywordExtraction[]): number { return 0.5; }
  private calculateTopicCoherence(keywords: KeywordExtraction[]): number { return 0.7; }
  private categorizeTopicKeywords(keywords: KeywordExtraction[]): string { return 'general'; }
  private async modelTopicsWithOpenAI(text: string): Promise<TopicModeling[]> { return []; }
  private classifyWithRules(text: string): any[] { return []; }
  private classifyWithKeywords(keywords: KeywordExtraction[]): any[] { return []; }
  private analyzeTextStyle(text: string): any { return {}; }
  private mergeCategories(categories: any[]): any[] { return []; }
  private generateTags(text: string, keywords: KeywordExtraction[], categories: any[]): any[] { return []; }
  private determineGenre(text: string, categories: any[]): any { return { type: 'general', confidence: 0.5 }; }
  private getKeywordContext(text: string, keyword: string, positions: number[]): string[] { return []; }
  private async findSynonyms(word: string): Promise<string[]> { return []; }
  private categorizeKeyword(word: string): string | undefined { return undefined; }
  private extractPhrases(text: string): KeywordExtraction[] { return []; }
  private segmentSentences(text: string): string[] { return text.split(/[.!?]+/).filter(s => s.trim()); }
  private async extractiveSummarization(sentences: string[]): Promise<any> { return { sentences: [], summary: '' }; }
  private async abstractiveSummarization(text: string): Promise<any> { return { summary: '', keyPoints: [], confidence: 0.7 }; }
  private extractParameters(text: string, match: RegExpMatchArray): any { return {}; }
  private analyzeIntentContext(text: string): any { return { domain: 'general', urgency: 'low', politeness: 0.5 }; }
  private detectEmotionKeywords(text: string): any { return {}; }
  private calculateVAD(text: string, emotions: any): any { return { valence: 0, arousal: 0.5, dominance: 0.5 }; }
  private analyzeEmotionalProgression(text: string): any { return { start: 'neutral', middle: 'neutral', end: 'neutral' }; }
  private calculateTextStatistics(text: string): any { return {}; }
  private calculateReadabilityScores(stats: any): any { return {}; }
  private analyzeComplexity(text: string, stats: any): any { return {}; }
  private generateReadabilityRecommendations(scores: any, complexity: any): string[] { return []; }
  private determineGradeLevel(scores: any): any { return { level: 10, description: 'High school level' }; }

  /**
   * Cache management
   */
  private async getCachedAnalysis(analysisId: string): Promise<TextAnalysisResponse | null> {
    try {
      const cached = this.analysisCache.get(analysisId);
      if (cached && Date.now() - cached.timestamp < this.config.processing.cacheTtl) {
        return cached.result;
      }
      
      const redisKey = `nlp_analysis:${analysisId}`;
      const redisCached = await this.redis.get(redisKey);
      if (redisCached) {
        const result = JSON.parse(redisCached);
        this.analysisCache.set(analysisId, { result, timestamp: Date.now() });
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached analysis:', error);
      return null;
    }
  }

  private async cacheAnalysis(analysisId: string, result: TextAnalysisResponse): Promise<void> {
    try {
      this.analysisCache.set(analysisId, { result, timestamp: Date.now() });
      
      const redisKey = `nlp_analysis:${analysisId}`;
      await this.redis.setex(redisKey, this.config.processing.cacheTtl / 1000, JSON.stringify(result));
    } catch (error) {
      console.error('Failed to cache analysis result:', error);
    }
  }

  /**
   * Batch processing
   */
  private async processBatchParallel(jobId: string, request: BatchAnalysisRequest): Promise<void> {
    const job = this.batchJobs.get(jobId)!;
    job.status = 'processing';
    
    const promises = request.texts.map(async (textItem) => {
      try {
        const analysis = await this.analyzeText({
          text: textItem.text,
          context: textItem.context,
          features: this.convertFeaturesList(request.features)
        });
        
        job.results!.push(analysis);
        job.progress.completed++;
        job.progress.percentage = (job.progress.completed / job.progress.total) * 100;
      } catch (error) {
        job.errors!.push({
          id: textItem.id,
          error: error.message
        });
        job.progress.failed++;
      }
    });
    
    await Promise.all(promises);
    
    job.status = 'completed';
    job.metadata.endTime = new Date();
    job.metadata.processingTime = job.metadata.endTime.getTime() - job.metadata.startTime.getTime();
  }

  private async processBatchSequential(jobId: string, request: BatchAnalysisRequest): Promise<void> {
    const job = this.batchJobs.get(jobId)!;
    job.status = 'processing';
    
    for (const textItem of request.texts) {
      try {
        const analysis = await this.analyzeText({
          text: textItem.text,
          context: textItem.context,
          features: this.convertFeaturesList(request.features)
        });
        
        job.results!.push(analysis);
        job.progress.completed++;
        job.progress.percentage = (job.progress.completed / job.progress.total) * 100;
      } catch (error) {
        job.errors!.push({
          id: textItem.id,
          error: error.message
        });
        job.progress.failed++;
      }
    }
    
    job.status = 'completed';
    job.metadata.endTime = new Date();
    job.metadata.processingTime = job.metadata.endTime.getTime() - job.metadata.startTime.getTime();
  }

  private convertFeaturesList(features: string[]): any {
    const featureObj: any = {};
    features.forEach(feature => {
      featureObj[feature] = true;
    });
    return featureObj;
  }

  /**
   * Metrics and monitoring
   */
  private updateMetrics(features: string[], processingTime: number): void {
    this.metrics.totalAnalyses += 1;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalAnalyses - 1) + processingTime) / 
      this.metrics.totalAnalyses;
    
    features.forEach(feature => {
      this.metrics.featureUsage[feature] = (this.metrics.featureUsage[feature] || 0) + 1;
    });
  }

  private startBatchProcessing(): void {
    // Background processing for batch jobs
    setInterval(() => {
      // Process any queued batch jobs
    }, 5000);
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean analysis cache
      for (const [key, cached] of this.analysisCache.entries()) {
        if (now - cached.timestamp > this.config.processing.cacheTtl) {
          this.analysisCache.delete(key);
        }
      }
      
      // Clean language cache
      for (const [key, cached] of this.languageCache.entries()) {
        if (now - cached.timestamp > this.config.processing.cacheTtl) {
          this.languageCache.delete(key);
        }
      }
      
      console.log(`🧹 NLP cache cleanup completed. Analysis: ${this.analysisCache.size}, Language: ${this.languageCache.size}`);
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private startMetricsTracking(): void {
    setInterval(() => {
      console.log('📝 NLP Pipeline Metrics:', this.metrics);
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Configuration and management
   */
  private getDefaultConfig(): NLPConfig {
    return {
      features: {
        sentimentAnalysis: true,
        entityExtraction: true,
        topicModeling: true,
        languageDetection: true,
        textClassification: true,
        keywordExtraction: true,
        textSummarization: true,
        intentDetection: true,
        emotionAnalysis: true,
        readabilityAnalysis: true
      },
      models: {
        sentimentModel: 'sentiment-v1',
        classificationModel: 'classification-v1',
        topicModel: 'topic-v1',
        embeddingModel: 'embedding-v1'
      },
      thresholds: {
        sentimentConfidence: 0.6,
        entityConfidence: 0.7,
        topicConfidence: 0.5,
        classificationConfidence: 0.6
      },
      processing: {
        batchSize: 100,
        maxTextLength: 50000,
        cacheEnabled: true,
        cacheTtl: 30 * 60 * 1000, // 30 minutes
        parallelProcessing: true
      },
      languages: {
        supported: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
        defaultLanguage: 'en',
        autoDetect: true
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<NLPConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    isHealthy: boolean;
    metrics: typeof this.metrics;
    cacheStats: {
      analysisCache: number;
      languageCache: number;
      embeddingCache: number;
    };
    batchJobs: {
      active: number;
      completed: number;
    };
    config: {
      enabledFeatures: number;
      supportedLanguages: number;
    };
  } {
    const completedJobs = Array.from(this.batchJobs.values()).filter(job => job.status === 'completed').length;
    const activeJobs = Array.from(this.batchJobs.values()).filter(job => job.status === 'processing').length;
    
    return {
      isHealthy: this.isHealthy,
      metrics: this.metrics,
      cacheStats: {
        analysisCache: this.analysisCache.size,
        languageCache: this.languageCache.size,
        embeddingCache: this.embeddingCache.size
      },
      batchJobs: {
        active: activeJobs,
        completed: completedJobs
      },
      config: {
        enabledFeatures: Object.values(this.config.features).filter(Boolean).length,
        supportedLanguages: this.config.languages.supported.length
      }
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.redis.disconnect();
      this.analysisCache.clear();
      this.languageCache.clear();
      this.embeddingCache.clear();
      this.batchJobs.clear();
      console.log('🧹 NLP Pipeline service cleaned up');
    } catch (error) {
      console.error('Failed to cleanup NLP Pipeline service:', error);
    }
  }
}