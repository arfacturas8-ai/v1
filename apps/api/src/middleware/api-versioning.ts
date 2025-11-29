import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from './errorHandler';

// API Version Configuration
export interface ApiVersion {
  version: string;
  deprecationDate?: Date;
  sunsetDate?: Date;
  isDefault?: boolean;
  features?: string[];
}

export const API_VERSIONS: ApiVersion[] = [
  {
    version: 'v1',
    isDefault: true,
    features: ['auth', 'users', 'communities', 'posts', 'messages', 'voice', 'web3']
  },
  {
    version: 'v2',
    features: ['auth', 'users', 'communities', 'posts', 'messages', 'voice', 'web3', 'ai-moderation', 'enhanced-search']
  }
];

// Get version from request
export const extractVersion = (request: FastifyRequest): string => {
  // Check URL path first (/api/v1/...)
  const pathMatch = request.url.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    return pathMatch[1];
  }
  
  // Check Accept header (application/vnd.cryb.v1+json)
  const acceptHeader = request.headers.accept;
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.cryb\.(v\d+)\+json/);
    if (versionMatch) {
      return versionMatch[1];
    }
  }
  
  // Check custom header
  const versionHeader = request.headers['x-api-version'] || request.headers['api-version'];
  if (versionHeader && typeof versionHeader === 'string') {
    const cleanVersion = versionHeader.startsWith('v') ? versionHeader : `v${versionHeader}`;
    return cleanVersion;
  }
  
  // Default to v1
  return 'v1';
};

// Validate version
export const validateVersion = (version: string): ApiVersion | null => {
  return API_VERSIONS.find(v => v.version === version) || null;
};

// Check if feature is supported in version
export const isFeatureSupported = (version: string, feature: string): boolean => {
  const apiVersion = validateVersion(version);
  return apiVersion?.features?.includes(feature) || false;
};

// API Versioning Middleware
export const apiVersioningMiddleware = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const requestedVersion = extractVersion(request);
      const apiVersion = validateVersion(requestedVersion);
      
      if (!apiVersion) {
        throw new AppError(
          `Unsupported API version: ${requestedVersion}. Supported versions: ${API_VERSIONS.map(v => v.version).join(', ')}`,
          400,
          'UNSUPPORTED_API_VERSION',
          { 
            requestedVersion,
            supportedVersions: API_VERSIONS.map(v => v.version)
          }
        );
      }
      
      // Check for deprecated version
      if (apiVersion.deprecationDate && new Date() > apiVersion.deprecationDate) {
        reply.header('X-API-Deprecated', 'true');
        reply.header('X-API-Deprecation-Date', apiVersion.deprecationDate.toISOString());
        
        if (apiVersion.sunsetDate) {
          reply.header('X-API-Sunset-Date', apiVersion.sunsetDate.toISOString());
          reply.header('Sunset', apiVersion.sunsetDate.toUTCString()); // RFC 8594
        }
        
        request.log.warn({
          version: requestedVersion,
          deprecationDate: apiVersion.deprecationDate,
          sunsetDate: apiVersion.sunsetDate,
          ip: request.ip,
          userAgent: request.headers['user-agent']
        }, `Deprecated API version ${requestedVersion} used`);
      }
      
      // Check for sunset version
      if (apiVersion.sunsetDate && new Date() > apiVersion.sunsetDate) {
        throw new AppError(
          `API version ${requestedVersion} has been sunset and is no longer supported`,
          410, // Gone
          'API_VERSION_SUNSET',
          {
            version: requestedVersion,
            sunsetDate: apiVersion.sunsetDate,
            supportedVersions: API_VERSIONS.filter(v => !v.sunsetDate || new Date() <= v.sunsetDate).map(v => v.version)
          }
        );
      }
      
      // Add version info to request
      (request as any).apiVersion = apiVersion;
      
      // Set version headers
      reply.header('X-API-Version', requestedVersion);
      reply.header('X-API-Supported-Versions', API_VERSIONS.map(v => v.version).join(', '));
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error }, 'API versioning middleware error');
      throw new AppError(
        'API versioning processing failed',
        500,
        'API_VERSIONING_ERROR'
      );
    }
  };
};

// Version-specific route handler decorator
export const versionHandler = (supportedVersions: string[], handler: Function) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const currentVersion = (request as any).apiVersion?.version || 'v1';
    
    if (!supportedVersions.includes(currentVersion)) {
      throw new AppError(
        `Endpoint not available in API version ${currentVersion}`,
        404,
        'ENDPOINT_NOT_AVAILABLE_IN_VERSION',
        {
          currentVersion,
          supportedVersions
        }
      );
    }
    
    return handler(request, reply);
  };
};

// Feature gate decorator
export const requireFeature = (feature: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (request: FastifyRequest, reply: FastifyReply) {
      const currentVersion = (request as any).apiVersion?.version || 'v1';
      
      if (!isFeatureSupported(currentVersion, feature)) {
        throw new AppError(
          `Feature '${feature}' is not available in API version ${currentVersion}`,
          404,
          'FEATURE_NOT_AVAILABLE',
          {
            feature,
            currentVersion,
            availableInVersions: API_VERSIONS.filter(v => v.features?.includes(feature)).map(v => v.version)
          }
        );
      }
      
      return originalMethod.call(this, request, reply);
    };
    
    return descriptor;
  };
};

// Version compatibility utilities
export const getVersionCompatibility = (fromVersion: string, toVersion: string): {
  compatible: boolean;
  breakingChanges: string[];
  migration?: string;
} => {
  const compatibilityMatrix: Record<string, Record<string, any>> = {
    'v1': {
      'v2': {
        compatible: true,
        breakingChanges: [
          'Enhanced search API changed response format',
          'AI moderation endpoints added'
        ],
        migration: 'https://docs.cryb.ai/migration/v1-to-v2'
      }
    }
  };
  
  const compatibility = compatibilityMatrix[fromVersion]?.[toVersion];
  
  return compatibility || {
    compatible: false,
    breakingChanges: ['Version compatibility not defined'],
    migration: 'https://docs.cryb.ai/api-versions'
  };
};

// Generate version info for API documentation
export const getVersionInfo = () => {
  return {
    versions: API_VERSIONS.map(version => ({
      version: version.version,
      status: version.sunsetDate && new Date() > version.sunsetDate ? 'sunset' :
              version.deprecationDate && new Date() > version.deprecationDate ? 'deprecated' : 'active',
      deprecationDate: version.deprecationDate?.toISOString(),
      sunsetDate: version.sunsetDate?.toISOString(),
      features: version.features || [],
      isDefault: version.isDefault || false
    })),
    defaultVersion: API_VERSIONS.find(v => v.isDefault)?.version || 'v1',
    currentDate: new Date().toISOString()
  };
};

// Middleware to set CORS headers with version info
export const versionAwareCors = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Add version-specific CORS headers
    const supportedVersions = API_VERSIONS.map(v => v.version).join(', ');
    
    reply.header('Access-Control-Expose-Headers', [
      'X-API-Version',
      'X-API-Supported-Versions',
      'X-API-Deprecated',
      'X-API-Deprecation-Date',
      'X-API-Sunset-Date',
      'Sunset'
    ].join(', '));
  };
};

export default {
  apiVersioningMiddleware,
  versionHandler,
  requireFeature,
  extractVersion,
  validateVersion,
  isFeatureSupported,
  getVersionCompatibility,
  getVersionInfo,
  versionAwareCors
};