import React, { useState, useRef, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { X, Image, Video, Link, Hash, Bold, Italic, Type, Eye, Send, AlertCircle, Plus } from 'lucide-react'
const CreatePost = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedCommunity = null, 
  communities = [], 
  user 
}) => {
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
    <div className="modal-overlay">
      <div className="create-post-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>Create Post</h2>
          <button 
            onClick={onClose} 
            className="modal-close-btn"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="create-post-form">
          {/* Post Type Selection */}
          <div className="form-section">
            <label>Post Type</label>
            <div className="post-type-tabs">
              {postTypes.map(type => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setPostType(type.id)
                      setMediaFiles([])
                      setLink('')
                    }}
                    className={`post-type-tab ${postType === type.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                    title={type.description}
                  >
                    <Icon size={18} />
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
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || !title.trim() || !selectedCommunityId}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
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
    </div>
  )
}
export default CreatePost