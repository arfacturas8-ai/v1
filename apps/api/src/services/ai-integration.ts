import OpenAI from 'openai';
import { Queue } from 'bullmq';
import * as natural from 'natural';
import * as compromise from 'compromise';
import Sentiment from 'sentiment';
import * as LeoProfanity from 'leo-profanity';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';

export interface AIServiceConfig {
  openaiApiKey: string;
  maxRetries: number;
  timeoutMs: number;
  fallbackEnabled: boolean;
  cacheTtl: number;
}

export interface ModerationResult {
  flagged: boolean;
  categories: {
    harassment: boolean;
    'harassment/threatening': boolean;
    hate: boolean;
    'hate/threatening': boolean;
    'self-harm': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  category_scores: {
    harassment: number;
    'harassment/threatening': number;
    hate: number;
    'hate/threatening': number;
    'self-harm': number;
    'self-harm/intent': number;
    'self-harm/instructions': number;
    sexual: number;
    'sexual/minors': number;
    violence: number;
    'violence/graphic': number;
  };
}

export interface SentimentResult {
  score: number;
  comparative: number;
  tokens: string[];
  words: string[];
  positive: string[];
  negative: string[];
}

export interface ContentAnalysisResult {
  toxicity: ModerationResult | null;
  sentiment: SentimentResult;
  spam: boolean;
  profanity: boolean;
  nsfw: boolean;
  language: string;
  entities: any[];
  categories: string[];
  confidence: number;
}

export class AIIntegrationService {
  private openai: OpenAI | null = null;
  private sentiment: Sentiment;
  private profanityFilter: any;
  private queue: Queue;
  private cache: Map<string, { result: any; timestamp: number }> = new Map();
  private config: AIServiceConfig;
  private isHealthy: boolean = true;
  private lastHealthCheck: number = Date.now();
  private redis: Redis;
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: AIServiceConfig, moderationQueue: Queue) {
    this.config = config;
    this.queue = moderationQueue;
    
    // Initialize Redis for distributed caching
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
    
    // Initialize OpenAI with comprehensive error handling
    this.initializeOpenAI();

    // Initialize NLP tools with error handling
    this.initializeNLPTools();
    
    // Initialize periodic health checks
    this.startHealthMonitoring();
    
    console.log('🤖 AI Integration Service initialized successfully');
  }

