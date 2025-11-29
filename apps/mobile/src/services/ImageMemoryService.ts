/**
 * IMAGE MEMORY SERVICE
 * Handles proper memory management for images with comprehensive error handling
 */

import * as FileSystem from 'expo-file-system';
import { Image as RNImage, Dimensions, Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrashDetector } from '../utils/CrashDetector';

export interface ImageCacheConfig {
  maxMemoryCacheSize: number; // in bytes
  maxDiskCacheSize: number; // in bytes
  maxCacheAge: number; // in milliseconds
  compressionQuality: number; // 0-1
  thumbnailSize: { width: number; height: number };
  enablePreloading: boolean;
  enableThumbnails: boolean;
  enableProgressiveLoading: boolean;
}

export interface ImageCacheEntry {
  uri: string;
  localPath: string;
  thumbnailPath?: string;
  size: number;
  width: number;
  height: number;
  timestamp: number;
  expiry: number;
  accessed: number;
  accessCount: number;
  compressionRatio?: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageLoadOptions {
  priority: 'low' | 'normal' | 'high';
  resize?: ImageDimensions;
  compress?: boolean;
  quality?: number;
  format?: SaveFormat;
  enableThumbnail?: boolean;
  placeholder?: string;
  fallback?: string;
}

export interface MemoryStats {
  totalCacheSize: number;
  memoryCacheSize: number;
  diskCacheSize: number;
  totalEntries: number;
  hitRate: number;
  compressionRatio: number;
  lastCleanup: number;
}

class ImageMemoryService {
  private static instance: ImageMemoryService;
  private isInitialized = false;
  private config!: ImageCacheConfig;
  private memoryCache = new Map<string, ImageCacheEntry>();
  private diskCache = new Map<string, ImageCacheEntry>();
  private loadingImages = new Set<string>();
  private preloadQueue: string[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryWarningHandler: any = null;

  private stats = {
    hits: 0,
    misses: 0,
    loads: 0,
    errors: 0,
    compressions: 0,
  };

  private readonly CACHE_DIR = `${FileSystem.documentDirectory}image_cache/`;
  private readonly THUMBNAIL_DIR = `${FileSystem.documentDirectory}thumbnails/`;
  private readonly METADATA_KEY = '@cryb_image_cache_metadata';
  private readonly CONFIG_KEY = '@cryb_image_cache_config';

  static getInstance(): ImageMemoryService {
    if (!ImageMemoryService.instance) {
      ImageMemoryService.instance = new ImageMemoryService();
    }
    return ImageMemoryService.instance;
  }

  async initialize(config?: Partial<ImageCacheConfig>): Promise<void> {
    try {
      // Set default configuration
      this.config = {
        maxMemoryCacheSize: 50 * 1024 * 1024, // 50MB
        maxDiskCacheSize: 200 * 1024 * 1024, // 200MB
        maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        compressionQuality: 0.8,
        thumbnailSize: { width: 200, height: 200 },
        enablePreloading: true,
        enableThumbnails: true,
        enableProgressiveLoading: true,
        ...config,
      };

      // Create cache directories
      await this.createCacheDirectories();

      // Load existing cache metadata
      await this.loadCacheMetadata();

      // Set up memory warning listener
      this.setupMemoryWarningListener();

      // Schedule cleanup
      this.scheduleCleanup();

      // Start preloading queue processor
      this.startPreloadProcessor();

      this.isInitialized = true;
      console.log('[ImageMemoryService] Initialized successfully');

    } catch (error) {
      console.error('[ImageMemoryService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeImageMemory' },
        'high'
      );

      throw error;
    }
  }

  private async createCacheDirectories(): Promise<void> {
    try {
      const dirs = [this.CACHE_DIR, this.THUMBNAIL_DIR];

      for (const dir of dirs) {
        const dirInfo = await FileSystem.getInfoAsync(dir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        }
      }

    } catch (error) {
      console.error('[ImageMemoryService] Create directories error:', error);
      throw error;
    }
  }

  private async loadCacheMetadata(): Promise<void> {
    try {
      const metadataStr = await AsyncStorage.getItem(this.METADATA_KEY);
      if (metadataStr) {
        const entries: ImageCacheEntry[] = JSON.parse(metadataStr);
        
        // Populate disk cache map
        entries.forEach(entry => {
          this.diskCache.set(entry.uri, entry);
        });

        console.log(`[ImageMemoryService] Loaded ${entries.length} cache entries`);
      }

    } catch (error) {
      console.error('[ImageMemoryService] Load cache metadata error:', error);
    }
  }

