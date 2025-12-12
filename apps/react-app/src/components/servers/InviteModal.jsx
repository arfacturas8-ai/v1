import React, { useState } from 'react'
import { X, Users, Globe, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button, Input } from '../ui'
import serverService from '../../services/serverService'
import { useResponsive } from '../../hooks/useResponsive'
import { getErrorMessage } from '../../utils/errorUtils'

function InviteModal({ onClose, onJoin }) {
  const { isMobile, isTablet } = useResponsive()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [inviteData, setInviteData] = useState(null)

  const handleInviteCodeChange = (e) => {
    const code = e.target.value.trim()
    setInviteCode(code)
    setError('')
    setInviteData(null)
  }

  const handleValidate = async () => {
    if (!inviteCode) {
      setError('Please enter an invite code')
      return
    }

    setValidating(true)
    setError('')

    try {
      const result = await serverService.validateInvite(inviteCode)

      if (result.success && result.invite) {
        setInviteData(result.invite)
      } else {
        setError(getErrorMessage(result.error, 'Invalid or expired invite code')
      }
    } catch (err) {
      console.error('Failed to validate invite:', err)
      setError('Failed to validate invite code')
    } finally {
      setValidating(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode) {
      setError('Please enter an invite code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await serverService.joinByInvite(inviteCode)

      if (result.success && result.server) {
        onJoin(result.server)
      } else {
        setError(getErrorMessage(result.error, 'Failed to join server')
      }
    } catch (err) {
      console.error('Failed to join server:', err)
      setError('Failed to join server')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (inviteData) {
        handleJoin()
      } else {
        handleValidate()
      }
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-[rgba(22,27,34,0.6)] backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between border-b border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Join a Server
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Instructions */}
          <p className="text-sm sm:text-base text-gray-300">
            Enter an invite code to join a server
          </p>

          {/* Invite Code Input */}
          <div className="space-y-3">
            <label className="block text-sm sm:text-base font-medium text-white">
              Invite Code
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Input
                type="text"
                value={inviteCode}
                onChange={handleInviteCodeChange}
                onKeyPress={handleKeyPress}
                placeholder="e.g., abc123xyz"
                disabled={loading || validating}
                autoFocus
                className="flex-1"
              />
              {!inviteData && (
                <Button
                  onClick={handleValidate}
                  loading={validating}
                  disabled={!inviteCode || loading}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Check
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Invite codes look like: abc123xyz or https://cryb.ai/invite/abc123xyz
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 sm:p-4 border border-red-500/20 bg-red-500/10 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-red-300 flex-1">{error}</p>
            </div>
          )}

          {/* Invite Preview */}
          {inviteData && (
            <div className="space-y-4">
              <div className="rounded-xl p-3 sm:p-4 border border-white/10 bg-white/5 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-medium text-white">Valid Invite</p>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      You've been invited to join:
                    </p>
                  </div>
                </div>

                <div className="bg-[rgba(22,27,34,0.6)] rounded-xl p-3 sm:p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    {/* Server Icon */}
                    <div className="flex-shrink-0">
                      {inviteData.server?.icon ? (
                        <img
                          src={inviteData.server.icon}
                          alt={inviteData.server.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {inviteData.server?.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                      )}
                    </div>

                    {/* Server Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-bold text-white truncate">
                          {inviteData.server?.name || 'Unknown Server'}
                        </h4>
                        {inviteData.server?.isPublic ? (
                          <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>

                      {inviteData.server?.description && (
                        <p className="text-xs sm:text-sm text-gray-300 mt-1 line-clamp-2">
                          {inviteData.server.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 mt-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{inviteData.server?.memberCount || 0} members</span>
                        </div>
                        {inviteData.server?.onlineCount !== undefined && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>{inviteData.server.onlineCount} online</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invite Details */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  {inviteData.inviter && (
                    <div>
                      <span className="text-xs sm:text-sm text-gray-400">Invited by:</span>
                      <p className="text-sm sm:text-base font-medium text-white">
                        {inviteData.inviter.username || 'Unknown'}
                      </p>
                    </div>
                  )}
                  {inviteData.expiresAt && (
                    <div>
                      <span className="text-xs sm:text-sm text-gray-400">Expires:</span>
                      <p className="text-sm sm:text-base font-medium text-white">
                        {new Date(inviteData.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {inviteData.maxUses && (
                    <div>
                      <span className="text-xs sm:text-sm text-gray-400">Uses:</span>
                      <p className="text-sm sm:text-base font-medium text-white">
                        {inviteData.uses || 0} / {inviteData.maxUses}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-white/10 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            loading={loading}
            disabled={!inviteData || validating}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Join Server
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InviteModal
