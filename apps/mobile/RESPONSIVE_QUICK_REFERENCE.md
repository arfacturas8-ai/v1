# React Native Responsive Design - Quick Reference

## Import Statement
```typescript
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';
```

## Common Patterns

### 1. Spacing
```typescript
// Padding
padding: spacing.lg,              // 16px
paddingHorizontal: spacing.xl,    // 20px
paddingVertical: spacing.md,      // 12px

// Margin
margin: spacing.xxl,              // 24px
marginBottom: spacing.sm,         // 8px
marginTop: spacing.xs,            // 4px

// Gap
gap: spacing.lg,                  // 16px
```

### 2. Typography
```typescript
// Body text
fontSize: typography.body1,       // 16px
fontSize: typography.body2,       // 14px
fontSize: typography.caption,     // 12px

// Headings
fontSize: typography.h1,          // 36px
fontSize: typography.h2,          // 32px
fontSize: typography.h3,          // 28px
fontSize: typography.h4,          // 24px
fontSize: typography.h5,          // 20px
fontSize: typography.h6,          // 18px
```

### 3. Tablet-Specific Styles
```typescript
// Conditional styling
padding: deviceInfo.isTablet ? spacing.xxl : spacing.lg,
fontSize: deviceInfo.isTablet ? typography.h4 : typography.h5,
borderRadius: deviceInfo.isTablet ? 14 : 12,

// Or with ternary
width: deviceInfo.isTablet ? scale(70) : scale(60),
```

### 4. Scale Function
```typescript
// For custom sizes
width: scale(44),
height: scale(44),
borderRadius: scale(22),
```

### 5. Icon Sizes
```tsx
// Responsive icon sizing
<Ionicons 
  name="home" 
  size={deviceInfo.isTablet ? scale(26) : scale(24)} 
  color={colors.primary} 
/>
```

## Complete Style Example
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: deviceInfo.isTablet ? typography.h2 : typography.h3,
    fontWeight: 'bold',
    color: colors.text,
  },
  card: {
    padding: deviceInfo.isTablet ? spacing.xxl : spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    backgroundColor: colors.card,
  },
  description: {
    fontSize: typography.body1,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#ffffff',
  },
});
```

## Device Detection
```typescript
// Check device type
if (deviceInfo.isTablet) {
  // Tablet-specific logic
}

if (deviceInfo.isSmallDevice) {
  // Small phone adjustments
}

// Device info available
deviceInfo.width        // Screen width
deviceInfo.height       // Screen height
deviceInfo.isLandscape  // Orientation
```

## Spacing Scale Reference
| Utility | Value | Use Case |
|---------|-------|----------|
| `spacing.xs` | 4px | Tiny gaps, tight spacing |
| `spacing.sm` | 8px | Small gaps, list item spacing |
| `spacing.md` | 12px | Default gaps, padding |
| `spacing.lg` | 16px | Standard padding, margins |
| `spacing.xl` | 20px | Large padding, section spacing |
| `spacing.xxl` | 24px | Extra large gaps |
| `spacing.xxxl` | 32px | Major section spacing |

## Typography Scale Reference
| Utility | Size | Use Case |
|---------|------|----------|
| `typography.caption` | 12px | Captions, metadata |
| `typography.body2` | 14px | Secondary text |
| `typography.body1` | 16px | Body text (default) |
| `typography.h6` | 18px | Small headings |
| `typography.h5` | 20px | Sub-headings |
| `typography.h4` | 24px | Section titles |
| `typography.h3` | 28px | Page titles |
| `typography.h2` | 32px | Large titles |
| `typography.h1` | 36px | Hero text |

## Best Practices

### DO ✅
- Use `spacing` utilities for all padding/margin
- Use `typography` for all font sizes
- Add tablet-specific styles for important screens
- Use `scale()` for custom dimensions
- Test on both phone and tablet simulators

### DON'T ❌
- Don't use hardcoded pixel values
- Don't skip responsive imports
- Don't use the same spacing for all devices
- Don't forget to test on tablets
- Don't mix hardcoded and responsive values

## Common Mistakes

### Mistake 1: Hardcoded Values
```typescript
// ❌ Bad
padding: 16,
fontSize: 20,

// ✅ Good
padding: spacing.lg,
fontSize: typography.h5,
```

### Mistake 2: No Tablet Optimization
```typescript
// ❌ Bad
borderRadius: 12,

// ✅ Good
borderRadius: deviceInfo.isTablet ? 14 : 12,
```

### Mistake 3: Inconsistent Spacing
```typescript
// ❌ Bad
paddingTop: 18,
paddingBottom: 22,

// ✅ Good
paddingTop: spacing.lg,
paddingBottom: spacing.xl,
```

## Migration Checklist

When updating a component:
- [ ] Add responsive imports
- [ ] Convert padding/margin to `spacing.*`
- [ ] Convert fontSize to `typography.*`
- [ ] Add tablet-specific styles where appropriate
- [ ] Update icon sizes with `scale()`
- [ ] Test on phone and tablet
- [ ] Verify in both portrait and landscape

---
For full documentation, see: RESPONSIVE_OPTIMIZATION_SUMMARY.md
