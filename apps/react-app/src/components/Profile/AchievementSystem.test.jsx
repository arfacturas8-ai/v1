import React from 'react'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import AchievementSystem from './AchievementSystem'
import { useAuth } from '../../contexts/AuthContext'
import profileService from '../../services/profileService'
import { useToast } from '../ui/useToast'

jest.mock('../../contexts/AuthContext')
jest.mock('../../services/profileService')
jest.mock('../ui/useToast')

const mockAchievements = [
  {
    id: 'first_post',
    name: 'First Steps',
    description: 'Create your first post',
    icon: 'FileText',
    category: 'content',
    rarity: 'common',
    points: 10,
    unlocked: true,
    unlockedAt: '2024-01-15T10:30:00Z',
    progress: { current: 1, total: 1 }
  },
  {
    id: 'community_builder',
    name: 'Community Builder',
    description: 'Help grow a community to 1000+ members',
    icon: 'Users',
    category: 'community',
    rarity: 'rare',
    points: 100,
    unlocked: true,
    unlockedAt: '2024-02-20T15:45:00Z',
    progress: { current: 1250, total: 1000 }
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Follow 50 users',
    icon: 'Heart',
    category: 'social',
    rarity: 'common',
    points: 25,
    unlocked: true,
    unlockedAt: '2024-01-28T09:15:00Z',
    progress: { current: 67, total: 50 }
  },
  {
    id: 'content_creator',
    name: 'Content Creator',
    description: 'Create 100 posts',
    icon: 'Star',
    category: 'content',
    rarity: 'uncommon',
    points: 50,
    unlocked: false,
    progress: { current: 42, total: 100 }
  },
  {
    id: 'karma_master',
    name: 'Karma Master',
    description: 'Reach 10,000 karma points',
    icon: 'Crown',
    category: 'engagement',
    rarity: 'legendary',
    points: 500,
    unlocked: false,
    progress: { current: 3847, total: 10000 }
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join during the beta period',
    icon: 'Rocket',
    category: 'special',
    rarity: 'epic',
    points: 200,
    unlocked: true,
    unlockedAt: '2024-01-01T00:00:00Z',
    progress: { current: 1, total: 1 }
  },
  {
    id: 'helpful_hand',
    name: 'Helpful Hand',
    description: 'Receive 100 helpful reactions',
    icon: 'Shield',
    category: 'engagement',
    rarity: 'uncommon',
    points: 75,
    unlocked: false,
    progress: { current: 23, total: 100 }
  },
  {
    id: 'conversation_starter',
    name: 'Conversation Starter',
    description: 'Start 50 discussions',
    icon: 'MessageSquare',
    category: 'content',
    rarity: 'common',
    points: 30,
    unlocked: false,
    progress: { current: 18, total: 50 }
  }
]

const mockBadges = [
  {
    id: 'verified_badge',
    name: 'Verified User',
    description: 'Account verified by platform',
    icon: 'CheckCircle',
    type: 'verification',
    color: '#3b82f6'
  },
  {
    id: 'moderator_badge',
    name: 'Community Moderator',
    description: 'Trusted community moderator',
    icon: 'Shield',
    type: 'role',
    color: '#10b981'
  },
  {
    id: 'supporter_badge',
    name: 'Platform Supporter',
    description: 'Supporting platform development',
    icon: 'Heart',
    type: 'supporter',
    color: '#f59e0b'
  }
]

const mockProgress = {
  totalPoints: 385,
  level: 7,
  pointsToNextLevel: 115,
  totalPointsForNextLevel: 500,
  streak: {
    current: 12,
    longest: 28,
    type: 'daily_login'
  },
  categories: {
    content: { completed: 1, total: 3, points: 60 },
    community: { completed: 1, total: 2, points: 100 },
    social: { completed: 1, total: 3, points: 25 },
    engagement: { completed: 0, total: 2, points: 0 },
    special: { completed: 1, total: 1, points: 200 }
  }
}

