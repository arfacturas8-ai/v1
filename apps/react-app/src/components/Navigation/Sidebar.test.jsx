import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigation } from '../../contexts/NavigationContext';

jest.mock('../../contexts/AuthContext.jsx');
jest.mock('../../contexts/NavigationContext');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' })
}));

const defaultNavigationConfig = {
  primary: [
    { id: 'home', label: 'Home', path: '/', icon: 'Home', description: 'Go to home' },
    { id: 'explore', label: 'Explore', path: '/explore', icon: 'Hash', description: 'Explore content' },
    { id: 'messages', label: 'Messages', path: '/messages', icon: 'MessageCircle', description: 'View messages' }
  ],
  secondary: [
    { id: 'trending', label: 'Trending', path: '/trending', icon: 'TrendingUp', description: 'View trending' },
    { id: 'search', label: 'Search', path: '/search', icon: 'Search', description: 'Search content' }
  ],
  quickActions: [
    { id: 'create-post', label: 'Create Post', path: '/create-post', icon: 'Plus', description: 'Create new post' }
  ],
  account: [
    { id: 'profile', label: 'Profile', path: '/profile', icon: 'User', description: 'View profile' },
    { id: 'settings', label: 'Settings', path: '/settings', icon: 'Settings', description: 'Manage settings' }
  ]
};

