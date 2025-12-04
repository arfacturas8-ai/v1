/**
 * CRYB Platform - Confirmation Dialog
 * Generic confirmation dialog with icon support and keyboard shortcuts
 */

import React, { useEffect } from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../ui/modal';
import { Button, ButtonProps } from '../ui/button';
import { cn } from '../../lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  HelpCircle,
  Trash2,
  LogOut,
  XCircle,
} from 'lucide-react';

// ===== DIALOG TYPES =====
export type DialogType = 'info' | 'warning' | 'error' | 'success' | 'question';
export type DialogAction = 'delete' | 'logout' | 'cancel' | 'default';

// ===== DIALOG PROPS =====
export interface ConfirmationDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when dialog state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog type */
  type?: DialogType;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description?: string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Primary action text */
  confirmText?: string;
  /** Secondary action text */
  cancelText?: string;
  /** Callback when confirmed */
  onConfirm?: () => void | Promise<void>;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Show cancel button */
  showCancel?: boolean;
  /** Confirm button variant */
  confirmVariant?: ButtonProps['variant'];
  /** Action type (affects styling) */
  actionType?: DialogAction;
  /** Loading state */
  loading?: boolean;
  /** Destructive action (red confirm button) */
  destructive?: boolean;
  /** Disable outside click */
  disableOutsideClick?: boolean;
  /** Additional content */
  children?: React.ReactNode;
  /** Custom class for dialog */
  className?: string;
}

// ===== TYPE CONFIGURATIONS =====
const TYPE_CONFIG: Record<
  DialogType,
  {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    defaultConfirmVariant: ButtonProps['variant'];
  }
> = {
  info: {
    icon: <Info className="h-6 w-6" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    defaultConfirmVariant: 'primary',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    defaultConfirmVariant: 'warning',
  },
  error: {
    icon: <AlertCircle className="h-6 w-6" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    defaultConfirmVariant: 'destructive',
  },
  success: {
    icon: <CheckCircle2 className="h-6 w-6" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
    defaultConfirmVariant: 'success',
  },
  question: {
    icon: <HelpCircle className="h-6 w-6" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
    defaultConfirmVariant: 'primary',
  },
};

// ===== ACTION TYPE CONFIGURATIONS =====
const ACTION_CONFIG: Record<DialogAction, { icon?: React.ReactNode }> = {
  delete: { icon: <Trash2 className="h-4 w-4" /> },
  logout: { icon: <LogOut className="h-4 w-4" /> },
  cancel: { icon: <XCircle className="h-4 w-4" /> },
  default: {},
};

// ===== CONFIRMATION DIALOG COMPONENT =====
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  type = 'info',
  title,
  description,
  icon,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = true,
  confirmVariant,
  actionType = 'default',
  loading = false,
  destructive = false,
  disableOutsideClick = false,
  children,
  className,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const config = TYPE_CONFIG[type];
  const actionConfig = ACTION_CONFIG[actionType];

  // Determine final confirm variant
  const finalConfirmVariant =
    confirmVariant ||
    (destructive ? 'destructive' : config.defaultConfirmVariant);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to confirm
      if (e.key === 'Enter' && !loading && !isProcessing) {
        e.preventDefault();
        handleConfirm();
      }
      // Escape to cancel
      if (e.key === 'Escape' && showCancel && !loading && !isProcessing) {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, isProcessing, showCancel]);

  // Handle confirm
  const handleConfirm = async () => {
    if (!onConfirm) {
      onOpenChange(false);
      return;
    }

    setIsProcessing(true);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const isLoading = loading || isProcessing;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      disableOutsideClick={disableOutsideClick || isLoading}
      disableEscapeKey={isLoading}
      contentClassName={className}
    >
      <ModalHeader showCloseButton={!isLoading}>
        <ModalTitle>
          <div className="flex items-center gap-3">
            <div className={cn('rounded-full p-2', config.bgColor)}>
              <div className={config.color}>
                {icon || config.icon}
              </div>
            </div>
            <span>{title}</span>
          </div>
        </ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalHeader>

      {children && (
        <ModalBody className="py-4">
          {children}
        </ModalBody>
      )}

      <ModalFooter justify="end">
        {showCancel && (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        )}
        <Button
          variant={finalConfirmVariant}
          onClick={handleConfirm}
          loading={isLoading}
          leftIcon={actionConfig.icon}
          disabled={isLoading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ===== HOOK FOR PROGRAMMATIC USAGE =====
export interface UseConfirmationOptions {
  type?: DialogType;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonProps['variant'];
  destructive?: boolean;
  actionType?: DialogAction;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<UseConfirmationOptions | null>(null);
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = (options: UseConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(options);
      setIsOpen(true);
      resolveRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  const ConfirmationDialogComponent = config ? (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      type={config.type}
      title={config.title}
      description={config.description}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      confirmVariant={config.confirmVariant}
      destructive={config.destructive}
      actionType={config.actionType}
      icon={config.icon}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      {config.children}
    </ConfirmationDialog>
  ) : null;

  return {
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
};

// ===== COMMON CONFIRMATION PRESETS =====
export const confirmDelete = (
  itemName: string = 'this item'
): UseConfirmationOptions => ({
  type: 'error',
  title: 'Delete Confirmation',
  description: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
  confirmText: 'Delete',
  cancelText: 'Cancel',
  destructive: true,
  actionType: 'delete',
});

export const confirmLogout = (): UseConfirmationOptions => ({
  type: 'warning',
  title: 'Logout Confirmation',
  description: 'Are you sure you want to logout? Any unsaved changes will be lost.',
  confirmText: 'Logout',
  cancelText: 'Stay',
  actionType: 'logout',
});

export const confirmDiscard = (): UseConfirmationOptions => ({
  type: 'warning',
  title: 'Discard Changes',
  description: 'You have unsaved changes. Are you sure you want to discard them?',
  confirmText: 'Discard',
  cancelText: 'Keep Editing',
  destructive: true,
});

export const confirmAction = (
  actionName: string
): UseConfirmationOptions => ({
  type: 'question',
  title: 'Confirm Action',
  description: `Are you sure you want to ${actionName}?`,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
});

export default ConfirmationDialog;
