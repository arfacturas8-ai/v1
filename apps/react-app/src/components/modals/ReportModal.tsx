/**
 * CRYB Platform - Report Modal
 * Report content/user with type selection and details
 */

import React, { useState } from 'react';
import { getErrorMessage } from "../../utils/errorUtils";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../ui/modal';
import { Button } from '../ui/button';
import { Textarea } from '../ui/input';
import { Switch } from '../ui/switch';
import { cn } from '../../lib/utils';
import {
  Flag,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  Ban,
  Check,
  AlertCircle,
} from 'lucide-react';

// ===== REPORT TYPES =====
export type ReportType = 'spam' | 'abuse' | 'harassment' | 'fraud' | 'inappropriate' | 'other';

// ===== REPORT TYPE CONFIG =====
const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { label: string; icon: React.ReactNode; description: string; color: string }
> = {
  spam: {
    label: 'Spam',
    icon: <MessageSquare style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    description: 'Repetitive, unwanted, or promotional content',
    color: 'text-orange-500',
  },
  abuse: {
    label: 'Abuse',
    icon: <AlertTriangle style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    description: 'Harmful or offensive behavior',
    color: 'text-red-500',
  },
  harassment: {
    label: 'Harassment',
    icon: <Ban style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    description: 'Targeted bullying or threatening behavior',
    color: 'text-red-600',
  },
  fraud: {
    label: 'Fraud/Scam',
    icon: <ShieldAlert style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    description: 'Deceptive or fraudulent activity',
    color: 'text-purple-500',
  },
  inappropriate: {
    label: 'Inappropriate Content',
    icon: <AlertCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    description: 'Content that violates community guidelines',
    color: 'text-yellow-500',
  },
  other: {
    label: 'Other',
    icon: <Flag style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    description: 'Other issues not listed above',
    color: 'text-gray-500',
  },
};

// ===== REPORT STATE =====
type ReportState = 'form' | 'submitting' | 'success' | 'error';

// ===== MODAL PROPS =====
export interface ReportModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal state changes */
  onOpenChange: (open: boolean) => void;
  /** Type of entity being reported */
  entityType: 'user' | 'post' | 'comment' | 'message';
  /** ID of entity being reported */
  entityId: string;
  /** Name/title of entity being reported */
  entityName?: string;
  /** Callback when report is submitted */
  onSubmit?: (data: {
    type: ReportType;
    details: string;
    blockUser: boolean;
  }) => Promise<void>;
  /** Show block user option */
  showBlockOption?: boolean;
}

// ===== REPORT MODAL COMPONENT =====
export const ReportModal: React.FC<ReportModalProps> = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  onSubmit,
  showBlockOption = true,
}) => {
  const [state, setState] = useState<ReportState>('form');
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [details, setDetails] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get entity type label
  const entityTypeLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Please select a report type');
      return;
    }

    setState('submitting');
    setError(null);

    try {
      await onSubmit?.({
        type: selectedType,
        details,
        blockUser,
      });

      setState('success');

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 2000);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    }
  };

  // Handle close
  const handleClose = () => {
    if (state === 'form' || state === 'error' || state === 'success') {
      onOpenChange(false);
      resetState();
    }
  };

  // Reset state
  const resetState = () => {
    setState('form');
    setSelectedType(null);
    setDetails('');
    setBlockUser(false);
    setError(null);
  };

  // Render form
  const renderForm = () => (
    <>
      <ModalBody>
        <div className="space-y-6">
          {/* Entity Info */}
          {entityName && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Reporting {entityTypeLabel}
              </p>
              <p className="font-medium">{entityName}</p>
            </div>
          )}

          {/* Report Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              What's the issue? <span className="text-destructive">*</span>
            </label>
            <div className="space-y-2">
              {(Object.entries(REPORT_TYPE_CONFIG) as [ReportType, typeof REPORT_TYPE_CONFIG[ReportType]][]).map(
                ([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left',
                      'hover:border-primary/50 hover:bg-accent/5',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selectedType === type
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    <div className={cn('flex-shrink-0 mt-0.5', config.color)}>
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">{config.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {config.description}
                      </div>
                    </div>
                    {selectedType === type && (
                      <Check style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Textarea
              label="Additional Details (Optional)"
              placeholder="Provide any additional context that might help us review this report..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              resize="vertical"
            />
            <p className="text-xs text-muted-foreground">
              Your report is anonymous and will be reviewed by our moderation team.
            </p>
          </div>

          {/* Block User Option */}
          {showBlockOption && entityType === 'user' && (
            <div className="rounded-lg border border-border p-4">
              <Switch
                id="block-user"
                checked={blockUser}
                onCheckedChange={setBlockUser}
                label="Block this user"
                description="You won't see their content and they won't be able to interact with you"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter justify="between">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedType}
          leftIcon={<Flag style={{ width: "24px", height: "24px", flexShrink: 0 }} />}
        >
          Submit Report
        </Button>
      </ModalFooter>
    </>
  );

  // Render submitting state
  const renderSubmitting = () => (
    <ModalBody>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 " />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary " />
        </div>
        <h3 className="text-lg font-semibold mb-2">Submitting Report</h3>
        <p className="text-sm text-muted-foreground text-center">
          Please wait while we submit your report...
        </p>
      </div>
    </ModalBody>
  );

  // Render success state
  const renderSuccess = () => (
    <ModalBody>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <Check style={{ width: "48px", height: "48px", flexShrink: 0 }} />
        </div>
        <h3 className="text-lg font-semibold mb-2">Report Submitted</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          Thank you for your report. Our moderation team will review it shortly.
        </p>
        {blockUser && (
          <p className="text-sm text-muted-foreground text-center">
            You have blocked this user.
          </p>
        )}
      </div>
    </ModalBody>
  );

  // Render error state
  const renderError = () => (
    <>
      <ModalBody>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle style={{ width: "48px", height: "48px", flexShrink: 0 }} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Submission Failed</h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
            {error || 'Failed to submit your report. Please try again.'}
          </p>
        </div>
      </ModalBody>

      <ModalFooter justify="between">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Try Again
        </Button>
      </ModalFooter>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      size="default"
      disableOutsideClick={state === 'submitting'}
      disableEscapeKey={state === 'submitting'}
    >
      <ModalHeader>
        <ModalTitle>
          <div className="flex items-center gap-2">
            <Flag style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            {state === 'form' && `Report ${entityTypeLabel}`}
            {state === 'submitting' && 'Submitting Report'}
            {state === 'success' && 'Report Submitted'}
            {state === 'error' && 'Submission Error'}
          </div>
        </ModalTitle>
        {state === 'form' && (
          <ModalDescription>
            Help us keep the community safe by reporting inappropriate content
          </ModalDescription>
        )}
      </ModalHeader>

      {state === 'form' && renderForm()}
      {state === 'submitting' && renderSubmitting()}
      {state === 'success' && renderSuccess()}
      {state === 'error' && renderError()}
    </Modal>
  );
};

export default ReportModal;
