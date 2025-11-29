import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../contexts/ToastContext'

const DRAFT_STORAGE_KEY = 'cryb_post_drafts'
const AUTO_SAVE_DELAY = 3000 // 3 seconds
const MAX_DRAFTS = 10

export const useDraftManager = (initialData = {}) => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const autoSaveTimeoutRef = useRef(null)
  const [drafts, setDrafts] = useState([])
  const [currentDraft, setCurrentDraft] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  // Load drafts from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      loadDrafts()
    }
  }, [user?.id])

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && currentDraft) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveDraft()
      }, AUTO_SAVE_DELAY)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [hasUnsavedChanges, currentDraft])

  // Load drafts from localStorage
  const loadDrafts = useCallback(() => {
    try {
      const userId = user?.id
      if (!userId) return

      const storedDrafts = localStorage.getItem(`${DRAFT_STORAGE_KEY}_${userId}`)
      if (storedDrafts) {
        const parsedDrafts = JSON.parse(storedDrafts)
        setDrafts(parsedDrafts.filter(draft => draft && draft.id))
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
      showToast('Failed to load drafts', 'error')
    }
  }, [user?.id, showToast])

  // Save drafts to localStorage
  const saveDraftsToStorage = useCallback((draftsToSave) => {
    try {
      const userId = user?.id
      if (!userId) return

      // Keep only the most recent drafts
      const sortedDrafts = draftsToSave
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
        .slice(0, MAX_DRAFTS)

      localStorage.setItem(`${DRAFT_STORAGE_KEY}_${userId}`, JSON.stringify(sortedDrafts))
      setDrafts(sortedDrafts)
    } catch (error) {
      console.error('Error saving drafts:', error)
      showToast('Failed to save drafts', 'error')
    }
  }, [user?.id, showToast])

  // Create a new draft
  const createDraft = useCallback((data = {}) => {
    const newDraft = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: data.title || '',
      content: data.content || '',
      communityId: data.communityId || '',
      type: data.type || 'text',
      url: data.url || '',
      nsfw: data.nsfw || false,
      spoiler: data.spoiler || false,
      tags: data.tags || [],
      visibility: data.visibility || 'public',
      allowComments: data.allowComments !== false,
      sendNotifications: data.sendNotifications !== false,
      scheduledFor: data.scheduledFor || null,
      pollOptions: data.pollOptions || ['', ''],
      pollDuration: data.pollDuration || 7,
      attachments: data.attachments || [],
      flairId: data.flairId || null,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1
    }

    setCurrentDraft(newDraft)
    setHasUnsavedChanges(false)
    setLastSaved(new Date())

    return newDraft
  }, [])

  // Load an existing draft
  const loadDraft = useCallback((draftId) => {
    const draft = drafts.find(d => d.id === draftId)
    if (draft) {
      setCurrentDraft({ ...draft })
      setHasUnsavedChanges(false)
      setLastSaved(new Date(draft.lastModified))
      return draft
    }
    return null
  }, [drafts])

  // Update current draft
  const updateDraft = useCallback((updates) => {
    if (!currentDraft) return

    const updatedDraft = {
      ...currentDraft,
      ...updates,
      lastModified: new Date().toISOString(),
      version: (currentDraft.version || 1) + 1
    }

    setCurrentDraft(updatedDraft)
    setHasUnsavedChanges(true)
  }, [currentDraft])

  // Save current draft manually
  const saveDraft = useCallback(async (showNotification = true) => {
    if (!currentDraft || !user?.id) return

    try {
      setIsAutoSaving(true)

      const draftToSave = {
        ...currentDraft,
        lastModified: new Date().toISOString()
      }

      // Update drafts array
      const updatedDrafts = drafts.filter(d => d.id !== currentDraft.id)
      updatedDrafts.unshift(draftToSave)

      // Save to storage
      saveDraftsToStorage(updatedDrafts)

      // Try to save to server if available
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            ...draftToSave,
            isDraft: true
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.id) {
            // Update draft with server ID
            draftToSave.serverId = result.data.id
            const finalDrafts = drafts.filter(d => d.id !== currentDraft.id)
            finalDrafts.unshift(draftToSave)
            saveDraftsToStorage(finalDrafts)
          }
        }
      } catch (serverError) {
      }

      setCurrentDraft(draftToSave)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())

      if (showNotification) {
        showToast('Draft saved successfully', 'success')
      }

      return draftToSave
    } catch (error) {
      console.error('Error saving draft:', error)
      if (showNotification) {
        showToast('Failed to save draft', 'error')
      }
      throw error
    } finally {
      setIsAutoSaving(false)
    }
  }, [currentDraft, user?.id, drafts, saveDraftsToStorage, showToast])

  // Auto-save current draft
  const autoSaveDraft = useCallback(async () => {
    if (!currentDraft || !hasUnsavedChanges) return

    try {
      await saveDraft(false) // Don't show notification for auto-save
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [currentDraft, hasUnsavedChanges, saveDraft])

  // Delete a draft
  const deleteDraft = useCallback(async (draftId) => {
    try {
      const draftToDelete = drafts.find(d => d.id === draftId)
      if (!draftToDelete) return

      // Delete from server if it has a server ID
      if (draftToDelete.serverId) {
        try {
          await fetch(`/api/posts/${draftToDelete.serverId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        } catch (serverError) {
        }
      }

      // Remove from local storage
      const updatedDrafts = drafts.filter(d => d.id !== draftId)
      saveDraftsToStorage(updatedDrafts)

      // Clear current draft if it's the one being deleted
      if (currentDraft?.id === draftId) {
        setCurrentDraft(null)
        setHasUnsavedChanges(false)
        setLastSaved(null)
      }

      showToast('Draft deleted', 'info')
    } catch (error) {
      console.error('Error deleting draft:', error)
      showToast('Failed to delete draft', 'error')
    }
  }, [drafts, currentDraft, saveDraftsToStorage, showToast])

  // Clear all drafts
  const clearAllDrafts = useCallback(async () => {
    try {
      const userId = user?.id
      if (!userId) return

      // Delete from server
      for (const draft of drafts) {
        if (draft.serverId) {
          try {
            await fetch(`/api/posts/${draft.serverId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            })
          } catch (serverError) {
          }
        }
      }

      // Clear local storage
      localStorage.removeItem(`${DRAFT_STORAGE_KEY}_${userId}`)
      setDrafts([])
      setCurrentDraft(null)
      setHasUnsavedChanges(false)
      setLastSaved(null)

      showToast('All drafts cleared', 'info')
    } catch (error) {
      console.error('Error clearing drafts:', error)
      showToast('Failed to clear drafts', 'error')
    }
  }, [user?.id, drafts, showToast])

  // Publish a draft
  const publishDraft = useCallback(async (draftId) => {
    try {
      const draft = drafts.find(d => d.id === draftId)
      if (!draft) throw new Error('Draft not found')

      // Create post data without draft flag
      const postData = {
        ...draft,
        isDraft: false
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(postData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to publish post')
      }

      const result = await response.json()

      // Delete the draft after successful publishing
      await deleteDraft(draftId)

      showToast('Post published successfully!', 'success')
      return result.data
    } catch (error) {
      console.error('Error publishing draft:', error)
      showToast(error.message || 'Failed to publish post', 'error')
      throw error
    }
  }, [drafts, deleteDraft, showToast])

  // Get draft summary for display
  const getDraftSummary = useCallback((draft) => {
    if (!draft) return {}

    const wordCount = draft.content ? draft.content.trim().split(/\s+/).length : 0
    const hasMedia = draft.attachments && draft.attachments.length > 0
    const isScheduled = !!draft.scheduledFor

    return {
      wordCount,
      hasMedia,
      isScheduled,
      type: draft.type,
      community: draft.communityId,
      lastModified: new Date(draft.lastModified),
      age: getTimeAgo(new Date(draft.lastModified))
    }
  }, [])

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Restore from backup (if available)
  const restoreFromBackup = useCallback(() => {
    try {
      const userId = user?.id
      if (!userId) return null

      const backupKey = `${DRAFT_STORAGE_KEY}_${userId}_backup`
      const backup = localStorage.getItem(backupKey)
      
      if (backup) {
        const parsedBackup = JSON.parse(backup)
        setCurrentDraft(parsedBackup)
        setHasUnsavedChanges(true)
        showToast('Draft restored from backup', 'info')
        return parsedBackup
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
    }
    return null
  }, [user?.id, showToast])

  // Create backup
  const createBackup = useCallback(() => {
    try {
      const userId = user?.id
      if (!userId || !currentDraft) return

      const backupKey = `${DRAFT_STORAGE_KEY}_${userId}_backup`
      localStorage.setItem(backupKey, JSON.stringify(currentDraft))
    } catch (error) {
      console.error('Error creating backup:', error)
    }
  }, [user?.id, currentDraft])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      // Create backup when leaving
      if (hasUnsavedChanges && currentDraft) {
        createBackup()
      }
    }
  }, [hasUnsavedChanges, currentDraft, createBackup])

  return {
    // State
    drafts,
    currentDraft,
    hasUnsavedChanges,
    isAutoSaving,
    lastSaved,

    // Actions
    createDraft,
    loadDraft,
    updateDraft,
    saveDraft,
    deleteDraft,
    clearAllDrafts,
    publishDraft,
    restoreFromBackup,

    // Utilities
    getDraftSummary,
    loadDrafts,

    // Setters for direct manipulation
    setHasUnsavedChanges,
    setCurrentDraft
  }
}

export default useDraftManager