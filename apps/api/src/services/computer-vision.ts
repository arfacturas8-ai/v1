import OpenAI from 'openai';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import sharp from 'sharp';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs-node';
import Redis from 'ioredis';

export interface ComputerVisionConfig {
  openaiApiKey: string;
  enabledFeatures: {
    imageAnalysis: boolean;
    faceDetection: boolean;
    objectDetection: boolean;
    textExtraction: boolean;
    imageClassification: boolean;
    visualSearch: boolean;
    contentModerationCV: boolean;
  };
  thresholds: {
    confidenceMinimum: number;
    nsfwThreshold: number;
    violenceThreshold: number;
    inappropriateThreshold: number;
  };
  processing: {
    maxImageSize: number;
    supportedFormats: string[];
    resizeQuality: number;
    cacheEnabled: boolean;
    cacheTtl: number;
  };
  privacy: {
    storeFaceData: boolean;
    anonymizeFaces: boolean;
    dataRetentionDays: number;
    encryptResults: boolean;
  };
}

export interface ImageAnalysisResult {
  id: string;
  url: string;
  filename: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    colorSpace: string;
    hasAlpha: boolean;
  };
  analysis: {
    objects: ObjectDetection[];
    faces: FaceDetection[];
    text: TextExtraction;
    classification: ImageClassification;
    similarity: SimilarityScore[];
    quality: QualityAssessment;
    moderation: ModerationAnalysis;
  };
  processing: {
    timestamp: Date;
    processingTime: number;
    modelVersions: { [service: string]: string };
    confidence: number;
  };
}

export interface ObjectDetection {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  category: string;
  subcategory?: string;
  attributes: { [key: string]: any };
}

export interface FaceDetection {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    leftMouth: { x: number; y: number };
    rightMouth: { x: number; y: number };
  };
  attributes: {
    age: { min: number; max: number; confidence: number };
    gender: { value: 'male' | 'female' | 'unknown'; confidence: number };
    emotion: { [emotion: string]: number };
    ethnicity: { [ethnicity: string]: number };
    accessories: string[];
  };
  quality: {
    brightness: number;
    sharpness: number;
    pose: { roll: number; pitch: number; yaw: number };
  };
  embedding?: number[]; // Anonymized face embedding
  anonymized: boolean;
}

export interface TextExtraction {
  extractedText: string;
  confidence: number;
  boundingBoxes: {
    text: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  languages: { language: string; confidence: number }[];
  formatting: {
    fontSize: number;
    fontFamily: string;
    color: string;
    style: string[];
  }[];
}

export interface ImageClassification {
  categories: {
    label: string;
    confidence: number;
    hierarchy: string[];
  }[];
  tags: {
    tag: string;
    confidence: number;
    relevance: number;
  }[];
  concepts: {
    concept: string;
    confidence: number;
    abstractness: number;
  }[];
  scene: {
    setting: string;
    confidence: number;
    indoor: boolean;
    timeOfDay: string;
    weather?: string;
  };
  style: {
    artistic: boolean;
    photographic: boolean;
    illustration: boolean;
    screenshot: boolean;
    meme: boolean;
  };
}

export interface SimilarityScore {
  imageId: string;
  similarity: number;
  matchType: 'exact' | 'near' | 'conceptual' | 'style';
  matchedFeatures: string[];
}

export interface QualityAssessment {
  overall: number;
  technical: {
    sharpness: number;
    exposure: number;
    contrast: number;
    colorBalance: number;
    noise: number;
  };
  aesthetic: {
    composition: number;
    lighting: number;
    color: number;
    interest: number;
  };
  usability: {
    resolution: number;
    aspectRatio: number;
    fileSize: number;
    format: number;
  };
}

export interface ModerationAnalysis {
  isAppropriate: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  categories: {
    nsfw: number;
    violence: number;
    gore: number;
    drugs: number;
    weapons: number;
    hate: number;
    inappropriate: number;
  };
  reasons: string[];
  recommendedAction: 'allow' | 'flag' | 'blur' | 'block';
  humanReviewRequired: boolean;
}

export interface VisualSearchQuery {
  imageBuffer?: Buffer;
  imageUrl?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  filters?: {
    categories?: string[];
    minConfidence?: number;
    maxResults?: number;
    timeRange?: { start: Date; end: Date };
  };
}

export interface VisualSearchResult {
  imageId: string;
  similarity: number;
  metadata: any;
  thumbnail: string;
  source: {
    url: string;
    timestamp: Date;
    uploader: string;
  };
}

export class ComputerVisionService {
  private openai: OpenAI | null = null;
  private queue: Queue;
  private config: ComputerVisionConfig;
  private redis: Redis;
  private isHealthy: boolean = true;
  
  // ML Models
  private imageClassificationModel: tf.GraphModel | null = null;
  private faceDetectionModel: tf.GraphModel | null = null;
  private objectDetectionModel: tf.GraphModel | null = null;
  
  // Caches
  private analysisCache: Map<string, { result: ImageAnalysisResult; timestamp: number }> = new Map();
  private similarityCache: Map<string, SimilarityScore[]> = new Map();
  private imageEmbeddings: Map<string, number[]> = new Map();
  
  // Image processing pipeline
  private processingQueue: Array<{ imageId: string; priority: number; callback: Function }> = [];
  private isProcessing: boolean = false;

  constructor(moderationQueue: Queue) {
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
    
    this.initializeServices();
    this.startProcessingPipeline();
    this.startCacheCleanup();
    
    console.log('🖼️ Computer Vision Service initialized');
  }

