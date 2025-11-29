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
        throw new Error(result.error || 'Failed to create post')
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
      className="min-h-screen bg-[#0d1117] py-8 px-4"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create a Post
            </h1>
            <p className="text-[#8b949e]">
              Share your thoughts, links, or images with the community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Selector */}
            <Card className="bg-[#161b22]/60 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Choose a Community</CardTitle>
                <CardDescription className="text-[#8b949e]">
                  Select the community where you want to post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  name="community"
                  value={formData.community}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border bg-[#21262d]/60 backdrop-blur-xl",
                    "text-white border-white/10",
                    "focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent",
                    "transition-all duration-200",
                    errors.community && "border-red-500"
                  )}
                  aria-label="Select community"
                  aria-invalid={!!errors.community}
                >
                  <option value="" className="bg-[#21262d]">Select a community...</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.name} className="bg-[#21262d]">
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
            <Card className="bg-[#161b22]/60 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Post Type</CardTitle>
                <CardDescription className="text-[#8b949e]">
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
                          "p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-2 transition-all duration-200",
                          "flex flex-col items-center gap-2 text-center",
                          "hover:shadow-md",
                          isSelected
                            ? "border-[#58a6ff] bg-gradient-to-r from-[#58a6ff]/20 to-[#a371f7]/20"
                            : "border-white/10 bg-[#21262d]/40 hover:border-white/10"
                        )}
                        aria-pressed={isSelected}
                      >
                        <Icon className={cn(
                          "w-6 h-6",
                          isSelected ? "text-[#58a6ff]" : "text-[#8b949e]"
                        )} />
                        <span className={cn(
                          "font-medium",
                          isSelected ? "text-[#58a6ff]" : "text-white"
                        )}>
                          {type.label}
                        </span>
                        <span className="text-xs text-[#8b949e]">
                          {type.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Title Input */}
            <Card className="bg-[#161b22]/60 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Title</CardTitle>
                <CardDescription className="text-[#8b949e]">
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
                    "w-full px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border bg-[#21262d]/60 backdrop-blur-xl",
                    "text-white placeholder:text-[#8b949e] border-white/10",
                    "focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent",
                    "transition-all duration-200",
                    errors.title && "border-red-500"
                  )}
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
                    <div className="text-sm text-[#8b949e]">
                      {formData.title.length}/300 characters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content Based on Post Type */}
            {formData.type === 'text' && (
              <Card className="bg-[#161b22]/60 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Content</CardTitle>
                  <CardDescription className="text-[#8b949e]">
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
                      "bg-[#21262d]/60 border-white/10 text-white",
                      errors.content && "border-red-500"
                    )}
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
              <Card className="bg-[#161b22]/60 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Link URL</CardTitle>
                  <CardDescription className="text-[#8b949e]">
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
                      "w-full px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border bg-[#21262d]/60 backdrop-blur-xl",
                      "text-white placeholder:text-[#8b949e] border-white/10",
                      "focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent",
                      "transition-all duration-200",
                      errors.url && "border-red-500"
                    )}
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
                    <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Add a description or your thoughts about this link..."
                      rows={4}
                      className={cn(
                        "w-full px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border bg-[#21262d]/60 backdrop-blur-xl",
                        "text-white placeholder:text-[#8b949e] border-white/10",
                        "focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent",
                        "transition-all duration-200 resize-y"
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.type === 'image' && (
              <Card className="bg-[#161b22]/60 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Image Upload</CardTitle>
                  <CardDescription className="text-[#8b949e]">
                    Upload an image to share with the community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-8",
                        "flex flex-col items-center justify-center",
                        "transition-all duration-200",
                        errors.image ? "border-red-500" : "border-white/10",
                        "hover:border-[#58a6ff] cursor-pointer bg-[#21262d]/40"
                      )}
                    >
                      <ImageIcon className="w-12 h-12 text-[#8b949e] mb-4" />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          onChange={handleInputChange}
                          className="hidden"
                          aria-label="Upload image"
                        />
                        <span className="text-[#58a6ff] hover:text-[#a371f7] font-medium">
                          Choose an image
                        </span>
                      </label>
                      <p className="text-sm text-[#8b949e] mt-2">
                        or drag and drop
                      </p>
                      <p className="text-xs text-[#8b949e]/70 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>

                    {formData.image && (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Preview"
                          className="w-full max-h-96 object-contain rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                        <div className="mt-2 text-sm text-[#c9d1d9]">
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
                      <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                        Caption (optional)
                      </label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Add a caption or description for your image..."
                        rows={3}
                        className={cn(
                          "w-full px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border bg-[#21262d]/60 backdrop-blur-xl",
                          "text-white placeholder:text-[#8b949e] border-white/10",
                          "focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent",
                          "transition-all duration-200 resize-y"
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <Card className="border-red-500/50 bg-red-500/10 backdrop-blur-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{errors.submit}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="bg-[#161b22]/60 backdrop-blur-xl border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "flex-1 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white",
                      "px-6 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-medium",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center justify-center gap-2"
                    )}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                      "px-6 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-medium",
                      "border-2 border-white/10 text-[#c9d1d9]",
                      "hover:bg-[#161b22]/60 backdrop-blur-xl",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 bg-[#58a6ff]/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-[#58a6ff]/30">
                  <h4 className="font-medium text-[#58a6ff] mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Posting Tips
                  </h4>
                  <ul className="text-sm text-[#c9d1d9] space-y-1 ml-6 list-disc">
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

