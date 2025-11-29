/**
 * Comprehensive post validation utilities
 * Handles client-side validation for all post types and content
 */

// Validation rules configuration
const VALIDATION_RULES = {
  title: {
    minLength: 3,
    maxLength: 300,
    required: true,
    forbidden: ['[deleted]', '[removed]', 'null', 'undefined'],
    profanity: true
  },
  content: {
    maxLength: 40000,
    required: false, // Depends on post type
    profanity: true,
    spam: true
  },
  url: {
    required: false, // Depends on post type
    protocols: ['http', 'https'],
    blockedDomains: ['spam.com', 'malicious.site'],
    maxLength: 2048
  },
  tags: {
    maxCount: 10,
    maxLength: 50,
    minLength: 2,
    allowedChars: /^[a-zA-Z0-9_-]+$/,
    forbidden: ['spam', 'test', 'temp']
  },
  poll: {
    minOptions: 2,
    maxOptions: 6,
    optionMaxLength: 200,
    minDuration: 1,
    maxDuration: 30
  },
  media: {
    maxFiles: 20,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
    },
    maxDimensions: {
      width: 8192,
      height: 8192
    }
  }
}

// Profanity detection (basic implementation)
const PROFANITY_LIST = [
  // Add actual profanity words here in production
  'badword1', 'badword2', 'spam', 'scam'
]

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{10,}/g, // Repeated characters
  /click here/gi,
  /limited time/gi,
  /act now/gi,
  /congratulations/gi,
  /you have won/gi,
  /free money/gi,
  /(buy|sale|discount).*(now|today|urgent)/gi
]

/**
 * Main validation function for posts
 */
export const validatePost = (postData, options = {}) => {
  const errors = {}
  const warnings = []
  const { strict = false, draftMode = false } = options

  try {
    // Validate title
    const titleValidation = validateTitle(postData.title, { required: !draftMode })
    if (titleValidation.errors.length > 0) {
      errors.title = titleValidation.errors
    }
    warnings.push(...titleValidation.warnings)

    // Validate content based on post type
    const contentValidation = validateContent(postData.content, postData.type, { required: !draftMode })
    if (contentValidation.errors.length > 0) {
      errors.content = contentValidation.errors
    }
    warnings.push(...contentValidation.warnings)

    // Validate URL for link posts
    if (postData.type === 'link') {
      const urlValidation = validateUrl(postData.url, { required: !draftMode })
      if (urlValidation.errors.length > 0) {
        errors.url = urlValidation.errors
      }
      warnings.push(...urlValidation.warnings)
    }

    // Validate poll options for poll posts
    if (postData.type === 'poll') {
      const pollValidation = validatePoll(postData.pollOptions, postData.pollDuration, { required: !draftMode })
      if (pollValidation.errors.length > 0) {
        errors.poll = pollValidation.errors
      }
      warnings.push(...pollValidation.warnings)
    }

    // Validate media attachments
    if (postData.attachments && postData.attachments.length > 0) {
      const mediaValidation = validateMedia(postData.attachments, postData.type)
      if (mediaValidation.errors.length > 0) {
        errors.media = mediaValidation.errors
      }
      warnings.push(...mediaValidation.warnings)
    }

    // Validate tags
    if (postData.tags && postData.tags.length > 0) {
      const tagValidation = validateTags(postData.tags)
      if (tagValidation.errors.length > 0) {
        errors.tags = tagValidation.errors
      }
      warnings.push(...tagValidation.warnings)
    }

    // Validate community requirement
    if (!draftMode && !postData.communityId) {
      errors.community = ['Please select a community for your post']
    }

    // Validate scheduled date
    if (postData.scheduledFor) {
      const scheduleValidation = validateSchedule(postData.scheduledFor)
      if (scheduleValidation.errors.length > 0) {
        errors.schedule = scheduleValidation.errors
      }
      warnings.push(...scheduleValidation.warnings)
    }

    // Cross-validation checks
    const crossValidation = performCrossValidation(postData, { strict, draftMode })
    Object.assign(errors, crossValidation.errors)
    warnings.push(...crossValidation.warnings)

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings: warnings.filter(Boolean),
      summary: generateValidationSummary(postData, errors, warnings)
    }

  } catch (error) {
    console.error('Validation error:', error)
    return {
      isValid: false,
      errors: { general: ['Validation failed due to an unexpected error'] },
      warnings: [],
      summary: { hasErrors: true, errorCount: 1 }
    }
  }
}

/**
 * Validate post title
 */
