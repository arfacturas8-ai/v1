# CRYB Platform - Interaction Patterns Migration Guide

## 🎯 Purpose

This guide helps developers migrate existing pages to use the new interaction patterns systematically.

---

## 📋 Pre-Migration Checklist

Before migrating a page, ensure:

- [ ] You understand the current page functionality
- [ ] You've reviewed the QUICK_REFERENCE.md
- [ ] You've tested the InteractionPatternsDemo
- [ ] You have a backup or version control

---

## 🔄 Migration Steps

### Step 1: Add Imports

Add these imports at the top of your page file:

```jsx
// State components
import { LoadingState, ErrorState, EmptyState, SuccessState } from '../components/states';

// Skeletons (choose what you need)
import { SkeletonList, SkeletonForm, SkeletonDashboard } from '../components/ui/skeletons';

// Form components (if page has forms)
import { FormField } from '../components/ui/FormField';

// Hooks (if page has forms/toasts/modals)
import useFormValidation from '../hooks/useFormValidation';
import useToast from '../hooks/useToast';
import useModal from '../hooks/useModal';

// Utilities (if page has validation/errors)
import { validateEmail, validateRequired } from '../utils/formValidation';
import { parseError } from '../utils/errorHandling';

// Toast container (if using toasts)
import { ToastContainer } from '../components/ui/Toast';
```

### Step 2: Replace Loading States

**Before:**
```jsx
if (loading) {
  return <div>Loading...</div>;
}
```

**After:**
```jsx
if (loading) {
  return <SkeletonList count={5} variant="post" />;
  // OR
  return <LoadingState type="spinner" message="Loading content..." />;
}
```

**Choose the right skeleton:**
- `SkeletonList` - For lists of items (posts, comments, users)
- `SkeletonForm` - For forms
- `SkeletonDashboard` - For dashboard/stats pages
- `LoadingState` - For simple loading indicators

### Step 3: Replace Error States

**Before:**
```jsx
if (error) {
  return <div>Error: {error.message}</div>;
}
```

**After:**
```jsx
const [retryCount, setRetryCount] = useState(0);

if (error) {
  return (
    <ErrorState
      {...parseError(error)}
      onRetry={() => {
        setRetryCount(prev => prev + 1);
        fetchData();
      }}
      retryCount={retryCount}
      maxRetries={3}
    />
  );
}
```

### Step 4: Replace Empty States

**Before:**
```jsx
if (items.length === 0) {
  return <div>No items found</div>;
}
```

**After:**
```jsx
if (items.length === 0) {
  return (
    <EmptyState
      icon="inbox"
      title="No items yet"
      description="Get started by creating your first item"
      primaryAction={{
        label: 'Create Item',
        onClick: handleCreate,
        icon: <Plus className="w-4 h-4" />,
      }}
      examples={[
        'Create engaging content',
        'Share with your community',
        'Earn rewards',
      ]}
    />
  );
}
```

### Step 5: Migrate Forms

**Before:**
```jsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [errors, setErrors] = useState({});

const handleSubmit = (e) => {
  e.preventDefault();
  // Validation logic
  // Submit logic
};

return (
  <form onSubmit={handleSubmit}>
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    {errors.email && <span>{errors.email}</span>}

    <input
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    {errors.password && <span>{errors.password}</span>}

    <button type="submit">Submit</button>
  </form>
);
```

**After:**
```jsx
const { toasts, success, error } = useToast();
const { getFieldProps, handleSubmit, isSubmitting } = useFormValidation(
  { email: '', password: '' },
  {
    email: validateEmail,
    password: validatePassword,
  }
);

const onSubmit = async (values) => {
  try {
    await api.submit(values);
    success('Form submitted successfully!');
  } catch (err) {
    error('Failed to submit form');
  }
};

return (
  <>
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }}>
      <FormField
        {...getFieldProps('email')}
        id="email"
        label="Email"
        type="email"
        required
        helpText="Your email address"
      />

      <FormField
        {...getFieldProps('password')}
        id="password"
        label="Password"
        type="password"
        required
        helpText="At least 8 characters"
      />

      <Button type="submit" loading={isSubmitting}>
        Submit
      </Button>
    </form>
    <ToastContainer toasts={toasts} />
  </>
);
```

### Step 6: Add Toast Notifications

**Before:**
```jsx
const handleAction = async () => {
  try {
    await api.action();
    alert('Success!');
  } catch (err) {
    alert('Error!');
  }
};
```

**After:**
```jsx
const { toasts, success, error } = useToast();

const handleAction = async () => {
  try {
    await api.action();
    success('Action completed successfully!');
  } catch (err) {
    error('Failed to complete action');
  }
};

// In return
return (
  <>
    {/* Your component */}
    <ToastContainer toasts={toasts} />
  </>
);
```

