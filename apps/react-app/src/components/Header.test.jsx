/**
 * Tests for Header component
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';

jest.mock('../contexts/AuthContext');

jest.mock('./web3/WalletConnectButton', () => {
  return function WalletConnectButton() {
    return <div data-testid="wallet-connect-button">Wallet</div>;
  };
});

jest.mock('./ui/ThemeToggle', () => {
  return function ThemeToggle({ variant, size }) {
    return <div data-testid="theme-toggle">Theme: {variant}</div>;
  };
});

jest.mock('lucide-react', () => ({
  Menu: ({ size }) => <svg data-testid="menu-icon" width={size} />,
  Search: ({ size, className }) => <svg data-testid="search-icon" width={size} className={className} />,
  Bell: ({ size }) => <svg data-testid="bell-icon" width={size} />,
  User: ({ size }) => <svg data-testid="user-icon" width={size} />,
  Settings: ({ size }) => <svg data-testid="settings-icon" width={size} />,
  LogOut: ({ size }) => <svg data-testid="logout-icon" width={size} />,
  Plus: ({ size }) => <svg data-testid="plus-icon" width={size} />,
  X: ({ size }) => <svg data-testid="x-icon" width={size} />,
  Home: ({ size }) => <svg data-testid="home-icon" width={size} />,
  Users: ({ size }) => <svg data-testid="users-icon" width={size} />,
  Activity: ({ size }) => <svg data-testid="activity-icon" width={size} />,
  Zap: ({ size }) => <svg data-testid="zap-icon" width={size} />,
  MessageCircle: ({ size }) => <svg data-testid="message-circle-icon" width={size} />,
  Hash: ({ size }) => <svg data-testid="hash-icon" width={size} />,
  Wallet: ({ size }) => <svg data-testid="wallet-icon" width={size} />,
  Coins: ({ size }) => <svg data-testid="coins-icon" width={size} />,
  Bot: ({ size }) => <svg data-testid="bot-icon" width={size} />,
  ShoppingBag: ({ size }) => <svg data-testid="shopping-bag-icon" width={size} />,
  ChevronDown: ({ size }) => <svg data-testid="chevron-down-icon" width={size} />
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/home' })
}));

describe('Header', () => {
  const mockUser = {
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

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
      renderWithRouter(<Header />);
    });

    it('renders CRYB logo', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('CRYB')).toBeInTheDocument();
    });

    it('renders logo with gradient', () => {
      renderWithRouter(<Header />);
      const logoContainer = screen.getByText('C');
      expect(logoContainer.parentElement).toHaveClass('bg-gradient-to-br');
    });

    it('has glassmorphism effect', () => {
      const { container } = renderWithRouter(<Header />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('backdrop-blur-xl');
    });

    it('is fixed at top', () => {
      const { container } = renderWithRouter(<Header />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('fixed', 'top-0');
    });
  });

  describe('Navigation Items', () => {
    it('shows primary navigation items', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Communities')).toBeInTheDocument();
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByText('Stats')).toBeInTheDocument();
    });

    it('displays navigation icons', () => {
      renderWithRouter(<Header />);
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('hash-icon')).toBeInTheDocument();
      expect(screen.getByTestId('shopping-bag-icon')).toBeInTheDocument();
      expect(screen.getByTestId('coins-icon')).toBeInTheDocument();
    });

    it('highlights active route', () => {
      const { container } = renderWithRouter(<Header />);
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass('text-blue-600');
    });

    it('shows gradient underline for active route', () => {
      const { container } = renderWithRouter(<Header />);
      const activeIndicator = container.querySelector('.bg-gradient-to-r.from-blue-500.to-purple-500');
      expect(activeIndicator).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', () => {
      renderWithRouter(<Header />);
      expect(screen.getByPlaceholderText(/Search items, collections/i)).toBeInTheDocument();
    });

    it('shows search icon', () => {
      renderWithRouter(<Header />);
      const searchIcons = screen.getAllByTestId('search-icon');
      expect(searchIcons.length).toBeGreaterThan(0);
    });

    it('updates search query on input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, 'crypto');

      expect(searchInput).toHaveValue('crypto');
    });

    it('shows suggestions when typing', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.click(searchInput);
      await user.type(searchInput, 'Crypto');

      await waitFor(() => {
        expect(screen.getByText(/CryptoPunks/i)).toBeInTheDocument();
      });
    });

    it('submits search on enter', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, 'test query{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query');
    });

    it('clears search query after submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, 'test{Enter}');

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });

    it('filters suggestions based on query', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.click(searchInput);
      await user.type(searchInput, 'azuki');

      await waitFor(() => {
        expect(screen.getByText(/Azuki Collection/i)).toBeInTheDocument();
      });
    });

    it('shows suggestion with gradient avatar', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.click(searchInput);
      await user.type(searchInput, 'Crypto');

      await waitFor(() => {
        const { container } = render(<Header />, { wrapper: MemoryRouter });
        const gradientAvatars = container.querySelectorAll('.bg-gradient-to-br.from-blue-500');
        expect(gradientAvatars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Notifications', () => {
    it('renders notification bell', () => {
      renderWithRouter(<Header />);
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('shows unread notification count', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('toggles notifications dropdown on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const bellButton = screen.getByLabelText('Notifications');
      await user.click(bellButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('displays notification list', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByLabelText('Notifications'));

      expect(screen.getByText(/New bid on your NFT/i)).toBeInTheDocument();
      expect(screen.getByText(/crypto_whale started following you/i)).toBeInTheDocument();
    });

    it('shows time for notifications', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByLabelText('Notifications'));

      expect(screen.getByText('2m ago')).toBeInTheDocument();
      expect(screen.getByText('1h ago')).toBeInTheDocument();
    });

    it('highlights unread notifications', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<Header />);

      await user.click(screen.getByLabelText('Notifications'));

      const unreadNotifications = container.querySelectorAll('.bg-blue-50');
      expect(unreadNotifications.length).toBeGreaterThan(0);
    });

    it('shows View all notifications button', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByLabelText('Notifications'));

      expect(screen.getByText('View all notifications')).toBeInTheDocument();
    });
  });

  describe('User Menu', () => {
    it('renders user avatar', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of testuser
    });

    it('shows chevron down icon', () => {
      renderWithRouter(<Header />);
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('toggles user menu on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const avatarButton = screen.getByText('T').closest('button');
      await user.click(avatarButton);

      expect(screen.getByText(mockUser.username)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it('shows menu items', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByText('T').closest('button'));

      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getByText('My Wallet')).toBeInTheDocument();
    });

    it('shows Sign Out button', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByText('T').closest('button'));

      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });

    it('calls logout and navigates on Sign Out', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByText('T').closest('button'));
      await user.click(screen.getByText('Sign Out'));

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/landing');
    });
  });

  describe('Create Button', () => {
    it('shows create button', () => {
      renderWithRouter(<Header />);
      expect(screen.getAllByText('Create')[0]).toBeInTheDocument();
    });

    it('shows plus icon', () => {
      renderWithRouter(<Header />);
      const plusIcons = screen.getAllByTestId('plus-icon');
      expect(plusIcons.length).toBeGreaterThan(0);
    });

    it('navigates to submit page on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const createButton = screen.getAllByText('Create')[0];
      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/submit');
    });

    it('has gradient background', () => {
      const { container } = renderWithRouter(<Header />);
      const createButton = screen.getAllByText('Create')[0].closest('button');
      expect(createButton).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-purple-600');
    });
  });

  describe('Theme Toggle', () => {
    it('renders theme toggle in desktop', () => {
      renderWithRouter(<Header />);
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('passes correct variant to theme toggle', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Theme: icon')).toBeInTheDocument();
    });
  });

  describe('Wallet Connect', () => {
    it('renders wallet connect button', () => {
      renderWithRouter(<Header />);
      expect(screen.getByTestId('wallet-connect-button')).toBeInTheDocument();
    });
  });

  describe('Mobile Menu', () => {
    it('shows mobile menu button', () => {
      renderWithRouter(<Header />);
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    it('toggles mobile menu on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const menuButton = screen.getByTestId('menu-icon').closest('button');
      await user.click(menuButton);

      // Mobile menu should show additional navigation items
      const allActivityLinks = screen.getAllByText('Activity');
      expect(allActivityLinks.length).toBeGreaterThan(1);
    });

    it('shows X icon when menu is open', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const menuButton = screen.getByTestId('menu-icon').closest('button');
      await user.click(menuButton);

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('shows all navigation items in mobile menu', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByTestId('menu-icon').closest('button'));

      expect(screen.getAllByText('Activity').length).toBeGreaterThan(1);
      expect(screen.getAllByText('Users').length).toBeGreaterThan(0);
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Bots')).toBeInTheDocument();
    });

    it('shows mobile search in menu', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByTestId('menu-icon').closest('button'));

      const mobileSearchInputs = screen.getAllByPlaceholderText(/Search/i);
      expect(mobileSearchInputs.length).toBeGreaterThan(1);
    });

    it('shows create button in mobile menu', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByTestId('menu-icon').closest('button'));

      const createButtons = screen.getAllByText('Create');
      expect(createButtons.length).toBeGreaterThan(1);
    });

    it('closes mobile menu when navigation item clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByTestId('menu-icon').closest('button'));

      const communityLink = screen.getAllByText('Communities')[0];
      await user.click(communityLink);

      // Menu should close, back to only one activity link
      await waitFor(() => {
        const activityLinks = screen.getAllByText('Activity');
        expect(activityLinks.length).toBe(1);
      });
    });
  });

  describe('Mobile Bottom Navigation', () => {
    it('shows bottom navigation for mobile', () => {
      const { container } = renderWithRouter(<Header />);
      const bottomNav = container.querySelector('nav.fixed.bottom-0');
      expect(bottomNav).toBeInTheDocument();
    });

    it('shows primary nav items in bottom nav', () => {
      renderWithRouter(<Header />);
      const bottomNavItems = screen.getAllByText('Home');
      expect(bottomNavItems.length).toBeGreaterThan(1); // Desktop + mobile
    });

    it('shows mobile create button in bottom nav', () => {
      const { container } = renderWithRouter(<Header />);
      const bottomNav = container.querySelector('nav.fixed.bottom-0');
      const createButton = bottomNav.querySelector('.bg-gradient-to-br.from-blue-600');
      expect(createButton).toBeInTheDocument();
    });

    it('highlights active item in bottom nav', () => {
      const { container } = renderWithRouter(<Header />);
      const bottomNav = container.querySelector('nav.fixed.bottom-0');
      const activeItems = bottomNav.querySelectorAll('.text-blue-600');
      expect(activeItems.length).toBeGreaterThan(0);
    });
  });

  describe('Click Outside Behavior', () => {
    it('closes search suggestions on click outside', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <div>
          <div data-testid="outside">Outside</div>
          <Header />
        </div>
      );

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.click(searchInput);
      await user.type(searchInput, 'Crypto');

      await waitFor(() => {
        expect(screen.getByText(/CryptoPunks/i)).toBeInTheDocument();
      });

      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        expect(screen.queryByText(/CryptoPunks/i)).not.toBeInTheDocument();
      });
    });

    it('closes user menu on click outside', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <div>
          <div data-testid="outside">Outside</div>
          <Header />
        </div>
      );

      await user.click(screen.getByText('T').closest('button'));
      expect(screen.getByText('My Profile')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
      });
    });

    it('closes notifications on click outside', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <div>
          <div data-testid="outside">Outside</div>
          <Header />
        </div>
      );

      await user.click(screen.getByLabelText('Notifications'));
      expect(screen.getByText(/New bid on your NFT/i)).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText(/New bid on your NFT/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });
    });

    it('shows Sign In button when not authenticated', () => {
      renderWithRouter(<Header />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('does not show notifications when not authenticated', () => {
      renderWithRouter(<Header />);
      expect(screen.queryByLabelText('Notifications')).not.toBeInTheDocument();
    });

    it('does not show user menu when not authenticated', () => {
      renderWithRouter(<Header />);
      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    });

    it('does not show mobile bottom navigation', () => {
      const { container } = renderWithRouter(<Header />);
      const bottomNav = container.querySelector('nav.fixed.bottom-0');
      expect(bottomNav).not.toBeInTheDocument();
    });

    it('navigates to landing on Sign In click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      await user.click(screen.getByText('Sign In'));

      expect(mockNavigate).toHaveBeenCalledWith('/landing');
    });
  });

  describe('Spacer', () => {
    it('renders spacer for fixed header', () => {
      const { container } = renderWithRouter(<Header />);
      const spacer = container.querySelector('.h-20');
      expect(spacer).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('has slide-down animation class', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<Header />);

      await user.click(screen.getByTestId('menu-icon').closest('button'));

      const mobileMenu = container.querySelector('.animate-slide-down');
      expect(mobileMenu).toBeInTheDocument();
    });

    it('has fade-in animation for dropdowns', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<Header />);

      await user.click(screen.getByLabelText('Notifications'));

      const dropdown = container.querySelector('.animate-fade-in');
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user data', () => {
      useAuth.mockReturnValue({
        user: {},
        logout: mockLogout
      });

      renderWithRouter(<Header />);

      expect(screen.getByText('U')).toBeInTheDocument(); // Default avatar
    });

    it('handles empty search submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, '{Enter}');

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles whitespace-only search', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const searchInput = screen.getByPlaceholderText(/Search items, collections/i);
      await user.type(searchInput, '   {Enter}');

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for authenticated user', () => {
      const { container } = renderWithRouter(<Header />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for unauthenticated user', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout
      });

      const { container } = renderWithRouter(<Header />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with mobile menu open', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<Header />);

      await user.click(screen.getByTestId('menu-icon').closest('button'));

      expect(container).toMatchSnapshot();
    });
  });
});

export default WalletConnectButton
