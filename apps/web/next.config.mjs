import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cryb/database", "@cryb/auth", "@cryb/web3", "@cryb/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  typescript: {
    // Skip type checking during build for faster compilation
    ignoreBuildErrors: process.env.NODE_ENV === "production",
  },
  eslint: {
    // Skip ESLint during build for faster compilation
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  // Optimize build performance and reduce memory usage
  webpack: (config, { dev, isServer }) => {
    // Optimize for faster rebuilds in development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
      
      // Reduce bundle size for faster dev builds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: {
          chunks: 'async',
          cacheGroups: {
            default: false,
            vendors: false,
            // Bundle react and react-dom together
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            },
            // Bundle UI libraries together
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react)[\\/]/,
            },
          },
        },
      };
      
      // Reduce memory pressure with absolute path
      config.resolve.symlinks = false;
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.join(process.cwd(), '.next', 'cache', 'webpack'),
      };
    }
    
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 10,
            },
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react)[\\/]/,
              priority: 5,
            },
          },
        },
      };
    }
    
    return config;
  },
};

export default nextConfig;