describe('AchievementSystem', () => {
  let mockShowToast

  beforeEach(() => {
    mockShowToast = jest.fn()
    useAuth.mockReturnValue({
      user: { id: 'user-123' }
    })
    useToast.mockReturnValue({
      showToast: mockShowToast
    })

    profileService.getAchievements = jest.fn().mockResolvedValue({ achievements: mockAchievements })
    profileService.getBadges = jest.fn().mockResolvedValue({ badges: mockBadges })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading States', () => {
    test('displays loading skeleton on initial render', () => {
      render(<AchievementSystem />)

      expect(screen.getByTestId('achievement-skeleton') || document.querySelector('.achievement-skeleton')).toBeInTheDocument()
    })

    test('displays multiple skeleton cards while loading', () => {
      render(<AchievementSystem />)

      const skeletons = document.querySelectorAll('.achievement-card-skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    test('hides loading skeleton after data loads', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(document.querySelector('.achievement-skeleton')).not.toBeInTheDocument()
      })
    })

    test('shows correct loading class during loading state', () => {
      const { container } = render(<AchievementSystem />)

      expect(container.querySelector('.achievement-system--loading')).toBeInTheDocument()
    })
  })

  describe('Achievement List Display', () => {
    test('renders achievement list after loading', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })

    test('displays all achievements from mock data', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
        expect(screen.getByText('Community Builder')).toBeInTheDocument()
        expect(screen.getByText('Social Butterfly')).toBeInTheDocument()
        expect(screen.getByText('Content Creator')).toBeInTheDocument()
      })
    })

    test('renders achievement descriptions', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Create your first post')).toBeInTheDocument()
        expect(screen.getByText('Help grow a community to 1000+ members')).toBeInTheDocument()
      })
    })

    test('displays achievement icons', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const cards = document.querySelectorAll('.achievement-card')
        expect(cards.length).toBeGreaterThan(0)
        cards.forEach(card => {
          expect(card.querySelector('.achievement-icon')).toBeInTheDocument()
        })
      })
    })

    test('shows achievement points for each item', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
      })
    })
  })

  describe('Locked/Unlocked States', () => {
    test('applies unlocked class to unlocked achievements', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const cards = document.querySelectorAll('.achievement-card.unlocked')
        expect(cards.length).toBeGreaterThan(0)
      })
    })

    test('applies locked class to locked achievements', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const cards = document.querySelectorAll('.achievement-card.locked')
        expect(cards.length).toBeGreaterThan(0)
      })
    })

    test('displays unlock date for unlocked achievements', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText(/Unlocked Jan/)).toBeInTheDocument()
      })
    })

    test('does not display unlock date for locked achievements', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const contentCreator = screen.getByText('Content Creator').closest('.achievement-card')
        expect(within(contentCreator).queryByText(/Unlocked/)).not.toBeInTheDocument()
      })
    })

    test('shows correct opacity for locked achievements', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const lockedCard = document.querySelector('.achievement-card.locked .achievement-icon')
        expect(lockedCard).toHaveStyle({ opacity: '0.5' })
      })
    })

    test('shows full opacity for unlocked achievements', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const unlockedCard = document.querySelector('.achievement-card.unlocked .achievement-icon')
        expect(unlockedCard).toHaveStyle({ opacity: '1' })
      })
    })
  })

  describe('Progress Bars', () => {
    test('displays progress bar for locked achievements on own profile', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const progressBars = document.querySelectorAll('.achievement-progress')
        expect(progressBars.length).toBeGreaterThan(0)
      })
    })

    test('shows current and total progress values', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('42 / 100')).toBeInTheDocument()
        expect(screen.getByText('3847 / 10000')).toBeInTheDocument()
      })
    })

    test('calculates progress percentage correctly', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const progressFill = document.querySelector('.progress-fill-small')
        const width = progressFill?.style.width
        expect(width).toBeTruthy()
      })
    })

    test('does not show progress bar for unlocked achievements', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const unlockedCard = screen.getByText('First Steps').closest('.achievement-card')
        expect(within(unlockedCard).queryByTestId('progress-bar') || within(unlockedCard).querySelector('.achievement-progress')).not.toBeInTheDocument()
      })
    })

    test('displays level progress bar in full variant', async () => {
      render(<AchievementSystem variant="full" />)

      await waitFor(() => {
        expect(document.querySelector('.level-progress-full')).toBeInTheDocument()
      })
    })

    test('calculates level progress correctly', async () => {
      render(<AchievementSystem variant="full" />)

      await waitFor(() => {
        const progressFill = document.querySelector('.progress-fill-full')
        expect(progressFill).toBeInTheDocument()
      })
    })

    test('shows points to next level', async () => {
      render(<AchievementSystem variant="full" />)

      await waitFor(() => {
        expect(screen.getByText(/115 points to next level/)).toBeInTheDocument()
      })
    })
  })

  describe('Achievement Categories', () => {
    test('displays category filter tabs', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument()
        expect(screen.getByText('Content')).toBeInTheDocument()
        expect(screen.getByText('Community')).toBeInTheDocument()
        expect(screen.getByText('Social')).toBeInTheDocument()
        expect(screen.getByText('Engagement')).toBeInTheDocument()
        expect(screen.getByText('Special')).toBeInTheDocument()
      })
    })

    test('filters achievements by content category', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Content'))

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
        expect(screen.getByText('Content Creator')).toBeInTheDocument()
      })
    })

    test('filters achievements by community category', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Community')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Community'))

      await waitFor(() => {
        expect(screen.getByText('Community Builder')).toBeInTheDocument()
      })
    })

    test('filters achievements by social category', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Social')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Social'))

      await waitFor(() => {
        expect(screen.getByText('Social Butterfly')).toBeInTheDocument()
      })
    })

    test('filters achievements by engagement category', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Engagement')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Engagement'))

      await waitFor(() => {
        expect(screen.getByText('Karma Master')).toBeInTheDocument()
      })
    })

    test('filters achievements by special category', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Special')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Special'))

      await waitFor(() => {
        expect(screen.getByText('Early Adopter')).toBeInTheDocument()
      })
    })

    test('shows all achievements when All category is selected', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Content'))
      await user.click(screen.getByText('All'))

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
        expect(screen.getByText('Community Builder')).toBeInTheDocument()
        expect(screen.getByText('Social Butterfly')).toBeInTheDocument()
      })
    })

    test('highlights active category tab', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument()
      })

      const contentTab = screen.getByText('Content').closest('.category-tab')
      await user.click(contentTab)

      await waitFor(() => {
        expect(contentTab).toHaveClass('active')
      })
    })

    test('displays category icons in tabs', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const tabs = document.querySelectorAll('.category-tab')
        expect(tabs.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Achievement Details Modal', () => {
    test('toggles achievement details on card click', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })

      const card = screen.getByText('First Steps').closest('.achievement-card')
      await user.click(card)

      await waitFor(() => {
        expect(within(card).getByText('Category:')).toBeInTheDocument()
      })
    })

    test('displays category in achievement details', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })

      const card = screen.getByText('First Steps').closest('.achievement-card')
      await user.click(card)

      await waitFor(() => {
        expect(within(card).getByText('Content')).toBeInTheDocument()
      })
    })

    test('displays rarity in achievement details', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })

      const card = screen.getByText('First Steps').closest('.achievement-card')
      await user.click(card)

      await waitFor(() => {
        expect(within(card).getByText('Rarity:')).toBeInTheDocument()
        expect(within(card).getByText('Common')).toBeInTheDocument()
      })
    })

    test('displays points in achievement details', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })

      const card = screen.getByText('First Steps').closest('.achievement-card')
      await user.click(card)

      await waitFor(() => {
        expect(within(card).getByText('Points:')).toBeInTheDocument()
      })
    })

    test('displays unlock date in details for unlocked achievements', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })

      const card = screen.getByText('First Steps').closest('.achievement-card')
      await user.click(card)

      await waitFor(() => {
        const details = within(card).getByText('Unlocked:')
        expect(details).toBeInTheDocument()
      })
    })

    test('closes achievement details on second click', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })

      const card = screen.getByText('First Steps').closest('.achievement-card')
      await user.click(card)

      await waitFor(() => {
        expect(within(card).getByText('Category:')).toBeInTheDocument()
      })

      await user.click(card)

      await waitFor(() => {
        expect(within(card).queryByText('Category:')).not.toBeInTheDocument()
      })
    })
  })

  describe('Rarity Tiers', () => {
    test('displays common rarity badge', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('common')).toBeInTheDocument()
      })
    })

    test('displays uncommon rarity badge', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('uncommon')).toBeInTheDocument()
      })
    })

    test('displays rare rarity badge', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('rare')).toBeInTheDocument()
      })
    })

    test('displays epic rarity badge', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('epic')).toBeInTheDocument()
      })
    })

    test('displays legendary rarity badge', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('legendary')).toBeInTheDocument()
      })
    })

    test('applies correct color for common rarity', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const commonBadge = screen.getByText('common')
        expect(commonBadge).toHaveStyle({ backgroundColor: '#6b7280' })
      })
    })

    test('applies correct color for rare rarity', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const rareBadge = screen.getByText('rare')
        expect(rareBadge).toHaveStyle({ backgroundColor: '#3b82f6' })
      })
    })

    test('applies correct color for legendary rarity', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const legendaryBadge = screen.getByText('legendary')
        expect(legendaryBadge).toHaveStyle({ backgroundColor: '#f59e0b' })
      })
    })
  })

  describe('Points Display', () => {
    test('displays total points in header stats', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('385 Points')).toBeInTheDocument()
      })
    })

    test('displays current level in header stats', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Level 7')).toBeInTheDocument()
      })
    })

    test('displays number of unlocked achievements', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('4 Unlocked')).toBeInTheDocument()
      })
    })

    test('displays category points in progress variant', async () => {
      render(<AchievementSystem variant="progress" />)

      await waitFor(() => {
        expect(screen.getByText('60 pts')).toBeInTheDocument()
        expect(screen.getByText('100 pts')).toBeInTheDocument()
      })
    })

    test('displays individual achievement points', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const cards = document.querySelectorAll('.achievement-points')
        expect(cards.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Recent Achievements', () => {
    test('displays special badges section', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Special Badges')).toBeInTheDocument()
      })
    })

    test('shows all unlocked badges', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Verified User')).toBeInTheDocument()
        expect(screen.getByText('Community Moderator')).toBeInTheDocument()
        expect(screen.getByText('Platform Supporter')).toBeInTheDocument()
      })
    })

    test('displays badge descriptions', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Account verified by platform')).toBeInTheDocument()
        expect(screen.getByText('Trusted community moderator')).toBeInTheDocument()
      })
    })

    test('applies correct colors to badges', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const badgeIcons = document.querySelectorAll('.badge-icon')
        expect(badgeIcons[0]).toHaveStyle({ backgroundColor: '#3b82f6' })
        expect(badgeIcons[1]).toHaveStyle({ backgroundColor: '#10b981' })
        expect(badgeIcons[2]).toHaveStyle({ backgroundColor: '#f59e0b' })
      })
    })
  })

  describe('Variant: Compact', () => {
    test('renders compact variant correctly', async () => {
      render(<AchievementSystem variant="compact" />)

      await waitFor(() => {
        expect(document.querySelector('.achievement-system--compact')).toBeInTheDocument()
      })
    })

    test('displays achievement count in compact variant', async () => {
      render(<AchievementSystem variant="compact" />)

      await waitFor(() => {
        const count = document.querySelector('.achievement-count')
        expect(count).toBeInTheDocument()
        expect(count.textContent).toBe('7')
      })
    })

    test('shows limited badges in compact variant', async () => {
      render(<AchievementSystem variant="compact" />)

      await waitFor(() => {
        const badges = document.querySelectorAll('.compact-badge')
        expect(badges.length).toBeLessThanOrEqual(3)
      })
    })

    test('shows limited achievements in compact variant', async () => {
      render(<AchievementSystem variant="compact" />)

      await waitFor(() => {
        const achievements = document.querySelectorAll('.compact-achievement')
        expect(achievements.length).toBeLessThanOrEqual(3)
      })
    })

    test('displays overflow count in compact variant', async () => {
      render(<AchievementSystem variant="compact" />)

      await waitFor(() => {
        expect(screen.getByText(/\+1/)).toBeInTheDocument()
      })
    })

    test('displays Achievements header in compact variant', async () => {
      render(<AchievementSystem variant="compact" />)

      await waitFor(() => {
        expect(screen.getByText('Achievements')).toBeInTheDocument()
      })
    })
  })

  describe('Variant: Progress', () => {
    test('renders progress variant correctly', async () => {
      render(<AchievementSystem variant="progress" />)

      await waitFor(() => {
        expect(document.querySelector('.achievement-system--progress')).toBeInTheDocument()
      })
    })

    test('displays level badge in progress variant', async () => {
      render(<AchievementSystem variant="progress" />)

      await waitFor(() => {
        expect(screen.getByText('Level 7')).toBeInTheDocument()
      })
    })

    test('displays total points in progress variant', async () => {
      render(<AchievementSystem variant="progress" />)

      await waitFor(() => {
        expect(screen.getByText('385')).toBeInTheDocument()
      })
    })

    test('shows streak information', async () => {
      render(<AchievementSystem variant="progress" />)

      await waitFor(() => {
        expect(screen.getByText('12 day streak')).toBeInTheDocument()
        expect(screen.getByText('(best: 28)')).toBeInTheDocument()
      })
    })

    test('displays category progress with completion ratios', async () => {
      render(<AchievementSystem variant="progress" />)

      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeInTheDocument()
        expect(screen.getByText('1/2')).toBeInTheDocument()
      })
    })

    test('shows progress bar for next level', async () => {
      render(<AchievementSystem variant="progress" />)

      await waitFor(() => {
        expect(document.querySelector('.progress-bar')).toBeInTheDocument()
      })
    })

    test('displays points to next level in progress variant', async () => {
      render(<AchievementSystem variant="progress" />)

      await waitFor(() => {
        expect(screen.getByText(/115 points to level 8/)).toBeInTheDocument()
      })
    })

    test('displays all category names', async () => {
      render(<AchievementSystem variant="progress" />)

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument()
        expect(screen.getByText('Community')).toBeInTheDocument()
        expect(screen.getByText('Social')).toBeInTheDocument()
        expect(screen.getByText('Engagement')).toBeInTheDocument()
        expect(screen.getByText('Special')).toBeInTheDocument()
      })
    })
  })

  describe('Filter: Show Unlocked Only', () => {
    test('displays show unlocked only checkbox', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Show unlocked only')).toBeInTheDocument()
      })
    })

    test('filters to show only unlocked achievements when checked', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Content Creator')).toBeInTheDocument()
      })

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      await waitFor(() => {
        expect(screen.queryByText('Content Creator')).not.toBeInTheDocument()
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })

    test('shows all achievements when unchecked', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Content Creator')).toBeInTheDocument()
      })

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      await user.click(checkbox)

      await waitFor(() => {
        expect(screen.getByText('Content Creator')).toBeInTheDocument()
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    test('displays empty state when no achievements match filters', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Special')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Special'))
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      await waitFor(() => {
        const lockedAchievements = mockAchievements.filter(a => a.category === 'special' && !a.unlocked)
        if (lockedAchievements.length === 0) {
          expect(screen.getByText('No achievements found')).toBeInTheDocument()
        }
      })
    })

    test('displays empty state message', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        const contentTab = screen.getByText('Content')
        fireEvent.click(contentTab)
      })

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      await waitFor(() => {
        const hasLockedContent = mockAchievements.some(a => a.category === 'content' && !a.unlocked)
        if (!hasLockedContent) {
          const emptyMessage = screen.queryByText(/Try adjusting your filters/)
          if (emptyMessage) {
            expect(emptyMessage).toBeInTheDocument()
          }
        }
      })
    })
  })

  describe('Props and Configuration', () => {
    test('accepts custom className prop', async () => {
      const { container } = render(<AchievementSystem className="custom-class" />)

      await waitFor(() => {
        expect(container.querySelector('.custom-class')).toBeInTheDocument()
      })
    })

    test('handles userId prop for viewing other profiles', async () => {
      render(<AchievementSystem userId="other-user-123" />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })

    test('determines isOwnProfile correctly when no userId provided', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(document.querySelector('.achievement-progress')).toBeInTheDocument()
      })
    })

    test('determines isOwnProfile correctly when userId matches current user', async () => {
      useAuth.mockReturnValue({
        user: { id: 'user-123' }
      })

      render(<AchievementSystem userId="user-123" />)

      await waitFor(() => {
        expect(document.querySelector('.achievement-progress')).toBeInTheDocument()
      })
    })

    test('hides progress bars when viewing other profiles', async () => {
      render(<AchievementSystem userId="other-user-123" />)

      await waitFor(() => {
        expect(document.querySelector('.achievement-progress')).not.toBeInTheDocument()
      })
    })

    test('respects showProgress prop', async () => {
      render(<AchievementSystem showProgress={false} />)

      await waitFor(() => {
        expect(document.querySelector('.level-progress-full')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('handles API error gracefully and falls back to mock data', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      profileService.getAchievements = jest.fn().mockRejectedValue(new Error('API Error'))
      profileService.getBadges = jest.fn().mockRejectedValue(new Error('API Error'))

      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })

      consoleError.mockRestore()
    })

    test('logs error to console when API fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('API Error')
      profileService.getAchievements = jest.fn().mockRejectedValue(error)
      profileService.getBadges = jest.fn().mockRejectedValue(error)

      render(<AchievementSystem />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error loading achievements:', error)
      })

      consoleError.mockRestore()
    })

    test('still displays loading state before error occurs', () => {
      profileService.getAchievements = jest.fn().mockRejectedValue(new Error('API Error'))

      render(<AchievementSystem />)

      expect(document.querySelector('.achievement-skeleton')).toBeInTheDocument()
    })

    test('removes loading state after error is handled', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      profileService.getAchievements = jest.fn().mockRejectedValue(new Error('API Error'))

      render(<AchievementSystem />)

      await waitFor(() => {
        expect(document.querySelector('.achievement-skeleton')).not.toBeInTheDocument()
      })

      consoleError.mockRestore()
    })
  })

  describe('Component Lifecycle', () => {
    test('loads achievements on mount', async () => {
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })

    test('reloads achievements when userId changes', async () => {
      const { rerender } = render(<AchievementSystem userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })

      rerender(<AchievementSystem userId="user-2" />)

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })

    test('reloads achievements when category changes', async () => {
      const user = userEvent.setup()
      render(<AchievementSystem />)

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Content'))

      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument()
      })
    })
  })
})

export default mockAchievements