  /**
   * Initialize OpenAI client with robust error handling
   */
  private initializeOpenAI(): void {
    try {
      if (!this.config.openaiApiKey || this.config.openaiApiKey.length < 10) {
        console.warn('⚠️ OpenAI API key not provided or invalid, using fallback modes only');
        this.isHealthy = false;
        return;
      }

      // Validate API key format
      if (!this.config.openaiApiKey.startsWith('sk-')) {
        console.warn('⚠️ Invalid OpenAI API key format, using fallback modes only');
        this.isHealthy = false;
        return;
      }

      this.openai = new OpenAI({
        apiKey: this.config.openaiApiKey,
        timeout: this.config.timeoutMs,
        maxRetries: this.config.maxRetries,
      });
      
      console.log('✅ OpenAI client initialized successfully');
      
      // Perform initial health check
      this.performInitialHealthCheck();
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error);
      this.isHealthy = false;
      
      if (!this.config.fallbackEnabled) {
        throw error;
      }
    }
  }

  /**
   * Perform initial health check on OpenAI service
   */
  private async performInitialHealthCheck(): Promise<void> {
    try {
      if (this.openai) {
        // Simple test call
        await this.openai.models.list();
        this.isHealthy = true;
        console.log('✅ OpenAI service health check passed');
      }
    } catch (error) {
      console.warn('⚠️ OpenAI initial health check failed, will use fallback methods:', error.message);
      this.isHealthy = false;
    }
  }

  /**
   * Initialize NLP tools with fallback handling
   */
  private initializeNLPTools(): void {
    try {
      // Initialize sentiment analyzer
      this.sentiment = new Sentiment();
      
      // Initialize profanity filter with fallback (bad-words library has import issues)
      this.profanityFilter = {
        clean: (text: string) => this.fallbackProfanityClean(text),
        isProfane: (text: string) => this.fallbackProfanityCheck(text),
        addWords: (words: string[]) => {
          // Custom words are handled in fallback method
        }
      };
      
      // Initialize LeoProfanity with error handling
      try {
        LeoProfanity.loadDictionary();
      } catch (error) {
        console.warn('Failed to load LeoProfanity dictionary:', error);
      }
      
      console.log('✅ NLP tools initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NLP tools:', error);
      // Create minimal fallback tools
      this.sentiment = {
        analyze: (text: string) => ({ score: 0, comparative: 0, tokens: [], words: [], positive: [], negative: [] })
      } as any;
      this.profanityFilter = {
        clean: (text: string) => text,
        isProfane: (text: string) => false,
        addWords: (words: string[]) => {}
      };
    }
  }

  /**
   * Fallback profanity detection
   */
  private fallbackProfanityCheck(text: string): boolean {
    const profanityPatterns = [
      /\b(fuck|shit|damn|bitch|ass|crap)\b/gi,
      /\b(nigga|nigger|faggot|retard)\b/gi,
      /\b(scam|fraud|ponzi|rugpull)\b/gi
    ];
    return profanityPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Fallback profanity cleaning
   */
  private fallbackProfanityClean(text: string): string {
    const profanityPatterns = [
      { pattern: /\b(fuck|shit|damn|bitch|ass|crap)\b/gi, replacement: '***' },
      { pattern: /\b(nigga|nigger|faggot|retard)\b/gi, replacement: '***' },
      { pattern: /\b(scam|fraud|ponzi|rugpull)\b/gi, replacement: '***' }
    ];
    
    let cleanedText = text;
    profanityPatterns.forEach(({ pattern, replacement }) => {
      cleanedText = cleanedText.replace(pattern, replacement);
    });
    
    return cleanedText;
  }

  /**
   * Comprehensive content analysis with crash-safe error handling
   */
  async analyzeContent(
    content: string,
    userId: string,
    options: {
      checkToxicity?: boolean;
      checkSpam?: boolean;
      checkSentiment?: boolean;
      checkProfanity?: boolean;
      checkNsfw?: boolean;
      extractEntities?: boolean;
      categorize?: boolean;
    } = {}
  ): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cached = await this.getCachedResult('content_analysis', content, options);
      if (cached) {
        return cached;
      }

      const result: ContentAnalysisResult = {
        toxicity: null,
        sentiment: { score: 0, comparative: 0, tokens: [], words: [], positive: [], negative: [] },
        spam: false,
        profanity: false,
        nsfw: false,
        language: 'en',
        entities: [],
        categories: [],
        confidence: 0
      };

      // Parallel analysis with fallback handling
      const analysisPromises: Promise<void>[] = [];

      // Toxicity detection
      if (options.checkToxicity !== false) {
        analysisPromises.push(
          this.detectToxicity(content)
            .then(toxicity => { result.toxicity = toxicity; })
            .catch(error => {
              console.error('Toxicity detection failed, using fallback:', error);
              result.toxicity = this.fallbackToxicityDetection(content);
            })
        );
      }

      // Sentiment analysis
      if (options.checkSentiment !== false) {
        analysisPromises.push(
          Promise.resolve().then(() => {
            result.sentiment = this.analyzeSentiment(content);
          }).catch(error => {
            console.error('Sentiment analysis failed:', error);
            result.sentiment = { score: 0, comparative: 0, tokens: [], words: [], positive: [], negative: [] };
          })
        );
      }

      // Spam detection
      if (options.checkSpam !== false) {
        analysisPromises.push(
          this.detectSpam(content, userId)
            .then(spam => { result.spam = spam; })
            .catch(error => {
              console.error('Spam detection failed:', error);
              result.spam = false;
            })
        );
      }

      // Profanity detection
      if (options.checkProfanity !== false) {
        analysisPromises.push(
          Promise.resolve().then(() => {
            result.profanity = this.detectProfanity(content);
          }).catch(error => {
            console.error('Profanity detection failed:', error);
            result.profanity = false;
          })
        );
      }

      // NSFW detection
      if (options.checkNsfw !== false) {
        analysisPromises.push(
          this.detectNSFW(content)
            .then(nsfw => { result.nsfw = nsfw; })
            .catch(error => {
              console.error('NSFW detection failed:', error);
              result.nsfw = false;
            })
        );
      }

      // Entity extraction
      if (options.extractEntities) {
        analysisPromises.push(
          Promise.resolve().then(() => {
            result.entities = this.extractEntities(content);
          }).catch(error => {
            console.error('Entity extraction failed:', error);
            result.entities = [];
          })
        );
      }

      // Content categorization
      if (options.categorize) {
        analysisPromises.push(
          this.categorizeContent(content)
            .then(categories => { result.categories = categories; })
            .catch(error => {
              console.error('Content categorization failed:', error);
              result.categories = [];
            })
        );
      }

      // Wait for all analyses to complete
      await Promise.all(analysisPromises);

      // Calculate overall confidence
      result.confidence = this.calculateConfidence(result);

      // Cache result
      await this.cacheResult('content_analysis', content, result, 300);

      // Log analysis metrics
      const processingTime = Date.now() - startTime;
      console.log(`🤖 Content analysis completed in ${processingTime}ms`);
      
      return result;

    } catch (error) {
      console.error('Content analysis failed:', error);
      
      // Return safe fallback result
      return {
        toxicity: null,
        sentiment: { score: 0, comparative: 0, tokens: [], words: [], positive: [], negative: [] },
        spam: false,
        profanity: this.detectProfanity(content),
        nsfw: false,
        language: 'en',
        entities: [],
        categories: [],
        confidence: 0.1
      };
    }
  }

  /**
   * Detect toxicity using OpenAI moderation API with comprehensive fallback
   */
  async detectToxicity(content: string): Promise<ModerationResult | null> {
    if (!content || content.trim().length === 0) {
      return null;
    }

    // Check rate limits
    if (!this.checkRateLimit('toxicity', content)) {
      console.warn('⚠️ Toxicity detection rate limited, using fallback');
      return this.fallbackToxicityDetection(content);
    }

    // Try OpenAI first if available and healthy
    if (this.isHealthy && this.openai) {
      try {
        const moderation = await Promise.race([
          this.openai.moderations.create({ input: content }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), this.config.timeoutMs)
          )
        ]) as any;

        const result = moderation.results[0];
        
        // Cache successful result
        await this.cacheResult('toxicity', content, result, 300); // 5 minutes
        
        return {
          flagged: result.flagged,
          categories: result.categories,
          category_scores: result.category_scores,
        };
      } catch (error) {
        console.error('OpenAI moderation failed:', error.message);
        
        // Temporarily mark as unhealthy on repeated failures
        if (error.message.includes('rate_limit') || error.message.includes('quota')) {
          console.warn('⚠️ OpenAI rate limited, switching to fallback temporarily');
        } else {
          this.isHealthy = false;
        }
      }
    }

    // Use fallback detection
    console.log('🔄 Using fallback toxicity detection for:', content.substring(0, 50) + '...');
    return this.fallbackToxicityDetection(content);
  }

  /**
   * Fallback toxicity detection using rule-based approach
   */
  private fallbackToxicityDetection(content: string): ModerationResult {
    const toxicPatterns = [
      /\b(kill|murder|die|suicide)\b/gi,
      /\b(hate|racist|nazi|terrorist)\b/gi,
      /\b(porn|sex|naked|nude)\b/gi,
      /\b(threat|violence|attack|harm)\b/gi,
    ];

    let score = 0;
    const flaggedCategories = {
      harassment: false,
      'harassment/threatening': false,
      hate: false,
      'hate/threatening': false,
      'self-harm': false,
      'self-harm/intent': false,
      'self-harm/instructions': false,
      sexual: false,
      'sexual/minors': false,
      violence: false,
      'violence/graphic': false,
    };

    const scores = { ...flaggedCategories };

    toxicPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length * 0.3;
        switch (index) {
          case 0:
            flaggedCategories.violence = true;
            flaggedCategories['self-harm'] = true;
            scores.violence = 0.8;
            scores['self-harm'] = 0.7;
            break;
          case 1:
            flaggedCategories.hate = true;
            flaggedCategories.harassment = true;
            scores.hate = 0.9;
            scores.harassment = 0.8;
            break;
          case 2:
            flaggedCategories.sexual = true;
            scores.sexual = 0.9;
            break;
          case 3:
            flaggedCategories['harassment/threatening'] = true;
            flaggedCategories['violence/graphic'] = true;
            scores['harassment/threatening'] = 0.8;
            scores['violence/graphic'] = 0.7;
            break;
        }
      }
    });

    return {
      flagged: score > 0.5,
      categories: flaggedCategories,
      category_scores: scores,
    };
  }

  /**
   * Analyze sentiment using natural language processing
   */
  analyzeSentiment(content: string): SentimentResult {
    try {
      const result = this.sentiment.analyze(content);
      return {
        score: result.score,
        comparative: result.comparative,
        tokens: result.tokens || [],
        words: result.words || [],
        positive: result.positive || [],
        negative: result.negative || [],
      };
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return {
        score: 0,
        comparative: 0,
        tokens: [],
        words: [],
        positive: [],
        negative: [],
      };
    }
  }

  /**
   * Advanced spam detection with ML patterns
   */
  async detectSpam(content: string, userId: string): Promise<boolean> {
    try {
      // Rule-based checks
      const spamIndicators = [
        // Excessive repetition
        this.checkRepetition(content),
        // Excessive caps
        this.checkExcessiveCaps(content),
        // Suspicious links
        await this.checkSuspiciousLinks(content),
        // Rate limiting
        await this.checkRateLimit(userId, content),
        // Pattern matching
        this.checkSpamPatterns(content),
      ];

      const spamScore = spamIndicators.filter(Boolean).length / spamIndicators.length;
      return spamScore > 0.4; // 40% threshold
    } catch (error) {
      console.error('Spam detection failed:', error);
      return false;
    }
  }

  /**
   * Detect profanity using multiple filters
   */
  detectProfanity(content: string): boolean {
    try {
      // Use multiple profanity filters for better accuracy
      const badWordsFilter = this.profanityFilter.isProfane(content);
      const leoFilter = LeoProfanity.check(content);
      
      return badWordsFilter || leoFilter;
    } catch (error) {
      console.error('Profanity detection failed:', error);
      return false;
    }
  }

  /**
   * NSFW content detection
   */
  async detectNSFW(content: string): Promise<boolean> {
    try {
      const nsfwPatterns = [
        /\b(porn|sex|naked|nude|adult|xxx|nsfw)\b/gi,
        /\b(dick|cock|pussy|tits|ass|fuck|shit)\b/gi,
        /\b(horny|cum|orgasm|masturbate)\b/gi,
      ];

      return nsfwPatterns.some(pattern => pattern.test(content));
    } catch (error) {
      console.error('NSFW detection failed:', error);
      return false;
    }
  }

  /**
   * Extract entities from content
   */
  extractEntities(content: string): any[] {
    try {
      const doc = compromise(content);
      
      return [
        ...doc.people().out('array').map(name => ({ type: 'person', value: name })),
        ...doc.places().out('array').map(place => ({ type: 'place', value: place })),
        ...doc.organizations().out('array').map(org => ({ type: 'organization', value: org })),
        ...doc.dates().out('array').map(date => ({ type: 'date', value: date })),
        ...doc.money().out('array').map(money => ({ type: 'money', value: money })),
      ];
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return [];
    }
  }

  /**
   * Categorize content using AI with smart fallback
   */
  async categorizeContent(content: string): Promise<string[]> {
    if (!content || content.trim().length === 0) {
      return ['general'];
    }

    // Check cache first
    try {
      const cached = await this.getCachedResult('categorization', content);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('Cache check failed for categorization:', error.message);
    }

    // Check rate limits
    if (!this.checkRateLimit('categorization', content)) {
      return this.fallbackCategorization(content);
    }

    // Try OpenAI if available
    if (this.isHealthy && this.openai) {
      try {
        const completion = await Promise.race([
          this.openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Categorize the following content into relevant categories. Return only a comma-separated list of categories (max 5). Categories should be: gaming, crypto, technology, social, entertainment, support, announcements, trading, development, community, off-topic, spam, toxic, educational, news, memes, art, music, politics, finance"
              },
              {
                role: "user",
                content: content.substring(0, 500)
              }
            ],
            max_tokens: 50,
            temperature: 0.2,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), this.config.timeoutMs)
          )
        ]) as any;

        const categories = completion.choices[0]?.message?.content
          ?.split(',')
          .map(cat => cat.trim().toLowerCase())
          .filter(cat => cat.length > 0 && cat.length < 20) || [];

        const validCategories = categories.slice(0, 5);
        
        // Cache successful result
        await this.cacheResult('categorization', content, validCategories, 600); // 10 minutes
        
        return validCategories.length > 0 ? validCategories : ['general'];
      } catch (error) {
        console.error('AI categorization failed:', error.message);
        
        if (error.message.includes('rate_limit')) {
          console.warn('⚠️ OpenAI rate limited for categorization');
        }
      }
    }

    // Use enhanced fallback
    const fallbackResult = this.fallbackCategorization(content);
    
    // Cache fallback result for shorter time
    try {
      await this.cacheResult('categorization', content, fallbackResult, 180); // 3 minutes
    } catch (error) {
      console.warn('Failed to cache fallback categorization:', error.message);
    }
    
    return fallbackResult;
  }

  /**
   * Fallback categorization using keywords
   */
  private fallbackCategorization(content: string): string[] {
    const categories = [];
    const lowerContent = content.toLowerCase();

    const categoryKeywords = {
      gaming: ['game', 'play', 'player', 'gaming', 'stream', 'twitch', 'discord'],
      crypto: ['crypto', 'bitcoin', 'ethereum', 'nft', 'defi', 'web3', 'blockchain', 'token'],
      technology: ['code', 'programming', 'tech', 'software', 'app', 'api', 'developer'],
      trading: ['trade', 'buy', 'sell', 'price', 'market', 'investment'],
      support: ['help', 'support', 'issue', 'problem', 'bug', 'question'],
      social: ['friend', 'chat', 'talk', 'social', 'community', 'meet'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ['general'];
  }

  /**
   * Helper methods for spam detection
   */
  private checkRepetition(content: string): boolean {
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    return (words.length - uniqueWords.size) / words.length > 0.6; // 60% repetition
  }

  private checkExcessiveCaps(content: string): boolean {
    if (content.length < 10) return false;
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    return capsCount / content.length > 0.7;
  }

  private async checkSuspiciousLinks(content: string): Promise<boolean> {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    
    if (!urls) return false;

    const suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'shorturl.at', 't.co',
      'grabify.link', 'iplogger.org', 'discord.gg'
    ];

    return urls.some(url => {
      try {
        const domain = new URL(url).hostname.toLowerCase();
        return suspiciousDomains.some(suspicious => domain.includes(suspicious));
      } catch {
        return true; // Invalid URL is suspicious
      }
    });
  }

  private async checkRateLimit(userId: string, content: string): Promise<boolean> {
    // This would integrate with the existing spam tracker in ModerationService
    // For now, return false to avoid circular dependency
    return false;
  }

  private checkSpamPatterns(content: string): boolean {
    const spamPatterns = [
      /\b(free|win|winner|congratulations|claim|prize)\b/gi,
      /\b(click here|visit now|limited time|act now)\b/gi,
      /\b(money|cash|dollars|bitcoin|crypto giveaway)\b/gi,
      /(.)\1{10,}/gi, // Excessive character repetition
    ];

    return spamPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Calculate confidence score for analysis result
   */
  private calculateConfidence(result: ContentAnalysisResult): number {
    let confidence = 0.5; // Base confidence
    
    if (result.toxicity) confidence += 0.3;
    if (result.sentiment.tokens.length > 0) confidence += 0.2;
    if (result.entities.length > 0) confidence += 0.1;
    if (result.categories.length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Enhanced distributed cache management with Redis
   */
  private getCacheKey(service: string, content: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    const contentHash = require('crypto')
      .createHash('md5')
      .update(content + optionsStr)
      .digest('hex');
    return `ai_cache:${service}:${contentHash}`;
  }

  private async getCachedResult(service: string, content: string, options?: any): Promise<any | null> {
    try {
      const key = this.getCacheKey(service, content, options);
      
      // Try local cache first
      const localCached = this.cache.get(key);
      if (localCached && Date.now() - localCached.timestamp < this.config.cacheTtl) {
        return localCached.result;
      }
      
      // Try Redis cache
      const redisCached = await this.redis.get(key);
      if (redisCached) {
        const parsedResult = JSON.parse(redisCached);
        // Update local cache
        this.cache.set(key, { result: parsedResult, timestamp: Date.now() });
        return parsedResult;
      }
      
      return null;
    } catch (error) {
      console.warn('Cache retrieval failed:', error.message);
      return null;
    }
  }

  private async cacheResult(service: string, content: string, result: any, ttlSeconds: number = 300): Promise<void> {
    try {
      const key = this.getCacheKey(service, content);
      
      // Store in local cache
      this.cache.set(key, { result, timestamp: Date.now() });
      
      // Store in Redis with TTL
      await this.redis.setex(key, ttlSeconds, JSON.stringify(result));
      
      // Clean up local cache
      if (this.cache.size > 1000) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        entries.slice(0, 200).forEach(([cacheKey]) => this.cache.delete(cacheKey));
      }
    } catch (error) {
      console.warn('Cache storage failed:', error.message);
    }
  }

  /**
   * Rate limiting for API calls
   */
  private checkRateLimit(service: string, content: string): boolean {
    const key = `${service}_${Date.now() - (Date.now() % 60000)}`; // Per-minute window
    const limit = this.getRateLimit(service);
    
    let tracker = this.rateLimitTracker.get(key);
    if (!tracker) {
      tracker = { count: 0, resetTime: Date.now() + 60000 };
      this.rateLimitTracker.set(key, tracker);
    }
    
    // Clean up expired trackers
    if (Date.now() > tracker.resetTime) {
      this.rateLimitTracker.delete(key);
      return true;
    }
    
    if (tracker.count >= limit) {
      return false;
    }
    
    tracker.count++;
    return true;
  }

  private getRateLimit(service: string): number {
    const limits = {
      'toxicity': 100,
      'categorization': 50,
      'sentiment': 200,
      'spam': 150
    };
    return limits[service] || 50;
  }

  /**
   * Health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Every minute
  }

  private async performHealthCheck(): Promise<void> {
    try {
      if (this.openai) {
        // Simple health check with OpenAI
        await this.openai.models.list();
        this.isHealthy = true;
        this.lastHealthCheck = Date.now();
      }
    } catch (error) {
      console.error('AI service health check failed:', error);
      this.isHealthy = false;
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(): { healthy: boolean; lastCheck: number; cacheSize: number } {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastHealthCheck,
      cacheSize: this.cache.size,
    };
  }
}