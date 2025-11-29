# CRYB Platform - Interaction Patterns Quick Reference

## 🚀 Quick Start Guide

### Import What You Need

```javascript
// State Components
import { LoadingState, ErrorState, EmptyState, SuccessState } from './components/states';

// Skeletons
import { SkeletonList, SkeletonForm, SkeletonDashboard } from './components/ui/skeletons';

// UI Components
import { FormField } from './components/ui/FormField';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { ToastContainer } from './components/ui/Toast';

// Hooks
import useFormValidation from './hooks/useFormValidation';
import useToast from './hooks/useToast';
import useModal from './hooks/useModal';

// Utilities
import { validateEmail, validatePassword } from './utils/formValidation';
import { parseError, handleError } from './utils/errorHandling';
```

---

## 📝 Common Patterns

### 1. Page with Loading, Error, Empty, and Success States

```jsx
function MyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getData();
      setData(response.data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Loading state
  if (loading) {
    return <SkeletonList count={5} variant="post" />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        {...error}
        onRetry={() => {
          setRetryCount(prev => prev + 1);
          fetchData();
        }}
        retryCount={retryCount}
      />
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No data yet"
        description="Get started by adding your first item"
        primaryAction={{
          label: 'Add Item',
          onClick: handleAdd,
        }}
      />
    );
  }

  // Success state - render data
  return <div>{data.map(...)}</div>;
}
```

### 2. Form with Validation and Toast

```jsx
function MyForm() {
  const { toasts, success, error } = useToast();
  const { getFieldProps, handleSubmit, isSubmitting, resetForm } = useFormValidation(
    { email: '', name: '' },
    {
      email: validateEmail,
      name: (value) => value ? true : 'Name is required',
    }
  );

  const onSubmit = async (values) => {
    try {
      await api.submit(values);
      success('Form submitted successfully!');
      resetForm();
    } catch (err) {
      error('Failed to submit form');
    }
  };

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }}>
        <FormField {...getFieldProps('name')} id="name" label="Name" required />
        <FormField {...getFieldProps('email')} id="email" label="Email" type="email" required />
        <Button type="submit" loading={isSubmitting}>Submit</Button>
      </form>
      <ToastContainer toasts={toasts} />
    </>
  );
}
```

### 3. Modal with Form and Validation

```jsx
function EditModal() {
  const { isOpen, open, close, modalData } = useModal();
  const [hasChanges, setHasChanges] = useState(false);
  const { success } = useToast();

  const handleSave = () => {
    // Save logic
    setHasChanges(false);
    close();
    success('Changes saved!');
  };

  return (
    <>
      <Button onClick={() => open(data)}>Edit</Button>

      <Modal isOpen={isOpen} onClose={close} hasUnsavedChanges={hasChanges}>
        <ModalHeader><ModalTitle>Edit Item</ModalTitle></ModalHeader>
        <ModalBody>
          <FormField
            label="Name"
            value={modalData?.name}
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
}
```

### 4. Async Operation with Loading State

```jsx
function AsyncButton() {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      await api.doSomething();
      success('Operation completed!');
    } catch (err) {
      error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} loading={loading}>
      Click Me
    </Button>
  );
}
```

### 5. List with All States

```jsx
function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Loading
  if (loading) return <SkeletonList count={5} variant="default" />;

  // Error
  if (error) return <ErrorState {...parseError(error)} onRetry={fetchItems} />;

  // Empty
  if (items.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="No items"
        primaryAction={{ label: 'Add Item', onClick: handleAdd }}
      />
    );
  }

  // Data
  return (
    <div className="space-y-3">
      {items.map(item => <ItemCard key={item.id} {...item} />)}
    </div>
  );
}
```

---

## 🎨 Component Cheat Sheet

### LoadingState Props

```jsx
<LoadingState
  type="spinner" // spinner | progress | dots | inline
  size="md" // sm | md | lg | xl
  message="Loading..."
  showMessage={true}
  progress={50} // for type="progress"
  cancelable={false}
  onCancel={() => {}}
  longLoadingMessage="Taking longer than usual..."
  longLoadingThreshold={5000}
/>
```

