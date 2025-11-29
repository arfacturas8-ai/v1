import React from 'react'
import { useResponsive } from '../hooks/useResponsive'

const TermsAcceptanceModal = ({ isOpen, onAccept, onDecline }) => {
  const { isMobile } = useResponsive()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Terms of Service</h2>
          <div className="max-h-96 overflow-y-auto text-gray-300 text-sm sm:text-base space-y-4 mb-6">
            <p>By using CRYB, you agree to our Terms of Service and Privacy Policy.</p>
            <p>Please review these documents carefully before continuing.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onDecline}
              className="flex-1 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors min-h-[44px]"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAcceptanceModal
