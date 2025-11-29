# Loading States & Animations - Quick Reference

## 🚀 Quick Start

### 1. Page Loading
```jsx
import { HomePageSkeleton } from '@/components/ui/skeletons';

if (isLoading) return <HomePageSkeleton />;
```

### 2. List Loading
```jsx
import { SkeletonFeed } from '@/components/ui/skeletons';

if (isLoading) return <SkeletonFeed items={5} />;
```

### 3. Button Loading
```jsx
import { ButtonLoader } from '@/components/ui/loaders';

<button disabled={isLoading}>
  {isLoading ? <ButtonLoader size="sm" color="white" /> : 'Submit'}
</button>
```

### 4. Infinite Scroll
```jsx
import { useInfiniteScroll } from '@/hooks/useAnimations';
import { InfiniteLoader } from '@/components/ui/loaders';

const { targetRef } = useInfiniteScroll(loadMore);

<div ref={targetRef}>
  {isLoadingMore && <InfiniteLoader />}
</div>
```

---

## 📦 Available Components

### Skeleton Components
```jsx
import {
  Skeleton,              // Base skeleton
  SkeletonText,         // Multi-line text
  SkeletonCircle,       // Avatar/icon
  SkeletonButton,       // Button shape
  SkeletonImage,        // Image with aspect ratio

  SkeletonCard,         // Generic card
  SkeletonPostCard,     // Post card
  SkeletonCommunityCard,// Community card
  SkeletonUserCard,     // User card
  SkeletonCommentCard,  // Comment

  SkeletonGrid,         // Grid layout
  SkeletonFeed,         // Feed layout
  SkeletonList,         // List layout

  HomePageSkeleton,     // Full page skeletons
  CommunitiesPageSkeleton,
  ProfilePageSkeleton,
  PostDetailPageSkeleton,
} from '@/components/ui/skeletons';
```

### Loading Components
```jsx
import {
  PageLoader,           // Full page loader
  Spinner,             // Rotating spinner
  DotLoader,           // Three dots
  PulseLoader,         // Pulsing circle
  BarLoader,           // Progress bar

  ContentLoader,       // Content section
  InlineLoader,        // Inline loader
  ButtonLoader,        // Button state
  InfiniteLoader,      // Infinite scroll
  LoadingOverlay,      // Full screen overlay
} from '@/components/ui/loaders';
```

### Animation Components
```jsx
import {
  AnimatedPage,        // Page wrapper
  AnimatedList,        // Staggered list
  AnimatedListItem,    // List item
  AnimatedCard,        // Card with hover
  FadeIn,             // Fade in
  SlideIn,            // Slide in
  ScaleIn,            // Scale in
} from '@/components/layout/AnimatedPage';
```

---

## 🎨 Common Patterns

### Pattern 1: Page with Loading
```jsx
function MyPage() {
  const [loading, setLoading] = useState(true);

  if (loading) return <MyPageSkeleton />;

  return (
    <AnimatedPage>
      {/* Content */}
    </AnimatedPage>
  );
}
```

### Pattern 2: Staggered List
```jsx
<AnimatedList stagger={0.1}>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      <Card item={item} />
    </AnimatedListItem>
  ))}
</AnimatedList>
```

### Pattern 3: Infinite Scroll
```jsx
const { targetRef } = useInfiniteScroll(loadMore);

return (
  <>
    {items.map(item => <Item key={item.id} {...item} />)}
    <div ref={targetRef}>
      {loading && <InfiniteLoader />}
    </div>
  </>
);
```

### Pattern 4: Button with Loading
```jsx
<button onClick={handleSubmit} disabled={submitting}>
  {submitting ? (
    <ButtonLoader size="sm" color="white" />
  ) : (
    'Submit'
  )}
</button>
```

### Pattern 5: Content Section Loading
```jsx
{loading ? (
  <ContentLoader message="Loading content..." />
) : (
  <Content data={data} />
)}
```

---

## 🎯 Component Props

### Skeleton
```jsx
<Skeleton
  width="200px"          // String or number
  height="20px"          // String or number
  rounded="md"           // none|sm|md|lg|xl|full|2xl
  variant="shimmer"      // shimmer|pulse
/>
```

### SkeletonGrid
```jsx
<SkeletonGrid
  items={6}              // Number of items
  columns={3}            // 1|2|3|4|5|6
  gap={4}                // 2|3|4|6|8
  type="community"       // card|community|user|post
/>
```

