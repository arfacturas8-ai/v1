/**
 * CRYB Platform - Media Picker Modal
 * Media selection with gallery access, camera, and crop options
 */

import React, { useState, useRef } from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../ui/modal';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import {
  Image as ImageIcon,
  Camera,
  Upload,
  Check,
  X,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid3x3,
} from 'lucide-react';

// ===== MEDIA ITEM =====
export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  selected?: boolean;
}

// ===== CROP DATA =====
export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zoom?: number;
}

// ===== MODAL PROPS =====
export interface MediaPickerModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal state changes */
  onOpenChange: (open: boolean) => void;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Maximum number of files */
  maxFiles?: number;
  /** Accepted file types */
  accept?: string;
  /** Show camera option */
  showCamera?: boolean;
  /** Show crop option */
  showCrop?: boolean;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Callback when files are selected */
  onSelect?: (files: File[], cropData?: CropData[]) => void;
  /** Initial files */
  initialFiles?: MediaFile[];
}

// ===== MEDIA PICKER MODAL COMPONENT =====
export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  onOpenChange,
  multiple = false,
  maxFiles = 10,
  accept = 'image/*,video/*',
  showCamera = true,
  showCrop = true,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  onSelect,
  initialFiles = [],
}) => {
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [view, setView] = useState<'picker' | 'crop'>('picker');
  const [cropFile, setCropFile] = useState<MediaFile | null>(null);
  const [cropData, setCropData] = useState<Record<string, CropData>>({});
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCameraView, setShowCameraView] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  };

  // Process selected files
  const processFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`);
        return false;
      }
      return true;
    });

    const newFiles: MediaFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      selected: !multiple, // Auto-select if single mode
    }));

    if (multiple) {
      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    } else {
      setFiles(newFiles.slice(0, 1));
    }
  };

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    if (!multiple) {
      setFiles((prev) =>
        prev.map((f) => ({ ...f, selected: f.id === fileId }))
      );
    } else {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, selected: !f.selected } : f))
      );
    }
  };

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  // Handle camera access
  const handleCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      setCameraStream(stream);
      setShowCameraView(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to access camera:', err);
      alert('Failed to access camera. Please grant camera permissions.');
    }
  };

  // Capture photo from camera
  const handleCapturePhoto = () => {
    if (!videoRef.current || !cameraStream) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
          processFiles([file]);
          handleCloseCameraView();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Close camera view
  const handleCloseCameraView = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraView(false);
  };

  // Start crop
  const handleStartCrop = (file: MediaFile) => {
    setCropFile(file);
    setView('crop');
  };

  // Save crop
  const handleSaveCrop = (data: CropData) => {
    if (cropFile) {
      setCropData((prev) => ({ ...prev, [cropFile.id]: data }));
    }
    setView('picker');
    setCropFile(null);
  };

  // Cancel crop
  const handleCancelCrop = () => {
    setView('picker');
    setCropFile(null);
  };

  // Confirm selection
  const handleConfirm = () => {
    const selectedFiles = files.filter((f) => f.selected);
    const cropDataArray = selectedFiles.map((f) => cropData[f.id] || null).filter(Boolean);

    onSelect?.(
      selectedFiles.map((f) => f.file),
      cropDataArray.length > 0 ? cropDataArray as CropData[] : undefined
    );

    onOpenChange(false);
    handleReset();
  };

  // Reset state
  const handleReset = () => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
    setCropData({});
    setView('picker');
    setCropFile(null);
    handleCloseCameraView();
  };

  // Handle close
  const handleClose = () => {
    onOpenChange(false);
    handleReset();
  };

  const selectedCount = files.filter((f) => f.selected).length;

  // Render camera view
  const renderCameraView = () => (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={handleCloseCameraView}
          className="bg-black/50 text-white hover:bg-black/70"
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          variant="primary"
          size="icon-lg"
          onClick={handleCapturePhoto}
          className="w-16 h-16 rounded-full"
        >
          <Camera className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );

  // Render picker view
  const renderPickerView = () => (
    <div className="space-y-4">
      {/* Upload Options */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed',
            'border-border hover:border-primary hover:bg-accent/5 transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">Choose Files</span>
          <span className="text-xs text-muted-foreground">
            {multiple ? `Up to ${maxFiles} files` : 'Select one file'}
          </span>
        </button>

        {showCamera && (
          <button
            onClick={handleCameraAccess}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed',
              'border-border hover:border-primary hover:bg-accent/5 transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Take Photo</span>
            <span className="text-xs text-muted-foreground">Use camera</span>
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Selected Files Grid */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Selected Media {selectedCount > 0 && `(${selectedCount})`}
            </h4>
            {multiple && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
                  file.selected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => toggleFileSelection(file.id)}
              >
                {file.type === 'image' ? (
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={file.preview}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Selection indicator */}
                {file.selected && (
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>

                {/* Crop button */}
                {showCrop && file.type === 'image' && file.selected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCrop(file);
                    }}
                    className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/50 flex items-center gap-1 hover:bg-black/70 transition-colors"
                  >
                    <Crop className="h-3 w-3 text-white" />
                    <span className="text-xs text-white">Crop</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Simple crop view (placeholder - would need full crop implementation)
  const renderCropView = () => (
    <div className="space-y-4">
      <div className="relative aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {cropFile && (
          <img
            src={cropFile.preview}
            alt="Crop preview"
            className="max-w-full max-h-full object-contain"
          />
        )}
        <div className="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none" />
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {}}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {}}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {}}
          aria-label="Rotate"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {}}
          aria-label="Aspect ratio"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCancelCrop}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleSaveCrop({ x: 0, y: 0, width: 100, height: 100 })}
          className="flex-1"
        >
          Apply Crop
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      size="lg"
    >
      <ModalHeader>
        <ModalTitle>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {view === 'picker' && 'Select Media'}
            {view === 'crop' && 'Crop Image'}
          </div>
        </ModalTitle>
        {view === 'picker' && (
          <ModalDescription>
            Choose {multiple ? 'up to ' + maxFiles + ' files' : 'a file'} from your device
            {showCamera && ' or take a photo'}
          </ModalDescription>
        )}
      </ModalHeader>

      <ModalBody>
        {showCameraView && renderCameraView()}
        {!showCameraView && view === 'picker' && renderPickerView()}
        {!showCameraView && view === 'crop' && renderCropView()}
      </ModalBody>

      {!showCameraView && view === 'picker' && (
        <ModalFooter justify="between">
          <div className="text-sm text-muted-foreground">
            {selectedCount > 0 && `${selectedCount} selected`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
            >
              Confirm Selection
            </Button>
          </div>
        </ModalFooter>
      )}
    </Modal>
  );
};

export default MediaPickerModal;
