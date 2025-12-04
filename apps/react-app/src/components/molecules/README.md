# Molecular Components

Mid-level UI components built from atomic elements. These components combine multiple atoms and provide complex interactive patterns with full state management.

## Components Overview

### 1. Card
Base container component with multiple variants and pressable states.

**Features:**
- Variants: `default`, `elevated`, `outlined`, `interactive`
- Pressable version with hover/press states
- Long press support
- Keyboard navigation
- Customizable padding and width

**Usage:**
```tsx
import { Card } from '@/components/molecules';

<Card variant="elevated" pressable onClick={() => console.log('clicked')}>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

---

### 2. ListItem
Standard list row component with rich customization options.

**Features:**
- Left icon or avatar support
- Title and subtitle
- Right accessory content
- Swipeable actions (mobile)
- Selection state
- Long press support
- Optional dividers

**Usage:**
```tsx
import { ListItem } from '@/components/molecules';

<ListItem
  leftAvatar="/avatar.jpg"
  title="John Doe"
  subtitle="Online"
  rightText="2m ago"
  swipeActions={[
    {
      label: 'Delete',
      icon: <TrashIcon />,
      backgroundColor: colors.semantic.error,
      onAction: () => handleDelete(),
    },
  ]}
  onClick={() => handleClick()}
/>
```

---

### 3. SearchBar
Advanced search input with voice, autocomplete, and recent searches.

**Features:**
- Search icon integration
- Clear button
- Cancel button (mobile-style)
- Voice input support
- Loading state
- Recent searches dropdown
- Keyboard shortcuts (Enter to search, Esc to cancel)

**Usage:**
```tsx
import { SearchBar } from '@/components/molecules';

<SearchBar
  value={searchQuery}
  placeholder="Search conversations..."
  showCancel
  showVoice
  showRecentSearches
  recentSearches={recentSearches}
  loading={isSearching}
  onChange={setSearchQuery}
  onSearch={handleSearch}
  onVoiceInput={handleVoiceInput}
/>
```

---

### 4. Header
Top navigation bar with customizable actions and title variants.

**Features:**
- Variants: `default`, `large`
- Back button support
- Custom left actions
- Multiple right actions with badges
- Subtitle support
- Sticky positioning
- Transparent mode with scroll detection
- Auto-blur on scroll

**Usage:**
```tsx
import { Header } from '@/components/molecules';

<Header
  variant="large"
  title="Messages"
  subtitle="15 unread"
  showBackButton
  sticky
  transparent
  rightActions={[
    {
      id: 'notifications',
      icon: <BellIcon />,
      label: 'Notifications',
      badge: 3,
      onClick: () => handleNotifications(),
    },
  ]}
  onBack={() => navigate(-1)}
/>
```

---

### 5. TabBar
Bottom or top navigation bar with badge indicators.

**Features:**
- Position: `top` or `bottom`
- Badge indicators
- Active state highlighting
- Haptic feedback support
- Icon + label or icon-only
- Keyboard navigation
- Disabled states

**Usage:**
```tsx
import { TabBar } from '@/components/molecules';

<TabBar
  position="bottom"
  activeTab="home"
  tabs={[
    { id: 'home', label: 'Home', icon: <HomeIcon />, badge: 5 },
    { id: 'explore', label: 'Explore', icon: <CompassIcon /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon /> },
  ]}
  onChange={setActiveTab}
  hapticFeedback
/>
```

---

### 6. SegmentedControl
Toggle control for 2-5 mutually exclusive options.

**Features:**
- Support for 2-5 segments
- Animated indicator
- Icon support
- Keyboard navigation (arrows)
- Disabled states
- Size variants: `sm`, `md`, `lg`
- Full-width option

**Usage:**
```tsx
import { SegmentedControl } from '@/components/molecules';

<SegmentedControl
  segments={[
    { id: 'grid', label: 'Grid', icon: <GridIcon /> },
    { id: 'list', label: 'List', icon: <ListIcon /> },
  ]}
  value={viewMode}
  onChange={setViewMode}
  fullWidth