### Step 7: Enhance Modals

**Before:**
```jsx
const [showModal, setShowModal] = useState(false);

return (
  <>
    <button onClick={() => setShowModal(true)}>Open</button>
    {showModal && (
      <div className="modal" onClick={() => setShowModal(false)}>
        <div className="modal-content">
          <button onClick={() => setShowModal(false)}>X</button>
          Content
        </div>
      </div>
    )}
  </>
);
```

**After:**
```jsx
const { isOpen, open, close } = useModal();
const [hasChanges, setHasChanges] = useState(false);

return (
  <>
    <Button onClick={open}>Open Modal</Button>

    <Modal
      isOpen={isOpen}
      onClose={close}
      hasUnsavedChanges={hasChanges}
    >
      <ModalHeader>
        <ModalTitle>Modal Title</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <FormField
          label="Field"
          onChange={() => setHasChanges(true)}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={close}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </ModalFooter>
    </Modal>
  </>
);
```

### Step 8: Enhance Buttons

**Before:**
```jsx
<button onClick={handleClick} disabled={loading}>
  {loading ? 'Loading...' : 'Click Me'}
</button>
```

**After:**
```jsx
<Button onClick={handleClick} loading={loading}>
  Click Me
</Button>
```

---

## 📄 Page-by-Page Guide

### HomePage Migration

**Priority:** High
**Complexity:** Low
**Estimated Time:** 1-2 hours

Changes needed:
1. ✅ Already has skeletons - verify they're using latest components
2. Add ErrorState for fetch failures with retry
3. Add EmptyState for featured sections when empty
4. Add toast notifications for user actions

### ProfilePage Migration

**Priority:** High
**Complexity:** Medium
**Estimated Time:** 2-3 hours

Changes needed:
1. Add SkeletonProfile for loading state
2. Add ErrorState with retry for profile fetch
3. Add EmptyState for posts/activity when empty
4. Convert forms to use FormField
5. Add toast notifications for actions
6. Add success state for profile updates

### ChatPage Migration

**Priority:** High
**Complexity:** Medium
**Estimated Time:** 2-3 hours

Changes needed:
1. Add SkeletonList for message loading
2. Add ErrorState for connection errors
3. Add EmptyState for new conversations
4. Add toast for message send success/failure
5. Add connection status indicators

### SettingsPage Migration

**Priority:** High
**Complexity:** High
**Estimated Time:** 3-4 hours

Changes needed:
1. Convert ALL forms to use FormField
2. Add validation for all fields
3. Add toast notifications for save success/failure
4. Add confirmation modals for destructive actions
5. Add loading states for async operations
6. Add success states for completed actions

### LoginPage / RegisterPage Migration

**Priority:** High
**Complexity:** Medium
**Estimated Time:** 2-3 hours each

Changes needed:
1. Convert forms to use FormField with validation
2. Add loading state during authentication
3. Add error states for auth failures
4. Add toast notifications
5. Add success redirect with message

### PostDetailPage Migration

**Priority:** Medium
**Complexity:** Medium
**Estimated Time:** 2-3 hours

Changes needed:
1. Add SkeletonList for post loading
2. Add ErrorState for fetch failures
3. Add EmptyState for comments
4. Add toast for actions (like, save, share)
5. Add success state for comment submission

### CommunitiesPage / CommunityPage Migration

**Priority:** Medium
**Complexity:** Medium
**Estimated Time:** 2-3 hours each

Changes needed:
1. Add SkeletonList for communities loading
2. Add ErrorState with retry
3. Add EmptyState for no communities
4. Add toast for join/leave actions
5. Add success state for community creation

### SearchPage Migration

**Priority:** Medium
**Complexity:** Low
**Estimated Time:** 1-2 hours

Changes needed:
1. Add LoadingState for search
2. Add EmptyState for no results
3. Add ErrorState for search failures

### AdminPage / ModerationPage Migration

**Priority:** Low
**Complexity:** High
**Estimated Time:** 4-6 hours

Changes needed:
1. Add SkeletonDashboard for loading
2. Add comprehensive error handling
3. Add confirmation modals for all actions
4. Add toast notifications for all operations
5. Add success states for completed actions

---

## 🧪 Testing After Migration

For each migrated page, test:

### Loading States
- [ ] Shows appropriate skeleton/loader
- [ ] Matches content layout
- [ ] Has smooth transition to content

### Error States
- [ ] Shows clear error message
- [ ] Retry button works (max 3 times)
- [ ] Error details shown (dev mode)
- [ ] Support links work

### Empty States
- [ ] Shows friendly message
- [ ] Primary action works
- [ ] Examples/help links present
- [ ] Import option (if applicable)

