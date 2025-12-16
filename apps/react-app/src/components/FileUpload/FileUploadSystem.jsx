import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, Image, FileText, Video, Music, Archive, X,
  Check, AlertCircle, Loader, Download, Eye, Trash2,
  Paperclip, Camera, Mic, Film, File
} from 'lucide-react'
import { getErrorMessage } from '../../utils/errorUtils'

// File type configurations
const FILE_TYPES = {
  IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: Image,
    color: 'blue',
    preview: true
  },
  VIDEO: {
    extensions: ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: Video,
    color: 'purple',
    preview: true
  },
  AUDIO: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
    maxSize: 25 * 1024 * 1024, // 25MB
    icon: Music,
    color: 'green',
    preview: false
  },
  DOCUMENT: {
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md'],
    maxSize: 25 * 1024 * 1024, // 25MB
    icon: FileText,
    color: 'orange',
    preview: false
  },
  ARCHIVE: {
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    maxSize: 50 * 1024 * 1024, // 50MB
    icon: Archive,
    color: 'gray',
    preview: false
  }
}

// Bento Card Component
function BentoCard({ className = '', color = 'dark', size = 'medium', interactive = false, children, onClick }) {
  return (
    <div 
      className={`bento-card bento-${color} bento-${size} ${interactive ? 'bento-interactive' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// File Type Detection
function getFileType(file) {
  const extension = '.' + file.name.split('.').pop().toLowerCase()
  
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.includes(extension)) {
      return { type, config }
    }
  }
  
  return { type: 'UNKNOWN', config: { icon: File, color: 'gray', maxSize: 10 * 1024 * 1024, preview: false } }
}

// Format File Size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// File Preview Component
function FilePreview({ file, onRemove }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const { type, config } = getFileType(file)
  const IconComponent = config.icon

  useEffect(() => {
    if (config.preview && (type === 'IMAGE' || type === 'VIDEO')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
        setLoading(false)
      }
      reader.readAsDataURL(file)
    } else {
      setLoading(false)
    }
  }, [file, config.preview, type])

  return (
    <BentoCard color="dark" className="file-preview-card">
      <div className="file-preview-header">
        <div className="file-info">
          <IconComponent size={24} className={`file-icon file-icon-${config.color}`} />
          <div className="file-details">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{formatFileSize(file.size)}</span>
          </div>
        </div>
        
        <button onClick={() => onRemove(file)} className="remove-file-btn">
          <X size={24} />
        </button>
      </div>

      {config.preview && (
        <div className="file-preview-content">
          {loading ? (
            <div className="file-preview-loading">
              <Loader size={24} className="spinner" />
            </div>
          ) : preview ? (
            type === 'IMAGE' ? (
              <img src={preview} alt={file.name} className="file-preview-image" />
            ) : type === 'VIDEO' ? (
              <video src={preview} controls className="file-preview-video" />
            ) : null
          ) : null}
        </div>
      )}

      <div className="file-preview-actions">
        <button className="file-action-btn">
          <Eye size={24} />
          <span>Preview</span>
        </button>
        <button className="file-action-btn">
          <Download size={24} />
          <span>Download</span>
        </button>
      </div>
    </BentoCard>
  )
}

// Upload Progress Component
function UploadProgress({ files, onCancel, onComplete }) {
  const [progress, setProgress] = useState({})
  const [status, setStatus] = useState({})

  useEffect(() => {
    // Simulate upload progress
    files.forEach(file => {
      if (status[file.name] === 'completed' || status[file.name] === 'error') return

      setStatus(prev => ({ ...prev, [file.name]: 'uploading' }))
      setProgress(prev => ({ ...prev, [file.name]: 0 }))

      const interval = setInterval(() => {
        setProgress(prev => {
          const currentProgress = prev[file.name] || 0
          if (currentProgress >= 100) {
            clearInterval(interval)
            setStatus(prevStatus => ({ ...prevStatus, [file.name]: 'completed' }))
            return prev
          }
          return { ...prev, [file.name]: Math.min(100, currentProgress + Math.random() * 30) }
        })
      }, 200)
    })
  }, [files, status])

  const allCompleted = files.every(file => status[file.name] === 'completed')

  useEffect(() => {
    if (allCompleted && files.length > 0) {
      setTimeout(() => onComplete(), 1000)
    }
  }, [allCompleted, files.length, onComplete])

  return (
    <BentoCard color="dark" className="upload-progress-container">
      <div className="upload-progress-header">
        <h3>Uploading {files.length} file{files.length > 1 ? 's' : ''}</h3>
        <button onClick={onCancel} className="cancel-upload-btn">
          <X size={24} />
        </button>
      </div>

      <div className="upload-progress-list">
        {files.map(file => {
          const fileProgress = progress[file.name] || 0
          const fileStatus = status[file.name] || 'pending'
          const { config } = getFileType(file)
          const IconComponent = config.icon

          return (
            <div key={file.name} className="upload-progress-item">
              <div className="upload-file-info">
                <IconComponent size={24} className={`file-icon file-icon-${config.color}`} />
                <span className="upload-file-name">{file.name}</span>
                <span className="upload-file-size">{formatFileSize(file.size)}</span>
              </div>

              <div className="upload-progress-bar">
                <div 
                  className={`upload-progress-fill ${fileStatus}`}
                  style={{ width: `${fileProgress}%` }}
                />
              </div>

              <div className="upload-status">
                {fileStatus === 'uploading' && (
                  <>
                    <Loader size={24} className="spinner" />
                    <span>{Math.round(fileProgress)}%</span>
                  </>
                )}
                {fileStatus === 'completed' && (
                  <>
                    <Check size={24} className="success-icon" />
                    <span>Done</span>
                  </>
                )}
                {fileStatus === 'error' && (
                  <>
                    <AlertCircle size={24} className="error-icon" />
                    <span>Failed</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </BentoCard>
  )
}

// Main File Upload Component
function FileUpload({ onFilesUploaded, maxFiles = 10, className = '', compact = false }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState([])
  const fileInputRef = useRef(null)

  const validateFile = useCallback((file) => {
    const { type, config } = getFileType(file)
    const errors = []

    if (file.size > config.maxSize) {
      errors.push(`File "${file.name}" is too large. Maximum size is ${formatFileSize(config.maxSize)}`)
    }

    if (type === 'UNKNOWN') {
      errors.push(`File type not supported: ${file.name}`)
    }

    return errors
  }, [])

  const handleFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList)
    const allErrors = []
    const validFiles = []

    // Check file count
    if (files.length + newFiles.length > maxFiles) {
      allErrors.push(`Cannot upload more than ${maxFiles} files at once`)
      return
    }

    newFiles.forEach(file => {
      const fileErrors = validateFile(file)
      if (fileErrors.length > 0) {
        allErrors.push(...fileErrors)
      } else {
        validFiles.push(file)
      }
    })

    if (allErrors.length > 0) {
      setErrors(allErrors)
      setTimeout(() => setErrors([]), 5000)
      return
    }

    setFiles(prev => [...prev, ...validFiles])
  }, [files.length, maxFiles, validateFile])

  const handleFileInput = useCallback((e) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }, [handleFiles])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const removeFile = useCallback((fileToRemove) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove))
  }, [])

  const startUpload = useCallback(() => {
    if (files.length === 0) return
    setUploading(true)
  }, [files])

  const cancelUpload = useCallback(() => {
    setUploading(false)
    setFiles([])
  }, [])

  const completeUpload = useCallback(() => {
    onFilesUploaded(files)
    setUploading(false)
    setFiles([])
  }, [files, onFilesUploaded])

  if (uploading) {
    return <UploadProgress files={files} onCancel={cancelUpload} onComplete={completeUpload} />
  }

  if (compact) {
    return (
      <div className={`file-upload-compact ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="upload-btn-compact"
          title="Upload Files"
        >
          <Paperclip size={24} />
        </button>
        
        {files.length > 0 && (
          <div className="compact-file-count">
            <span>{files.length}</span>
            <button onClick={() => setFiles([])} className="clear-files-btn">
              <X size={24} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`file-upload-container ${className}`}>
      {/* Error Messages */}
      {errors.length > 0 && (
        <BentoCard color="red" className="upload-errors">
          <div className="error-header">
            <AlertCircle size={24} />
            <span>Upload Errors</span>
          </div>
          <ul className="error-list">
            {errors.map((error, index) => (
              <li key={index}>{getErrorMessage(error, 'Upload error')}</li>
            ))}
          </ul>
        </BentoCard>
      )}

      {/* Drop Zone */}
      <div 
        className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <div className="drop-zone-content">
          <Upload size={48} className="upload-icon" />
          <h3>Drop files here or click to upload</h3>
          <p>Support for images, videos, documents and more</p>
          
          <div className="quick-upload-buttons">
            <button className="quick-upload-btn" title="Upload Images">
              <Camera size={24} />
              <span>Photos</span>
            </button>
            <button className="quick-upload-btn" title="Upload Videos">
              <Film size={24} />
              <span>Videos</span>
            </button>
            <button className="quick-upload-btn" title="Upload Audio">
              <Mic size={24} />
              <span>Audio</span>
            </button>
            <button className="quick-upload-btn" title="Upload Files">
              <File size={24} />
              <span>Files</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="file-previews-container">
          <div className="file-previews-header">
            <h4>{files.length} file{files.length > 1 ? 's' : ''} selected</h4>
            <div className="file-actions">
              <button onClick={() => setFiles([])} className="clear-all-btn">
                <Trash2 size={24} />
                <span>Clear All</span>
              </button>
              <button onClick={startUpload} className="upload-all-btn">
                <Upload size={24} />
                <span>Upload All</span>
              </button>
            </div>
          </div>

          <div className="file-previews-grid">
            {files.map((file, index) => (
              <FilePreview key={`${file.name}-${index}`} file={file} onRemove={removeFile} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// File Attachment Display (for messages/posts)
function FileAttachment({ attachment, compact = false }) {
  const { type, config } = getFileType({ name: attachment.name })
  const IconComponent = config.icon

  if (compact) {
    return (
      <BentoCard color="dark" size="tiny" className="file-attachment-compact">
        <IconComponent size={24} className={`file-icon file-icon-${config.color}`} />
        <span className="attachment-name">{attachment.name}</span>
        <button className="download-attachment-btn">
          <Download size={24} />
        </button>
      </BentoCard>
    )
  }

  return (
    <BentoCard color="dark" className="file-attachment">
      <div className="attachment-header">
        <div className="attachment-info">
          <IconComponent size={24} className={`file-icon file-icon-${config.color}`} />
          <div className="attachment-details">
            <span className="attachment-name">{attachment.name}</span>
            <span className="attachment-size">{formatFileSize(attachment.size || 0)}</span>
          </div>
        </div>
        
        <div className="attachment-actions">
          <button className="attachment-action-btn">
            <Eye size={24} />
          </button>
          <button className="attachment-action-btn">
            <Download size={24} />
          </button>
        </div>
      </div>

      {config.preview && attachment.url && (
        <div className="attachment-preview">
          {type === 'IMAGE' ? (
            <img src={attachment.url} alt={attachment.name} className="attachment-image" />
          ) : type === 'VIDEO' ? (
            <video src={attachment.url} controls className="attachment-video" />
          ) : null}
        </div>
      )}
    </BentoCard>
  )
}




export default FILE_TYPES
