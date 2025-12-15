import React, { useState, useRef, useCallback, useEffect } from 'react'
import DOMPurify from 'dompurify'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Link, Upload, File, Smile, Eye, EyeOff,
  Heading1, Heading2, Heading3,
  Table, X, Send, Save
} from 'lucide-react'

const EnhancedPostEditor = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onSaveDraft,
  initialData = null,
  communities = [],
  selectedCommunity = null
}) => {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [selectedCommunityId, setSelectedCommunityId] = useState(selectedCommunity?.id || initialData?.communityId || '')
  const [flair, setFlair] = useState(initialData?.flair || '')
  const [tags, setTags] = useState(initialData?.tags || [])
  const [isPreview, setIsPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaFiles, setMediaFiles] = useState(initialData?.mediaFiles || [])
  const [linkPreviews, setLinkPreviews] = useState([])
  const [mentionSuggestions, setMentionSuggestions] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [postSettings, setPostSettings] = useState({
    nsfw: initialData?.nsfw || false,
    spoiler: initialData?.spoiler || false,
    oc: initialData?.oc || false,
    notifications: true,
    scheduled: false,
    scheduledDate: null
  })
  
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const cursorPos = useRef({ start: 0, end: 0 })

  useEffect(() => {
    if (isOpen) {
      // Load draft from localStorage
      const savedDraft = localStorage.getItem('cryb_post_draft')
      if (savedDraft && !initialData) {
        const draft = JSON.parse(savedDraft)
        setTitle(draft.title || '')
        setContent(draft.content || '')
        setSelectedCommunityId(draft.communityId || '')
        setTags(draft.tags || [])
        setFlair(draft.flair || '')
      }
    }
  }, [isOpen, initialData])

  // Auto-save draft
  useEffect(() => {
    if (title || content) {
      const draft = {
        title,
        content,
        communityId: selectedCommunityId,
        tags,
        flair,
        timestamp: Date.now()
      }
      localStorage.setItem('cryb_post_draft', JSON.stringify(draft))
    }
  }, [title, content, selectedCommunityId, tags, flair])

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      mediaFiles.forEach(file => {
        if (file.url && file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url)
        }
      })
    }
  }, [mediaFiles])

  const insertText = useCallback((text, selectText = false) => {
    const editor = editorRef.current
    if (!editor) return

    const start = editor.selectionStart
    const end = editor.selectionEnd
    const newContent = content.substring(0, start) + text + content.substring(end)
    
    setContent(newContent)
    
    setTimeout(() => {
      editor.focus()
      if (selectText && text.includes('[]')) {
        const bracketStart = start + text.indexOf('[')
        const bracketEnd = start + text.indexOf(']') + 1
        editor.setSelectionRange(bracketStart, bracketEnd)
      } else {
        editor.setSelectionRange(start + text.length, start + text.length)
      }
    }, 0)
  }, [content])

  const formatText = useCallback((format) => {
    const editor = editorRef.current
    if (!editor) return

    const start = editor.selectionStart
    const end = editor.selectionEnd
    const selectedText = content.substring(start, end)
    
    let formattedText = selectedText
    let wrapText = ''
    
    switch (format) {
      case 'bold':
        wrapText = '**'
        formattedText = `**${selectedText || 'bold text'}**`
        break
      case 'italic':
        wrapText = '*'
        formattedText = `*${selectedText || 'italic text'}*`
        break
      case 'underline':
        formattedText = `<u>${selectedText || 'underlined text'}</u>`
        break
      case 'strikethrough':
        formattedText = `~~${selectedText || 'strikethrough text'}~~`
        break
      case 'code':
        formattedText = selectedText.includes('\n') 
          ? `\`\`\`\n${selectedText || 'code block'}\n\`\`\``
          : `\`${selectedText || 'inline code'}\``
        break
      case 'quote':
        formattedText = `> ${selectedText || 'quoted text'}`
        break
      case 'h1':
        formattedText = `# ${selectedText || 'Heading 1'}`
        break
      case 'h2':
        formattedText = `## ${selectedText || 'Heading 2'}`
        break
      case 'h3':
        formattedText = `### ${selectedText || 'Heading 3'}`
        break
      case 'list':
        formattedText = `- ${selectedText || 'List item'}`
        break
      case 'numbered':
        formattedText = `1. ${selectedText || 'Numbered item'}`
        break
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`
        break
      case 'table':
        formattedText = `| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |`
        break
      case 'divider':
        formattedText = '\n---\n'
        break
    }

    insertText(formattedText, format === 'link')
  }, [content, insertText])

  const handleFileUpload = useCallback((files) => {
    const validFiles = Array.from(files).filter(file => {
      const maxSize = 50 * 1024 * 1024 // 50MB
      const validTypes = /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm|pdf|doc|docx)$/i
      return file.size <= maxSize && validTypes.test(file.name)
    })

    validFiles.forEach(file => {
      // Use object URL instead of base64 (faster and more memory-efficient)
      const objectUrl = URL.createObjectURL(file)

      const newFile = {
        id: Date.now() + Math.random(),
        file,
        url: objectUrl,
        type: file.type.split('/')[0],
        name: file.name,
        size: file.size
      }
      setMediaFiles(prev => [...prev, newFile])

      // Auto-insert media markdown
      if (file.type.startsWith('image/')) {
        insertText(`![${file.name}](${newFile.id})\n`)
      } else if (file.type.startsWith('video/')) {
        insertText(`[Video: ${file.name}](${newFile.id})\n`)
      } else {
        insertText(`[📎 ${file.name}](${newFile.id})\n`)
      }
    })
  }, [insertText])

  const detectMentionsAndLinks = useCallback((text) => {
    // Detect @mentions
    const mentionRegex = /@(\w+)/g
    const mentions = [...text.matchAll(mentionRegex)].map(match => match[1])
    
    // Detect URLs for link previews
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = [...text.matchAll(urlRegex)].map(match => match[0])
    
    // Fetch link previews
    urls.forEach(async (url) => {
      if (!linkPreviews.find(p => p.url === url)) {
        try {
          const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
          if (response.ok) {
            const preview = await response.json()
            setLinkPreviews(prev => [...prev, { url, ...preview }])
          }
        } catch (error) {
          console.error('Failed to fetch link preview:', error)
        }
      }
    })

    // Fetch mention suggestions
    if (mentions.length > 0) {
      // This would typically fetch from an API
      setMentionSuggestions(mentions.map(username => ({ username, avatar: null })))
    }
  }, [linkPreviews])

  useEffect(() => {
    detectMentionsAndLinks(content)
  }, [content, detectMentionsAndLinks])

  const renderPreview = () => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([^```]+)```/g, '<pre><code>$1</code></pre>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
      .replace(/\n/g, '<br>')
  }

  const handleSubmit = async () => {
    if (!title.trim() || !selectedCommunityId) return

    setIsSubmitting(true)
    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        communityId: selectedCommunityId,
        flair,
        tags,
        mediaFiles,
        settings: postSettings,
        linkPreviews
      }

      await onSubmit(postData)
      
      // Clear draft
      localStorage.removeItem('cryb_post_draft')
      onClose()
    } catch (error) {
      console.error('Failed to submit post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveDraft = () => {
    const draft = {
      title,
      content,
      communityId: selectedCommunityId,
      flair,
      tags,
      mediaFiles,
      settings: postSettings,
      timestamp: Date.now()
    }
    onSaveDraft?.(draft)
    localStorage.setItem('cryb_post_draft', JSON.stringify(draft))
  }

  if (!isOpen) return null

  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
      <div style={{
  borderRadius: '12px',
  width: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid var(--border-subtle)'
}}>
        {/* Header */}
        <div style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h2 style={{
  fontWeight: 'bold'
}}>Create Post</h2>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <button
                onClick={saveDraft}
                style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}
              >
                <Save style={{
  width: '16px',
  height: '16px'
}} />
                Save Draft
              </button>
              <button onClick={onClose} style={{
  padding: '8px',
  borderRadius: '12px'
}}>
                <X style={{
  width: '20px',
  height: '20px'
}} />
              </button>
            </div>
          </div>
        </div>

        <div style={{
  flex: '1',
  overflow: 'hidden',
  display: 'flex'
}}>
          {/* Main Editor */}
          <div style={{
  flex: '1',
  display: 'flex',
  flexDirection: 'column'
}}>
            {/* Community and Settings */}
            <div style={{
  padding: '16px'
}}>
              <div style={{
  display: 'flex',
  gap: '16px'
}}>
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  flex: '1'
}}
                >
                  <option value="">Select a community...</option>
                  {communities.map(community => (
                    <option key={community.id} value={community.id}>
                      c/{community.name}
                    </option>
                  ))}
                </select>
                
                {selectedCommunityId && (
                  <select
                    value={flair}
                    onChange={(e) => setFlair(e.target.value)}
                    style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
                  >
                    <option value="">No flair</option>
                    <option value="Discussion">Discussion</option>
                    <option value="Question">Question</option>
                    <option value="News">News</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Meme">Meme</option>
                  </select>
                )}
              </div>
            </div>

            {/* Title */}
            <div style={{
  padding: '16px'
}}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                style={{
  width: '100%',
  fontWeight: '500',
  background: 'transparent'
}}
                maxLength={300}
              />
              <div className="text-xs text-muted/60 mt-1">{title.length}/300</div>
            </div>

            {/* Toolbar */}
            <div style={{
  padding: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
}}>
              {/* Text Formatting */}
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <button onClick={() => formatText('bold')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Bold">
                  <Bold style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button onClick={() => formatText('italic')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Italic">
                  <Italic style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button onClick={() => formatText('strikethrough')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Strikethrough">
                  <Strikethrough style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button onClick={() => formatText('code')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Code">
                  <Code style={{
  width: '16px',
  height: '16px'
}} />
                </button>
              </div>

              <div style={{
  height: '24px'
}} />

              {/* Headers */}
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <button onClick={() => formatText('h1')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Heading 1">
                  <Heading1 style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button onClick={() => formatText('h2')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Heading 2">
                  <Heading2 style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button onClick={() => formatText('h3')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Heading 3">
                  <Heading3 style={{
  width: '16px',
  height: '16px'
}} />
                </button>
              </div>

              <div style={{
  height: '24px'
}} />

              {/* Lists and Structure */}
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <button onClick={() => formatText('list')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Bullet List">
                  <List style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button onClick={() => formatText('numbered')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Numbered List">
                  <ListOrdered style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button onClick={() => formatText('quote')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Quote">
                  <Quote style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button onClick={() => formatText('table')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Table">
                  <Table style={{
  width: '16px',
  height: '16px'
}} />
                </button>
              </div>

              <div style={{
  height: '24px'
}} />

              {/* Media and Links */}
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <button onClick={() => formatText('link')} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Link">
                  <Link style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  style={{
  padding: '8px',
  borderRadius: '12px'
}} 
                  title="Upload Media"
                >
                  <Upload style={{
  width: '16px',
  height: '16px'
}} />
                </button>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{
  padding: '8px',
  borderRadius: '12px'
}} title="Emoji">
                  <Smile style={{
  width: '16px',
  height: '16px'
}} />
                </button>
              </div>

              <div style={{
  flex: '1'
}} />

              {/* Preview Toggle */}
              <button
                onClick={() => setIsPreview(!isPreview)}
                style={{
  padding: '8px',
  borderRadius: '12px',
  color: '#ffffff'
}}
                title="Preview"
              >
                {isPreview ? <EyeOff style={{
  width: '16px',
  height: '16px'
}} /> : <Eye style={{
  width: '16px',
  height: '16px'
}} />}
              </button>
            </div>

            {/* Content Area */}
            <div style={{
  flex: '1',
  position: 'relative'
}}>
              {!isPreview ? (
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What are your thoughts?"
                  style={{
  width: '100%',
  height: '100%',
  padding: '16px',
  background: 'transparent'
}}
                  onDrop={(e) => {
                    e.preventDefault()
                    const files = e.dataTransfer.files
                    if (files.length > 0) {
                      handleFileUpload(files)
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                />
              ) : (
                <div
                  style={{
  padding: '16px',
  height: '100%'
}}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderPreview()) }}
                />
              )}

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{
  display: 'none'
}}
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div style={{
  width: '320px'
}}>
            {/* Media Files */}
            {mediaFiles.length > 0 && (
              <div style={{
  padding: '16px'
}}>
                <h3 style={{
  fontWeight: '500'
}}>Attachments</h3>
                <div className="space-y-2">
                  {mediaFiles.map(file => (
                    <div key={file.id} style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px',
  borderRadius: '12px'
}}>
                      {file.type === 'image' ? (
                        <img src={file.url} alt={file.name} style={{
  width: '32px',
  height: '32px',
  borderRadius: '4px'
}} />
                      ) : (
                        <File style={{
  width: '32px',
  height: '32px'
}} />
                      )}
                      <div style={{
  flex: '1'
}}>
                        <div style={{
  fontWeight: '500'
}}>{file.name}</div>
                        <div className="text-xs text-muted/60">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                      </div>
                      <button
                        onClick={() => {
                          // Revoke object URL to prevent memory leak
                          if (file.url && file.url.startsWith('blob:')) {
                            URL.revokeObjectURL(file.url)
                          }
                          setMediaFiles(prev => prev.filter(f => f.id !== file.id))
                        }}
                        style={{
  padding: '4px',
  borderRadius: '4px'
}}
                      >
                        <X style={{
  width: '16px',
  height: '16px'
}} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Link Previews */}
            {linkPreviews.length > 0 && (
              <div style={{
  padding: '16px'
}}>
                <h3 style={{
  fontWeight: '500'
}}>Link Previews</h3>
                <div className="space-y-3">
                  {linkPreviews.map(preview => (
                    <div key={preview.url} style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  overflow: 'hidden'
}}>
                      {preview.image && (
                        <img src={preview.image} alt="" style={{
  width: '100%',
  height: '128px'
}} />
                      )}
                      <div style={{
  padding: '12px'
}}>
                        <h4 style={{
  fontWeight: '500'
}}>{preview.title}</h4>
                        <p className="text-xs text-muted/70 mb-2">{preview.description}</p>
                        <a href={preview.url} className="text-xs text-accent" target="_blank" rel="noopener noreferrer">
                          {new URL(preview.url).hostname}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div style={{
  padding: '16px'
}}>
              <h3 style={{
  fontWeight: '500'
}}>Tags</h3>
              <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
                {tags.map(tag => (
                  <span key={tag} style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                    #{tag}
                    <button
                      onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                      style={{
  borderRadius: '4px'
}}
                    >
                      <X style={{
  width: '12px',
  height: '12px'
}} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag..."
                style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim() && !tags.includes(e.target.value.trim())) {
                    setTags(prev => [...prev, e.target.value.trim()])
                    e.target.value = ''
                  }
                }}
              />
            </div>

            {/* Post Settings */}
            <div style={{
  padding: '16px'
}}>
              <h3 style={{
  fontWeight: '500'
}}>Settings</h3>
              <div className="space-y-3">
                <label style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <input
                    type="checkbox"
                    checked={postSettings.nsfw}
                    onChange={(e) => setPostSettings(prev => ({ ...prev, nsfw: e.target.checked }))}
                    style={{
  borderRadius: '4px'
}}
                  />
                  <span className="text-sm">NSFW</span>
                </label>
                <label style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <input
                    type="checkbox"
                    checked={postSettings.spoiler}
                    onChange={(e) => setPostSettings(prev => ({ ...prev, spoiler: e.target.checked }))}
                    style={{
  borderRadius: '4px'
}}
                  />
                  <span className="text-sm">Spoiler</span>
                </label>
                <label style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <input
                    type="checkbox"
                    checked={postSettings.oc}
                    onChange={(e) => setPostSettings(prev => ({ ...prev, oc: e.target.checked }))}
                    style={{
  borderRadius: '4px'
}}
                  />
                  <span className="text-sm">Original Content</span>
                </label>
                <label style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <input
                    type="checkbox"
                    checked={postSettings.notifications}
                    onChange={(e) => setPostSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                    style={{
  borderRadius: '4px'
}}
                  />
                  <span className="text-sm">Send me reply notifications</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <span>Draft auto-saved</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <button
              onClick={onClose}
              style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !selectedCommunityId || isSubmitting}
              style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}
            >
              {isSubmitting ? (
                <>
                  <div style={{
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}} />
                  Posting...
                </>
              ) : (
                <>
                  <Send style={{
  width: '16px',
  height: '16px'
}} />
                  Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



export default EnhancedPostEditor