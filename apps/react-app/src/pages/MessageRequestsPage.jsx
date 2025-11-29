import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Check, X, Clock, User } from 'lucide-react'
import { PageSkeleton } from '../components/LoadingSkeleton'
import { useResponsive } from '../hooks/useResponsive'

export default function MessageRequestsPage() {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending, accepted, declined

  useEffect(() => {
    fetchMessageRequests()
  }, [filter])

  const fetchMessageRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/messages/requests?status=${filter}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Fetch requests error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async (requestId) => {
    try {
      await fetch(`/api/messages/requests/${requestId}/accept`, {
        method: 'POST',
        credentials: 'include'
      })
      fetchMessageRequests()
    } catch (error) {
      console.error('Accept request error:', error)
    }
  }

  const handleDecline = async (requestId) => {
    try {
      await fetch(`/api/messages/requests/${requestId}/decline`, {
        method: 'POST',
        credentials: 'include'
      })
      fetchMessageRequests()
    } catch (error) {
      console.error('Decline request error:', error)
    }
  }
  return (
    <div role="main" aria-label="Message requests page" className="min-h-screen bg-[#0d1117] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-[32px] font-bold text-white mb-2">
            Message Requests
          </h1>
          <p className="text-sm md:text-base text-[#8b949e] leading-relaxed">
            Review messages from people you don't follow
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'declined', label: 'Declined' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 md:px-5 py-2.5 md:py-3 bg-transparent border-none border-b-2 font-semibold cursor-pointer -mb-px transition-all text-sm md:text-base ${
                filter === tab.id
                  ? 'border-[#58a6ff] text-[#58a6ff]'
                  : 'border-transparent text-[#8b949e]'
              }`}
              aria-label={`View ${tab.label} requests`}
              aria-pressed={filter === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <PageSkeleton type="feed" />
        ) : requests.length === 0 ? (
          <div className="text-center py-12 md:py-20 px-4 md:px-5 bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10">
            <MessageCircle size={isMobile ? 48 : 64} color="#8b949e" className="mx-auto mb-4 md:mb-6" />
            <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">
              No {filter} message requests
            </h3>
            <p className="text-sm md:text-base text-[#8b949e] leading-relaxed">
              When people send you messages, they'll appear here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((request, index) => (
              <MessageRequestCard
                key={request.id || index}
                request={request}
                onAccept={() => handleAccept(request.id)}
                onDecline={() => handleDecline(request.id)}
                showActions={filter === 'pending'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

