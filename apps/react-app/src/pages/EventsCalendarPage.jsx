/*
 * EventsCalendarPage.jsx
 *
 * Modern iOS-styled events calendar with month view
 * Features: Clean #FAFAFA background, white cards with subtle shadows,
 * gradient accent buttons, and smooth hover animations
 */

import React, { useState, useEffect, useCallback } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
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
  const [view, setView] = useState('month')
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    type: 'general'
  })

  const eventCategories = {
    general: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366F1', border: 'rgba(99, 102, 241, 0.3)', hover: 'rgba(99, 102, 241, 0.2)' },
    meeting: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)', hover: 'rgba(139, 92, 246, 0.2)' },
    workshop: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)', hover: 'rgba(16, 185, 129, 0.2)' },
    social: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)', hover: 'rgba(245, 158, 11, 0.2)' },
    deadline: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)', hover: 'rgba(239, 68, 68, 0.2)' }
  }

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

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }

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
      <div style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} role="main" aria-label="Events calendar page">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#666666', fontSize: '15px' }}>Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '16px 16px 24px',
      maxWidth: '1600px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#FAFAFA'
    }} role="main" aria-label="Events calendar page">
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth < 640 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: window.innerWidth < 640 ? 'flex-start' : 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: window.innerWidth < 640 ? '24px' : '32px',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '8px'
          }}>
            Events Calendar
          </h1>
          <p style={{ color: '#666666', fontSize: '15px' }}>
            Manage and view upcoming events
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '16px',
            fontWeight: '600',
            fontSize: '15px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}
          aria-label="Create new event"
        >
          <Plus size={20} aria-hidden="true" />
          New Event
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          color: '#EF4444',
          padding: '16px',
          borderRadius: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }} role="alert">
          <p style={{ margin: 0, marginBottom: '8px' }}>
            {typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}
          </p>
          <button
            onClick={() => setError(null)}
            style={{
              fontSize: '14px',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: '#EF4444',
              cursor: 'pointer',
              padding: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'none'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'underline'}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 350px',
        gap: '24px'
      }}>
        {/* Calendar Section */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          {/* Calendar Header */}
          <div style={{
            padding: window.innerWidth < 640 ? '16px' : '24px',
            borderBottom: '1px solid #F0F0F0'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: window.innerWidth < 640 ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  onClick={handlePrevMonth}
                  style={{
                    padding: '8px',
                    background: '#FAFAFA',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F0F0F0'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FAFAFA'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={24} style={{ color: '#666666' }} />
                </button>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#000000',
                  minWidth: '200px',
                  textAlign: 'center'
                }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={handleNextMonth}
                  style={{
                    padding: '8px',
                    background: '#FAFAFA',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F0F0F0'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FAFAFA'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                  aria-label="Next month"
                >
                  <ChevronRight size={24} style={{ color: '#666666' }} />
                </button>
              </div>
              <button
                onClick={handleToday}
                style={{
                  padding: '8px 16px',
                  background: '#FAFAFA',
                  border: '1px solid #E5E5E5',
                  color: '#000000',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F0F0F0'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FAFAFA'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                aria-label="Go to today"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ padding: window.innerWidth < 640 ? '16px' : '24px' }}>
            {/* Day headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              marginBottom: '8px'
            }}>
              {dayNames.map(day => (
                <div key={day} style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#666666',
                  padding: '8px'
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            {events.length === 0 && !loading ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 0'
              }}>
                <Calendar size={48} style={{
                  color: '#6366F1',
                  margin: '0 auto 16px'
                }} />
                <h3 style={{
                  fontSize: '20px',
                  color: '#000000',
                  marginBottom: '8px',
                  fontWeight: '600'
                }}>
                  No Events
                </h3>
                <p style={{
                  color: '#666666',
                  marginBottom: '24px',
                  fontSize: '15px'
                }}>
                  You don't have any events scheduled yet
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    fontWeight: '600',
                    fontSize: '15px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                  aria-label="Create your first event"
                >
                  Create Your First Event
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '8px'
              }}>
                {getDaysInMonth().map((dayObj, index) => {
                  const dayEvents = dayObj.isCurrentMonth ? getEventsForDay(dayObj.day) : []
                  const isToday = dayObj.isCurrentMonth &&
                    dayObj.day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear()

                  return (
                    <div
                      key={index}
                      style={{
                        minHeight: '100px',
                        padding: '8px',
                        borderRadius: '12px',
                        border: dayObj.isCurrentMonth
                          ? isToday
                            ? '2px solid #6366F1'
                            : '1px solid #E5E5E5'
                          : 'none',
                        background: dayObj.isCurrentMonth
                          ? isToday
                            ? 'rgba(99, 102, 241, 0.1)'
                            : '#FAFAFA'
                          : 'transparent',
                        cursor: dayObj.isCurrentMonth ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        boxShadow: isToday ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (dayObj.isCurrentMonth && !isToday) {
                          e.currentTarget.style.background = '#F5F5F5'
                          e.currentTarget.style.borderColor = '#CCCCCC'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (dayObj.isCurrentMonth && !isToday) {
                          e.currentTarget.style.background = '#FAFAFA'
                          e.currentTarget.style.borderColor = '#E5E5E5'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }
                      }}
                    >
                      {dayObj.day && (
                        <>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '4px',
                            color: isToday ? '#6366F1' : '#666666'
                          }}>
                            {dayObj.day}
                          </div>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            {dayEvents.slice(0, 2).map(event => {
                              const categoryStyle = getCategoryStyle(event.type)
                              return (
                                <button
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    borderRadius: '8px',
                                    border: `1px solid ${categoryStyle.border}`,
                                    background: categoryStyle.bg,
                                    color: categoryStyle.text,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = categoryStyle.hover
                                    e.currentTarget.style.transform = 'translateX(2px)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = categoryStyle.bg
                                    e.currentTarget.style.transform = 'translateX(0)'
                                  }}
                                  aria-label={`View event: ${event.title}`}
                                >
                                  {event.title}
                                </button>
                              )
                            })}
                            {dayEvents.length > 2 && (
                              <div style={{
                                fontSize: '12px',
                                color: '#666666',
                                padding: '0 8px',
                                fontWeight: '500'
                              }}>
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
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          height: 'fit-content',
          position: 'sticky',
          top: '24px'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #F0F0F0'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={24} style={{ color: '#6366F1' }} aria-hidden="true" />
              Upcoming Events
            </h2>
          </div>
          <div style={{ padding: '24px' }}>
            {getUpcomingEvents().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 0'
              }}>
                <Calendar size={48} style={{
                  color: '#666666',
                  margin: '0 auto 12px'
                }} />
                <p style={{
                  color: '#666666',
                  fontSize: '14px'
                }}>
                  No upcoming events
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {getUpcomingEvents().map(event => {
                  const categoryStyle = getCategoryStyle(event.type)
                  const eventDate = new Date(event.startDate)
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '16px',
                        background: '#FAFAFA',
                        border: '1px solid #E5E5E5',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F5F5F5'
                        e.currentTarget.style.borderColor = '#CCCCCC'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FAFAFA'
                        e.currentTarget.style.borderColor = '#E5E5E5'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      aria-label={`View event: ${event.title}`}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <div style={{
                          textAlign: 'center',
                          minWidth: '48px'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            color: '#666666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontWeight: '500'
                          }}>
                            {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#000000'
                          }}>
                            {eventDate.getDate()}
                          </div>
                        </div>
                        <div style={{
                          flex: 1,
                          minWidth: 0
                        }}>
                          <h3 style={{
                            fontWeight: '600',
                            color: '#000000',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '15px',
                            transition: 'color 0.2s ease'
                          }}>
                            {event.title}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            color: '#666666',
                            marginBottom: '8px'
                          }}>
                            <Clock size={20} aria-hidden="true" />
                            {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            fontSize: '12px',
                            borderRadius: '8px',
                            background: categoryStyle.bg,
                            color: categoryStyle.text,
                            border: `1px solid ${categoryStyle.border}`,
                            fontWeight: '500'
                          }}>
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '24px',
              maxWidth: '512px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-title"
          >
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #F0F0F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <h3 id="event-title" style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: '8px'
                }}>
                  {selectedEvent.title}
                </h3>
                {selectedEvent.type && (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    fontSize: '12px',
                    borderRadius: '12px',
                    background: getCategoryStyle(selectedEvent.type).bg,
                    color: getCategoryStyle(selectedEvent.type).text,
                    border: `1px solid ${getCategoryStyle(selectedEvent.type).border}`,
                    fontWeight: '600'
                  }}>
                    {selectedEvent.type}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  color: '#666666',
                  background: '#FAFAFA',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#000000'
                  e.currentTarget.style.background = '#F0F0F0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#666666'
                  e.currentTarget.style.background = '#FAFAFA'
                }}
                aria-label="Close event details"
              >
                <X size={24} />
              </button>
            </div>
            <div style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {selectedEvent.description && (
                <p style={{
                  color: '#666666',
                  lineHeight: '1.6',
                  fontSize: '15px'
                }}>
                  {selectedEvent.description}
                </p>
              )}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#666666',
                  fontSize: '14px'
                }}>
                  <Clock size={20} style={{ color: '#6366F1' }} aria-hidden="true" />
                  <span>{new Date(selectedEvent.startDate).toLocaleString()}</span>
                </div>
                {selectedEvent.location && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#666666',
                    fontSize: '14px'
                  }}>
                    <MapPin size={20} style={{ color: '#6366F1' }} aria-hidden="true" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#666666',
                    fontSize: '14px'
                  }}>
                    <Users size={20} style={{ color: '#6366F1' }} aria-hidden="true" />
                    <span>{selectedEvent.attendees.length} attendees</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{
              padding: '24px',
              borderTop: '1px solid #F0F0F0',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#EF4444',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                aria-label="Delete event"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  padding: '10px 16px',
                  background: '#FAFAFA',
                  border: '1px solid #E5E5E5',
                  color: '#000000',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F0F0F0'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FAFAFA'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '24px',
              maxWidth: '512px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-title"
          >
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #F0F0F0',
              position: 'sticky',
              top: 0,
              background: '#FFFFFF',
              zIndex: 10,
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px'
            }}>
              <h3 id="create-event-title" style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#000000'
              }}>
                Create New Event
              </h3>
            </div>
            <form onSubmit={handleCreateEvent} style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#000000',
                  marginBottom: '8px'
                }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#FAFAFA',
                    border: '1px solid #E5E5E5',
                    borderRadius: '16px',
                    color: '#000000',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter event title"
                  required
                  aria-label="Event title"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#000000',
                  marginBottom: '8px'
                }}>
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#FAFAFA',
                    border: '1px solid #E5E5E5',
                    borderRadius: '16px',
                    color: '#000000',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  rows={3}
                  placeholder="Enter event description"
                  aria-label="Event description"
                />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '8px'
                  }}>
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#FAFAFA',
                      border: '1px solid #E5E5E5',
                      borderRadius: '16px',
                      color: '#000000',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    required
                    aria-label="Start date and time"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '8px'
                  }}>
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#FAFAFA',
                      border: '1px solid #E5E5E5',
                      borderRadius: '16px',
                      color: '#000000',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    aria-label="End date and time"
                  />
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#000000',
                  marginBottom: '8px'
                }}>
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#FAFAFA',
                    border: '1px solid #E5E5E5',
                    borderRadius: '16px',
                    color: '#000000',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter event location"
                  aria-label="Event location"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#000000',
                  marginBottom: '8px'
                }}>
                  Event Type *
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#FAFAFA',
                    border: '1px solid #E5E5E5',
                    borderRadius: '16px',
                    color: '#000000',
                    fontSize: '15px',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  required
                  aria-label="Event type"
                >
                  <option value="general">General</option>
                  <option value="meeting">Meeting</option>
                  <option value="workshop">Workshop</option>
                  <option value="social">Social</option>
                  <option value="deadline">Deadline</option>
                </select>
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {Object.entries(eventCategories).map(([key, style]) => (
                    <span
                      key={key}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        background: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                        fontWeight: '500'
                      }}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                paddingTop: '16px',
                borderTop: '1px solid #F0F0F0'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#FAFAFA',
                    border: '1px solid #E5E5E5',
                    color: '#000000',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F0F0F0'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FAFAFA'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
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