### Form Validation
- [ ] Real-time validation works
- [ ] Error messages clear
- [ ] Success states show
- [ ] Character counters accurate
- [ ] Required indicators present

### Modals
- [ ] Escape closes modal
- [ ] Backdrop click closes
- [ ] Focus trapped
- [ ] Unsaved changes warning
- [ ] Keyboard navigation works

### Toasts
- [ ] Auto-dismiss works
- [ ] Pause on hover
- [ ] Multiple toasts stack
- [ ] Action buttons work

### Buttons
- [ ] Hover effects work
- [ ] Loading state prevents clicks
- [ ] Disabled state obvious
- [ ] Focus indicators visible

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announces states
- [ ] Focus management correct
- [ ] ARIA labels present

### Mobile
- [ ] Responsive layout
- [ ] Touch targets adequate
- [ ] Modals full-screen option
- [ ] Forms easy to fill

---

## 🚨 Common Pitfalls

### 1. Missing ToastContainer

**Problem:**
```jsx
const { success } = useToast();
// ... later
success('Message'); // Toast doesn't show!
```

**Solution:**
```jsx
const { toasts, success } = useToast();
return (
  <>
    {/* Your component */}
    <ToastContainer toasts={toasts} />
  </>
);
```

### 2. Not Using parseError

**Problem:**
```jsx
<ErrorState message={error.message} /> // Missing features
```

**Solution:**
```jsx
<ErrorState {...parseError(error)} />
```

### 3. Form Submit Not Preventing Default

**Problem:**
```jsx
<form onSubmit={handleSubmit(onSubmit)}> // Page refreshes!
```

**Solution:**
```jsx
<form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }}>
```

### 4. Not Tracking Retry Count

**Problem:**
```jsx
<ErrorState onRetry={fetchData} /> // No retry limit!
```

**Solution:**
```jsx
const [retryCount, setRetryCount] = useState(0);
<ErrorState
  onRetry={() => {
    setRetryCount(prev => prev + 1);
    fetchData();
  }}
  retryCount={retryCount}
/>
```

### 5. Missing Field IDs

**Problem:**
```jsx
<FormField label="Email" /> // Accessibility issue!
```

**Solution:**
```jsx
<FormField id="email" label="Email" />
```

---

## 📊 Migration Progress Tracker

Use this checklist to track migration progress:

### Core Pages (Priority 1)
- [ ] HomePage
- [ ] ProfilePage
- [ ] ChatPage
- [ ] LoginPage
- [ ] RegisterPage
- [ ] SettingsPage

### Content Pages (Priority 2)
- [ ] PostDetailPage
- [ ] CommunitiesPage
- [ ] CommunityPage
- [ ] SearchPage
- [ ] DiscoverPage
- [ ] NotificationsPage

### Secondary Pages (Priority 3)
- [ ] DirectMessagesPage
- [ ] ActivityFeedPage
- [ ] NFTGalleryPage
- [ ] NFTMarketplacePage
- [ ] CryptoPage
- [ ] TokenEconomicsPage

### Admin Pages (Priority 4)
- [ ] AdminPage
- [ ] ModerationPage
- [ ] ReportsPage
- [ ] UsersPage
- [ ] BotManagementPage

### Static Pages (Priority 5)
- [ ] LandingPage
- [ ] HelpPage
- [ ] ContactPage
- [ ] PrivacyPage
- [ ] TermsPage
- [ ] GuidelinesPage

---

## 🎯 Success Criteria

A page is successfully migrated when:

1. ✅ All loading states use skeleton components or LoadingState
2. ✅ All error states use ErrorState with retry
3. ✅ All empty states use EmptyState with actions
4. ✅ All forms use FormField with validation
5. ✅ All modals use enhanced Modal component
6. ✅ All user actions show toast notifications
7. ✅ All buttons use Button component with states
8. ✅ All tests pass
9. ✅ Accessibility audit passes
10. ✅ Mobile responsive

---

## 📚 Resources

- **Full Documentation:** `INTERACTION_PATTERNS_COMPLETE.md`
- **Quick Reference:** `QUICK_REFERENCE.md`
- **Demo Component:** `src/components/examples/InteractionPatternsDemo.jsx`
- **State Components:** `src/components/states/`
- **Form Components:** `src/components/ui/FormField.jsx`
- **Hooks:** `src/hooks/`
- **Utilities:** `src/utils/`

---

## 🤝 Getting Help

If you encounter issues during migration:

1. Check the QUICK_REFERENCE.md for examples
2. Review the InteractionPatternsDemo component
3. Search existing implementations in migrated pages
4. Ask in the team chat
5. Consult the full INTERACTION_PATTERNS_COMPLETE.md

---

**Last Updated:** November 3, 2025
**Version:** 1.0.0
