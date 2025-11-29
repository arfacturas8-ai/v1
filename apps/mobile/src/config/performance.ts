/**
 * Performance Optimization Configuration
 */

export const PERFORMANCE_CONFIG = {
  // List rendering optimizations
  LIST_RENDERING: {
    INITIAL_NUM_TO_RENDER: 10,
    MAX_TO_RENDER_PER_BATCH: 5,
    UPDATE_CELLS_BATCH_PERIOD: 50,
    WINDOW_SIZE: 21,
    GET_ITEM_LAYOUT_OPTIMIZED: true,
  },

  // Image optimization
  IMAGE_OPTIMIZATION: {
    LAZY_LOADING: true,
    CACHE_SIZE_LIMIT: 100 * 1024 * 1024, // 100MB
    PROGRESSIVE_LOADING: true,
    WEBP_SUPPORT: true,
  },

  // Memory management
  MEMORY_MANAGEMENT: {
    ENABLE_MEMORY_WARNINGS: true,
    AUTO_CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  },

  // Network optimization
  NETWORK: {
    REQUEST_TIMEOUT: 30000,
    MAX_CONCURRENT_REQUESTS: 6,
    RETRY_DELAY: 1000,
    ENABLE_REQUEST_DEDUPLICATION: true,
  },

  // Animation optimization
  ANIMATIONS: {
    USE_NATIVE_DRIVER: true,
    REDUCE_MOTION_SUPPORT: true,
    ANIMATION_DURATION_SCALE: 1,
  },

  // Bundle optimization
  BUNDLE: {
    ENABLE_HERMES: true,
    ENABLE_PROGUARD: true,
    MINIFY_JS: true,
    TREE_SHAKING: true,
  },
};

export default PERFORMANCE_CONFIG;
