/**
 * METRO BUNDLER CONFIGURATION
 * Simplified configuration for React Native Metro bundler with Expo
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom resolver aliases for cleaner imports
config.resolver.alias = {
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@navigation': './src/navigation',
  '@services': './src/services',
  '@utils': './src/utils',
  '@stores': './src/stores',
  '@contexts': './src/contexts',
  '@assets': './assets',
};

// Add support for additional asset types
config.resolver.assetExts.push(
  'bin',
  'txt',
  'jpg',
  'png',
  'gif',
  'webp',
  'svg',
  'ttf',
  'otf',
  'mp4',
  'webm',
  'wav',
  'mp3',
  'aac'
);

// Add support for additional source extensions
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json', 'cjs', 'mjs');

module.exports = config;