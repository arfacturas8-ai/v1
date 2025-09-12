import { AIIntegrationService } from './ai-integration';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import * as natural from 'natural';
import * as compromise from 'compromise';

export interface TaggingConfig {
  extraction: {
    minTagConfidence: number;
    maxTagsPerContent: number;
    enableAutoTagging: boolean;
    enableEntityExtraction: boolean;
    enableTopicModeling: boolean;
  };
  categorization: {
    hierarchicalCategories: boolean;
    customCategories: string[];
    confidenceThreshold: number;
    multilabel: boolean;
  };
  learning: {
    adaptiveTags: boolean;
    communityTagging: boolean;
    tagPopularityWeight: number;
    userPreferenceWeight: number;
  };
  filters: {
    excludeCommonWords: boolean;
    minWordLength: number;
    languageSupport: string[];
    customStopWords: string[];
  };
}

export interface SmartTag {
  id: string;
  text: string;
  category: string;
  confidence: number;
  source: 'ai' | 'nlp' | 'entity' | 'topic' | 'community' | 'manual';
  relevance: number;
  popularity: number;
  metadata: {
    entityType?: string;
    sentiment?: number;
    frequency?: number;
    coOccurrence?: string[];
    synonyms?: string[];
  };
}

export interface ContentCategorization {
  primary: string;
  secondary: string[];
  confidence: number;
  hierarchicalPath: string[];
  tags: SmartTag[];
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
  }>;
  topics: Array<{
    name: string;
    score: number;
    keywords: string[];
  }>;
  semanticClusters: string[];
}

export interface TaggingResult {
  contentId: string;
  content: string;
  categorization: ContentCategorization;
  suggestedTags: SmartTag[];
  automatedTags: SmartTag[];
  communityTags: SmartTag[];
  confidence: number;
  processingTime: number;
  version: string;
}

export interface CategoryHierarchy {
  name: string;
  description: string;
  keywords: string[];
  children: CategoryHierarchy[];
  parent?: string;
  aliases: string[];
  rules: Array<{
    condition: string;
    weight: number;
  }>;
}

export class SmartTaggingService {
  private aiService: AIIntegrationService;
  private queue: Queue;
  private config: TaggingConfig;
  
  // NLP Components
  private stemmer: natural.PorterStemmer;
  private tfidf: natural.TfIdf;
  private classifier: natural.BayesClassifier;
  
  // Data structures
  private tagVocabulary: Map<string, {
    tag: string;
    frequency: number;
    categories: string[];
    coOccurring: Map<string, number>;
    lastUsed: Date;
  }> = new Map();
  
  private categoryHierarchy: Map<string, CategoryHierarchy> = new Map();
  private topicModel: Map<string, number[]> = new Map();
  private entityPatterns: Map<string, RegExp[]> = new Map();
  private communityTags: Map<string, Map<string, number>> = new Map(); // contentId -> tag -> votes
  
  // Caching
  private taggingCache: Map<string, { result: TaggingResult; timestamp: number }> = new Map();

  constructor(aiService: AIIntegrationService, moderationQueue: Queue) {
    this.aiService = aiService;
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    
    this.stemmer = natural.PorterStemmer;
    this.tfidf = new natural.TfIdf();
    this.classifier = new natural.BayesClassifier();
    
    this.initializeComponents();
    this.startModelUpdates();
  }

