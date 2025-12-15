import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, FileText, AlertCircle, CheckCircle, Link as LinkIcon, Image as ImageIcon, Loader } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { RichTextEditor } from '../components/social/RichTextEditor'
import communityService from '../services/communityService'
import postsService from '../services/postsService'
import { cn } from '../lib/utils'
import { motion } from 'framer-motion'
import { useResponsive } from '../hooks/useResponsive'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage } from '../utils/errorUtils';

function CreatePostPage() {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    community: '',
    type: 'text',
    url: '',
    image: null
  })
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const result = await communityService.getCommunities()
        setCommunities(result.communities || [])
      } catch (error) {
        console.error('Error loading communities:', error)
        // Fallback to sample communities
        setCommunities([
          { id: '1', name: 'technology', displayName: 'Technology' },
          { id: '2', name: 'gaming', displayName: 'Gaming' },
          { id: '3', name: 'askCryb', displayName: 'Ask Cryb.ai' },
          { id: '4', name: 'science', displayName: 'Science' },
          { id: '5', name: 'cryptocurrency', displayName: 'Cryptocurrency' }
        ])
      }
    }

    fetchCommunities()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 300) {
      newErrors.title = 'Title must be less than 300 characters'
    }

    if (!formData.community) {
      newErrors.community = 'Please select a community'
    }

    if (formData.type === 'link' && !formData.url.trim()) {
      newErrors.url = 'URL is required for link posts'
    }

    if (formData.type === 'text' && !formData.content.trim()) {
      newErrors.content = 'Content is required for text posts'
    }

    if (formData.type === 'image' && !formData.image) {
      newErrors.image = 'Image is required for image posts'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        communityId: formData.community,
        type: formData.type,
        url: formData.type === 'link' ? formData.url : undefined
      }

      // Handle image upload
      if (formData.type === 'image' && formData.image) {
        // Create FormData for file upload
        const uploadFormData = new FormData()
        uploadFormData.append('file', formData.image)
        uploadFormData.append('type', 'post-image')

        // Upload image first (this would go to /api/v1/uploads)
        // For now, we'll include the image in the post creation
        postData.media = formData.image
      }

      // Use the posts service to create the post
      const result = await postsService.createPost(postData)

      if (result.success) {
        // Navigate to the new post or community
        const postId = result.data?.post?.id || result.post?.id
        if (postId) {
          navigate(`/post/${postId}`)
        } else {
          navigate(formData.community ? `/c/${formData.community}` : '/home')
        }
      } else {
        throw new Error(getErrorMessage(result.error, 'Failed to create post'))
      }
    } catch (error) {
      console.error('Error creating post:', error)
      setErrors({ submit: error.message || 'Failed to create post. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const postTypes = [
    { id: 'text', label: 'Text', icon: FileText, description: 'Create a text-based post' },
    { id: 'link', label: 'Link', icon: LinkIcon, description: 'Share a link' },
    { id: 'image', label: 'Image', icon: ImageIcon, description: 'Upload an image' }
  ]

  return (
    <div
      role="main"
      aria-label="Create post page"
      className="min-h-screen py-8 px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Create a Post
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Share your thoughts, links, or images with the community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Selector */}
            <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <CardHeader>
                <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Choose a Community</CardTitle>
                <CardDescription style={{ color: 'var(--text-secondary)' }}>
                  Select the community where you want to post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  name="community"
                  value={formData.community}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border",
                    "focus:outline-none transition-all duration-200",
                    errors.community && "border-red-500"
                  )}
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    borderColor: errors.community ? '#ef4444' : 'var(--border-primary)'
                  }}
                  aria-label="Select community"
                  aria-invalid={!!errors.community}
                >
                  <option value="">Select a community...</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.name}>
                      c/{community.displayName || community.name}
                    </option>
                  ))}
                </select>
                {errors.community && (
                  <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.community}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Post Type Selection */}
            <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <CardHeader>
                <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Post Type</CardTitle>
                <CardDescription style={{ color: 'var(--text-secondary)' }}>
                  Choose the type of content you want to share
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {postTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = formData.type === type.id
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all duration-200",
                          "flex flex-col items-center gap-2 text-center"
                        )}
                        style={{
                          borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-primary)',
                          background: isSelected ? 'rgba(88, 166, 255, 0.1)' : 'var(--bg-tertiary)',
                          boxShadow: isSelected ? '0 0 0 3px rgba(88, 166, 255, 0.1)' : 'none'
                        }}
                        aria-pressed={isSelected}
                      >
                        <Icon className="w-6 h-6" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)' }} />
                        <span className="font-medium" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                          {type.label}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {type.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Title Input */}
            <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <CardHeader>
                <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Title</CardTitle>
                <CardDescription style={{ color: 'var(--text-secondary)' }}>
                  Create an engaging title for your post (max 300 characters)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your post title..."
                  maxLength={300}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border",
                    "focus:outline-none transition-all duration-200",
                    errors.title && "border-red-500"
                  )}
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    borderColor: errors.title ? '#ef4444' : 'var(--border-primary)'
                  }}
                  aria-label="Post title"
                  aria-invalid={!!errors.title}
                />
                <div className="mt-2 flex items-center justify-between">
                  {errors.title ? (
                    <div className="flex items-center gap-2 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.title}</span>
                    </div>
                  ) : (
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formData.title.length}/300 characters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content Based on Post Type */}
            {formData.type === 'text' && (
              <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Content</CardTitle>
                  <CardDescription style={{ color: 'var(--text-secondary)' }}>
                    Write your post content with rich text formatting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, content: value }))
                      if (errors.content) {
                        setErrors(prev => ({ ...prev, content: '' }))
                      }
                    }}
                    placeholder="Share your thoughts..."
                    className={cn(
                      "rounded-xl",
                      errors.content && "border-red-500"
                    )}
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: errors.content ? '#ef4444' : 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.content && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.content}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {formData.type === 'link' && (
              <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Link URL</CardTitle>
                  <CardDescription style={{ color: 'var(--text-secondary)' }}>
                    Enter the URL you want to share
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border",
                      "focus:outline-none transition-all duration-200",
                      errors.url && "border-red-500"
                    )}
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      borderColor: errors.url ? '#ef4444' : 'var(--border-primary)'
                    }}
                    aria-label="Link URL"
                    aria-invalid={!!errors.url}
                  />
                  {errors.url && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.url}</span>
                    </div>
                  )}

                  {/* Optional description for link posts */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Description (optional)
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Add a description or your thoughts about this link..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all duration-200 resize-y"
                      style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.type === 'image' && (
              <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Image Upload</CardTitle>
                  <CardDescription style={{ color: 'var(--text-secondary)' }}>
                    Upload an image to share with the community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8",
                        "flex flex-col items-center justify-center",
                        "transition-all duration-200 cursor-pointer",
                        errors.image && "border-red-500 bg-red-500/5"
                      )}
                      style={{
                        borderColor: errors.image ? '#ef4444' : 'var(--border-primary)',
                        background: errors.image ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-tertiary)'
                      }}
                    >
                      <ImageIcon className="w-12 h-12 mb-4" style={{ color: 'var(--text-secondary)' }} />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          onChange={handleInputChange}
                          className="hidden"
                          aria-label="Upload image"
                        />
                        <span className="font-medium transition-colors" style={{ color: 'var(--color-primary)' }}>
                          Choose an image
                        </span>
                      </label>
                      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                        or drag and drop
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>

                    {formData.image && (
                      <div className="relative rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Preview"
                          className="w-full max-h-96 object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                          style={{color: "var(--text-primary)"}} className="absolute top-6 right-6 bg-red-500  p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                        <div className="mt-3 text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {formData.image.name}
                        </div>
                      </div>
                    )}

                    {errors.image && (
                      <div className="flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.image}</span>
                      </div>
                    )}

                    {/* Optional caption for images */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Caption (optional)
                      </label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Add a caption or description for your image..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all duration-200 resize-y"
                        style={{
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-primary)'
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <Card className="rounded-2xl" style={{ border: '1px solid rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.1)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{errors.submit}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "flex-1 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white",
                      "px-6 py-3 rounded-xl font-medium",
                      "transition-all duration-200 shadow-lg hover:shadow-xl",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center justify-center gap-2"
                    )}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full " />
                        <span>Creating Post...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Post</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    variant="outline"
                    className={cn(
                      "px-6 py-3 rounded-xl font-medium",
                      "border transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    style={{
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-tertiary)'
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(88, 166, 255, 0.1)', border: '1px solid rgba(88, 166, 255, 0.3)' }}>
                  <h4 className="font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                    <AlertCircle className="w-4 h-4" />
                    Posting Tips
                  </h4>
                  <ul className="text-sm space-y-1 ml-6 list-disc" style={{ color: 'var(--text-secondary)' }}>
                    <li>Choose a clear and descriptive title</li>
                    <li>Select the most relevant community for your content</li>
                    <li>Follow community guidelines and be respectful</li>
                    <li>Use rich text formatting to make your post more readable</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default CreatePostPage

