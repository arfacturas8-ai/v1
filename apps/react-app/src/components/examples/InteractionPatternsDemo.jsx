/**
 * CRYB Platform - Interaction Patterns Demo
 * Complete demonstration of all interaction patterns
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../ui/Modal';
import { LoadingState } from '../states/LoadingState';
import { ErrorState } from '../states/ErrorState';
import { EmptyState } from '../states/EmptyState';
import { SuccessState } from '../states/SuccessState';
import { SkeletonList } from '../ui/skeletons/SkeletonList';
import { ToastContainer } from '../ui/Toast';
import useFormValidation from '../../hooks/useFormValidation';
import useToast from '../../hooks/useToast';
import useModal from '../../hooks/useModal';
import { validateEmail, validatePassword } from '../../utils/formValidation';
import { Plus, Search, Upload } from 'lucide-react';

export const InteractionPatternsDemo = () => {
  const [activeDemo, setActiveDemo] = useState('forms');
  const { toasts, success, error, warning, info } = useToast();

  // Form demo
  const { values, getFieldProps, handleSubmit, isSubmitting, resetForm } = useFormValidation(
    { email: '', password: '', bio: '' },
    {
      email: validateEmail,
      password: validatePassword,
    }
  );

  // Modal demo
  const { isOpen: isModalOpen, open: openModal, close: closeModal } = useModal();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Loading demo
  const [loadingType, setLoadingType] = useState('spinner');
  const [progress, setProgress] = useState(0);

  // Empty state demo
  const [hasItems, setHasItems] = useState(false);

  // Button states demo
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleFormSubmit = async () => {
    await handleSubmit(async (values) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      success('Form submitted successfully!');
      resetForm();
    });
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div style={{
  padding: '32px'
}}>
      <div style={{
  textAlign: 'center'
}}>
        <h1 style={{
  fontWeight: 'bold'
}}>
          Interaction Patterns Demo
        </h1>
        <p className="text-text-secondary">
          Complete demonstration of all interaction patterns in CRYB Platform
        </p>
      </div>

      {/* Navigation */}
      <div style={{
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'center'
}}>
        {[
          'forms',
          'buttons',
          'loading',
          'empty',
          'error',
          'success',
          'modals',
          'toasts',
        ].map(demo => (
          <Button
            key={demo}
            variant={activeDemo === demo ? 'primary' : 'outline'}
            onClick={() => setActiveDemo(demo)}
          >
            {demo.charAt(0).toUpperCase() + demo.slice(1)}
          </Button>
        ))}
      </div>

      {/* Forms Demo */}
      {activeDemo === 'forms' && (
        <div style={{
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h2 style={{
  fontWeight: '600'
}}>Form Patterns</h2>
          <div className="space-y-6 max-w-md">
            <FormField
              {...getFieldProps('email')}
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              required
              helpText="We'll never share your email with anyone else"
            />

            <FormField
              {...getFieldProps('password')}
              id="password"
              label="Password"
              type="password"
              placeholder="Enter secure password"
              required
              helpText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
            />

            <FormField
              {...getFieldProps('bio')}
              id="bio"
              label="Bio"
              type="textarea"
              placeholder="Tell us about yourself..."
              maxLength={200}
              showCharCount
              helpText="Share a bit about yourself"
            />

            <div style={{
  display: 'flex',
  gap: '12px'
}}>
              <Button
                onClick={handleFormSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Submit Form
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Buttons Demo */}
      {activeDemo === 'buttons' && (
        <div style={{
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h2 style={{
  fontWeight: '600'
}}>Button States</h2>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 style={{
  fontWeight: '500'
}}>Variants</h3>
              <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px'
}}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 style={{
  fontWeight: '500'
}}>Sizes</h3>
              <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '12px'
}}>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 style={{
  fontWeight: '500'
}}>States</h3>
              <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px'
}}>
                <Button loading={buttonLoading} onClick={() => {
                  setButtonLoading(true);
                  setTimeout(() => setButtonLoading(false), 2000);
                }}>
                  Click to Load
                </Button>
                <Button disabled>Disabled</Button>
                <Button leftIcon={<Plus style={{
  width: '16px',
  height: '16px'
}} />}>With Icon</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Demo */}
      {activeDemo === 'loading' && (
        <div style={{
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h2 style={{
  fontWeight: '600'
}}>Loading States</h2>
          <div className="space-y-8">
            <div className="space-y-3">
              <h3 style={{
  fontWeight: '500'
}}>Loading Types</h3>
              <div style={{
  display: 'flex',
  gap: '12px'
}}>
                <Button
                  variant={loadingType === 'spinner' ? 'primary' : 'outline'}
                  onClick={() => setLoadingType('spinner')}
                >
                  Spinner
                </Button>
                <Button
                  variant={loadingType === 'progress' ? 'primary' : 'outline'}
                  onClick={() => {
                    setLoadingType('progress');
                    simulateProgress();
                  }}
                >
                  Progress
                </Button>
                <Button
                  variant={loadingType === 'dots' ? 'primary' : 'outline'}
                  onClick={() => setLoadingType('dots')}
                >
                  Dots
                </Button>
              </div>

              <div style={{
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                <LoadingState
                  type={loadingType}
                  message="Loading your content..."
                  progress={loadingType === 'progress' ? progress : undefined}
                  cancelable
                  onCancel={() => info('Loading cancelled')}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 style={{
  fontWeight: '500'
}}>Skeleton Screens</h3>
              <SkeletonList count={3} variant="post" />
            </div>
          </div>
        </div>
      )}

      {/* Empty State Demo */}
      {activeDemo === 'empty' && (
        <div style={{
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h2 style={{
  fontWeight: '600'
}}>Empty States</h2>
          <div className="space-y-4">
            <Button onClick={() => setHasItems(!hasItems)}>
              {hasItems ? 'Clear Items' : 'Add Items'}
            </Button>

            {!hasItems && (
              <EmptyState
                icon="inbox"
                title="No items yet"
                description="Get started by creating your first item or importing existing data"
                primaryAction={{
                  label: 'Create First Item',
                  onClick: () => {
                    setHasItems(true);
                    success('Item created!');
                  },
                  icon: <Plus style={{
  width: '16px',
  height: '16px'
}} />,
                }}
                secondaryAction={{
                  label: 'Browse Templates',
                  onClick: () => info('Opening templates...'),
                  icon: <Search style={{
  width: '16px',
  height: '16px'
}} />,
                }}
                examples={[
                  'Create a new post to share with the community',
                  'Upload media content to your gallery',
                  'Start a discussion in your favorite channel',
                ]}
                importAction={{
                  label: 'Import from CSV',
                  onClick: () => info('Import dialog opened'),
                }}
                helpLinks={[
                  { label: 'Getting Started Guide', url: '/help/getting-started' },
                  { label: 'Video Tutorial', url: '/help/videos' },
                ]}
              />
            )}

            {hasItems && (
              <div style={{
  textAlign: 'center',
  padding: '48px'
}}>
                <p>Items are here! Click "Clear Items" to see empty state again.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State Demo */}
      {activeDemo === 'error' && (
        <div style={{
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h2 style={{
  fontWeight: '600'
}}>Error States</h2>
          <ErrorState
            title="Failed to load data"
            message="We encountered an error while fetching your data. This might be due to a network issue or server problem."
            errorCode="ERR_NETWORK_001"
            timestamp={new Date().toISOString()}
            showRetry
            onRetry={async () => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              success('Retry successful!');
            }}
            retryCount={0}
            maxRetries={3}
          />
        </div>
      )}

      {/* Success State Demo */}
      {activeDemo === 'success' && (
        <div style={{
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h2 style={{
  fontWeight: '600'
}}>Success States</h2>
          <SuccessState
            title="Post Published!"
            message="Your post has been successfully published and is now visible to the community."
            nextSteps={[
              'Share your post on social media',
              'Engage with comments from your followers',
              'Check your post analytics',
            ]}
            showShare
            onShare={() => info('Share dialog opened')}
            showUndo
            onUndo={() => warning('Post unpublished')}
            viewResultAction={{
              label: 'View Post',
              onClick: () => info('Navigating to post...'),
            }}
          />
        </div>
      )}

      {/* Modals Demo */}
      {activeDemo === 'modals' && (
        <div style={{
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h2 style={{
  fontWeight: '600'
}}>Modal Interactions</h2>
          <div className="space-y-4">
            <div style={{
  display: 'flex',
  gap: '12px'
}}>
              <Button onClick={() => openModal()}>
                Open Basic Modal
              </Button>
              <Button onClick={() => {
                setHasUnsavedChanges(true);
                openModal();
              }}>
                Open with Unsaved Changes
              </Button>
            </div>

            <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
              <h3 style={{
  fontWeight: '500'
}}>Modal Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                <li>Escape key closes modal</li>
                <li>Backdrop click closes modal</li>
                <li>Focus trapped within modal</li>
                <li>Focus returns on close</li>
                <li>Prevents body scroll</li>
                <li>Confirmation for unsaved changes</li>
              </ul>
            </div>
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            hasUnsavedChanges={hasUnsavedChanges}
          >
            <ModalHeader>
              <ModalTitle>Example Modal</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <p className="text-text-secondary mb-4">
                This is a demo modal with all interaction patterns implemented.
              </p>
              <FormField
                id="modal-input"
                label="Example Field"
                placeholder="Type something..."
                onChange={() => setHasUnsavedChanges(true)}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={() => {
                setHasUnsavedChanges(false);
                closeModal();
                success('Changes saved!');
              }}>
                Save Changes
              </Button>
            </ModalFooter>
          </Modal>
        </div>
      )}

      {/* Toasts Demo */}
      {activeDemo === 'toasts' && (
        <div style={{
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h2 style={{
  fontWeight: '600'
}}>Toast Notifications</h2>
          <div className="space-y-4">
            <div style={{
  display: 'grid',
  gap: '12px'
}}>
              <Button onClick={() => success('Operation completed successfully!')}>
                Success Toast
              </Button>
              <Button onClick={() => error('An error occurred. Please try again.')}>
                Error Toast
              </Button>
              <Button onClick={() => warning('Warning: This action cannot be undone.')}>
                Warning Toast
              </Button>
              <Button onClick={() => info('New features are now available!')}>
                Info Toast
              </Button>
            </div>

            <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
              <h3 style={{
  fontWeight: '500'
}}>Toast Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                <li>Auto-dismiss after 3-5 seconds</li>
                <li>Pause on hover</li>
                <li>Dismiss with Escape key</li>
                <li>Progress bar shows time remaining</li>
                <li>Stack multiple toasts</li>
                <li>Action buttons in toasts</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} position="top-right" />
    </div>
  );
};




export default InteractionPatternsDemo
