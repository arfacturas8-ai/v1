import { AIIntegrationService } from './ai-integration';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import sharp from 'sharp';
import axios from 'axios';

export interface NSFWConfig {
  textThresholds: {
    sexual: number;
    suggestive: number;
    explicit: number;
  };
  imageThresholds: {
    porn: number;
    sexy: number;
    hentai: number;
    neutral: number;
  };
  enabledChecks: {
    text: boolean;
    images: boolean;
    links: boolean;
    attachments: boolean;
  };
  whitelist: {
    userIds: string[];
    channelIds: string[];
    domains: string[];
  };
  autoModeration: {
    enabled: boolean;
    deleteContent: boolean;
    warnUser: boolean;
    timeoutDuration: number;
  };
}

export interface NSFWAnalysisResult {
  isNSFW: boolean;
  confidence: number;
  type: 'text' | 'image' | 'link' | 'attachment';
  categories: {
    sexual: number;
    suggestive: number;
    explicit: number;
    porn?: number;
    sexy?: number;
    hentai?: number;
    neutral?: number;
  };
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: 'allow' | 'flag' | 'blur' | 'block';
  metadata: {
    processingTime: number;
    analysisMethod: string[];
    fileSize?: number;
    imageResolution?: string;
    detectedText?: string;
  };
}

export interface ImageAnalysisResult {
  filename: string;
  size: number;
  resolution: { width: number; height: number };
  format: string;
  isNSFW: boolean;
  confidence: number;
  categories: { [category: string]: number };
  detectedObjects: string[];
  textContent?: string;
}

export class NSFWDetectionService {
  private aiService: AIIntegrationService;
  private queue: Queue;
  private config: NSFWConfig;
  private analysisCache: Map<string, { result: NSFWAnalysisResult; timestamp: number }> = new Map();

  constructor(aiService: AIIntegrationService, moderationQueue: Queue) {
    this.aiService = aiService;
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    this.startCacheCleanup();
  }

