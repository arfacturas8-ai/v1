import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import EnhancedUserProfile from './EnhancedUserProfile'

const mockUser = {
  id: 'user123',
  username: 'cryptoenthusiast',
  displayName: 'Crypto Enthusiast',
  avatar: 'https://example.com/avatar.jpg',
  banner: 'https://example.com/banner.jpg',
  bio: 'Passionate about blockchain technology, DeFi, and building the future of finance. Always learning and sharing knowledge.',
  location: 'San Francisco, CA',
  website: 'https://defi-wizard.io',
  socialLinks: {
    twitter: 'https://twitter.com/cryptoenthusiast',
    github: 'https://github.com/cryptoenthusiast'
  },
  isVerified: true,
  isPremium: true,
  createdAt: new Date('2023-01-15').toISOString(),
  lastActive: new Date().toISOString(),
  stats: {
    posts: 127,
    comments: 834,
    karma: 15420,
    postKarma: 8950,
    commentKarma: 6470,
    followers: 1247,
    following: 892,
    communities: 23,
    awards: 45,
    awardsGiven: 78
  }
}

const mockKarmaData = {
  totalKarma: 15420,
  postKarma: 8950,
  commentKarma: 6470,
  weeklyChange: 234,
  monthlyChange: 892,
  rank: 'Expert',
  percentile: 5,
  breakdown: {
    posts: 8950,
    comments: 6470,
    awards: 1250,
    helpfulness: 450,
    consistency: 300
  },
  history: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    karma: Math.floor(Math.random() * 100) + 20
  }))
}

const mockAchievements = [
  {
    id: 'first_post',
    name: 'First Steps',
    description: 'Made your first post',
    icon: '📝',
    rarity: 'common',
    earnedAt: '2023-01-16T10:30:00Z',
    progress: 100
  },
  {
    id: 'karma_1000',
    name: 'Rising Star',
    description: 'Earned 1,000 karma',
    icon: '⭐',
    rarity: 'uncommon',
    earnedAt: '2023-03-20T15:45:00Z',
    progress: 100
  },
  {
    id: 'karma_10000',
    name: 'Community Leader',
    description: 'Earned 10,000 karma',
    icon: '👑',
    rarity: 'rare',
    earnedAt: '2023-11-15T09:20:00Z',
    progress: 100
  },
  {
    id: 'helpful_100',
    name: 'Helpful Hand',
    description: 'Received 100 helpful awards',
    icon: '🤝',
    rarity: 'epic',
    earnedAt: '2023-10-08T14:10:00Z',
    progress: 100
  },
  {
    id: 'karma_25000',
    name: 'Legend',
    description: 'Earn 25,000 karma',
    icon: '⚡',
    rarity: 'legendary',
    earnedAt: null,
    progress: 62
  }
]

const mockRelationship = {
  isFollowing: false,
  isFollower: false,
  mutualFriends: 5
}

global.fetch = jest.fn()

