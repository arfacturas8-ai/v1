# Loading States & Animations Guide

## Overview

This guide covers the comprehensive loading states, skeleton components, and animations system implemented throughout the CRYB platform. All animations are optimized for 60fps performance and respect user preferences for reduced motion.

## Table of Contents

1. [Skeleton Components](#skeleton-components)
2. [Loading Components](#loading-components)
3. [Animation Utilities](#animation-utilities)
4. [Hooks](#hooks)
5. [Usage Examples](#usage-examples)
6. [Performance Best Practices](#performance-best-practices)

---

## Skeleton Components

### Base Skeleton Components

Located in: `src/components/ui/skeletons/`

#### `Skeleton`
Basic building block for all skeleton components with shimmer animation.

```jsx
import { Skeleton } from '@/components/ui/skeletons';

<Skeleton width="200px" height="20px" rounded="md" variant="shimmer" />
```

**Props:**
- `width`: String or number (default: '100%')
- `height`: String or number (default: '1rem')
- `rounded`: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | '2xl' (default: 'md')
- `variant`: 'shimmer' | 'pulse' (default: 'shimmer')
- `className`: Additional CSS classes

#### `SkeletonText`
Multi-line text skeleton with realistic line widths.

```jsx
<SkeletonText lines={3} spacing="sm" lastLineWidth="60%" />
```

#### `SkeletonCircle`
Circular skeleton for avatars and icons.

```jsx
<SkeletonCircle size="md" />
```

**Sizes:** xs | sm | md | lg | xl | 2xl | 3xl

#### `SkeletonButton`
Button-shaped skeleton.

```jsx
<SkeletonButton size="md" fullWidth={false} />
```

#### `SkeletonImage`
Image skeleton with aspect ratio support.

```jsx
<SkeletonImage aspectRatio="video" rounded="lg" />
```

**Aspect Ratios:** square | video | portrait | landscape | ultrawide

---

### Card Skeletons

#### `SkeletonCard`
Generic card skeleton with customizable sections.

```jsx
<SkeletonCard
  showHeader={true}
  showFooter={true}
  showImage={false}
  contentLines={3}
/>
```

#### `SkeletonPostCard`
Post card skeleton optimized for feed layouts.

```jsx
<SkeletonPostCard
  showCommunity={true}
  showMedia={false}
  compact={false}
/>
```

#### `SkeletonCommunityCard`
Community card skeleton with cover and avatar.

```jsx
<SkeletonCommunityCard />
```

#### `SkeletonUserCard`
User profile card skeleton.

```jsx
<SkeletonUserCard showBio={true} />
```

#### `SkeletonCommentCard`
Comment skeleton with depth support for threading.

```jsx
<SkeletonCommentCard depth={0} />
```

---

### Profile Skeletons

#### `SkeletonProfile`
Full profile page skeleton with cover, avatar, and tabs.

```jsx
<SkeletonProfile />
```

#### `SkeletonProfileHeader`
Compact profile header skeleton.

```jsx
<SkeletonProfileHeader compact={false} />
```

#### `SkeletonProfileStats`
Statistics section skeleton.

```jsx
<SkeletonProfileStats />
```

#### `SkeletonProfileActivity`
Activity feed skeleton.

```jsx
<SkeletonProfileActivity items={5} />
```

---

### Grid & List Skeletons

#### `SkeletonGrid`
Responsive grid skeleton with stagger animation.

```jsx
<SkeletonGrid
  items={6}
  columns={3}
  gap={4}
  type="community" // 'card' | 'community' | 'user' | 'post'
/>
```

#### `SkeletonFeed`
Feed layout skeleton for posts.

```jsx
<SkeletonFeed items={5} type="post" showMedia={true} />
```

#### `SkeletonList`
List skeleton with optional avatars and actions.

```jsx
<SkeletonList
  items={10}
  showAvatar={true}
  showSecondary={true}
  showAction={false}
/>
```

#### `SkeletonCommentList`
Threaded comment list skeleton.

```jsx
<SkeletonCommentList items={5} nested={true} />
```

#### `SkeletonTable`
Table skeleton with header and rows.

```jsx
<SkeletonTable rows={5} columns={4} showHeader={true} />
```

---

### Page Skeletons

Pre-configured skeletons for entire pages.

```jsx
import {
  HomePageSkeleton,
  CommunitiesPageSkeleton,
  ProfilePageSkeleton,
  PostDetailPageSkeleton,
  SearchPageSkeleton,
  SettingsPageSkeleton,
} from '@/components/ui/skeletons';

// Usage
<HomePageSkeleton />
```

---

## Loading Components

Located in: `src/components/ui/loaders/`

### `PageLoader`
Full-page loading indicator with logo and progress.

```jsx
import { PageLoader } from '@/components/ui/loaders';

<PageLoader
  message="Loading..."
  logo={true}
  progress={50} // Optional progress percentage
/>
```

### `Spinner`
Rotating spinner loader.

```jsx
<Spinner size="md" color="blue" />
```

**Sizes:** sm | md | lg | xl
**Colors:** blue | purple | gray | white

### `DotLoader`
Three-dot pulse loader.

```jsx
<DotLoader size="md" color="blue" />
```

### `PulseLoader`
Pulsing circle loader.

```jsx
<PulseLoader size="md" color="blue" />
```

### `BarLoader`
Horizontal progress bar loader.

```jsx
<BarLoader width="100%" height="4px" color="blue" />
```

### `ContentLoader`
Loading indicator for content sections.

```jsx
<ContentLoader
  message="Loading content..."
  type="spinner" // 'spinner' | 'dots' | 'pulse'
  center={true}
  overlay={false}
/>
```

### `InlineLoader`
Inline loading indicator with optional message.

```jsx
<InlineLoader size="sm" message="Loading..." />
```

### `ButtonLoader`
Loader for button loading states.

```jsx
<ButtonLoader size="sm" color="white" />
```

### `InfiniteLoader`
Loader for infinite scroll.

```jsx
<InfiniteLoader message="Loading more..." />
```

### `LoadingOverlay`
Full-screen overlay loader with progress.

```jsx
<LoadingOverlay
  message="Processing..."
  progress={75} // Optional
/>
```

---

## Animation Utilities

Located in: `src/lib/animations.js`

### Page Transitions

```jsx
import { pageTransition, pageSlideTransition, pageFadeTransition } from '@/lib/animations';

<motion.div {...pageTransition}>
  <YourPage />
</motion.div>
```

### Container Animations

```jsx
import { staggerContainer, fadeInUp } from '@/lib/animations';

<motion.div variants={staggerContainer} initial="hidden" animate="show">
  <motion.div variants={fadeInUp}>Item 1</motion.div>
  <motion.div variants={fadeInUp}>Item 2</motion.div>
</motion.div>
```

### Available Variants

**Page Transitions:**
- `pageTransition` - Fade with vertical slide
- `pageSlideTransition` - Horizontal slide
- `pageFadeTransition` - Simple fade

**Container Animations:**
- `staggerContainer` - Standard stagger (0.1s)
- `staggerContainerFast` - Fast stagger (0.05s)
- `staggerContainerSlow` - Slow stagger (0.15s)

**Item Animations:**
- `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`
- `scaleIn`, `scaleInBounce`
- `listItem`, `listItemVertical`

**Modal Animations:**
- `modalBackdrop`, `modalContent`, `slideUpModal`

**Hover Effects:**
- `cardHover`, `cardTap`
- `buttonHover`, `buttonTap`
- `hoverLift`, `hoverGlow`

**Infinite Animations:**
- `shimmer`, `pulse`
- `rotate360`, `float`, `breathe`

---

## Hooks

Located in: `src/hooks/useAnimations.js`

### `usePrefersReducedMotion`
Detect if user prefers reduced motion.

```jsx
const prefersReducedMotion = usePrefersReducedMotion();
```

### `useScrollAnimation`
Animate elements when they enter viewport.

```jsx
const { ref, isInView } = useScrollAnimation({ once: true, margin: '-100px' });

<motion.div
  ref={ref}
  initial={{ opacity: 0 }}
  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
>
  Content
</motion.div>
```

### `useLoadingState`
Loading state with minimum display time.

```jsx
const showLoading = useLoadingState(isLoading, 500); // Min 500ms
```

### `useInfiniteScroll`
Intersection observer for infinite scroll.

```jsx
const { targetRef, isIntersecting } = useInfiniteScroll(() => {
  loadMore();
});

<div ref={targetRef}>Load more trigger</div>
```

### `useStaggerAnimation`
Stagger animation for lists.

```jsx
const visibleItems = useStaggerAnimation(items.length, 0.1);
```

### `useHoverAnimation`
Track hover state with bindings.

```jsx
const { isHovered, bind } = useHoverAnimation();

<div {...bind}>
  {isHovered ? 'Hovered!' : 'Hover me'}
</div>
```

### Other Hooks

- `usePageTransition()` - Page transition state management
- `useAnimationVariants(variants)` - Respect reduced motion
- `useSequentialReveal(items, delay)` - Sequential item reveal
- `useScrollProgress()` - Scroll percentage
- `usePerformanceMode()` - Detect low-performance devices
- `useSwipeAnimation(onLeft, onRight)` - Gesture-based animations

---

## Usage Examples

### Basic Page with Loading

```jsx
import { useState, useEffect } from 'react';
import { AnimatedPage } from '@/components/layout/AnimatedPage';
import { HomePageSkeleton } from '@/components/ui/skeletons';

function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(data => {
      setData(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <AnimatedPage transition="fade">
      {/* Your page content */}
    </AnimatedPage>
  );
}
```

### Staggered List

```jsx
import { AnimatedList, AnimatedListItem } from '@/components/layout/AnimatedPage';

function PostList({ posts }) {
  return (
    <AnimatedList stagger={0.1}>
      {posts.map(post => (
        <AnimatedListItem key={post.id}>
          <PostCard post={post} />
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );
}
```

### Infinite Scroll

```jsx
import { useInfiniteScroll } from '@/hooks/useAnimations';
import { InfiniteLoader } from '@/components/ui/loaders';

function Feed() {
  const { targetRef } = useInfiniteScroll(loadMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  return (
    <div>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
      <div ref={targetRef}>
        {isLoadingMore && <InfiniteLoader />}
      </div>
    </div>
  );
}
```

### Button with Loading State

```jsx
import { ButtonLoader } from '@/components/ui/loaders';

function SubmitButton({ isLoading }) {
  return (
    <button disabled={isLoading}>
      {isLoading ? (
        <>
          <ButtonLoader size="sm" color="white" />
          <span className="ml-2">Submitting...</span>
        </>
      ) : (
        'Submit'
      )}
    </button>
  );
}
```

### Animated Card Grid

```jsx
import { AnimatedCard } from '@/components/layout/AnimatedPage';

function CommunityGrid({ communities }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {communities.map((community, i) => (
        <AnimatedCard key={community.id} hover>
          <CommunityCard community={community} />
        </AnimatedCard>
      ))}
    </div>
  );
}
```

---

## Performance Best Practices

### 1. Use GPU Acceleration

All skeleton and loading components use `transform: translateZ(0)` for GPU acceleration.

### 2. Respect Reduced Motion

All animations automatically disable for users who prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are disabled */
}
```

### 3. Optimize Animation Properties

Only animate GPU-accelerated properties:
- `transform` (translate, scale, rotate)
- `opacity`
- Avoid animating: `width`, `height`, `top`, `left`

### 4. Use `will-change` Sparingly

Only add `will-change` to elements that will definitely animate:

```jsx
<motion.div style={{ willChange: 'transform' }}>
  {/* Animated content */}
</motion.div>
```

### 5. Minimum Loading Display Time

Use `useLoadingState` to prevent flashing:

```jsx
const showLoading = useLoadingState(isLoading, 500); // Min 500ms
```

### 6. Lazy Load Animations

Don't animate off-screen content:

```jsx
const { ref, isInView } = useScrollAnimation();
// Only animate when in view
```

### 7. Stagger Animations Moderately

Keep stagger delays under 150ms for responsive feel:

```jsx
<AnimatedList stagger={0.1}> {/* 100ms */}
```

### 8. Batch Layout Updates

Use Framer Motion's `layout` prop for smooth layout animations:

```jsx
<motion.div layout transition={{ duration: 0.3 }}>
  {/* Content */}
</motion.div>
```

---

## CSS Animation Classes

Available in `src/styles/animations.css`:

- `.animate-shimmer` - Shimmer loading effect
- `.animate-pulse` - Pulse animation
- `.animate-spin` - Rotation
- `.animate-bounce` - Bounce effect
- `.animate-fade-in` - Fade in
- `.animate-fade-in-up` - Fade in from bottom
- `.animate-slide-in-left` - Slide from left
- `.hover-lift` - Lift on hover
- `.hover-scale` - Scale on hover
- `.transition-smooth` - Smooth transitions

---

## Browser Support

All animations are optimized for:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

Fallbacks are provided for older browsers.

---

## Accessibility

All loading components include:
- `role="status"` attributes
- Screen reader text with `.sr-only`
- `aria-label` attributes
- Reduced motion support

---

## Contributing

When adding new animations:
1. Test on 60fps target devices
2. Add reduced motion support
3. Use GPU-accelerated properties
4. Document usage examples
5. Add TypeScript types if applicable

---

## Support

For issues or questions:
- Check this guide first
- Review existing components for examples
- Test in multiple browsers
- Verify 60fps performance with DevTools

---

**Last Updated:** 2025-10-21
**Version:** 1.0.0
