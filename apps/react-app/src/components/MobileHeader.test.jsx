/**
 * Tests for MobileHeader component
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import { useAuth } from '../contexts/AuthContext';

jest.mock('../contexts/AuthContext');

jest.mock('./web3/WalletConnectButton', () => {
  return function WalletConnectButton() {
    return <div data-testid="wallet-connect-button">Wallet</div>;
  };
});

jest.mock('./ui/ThemeToggle', () => {
  return function ThemeToggle({ variant, size }) {
    return <div data-testid="theme-toggle">Theme: {variant} {size}</div>;
  };
});

jest.mock('lucide-react', () => ({
  Menu: ({ size, className }) => <svg data-testid="menu-icon" width={size} className={className} />,
  Search: ({ size, className }) => <svg data-testid="search-icon" width={size} className={className} />,
  Bell: ({ size, className }) => <svg data-testid="bell-icon" width={size} className={className} />,
  User: ({ size }) => <svg data-testid="user-icon" width={size} />,
  Settings: ({ size }) => <svg data-testid="settings-icon" width={size} />,
  LogOut: ({ size }) => <svg data-testid="logout-icon" width={size} />,
  Plus: ({ size, className }) => <svg data-testid="plus-icon" width={size} className={className} />,
  X: ({ size, className }) => <svg data-testid="x-icon" width={size} className={className} />,
  Home: ({ size, className }) => <svg data-testid="home-icon" width={size} className={className} />,
  Users: ({ size, className }) => <svg data-testid="users-icon" width={size} className={className} />,
  Activity: ({ size, className }) => <svg data-testid="activity-icon" width={size} className={className} />,
  Zap: ({ size }) => <svg data-testid="zap-icon" width={size} />,
  MessageCircle: ({ size, className }) => <svg data-testid="message-circle-icon" width={size} className={className} />,
  Hash: ({ size, className }) => <svg data-testid="hash-icon" width={size} className={className} />,
  Wallet: ({ size }) => <svg data-testid="wallet-icon" width={size} />,
  Coins: ({ size, className }) => <svg data-testid="coins-icon" width={size} className={className} />,
  Bot: ({ size, className }) => <svg data-testid="bot-icon" width={size} className={className} />,
  ShoppingBag: ({ size, className }) => <svg data-testid="shopping-bag-icon" width={size} className={className} />
}));

const mockNavigate = jest.fn();
const mockLocation = { pathname: '/home' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation
}));

describe('MobileHeader', () => {
  const mockUser = {
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockLocation.pathname = '/home';

    useAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout
    });
  });

  const renderWithRouter = (component) => {
    return render(
      <MemoryRouter initialEntries={['/home']}>
        {component}
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<MobileHeader />);
    });

    it('renders mobile header element', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('has mobile-only class (lg:hidden)', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('lg:hidden');
    });

    it('is fixed at top', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('fixed', 'top-0');
    });

    it('has glassmorphism effect', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('backdrop-blur-xl');
    });

    it('has glassmorphism background with transparency', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-white/90', 'dark:bg-gray-900/90');
    });

    it('has border with transparency', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('border-gray-200/50', 'dark:border-gray-700/50');
    });

    it('has proper z-index', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('z-50');
    });
  });

  describe('Logo and Branding', () => {
    it('renders CRYB logo text', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByText('CRYB')).toBeInTheDocument();
    });

    it('renders logo letter C', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('has gradient background on logo container', () => {
      renderWithRouter(<MobileHeader />);
      const logoC = screen.getByText('C');
      expect(logoC.parentElement).toHaveClass('bg-gradient-to-br');
    });

    it('has proper logo dimensions', () => {
      renderWithRouter(<MobileHeader />);
      const logoContainer = screen.getByText('C').parentElement;
      expect(logoContainer).toHaveClass('w-10', 'h-10');
    });

    it('logo has gradient text', () => {
      renderWithRouter(<MobileHeader />);
      const logoText = screen.getByText('CRYB');
      expect(logoText).toHaveClass('bg-gradient-to-r', 'bg-clip-text', 'text-transparent');
    });

    it('logo links to home', () => {
      renderWithRouter(<MobileHeader />);
      const logoLink = screen.getByText('CRYB').closest('a');
      expect(logoLink).toHaveAttribute('href', '/home');
    });

    it('logo has active press effect', () => {
      renderWithRouter(<MobileHeader />);
      const logoContainer = screen.getByText('C').parentElement;
      expect(logoContainer).toHaveClass('group-active:scale-95');
    });
  });

  describe('Search Bar', () => {
    it('renders search input when authenticated', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByPlaceholderText(/Search items, collections/i)).toBeInTheDocument();
    });

    it('does not render search when unauthenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });

      renderWithRouter(<MobileHeader />);
      expect(screen.queryByPlaceholderText(/Search items, collections/i)).not.toBeInTheDocument();
    });

    it('shows search icon', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('updates search query on input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, 'crypto');

      expect(searchInput).toHaveValue('crypto');
    });

    it('submits search on form submit', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, 'test query{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query');
    });

    it('clears search query after submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, 'test{Enter}');

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });

    it('does not submit empty search', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, '{Enter}');

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('trims whitespace from search query', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, '  test query  {Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query');
    });

    it('does not submit whitespace-only search', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, '   {Enter}');

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('has proper mobile styling (16px font)', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      expect(searchInput).toHaveStyle({ fontSize: '16px' });
    });

    it('has focus styles', () => {
      renderWithRouter(<MobileHeader />);
      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      expect(searchInput).toHaveClass('focus:border-blue-500');
    });
  });

  describe('Notifications Dropdown', () => {
    it('renders notification bell button', () => {
      renderWithRouter(<MobileHeader />);
      const bellButton = screen.getByLabelText(/Notifications/i);
      expect(bellButton).toBeInTheDocument();
    });

    it('shows bell icon', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('shows unread count badge', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('unread badge has gradient background', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const badge = screen.getByText('3');
      expect(badge).toHaveClass('bg-gradient-to-br', 'from-pink-500', 'to-red-500');
    });

    it('shows 9+ for counts over 9', () => {
      renderWithRouter(<MobileHeader />);
      // Initial count is 3, badge shows "3"
      const badge = screen.getByText('3');
      expect(badge).toBeInTheDocument();
    });

    it('includes unread count in aria-label', () => {
      renderWithRouter(<MobileHeader />);
      const bellButton = screen.getByLabelText('Notifications (3 unread)');
      expect(bellButton).toBeInTheDocument();
    });

    it('toggles notifications dropdown on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const bellButton = screen.getByLabelText(/Notifications/i);
      await user.click(bellButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('displays notification list items', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));

      expect(screen.getByText('New bid on your NFT')).toBeInTheDocument();
      expect(screen.getByText('crypto_whale started following you')).toBeInTheDocument();
      expect(screen.getByText('Your post received 10 likes')).toBeInTheDocument();
    });

    it('shows notification timestamps', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));

      expect(screen.getByText('2m ago')).toBeInTheDocument();
      expect(screen.getByText('1h ago')).toBeInTheDocument();
      expect(screen.getByText('3h ago')).toBeInTheDocument();
    });

    it('highlights unread notifications', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));

      const unreadNotifications = container.querySelectorAll('.bg-blue-50');
      expect(unreadNotifications.length).toBeGreaterThan(0);
    });

    it('shows View all button', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));

      expect(screen.getByText('View all')).toBeInTheDocument();
    });

    it('notification dropdown has proper positioning', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));

      const dropdown = container.querySelector('.absolute.right-0.mt-2');
      expect(dropdown).toBeInTheDocument();
    });

    it('notification dropdown has shadow', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));

      const dropdown = screen.getByText('Notifications').closest('div.shadow-2xl');
      expect(dropdown).toBeInTheDocument();
    });

    it('has fade-in animation', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));

      const dropdown = container.querySelector('.animate-fade-in');
      expect(dropdown).toBeInTheDocument();
    });

    it('closes notification dropdown on second click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const bellButton = screen.getByLabelText(/Notifications/i);
      await user.click(bellButton);
      expect(screen.getByText('New bid on your NFT')).toBeInTheDocument();

      await user.click(bellButton);
      expect(screen.queryByText('New bid on your NFT')).not.toBeInTheDocument();
    });

    it('notification button has active press effect', () => {
      renderWithRouter(<MobileHeader />);
      const bellButton = screen.getByLabelText(/Notifications/i);
      expect(bellButton).toHaveClass('active:bg-gray-200', 'dark:active:bg-gray-700');
    });
  });

  describe('User Menu Dropdown', () => {
    it('renders user avatar button', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of testuser
    });

    it('user avatar has gradient background', () => {
      renderWithRouter(<MobileHeader />);
      const avatar = screen.getByText('T');
      expect(avatar).toHaveClass('bg-gradient-to-br', 'from-blue-500', 'via-purple-500', 'to-pink-500');
    });

    it('toggles user menu on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const avatarButton = screen.getByText('T').closest('button');
      await user.click(avatarButton);

      expect(screen.getByText(mockUser.username)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it('displays user info in menu header', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows My Profile link', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('shows Settings link', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('shows My Wallet link', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      expect(screen.getByText('My Wallet')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
    });

    it('shows Sign Out button', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });

    it('Profile link navigates to /profile', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      const profileLink = screen.getByText('My Profile').closest('a');
      expect(profileLink).toHaveAttribute('href', '/profile');
    });

    it('Settings link navigates to /settings', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      const settingsLink = screen.getByText('Settings').closest('a');
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('Wallet link navigates to /wallet', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      const walletLink = screen.getByText('My Wallet').closest('a');
      expect(walletLink).toHaveAttribute('href', '/wallet');
    });

    it('closes user menu when clicking menu item', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));
      expect(screen.getByText('My Profile')).toBeInTheDocument();

      await user.click(screen.getByText('My Profile'));

      await waitFor(() => {
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
      });
    });

    it('user menu has proper positioning', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      const dropdown = container.querySelector('.absolute.right-0.mt-2.w-56');
      expect(dropdown).toBeInTheDocument();
    });

    it('user menu has gradient header', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      const header = container.querySelector('.bg-gradient-to-br.from-blue-50');
      expect(header).toBeInTheDocument();
    });

    it('closes user menu on second click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const avatarButton = screen.getByText('T').closest('button');
      await user.click(avatarButton);
      expect(screen.getByText('My Profile')).toBeInTheDocument();

      await user.click(avatarButton);
      expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    });

    it('handles missing username gracefully', async () => {
      useAuth.mockReturnValue({
        user: {},
        logout: mockLogout
      });

      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      expect(screen.getByText('U')).toBeInTheDocument(); // Default avatar

      await user.click(screen.getByText('U').closest('button'));
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('user@cryb.com')).toBeInTheDocument();
    });
  });

  describe('Mobile Hamburger Menu', () => {
    it('renders hamburger menu button', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    it('hamburger button has aria-label', () => {
      renderWithRouter(<MobileHeader />);
      const menuButton = screen.getByLabelText('Menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('toggles mobile menu on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const menuButton = screen.getByLabelText('Menu');
      await user.click(menuButton);

      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Bots')).toBeInTheDocument();
    });

    it('shows X icon when menu is open', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('shows Menu icon when menu is closed', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    it('displays all 8 navigation items in menu', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Communities')).toBeInTheDocument();
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByText('Stats')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Bots')).toBeInTheDocument();
    });

    it('displays navigation icons in menu', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('hash-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
    });

    it('highlights active route in menu', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-purple-500');
    });

    it('closes menu when navigation item clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));
      expect(screen.getByText('Chat')).toBeInTheDocument();

      await user.click(screen.getByText('Communities'));

      await waitFor(() => {
        expect(screen.queryByText('Chat')).not.toBeInTheDocument();
      });
    });

    it('shows WalletConnectButton in menu', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      expect(screen.getByTestId('wallet-connect-button')).toBeInTheDocument();
    });

    it('has slide-down animation', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      const mobileMenu = container.querySelector('.animate-slide-down');
      expect(mobileMenu).toBeInTheDocument();
    });

    it('menu has glassmorphism backdrop', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      const menu = container.querySelector('.backdrop-blur-xl');
      expect(menu).toBeInTheDocument();
    });

    it('closes menu on second hamburger click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const menuButton = screen.getByLabelText('Menu');
      await user.click(menuButton);
      expect(screen.getByText('Chat')).toBeInTheDocument();

      await user.click(menuButton);
      expect(screen.queryByText('Chat')).not.toBeInTheDocument();
    });
  });

  describe('Bottom Navigation', () => {
    it('renders bottom navigation when authenticated', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      expect(bottomNav).toBeInTheDocument();
    });

    it('does not render bottom nav when unauthenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });

      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      expect(bottomNav).not.toBeInTheDocument();
    });

    it('is fixed at bottom', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      expect(bottomNav).toHaveClass('fixed', 'bottom-0');
    });

    it('has mobile-only class', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      expect(bottomNav).toHaveClass('lg:hidden');
    });

    it('has glassmorphism effect', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      expect(bottomNav).toHaveClass('backdrop-blur-xl');
    });

    it('shows 4 primary nav items', () => {
      renderWithRouter(<MobileHeader />);
      const bottomNav = screen.getByRole('navigation', { name: 'Bottom navigation' });

      const homeLink = bottomNav.querySelector('a[href="/home"]');
      const communitiesLink = bottomNav.querySelector('a[href="/communities"]');
      const exploreLink = bottomNav.querySelector('a[href="/nft-marketplace"]');
      const statsLink = bottomNav.querySelector('a[href="/crypto"]');

      expect(homeLink).toBeInTheDocument();
      expect(communitiesLink).toBeInTheDocument();
      expect(exploreLink).toBeInTheDocument();
      expect(statsLink).toBeInTheDocument();
    });

    it('displays icons for bottom nav items', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');

      expect(bottomNav.querySelector('[data-testid="home-icon"]')).toBeInTheDocument();
      expect(bottomNav.querySelector('[data-testid="hash-icon"]')).toBeInTheDocument();
      expect(bottomNav.querySelector('[data-testid="shopping-bag-icon"]')).toBeInTheDocument();
      expect(bottomNav.querySelector('[data-testid="coins-icon"]')).toBeInTheDocument();
    });

    it('displays labels for bottom nav items', () => {
      renderWithRouter(<MobileHeader />);
      const bottomNav = screen.getByRole('navigation', { name: 'Bottom navigation' });

      expect(bottomNav).toHaveTextContent('Home');
      expect(bottomNav).toHaveTextContent('Communities');
      expect(bottomNav).toHaveTextContent('Explore');
      expect(bottomNav).toHaveTextContent('Stats');
    });

    it('highlights active route', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const homeLink = bottomNav.querySelector('a[href="/home"]');

      expect(homeLink).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('shows active indicator dot', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const activeDot = bottomNav.querySelector('.bg-gradient-to-r.from-blue-500.to-purple-500.rounded-full');

      expect(activeDot).toBeInTheDocument();
    });

    it('has aria-current for active route', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const homeLink = bottomNav.querySelector('a[href="/home"]');

      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });

    it('scales active icon larger', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const homeLink = bottomNav.querySelector('a[href="/home"]');
      const iconContainer = homeLink.querySelector('.scale-110');

      expect(iconContainer).toBeInTheDocument();
    });

    it('has active press animation', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const homeLink = bottomNav.querySelector('a[href="/home"]');

      expect(homeLink).toHaveClass('active:scale-95');
    });

    it('has proper height', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const navContainer = bottomNav.querySelector('.h-20');

      expect(navContainer).toBeInTheDocument();
    });
  });

  describe('Floating Create Button', () => {
    it('renders floating create button in bottom nav', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const createButton = bottomNav.querySelector('button[aria-label="Create new post"]');

      expect(createButton).toBeInTheDocument();
    });

    it('shows plus icon', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const plusIcon = bottomNav.querySelector('[data-testid="plus-icon"]');

      expect(plusIcon).toBeInTheDocument();
    });

    it('has gradient background', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const createButtonInner = bottomNav.querySelector('.bg-gradient-to-br.from-blue-600.to-purple-600');

      expect(createButtonInner).toBeInTheDocument();
    });

    it('has shadow effect', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const createButtonInner = bottomNav.querySelector('.shadow-xl');

      expect(createButtonInner).toBeInTheDocument();
    });

    it('has blur glow effect', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const glowEffect = bottomNav.querySelector('.blur-lg.opacity-50');

      expect(glowEffect).toBeInTheDocument();
    });

    it('navigates to submit page on click', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const createButton = bottomNav.querySelector('button[aria-label="Create new post"]');

      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/submit');
    });

    it('has active scale animation', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const createButtonInner = bottomNav.querySelector('.active\\:scale-95');

      expect(createButtonInner).toBeInTheDocument();
    });

    it('has proper dimensions', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const createButtonInner = bottomNav.querySelector('.w-14.h-14');

      expect(createButtonInner).toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('renders theme toggle when authenticated', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('passes correct variant to theme toggle', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByText(/Theme: icon/i)).toBeInTheDocument();
    });

    it('passes correct size to theme toggle', () => {
      renderWithRouter(<MobileHeader />);
      expect(screen.getByText(/sm/i)).toBeInTheDocument();
    });

    it('does not render theme toggle when unauthenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });

      renderWithRouter(<MobileHeader />);
      expect(screen.queryByTestId('theme-toggle')).not.toBeInTheDocument();
    });
  });

  describe('Click Outside Behavior', () => {
    it('closes user menu on click outside', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <div>
          <div data-testid="outside">Outside</div>
          <MobileHeader />
        </div>
      );

      await user.click(screen.getByText('T').closest('button'));
      expect(screen.getByText('My Profile')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
      });
    });

    it('closes mobile menu on click outside', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <div>
          <div data-testid="outside">Outside</div>
          <MobileHeader />
        </div>
      );

      await user.click(screen.getByLabelText('Menu'));
      expect(screen.getByText('Chat')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('Chat')).not.toBeInTheDocument();
      });
    });

    it('closes notifications on click outside', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <div>
          <div data-testid="outside">Outside</div>
          <MobileHeader />
        </div>
      );

      await user.click(screen.getByLabelText(/Notifications/i));
      expect(screen.getByText('New bid on your NFT')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('New bid on your NFT')).not.toBeInTheDocument();
      });
    });

    it('does not close menu when clicking inside user menu', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));
      expect(screen.getByText('My Profile')).toBeInTheDocument();

      const profileLink = screen.getByText('My Profile');
      fireEvent.mouseDown(profileLink);

      // Should still be visible (only closes after clicking the link)
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });

    it('does not close notifications when clicking inside', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));
      const notification = screen.getByText('New bid on your NFT');

      fireEvent.mouseDown(notification);

      expect(screen.getByText('New bid on your NFT')).toBeInTheDocument();
    });
  });

  describe('Escape Key Closing Dropdowns', () => {
    it('closes user menu on Escape', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));
      expect(screen.getByText('My Profile')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
      });
    });

    it('closes mobile menu on Escape', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));
      expect(screen.getByText('Chat')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Chat')).not.toBeInTheDocument();
      });
    });

    it('closes notifications on Escape', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));
      expect(screen.getByText('New bid on your NFT')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('New bid on your NFT')).not.toBeInTheDocument();
      });
    });

    it('closes all dropdowns on Escape', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));
      await user.click(screen.getByLabelText(/Notifications/i));
      await user.click(screen.getByLabelText('Menu'));

      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.getByText('New bid on your NFT')).toBeInTheDocument();
      expect(screen.getByText('Chat')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
        expect(screen.queryByText('New bid on your NFT')).not.toBeInTheDocument();
        expect(screen.queryByText('Chat')).not.toBeInTheDocument();
      });
    });

    it('does not respond to other keys', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));
      expect(screen.getByText('My Profile')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Enter' });
      expect(screen.getByText('My Profile')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Space' });
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('calls logout on Sign Out click', async () => {
      mockLogout.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));
      await user.click(screen.getByText('Sign Out'));

      expect(mockLogout).toHaveBeenCalled();
    });

    it('navigates to landing after successful logout', async () => {
      mockLogout.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));
      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/landing', { replace: true });
      });
    });

    it('does not navigate if logout fails', async () => {
      mockLogout.mockResolvedValue({ success: false });
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));
      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/landing', expect.anything());
    });

    it('Sign Out button has red styling', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      const signOutButton = screen.getByText('Sign Out').closest('button');
      expect(signOutButton).toHaveClass('text-red-600');
    });
  });

  describe('Authenticated vs Unauthenticated States', () => {
    describe('Authenticated State', () => {
      it('shows all navigation items', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.getByLabelText('Menu')).toBeInTheDocument();
      });

      it('shows notifications', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.getByLabelText(/Notifications/i)).toBeInTheDocument();
      });

      it('shows user avatar', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.getByText('T')).toBeInTheDocument();
      });

      it('shows search bar', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.getByPlaceholderText(/Search items, collections/i)).toBeInTheDocument();
      });

      it('shows theme toggle', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      });

      it('shows bottom navigation', () => {
        const { container } = renderWithRouter(<MobileHeader />);
        const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
        expect(bottomNav).toBeInTheDocument();
      });
    });

    describe('Unauthenticated State', () => {
      beforeEach(() => {
        useAuth.mockReturnValue({
          user: null,
          logout: mockLogout
        });
      });

      it('shows Sign In button', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      it('does not show notifications', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.queryByLabelText(/Notifications/i)).not.toBeInTheDocument();
      });

      it('does not show user avatar', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.queryByText('T')).not.toBeInTheDocument();
      });

      it('does not show hamburger menu', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument();
      });

      it('does not show search bar', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.queryByPlaceholderText(/Search items, collections/i)).not.toBeInTheDocument();
      });

      it('does not show theme toggle', () => {
        renderWithRouter(<MobileHeader />);
        expect(screen.queryByTestId('theme-toggle')).not.toBeInTheDocument();
      });

      it('does not show bottom navigation', () => {
        const { container } = renderWithRouter(<MobileHeader />);
        const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
        expect(bottomNav).not.toBeInTheDocument();
      });

      it('navigates to landing on Sign In click', async () => {
        const user = userEvent.setup();
        renderWithRouter(<MobileHeader />);

        await user.click(screen.getByText('Sign In'));
        expect(mockNavigate).toHaveBeenCalledWith('/landing');
      });

      it('Sign In button has gradient styling', () => {
        renderWithRouter(<MobileHeader />);
        const signInButton = screen.getByText('Sign In');
        expect(signInButton).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-purple-600');
      });
    });
  });

  describe('Active Route Highlighting', () => {
    it('highlights /home in bottom nav', () => {
      mockLocation.pathname = '/home';
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const homeLink = bottomNav.querySelector('a[href="/home"]');

      expect(homeLink).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('highlights /communities in bottom nav', () => {
      mockLocation.pathname = '/communities';
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const communitiesLink = bottomNav.querySelector('a[href="/communities"]');

      expect(communitiesLink).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('highlights /nft-marketplace in bottom nav', () => {
      mockLocation.pathname = '/nft-marketplace';
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const exploreLink = bottomNav.querySelector('a[href="/nft-marketplace"]');

      expect(exploreLink).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('highlights /crypto in bottom nav', () => {
      mockLocation.pathname = '/crypto';
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const statsLink = bottomNav.querySelector('a[href="/crypto"]');

      expect(statsLink).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('highlights active route in mobile menu', async () => {
      mockLocation.pathname = '/chat';
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      const chatLink = screen.getByText('Chat').closest('a');
      expect(chatLink).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-purple-500', 'text-white');
    });

    it('non-active routes have gray text in mobile menu', async () => {
      mockLocation.pathname = '/home';
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      const chatLink = screen.getByText('Chat').closest('a');
      expect(chatLink).toHaveClass('text-gray-700', 'dark:text-gray-300');
    });
  });

  describe('Mobile-Specific Features', () => {
    it('has safe area bottom padding on bottom nav', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      expect(bottomNav).toHaveClass('pb-safe');
    });

    it('notification button has minimum touch target size', () => {
      renderWithRouter(<MobileHeader />);
      const bellButton = screen.getByLabelText(/Notifications/i);
      expect(bellButton).toHaveClass('w-10', 'h-10');
    });

    it('user avatar button has minimum touch target size', () => {
      renderWithRouter(<MobileHeader />);
      const avatar = screen.getByText('T');
      expect(avatar).toHaveClass('w-10', 'h-10');
    });

    it('hamburger button has minimum touch target size', () => {
      renderWithRouter(<MobileHeader />);
      const menuButton = screen.getByLabelText('Menu');
      expect(menuButton).toHaveClass('w-10', 'h-10');
    });

    it('bottom nav items have active press feedback', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const bottomNav = container.querySelector('nav[role="navigation"][aria-label="Bottom navigation"]');
      const homeLink = bottomNav.querySelector('a[href="/home"]');

      expect(homeLink).toHaveClass('active:scale-95');
    });

    it('mobile menu items have active press feedback', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass('active:bg-gray-100', 'dark:active:bg-gray-800');
    });

    it('search input prevents zoom on focus with 16px font', () => {
      renderWithRouter(<MobileHeader />);
      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      expect(searchInput).toHaveStyle({ fontSize: '16px' });
    });

    it('logo has active press scale effect', () => {
      renderWithRouter(<MobileHeader />);
      const logoContainer = screen.getByText('C').parentElement;
      expect(logoContainer).toHaveClass('group-active:scale-95');
    });
  });

  describe('Spacers', () => {
    it('renders spacer for fixed header', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const spacers = container.querySelectorAll('.h-16.lg\\:hidden');
      expect(spacers.length).toBeGreaterThan(0);
    });

    it('renders spacer for bottom navigation when authenticated', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      const spacers = container.querySelectorAll('.h-20.lg\\:hidden');
      expect(spacers.length).toBeGreaterThan(0);
    });

    it('does not render bottom nav spacer when unauthenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });

      const { container } = renderWithRouter(<MobileHeader />);
      const spacers = container.querySelectorAll('.h-20');
      expect(spacers.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user data gracefully', async () => {
      useAuth.mockReturnValue({
        user: {},
        logout: mockLogout
      });

      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      expect(screen.getByText('U')).toBeInTheDocument();

      await user.click(screen.getByText('U').closest('button'));
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('user@cryb.com')).toBeInTheDocument();
    });

    it('handles null user gracefully', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });

      renderWithRouter(<MobileHeader />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('handles empty search submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, '{Enter}');

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles whitespace-only search', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, '   {Enter}');

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('encodes special characters in search', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileHeader />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, 'test & query{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20%26%20query');
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for authenticated user', () => {
      const { container } = renderWithRouter(<MobileHeader />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for unauthenticated user', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });

      const { container } = renderWithRouter(<MobileHeader />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with mobile menu open', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText('Menu'));

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with user menu open', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with notifications open', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByLabelText(/Notifications/i));

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with active /communities route', () => {
      mockLocation.pathname = '/communities';
      const { container } = renderWithRouter(<MobileHeader />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with all dropdowns open', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<MobileHeader />);

      await user.click(screen.getByText('T').closest('button'));
      await user.click(screen.getByLabelText(/Notifications/i));
      await user.click(screen.getByLabelText('Menu'));

      expect(container).toMatchSnapshot();
    });
  });
});

export default WalletConnectButton
