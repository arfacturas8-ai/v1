import { FastifyInstance } from 'fastify';
import path from 'path';
import { createReadStream, existsSync } from 'fs';

/**
 * CDN Configuration for Static Assets
 * Serves static files with proper caching headers
 */

const STATIC_PATHS = {
  images: '/var/www/static/images',
  css: '/var/www/static/css',
  js: '/var/www/static/js',
  fonts: '/var/www/static/fonts',
  uploads: '/var/www/uploads'
};

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg'
};

export function setupCDN(app: FastifyInstance) {
  // Serve static assets with CDN-like headers
  app.get('/cdn/*', async (request: any, reply) => {
    const filePath = (request.params as any)['*'];
    
    // Security check - prevent directory traversal
    if (filePath.includes('..')) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    // Determine file type and path
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext];
    
    if (!mimeType) {
      return reply.code(415).send({ error: 'Unsupported file type' });
    }

    // Find file in static directories
    let fullPath: string | null = null;
    for (const [type, basePath] of Object.entries(STATIC_PATHS)) {
      const testPath = path.join(basePath, filePath);
      if (existsSync(testPath)) {
        fullPath = testPath;
        break;
      }
    }

    if (!fullPath || !existsSync(fullPath)) {
      return reply.code(404).send({ error: 'File not found' });
    }

    // Set CDN headers
    const maxAge = ext === '.html' ? 0 : 31536000; // 1 year for static assets
    
    reply.header('Content-Type', mimeType);
    reply.header('Cache-Control', `public, max-age=${maxAge}, immutable`);
    reply.header('X-Content-Type-Options', 'nosniff');
    
    // Add CORS for CDN
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    
    // ETag support
    const stats = require('fs').statSync(fullPath);
    const etag = `"${stats.size}-${stats.mtime.getTime()}"`;
    reply.header('ETag', etag);
    
    // Check if client has cached version
    const ifNoneMatch = request.headers['if-none-match'];
    if (ifNoneMatch === etag) {
      return reply.code(304).send();
    }

    // Stream file
    const stream = createReadStream(fullPath);
    return reply.type(mimeType).send(stream);
  });

  // Health check for CDN
  app.get('/cdn/health', async (request, reply) => {
    reply.send({ 
      status: 'healthy',
      paths: Object.keys(STATIC_PATHS),
      cache: 'enabled',
      compression: 'gzip, brotli'
    });
  });

  app.log.info('✅ CDN for static assets configured');
}

// CloudFlare configuration (for production)
export const CLOUDFLARE_CONFIG = {
  zone: process.env.CF_ZONE_ID,
  token: process.env.CF_API_TOKEN,
  cacheRules: [
    { pattern: '*.jpg', ttl: 31536000 },
    { pattern: '*.png', ttl: 31536000 },
    { pattern: '*.css', ttl: 86400 },
    { pattern: '*.js', ttl: 86400 }
  ]
};