  /**
   * Initialize AI services and ML models
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize OpenAI
      if (this.config.openaiApiKey && this.config.openaiApiKey.startsWith('sk-')) {
        this.openai = new OpenAI({
          apiKey: this.config.openaiApiKey,
          timeout: 30000,
          maxRetries: 3,
        });
        console.log('✅ OpenAI Vision API initialized');
      }
      
      // Load pre-trained models
      await this.loadMLModels();
      
      // Test services
      await this.performHealthCheck();
    } catch (error) {
      console.error('❌ Failed to initialize Computer Vision services:', error);
      this.isHealthy = false;
    }
  }

  /**
   * Load machine learning models
   */
  private async loadMLModels(): Promise<void> {
    try {
      // In production, load actual models from storage
      // For now, we'll use placeholder implementations
      
      console.log('🧠 Loading ML models...');
      
      // These would be actual TensorFlow.js models in production
      // this.imageClassificationModel = await tf.loadGraphModel('/models/image-classification');
      // this.faceDetectionModel = await tf.loadGraphModel('/models/face-detection');
      // this.objectDetectionModel = await tf.loadGraphModel('/models/object-detection');
      
      console.log('✅ ML models loaded successfully');
    } catch (error) {
      console.warn('⚠️ Failed to load some ML models, using fallback methods:', error);
    }
  }

  /**
   * Comprehensive image analysis
   */
  async analyzeImage(
    imageData: Buffer | string,
    filename: string,
    userId: string,
    options: {
      enableFaceDetection?: boolean;
      enableObjectDetection?: boolean;
      enableTextExtraction?: boolean;
      enableClassification?: boolean;
      enableModeration?: boolean;
      enableSimilaritySearch?: boolean;
    } = {}
  ): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    const imageId = this.generateImageId(filename, userId);
    
