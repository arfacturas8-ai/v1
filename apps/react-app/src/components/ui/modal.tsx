/**
 * CRYB Design System - Modal & Dialog Components
 * Production-ready modal system with focus management and accessibility
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { Button, type ButtonProps } from './button';
import { useFocusTrap } from '../../lib/accessibility';
import { 
  backdropVariants,
  modalVariants,
  drawerVariants,
  slideVariants,
  fadeVariants,
} from '../../lib/animations';

// ===== MODAL OVERLAY VARIANTS =====
const overlayVariants = cva([
  'fixed inset-0 z-50',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
], {
  variants: {
    variant: {
      default: 'bg-black/80 backdrop-blur-sm',
      glass: 'bg-black/60 ',
      dark: 'bg-black/90 backdrop-blur-md',
      light: 'bg-black/40 backdrop-blur-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

// ===== MODAL CONTENT VARIANTS =====
const contentVariants = cva(
  [
    'fixed left-[50%] top-[50%] z-50',
    'translate-x-[-50%] translate-y-[-50%]',
    'w-full max-h-[85vh] overflow-hidden rounded-lg',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
    'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
    'duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'bg-background border border-border shadow-xl',
        glass: [
          'bg-background/80  border border-border/50',
          'shadow-2xl shadow-black/50',
        ],
        gradient: [
          'bg-gradient-to-br from-background via-background to-primary/5',
          'border border-primary/20 shadow-2xl shadow-primary/10',
        ],
        neon: [
          'bg-background/90 backdrop-blur-md border-2 border-accent-cyan/40',
          'shadow-2xl shadow-accent-cyan/20',
        ],
      },
      size: {
        sm: 'w-[calc(100vw-2rem)] max-w-sm',
        default: 'w-[calc(100vw-2rem)] max-w-lg',
        lg: 'w-[calc(100vw-2rem)] max-w-2xl',
        xl: 'w-[calc(100vw-2rem)] max-w-4xl',
        full: 'w-[95vw] max-w-none h-[95vh]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// ===== MODAL COMPONENT INTERFACES =====
export interface ModalProps {
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when modal open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Modal content */
  children: React.ReactNode;
  /** Size of the modal */
  size?: VariantProps<typeof contentVariants>['size'];
  /** Modal variant style */
  variant?: VariantProps<typeof contentVariants>['variant'];
  /** Overlay variant style */
  overlayVariant?: VariantProps<typeof overlayVariants>['variant'];
  /** Disable outside click to close */
  disableOutsideClick?: boolean;
  /** Disable escape key to close */
  disableEscapeKey?: boolean;
  /** Custom overlay class */
  overlayClassName?: string;
  /** Custom content class */
  contentClassName?: string;
}

// ===== MODAL ROOT COMPONENT =====
const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  children,
  size,
  variant = 'default',
  overlayVariant = 'default',
  disableOutsideClick = false,
  disableEscapeKey = false,
  overlayClassName,
  contentClassName,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(overlayVariants({ variant: overlayVariant }), overlayClassName)} />
        <Dialog.Content
          className={cn(contentVariants({ size, variant }), contentClassName)}
          onPointerDownOutside={disableOutsideClick ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={disableEscapeKey ? (e) => e.preventDefault() : undefined}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// ===== MODAL TRIGGER COMPONENT =====
export interface ModalTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const ModalTrigger: React.FC<ModalTriggerProps> = ({ children, asChild = false }) => {
  return (
    <Dialog.Trigger asChild={asChild}>
      {children}
    </Dialog.Trigger>
  );
};

// ===== MODAL HEADER COMPONENT =====
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show close button */
  showCloseButton?: boolean;
  /** Custom close button */
  closeButton?: React.ReactNode;
}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, showCloseButton = true, closeButton, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between p-6 border-b border-border',
          className
        )}
        {...props}
      >
        <div style={{
  flex: '1'
}}>{children}</div>
        {showCloseButton && (
          <Dialog.Close asChild>
            {closeButton || (
              <Button
                variant="ghost"
                size="icon-sm"
                style={{
  height: '24px',
  width: '24px'
}}
                aria-label="Close modal"
              >
                <X style={{
  height: '16px',
  width: '16px'
}} />
              </Button>
            )}
          </Dialog.Close>
        )}
      </div>
    );
  }
);
ModalHeader.displayName = 'ModalHeader';

// ===== MODAL TITLE COMPONENT =====
export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, level = 2, children, ...props }, ref) => {
    const Heading = `h${level}` as keyof JSX.IntrinsicElements;
    
    return (
      <Dialog.Title asChild>
        <Heading
          ref={ref}
          className={cn('text-lg font-semibold leading-none tracking-tight', className)}
          {...props}
        >
          {children}
        </Heading>
      </Dialog.Title>
    );
  }
);
ModalTitle.displayName = 'ModalTitle';

// ===== MODAL DESCRIPTION COMPONENT =====
const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <Dialog.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground mt-2', className)}
      {...props}
    >
      {children}
    </Dialog.Description>
  );
});
ModalDescription.displayName = 'ModalDescription';

// ===== MODAL BODY COMPONENT =====
const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('p-6 overflow-y-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
});
ModalBody.displayName = 'ModalBody';

// ===== MODAL FOOTER COMPONENT =====
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between';
}

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, justify = 'end', ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 p-6 border-t border-border',
          justifyClasses[justify],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModalFooter.displayName = 'ModalFooter';

