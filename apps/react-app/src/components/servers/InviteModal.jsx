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
        setError(getErrorMessage(result.error, 'Invalid or expired invite code'))
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
        setError(getErrorMessage(result.error, 'Failed to join server'))
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
    <div style={{background: "var(--bg-primary)"}} className="fixed inset-0 flex items-center justify-center p-4 z-50 /70 backdrop-blur-sm">
      <div style={{borderColor: "var(--border-subtle)"}} className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-[rgba(22,27,34,0.6)]  rounded-2xl sm:rounded-3xl border  shadow-2xl overflow-hidden">
        {/* Header */}
        <div style={{borderColor: "var(--border-subtle)"}} className="px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between border-b ">
          <h2 style={{color: "var(--text-primary)"}} className="text-lg sm:text-xl font-bold ">
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
            <label style={{color: "var(--text-primary)"}} className="block text-sm sm:text-base font-medium ">
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
              <p className="text-sm sm:text-base text-red-300 flex-1">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            </div>
          )}

          {/* Invite Preview */}
          {inviteData && (
            <div className="space-y-4">
              <div style={{borderColor: "var(--border-subtle)"}} className="rounded-xl p-3 sm:p-4 border  bg-white/5 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p style={{color: "var(--text-primary)"}} className="text-sm sm:text-base font-medium ">Valid Invite</p>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      You've been invited to join:
                    </p>
                  </div>
                </div>

                <div style={{borderColor: "var(--border-subtle)"}} className="bg-[rgba(22,27,34,0.6)] rounded-xl p-3 sm:p-4 border ">
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
                        <div style={{color: "var(--text-primary)"}} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center  font-bold text-sm sm:text-base">
                          {inviteData.server?.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                      )}
                    </div>

                    {/* Server Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 style={{color: "var(--text-primary)"}} className="text-sm sm:text-base font-bold  truncate">
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
                <div style={{borderColor: "var(--border-subtle)"}} className="pt-3 border-t  space-y-2">
                  {inviteData.inviter && (
                    <div>
                      <span className="text-xs sm:text-sm text-gray-400">Invited by:</span>
                      <p style={{color: "var(--text-primary)"}} className="text-sm sm:text-base font-medium ">
                        {inviteData.inviter.username || 'Unknown'}
                      </p>
                    </div>
                  )}
                  {inviteData.expiresAt && (
                    <div>
                      <span className="text-xs sm:text-sm text-gray-400">Expires:</span>
                      <p style={{color: "var(--text-primary)"}} className="text-sm sm:text-base font-medium ">
                        {new Date(inviteData.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {inviteData.maxUses && (
                    <div>
                      <span className="text-xs sm:text-sm text-gray-400">Uses:</span>
                      <p style={{color: "var(--text-primary)"}} className="text-sm sm:text-base font-medium ">
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
        <div style={{borderColor: "var(--border-subtle)"}} className="px-4 sm:px-6 py-4 border-t  flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
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
