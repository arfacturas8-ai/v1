import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Calendar, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'
import apiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useLoadingAnnouncement, useErrorAnnouncement } from '../utils/accessibility'

const EventsCalendarPage = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [view, setView] = useState('month') // month, week, day
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    type: 'general'
  })

  // Accessibility announcements
  useLoadingAnnouncement(loading, 'Loading events calendar')
  useErrorAnnouncement(error)

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents()
    }
  }, [isAuthenticated, currentDate])

  const loadEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const response = await apiService.get('/events', {
        params: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      })

      if (response.success && response.data) {
        setEvents(response.data.events || [])
      } else {
        setEvents([])
      }
    } catch (err) {
      console.error('Failed to load events:', err)
      setError(err.message || 'Failed to load events. Please try again.')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()

    if (!newEvent.title || !newEvent.startDate) {
      setError('Please provide event title and start date')
      return
    }

    try {
      const response = await apiService.post('/events', newEvent)

      if (response.success) {
        setShowCreateModal(false)
        setNewEvent({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          location: '',
          type: 'general'
        })
        loadEvents()
      } else {
        setError(response.error || 'Failed to create event')
      }
    } catch (err) {
      console.error('Failed to create event:', err)
      setError(err.message || 'Failed to create event')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      const response = await apiService.delete(`/events/${eventId}`)

      if (response.success) {
        setSelectedEvent(null)
        loadEvents()
      } else {
        setError(response.error || 'Failed to delete event')
      }
    } catch (err) {
      console.error('Failed to delete event:', err)
      setError(err.message || 'Failed to delete event')
    }
  }

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }, [currentDate])

  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }, [currentDate])

  const handleToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: null, isCurrentMonth: false })
    }

    return days
  }

  const getEventsForDay = (day) => {
    if (!day) return []

    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return events.filter(event => {
      const eventDate = new Date(event.startDate)
      return eventDate.toDateString() === dayDate.toDateString()
    })
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center" role="main" aria-label="Events calendar page">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#58a6ff] mx-auto mb-4"></div>
          <p className="text-[#8b949e]">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen bg-[#0d1117]" role="main" aria-label="Events calendar page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Events Calendar</h1>
          <p className="text-[#8b949e]">Manage and view upcoming events</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white px-4 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all"
          aria-label="Create new event"
        >
          <Plus size={20} aria-hidden="true" />
          New Event
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl mb-4" role="alert">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm underline hover:no-underline"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-[#21262d] rounded-lg transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={20} className="text-[#c9d1d9]" />
              </button>
              <h2 className="text-xl font-bold text-white min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-[#21262d] rounded-lg transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={20} className="text-[#c9d1d9]" />
              </button>
            </div>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-[#21262d] border border-white/10 text-white rounded-lg hover:bg-[#30363d] transition-colors"
              aria-label="Go to today"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 sm:p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-[#8b949e] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          {events.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Calendar size={64} className="mx-auto mb-4 text-[#58a6ff]" />
              <h3 className="text-xl text-white mb-2">No Events</h3>
              <p className="text-[#8b949e] mb-6">You don't have any events scheduled yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
                aria-label="Create your first event"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((dayObj, index) => {
                const dayEvents = dayObj.isCurrentMonth ? getEventsForDay(dayObj.day) : []
                const isToday = dayObj.isCurrentMonth &&
                  dayObj.day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear()

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 rounded-lg border ${
                      dayObj.isCurrentMonth
                        ? isToday
                          ? 'border-[#58a6ff] bg-[#58a6ff]/10'
                          : 'border-white/10 bg-[#0d1117]/50'
                        : 'border-transparent bg-transparent'
                    }`}
                  >
                    {dayObj.day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-[#58a6ff]' : 'text-[#c9d1d9]'
                        }`}>
                          {dayObj.day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="w-full text-left px-2 py-1 text-xs rounded bg-[#58a6ff]/20 text-[#58a6ff] hover:bg-[#58a6ff]/30 transition-colors truncate"
                              aria-label={`View event: ${event.title}`}
                            >
                              {event.title}
                            </button>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-[#8b949e] px-2">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-[#161b22] border border-white/10 rounded-2xl max-w-lg w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-title"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <h3 id="event-title" className="text-xl font-bold text-white">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#8b949e] hover:text-white transition-colors"
                aria-label="Close event details"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedEvent.description && (
                <p className="text-[#c9d1d9]">{selectedEvent.description}</p>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[#8b949e]">
                  <Clock size={18} className="text-[#58a6ff]" aria-hidden="true" />
                  <span>{new Date(selectedEvent.startDate).toLocaleString()}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-[#8b949e]">
                    <MapPin size={18} className="text-[#58a6ff]" aria-hidden="true" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-center gap-3 text-[#8b949e]">
                    <Users size={18} className="text-[#58a6ff]" aria-hidden="true" />
                    <span>{selectedEvent.attendees.length} attendees</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                aria-label="Delete event"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-[#21262d] border border-white/10 hover:bg-[#30363d] text-white rounded-lg transition-colors"
                aria-label="Close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-[#161b22] border border-white/10 rounded-2xl max-w-lg w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-title"
          >
            <div className="p-6 border-b border-white/10">
              <h3 id="create-event-title" className="text-xl font-bold text-white">Create New Event</h3>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] transition-colors"
                  placeholder="Enter event title"
                  required
                  aria-label="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] transition-colors resize-none"
                  rows={3}
                  placeholder="Enter event description"
                  aria-label="Event description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] transition-colors"
                  required
                  aria-label="Start date and time"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] transition-colors"
                  aria-label="End date and time"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] transition-colors"
                  placeholder="Enter event location"
                  aria-label="Event location"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#21262d] border border-white/10 hover:bg-[#30363d] text-white rounded-lg transition-colors"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                  aria-label="Create event"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

EventsCalendarPage.propTypes = {}

export default EventsCalendarPage
