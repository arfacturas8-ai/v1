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
    <div role="main" aria-label="Message requests page" style={{background: "var(--bg-primary)"}} className="min-h-screen  p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 style={{color: "var(--text-primary)"}} className="text-2xl md:text-[32px] font-bold  mb-2">
            Message Requests
          </h1>
          <p style={{color: "var(--text-secondary)"}} className="text-sm md:text-base  leading-relaxed">
            Review messages from people you don't follow
          </p>
        </div>

        {/* Filters */}
        <div style={{borderColor: "var(--border-subtle)"}} className="flex gap-2 mb-6 border-b ">
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
        {requests.length === 0 && !isLoading ? (
          <div style={{borderColor: "var(--border-subtle)"}} className="card text-center py-12 md:py-20 px-4 md:px-5   rounded-2xl  border ">
            <MessageCircle size={isMobile ? 48 : 64} color="#8b949e" className="mx-auto mb-4 md:mb-6" />
            <h3 style={{color: "var(--text-primary)"}} className="text-lg md:text-xl font-semibold  mb-3 md:mb-4">
              No {filter} message requests
            </h3>
            <p style={{color: "var(--text-secondary)"}} className="text-sm md:text-base  leading-relaxed">
              When people send you messages, they'll appear here
            </p>
          </div>
        ) : !isLoading ? (
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
        ) : null}
      </div>
    </div>
  )
}

