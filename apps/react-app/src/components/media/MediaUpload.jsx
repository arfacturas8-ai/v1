/**
 * MediaUpload - Universal Media Upload Component
 * Supports images, videos, files with drag-and-drop
 * iOS-style modern design
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Video, File, Loader } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_IMAGES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEOS = ['video/mp4', 'video/webm', 'video/quicktime'];
const ACCEPTED_FILES = [
  ...ACCEPTED_IMAGES,
  ...ACCEPTED_VIDEOS,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export default function MediaUpload({
  onUpload,
  onCancel,
  acceptedTypes = 'all', // 'images', 'videos', 'all'
  maxFiles = 10,
  showPreview = true,
}) {
  const { isMobile, isTablet } = useResponsive();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const getAcceptedTypes = () => {
    switch (acceptedTypes) {
      case 'images':
        return ACCEPTED_IMAGES.join(',');
      case 'videos':
        return ACCEPTED_VIDEOS.join(',');
      default:
        return ACCEPTED_FILES.join(',');
    }
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is too large. Max size is 100MB.`;
    }

    const acceptedList =
      acceptedTypes === 'images'
        ? ACCEPTED_IMAGES
        : acceptedTypes === 'videos'
        ? ACCEPTED_VIDEOS
        : ACCEPTED_FILES;

    if (!acceptedList.includes(file.type)) {
      return `${file.name} is not a supported file type.`;
    }

    return null;
  };

  const handleFiles = useCallback(
    (newFiles) => {
      setError(null);
      const validFiles = [];
      const errors = [];

      for (let file of newFiles) {
        if (files.length + validFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed.`);
          break;
        }

        const validationError = validateFile(file);
        if (validationError) {
          errors.push(validationError);
        } else {
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            validFiles.push({
              file,
              preview: e.target.result,
              type: file.type.startsWith('image/')
                ? 'image'
                : file.type.startsWith('video/')
                ? 'video'
                : 'file',
            });

            if (validFiles.length === newFiles.length - errors.length) {
              setFiles((prev) => [...prev, ...validFiles]);
            }
          };
          reader.readAsDataURL(file);
        }
      }

      if (errors.length > 0) {
        setError(errors.join(' '));
      }
    },
    [files.length, maxFiles, acceptedTypes]
  );

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    },
    [handleFiles]
  );

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      await onUpload(files.map((f) => f.file));
      setFiles([]);
    } catch (err) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: isMobile ? '20px' : '16px',
        padding: isMobile ? '20px' : '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? '#58a6ff' : '#E8EAED'}`,
          borderRadius: '12px',
          padding: isMobile ? '32px 16px' : '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragActive ? 'rgba(88, 166, 255, 0.05)' : '#F8F9FA',
          transition: 'all 0.2s',
        }}
      >
        <Upload
          size={isMobile ? 40 : 48}
          color={dragActive ? '#58a6ff' : '#999999'}
          style={{ margin: '0 auto 16px' }}
        />
        <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
          {dragActive ? 'Drop files here' : 'Upload files'}
        </h3>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
          Drag and drop or click to browse
        </p>
        <p style={{ fontSize: '13px', color: '#999999' }}>
          {acceptedTypes === 'images'
            ? 'Images only (JPG, PNG, GIF, WebP)'
            : acceptedTypes === 'videos'
            ? 'Videos only (MP4, WebM, MOV)'
            : 'Images, videos, and documents'}
          {' • '}Max {maxFiles} files • Max 100MB each
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptedTypes()}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* File Previews */}
      {showPreview && files.length > 0 && (
        <div style={{ marginTop: isMobile ? '20px' : '24px' }}>
          <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>
            Selected Files ({files.length})
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(100px, 1fr))' : 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: isMobile ? '10px' : '12px',
            }}
          >
            {files.map((fileData, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#F8F9FA',
                  aspectRatio: '1',
                }}
              >
                {/* Preview */}
                {fileData.type === 'image' && (
                  <img
                    src={fileData.preview}
                    alt={fileData.file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                {fileData.type === 'video' && (
                  <video
                    src={fileData.preview}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                {fileData.type === 'file' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px',
                    }}
                  >
                    <File size={32} color="#666666" />
                    <p
                      style={{
                        fontSize: '11px',
                        color: '#666666',
                        marginTop: '8px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                      }}
                    >
                      {fileData.file.name}
                    </p>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
                >
                  <X size={14} color="#FFFFFF" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: isMobile ? '20px' : '24px', flexDirection: isMobile ? 'column' : 'row' }}>
        <button
          onClick={onCancel}
          disabled={uploading}
          style={{
            flex: 1,
            padding: isMobile ? '14px 20px' : '12px 24px',
            background: '#F8F9FA',
            color: '#1A1A1A',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          style={{
            flex: 1,
            padding: isMobile ? '14px 20px' : '12px 24px',
            background:
              files.length === 0 || uploading
                ? '#CCCCCC'
                : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: files.length === 0 || uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {uploading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
