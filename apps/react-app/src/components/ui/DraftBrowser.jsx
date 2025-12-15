import React, { useState, useEffect } from 'react'
import { Clock, FileText, Image, Video, BarChart3, Users, Calendar, Trash2, Edit3, Send, Search, Filter, SortAsc, SortDesc } from 'lucide-react'
import useDraftManager from '../../hooks/useDraftManager'
import { useAuth } from '../../contexts/AuthContext.jsx'

const DraftBrowser = ({ 
  onDraftSelect = () => {},
  onDraftEdit = () => {},
  onDraftPublish = () => {},
  onClose = () => {},
  showInModal = false
}) => {
  const { user } = useAuth()
  const { 
    drafts, 
    loadDrafts, 
    deleteDraft, 
    clearAllDrafts, 
    publishDraft, 
    getDraftSummary 
  } = useDraftManager()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('lastModified') // lastModified, title, type, wordCount
  const [sortOrder, setSortOrder] = useState('desc') // desc, asc
  const [filterType, setFilterType] = useState('all') // all, text, link, image, video, poll
  const [selectedDrafts, setSelectedDrafts] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'text': return <FileText size={16} />
      case 'link': return <LinkIcon size={16} />
      case 'image': return <Image size={16} />
      case 'video': return <Video size={16} />
      case 'poll': return <BarChart3 size={16} />
      default: return <FileText size={16} />
    }
  }

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'text': return 'text-[#58a6ff]'
      case 'link': return 'text-emerald-500'
      case 'image': return 'text-[#a371f7]'
      case 'video': return 'text-red-500'
      case 'poll': return 'text-amber-500'
      default: return 'text-[#666666]'
    }
  }

  // Filter and sort drafts
  const processedDrafts = React.useMemo(() => {
    let filtered = drafts

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(draft => 
        draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draft.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draft.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(draft => draft.type === filterType)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'lastModified':
          comparison = new Date(b.lastModified) - new Date(a.lastModified)
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'wordCount':
          const aWords = a.content ? a.content.trim().split(/\s+/).length : 0
          const bWords = b.content ? b.content.trim().split(/\s+/).length : 0
          comparison = bWords - aWords
          break
        default:
          comparison = 0
      }

      return sortOrder === 'desc' ? comparison : -comparison
    })

    return filtered
  }, [drafts, searchTerm, filterType, sortBy, sortOrder])

  // Handle draft selection
  const handleDraftSelect = (draft) => {
    onDraftSelect(draft)
    if (showInModal) {
      onClose()
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedDrafts.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedDrafts.size} draft${selectedDrafts.size > 1 ? 's' : ''}?`
    )

    if (confirmed) {
      setIsLoading(true)
      try {
        await Promise.all(
          Array.from(selectedDrafts).map(draftId => deleteDraft(draftId))
        )
        setSelectedDrafts(new Set())
      } catch (error) {
        console.error('Error deleting drafts:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle single draft delete
  const handleDeleteDraft = async (draftId, event) => {
    event.stopPropagation()
    
    if (window.confirm('Are you sure you want to delete this draft?')) {
      setIsLoading(true)
      try {
        await deleteDraft(draftId)
      } catch (error) {
        console.error('Error deleting draft:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle publish draft
  const handlePublishDraft = async (draftId, event) => {
    event.stopPropagation()
    
    setIsLoading(true)
    try {
      const publishedPost = await publishDraft(draftId)
      onDraftPublish(publishedPost)
    } catch (error) {
      console.error('Error publishing draft:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle draft selection
  const toggleDraftSelection = (draftId, event) => {
    event.stopPropagation()
    const newSelection = new Set(selectedDrafts)
    if (newSelection.has(draftId)) {
      newSelection.delete(draftId)
    } else {
      newSelection.add(draftId)
    }
    setSelectedDrafts(newSelection)
  }

  const containerClasses = showInModal
    ? "bg-[#0A0A0B] rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden"
    : "bg-[#141416] border border-rgb(var(--color-neutral-300))/30 rounded-lg w-full"

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <Clock style={{
  width: '16px',
  height: '16px'
}} />
          </div>
          <div>
            <h2 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>Drafts</h2>
            <p style={{
  color: '#A0A0A0'
}}>
              {drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          {selectedDrafts.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isLoading}
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
            >
              <Trash2 size={16} />
              Delete ({selectedDrafts.size})
            </button>
          )}

          {showInModal && (
            <button
              onClick={onClose}
              style={{
  padding: '8px',
  borderRadius: '12px'
}}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}}>
          {/* Search */}
          <div style={{
  flex: '1',
  position: 'relative'
}}>
            <Search style={{
  position: 'absolute',
  color: '#A0A0A0'
}} size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search drafts..."
              style={{
  width: '100%',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px'
}}>
            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
            >
              <option value="all">All Types</option>
              <option value="text">Text Posts</option>
              <option value="link">Link Posts</option>
              <option value="image">Image Posts</option>
              <option value="video">Video Posts</option>
              <option value="poll">Poll Posts</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
            >
              <option value="lastModified">Last Modified</option>
              <option value="title">Title</option>
              <option value="type">Type</option>
              <option value="wordCount">Word Count</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}
            >
              {sortOrder === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />}
              {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            </button>
          </div>
        )}
      </div>

      {/* Drafts List */}
      <div style={{
  flex: '1'
}}>
        {processedDrafts.length === 0 ? (
          <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: '48px',
  paddingBottom: '48px',
  textAlign: 'center'
}}>
            <Clock style={{
  width: '48px',
  height: '48px'
}} />
            <h3 style={{
  fontWeight: '500'
}}>
              {searchTerm || filterType !== 'all' ? 'No drafts found' : 'No drafts yet'}
            </h3>
            <p className="text-secondary max-w-sm">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start writing a post and it will be automatically saved as a draft'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {processedDrafts.map((draft, index) => {
              const summary = getDraftSummary(draft)
              const isSelected = selectedDrafts.has(draft.id)

              return (
                <div
                  key={draft.id}
                  style={{
  position: 'relative',
  padding: '16px'
}}
                  onClick={() => handleDraftSelect(draft)}
                >
                  <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
                    {/* Selection Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleDraftSelection(draft.id, e)}
                        style={{
  borderRadius: '4px'
}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Type Icon */}
                    <div className={`flex-shrink-0 pt-1 ${getTypeColor(draft.type)}`}>
                      {getTypeIcon(draft.type)}
                    </div>

                    {/* Content */}
                    <div style={{
  flex: '1'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '12px'
}}>
                        <div style={{
  flex: '1'
}}>
                          <h3 style={{
  fontWeight: '500'
}}>
                            {draft.title || 'Untitled Draft'}
                          </h3>
                          
                          {draft.content && (
                            <p className="text-sm text-secondary mt-1 line-clamp-2">
                              {draft.content.substring(0, 150)}
                              {draft.content.length > 150 ? '...' : ''}
                            </p>
                          )}

                          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
                            <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                              <Clock size={12} />
                              {summary.age}
                            </span>
                            
                            {summary.wordCount > 0 && (
                              <span>{summary.wordCount} words</span>
                            )}
                            
                            {summary.hasMedia && (
                              <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                                <Image size={12} />
                                {draft.attachments?.length} file{draft.attachments?.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            
                            {draft.communityId && (
                              <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                                <Users size={12} />
                                Community
                              </span>
                            )}
                            
                            {summary.isScheduled && (
                              <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                                <Calendar size={12} />
                                Scheduled
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {draft.tags && draft.tags.length > 0 && (
                            <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px'
}}>
                              {draft.tags.slice(0, 3).map((tag, tagIndex) => (
                                <span 
                                  key={tagIndex}
                                  style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}
                                >
                                  #{tag}
                                </span>
                              ))}
                              {draft.tags.length > 3 && (
                                <span className="text-xs text-secondary">
                                  +{draft.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDraftEdit(draft)
                            }}
                            style={{
  padding: '8px',
  borderRadius: '12px'
}}
                            title="Edit draft"
                          >
                            <Edit3 size={14} />
                          </button>
                          
                          <button
                            onClick={(e) => handlePublishDraft(draft.id, e)}
                            disabled={isLoading}
                            style={{
  padding: '8px',
  borderRadius: '12px'
}}
                            title="Publish draft"
                          >
                            <Send size={14} />
                          </button>
                          
                          <button
                            onClick={(e) => handleDeleteDraft(draft.id, e)}
                            disabled={isLoading}
                            style={{
  padding: '8px',
  borderRadius: '12px'
}}
                            title="Delete draft"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover Actions Overlay */}
                  <div style={{
  position: 'absolute'
}}>
                    <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDraftEdit(draft)
                        }}
                        style={{
  padding: '8px',
  borderRadius: '12px'
}}
                        title="Edit draft"
                      >
                        <Edit3 size={14} />
                      </button>
                      
                      <button
                        onClick={(e) => handlePublishDraft(draft.id, e)}
                        disabled={isLoading}
                        style={{
  padding: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
                        title="Publish draft"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {drafts.length > 0 && (
        <div style={{
  padding: '16px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div className="text-sm text-secondary">
              Showing {processedDrafts.length} of {drafts.length} drafts
            </div>
            
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all drafts? This action cannot be undone.')) {
                    clearAllDrafts()
                  }
                }}
                disabled={isLoading || drafts.length === 0}
                className="text-sm text-error hover:text-error/80 disabled:opacity-50 transition-colors"
              >
                Clear All Drafts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




export default DraftBrowser