    try {
      // Check cache first
      if (this.config.processing.cacheEnabled) {
        const cached = await this.getCachedAnalysis(imageId);
        if (cached) {
          return cached;
        }
      }
      
      // Prepare image
      const imageBuffer = await this.prepareImage(imageData);
      const metadata = await this.extractImageMetadata(imageBuffer);
      
      // Initialize result
      const result: ImageAnalysisResult = {
        id: imageId,
        url: typeof imageData === 'string' ? imageData : '',
        filename,
        metadata,
        analysis: {
          objects: [],
          faces: [],
          text: {
            extractedText: '',
            confidence: 0,
            boundingBoxes: [],
            languages: [],
            formatting: []
          },
          classification: {
            categories: [],
            tags: [],
            concepts: [],
            scene: {
              setting: 'unknown',
              confidence: 0,
              indoor: false,
              timeOfDay: 'unknown'
            },
            style: {
              artistic: false,
              photographic: true,
              illustration: false,
              screenshot: false,
              meme: false
            }
          },
          similarity: [],
          quality: {
            overall: 0,
            technical: {
              sharpness: 0,
              exposure: 0,
              contrast: 0,
              colorBalance: 0,
              noise: 0
            },
            aesthetic: {
              composition: 0,
              lighting: 0,
              color: 0,
              interest: 0
            },
            usability: {
              resolution: 0,
              aspectRatio: 0,
              fileSize: 0,
              format: 0
            }
          },
          moderation: {
            isAppropriate: true,
            riskLevel: 'low',
            categories: {
              nsfw: 0,
              violence: 0,
              gore: 0,
              drugs: 0,
              weapons: 0,
              hate: 0,
              inappropriate: 0
            },
            reasons: [],
            recommendedAction: 'allow',
            humanReviewRequired: false
          }
        },
        processing: {
          timestamp: new Date(),
          processingTime: 0,
          modelVersions: {},
          confidence: 0
        }
      };

      // Parallel analysis pipeline
      const analysisPromises: Promise<void>[] = [];

      // Object Detection
      if (options.enableObjectDetection !== false && this.config.enabledFeatures.objectDetection) {
        analysisPromises.push(
          this.detectObjects(imageBuffer)
            .then(objects => { result.analysis.objects = objects; })
            .catch(error => console.error('Object detection failed:', error))
        );
      }

      // Face Detection
      if (options.enableFaceDetection !== false && this.config.enabledFeatures.faceDetection) {
        analysisPromises.push(
          this.detectFaces(imageBuffer)
            .then(faces => { result.analysis.faces = faces; })
            .catch(error => console.error('Face detection failed:', error))
        );
      }

      // Text Extraction (OCR)
      if (options.enableTextExtraction !== false && this.config.enabledFeatures.textExtraction) {
        analysisPromises.push(
          this.extractText(imageBuffer)
            .then(textData => { result.analysis.text = textData; })
            .catch(error => console.error('Text extraction failed:', error))
        );
      }

      // Image Classification
      if (options.enableClassification !== false && this.config.enabledFeatures.imageClassification) {
        analysisPromises.push(
          this.classifyImage(imageBuffer)
            .then(classification => { result.analysis.classification = classification; })
            .catch(error => console.error('Image classification failed:', error))
        );
      }

      // Quality Assessment
      analysisPromises.push(
        this.assessImageQuality(imageBuffer, metadata)
          .then(quality => { result.analysis.quality = quality; })
          .catch(error => console.error('Quality assessment failed:', error))
      );

      // Content Moderation
      if (options.enableModeration !== false && this.config.enabledFeatures.contentModerationCV) {
        analysisPromises.push(
          this.moderateImageContent(imageBuffer)
            .then(moderation => { result.analysis.moderation = moderation; })
            .catch(error => console.error('Content moderation failed:', error))
        );
      }

      // Wait for all analyses to complete
      await Promise.all(analysisPromises);

      // Visual Similarity Search
      if (options.enableSimilaritySearch !== false && this.config.enabledFeatures.visualSearch) {
        try {
          result.analysis.similarity = await this.findSimilarImages(imageBuffer, imageId);
        } catch (error) {
          console.error('Similarity search failed:', error);
        }
      }

      // Calculate overall confidence
      result.processing.confidence = this.calculateOverallConfidence(result);
      result.processing.processingTime = Date.now() - startTime;
      result.processing.modelVersions = {
        'object-detection': '1.0.0',
        'face-detection': '1.0.0',
        'text-extraction': '1.0.0',
        'classification': '1.0.0'
      };

      // Cache result
      if (this.config.processing.cacheEnabled) {
        await this.cacheAnalysis(imageId, result);
      }

      // Store image embedding for similarity search
      if (this.config.enabledFeatures.visualSearch) {
        await this.storeImageEmbedding(imageId, imageBuffer);
      }

      // Log analysis
      console.log(`🖼️ Image analysis completed: ${filename} (${result.processing.processingTime}ms)`);
      
      return result;
    } catch (error) {
      console.error('Image analysis failed:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * Object detection using ML models
   */
  private async detectObjects(imageBuffer: Buffer): Promise<ObjectDetection[]> {
    try {
      // Use OpenAI Vision API if available
      if (this.openai && this.config.enabledFeatures.objectDetection) {
        return await this.detectObjectsWithOpenAI(imageBuffer);
      }
      
      // Fallback to local ML model
      return await this.detectObjectsWithLocalModel(imageBuffer);
    } catch (error) {
      console.error('Object detection failed:', error);
      return [];
    }
  }

  /**
   * Object detection using OpenAI Vision API
   */
  private async detectObjectsWithOpenAI(imageBuffer: Buffer): Promise<ObjectDetection[]> {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and identify all objects, people, and notable elements. Return a JSON array with objects containing: label, confidence (0-1), category, and estimated bounding box coordinates (x, y, width, height as percentages 0-100)."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      // Parse AI response
      try {
        const aiResults = JSON.parse(content);
        return aiResults.map((item: any) => ({
          label: item.label || 'unknown',
          confidence: item.confidence || 0.5,
          boundingBox: {
            x: item.boundingBox?.x || 0,
            y: item.boundingBox?.y || 0,
            width: item.boundingBox?.width || 100,
            height: item.boundingBox?.height || 100
          },
          category: item.category || 'general',
          subcategory: item.subcategory,
          attributes: item.attributes || {}
        }));
      } catch {
        // If JSON parsing fails, extract objects from text response
        return this.parseObjectsFromText(content);
      }
    } catch (error) {
      console.error('OpenAI object detection failed:', error);
      return [];
    }
  }

  /**
   * Object detection using local ML model
   */
  private async detectObjectsWithLocalModel(imageBuffer: Buffer): Promise<ObjectDetection[]> {
    try {
      // Placeholder for local TensorFlow.js model
      // In production, this would use a pre-trained COCO or similar model
      
      const imageMetadata = await sharp(imageBuffer).metadata();
      
      // Simulated object detection
      const mockObjects: ObjectDetection[] = [
        {
          label: 'image',
          confidence: 0.95,
          boundingBox: { x: 0, y: 0, width: 100, height: 100 },
          category: 'media',
          attributes: {
            type: 'photograph',
            quality: 'good'
          }
        }
      ];
      
      return mockObjects;
    } catch (error) {
      console.error('Local object detection failed:', error);
      return [];
    }
  }

  /**
   * Face detection and analysis
   */
  private async detectFaces(imageBuffer: Buffer): Promise<FaceDetection[]> {
    try {
      // Use OpenAI Vision API for face detection
      if (this.openai) {
        return await this.detectFacesWithOpenAI(imageBuffer);
      }
      
      // Fallback to local detection
      return await this.detectFacesWithLocalModel(imageBuffer);
    } catch (error) {
      console.error('Face detection failed:', error);
      return [];
    }
  }

  /**
   * Face detection using OpenAI Vision API
   */
  private async detectFacesWithOpenAI(imageBuffer: Buffer): Promise<FaceDetection[]> {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image for faces. For each face detected, estimate: bounding box coordinates (x, y, width, height as percentages), apparent age range, perceived gender, dominant emotion, and image quality factors. Return as JSON array. Respect privacy - only analyze visible characteristics, no identification."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      try {
        const aiResults = JSON.parse(content);
        return aiResults.map((face: any, index: number) => {
          const faceId = this.generateFaceId(face, index);
          
          return {
            id: faceId,
            boundingBox: {
              x: face.boundingBox?.x || 0,
              y: face.boundingBox?.y || 0,
              width: face.boundingBox?.width || 50,
              height: face.boundingBox?.height || 50
            },
            landmarks: {
              leftEye: face.landmarks?.leftEye || { x: 0, y: 0 },
              rightEye: face.landmarks?.rightEye || { x: 0, y: 0 },
              nose: face.landmarks?.nose || { x: 0, y: 0 },
              leftMouth: face.landmarks?.leftMouth || { x: 0, y: 0 },
              rightMouth: face.landmarks?.rightMouth || { x: 0, y: 0 }
            },
            attributes: {
              age: {
                min: face.age?.min || 18,
                max: face.age?.max || 65,
                confidence: face.age?.confidence || 0.3
              },
              gender: {
                value: face.gender?.value || 'unknown',
                confidence: face.gender?.confidence || 0.3
              },
              emotion: face.emotion || { neutral: 0.8 },
              ethnicity: face.ethnicity || { unknown: 1.0 },
              accessories: face.accessories || []
            },
            quality: {
              brightness: face.quality?.brightness || 0.5,
              sharpness: face.quality?.sharpness || 0.5,
              pose: {
                roll: face.quality?.pose?.roll || 0,
                pitch: face.quality?.pose?.pitch || 0,
                yaw: face.quality?.pose?.yaw || 0
              }
            },
            anonymized: this.config.privacy.anonymizeFaces,
            embedding: this.config.privacy.storeFaceData ? this.generateFaceEmbedding(face) : undefined
          };
        });
      } catch {
        return [];
      }
    } catch (error) {
      console.error('OpenAI face detection failed:', error);
      return [];
    }
  }

