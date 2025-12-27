/*
 * CreatePostPage.jsx
 *
 * Modern iOS-styled post creation page
 * Features: Clean #FAFAFA background, white cards with subtle shadows,
 * gradient accent buttons, and smooth hover animations
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, FileText, AlertCircle, CheckCircle, Link as LinkIcon, Image as ImageIcon, Loader } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import communityService from '../services/communityService'
import postsService from '../services/postsService'
import { cn } from '../lib/utils'
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
      let result;

      if (formData.type === 'image' && formData.image) {
        // For image posts, use FormData
        const uploadFormData = new FormData()
        uploadFormData.append('title', formData.title.trim())
        uploadFormData.append('content', formData.content.trim())
        uploadFormData.append('communityId', formData.community)
        uploadFormData.append('type', 'image')
        uploadFormData.append('file', formData.image)

        result = await postsService.createPost(uploadFormData)
      } else {
        // For text/link posts, use JSON
        const postData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          communityId: formData.community,
          type: formData.type,
          url: formData.type === 'link' ? formData.url.trim() : undefined
        }

        result = await postsService.createPost(postData)
      }

      if (result.success) {
        const postId = result.data?.post?.id || result.data?.id || result.post?.id || result.id
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
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        padding: '32px 16px'
      }}
    >
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <div>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#000000',
              marginBottom: '8px'
            }}>
              Create a Post
            </h1>
            <p style={{ color: '#666666', fontSize: '16px' }}>
              Share your thoughts, links, or images with the community
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Community Selector */}
            <Card style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '18px', color: '#000000', fontWeight: '600' }}>
                  Choose a Community
                </CardTitle>
                <CardDescription style={{ color: '#666666' }}>
                  Select the community where you want to post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  name="community"
                  value={formData.community}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: errors.community ? '1px solid #EF4444' : '1px solid #E5E5E5',
                    background: '#FAFAFA',
                    color: '#000000',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
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
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#EF4444',
                    fontSize: '14px'
                  }}>
                    <AlertCircle size={20} />
                    <span>{errors.community}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Post Type Selection */}
            <Card style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '18px', color: '#000000', fontWeight: '600' }}>
                  Post Type
                </CardTitle>
                <CardDescription style={{ color: '#666666' }}>
                  Choose the type of content you want to share
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '16px'
                }}>
                  {postTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = formData.type === type.id
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                        style={{
                          padding: '16px',
                          borderRadius: '16px',
                          border: isSelected
                            ? '2px solid transparent'
                            : '2px solid #E5E5E5',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)'
                            : '#FAFAFA',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected
                            ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                            : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }
                        }}
                        aria-pressed={isSelected}
                      >
                        <Icon size={20} style={{ color: isSelected ? '#FFFFFF' : '#666666' }} />
                        <span style={{
                          fontWeight: '600',
                          color: isSelected ? '#FFFFFF' : '#000000',
                          fontSize: '15px'
                        }}>
                          {type.label}
                        </span>
                        <span style={{
                          fontSize: '13px',
                          color: isSelected ? 'rgba(255,255,255,0.9)' : '#666666'
                        }}>
                          {type.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Title Input */}
            <Card style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '18px', color: '#000000', fontWeight: '600' }}>
                  Title
                </CardTitle>
                <CardDescription style={{ color: '#666666' }}>
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
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: errors.title ? '1px solid #EF4444' : '1px solid #E5E5E5',
                    background: '#FAFAFA',
                    color: '#000000',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  aria-label="Post title"
                  aria-invalid={!!errors.title}
                />
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  {errors.title ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#EF4444',
                      fontSize: '14px'
                    }}>
                      <AlertCircle size={20} />
                      <span>{errors.title}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#666666' }}>
                      {formData.title.length}/300 characters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content Based on Post Type */}
            {formData.type === 'text' && (
              <Card style={{
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <CardHeader>
                  <CardTitle style={{ fontSize: '18px', color: '#000000', fontWeight: '600' }}>
                    Content
                  </CardTitle>
                  <CardDescription style={{ color: '#666666' }}>
                    Write your post content with rich text formatting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Share your thoughts..."
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: '#FAFAFA',
                      borderRadius: '16px',
                      border: errors.content ? '1px solid #EF4444' : '1px solid #E5E5E5',
                      color: '#000000',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => {
                      if (!errors.content) {
                        e.target.style.borderColor = '#000000'
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.content) {
                        e.target.style.borderColor = '#E5E5E5'
                      }
                    }}
                  />
                  {errors.content && (
                    <div style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#EF4444',
                      fontSize: '14px'
                    }}>
                      <AlertCircle size={20} />
                      <span>{errors.content}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {formData.type === 'link' && (
              <Card style={{
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <CardHeader>
                  <CardTitle style={{ fontSize: '18px', color: '#000000', fontWeight: '600' }}>
                    Link URL
                  </CardTitle>
                  <CardDescription style={{ color: '#666666' }}>
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
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: errors.url ? '1px solid #EF4444' : '1px solid #E5E5E5',
                      background: '#FAFAFA',
                      color: '#000000',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    aria-label="Link URL"
                    aria-invalid={!!errors.url}
                  />
                  {errors.url && (
                    <div style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#EF4444',
                      fontSize: '14px'
                    }}>
                      <AlertCircle size={20} />
                      <span>{errors.url}</span>
                    </div>
                  )}

                  <div style={{ marginTop: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#666666',
                      marginBottom: '8px'
                    }}>
                      Description (optional)
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Add a description or your thoughts about this link..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        border: '1px solid #E5E5E5',
                        background: '#FAFAFA',
                        color: '#000000',
                        fontSize: '15px',
                        outline: 'none',
                        resize: 'vertical',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.type === 'image' && (
              <Card style={{
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <CardHeader>
                  <CardTitle style={{ fontSize: '18px', color: '#000000', fontWeight: '600' }}>
                    Image Upload
                  </CardTitle>
                  <CardDescription style={{ color: '#666666' }}>
                    Upload an image to share with the community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        border: errors.image ? '2px dashed #EF4444' : '2px dashed #E5E5E5',
                        borderRadius: '16px',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: errors.image ? 'rgba(239, 68, 68, 0.05)' : '#FAFAFA',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <ImageIcon size={64} style={{ color: '#666666', marginBottom: '12px' }} />
                      <label style={{ cursor: 'pointer' }}>
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          onChange={handleInputChange}
                          style={{ display: 'none' }}
                          aria-label="Upload image"
                        />
                        <span style={{
                          fontWeight: '600',
                          background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontSize: '15px'
                        }}>
                          Choose an image
                        </span>
                      </label>
                      <p style={{ fontSize: '14px', color: '#666666', marginTop: '8px' }}>
                        or drag and drop
                      </p>
                      <p style={{ fontSize: '12px', color: '#999999', marginTop: '4px' }}>
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>

                    {formData.image && (
                      <div style={{
                        position: 'relative',
                        borderRadius: '16px',
                        padding: '16px',
                        background: '#FAFAFA',
                        border: '1px solid #E5E5E5'
                      }}>
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Preview"
                          style={{
                            width: '100%',
                            maxHeight: '384px',
                            objectFit: 'contain',
                            borderRadius: '12px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                          style={{
                            position: 'absolute',
                            top: '24px',
                            right: '24px',
                            background: '#EF4444',
                            color: '#FFFFFF',
                            padding: '8px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            fontSize: '20px',
                            lineHeight: '1',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                        <div style={{
                          marginTop: '12px',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#666666'
                        }}>
                          <CheckCircle size={20} style={{ color: '#10B981' }} />
                          {formData.image.name}
                        </div>
                      </div>
                    )}

                    {errors.image && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#EF4444',
                        fontSize: '14px'
                      }}>
                        <AlertCircle size={20} />
                        <span>{errors.image}</span>
                      </div>
                    )}

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#666666',
                        marginBottom: '8px'
                      }}>
                        Caption (optional)
                      </label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Add a caption or description for your image..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '16px',
                          border: '1px solid #E5E5E5',
                          background: '#FAFAFA',
                          color: '#000000',
                          fontSize: '15px',
                          outline: 'none',
                          resize: 'vertical',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <Card style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <CardContent style={{ paddingTop: '24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#EF4444'
                  }}>
                    <AlertCircle size={20} />
                    <span style={{ fontWeight: '600' }}>{errors.submit}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <CardContent style={{ paddingTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      color: '#FFFFFF',
                      padding: '14px 24px',
                      borderRadius: '16px',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader size={20} />
                        <span>Creating Post...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        <span>Post</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '16px',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: '1px solid #E5E5E5',
                      background: '#FAFAFA',
                      color: '#666666',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.background = '#F5F5F5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.background = '#FAFAFA'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Tips */}
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <h4 style={{
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#000000',
                    fontSize: '15px'
                  }}>
                    <AlertCircle size={20} />
                    Posting Tips
                  </h4>
                  <ul style={{
                    fontSize: '14px',
                    marginLeft: '24px',
                    listStyle: 'disc',
                    color: '#666666',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <li>Choose a clear and descriptive title</li>
                    <li>Select the most relevant community for your content</li>
                    <li>Follow community guidelines and be respectful</li>
                    <li>Use rich text formatting to make your post more readable</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreatePostPage
