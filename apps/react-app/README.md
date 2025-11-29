# CRYB Platform - Frontend Architecture

A modern, enterprise-grade frontend architecture built with Next.js 15, React 19, and TypeScript. This project implements a comprehensive social platform with voice/video capabilities, real-time communication, and Web3 integration.

##  Architecture Overview

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **React**: React 19 with Server Components
- **Language**: TypeScript 5.0+ (strict mode)
- **Styling**: Tailwind CSS + Radix UI Design System
- **State Management**: Zustand + React Query (TanStack Query)
- **Animation**: Framer Motion
- **Testing**: Jest + Playwright + Testing Library
- **Documentation**: Storybook
- **Quality**: ESLint + Prettier + Husky

### Key Features

-  **Next.js 15 App Router** with nested layouts and streaming SSR
-  **React 19** with Suspense, Server Actions, and concurrent features
-  **TypeScript** with strict configuration and comprehensive type safety
-  **Radix UI Design System** with dark/light themes
-  **Global State Management** with Zustand and React Query
-  **Real-time Communication** with Socket.io integration
-  **Performance Optimization** with Core Web Vitals focus
-  **PWA Support** with offline capabilities and push notifications
-  **SEO Optimization** with meta tags, sitemap, and structured data
-  **Developer Experience** with hot reloading, type checking, and testing
-  **Component Documentation** with Storybook
-  **Error Boundaries** and comprehensive error handling

## 📁 Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   ├── loading.tsx         # Global loading UI
│   ├── error.tsx           # Global error UI
│   ├── not-found.tsx       # 404 page
│   ├── providers.tsx       # Client-side providers
│   ├── manifest.ts         # PWA manifest
│   ├── robots.ts           # SEO robots.txt
│   ├── sitemap.ts          # SEO sitemap
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # Base UI components (Radix)
│   ├── pages/              # Page-specific components
│   └── error-boundary.tsx  # Error boundary component
├── lib/                    # Utility libraries
│   ├── utils.ts            # Common utilities
│   ├── auth-provider.tsx   # Authentication provider
│   └── socket-provider.tsx # Socket.io provider
├── stores/                 # Zustand stores
│   ├── auth-store.ts       # Authentication state
│   └── ui-store.ts         # UI state management
├── types/                  # TypeScript type definitions
│   └── index.ts            # Core types
├── hooks/                  # Custom React hooks
├── styles/                 # Global styles and themes
│   └── globals.css         # Tailwind + custom CSS
└── stories/                # Storybook stories
```

## 🛠 Development Setup

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm, yarn, or pnpm
- Git

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd apps/react-app
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Setup development tools**:
   ```bash
   npm run prepare  # Setup Husky hooks
   ```

### Available Scripts

#### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run analyze      # Analyze bundle size
```

#### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check Prettier formatting
npm run type-check   # Run TypeScript checks
```

#### Testing
```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run E2E tests
npm run test:e2e:ui  # Run E2E tests with UI
```

#### Documentation
```bash
npm run storybook        # Start Storybook
npm run build-storybook  # Build Storybook
```

##  Design System

### Theme Configuration

The design system supports light/dark themes with automatic system preference detection:

```typescript
// Theme switching
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
setTheme('dark'); // 'light' | 'dark' | 'system'
```

### Custom Colors

```css
/* CRYB Brand Colors */
--cryb-primary: 264 83% 57%;      /* Purple */
--cryb-accent: 142 76% 36%;       /* Green */
--cryb-secondary: 240 5% 26%;     /* Dark Gray */
--cryb-warning: 38 92% 50%;       /* Orange */
--cryb-error: 0 84% 60%;          /* Red */
--cryb-success: 142 76% 36%;      /* Green */
```

### Component Usage

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Basic usage
<Button variant="cryb" size="lg">
  CRYB Style Button
</Button>

// With gradient
<Button variant="gradient" className="shadow-glow">
  Gradient Button
</Button>
```

##  State Management

### Global State (Zustand)