  /**
   * Analyze content and generate smart tags and categorization
   */
  async analyzeAndTag(
    contentId: string,
    content: string,
    userId: string,
    metadata?: {
      serverId?: string;
      channelId?: string;
      contentType?: string;
      existingTags?: string[];
    }
  ): Promise<TaggingResult> {
    const startTime = Date.now();
    
    try {
      // Check cache
      const cacheKey = this.getCacheKey(contentId, content);
      const cached = this.taggingCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
        return cached.result;
      }

      // Multi-layered analysis
      const analyses = await Promise.allSettled([
        this.aiBasedTagging(content, userId),
        this.nlpBasedTagging(content),
        this.entityExtraction(content),
        this.topicModeling(content),
        this.semanticAnalysis(content),
        this.categoryClassification(content)
      ]);

      // Combine results
      const result = await this.combineTaggingResults(
        contentId,
        content,
        analyses,
        metadata,
        startTime
      );

      // Update models with new data
      await this.updateModels(content, result);

      // Cache result
      this.taggingCache.set(cacheKey, { result, timestamp: Date.now() });

      // Log tagging
      await this.logTagging(contentId, userId, result, metadata?.serverId);

      return result;
    } catch (error) {
      console.error('Smart tagging failed:', error);
      return this.createEmptyResult(contentId, content, startTime);
    }
  }

  /**
   * AI-based tagging using OpenAI
   */
  private async aiBasedTagging(content: string, userId: string): Promise<{
    tags: SmartTag[];
    categories: string[];
    confidence: number;
  }> {
    try {
      const analysis = await this.aiService.analyzeContent(content, userId, {
        categorize: true,
        extractEntities: true
      });

      const tags: SmartTag[] = [];
      
      // Convert AI categories to tags
      for (const category of analysis.categories) {
        tags.push({
          id: `ai_${category}`,
          text: category,
          category: 'topic',
          confidence: analysis.confidence,
          source: 'ai',
          relevance: 0.9,
          popularity: this.getTagPopularity(category),
          metadata: {
            frequency: 1,
            synonyms: this.getTagSynonyms(category)
          }
        });
      }

      // Convert AI entities to tags
      for (const entity of analysis.entities) {
        tags.push({
          id: `ai_entity_${entity.value}`,
          text: entity.value,
          category: entity.type,
          confidence: 0.8,
          source: 'ai',
          relevance: 0.7,
          popularity: this.getTagPopularity(entity.value),
          metadata: {
            entityType: entity.type,
            frequency: 1
          }
        });
      }

      return {
        tags,
        categories: analysis.categories,
        confidence: analysis.confidence
      };
    } catch (error) {
      console.error('AI-based tagging failed:', error);
      return { tags: [], categories: [], confidence: 0 };
    }
  }

  /**
   * NLP-based tagging using natural language processing
   */
  private async nlpBasedTagging(content: string): Promise<{
    tags: SmartTag[];
    keywords: string[];
    confidence: number;
  }> {
    try {
      // Tokenization and preprocessing
      const tokens = natural.WordTokenizer.tokenize(content.toLowerCase());
      const filtered = tokens.filter(token => 
        token.length >= this.config.filters.minWordLength &&
        !natural.stopwords.includes(token) &&
        !this.config.filters.customStopWords.includes(token)
      );

      // Stemming
      const stemmed = filtered.map(token => this.stemmer.stem(token));

      // N-gram extraction
      const bigrams = natural.NGrams.bigrams(filtered);
      const trigrams = natural.NGrams.trigrams(filtered);

      // TF-IDF analysis
      this.tfidf.addDocument(filtered);
      const docIndex = this.tfidf.documents.length - 1;
      const terms = this.tfidf.listTerms(docIndex);

      const tags: SmartTag[] = [];
      
      // Single word tags from high TF-IDF scores
      for (const term of terms.slice(0, 10)) {
        if (term.tfidf > 0.1) {
          tags.push({
            id: `nlp_${term.term}`,
            text: term.term,
            category: 'keyword',
            confidence: Math.min(term.tfidf, 1),
            source: 'nlp',
            relevance: term.tfidf,
            popularity: this.getTagPopularity(term.term),
            metadata: {
              frequency: this.countOccurrences(content, term.term),
              coOccurrence: this.getCoOccurringTerms(term.term, filtered)
            }
          });
        }
      }

      // Bigram and trigram tags
      const nGramCandidates = [...bigrams, ...trigrams];
      for (const nGram of nGramCandidates.slice(0, 5)) {
        const nGramText = Array.isArray(nGram) ? nGram.join(' ') : nGram;
        tags.push({
          id: `nlp_ngram_${nGramText.replace(/\s+/g, '_')}`,
          text: nGramText,
          category: 'phrase',
          confidence: 0.6,
          source: 'nlp',
          relevance: 0.5,
          popularity: this.getTagPopularity(nGramText),
          metadata: {
            frequency: this.countOccurrences(content, nGramText)
          }
        });
      }

      return {
        tags,
        keywords: terms.slice(0, 15).map(t => t.term),
        confidence: 0.7
      };
    } catch (error) {
      console.error('NLP-based tagging failed:', error);
      return { tags: [], keywords: [], confidence: 0 };
    }
  }

  /**
   * Entity extraction using compromise and custom patterns
   */
  private async entityExtraction(content: string): Promise<{
    tags: SmartTag[];
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>;
  }> {
    try {
      const doc = compromise(content);
      const tags: SmartTag[] = [];
      const entities: Array<{
        text: string;
        type: string;
        confidence: number;
        startIndex: number;
        endIndex: number;
      }> = [];

      // Extract different entity types
      const entityTypes = [
        { method: 'people', type: 'person' },
        { method: 'places', type: 'location' },
        { method: 'organizations', type: 'organization' },
        { method: 'dates', type: 'date' },
        { method: 'money', type: 'currency' },
        { method: 'topics', type: 'topic' }
      ];

      for (const { method, type } of entityTypes) {
        const extracted = doc[method as keyof typeof doc]();
        if (extracted && typeof extracted.out === 'function') {
          const items = extracted.out('array');
          
          for (const item of items) {
            const text = typeof item === 'string' ? item : item.text || '';
            if (text.length > 2) {
              // Find position in original text
              const startIndex = content.toLowerCase().indexOf(text.toLowerCase());
              const endIndex = startIndex + text.length;
              
              entities.push({
                text,
                type,
                confidence: 0.8,
                startIndex: Math.max(0, startIndex),
                endIndex: Math.max(0, endIndex)
              });

              tags.push({
                id: `entity_${type}_${text.replace(/\s+/g, '_')}`,
                text,
                category: type,
                confidence: 0.8,
                source: 'entity',
                relevance: 0.7,
                popularity: this.getTagPopularity(text),
                metadata: {
                  entityType: type,
                  frequency: this.countOccurrences(content, text)
                }
              });
            }
          }
        }
      }

      // Custom entity patterns
      for (const [entityType, patterns] of this.entityPatterns.entries()) {
        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            for (const match of matches) {
              entities.push({
                text: match,
                type: entityType,
                confidence: 0.6,
                startIndex: content.indexOf(match),
                endIndex: content.indexOf(match) + match.length
              });

              tags.push({
                id: `custom_entity_${entityType}_${match.replace(/\s+/g, '_')}`,
                text: match,
                category: entityType,
                confidence: 0.6,
                source: 'entity',
                relevance: 0.6,
                popularity: this.getTagPopularity(match),
                metadata: {
                  entityType,
                  frequency: 1
                }
              });
            }
          }
        }
      }

      return { tags, entities };
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return { tags: [], entities: [] };
    }
  }

  /**
   * Topic modeling using LDA-style approach
   */
  private async topicModeling(content: string): Promise<{
    tags: SmartTag[];
    topics: Array<{
      name: string;
      score: number;
      keywords: string[];
    }>;
  }> {
    try {
      // Simple topic modeling based on predefined topic keywords
      const topics = [
        { name: 'technology', keywords: ['code', 'programming', 'software', 'tech', 'api', 'app', 'system'] },
        { name: 'gaming', keywords: ['game', 'play', 'player', 'gaming', 'stream', 'twitch', 'esports'] },
        { name: 'crypto', keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'nft', 'defi', 'token'] },
        { name: 'social', keywords: ['friend', 'community', 'social', 'chat', 'talk', 'meet', 'people'] },
        { name: 'business', keywords: ['business', 'work', 'job', 'career', 'company', 'startup', 'market'] },
        { name: 'entertainment', keywords: ['movie', 'music', 'tv', 'show', 'entertainment', 'fun', 'comedy'] },
        { name: 'education', keywords: ['learn', 'study', 'education', 'school', 'university', 'course', 'tutorial'] },
        { name: 'health', keywords: ['health', 'fitness', 'medical', 'doctor', 'wellness', 'exercise', 'diet'] },
        { name: 'news', keywords: ['news', 'current', 'events', 'politics', 'world', 'breaking', 'update'] },
        { name: 'art', keywords: ['art', 'design', 'creative', 'drawing', 'painting', 'artist', 'illustration'] }
      ];

      const lowerContent = content.toLowerCase();
      const topicScores: Array<{ name: string; score: number; keywords: string[] }> = [];
      const tags: SmartTag[] = [];

      for (const topic of topics) {
        let score = 0;
        const matchedKeywords: string[] = [];
        
        for (const keyword of topic.keywords) {
          const matches = (lowerContent.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
          if (matches > 0) {
            score += matches;
            matchedKeywords.push(keyword);
          }
        }

        if (score > 0) {
          const normalizedScore = Math.min(score / content.split(' ').length * 10, 1);
          topicScores.push({
            name: topic.name,
            score: normalizedScore,
            keywords: matchedKeywords
          });

          if (normalizedScore > 0.1) {
            tags.push({
              id: `topic_${topic.name}`,
              text: topic.name,
              category: 'topic',
              confidence: normalizedScore,
              source: 'topic',
              relevance: normalizedScore,
              popularity: this.getTagPopularity(topic.name),
              metadata: {
                frequency: score,
                coOccurrence: matchedKeywords
              }
            });
          }
        }
      }

      // Sort by score
      topicScores.sort((a, b) => b.score - a.score);

      return {
        tags,
        topics: topicScores.slice(0, 5) // Top 5 topics
      };
    } catch (error) {
      console.error('Topic modeling failed:', error);
      return { tags: [], topics: [] };
    }
  }

  /**
   * Semantic analysis for understanding context
   */
  private async semanticAnalysis(content: string): Promise<{
    tags: SmartTag[];
    clusters: string[];
  }> {
    try {
      const tags: SmartTag[] = [];
      const clusters: string[] = [];

      // Intent detection
      const intents = this.detectIntents(content);
      for (const intent of intents) {
        tags.push({
          id: `intent_${intent}`,
          text: intent,
          category: 'intent',
          confidence: 0.7,
          source: 'nlp',
          relevance: 0.6,
          popularity: this.getTagPopularity(intent),
          metadata: {}
        });
      }

      // Sentiment-based tagging
      const sentiment = this.analyzeSentiment(content);
      if (Math.abs(sentiment) > 0.5) {
        const sentimentTag = sentiment > 0 ? 'positive' : 'negative';
        tags.push({
          id: `sentiment_${sentimentTag}`,
          text: sentimentTag,
          category: 'sentiment',
          confidence: Math.abs(sentiment),
          source: 'nlp',
          relevance: 0.5,
          popularity: 0.5,
          metadata: {
            sentiment
          }
        });
      }

      // Semantic clustering (simplified)
      const words = content.toLowerCase().split(/\s+/);
      const semanticGroups = this.groupWordsBySemantic(words);
      clusters.push(...semanticGroups);

      return { tags, clusters };
    } catch (error) {
      console.error('Semantic analysis failed:', error);
      return { tags: [], clusters: [] };
    }
  }

  /**
   * Category classification using hierarchical categories
   */
  private async categoryClassification(content: string): Promise<{
    primary: string;
    secondary: string[];
    confidence: number;
    hierarchicalPath: string[];
  }> {
    try {
      const lowerContent = content.toLowerCase();
      const categoryScores = new Map<string, number>();

      // Score each category
      for (const [categoryName, category] of this.categoryHierarchy.entries()) {
        let score = 0;
        
        // Keyword matching
        for (const keyword of category.keywords) {
          const matches = (lowerContent.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
          score += matches;
        }

        // Alias matching
        for (const alias of category.aliases) {
          if (lowerContent.includes(alias)) {
            score += 0.5;
          }
        }

        // Rule-based scoring
        for (const rule of category.rules) {
          if (this.evaluateRule(rule.condition, content)) {
            score += rule.weight;
          }
        }

        if (score > 0) {
          categoryScores.set(categoryName, score);
        }
      }

      // Sort categories by score
      const sortedCategories = Array.from(categoryScores.entries())
        .sort((a, b) => b[1] - a[1]);

      if (sortedCategories.length === 0) {
        return {
          primary: 'general',
          secondary: [],
          confidence: 0.1,
          hierarchicalPath: ['general']
        };
      }

      const primary = sortedCategories[0][0];
      const secondary = sortedCategories.slice(1, 4).map(([cat]) => cat);
      const confidence = Math.min(sortedCategories[0][1] / 10, 1);

      // Build hierarchical path
      const hierarchicalPath = this.buildHierarchicalPath(primary);

      return {
        primary,
        secondary,
        confidence,
        hierarchicalPath
      };
    } catch (error) {
      console.error('Category classification failed:', error);
      return {
        primary: 'general',
        secondary: [],
        confidence: 0.1,
        hierarchicalPath: ['general']
      };
    }
  }

  /**
   * Combine all tagging results
   */
  private async combineTaggingResults(
    contentId: string,
    content: string,
    analyses: PromiseSettledResult<any>[],
    metadata: any,
    startTime: number
  ): Promise<TaggingResult> {
    const allTags: SmartTag[] = [];
    let categories: string[] = [];
    let entities: any[] = [];
    let topics: any[] = [];
    let semanticClusters: string[] = [];
    let categorization = {
      primary: 'general',
      secondary: [],
      confidence: 0.1,
      hierarchicalPath: ['general']
    };

    // Process AI-based tagging
    if (analyses[0].status === 'fulfilled') {
      allTags.push(...analyses[0].value.tags);
      categories = analyses[0].value.categories;
    }

    // Process NLP-based tagging
    if (analyses[1].status === 'fulfilled') {
      allTags.push(...analyses[1].value.tags);
    }

    // Process entity extraction
    if (analyses[2].status === 'fulfilled') {
      allTags.push(...analyses[2].value.tags);
      entities = analyses[2].value.entities;
    }

    // Process topic modeling
    if (analyses[3].status === 'fulfilled') {
      allTags.push(...analyses[3].value.tags);
      topics = analyses[3].value.topics;
    }

    // Process semantic analysis
    if (analyses[4].status === 'fulfilled') {
      allTags.push(...analyses[4].value.tags);
      semanticClusters = analyses[4].value.clusters;
    }

    // Process category classification
    if (analyses[5].status === 'fulfilled') {
      categorization = analyses[5].value;
    }

    // Deduplicate and rank tags
    const uniqueTags = this.deduplicateTags(allTags);
    const rankedTags = this.rankTags(uniqueTags, content);

    // Separate automated vs suggested tags
    const automatedTags = rankedTags.filter(tag => 
      tag.confidence > this.config.extraction.minTagConfidence
    ).slice(0, this.config.extraction.maxTagsPerContent);

    const suggestedTags = rankedTags.filter(tag => 
      tag.confidence <= this.config.extraction.minTagConfidence
    ).slice(0, 10);

    // Get community tags
    const communityTags = this.getCommunityTags(contentId);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      automatedTags,
      categorization.confidence
    );

    return {
      contentId,
      content,
      categorization: {
        ...categorization,
        tags: automatedTags,
        entities,
        topics,
        semanticClusters
      },
      suggestedTags,
      automatedTags,
      communityTags,
      confidence: overallConfidence,
      processingTime: Date.now() - startTime,
      version: '1.0'
    };
  }

  /**
   * Helper methods
   */
  private deduplicateTags(tags: SmartTag[]): SmartTag[] {
    const unique = new Map<string, SmartTag>();
    
    for (const tag of tags) {
      const normalizedText = tag.text.toLowerCase().trim();
      const existing = unique.get(normalizedText);
      
      if (!existing || tag.confidence > existing.confidence) {
        unique.set(normalizedText, { ...tag, text: normalizedText });
      }
    }
    
    return Array.from(unique.values());
  }

  private rankTags(tags: SmartTag[], content: string): SmartTag[] {
    // Calculate final score for each tag
    for (const tag of tags) {
      let finalScore = tag.confidence;
      
      // Boost popular tags
      finalScore += tag.popularity * this.config.learning.tagPopularityWeight;
      
      // Boost relevant tags
      finalScore += tag.relevance * 0.3;
      
      // Boost frequently occurring tags in content
      const frequency = this.countOccurrences(content, tag.text);
      finalScore += Math.min(frequency / 10, 0.2);
      
      // Apply source-based weights
      const sourceWeights = { ai: 1.0, nlp: 0.8, entity: 0.7, topic: 0.9, community: 0.6, manual: 1.0 };
      finalScore *= sourceWeights[tag.source] || 0.5;
      
      tag.confidence = Math.min(finalScore, 1.0);
    }
    
    return tags.sort((a, b) => b.confidence - a.confidence);
  }

  private getCommunityTags(contentId: string): SmartTag[] {
    const communityTagData = this.communityTags.get(contentId);
    if (!communityTagData) return [];
    
    const tags: SmartTag[] = [];
    for (const [tagText, votes] of communityTagData.entries()) {
      if (votes > 0) {
        tags.push({
          id: `community_${tagText}`,
          text: tagText,
          category: 'community',
          confidence: Math.min(votes / 5, 1), // Max confidence at 5 votes
          source: 'community',
          relevance: 0.5,
          popularity: votes / 10,
          metadata: {
            frequency: votes
          }
        });
      }
    }
    
    return tags.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateOverallConfidence(
    automatedTags: SmartTag[],
    categorizationConfidence: number
  ): number {
    if (automatedTags.length === 0) return categorizationConfidence;
    
    const avgTagConfidence = automatedTags.reduce((sum, tag) => sum + tag.confidence, 0) / automatedTags.length;
    return (avgTagConfidence + categorizationConfidence) / 2;
  }

  // Utility methods
  private getTagPopularity(tag: string): number {
    const tagData = this.tagVocabulary.get(tag.toLowerCase());
    return tagData ? Math.min(tagData.frequency / 100, 1) : 0.1;
  }

  private getTagSynonyms(tag: string): string[] {
    const synonymMap = new Map([
      ['tech', ['technology', 'technical']],
      ['crypto', ['cryptocurrency', 'blockchain']],
      ['gaming', ['games', 'videogames']],
      ['dev', ['development', 'developer']],
    ]);
    
    return synonymMap.get(tag.toLowerCase()) || [];
  }

  private countOccurrences(content: string, term: string): number {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    return (content.match(regex) || []).length;
  }

  private getCoOccurringTerms(term: string, tokens: string[]): string[] {
    const coOccurring: string[] = [];
    const termIndex = tokens.indexOf(term);
    
    if (termIndex !== -1) {
      // Get surrounding words (context window of 3)
      for (let i = Math.max(0, termIndex - 3); i <= Math.min(tokens.length - 1, termIndex + 3); i++) {
        if (i !== termIndex && tokens[i] !== term) {
          coOccurring.push(tokens[i]);
        }
      }
    }
    
    return coOccurring.slice(0, 5); // Top 5 co-occurring terms
  }

  private detectIntents(content: string): string[] {
    const intentPatterns = [
      { pattern: /\b(help|support|assist|need)\b/gi, intent: 'help_request' },
      { pattern: /\b(question|ask|wonder|curious)\b/gi, intent: 'question' },
      { pattern: /\b(share|sharing|check out|look at)\b/gi, intent: 'sharing' },
      { pattern: /\b(feedback|opinion|thoughts|what do you think)\b/gi, intent: 'feedback_request' },
      { pattern: /\b(announce|announcement|news|update)\b/gi, intent: 'announcement' },
      { pattern: /\b(discuss|discussion|talk about)\b/gi, intent: 'discussion' },
      { pattern: /\b(recommend|suggestion|advice)\b/gi, intent: 'recommendation' }
    ];
    
    const detectedIntents: string[] = [];
    for (const { pattern, intent } of intentPatterns) {
      if (pattern.test(content)) {
        detectedIntents.push(intent);
      }
    }
    
    return detectedIntents;
  }

  private analyzeSentiment(content: string): number {
    // Simple sentiment analysis - in production, use the sentiment analysis service
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'amazing', 'love', 'like', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated'];
    
    let score = 0;
    const words = content.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    }
    
    return Math.max(-1, Math.min(1, score / words.length * 10));
  }

  private groupWordsBySemantic(words: string[]): string[] {
    // Simple semantic grouping - in production, use word embeddings
    const semanticGroups = [
      { name: 'technology_terms', words: ['code', 'programming', 'software', 'app', 'tech'] },
      { name: 'social_terms', words: ['friend', 'community', 'social', 'people', 'chat'] },
      { name: 'gaming_terms', words: ['game', 'play', 'player', 'gaming', 'stream'] },
      { name: 'business_terms', words: ['work', 'job', 'business', 'company', 'career'] }
    ];
    
    const clusters: string[] = [];
    for (const group of semanticGroups) {
      const matches = words.filter(word => group.words.includes(word)).length;
      if (matches >= 2) {
        clusters.push(group.name);
      }
    }
    
    return clusters;
  }

  private evaluateRule(condition: string, content: string): boolean {
    try {
      // Simple rule evaluation - in production, implement proper rule engine
      if (condition.includes('contains')) {
        const term = condition.split('contains')[1].trim().replace(/['"]/g, '');
        return content.toLowerCase().includes(term.toLowerCase());
      }
      
      if (condition.includes('length >')) {
        const threshold = parseInt(condition.split('length >')[1].trim());
        return content.length > threshold;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private buildHierarchicalPath(categoryName: string): string[] {
    const category = this.categoryHierarchy.get(categoryName);
    if (!category) return [categoryName];
    
    const path = [categoryName];
    if (category.parent) {
      const parentPath = this.buildHierarchicalPath(category.parent);
      path.unshift(...parentPath);
    }
    
    return path;
  }

  private getCacheKey(contentId: string, content: string): string {
    return require('crypto')
      .createHash('md5')
      .update(contentId + content.substring(0, 100))
      .digest('hex');
  }

  private createEmptyResult(contentId: string, content: string, startTime: number): TaggingResult {
    return {
      contentId,
      content,
      categorization: {
        primary: 'general',
        secondary: [],
        confidence: 0.1,
        hierarchicalPath: ['general'],
        tags: [],
        entities: [],
        topics: [],
        semanticClusters: []
      },
      suggestedTags: [],
      automatedTags: [],
      communityTags: [],
      confidence: 0.1,
      processingTime: Date.now() - startTime,
      version: '1.0'
    };
  }

  /**
   * Community tagging methods
   */
  async addCommunityTag(contentId: string, tag: string, userId: string, vote: number = 1): Promise<void> {
    try {
      let contentTags = this.communityTags.get(contentId);
      if (!contentTags) {
        contentTags = new Map();
        this.communityTags.set(contentId, contentTags);
      }
      
      const currentVotes = contentTags.get(tag) || 0;
      contentTags.set(tag, currentVotes + vote);
      
      // Update tag vocabulary
      this.updateTagVocabulary(tag);
      
      console.log(`🏷️ Community tag added: ${tag} (+${vote}) for content ${contentId}`);
    } catch (error) {
      console.error('Failed to add community tag:', error);
    }
  }

  private updateTagVocabulary(tag: string): void {
    const normalizedTag = tag.toLowerCase();
    let tagData = this.tagVocabulary.get(normalizedTag);
    
    if (!tagData) {
      tagData = {
        tag: normalizedTag,
        frequency: 0,
        categories: [],
        coOccurring: new Map(),
        lastUsed: new Date()
      };
    }
    
    tagData.frequency++;
    tagData.lastUsed = new Date();
    this.tagVocabulary.set(normalizedTag, tagData);
  }

  /**
   * Model updates and learning
   */
  private async updateModels(content: string, result: TaggingResult): Promise<void> {
    try {
      // Update TF-IDF model
      const tokens = natural.WordTokenizer.tokenize(content.toLowerCase());
      this.tfidf.addDocument(tokens);
      
      // Update category classifier
      if (result.categorization.confidence > 0.7) {
        this.classifier.addDocument(content, result.categorization.primary);
      }
      
      // Update tag vocabulary
      for (const tag of result.automatedTags) {
        this.updateTagVocabulary(tag.text);
      }
    } catch (error) {
      console.error('Failed to update models:', error);
    }
  }

  private async logTagging(
    contentId: string,
    userId: string,
    result: TaggingResult,
    serverId?: string
  ): Promise<void> {
    try {
      if (serverId && result.automatedTags.length > 0) {
        await prisma.auditLog.create({
          data: {
            serverId,
            userId: 'system',
            targetId: userId,
            actionType: 993, // Smart tagging action type
            reason: 'Content automatically tagged',
            options: {
              contentId,
              primaryCategory: result.categorization.primary,
              tagCount: result.automatedTags.length,
              tags: result.automatedTags.slice(0, 5).map(t => t.text),
              confidence: result.confidence,
              processingTime: result.processingTime,
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      console.log(`🏷️ Smart tagging: ${result.automatedTags.length} tags generated (${result.confidence.toFixed(2)} confidence)`);
    } catch (error) {
      console.error('Failed to log smart tagging:', error);
    }
  }

  /**
   * Initialize components
   */
  private initializeComponents(): void {
    // Initialize category hierarchy
    this.initializeCategoryHierarchy();
    
    // Initialize entity patterns
    this.initializeEntityPatterns();
    
    // Train initial classifier
    this.trainInitialClassifier();
    
    console.log('🧠 Smart tagging service initialized');
  }

  private initializeCategoryHierarchy(): void {
    const categories: CategoryHierarchy[] = [
      {
        name: 'technology',
        description: 'Technology and development related content',
        keywords: ['code', 'programming', 'software', 'tech', 'app', 'api', 'system', 'development'],
        children: [],
        aliases: ['tech', 'dev'],
        rules: [
          { condition: 'contains "code"', weight: 2 },
          { condition: 'contains "programming"', weight: 2 }
        ]
      },
      {
        name: 'gaming',
        description: 'Gaming and entertainment content',
        keywords: ['game', 'play', 'player', 'gaming', 'stream', 'twitch', 'esports', 'tournament'],
        children: [],
        aliases: ['games', 'videogames'],
        rules: [
          { condition: 'contains "game"', weight: 2 },
          { condition: 'contains "play"', weight: 1 }
        ]
      },
      {
        name: 'crypto',
        description: 'Cryptocurrency and blockchain content',
        keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'nft', 'defi', 'token', 'web3'],
        children: [],
        aliases: ['cryptocurrency', 'blockchain'],
        rules: [
          { condition: 'contains "bitcoin"', weight: 3 },
          { condition: 'contains "crypto"', weight: 2 }
        ]
      },
      {
        name: 'social',
        description: 'Social and community content',
        keywords: ['friend', 'community', 'social', 'chat', 'talk', 'meet', 'people', 'discussion'],
        children: [],
        aliases: ['community', 'social'],
        rules: [
          { condition: 'contains "friend"', weight: 2 },
          { condition: 'contains "community"', weight: 2 }
        ]
      }
    ];

    for (const category of categories) {
      this.categoryHierarchy.set(category.name, category);
    }
  }

  private initializeEntityPatterns(): void {
    // Custom entity patterns for specific domains
    const patterns = new Map([
      ['crypto_address', [
        /\b0x[a-fA-F0-9]{40}\b/g, // Ethereum addresses
        /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, // Bitcoin addresses
      ]],
      ['url', [
        /https?:\/\/[^\s]+/g
      ]],
      ['email', [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
      ]],
      ['mention', [
        /@\w+/g
      ]],
      ['hashtag', [
        /#\w+/g
      ]]
    ]);

    this.entityPatterns = patterns;
  }

  private trainInitialClassifier(): void {
    // Basic training data for the classifier
    const trainingData = [
      { text: 'check out this new app I built with react and node js', category: 'technology' },
      { text: 'anyone want to play some games tonight on discord', category: 'gaming' },
      { text: 'bitcoin price is going up ethereum looks good too', category: 'crypto' },
      { text: 'great to meet everyone in this awesome community', category: 'social' },
      { text: 'working on a new startup idea need some feedback', category: 'business' }
    ];

    for (const item of trainingData) {
      this.classifier.addDocument(item.text, item.category);
    }

    this.classifier.train();
  }

  /**
   * Scheduled model updates
   */
  private startModelUpdates(): void {
    // Retrain models periodically
    setInterval(() => {
      this.retrainModels();
    }, 4 * 60 * 60 * 1000); // Every 4 hours

    // Clean up old cache entries
    setInterval(() => {
      this.cleanupCache();
    }, 60 * 60 * 1000); // Every hour
  }

  private retrainModels(): void {
    try {
      // Retrain classifier with new data
      this.classifier.retrain();
      
      // Clean up old tag vocabulary entries
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      for (const [tag, data] of this.tagVocabulary.entries()) {
        if (data.lastUsed < oneMonthAgo && data.frequency < 5) {
          this.tagVocabulary.delete(tag);
        }
      }
      
      console.log('🔄 Smart tagging models retrained');
    } catch (error) {
      console.error('Failed to retrain models:', error);
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.taggingCache.entries()) {
      if (now - cached.timestamp > 300000) { // 5 minutes
        this.taggingCache.delete(key);
      }
    }
  }

  /**
   * Configuration management
   */
  private getDefaultConfig(): TaggingConfig {
    return {
      extraction: {
        minTagConfidence: 0.5,
        maxTagsPerContent: 10,
        enableAutoTagging: true,
        enableEntityExtraction: true,
        enableTopicModeling: true
      },
      categorization: {
        hierarchicalCategories: true,
        customCategories: [],
        confidenceThreshold: 0.3,
        multilabel: true
      },
      learning: {
        adaptiveTags: true,
        communityTagging: true,
        tagPopularityWeight: 0.2,
        userPreferenceWeight: 0.1
      },
      filters: {
        excludeCommonWords: true,
        minWordLength: 3,
        languageSupport: ['en'],
        customStopWords: ['um', 'uh', 'like', 'you know']
      }
    };
  }

  updateConfig(newConfig: Partial<TaggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalTagsGenerated: number;
    vocabularySize: number;
    categoriesCount: number;
    communityTagsCount: number;
    averageConfidence: number;
    cacheSize: number;
  } {
    let totalCommunityTags = 0;
    for (const contentTags of this.communityTags.values()) {
      totalCommunityTags += contentTags.size;
    }

    return {
      totalTagsGenerated: 0, // Would track actual count
      vocabularySize: this.tagVocabulary.size,
      categoriesCount: this.categoryHierarchy.size,
      communityTagsCount: totalCommunityTags,
      averageConfidence: 0.7, // Would calculate actual average
      cacheSize: this.taggingCache.size
    };
  }
}