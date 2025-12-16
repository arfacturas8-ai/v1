import React, { useState } from 'react'
import {
  Flag, AlertTriangle, Shield, X, Check, Send,
  MessageSquare, User, Image, Link, FileText,
  AlertCircle, Info, ChevronDown, ChevronRight
} from 'lucide-react'
const ReportingSystem = ({ contentType, contentId, contentData, onClose, onSubmit }) => {
  const [reportReason, setReportReason] = useState('')
  const [reportCategory, setReportCategory] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState(null)

  const reportCategories = {
    spam: {
      label: 'Spam',
      icon: MessageSquare,
      description: 'Unsolicited or repetitive content',
      reasons: [
        'Excessive promotional content',
        'Repetitive posts/comments',
        'Bot activity',
        'Link farming',
        'Misleading clickbait'
      ]
    },
    harassment: {
      label: 'Harassment or Bullying',
      icon: User,
      description: 'Targeted harassment or abusive behavior',
      reasons: [
        'Personal attacks',
        'Threatening behavior',
        'Doxxing or sharing personal info',
        'Targeted harassment',
        'Hate speech'
      ]
    },
    inappropriate: {
      label: 'Inappropriate Content',
      icon: AlertTriangle,
      description: 'Content that violates community guidelines',
      reasons: [
        'NSFW content without marking',
        'Graphic violence',
        'Sexually explicit material',
        'Illegal content',
        'Drug-related content'
      ]
    },
    misinformation: {
      label: 'Misinformation',
      icon: AlertCircle,
      description: 'False or misleading information',
      reasons: [
        'False claims',
        'Manipulated media',
        'Impersonation',
        'Scams or fraud',
        'Misleading financial advice'
      ]
    },
    copyright: {
      label: 'Copyright Violation',
      icon: Shield,
      description: 'Unauthorized use of copyrighted material',
      reasons: [
        'Stolen content',
        'Unauthorized repost',
        'Copyright infringement',
        'Trademark violation',
        'Plagiarism'
      ]
    },
    other: {
      label: 'Other',
      icon: Info,
      description: 'Report doesn\'t fit other categories',
      reasons: [
        'Breaks community rules',
        'Off-topic content',
        'Low quality content',
        'Other violation'
      ]
    }
  }

  const handleCategorySelect = (category) => {
    setReportCategory(category)
    setExpandedCategory(expandedCategory === category ? null : category)
    setReportReason('')
  }

  const handleReasonSelect = (reason) => {
    setReportReason(reason)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!reportCategory || !reportReason) {
      alert('Please select a category and reason for your report')
      return
    }

    setIsSubmitting(true)

    try {
      const reportData = {
        contentType,
        contentId,
        category: reportCategory,
        reason: reportReason,
        details: reportDetails,
        attachments,
        timestamp: new Date().toISOString()
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      })

      if (response.ok) {
        setSubmitted(true)
        if (onSubmit) {
          onSubmit(reportData)
        }
        setTimeout(() => {
          onClose()
        }, 3000)
      } else {
        alert('Failed to submit report. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }))
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 3))
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  if (submitted) {
    return (
      <div className="report-modal">
        <div className="report-container">
          <div className="report-success">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h2>Report Submitted</h2>
            <p>Thank you for helping keep our community safe.</p>
            <p className="success-subtitle">
              Our moderation team will review your report and take appropriate action.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="report-modal">
      <div className="report-container">
        <div className="report-header">
          <div className="header-title">
            <Flag size={24} />
            <h2>Report {contentType}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {contentData && (
          <div className="content-preview">
            <div className="preview-header">
              <span className="preview-label">Reporting:</span>
            </div>
            <div className="preview-content">
              {contentData.author && (
                <div className="preview-author">
                  <User size={24} />
                  <span>{contentData.author}</span>
                </div>
              )}
              {contentData.text && (
                <p className="preview-text">
                  {contentData.text.length > 200 
                    ? `${contentData.text.substring(0, 200)}...` 
                    : contentData.text}
                </p>
              )}
              {contentData.image && (
                <div className="preview-image">
                  <Image size={24} />
                  <span>Contains image</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-section">
            <label className="section-label">
              Why are you reporting this?
              <span className="required">*</span>
            </label>
            
            <div className="categories-list">
              {Object.entries(reportCategories).map(([key, category]) => {
                const Icon = category.icon
                const isExpanded = expandedCategory === key
                const isSelected = reportCategory === key
                
                return (
                  <div key={key} className="category-wrapper">
                    <button
                      type="button"
                      className={`category-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleCategorySelect(key)}
                    >
                      <div className="category-left">
                        <div className="category-icon">
                          <Icon size={24} />
                        </div>
                        <div className="category-info">
                          <span className="category-label">{category.label}</span>
                          <span className="category-description">{category.description}</span>
                        </div>
                      </div>
                      <div className="category-arrow">
                        {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="reasons-list">
                        {category.reasons.map((reason, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`reason-item ${reportReason === reason ? 'selected' : ''}`}
                            onClick={() => handleReasonSelect(reason)}
                          >
                            <span className="reason-checkbox">
                              {reportReason === reason && <Check size={24} />}
                            </span>
                            <span className="reason-text">{reason}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="details" className="section-label">
              Additional Details
              <span className="optional">(Optional)</span>
            </label>
            <textarea
              id="details"
              className="report-textarea"
              placeholder="Provide any additional context that might help moderators..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <span className="char-count">{reportDetails.length}/500</span>
          </div>

          <div className="form-section">
            <label className="section-label">
              Attachments
              <span className="optional">(Optional, max 3)</span>
            </label>
            
            {attachments.length > 0 && (
              <div className="attachments-list">
                {attachments.map((attachment, index) => (
                  <div key={index} className="attachment-item">
                    <FileText size={24} />
                    <span className="attachment-name">{attachment.name}</span>
                    <button
                      type="button"
                      className="remove-attachment"
                      onClick={() => removeAttachment(index)}
                    >
                      <X size={24} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {attachments.length < 3 && (
              <label className="file-upload">
                <input
                  type="file"
                  accept="image/*,.pdf,.txt"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <Link size={24} />
                <span>Add screenshot or evidence</span>
              </label>
            )}
          </div>

          <div className="report-notice">
            <Info size={24} />
            <p>
              False reports may result in action being taken against your account.
              Please ensure your report is accurate and in good faith.
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              style={{color: "var(--text-primary)"}} className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover: rounded-lg font-medium transition-all"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={!reportCategory || !reportReason || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={24} />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}




export default ReportingSystem
