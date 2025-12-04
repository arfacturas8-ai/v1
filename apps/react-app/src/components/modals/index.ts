/**
 * CRYB Platform - Modal Components
 * Centralized exports for all modal components
 */

// Wallet Connect Modal
export {
  WalletConnectModal,
  default as WalletConnect,
} from './WalletConnectModal';
export type {
  WalletConnectModalProps,
  WalletProvider,
} from './WalletConnectModal';

// Transaction Confirmation Modal
export {
  TransactionConfirmationModal,
  default as TransactionConfirmation,
} from './TransactionConfirmationModal';
export type {
  TransactionConfirmationModalProps,
  TransactionData,
  TransactionType,
} from './TransactionConfirmationModal';

// Sign Message Modal
export {
  SignMessageModal,
  default as SignMessage,
} from './SignMessageModal';
export type {
  SignMessageModalProps,
} from './SignMessageModal';

// Report Modal
export {
  ReportModal,
  default as Report,
} from './ReportModal';
export type {
  ReportModalProps,
  ReportType,
} from './ReportModal';

// Share Modal
export {
  ShareModal,
  default as Share,
} from './ShareModal';
export type {
  ShareModalProps,
} from './ShareModal';

// Image Viewer Modal
export {
  ImageViewerModal,
  default as ImageViewer,
} from './ImageViewerModal';
export type {
  ImageViewerModalProps,
  MediaItem,
} from './ImageViewerModal';

// Media Picker Modal
export {
  MediaPickerModal,
  default as MediaPicker,
} from './MediaPickerModal';
export type {
  MediaPickerModalProps,
  MediaFile,
  CropData,
} from './MediaPickerModal';

// Confirmation Dialog
export {
  ConfirmationDialog,
  useConfirmation,
  confirmDelete,
  confirmLogout,
  confirmDiscard,
  confirmAction,
  default as Confirmation,
} from './ConfirmationDialog';
export type {
  ConfirmationDialogProps,
  DialogType,
  DialogAction,
  UseConfirmationOptions,
} from './ConfirmationDialog';
