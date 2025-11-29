# Interaction Patterns - Quick Reference Card

## Import Paths
```javascript
// State Components
import { LoadingState, ErrorState, EmptyState, SuccessState, 
         ProgressIndicator, Toast, ConfirmationDialog, 
         SkeletonLoader, FormField, Tooltip } from '@/components/states';

// Hooks
import { useAsync, useDebounce, useIntersectionObserver, useMediaQuery,
         useLocalStorage, useKeyPress, usePrevious, useToggle, 
         useToast, useClickOutside, useScrollLock } from '@/hooks/interactions';

// Utilities
import { validators, animations, formatters } from '@/utils/interactions';
```

## Common Patterns

### 1. Loading & Error States
```javascript
function DataComponent() {
  const { execute, isPending, data, error } = useAsync(fetchData);
  
  if (isPending) return <LoadingState type="spinner" />;
  if (error) return <ErrorState error={error.message} onRetry={execute} />;
  if (!data.length) return <EmptyState title="No data found" />;
  
  return <div>{/* render data */}</div>;
}
```

### 2. Form with Validation
```javascript
function MyForm() {
  const [email, setEmail] = useState('');
  const { success, error } = useToast();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validators.email(email);
    if (emailError) {
      error(emailError);
      return;
    }
    // submit...
    success('Form submitted!');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={validators.email(email)}
        required
      />
    </form>
  );
}
```

### 3. Debounced Search
```javascript
function SearchComponent() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}
```

### 4. Confirmation Dialog
```javascript
function DeleteButton({ itemId }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { success } = useToast();
  
  const handleDelete = async () => {
    await deleteItem(itemId);
    setShowConfirm(false);
    success('Item deleted');
  };
  
  return (
    <>
      <button onClick={() => setShowConfirm(true)}>Delete</button>
      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure?"
        variant="danger"
      />
    </>
  );
}
```

### 5. Progress Indicator
```javascript
function UploadComponent() {
  const [progress, setProgress] = useState(0);
  
  return (
    <ProgressIndicator
      value={progress}
      max={100}
      label="Uploading..."
      variant="bar"
    />
  );
}
```

### 6. Lazy Loading with Intersection Observer
```javascript
function LazyImage({ src }) {
  const { ref, isIntersecting } = useIntersectionObserver();
  
  return (
    <div ref={ref}>
      {isIntersecting ? <img src={src} /> : <SkeletonLoader variant="thumbnail" />}
    </div>
  );
}
```

### 7. Keyboard Shortcuts
```javascript
function Editor() {
  const savePressed = useKeyPress('s', { ctrl: true });
  
  useEffect(() => {
    if (savePressed) {
      handleSave();
    }
  }, [savePressed]);
  
  return <textarea />;
}
```

### 8. Local Storage Persistence
```javascript
function ThemeToggle() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'dark');
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme ({theme})
    </button>
  );
}
```

### 9. Responsive Design
```javascript
function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### 10. Click Outside Handler
```javascript
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();
  
  useClickOutside(ref, () => setIsOpen(false));
  
  return (
    <div ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
      {isOpen && <div>Menu items...</div>}
    </div>
  );
}
```

## Validators Cheat Sheet
```javascript
validators.email(value)                    // Email format
validators.required(value)                 // Not empty
validators.minLength(5)(value)            // Min 5 chars
validators.maxLength(100)(value)          // Max 100 chars
validators.pattern(/regex/, 'msg')(value) // Custom pattern
validators.url(value)                     // Valid URL
```

## Animation Presets
```javascript
import { motion } from 'framer-motion';
import { animations } from '@/utils/interactions';

<motion.div {...animations.fadeInUp}>Content</motion.div>
<motion.div {...animations.slideIn}>Content</motion.div>
<motion.div {...animations.scaleIn}>Content</motion.div>
```

## Formatters Cheat Sheet
```javascript
formatters.formatDate(date, 'relative')    // "2 hours ago"
formatters.formatDate(date, 'short')       // "11/3/2025"
formatters.formatDate(date, 'long')        // "November 3, 2025"
formatters.formatFileSize(1024000)         // "1 MB"
formatters.formatNumber(1234.56, 2)        // "1,234.56"
formatters.truncateText(text, 50)          // "Long text..."
```

## Component Variants

### LoadingState
- `type="spinner"` - Spinning loader with message
- `type="skeleton-list"` - List of skeleton items
- `type="default"` - Simple spinner

### ProgressIndicator
- `variant="bar"` - Horizontal progress bar
- `variant="circular"` - Circular progress indicator

### Toast
- `type="success"` - Green success toast
- `type="error"` - Red error toast
- `type="info"` - Blue info toast

### ConfirmationDialog
- `variant="default"` - Blue confirm button
- `variant="danger"` - Red confirm button
- `variant="warning"` - Yellow confirm button

### SkeletonLoader
- `variant="text"` - Single line skeleton
- `variant="title"` - Large title skeleton
- `variant="avatar"` - Circular avatar skeleton
- `variant="thumbnail"` - Image placeholder
- `variant="card"` - Full card skeleton

## Best Practices

1. **Always handle loading/error/empty states**
2. **Use debouncing for search/filter inputs**
3. **Validate forms with real-time feedback**
4. **Show confirmation for destructive actions**
5. **Use toast notifications for user feedback**
6. **Implement keyboard shortcuts for power users**
7. **Add ARIA labels for accessibility**
8. **Use skeleton screens instead of spinners**
9. **Persist user preferences with localStorage**
10. **Handle click outside for dropdowns/modals**

## Performance Tips

- Use `useDebounce` for expensive operations
- Lazy load images with `useIntersectionObserver`
- Memoize expensive computations
- Use `usePrevious` to avoid unnecessary updates
- Virtual scrolling for large lists
- GPU-accelerated animations only

## Accessibility Checklist

- [ ] All buttons have accessible names
- [ ] Form fields have labels
- [ ] Error messages use `role="alert"`
- [ ] Loading states use `aria-live="polite"`
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG 2.1 AA

---

**Quick Reference for Cryb Platform Developers**  
Updated: November 3, 2025
