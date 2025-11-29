// vite.config.js
import { defineConfig } from "file:///home/ubuntu/cryb-platform/apps/react-app/node_modules/vite/dist/node/index.js";
import react from "file:///home/ubuntu/cryb-platform/apps/react-app/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  // Mobile-optimized build configuration
  build: {
    outDir: "dist",
    // Code splitting for better mobile loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          "react-vendor": ["react", "react-dom"],
          "router-vendor": ["react-router-dom"],
          "ui-vendor": ["lucide-react"],
          // Feature-based chunks for lazy loading
          "chat-features": [
            "./src/pages/ChatPage.jsx",
            "./src/components/CallControls.jsx"
          ],
          "community-features": [
            "./src/pages/CommunitiesPage.jsx",
            "./src/pages/CommunityPage.jsx",
            "./src/components/community/CommunityFeed.jsx",
            "./src/components/community/Post.jsx",
            "./src/components/community/PostList.jsx"
          ],
          "crypto-features": [
            "./src/pages/CryptoPage.jsx",
            "./src/components/crypto/CryptoCountdown.jsx",
            "./src/components/crypto/NFTPreview.jsx"
          ]
        }
      }
    },
    // Minimize bundle size
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === "production",
        drop_debugger: true
      }
    },
    // Asset optimization
    assetsInlineLimit: 4096,
    // Inline small assets
    cssCodeSplit: true,
    // Split CSS for better caching
    // Source maps for debugging
    sourcemap: process.env.NODE_ENV !== "production",
    // Target modern browsers for better performance
    target: ["es2020", "chrome80", "firefox74", "safari13.1"]
  },
  // Development server configuration
  server: {
    port: 3003,
    host: true,
    allowedHosts: ["platform.cryb.ai", "localhost", "127.0.0.1"],
    // Optimize for mobile development
    hmr: {
      overlay: false
      // Disable overlay on mobile devices
    }
  },
  // Mobile performance optimizations
  esbuild: {
    // Drop console logs in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    // Target modern JavaScript
    target: "es2020"
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
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "socket.io-client",
      "react-markdown",
      "emoji-picker-react"
    ]
  },
  // Preview server for production testing
  preview: {
    port: 3001,
    host: true,
    cors: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS91YnVudHUvY3J5Yi1wbGF0Zm9ybS9hcHBzL3JlYWN0LWFwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvdWJ1bnR1L2NyeWItcGxhdGZvcm0vYXBwcy9yZWFjdC1hcHAvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvdWJ1bnR1L2NyeWItcGxhdGZvcm0vYXBwcy9yZWFjdC1hcHAvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIFxuICAvLyBNb2JpbGUtb3B0aW1pemVkIGJ1aWxkIGNvbmZpZ3VyYXRpb25cbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBcbiAgICAvLyBDb2RlIHNwbGl0dGluZyBmb3IgYmV0dGVyIG1vYmlsZSBsb2FkaW5nXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIENvcmUgdmVuZG9yIGNodW5rc1xuICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgICdyb3V0ZXItdmVuZG9yJzogWydyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgJ3VpLXZlbmRvcic6IFsnbHVjaWRlLXJlYWN0J10sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gRmVhdHVyZS1iYXNlZCBjaHVua3MgZm9yIGxhenkgbG9hZGluZ1xuICAgICAgICAgICdjaGF0LWZlYXR1cmVzJzogW1xuICAgICAgICAgICAgJy4vc3JjL3BhZ2VzL0NoYXRQYWdlLmpzeCcsXG4gICAgICAgICAgICAnLi9zcmMvY29tcG9uZW50cy9DYWxsQ29udHJvbHMuanN4J1xuICAgICAgICAgIF0sXG4gICAgICAgICAgXG4gICAgICAgICAgJ2NvbW11bml0eS1mZWF0dXJlcyc6IFtcbiAgICAgICAgICAgICcuL3NyYy9wYWdlcy9Db21tdW5pdGllc1BhZ2UuanN4JyxcbiAgICAgICAgICAgICcuL3NyYy9wYWdlcy9Db21tdW5pdHlQYWdlLmpzeCcsXG4gICAgICAgICAgICAnLi9zcmMvY29tcG9uZW50cy9jb21tdW5pdHkvQ29tbXVuaXR5RmVlZC5qc3gnLFxuICAgICAgICAgICAgJy4vc3JjL2NvbXBvbmVudHMvY29tbXVuaXR5L1Bvc3QuanN4JyxcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL2NvbW11bml0eS9Qb3N0TGlzdC5qc3gnXG4gICAgICAgICAgXSxcbiAgICAgICAgICBcbiAgICAgICAgICAnY3J5cHRvLWZlYXR1cmVzJzogW1xuICAgICAgICAgICAgJy4vc3JjL3BhZ2VzL0NyeXB0b1BhZ2UuanN4JyxcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL2NyeXB0by9DcnlwdG9Db3VudGRvd24uanN4JyxcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL2NyeXB0by9ORlRQcmV2aWV3LmpzeCdcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIE1pbmltaXplIGJ1bmRsZSBzaXplXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICBjb21wcmVzczoge1xuICAgICAgICBkcm9wX2NvbnNvbGU6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicsXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWVcbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIEFzc2V0IG9wdGltaXphdGlvblxuICAgIGFzc2V0c0lubGluZUxpbWl0OiA0MDk2LCAvLyBJbmxpbmUgc21hbGwgYXNzZXRzXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLCAvLyBTcGxpdCBDU1MgZm9yIGJldHRlciBjYWNoaW5nXG4gICAgXG4gICAgLy8gU291cmNlIG1hcHMgZm9yIGRlYnVnZ2luZ1xuICAgIHNvdXJjZW1hcDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyxcbiAgICBcbiAgICAvLyBUYXJnZXQgbW9kZXJuIGJyb3dzZXJzIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICB0YXJnZXQ6IFsnZXMyMDIwJywgJ2Nocm9tZTgwJywgJ2ZpcmVmb3g3NCcsICdzYWZhcmkxMy4xJ11cbiAgfSxcbiAgXG4gIC8vIERldmVsb3BtZW50IHNlcnZlciBjb25maWd1cmF0aW9uXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDMsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBhbGxvd2VkSG9zdHM6IFsncGxhdGZvcm0uY3J5Yi5haScsICdsb2NhbGhvc3QnLCAnMTI3LjAuMC4xJ10sXG4gICAgXG4gICAgLy8gT3B0aW1pemUgZm9yIG1vYmlsZSBkZXZlbG9wbWVudFxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogZmFsc2UgLy8gRGlzYWJsZSBvdmVybGF5IG9uIG1vYmlsZSBkZXZpY2VzXG4gICAgfVxuICB9LFxuICBcbiAgLy8gTW9iaWxlIHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbnNcbiAgZXNidWlsZDoge1xuICAgIC8vIERyb3AgY29uc29sZSBsb2dzIGluIHByb2R1Y3Rpb25cbiAgICBkcm9wOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nID8gWydjb25zb2xlJywgJ2RlYnVnZ2VyJ10gOiBbXSxcbiAgICBcbiAgICAvLyBUYXJnZXQgbW9kZXJuIEphdmFTY3JpcHRcbiAgICB0YXJnZXQ6ICdlczIwMjAnXG4gIH0sXG4gIFxuICAvLyBQV0EgYW5kIG1vYmlsZSBvcHRpbWl6YXRpb25zXG4gIGRlZmluZToge1xuICAgIC8vIEdsb2JhbCBjb25zdGFudHNcbiAgICBfX01PQklMRV9CUkVBS1BPSU5UX186IDc2OCxcbiAgICBfX1RBQkxFVF9CUkVBS1BPSU5UX186IDEwMjQsXG4gICAgXG4gICAgLy8gRmVhdHVyZSBmbGFnc1xuICAgIF9fRU5BQkxFX1BXQV9fOiB0cnVlLFxuICAgIF9fRU5BQkxFX1RPVUNIX0dFU1RVUkVTX186IHRydWVcbiAgfSxcbiAgXG4gIC8vIE9wdGltaXplIGRlcGVuZGVuY2llc1xuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAncmVhY3QnLFxuICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXG4gICAgICAnbHVjaWRlLXJlYWN0JyxcbiAgICAgICdzb2NrZXQuaW8tY2xpZW50JyxcbiAgICAgICdyZWFjdC1tYXJrZG93bicsXG4gICAgICAnZW1vamktcGlja2VyLXJlYWN0J1xuICAgIF1cbiAgfSxcbiAgXG4gIC8vIFByZXZpZXcgc2VydmVyIGZvciBwcm9kdWN0aW9uIHRlc3RpbmdcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDMwMDEsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBjb3JzOiB0cnVlXG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2UyxTQUFTLG9CQUFvQjtBQUMxVSxPQUFPLFdBQVc7QUFFbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBO0FBQUEsRUFHakIsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBO0FBQUEsSUFHUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLFNBQVMsV0FBVztBQUFBLFVBQ3JDLGlCQUFpQixDQUFDLGtCQUFrQjtBQUFBLFVBQ3BDLGFBQWEsQ0FBQyxjQUFjO0FBQUE7QUFBQSxVQUc1QixpQkFBaUI7QUFBQSxZQUNmO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUVBLHNCQUFzQjtBQUFBLFlBQ3BCO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUVBLG1CQUFtQjtBQUFBLFlBQ2pCO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWMsUUFBUSxJQUFJLGFBQWE7QUFBQSxRQUN2QyxlQUFlO0FBQUEsTUFDakI7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLG1CQUFtQjtBQUFBO0FBQUEsSUFDbkIsY0FBYztBQUFBO0FBQUE7QUFBQSxJQUdkLFdBQVcsUUFBUSxJQUFJLGFBQWE7QUFBQTtBQUFBLElBR3BDLFFBQVEsQ0FBQyxVQUFVLFlBQVksYUFBYSxZQUFZO0FBQUEsRUFDMUQ7QUFBQTtBQUFBLEVBR0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sY0FBYyxDQUFDLG9CQUFvQixhQUFhLFdBQVc7QUFBQTtBQUFBLElBRzNELEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQTtBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLFNBQVM7QUFBQTtBQUFBLElBRVAsTUFBTSxRQUFRLElBQUksYUFBYSxlQUFlLENBQUMsV0FBVyxVQUFVLElBQUksQ0FBQztBQUFBO0FBQUEsSUFHekUsUUFBUTtBQUFBLEVBQ1Y7QUFBQTtBQUFBLEVBR0EsUUFBUTtBQUFBO0FBQUEsSUFFTix1QkFBdUI7QUFBQSxJQUN2Qix1QkFBdUI7QUFBQTtBQUFBLElBR3ZCLGdCQUFnQjtBQUFBLElBQ2hCLDJCQUEyQjtBQUFBLEVBQzdCO0FBQUE7QUFBQSxFQUdBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBR0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
