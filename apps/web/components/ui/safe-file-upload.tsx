"use client";

import * as React from "react";
import { Upload, X, FileIcon, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { sanitizeFileUploadName } from "@/lib/utils/input-sanitizer";

// File validation types
interface FileValidationConfig {
  maxFileSize: number; // in bytes
  allowedTypes: string[]; // MIME types
  maxFiles: number;
  allowedExtensions: string[];
  requireExtension: boolean;
  scanForViruses?: boolean;
}

interface FileUploadError {
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'TOO_MANY_FILES' | 'INVALID_NAME' | 'UPLOAD_FAILED' | 'SECURITY_VIOLATION' | 'UNKNOWN';
  message: string;
  file?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

interface SafeFileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  onUploadComplete?: (files: { id: string; url: string; name: string }[]) => void;
  onError?: (errors: FileUploadError[]) => void;
  config?: Partial<FileValidationConfig>;
  disabled?: boolean;
  multiple?: boolean;
  dragAndDrop?: boolean;
  showPreview?: boolean;
  className?: string;
}

// Default configuration
const DEFAULT_CONFIG: FileValidationConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  maxFiles: 5,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt', '.pdf', '.doc', '.docx'],
  requireExtension: true,
  scanForViruses: false,
};

// Dangerous file types that should never be allowed
const DANGEROUS_TYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-msi',
  'application/x-apple-diskimage',
  'application/vnd.microsoft.portable-executable',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'text/html',
  'application/x-shellscript',
  'application/x-sh',
  'application/x-csh',
  'application/x-tcsh',
  'application/x-perl',
  'application/x-python',
  'application/x-ruby',
  'application/x-php',
];

const DANGEROUS_EXTENSIONS = [
  '.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js', '.jar', '.app', '.dmg',
  '.pkg', '.deb', '.rpm', '.msi', '.sh', '.bash', '.csh', '.tcsh', '.pl', '.py', '.rb',
  '.php', '.asp', '.aspx', '.jsp', '.jspx', '.html', '.htm', '.xml'
];

// File type detection utilities
function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

function isImageFile(type: string): boolean {
  return type.startsWith('image/');
}

function generateFilePreview(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!isImageFile(file.type)) {
      resolve(null);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error generating file preview:', error);
      resolve(null);
    }
  });
}

// File validation
class FileValidator {
  private config: FileValidationConfig;

  constructor(config: FileValidationConfig) {
    this.config = config;
  }

  async validateFiles(files: FileList | File[]): Promise<{ valid: File[]; errors: FileUploadError[] }> {
    const validFiles: File[] = [];
    const errors: FileUploadError[] = [];
    const fileArray = Array.from(files);

    try {
      // Check total number of files
      if (fileArray.length > this.config.maxFiles) {
        errors.push({
          code: 'TOO_MANY_FILES',
          message: `Maximum ${this.config.maxFiles} files allowed. Selected ${fileArray.length} files.`,
        });
        return { valid: [], errors };
      }

      for (const file of fileArray) {
        try {
          const fileErrors = await this.validateSingleFile(file);
          if (fileErrors.length > 0) {
            errors.push(...fileErrors);
          } else {
            validFiles.push(file);
          }
        } catch (error) {
          errors.push({
            code: 'UNKNOWN',
            message: `Failed to validate file: ${file.name}`,
            file: file.name,
          });
        }
      }

      return { valid: validFiles, errors };
    } catch (error) {
      console.error('Error validating files:', error);
      return {
        valid: [],
        errors: [{
          code: 'UNKNOWN',
          message: 'Failed to validate files',
        }],
      };
    }
  }

  private async validateSingleFile(file: File): Promise<FileUploadError[]> {
    const errors: FileUploadError[] = [];

    try {
      // Sanitize filename
      const sanitizedName = sanitizeFileUploadName(file.name);
      if (!sanitizedName) {
        errors.push({
          code: 'INVALID_NAME',
          message: `Invalid filename: ${file.name}`,
          file: file.name,
        });
        return errors;
      }

      // Check file size
      if (file.size > this.config.maxFileSize) {
        errors.push({
          code: 'FILE_TOO_LARGE',
          message: `File ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is ${Math.round(this.config.maxFileSize / 1024 / 1024)}MB.`,
          file: file.name,
        });
      }

      // Check for dangerous file types
      if (DANGEROUS_TYPES.includes(file.type.toLowerCase())) {
        errors.push({
          code: 'SECURITY_VIOLATION',
          message: `File type ${file.type} is not allowed for security reasons.`,
          file: file.name,
        });
      }

      // Check file extension against dangerous list
      const extension = getFileExtension(file.name);
      if (DANGEROUS_EXTENSIONS.includes(extension)) {
        errors.push({
          code: 'SECURITY_VIOLATION',
          message: `File extension ${extension} is not allowed for security reasons.`,
          file: file.name,
        });
      }

      // Check against allowed types
      if (!this.config.allowedTypes.includes(file.type)) {
        errors.push({
          code: 'INVALID_TYPE',
          message: `File type ${file.type} is not allowed.`,
          file: file.name,
        });
      }

      // Check against allowed extensions
      if (this.config.requireExtension && !this.config.allowedExtensions.includes(extension)) {
        errors.push({
          code: 'INVALID_TYPE',
          message: `File extension ${extension} is not allowed.`,
          file: file.name,
        });
      }

      // Additional security checks
      await this.performSecurityChecks(file, errors);

      return errors;
    } catch (error) {
      console.error('Error validating single file:', error);
      return [{
        code: 'UNKNOWN',
        message: `Failed to validate file: ${file.name}`,
        file: file.name,
      }];
    }
  }