export const validateTitle = (title = '', options = {}) => {
  const errors = []
  const warnings = []
  const { required = true } = options

  // Required check
  if (required && !title.trim()) {
    errors.push('Title is required')
    return { errors, warnings }
  }

  if (!title.trim()) {
    return { errors, warnings }
  }

  // Length validation
  if (title.length < VALIDATION_RULES.title.minLength) {
    errors.push(`Title must be at least ${VALIDATION_RULES.title.minLength} characters`)
  }

  if (title.length > VALIDATION_RULES.title.maxLength) {
    errors.push(`Title must be less than ${VALIDATION_RULES.title.maxLength} characters`)
  }

  // Forbidden words
  const lowerTitle = title.toLowerCase()
  const forbiddenFound = VALIDATION_RULES.title.forbidden.find(word => 
    lowerTitle.includes(word.toLowerCase())
  )
  if (forbiddenFound) {
    errors.push(`Title contains forbidden word: "${forbiddenFound}"`)
  }

  // Profanity check
  if (VALIDATION_RULES.title.profanity && containsProfanity(title)) {
    errors.push('Title contains inappropriate language')
  }

  // Character validation
  if (title.includes('<') || title.includes('>')) {
    errors.push('Title cannot contain HTML tags')
  }

  // Warnings
  if (title.length > VALIDATION_RULES.title.maxLength * 0.9) {
    warnings.push('Title is getting quite long')
  }

  if (title.split(' ').length > 20) {
    warnings.push('Consider making your title more concise')
  }

  if (title.toUpperCase() === title && title.length > 10) {
    warnings.push('ALL CAPS titles may be perceived as shouting')
  }

  return { errors, warnings }
}

/**
 * Validate post content
 */
