import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    // Bundle analysis - generates stats.html
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),

    // Copy standalone brad.html to dist
    {
      name: 'copy-brad-html',
      closeBundle() {
        const fs = require('fs')
        const path = require('path')
        const src = path.resolve(__dirname, 'public/brad.html')
        const dest = path.resolve(__dirname, 'dist/brad.html')
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest)
          console.log('✓ Copied brad.html to dist/')
        }
      }
    },

    // PWA temporarily disabled to fix caching issues
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    //   manifest: {
    //     name: 'CRYB Platform',
    //     short_name: 'CRYB',
    //     description: 'Next-generation crypto-native social platform',
    //     theme_color: '#000000',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
    //     maximumFileSizeToCacheInBytes: 5000000, // 5MB limit
    //     cleanupOutdatedCaches: true,
    //     skipWaiting: true,
    //     clientsClaim: true,
    //     // Add cache name with timestamp for forced invalidation
    //     cacheId: `cryb-v${Date.now()}`,
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'google-fonts-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365
    //           }
    //         }
    //       },
    //       {
    //         urlPattern: /^https:\/\/api\.cryb\.(io|ai)\/.*/i,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'api-cache',
    //           expiration: {
    //             maxEntries: 100,
    //             maxAgeSeconds: 60 * 5
    //           },
    //           networkTimeoutSeconds: 10
    //         }
    //       }
    //     ]
    //   }
    // })
  ],
  
  // Mobile-optimized build configuration
  build: {
    outDir: 'dist',

    // Code splitting for better caching and faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'ui-vendor': ['framer-motion', 'lucide-react'],

          // Web3 libraries
          'web3-vendor': ['ethers'],

          // Markdown and rich text
          'markdown-vendor': ['react-markdown'],

          // Socket.io and real-time
          'realtime-vendor': ['socket.io-client'],

          // Emoji and media
          'media-vendor': ['emoji-picker-react']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    chunkSizeWarningLimit: 1000, // Allow larger chunks for feature modules

    // Advanced optimization
    reportCompressedSize: true,
    cssMinify: true,

    // Minimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // Inline small assets
    cssCodeSplit: true, // Split CSS for better caching
    
    // Source maps for debugging
    sourcemap: process.env.NODE_ENV !== 'production',

    // Target modern browsers for better performance (updated for BigInt support)
    target: ['es2020', 'chrome90', 'firefox88', 'safari14']
  },
  
  // Development server configuration
  server: {
    port: parseInt(process.env.PORT) || 3008,
    host: true,
    allowedHosts: ['platform.cryb.ai', 'localhost', '127.0.0.1', '54.236.166.224', 'cryb.ai', 'www.cryb.ai'],
    
    // Optimize for mobile development
    hmr: {
      overlay: false // Disable overlay on mobile devices
    }
  },
  
  // Mobile performance optimizations
  esbuild: {
    // Drop console logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    
    // Target modern JavaScript
    target: 'es2020'
  },
  
  // PWA and mobile optimizations
  define: {
    // Global constants
    __MOBILE_BREAKPOINT__: 768,
    __TABLET_BREAKPOINT__: 1024,
    
    // Feature flags
    __ENABLE_PWA__: true,
    __ENABLE_TOUCH_GESTURES__: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'socket.io-client',
      'react-markdown',
      'emoji-picker-react'
    ]
  },
  
  // Preview server for production testing
  preview: {
    port: parseInt(process.env.PORT) || 3008,
    host: true,
    cors: true
  }
})