  private async performSecurityChecks(file: File, errors: FileUploadError[]): Promise<void> {
    try {
      // Check for null bytes in filename (security risk)
      if (file.name.includes('\0')) {
        errors.push({
          code: 'SECURITY_VIOLATION',
          message: `Filename contains null bytes: ${file.name}`,
          file: file.name,
        });
      }

      // For image files, perform basic header validation
      if (isImageFile(file.type)) {
        const isValid = await this.validateImageFile(file);
        if (!isValid) {
          errors.push({
            code: 'SECURITY_VIOLATION',
            message: `Invalid image file: ${file.name}`,
            file: file.name,
          });
        }
      }

      // Check for suspiciously large files that claim to be small
      if (file.size === 0) {
        errors.push({
          code: 'INVALID_TYPE',
          message: `Empty file: ${file.name}`,
          file: file.name,
        });
      }
    } catch (error) {
      console.error('Error in security checks:', error);
      // Don't add errors for security check failures to prevent information leakage
    }
  }

  private async validateImageFile(file: File): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
            
            // Check for common image file signatures
            const signatures = {
              jpeg: [0xFF, 0xD8, 0xFF],
              png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
              gif: [0x47, 0x49, 0x46],
              webp: [0x52, 0x49, 0x46, 0x46], // RIFF header
            };

            for (const [format, signature] of Object.entries(signatures)) {
              if (signature.every((byte, index) => bytes[index] === byte)) {
                resolve(true);
                return;
              }
            }

            resolve(false);
          } catch (error) {
            console.error('Error validating image signature:', error);
            resolve(false);
          }
        };
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(file.slice(0, 12));
      });
    } catch (error) {
      console.error('Error in image validation:', error);
      return false;
    }
  }
}

// File upload component
export const SafeFileUpload: React.FC<SafeFileUploadProps> = ({
  onFilesSelected,
  onUploadComplete,
  onError,
  config,
  disabled = false,
  multiple = true,
  dragAndDrop = true,
  showPreview = true,
  className,
}) => {
  const [uploadingFiles, setUploadingFiles] = React.useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [errors, setErrors] = React.useState<FileUploadError[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const validatorRef = React.useRef<FileValidator>();

  const mergedConfig = React.useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  React.useEffect(() => {
    validatorRef.current = new FileValidator(mergedConfig);
  }, [mergedConfig]);

  const handleFileSelection = React.useCallback(async (files: FileList) => {
    if (!validatorRef.current) return;

    try {
      setErrors([]);
      const { valid, errors: validationErrors } = await validatorRef.current.validateFiles(files);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onError?.(validationErrors);
        return;
      }

      // Create uploading file entries
      const uploadingFiles: UploadingFile[] = await Promise.all(
        valid.map(async (file) => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: sanitizeFileUploadName(file.name),
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'pending' as const,
          preview: showPreview ? await generateFilePreview(file) : undefined,
        }))
      );

      setUploadingFiles(uploadingFiles);
      onFilesSelected?.(valid);
      
      // Start upload simulation (replace with actual upload logic)
      uploadingFiles.forEach((uploadingFile) => {
        simulateUpload(uploadingFile);
      });
    } catch (error) {
      console.error('Error handling file selection:', error);
      const errorObj: FileUploadError = {
        code: 'UNKNOWN',
        message: 'Failed to process selected files',
      };
      setErrors([errorObj]);
      onError?.(errors);
    }
  }, [onFilesSelected, onError, showPreview, errors]);

  const simulateUpload = React.useCallback((uploadingFile: UploadingFile) => {
    // This would be replaced with actual upload logic
    let progress = 0;
    
    setUploadingFiles(prev => 
      prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'uploading' } : f)
    );

    const interval = setInterval(() => {
      progress += Math.random() * 20;
      
      if (progress >= 100) {
        clearInterval(interval);
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { ...f, progress: 100, status: 'success' } : f)
        );
        
        // Simulate successful upload response
        onUploadComplete?.([{
          id: uploadingFile.id,
          url: `https://example.com/uploads/${uploadingFile.name}`,
          name: uploadingFile.name,
        }]);
      } else {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { ...f, progress: Math.min(progress, 100) } : f)
        );
      }
    }, 200);
  }, [onUploadComplete]);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
    // Reset input value to allow re-selecting same files
    e.target.value = '';
  }, [handleFileSelection]);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    if (!dragAndDrop || disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, [dragAndDrop, disabled]);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    if (!dragAndDrop || disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, [dragAndDrop, disabled]);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    if (!dragAndDrop || disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  }, [dragAndDrop, disabled, handleFileSelection]);

  const removeFile = React.useCallback((fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  const openFilePicker = React.useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragOver && "border-blue-400 bg-blue-50/10",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:border-gray-400",
          "border-gray-600 bg-gray-700/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-200 mb-2">
          {dragAndDrop ? "Drag and drop files here, or click to select" : "Click to select files"}
        </p>
        <p className="text-sm text-gray-400">
          Max {Math.round(mergedConfig.maxFileSize / 1024 / 1024)}MB per file, {mergedConfig.maxFiles} files maximum
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Allowed: {mergedConfig.allowedExtensions.join(', ')}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={mergedConfig.allowedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Error display */}
      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="font-medium text-red-200">Upload Errors</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearErrors}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-300">
                {error.file ? `${error.file}: ${error.message}` : error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploading files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-200">Uploading Files</h4>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="bg-gray-600/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <FileIcon className="w-10 h-10 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-200 truncate max-w-xs">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {Math.round(file.size / 1024)} KB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
                  {file.status === 'uploading' && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
                  {file.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                  {file.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Progress 
                value={file.progress} 
                className="h-2"
              />
              
              {file.error && (
                <p className="text-sm text-red-400 mt-1">{file.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};