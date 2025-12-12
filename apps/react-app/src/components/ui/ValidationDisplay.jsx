import React, { useState, useEffect } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { getErrorMessage } from '../../utils/errorUtils'

const ValidationDisplay = ({
  validation = null,
  field = null,
  showSummary = true,
  showDetails = true,
  className = '',
  compact = false,
  realTime = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Auto-expand if there are errors
  useEffect(() => {
    if (validation?.hasErrors && !compact) {
      setIsExpanded(true)
    }
  }, [validation?.hasErrors, compact])

  if (!validation) return null

  const { errors = {}, warnings = [], summary = {} } = validation
  const allErrors = field ? (errors[field] || []) : Object.values(errors).flat()
  const hasErrors = allErrors.length > 0
  const hasWarnings = warnings.length > 0

  if (!hasErrors && !hasWarnings && !showSummary) return null

  // Get validation level color and icon
  const getValidationStyle = () => {
    if (hasErrors) {
      return {
        color: 'error',
        bgClass: 'bg-error/10',
        borderClass: 'border-error/30',
        textClass: 'text-error',
        icon: AlertTriangle
      }
    }
    if (hasWarnings) {
      return {
        color: 'warning',
        bgClass: 'bg-warning/10',
        borderClass: 'border-warning/30',
        textClass: 'text-warning',
        icon: AlertCircle
      }
    }
    return {
      color: 'success',
      bgClass: 'bg-success/10',
      borderClass: 'border-success/30',
      textClass: 'text-success',
      icon: CheckCircle
    }
  }

  const style = getValidationStyle()
  const Icon = style.icon

  // Field-specific validation display
  if (field) {
    const fieldErrors = errors[field] || []
    const fieldWarnings = warnings.filter(w => w.field === field)
    
    if (fieldErrors.length === 0 && fieldWarnings.length === 0) {
      return null
    }

    return (
      <div className={`validation-field mt-1 ${className}`}>
        {fieldErrors.map((error, index) => (
          <div key={`error-${index}`} style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{typeof error === "string" ? error : getErrorMessage(error, "")}</span>
          </div>
        ))}
        {fieldWarnings.map((warning, index) => (
          <div key={`warning-${index}`} style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}>
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        ))}
      </div>
    )
  }

  // Compact display
  if (compact) {
    return (
      <div style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
        <Icon size={14} className={style.textClass} />
        <span className={style.textClass}>
          {hasErrors && `${summary.errorCount} error${summary.errorCount !== 1 ? 's' : ''}`}
          {hasErrors && hasWarnings && ', '}
          {hasWarnings && `${summary.warningCount} warning${summary.warningCount !== 1 ? 's' : ''}`}
        </span>
      </div>
    )
  }

  return (
    <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
      {/* Header */}
      <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
            <Icon size={20} className={style.textClass} />
            <div>
              <h3 style={{
  fontWeight: '600'
}}>
                {hasErrors ? 'Validation Errors' : hasWarnings ? 'Validation Warnings' : 'All Good!'}
              </h3>
              {showSummary && summary && (
                <p className="text-sm text-secondary mt-1">
                  {hasErrors && `${summary.errorCount} error${summary.errorCount !== 1 ? 's' : ''}`}
                  {hasErrors && hasWarnings && ', '}
                  {hasWarnings && `${summary.warningCount} warning${summary.warningCount !== 1 ? 's' : ''}`}
                  {summary.readinessScore !== undefined && (
                    <span className="ml-2">
                      • Readiness: {summary.readinessScore}%
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            {showDetails && (allErrors.length > 0 || warnings.length > 0) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
  padding: '4px',
  borderRadius: '4px'
}}
                title={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
            
            <button
              onClick={() => setShowHelp(!showHelp)}
              style={{
  padding: '4px',
  borderRadius: '4px'
}}
              title="Validation help"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Errors and Warnings */}
      {showDetails && isExpanded && (allErrors.length > 0 || warnings.length > 0) && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px'
}}>
          {/* Errors */}
          {allErrors.length > 0 && (
            <div className="mt-3">
              <h4 style={{
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <AlertTriangle size={16} />
                Errors ({allErrors.length})
              </h4>
              <div className="space-y-1">
                {allErrors.map((error, index) => (
                  <div key={index} style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}>
                    <span style={{
  width: '4px',
  height: '4px',
  borderRadius: '50%'
}} />
                    <span className="text-secondary">{typeof error === "string" ? error : getErrorMessage(error, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-3">
              <h4 style={{
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <AlertCircle size={16} />
                Warnings ({warnings.length})
              </h4>
              <div className="space-y-1">
                {warnings.map((warning, index) => (
                  <div key={index} style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}>
                    <span style={{
  width: '4px',
  height: '4px',
  borderRadius: '50%'
}} />
                    <span className="text-secondary">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      {showHelp && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px'
}}>
          <div className="mt-3">
            <h4 style={{
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <Info size={16} />
              Validation Help
            </h4>
            <div className="space-y-2 text-sm text-secondary">
              <ValidationHelp errors={allErrors} warnings={warnings} />
            </div>
          </div>
        </div>
      )}

      {/* Summary Bar */}
      {showSummary && summary.readinessScore !== undefined && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px'
}}>
          <div className="mt-3">
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <span style={{
  fontWeight: '500'
}}>Post Readiness</span>
              <span className="font-mono">{summary.readinessScore}%</span>
            </div>
            <div style={{
  width: '100%',
  borderRadius: '50%',
  height: '8px'
}}>
              <div 
                style={{
  height: '8px',
  borderRadius: '50%'
}}
                style={{ width: `${summary.readinessScore}%` }}
              />
            </div>
            <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
              <span>Needs work</span>
              <span>Good to go</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Help content based on validation results
const ValidationHelp = ({ errors, warnings }) => {
  const tips = []

  // Error-based tips
  if (errors.some(e => e.includes('Title'))) {
    tips.push('Make your title descriptive and engaging while keeping it under 300 characters')
  }

  if (errors.some(e => e.includes('Content'))) {
    tips.push('Add meaningful content to help others understand your post')
  }

  if (errors.some(e => e.includes('URL'))) {
    tips.push('Ensure your URL is valid and starts with http:// or https://')
  }

  if (errors.some(e => e.includes('Poll'))) {
    tips.push('Polls need at least 2 unique options and a duration between 1-30 days')
  }

  if (errors.some(e => e.includes('community'))) {
    tips.push('Select a community where your post fits best - this helps others find your content')
  }

  // Warning-based tips
  if (warnings.some(w => w.includes('profanity') || w.includes('inappropriate'))) {
    tips.push('Consider reviewing your language to ensure it follows community guidelines')
  }

  if (warnings.some(w => w.includes('spam'))) {
    tips.push('Avoid repetitive content, excessive links, or promotional language')
  }

  if (warnings.some(w => w.includes('formatting'))) {
    tips.push('Use formatting sparingly for better readability')
  }

  // General tips
  if (tips.length === 0) {
    tips.push(
      'Write clear, engaging content that adds value to the community',
      'Use relevant tags to help others discover your post',
      'Consider your audience when choosing post type and content'
    )
  }

  return (
    <div className="space-y-2">
      {tips.map((tip, index) => (
        <div key={index} style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}>
          <span style={{
  width: '4px',
  height: '4px',
  borderRadius: '50%'
}} />
          <span>{tip}</span>
        </div>
      ))}
    </div>
  )
}

// Real-time validation indicator
export const ValidationIndicator = ({ validation, field, size = 'sm' }) => {
  if (!validation) return null

  const errors = field ? (validation.errors[field] || []) : Object.values(validation.errors).flat()
  const warnings = field ? [] : validation.warnings // Field warnings handled separately
  
  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0

  if (!hasErrors && !hasWarnings) {
    return (
      <CheckCircle 
        size={size === 'sm' ? 14 : 16} 
        className="text-success"
        title="Valid"
      />
    )
  }

  if (hasErrors) {
    return (
      <AlertTriangle 
        size={size === 'sm' ? 14 : 16} 
        className="text-error"
        title={`${errors.length} error${errors.length !== 1 ? 's' : ''}`}
      />
    )
  }

  return (
    <AlertCircle 
      size={size === 'sm' ? 14 : 16} 
      className="text-warning"
      title={`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}
    />
  )
}

// Progress indicator for post completion
export const PostCompletionIndicator = ({ validation, postData }) => {
  if (!validation?.summary) return null

  const { readinessScore, hasErrors } = validation.summary
  const steps = [
    { name: 'Title', completed: !!postData?.title, required: true },
    { name: 'Content', completed: !!postData?.content, required: postData?.type === 'text' },
    { name: 'Community', completed: !!postData?.communityId, required: true },
    { name: 'Media', completed: postData?.attachments?.length > 0, required: ['image', 'video'].includes(postData?.type) },
    { name: 'Validation', completed: !hasErrors, required: false }
  ]

  const completedSteps = steps.filter(step => step.completed || !step.required).length
  const totalSteps = steps.length

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
        <div style={{
  width: '64px',
  borderRadius: '50%'
}}>
          <div 
            style={{
  borderRadius: '50%'
}}
            style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-secondary text-xs">
          {completedSteps}/{totalSteps}
        </span>
      </div>
      
      <ValidationIndicator validation={validation} size="sm" />
      
      <span className="text-secondary">
        {readinessScore}% ready
      </span>
    </div>
  )
}




export default ValidationDisplay
