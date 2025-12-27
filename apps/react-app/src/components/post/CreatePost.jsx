import React, { useState, useRef, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { X, Image, Video, Link, Hash, Bold, Italic, Type, Eye, Send, AlertCircle, Plus } from 'lucide-react'
import { useResponsive } from '../../hooks/useResponsive'

const CreatePost = ({
  isOpen,
  onClose,
  onSubmit,
  selectedCommunity = null,
  communities = [],
  user
}) => {
  const { isMobile, isTablet } = useResponsive()
  const [postType, setPostType] = useState('text') // text, image, video, link, poll
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [link, setLink] = useState('')
  const [selectedCommunityId, setSelectedCommunityId] = useState(selectedCommunity?.id || '')
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preview, setPreview] = useState(false)
  const [errors, setErrors] = useState({})
  const [mediaFiles, setMediaFiles] = useState([])

  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const postTypes = [
    { id: 'text', name: 'Text', icon: Type, description: 'Create a text post' },
    { id: 'image', name: 'Image', icon: Image, description: 'Share images' },
    { id: 'video', name: 'Video', icon: Video, description: 'Upload videos' },
    { id: 'link', name: 'Link', icon: Link, description: 'Share a link' },
  ]

  const validateForm = useCallback(() => {
    const newErrors = {}
    
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    } else if (title.length > 300) {
      newErrors.title = 'Title must be less than 300 characters'
    }

    if (!selectedCommunityId) {
      newErrors.community = 'Please select a community'
    }

    if (postType === 'text' && !content.trim()) {
      newErrors.content = 'Post content is required'
    }

    if (postType === 'link' && !link.trim()) {
      newErrors.link = 'Link URL is required'
    } else if (postType === 'link' && link && !isValidUrl(link)) {
      newErrors.link = 'Please enter a valid URL'
    }

    if (postType === 'image' && mediaFiles.length === 0) {
      newErrors.media = 'Please select at least one image'
    }

    if (postType === 'video' && mediaFiles.length === 0) {
      newErrors.media = 'Please select a video file'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [title, selectedCommunityId, postType, content, link, mediaFiles])

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }, [newTag, tags])

  const handleRemoveTag = useCallback((tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }, [tags])

  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files)
    
    if (postType === 'image') {
      const imageFiles = files.filter(file => file.type.startsWith('image/'))
      setMediaFiles(prev => [...prev, ...imageFiles].slice(0, 10)) // Max 10 images
    } else if (postType === 'video') {
      const videoFile = files.find(file => file.type.startsWith('video/'))
      if (videoFile) {
        setMediaFiles([videoFile]) // Only one video
      }
    }
  }, [postType])

  const handleRemoveFile = useCallback((index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const postData = {
        type: postType,
        title: title.trim(),
        content: content.trim(),
        link: link.trim(),
        communityId: selectedCommunityId,
        tags,
        mediaFiles
      }

      await onSubmit(postData)
      
      // Reset form
      setTitle('')
      setContent('')
      setLink('')
      setTags([])
      setMediaFiles([])
      setSelectedCommunityId(selectedCommunity?.id || '')
      setPostType('text')
      setErrors({})
      
      onClose()
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create post' })
    } finally {
      setIsSubmitting(false)
    }
  }, [validateForm, postType, title, content, link, selectedCommunityId, tags, mediaFiles, onSubmit, onClose, selectedCommunity])

  const handleTextFormat = useCallback((format) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let formattedText = selectedText
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end)
    setContent(newContent)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
    }, 0)
  }, [content])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? 0 : '20px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: isMobile ? '24px 24px 0 0' : '20px',
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? '600px' : '700px',
          maxHeight: isMobile ? '90vh' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: isMobile ? '20px' : '24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#000000', margin: 0 }}>
            Create Post
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(0, 0, 0, 0.05)',
              color: '#666666',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              opacity: isSubmitting ? 0.5 : 1
            }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)')}
            onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px 20px' : '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '20px' : '24px'
          }}
        >
          {/* Post Type Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#000000', marginBottom: '12px' }}>
              Post Type
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: '8px'
              }}
            >
              {postTypes.map(type => {
                const Icon = type.icon
                const isActive = postType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setPostType(type.id)
                      setMediaFiles([])
                      setLink('')
                    }}
                    title={type.description}
                    style={{
                      padding: isMobile ? '12px' : '14px',
                      background: isActive ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)' : '#FFFFFF',
                      border: isActive ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '12px',
                      color: isActive ? '#FFFFFF' : '#666666',
                      fontSize: isMobile ? '13px' : '14px',
                      fontWeight: isActive ? '600' : '500',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 4px 12px rgba(88, 166, 255, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#F8F9FA'
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#FFFFFF'
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                      }
                    }}
                  >
                    <Icon size={isMobile ? 16 : 18} />
                    <span>{type.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Community Selection */}
          <div className="form-section">
            <label htmlFor="community-select">
              Choose Community
              {errors.community && <span className="error-text">*</span>}
            </label>
            <select
              id="community-select"
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className={`community-select ${errors.community ? 'error' : ''}`}
              disabled={isSubmitting}
            >
              <option value="">Select a community...</option>
              {communities.map(community => (
                <option key={community.id} value={community.id}>
                  c/{community.name}
                </option>
              ))}
            </select>
            {errors.community && (
              <div className="error-message">
                <AlertCircle size={14} />
                {errors.community}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="form-section">
            <label htmlFor="post-title">
              Title
              {errors.title && <span className="error-text">*</span>}
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your post about?"
              className={`post-title-input ${errors.title ? 'error' : ''}`}
              maxLength={300}
              disabled={isSubmitting}
            />
            <div className="input-meta">
              <span className={`char-count ${title.length > 250 ? 'warning' : ''}`}>
                {title.length}/300
              </span>
            </div>
            {errors.title && (
              <div className="error-message">
                <AlertCircle size={14} />
                {errors.title}
              </div>
            )}
          </div>

          {/* Content based on post type */}
          {postType === 'text' && (
            <div className="form-section">
              <div className="content-header">
                <label htmlFor="post-content">
                  Content
                  {errors.content && <span className="error-text">*</span>}
                </label>
                <div className="format-buttons">
                  <button
                    type="button"
                    onClick={() => handleTextFormat('bold')}
                    className="format-btn"
                    title="Bold"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextFormat('italic')}
                    className="format-btn"
                    title="Italic"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(!preview)}
                    className={`format-btn ${preview ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                    title="Preview"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
              
              {!preview ? (
                <textarea
                  id="post-content"
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What are your thoughts?"
                  className={`post-content-textarea ${errors.content ? 'error' : ''}`}
                  rows={8}
                  disabled={isSubmitting}
                />
              ) : (
                <div className="content-preview">
                  {content ? (
                    <div dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br>'))
                    }} />
                  ) : (
                    <p className="preview-placeholder">Nothing to preview</p>
                  )}
                </div>
              )}
              
              {errors.content && (
                <div className="error-message">
                  <AlertCircle size={14} />
                  {errors.content}
                </div>
              )}
            </div>
          )}

          {postType === 'link' && (
            <div className="form-section">
              <label htmlFor="post-link">
                Link URL
                {errors.link && <span className="error-text">*</span>}
              </label>
              <input
                id="post-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
                className={`post-link-input ${errors.link ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.link && (
                <div className="error-message">
                  <AlertCircle size={14} />
                  {errors.link}
                </div>
              )}
            </div>
          )}

          {(postType === 'image' || postType === 'video') && (
            <div className="form-section">
              <label>
                {postType === 'image' ? 'Images' : 'Video'}
                {errors.media && <span className="error-text">*</span>}
              </label>
              
              <div className="media-upload">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={postType === 'image' ? 'image/*' : 'video/*'}
                  multiple={postType === 'image'}
                  onChange={handleFileSelect}
                  className="file-input-hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-btn"
                  disabled={isSubmitting}
                >
                  <Plus size={18} />
                  Choose {postType === 'image' ? 'Images' : 'Video'}
                </button>
                
                {mediaFiles.length > 0 && (
                  <div className="media-preview">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="media-item">
                        {postType === 'image' ? (
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${index + 1}`}
                            className="media-thumbnail"
                          />
                        ) : (
                          <div className="video-preview">
                            <Video size={24} />
                            <span>{file.name}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="remove-media-btn"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {errors.media && (
                <div className="error-message">
                  <AlertCircle size={14} />
                  {errors.media}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="form-section">
            <label>Tags (Optional)</label>
            <div className="tags-input">
              <div className="tags-list">
                {tags.map(tag => (
                  <span key={tag} className="tag">
                    <Hash size={12} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="remove-tag-btn"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              {tags.length < 5 && (
                <div className="add-tag">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag..."
                    className="tag-input"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="add-tag-btn"
                    disabled={!newTag.trim() || isSubmitting}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="tags-meta">
              {tags.length}/5 tags • Tags help people find your post
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="form-error">
              <AlertCircle size={16} />
              {errors.submit}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '20px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              flexDirection: isMobile ? 'column-reverse' : 'row'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: isMobile ? '14px 20px' : '12px 24px',
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
                color: '#666666',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isSubmitting ? 0.5 : 1,
                minHeight: '48px'
              }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#F8F9FA')}
              onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = '#FFFFFF')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !selectedCommunityId}
              style={{
                padding: isMobile ? '14px 20px' : '12px 24px',
                background: (isSubmitting || !title.trim() || !selectedCommunityId)
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                border: 'none',
                borderRadius: '12px',
                color: (isSubmitting || !title.trim() || !selectedCommunityId) ? '#999999' : '#FFFFFF',
                fontSize: '15px',
                fontWeight: '600',
                cursor: (isSubmitting || !title.trim() || !selectedCommunityId) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: (isSubmitting || !title.trim() || !selectedCommunityId)
                  ? 'none'
                  : '0 4px 16px rgba(88, 166, 255, 0.3)',
                minHeight: '48px',
                flex: isMobile ? 1 : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && title.trim() && selectedCommunityId) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(88, 166, 255, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && title.trim() && selectedCommunityId) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(88, 166, 255, 0.3)'
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #FFFFFF',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Create Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
export default CreatePost