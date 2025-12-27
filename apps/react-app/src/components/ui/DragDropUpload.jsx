import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, File, Image as ImageIcon, CheckCircle } from 'lucide-react'
import ProgressBar from './ProgressBar'

const DragDropUpload = ({
  onFileSelect,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  multiple = false,
  className = '',
  children
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const fileInputRef = useRef(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return 'File size too large'
    }
    return null
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [])

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files)
    processFiles(selectedFiles)
  }

  const processFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const error = validateFile(file)
      if (error) return false
      return true
    })

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles])
    } else {
      setFiles(validFiles.slice(0, 1))
    }

    if (onFileSelect) {
      onFileSelect(multiple ? validFiles : validFiles[0])
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ' + (isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700')}
      >
        <Upload style={{
  width: '48px',
  height: '48px',
  color: '#666666'
}} />
        <p style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p style={{
  color: '#666666'
}}>or click to browse</p>
      </div>
      <input ref={fileInputRef} type="file" accept={accept} multiple={multiple} onChange={handleFileInput} style={{
  display: 'none'
}} />
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file, index) => (
            <div key={index} style={{
  position: 'relative',
  background: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  padding: '16px'
}}>
              <button onClick={() => removeFile(index)} style={{
  position: 'absolute',
  color: '#ffffff',
  borderRadius: '50%',
  padding: '4px'
}}>
                <X size={16} />
              </button>
              <p style={{
  fontWeight: '500'
}}>{file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




export default DragDropUpload