### ErrorState Props

```jsx
<ErrorState
  title="Error Title"
  message="Error message"
  errorCode="ERR_001"
  timestamp={new Date().toISOString()}
  showRetry={true}
  onRetry={async () => {}}
  retryCount={0}
  maxRetries={3}
  showSupport={true}
  supportEmail="support@cryb.app"
  showDocs={true}
  docsUrl="/help"
  size="md" // sm | md | lg | xl
  variant="default" // default | destructive
/>
```

### EmptyState Props

```jsx
<EmptyState
  icon="inbox" // inbox | search | plus | upload | users | message | file | image
  title="Title"
  description="Description"
  primaryAction={{ label: 'Action', onClick: () => {}, icon: <Icon /> }}
  secondaryAction={{ label: 'Action', onClick: () => {} }}
  examples={['Example 1', 'Example 2']}
  showSearch={false}
  onSearch={(query) => {}}
  helpLinks={[{ label: 'Help', url: '/help' }]}
  importAction={{ label: 'Import', onClick: () => {} }}
  size="md" // sm | md | lg | xl
/>
```

### SuccessState Props

```jsx
<SuccessState
  title="Success!"
  message="Operation completed"
  nextSteps={['Step 1', 'Step 2']}
  showUndo={false}
  onUndo={() => {}}
  showShare={false}
  onShare={() => {}}
  viewResultAction={{ label: 'View', onClick: () => {} }}
  autoClose={false}
  autoCloseDelay={5000}
  onClose={() => {}}
  celebration={true}
  size="md" // sm | md | lg | xl
/>
```

### FormField Props

```jsx
<FormField
  id="field-id"
  name="field-name"
  label="Label"
  type="text" // text | email | password | textarea | select
  value={value}
  onChange={(e) => {}}
  onBlur={(e) => {}}
  placeholder="Placeholder"
  required={false}
  disabled={false}
  error="Error message"
  success="Success message" // or true
  helpText="Help text"
  maxLength={100}
  showCharCount={false}
  validation={(value) => true} // or error message
  validateOnChange={true}
  validateOnBlur={true}
  leftIcon={<Icon />}
  rightIcon={<Icon />}
  rows={3} // for textarea
  options={[{ value: '1', label: 'One' }]} // for select
/>
```

### Modal Props

```jsx
<Modal
  isOpen={true}
  onClose={() => {}}
  size="md" // sm | md | lg | xl | full
  showCloseButton={true}
  closeOnBackdropClick={true}
  closeOnEscape={true}
  preventClose={false}
  hasUnsavedChanges={false}
  confirmCloseMessage="Unsaved changes message"
>
  <ModalHeader><ModalTitle>Title</ModalTitle></ModalHeader>
  <ModalBody>Content</ModalBody>
  <ModalFooter>Actions</ModalFooter>
</Modal>
```

### Button Props

```jsx
<Button
  variant="primary" // primary | secondary | outline | ghost | danger | success | link | glass
  size="md" // sm | md | lg | xl | icon | icon-sm | icon-lg
  fullWidth={false}
  loading={false}
  disabled={false}
  leftIcon={<Icon />}
  rightIcon={<Icon />}
  onClick={() => {}}
>
  Label
</Button>
```

---

## 🪝 Hook Cheat Sheet

### useFormValidation

```jsx
const {
  values,              // Current form values
  errors,              // Validation errors
  touched,             // Touched fields
  isSubmitting,        // Submitting state
  isDirty,             // Has changes
  submitCount,         // Submit attempts
  handleChange,        // Handle field change
  handleBlur,          // Handle field blur
  handleSubmit,        // Handle form submit
  validateForm,        // Validate all fields
  resetForm,           // Reset form
  setFieldValue,       // Set single field
  setFieldError,       // Set field error
  setFieldTouched,     // Set field touched
  getFieldProps,       // Get field props (name, value, onChange, onBlur, error)
  getFieldMeta,        // Get field meta (value, error, touched, isDirty)
} = useFormValidation(initialValues, validationSchema);
```

