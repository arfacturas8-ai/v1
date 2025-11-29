import React, { useState } from 'react'
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    // Subject validation
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject'
    }

    // Message validation
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

    // Clear previous errors
    setErrors({})
    setSubmitError('')

    // Validate form
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Simulate form submission with loading state
    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Simulate random error for demo (10% chance)
      if (Math.random() < 0.1) {
        throw new Error('Failed to send message. Please try again.')
      }

      // Success
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
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0d1117] px-5 py-10">
        <main id="main-content" className="max-w-2xl mx-auto text-center" role="main" aria-label="Page content">
          <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 px-8 py-12">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Message Sent!</h1>
            <p className="text-[#8b949e] mb-8 leading-relaxed">
              Thank you for contacting us. We'll get back to you within 24 hours.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/home" className="block px-6 py-3.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] no-underline font-semibold text-center hover:opacity-90 transition-opacity">
                Back to Home
              </Link>
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setErrors({})
                  setSubmitError('')
                }}
                className="px-6 py-3.5 bg-[#161b22]/60 text-[#58a6ff] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold cursor-pointer hover:bg-[#161b22]/60 backdrop-blur-xl transition-colors"
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
    <div className="min-h-screen bg-[#0d1117] px-5 py-10" role="main" aria-label="Contact page">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-lg text-[#8b949e] leading-relaxed">
            Have a question or need help? We'd love to hear from you.
          </p>
        </div>

        <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#21262d]/60 border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white text-base outline-none transition-all ${
                    errors.name ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-[#58a6ff]/50 focus:ring-1 focus:ring-[#58a6ff]/50'
                  }`}
                  placeholder="Enter your name"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#21262d]/60 border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white text-base outline-none transition-all ${
                    errors.email ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-[#58a6ff]/50 focus:ring-1 focus:ring-[#58a6ff]/50'
                  }`}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className={`w-full px-4 py-3 bg-[#21262d]/60 border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white text-base outline-none transition-all ${
                  errors.subject ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-[#58a6ff]/50 focus:ring-1 focus:ring-[#58a6ff]/50'
                }`}
                disabled={isLoading}
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
                <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={6}
                className={`w-full px-4 py-3 bg-[#21262d]/60 border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white text-base resize-vertical outline-none transition-all ${
                  errors.message ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-[#58a6ff]/50 focus:ring-1 focus:ring-[#58a6ff]/50'
                }`}
                placeholder="Tell us how we can help... (minimum 10 characters)"
                disabled={isLoading}
              />
              <div className="flex justify-between mt-1">
                {errors.message ? (
                  <p className="text-red-500 text-sm">{errors.message}</p>
                ) : (
                  <p className="text-[#8b949e] text-sm">
                    {formData.message.length}/1000 characters
                  </p>
                )}
              </div>
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 mb-5 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-red-500">Error</p>
                  <p className="text-sm text-red-500">{submitError}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-6 py-3.5 text-white border-none rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold text-base flex items-center justify-center gap-2 transition-opacity ${
                  isLoading ? 'bg-[#161b22]/60 backdrop-blur-xl cursor-not-allowed' : 'bg-gradient-to-br from-[#58a6ff] to-[#a371f7] cursor-pointer hover:opacity-90'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
              <Link
                to="/help"
                className={`block text-center px-6 py-3.5 bg-[#161b22]/60 text-[#58a6ff] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] no-underline font-semibold hover:bg-[#161b22]/60 backdrop-blur-xl transition-colors ${
                  isLoading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                Visit Help Center
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center mt-8">
          <Link to="/home" className="text-[#8b949e] no-underline font-medium hover:text-[#c9d1d9] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
