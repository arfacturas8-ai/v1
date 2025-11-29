import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';

export interface CacheOptions {
  ttl?: number; // seconds
  vary?: string[]; // headers to vary by
  staleWhileRevalidate?: number; // seconds
  mustRevalidate?: boolean;
  public?: boolean;
  immutable?: boolean;
}

/**
 * Advanced caching middleware for media endpoints
 */
export function createCacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 3600, // 1 hour default
    vary = ['Accept', 'Accept-Encoding'],
    staleWhileRevalidate = 300, // 5 minutes
    mustRevalidate = false,
    public: isPublic = true,
    immutable = false
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const method = request.method.toUpperCase();
    
    // Only cache GET and HEAD requests
    if (method !== 'GET' && method !== 'HEAD') {
      return;
    }

    // Generate cache key from URL and relevant headers
    const cacheKey = generateCacheKey(request, vary);
    
    // Check if client has cached version
    const clientETag = request.headers['if-none-match'];
    const clientModified = request.headers['if-modified-since'];
    
    // Set cache headers
    const cacheControl = buildCacheControl({
      ttl,
      staleWhileRevalidate,
      mustRevalidate,
      public: isPublic,
      immutable
    });
    
    reply.header('Cache-Control', cacheControl);
    
    if (vary.length > 0) {
      reply.header('Vary', vary.join(', '));
    }
    
    // Set ETag based on cache key
    const etag = `"${cacheKey}"`;
    reply.header('ETag', etag);
    
    // Set Last-Modified to current time for dynamic content
    const lastModified = new Date().toUTCString();
    reply.header('Last-Modified', lastModified);
    
    // Check for conditional requests
    if (clientETag === etag) {
      reply.code(304);
      return reply.send();
    }
    
    // Add CDN-specific headers
    reply.header('X-Cache-Key', cacheKey);
    reply.header('X-Cache-Status', 'MISS');
    
    // For media files, add additional optimization headers
    if (isMediaRequest(request)) {
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Content-Disposition', 'inline');
      
      // Set longer cache for static media
      const mediaCacheControl = buildCacheControl({
        ttl: 86400, // 24 hours for media
        staleWhileRevalidate: 3600,
        public: true,
        immutable: true
      });
      reply.header('Cache-Control', mediaCacheControl);
    }
  };
}

/**
 * Smart caching for image transformations
 */
export function createImageCacheMiddleware(options: {
  maxAge?: number;
  sMaxAge?: number; // CDN cache time
  staleWhileRevalidate?: number;
} = {}) {
  const {
    maxAge = 86400, // 24 hours
    sMaxAge = 604800, // 7 days for CDN
    staleWhileRevalidate = 3600
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    
    // Generate transformation-specific cache key
    const transformKey = generateTransformationKey(query);
    
    const cacheControl = [
      `public`,
      `max-age=${maxAge}`,
      `s-maxage=${sMaxAge}`,
      `stale-while-revalidate=${staleWhileRevalidate}`,
      `immutable`
    ].join(', ');
    
    reply.header('Cache-Control', cacheControl);
    reply.header('Vary', 'Accept, Accept-Encoding, Accept-CH');
    reply.header('ETag', `"transform-${transformKey}"`);
    
    // Client Hints for responsive images
    reply.header('Accept-CH', 'DPR, Viewport-Width, Width');
    
    // CORS for CDN access
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    reply.header('Access-Control-Max-Age', '86400');
  };
}

/**
 * Video streaming cache middleware
 */
export function createVideoCacheMiddleware(options: {
  segmentMaxAge?: number;
  manifestMaxAge?: number;
} = {}) {
  const {
    segmentMaxAge = 86400, // 24 hours for segments
    manifestMaxAge = 10 // 10 seconds for manifests
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const url = request.url;
    const isManifest = url.endsWith('.m3u8') || url.endsWith('.mpd');
    const isSegment = url.endsWith('.ts') || url.endsWith('.m4s');
    
    if (isManifest) {
      // Short cache for manifests (they change frequently)
      reply.header('Cache-Control', [
        'public',
        `max-age=${manifestMaxAge}`,
        `s-maxage=${manifestMaxAge * 2}`,
        'must-revalidate'
      ].join(', '));
    } else if (isSegment) {
      // Long cache for segments (immutable)
      reply.header('Cache-Control', [
        'public',
        `max-age=${segmentMaxAge}`,
        `s-maxage=${segmentMaxAge * 7}`,
        'immutable'
      ].join(', '));
    }
    
    reply.header('Accept-Ranges', 'bytes');
    reply.header('Cross-Origin-Resource-Policy', 'cross-origin');
  };
}

/**
 * CDN purge helper middleware
 */
export function createPurgeMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Add headers to help with cache invalidation
    reply.header('X-Purge-Tags', JSON.stringify(generatePurgeTags(request)));
    reply.header('X-Cache-Timestamp', Date.now().toString());
  };
}

// Helper functions
function generateCacheKey(request: FastifyRequest, vary: string[]): string {
  const url = request.url;
  const varyData = vary.map(header => 
    `${header}:${request.headers[header.toLowerCase()] || ''}`
  ).join('|');
  
  return createHash('md5')
    .update(`${url}|${varyData}`)
    .digest('hex')
    .substring(0, 16);
}

function generateTransformationKey(query: any): string {
  const transformParams = [
    'width', 'height', 'quality', 'format', 'fit', 'gravity'
  ].filter(param => query[param])
   .map(param => `${param}=${query[param]}`)
   .join('&');
  
  return createHash('md5')
    .update(transformParams)
    .digest('hex')
    .substring(0, 12);
}

function buildCacheControl(options: {
  ttl: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
  public?: boolean;
  immutable?: boolean;
}): string {
  const directives = [];
  
  if (options.public) {
    directives.push('public');
  } else {
    directives.push('private');
  }
  
  directives.push(`max-age=${options.ttl}`);
  
  if (options.staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  
  if (options.mustRevalidate) {
    directives.push('must-revalidate');
  }
  
  if (options.immutable) {
    directives.push('immutable');
  }
  
  return directives.join(', ');
}

function isMediaRequest(request: FastifyRequest): boolean {
  const url = request.url.toLowerCase();
  const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.mp4', '.webm', '.mp3', '.wav'];
  return mediaExtensions.some(ext => url.includes(ext));
}

function generatePurgeTags(request: FastifyRequest): string[] {
  const tags = ['media'];
  
  // Add user-specific tag if authenticated
  if (request.headers.authorization) {
    tags.push('user-content');
  }
  
  // Add file type tags
  if (isMediaRequest(request)) {
    const url = request.url.toLowerCase();
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
      tags.push('images');
    } else if (url.includes('.mp4') || url.includes('.webm')) {
      tags.push('videos');
    }
  }
  
  return tags;
}

/**
 * Bandwidth optimization middleware
 */
export function createBandwidthOptimizationMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const acceptHeader = request.headers.accept || '';
    const userAgent = request.headers['user-agent'] || '';
    
    // Detect slow connections
    const isSlowConnection = detectSlowConnection(request);
    
    if (isSlowConnection) {
      reply.header('X-Optimization-Level', 'aggressive');
      reply.header('X-Quality-Hint', '60'); // Lower quality for slow connections
    }
    
    // Set optimal format based on browser support
    if (acceptHeader.includes('image/avif')) {
      reply.header('X-Preferred-Format', 'avif');
    } else if (acceptHeader.includes('image/webp')) {
      reply.header('X-Preferred-Format', 'webp');
    }
    
    // Progressive enhancement hints
    reply.header('X-Progressive-Enhancement', 'enabled');
  };
}

function detectSlowConnection(request: FastifyRequest): boolean {
  const saveData = request.headers['save-data'];
  const connectionType = request.headers['connection-type'];
  const effectiveType = request.headers['ect']; // Effective Connection Type
  
  return !!(
    saveData === 'on' ||
    connectionType === '2g' ||
    effectiveType === 'slow-2g' ||
    effectiveType === '2g'
  );
}