import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, File, Image, Video, FileText, Download, Eye, Camera, Mic, CheckCircle, AlertCircle } from 'lucide-react'
import fileUploadService from '../services/fileUploadService'

function FileUpload({ 
  onFilesSelected, 
  maxFiles = 5, 
  maxFileSize = 10 * 1024 * 1024,
  isMobile = false,
  showCamera = true,
  showMicrophone = true,
  channelId = null,
  serverId = null,
  autoUpload = false,
  enhanced = false 
}) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploadErrors, setUploadErrors] = useState({})
  
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isMobile) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true)
      } else if (e.type === 'dragleave') {
        setDragActive(false)
      }
    }
  }, [isMobile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (!isMobile && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [isMobile])

  const handleFiles = async (files) => {
    // Validate files using the service
    const validFiles = []
    const errors = {}
    
    for (const file of files) {
      const validationErrors = fileUploadService.validateFile(file, fileUploadService.getFileCategory(file))
      
      if (validationErrors.length > 0) {
        errors[file.name] = validationErrors.join(', ')
      } else {
        validFiles.push(file)
      }
    }
    
    setUploadErrors(errors)
    
    // Limit to maxFiles
    const filesToProcess = validFiles.slice(0, maxFiles)

    const fileObjects = await Promise.all(filesToProcess.map(async (file) => {
      const fileObj = {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: null,
        uploading: false,
        progress: 0,
        uploaded: false,
        uploadedUrl: null,
        error: null
      }
      
      // Generate preview using the service
      try {
        const preview = await fileUploadService.createFilePreview(file)
        fileObj.preview = preview.url
      } catch (error) {
        // Preview generation failed - use fallback based on file type
        console.warn('Failed to generate preview:', error.message)
        fileObj.preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }
      
      return fileObj
    }))

    setUploadedFiles(prev => [...prev, ...fileObjects])
    
    // Auto-upload if enabled
    if (autoUpload) {
      fileObjects.forEach(fileObj => uploadFile(fileObj))
    }
    
    onFilesSelected && onFilesSelected(fileObjects)
  }

  // Upload a single file to the backend
  const uploadFile = async (fileObj) => {
    try {
      // Mark as uploading
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? { ...f, uploading: true, progress: 0 } : f)
      )

      const uploadOptions = {
        channelId,
        serverId,
        enhanced,
        description: `File uploaded: ${fileObj.name}`
      }

      // Use upload with progress if enhanced mode is enabled
      const result = enhanced 
        ? await fileUploadService.uploadFileWithProgress(
            fileObj.file, 
            uploadOptions,
            (progress) => {
              setUploadedFiles(prev => 
                prev.map(f => f.id === fileObj.id ? { ...f, progress } : f)
              )
            }
          )
        : await fileUploadService.uploadFile(fileObj.file, uploadOptions)

      if (result.success) {
        // Mark as uploaded
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileObj.id ? { 
            ...f, 
            uploading: false, 
            uploaded: true, 
            progress: 100,
            uploadedUrl: result.url,
            error: null
          } : f)
        )
        
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      
      // Mark as failed
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? { 
          ...f, 
          uploading: false, 
          uploaded: false, 
          progress: 0,
          error: error.message
        } : f)
      )
    }
  }

  // Upload all files
  const uploadAllFiles = () => {
    uploadedFiles.forEach(fileObj => {
      if (!fileObj.uploading && !fileObj.uploaded && !fileObj.error) {
        uploadFile(fileObj)
      }
    })
  }

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
    e.target.value = '' // Reset input
  }

  const handleCameraCapture = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
    e.target.value = ''
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, {
          type: 'audio/wav'
        })
        
        handleFiles([audioFile])
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        setRecordingTime(0)
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50])
      }
    }
  }, [isRecording])

  const formatRecordingTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image size={20} />
    if (fileType.startsWith('video/')) return <Video size={20} />
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText size={20} />
    return <File size={20} />
  }

  const getFileColor = (fileType) => {
    if (fileType.startsWith('image/')) return 'text-green-400'
    if (fileType.startsWith('video/')) return 'text-purple-400'
    if (fileType.startsWith('audio/')) return 'text-orange-400'
    if (fileType.includes('pdf')) return 'text-red-400'
    if (fileType.includes('document')) return 'text-blue-400'
    return 'text-gray-400'
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      
      {/* Mobile-first interface */}
      {isMobile ? (
        <div className="space-y-6">
          {/* Quick action buttons */}
          <div style={{
  display: 'grid',
  gap: '16px'
}}>
            {/* Camera button */}
            {showCamera && (
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  borderRadius: '24px'
}}
                style={{ 
                  background: 'linear-gradient(135deg, var(--bg-tertiary), var(--hover-bg))',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
  padding: '12px',
  borderRadius: '50%'
}}>
                  <Camera size={24} className="text-accent-primary" />
                </div>
                <span style={{
  fontWeight: '500'
}}>Camera</span>
              </button>
            )}
            
            {/* Files button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  borderRadius: '24px'
}}
              style={{ 
                background: 'linear-gradient(135deg, var(--bg-tertiary), var(--hover-bg))',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
  padding: '12px',
  borderRadius: '50%'
}}>
                <File size={24} className="text-accent-primary" />
              </div>
              <span style={{
  fontWeight: '500'
}}>Files</span>
            </button>
            
            {/* Microphone button */}
            {showMicrophone && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  borderRadius: '24px'
}}
                style={isRecording ? {
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: '1px solid #ef4444',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
                } : { 
                  background: 'linear-gradient(135deg, var(--bg-tertiary), var(--hover-bg))',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
  padding: '12px',
  borderRadius: '50%'
}}>
                  <Mic size={24} className={isRecording ? 'text-white' : 'text-accent-primary'} />
                </div>
                <span style={{
  fontWeight: '500'
}}>
                  {isRecording ? formatRecordingTime(recordingTime) : 'Record'}
                </span>
              </button>
            )}
          </div>
          
          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileInput}
            style={{
  display: 'none'
}}
          />
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleCameraCapture}
            style={{
  display: 'none'
}}
          />
          
          <div style={{
  textAlign: 'center'
}} style={{ color: 'var(--text-muted)' }}>
            Maximum {maxFiles} files, {formatFileSize(maxFileSize)} each
          </div>
        </div>
      ) : (
        /* Desktop drag and drop interface */
        <div
          style={{
  position: 'relative',
  borderRadius: '24px',
  padding: '32px',
  textAlign: 'center'
}}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{ 
            boxShadow: dragActive 
              ? '0 10px 40px rgba(59, 130, 246, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileInput}
            style={{
  position: 'absolute',
  width: '100%',
  height: '100%'
}}
          />
          
          <div className="space-y-6">
            <div style={{
  display: 'flex',
  justifyContent: 'center'
}}>
              <div style={{
  padding: '16px',
  borderRadius: '24px',
  color: '#ffffff'
}}>
                <Upload style={{
  width: '32px',
  height: '32px'
}} />
              </div>
            </div>
            <div className="space-y-2">
              <p style={{
  fontWeight: '600'
}} style={{ color: 'var(--text-primary)' }}>
                {dragActive ? 'Drop files here' : 'Drag and drop files here'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                or{' '}
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
  fontWeight: '500'
}}
                  style={{ color: 'var(--accent-primary)' }}
                >
                  browse files
                </button>
              </p>
            </div>
            <div style={{
  display: 'inline-flex',
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '50%'
}} style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-muted)'
            }}>
              <svg style={{
  width: '16px',
  height: '16px'
}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span style={{
  fontWeight: '500'
}}>
                Maximum {maxFiles} files, {formatFileSize(maxFileSize)} each
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Errors */}
      {Object.keys(uploadErrors).length > 0 && (
        <div style={{
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h5 style={{
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center'
}}>
            <AlertCircle size={16} className="mr-2" />
            Upload Errors
          </h5>
          {Object.entries(uploadErrors).map(([filename, error]) => (
            <p key={filename} className="text-sm text-red-700">
              <strong>{filename}:</strong> {error}
            </p>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h4 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}} style={{ color: 'var(--text-primary)' }}>
              <svg style={{
  width: '20px',
  height: '20px'
}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
              <span>Attached Files ({uploadedFiles.length})</span>
            </h4>
            
            {!autoUpload && uploadedFiles.some(f => !f.uploading && !f.uploaded && !f.error) && (
              <button
                onClick={uploadAllFiles}
                style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px'
}}
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white'
                }}
              >
                Upload All
              </button>
            )}
          </div>
          <div className="space-y-3">
            {uploadedFiles.map((fileObj, index) => (
              <div
                key={fileObj.id}
                style={{
  display: 'flex',
  alignItems: 'center',
  padding: '16px',
  borderRadius: '24px'
}}
                style={{ 
                  background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
                  border: '1px solid var(--border-primary)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
                  animation: `fileSlideIn 0.4s ease-out ${index * 0.1}s both`
                }}
                onMouseEnter={(e) => !isMobile && (e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)')}
                onMouseLeave={(e) => !isMobile && (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.1)')}
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {fileObj.preview ? (
                    <div style={{
  borderRadius: '24px',
  overflow: 'hidden'
}}>
                      <img
                        src={fileObj.preview}
                        alt={fileObj.name}
                        style={{
  width: '100%',
  height: '100%'
}}
                      />
                    </div>
                  ) : (
                    <div style={{
  borderRadius: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
                         style={{ 
                           background: `linear-gradient(135deg, var(--bg-tertiary), var(--hover-bg))`,
                           border: '2px solid var(--border-primary)'
                         }}>
                      {getFileIcon(fileObj.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div style={{
  flex: '1'
}}>
                  <p style={{
  fontWeight: '500'
}} style={{ color: 'var(--text-primary)' }}>
                    {fileObj.name}
                  </p>
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatFileSize(fileObj.size)}
                      {fileObj.type.startsWith('audio/') && (
                        <span style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}} style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: 'white'
                        }}>
                          Audio
                        </span>
                      )}
                    </p>
                    
                    {/* Upload Status */}
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      {fileObj.uploaded && (
                        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                          <CheckCircle size={14} className="mr-1" />
                          <span className="text-xs">Uploaded</span>
                        </div>
                      )}
                      {fileObj.error && (
                        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                          <AlertCircle size={14} className="mr-1" />
                          <span className="text-xs">Failed</span>
                        </div>
                      )}
                      {fileObj.uploading && (
                        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                          <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
                          <span className="text-xs">{fileObj.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {fileObj.error && (
                    <p className="text-xs text-red-500 mt-1">
                      {fileObj.error}
                    </p>
                  )}
                  
                  {/* Upload Progress Bar */}
                  {fileObj.uploading && (
                    <div className="mt-2">
                      <div style={{
  width: '100%',
  borderRadius: '50%'
}} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div
                          style={{
  borderRadius: '50%'
}}
                          style={{ 
                            width: `${fileObj.progress}%`,
                            backgroundColor: 'var(--accent-primary)'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  {/* Upload/Retry button for manual uploads */}
                  {!autoUpload && !fileObj.uploaded && !fileObj.uploading && (
                    <button
                      onClick={() => uploadFile(fileObj)}
                      style={{
  padding: '4px',
  borderRadius: '4px'
}}
                      style={{ color: fileObj.error ? '#ef4444' : 'var(--accent-primary)' }}
                      onMouseEnter={(e) => { 
                        e.target.style.backgroundColor = fileObj.error ? 'rgba(239, 68, 68, 0.1)' : 'var(--hover-bg)' 
                      }}
                      onMouseLeave={(e) => { 
                        e.target.style.backgroundColor = 'transparent' 
                      }}
                      title={fileObj.error ? "Retry Upload" : "Upload"}
                    >
                      <Upload size={16} />
                    </button>
                  )}
                  
                  {fileObj.preview && !fileObj.uploading && (
                    <button
                      onClick={() => {
                        if (fileObj.uploadedUrl) {
                          window.open(fileObj.uploadedUrl, '_blank')
                        } else {
                          window.open(fileObj.preview, '_blank')
                        }
                      }}
                      style={{
  padding: '4px',
  borderRadius: '4px'
}}
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { 
                        e.target.style.color = 'var(--accent-primary)'; 
                        e.target.style.backgroundColor = 'var(--hover-bg)' 
                      }}
                      onMouseLeave={(e) => { 
                        e.target.style.color = 'var(--text-muted)'; 
                        e.target.style.backgroundColor = 'transparent' 
                      }}
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      if (fileObj.uploadedUrl) {
                        // Download from uploaded URL
                        window.open(fileObj.uploadedUrl, '_blank')
                      } else {
                        // Download local file
                        const url = URL.createObjectURL(fileObj.file)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = fileObj.name
                        a.click()
                        URL.revokeObjectURL(url)
                      }
                    }}
                    style={{
  padding: '4px',
  borderRadius: '4px'
}}
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { 
                      e.target.style.color = 'var(--accent-primary)'; 
                      e.target.style.backgroundColor = 'var(--hover-bg)' 
                    }}
                    onMouseLeave={(e) => { 
                      e.target.style.color = 'var(--text-muted)'; 
                      e.target.style.backgroundColor = 'transparent' 
                    }}
                    title="Download"
                    disabled={fileObj.uploading}
                  >
                    <Download size={16} />
                  </button>
                  
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    style={{
  padding: '4px',
  borderRadius: '4px'
}}
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { 
                      e.target.style.color = '#ef4444'; 
                      e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)' 
                    }}
                    onMouseLeave={(e) => { 
                      e.target.style.color = 'var(--text-muted)'; 
                      e.target.style.backgroundColor = 'transparent' 
                    }}
                    title="Remove"
                    disabled={fileObj.uploading}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
        
        @keyframes fileSlideIn {
          from {
            opacity: 0;
            transform: translateX(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}



export default FileUpload