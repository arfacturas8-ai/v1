# CRYB Platform - State Handling Quick Guide

## 🚀 Quick Start

Every component with API calls needs these 4 states:

1. **LOADING** - Show while fetching data
2. **ERROR** - Show when something goes wrong
3. **EMPTY** - Show when no data exists
4. **SUCCESS** - Confirm actions completed

---

## 📦 Available Components

### EmptyState
```tsx
import { EmptyState } from '../components/ui/EmptyState'

<EmptyState
  icon="document-text-outline"
  title="No posts yet"
  description="Be the first to create a post!"
  actionLabel="Create Post"
  onAction={() => navigate('CreatePost')}
/>
```

### ErrorState
```tsx
import { ErrorState } from '../components/ui/ErrorState'

<ErrorState
  error={error}
  title="Failed to load posts"
  onRetry={() => fetchPosts()}
  showErrorDetails={__DEV__}
/>
```

### Toast Notifications
```tsx
import { useToast } from '../components/ui/Toast'

const { showSuccess, showError } = useToast()

// On success
showSuccess('Post created!', 'Your post is now live.')

// On error
showError('Failed to create post', error.message)
```

### Retry with Backoff
```javascript
import { retryWithBackoff } from '../utils/retryWithBackoff'

const posts = await retryWithBackoff(
  () => apiService.getPosts(),
  { maxRetries: 3 }
)
```

---

## ✅ Complete Component Template

```javascript
import React, { useState, useEffect } from 'react'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { useToast } from './ui/Toast'
import { retryWithBackoff } from '../utils/retryWithBackoff'

function MyComponent() {
  // 1. State
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { showSuccess, showError } = useToast()

  // 2. Fetch with retry
  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await retryWithBackoff(
        () => apiService.getData(),
        { maxRetries: 3 }
      )
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 3. Mutation with toast
  const handleCreate = async (formData) => {
    try {
      await apiService.create(formData)
      showSuccess('Created!', 'Your item was created successfully.')
      fetchData() // Refresh
    } catch (error) {
      showError('Failed to create', error.message)
    }
  }

  // 4. Loading state
  if (loading) {
    return <LoadingSpinner text="Loading..." />
  }

  // 5. Error state
  if (error) {
    return (
      <ErrorState
        error={error}
        title="Failed to load data"
        onRetry={fetchData}
      />
    )
  }

  // 6. Empty state
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="document-outline"
        title="No items found"
        description="Create your first item to get started!"
        actionLabel="Create Item"
        onAction={() => handleCreate()}
      />
    )
  }

  // 7. Success state - render data
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

---

## 🎯 When to Use What

### Loading States

**Use Skeleton Loaders for:**
- Lists and grids
- Card layouts
- Profile pages
- Content that loads >500ms

**Use Spinners for:**
- Quick actions (<1s)
- Button loading states
- Page transitions

**Use Progress Bars for:**
- File uploads
- Long operations (>5s)
- Multi-step processes

### Error States

**Always include:**
- ✅ Retry button
- ✅ Friendly error message
- ✅ Help text or support link

**Optional:**
- Error code (for support)
- Error details (dev mode only)
- Alternative actions

### Empty States

**Always include:**
- ✅ Icon or illustration
- ✅ Clear explanation WHY it's empty
- ✅ Primary action (CTA)

**Optional:**
- Secondary action
- Helpful tips
- Examples

### Success States

**Use Toasts for:**
- Form submissions
- Create/update/delete operations
- Settings saved
- Any non-blocking confirmation

**Use Modals for:**
- Critical confirmations
- Multi-step completions
- Requires user acknowledgment

---

## 🔄 Optimistic Updates

For instant UI feedback (like voting, following, etc.):

```javascript
const handleVote = async (postId, voteType) => {
  // 1. Update UI immediately
  setPosts(prev =>
    prev.map(post =>
      post.id === postId
        ? { ...post, votes: post.votes + 1, userVote: voteType }
        : post
    )
  )

  try {
    // 2. Make API call
    await apiService.vote(postId, voteType)
  } catch (error) {
    // 3. Revert on error
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, votes: post.votes - 1, userVote: null }
          : post
      )
    )
    showError('Vote failed', error.message)
  }
}
```

**Use optimistic updates for:**
- Voting/reactions
- Follow/unfollow
- Bookmark/save
- Simple toggles

**Don't use for:**
- Payments
- Deletions
- Complex operations
- Security-critical actions

---

## 🛡️ Error Boundaries

Wrap your app or critical sections:

```tsx
import { ErrorBoundary } from './components/ErrorBoundary'

// App-level
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Screen-level
<ErrorBoundary>
  <CriticalFeature />
</ErrorBoundary>
```

---

## 🎨 Toast Provider Setup

Wrap your app root:

```tsx
import { ToastProvider } from './components/ui/Toast'

function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  )
}
```

---

## 📱 Accessibility

### Loading States
```javascript
// Announce to screen readers
AccessibilityInfo.announceForAccessibility('Loading posts')
```

### Error States
```jsx
<div role="alert" aria-live="assertive">
  {error.message}
</div>
```

### Success States
```javascript
// Announce success
AccessibilityInfo.announceForAccessibility('Post created successfully')
```

---

## 🧪 Testing Checklist

For every component with API calls, test:

- [ ] Shows loading state initially
- [ ] Shows data on success
- [ ] Shows empty state when no data
- [ ] Shows error state on failure
- [ ] Retry button works
- [ ] Toast appears on success
- [ ] Optimistic updates work (if applicable)
- [ ] Accessible to screen readers

---

## 🚨 Common Mistakes

### ❌ Don't Do This
```javascript
// No loading state
const [data, setData] = useState([])

// Generic error message
{error && <div>Something went wrong</div>}

// No retry button
{error && <div>{error.message}</div>}

// No empty state
{data.length === 0 && null}

// No success feedback
await createPost()
navigate('/home')
```

### ✅ Do This
```javascript
// Proper loading state
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

// Friendly error with retry
<ErrorState
  error={error}
  title="Failed to load posts"
  onRetry={fetchPosts}
/>

// Helpful empty state
<EmptyState
  title="No posts yet"
  actionLabel="Create Post"
  onAction={handleCreate}
/>

// Success feedback
await createPost()
showSuccess('Post created!')
navigate('/home')
```

---

## 📚 Reference Examples

**Perfect Examples in Codebase:**
- `/apps/mobile/src/components/reddit/PostFeed.tsx`
- `/apps/mobile/src/screens/HomeScreen.tsx`
- `/apps/react-app/src/pages/HomePage.jsx`

Study these for best practices!

---

## 🎯 Quick Decision Tree

```
API Call Needed?
├─ YES
│  ├─ Add loading state
│  ├─ Add error state with retry
│  ├─ Add empty state (if applicable)
│  └─ Add success toast (if mutation)
└─ NO
   └─ No state handling needed

Loading >500ms?
├─ YES → Use skeleton loader
└─ NO → Use spinner

Mutation?
├─ YES
│  ├─ Add success toast
│  ├─ Consider optimistic update
│  └─ Handle errors gracefully
└─ NO
   └─ Just fetch and display

Critical operation?
├─ YES → Add error boundary
└─ NO → Standard error handling
```

---

## 💡 Pro Tips

1. **Always use retry logic** for network calls
2. **Always show what went wrong** in errors
3. **Always provide an action** in empty states
4. **Always confirm success** for mutations
5. **Use optimistic updates** for instant feedback
6. **Test offline scenarios** regularly
7. **Make errors helpful**, not scary
8. **Keep loading states smooth** with skeletons

---

## 🆘 Need Help?

1. Check the reference examples above
2. Read the full report: `STATES-IMPLEMENTATION-REPORT.md`
3. Review component documentation in source files
4. Ask the team in #engineering channel

---

**Last Updated:** November 3, 2025
**Maintained By:** States Implementation Agent