// ===== MODAL CLOSE COMPONENT =====
const ModalClose = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { asChild?: boolean }
>(({ asChild = false, children, ...props }, ref) => {
  return (
    <Dialog.Close asChild={asChild}>
      {asChild ? (
        children
      ) : (
        <Button ref={ref} {...props}>
          {children}
        </Button>
      )}
    </Dialog.Close>
  );
});
ModalClose.displayName = 'ModalClose';

// ===== ALERT DIALOG VARIANTS =====
const alertContentVariants = cva([
  'fixed left-[50%] top-[50%] z-50',
  'translate-x-[-50%] translate-y-[-50%]',
  'bg-background border border-border rounded-lg shadow-xl',
  'w-full max-w-md p-6',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  'duration-200',
]);

// ===== ALERT DIALOG COMPONENT INTERFACES =====
export interface AlertDialogProps {
  /** Whether the alert is open */
  open?: boolean;
  /** Callback when alert open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Alert type */
  type?: 'info' | 'warning' | 'error' | 'success';
  /** Alert title */
  title: string;
  /** Alert description */
  description?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Callback when confirmed */
  onConfirm?: () => void;
  /** Show cancel button */
  showCancel?: boolean;
  /** Confirm button variant */
  confirmVariant?: ButtonProps['variant'];
  /** Custom icon */
  icon?: React.ReactNode;
  /** Custom content */
  children?: React.ReactNode;
}

// ===== ALERT DIALOG COMPONENT =====
const AlertDialogComponent: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  type = 'info',
  title,
  description,
  cancelText = 'Cancel',
  confirmText = 'Continue',
  onCancel,
  onConfirm,
  showCancel = true,
  confirmVariant,
  icon,
  children,
}) => {
  const typeConfig = {
    info: {
      icon: <Info style={{
  height: '24px',
  width: '24px'
}} />,
      variant: 'primary' as const,
    },
    warning: {
      icon: <AlertTriangle style={{
  height: '24px',
  width: '24px'
}} />,
      variant: 'warning' as const,
    },
    error: {
      icon: <AlertCircle style={{
  height: '24px',
  width: '24px'
}} />,
      variant: 'destructive' as const,
    },
    success: {
      icon: <CheckCircle2 style={{
  height: '24px',
  width: '24px'
}} />,
      variant: 'success' as const,
    },
  };

  const config = typeConfig[type];
  const finalConfirmVariant = confirmVariant || config.variant;

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={cn(overlayVariants())} />
        <AlertDialog.Content className={cn(alertContentVariants())}>
          <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px'
}}>
            <div className="flex-shrink-0 mt-1">
              {icon || config.icon}
            </div>
            <div style={{
  flex: '1'
}}>
              <div className="space-y-2">
                <AlertDialog.Title style={{
  fontWeight: '600'
}}>
                  {title}
                </AlertDialog.Title>
                {description && (
                  <AlertDialog.Description className="text-sm text-muted-foreground">
                    {description}
                  </AlertDialog.Description>
                )}
              </div>
              
              {children && <div>{children}</div>}
              
              <div style={{
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px'
}}>
                {showCancel && (
                  <AlertDialog.Cancel asChild>
                    <Button variant="outline" onClick={onCancel}>
                      {cancelText}
                    </Button>
                  </AlertDialog.Cancel>
                )}
                <AlertDialog.Action asChild>
                  <Button variant={finalConfirmVariant} onClick={onConfirm}>
                    {confirmText}
                  </Button>
                </AlertDialog.Action>
              </div>
            </div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

// ===== CONFIRMATION DIALOG HOOK =====
export interface UseConfirmationDialogOptions {
  type?: AlertDialogProps['type'];
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonProps['variant'];
}

export const useConfirmationDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<UseConfirmationDialogOptions | null>(null);
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = (options: UseConfirmationDialogOptions): Promise<boolean> => {
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

  const ConfirmationDialog = config ? (
    <AlertDialogComponent
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}
      {...config}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return {
    confirm,
    ConfirmationDialog,
  };
};

// ===== DRAWER COMPONENT (Mobile-friendly Modal) =====
export interface DrawerProps extends ModalProps {
  /** Position of the drawer */
  position?: 'bottom' | 'top' | 'left' | 'right';
}

const drawerContentVariants = cva(
  [
    'fixed z-50 bg-background border border-border shadow-xl',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'duration-200',
  ],
  {
    variants: {
      position: {
        bottom: [
          'inset-x-0 bottom-0 rounded-t-lg',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        ],
        top: [
          'inset-x-0 top-0 rounded-b-lg',
          'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        ],
        left: [
          'inset-y-0 left-0 w-80 rounded-r-lg',
          'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        ],
        right: [
          'inset-y-0 right-0 w-80 rounded-l-lg',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        ],
      },
    },
    defaultVariants: {
      position: 'bottom',
    },
  }
);

const Drawer: React.FC<DrawerProps> = ({
  position = 'bottom',
  overlayClassName,
  contentClassName,
  children,
  ...props
}) => {
  return (
    <Dialog.Root {...props}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(overlayVariants(), overlayClassName)} />
        <Dialog.Content
          className={cn(drawerContentVariants({ position }), contentClassName)}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// ===== EXPORTS =====
export {
  Modal,
  ModalTrigger,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  AlertDialogComponent as AlertDialog,
  Drawer,
  overlayVariants,
  contentVariants,
};

export type {
  ModalProps,
  ModalTriggerProps,
  ModalHeaderProps,
  ModalTitleProps,
  ModalFooterProps,
  AlertDialogProps,
  DrawerProps,
  UseConfirmationDialogOptions,
};