### useToast

```jsx
const {
  toasts,              // Array of active toasts
  addToast,            // Add custom toast
  removeToast,         // Remove toast by ID
  removeAllToasts,     // Clear all toasts
  success,             // Show success toast
  error,               // Show error toast
  warning,             // Show warning toast
  info,                // Show info toast
  promise,             // Handle async with toast
} = useToast(options);

// Usage
success('Message', { title: 'Title', duration: 5000 });
promise(asyncFn, {
  loading: 'Loading...',
  success: 'Done!',
  error: 'Failed!',
});
```

### useModal

```jsx
const {
  isOpen,              // Modal open state
  open,                // Open modal (optionally with data)
  close,               // Close modal
  toggle,              // Toggle modal
  modalData,           // Data passed to modal
  setModalData,        // Update modal data
} = useModal(initialState, options);

// Usage
open({ id: 1, name: 'Item' }); // Open with data
close(); // Close modal
```

---

## ✅ Validation Cheat Sheet

### Built-in Validators

```jsx
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
  validateURL,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validateDate,
  validateWalletAddress,
  validateFile,
  validateRegex,
  composeValidators,
} from './utils/formValidation';

// Compose multiple validators
const validateRequiredEmail = composeValidators(
  (value) => validateRequired(value, 'Email'),
  validateEmail
);

// Custom validator
const customValidator = (value) => {
  if (!value) return 'Required';
  if (value.length < 3) return 'Too short';
  return true; // Valid
};
```

### Password Validation Options

```jsx
validatePassword(password, {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
});
```

### Number Validation Options

```jsx
validateNumber(value, {
  min: 0,
  max: 100,
  integer: true,
});
```

### Date Validation Options

```jsx
validateDate(date, {
  min: '2024-01-01',
  max: '2024-12-31',
  future: true, // Must be in future
  past: false,  // Must not be in past
});
```

### File Validation Options

```jsx
validateFile(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['jpg', 'png'],
});
```

---

## 🎯 Error Handling Cheat Sheet

### Parse and Handle Errors

```jsx
import { parseError, handleError, isRetryableError } from './utils/errorHandling';

try {
  await api.call();
} catch (err) {
  const parsed = parseError(err);
  // parsed = { type, message, errorCode, timestamp, originalError }

  handleError(err, {
    showToast: true,
    logToConsole: true,
    onError: (parsed) => {
      // Custom error handling
    },
  });

  if (isRetryableError(err)) {
    // Retry logic
  }
}
```

### Retry with Backoff

```jsx
import { retryWithBackoff } from './utils/errorHandling';

await retryWithBackoff(
  async (attempt) => {
    return await api.call();
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    onRetry: (attempt, delay, error) => {
      console.log(`Retry ${attempt} in ${delay}ms`);
    },
  }
);
```

---

## 📱 Responsive Design

All components are mobile-first and responsive:

```jsx
// Automatic responsive behavior
<Modal size="md" /> // Adjusts on mobile

// Manual responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {items.map(...)}
</div>
```

---

## ♿ Accessibility

All components include:
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Focus management

```jsx
// Automatic accessibility
<FormField label="Email" required /> // Adds aria-required, aria-invalid

// Manual accessibility
<button aria-label="Close" onClick={handleClose}>
  <X />
</button>
```

---

## 🎨 Theming

All components use CSS variables for theming:

```css
--bg-primary
--bg-secondary
--bg-tertiary
--text-primary
--text-secondary
--text-tertiary
--border
--primary
--success
--error
--warning
--info
```

---

## 📚 Additional Resources

- Full Documentation: `INTERACTION_PATTERNS_COMPLETE.md`
- Demo Component: `src/components/examples/InteractionPatternsDemo.jsx`
- State Components: `src/components/states/`
- Form Components: `src/components/ui/FormField.jsx`
- Utilities: `src/utils/formValidation.js`, `src/utils/errorHandling.js`
- Hooks: `src/hooks/`

---

**Last Updated:** November 3, 2025
