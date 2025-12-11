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

  // Event category colors
  const eventCategories = {
    general: { bg: 'bg-[#58a6ff]/20', text: 'text-[#58a6ff]', border: 'border-[#58a6ff]/30', hover: 'hover:bg-[#58a6ff]/30' },
    meeting: { bg: 'bg-[#a371f7]/20', text: 'text-[#a371f7]', border: 'border-[#a371f7]/30', hover: 'hover:bg-[#a371f7]/30' },
    workshop: { bg: 'bg-[#3fb950]/20', text: 'text-[#3fb950]', border: 'border-[#3fb950]/30', hover: 'hover:bg-[#3fb950]/30' },
    social: { bg: 'bg-[#d29922]/20', text: 'text-[#d29922]', border: 'border-[#d29922]/30', hover: 'hover:bg-[#d29922]/30' },
    deadline: { bg: 'bg-[#f85149]/20', text: 'text-[#f85149]', border: 'border-[#f85149]/30', hover: 'hover:bg-[#f85149]/30' }
  }

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

  const getUpcomingEvents = () => {
    const now = new Date()
    return events
      .filter(event => new Date(event.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5)
  }

  const getCategoryStyle = (type) => {
    return eventCategories[type] || eventCategories.general
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center" role="main" aria-label="Events calendar page">
        <div className="text-center">
          <div className=" rounded-full h-12 w-12 border-t-2 border-b-2 border-[#58a6ff] mx-auto mb-4"></div>
          <p className="text-[#666666]">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto min-h-screen bg-[#0D0D0D]" role="main" aria-label="Events calendar page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Events Calendar</h1>
          <p className="text-[#666666]">Manage and view upcoming events</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#58a6ff]/20"
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        {/* Calendar Section */}
        <div className="bg-[#141414]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={20} className="text-[#A0A0A0]" />
              </button>
              <h2 className="text-xl font-bold text-white min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={20} className="text-[#A0A0A0]" />
              </button>
            </div>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-[#1A1A1A] border border-white/10 text-white rounded-lg hover:bg-[#30363d] transition-colors"
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
              <div key={day} className="text-center text-sm font-medium text-[#666666] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          {events.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Calendar size={64} className="mx-auto mb-4 text-[#58a6ff]" />
              <h3 className="text-xl text-white mb-2">No Events</h3>
              <p className="text-[#666666] mb-6">You don't have any events scheduled yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#58a6ff]/20"
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
                    className={`min-h-[100px] p-2 rounded-lg border transition-all ${
                      dayObj.isCurrentMonth
                        ? isToday
                          ? 'border-[#58a6ff] bg-[#58a6ff]/10 shadow-[0_0_12px_rgba(88,166,255,0.2)]'
                          : 'border-white/10 bg-[#0D0D0D]/50 hover:bg-[#141414]/80 hover:border-white/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
                        : 'border-transparent bg-transparent'
                    } cursor-pointer`}
                  >
                    {dayObj.day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-[#58a6ff]' : 'text-[#A0A0A0]'
                        }`}>
                          {dayObj.day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => {
                            const categoryStyle = getCategoryStyle(event.type)
                            return (
                              <button
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={`w-full text-left px-2 py-1 text-xs rounded border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} ${categoryStyle.hover} transition-all truncate`}
                                aria-label={`View event: ${event.title}`}
                              >
                                {event.title}
                              </button>
                            )
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-[#666666] px-2">
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

        {/* Sidebar - Upcoming Events */}
        <div className="bg-[#141414]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden h-fit sticky top-6">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-[#58a6ff]" aria-hidden="true" />
              Upcoming Events
            </h2>
          </div>
          <div className="p-6">
            {getUpcomingEvents().length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={48} className="mx-auto mb-3 text-[#666666]" />
                <p className="text-[#666666] text-sm">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getUpcomingEvents().map(event => {
                  const categoryStyle = getCategoryStyle(event.type)
                  const eventDate = new Date(event.startDate)
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-4 bg-[#0D0D0D]/50 border border-white/10 rounded-xl hover:bg-[#0D0D0D]/80 hover:border-white/20 transition-all group"
                      aria-label={`View event: ${event.title}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-center min-w-[48px]">
                          <div className="text-xs text-[#666666] uppercase tracking-wide">
                            {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {eventDate.getDate()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white mb-1 truncate group-hover:text-[#58a6ff] transition-colors">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#666666] mb-2">
                            <Clock size={12} aria-hidden="true" />
                            {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span className={`inline-block px-2 py-1 text-xs rounded-md ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-[#141414]/95 backdrop-blur-xl border border-white/10 rounded-2xl max-w-lg w-full shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-title"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h3 id="event-title" className="text-xl font-bold text-white mb-2">{selectedEvent.title}</h3>
                {selectedEvent.type && (
                  <span className={`inline-block px-3 py-1 text-xs rounded-lg ${getCategoryStyle(selectedEvent.type).bg} ${getCategoryStyle(selectedEvent.type).text} border ${getCategoryStyle(selectedEvent.type).border}`}>
                    {selectedEvent.type}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#666666] hover:text-white transition-colors p-1 hover:bg-[#1A1A1A] rounded-lg"
                aria-label="Close event details"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedEvent.description && (
                <p className="text-[#A0A0A0]">{selectedEvent.description}</p>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[#666666]">
                  <Clock size={18} className="text-[#58a6ff]" aria-hidden="true" />
                  <span>{new Date(selectedEvent.startDate).toLocaleString()}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-[#666666]">
                    <MapPin size={18} className="text-[#58a6ff]" aria-hidden="true" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-center gap-3 text-[#666666]">
                    <Users size={18} className="text-[#58a6ff]" aria-hidden="true" />
                    <span>{selectedEvent.attendees.length} attendees</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 hover:border-red-500/50 rounded-lg transition-all"
                aria-label="Delete event"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-[#1A1A1A] border border-white/10 hover:bg-[#30363d] text-white rounded-lg transition-colors"
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
            className="bg-[#141414]/95 backdrop-blur-xl border border-white/10 rounded-2xl max-w-lg w-full shadow-[0_16px_48px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-title"
          >
            <div className="p-6 border-b border-white/10 sticky top-0 bg-[#141414]/95 backdrop-blur-xl z-10">
              <h3 id="create-event-title" className="text-xl font-bold text-white">Create New Event</h3>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/10 rounded-xl text-[#A0A0A0] placeholder:text-[#666666] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20 transition-all"
                  placeholder="Enter event title"
                  required
                  aria-label="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/10 rounded-xl text-[#A0A0A0] placeholder:text-[#666666] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20 transition-all resize-none"
                  rows={3}
                  placeholder="Enter event description"
                  aria-label="Event description"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/10 rounded-xl text-[#A0A0A0] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20 transition-all"
                    required
                    aria-label="Start date and time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/10 rounded-xl text-[#A0A0A0] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20 transition-all"
                    aria-label="End date and time"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/10 rounded-xl text-[#A0A0A0] placeholder:text-[#666666] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20 transition-all"
                  placeholder="Enter event location"
                  aria-label="Event location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Event Type *
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/10 rounded-xl text-[#A0A0A0] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20 transition-all cursor-pointer"
                  required
                  aria-label="Event type"
                >
                  <option value="general" className="bg-[#0D0D0D]">General</option>
                  <option value="meeting" className="bg-[#0D0D0D]">Meeting</option>
                  <option value="workshop" className="bg-[#0D0D0D]">Workshop</option>
                  <option value="social" className="bg-[#0D0D0D]">Social</option>
                  <option value="deadline" className="bg-[#0D0D0D]">Deadline</option>
                </select>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(eventCategories).map(([key, style]) => (
                    <span
                      key={key}
                      className={`px-2 py-1 text-xs rounded-md ${style.bg} ${style.text} border ${style.border}`}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 bg-[#1A1A1A] border border-white/10 hover:bg-[#30363d] text-white rounded-lg transition-colors"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#58a6ff]/20"
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