  /**
   * Comprehensive NSFW analysis for content
   */
  async analyzeContent(
    messageId: string,
    content: string,
    attachments: any[],
    userId: string,
    channelId: string,
    serverId?: string
  ): Promise<NSFWAnalysisResult[]> {
    const results: NSFWAnalysisResult[] = [];
    
    try {
      // Check whitelist
      if (this.isWhitelisted(userId, channelId)) {
        return [];
      }

      // Analyze text content
      if (this.config.enabledChecks.text && content) {
        const textResult = await this.analyzeText(content, userId);
        if (textResult) {
          results.push(textResult);
        }
      }

      // Analyze attachments
      if (this.config.enabledChecks.attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const attachmentResult = await this.analyzeAttachment(attachment, userId);
          if (attachmentResult) {
            results.push(attachmentResult);
          }
        }
      }

      // Analyze links in content
      if (this.config.enabledChecks.links) {
        const linkResults = await this.analyzeLinks(content, userId);
        results.push(...linkResults);
      }

      // Take action if NSFW content is detected
      const nsfwResults = results.filter(r => r.isNSFW);
      if (nsfwResults.length > 0 && this.config.autoModeration.enabled) {
        await this.executeNSFWActions(messageId, userId, nsfwResults, serverId);
      }

      // Log analysis
      if (results.length > 0) {
        await this.logNSFWAnalysis(messageId, userId, results, serverId);
      }

      return results;
    } catch (error) {
      console.error('NSFW analysis failed:', error);
      return [];
    }
  }

  /**
   * Analyze text content for NSFW material
   */
  async analyzeText(content: string, userId: string): Promise<NSFWAnalysisResult | null> {
    const startTime = Date.now();
    
    try {
      // Check cache
      const cacheKey = this.getCacheKey('text', content);
      const cached = this.analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
        return cached.result;
      }

      // Multi-layered text analysis
      const analyses = await Promise.allSettled([
        this.analyzeTextWithAI(content, userId),
        this.analyzeTextWithPatterns(content),
        this.analyzeTextWithKeywords(content)
      ]);

      // Combine results
      const result = this.combineTextAnalysis(analyses, content, startTime);
      
      // Cache result
      this.analysisCache.set(cacheKey, { result, timestamp: Date.now() });
      
      return result.isNSFW ? result : null;
    } catch (error) {
      console.error('Text NSFW analysis failed:', error);
      return null;
    }
  }

  /**
   * Analyze text using AI services
   */
  private async analyzeTextWithAI(content: string, userId: string): Promise<{
    sexual: number;
    suggestive: number;
    explicit: number;
    reasons: string[];
  }> {
    try {
      const analysis = await this.aiService.analyzeContent(content, userId, {
        checkNsfw: true,
        checkToxicity: true
      });

      const reasons: string[] = [];
      let sexual = 0;
      let suggestive = 0;
      let explicit = 0;

      if (analysis.nsfw) {
        sexual = 0.8;
        reasons.push('AI detected NSFW content');
      }

      if (analysis.toxicity?.categories?.sexual) {
        sexual = Math.max(sexual, analysis.toxicity.category_scores.sexual);
        reasons.push('Sexual content detected');
      }

      // Check for suggestive language patterns
      const suggestivePatterns = [
        /\b(sexy|hot|nude|naked|adult|mature)\b/gi,
        /\b(aroused|turned on|excited|horny)\b/gi,
        /\b(intimate|sensual|seductive|provocative)\b/gi
      ];

      suggestivePatterns.forEach(pattern => {
        if (pattern.test(content)) {
          suggestive = Math.max(suggestive, 0.6);
          reasons.push('Suggestive language detected');
        }
      });

      // Check for explicit language
      const explicitPatterns = [
        /\b(porn|xxx|sex|fuck|cock|pussy|dick|tits|ass|cum|orgasm)\b/gi,
        /\b(masturbat|fellatio|cunnilingus|intercourse)\b/gi,
        /\b(anal|oral|vaginal|penetrat|climax)\b/gi
      ];

      explicitPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          explicit = Math.max(explicit, 0.9);
          reasons.push('Explicit sexual content detected');
        }
      });

      return { sexual, suggestive, explicit, reasons };
    } catch (error) {
      console.error('AI text analysis failed:', error);
      return { sexual: 0, suggestive: 0, explicit: 0, reasons: [] };
    }
  }

  /**
   * Analyze text using pattern matching
   */
  private async analyzeTextWithPatterns(content: string): Promise<{
    sexual: number;
    suggestive: number;
    explicit: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let sexual = 0;
    let suggestive = 0;
    let explicit = 0;

    // Sexual innuendo patterns
    const innuendoPatterns = [
      /\b(hard|wet|tight|deep|long|thick)\s+(and|or)?\s+(big|huge|massive|enormous)\b/gi,
      /\b(come|cum)\s+(on|in|over)\b/gi,
      /\b(blow|suck|lick|eat|taste)\s+(me|it|that)\b/gi,
    ];

    innuendoPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        sexual = Math.max(sexual, 0.7);
        reasons.push('Sexual innuendo detected');
      }
    });

    // Suggestive emoji patterns
    const suggestiveEmojis = [
      /🍑|🍆|🌶️|💦|👅|🍌|🥵|😏|😈|🔥/g,
      /❤️‍🔥|💋|👄|🫦/g
    ];

    suggestiveEmojis.forEach(pattern => {
      if (pattern.test(content)) {
        suggestive = Math.max(suggestive, 0.5);
        reasons.push('Suggestive emojis detected');
      }
    });

    // Explicit descriptions
    const explicitDescriptions = [
      /\b(have sex|make love|get laid|hook up|one night stand)\b/gi,
      /\b(strip|undress|take off|remove clothes|get naked)\b/gi,
      /\b(foreplay|kink|fetish|bdsm|dominat|submit)\b/gi,
    ];

    explicitDescriptions.forEach(pattern => {
      if (pattern.test(content)) {
        explicit = Math.max(explicit, 0.8);
        reasons.push('Explicit sexual description detected');
      }
    });

    // Check message length and context
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 20 && (sexual > 0.5 || suggestive > 0.3)) {
      // Longer messages with sexual content are more likely to be problematic
      sexual = Math.min(sexual + 0.1, 1.0);
      reasons.push('Extended sexual content');
    }

    return { sexual, suggestive, explicit, reasons };
  }

  /**
   * Analyze text using keyword matching
   */
  private async analyzeTextWithKeywords(content: string): Promise<{
    sexual: number;
    suggestive: number;
    explicit: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let sexual = 0;
    let suggestive = 0;
    let explicit = 0;

    const lowerContent = content.toLowerCase();

    // Explicit keywords
    const explicitKeywords = [
      'pornography', 'explicit', 'hardcore', 'xxx', 'adult content',
      'sexual act', 'intercourse', 'penetration', 'climax', 'orgasm'
    ];

    const explicitCount = explicitKeywords.filter(keyword => 
      lowerContent.includes(keyword)
    ).length;

    if (explicitCount > 0) {
      explicit = Math.min(explicitCount * 0.3, 1.0);
      reasons.push(`${explicitCount} explicit keyword(s) found`);
    }

    // Sexual keywords
    const sexualKeywords = [
      'sexual', 'erotic', 'sensual', 'intimate', 'passionate',
      'desire', 'lust', 'arousal', 'seduction'
    ];

    const sexualCount = sexualKeywords.filter(keyword => 
      lowerContent.includes(keyword)
    ).length;

    if (sexualCount > 0) {
      sexual = Math.min(sexualCount * 0.2, 0.8);
      reasons.push(`${sexualCount} sexual keyword(s) found`);
    }

    // Suggestive keywords
    const suggestiveKeywords = [
      'attractive', 'beautiful', 'gorgeous', 'stunning', 'hot',
      'cute', 'adorable', 'lovely', 'charming', 'appealing'
    ];

    const suggestiveCount = suggestiveKeywords.filter(keyword => 
      lowerContent.includes(keyword)
    ).length;

    if (suggestiveCount > 2) { // Need multiple suggestive words
      suggestive = Math.min(suggestiveCount * 0.1, 0.5);
      reasons.push(`${suggestiveCount} suggestive keyword(s) found`);
    }

    return { sexual, suggestive, explicit, reasons };
  }

  /**
   * Combine text analysis results
   */
  private combineTextAnalysis(
    analyses: PromiseSettledResult<any>[],
    content: string,
    startTime: number
  ): NSFWAnalysisResult {
    let maxSexual = 0;
    let maxSuggestive = 0;
    let maxExplicit = 0;
    const allReasons: string[] = [];
    const methods: string[] = [];

    analyses.forEach((analysis, index) => {
      if (analysis.status === 'fulfilled' && analysis.value) {
        const { sexual, suggestive, explicit, reasons } = analysis.value;
        maxSexual = Math.max(maxSexual, sexual);
        maxSuggestive = Math.max(maxSuggestive, suggestive);
        maxExplicit = Math.max(maxExplicit, explicit);
        allReasons.push(...reasons);
        
        const methodNames = ['AI Analysis', 'Pattern Matching', 'Keyword Analysis'];
        if (sexual > 0 || suggestive > 0 || explicit > 0) {
          methods.push(methodNames[index]);
        }
      }
    });

    const overallScore = Math.max(maxSexual, maxSuggestive, maxExplicit);
    const isNSFW = overallScore >= this.config.textThresholds.sexual;
    const riskLevel = this.calculateRiskLevel(overallScore);
    const recommendedAction = this.getRecommendedAction(overallScore, riskLevel);

    return {
      isNSFW,
      confidence: overallScore,
      type: 'text',
      categories: {
        sexual: maxSexual,
        suggestive: maxSuggestive,
        explicit: maxExplicit
      },
      reasons: [...new Set(allReasons)],
      riskLevel,
      recommendedAction,
      metadata: {
        processingTime: Date.now() - startTime,
        analysisMethod: methods,
        detectedText: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      }
    };
  }

  /**
   * Analyze attachment for NSFW content
   */
  async analyzeAttachment(attachment: any, userId: string): Promise<NSFWAnalysisResult | null> {
    const startTime = Date.now();
    
    try {
      // Check if attachment is an image
      if (!this.isImage(attachment.filename)) {
        return null;
      }

      // Download and analyze image
      const imageBuffer = await this.downloadImage(attachment.url);
      const imageAnalysis = await this.analyzeImage(imageBuffer, attachment.filename);
      
      if (!imageAnalysis.isNSFW) {
        return null;
      }

      const riskLevel = this.calculateRiskLevel(imageAnalysis.confidence);
      const recommendedAction = this.getRecommendedAction(imageAnalysis.confidence, riskLevel);

      return {
        isNSFW: imageAnalysis.isNSFW,
        confidence: imageAnalysis.confidence,
        type: 'image',
        categories: imageAnalysis.categories,
        reasons: [`Image analysis detected NSFW content (${(imageAnalysis.confidence * 100).toFixed(1)}%)`],
        riskLevel,
        recommendedAction,
        metadata: {
          processingTime: Date.now() - startTime,
          analysisMethod: ['Image Analysis'],
          fileSize: imageAnalysis.size,
          imageResolution: `${imageAnalysis.resolution.width}x${imageAnalysis.resolution.height}`,
          detectedText: imageAnalysis.textContent
        }
      };
    } catch (error) {
      console.error('Image NSFW analysis failed:', error);
      return null;
    }
  }

  /**
   * Analyze image for NSFW content
   */
  private async analyzeImage(imageBuffer: Buffer, filename: string): Promise<ImageAnalysisResult> {
    try {
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const size = imageBuffer.length;
      const resolution = { 
        width: metadata.width || 0, 
        height: metadata.height || 0 
      };
      const format = metadata.format || 'unknown';

      // For now, use basic analysis - in production, integrate with proper NSFW detection API
      const basicAnalysis = await this.basicImageAnalysis(imageBuffer);
      
      // Extract text from image if possible
      let textContent: string | undefined;
      try {
        // This would use OCR to extract text from images
        textContent = await this.extractTextFromImage(imageBuffer);
      } catch {
        // OCR failed, continue without text
      }

      return {
        filename,
        size,
        resolution,
        format,
        isNSFW: basicAnalysis.isNSFW,
        confidence: basicAnalysis.confidence,
        categories: basicAnalysis.categories,
        detectedObjects: basicAnalysis.objects,
        textContent
      };
    } catch (error) {
      console.error('Image analysis failed:', error);
      return {
        filename,
        size: 0,
        resolution: { width: 0, height: 0 },
        format: 'unknown',
        isNSFW: false,
        confidence: 0,
        categories: {},
        detectedObjects: []
      };
    }
  }

  /**
   * Basic image analysis (placeholder for proper NSFW detection)
   */
  private async basicImageAnalysis(imageBuffer: Buffer): Promise<{
    isNSFW: boolean;
    confidence: number;
    categories: { [key: string]: number };
    objects: string[];
  }> {
    // This is a placeholder - in production, use a proper NSFW detection API
    // such as AWS Rekognition, Google Vision API, or a dedicated NSFW detection service
    
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const size = imageBuffer.length;
      
      // Basic heuristics based on image properties
      let suspicionScore = 0;
      const reasons: string[] = [];
      
      // Large images are more likely to be inappropriate in some contexts
      if (size > 5 * 1024 * 1024) { // 5MB+
        suspicionScore += 0.1;
      }
      
      // Very small images might be hiding content
      if (size < 1024) { // < 1KB
        suspicionScore += 0.1;
      }
      
      // Unusual aspect ratios might indicate cropped/edited content
      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        if (aspectRatio > 3 || aspectRatio < 0.33) {
          suspicionScore += 0.1;
        }
      }
      
      return {
        isNSFW: suspicionScore > 0.5, // Very conservative threshold
        confidence: suspicionScore,
        categories: {
          neutral: 1 - suspicionScore,
          suspicious: suspicionScore
        },
        objects: []
      };
    } catch (error) {
      return {
        isNSFW: false,
        confidence: 0,
        categories: { neutral: 1 },
        objects: []
      };
    }
  }

  /**
   * Extract text from image using OCR
   */
  private async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    // Placeholder for OCR implementation
    // In production, integrate with Tesseract.js or cloud OCR services
    return '';
  }

  /**
   * Analyze links in content for NSFW material
   */
  async analyzeLinks(content: string, userId: string): Promise<NSFWAnalysisResult[]> {
    const results: NSFWAnalysisResult[] = [];
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex) || [];
    
    for (const url of urls) {
      try {
        const linkAnalysis = await this.analyzeLinkContent(url, userId);
        if (linkAnalysis && linkAnalysis.isNSFW) {
          results.push(linkAnalysis);
        }
      } catch (error) {
        console.error(`Link analysis failed for ${url}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Analyze link content for NSFW material
   */
  private async analyzeLinkContent(url: string, userId: string): Promise<NSFWAnalysisResult | null> {
    const startTime = Date.now();
    
    try {
      // Check against known domains
      const domain = new URL(url).hostname.toLowerCase();
      const suspiciousDomains = [
        'pornhub.com', 'xvideos.com', 'xhamster.com', 'redtube.com',
        'onlyfans.com', 'chaturbate.com', 'cam4.com', 'myfreecams.com'
      ];
      
      const isKnownNSFW = suspiciousDomains.some(suspicious => 
        domain.includes(suspicious)
      );
      
      if (isKnownNSFW) {
        return {
          isNSFW: true,
          confidence: 0.95,
          type: 'link',
          categories: { explicit: 0.95, sexual: 0.9, suggestive: 0.8 },
          reasons: [`Known NSFW domain: ${domain}`],
          riskLevel: 'critical',
          recommendedAction: 'block',
          metadata: {
            processingTime: Date.now() - startTime,
            analysisMethod: ['Domain Analysis']
          }
        };
      }
      
      // For other domains, we could fetch and analyze content
      // But this requires careful handling to avoid security issues
      
      return null;
    } catch (error) {
      console.error('Link analysis failed:', error);
      return null;
    }
  }

  /**
   * Execute NSFW-related actions
   */
  private async executeNSFWActions(
    messageId: string,
    userId: string,
    results: NSFWAnalysisResult[],
    serverId?: string
  ): Promise<void> {
    try {
      const highestRisk = results.reduce((max, result) => 
        result.confidence > max.confidence ? result : max
      );

      // Delete message if configured
      if (this.config.autoModeration.deleteContent) {
        await this.queue.add('delete-message', {
          messageId,
          reason: `NSFW content detected: ${highestRisk.reasons.join(', ')}`,
          moderatorId: 'system'
        });
      }

      // Warn user
      if (this.config.autoModeration.warnUser) {
        await this.queue.add('warn-user', {
          userId,
          reason: 'NSFW content policy violation',
          serverId,
          message: 'Your message contained inappropriate content and has been removed.'
        });
      }

      // Timeout user for severe violations
      if (highestRisk.riskLevel === 'critical' || highestRisk.confidence > 0.9) {
        await this.queue.add('timeout-user', {
          userId,
          duration: this.config.autoModeration.timeoutDuration,
          reason: 'NSFW content violation',
          serverId
        });
      }
    } catch (error) {
      console.error('Failed to execute NSFW actions:', error);
    }
  }

  /**
   * Helper methods
   */
  private isWhitelisted(userId: string, channelId: string): boolean {
    return this.config.whitelist.userIds.includes(userId) ||
           this.config.whitelist.channelIds.includes(channelId);
  }

  private isImage(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      maxContentLength: 10 * 1024 * 1024 // 10MB max
    });
    
    return Buffer.from(response.data);
  }

  private calculateRiskLevel(confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.4) return 'medium';
    return 'low';
  }

  private getRecommendedAction(confidence: number, riskLevel: string): 'allow' | 'flag' | 'blur' | 'block' {
    if (riskLevel === 'critical' || confidence >= 0.9) return 'block';
    if (riskLevel === 'high' || confidence >= 0.7) return 'blur';
    if (riskLevel === 'medium' || confidence >= 0.4) return 'flag';
    return 'allow';
  }

  private getCacheKey(type: string, content: string): string {
    return require('crypto')
      .createHash('md5')
      .update(type + content)
      .digest('hex');
  }

  private async logNSFWAnalysis(
    messageId: string,
    userId: string,
    results: NSFWAnalysisResult[],
    serverId?: string
  ): Promise<void> {
    try {
      if (serverId) {
        await prisma.auditLog.create({
          data: {
            serverId,
            userId: 'system',
            targetId: userId,
            actionType: 995, // NSFW detection action type
            reason: 'NSFW content analysis',
            options: {
              messageId,
              detectionCount: results.length,
              maxConfidence: Math.max(...results.map(r => r.confidence)),
              types: results.map(r => r.type),
              actions: results.map(r => r.recommendedAction),
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      console.log(`🔞 NSFW analysis: ${results.length} detection(s) - Max confidence: ${Math.max(...results.map(r => r.confidence)).toFixed(2)}`);
    } catch (error) {
      console.error('Failed to log NSFW analysis:', error);
    }
  }

  /**
   * Start cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.analysisCache.entries()) {
        if (now - cached.timestamp > 300000) { // 5 minutes
          this.analysisCache.delete(key);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): NSFWConfig {
    return {
      textThresholds: {
        sexual: 0.6,
        suggestive: 0.4,
        explicit: 0.8
      },
      imageThresholds: {
        porn: 0.8,
        sexy: 0.6,
        hentai: 0.7,
        neutral: 0.2
      },
      enabledChecks: {
        text: true,
        images: true,
        links: true,
        attachments: true
      },
      whitelist: {
        userIds: [],
        channelIds: [],
        domains: []
      },
      autoModeration: {
        enabled: true,
        deleteContent: true,
        warnUser: true,
        timeoutDuration: 1800 // 30 minutes
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<NSFWConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalAnalyses: number;
    nsfwDetected: number;
    byType: { [type: string]: number };
    byRiskLevel: { [level: string]: number };
    cacheSize: number;
  } {
    // This would be implemented with proper metrics collection
    return {
      totalAnalyses: 0,
      nsfwDetected: 0,
      byType: {},
      byRiskLevel: {},
      cacheSize: this.analysisCache.size
    };
  }
}