const defaultUser = {
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com'
};

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Sidebar', () => {
  let mockLogout;
  let mockToggleSidebar;

  beforeEach(() => {
    mockLogout = jest.fn();
    mockToggleSidebar = jest.fn();

    useAuth.mockReturnValue({
      user: defaultUser,
      logout: mockLogout
    });

    useNavigation.mockReturnValue({
      isSidebarOpen: true,
      toggleSidebar: mockToggleSidebar,
      navigationConfig: defaultNavigationConfig
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders sidebar without crashing', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('renders sidebar header', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
    });

    it('renders all section headers', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Discover')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Recent Communities')).toBeInTheDocument();
    });

    it('renders sidebar footer', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });

  describe('User Information', () => {
    it('displays user quick info when user is logged in', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays username initial in avatar', () => {
      renderWithRouter(<Sidebar />);
      const avatar = screen.getByText('T');
      expect(avatar).toBeInTheDocument();
    });

    it('displays username when displayName is not available', () => {
      useAuth.mockReturnValue({
        user: { username: 'johndoe', email: 'john@example.com' },
        logout: mockLogout
      });
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    it('displays fallback email when user email is not available', () => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', displayName: 'Test User' },
        logout: mockLogout
      });
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('user@cryb.com')).toBeInTheDocument();
    });

    it('displays fallback username initial when username is not available', () => {
      useAuth.mockReturnValue({
        user: { email: 'test@example.com' },
        logout: mockLogout
      });
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('does not render user quick info when user is null', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });
      renderWithRouter(<Sidebar />);
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  describe('User Stats', () => {
    it('displays user stats when user is logged in', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Your Stats')).toBeInTheDocument();
      expect(screen.getByText('Posts')).toBeInTheDocument();
      expect(screen.getByText('Karma')).toBeInTheDocument();
      expect(screen.getByText('Awards')).toBeInTheDocument();
    });

    it('displays stat values', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('1,247')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('does not render user stats when user is null', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });
      renderWithRouter(<Sidebar />);
      expect(screen.queryByText('Your Stats')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    it('renders all primary navigation items', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    it('renders all secondary navigation items', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Trending')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('renders all quick action items', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Create Post')).toBeInTheDocument();
    });

    it('renders all account navigation items', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders navigation items with correct aria labels', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByLabelText('Go to home')).toBeInTheDocument();
      expect(screen.getByLabelText('Explore content')).toBeInTheDocument();
    });

    it('handles navigation items without descriptions', () => {
      const configWithoutDescriptions = {
        ...defaultNavigationConfig,
        primary: [{ id: 'home', label: 'Home', path: '/', icon: 'Home' }]
      };
      useNavigation.mockReturnValue({
        isSidebarOpen: true,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: configWithoutDescriptions
      });
      renderWithRouter(<Sidebar />);
      expect(screen.getByLabelText('Home')).toBeInTheDocument();
    });
  });

  describe('Active Link Highlighting', () => {
    it('highlights active primary navigation item', () => {
      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ pathname: '/explore' });

      renderWithRouter(<Sidebar />);
      const exploreLink = screen.getByText('Explore').closest('a');
      expect(exploreLink).toHaveClass('bg-primary-trust');
      expect(exploreLink).toHaveClass('text-white');
    });

    it('shows pulse indicator on active link', () => {
      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ pathname: '/' });

      renderWithRouter(<Sidebar />);
      const homeLink = screen.getByText('Home').closest('a');
      const pulseIndicator = homeLink.querySelector('.animate-pulse');
      expect(pulseIndicator).toBeInTheDocument();
    });

    it('does not show pulse indicator on inactive links', () => {
      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ pathname: '/' });

      renderWithRouter(<Sidebar />);
      const exploreLink = screen.getByText('Explore').closest('a');
      const pulseIndicator = exploreLink.querySelector('.animate-pulse');
      expect(pulseIndicator).not.toBeInTheDocument();
    });

    it('highlights active account navigation item', () => {
      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ pathname: '/settings' });

      renderWithRouter(<Sidebar />);
      const settingsLink = screen.getByText('Settings').closest('a');
      expect(settingsLink).toHaveClass('bg-primary-trust');
    });
  });

  describe('Communities Section', () => {
    it('renders recent communities section', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Recent Communities')).toBeInTheDocument();
    });

    it('displays all recent communities', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('c/technology')).toBeInTheDocument();
      expect(screen.getByText('c/gaming')).toBeInTheDocument();
      expect(screen.getByText('c/crypto')).toBeInTheDocument();
    });

    it('displays community member counts', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('125k')).toBeInTheDocument();
      expect(screen.getByText('89k')).toBeInTheDocument();
      expect(screen.getByText('67k')).toBeInTheDocument();
    });

    it('displays community initials', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('T')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('renders View All communities link', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('View All')).toBeInTheDocument();
    });

    it('community links have correct href attributes', () => {
      renderWithRouter(<Sidebar />);
      const techLink = screen.getByText('c/technology').closest('a');
      expect(techLink).toHaveAttribute('href', '/c/technology');
    });

    it('View All link has correct href', () => {
      renderWithRouter(<Sidebar />);
      const viewAllLink = screen.getByText('View All').closest('a');
      expect(viewAllLink).toHaveAttribute('href', '/communities');
    });
  });

  describe('Sidebar Toggle Functionality', () => {
    it('displays sidebar when isSidebarOpen is true', () => {
      renderWithRouter(<Sidebar />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('translate-x-0');
    });

    it('hides sidebar when isSidebarOpen is false', () => {
      useNavigation.mockReturnValue({
        isSidebarOpen: false,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: defaultNavigationConfig
      });
      renderWithRouter(<Sidebar />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('calls toggleSidebar when close button is clicked', () => {
      renderWithRouter(<Sidebar />);
      const closeButton = screen.getByLabelText('Close sidebar');
      fireEvent.click(closeButton);
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('calls toggleSidebar when navigation item is clicked', () => {
      renderWithRouter(<Sidebar />);
      const homeLink = screen.getByText('Home');
      fireEvent.click(homeLink);
      expect(mockToggleSidebar).toHaveBeenCalled();
    });

    it('calls toggleSidebar when community link is clicked', () => {
      renderWithRouter(<Sidebar />);
      const communityLink = screen.getByText('c/technology');
      fireEvent.click(communityLink);
      expect(mockToggleSidebar).toHaveBeenCalled();
    });

    it('calls toggleSidebar when View All link is clicked', () => {
      renderWithRouter(<Sidebar />);
      const viewAllLink = screen.getByText('View All');
      fireEvent.click(viewAllLink);
      expect(mockToggleSidebar).toHaveBeenCalled();
    });
  });

  describe('Logout Functionality', () => {
    it('renders sign out button', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('calls logout when sign out button is clicked', () => {
      renderWithRouter(<Sidebar />);
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('calls toggleSidebar when sign out button is clicked', () => {
      renderWithRouter(<Sidebar />);
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('sign out button has error styling', () => {
      renderWithRouter(<Sidebar />);
      const signOutButton = screen.getByText('Sign Out');
      expect(signOutButton).toHaveClass('text-error');
    });
  });

  describe('Mobile Overlay', () => {
    it('renders overlay when sidebar is open', () => {
      renderWithRouter(<Sidebar />);
      const overlay = screen.getByLabelText('Close sidebar', { selector: 'div' });
      expect(overlay).toBeInTheDocument();
    });

    it('does not render overlay when sidebar is closed', () => {
      useNavigation.mockReturnValue({
        isSidebarOpen: false,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: defaultNavigationConfig
      });
      renderWithRouter(<Sidebar />);
      const overlay = screen.queryByLabelText('Close sidebar', { selector: 'div' });
      expect(overlay).not.toBeInTheDocument();
    });

    it('calls toggleSidebar when overlay is clicked', () => {
      renderWithRouter(<Sidebar />);
      const overlay = screen.getByLabelText('Close sidebar', { selector: 'div' });
      fireEvent.click(overlay);
      expect(mockToggleSidebar).toHaveBeenCalled();
    });

    it('overlay has correct styling', () => {
      renderWithRouter(<Sidebar />);
      const overlay = screen.getByLabelText('Close sidebar', { selector: 'div' });
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
      expect(overlay).toHaveClass('bg-black/50');
    });
  });

  describe('Responsive Behavior', () => {
    it('sidebar has correct responsive classes', () => {
      renderWithRouter(<Sidebar />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('lg:translate-x-0');
    });

    it('close button is hidden on large screens', () => {
      renderWithRouter(<Sidebar />);
      const closeButton = screen.getByLabelText('Close sidebar');
      expect(closeButton).toHaveClass('lg:hidden');
    });

    it('overlay is hidden on large screens', () => {
      renderWithRouter(<Sidebar />);
      const overlay = screen.getByLabelText('Close sidebar', { selector: 'div' });
      expect(overlay).toHaveClass('lg:hidden');
    });
  });

  describe('Accessibility', () => {
    it('sidebar has correct ARIA role', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('close button has correct aria label', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
    });

    it('navigation items have correct aria labels', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByLabelText('Go to home')).toBeInTheDocument();
      expect(screen.getByLabelText('Explore content')).toBeInTheDocument();
    });

    it('all interactive elements are keyboard accessible', () => {
      renderWithRouter(<Sidebar />);
      const homeLink = screen.getByText('Home');
      expect(homeLink.closest('a')).toHaveAttribute('href');
    });

    it('overlay has correct aria label', () => {
      renderWithRouter(<Sidebar />);
      const overlay = screen.getByLabelText('Close sidebar', { selector: 'div' });
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Navigation Configuration', () => {
    it('handles empty primary navigation', () => {
      useNavigation.mockReturnValue({
        isSidebarOpen: true,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: { ...defaultNavigationConfig, primary: [] }
      });
      renderWithRouter(<Sidebar />);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('handles empty secondary navigation', () => {
      useNavigation.mockReturnValue({
        isSidebarOpen: true,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: { ...defaultNavigationConfig, secondary: [] }
      });
      renderWithRouter(<Sidebar />);
      expect(screen.queryByText('Trending')).not.toBeInTheDocument();
    });

    it('handles empty quick actions', () => {
      useNavigation.mockReturnValue({
        isSidebarOpen: true,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: { ...defaultNavigationConfig, quickActions: [] }
      });
      renderWithRouter(<Sidebar />);
      expect(screen.queryByText('Create Post')).not.toBeInTheDocument();
    });

    it('handles empty account navigation', () => {
      useNavigation.mockReturnValue({
        isSidebarOpen: true,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: { ...defaultNavigationConfig, account: [] }
      });
      renderWithRouter(<Sidebar />);
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    it('renders custom navigation items', () => {
      const customConfig = {
        ...defaultNavigationConfig,
        primary: [
          { id: 'custom', label: 'Custom Link', path: '/custom', icon: 'Star', description: 'Custom' }
        ]
      };
      useNavigation.mockReturnValue({
        isSidebarOpen: true,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: customConfig
      });
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Custom Link')).toBeInTheDocument();
    });
  });

  describe('Styling and Visual Elements', () => {
    it('applies correct gradient to user avatar', () => {
      renderWithRouter(<Sidebar />);
      const avatar = screen.getByText('T');
      expect(avatar).toHaveClass('bg-gradient-primary');
    });

    it('applies correct styling to active navigation items', () => {
      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ pathname: '/' });

      renderWithRouter(<Sidebar />);
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass('bg-primary-trust');
      expect(homeLink).toHaveClass('text-white');
      expect(homeLink).toHaveClass('shadow-lg');
    });

    it('applies hover styling to inactive navigation items', () => {
      renderWithRouter(<Sidebar />);
      const exploreLink = screen.getByText('Explore').closest('a');
      expect(exploreLink).toHaveClass('hover:text-primary');
      expect(exploreLink).toHaveClass('hover:bg-hover');
    });

    it('applies border to quick action items', () => {
      renderWithRouter(<Sidebar />);
      const createPostLink = screen.getByText('Create Post').closest('a');
      expect(createPostLink).toHaveClass('border');
      expect(createPostLink).toHaveClass('border-secondary');
    });

    it('user stats have correct styling', () => {
      renderWithRouter(<Sidebar />);
      const postsLabel = screen.getByText('Posts');
      const statContainer = postsLabel.closest('div');
      expect(statContainer).toHaveClass('bg-tertiary');
      expect(statContainer).toHaveClass('rounded-lg');
    });
  });

  describe('Icon Rendering', () => {
    it('renders navigation item icons', () => {
      renderWithRouter(<Sidebar />);
      const homeLink = screen.getByLabelText('Go to home');
      expect(homeLink.querySelector('svg')).toBeInTheDocument();
    });

    it('renders section header icons', () => {
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Main').previousSibling).toBeTruthy();
    });

    it('renders stat icons', () => {
      renderWithRouter(<Sidebar />);
      const statsSection = screen.getByText('Your Stats').closest('section');
      const icons = statsSection.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders logout icon', () => {
      renderWithRouter(<Sidebar />);
      const signOutButton = screen.getByText('Sign Out');
      expect(signOutButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Link Navigation', () => {
    it('primary navigation items have correct href', () => {
      renderWithRouter(<Sidebar />);
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('secondary navigation items have correct href', () => {
      renderWithRouter(<Sidebar />);
      const trendingLink = screen.getByText('Trending').closest('a');
      expect(trendingLink).toHaveAttribute('href', '/trending');
    });

    it('quick action items have correct href', () => {
      renderWithRouter(<Sidebar />);
      const createPostLink = screen.getByText('Create Post').closest('a');
      expect(createPostLink).toHaveAttribute('href', '/create-post');
    });

    it('account navigation items have correct href', () => {
      renderWithRouter(<Sidebar />);
      const profileLink = screen.getByText('Profile').closest('a');
      expect(profileLink).toHaveAttribute('href', '/profile');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing icon in iconMap gracefully', () => {
      const configWithInvalidIcon = {
        ...defaultNavigationConfig,
        primary: [
          { id: 'test', label: 'Test', path: '/test', icon: 'InvalidIcon' }
        ]
      };
      useNavigation.mockReturnValue({
        isSidebarOpen: true,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: configWithInvalidIcon
      });
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles very long usernames', () => {
      useAuth.mockReturnValue({
        user: {
          username: 'verylongusernamethatexceedsnormallength',
          displayName: 'Very Long Display Name That Exceeds Normal Length',
          email: 'verylongemailaddress@example.com'
        },
        logout: mockLogout
      });
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Very Long Display Name That Exceeds Normal Length')).toBeInTheDocument();
    });

    it('handles navigation config with many items', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        label: `Item ${i}`,
        path: `/item-${i}`,
        icon: 'Home'
      }));
      useNavigation.mockReturnValue({
        isSidebarOpen: true,
        toggleSidebar: mockToggleSidebar,
        navigationConfig: { ...defaultNavigationConfig, primary: manyItems }
      });
      renderWithRouter(<Sidebar />);
      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 19')).toBeInTheDocument();
    });

    it('handles rapid toggling', () => {
      renderWithRouter(<Sidebar />);
      const closeButton = screen.getByLabelText('Close sidebar');

      fireEvent.click(closeButton);
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);

      expect(mockToggleSidebar).toHaveBeenCalledTimes(3);
    });

    it('handles navigation when location changes', () => {
      const { rerender } = renderWithRouter(<Sidebar />);

      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ pathname: '/explore' });

      rerender(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const exploreLink = screen.getByText('Explore').closest('a');
      expect(exploreLink).toHaveClass('bg-primary-trust');
    });
  });

  describe('Scrolling Behavior', () => {
    it('sidebar content has overflow-y-auto', () => {
      renderWithRouter(<Sidebar />);
      const sidebar = screen.getByRole('complementary');
      const scrollableContent = sidebar.querySelector('.overflow-y-auto');
      expect(scrollableContent).toBeInTheDocument();
    });

    it('sidebar has fixed positioning', () => {
      renderWithRouter(<Sidebar />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('fixed');
    });
  });

  describe('Section Organization', () => {
    it('sections are properly separated', () => {
      renderWithRouter(<Sidebar />);
      const sections = screen.getAllByRole('navigation');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('maintains section order', () => {
      renderWithRouter(<Sidebar />);
      const allText = screen.getByRole('complementary').textContent;
      const mainIndex = allText.indexOf('Main');
      const discoverIndex = allText.indexOf('Discover');
      const createIndex = allText.indexOf('Create');

      expect(mainIndex).toBeLessThan(discoverIndex);
      expect(discoverIndex).toBeLessThan(createIndex);
    });
  });

  describe('Animation Classes', () => {
    it('applies transition classes to sidebar', () => {
      renderWithRouter(<Sidebar />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('transition-transform');
      expect(sidebar).toHaveClass('duration-300');
    });

    it('applies animation to pulse indicator', () => {
      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ pathname: '/' });

      renderWithRouter(<Sidebar />);
      const homeLink = screen.getByText('Home').closest('a');
      const pulseIndicator = homeLink.querySelector('.animate-pulse');
      expect(pulseIndicator).toHaveClass('animate-pulse');
    });
  });

  describe('Z-Index and Layering', () => {
    it('sidebar has correct z-index', () => {
      renderWithRouter(<Sidebar />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('z-40');
    });

    it('overlay has correct z-index', () => {
      renderWithRouter(<Sidebar />);
      const overlay = screen.getByLabelText('Close sidebar', { selector: 'div' });
      expect(overlay).toHaveClass('z-30');
    });
  });
});

export default mockNavigate
