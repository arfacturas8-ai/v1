/**
 * CreateProposalPage.jsx
 * iOS-inspired modern design with clean aesthetics
 * Updated: 2025-12-19
 */

import React, { useState, memo } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
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

  useLoadingAnnouncement(loading, 'Submitting proposal')
  useErrorAnnouncement(error)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

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
      style={{ minHeight: '100vh', padding: '48px 16px', background: '#FAFAFA' }}
    >
      <div style={{ maxWidth: '768px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '48px 40px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Vote style={{ width: '32px', height: '32px', color: '#6366F1' }} aria-hidden="true" />
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#000', margin: 0 }}>
              Create Proposal
            </h1>
          </div>

          {success && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#22C55E',
              borderRadius: '16px'
            }} role="alert">
              <p style={{ fontWeight: '600', marginBottom: '4px' }}>Proposal created successfully!</p>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>Redirecting to proposals page...</p>
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'start',
              gap: '12px'
            }} role="alert">
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <p>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
              </div>
              <button
                onClick={() => setError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: '20px',
                  lineHeight: 1
                }}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label htmlFor="proposal-title" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>
                Title *
              </label>
              <input
                id="proposal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proposal title (min. 10 characters)"
                disabled={loading}
                required
                minLength={10}
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  background: 'white',
                  border: '1px solid #E5E5E5',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  color: '#000'
                }}
                aria-label="Proposal title"
              />
              <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>{title.length}/10 minimum characters</p>
            </div>
            <div>
              <label htmlFor="proposal-description" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>
                Description *
              </label>
              <textarea
                id="proposal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your proposal in detail (min. 50 characters)"
                rows={6}
                disabled={loading}
                required
                minLength={50}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'white',
                  border: '1px solid #E5E5E5',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical',
                  color: '#000',
                  lineHeight: '1.5'
                }}
                aria-label="Proposal description"
              />
              <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>{description.length}/50 minimum characters</p>
            </div>
            <div>
              <label htmlFor="voting-duration" style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>
                Voting Duration (days) *
              </label>
              <input
                id="voting-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="30"
                disabled={loading}
                required
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  background: 'white',
                  border: '1px solid #E5E5E5',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  color: '#000'
                }}
                aria-label="Voting duration in days"
              />
              <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>Between 1 and 30 days</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '56px',
                padding: '0 24px',
                background: loading ? '#E5E5E5' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                }
              }}
              aria-label={loading ? 'Submitting proposal' : 'Submit proposal'}
            >
              {loading ? (
                <>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Submitting...
                </>
              ) : (
                'Submit Proposal'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(CreateProposalPage)