/>
```

---

### 7. Menu
Dropdown/contextual menu with grouping and submenus.

**Features:**
- Grouped items with titles
- Icon support
- Keyboard shortcuts display
- Destructive item styling
- Nested submenus (unlimited depth)
- Dividers
- Disabled states
- Multiple placement options
- Auto-close on select

**Usage:**
```tsx
import { Menu } from '@/components/molecules';

<Menu
  trigger={<button>Options</button>}
  placement="bottom-right"
  groups={[
    {
      id: 'actions',
      title: 'Actions',
      items: [
        { id: 'edit', label: 'Edit', icon: <EditIcon />, shortcut: '⌘E' },
        { id: 'share', label: 'Share', icon: <ShareIcon /> },
      ],
    },
    {
      id: 'danger',
      items: [
        { id: 'delete', label: 'Delete', icon: <TrashIcon />, destructive: true },
      ],
    },
  ]}
  onItemClick={(id) => handleAction(id)}
/>
```

---

### 8. Modal
Centered overlay dialog with multiple size options.

**Features:**
- Sizes: `sm`, `md`, `lg`, `fullscreen`
- Close button
- Header with title
- Footer for actions
- Backdrop blur
- Close on overlay click (optional)
- Close on Escape (optional)
- Smooth animations
- Body scroll lock
- Focus trap

**Usage:**
```tsx
import { Modal } from '@/components/molecules';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
  footer={
    <>
      <button onClick={() => setIsOpen(false)}>Cancel</button>
      <button onClick={handleConfirm}>Confirm</button>
    </>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

---

### 9. BottomSheet
Draggable bottom panel with snap points.

**Features:**
- Multiple snap points (heights)
- Drag indicator
- Touch/mouse drag support
- Keyboard avoidance
- Swipe to dismiss
- Backdrop overlay
- Smooth animations
- Auto-snap to nearest point

**Usage:**
```tsx
import { BottomSheet } from '@/components/molecules';

<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  snapPoints={[90, 50, 25]}
  initialSnap={1}
  title="Filters"
  showDragIndicator
  keyboardAvoidance
>
  {/* Filter content */}
</BottomSheet>
```

---

### 10. Toast
Temporary notification with actions and variants.

**Features:**
- Variants: `info`, `success`, `warning`, `error`
- Positions: `top`, `bottom`, `top-left`, `top-right`, `bottom-left`, `bottom-right`
- Auto-dismiss with timer
- Progress bar
- Action button
- Dismissible
- Custom icons
- Description support

**Usage:**
```tsx
import { Toast } from '@/components/molecules';

<Toast
  variant="success"
  position="bottom"
  message="Message sent"
  description="Your message was delivered successfully"
  duration={4000}
  showProgress
  actionLabel="Undo"
  onAction={handleUndo}
  onDismiss={() => setToast(null)}
/>
```

---

### 11. Alert
Confirmation dialog with customizable actions.

**Features:**
- Variants: `default`, `destructive`
- Custom icons
- Title and message
- Multiple actions (primary, secondary, destructive)
- Centered layout
- Backdrop blur
- Keyboard support
- Smooth animations

**Usage:**
```tsx
import { Alert } from '@/components/molecules';

<Alert
  isOpen={isOpen}
  variant="destructive"
  title="Delete Account"
  message="This action cannot be undone. All your data will be permanently deleted."
  actions={[
    { label: 'Delete', variant: 'destructive', onClick: handleDelete },
    { label: 'Cancel', variant: 'secondary', onClick: () => setIsOpen(false) },
  ]}
  onClose={() => setIsOpen(false)}
/>
```

---

### 12. EmptyState
No content placeholder with call-to-action.

**Features:**
- Custom icon or illustration
- Title and description
- Primary CTA button
- Secondary CTA button
- Icon support in buttons
- Centered layout
- Custom max width

**Usage:**
```tsx
import { EmptyState } from '@/components/molecules';

<EmptyState
  icon={<InboxIcon />}
  title="No messages yet"
  description="Start a conversation to see your messages here"
  ctaLabel="New Message"
  ctaIcon={<PlusIcon />}
  onCtaClick={() => navigate('/compose')}
  secondaryCtaLabel="Learn More"
  onSecondaryCtaClick={() => openHelp()}
/>
```

---

### 13. ErrorState
Error display with retry and support options.

**Features:**
- Custom error icon
- Error code display
- Title and message
- Retry button with loading state
- Support link/email
- Technical details (collapsible)
- Timestamp tracking
- Mailto integration

**Usage:**
```tsx
import { ErrorState } from '@/components/molecules';

<ErrorState
  title="Connection Failed"
  message="Unable to connect to the server. Please check your internet connection."
  errorCode="ERR_NETWORK_500"
  showRetry
  showSupport
  supportEmail="support@cryb.ai"
  onRetry={handleRetry}
  retryLabel="Try Again"
/>
```

---

### 14. Skeleton
Loading placeholder with multiple variants.

**Features:**
- Variants: `text`, `heading`, `avatar`, `thumbnail`, `card`, `listItem`, `button`, `input`, `custom`
- Animated shimmer effect
- Circle option
- Multiple count support
- Customizable spacing
- Pre-built composite skeletons:
  - `SkeletonText`
  - `SkeletonHeading`
  - `SkeletonAvatar`
  - `SkeletonCard`
  - `SkeletonListItem`
  - `SkeletonCardWithImage`
  - `SkeletonProfile`
  - `SkeletonForm`
  - `SkeletonTable`

**Usage:**
```tsx
import { Skeleton, SkeletonListItem, SkeletonCardWithImage } from '@/components/molecules';

// Basic skeleton
<Skeleton variant="text" width="200px" count={3} />

// Composite skeletons
<SkeletonListItem showAvatar showSubtitle />
<SkeletonCardWithImage />
<SkeletonProfile />
<SkeletonForm fields={5} />
<SkeletonTable rows={10} columns={4} />
```

---

## Design Principles

### 1. **Full Token Usage**
All components use design tokens from `/design-system/tokens.ts`:
- `colors` - Brand colors, semantic colors, backgrounds, borders
- `spacing` - Consistent spacing scale
- `typography` - Font families, sizes, weights, line heights
- `radii` - Border radius values
- `animation` - Duration and easing functions
- `shadows` - Elevation shadows
- `zIndex` - Layering system

### 2. **Interactive States**
All interactive components handle:
- Hover states
- Pressed/active states
- Focus states (with visible outlines)
- Disabled states
- Loading states
- Error states

### 3. **Accessibility**
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader support
- Semantic HTML

### 4. **Responsive Design**
- Mobile-first approach
- Touch-friendly hit areas
- Swipe gestures on mobile
- Adaptive layouts
- Keyboard avoidance

### 5. **Animations**
- Smooth transitions using design tokens
- Entrance/exit animations
- Loading animations
- Gesture feedback
- Haptic feedback support

---

## Common Patterns

### State Management
Most components accept controlled props:
```tsx
const [value, setValue] = useState('');
<Component value={value} onChange={setValue} />
```

### Event Handlers
Consistent callback naming:
- `onClick` - Click/tap events
- `onChange` - Value changes
- `onClose` - Close/dismiss actions
- `onOpen` - Open actions
- `onAction` - Custom actions

### Styling
Override styles using `style` prop:
```tsx
<Component style={{ marginTop: spacing[4] }} />
```

### Accessibility
All interactive components support:
```tsx
<Component
  aria-label="Descriptive label"
  aria-describedby="description-id"
  tabIndex={0}
/>
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- All components use `React.useState` for local state
- `React.useRef` for DOM references and timers
- `React.useEffect` for side effects
- Cleanup functions prevent memory leaks
- Debounced animations prevent jank

---

## Contributing

When creating new molecular components:

1. Use design tokens exclusively
2. Implement all interactive states
3. Add keyboard navigation
4. Include accessibility features
5. Support mobile gestures where appropriate
6. Add TypeScript types
7. Document props and usage
8. Test on multiple devices