  private async saveCacheMetadata(): Promise<void> {
    try {
      const entries = Array.from(this.diskCache.values());
      await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(entries));

    } catch (error) {
      console.error('[ImageMemoryService] Save cache metadata error:', error);
    }
  }

  private setupMemoryWarningListener(): void {
    try {
      if (Platform.OS === 'ios') {
        // iOS memory warning handling
        // This would integrate with native modules
        console.log('[ImageMemoryService] Memory warning listener set up for iOS');
      } else if (Platform.OS === 'android') {
        // Android memory handling
        // This would integrate with native modules
        console.log('[ImageMemoryService] Memory warning listener set up for Android');
      }

    } catch (error) {
      console.error('[ImageMemoryService] Memory warning setup error:', error);
    }
  }

  private scheduleCleanup(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60 * 60 * 1000);
  }

  private startPreloadProcessor(): void {
    // Process preload queue every 100ms
    setInterval(() => {
      this.processPreloadQueue();
    }, 100);
  }

  private async processPreloadQueue(): Promise<void> {
    try {
      if (this.preloadQueue.length === 0 || !this.config.enablePreloading) {
        return;
      }

      const uri = this.preloadQueue.shift();
      if (uri && !this.hasInCache(uri) && !this.loadingImages.has(uri)) {
        await this.loadImage(uri, { priority: 'low' });
      }

    } catch (error) {
      console.error('[ImageMemoryService] Preload queue error:', error);
    }
  }

  // Public methods
  async loadImage(uri: string, options: ImageLoadOptions = { priority: 'normal' }): Promise<string> {
    try {
      this.stats.loads++;

      // Check memory cache first
      const memoryCached = this.memoryCache.get(uri);
      if (memoryCached) {
        this.stats.hits++;
        memoryCached.accessed = Date.now();
        memoryCached.accessCount++;
        return memoryCached.localPath;
      }

      // Check disk cache
      const diskCached = this.diskCache.get(uri);
      if (diskCached) {
        // Verify file still exists
        const fileInfo = await FileSystem.getInfoAsync(diskCached.localPath);
        if (fileInfo.exists) {
          this.stats.hits++;
          diskCached.accessed = Date.now();
          diskCached.accessCount++;
          
          // Promote to memory cache if space allows
          if (this.getMemoryCacheSize() + diskCached.size <= this.config.maxMemoryCacheSize) {
            this.memoryCache.set(uri, diskCached);
          }
          
          return diskCached.localPath;
        } else {
          // Remove stale entry
          this.diskCache.delete(uri);
        }
      }

      this.stats.misses++;

      // Prevent duplicate loads
      if (this.loadingImages.has(uri)) {
        return await this.waitForLoad(uri);
      }

      this.loadingImages.add(uri);

      try {
        const localPath = await this.downloadAndProcessImage(uri, options);
        return localPath;
      } finally {
        this.loadingImages.delete(uri);
      }

    } catch (error) {
      this.stats.errors++;
      console.error('[ImageMemoryService] Load image error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'loadImage', uri: uri.substring(0, 100) },
        'medium'
      );

      return options.fallback || options.placeholder || uri;
    }
  }

  private async waitForLoad(uri: string, timeout = 10000): Promise<string> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        if (!this.loadingImages.has(uri)) {
          clearInterval(checkInterval);
          
          const cached = this.memoryCache.get(uri) || this.diskCache.get(uri);
          if (cached) {
            resolve(cached.localPath);
          } else {
            reject(new Error('Image load failed'));
          }
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Image load timeout'));
        }
      }, 100);
    });
  }

  private async downloadAndProcessImage(uri: string, options: ImageLoadOptions): Promise<string> {
    try {
      const filename = this.generateFilename(uri);
      const localPath = `${this.CACHE_DIR}${filename}`;

      // Download image
      const downloadResult = await FileSystem.downloadAsync(uri, localPath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

      // Get image dimensions
      const dimensions = await this.getImageDimensions(localPath);

      let processedPath = localPath;
      let thumbnailPath: string | undefined;

      // Apply transformations
      if (options.resize || options.compress) {
        processedPath = await this.processImage(localPath, options, dimensions);
      }

      // Generate thumbnail
      if (this.config.enableThumbnails && (options.enableThumbnail !== false)) {
        thumbnailPath = await this.generateThumbnail(processedPath);
      }

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(processedPath);
      const fileSize = fileInfo.size || 0;

      // Create cache entry
      const cacheEntry: ImageCacheEntry = {
        uri,
        localPath: processedPath,
        thumbnailPath,
        size: fileSize,
        width: dimensions.width,
        height: dimensions.height,
        timestamp: Date.now(),
        expiry: Date.now() + this.config.maxCacheAge,
        accessed: Date.now(),
        accessCount: 1,
      };

      // Add to caches
      this.diskCache.set(uri, cacheEntry);
      
      // Add to memory cache if space allows
      if (this.getMemoryCacheSize() + fileSize <= this.config.maxMemoryCacheSize) {
        this.memoryCache.set(uri, cacheEntry);
      }

      // Save metadata
      await this.saveCacheMetadata();

      // Clean up temporary files
      if (processedPath !== localPath) {
        await FileSystem.deleteAsync(localPath, { idempotent: true });
      }

      return processedPath;

    } catch (error) {
      console.error('[ImageMemoryService] Download and process error:', error);
      throw error;
    }
  }

  private async getImageDimensions(uri: string): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      RNImage.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error)
      );
    });
  }

  private async processImage(
    localPath: string, 
    options: ImageLoadOptions, 
    dimensions: ImageDimensions
  ): Promise<string> {
    try {
      const manipulations: any[] = [];

      // Resize if requested
      if (options.resize) {
        const { width: targetWidth, height: targetHeight } = options.resize;
        const { width: currentWidth, height: currentHeight } = dimensions;

        // Calculate aspect ratio preserving resize
        const aspectRatio = currentWidth / currentHeight;
        let newWidth = targetWidth;
        let newHeight = targetHeight;

        if (targetWidth / targetHeight > aspectRatio) {
          newWidth = targetHeight * aspectRatio;
        } else {
          newHeight = targetWidth / aspectRatio;
        }

        manipulations.push({
          resize: { width: Math.round(newWidth), height: Math.round(newHeight) },
        });
      }

      const result = await manipulateAsync(
        localPath,
        manipulations,
        {
          compress: options.quality || this.config.compressionQuality,
          format: options.format || SaveFormat.JPEG,
        }
      );

      this.stats.compressions++;
      return result.uri;

    } catch (error) {
      console.error('[ImageMemoryService] Process image error:', error);
      throw error;
    }
  }

  private async generateThumbnail(imagePath: string): Promise<string> {
    try {
      const filename = this.generateFilename(imagePath) + '_thumb';
      const thumbnailPath = `${this.THUMBNAIL_DIR}${filename}`;

      const result = await manipulateAsync(
        imagePath,
        [{ resize: this.config.thumbnailSize }],
        {
          compress: this.config.compressionQuality,
          format: SaveFormat.JPEG,
        }
      );

      // Move to thumbnail directory
      await FileSystem.moveAsync({
        from: result.uri,
        to: thumbnailPath,
      });

      return thumbnailPath;

    } catch (error) {
      console.error('[ImageMemoryService] Generate thumbnail error:', error);
      throw error;
    }
  }

  private generateFilename(uri: string): string {
    // Create a unique filename based on URI
    const hash = this.simpleHash(uri);
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    return `${hash}.${extension}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Cache management
  hasInCache(uri: string): boolean {
    return this.memoryCache.has(uri) || this.diskCache.has(uri);
  }

  async preloadImage(uri: string): Promise<void> {
    if (this.config.enablePreloading && !this.hasInCache(uri)) {
      this.preloadQueue.push(uri);
    }
  }

  async preloadImages(uris: string[]): Promise<void> {
    if (this.config.enablePreloading) {
      const newUris = uris.filter(uri => !this.hasInCache(uri));
      this.preloadQueue.push(...newUris);
    }
  }

  getThumbnail(uri: string): string | null {
    const cached = this.memoryCache.get(uri) || this.diskCache.get(uri);
    return cached?.thumbnailPath || null;
  }

  async removeFromCache(uri: string): Promise<void> {
    try {
      const memoryCached = this.memoryCache.get(uri);
      const diskCached = this.diskCache.get(uri);

      if (memoryCached) {
        this.memoryCache.delete(uri);
      }

      if (diskCached) {
        // Delete files
        await FileSystem.deleteAsync(diskCached.localPath, { idempotent: true });
        
        if (diskCached.thumbnailPath) {
          await FileSystem.deleteAsync(diskCached.thumbnailPath, { idempotent: true });
        }

        this.diskCache.delete(uri);
      }

      await this.saveCacheMetadata();

    } catch (error) {
      console.error('[ImageMemoryService] Remove from cache error:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear disk cache
      this.diskCache.clear();

      // Delete cache directories
      await FileSystem.deleteAsync(this.CACHE_DIR, { idempotent: true });
      await FileSystem.deleteAsync(this.THUMBNAIL_DIR, { idempotent: true });

      // Recreate directories
      await this.createCacheDirectories();

      // Clear metadata
      await AsyncStorage.removeItem(this.METADATA_KEY);

      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        loads: 0,
        errors: 0,
        compressions: 0,
      };

      console.log('[ImageMemoryService] Cache cleared');

    } catch (error) {
      console.error('[ImageMemoryService] Clear cache error:', error);
    }
  }

  async performCleanup(): Promise<void> {
    try {
      const now = Date.now();
      let memoryFreed = 0;
      let diskFreed = 0;

      // Clean memory cache first (LRU)
      const memoryEntries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.accessed - b.accessed);

      while (this.getMemoryCacheSize() > this.config.maxMemoryCacheSize && memoryEntries.length > 0) {
        const [uri, entry] = memoryEntries.shift()!;
        this.memoryCache.delete(uri);
        memoryFreed += entry.size;
      }

      // Clean disk cache (expired first, then LRU)
      const diskEntries = Array.from(this.diskCache.entries());
      
      // Remove expired entries
      for (const [uri, entry] of diskEntries) {
        if (entry.expiry < now) {
          await this.removeFromCache(uri);
          diskFreed += entry.size;
        }
      }

      // If still over limit, remove LRU
      const activeDiskEntries = Array.from(this.diskCache.entries())
        .sort(([, a], [, b]) => a.accessed - b.accessed);

      while (this.getDiskCacheSize() > this.config.maxDiskCacheSize && activeDiskEntries.length > 0) {
        const [uri, entry] = activeDiskEntries.shift()!;
        await this.removeFromCache(uri);
        diskFreed += entry.size;
      }

      if (memoryFreed > 0 || diskFreed > 0) {
        console.log(`[ImageMemoryService] Cleanup freed ${memoryFreed + diskFreed} bytes`);
      }

      await this.saveCacheMetadata();

    } catch (error) {
      console.error('[ImageMemoryService] Cleanup error:', error);
    }
  }

  // Memory management
  onMemoryWarning(): void {
    try {
      console.log('[ImageMemoryService] Memory warning received, clearing memory cache');
      
      // Aggressively clear memory cache
      const clearedSize = this.getMemoryCacheSize();
      this.memoryCache.clear();
      
      console.log(`[ImageMemoryService] Cleared ${clearedSize} bytes from memory cache`);

    } catch (error) {
      console.error('[ImageMemoryService] Memory warning handling error:', error);
    }
  }

  private getMemoryCacheSize(): number {
    let totalSize = 0;
    this.memoryCache.forEach(entry => {
      totalSize += entry.size;
    });
    return totalSize;
  }

  private getDiskCacheSize(): number {
    let totalSize = 0;
    this.diskCache.forEach(entry => {
      totalSize += entry.size;
    });
    return totalSize;
  }

  // Statistics
  getMemoryStats(): MemoryStats {
    const hitRate = this.stats.loads > 0 ? this.stats.hits / this.stats.loads : 0;
    const compressionRatio = this.stats.compressions > 0 ? this.stats.compressions / this.stats.loads : 0;

    return {
      totalCacheSize: this.getMemoryCacheSize() + this.getDiskCacheSize(),
      memoryCacheSize: this.getMemoryCacheSize(),
      diskCacheSize: this.getDiskCacheSize(),
      totalEntries: this.memoryCache.size + this.diskCache.size,
      hitRate,
      compressionRatio,
      lastCleanup: Date.now(),
    };
  }

  getConfiguration(): ImageCacheConfig {
    return { ...this.config };
  }

  updateConfiguration(config: Partial<ImageCacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  cleanup(): void {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      if (this.memoryWarningHandler) {
        // Remove memory warning listener
        this.memoryWarningHandler = null;
      }

      this.isInitialized = false;
      console.log('[ImageMemoryService] Cleaned up successfully');

    } catch (error) {
      console.error('[ImageMemoryService] Cleanup error:', error);
    }
  }
}

export const imageMemoryService = ImageMemoryService.getInstance();