import React, { useState, useEffect, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, Search, Users, UserPlus, Check } from 'lucide-react'

/**
 * NewMessageModal Component
 * Modal for creating new direct messages or group DMs
 * Includes user search, selection, and group creation
 */
const NewMessageModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [isGroupDM, setIsGroupDM] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)

  // Load users
  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setUsers([
        { id: 1, username: 'alice', avatar: '🐱', status: 'online' },
        { id: 2, username: 'bob', avatar: '🐶', status: 'idle' },
        { id: 3, username: 'charlie', avatar: '🦊', status: 'offline' },
        { id: 4, username: 'diana', avatar: '🐼', status: 'online' },
        { id: 5, username: 'eve', avatar: '🐨', status: 'dnd' }
      ])
    } catch (err) {
      setError('Failed to load users')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const query = searchQuery.toLowerCase()
    return users.filter(user =>
      user.username.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  // Toggle user selection
  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id)
      if (isSelected) {
        return prev.filter(u => u.id !== user.id)
      } else {
        return [...prev, user]
      }
    })

    // Auto-enable group DM if multiple users selected
    if (selectedUsers.length >= 1) {
      setIsGroupDM(true)
    }
  }

  // Create conversation
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return

    setIsLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      // Navigate to the new conversation
      const conversationId = `conv_${Date.now()}`
      navigate(`/messages/${conversationId}`)
      onClose()
    } catch (err) {
      setError('Failed to create conversation')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#22c55e'
      case 'idle': return '#f59e0b'
      case 'dnd': return '#ef4444'
      default: return '#6b7280'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{background: "var(--bg-primary)"}} className="fixed inset-0 z-50 flex items-center justify-center /60 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-message-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '640px',
            maxHeight: '80vh',
            background: 'rgba(22, 27, 34, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{borderColor: "var(--border-subtle)"}} className="flex items-center justify-between p-6 border-b ">
            <h2 id="new-message-title" style={{color: "var(--text-primary)"}} className="text-2xl font-bold ">
              New Message
            </h2>
            <button
              onClick={onClose}
              style={{color: "var(--text-secondary)"}} className="p-2 hover:bg-[#FFFFFF] rounded-lg transition-colors "
              aria-label="Close modal"
            >
              <X style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
          </div>

          {/* Search */}
          <div style={{borderColor: "var(--border-subtle)"}} className="p-6 border-b ">
            <div className="relative">
              <Search style={{ color: "var(--text-secondary)", width: "24px", height: "24px", flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                style={{borderColor: "var(--border-subtle)"}} className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border  rounded-2xl  focus:outline-none focus:border-[#000000]  placeholder-[#8b949e]"
                aria-label="Search users"
              />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <motion.div
                    key={user.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{color: "var(--text-primary)"}} className="flex items-center gap-2 px-3 py-2 bg-[#000000]/20 rounded-lg "
                  >
                    <span className="text-2xl">{user.avatar}</span>
                    <span className="font-medium text-sm">{user.username}</span>
                    <button
                      onClick={() => toggleUserSelection(user)}
                      className="p-1 hover:bg-[#000000]/30 rounded"
                      aria-label={`Remove ${user.username}`}
                    >
                      <X style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Group DM Options */}
            {isGroupDM && selectedUsers.length > 1 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4"
              >
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  style={{borderColor: "var(--border-subtle)"}} className="w-full px-4 py-3 bg-[#FFFFFF] border  rounded-2xl  focus:outline-none focus:border-[#000000]  placeholder-[#8b949e]"
                  aria-label="Group name"
                />
              </motion.div>
            )}
          </div>

          {/* User List */}
          <div className="overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div style={{ width: "48px", height: "48px", flexShrink: 0 }} />
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-400" role="alert">
                {typeof error === 'string' ? error : 'An error occurred'}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{color: "var(--text-secondary)"}} className="p-6 text-center ">
                No users found
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredUsers.map(user => {
                  const isSelected = selectedUsers.some(u => u.id === user.id)
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user)}
                      className={`w-full flex items-center gap-4 p-3 rounded-2xl  transition-all ${
                        isSelected
                          ? 'bg-[#000000]/20 ring-2 ring-[#000000]'
                          : 'hover:bg-[#FFFFFF]'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div className="relative">
                        <div className="text-3xl">{user.avatar}</div>
                        <div
                          style={{ width: "24px", height: "24px", flexShrink: 0, backgroundColor: getStatusColor(user.status) }}
                          aria-label={`Status: ${user.status}`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div style={{color: "var(--text-primary)"}} className="font-medium ">
                          {user.username}
                        </div>
                        <div style={{color: "var(--text-secondary)"}} className="text-sm  capitalize">
                          {user.status}
                        </div>
                      </div>
                      {isSelected && (
                        <Check style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{borderColor: "var(--border-subtle)"}} className="p-6 border-t  flex gap-3">
            <button
              onClick={onClose}
              style={{borderColor: "var(--border-subtle)"}} className="flex-1 px-6 py-3 bg-[#FFFFFF] hover:bg-[#30363d]  rounded-2xl  font-medium transition-colors border "
            >
              Cancel
            </button>
            <button
              onClick={handleCreateConversation}
              disabled={selectedUsers.length === 0 || isLoading}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontWeight: '500',
                cursor: selectedUsers.length === 0 || isLoading ? 'not-allowed' : 'pointer',
                opacity: selectedUsers.length === 0 || isLoading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <div style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              ) : (
                <>
                  {isGroupDM ? <Users style={{ width: "24px", height: "24px", flexShrink: 0 }} /> : <UserPlus style={{ width: "24px", height: "24px", flexShrink: 0 }} />}
                  {isGroupDM ? 'Create Group' : 'Start Chat'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(NewMessageModal)

