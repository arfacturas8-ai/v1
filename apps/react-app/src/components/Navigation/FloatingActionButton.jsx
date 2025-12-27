import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, Edit, Hash, MessageCircle, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { Button } from '../ui'
import { cn } from '../../lib/utils'

function FloatingActionButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide/show FAB based on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isScrollingDown = currentScrollY > lastScrollY
      const shouldHide = isScrollingDown && currentScrollY > 100

      setIsVisible(!shouldHide)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close FAB when route changes
  useEffect(() => {
    setIsExpanded(false)
  }, [location.pathname])

  // Don't show FAB if user is not authenticated
  if (!user) return null

  // Don't show FAB on certain pages where it might interfere
  const hiddenPaths = ['/submit', '/create-post', '/create-community']
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const quickActions = [
    {
      icon: Edit,
      label: 'Create Post',
      action: () => navigate('/submit'),
      gradient: 'from-[#58a6ff] to-blue-600',
      description: 'Share your thoughts'
    },
    {
      icon: Hash,
      label: 'New Community',
      action: () => navigate('/create-community'),
      gradient: 'from-green-500 to-green-600',
      description: 'Start a community'
    },
    {
      icon: MessageCircle,
      label: 'Direct Message',
      action: () => navigate('/chat'),
      gradient: 'from-purple-500 to-[#a371f7]',
      description: 'Send a message'
    },
    {
      icon: Users,
      label: 'Find Friends',
      action: () => navigate('/users'),
      gradient: 'from-orange-500 to-orange-600',
      description: 'Connect with others'
    }
  ]

  const handleActionClick = (action) => {
    action()
    setIsExpanded(false)
  }

  return (
    <div className={cn(
      "fixed bottom-20 right-4 z-40 transition-all duration-500 lg:bottom-6",
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
    )}>
      {/* Action Items */}
      <div className={cn(
        "flex flex-col items-end gap-3 mb-4 transition-all duration-300",
        isExpanded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
      )}>
        {quickActions.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}
              style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Label */}
              <div style={{
  position: 'relative'
}}>
                <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
                  <div style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>
                    {item.label}
                  </div>
                  <div style={{
  color: '#A0A0A0'
}}>
                    {item.description}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleActionClick(item.action)}
                className={cn(
                  `w-12 h-12 bg-gradient-to-r ${item.gradient} hover:scale-110 active:scale-95 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group-hover:shadow-2xl border-0 p-0`
                )}
                aria-label={item.label}
              >
                <Icon style={{
  width: '20px',
  height: '20px'
}} />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Main FAB Button */}
      <Button
        onClick={toggleExpanded}
        className={cn(
          "w-16 h-16 bg-gradient-to-r from-blue-9 to-violet-9 hover:from-blue-10 hover:to-violet-10 text-white rounded-full shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-300 flex items-center justify-center group border-0 p-0 relative overflow-hidden",
          isExpanded && "rotate-45"
        )}
        aria-label={isExpanded ? 'Close menu' : 'Quick actions'}
      >
        {/* Sparkle effect */}
        <div style={{
  position: 'absolute',
  borderRadius: '50%'
}}></div>
        
        {/* Icon */}
        <div style={{
  position: 'relative'
}}>
          {isExpanded ? (
            <X style={{
  width: '24px',
  height: '24px',
  color: '#ffffff'
}} />
          ) : (
            <Plus style={{
  width: '24px',
  height: '24px',
  color: '#ffffff'
}} />
          )}
        </div>

        {/* Glow effect */}
        <div style={{
  position: 'absolute',
  borderRadius: '50%'
}}></div>
      </Button>

      {/* Backdrop for expanded state */}
      {isExpanded && (
        <div
          style={{
  position: 'fixed'
}}
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}



export default FloatingActionButton