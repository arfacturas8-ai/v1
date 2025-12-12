import React, { useState, memo } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Vote, Loader, AlertCircle } from 'lucide-react'
import apiService from '../services/api'
import { useLoadingAnnouncement, useErrorAnnouncement } from '../utils/accessibility'

const CreateProposalPage = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('7')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Accessibility announcements
  useLoadingAnnouncement(loading, 'Submitting proposal')
  useErrorAnnouncement(error)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!title.trim()) {
      setError('Please enter a proposal title')
      return
    }

    if (title.trim().length < 10) {
      setError('Proposal title must be at least 10 characters long')
      return
    }

    if (!description.trim()) {
      setError('Please enter a proposal description')
      return
    }

    if (description.trim().length < 50) {
      setError('Proposal description must be at least 50 characters long')
      return
    }

    const durationNum = parseInt(duration, 10)
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 30) {
      setError('Voting duration must be between 1 and 30 days')
      return
    }

    setLoading(true)

    try {
      const response = await apiService.post('/proposals', {
        title: title.trim(),
        description: description.trim(),
        votingDuration: durationNum
      })

      if (response.success) {
        setSuccess(true)
        // Redirect to proposals page after a short delay
        setTimeout(() => {
          navigate('/proposals')
        }, 2000)
      } else {
        setError(response.error || 'Failed to create proposal. Please try again.')
      }
    } catch (err) {
      console.error('Failed to create proposal:', err)
      setError(err.message || 'An error occurred while creating the proposal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="main"
      aria-label="Create proposal page"
      className="min-h-screen bg-[#0D0D0D] p-4 md:p-6"
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Vote className="w-7 h-7 md:w-8 md:h-8 text-[#58a6ff]" aria-hidden="true" />
            <h1 className="text-xl md:text-2xl font-bold text-white m-0">
              Create Proposal
            </h1>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500 text-green-400 rounded-xl" role="alert">
              <p className="font-medium">Proposal created successfully!</p>
              <p className="text-sm mt-1">Redirecting to proposals page...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-xl flex items-start gap-3" role="alert">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="proposal-title" className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Title *
              </label>
              <input
                id="proposal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proposal title (min. 10 characters)"
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-[#A0A0A0] text-base outline-none focus:border-[#58a6ff]/50 transition-colors"
                disabled={loading}
                required
                minLength={10}
                aria-label="Proposal title"
              />
              <p className="text-xs text-[#666666] mt-1">{title.length}/10 minimum characters</p>
            </div>
            <div>
              <label htmlFor="proposal-description" className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Description *
              </label>
              <textarea
                id="proposal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your proposal in detail (min. 50 characters)"
                rows={6}
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-[#A0A0A0] text-base outline-none resize-y focus:border-[#58a6ff]/50 transition-colors"
                disabled={loading}
                required
                minLength={50}
                aria-label="Proposal description"
              />
              <p className="text-xs text-[#666666] mt-1">{description.length}/50 minimum characters</p>
            </div>
            <div>
              <label htmlFor="voting-duration" className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Voting Duration (days) *
              </label>
              <input
                id="voting-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="30"
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-[#A0A0A0] text-base outline-none focus:border-[#58a6ff]/50 transition-colors"
                disabled={loading}
                required
                aria-label="Voting duration in days"
              />
              <p className="text-xs text-[#666666] mt-1">Between 1 and 30 days</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] border-0 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white text-base font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-label={loading ? 'Submitting proposal' : 'Submit proposal'}
            >
              Submit Proposal
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

CreateProposalPage.propTypes = {}

export default memo(CreateProposalPage)

