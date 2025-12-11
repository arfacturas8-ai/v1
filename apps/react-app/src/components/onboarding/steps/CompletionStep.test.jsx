/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompletionStep from './CompletionStep';

// Mock the contexts
const mockUseAuth = jest.fn();
const mockUseOnboarding = jest.fn();

jest.mock('../../../contexts/AuthContext.jsx', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('../../../contexts/OnboardingContext', () => ({
  useOnboarding: () => mockUseOnboarding()
}));

// Mock fetch globally
global.fetch = jest.fn();
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

describe('CompletionStep', () => {
  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockUserProgress = {
    achievements: [
      { id: '1', name: 'Profile Setup', completed: true },
      { id: '2', name: 'First Post', completed: true },
      { id: '3', name: 'Community Join', completed: true }
    ],
    completedSteps: ['profile', 'communities', 'preferences']
  };

  const mockTutorials = [
    { id: '1', title: 'How to Create Posts', reward: 50, category: 'content' },
    { id: '2', title: 'Community Guidelines', reward: 25, category: 'community' },
    { id: '3', title: 'Voice Chat Basics', reward: 75, category: 'voice' },
    { id: '4', title: 'Earning Tokens', reward: 100, category: 'crypto' },
    { id: '5', title: 'Profile Customization', reward: 30, category: 'profile' }
  ];

  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseAuth.mockReturnValue({
      user: mockUser
    });

    mockUseOnboarding.mockReturnValue({
      userProgress: mockUserProgress,
      getAvailableTutorials: jest.fn().mockReturnValue(mockTutorials)
    });

    global.localStorage.getItem.mockReturnValue('mock-token');
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      expect(container).toBeInTheDocument();
    });

    it('displays congratulations message with username', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText(/Congratulations, testuser!/i)).toBeInTheDocument();
    });

    it('displays welcome message', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText(/You've successfully completed the CRYB onboarding process/i)).toBeInTheDocument();
    });

    it('displays the main celebration emoji', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const mainEmoji = screen.getAllByText('🎉')[0];
      expect(mainEmoji).toBeInTheDocument();
    });

    it('renders the "Start Exploring CRYB!" button', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByRole('button', { name: /Start Exploring CRYB!/i })).toBeInTheDocument();
    });

    it('handles missing username gracefully', () => {
      mockUseAuth.mockReturnValue({ user: null });
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText(/Congratulations/i)).toBeInTheDocument();
    });
  });

  describe('Confetti Animation', () => {
    it('shows confetti animation on mount', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      const confettiContainer = container.querySelector('.absolute.inset-0.pointer-events-none');
      expect(confettiContainer).toBeInTheDocument();
    });

    it('renders 50 confetti elements', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      const confettiElements = container.querySelectorAll('.absolute.');
      expect(confettiElements).toHaveLength(50);
    });

    it('hides confetti after 3 seconds', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);

      let confettiContainer = container.querySelector('.absolute.inset-0.pointer-events-none');
      expect(confettiContainer).toBeInTheDocument();

      jest.advanceTimersByTime(3000);

      confettiContainer = container.querySelector('.absolute.inset-0.pointer-events-none');
      expect(confettiContainer).not.toBeInTheDocument();
    });

    it('clears confetti timer on unmount', () => {
      const { unmount } = render(<CompletionStep onComplete={mockOnComplete} />);
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Welcome Rewards Section', () => {
    it('displays "Your Welcome Rewards" heading', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('Your Welcome Rewards')).toBeInTheDocument();
    });

    it('displays welcome bonus tokens (100 CRYB)', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('100 CRYB')).toBeInTheDocument();
      expect(screen.getByText('Welcome Bonus')).toBeInTheDocument();
    });

    it('displays achievements count', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Achievements Earned')).toBeInTheDocument();
    });

    it('displays tutorials available count', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Tutorials Available')).toBeInTheDocument();
    });

    it('displays earning tips message', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText(/Keep earning CRYB tokens/i)).toBeInTheDocument();
    });

    it('handles zero achievements gracefully', () => {
      mockUseOnboarding.mockReturnValue({
        userProgress: { ...mockUserProgress, achievements: [] },
        getAvailableTutorials: jest.fn().mockReturnValue(mockTutorials)
      });
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Token Award API Call', () => {
    it('calls award tokens API on mount', async () => {
      render(<CompletionStep onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/user/award-tokens',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token'
            }),
            body: JSON.stringify({
              amount: 100,
              reason: 'Welcome bonus for completing onboarding'
            })
          })
        );
      });
    });

    it('retrieves token from localStorage', async () => {
      render(<CompletionStep onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(global.localStorage.getItem).toHaveBeenCalledWith('token');
      });
    });

    it('handles API error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<CompletionStep onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to award welcome bonus:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles API failure response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      render(<CompletionStep onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Next Steps Section', () => {
    it('displays "Recommended Next Steps" heading', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('Recommended Next Steps')).toBeInTheDocument();
    });

    it('displays all four recommended steps', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText(/Explore communities and join ones you like/i)).toBeInTheDocument();
      expect(screen.getByText(/Create your first post to introduce yourself/i)).toBeInTheDocument();
      expect(screen.getByText(/Try voice chat in a community room/i)).toBeInTheDocument();
      expect(screen.getByText(/Connect your crypto wallet for token rewards/i)).toBeInTheDocument();
    });

    it('displays checkmark icons for next steps', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBeGreaterThanOrEqual(4);
    });

    it('renders next steps in proper section styling', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      const nextStepsSection = container.querySelector('.bg-blue-50');
      expect(nextStepsSection).toBeInTheDocument();
      expect(nextStepsSection).toHaveTextContent('Recommended Next Steps');
    });
  });

  describe('Available Tutorials Section', () => {
    it('displays "Available Tutorials" heading', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('Available Tutorials')).toBeInTheDocument();
    });

    it('displays first 4 tutorials', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('How to Create Posts')).toBeInTheDocument();
      expect(screen.getByText('Community Guidelines')).toBeInTheDocument();
      expect(screen.getByText('Voice Chat Basics')).toBeInTheDocument();
      expect(screen.getByText('Earning Tokens')).toBeInTheDocument();
    });

    it('displays tutorial rewards', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('+50 CRYB')).toBeInTheDocument();
      expect(screen.getByText('+25 CRYB')).toBeInTheDocument();
      expect(screen.getByText('+75 CRYB')).toBeInTheDocument();
      expect(screen.getByText('+100 CRYB')).toBeInTheDocument();
    });

    it('shows additional tutorials count when more than 4', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('+1 more tutorials available')).toBeInTheDocument();
    });

    it('does not show additional count when 4 or fewer tutorials', () => {
      mockUseOnboarding.mockReturnValue({
        userProgress: mockUserProgress,
        getAvailableTutorials: jest.fn().mockReturnValue(mockTutorials.slice(0, 3))
      });
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.queryByText(/more tutorials available/i)).not.toBeInTheDocument();
    });

    it('handles empty tutorials array', () => {
      mockUseOnboarding.mockReturnValue({
        userProgress: mockUserProgress,
        getAvailableTutorials: jest.fn().mockReturnValue([])
      });
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('Available Tutorials')).toBeInTheDocument();
    });

    it('calls getAvailableTutorials from context', () => {
      const getAvailableTutorialsMock = jest.fn().mockReturnValue(mockTutorials);
      mockUseOnboarding.mockReturnValue({
        userProgress: mockUserProgress,
        getAvailableTutorials: getAvailableTutorialsMock
      });

      render(<CompletionStep onComplete={mockOnComplete} />);

      expect(getAvailableTutorialsMock).toHaveBeenCalled();
    });
  });

  describe('Community Values Section', () => {
    it('displays "Remember Our Community Values" heading', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('Remember Our Community Values')).toBeInTheDocument();
    });

    it('displays all four community values', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('Be Respectful')).toBeInTheDocument();
      expect(screen.getByText('Share Knowledge')).toBeInTheDocument();
      expect(screen.getByText('Stay Positive')).toBeInTheDocument();
      expect(screen.getByText('Keep It Safe')).toBeInTheDocument();
    });

    it('displays community value emojis', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('🤝')).toBeInTheDocument();
      expect(screen.getByText('💡')).toBeInTheDocument();
      expect(screen.getByText('🌟')).toBeInTheDocument();
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });
  });

  describe('Social Links Section', () => {
    it('displays "Stay Connected" heading', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('Stay Connected')).toBeInTheDocument();
    });

    it('displays Twitter link with correct href', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const twitterLink = screen.getByRole('link', { name: /Twitter/i });
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/cryb_platform');
      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('displays Community link with correct href', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const communityLink = screen.getByRole('link', { name: /Community/i });
      expect(communityLink).toHaveAttribute('href', 'https://community.cryb.app');
      expect(communityLink).toHaveAttribute('target', '_blank');
      expect(communityLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('displays Support link with correct href', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const supportLink = screen.getByRole('link', { name: /Support/i });
      expect(supportLink).toHaveAttribute('href', 'https://support.cryb.app');
      expect(supportLink).toHaveAttribute('target', '_blank');
      expect(supportLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Start Exploring Button', () => {
    it('calls onComplete when clicked', async () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const button = screen.getByRole('button', { name: /Start Exploring CRYB!/i });

      await userEvent.click(button);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('is keyboard accessible', async () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const button = screen.getByRole('button', { name: /Start Exploring CRYB!/i });

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: 'Enter' });
      await waitFor(() => {
        expect(button).toBeInTheDocument();
      });
    });

    it('has proper styling classes', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const button = screen.getByRole('button', { name: /Start Exploring CRYB!/i });

      expect(button.className).toContain('bg-gradient-to-r');
      expect(button.className).toContain('from-green-600');
      expect(button.className).toContain('to-blue-600');
    });
  });

  describe('Help Links', () => {
    it('displays help center link', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const helpLink = screen.getByRole('link', { name: /Help Center/i });
      expect(helpLink).toHaveAttribute('href', '/help');
    });

    it('displays help community link', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const helpCommunityLink = screen.getByRole('link', { name: /Help Community/i });
      expect(helpCommunityLink).toHaveAttribute('href', '/communities/help');
    });

    it('displays "Need help?" message', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText(/Need help\?/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('uses responsive grid classes for rewards', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      const rewardsGrid = container.querySelector('.grid.md\\:grid-cols-3');
      expect(rewardsGrid).toBeInTheDocument();
    });

    it('uses responsive grid classes for next steps and tutorials', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      const nextStepsGrid = container.querySelectorAll('.grid.md\\:grid-cols-2');
      expect(nextStepsGrid.length).toBeGreaterThan(0);
    });

    it('uses responsive grid classes for community values', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      const valuesGrid = container.querySelector('.grid.md\\:grid-cols-4');
      expect(valuesGrid).toBeInTheDocument();
    });

    it('centers content properly', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      const mainContainer = container.querySelector('.text-center');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('useOnboarding Context Integration', () => {
    it('retrieves user progress from context', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(mockUseOnboarding).toHaveBeenCalled();
    });

    it('displays correct achievement count from context', () => {
      const customProgress = {
        achievements: [
          { id: '1', name: 'Test 1' },
          { id: '2', name: 'Test 2' },
          { id: '3', name: 'Test 3' },
          { id: '4', name: 'Test 4' },
          { id: '5', name: 'Test 5' }
        ]
      };

      mockUseOnboarding.mockReturnValue({
        userProgress: customProgress,
        getAvailableTutorials: jest.fn().mockReturnValue([])
      });

      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('handles missing userProgress gracefully', () => {
      mockUseOnboarding.mockReturnValue({
        userProgress: null,
        getAvailableTutorials: jest.fn().mockReturnValue([])
      });

      expect(() => render(<CompletionStep onComplete={mockOnComplete} />)).toThrow();
    });
  });

  describe('useAuth Context Integration', () => {
    it('retrieves user from context', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(mockUseAuth).toHaveBeenCalled();
    });

    it('displays correct username from context', () => {
      const customUser = { username: 'customuser' };
      mockUseAuth.mockReturnValue({ user: customUser });

      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText(/Congratulations, customuser!/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onComplete prop', () => {
      render(<CompletionStep />);
      const button = screen.getByRole('button', { name: /Start Exploring CRYB!/i });
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('renders with minimal context data', () => {
      mockUseOnboarding.mockReturnValue({
        userProgress: { achievements: [] },
        getAvailableTutorials: jest.fn().mockReturnValue([])
      });

      expect(() => render(<CompletionStep onComplete={mockOnComplete} />)).not.toThrow();
    });

    it('handles very long username', () => {
      mockUseAuth.mockReturnValue({
        user: { username: 'verylongusernamethatmightcauselayoutissues' }
      });

      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText(/verylongusernamethatmightcauselayoutissues/i)).toBeInTheDocument();
    });

    it('handles large number of tutorials', () => {
      const manyTutorials = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        title: `Tutorial ${i}`,
        reward: 50
      }));

      mockUseOnboarding.mockReturnValue({
        userProgress: mockUserProgress,
        getAvailableTutorials: jest.fn().mockReturnValue(manyTutorials)
      });

      render(<CompletionStep onComplete={mockOnComplete} />);
      expect(screen.getByText('+46 more tutorials available')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic HTML structure', () => {
      const { container } = render(<CompletionStep onComplete={mockOnComplete} />);
      expect(container.querySelector('h3')).toBeInTheDocument();
      expect(container.querySelector('h4')).toBeInTheDocument();
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('all links are keyboard accessible', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const links = screen.getAllByRole('link');

      links.forEach(link => {
        link.focus();
        expect(link).toHaveFocus();
      });
    });

    it('button is keyboard accessible', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);
      const button = screen.getByRole('button', { name: /Start Exploring CRYB!/i });

      button.focus();
      expect(button).toHaveFocus();
    });

    it('external links have security attributes', () => {
      render(<CompletionStep onComplete={mockOnComplete} />);

      const twitterLink = screen.getByRole('link', { name: /Twitter/i });
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(twitterLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Component Lifecycle', () => {
    it('awards tokens only once on mount', async () => {
      const { rerender } = render(<CompletionStep onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      rerender(<CompletionStep onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('cleans up timer on unmount', () => {
      const { unmount } = render(<CompletionStep onComplete={mockOnComplete} />);
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});

export default mockUseAuth
