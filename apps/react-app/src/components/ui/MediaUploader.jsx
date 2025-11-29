import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Image, Video, FileText, Music, Archive, AlertCircle, CheckCircle, Loader, Eye, Trash2, RotateCcw, ZoomIn } from 'lucide-react'

const MediaUploader = ({
  onUpload = () => {},
  onRemove = () => {},
  maxFiles = 10,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
  allowedExtensions = [],
  enableDragDrop = true,
  enablePreview = true,
  enableImageEditing = true,
  autoUpload = false,
  showProgress = true,
  className = '',
  uploadEndpoint = '/api/uploads',
  existingFiles = [],
  disabled = false
}) => {
  const [files, setFiles] = useState(existingFiles)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [errors, setErrors] = useState({})
  const [previews, setPreviews] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [imageEditor, setImageEditor] = useState({ open: false, file: null, transforms: {} })
  
  const fileInputRef = useRef(null)
  const dropzoneRef = useRef(null)

  // File type icons
  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <Image size={20} />
    if (mimeType?.startsWith('video/')) return <Video size={20} />
    if (mimeType?.startsWith('audio/')) return <Music size={20} />
    if (mimeType?.includes('pdf')) return <FileText size={20} />
    if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('7z')) return <Archive size={20} />
    return <FileText size={20} />
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Validate file
  const validateFile = (file) => {
    const errors = []

    // Size check
    if (file.size > maxFileSize) {
      errors.push(`File size exceeds ${formatFileSize(maxFileSize)}`)
    }

    // Type check
    if (acceptedTypes.length > 0) {
      const isTypeAllowed = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -2))
        }
        return file.type === type
      })
      if (!isTypeAllowed) {
        errors.push('File type not supported')
      }
    }

    // Extension check
    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!allowedExtensions.includes(extension)) {
        errors.push(`Extension .${extension} not allowed`)
      }
    }

    return errors
  }

  // Generate file preview
  const generatePreview = useCallback((file) => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          video.currentTime = Math.min(video.duration / 2, 10) // Middle or 10s, whichever is smaller
        }
        video.onseeked = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(video, 0, 0)
          resolve(canvas.toDataURL())
        }
        video.src = URL.createObjectURL(file)
      } else {
        resolve(null)
      }
    })
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFiles) => {
    if (disabled) return

    const fileArray = Array.from(selectedFiles)
    const newFiles = []
    const newErrors = {}
    const newPreviews = {}

    for (let i = 0; i < fileArray.length && files.length + newFiles.length < maxFiles; i++) {
      const file = fileArray[i]
      const fileId = `${file.name}-${file.size}-${Date.now()}-${i}`
      
      const validationErrors = validateFile(file)
      
      if (validationErrors.length > 0) {
        newErrors[fileId] = validationErrors
      } else {
        const fileObj = {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          progress: 0,
          url: null
        }
        
        newFiles.push(fileObj)
        
        // Generate preview
        if (enablePreview) {
          try {
            const preview = await generatePreview(file)
            if (preview) {
              newPreviews[fileId] = preview
            }
          } catch (error) {
          }
        }
      }
    }

    setFiles(prev => [...prev, ...newFiles])
    setErrors(prev => ({ ...prev, ...newErrors }))
    setPreviews(prev => ({ ...prev, ...newPreviews }))

    // Auto upload if enabled
    if (autoUpload && newFiles.length > 0) {
      uploadFiles(newFiles)
    }

    // Notify parent
    onUpload(newFiles)
  }, [files, maxFiles, autoUpload, enablePreview, generatePreview, onUpload, disabled, validateFile])

  // Upload files
  const uploadFiles = async (filesToUpload = files.filter(f => f.status === 'pending')) => {
    for (const fileObj of filesToUpload) {
      await uploadSingleFile(fileObj)
    }
  }

  // Upload single file
  const uploadSingleFile = async (fileObj) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f
      ))

      const formData = new FormData()
      formData.append('file', fileObj.file)
      formData.append('originalName', fileObj.name)
      formData.append('mimeType', fileObj.type)

      const xhr = new XMLHttpRequest()
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(prev => ({ ...prev, [fileObj.id]: progress }))
            setFiles(prev => prev.map(f => 
              f.id === fileObj.id ? { ...f, progress } : f
            ))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText)
              setFiles(prev => prev.map(f => 
                f.id === fileObj.id 
                  ? { ...f, status: 'completed', progress: 100, url: response.data?.url }
                  : f
              ))
              resolve(response)
            } catch (error) {
              reject(new Error('Invalid response format'))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'))
        })

        xhr.open('POST', uploadEndpoint)
        // Add auth headers if available
        const token = localStorage.getItem('token')
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f
      ))
      setErrors(prev => ({ ...prev, [fileObj.id]: [error.message] }))
    }
  }

  // Remove file
  const removeFile = (fileId) => {
    const fileObj = files.find(f => f.id === fileId)
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fileId]
      return newErrors
    })
    setPreviews(prev => {
      const newPreviews = { ...prev }
      delete newPreviews[fileId]
      return newPreviews
    })
    onRemove(fileObj)
  }

  // Retry upload
  const retryUpload = (fileId) => {
    const fileObj = files.find(f => f.id === fileId)
    if (fileObj) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'pending', error: null } : f
      ))
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fileId]
        return newErrors
      })
      uploadSingleFile(fileObj)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dropzoneRef.current?.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (!disabled) {
      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        handleFileSelect(droppedFiles)
      }
    }
  }

  // File input change
  const handleInputChange = (e) => {
    if (e.target.files?.length > 0) {
      handleFileSelect(e.target.files)
    }
    // Reset input
    e.target.value = ''
  }

  // Image editor functions (basic)
  const openImageEditor = (fileObj) => {
    if (fileObj.type.startsWith('image/')) {
      setImageEditor({
        open: true,
        file: fileObj,
        transforms: { rotation: 0, scale: 1, flipX: false, flipY: false }
      })
    }
  }

  const applyImageTransform = (transform) => {
    setImageEditor(prev => ({
      ...prev,
      transforms: { ...prev.transforms, ...transform }
    }))
  }

  const saveImageEdits = () => {
    // In a real implementation, this would apply the transforms to the image
    setImageEditor({ open: false, file: null, transforms: {} })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'u') {
          e.preventDefault()
          fileInputRef.current?.click()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`media-uploader ${className}`} role="region" aria-label="Media file uploader">
      {/* Dropzone */}
      <div
        ref={dropzoneRef}
        style={{
  position: 'relative',
  borderRadius: '12px',
  padding: '16px',
  textAlign: 'center'
}}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragEnter={enableDragDrop ? handleDragEnter : undefined}
        onDragLeave={enableDragDrop ? handleDragLeave : undefined}
        onDragOver={enableDragDrop ? handleDragOver : undefined}
        onDrop={enableDragDrop ? handleDrop : undefined}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={isDragging ? 'Drop files here to upload' : 'Click to select files for upload'}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        <Upload className="mx-auto mb-3 sm:mb-4 text-secondary" size={window.innerWidth < 640 ? 32 : 48} />
        <h3 style={{
  fontWeight: '600'
}}>
          {isDragging ? 'Drop files here' : 'Upload Files'}
        </h3>
        <p className="text-sm sm:text-base text-secondary mb-3 sm:mb-4">
          {enableDragDrop ? 'Drag & drop files here or click to browse' : 'Click to browse files'}
        </p>
        <p className="text-xs sm:text-sm text-secondary/80">
          Max {maxFiles} files • Up to {formatFileSize(maxFileSize)} each
        </p>
        {acceptedTypes.length > 0 && (
          <p className="text-xs text-secondary/60 mt-2 break-words">
            Supported: {acceptedTypes.join(', ')}
          </p>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="sr-only"
          disabled={disabled}
          aria-label={`Select ${maxFiles > 1 ? 'files' : 'file'} to upload. Maximum ${maxFiles} files, up to ${formatFileSize(maxFileSize)} each.`}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h4 style={{
  fontWeight: '600'
}}>
              Uploaded Files ({files.length}/{maxFiles})
            </h4>
            {files.some(f => f.status === 'pending') && !autoUpload && (
              <button
                onClick={() => uploadFiles()}
                style={{
  color: '#ffffff',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px'
}}
              >
                Upload All
              </button>
            )}
          </div>
          
          <ul className="space-y-3" role="list" aria-labelledby="files-heading">
            {files.map((fileObj) => (
              <li
                key={fileObj.id}
                style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '12px'
}}
                role="listitem"
              >
                <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {previews[fileObj.id] ? (
                      <button 
                        style={{
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  overflow: 'hidden'
}}
                        onClick={() => setSelectedFile(fileObj)}
                        aria-label={`Preview ${fileObj.name}`}
                        title={`Click to preview ${fileObj.name}`}
                      >
                        <img 
                          src={previews[fileObj.id]} 
                          alt={`Preview of ${fileObj.name}`}
                          style={{
  width: '100%',
  height: '100%'
}}
                        />
                      </button>
                    ) : (
                      <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}} aria-hidden="true">
                        {getFileIcon(fileObj.type)}
                      </div>
                    )}
                  </div>
                
                  {/* File Info */}
                  <div style={{
  flex: '1'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                      <h5 style={{
  fontWeight: '500'
}} title={fileObj.name}>{fileObj.name}</h5>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}} aria-label={`File status: ${fileObj.status}`}>
                        {fileObj.status === 'completed' && (
                          <CheckCircle size={14} className="text-success sm:w-4 sm:h-4" aria-label="Upload completed" />
                        )}
                        {fileObj.status === 'error' && (
                          <AlertCircle size={14} className="text-error sm:w-4 sm:h-4" aria-label="Upload failed" />
                        )}
                        {fileObj.status === 'uploading' && (
                          <Loader size={14} className="text-accent animate-spin sm:w-4 sm:h-4" aria-label="Uploading" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-secondary mb-2">
                      {formatFileSize(fileObj.size)} • <span className="capitalize">{fileObj.status}</span>
                    </p>
                  
                    {/* Progress Bar */}
                    {showProgress && fileObj.status === 'uploading' && (
                      <div className="mb-2">
                        <div style={{
  width: '100%',
  borderRadius: '50%'
}} role="progressbar" aria-valuenow={fileObj.progress} aria-valuemin="0" aria-valuemax="100" aria-label={`Upload progress: ${fileObj.progress}%`}>
                          <div 
                            style={{
  borderRadius: '50%'
}}
                            style={{ width: `${fileObj.progress}%` }}
                          />
                        </div>
                        <span className="sr-only">Upload progress: {fileObj.progress}%</span>
                        <p className="text-xs text-secondary mt-1" aria-live="polite">{fileObj.progress}% uploaded</p>
                      </div>
                    )}
                  
                    {/* Errors */}
                    {errors[fileObj.id] && (
                      <div className="text-xs sm:text-sm text-error mb-2" role="alert" aria-live="polite">
                        {errors[fileObj.id].map((error, index) => (
                          <div key={index} style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '4px'
}}>
                            <AlertCircle size={12} className="flex-shrink-0 mt-0.5 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                            <span>{error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                    {fileObj.status === 'completed' && fileObj.url && (
                      <button
                        onClick={() => window.open(fileObj.url, '_blank')}
                        style={{
  borderRadius: '12px'
}}
                        title="View file"
                        aria-label={`View ${fileObj.name} in new tab`}
                      >
                        <Eye size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    )}
                    
                    {enableImageEditing && fileObj.type.startsWith('image/') && (
                      <button
                        onClick={() => openImageEditor(fileObj)}
                        style={{
  borderRadius: '12px'
}}
                        title="Edit image"
                        aria-label={`Edit ${fileObj.name}`}
                      >
                        <ZoomIn size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    )}
                    
                    {fileObj.status === 'error' && (
                      <button
                        onClick={() => retryUpload(fileObj.id)}
                        style={{
  borderRadius: '12px'
}}
                        title="Retry upload"
                        aria-label={`Retry upload for ${fileObj.name}`}
                      >
                        <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      style={{
  borderRadius: '12px'
}}
                      title="Remove file"
                      aria-label={`Remove ${fileObj.name}`}
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
          <div style={{
  borderRadius: '12px',
  overflow: 'hidden'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px'
}}>
              <h3 style={{
  fontWeight: '600'
}}>{selectedFile.name}</h3>
              <button
                onClick={() => setSelectedFile(null)}
                style={{
  padding: '8px',
  borderRadius: '12px'
}}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{
  padding: '16px',
  overflow: 'auto'
}}>
              {selectedFile.type.startsWith('image/') && previews[selectedFile.id] && (
                <img 
                  src={previews[selectedFile.id]} 
                  alt={selectedFile.name}
                  className="max-w-full max-h-full object-contain mx-auto"
                />
              )}
              {selectedFile.type.startsWith('video/') && (
                <video 
                  controls 
                  className="max-w-full max-h-full mx-auto"
                  src={URL.createObjectURL(selectedFile.file)}
                />
              )}
              {selectedFile.type.startsWith('audio/') && (
                <audio 
                  controls 
                  style={{
  width: '100%'
}}
                  src={URL.createObjectURL(selectedFile.file)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {imageEditor.open && (
        <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}} role="dialog" aria-modal="true" aria-labelledby="image-editor-title">
          <div style={{
  borderRadius: '12px',
  width: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px'
}}>
              <h3 id="image-editor-title" style={{
  fontWeight: '600'
}}>Edit Image</h3>
              <button
                onClick={() => setImageEditor({ open: false, file: null, transforms: {} })}
                style={{
  borderRadius: '12px'
}}
                aria-label="Close image editor"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div style={{
  padding: '12px',
  flex: '1'
}}>
              {/* Image Editor Tools */}
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
}} role="toolbar" aria-label="Image editing tools">
                <button
                  onClick={() => applyImageTransform({ rotation: imageEditor.transforms.rotation + 90 })}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px'
}}
                  aria-label="Rotate image 90 degrees clockwise"
                >
                  Rotate 90°
                </button>
                <button
                  onClick={() => applyImageTransform({ flipX: !imageEditor.transforms.flipX })}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px'
}}
                  aria-label="Flip image horizontally"
                >
                  Flip H
                </button>
                <button
                  onClick={() => applyImageTransform({ flipY: !imageEditor.transforms.flipY })}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px'
}}
                  aria-label="Flip image vertically"
                >
                  Flip V
                </button>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <label htmlFor="scale-slider" className="text-xs sm:text-sm whitespace-nowrap">Scale:</label>
                  <input
                    id="scale-slider"
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={imageEditor.transforms.scale}
                    onChange={(e) => applyImageTransform({ scale: parseFloat(e.target.value) })}
                    style={{
  width: '64px'
}}
                    aria-label={`Scale image. Current scale: ${imageEditor.transforms.scale}x`}
                  />
                  <span style={{
  width: '24px'
}} aria-live="polite">{imageEditor.transforms.scale}x</span>
                </div>
              </div>
              
              {/* Image Preview */}
              <div style={{
  borderRadius: '12px',
  padding: '12px',
  textAlign: 'center',
  overflow: 'auto'
}} role="img" aria-label="Image preview with applied transformations">
                {previews[imageEditor.file?.id] && (
                  <img 
                    src={previews[imageEditor.file.id]} 
                    alt={`${imageEditor.file.name} with transformations applied`}
                    className="max-w-full max-h-full object-contain mx-auto"
                    style={{
                      transform: `rotate(${imageEditor.transforms.rotation}deg) 
                                scaleX(${imageEditor.transforms.flipX ? -1 : 1}) 
                                scaleY(${imageEditor.transforms.flipY ? -1 : 1}) 
                                scale(${imageEditor.transforms.scale})`
                    }}
                  />
                )}
              </div>
              
              {/* Editor Actions */}
              <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}}>
                <button
                  onClick={saveImageEdits}
                  style={{
  flex: '1',
  color: '#ffffff',
  paddingTop: '8px',
  paddingBottom: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  borderRadius: '12px'
}}
                  aria-label="Apply image transformations"
                >
                  Apply Changes
                </button>
                <button
                  onClick={() => setImageEditor({ open: false, file: null, transforms: {} })}
                  style={{
  flex: '1',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  paddingTop: '8px',
  paddingBottom: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  borderRadius: '12px'
}}
                  aria-label="Cancel image editing"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Styles */}
      <style jsx>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  )
}




export default MediaUploader
