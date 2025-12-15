import React, { useState, useEffect, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { Eye, EyeOff, Edit3, ExternalLink, Calendar, Users, Hash, AlertTriangle, Video, BarChart3, MessageCircle, ArrowUp, ArrowDown, Share, Bookmark, Award, Lock } from 'lucide-react'

const PostPreview = ({
  title = '',
  content = '',
  type = 'text',
  url = '',
  attachments = [],
  pollOptions = [],
  pollDuration = 7,
  tags = [],
  nsfw = false,
  spoiler = false,
  communityName = '',
  authorName = '',
  authorAvatar = '',
  flairName = '',
  flairColor = '',
  visibility = 'public',
  allowComments = true,
  scheduledFor = null,
  enableMarkdown = true,
  showMetadata = true,
  showEngagement = true,
  className = ''
}) => {
  const [showSpoiler, setShowSpoiler] = useState(!spoiler)
  const [selectedPollOption, setSelectedPollOption] = useState(null)

  // Process markdown content
  const processedContent = useMemo(() => {
    if (!content) return ''
    
    if (enableMarkdown) {
      return renderMarkdown(content)
    }
    
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-2">{line}</p>
    ))
  }, [content, enableMarkdown])

  // Generate link preview data (simplified)
  const linkPreview = useMemo(() => {
    if (type !== 'link' || !url) return null

    // In a real app, this would fetch actual metadata
    const domain = new URL(url).hostname
    return {
      title: `Link Preview - ${domain}`,
      description: 'This is a preview of the linked content. In a real implementation, this would show the actual page title, description, and thumbnail.',
      image: null,
      domain: domain
    }
  }, [type, url])

  // Render markdown (simplified implementation)
  function renderMarkdown(text) {
    let html = text
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-primary">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-3 text-primary">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3 text-primary">$1</h1>')
      
      // Text formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-primary">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/__(.*?)__/g, '<u class="underline">$1</u>')
      .replace(/~~(.*?)~~/g, '<del class="line-through opacity-75">$1</del>')
      .replace(/`(.*?)`/g, '<code class="bg-bg-tertiary px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      
      // Lists
      .replace(/^\* (.+$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.+$)/gm, '<li class="ml-4">$1</li>')
      
      // Quotes
      .replace(/^> (.+$)/gm, '<blockquote class="border-l-4 border-accent/30 pl-4 italic text-secondary mb-2">$1</blockquote>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent hover:text-accent/80 underline">$1</a>')
      
      // Line breaks
      .replace(/\n/g, '<br>')

    return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
  }

  // Get engagement stats (mock data)
  const engagementStats = {
    upvotes: 42,
    downvotes: 3,
    comments: 12,
    awards: 2,
    shares: 8
  }

  return (
    <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
      {/* Post Header */}
      <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          {communityName && (
            <>
              <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontWeight: '500'
}}>
                <Users size={14} />
                c/{communityName}
              </span>
              <span>•</span>
            </>
          )}
          <span>Posted by u/{authorName || 'preview_user'}</span>
          <span>•</span>
          <span>{scheduledFor ? 'Scheduled for ' + new Date(scheduledFor).toLocaleString() : 'now'}</span>
          
          {/* Status Badges */}
          {nsfw && (
            <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px',
  fontWeight: '500'
}}>
              NSFW
            </span>
          )}
          {spoiler && (
            <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px',
  fontWeight: '500'
}}>
              SPOILER
            </span>
          )}
          {visibility !== 'public' && (
            <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px',
  fontWeight: '500'
}}>
              {visibility.toUpperCase()}
            </span>
          )}
          {scheduledFor && (
            <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
              <Calendar size={12} />
              SCHEDULED
            </span>
          )}
        </div>

        {/* Flair */}
        {flairName && (
          <div className="mb-2">
            <span 
              style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  fontWeight: '500',
  borderRadius: '4px'
}}
              style={{ 
                backgroundColor: flairColor ? `${flairColor}20` : '#3B82F620',
                color: flairColor || '#3B82F6'
              }}
            >
              {flairName}
            </span>
          </div>
        )}

        {/* Post Title */}
        <h1 style={{
  fontWeight: 'bold'
}}>
          {title || 'Untitled Post'}
        </h1>

        {/* Post Type Indicator */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          {type === 'text' && <><Edit3 size={14} /> Text Post</>}
          {type === 'link' && <><LinkIcon size={14} /> Link Post</>}
          {type === 'image' && <><ImageIcon size={14} /> Image Post</>}
          {type === 'video' && <><Video size={14} /> Video Post</>}
          {type === 'poll' && <><BarChart3 size={14} /> Poll</>}
        </div>
      </div>

      {/* Post Content */}
      <div style={{
  padding: '16px'
}}>
        {/* Spoiler Overlay */}
        {spoiler && !showSpoiler && (
          <div style={{
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center'
}}>
            <AlertTriangle style={{
  width: '32px',
  height: '32px'
}} />
            <h3 style={{
  fontWeight: '600'
}}>Spoiler Content</h3>
            <p className="text-secondary text-sm mb-4">
              This post contains spoilers. Click to reveal the content.
            </p>
            <button
              onClick={() => setShowSpoiler(true)}
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
            >
              <Eye size={16} />
              Show Spoiler
            </button>
          </div>
        )}

        {/* Main Content (when not hidden by spoiler) */}
        {(!spoiler || showSpoiler) && (
          <>
            {/* Text Content */}
            {(type === 'text' || content) && (
              <div className="prose prose-sm max-w-none mb-4 text-primary">
                {processedContent || (
                  <p className="text-secondary/60 italic">No content yet...</p>
                )}
              </div>
            )}

            {/* Link Content */}
            {type === 'link' && url && (
              <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  overflow: 'hidden'
}}>
                {linkPreview ? (
                  <div style={{
  padding: '16px'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                      <ExternalLink size={14} />
                      {linkPreview.domain}
                    </div>
                    <h3 style={{
  fontWeight: '600'
}}>{linkPreview.title}</h3>
                    <p className="text-secondary text-sm mb-3">{linkPreview.description}</p>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
  fontWeight: '500'
}}
                    >
                      Visit Link →
                    </a>
                  </div>
                ) : (
                  <div style={{
  padding: '16px'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                      <ExternalLink size={14} />
                      External Link
                    </div>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
  fontWeight: '500'
}}
                    >
                      {url}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Media Attachments */}
            {(type === 'image' || type === 'video') && attachments.length > 0 && (
              <div className="mb-4">
                <h4 style={{
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  {type === 'image' ? <ImageIcon size={16} /> : <Video size={16} />}
                  {attachments.length} {type}{attachments.length !== 1 ? 's' : ''}
                </h4>
                <div style={{
  display: 'grid',
  gap: '12px'
}}>
                  {attachments.slice(0, 4).map((attachment, index) => (
                    <div key={index} style={{
  borderRadius: '12px',
  padding: '12px',
  border: '1px solid var(--border-subtle)'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                        {type === 'image' ? <ImageIcon size={16} /> : <Video size={16} />}
                        <span style={{
  fontWeight: '500'
}}>{attachment.name || `${type}_${index + 1}`}</span>
                      </div>
                      <div className="text-xs text-secondary">
                        {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(1)} MB` : 'Preview'}
                      </div>
                    </div>
                  ))}
                  {attachments.length > 4 && (
                    <div style={{
  borderRadius: '12px',
  padding: '12px',
  border: '1px solid var(--border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                      +{attachments.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Poll Content */}
            {type === 'poll' && pollOptions.length > 0 && (
              <div className="mb-4 space-y-2">
                <h4 style={{
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <BarChart3 size={16} />
                  Poll (Preview)
                </h4>
                {pollOptions.filter(option => option.trim()).map((option, index) => (
                  <div 
                    key={index}
                    style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '12px'
}}
                    onClick={() => setSelectedPollOption(selectedPollOption === index ? null : index)}
                  >
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                      <div style={{
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}}>
                        {selectedPollOption === index && (
                          <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
                        )}
                      </div>
                      <span style={{
  flex: '1'
}}>{option}</span>
                      <span className="text-sm text-secondary">0%</span>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-secondary mt-3">
                  Poll ends in {pollDuration} day{pollDuration !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
                {tags.map((tag, index) => (
                  <span 
                    key={index}
                    style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}
                  >
                    <Hash size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Footer */}
      {showEngagement && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            {/* Voting */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
              <button style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                <ArrowUp size={16} className="text-secondary hover:text-accent" />
              </button>
              <span style={{
  fontWeight: '500',
  paddingLeft: '8px',
  paddingRight: '8px'
}}>{engagementStats.upvotes - engagementStats.downvotes}</span>
              <button style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                <ArrowDown size={16} className="text-secondary hover:text-primary" />
              </button>
            </div>

            {/* Actions */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
              {allowComments && (
                <button style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  <MessageCircle size={16} />
                  {engagementStats.comments} comments
                </button>
              )}
              
              <button style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Share size={16} />
                Share
              </button>
              
              <button style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Bookmark size={16} />
                Save
              </button>

              {engagementStats.awards > 0 && (
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  <Award size={16} />
                  {engagementStats.awards}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metadata Footer */}
      {showMetadata && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
          <div className="text-xs text-secondary/80 space-y-1">
            <div>Preview Mode - This is how your post will appear to others</div>
            {scheduledFor && (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Calendar size={12} />
                Scheduled for {new Date(scheduledFor).toLocaleString()}
              </div>
            )}
            {!allowComments && (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Lock size={12} />
                Comments disabled
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spoiler Toggle (when spoiler is shown) */}
      {spoiler && showSpoiler && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
          <button
            onClick={() => setShowSpoiler(false)}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}
          >
            <EyeOff size={14} />
            Hide Spoiler
          </button>
        </div>
      )}
    </div>
  )
}




export default PostPreview
