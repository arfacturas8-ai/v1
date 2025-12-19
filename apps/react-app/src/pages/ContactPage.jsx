/**
 * ContactPage - Contact form for user support
 *
 * iOS Design System:
 * - Background: #FAFAFA (light gray)
 * - Text: #000 (primary), #666 (secondary)
 * - Cards: white with subtle shadows
 * - Border radius: 16-24px for modern iOS feel
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04)
 * - Gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
 * - Icons: 20px standard size
 * - Hover: translateY(-2px) for interactive elements
 */

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = 'Message must not exceed 1000 characters'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setErrors({})
    setSubmitError('')

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (Math.random() < 0.1) {
        throw new Error('Failed to send message. Please try again.')
      }

      setIsSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  if (isSubmitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '40px 20px' }}>
        <main style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }} role="main" aria-label="Page content">
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '48px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#f0fdf4',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <svg style={{ width: '40px', height: '40px', color: '#10b981' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#000', marginBottom: '12px' }}>Message Sent!</h1>
            <p style={{ color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>
              Thank you for contacting us. We'll get back to you within 24 hours.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                to="/home"
                style={{
                  display: 'block',
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: '#fff',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                aria-label="Return to home page"
              >
                Back to Home
              </Link>
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setErrors({})
                  setSubmitError('')
                }}
                style={{
                  padding: '14px 24px',
                  background: '#fff',
                  color: '#6366F1',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                aria-label="Send another message"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '40px 20px' }} role="main" aria-label="Contact page">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '40px',
            fontWeight: '600',
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Contact Us
          </h1>
          <p style={{ fontSize: '18px', color: '#666', lineHeight: '1.6' }}>
            Have a question or need help? We'd love to hear from you.
          </p>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
          padding: '32px'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '8px' }}>
                  Your Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#FAFAFA',
                    border: errors.name ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    color: '#000',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your name"
                  disabled={isLoading}
                  aria-label="Your name"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }} role="alert">{errors.name}</p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '8px' }}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#FAFAFA',
                    border: errors.email ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    color: '#000',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  aria-label="Email address"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }} role="alert">{errors.email}</p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '8px' }}>
                Subject <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#FAFAFA',
                  border: errors.subject ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  color: '#000',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                disabled={isLoading}
                aria-label="Subject"
                aria-invalid={errors.subject ? 'true' : 'false'}
                aria-describedby={errors.subject ? 'subject-error' : undefined}
              >
                <option value="">Select a subject</option>
                <option value="general">General Question</option>
                <option value="technical">Technical Support</option>
                <option value="account">Account Issues</option>
                <option value="community">Community Guidelines</option>
                <option value="billing">Billing & Payments</option>
                <option value="other">Other</option>
              </select>
              {errors.subject && (
                <p id="subject-error" style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }} role="alert">{errors.subject}</p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '8px' }}>
                Message <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#FAFAFA',
                  border: errors.message ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  color: '#000',
                  fontSize: '16px',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Tell us how we can help... (minimum 10 characters)"
                disabled={isLoading}
                aria-label="Message"
                aria-invalid={errors.message ? 'true' : 'false'}
                aria-describedby={errors.message ? 'message-error' : undefined}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {errors.message ? (
                  <p id="message-error" style={{ color: '#ef4444', fontSize: '14px' }} role="alert">{errors.message}</p>
                ) : (
                  <p style={{ color: '#666', fontSize: '14px' }} aria-live="polite">
                    {formData.message.length}/1000 characters
                  </p>
                )}
              </div>
            </div>

            {submitError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #ef4444',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'start',
                gap: '12px'
              }}>
                <svg style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p style={{ fontWeight: '600', color: '#ef4444', margin: 0 }}>Error</p>
                  <p style={{ fontSize: '14px', color: '#ef4444', margin: 0 }}>{submitError}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s ease',
                  background: isLoading ? '#ccc' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Send Message
              </button>
              <Link
                to="/help"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '14px 24px',
                  background: '#fff',
                  color: '#6366F1',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'transform 0.2s ease',
                  opacity: isLoading ? 0.5 : 1,
                  pointerEvents: isLoading ? 'none' : 'auto'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                aria-label="Visit help center"
              >
                Visit Help Center
              </Link>
            </div>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link
            to="/home"
            style={{ color: '#666', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
            aria-label="Back to home page"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

ContactPage.propTypes = {}

export default ContactPage