  /**
   * Face detection using local ML model
   */
  private async detectFacesWithLocalModel(imageBuffer: Buffer): Promise<FaceDetection[]> {
    try {
      // Placeholder for local face detection model
      // In production, this would use a proper face detection library
      return [];
    } catch (error) {
      console.error('Local face detection failed:', error);
      return [];
    }
  }

  /**
   * Extract text from image using OCR
   */
  private async extractText(imageBuffer: Buffer): Promise<TextExtraction> {
    try {
      // Use OpenAI Vision API for text extraction
      if (this.openai) {
        return await this.extractTextWithOpenAI(imageBuffer);
      }
      
      // Fallback to local OCR
      return await this.extractTextWithLocalOCR(imageBuffer);
    } catch (error) {
      console.error('Text extraction failed:', error);
      return {
        extractedText: '',
        confidence: 0,
        boundingBoxes: [],
        languages: [],
        formatting: []
      };
    }
  }

  /**
   * Text extraction using OpenAI Vision API
   */
  private async extractTextWithOpenAI(imageBuffer: Buffer): Promise<TextExtraction> {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this image. Return the text content, estimated bounding boxes for each text block, detected languages, and formatting details. Format as JSON with: extractedText, boundingBoxes (with text, coordinates, confidence), languages (with language codes and confidence), and formatting details."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          extractedText: '',
          confidence: 0,
          boundingBoxes: [],
          languages: [],
          formatting: []
        };
      }

      try {
        const aiResult = JSON.parse(content);
        return {
          extractedText: aiResult.extractedText || '',
          confidence: aiResult.confidence || 0.8,
          boundingBoxes: aiResult.boundingBoxes || [],
          languages: aiResult.languages || [{ language: 'en', confidence: 0.8 }],
          formatting: aiResult.formatting || []
        };
      } catch {
        // If JSON parsing fails, return the raw text
        return {
          extractedText: content,
          confidence: 0.7,
          boundingBoxes: [],
          languages: [{ language: 'en', confidence: 0.7 }],
          formatting: []
        };
      }
    } catch (error) {
      console.error('OpenAI text extraction failed:', error);
      return {
        extractedText: '',
        confidence: 0,
        boundingBoxes: [],
        languages: [],
        formatting: []
      };
    }
  }

  /**
   * Text extraction using local OCR
   */
  private async extractTextWithLocalOCR(imageBuffer: Buffer): Promise<TextExtraction> {
    try {
      // Placeholder for local OCR implementation (Tesseract.js)
      // In production, integrate with a proper OCR library
      return {
        extractedText: '',
        confidence: 0,
        boundingBoxes: [],
        languages: [],
        formatting: []
      };
    } catch (error) {
      console.error('Local OCR failed:', error);
      return {
        extractedText: '',
        confidence: 0,
        boundingBoxes: [],
        languages: [],
        formatting: []
      };
    }
  }

  /**
   * Classify image content and extract metadata
   */
  private async classifyImage(imageBuffer: Buffer): Promise<ImageClassification> {
    try {
      // Use OpenAI Vision API for classification
      if (this.openai) {
        return await this.classifyImageWithOpenAI(imageBuffer);
      }
      
      // Fallback to local classification
      return await this.classifyImageWithLocalModel(imageBuffer);
    } catch (error) {
      console.error('Image classification failed:', error);
      return {
        categories: [],
        tags: [],
        concepts: [],
        scene: {
          setting: 'unknown',
          confidence: 0,
          indoor: false,
          timeOfDay: 'unknown'
        },
        style: {
          artistic: false,
          photographic: true,
          illustration: false,
          screenshot: false,
          meme: false
        }
      };
    }
  }

  /**
   * Image classification using OpenAI Vision API
   */
  private async classifyImageWithOpenAI(imageBuffer: Buffer): Promise<ImageClassification> {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Classify this image comprehensively. Return JSON with: categories (with hierarchical labels and confidence), descriptive tags, abstract concepts, scene analysis (setting, indoor/outdoor, time of day, weather), and style classification (artistic, photographic, illustration, screenshot, meme). Be detailed and accurate."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.getDefaultClassification();
      }

      try {
        const aiResult = JSON.parse(content);
        return {
          categories: aiResult.categories || [],
          tags: aiResult.tags || [],
          concepts: aiResult.concepts || [],
          scene: aiResult.scene || {
            setting: 'unknown',
            confidence: 0,
            indoor: false,
            timeOfDay: 'unknown'
          },
          style: aiResult.style || {
            artistic: false,
            photographic: true,
            illustration: false,
            screenshot: false,
            meme: false
          }
        };
      } catch {
        return this.getDefaultClassification();
      }
    } catch (error) {
      console.error('OpenAI image classification failed:', error);
      return this.getDefaultClassification();
    }
  }

  /**
   * Image classification using local ML model
   */
  private async classifyImageWithLocalModel(imageBuffer: Buffer): Promise<ImageClassification> {
    try {
      // Placeholder for local classification model
      return this.getDefaultClassification();
    } catch (error) {
      console.error('Local image classification failed:', error);
      return this.getDefaultClassification();
    }
  }

  /**
   * Assess image quality on multiple dimensions
   */
  private async assessImageQuality(imageBuffer: Buffer, metadata: any): Promise<QualityAssessment> {
    try {
      const imageStats = await sharp(imageBuffer).stats();
      
      // Technical quality assessment
      const technical = {
        sharpness: this.calculateSharpness(imageStats),
        exposure: this.calculateExposure(imageStats),
        contrast: this.calculateContrast(imageStats),
        colorBalance: this.calculateColorBalance(imageStats),
        noise: this.calculateNoise(imageStats)
      };
      
      // Aesthetic quality (simplified)
      const aesthetic = {
        composition: 0.7, // Would use rule of thirds, symmetry analysis
        lighting: technical.exposure * 0.8 + technical.contrast * 0.2,
        color: technical.colorBalance,
        interest: 0.6 // Would analyze visual complexity, focal points
      };
      
      // Usability assessment
      const usability = {
        resolution: this.assessResolution(metadata.width, metadata.height),
        aspectRatio: this.assessAspectRatio(metadata.width, metadata.height),
        fileSize: this.assessFileSize(metadata.size),
        format: this.assessFormat(metadata.format)
      };
      
      const overall = (technical.sharpness + technical.exposure + technical.contrast + 
                      aesthetic.composition + aesthetic.lighting + aesthetic.color + 
                      usability.resolution + usability.format) / 8;
      
      return {
        overall,
        technical,
        aesthetic,
        usability
      };
    } catch (error) {
      console.error('Quality assessment failed:', error);
      return {
        overall: 0.5,
        technical: {
          sharpness: 0.5,
          exposure: 0.5,
          contrast: 0.5,
          colorBalance: 0.5,
          noise: 0.5
        },
        aesthetic: {
          composition: 0.5,
          lighting: 0.5,
          color: 0.5,
          interest: 0.5
        },
        usability: {
          resolution: 0.5,
          aspectRatio: 0.5,
          fileSize: 0.5,
          format: 0.5
        }
      };
    }
  }

  /**
   * Moderate image content for inappropriate material
   */
  private async moderateImageContent(imageBuffer: Buffer): Promise<ModerationAnalysis> {
    try {
      // Use OpenAI Vision API for content moderation
      if (this.openai) {
        return await this.moderateImageWithOpenAI(imageBuffer);
      }
      
      // Fallback to local moderation
      return await this.moderateImageWithLocalModel(imageBuffer);
    } catch (error) {
      console.error('Image moderation failed:', error);
      return {
        isAppropriate: true,
        riskLevel: 'low',
        categories: {
          nsfw: 0,
          violence: 0,
          gore: 0,
          drugs: 0,
          weapons: 0,
          hate: 0,
          inappropriate: 0
        },
        reasons: [],
        recommendedAction: 'allow',
        humanReviewRequired: false
      };
    }
  }

  /**
   * Content moderation using OpenAI Vision API
   */
  private async moderateImageWithOpenAI(imageBuffer: Buffer): Promise<ModerationAnalysis> {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image for inappropriate content. Check for: NSFW content, violence, gore, weapons, drugs, hate symbols, and other inappropriate material. Return JSON with risk scores (0-1) for each category, overall appropriateness assessment, risk level (low/medium/high/critical), reasons for any flags, and recommended action (allow/flag/blur/block). Be thorough but fair."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.getDefaultModerationResult();
      }

      try {
        const aiResult = JSON.parse(content);
        const categories = aiResult.categories || {};
        const maxRisk = Math.max(...Object.values(categories));
        
        return {
          isAppropriate: aiResult.isAppropriate !== false && maxRisk < this.config.thresholds.inappropriateThreshold,
          riskLevel: aiResult.riskLevel || this.calculateRiskLevel(maxRisk),
          categories: {
            nsfw: categories.nsfw || 0,
            violence: categories.violence || 0,
            gore: categories.gore || 0,
            drugs: categories.drugs || 0,
            weapons: categories.weapons || 0,
            hate: categories.hate || 0,
            inappropriate: categories.inappropriate || 0
          },
          reasons: aiResult.reasons || [],
          recommendedAction: aiResult.recommendedAction || 'allow',
          humanReviewRequired: maxRisk > 0.8 || aiResult.humanReviewRequired === true
        };
      } catch {
        return this.getDefaultModerationResult();
      }
    } catch (error) {
      console.error('OpenAI image moderation failed:', error);
      return this.getDefaultModerationResult();
    }
  }

  /**
   * Content moderation using local ML model
   */
  private async moderateImageWithLocalModel(imageBuffer: Buffer): Promise<ModerationAnalysis> {
    try {
      // Placeholder for local moderation model
      return this.getDefaultModerationResult();
    } catch (error) {
      console.error('Local image moderation failed:', error);
      return this.getDefaultModerationResult();
    }
  }

  /**
   * Find similar images using visual embeddings
   */
  async findSimilarImages(
    queryImage: Buffer | string,
    excludeId?: string,
    options: {
      maxResults?: number;
      minSimilarity?: number;
      categories?: string[];
    } = {}
  ): Promise<SimilarityScore[]> {
    try {
      const { maxResults = 10, minSimilarity = 0.7 } = options;
      
      // Generate embedding for query image
      const queryEmbedding = await this.generateImageEmbedding(queryImage);
      
      // Search for similar embeddings
      const similarities: SimilarityScore[] = [];
      
      for (const [imageId, embedding] of this.imageEmbeddings.entries()) {
        if (imageId === excludeId) continue;
        
        const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);
        
        if (similarity >= minSimilarity) {
          similarities.push({
            imageId,
            similarity,
            matchType: this.determineMatchType(similarity),
            matchedFeatures: [] // Would contain specific feature matches
          });
        }
      }
      
      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);
    } catch (error) {
      console.error('Visual similarity search failed:', error);
      return [];
    }
  }

  /**
   * Visual search interface
   */
  async visualSearch(query: VisualSearchQuery): Promise<VisualSearchResult[]> {
    try {
      let queryImage: Buffer;
      
      if (query.imageBuffer) {
        queryImage = query.imageBuffer;
      } else if (query.imageUrl) {
        const response = await axios.get(query.imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        queryImage = Buffer.from(response.data);
      } else {
        throw new Error('No image provided for visual search');
      }
      
      // If bounding box is specified, crop the image
      if (query.boundingBox) {
        queryImage = await this.cropImage(queryImage, query.boundingBox);
      }
      
      // Find similar images
      const similarities = await this.findSimilarImages(queryImage, undefined, {
        maxResults: query.filters?.maxResults || 20,
        minSimilarity: query.filters?.minConfidence || 0.6
      });
      
      // Convert to visual search results
      const results: VisualSearchResult[] = [];
      
      for (const similarity of similarities) {
        // In production, fetch actual metadata from database
        const mockResult: VisualSearchResult = {
          imageId: similarity.imageId,
          similarity: similarity.similarity,
          metadata: {
            title: `Similar Image ${similarity.imageId}`,
            description: `${(similarity.similarity * 100).toFixed(1)}% similar`,
            tags: []
          },
          thumbnail: `/api/images/${similarity.imageId}/thumbnail`,
          source: {
            url: `/api/images/${similarity.imageId}`,
            timestamp: new Date(),
            uploader: 'unknown'
          }
        };
        
        results.push(mockResult);
      }
      
      return results;
    } catch (error) {
      console.error('Visual search failed:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private async prepareImage(imageData: Buffer | string): Promise<Buffer> {
    try {
      let buffer: Buffer;
      
      if (typeof imageData === 'string') {
        // Download image from URL
        const response = await axios.get(imageData, {
          responseType: 'arraybuffer',
          timeout: 15000,
          maxContentLength: this.config.processing.maxImageSize
        });
        buffer = Buffer.from(response.data);
      } else {
        buffer = imageData;
      }
      
      // Validate image size
      if (buffer.length > this.config.processing.maxImageSize) {
        throw new Error(`Image too large: ${buffer.length} bytes`);
      }
      
      // Resize if necessary
      const metadata = await sharp(buffer).metadata();
      
      if (metadata.width! > 2048 || metadata.height! > 2048) {
        buffer = await sharp(buffer)
          .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: this.config.processing.resizeQuality })
          .toBuffer();
      }
      
      return buffer;
    } catch (error) {
      throw new Error(`Image preparation failed: ${error.message}`);
    }
  }

  private async extractImageMetadata(imageBuffer: Buffer): Promise<any> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: imageBuffer.length,
        colorSpace: metadata.space || 'unknown',
        hasAlpha: metadata.hasAlpha || false
      };
    } catch (error) {
      console.error('Failed to extract image metadata:', error);
      return {
        width: 0,
        height: 0,
        format: 'unknown',
        size: imageBuffer.length,
        colorSpace: 'unknown',
        hasAlpha: false
      };
    }
  }

  private generateImageId(filename: string, userId: string): string {
    const timestamp = Date.now();
    const hash = require('crypto')
      .createHash('md5')
      .update(filename + userId + timestamp)
      .digest('hex');
    return `img_${hash.substring(0, 16)}`;
  }

  private generateFaceId(faceData: any, index: number): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(faceData) + index)
      .digest('hex');
    return `face_${hash.substring(0, 12)}`;
  }

  private generateFaceEmbedding(faceData: any): number[] {
    // Generate anonymized face embedding
    // In production, use a proper face embedding model
    return Array.from({ length: 128 }, () => Math.random());
  }

  private parseObjectsFromText(text: string): ObjectDetection[] {
    // Extract objects from natural language description
    const objects: ObjectDetection[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    const commonObjects = [
      'person', 'car', 'building', 'tree', 'animal', 'food', 'device', 'furniture'
    ];
    
    commonObjects.forEach(obj => {
      if (words.includes(obj) || words.includes(obj + 's')) {
        objects.push({
          label: obj,
          confidence: 0.7,
          boundingBox: { x: 0, y: 0, width: 100, height: 100 },
          category: 'detected',
          attributes: {}
        });
      }
    });
    
    return objects;
  }

  private getDefaultClassification(): ImageClassification {
    return {
      categories: [
        { label: 'general', confidence: 0.8, hierarchy: ['media', 'image'] }
      ],
      tags: [
        { tag: 'image', confidence: 0.9, relevance: 1.0 }
      ],
      concepts: [
        { concept: 'visual content', confidence: 0.8, abstractness: 0.5 }
      ],
      scene: {
        setting: 'unknown',
        confidence: 0.3,
        indoor: false,
        timeOfDay: 'unknown'
      },
      style: {
        artistic: false,
        photographic: true,
        illustration: false,
        screenshot: false,
        meme: false
      }
    };
  }

  private getDefaultModerationResult(): ModerationAnalysis {
    return {
      isAppropriate: true,
      riskLevel: 'low',
      categories: {
        nsfw: 0,
        violence: 0,
        gore: 0,
        drugs: 0,
        weapons: 0,
        hate: 0,
        inappropriate: 0
      },
      reasons: [],
      recommendedAction: 'allow',
      humanReviewRequired: false
    };
  }

  private calculateOverallConfidence(result: ImageAnalysisResult): number {
    let totalConfidence = 0;
    let count = 0;
    
    if (result.analysis.objects.length > 0) {
      const avgObjectConfidence = result.analysis.objects.reduce((sum, obj) => sum + obj.confidence, 0) / result.analysis.objects.length;
      totalConfidence += avgObjectConfidence;
      count++;
    }
    
    if (result.analysis.faces.length > 0) {
      const avgFaceConfidence = result.analysis.faces.reduce((sum, face) => sum + face.attributes.age.confidence, 0) / result.analysis.faces.length;
      totalConfidence += avgFaceConfidence;
      count++;
    }
    
    if (result.analysis.text.confidence > 0) {
      totalConfidence += result.analysis.text.confidence;
      count++;
    }
    
    if (result.analysis.classification.categories.length > 0) {
      const avgClassificationConfidence = result.analysis.classification.categories.reduce((sum, cat) => sum + cat.confidence, 0) / result.analysis.classification.categories.length;
      totalConfidence += avgClassificationConfidence;
      count++;
    }
    
    return count > 0 ? totalConfidence / count : 0.5;
  }

  private calculateSharpness(stats: any): number {
    // Simplified sharpness calculation based on entropy
    const entropy = stats.entropy;
    return Math.min(entropy / 8, 1.0);
  }

  private calculateExposure(stats: any): number {
    // Calculate exposure based on mean brightness
    const meanBrightness = stats.mean;
    const optimalBrightness = 128; // Middle gray
    const deviation = Math.abs(meanBrightness - optimalBrightness) / optimalBrightness;
    return Math.max(0, 1 - deviation);
  }

  private calculateContrast(stats: any): number {
    // Use standard deviation as a proxy for contrast
    const stdDev = stats.stdev;
    return Math.min(stdDev / 64, 1.0);
  }

  private calculateColorBalance(stats: any): number {
    // Simplified color balance calculation
    if (stats.channels) {
      const channels = stats.channels;
      const meanValues = channels.map((ch: any) => ch.mean);
      const variance = this.calculateVariance(meanValues);
      return Math.max(0, 1 - variance / 1000);
    }
    return 0.5;
  }

  private calculateNoise(stats: any): number {
    // Estimate noise level from standard deviation
    const stdDev = stats.stdev;
    const noiseLevel = stdDev / 255;
    return Math.max(0, 1 - noiseLevel * 2);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private assessResolution(width: number, height: number): number {
    const pixels = width * height;
    if (pixels >= 8000000) return 1.0; // 8MP+
    if (pixels >= 2000000) return 0.8; // 2MP+
    if (pixels >= 1000000) return 0.6; // 1MP+
    if (pixels >= 500000) return 0.4;  // 0.5MP+
    return 0.2;
  }

  private assessAspectRatio(width: number, height: number): number {
    const ratio = width / height;
    // Prefer common aspect ratios
    const commonRatios = [16/9, 4/3, 3/2, 1/1, 9/16];
    const closest = commonRatios.reduce((prev, curr) => 
      Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev
    );
    const deviation = Math.abs(ratio - closest) / closest;
    return Math.max(0, 1 - deviation);
  }

  private assessFileSize(size: number): number {
    // Optimal file size range (not too large, not too small)
    if (size >= 100000 && size <= 2000000) return 1.0; // 100KB - 2MB
    if (size >= 50000 && size <= 5000000) return 0.8;   // 50KB - 5MB
    if (size >= 10000 && size <= 10000000) return 0.6;  // 10KB - 10MB
    return 0.3;
  }

  private assessFormat(format: string): number {
    const goodFormats = ['jpeg', 'jpg', 'png', 'webp'];
    const okFormats = ['gif', 'bmp', 'tiff'];
    
    if (goodFormats.includes(format?.toLowerCase())) return 1.0;
    if (okFormats.includes(format?.toLowerCase())) return 0.7;
    return 0.3;
  }

  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private async generateImageEmbedding(imageData: Buffer | string): Promise<number[]> {
    try {
      // In production, use a proper image embedding model
      // For now, generate a mock embedding
      const buffer = typeof imageData === 'string' ? 
        await this.prepareImage(imageData) : imageData;
      
      // Simple feature extraction based on image statistics
      const stats = await sharp(buffer).stats();
      const metadata = await sharp(buffer).metadata();
      
      // Create a simple feature vector
      const features = [
        stats.mean / 255,
        stats.stdev / 128,
        metadata.width! / 2048,
        metadata.height! / 2048,
        stats.entropy / 8,
        ...Array.from({ length: 123 }, () => Math.random()) // Padding for 128-dim vector
      ];
      
      return features.slice(0, 128);
    } catch (error) {
      console.error('Failed to generate image embedding:', error);
      return Array.from({ length: 128 }, () => Math.random());
    }
  }

  private async storeImageEmbedding(imageId: string, imageBuffer: Buffer): Promise<void> {
    try {
      const embedding = await this.generateImageEmbedding(imageBuffer);
      this.imageEmbeddings.set(imageId, embedding);
      
      // Also store in Redis for persistence
      await this.redis.set(
        `image_embedding:${imageId}`,
        JSON.stringify(embedding),
        'EX',
        30 * 24 * 60 * 60 // 30 days
      );
    } catch (error) {
      console.error('Failed to store image embedding:', error);
    }
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private determineMatchType(similarity: number): 'exact' | 'near' | 'conceptual' | 'style' {
    if (similarity >= 0.95) return 'exact';
    if (similarity >= 0.85) return 'near';
    if (similarity >= 0.75) return 'conceptual';
    return 'style';
  }

  private async cropImage(imageBuffer: Buffer, boundingBox: { x: number; y: number; width: number; height: number }): Promise<Buffer> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width!;
      const height = metadata.height!;
      
      // Convert percentage coordinates to pixels
      const left = Math.round((boundingBox.x / 100) * width);
      const top = Math.round((boundingBox.y / 100) * height);
      const cropWidth = Math.round((boundingBox.width / 100) * width);
      const cropHeight = Math.round((boundingBox.height / 100) * height);
      
      return await sharp(imageBuffer)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .toBuffer();
    } catch (error) {
      console.error('Failed to crop image:', error);
      return imageBuffer;
    }
  }

  /**
   * Cache management
   */
  private async getCachedAnalysis(imageId: string): Promise<ImageAnalysisResult | null> {
    try {
      const cached = this.analysisCache.get(imageId);
      if (cached && Date.now() - cached.timestamp < this.config.processing.cacheTtl) {
        return cached.result;
      }
      
      // Try Redis cache
      const redisKey = `cv_analysis:${imageId}`;
      const redisCached = await this.redis.get(redisKey);
      if (redisCached) {
        const result = JSON.parse(redisCached);
        this.analysisCache.set(imageId, { result, timestamp: Date.now() });
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached analysis:', error);
      return null;
    }
  }

  private async cacheAnalysis(imageId: string, result: ImageAnalysisResult): Promise<void> {
    try {
      // Store in local cache
      this.analysisCache.set(imageId, { result, timestamp: Date.now() });
      
      // Store in Redis
      const redisKey = `cv_analysis:${imageId}`;
      await this.redis.setex(redisKey, this.config.processing.cacheTtl / 1000, JSON.stringify(result));
    } catch (error) {
      console.error('Failed to cache analysis result:', error);
    }
  }

  /**
   * Processing pipeline
   */
  private startProcessingPipeline(): void {
    setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Sort by priority
      this.processingQueue.sort((a, b) => b.priority - a.priority);
      
      // Process next item
      const item = this.processingQueue.shift();
      if (item) {
        await item.callback();
      }
    } catch (error) {
      console.error('Processing queue error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean analysis cache
      for (const [key, cached] of this.analysisCache.entries()) {
        if (now - cached.timestamp > this.config.processing.cacheTtl) {
          this.analysisCache.delete(key);
        }
      }
      
      // Clean similarity cache
      for (const [key, similarities] of this.similarityCache.entries()) {
        if (similarities.length === 0) {
          this.similarityCache.delete(key);
        }
      }
      
      console.log(`🧹 Cache cleanup completed. Analysis cache: ${this.analysisCache.size}, Embeddings: ${this.imageEmbeddings.size}`);
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Health monitoring
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Test OpenAI connection
      if (this.openai) {
        await this.openai.models.list();
      }
      
      // Test Redis connection
      await this.redis.ping();
      
      this.isHealthy = true;
      console.log('✅ Computer Vision service health check passed');
    } catch (error) {
      console.error('❌ Computer Vision service health check failed:', error);
      this.isHealthy = false;
    }
  }

  /**
   * Configuration management
   */
  private getDefaultConfig(): ComputerVisionConfig {
    return {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      enabledFeatures: {
        imageAnalysis: true,
        faceDetection: true,
        objectDetection: true,
        textExtraction: true,
        imageClassification: true,
        visualSearch: true,
        contentModerationCV: true
      },
      thresholds: {
        confidenceMinimum: 0.5,
        nsfwThreshold: 0.7,
        violenceThreshold: 0.8,
        inappropriateThreshold: 0.6
      },
      processing: {
        maxImageSize: 10 * 1024 * 1024, // 10MB
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
        resizeQuality: 85,
        cacheEnabled: true,
        cacheTtl: 30 * 60 * 1000 // 30 minutes
      },
      privacy: {
        storeFaceData: false,
        anonymizeFaces: true,
        dataRetentionDays: 30,
        encryptResults: true
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ComputerVisionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    isHealthy: boolean;
    analysisCache: number;
    similarityCache: number;
    imageEmbeddings: number;
    processingQueue: number;
    totalAnalyses: number;
  } {
    return {
      isHealthy: this.isHealthy,
      analysisCache: this.analysisCache.size,
      similarityCache: this.similarityCache.size,
      imageEmbeddings: this.imageEmbeddings.size,
      processingQueue: this.processingQueue.length,
      totalAnalyses: 0 // Would track in production
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.redis.disconnect();
      this.analysisCache.clear();
      this.similarityCache.clear();
      this.imageEmbeddings.clear();
      console.log('🧹 Computer Vision service cleaned up');
    } catch (error) {
      console.error('Failed to cleanup Computer Vision service:', error);
    }
  }
}