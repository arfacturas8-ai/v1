import React from 'react'
import {
  MessageCircle, Users, Inbox, Bell, Search,
  FileText, Image, Bookmark, Star, Heart,
  TrendingUp, Calendar, Award, Zap, Box
} from 'lucide-react'

/**
 * EmptyState Component
 * Displays friendly empty state messages with icons and CTAs
 */

const iconMap = {
  messages: MessageCircle,
  users: Users,
  inbox: Inbox,
  notifications: Bell,
  search: Search,
  posts: FileText,
  images: Image,
  bookmarks: Bookmark,
  favorites: Star,
  likes: Heart,
  trending: TrendingUp,
  events: Calendar,
  awards: Award,
  activity: Zap,
  empty: Box
}

const EmptyState = ({
  icon = 'empty',
  title = 'Nothing here yet',
  description = 'Get started by creating something new',
  action,
  actionLabel = 'Get Started',
  onAction,
  className = '',
  size = 'md' // sm, md, lg
}) => {
  const Icon = iconMap[icon] || iconMap.empty

  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 48,
      title: 'text-lg',
      description: 'text-sm'
    },
    md: {
      container: 'py-12',
      icon: 64,
      title: 'text-xl',
      description: 'text-base'
    },
    lg: {
      container: 'py-16',
      icon: 80,
      title: 'text-2xl',
      description: 'text-lg'
    }
  }

  const sizes = sizeClasses[size]

  return (
    <div style={{
  textAlign: 'center'
}}>
      <Icon
        size={sizes.icon}
        style={{
  color: '#8b949e'
}}
        strokeWidth={1.5}
      />
      <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>
        {title}
      </h3>
      <p style={{
  color: '#8b949e'
}}>
        {description}
      </p>
      {(action || onAction) && (
        action || (
          <button
            onClick={onAction}
            style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#ffffff',
  borderRadius: '12px',
  fontWeight: '500',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
}}
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  )
}

// Preset empty states for common scenarios
export const EmptyMessages = ({ onAction }) => (
  <EmptyState
    icon="messages"
    title="No messages yet"
    description="Start a conversation to connect with others on the platform"
    actionLabel="Start Chatting"
    onAction={onAction}
  />
)

export const EmptyNotifications = () => (
  <EmptyState
    icon="notifications"
    title="No notifications"
    description="You're all caught up! We'll notify you when something important happens"
    size="md"
  />
)

export const EmptyPosts = ({ onAction }) => (
  <EmptyState
    icon="posts"
    title="No posts yet"
    description="Be the first to share something with the community"
    actionLabel="Create Post"
    onAction={onAction}
  />
)

export const EmptySearch = ({ query }) => (
  <EmptyState
    icon="search"
    title="No results found"
    description={query ? `No results for "${query}". Try different keywords or filters` : 'Try searching for something'}
    size="md"
  />
)

export const EmptyCommunities = ({ onAction }) => (
  <EmptyState
    icon="users"
    title="No communities joined"
    description="Discover and join communities that match your interests"
    actionLabel="Explore Communities"
    onAction={onAction}
  />
)

export const EmptyBookmarks = () => (
  <EmptyState
    icon="bookmarks"
    title="No saved items"
    description="Save posts, comments, and content you want to revisit later"
    size="md"
  />
)

export const EmptyActivity = () => (
  <EmptyState
    icon="activity"
    title="No recent activity"
    description="Your activity feed will appear here as you interact with the platform"
    size="md"
  />
)




export default iconMap