export const validateContent = (content = '', type = 'text', options = {}) => {
  const errors = []
  const warnings = []
  const { required = true } = options

  // Required check based on post type
  const isContentRequired = required && (type === 'text' || !content.trim())
  if (isContentRequired && !content.trim()) {
    if (type === 'text') {
      errors.push('Content is required for text posts')
    }
    return { errors, warnings }
  }

  if (!content.trim()) {
    return { errors, warnings }
  }

  // Length validation
  if (content.length > VALIDATION_RULES.content.maxLength) {
    errors.push(`Content must be less than ${VALIDATION_RULES.content.maxLength.toLocaleString()} characters`)
  }

  // Profanity check
  if (VALIDATION_RULES.content.profanity && containsProfanity(content)) {
    warnings.push('Content may contain inappropriate language')
  }

  // Spam detection
  if (VALIDATION_RULES.content.spam && containsSpam(content)) {
    errors.push('Content appears to be spam')
  }

  // HTML/Script injection check
  if (content.includes('<script') || content.includes('javascript:')) {
    errors.push('Content cannot contain scripts or executable code')
  }

  // Excessive formatting check
  const formattingCount = (content.match(/\*\*|__|\*|_|~~|`/g) || []).length
  if (formattingCount > content.length * 0.3) {
    warnings.push('Excessive formatting may affect readability')
  }

  // Link validation within content
  const urls = extractUrls(content)
  if (urls.length > 10) {
    warnings.push('Too many links may be flagged as spam')
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /(.+\n){20,}/g, // Too many line breaks
    /(.{1,10}\s+){50,}/g, // Too many short fragments
    /([A-Z]{3,}\s*){10,}/g // Too many caps words
  ]

  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      warnings.push('Content structure may affect readability')
    }
  })

  return { errors, warnings }
}

/**
 * Validate URL for link posts
 */
export const validateUrl = (url = '', options = {}) => {
  const errors = []
  const warnings = []
  const { required = true } = options

  if (required && !url.trim()) {
    errors.push('URL is required for link posts')
    return { errors, warnings }
  }

  if (!url.trim()) {
    return { errors, warnings }
  }

  // Length check
  if (url.length > VALIDATION_RULES.url.maxLength) {
    errors.push(`URL is too long (max ${VALIDATION_RULES.url.maxLength} characters)`)
  }

  // URL format validation
  try {
    const urlObj = new URL(url)
    
    // Protocol validation
    if (!VALIDATION_RULES.url.protocols.includes(urlObj.protocol.slice(0, -1))) {
      errors.push('URL must use HTTP or HTTPS protocol')
    }

    // Blocked domains check
    if (VALIDATION_RULES.url.blockedDomains.includes(urlObj.hostname)) {
      errors.push('This domain is not allowed')
    }

    // Suspicious URL patterns
    if (urlObj.hostname.includes('bit.ly') || urlObj.hostname.includes('tinyurl')) {
      warnings.push('Shortened URLs may be flagged by users - consider using the full URL')
    }

    // Check for suspicious patterns
    if (urlObj.pathname.includes('..') || urlObj.search.includes('<')) {
      errors.push('URL contains suspicious patterns')
    }

  } catch (error) {
    errors.push('Invalid URL format')
  }

  return { errors, warnings }
}

/**
 * Validate poll options and settings
 */
export const validatePoll = (options = [], duration = 7, settings = {}) => {
  const errors = []
  const warnings = []
  const { required = true } = settings

  const validOptions = options.filter(opt => opt && opt.trim())

  if (required && validOptions.length < VALIDATION_RULES.poll.minOptions) {
    errors.push(`Poll must have at least ${VALIDATION_RULES.poll.minOptions} options`)
  }

  if (validOptions.length > VALIDATION_RULES.poll.maxOptions) {
    errors.push(`Poll cannot have more than ${VALIDATION_RULES.poll.maxOptions} options`)
  }

  // Validate each option
  validOptions.forEach((option, index) => {
    if (option.length > VALIDATION_RULES.poll.optionMaxLength) {
      errors.push(`Poll option ${index + 1} is too long (max ${VALIDATION_RULES.poll.optionMaxLength} characters)`)
    }

    if (containsProfanity(option)) {
      warnings.push(`Poll option ${index + 1} may contain inappropriate language`)
    }
  })

  // Check for duplicate options
  const duplicates = validOptions.filter((option, index) => 
    validOptions.indexOf(option) !== index
  )
  if (duplicates.length > 0) {
    errors.push('Poll options must be unique')
  }

  // Duration validation
  if (duration < VALIDATION_RULES.poll.minDuration || duration > VALIDATION_RULES.poll.maxDuration) {
    errors.push(`Poll duration must be between ${VALIDATION_RULES.poll.minDuration} and ${VALIDATION_RULES.poll.maxDuration} days`)
  }

  return { errors, warnings }
}

/**
 * Validate media attachments
 */
export const validateMedia = (attachments = [], postType = 'image') => {
  const errors = []
  const warnings = []

  if (attachments.length > VALIDATION_RULES.media.maxFiles) {
    errors.push(`Too many files (max ${VALIDATION_RULES.media.maxFiles})`)
  }

  let totalSize = 0
  attachments.forEach((file, index) => {
    const fileErrors = []
    
    // Size validation
    if (file.size > VALIDATION_RULES.media.maxFileSize) {
      fileErrors.push(`File ${index + 1} is too large (max ${VALIDATION_RULES.media.maxFileSize / 1024 / 1024}MB)`)
    }
    
    totalSize += file.size || 0

    // Type validation
    const allowedTypes = VALIDATION_RULES.media.allowedTypes[postType] || []
    if (file.type && !allowedTypes.includes(file.type)) {
      fileErrors.push(`File ${index + 1} type not allowed for ${postType} posts`)
    }

    // Dimension validation (for images)
    if (file.type?.startsWith('image/') && file.width && file.height) {
      if (file.width > VALIDATION_RULES.media.maxDimensions.width || 
          file.height > VALIDATION_RULES.media.maxDimensions.height) {
        warnings.push(`File ${index + 1} has very large dimensions`)
      }
    }

    // Name validation
    if (file.name && (file.name.includes('<') || file.name.includes('>'))) {
      fileErrors.push(`File ${index + 1} name contains invalid characters`)
    }

    if (fileErrors.length > 0) {
      errors.push(...fileErrors)
    }
  })

  // Total size warning
  if (totalSize > 100 * 1024 * 1024) { // 100MB
    warnings.push('Large total file size may slow down upload')
  }

  return { errors, warnings }
}

/**
 * Validate tags
 */
export const validateTags = (tags = []) => {
  const errors = []
  const warnings = []

  if (tags.length > VALIDATION_RULES.tags.maxCount) {
    errors.push(`Too many tags (max ${VALIDATION_RULES.tags.maxCount})`)
  }

  tags.forEach((tag, index) => {
    if (!tag || !tag.trim()) {
      errors.push(`Tag ${index + 1} is empty`)
      return
    }

    const cleanTag = tag.trim()

    if (cleanTag.length < VALIDATION_RULES.tags.minLength) {
      errors.push(`Tag "${cleanTag}" is too short (min ${VALIDATION_RULES.tags.minLength} characters)`)
    }

    if (cleanTag.length > VALIDATION_RULES.tags.maxLength) {
      errors.push(`Tag "${cleanTag}" is too long (max ${VALIDATION_RULES.tags.maxLength} characters)`)
    }

    if (!VALIDATION_RULES.tags.allowedChars.test(cleanTag)) {
      errors.push(`Tag "${cleanTag}" contains invalid characters (only letters, numbers, hyphens, and underscores allowed)`)
    }

    if (VALIDATION_RULES.tags.forbidden.includes(cleanTag.toLowerCase())) {
      errors.push(`Tag "${cleanTag}" is not allowed`)
    }
  })

  // Check for duplicates
  const uniqueTags = [...new Set(tags.map(tag => tag.toLowerCase()))]
  if (uniqueTags.length !== tags.length) {
    warnings.push('Duplicate tags have been removed')
  }

  return { errors, warnings }
}

/**
 * Validate scheduled date
 */
export const validateSchedule = (scheduledFor) => {
  const errors = []
  const warnings = []

  if (!scheduledFor) {
    return { errors, warnings }
  }

  const scheduledDate = new Date(scheduledFor)
  const now = new Date()
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

  // Past date check
  if (scheduledDate <= now) {
    errors.push('Scheduled time must be in the future')
  }

  // Too far in future
  if (scheduledDate > oneYearFromNow) {
    errors.push('Cannot schedule more than 1 year in advance')
  }

  // Near future warning
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
  if (scheduledDate < fiveMinutesFromNow) {
    warnings.push('Scheduling very soon - consider posting immediately')
  }

  return { errors, warnings }
}

/**
 * Cross-validation checks
 */
const performCrossValidation = (postData, options = {}) => {
  const errors = {}
  const warnings = []
  const { strict, draftMode } = options

  // Type-specific content requirements
  if (!draftMode) {
    switch (postData.type) {
      case 'link':
        if (!postData.url && !postData.content) {
          errors.linkContent = ['Link posts must have either a URL or description']
        }
        break
      case 'poll':
        if (!postData.pollOptions || postData.pollOptions.filter(opt => opt.trim()).length < 2) {
          errors.pollContent = ['Poll posts must have at least 2 options']
        }
        break
      case 'image':
      case 'video':
        if (!postData.attachments || postData.attachments.length === 0) {
          errors.mediaContent = [`${postData.type} posts must have at least one ${postData.type} file`]
        }
        break
    }
  }

  // NSFW content validation
  if (postData.nsfw && postData.type === 'text' && (!postData.content || postData.content.length < 50)) {
    warnings.push('NSFW text posts should provide adequate content description')
  }

  // Spoiler validation
  if (postData.spoiler && !postData.content) {
    warnings.push('Spoiler posts should include content explaining the spoiler context')
  }

  // Community-specific checks (would be enhanced with actual community data)
  if (strict && postData.communityId) {
    // Example: Check if post type is allowed in community
    // This would use actual community rules in production
  }

  return { errors, warnings }
}

/**
 * Generate validation summary
 */
const generateValidationSummary = (postData, errors, warnings) => {
  const errorCount = Object.values(errors).flat().length
  const warningCount = warnings.length
  
  const contentLength = (postData.content || '').length
  const hasMedia = postData.attachments && postData.attachments.length > 0
  const isScheduled = !!postData.scheduledFor

  return {
    hasErrors: errorCount > 0,
    hasWarnings: warningCount > 0,
    errorCount,
    warningCount,
    contentLength,
    hasMedia,
    isScheduled,
    readinessScore: calculateReadinessScore(postData, errorCount, warningCount)
  }
}

/**
 * Calculate post readiness score (0-100)
 */
const calculateReadinessScore = (postData, errorCount, warningCount) => {
  let score = 100

  // Deduct for errors (major impact)
  score -= errorCount * 25

  // Deduct for warnings (minor impact)
  score -= warningCount * 5

  // Bonus for completeness
  if (postData.title && postData.title.length > 10) score += 5
  if (postData.content && postData.content.length > 50) score += 5
  if (postData.tags && postData.tags.length > 0) score += 3
  if (postData.communityId) score += 10

  return Math.max(0, Math.min(100, score))
}

/**
 * Helper functions
 */
const containsProfanity = (text) => {
  const lowerText = text.toLowerCase()
  return PROFANITY_LIST.some(word => lowerText.includes(word))
}

const containsSpam = (text) => {
  return SPAM_PATTERNS.some(pattern => pattern.test(text))
}

const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}

/**
 * Real-time validation for live feedback
 */
export const validateFieldRealTime = (fieldName, value, postData = {}) => {
  switch (fieldName) {
    case 'title':
      return validateTitle(value, { required: false })
    case 'content':
      return validateContent(value, postData.type || 'text', { required: false })
    case 'url':
      return validateUrl(value, { required: false })
    case 'tags':
      return validateTags(value)
    default:
      return { errors: [], warnings: [] }
  }
}

export default {
  validatePost,
  validateTitle,
  validateContent,
  validateUrl,
  validatePoll,
  validateMedia,
  validateTags,
  validateSchedule,
  validateFieldRealTime,
  VALIDATION_RULES
}