### PageLoader
```jsx
<PageLoader
  message="Loading..."   // Loading message
  logo={true}           // Show logo
  progress={50}         // Progress percentage (optional)
/>
```

### Spinner
```jsx
<Spinner
  size="md"             // sm|md|lg|xl
  color="blue"          // blue|purple|gray|white
/>
```

### AnimatedPage
```jsx
<AnimatedPage
  transition="fade"     // fade|slide|default
>
  {children}
</AnimatedPage>
```

---

## 🎬 Animation Hooks

```jsx
// Detect reduced motion preference
const prefersReducedMotion = usePrefersReducedMotion();

// Animate on scroll into view
const { ref, isInView } = useScrollAnimation();

// Minimum loading time (prevent flashing)
const showLoading = useLoadingState(isLoading, 500);

// Infinite scroll trigger
const { targetRef } = useInfiniteScroll(loadMore);

// Hover state tracking
const { isHovered, bind } = useHoverAnimation();

// Scroll progress (0-100)
const progress = useScrollProgress();
```

---

## 🎨 CSS Classes

```css
/* Animations */
.animate-shimmer        /* Shimmer effect */
.animate-pulse         /* Pulse effect */
.animate-spin          /* Rotation */
.animate-fade-in       /* Fade in */
.animate-fade-in-up    /* Fade in from bottom */

/* Hover Effects */
.hover-lift            /* Lift on hover */
.hover-scale           /* Scale on hover */
.hover-glow            /* Glow on hover */

/* Transitions */
.transition-smooth     /* Smooth transition */
.transition-smooth-fast /* Fast transition */
```

---

## ⚡ Performance Tips

1. **Use appropriate skeleton** - Match skeleton to actual content
2. **Minimum display time** - Use `useLoadingState(loading, 500)`
3. **Viewport-based loading** - Use `useScrollAnimation()` for off-screen content
4. **GPU acceleration** - Already optimized, no action needed
5. **Reduced motion** - Automatically handled

---

## 🔍 Troubleshooting

**Q: Shimmer not showing?**
```jsx
// Make sure animations.css is imported in index.css
@import './styles/animations.css';
```

**Q: Animations choppy?**
```jsx
// Check GPU acceleration is working
// Chrome DevTools > Performance > Record
```

**Q: Loading flashing too quickly?**
```jsx
// Use minimum display time
const showLoading = useLoadingState(isLoading, 500);
```

**Q: Reduced motion not working?**
```jsx
// Check browser support for prefers-reduced-motion
// All components automatically respect this preference
```

---

## 📱 Responsive Usage

```jsx
// Mobile-optimized grid
<SkeletonGrid
  items={6}
  columns={2}  // Automatically responsive: 1 on mobile, 2 on md
/>

// Compact mode for mobile
<SkeletonPostCard compact={true} />

// Different loaders for different screens
{isMobile ? (
  <DotLoader size="sm" />
) : (
  <Spinner size="lg" />
)}
```

---

## 🎯 Real-World Examples

### Example 1: Community Page
```jsx
import { CommunitiesPageSkeleton } from '@/components/ui/skeletons';
import { AnimatedPage } from '@/components/layout/AnimatedPage';

function CommunitiesPage() {
  const { data, loading } = useCommunities();

  if (loading) return <CommunitiesPageSkeleton />;

  return (
    <AnimatedPage>
      <CommunityGrid communities={data} />
    </AnimatedPage>
  );
}
```

### Example 2: Post Feed
```jsx
import { SkeletonFeed } from '@/components/ui/skeletons';
import { useInfiniteScroll } from '@/hooks/useAnimations';

function PostFeed() {
  const { posts, loading, loadMore, hasMore } = usePosts();
  const { targetRef } = useInfiniteScroll(loadMore);

  if (loading && posts.length === 0) {
    return <SkeletonFeed items={5} />;
  }

  return (
    <>
      {posts.map(post => <Post key={post.id} {...post} />)}
      {hasMore && <div ref={targetRef}><InfiniteLoader /></div>}
    </>
  );
}
```

### Example 3: Profile Page
```jsx
import { ProfilePageSkeleton } from '@/components/ui/skeletons';

function ProfilePage({ userId }) {
  const { profile, loading } = useProfile(userId);

  if (loading) return <ProfilePageSkeleton />;

  return <ProfileContent profile={profile} />;
}
```

---

## 📚 Full Documentation

See `/src/components/ui/LOADING_ANIMATION_GUIDE.md` for complete documentation.

---

**Version:** 1.0.0
**Last Updated:** 2025-10-21