```typescript
// Authentication
import { useAuthStore } from '@/stores/auth-store';

const { user, isAuthenticated, login, logout } = useAuthStore();

// UI State
import { useUIStore } from '@/stores/ui-store';

const { theme, sidebarOpen, addNotification } = useUIStore();
```

### Server State (React Query)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
});

// Mutate data
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});
```

##  Real-time Features

### Socket.io Integration

```typescript
import { useSocket, useSocketEvent } from '@/lib/socket-provider';

// Basic usage
const { socket, isConnected, emit, joinRoom } = useSocket();

// Listen to events
useSocketEvent('message:new', (message) => {
  console.log('New message:', message);
});

// Join a room
useEffect(() => {
  if (channelId) {
    joinRoom(`channel:${channelId}`);
  }
}, [channelId]);
```

##  Performance & SEO

### Core Web Vitals Optimization

- **Image Optimization**: Next.js Image component with AVIF/WebP support
- **Code Splitting**: Automatic route-based splitting + manual chunking
- **Bundle Analysis**: Built-in analyzer for monitoring bundle size
- **Caching**: Optimized caching strategies for static and dynamic content

### SEO Features

- **Meta Tags**: Comprehensive meta tag management
- **Structured Data**: JSON-LD schema markup
- **Sitemap**: Dynamic sitemap generation
- **Robots.txt**: SEO-friendly robots configuration

### PWA Capabilities

- **Service Worker**: Offline support and caching
- **App Manifest**: Install prompt and app-like experience
- **Push Notifications**: Real-time notification support
- **Background Sync**: Offline action queueing

## 🧪 Testing Strategy

### Unit Testing (Jest)

```bash
# Run specific test file
npm test -- Button.test.tsx

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Testing (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Run specific test
npx playwright test auth.spec.ts
```

### Component Testing (Storybook)

```bash
# Start Storybook
npm run storybook

# Build static Storybook
npm run build-storybook
```

##  Security & Best Practices

### Security Headers

```javascript
// next.config.js
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // ... more security headers
]
```

### Type Safety

- **Strict TypeScript**: All files use strict type checking
- **API Types**: Comprehensive type definitions for all API responses
- **Component Props**: Fully typed component interfaces
- **Store Types**: Type-safe state management

##  Deployment

### Production Build

```bash
# Build the application
npm run build

# Test production build locally
npm run start

# Analyze bundle
npm run analyze
```

### Environment Variables

Required environment variables for production:

```bash
NEXT_PUBLIC_APP_URL=https://platform.cryb.ai
NEXT_PUBLIC_API_URL=https://api.cryb.ai
NEXT_PUBLIC_SOCKET_URL=wss://socket.cryb.ai
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
```

### Performance Monitoring

Monitor Core Web Vitals and application performance:

- **Lighthouse CI**: Automated performance testing
- **Bundle Analyzer**: Track bundle size changes
- **Error Monitoring**: Comprehensive error tracking
- **Analytics**: User behavior and performance metrics

##  Roadmap

### Completed 
- [x] Next.js 15 App Router architecture
- [x] TypeScript configuration
- [x] Radix UI design system
- [x] State management (Zustand + React Query)
- [x] Real-time communication (Socket.io)
- [x] PWA features
- [x] Testing setup (Jest + Playwright)
- [x] Storybook documentation
- [x] Performance optimization
- [x] SEO optimization

### In Progress 🚧
- [ ] Form management with React Hook Form + Zod validation
- [ ] Voice/Video integration with LiveKit
- [ ] Web3 wallet integration
- [ ] Advanced moderation tools
- [ ] Mobile app companion

### Planned 📋
- [ ] Internationalization (i18n)
- [ ] Advanced analytics dashboard
- [ ] AI-powered features
- [ ] Blockchain integration
- [ ] Advanced security features

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style

- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Code formatting is enforced
- **TypeScript**: Maintain strict type safety
- **Testing**: Include tests for new features
- **Documentation**: Update relevant documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Documentation**: Check the inline code documentation
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions
- **Discord**: Join our development Discord server

---

**Built with ❤️ by the CRYB Team**