describe('EnhancedUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockImplementation((url) => {
      if (url.includes('/profile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user: mockUser, posts: [], comments: [] })
        })
      }
      if (url.includes('/karma')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockKarmaData
        })
      }
      if (url.includes('/achievements')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ achievements: mockAchievements })
        })
      }
      if (url.includes('/relationship')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockRelationship
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  describe('Loading State', () => {
    test('should show loading spinner initially', () => {
      render(<EnhancedUserProfile userId="user123" />)
      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('')
    })

    test('should hide loading spinner after data loads', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.queryByRole('generic', { hidden: true })).not.toHaveClass('')
      })
    })
  })

  describe('API Integration', () => {
    test('should fetch user profile on mount', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/user123/profile')
      })
    })

    test('should fetch karma data on mount', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/user123/karma')
      })
    })

    test('should fetch achievements on mount', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/user123/achievements')
      })
    })

    test('should fetch relationship data when not own profile', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={false} />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/user123/relationship')
      })
    })

    test('should not fetch relationship data for own profile', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={true} />)
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })
      expect(global.fetch).not.toHaveBeenCalledWith('/api/users/user123/relationship')
    })

    test('should handle failed profile fetch gracefully', async () => {
      global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')))
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('cryptoenthusiast')).toBeInTheDocument()
      })
    })

    test('should handle failed karma fetch gracefully', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/karma')) {
          return Promise.reject(new Error('Network error'))
        }
        if (url.includes('/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser, posts: [], comments: [] })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('cryptoenthusiast')).toBeInTheDocument()
      })
    })

    test('should handle failed achievements fetch gracefully', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/achievements')) {
          return Promise.reject(new Error('Network error'))
        }
        if (url.includes('/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser, posts: [], comments: [] })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('cryptoenthusiast')).toBeInTheDocument()
      })
    })
  })

  describe('Profile Header', () => {
    test('should display user banner when available', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        const banner = screen.getByAltText('Profile banner')
        expect(banner).toBeInTheDocument()
        expect(banner).toHaveAttribute('src', 'https://example.com/banner.jpg')
      })
    })

    test('should display user avatar when available', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        const avatar = screen.getByAltText('Crypto Enthusiast')
        expect(avatar).toBeInTheDocument()
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      })
    })

    test('should display default avatar icon when avatar not available', async () => {
      const userWithoutAvatar = { ...mockUser, avatar: null }
      global.fetch.mockImplementation((url) => {
        if (url.includes('/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: userWithoutAvatar, posts: [], comments: [] })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('cryptoenthusiast')).toBeInTheDocument()
      })
    })

    test('should display premium crown badge for premium users', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Crypto Enthusiast')).toBeInTheDocument()
      })
    })

    test('should display verified shield badge for verified users', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Crypto Enthusiast')).toBeInTheDocument()
      })
    })

    test('should display user display name', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Crypto Enthusiast')).toBeInTheDocument()
      })
    })

    test('should display username with @ prefix', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('@cryptoenthusiast')).toBeInTheDocument()
      })
    })

    test('should display user bio', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText(/Passionate about blockchain technology/)).toBeInTheDocument()
      })
    })

    test('should display user location', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      })
    })

    test('should display website link', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        const websiteLink = screen.getByText('Website')
        expect(websiteLink).toBeInTheDocument()
        expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://defi-wizard.io')
      })
    })

    test('should display join date', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText(/Joined January/)).toBeInTheDocument()
      })
    })
  })

  describe('User Stats Display', () => {
    test('should display followers count', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('1,247')).toBeInTheDocument()
        expect(screen.getByText('Followers')).toBeInTheDocument()
      })
    })

    test('should display following count', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('892')).toBeInTheDocument()
        expect(screen.getByText('Following')).toBeInTheDocument()
      })
    })

    test('should display communities count', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('23')).toBeInTheDocument()
        expect(screen.getByText('Communities')).toBeInTheDocument()
      })
    })

    test('should display mutual friends count when available', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={false} />)
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('Mutual Friends')).toBeInTheDocument()
      })
    })

    test('should not display mutual friends for own profile', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={true} />)
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })
      expect(screen.queryByText('Mutual Friends')).not.toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    test('should show Edit Profile button for own profile', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={true} />)
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })
    })

    test('should show Notifications button for own profile', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={true} />)
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
    })

    test('should show Follow button for other profiles when not following', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={false} />)
      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument()
      })
    })

    test('should show Following button when already following', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/relationship')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ...mockRelationship, isFollowing: true })
          })
        }
        if (url.includes('/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser, posts: [], comments: [] })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      render(<EnhancedUserProfile userId="user123" isOwnProfile={false} />)
      await waitFor(() => {
        expect(screen.getByText('Following')).toBeInTheDocument()
      })
    })

    test('should call onFollow when Follow button clicked', async () => {
      const onFollow = jest.fn()
      render(<EnhancedUserProfile userId="user123" isOwnProfile={false} onFollow={onFollow} />)
      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Follow'))
      expect(onFollow).toHaveBeenCalledWith('user123')
    })

    test('should call onUnfollow when Following button clicked', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/relationship')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ...mockRelationship, isFollowing: true })
          })
        }
        if (url.includes('/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser, posts: [], comments: [] })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      const onUnfollow = jest.fn()
      render(<EnhancedUserProfile userId="user123" isOwnProfile={false} onUnfollow={onUnfollow} />)
      await waitFor(() => {
        expect(screen.getByText('Following')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Following'))
      expect(onUnfollow).toHaveBeenCalledWith('user123')
    })
  })

  describe('Tab Navigation', () => {
    test('should display all tab options', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
        expect(screen.getByText('Posts')).toBeInTheDocument()
        expect(screen.getByText('Comments')).toBeInTheDocument()
        expect(screen.getByText('Achievements')).toBeInTheDocument()
      })
    })

    test('should show Overview tab by default', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Karma Overview')).toBeInTheDocument()
      })
    })

    test('should switch to Posts tab when clicked', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Posts'))
      await waitFor(() => {
        expect(screen.getByText('No posts to show')).toBeInTheDocument()
      })
    })

    test('should switch to Comments tab when clicked', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Comments'))
      await waitFor(() => {
        expect(screen.getByText('No comments to show')).toBeInTheDocument()
      })
    })

    test('should switch to Achievements tab when clicked', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Achievements')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Achievements'))
      await waitFor(() => {
        expect(screen.getByText('Achievement Progress')).toBeInTheDocument()
      })
    })

    test('should maintain active tab state', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Posts'))
      await waitFor(() => {
        expect(screen.getByText('No posts to show')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Overview'))
      await waitFor(() => {
        expect(screen.getByText('Karma Overview')).toBeInTheDocument()
      })
    })
  })

  describe('Overview Tab', () => {
    test('should display karma overview section', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Karma Overview')).toBeInTheDocument()
      })
    })

    test('should display total karma', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument()
        expect(screen.getByText('Total Karma')).toBeInTheDocument()
      })
    })

    test('should display post karma', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('8,950')).toBeInTheDocument()
        expect(screen.getByText('Post Karma')).toBeInTheDocument()
      })
    })

    test('should display comment karma', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('6,470')).toBeInTheDocument()
        expect(screen.getByText('Comment Karma')).toBeInTheDocument()
      })
    })

    test('should display karma rank', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Expert')).toBeInTheDocument()
        expect(screen.getByText('Rank')).toBeInTheDocument()
      })
    })

    test('should display percentile', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Top 5%')).toBeInTheDocument()
      })
    })

    test('should display weekly karma change', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('+234 this week')).toBeInTheDocument()
      })
    })

    test('should display View Details button for karma', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('View Details')).toBeInTheDocument()
      })
    })

    test('should display recent achievements section', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Recent Achievements')).toBeInTheDocument()
      })
    })

    test('should display up to 4 recent achievements', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
        expect(screen.getByText('Rising Star')).toBeInTheDocument()
        expect(screen.getByText('Community Leader')).toBeInTheDocument()
        expect(screen.getByText('Helpful Hand')).toBeInTheDocument()
      })
    })

    test('should display activity stats', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('127')).toBeInTheDocument()
        expect(screen.getByText('Posts')).toBeInTheDocument()
        expect(screen.getByText('834')).toBeInTheDocument()
        expect(screen.getByText('Comments')).toBeInTheDocument()
      })
    })

    test('should display awards received count', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument()
        expect(screen.getByText('Awards Received')).toBeInTheDocument()
      })
    })

    test('should display awards given count', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('78')).toBeInTheDocument()
        expect(screen.getByText('Awards Given')).toBeInTheDocument()
      })
    })
  })

  describe('Achievements Tab', () => {
    beforeEach(async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Achievements')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Achievements'))
    })

    test('should display achievement progress section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Achievement Progress')).toBeInTheDocument()
      })
    })

    test('should display common achievements count', async () => {
      await waitFor(() => {
        const progressSection = screen.getByText('Achievement Progress').closest('div').closest('div')
        expect(within(progressSection).getByText('common')).toBeInTheDocument()
      })
    })

    test('should display uncommon achievements count', async () => {
      await waitFor(() => {
        const progressSection = screen.getByText('Achievement Progress').closest('div').closest('div')
        expect(within(progressSection).getByText('uncommon')).toBeInTheDocument()
      })
    })

    test('should display rare achievements count', async () => {
      await waitFor(() => {
        const progressSection = screen.getByText('Achievement Progress').closest('div').closest('div')
        expect(within(progressSection).getByText('rare')).toBeInTheDocument()
      })
    })

    test('should display epic achievements count', async () => {
      await waitFor(() => {
        const progressSection = screen.getByText('Achievement Progress').closest('div').closest('div')
        expect(within(progressSection).getByText('epic')).toBeInTheDocument()
      })
    })

    test('should display legendary achievements count', async () => {
      await waitFor(() => {
        const progressSection = screen.getByText('Achievement Progress').closest('div').closest('div')
        expect(within(progressSection).getByText('legendary')).toBeInTheDocument()
      })
    })

    test('should display all achievements', async () => {
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
        expect(screen.getByText('Rising Star')).toBeInTheDocument()
        expect(screen.getByText('Community Leader')).toBeInTheDocument()
        expect(screen.getByText('Helpful Hand')).toBeInTheDocument()
        expect(screen.getByText('Legend')).toBeInTheDocument()
      })
    })

    test('should display earned date for completed achievements', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Earned January/)).toBeInTheDocument()
      })
    })

    test('should display progress bar for incomplete achievements', async () => {
      await waitFor(() => {
        const legendAchievement = screen.getByText('Legend').closest('div')
        expect(within(legendAchievement).getByText('62%')).toBeInTheDocument()
        expect(within(legendAchievement).getByText('Progress')).toBeInTheDocument()
      })
    })

    test('should apply correct rarity colors to achievements', async () => {
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })

    test('should display achievement icons', async () => {
      await waitFor(() => {
        const firstSteps = screen.getByText('First Steps').closest('div')
        expect(within(firstSteps).getByText('📝')).toBeInTheDocument()
      })
    })

    test('should display achievement descriptions', async () => {
      await waitFor(() => {
        expect(screen.getByText('Made your first post')).toBeInTheDocument()
        expect(screen.getByText('Earned 1,000 karma')).toBeInTheDocument()
      })
    })
  })

  describe('Posts Tab', () => {
    test('should display empty state for posts', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Posts'))
      await waitFor(() => {
        expect(screen.getByText('No posts to show')).toBeInTheDocument()
      })
    })
  })

  describe('Comments Tab', () => {
    test('should display empty state for comments', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Comments'))
      await waitFor(() => {
        expect(screen.getByText('No comments to show')).toBeInTheDocument()
      })
    })
  })

  describe('Karma Modal', () => {
    test('should not show karma modal initially', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Karma Overview')).toBeInTheDocument()
      })
      expect(screen.queryByText('KarmaSystem')).not.toBeInTheDocument()
    })

    test('should open karma modal when View Details clicked', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('View Details')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('View Details'))
      await waitFor(() => {
        expect(screen.getByText('Karma Overview')).toBeInTheDocument()
      })
    })
  })

  describe('Notifications Modal', () => {
    test('should not show notifications modal initially', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={true} />)
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
    })

    test('should open notifications modal when Notifications button clicked', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={true} />)
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Notifications'))
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('should show user not found when user is null after loading', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({})
        })
      )
      render(<EnhancedUserProfile userId="nonexistent" />)
      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument()
      })
    })

    test('should handle missing user stats gracefully', async () => {
      const userWithoutStats = { ...mockUser, stats: null }
      global.fetch.mockImplementation((url) => {
        if (url.includes('/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: userWithoutStats, posts: [], comments: [] })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('cryptoenthusiast')).toBeInTheDocument()
      })
    })

    test('should handle missing bio gracefully', async () => {
      const userWithoutBio = { ...mockUser, bio: null }
      global.fetch.mockImplementation((url) => {
        if (url.includes('/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: userWithoutBio, posts: [], comments: [] })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('cryptoenthusiast')).toBeInTheDocument()
      })
    })

    test('should handle missing location gracefully', async () => {
      const userWithoutLocation = { ...mockUser, location: null }
      global.fetch.mockImplementation((url) => {
        if (url.includes('/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: userWithoutLocation, posts: [], comments: [] })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('cryptoenthusiast')).toBeInTheDocument()
      })
    })

    test('should handle missing website gracefully', async () => {
      const userWithoutWebsite = { ...mockUser, website: null }
      global.fetch.mockImplementation((url) => {
        if (url.includes('/profile')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: userWithoutWebsite, posts: [], comments: [] })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('cryptoenthusiast')).toBeInTheDocument()
      })
      expect(screen.queryByText('Website')).not.toBeInTheDocument()
    })
  })

  describe('Helper Functions', () => {
    test('should format timestamps correctly', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText(/Joined January 15, 2023/)).toBeInTheDocument()
      })
    })

    test('should apply correct rarity color classes', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        fireEvent.click(screen.getByText('Achievements'))
      })
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })

    test('should apply correct rarity background classes', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        fireEvent.click(screen.getByText('Achievements'))
      })
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior', () => {
    test('should render all sections on larger screens', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('Karma Overview')).toBeInTheDocument()
        expect(screen.getByText('Recent Achievements')).toBeInTheDocument()
      })
    })
  })

  describe('Component Props', () => {
    test('should accept userId prop', async () => {
      render(<EnhancedUserProfile userId="custom123" />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/custom123/profile')
      })
    })

    test('should accept isOwnProfile prop', async () => {
      render(<EnhancedUserProfile userId="user123" isOwnProfile={true} />)
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })
    })

    test('should accept onFollow callback', async () => {
      const onFollow = jest.fn()
      render(<EnhancedUserProfile userId="user123" onFollow={onFollow} isOwnProfile={false} />)
      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument()
      })
    })

    test('should accept onUnfollow callback', async () => {
      const onUnfollow = jest.fn()
      render(<EnhancedUserProfile userId="user123" onUnfollow={onUnfollow} isOwnProfile={false} />)
      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument()
      })
    })

    test('should accept onBlock callback', async () => {
      const onBlock = jest.fn()
      render(<EnhancedUserProfile userId="user123" onBlock={onBlock} isOwnProfile={false} />)
      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument()
      })
    })

    test('should accept onReport callback', async () => {
      const onReport = jest.fn()
      render(<EnhancedUserProfile userId="user123" onReport={onReport} isOwnProfile={false} />)
      await waitFor(() => {
        expect(screen.getByText('Follow')).toBeInTheDocument()
      })
    })
  })

  describe('View All Button', () => {
    test('should navigate to achievements tab when View All clicked', async () => {
      render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(screen.getByText('View All')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('View All'))
      await waitFor(() => {
        expect(screen.getByText('Achievement Progress')).toBeInTheDocument()
      })
    })
  })

  describe('Data Refetching', () => {
    test('should refetch data when userId changes', async () => {
      const { rerender } = render(<EnhancedUserProfile userId="user123" />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/user123/profile')
      })

      jest.clearAllMocks()

      rerender(<EnhancedUserProfile userId="user456" />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/user456/profile')
      })
    })

    test('should refetch relationship when isOwnProfile changes', async () => {
      const { rerender } = render(<EnhancedUserProfile userId="user123" isOwnProfile={true} />)
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      })

      jest.clearAllMocks()

      rerender(<EnhancedUserProfile userId="user123" isOwnProfile={false} />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/user123/relationship')
      })
    })
  })
})

export default mockUser
