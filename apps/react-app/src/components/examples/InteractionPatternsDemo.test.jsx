/**
 * Tests for InteractionPatternsDemo component
 * Comprehensive test coverage for all interaction patterns
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InteractionPatternsDemo } from './InteractionPatternsDemo';

// Mock UI components
jest.mock('../ui/Button', () => ({
  Button: ({ children, onClick, variant, size, loading, disabled, leftIcon, ...props }) => (
    <button
      onClick={onClick}
      data-testid={props['data-testid'] || 'button'}
      data-variant={variant}
      data-size={size}
      data-loading={loading}
      disabled={disabled || loading}
      {...props}
    >
      {leftIcon && <span data-testid="button-icon">{leftIcon}</span>}
      {children}
    </button>
  ),
}));

jest.mock('../ui/FormField', () => ({
  FormField: ({ id, label, type, placeholder, helpText, showCharCount, maxLength, ...props }) => (
    <div data-testid={`form-field-${id}`}>
      <label htmlFor={id}>{label}</label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          placeholder={placeholder}
          maxLength={maxLength}
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          {...props}
        />
      )}
      {helpText && <span data-testid={`help-text-${id}`}>{helpText}</span>}
      {showCharCount && maxLength && (
        <span data-testid={`char-count-${id}`}>
          {props.value?.length || 0}/{maxLength}
        </span>
      )}
    </div>
  ),
}));

jest.mock('../ui/Modal', () => ({
  Modal: ({ isOpen, onClose, hasUnsavedChanges, children }) => {
    if (!isOpen) return null;

    return (
      <div data-testid="modal" role="dialog" data-has-unsaved={hasUnsavedChanges}>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    );
  },
  ModalHeader: ({ children }) => <div data-testid="modal-header">{children}</div>,
  ModalTitle: ({ children }) => <h2 data-testid="modal-title">{children}</h2>,
  ModalBody: ({ children }) => <div data-testid="modal-body">{children}</div>,
  ModalFooter: ({ children }) => <div data-testid="modal-footer">{children}</div>,
}));

jest.mock('../states/LoadingState', () => ({
  LoadingState: ({ type, message, progress, cancelable, onCancel }) => (
    <div data-testid="loading-state">
      <span data-testid="loading-type">{type}</span>
      <span data-testid="loading-message">{message}</span>
      {progress !== undefined && <span data-testid="loading-progress">{progress}</span>}
      {cancelable && (
        <button onClick={onCancel} data-testid="loading-cancel">Cancel</button>
      )}
    </div>
  ),
}));

jest.mock('../states/ErrorState', () => ({
  ErrorState: ({ title, message, errorCode, timestamp, showRetry, onRetry, retryCount, maxRetries }) => (
    <div data-testid="error-state">
      <h3 data-testid="error-title">{title}</h3>
      <p data-testid="error-message">{message}</p>
      {errorCode && <span data-testid="error-code">{errorCode}</span>}
      {timestamp && <span data-testid="error-timestamp">{timestamp}</span>}
      {showRetry && (
        <button onClick={onRetry} data-testid="error-retry">
          Retry ({retryCount}/{maxRetries})
        </button>
      )}
    </div>
  ),
}));

jest.mock('../states/EmptyState', () => ({
  EmptyState: ({ icon, title, description, primaryAction, secondaryAction, examples, importAction, helpLinks }) => (
    <div data-testid="empty-state">
      <span data-testid="empty-icon">{icon}</span>
      <h3 data-testid="empty-title">{title}</h3>
      <p data-testid="empty-description">{description}</p>
      {primaryAction && (
        <button onClick={primaryAction.onClick} data-testid="empty-primary-action">
          {primaryAction.icon}
          {primaryAction.label}
        </button>
      )}
      {secondaryAction && (
        <button onClick={secondaryAction.onClick} data-testid="empty-secondary-action">
          {secondaryAction.icon}
          {secondaryAction.label}
        </button>
      )}
      {examples && (
        <ul data-testid="empty-examples">
          {examples.map((example, idx) => (
            <li key={idx} data-testid={`empty-example-${idx}`}>{example}</li>
          ))}
        </ul>
      )}
      {importAction && (
        <button onClick={importAction.onClick} data-testid="empty-import-action">
          {importAction.label}
        </button>
      )}
      {helpLinks && (
        <div data-testid="empty-help-links">
          {helpLinks.map((link, idx) => (
            <a key={idx} href={link.url} data-testid={`empty-help-link-${idx}`}>
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  ),
}));

jest.mock('../states/SuccessState', () => ({
  SuccessState: ({ title, message, nextSteps, showShare, onShare, showUndo, onUndo, viewResultAction }) => (
    <div data-testid="success-state">
      <h3 data-testid="success-title">{title}</h3>
      <p data-testid="success-message">{message}</p>
      {nextSteps && (
        <ul data-testid="success-next-steps">
          {nextSteps.map((step, idx) => (
            <li key={idx} data-testid={`success-step-${idx}`}>{step}</li>
          ))}
        </ul>
      )}
      {showShare && (
        <button onClick={onShare} data-testid="success-share">Share</button>
      )}
      {showUndo && (
        <button onClick={onUndo} data-testid="success-undo">Undo</button>
      )}
      {viewResultAction && (
        <button onClick={viewResultAction.onClick} data-testid="success-view-result">
          {viewResultAction.label}
        </button>
      )}
    </div>
  ),
}));

jest.mock('../ui/skeletons/SkeletonList', () => ({
  SkeletonList: ({ count, variant }) => (
    <div data-testid="skeleton-list">
      <span data-testid="skeleton-count">{count}</span>
      <span data-testid="skeleton-variant">{variant}</span>
    </div>
  ),
}));

jest.mock('../ui/Toast', () => ({
  ToastContainer: ({ toasts, position }) => (
    <div data-testid="toast-container" data-position={position}>
      {toasts.map((toast) => (
        <div key={toast.id} data-testid={`toast-${toast.id}`} data-type={toast.type}>
          {toast.message}
        </div>
      ))}
    </div>
  ),
}));

// Mock hooks
const mockGetFieldProps = jest.fn((field) => ({
  value: '',
  onChange: jest.fn(),
  error: '',
  touched: false,
}));

const mockHandleSubmit = jest.fn((callback) => callback);
const mockResetForm = jest.fn();

jest.mock('../../hooks/useFormValidation', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    values: { email: '', password: '', bio: '' },
    getFieldProps: mockGetFieldProps,
    handleSubmit: mockHandleSubmit,
    isSubmitting: false,
    resetForm: mockResetForm,
  })),
}));

const mockSuccess = jest.fn();
const mockError = jest.fn();
const mockWarning = jest.fn();
const mockInfo = jest.fn();

jest.mock('../../hooks/useToast', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    toasts: [],
    success: mockSuccess,
    error: mockError,
    warning: mockWarning,
    info: mockInfo,
  })),
}));

const mockOpen = jest.fn();
const mockClose = jest.fn();

jest.mock('../../hooks/useModal', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isOpen: false,
    open: mockOpen,
    close: mockClose,
  })),
}));

// Mock form validation utils
jest.mock('../../utils/formValidation', () => ({
  validateEmail: jest.fn((value) => {
    if (!value || !value.includes('@')) return 'Invalid email';
    return '';
  }),
  validatePassword: jest.fn((value) => {
    if (!value || value.length < 8) return 'Password too short';
    return '';
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: ({ className }) => <span data-testid="plus-icon" className={className}>+</span>,
  Search: ({ className }) => <span data-testid="search-icon" className={className}>🔍</span>,
  Upload: ({ className }) => <span data-testid="upload-icon" className={className}>⬆</span>,
}));

describe('InteractionPatternsDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders the demo component', () => {
      render(<InteractionPatternsDemo />);

      expect(screen.getByText('Interaction Patterns Demo')).toBeInTheDocument();
      expect(screen.getByText('Complete demonstration of all interaction patterns in CRYB Platform')).toBeInTheDocument();
    });

    it('renders all navigation buttons', () => {
      render(<InteractionPatternsDemo />);

      expect(screen.getByText('Forms')).toBeInTheDocument();
      expect(screen.getByText('Buttons')).toBeInTheDocument();
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByText('Empty')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Modals')).toBeInTheDocument();
      expect(screen.getByText('Toasts')).toBeInTheDocument();
    });

    it('renders forms demo by default', () => {
      render(<InteractionPatternsDemo />);

      expect(screen.getByText('Form Patterns')).toBeInTheDocument();
    });

    it('renders toast container with correct position', () => {
      render(<InteractionPatternsDemo />);

      const toastContainer = screen.getByTestId('toast-container');
      expect(toastContainer).toBeInTheDocument();
      expect(toastContainer).toHaveAttribute('data-position', 'top-right');
    });
  });

  describe('Navigation Between Demo Sections', () => {
    it('navigates to buttons demo', () => {
      render(<InteractionPatternsDemo />);

      fireEvent.click(screen.getByText('Buttons'));

      expect(screen.getByText('Button States')).toBeInTheDocument();
    });

    it('navigates to loading demo', () => {
      render(<InteractionPatternsDemo />);

      fireEvent.click(screen.getByText('Loading'));

      expect(screen.getByText('Loading States')).toBeInTheDocument();
    });

    it('navigates to empty demo', () => {
      render(<InteractionPatternsDemo />);

      fireEvent.click(screen.getByText('Empty'));

      expect(screen.getByText('Empty States')).toBeInTheDocument();
    });

    it('navigates to error demo', () => {
      render(<InteractionPatternsDemo />);

      fireEvent.click(screen.getByText('Error'));

      expect(screen.getByText('Error States')).toBeInTheDocument();
    });

    it('navigates to success demo', () => {
      render(<InteractionPatternsDemo />);

      fireEvent.click(screen.getByText('Success'));

      expect(screen.getByText('Success States')).toBeInTheDocument();
    });

    it('navigates to modals demo', () => {
      render(<InteractionPatternsDemo />);

      fireEvent.click(screen.getByText('Modals'));

      expect(screen.getByText('Modal Interactions')).toBeInTheDocument();
    });

    it('navigates to toasts demo', () => {
      render(<InteractionPatternsDemo />);

      fireEvent.click(screen.getByText('Toasts'));

      expect(screen.getByText('Toast Notifications')).toBeInTheDocument();
    });

    it('highlights active navigation button', () => {
      render(<InteractionPatternsDemo />);

      const formsButton = screen.getByText('Forms');
      expect(formsButton).toHaveAttribute('data-variant', 'primary');

      fireEvent.click(screen.getByText('Buttons'));

      const buttonsButton = screen.getByText('Buttons');
      expect(buttonsButton).toHaveAttribute('data-variant', 'primary');
    });

    it('navigates back to forms demo', () => {
      render(<InteractionPatternsDemo />);

      fireEvent.click(screen.getByText('Buttons'));
      expect(screen.getByText('Button States')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Forms'));
      expect(screen.getByText('Form Patterns')).toBeInTheDocument();
    });
  });

  describe('Form Demo', () => {
    it('renders all form fields', () => {
      render(<InteractionPatternsDemo />);

      expect(screen.getByTestId('form-field-email')).toBeInTheDocument();
      expect(screen.getByTestId('form-field-password')).toBeInTheDocument();
      expect(screen.getByTestId('form-field-bio')).toBeInTheDocument();
    });

    it('displays email field with correct properties', () => {
      render(<InteractionPatternsDemo />);

      const emailField = screen.getByLabelText('Email Address');
      expect(emailField).toHaveAttribute('type', 'email');
      expect(emailField).toHaveAttribute('placeholder', 'you@example.com');
      expect(screen.getByTestId('help-text-email')).toHaveTextContent("We'll never share your email");
    });

    it('displays password field with correct properties', () => {
      render(<InteractionPatternsDemo />);

      const passwordField = screen.getByLabelText('Password');
      expect(passwordField).toHaveAttribute('type', 'password');
      expect(passwordField).toHaveAttribute('placeholder', 'Enter secure password');
      expect(screen.getByTestId('help-text-password')).toHaveTextContent('Must be at least 8 characters');
    });

    it('displays bio field with character count', () => {
      render(<InteractionPatternsDemo />);

      const bioField = screen.getByLabelText('Bio');
      expect(bioField).toHaveAttribute('placeholder', 'Tell us about yourself...');
      expect(bioField).toHaveAttribute('maxlength', '200');
      expect(screen.getByTestId('char-count-bio')).toBeInTheDocument();
    });

    it('calls getFieldProps for each form field', () => {
      render(<InteractionPatternsDemo />);

      expect(mockGetFieldProps).toHaveBeenCalledWith('email');
      expect(mockGetFieldProps).toHaveBeenCalledWith('password');
      expect(mockGetFieldProps).toHaveBeenCalledWith('bio');
    });

    it('renders submit and reset buttons', () => {
      render(<InteractionPatternsDemo />);

      expect(screen.getByText('Submit Form')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('handles form submission', async () => {
      render(<InteractionPatternsDemo />);

      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('shows loading state during form submission', async () => {
      const useFormValidation = require('../../hooks/useFormValidation').default;
      useFormValidation.mockReturnValue({
        values: { email: 'test@example.com', password: 'Password123!', bio: '' },
        getFieldProps: mockGetFieldProps,
        handleSubmit: mockHandleSubmit,
        isSubmitting: true,
        resetForm: mockResetForm,
      });

      render(<InteractionPatternsDemo />);

      const submitButton = screen.getByText('Submit Form');
      expect(submitButton).toHaveAttribute('data-loading', 'true');
      expect(submitButton).toBeDisabled();
    });

    it('calls resetForm when reset button is clicked', () => {
      render(<InteractionPatternsDemo />);

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      expect(mockResetForm).toHaveBeenCalled();
    });

    it('displays success toast after successful submission', async () => {
      const useFormValidation = require('../../hooks/useFormValidation').default;
      const mockHandleSubmitLocal = jest.fn(async (callback) => {
        await callback({ email: 'test@example.com', password: 'Password123!' });
      });

      useFormValidation.mockReturnValue({
        values: { email: 'test@example.com', password: 'Password123!', bio: '' },
        getFieldProps: mockGetFieldProps,
        handleSubmit: mockHandleSubmitLocal,
        isSubmitting: false,
        resetForm: mockResetForm,
      });

      render(<InteractionPatternsDemo />);

      const submitButton = screen.getByText('Submit Form');

      await act(async () => {
        fireEvent.click(submitButton);
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith('Form submitted successfully!');
      });
    });

    it('resets form after successful submission', async () => {
      const useFormValidation = require('../../hooks/useFormValidation').default;
      const mockHandleSubmitLocal = jest.fn(async (callback) => {
        await callback({ email: 'test@example.com', password: 'Password123!' });
      });

      useFormValidation.mockReturnValue({
        values: { email: 'test@example.com', password: 'Password123!', bio: '' },
        getFieldProps: mockGetFieldProps,
        handleSubmit: mockHandleSubmitLocal,
        isSubmitting: false,
        resetForm: mockResetForm,
      });

      render(<InteractionPatternsDemo />);

      const submitButton = screen.getByText('Submit Form');

      await act(async () => {
        fireEvent.click(submitButton);
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockResetForm).toHaveBeenCalled();
      });
    });
  });

  describe('Button Demo', () => {
    beforeEach(() => {
      render(<InteractionPatternsDemo />);
      fireEvent.click(screen.getByText('Buttons'));
    });

    it('displays all button variants', () => {
      const primaryButtons = screen.getAllByText('Primary');
      expect(primaryButtons.length).toBeGreaterThan(0);
      expect(screen.getByText('Secondary')).toBeInTheDocument();
      expect(screen.getAllByText('Outline').length).toBeGreaterThan(0);
      expect(screen.getByText('Ghost')).toBeInTheDocument();
      expect(screen.getByText('Danger')).toBeInTheDocument();
      const successButtons = screen.getAllByText('Success');
      expect(successButtons.length).toBeGreaterThan(0);
    });

    it('displays all button sizes', () => {
      expect(screen.getByText('Small')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Large')).toBeInTheDocument();
      expect(screen.getByText('Extra Large')).toBeInTheDocument();
    });

    it('displays button states section', () => {
      expect(screen.getByText('Click to Load')).toBeInTheDocument();
      expect(screen.getByText('Disabled')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders button with correct variant attribute', () => {
      const primaryButton = screen.getByText('Primary');
      expect(primaryButton).toHaveAttribute('data-variant', 'primary');
    });

    it('renders button with correct size attribute', () => {
      const smallButton = screen.getByText('Small');
      expect(smallButton).toHaveAttribute('data-size', 'sm');
    });

    it('renders disabled button correctly', () => {
      const disabledButton = screen.getByText('Disabled');
      expect(disabledButton).toBeDisabled();
    });

    it('renders button with left icon', () => {
      const iconButton = screen.getByText('With Icon');
      const icon = iconButton.querySelector('[data-testid="button-icon"]');
      expect(icon).toBeInTheDocument();
    });

    it('handles button loading state on click', async () => {
      const loadButton = screen.getByText('Click to Load');

      fireEvent.click(loadButton);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(loadButton).toHaveAttribute('data-loading', 'true');
    });

    it('clears loading state after timeout', async () => {
      const loadButton = screen.getByText('Click to Load');

      fireEvent.click(loadButton);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(loadButton).toHaveAttribute('data-loading', 'false');
    });
  });

  describe('Loading Demo', () => {
    beforeEach(() => {
      render(<InteractionPatternsDemo />);
      fireEvent.click(screen.getByText('Loading'));
    });

    it('displays loading type buttons', () => {
      expect(screen.getByText('Spinner')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Dots')).toBeInTheDocument();
    });

    it('displays loading state component', () => {
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('defaults to spinner loading type', () => {
      const loadingType = screen.getByTestId('loading-type');
      expect(loadingType).toHaveTextContent('spinner');
    });

    it('displays loading message', () => {
      const loadingMessage = screen.getByTestId('loading-message');
      expect(loadingMessage).toHaveTextContent('Loading your content...');
    });

    it('switches to progress loading type', () => {
      fireEvent.click(screen.getByText('Progress'));

      const loadingType = screen.getByTestId('loading-type');
      expect(loadingType).toHaveTextContent('progress');
    });

    it('switches to dots loading type', () => {
      fireEvent.click(screen.getByText('Dots'));

      const loadingType = screen.getByTestId('loading-type');
      expect(loadingType).toHaveTextContent('dots');
    });

    it('shows progress bar for progress type', () => {
      fireEvent.click(screen.getByText('Progress'));

      expect(screen.getByTestId('loading-progress')).toBeInTheDocument();
    });

    it('simulates progress on progress button click', () => {
      fireEvent.click(screen.getByText('Progress'));

      const progressElement = screen.getByTestId('loading-progress');
      expect(progressElement).toHaveTextContent('0');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(progressElement).toHaveTextContent('10');
    });

    it('increments progress until 100%', () => {
      fireEvent.click(screen.getByText('Progress'));

      const progressElement = screen.getByTestId('loading-progress');

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(progressElement).toHaveTextContent('100');
    });

    it('displays cancel button for loading state', () => {
      expect(screen.getByTestId('loading-cancel')).toBeInTheDocument();
    });

    it('calls info toast when cancel is clicked', () => {
      const cancelButton = screen.getByTestId('loading-cancel');
      fireEvent.click(cancelButton);

      expect(mockInfo).toHaveBeenCalledWith('Loading cancelled');
    });

    it('displays skeleton screens section', () => {
      expect(screen.getByText('Skeleton Screens')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
    });

    it('renders skeleton list with correct count', () => {
      const skeletonCount = screen.getByTestId('skeleton-count');
      expect(skeletonCount).toHaveTextContent('3');
    });

    it('renders skeleton list with correct variant', () => {
      const skeletonVariant = screen.getByTestId('skeleton-variant');
      expect(skeletonVariant).toHaveTextContent('post');
    });
  });

  describe('Empty State Demo', () => {
    beforeEach(() => {
      render(<InteractionPatternsDemo />);
      fireEvent.click(screen.getByText('Empty'));
    });

    it('displays toggle button', () => {
      expect(screen.getByText('Add Items')).toBeInTheDocument();
    });

    it('displays empty state by default', () => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('displays empty state title and description', () => {
      expect(screen.getByTestId('empty-title')).toHaveTextContent('No items yet');
      expect(screen.getByTestId('empty-description')).toHaveTextContent('Get started by creating your first item');
    });

    it('displays empty state icon', () => {
      const icon = screen.getByTestId('empty-icon');
      expect(icon).toHaveTextContent('inbox');
    });

    it('displays primary action button', () => {
      const primaryAction = screen.getByTestId('empty-primary-action');
      expect(primaryAction).toHaveTextContent('Create First Item');
    });

    it('displays secondary action button', () => {
      const secondaryAction = screen.getByTestId('empty-secondary-action');
      expect(secondaryAction).toHaveTextContent('Browse Templates');
    });

    it('displays examples list', () => {
      expect(screen.getByTestId('empty-examples')).toBeInTheDocument();
      expect(screen.getByTestId('empty-example-0')).toHaveTextContent('Create a new post');
      expect(screen.getByTestId('empty-example-1')).toHaveTextContent('Upload media content');
      expect(screen.getByTestId('empty-example-2')).toHaveTextContent('Start a discussion');
    });

    it('displays import action', () => {
      const importAction = screen.getByTestId('empty-import-action');
      expect(importAction).toHaveTextContent('Import from CSV');
    });

    it('displays help links', () => {
      expect(screen.getByTestId('empty-help-links')).toBeInTheDocument();
      expect(screen.getByTestId('empty-help-link-0')).toHaveTextContent('Getting Started Guide');
      expect(screen.getByTestId('empty-help-link-1')).toHaveTextContent('Video Tutorial');
    });

    it('toggles items state when button clicked', () => {
      const toggleButton = screen.getByText('Add Items');
      fireEvent.click(toggleButton);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      expect(screen.getByText(/Items are here!/)).toBeInTheDocument();
      expect(screen.getByText('Clear Items')).toBeInTheDocument();
    });

    it('shows empty state again when cleared', () => {
      const toggleButton = screen.getByText('Add Items');
      fireEvent.click(toggleButton);

      const clearButton = screen.getByText('Clear Items');
      fireEvent.click(clearButton);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Add Items')).toBeInTheDocument();
    });

    it('calls success toast when primary action clicked', () => {
      const primaryAction = screen.getByTestId('empty-primary-action');
      fireEvent.click(primaryAction);

      expect(mockSuccess).toHaveBeenCalledWith('Item created!');
    });

    it('hides empty state after primary action', () => {
      const primaryAction = screen.getByTestId('empty-primary-action');
      fireEvent.click(primaryAction);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('calls info toast when secondary action clicked', () => {
      const secondaryAction = screen.getByTestId('empty-secondary-action');
      fireEvent.click(secondaryAction);

      expect(mockInfo).toHaveBeenCalledWith('Opening templates...');
    });

    it('calls info toast when import action clicked', () => {
      const importAction = screen.getByTestId('empty-import-action');
      fireEvent.click(importAction);

      expect(mockInfo).toHaveBeenCalledWith('Import dialog opened');
    });

    it('renders help links with correct hrefs', () => {
      const helpLink0 = screen.getByTestId('empty-help-link-0');
      const helpLink1 = screen.getByTestId('empty-help-link-1');

      expect(helpLink0).toHaveAttribute('href', '/help/getting-started');
      expect(helpLink1).toHaveAttribute('href', '/help/videos');
    });
  });

  describe('Error State Demo', () => {
    beforeEach(() => {
      render(<InteractionPatternsDemo />);
      fireEvent.click(screen.getByText('Error'));
    });

    it('displays error state component', () => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    it('displays error title', () => {
      expect(screen.getByTestId('error-title')).toHaveTextContent('Failed to load data');
    });

    it('displays error message', () => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent('We encountered an error while fetching your data');
    });

    it('displays error code', () => {
      expect(screen.getByTestId('error-code')).toHaveTextContent('ERR_NETWORK_001');
    });

    it('displays error timestamp', () => {
      expect(screen.getByTestId('error-timestamp')).toBeInTheDocument();
    });

    it('displays retry button', () => {
      expect(screen.getByTestId('error-retry')).toBeInTheDocument();
      expect(screen.getByTestId('error-retry')).toHaveTextContent('Retry (0/3)');
    });

    it('handles retry action', async () => {
      const retryButton = screen.getByTestId('error-retry');
      fireEvent.click(retryButton);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith('Retry successful!');
      });
    });
  });

  describe('Success State Demo', () => {
    beforeEach(() => {
      render(<InteractionPatternsDemo />);
      fireEvent.click(screen.getByText('Success'));
    });

    it('displays success state component', () => {
      expect(screen.getByTestId('success-state')).toBeInTheDocument();
    });

    it('displays success title', () => {
      expect(screen.getByTestId('success-title')).toHaveTextContent('Post Published!');
    });

    it('displays success message', () => {
      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toHaveTextContent('Your post has been successfully published');
    });

    it('displays next steps', () => {
      expect(screen.getByTestId('success-next-steps')).toBeInTheDocument();
      expect(screen.getByTestId('success-step-0')).toHaveTextContent('Share your post on social media');
      expect(screen.getByTestId('success-step-1')).toHaveTextContent('Engage with comments');
      expect(screen.getByTestId('success-step-2')).toHaveTextContent('Check your post analytics');
    });

    it('displays share button', () => {
      expect(screen.getByTestId('success-share')).toBeInTheDocument();
    });

    it('displays undo button', () => {
      expect(screen.getByTestId('success-undo')).toBeInTheDocument();
    });

    it('displays view result button', () => {
      const viewButton = screen.getByTestId('success-view-result');
      expect(viewButton).toBeInTheDocument();
      expect(viewButton).toHaveTextContent('View Post');
    });

    it('calls info toast when share button clicked', () => {
      const shareButton = screen.getByTestId('success-share');
      fireEvent.click(shareButton);

      expect(mockInfo).toHaveBeenCalledWith('Share dialog opened');
    });

    it('calls warning toast when undo button clicked', () => {
      const undoButton = screen.getByTestId('success-undo');
      fireEvent.click(undoButton);

      expect(mockWarning).toHaveBeenCalledWith('Post unpublished');
    });

    it('calls info toast when view result clicked', () => {
      const viewButton = screen.getByTestId('success-view-result');
      fireEvent.click(viewButton);

      expect(mockInfo).toHaveBeenCalledWith('Navigating to post...');
    });
  });

  describe('Modal Demo', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const useModal = require('../../hooks/useModal').default;
      useModal.mockReturnValue({
        isOpen: false,
        open: mockOpen,
        close: mockClose,
      });
    });

    it('displays modal action buttons', () => {
      render(<InteractionPatternsDemo />);
      const modalButtons = screen.getAllByText('Modals');
      fireEvent.click(modalButtons[0]);

      expect(screen.getByText('Open Basic Modal')).toBeInTheDocument();
      expect(screen.getByText('Open with Unsaved Changes')).toBeInTheDocument();
    });

    it('displays modal features list', () => {
      render(<InteractionPatternsDemo />);
      const modalButtons = screen.getAllByText('Modals');
      fireEvent.click(modalButtons[0]);

      expect(screen.getByText('Modal Features:')).toBeInTheDocument();
      expect(screen.getByText(/Escape key closes modal/)).toBeInTheDocument();
      expect(screen.getByText(/Backdrop click closes modal/)).toBeInTheDocument();
      expect(screen.getByText(/Focus trapped within modal/)).toBeInTheDocument();
      expect(screen.getByText(/Confirmation for unsaved changes/)).toBeInTheDocument();
    });

    it('calls open when basic modal button clicked', () => {
      render(<InteractionPatternsDemo />);
      const modalButtons = screen.getAllByText('Modals');
      fireEvent.click(modalButtons[0]);

      const openButton = screen.getByText('Open Basic Modal');
      fireEvent.click(openButton);

      expect(mockOpen).toHaveBeenCalled();
    });

    it('calls open when unsaved changes button clicked', () => {
      render(<InteractionPatternsDemo />);
      const modalButtons = screen.getAllByText('Modals');
      fireEvent.click(modalButtons[0]);

      const openButton = screen.getByText('Open with Unsaved Changes');
      fireEvent.click(openButton);

      expect(mockOpen).toHaveBeenCalled();
    });

    it('renders modal when open', () => {
      const useModal = require('../../hooks/useModal').default;
      useModal.mockReturnValue({
        isOpen: true,
        open: mockOpen,
        close: mockClose,
      });

      render(<InteractionPatternsDemo />);
      const modalButtons = screen.getAllByText('Modals');
      fireEvent.click(modalButtons[0]);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('displays modal with header, body, and footer', () => {
      const useModal = require('../../hooks/useModal').default;
      useModal.mockReturnValue({
        isOpen: true,
        open: mockOpen,
        close: mockClose,
      });

      render(<InteractionPatternsDemo />);
      const modalButtons = screen.getAllByText('Modals');
      fireEvent.click(modalButtons[0]);

      expect(screen.getByTestId('modal-header')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toBeInTheDocument();
      expect(screen.getByTestId('modal-body')).toBeInTheDocument();
      expect(screen.getByTestId('modal-footer')).toBeInTheDocument();
    });

    it('displays modal title', () => {
      const useModal = require('../../hooks/useModal').default;
      useModal.mockReturnValue({
        isOpen: true,
        open: mockOpen,
        close: mockClose,
      });

      render(<InteractionPatternsDemo />);
      const modalButtons = screen.getAllByText('Modals');
      fireEvent.click(modalButtons[0]);

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Example Modal');
    });

    it('displays form field in modal body', () => {
      const useModal = require('../../hooks/useModal').default;
      useModal.mockReturnValue({
        isOpen: true,
        open: mockOpen,
        close: mockClose,
      });

      render(<InteractionPatternsDemo />);
      const modalButtons = screen.getAllByText('Modals');
      fireEvent.click(modalButtons[0]);

      expect(screen.getByLabelText('Example Field')).toBeInTheDocument();
    });

    it('displays cancel and save buttons in footer', () => {
      const useModal = require('../../hooks/useModal').default;
      useModal.mockReturnValue({
        isOpen: true,
        open: mockOpen,
        close: mockClose,
      });

      render(<InteractionPatternsDemo />);
      const modalButtons = screen.getAllByText('Modals');
      fireEvent.click(modalButtons[0]);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Toast Demo', () => {
    beforeEach(() => {
      render(<InteractionPatternsDemo />);
      fireEvent.click(screen.getByText('Toasts'));
    });

    it('displays toast type buttons', () => {
      expect(screen.getByText('Success Toast')).toBeInTheDocument();
      expect(screen.getByText('Error Toast')).toBeInTheDocument();
      expect(screen.getByText('Warning Toast')).toBeInTheDocument();
      expect(screen.getByText('Info Toast')).toBeInTheDocument();
    });

    it('displays toast features list', () => {
      expect(screen.getByText('Toast Features:')).toBeInTheDocument();
      expect(screen.getByText(/Auto-dismiss after 3-5 seconds/)).toBeInTheDocument();
      expect(screen.getByText(/Pause on hover/)).toBeInTheDocument();
      expect(screen.getByText(/Dismiss with Escape key/)).toBeInTheDocument();
      expect(screen.getByText(/Progress bar shows time remaining/)).toBeInTheDocument();
    });

    it('calls success toast when button clicked', () => {
      const successButton = screen.getByText('Success Toast');
      fireEvent.click(successButton);

      expect(mockSuccess).toHaveBeenCalledWith('Operation completed successfully!');
    });

    it('calls error toast when button clicked', () => {
      const errorButton = screen.getByText('Error Toast');
      fireEvent.click(errorButton);

      expect(mockError).toHaveBeenCalledWith('An error occurred. Please try again.');
    });

    it('calls warning toast when button clicked', () => {
      const warningButton = screen.getByText('Warning Toast');
      fireEvent.click(warningButton);

      expect(mockWarning).toHaveBeenCalledWith('Warning: This action cannot be undone.');
    });

    it('calls info toast when button clicked', () => {
      const infoButton = screen.getByText('Info Toast');
      fireEvent.click(infoButton);

      expect(mockInfo).toHaveBeenCalledWith('New features are now available!');
    });
  });

  describe('Toast Integration', () => {
    it('displays toasts in toast container', () => {
      const useToast = require('../../hooks/useToast').default;
      useToast.mockReturnValue({
        toasts: [
          { id: '1', type: 'success', message: 'Success message' },
          { id: '2', type: 'error', message: 'Error message' },
        ],
        success: mockSuccess,
        error: mockError,
        warning: mockWarning,
        info: mockInfo,
      });

      render(<InteractionPatternsDemo />);

      expect(screen.getByTestId('toast-1')).toBeInTheDocument();
      expect(screen.getByTestId('toast-2')).toBeInTheDocument();
    });

    it('displays toast with correct type', () => {
      const useToast = require('../../hooks/useToast').default;
      useToast.mockReturnValue({
        toasts: [
          { id: '1', type: 'success', message: 'Success message' },
        ],
        success: mockSuccess,
        error: mockError,
        warning: mockWarning,
        info: mockInfo,
      });

      render(<InteractionPatternsDemo />);

      const toast = screen.getByTestId('toast-1');
      expect(toast).toHaveAttribute('data-type', 'success');
    });

    it('displays toast message', () => {
      const useToast = require('../../hooks/useToast').default;
      useToast.mockReturnValue({
        toasts: [
          { id: '1', type: 'info', message: 'Information message' },
        ],
        success: mockSuccess,
        error: mockError,
        warning: mockWarning,
        info: mockInfo,
      });

      render(<InteractionPatternsDemo />);

      expect(screen.getByText('Information message')).toBeInTheDocument();
    });
  });

  describe('Hook Integrations', () => {
    it('uses useFormValidation hook', () => {
      const useFormValidation = require('../../hooks/useFormValidation').default;

      render(<InteractionPatternsDemo />);

      expect(useFormValidation).toHaveBeenCalledWith(
        { email: '', password: '', bio: '' },
        expect.any(Object)
      );
    });

    it('uses useToast hook', () => {
      const useToast = require('../../hooks/useToast').default;

      render(<InteractionPatternsDemo />);

      expect(useToast).toHaveBeenCalled();
    });

    it('uses useModal hook', () => {
      const useModal = require('../../hooks/useModal').default;

      render(<InteractionPatternsDemo />);

      expect(useModal).toHaveBeenCalled();
    });

    it('passes validation functions to useFormValidation', () => {
      const useFormValidation = require('../../hooks/useFormValidation').default;
      const { validateEmail, validatePassword } = require('../../utils/formValidation');

      render(<InteractionPatternsDemo />);

      const validationConfig = useFormValidation.mock.calls[0][1];
      expect(validationConfig.email).toBe(validateEmail);
      expect(validationConfig.password).toBe(validatePassword);
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML for main heading', () => {
      render(<InteractionPatternsDemo />);

      const heading = screen.getByText('Interaction Patterns Demo');
      expect(heading.tagName).toBe('H1');
    });

    it('uses semantic HTML for section headings', () => {
      render(<InteractionPatternsDemo />);

      const sectionHeading = screen.getByText('Form Patterns');
      expect(sectionHeading.tagName).toBe('H2');
    });

    it('provides descriptive button labels', () => {
      render(<InteractionPatternsDemo />);
      fireEvent.click(screen.getByText('Buttons'));

      expect(screen.getByText('Click to Load')).toBeInTheDocument();
      expect(screen.getByText('Disabled')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('provides form labels for all inputs', () => {
      render(<InteractionPatternsDemo />);

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Bio')).toBeInTheDocument();
    });
  });
});

export default mockGetFieldProps
